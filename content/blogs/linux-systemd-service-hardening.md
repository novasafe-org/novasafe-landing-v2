# Linux systemd Service Hardening

A Linux service does not need unrestricted access to the host just because it runs in the background. systemd can limit a service’s privileges, filesystem access, kernel interfaces, and network address families—often without changing the application itself.

This checklist explains how to assess and apply **linux systemd service hardening** while balancing security with reliability. It compares common controls, provides a sample drop-in configuration, and shows how to test changes without assuming every service can run under the same restrictions.

> **Key principle:** Apply the smallest set of restrictions that the service can reliably operate with, then verify the result under realistic workloads. A directive that blocks required behavior can cause an outage without making the service meaningfully safer.

## Before you change a unit

Identify the service’s actual requirements before adding restrictions. Check its unit, current runtime identity, writable paths, capabilities, network use, and dependencies.

```bash
systemctl status exampled.service
systemctl cat exampled.service
systemctl show exampled.service \
  -p User -p Group -p ExecStart -p WorkingDirectory -p FragmentPath
```

Replace `exampled.service` with the unit you are assessing. `systemctl cat` shows the main unit and any drop-ins; `systemctl show` reports effective properties. Confirm whether the unit is vendor-provided, locally managed, or generated, since that affects where changes should be made.

Record normal behavior before hardening: startup and shutdown, routine requests, scheduled jobs, log output, data writes, and any maintenance tasks. Keep a rollback path, such as a configuration-management change or a saved copy of the drop-in.

## Linux systemd service hardening checklist

### 1. Run the service with limited privileges

- [ ] Use a dedicated, unprivileged account when practical.
- [ ] Avoid running a network-facing daemon as root unless it genuinely needs root privileges.
- [ ] Keep the account’s login shell and supplementary groups appropriate to the host’s account-management policy.
- [ ] Grant only the Linux capabilities the service requires.

For a locally managed unit, `User=` and `Group=` select the runtime identity. A service that must bind a low-numbered port may be able to run without root by receiving `CAP_NET_BIND_SERVICE`, but check the application and host configuration before choosing that design. Do not grant broad capabilities as a shortcut.

`CapabilityBoundingSet=` can limit the capabilities available to a service. An empty assignment removes the bounding set’s capabilities, but may break software that depends on one. Capabilities and privilege dropping are not interchangeable: validate the program’s actual needs rather than assuming one setting replaces the other.

### 2. Restrict filesystem access

- [ ] Use `ProtectSystem=` to make system directories read-only where possible.
- [ ] Use `ProtectHome=` to restrict access to users’ home directories if the service does not need it.
- [ ] Give the service explicit writable locations rather than broad write access.
- [ ] Consider `PrivateTmp=` for a service that does not need to share temporary files with other processes.

These controls use systemd’s service sandboxing. They do not replace file ownership, permissions, mount policy, or application-level access controls.

`ProtectSystem=strict` makes the filesystem hierarchy read-only to the service, subject to exceptions and other unit settings. A service that needs persistent state can use `StateDirectory=`; systemd creates the directory under `/var/lib` and makes it available to the service. `ReadWritePaths=` can also allow specific paths, but the underlying filesystem permissions still matter.

`ProtectHome=read-only` allows reading home directories but not writing to them through the service’s view. `ProtectHome=yes` makes home directories inaccessible. Choose based on the service’s needs; either setting can break software that reads configuration or credentials from a home directory.

### 3. Limit access to devices and kernel interfaces

- [ ] Enable `PrivateDevices=` if the service does not need host devices.
- [ ] Consider controls such as `ProtectKernelTunables=`, `ProtectKernelModules=`, and `ProtectControlGroups=` when compatible.
- [ ] Consider `ProtectKernelLogs=` and `ProtectClock=` where supported and appropriate.
- [ ] Check whether the service needs namespaces or other kernel features before restricting them.

