# Linux seccomp Filters Explained

A Linux process can interact with the kernel through system calls, or syscalls. A service that only needs to read files and write logs may not need the same syscall access as a general-purpose shell. Linux seccomp filters let teams restrict which syscalls a process can make—and what happens when it makes a disallowed call.

Seccomp is useful, but it is not a complete sandbox. A filter that is too broad may leave unnecessary kernel interfaces available; one that is too restrictive can break normal startup or runtime behavior. The practical goal is to understand what a workload needs, apply a proportionate policy, and test it under realistic conditions.

This guide explains how linux seccomp filters work, how to assess common implementations, and how to identify and troubleshoot failure modes.

## What seccomp does

Seccomp (secure computing mode) is a Linux kernel facility for limiting a process's system calls. A seccomp filter evaluates a syscall when the process attempts to make it. Depending on the filter's result, the kernel can allow the call, return an error, log the event, send a signal, or take another supported action.

Filters are attached to a process and inherited by its descendants. They can be stacked: a new filter can add restrictions, but it cannot undo restrictions imposed by an earlier filter. This makes seccomp useful as one layer in a broader Linux security strategy, including for container workloads.

Seccomp does **not** generally inspect the contents of memory addressed by syscall arguments. For example, a filter can examine a pointer value passed to `openat`, but it cannot safely read the pathname at that address and decide based on the filename. Filters can inspect syscall numbers, architecture information, and syscall argument values.

## How Linux seccomp filters work

A seccomp filter is a program evaluated by the kernel's classic Berkeley Packet Filter (cBPF) machinery. It receives information about a syscall and returns an action. Most teams do not need to write cBPF directly: tools such as libseccomp provide higher-level APIs, and container runtimes commonly accept seccomp profiles that they translate into filters.

Common actions include:

- **Allow** the syscall.
- **Return an error**, often `EPERM` or `EACCES`, without performing the syscall.
- **Log** the attempted syscall, subject to kernel and system logging configuration.
- **Send a signal**, such as `SIGSYS`, to the calling thread or process.
- **Kill** the thread or process.
- **Delegate handling** through mechanisms such as seccomp user notification, when configured and supported.

When multiple filters apply, the kernel uses the action with the higher precedence. A more restrictive result from one filter is not overridden by a later filter that allows the syscall. Exact action availability depends on the kernel; check the kernel documentation and the environment where the workload will run.

### Installing a filter safely

A process can enter strict seccomp mode, which permits only a very small set of syscalls, or install a filter mode with a policy tailored to its needs. In practice, custom filters are the more flexible option for applications and container workloads.

Installing a filter generally requires either the relevant privilege or the `no_new_privs` process attribute. Setting `no_new_privs` prevents a process and its descendants from gaining privileges through later `execve` operations. It is commonly used before installing an unprivileged filter:

```c
prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0);
```

A process can also use the `seccomp()` system call or the `prctl()` seccomp interface to install a filter. Libraries and runtimes often manage these details. Filters normally apply to the calling thread; applications with multiple threads need to account for thread synchronization. The `SECCOMP_FILTER_FLAG_TSYNC` option can request synchronization across a thread group, but installation can fail if the threads cannot be synchronized as required.

## Why teams use seccomp

The main benefit is reducing the kernel interface exposed to a workload. If an attacker gains control of a process, a carefully designed filter may prevent use of syscalls that the application does not need. This can reduce opportunities to reach certain kernel functionality, but it does not eliminate vulnerabilities or guarantee containment.

Seccomp works best alongside other controls, such as:

- Linux capabilities that limit privileged operations.
- Namespaces and cgroups that isolate and manage processes.
- Filesystem permissions and read-only mounts.
- Mandatory access control systems, where available and appropriately configured.
- Least-privilege service accounts and application-level authorization.

A seccomp policy does not, by itself, restrict file access, network destinations, or all effects of allowed syscalls. For example, allowing `write` does not decide which file descriptors the process may write to. Other controls must address those boundaries.

## Assessing a seccomp policy

A useful assessment starts with the workload, not with a generic list of “dangerous” syscalls. Record the executable, runtime, libraries, helper processes, startup paths, and optional features. A service may need different syscalls during initialization than it needs during steady-state operation.

### 1. Establish the current baseline

Identify whether the process already runs under a seccomp policy. In a Linux environment, inspect the process status:

```sh
grep -E '^(Name|Seccomp|Seccomp_filters):' /proc/<PID>/status
```

`Seccomp` indicates the process's seccomp mode, and `Seccomp_filters` reports the number of filters where that field is available. These values do not reveal the full policy. Container runtimes may also expose their configured profile through deployment settings, so inspect the runtime and orchestration configuration as well.

For containers, review how the workload is launched. For example, Docker accepts a custom profile with `--security-opt`:

```sh
docker run --rm \
  --security-opt seccomp=./service-seccomp.json \
  your-image:tag
```

Avoid using `seccomp=unconfined` as a routine troubleshooting fix. If it is used temporarily to isolate a problem, treat it as a diagnostic change, document it, and restore a tested policy before deployment.

### 2. Observe syscall needs

Use representative tests to understand which syscalls the application makes. `strace` can help during development or staging:

```sh
strace -f -c ./service --self-test
```

To inspect syscall names and arguments in more detail:

```sh
strace -f -e trace=%process,%network,%file ./service --self-test
```

Tracing is evidence, not a complete policy generator. A test may miss error handling, rare code paths, plugins, upgrades, or production-only behavior. Tracing can also change timing and produce sensitive output, so use it in an appropriate environment and protect the results.

### 3. Define the policy objective

