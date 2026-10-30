# Linux AppArmor Profiles Explained

A web server, desktop application, or background service can be compromised even when the operating system is patched. Linux AppArmor helps limit what a process can do after it starts: a profile can restrict access to files, capabilities, and other resources, reducing the damage a vulnerable or misused application can cause.

This guide explains how **Linux AppArmor profiles** work, what their modes mean, how to inspect and manage them, and how to build policies without granting more access than an application needs. The examples use common Ubuntu-style tools and paths; package names, service management, and policy details can vary by distribution.

## What is AppArmor?

AppArmor is a Linux Security Module (LSM) that applies mandatory access control (MAC) policies to processes. Traditional discretionary access control (DAC)—such as file ownership and permission bits—primarily lets users and groups control access to their files. AppArmor adds another layer: a process can be denied access even when its Unix user or group would otherwise be allowed to use a resource.

AppArmor policies are commonly associated with executable paths. When a program starts, the kernel can attach a matching profile to the process. That profile defines which actions are allowed. In a loaded, enforcing profile, access covered by AppArmor policy is denied unless the policy permits it.

AppArmor complements, rather than replaces, other Linux security controls. It does not patch vulnerable software, validate application input, or replace sound user permissions, timely updates, secure configuration, or monitoring. It is also distinct from tools such as seccomp, which can restrict system calls, and from SELinux, which uses a different MAC policy model.

## How AppArmor profiles work

A profile describes the access rules for an application or process. On many systems, profiles are stored under `/etc/apparmor.d/`, and the AppArmor parser loads them into the kernel. Distribution packages may provide profiles for commonly used services; administrators can also write and maintain local policies.

A profile can control several types of access, depending on kernel support and policy syntax, including:

- **Files and directories:** reading, writing, creating, or executing paths.
- **Capabilities:** selected privileged operations, such as changing ownership or binding to certain ports.
- **Execution transitions:** whether a process can launch another program and whether that program inherits the current profile or transitions to a different one.
- **Network access:** selected network operations where AppArmor network mediation is available and enabled.
- **Other mediated resources:** for example, some IPC or mount-related operations, depending on the system and policy.

AppArmor profiles are generally path-based. Paths make rules relatively readable, but they also mean that correct policy design depends on understanding where an application actually reads and writes data. A policy should be tested against the application’s real operating conditions, including its service account, working directory, startup sequence, and update behavior.

### Deny by default, within the profile’s scope

AppArmor policies are designed around allowing specific access rather than granting a process unrestricted access to everything. If a loaded enforcing profile mediates an operation and no rule allows it, the operation is denied. This does not mean that every possible kernel action is automatically covered: mediation depends on the features supported and enabled by the running kernel and policy. A profile is one layer of defense, not a complete sandbox by itself.

### Profile modes

The most common modes are:

- **Enforce:** Apply the profile’s restrictions. Denied operations are blocked and may be logged.
- **Complain:** Record policy violations but generally allow the operation, making this useful for learning an application’s access needs. It is not an enforcement mode.
- **Unconfined:** The process does not have the restrictions of an enforcing AppArmor profile. Other system controls still apply.

Some tools also support disabling or unloading a profile. Do not confuse complain mode with enforce mode: a complain-mode profile can help gather information, but it does not provide the same containment.

## Inspecting AppArmor on a Linux system

Start by checking whether AppArmor is active and which profiles are loaded. On systems with the AppArmor utilities installed, run:

```bash
sudo aa-status
```

The output typically reports whether the AppArmor module is enabled and summarizes loaded profiles and their modes. You can also check for relevant kernel messages:

```bash
sudo journalctl -k | grep -i apparmor
```

If the command or expected files are missing, consult your distribution’s documentation. AppArmor may not be installed, enabled, or selected as an active LSM on every Linux system.

## A small profile example

The following example illustrates the structure of a profile for a hypothetical service. It is not a drop-in policy: replace the program and data paths, verify the needed access, and test it in your environment before enforcing it.

```text
#include <tunables/global>

profile novademo /usr/bin/novademo {
  #include <abstractions/base>

  /etc/novademo/config r,
  /var/lib/novademo/ r,
  /var/lib/novademo/** rw,
  /var/log/novademo/ r,
  /var/log/novademo/** rw,
}
```

The profile is named `novademo` and is associated with `/usr/bin/novademo`. The included `abstractions/base` file supplies a set of commonly needed rules; abstractions are convenient starting points, not proof that the resulting policy is minimal. The remaining rules grant read access to the configuration file and read/write access beneath the service’s data and log directories. In AppArmor file rules, permission letters represent specific operations, and combinations should be chosen according to what the program needs.

This example deliberately omits many possible needs, such as shared libraries, temporary files, sockets, or child processes. If those are required, add and test narrowly scoped rules rather than broadly allowing access to entire system directories. Keep local policy changes under version control and document why each non-obvious permission exists.

## Putting a profile into service

The following workflow is a practical starting point for an existing or newly created profile. Exact profile filenames and service commands depend on your distribution and package.

