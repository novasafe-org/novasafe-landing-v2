# Linux File Descriptor Security

A Linux process uses file descriptors (FDs) to refer to open resources: regular files, directories, sockets, pipes, terminals, and other kernel objects. Because an open descriptor can grant a process continued access to a resource, even after its pathname or permissions change, descriptor handling is an important part of Linux security.

This guide presents a practical workflow for evaluating Linux file descriptor security in an authorized environment. You’ll learn how to inspect a process, identify risky or unexpected descriptors, validate protections, and remediate findings while minimizing service disruption.

## What a file descriptor means for security

A file descriptor is a small, non-negative integer that indexes an open file description in a process. Descriptors 0, 1, and 2 conventionally represent standard input, standard output, and standard error. Other descriptors are created when a process opens a file or resource, accepts a connection, creates a pipe, or receives a descriptor from another process.

The descriptor refers to an already-open resource. As a result, changing a file’s pathname or permissions does not necessarily revoke access through a descriptor that is already open. The process may continue to use the resource according to the access allowed when it was opened and the operations supported by that resource.

An FD is therefore a security-relevant reference, though its exact capabilities depend on the underlying object, the way it was opened, and the operation being attempted. A descriptor can also be inherited across process creation or deliberately transferred between processes. These behaviors are useful, but they can expose resources if they are not controlled.

Common risks include:

- **Unintended inheritance:** A child process receives a descriptor that it does not need, such as an open sensitive file or listening socket.
- **Descriptor leaks:** A program fails to close descriptors, potentially exhausting its limit or retaining access longer than intended.
- **Excessive exposure:** A service opens sensitive files or network sockets it does not need for its role.
- **Privilege-transition mistakes:** A process drops privileges but keeps descriptors that still provide access to resources opened earlier.
- **Unsafe descriptor transfer:** A process passes a descriptor to another process without validating whether that recipient should have access.
- **Information leakage during inspection:** Diagnostic output reveals paths, socket details, or other operational information to users who should not see it.

## A practical assessment workflow

Use this workflow on systems and processes you are authorized to inspect. Begin with a defined scope: identify the service, its expected files and sockets, the account it runs under, and the time window for inspection. Avoid closing descriptors or changing limits until you understand the application’s behavior and have an approved change plan.

### 1. Identify the target process and its context

Find the process ID and confirm that it belongs to the service you intend to assess. For example, if you know the service name:

```bash
systemctl status example.service
systemctl show example.service --property=MainPID --property=User --property=LimitNOFILE
```

Set the PID from the verified service information rather than relying on an ambiguous process-name match:

```bash
PID=1234
ps -o pid,ppid,user,group,comm -p "$PID"
```

Check the process’s effective limits:

```bash
prlimit --pid "$PID" --nofile
```

The `nofile` resource limit controls how many file descriptors the process may have open. It has a soft limit, which the process must stay within during normal operation, and a hard limit, which constrains how high the soft limit can be raised without additional privilege. A higher limit is not inherently a security defect: busy services may need many descriptors. Assess it against the service’s expected workload and operational policy.

### 2. Inventory open descriptors

On Linux, `/proc/<pid>/fd/` contains entries for a process’s open descriptors. Each entry is a symbolic link to the referenced object. List them without opening the referenced files:

```bash
sudo ls -l "/proc/$PID/fd"
```

For a more structured inventory, `lsof` can show descriptor types and associated paths or endpoints:

```bash
sudo lsof -nP -p "$PID"
```

Options `-nP` prevent name and service-port lookups, which can make output more predictable. Depending on system configuration, privileges, and process state, some entries may be unavailable or access may be denied.

Use the output to classify descriptors rather than treating every open descriptor as suspicious. Typical entries include:

- Regular files used for configuration, logs, databases, or application data.
- Directories opened for traversal or directory-relative operations.
- Listening or connected network sockets.
- Pipes and sockets used for communication with child processes or other services.
- Anonymous objects such as event descriptors, in-memory files, or kernel interfaces.
- Standard streams connected to a terminal, file, pipe, or logging system.

A descriptor’s target name alone does not establish whether access is safe. Confirm that each resource is expected for the service, that the service account and deployment design justify it, and that the resource is not unnecessarily exposed to other processes or users.

### 3. Examine descriptor flags and metadata

