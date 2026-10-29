# Linux Audit Framework With auditd

The Linux Audit framework records security-relevant activity reported by the kernel, such as system calls, file access, and changes to user or privilege configuration. It can help administrators investigate incidents, verify that controls are working, and understand what happened on a system.

The framework is useful only when it is configured deliberately. Broad rules can generate more events than a team can review, while narrow or missing rules can leave important activity unrecorded. This tutorial explains the main components, shows how to create and persist rules, and covers the operational choices that affect audit coverage and reliability.

## What is the Linux Audit framework?

The Linux Audit framework is the kernel-supported mechanism for generating audit events. The `auditd` daemon runs in user space and receives those events, then writes them to the audit log. Administrators typically use `auditctl` to inspect or change active rules, `augenrules` to load persistent rule files, and tools such as `ausearch` and `aureport` to query results.

The main components are:

- **Kernel audit subsystem:** Evaluates audit rules and produces events for matching activity.
- **`auditd`:** Receives events and manages their storage according to its configuration.
- **Audit rules:** Specify which activity should be recorded and can attach a key to make related events easier to find.
- **Analysis tools:** Search, interpret, and summarize the resulting records.

An audit event may consist of multiple related records that share an event identifier. For example, a system-call event can include a `SYSCALL` record with process and result details, plus `PATH` records describing files involved. Treat related records as a unit when investigating an event.

## What auditd can—and cannot—tell you

With appropriate rules, Linux audit can record details such as the process, user identity, command execution, file access, and success or failure of an operation. The exact records depend on the rule, kernel, architecture, and event type. Use interpreted output to make fields easier to read, but retain the original records when you need to verify details.

Audit data is not a complete account of everything that happens on a host. It does not replace application logs, network monitoring, or endpoint detection. It also does not guarantee that activity is attributable to a real person: shared accounts, stolen credentials, and processes running with elevated privileges can complicate attribution. Local logs may be altered or removed by a sufficiently privileged attacker unless they are protected and forwarded elsewhere.

## Install and check the audit service

Package names and service behavior vary by distribution. On Debian- or Ubuntu-based systems, the package is commonly named `auditd`; Red Hat-based systems also commonly provide it as `audit`. Install the appropriate package using your distribution’s package manager, then check the service:

```bash
sudo systemctl enable --now auditd
sudo systemctl status auditd
```

Check whether auditing is enabled and inspect the active rules:

```bash
sudo auditctl -s
sudo auditctl -l
```

The status output reports information such as whether auditing is enabled, the current backlog, and lost events. A nonzero lost-event count needs investigation: it means the audit pipeline did not retain every event it was expected to handle. Some systems also use boot-time kernel parameters to enable auditing early in startup. Consult your distribution’s documentation if you need coverage before the audit service starts.

## Create useful audit rules

A rule should answer a defined security or operational question. Before adding one, decide what activity matters, how much event volume it may create, who will review it, and how long the records need to be retained.

### Monitor changes to a sensitive file

This example records write or attribute-change activity involving the sudoers configuration file:

```bash
sudo auditctl -a always,exit -F arch=b64 -F path=/etc/sudoers -F perm=wa -k sudoers_changes
```

The rule applies to 64-bit system calls. If the host supports 32-bit compatibility programs, add a corresponding rule for that architecture where appropriate:

```bash
sudo auditctl -a always,exit -F arch=b32 -F path=/etc/sudoers -F perm=wa -k sudoers_changes
```

Architecture filters matter for syscall-based rules because syscall numbers can differ between 32-bit and 64-bit interfaces. Confirm the architectures supported by the host before deploying rules. A path-based rule can also need attention when the watched file is replaced; test the rule against your configuration-management and package-update workflows. For a group of files, a directory rule may be more suitable, but it can produce more events and should be scoped carefully.

### Record program execution

Recording executions can help investigate how a process was started, but it is often high volume. The following example records `execve` calls on a 64-bit system:

```bash
sudo auditctl -a always,exit -F arch=b64 -S execve -k process_exec
```

Add a 32-bit equivalent if the system runs 32-bit programs and you need that coverage. Consider testing the rule on a representative host before broad deployment. Busy servers may generate substantial event volume, and command-related records can contain sensitive information. Restrict access to logs and avoid collecting more detail than your investigation or compliance needs require.

### Use keys to make searches manageable

The `-k` option attaches a human-readable key to matching events. Choose consistent names that describe the purpose of each rule, such as `sudoers_changes` or `process_exec`. Keys help analysts search records, but they do not change what the rule captures or make an event more trustworthy.

## Make rules persistent

Rules added with `auditctl` are generally active only until they are removed or the system restarts. On systems that use `augenrules`, place persistent rules in a file under `/etc/audit/rules.d/`. For example:

```text
-a always,exit -F arch=b64 -F path=/etc/sudoers -F perm=wa -k sudoers_changes
-a always,exit -F arch=b32 -F path=/etc/sudoers -F perm=wa -k sudoers_changes
```

Load the rules and verify the result:

```bash
sudo augenrules --load
sudo auditctl -l
```

Some distributions or deployments use a different rule-loading mechanism. Check how the local service loads rules before adding files, and avoid maintaining conflicting copies in multiple places. Do not blindly add a rule such as `-D` to a shared rules file: it deletes existing rules and may remove rules managed by the operating system or another security tool.

Rules are evaluated as a collection, so ordering and control rules can matter. Keep local rules organized, document their purpose, and test changes in a non-production environment when possible. The `-e 2` setting makes the audit configuration immutable until reboot. It can help prevent runtime changes, but it also blocks legitimate rule updates during that boot, so apply it only after the complete rule set has been validated and you have a planned update process.

## Search and interpret audit records

Audit logs are commonly stored in `/var/log/audit/audit.log`, though the location is configurable. Search by rule key and interpret fields:

```bash
sudo ausearch -k sudoers_changes -i
```

You can also search for events from a time range or by another supported field. See `man ausearch` for the installed version’s options. To generate a high-level report, use:

```bash
sudo aureport --summary
```

For an investigation, examine all records that belong to the same event, not just the first matching line. Check the operation’s result, the relevant user and process identifiers, the file paths, and the event time. Interpret output with care: a recorded user ID or process is useful evidence, but it does not by itself prove who was physically operating the system.

## Reliability, storage, and security considerations

Audit rules and log handling are part of the security design, not just a configuration task.

- **Control event volume:** Start with high-value, narrowly scoped rules. Broad syscall or directory rules can create heavy load and make important events harder to find.
- **Watch for lost events:** Monitor audit status and investigate backlog growth or lost-event counters. Tune the rule set and system capacity based on observed workload rather than assuming the default settings are sufficient.
- **Plan log storage:** Configure rotation, retention, and disk-space actions in the audit daemon’s configuration, commonly `/etc/audit/auditd.conf`. Test what happens when storage approaches its limit. A full filesystem can affect more than audit logging.
- **Protect the records:** Limit access to audit logs because they may reveal usernames, paths, process details, and other sensitive information. Apply appropriate retention and access controls.
- **Forward important events:** For stronger resistance to local tampering and easier central review, send relevant records to a separately controlled logging system. Confirm that forwarding is operating and that records arrive as expected.
- **Avoid treating logs as a complete control:** Audit helps with detection and investigation; it does not prevent every action it records. Combine it with least privilege, patching, access controls, and other monitoring.

## Troubleshooting common problems

### The expected event is missing

Confirm that the rule is loaded with `auditctl -l`, that auditing is enabled with `auditctl -s`, and that the test action matches the rule’s architecture and filters. Check whether the target path was replaced after the rule was loaded, and inspect the service and kernel logs for audit-related errors. If the rule is persistent, verify that your distribution’s loader reads the file where you placed it.

### Events are being lost or the backlog grows

Check `auditctl -s` for backlog and lost-event information. Review whether broad rules are producing unnecessary volume, then reduce scope or remove redundant rules. Ensure the daemon is running and log storage is healthy. Tune backlog and failure behavior only after understanding the operational trade-offs and testing the change; an aggressive response can affect system availability.

### A rule works until reboot

Rules created directly with `auditctl` are normally runtime rules. Add the intended rule to the persistent configuration used by the host, reload it using the appropriate service or `augenrules` workflow, and confirm it appears in `auditctl -l` both before and after a planned restart.

## FAQ

### Is auditd installed by default on Linux?

Not always. Availability and default configuration depend on the distribution and installation profile. Check the package manager and service manager for your host, then verify that the audit subsystem is enabled and rules are loaded.

### Are auditd and auditctl the same thing?

No. `auditd` is the user-space daemon that receives and stores audit events. `auditctl` is a command-line utility used to inspect or change kernel audit settings and rules.

### Do audit rules prevent unauthorized changes?

No. Audit rules record matching activity; they are not an access-control mechanism. Use permissions, privilege management, and other preventive controls to restrict actions, then use audit records to support monitoring and investigation.

### Should I record every system call?

Usually not as a starting point. Very broad syscall auditing can create large volumes of data and increase processing and storage demands. Begin with a defined monitoring need, test the expected event rate, and expand coverage when there is a clear operational reason.

## Conclusion

The Linux Audit framework with auditd provides a flexible way to record selected security-relevant activity on Linux hosts. Effective use depends on more than adding rules: choose meaningful scope, account for architecture and persistent loading, protect and retain logs, and monitor for lost events. Start with a small set of questions your audit data must answer, test the rules under realistic workloads, and review the resulting records regularly.