These settings vary in availability and behavior across systemd versions. Check the local `systemd.exec(5)` documentation. Do not assume a directive is active just because it appears in a unit file; verify that the installed systemd recognizes it.

### 4. Restrict network and system-call access selectively

- [ ] Use `RestrictAddressFamilies=` to allow only the address families the service uses.
- [ ] Evaluate `SystemCallFilter=` only when you can test the application’s full behavior.
- [ ] Avoid network isolation settings that conflict with the service’s required connections.

For example, a daemon that uses IPv4, IPv6, and Unix sockets might use `RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6`. A service that relies on another address family, such as a packet socket, would need a different policy.

System-call filters can reduce available kernel interfaces, but an overly restrictive filter can break software in uncommon code paths. Start with a well-understood systemd syscall group if appropriate, test upgrades and maintenance operations, and review logs for blocked operations. A filter is not a substitute for patching vulnerable software.

### 5. Add restrictions in the right place

- [ ] Prefer a systemd drop-in for local hardening rather than editing a package-managed unit file.
- [ ] Check whether the service already has vendor-supplied sandboxing or required overrides.
- [ ] Keep local policy understandable and documented.

Create or edit a drop-in with:

```bash
sudo systemctl edit exampled.service
```

The editor creates a local override, typically under `/etc/systemd/system/exampled.service.d/`. Drop-ins are generally easier to maintain across package updates than editing a unit under `/usr/lib/systemd/system/` or `/lib/systemd/system/`. If the service is generated or managed by another tool, make the change through that system where possible.

## Example: a starting-point drop-in

The following is an illustrative baseline for a daemon that can run as a dedicated account, needs persistent state under `/var/lib/exampled`, and uses standard IPv4, IPv6, and Unix sockets. It is not a universal template.

```ini
[Service]
User=exampled
Group=exampled

NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectSystem=strict
ProtectHome=read-only
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6

StateDirectory=exampled
```

`StateDirectory=exampled` is designed to provide service state storage under `/var/lib/exampled`. Confirm the resulting ownership and access behavior on your system, especially if the unit uses `DynamicUser=` or existing data has different ownership. If the daemon needs other writable paths, add only those paths after confirming they are necessary.

This example deliberately does not include every available hardening option. For example, `PrivateDevices=yes` is unsuitable when a service must access a host device. A read-only home view is unsuitable if the service must write there. Restrictions on kernel interfaces or system calls can also conflict with legitimate features.

After editing the drop-in, reload systemd’s unit definitions and restart the service:

```bash
sudo systemctl daemon-reload
sudo systemctl restart exampled.service
sudo systemctl status exampled.service
```

Then test the service’s normal traffic and operational workflows—not just whether the process starts.

## Compare the main hardening approaches

| Approach | What it helps control | Main tradeoff | Good fit when |
|---|---|---|---|
| Dedicated user and group | The service’s identity and access granted by ordinary file permissions | Requires correct ownership and may require application or deployment changes | Most services, especially those that do not need root |
| Capability reduction | Specific privileged kernel operations | A missing capability can block a required operation; capabilities are easy to overgrant | Services with a small, known set of privileged needs |
| Filesystem sandboxing | What paths the service can read or write through its service view | Can break access to configuration, sockets, data, or temporary files | Services with clearly defined read and write locations |
| Device and kernel restrictions | Access to devices and selected kernel interfaces | May interfere with hardware access, containers, or specialized software | Services that do not require the restricted interfaces |
| Network and syscall restrictions | Address families or system calls available to the process | Harder to infer requirements; uncommon code paths may fail | Services with stable, well-tested behavior and clear dependencies |

These approaches are complementary. A dedicated user does not restrict every filesystem path, and a filesystem sandbox does not fix unsafe application behavior. Choose controls based on the threat model and service requirements, rather than maximizing the number of enabled directives.

## Validate the effective policy

### Inspect systemd’s security assessment

