# SELinux Modes and Policy Troubleshooting

SELinux can block an application even when traditional Unix permissions appear correct. When that happens, switching SELinux off may seem like a quick fix—but it removes an important layer of Linux security and can hide the actual cause. A safer approach is to establish the current mode, find the relevant denial, verify labels and policy settings, and make the narrowest supported correction.

This guide provides a practical workflow for **SELinux modes and policy troubleshooting** in an authorized Linux environment. Commands are generally applicable to distributions such as RHEL, Fedora, Rocky Linux, and AlmaLinux, although package names and some tools vary. Run administrative commands with appropriate privileges and test changes before applying them to production systems.

## 1. Understand the SELinux modes

SELinux operates in one of three modes:

- **Enforcing:** The loaded policy is applied. Actions the policy denies are blocked and may be logged.
- **Permissive:** Policy violations are logged, but SELinux does not block the actions. This can help with diagnosis, but it is not an equivalent security posture to enforcing.
- **Disabled:** SELinux is not enforcing a policy. Depending on the distribution and how it was disabled, SELinux labels and policy behavior may not be available as expected.

Check the current state before troubleshooting:

```bash
getenforce
sestatus
```

`getenforce` gives a concise mode. `sestatus` provides additional information, such as whether SELinux is enabled, the active policy name, and the configured mode. A system can have a configured mode that differs from its current runtime mode; check both outputs rather than assuming they are interchangeable.

Many distributions use the **targeted** policy, which confines selected services and processes. A process running in an unconfined domain may not receive the same restrictions as a confined service. SELinux therefore complements, rather than replaces, file permissions, firewalls, and other security controls.

## 2. Confirm the problem is an SELinux denial

A failed service, web request, or file operation is not automatically an SELinux problem. First reproduce the issue, note the time and affected process or resource, and check the application and system logs. Also verify ordinary ownership, mode bits, service configuration, and network access.

Then look for Access Vector Cache (AVC) denials in the audit log:

```bash
sudo ausearch -m AVC -ts recent -i
```

If your system does not have `ausearch`, install or enable the distribution’s audit tools according to its documentation. You can also inspect the system journal:

```bash
sudo journalctl --since '30 minutes ago' | grep -i 'avc:.*denied'
```

The time range is an example; adjust it to match when the issue occurred. On systems with `setroubleshoot` installed, its messages or the `sealert` tool may provide useful explanations. Availability and log integration vary by distribution.

An AVC record typically identifies:

- The **source context** (`scontext`): the security context of the process that attempted the action.
- The **target context** (`tcontext`): the context of the file, port, or other object involved.
- The **class** (`tclass`): the object type, such as `file`, `dir`, or `tcp_socket`.
- The **permission**: the requested operation, such as `read`, `write`, or `name_connect`.
- The process name and, often, the path or other object details.

Read the full denial in context. A process name alone is not enough to decide what policy change is appropriate. SELinux can also suppress some denials through `dontaudit` rules, so an empty search does not prove that SELinux is unrelated. Check application logs and other evidence as well.

## 3. Check mode and policy before changing anything

Record the current mode and policy details so you can validate changes and restore the prior configuration if needed:

```bash
getenforce
sestatus
ps -eZ | head
```

`ps -eZ` shows process security contexts. A process in an unexpected domain can point to a service launch or labeling issue. If the system reports that SELinux is disabled, investigate why before proceeding: check the distribution’s configuration and boot settings, including the kernel command line where applicable. Re-enabling SELinux on an established system may require policy packages, a full filesystem relabel, and a maintenance window.

Avoid making a mode change your first troubleshooting step. If a temporary permissive test is approved, understand that it allows actions that enforcing mode would block. Keep the test brief, limit exposure, monitor logs, and restore enforcing mode promptly.

For a temporary runtime change on a system where SELinux is enabled:

```bash
sudo setenforce 0
# Reproduce the specific issue and collect relevant AVC records.
sudo setenforce 1
getenforce
```

`setenforce` does not make a persistent configuration change and cannot enable SELinux if it is disabled. Do not leave a production host in permissive mode as a substitute for fixing a policy or labeling problem.