1. **Confirm AppArmor is available.** Check `aa-status` and your distribution’s service and kernel documentation. Install the relevant AppArmor utilities if needed.
2. **Find or create the profile.** Look in `/etc/apparmor.d/` for a package-provided profile. If writing one, use the syntax supported by your installed parser and kernel.
3. **Load or reload the policy.** For example, many systems support:

   ```bash
   sudo apparmor_parser -r /etc/apparmor.d/usr.bin.novademo
   ```

   The filename is an example; use the actual profile path. Some distributions provide service-level commands for reloading all profiles.

4. **Observe the application in a safe environment.** If supported, complain mode can help reveal attempted access that the policy does not yet allow:

   ```bash
   sudo aa-complain /etc/apparmor.d/usr.bin.novademo
   ```

5. **Exercise normal and less-common workflows.** Start, stop, update, and use the application as it would be used in production. Check logs for AppArmor messages and investigate denials in context.
6. **Refine the policy.** Add only verified, necessary permissions. Tools such as `aa-logprof` can help review logged events and suggest policy updates, but review each suggestion rather than accepting it automatically.
7. **Enforce and verify.** After testing, put the profile into enforce mode and confirm its status:

   ```bash
   sudo aa-enforce /etc/apparmor.d/usr.bin.novademo
   sudo aa-status
   ```

Do not switch a production service to enforcement without a rollback plan. A missing permission can prevent legitimate operations, including startup or recovery tasks. Test policy changes on a staging system where possible, and keep a known-good policy available.

## Understanding denials and troubleshooting

A denial is not automatically evidence of an attack. It may indicate a policy that is too restrictive, an unexpected application behavior, or a genuine attempt to access a resource the process should not use. Check the executable, requested path or operation, profile name, and application context before changing policy.

Search the kernel journal for AppArmor messages:

```bash
sudo journalctl -k --since "30 minutes ago" | grep -i apparmor
```

On some distributions, relevant records may also be available through system logging or the audit service. The exact location and format vary. When reviewing logs, remember that paths and process details can be sensitive operational information.

If a service fails after enforcement:

- Confirm the intended profile is loaded and in the expected mode with `aa-status`.
- Check whether the service uses a different executable path, configuration file, data directory, or temporary location than expected.
- Look for denials during the exact operation that failed, rather than adding permissions based on guesses.
- Check for profile syntax errors or parser failures after editing a policy.
- Test whether a package update changed executable paths or runtime behavior.
- Avoid broad rules such as allowing all of `/etc/` or `/var/` just to make the error disappear.

If you temporarily move a profile to complain mode to diagnose a failure, treat that as reduced protection. Restore enforce mode after resolving the issue and verify the change.

## Security best practices for AppArmor profiles

### Start with the smallest practical access set

Limit file rules to the specific paths and operations an application needs. Prefer read-only access for configuration and data that the service does not modify. Be cautious with recursive wildcards because they can cover more files than intended.

### Treat complain mode as a testing aid

Complain mode can reveal useful behavior, but it may also record actions from optional features, unusual workflows, or compromised software. Logs show attempted behavior, not whether that behavior is safe. Do not turn every logged event into an allow rule without understanding why it occurred.

### Review abstractions and execution transitions

Abstractions can reduce duplication, but they may grant access beyond the needs of a particular service. Inspect included policy when the security impact matters. Also review rules that let an application execute other programs. For example, an inherited transition such as `ix` keeps execution under the current profile, while profile-transition rules can move a child process into another profile. Choose execution behavior deliberately; unrestricted execution can weaken confinement.

### Keep policies aligned with application changes

Software updates can add features, change file locations, or alter startup behavior. Review AppArmor denials and profile changes as part of routine maintenance. A profile that was correct for an older version may be incomplete or overly broad for a newer one.

### Use layered defenses

Combine AppArmor with least-privilege service accounts, restrictive file ownership and permissions, timely patching, secure service configuration, and monitoring. Where appropriate, use other controls such as systemd sandboxing or seccomp as complementary layers, while checking how they interact with the application and the AppArmor policy.

## FAQ

### Does AppArmor replace Linux file permissions?

No. AppArmor adds a policy layer; it does not replace Unix ownership, groups, or mode bits. Access must satisfy the applicable controls, so a profile cannot make a file accessible to a process that Unix permissions already deny.

### Is complain mode safe for production?

Complain mode generally records profile violations instead of blocking them, so it does not provide the same enforcement as an enforcing profile. It can be useful temporarily for testing or troubleshooting, but avoid treating it as equivalent protection.

### Does AppArmor automatically protect every application?

No. Protection depends on AppArmor being active and on a suitable profile being loaded and attached to the process. Check the system’s status and the profile mode rather than assuming an installed package is enforcing a policy.

### Should I accept every suggestion from `aa-logprof`?

No. The tool can help interpret logged events, but a suggestion may grant access the application does not truly need. Verify each event against expected application behavior and choose the narrowest rule that supports the required function.

## Conclusion

AppArmor profiles let Linux administrators restrict the resources an application can access, helping contain the consequences of vulnerabilities and configuration mistakes. Effective use depends on knowing what the application needs, testing rules under realistic conditions, and keeping policies narrow as software changes. Start by inspecting the profiles already on your system, use complain mode carefully when learning behavior, investigate denials rather than blindly allowing them, and verify that important services remain in enforce mode.