```bash
systemd-analyze security exampled.service
```

This command provides a useful view of systemd-exposed security properties and may point out missing restrictions. Treat it as a review aid, not a security guarantee or a pass/fail test. Its assessment cannot determine whether the service will work correctly or whether the application itself is secure.

### Check the unit and logs

```bash
systemctl cat exampled.service
systemctl show exampled.service -p User -p Group -p ProtectSystem -p ProtectHome
journalctl -u exampled.service --since "15 minutes ago"
```

Look for startup failures, permission errors, denied access, and unexpected restarts. A log message about access being denied can indicate a required path or operation was restricted; it can also reveal behavior that should be investigated rather than automatically allowed.

### Test more than startup

- [ ] Exercise normal requests and background jobs.
- [ ] Test graceful shutdown and restart.
- [ ] Check log rotation, backups, upgrades, and maintenance commands.
- [ ] Verify access to required sockets, certificates, secrets, and data directories.
- [ ] Test monitoring and health checks that interact with the service.
- [ ] Repeat after application or systemd upgrades where behavior may change.

If a restriction causes failure, identify the exact denied resource or operation. Add a narrow exception or select a less restrictive setting only after confirming the requirement. Avoid reverting to broad privileges as the first troubleshooting step.

## Common design decisions and pitfalls

### Static service account or `DynamicUser=`?

A static account is often straightforward when administrators need stable ownership, the service shares files with other tools, or existing data must retain a predictable owner. `DynamicUser=` lets systemd allocate a transient identity for a service, but can change assumptions about persistent files and ownership. Review the unit’s storage and integration requirements before using it.

### `ProtectSystem=strict` or a narrower filesystem policy?

`ProtectSystem=strict` is a strong starting point when the service’s writable locations are known. It can be inconvenient for software that writes to unanticipated paths. A narrower policy may be easier to operate, but can leave more of the filesystem writable. Choose according to the service’s actual behavior and the impact of a compromise.

### Hardening directives or application changes?

systemd sandboxing can limit the consequences of some process actions, but it cannot make unsafe application code safe. Keep the service patched, protect its credentials, validate inputs, and use appropriate network controls. Defense in depth means combining controls that address different failure modes.

### Do not copy a generic “maximum hardening” profile blindly

The same directive can be harmless for one daemon and disruptive for another. Network services, container runtimes, backup tools, hardware agents, and software with plugins may need access that a simple web daemon does not. Apply changes incrementally and retain a tested rollback procedure.

## FAQ

### Does `systemd-analyze security` prove that a service is secure?

No. It reports aspects of systemd’s configured sandboxing and can help identify opportunities for review. It does not test the application’s code, determine every operational requirement, or guarantee protection from compromise.

### Should every service use `ProtectSystem=strict`?

No. It can be appropriate when writable paths are known, but may break services that need to modify other locations. Start from the service’s requirements and grant narrow write access where needed.

### Is a systemd drop-in preserved when a package is updated?

A local drop-in under `/etc/systemd/system/` is generally separate from the package’s unit file and is therefore easier to maintain across package updates. Still, review it after updates: upstream unit changes or application behavior can make an old override ineffective or incompatible.

### What should I do if hardening breaks the service?

Check the unit status and journal, identify the denied operation or path, and confirm that the service genuinely needs it. Adjust the narrowest relevant restriction, reload systemd if the unit changed, and retest the full workflow. Roll back if you cannot restore reliable operation safely.

## Conclusion

Effective Linux systemd service hardening is a process of reducing unnecessary access while preserving required behavior. Begin with a dedicated service identity, constrain writable paths, and add device, kernel, network, or syscall restrictions only when they fit the application. Use drop-ins for maintainable local policy, validate the effective configuration, and test realistic workflows before relying on the change. The best defensive design is not the one with the most directives—it is the one whose restrictions are understood, maintained, and proven compatible with the service.