The corresponding `/proc/<pid>/fdinfo/<fd>` file provides metadata for an individual descriptor. For example:

```bash
sudo cat "/proc/$PID/fdinfo/7"
```

Depending on the descriptor type and kernel, this can include fields such as position, mount ID, inode, and flags. The `flags` value is reported in octal. Interpret it in context; flags vary by resource and do not by themselves prove that a descriptor is safe or unsafe.

In particular, check whether descriptors that should not cross an `exec` boundary have close-on-exec behavior. The `O_CLOEXEC` flag requests that a descriptor be closed when a process successfully executes a new program. It does not close the descriptor during a plain `fork`, and it does not prevent deliberate descriptor transfer. On Linux, descriptor flags can also be inspected or changed by appropriate system calls, but avoid changing a live service’s descriptors as an ad hoc assessment step.

### 4. Compare observations with the service’s intended access

Create a simple expected-access list for the service. It might include required configuration and log files, a data directory, a listening socket, and specific connections to other services. Compare that list with the live inventory and investigate discrepancies.

Questions to ask include:

- Does the process have a descriptor for a sensitive file unrelated to its function?
- Are writable descriptors limited to the files or sockets the service needs to modify?
- Does the process retain a descriptor after a privilege drop or configuration reload when it should not?
- Do child processes receive only the descriptors they require?
- Are listening sockets and connected sockets expected for this process and deployment?
- Does the number of open descriptors fit the workload, or does it grow over time?

A single snapshot cannot reliably identify a leak. If descriptor count appears to grow, collect repeated observations under representative load and compare both counts and descriptor types. Some applications intentionally keep pools of connections or caches open. Investigate trends and application behavior before concluding that growth is a leak.

### 5. Check inheritance and descriptor passing

Descriptors can be inherited when a process creates a child. During `exec`, descriptors without close-on-exec set remain open in the new program. Programs may also intentionally preserve selected descriptors, for example to pass a listening socket to a worker. Unix-domain sockets can transfer descriptors between processes using mechanisms such as `SCM_RIGHTS`.

Review the application’s process-launch code and service manager configuration for subprocesses, helper programs, and socket activation. In application code, prefer APIs that create descriptors with close-on-exec enabled from the start, such as `open` with `O_CLOEXEC` or `socket` with `SOCK_CLOEXEC`, where supported. Setting close-on-exec atomically at creation avoids a race in multithreaded programs that could occur if a descriptor is opened first and marked later.

For subprocess creation, explicitly define which descriptors should be inherited. In Python, for example, `subprocess` closes file descriptors by default on supported platforms unless they are explicitly passed, but application behavior and runtime version should still be checked. Avoid broad inheritance when a short allowlist can express the intended access.

### 6. Validate descriptor limits and system pressure

Inspect the process limit and, if relevant, the system-wide file-handle counters:

```bash
prlimit --pid "$PID" --nofile
cat /proc/sys/fs/file-nr
cat /proc/sys/fs/file-max
```

`file-nr` and `file-max` describe system-wide file-handle usage and capacity; they are not a per-process descriptor count. Linux also has a system limit on how high certain per-process limits can be raised. Do not change global or per-service limits solely because a number looks large or small. First establish the service’s real demand, current errors, and operational requirements.

A descriptor count can be sampled with:

```bash
find "/proc/$PID/fd" -mindepth 1 -maxdepth 1 -type l 2>/dev/null | wc -l
```

This is an approximate snapshot. Descriptors may open or close while the command runs, and permissions or process termination can affect the result. Use application metrics or repeated observations when you need to establish a trend.

## Example: a cautious inventory script

The following Python example lists descriptor numbers and their symbolic-link targets for the current process or a PID supplied on the command line. It does not open the target resources. Because descriptors can change while the script runs, disappearing entries are handled as normal races.

```python
#!/usr/bin/env python3
import os
import sys

pid = sys.argv[1] if len(sys.argv) > 1 else "self"
fd_dir = f"/proc/{pid}/fd"

try:
    entries = sorted(os.listdir(fd_dir), key=lambda value: int(value))
except (OSError, ValueError) as exc:
    raise SystemExit(f"Cannot list {fd_dir}: {exc}")

for fd in entries:
    path = os.path.join(fd_dir, fd)
    try:
        target = os.readlink(path)
    except OSError as exc:
        target = f"<unavailable: {exc.strerror}>"
    print(f"fd={fd}\ttarget={target}")
```