To configure the boot-time mode on distributions that use `/etc/selinux/config`, inspect the file and follow the operating system’s guidance. The setting commonly appears as `SELINUX=enforcing`. A reboot may be required for the configured mode to take effect. Do not change the policy type casually; the installed policy and distribution defaults matter.

## 4. Validate file and directory labels

A common cause of AVC denials is a file with a label that does not match its intended use. Files copied from another location, extracted from an archive, or created by a deployment process can receive unexpected labels.

Inspect the actual label and the policy’s expected label:

```bash
ls -Z /srv/site
matchpathcon -V /srv/site/index.html
```

Use `restorecon` to restore the default label for a path based on the installed file-context rules. Preview changes first when practical:

```bash
sudo restorecon -nRv /srv/site
sudo restorecon -Rv /srv/site
```

The first command is a dry run; review its proposed changes before running the second. `restorecon` is often safer than manually assigning a type because it applies the policy’s established defaults.

If a file is intentionally stored outside its usual location, define a persistent file-context mapping rather than relying on a one-time `chcon` change. For example, a web server’s read-only content under `/srv/site` may need an appropriate web content type on a system whose policy uses `httpd_sys_content_t`:

```bash
sudo semanage fcontext -a -t httpd_sys_content_t '/srv/site(/.*)?'
sudo restorecon -Rv /srv/site
```

Confirm the correct type for your service and distribution before applying an example. If a mapping already exists, inspect it and use the appropriate modification procedure rather than adding a conflicting rule. Persistent mappings are managed with `semanage fcontext`; a direct `chcon` change may be lost when labels are restored.

Do not label a whole directory tree as writable just to silence a denial. If a service genuinely needs to write to a specific location, determine the narrowest appropriate writable type and limit the writable path to that requirement.

## 5. Check service domains, ports, and booleans

### Service process context

Inspect the running process context and compare it with the expected service domain for your distribution:

```bash
ps -eZ | grep -E 'httpd|nginx'
```

The process name and expected domain differ by service and policy. If a service is running in an unexpected domain, check its executable label, service unit, launch method, and recent configuration changes before changing policy.

### Port labels

A service can be configured to listen on a nonstandard port that SELinux does not permit for that service type. Check the policy’s port assignments and the AVC record before changing anything:

```bash
sudo semanage port -l | grep http_port_t
```

If the service is authorized to use an additional port, add a narrowly scoped mapping using the correct port type for that service. For example, on a system where the intended type is `http_port_t`:

```bash
sudo semanage port -a -t http_port_t -p tcp 8443
```

Check for an existing assignment first. If the port is already defined with a different type, do not blindly add a duplicate; determine whether a carefully reviewed modification is appropriate. Confirm that the application is listening and that firewall rules also allow the traffic—SELinux port labeling does not configure the firewall.

### Policy booleans

Booleans enable or disable selected policy behavior. List relevant settings and inspect their descriptions before changing them:

```bash
getsebool -a | grep httpd
sudo semanage boolean -l | grep httpd
```

If a boolean is the documented, least-privilege solution for a confirmed requirement, change only that setting. For example, where applicable and approved, a web service that must initiate network connections might use:

```bash
sudo setsebool -P httpd_can_network_connect on
```

The `-P` option makes the setting persistent. Do not enable a boolean merely because its name sounds related; understand the access it permits and whether a narrower alternative is available.

## 6. Use a repeatable troubleshooting workflow

Follow these steps to keep SELinux policy troubleshooting evidence-based and reversible:

1. **Reproduce and record the failure.** Note the user, service, resource, time, and exact operation that fails.
2. **Check the mode and policy.** Run `getenforce` and `sestatus`; confirm the host is using the expected policy.
3. **Review logs.** Search for AVC records around the failure time and correlate them with application and system logs.
4. **Interpret the denial.** Identify the source domain, target type, object class, and requested permission. Confirm the denied operation is part of the intended service behavior.
5. **Check conventional controls.** Verify file ownership and permissions, service configuration, firewall rules, and network reachability. SELinux is only one possible cause.
6. **Validate labels and policy settings.** Inspect file contexts, process domains, port assignments, and relevant booleans. Prefer restoring an incorrect label over writing new policy.
7. **Choose the narrowest remediation.** Apply a supported label correction, documented boolean, or justified port mapping. Create custom policy only when existing policy options do not meet a legitimate requirement.
8. **Validate in enforcing mode.** Repeat the original operation, check logs for new denials, and confirm the service still behaves correctly after a restart if relevant.
9. **Document and review.** Record the evidence, change, scope, test result, and rollback method. Remove temporary diagnostic changes.

## 7. Treat generated policy carefully

Tools such as `audit2allow` can help policy authors understand what rules might permit an observed denial. Their output is not an automatic fix. A denial may result from a mislabeled file, an unexpected process domain, a compromised process, or behavior the service should not be allowed to perform. Converting every observed denial into a new allow rule can grant excessive access and conceal a real security issue.

Before creating or installing a custom policy module:

- Verify that the denied operation is expected and necessary.
- Fix incorrect file labels, port types, service configuration, or booleans first.
- Review every proposed permission and limit the rule to the required source, target, object class, and operation.
- Test the change in a controlled environment and document how to remove it.

Do not disable SELinux or broadly relabel files as a routine workaround. If a temporary permissive diagnostic is authorized, keep its duration and scope as small as possible and return the host to enforcing mode.

## 8. Common problems and fixes

### No AVC records appear

Confirm the failure time and check the audit log and journal. Verify that audit services and relevant tools are installed and functioning. Also consider that `dontaudit` rules can suppress some messages. Do not infer that SELinux is the cause—or that it is not the cause—from one empty search.

### `restorecon` makes no change

Check the path’s expected context with `matchpathcon` and inspect any custom mappings with `semanage fcontext -l`. If the location has no suitable default mapping, add a deliberate persistent mapping and then run `restorecon`.

### A denial continues after a label correction

Reproduce the problem and collect fresh AVC records. The denial may concern another file, directory traversal, a port, a process domain, or a policy setting. Verify each resource involved rather than repeatedly changing the same label.

### The host is permissive after reboot

Check the persistent SELinux configuration and any distribution-specific boot settings. Runtime `setenforce` changes do not persist across reboot. Restore the intended enforcing configuration through the supported process and verify it with `getenforce` and `sestatus`.

### Enabling SELinux causes boot or service problems

Do not repeatedly toggle modes without investigating. A system that has been disabled may need a full relabel, and services may have accumulated labeling or configuration issues. Follow the distribution’s recovery and relabel procedure, plan a maintenance window, and ensure you have a tested recovery path.

## FAQ

### What is the difference between permissive and disabled mode?

In permissive mode, SELinux policy violations are generally logged but not enforced. In disabled mode, SELinux is not enforcing policy, and labeling behavior may differ. Permissive mode is useful for limited diagnosis; neither should be treated as the normal security configuration when enforcing mode is required.

### Does permissive mode show every policy problem?

No. Some denials may be suppressed by `dontaudit` rules, and an absence of AVC records is not conclusive. Correlate audit data with application logs, system configuration, and the observed behavior.

### Should I use `audit2allow` to fix an AVC denial?

Not as a first step and not without reviewing the result. First check whether the denial comes from incorrect labels, an unexpected domain, a port assignment, or a suitable policy boolean. Generated rules require security review and testing before use.

### Is `chcon` a permanent way to fix a label?

Usually not. A direct `chcon` change can be overwritten by a later relabel or `restorecon`. For a persistent nonstandard path, use a reviewed `semanage fcontext` mapping and apply it with `restorecon`.

## Conclusion

Effective SELinux modes and policy troubleshooting starts with evidence, not disabling enforcement. Confirm the active mode, find and interpret the relevant AVC record, check labels and service settings, and apply the smallest supported change. Validate the result in enforcing mode and document what changed. This workflow helps resolve legitimate application issues while preserving SELinux as a meaningful layer of Linux security.