Decide which syscalls must be denied and what the process should observe when it tries them. Returning `EPERM` can make a denied operation fail in a way the application can handle. Logging can help during rollout, but logging behavior depends on system configuration and should not be treated as a substitute for enforcement. Killing a process is appropriate for some high-confidence violations, but it can turn a policy mistake into an availability incident.

Prefer a policy that is narrow enough to matter and broad enough to support documented workload behavior. Do not copy a profile from a different application merely because it uses the same language or base image.

### 4. Test the exact deployment

Test startup, normal requests, shutdown, health checks, scheduled tasks, error paths, and optional features with the policy enabled. Test the same image, runtime, kernel family, and deployment configuration intended for production. Record denied syscalls and determine whether each is expected, unnecessary, or evidence of a policy gap.

Treat policy changes as code: review them, version them, test them in CI or staging, and roll them out with a rollback plan. Reassess after changes to the application, libraries, runtime, or base image.

## A small libseccomp example

The following C example illustrates a **deny rule**: it starts with a default-allow policy and returns `EPERM` for `socket` and `socketpair` calls. It is not a production profile. A default-allow policy still permits other syscalls, and blocking these calls may not meet an application's broader network-control requirements.

```c
#include <errno.h>
#include <seccomp.h>
#include <sys/prctl.h>

int install_example_filter(void) {
    scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_ALLOW);
    if (ctx == NULL) {
        return -1;
    }

    if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) {
        seccomp_release(ctx);
        return -1;
    }

    if (seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM),
                         SCMP_SYS(socket), 0) < 0 ||
        seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM),
                         SCMP_SYS(socketpair), 0) < 0) {
        seccomp_release(ctx);
        return -1;
    }

    int result = seccomp_load(ctx);
    seccomp_release(ctx);
    return result;
}
```

Build with libseccomp development files installed, for example:

```sh
cc -Wall -Wextra example.c -lseccomp -o example
```

The example checks whether rule creation and filter loading succeed. A real implementation should also report useful errors, test thread behavior, and account for the application's complete syscall needs. Because the default action here is allow, this is an illustration of policy mechanics—not a least-privilege allowlist.

## Common failure modes

### Blocking a syscall needed during startup

A filter may block a syscall used by the dynamic loader, a runtime, a library, or an initialization path. The process may exit immediately or fail only when an optional feature is used. Reproduce the failure with the filter enabled, inspect logs and tracing output, and determine whether the syscall is genuinely required before changing the policy.

### Confusing syscall numbers across architectures

Syscall numbers and interfaces can differ by architecture. Hand-written BPF that checks only a syscall number may apply the wrong rule on another architecture. Architecture-aware tools such as libseccomp help manage these differences, but teams still need to test every supported architecture and deployment target.

### Applying a filter to only one thread

If a multithreaded application installs a filter without synchronizing its threads, other existing threads may not have the same restrictions. Use an appropriate thread synchronization strategy, such as TSYNC where supported, and check whether installation succeeds. Installing before creating worker threads is another design option, though it may not fit every application.

### Treating a syscall name as a complete security boundary

A syscall-level rule cannot generally inspect pointed-to data such as a pathname. It may also fail to express distinctions that depend on application context. Use filesystem permissions, namespaces, capabilities, or other controls for boundaries that seccomp cannot enforce.

### Using audit or tracing output as the whole policy

Observed syscalls reflect only the paths exercised during observation. They may also include calls from runtime libraries or helpers that change between versions. Use observation to inform a reviewed policy, then test realistic and unusual paths rather than blindly allowing every observed call.

### Ignoring the runtime and kernel environment

A profile can behave differently across kernel versions, architectures, container runtimes, and application releases. Some actions or features are not available everywhere. Validate policy compatibility in the environments you support, and document any required kernel or runtime assumptions.

## Security best practices

- Start with a clear threat model and workload inventory.
- Prefer maintained, application-specific profiles over improvised syscall lists.
- Use an error action during initial testing when it allows the application to report failures cleanly; choose enforcement behavior deliberately.
- Apply filters as early as practical, while ensuring the filter is installed correctly for all relevant threads.
- Keep profiles under version control and review changes like other security-sensitive code.
- Test both expected behavior and denied operations in staging and CI.
- Monitor for policy-related failures during rollout and maintain a rollback path.
- Use seccomp as one layer of Linux security, not as a replacement for access controls, isolation, patching, or secure application design.

## FAQ

### Is seccomp the same as a container sandbox?

No. Seccomp restricts syscalls, while container isolation usually combines several mechanisms, such as namespaces, cgroups, capabilities, filesystem controls, and seccomp. The exact protections depend on the runtime and configuration.

### Does seccomp inspect file paths or syscall data buffers?

Generally, no. A filter can examine syscall argument values, including pointer values, but it cannot safely dereference arbitrary pointers to inspect the data they reference. Use other controls when policy depends on file paths or application data.

### Can I add a seccomp filter after a process starts?

A process can install a filter after startup if the necessary conditions are met, but doing so requires careful planning. Existing threads, privilege requirements, and the risk of breaking later code paths all matter. Installing a filter early is often easier to reason about, provided it covers the intended threads.

### How do I know which syscalls an application needs?

Combine source and runtime knowledge with observation tools such as `strace`, then test a candidate policy against startup, normal use, error paths, and optional features. No single trace run proves that a policy is complete.

## Conclusion

Linux seccomp filters provide a practical way to reduce the syscalls available to a process, but their effectiveness depends on accurate workload assessment and careful testing. Understand the filter's actions and limitations, account for architecture and thread behavior, and validate the policy in the deployment environment. Used alongside other Linux security controls, seccomp can reduce unnecessary kernel exposure without being mistaken for a complete sandbox.