Run it only with appropriate authorization. Access to another process’s `/proc` entries is subject to system permissions and configuration. The output may contain sensitive paths or endpoint information, so store and share it according to your organization’s logging and data-handling rules.

## Remediation guidance

Remediate based on the cause, preferably in application code or the service configuration rather than by manipulating a live process’s descriptors.

### Prevent unintended inheritance

- Use close-on-exec creation flags for descriptors that should not survive an `exec`.
- Audit subprocess launch paths and explicitly pass only required descriptors.
- Close unused descriptors in child processes and ensure error paths close descriptors they created.
- Document intentional inheritance, such as a supervisor passing a listening socket to a service.

### Reduce unnecessary access

- Remove unneeded file opens, sockets, and privileged resources from the service’s startup path.
- Apply least privilege to the service account and to the underlying files and directories.
- Avoid retaining sensitive descriptors longer than necessary, especially across privilege transitions or long-running child processes.
- Review descriptor-passing code and ensure the receiving process is authorized to use the transferred resource.

### Fix leaks and set appropriate limits

- Trace the code path that opens a descriptor and confirm that all success, failure, timeout, and cancellation paths close it.
- Use language-level resource-management patterns such as `with` in Python or RAII in C++ where appropriate.
- Set per-service limits based on measured demand and expected headroom. For a systemd service, inspect and configure the unit’s `LimitNOFILE` setting through the normal change process.
- Monitor application errors and descriptor usage after changing limits. Raising a limit may reduce immediate failures but does not fix a leak.

### Treat live descriptor closure as a high-risk action

Closing a descriptor in a running process can disrupt its behavior, and reusing a descriptor number can create confusing race conditions. Avoid attempts to close another process’s descriptors through ad hoc shell techniques. Prefer a controlled application reload or restart after confirming the expected impact and following the service’s change-management procedure.

## Common troubleshooting notes

- **Permission denied under `/proc`:** Run the inspection with approved privileges and check the host’s procfs mount options and process access controls. Do not weaken those controls just to simplify an audit.
- **A descriptor disappears between commands:** This is normal for active processes. Repeat the observation or use application-level instrumentation; do not assume a failed read indicates tampering.
- **`lsof` output differs from `/proc`:** The tools may observe the process at different moments, and their permissions or filtering may differ. Compare the collection time and method before drawing conclusions.
- **The descriptor count is high:** Compare it with expected connection pools, worker counts, and workload. Check for growth over time and for application errors such as failures to open files or accept connections.
- **A pathname looks harmless:** A descriptor refers to an open object, and the displayed target may not fully explain its origin, permissions, or intended use. Correlate it with application configuration and process behavior.
- **A service needs a high limit:** Validate capacity needs and system-level constraints. Avoid lowering a limit below the service’s operational requirement, which can cause outages.

## FAQ

### Does changing a file’s permissions revoke access through an open descriptor?

Not necessarily. An already-open descriptor can continue to refer to the opened object. The effect of a permission change depends on the operation and resource, so do not rely on pathname permission changes alone to revoke access that a process already holds.

### Does close-on-exec stop a descriptor from being inherited by a forked child?

No. Close-on-exec takes effect when a process successfully executes a new program. A child created by `fork` can still inherit the descriptor unless the program closes it or uses other appropriate controls.

### Is a large `nofile` limit automatically a security problem?

No. The limit should match the service’s needs and policy. A very high limit can increase the number of resources a process might hold, but lowering it without workload analysis can cause failures. Investigate actual access, descriptor growth, and service requirements.

### Can I inspect another user’s descriptors without elevated privileges?

Sometimes, depending on system configuration and permissions, but access may be restricted. Use approved administrative access where required. Procfs restrictions help protect process information and should not be bypassed for convenience.

## Conclusion

Linux file descriptor security is about controlling which resources a process can access, how long it retains that access, and which child processes or peers can receive it. A reliable assessment combines a careful `/proc` or `lsof` inventory with process limits, application behavior, and an expected-access baseline. Validate findings over time, fix inheritance and leak issues at their source, and make limit or service changes through a controlled operational process.
