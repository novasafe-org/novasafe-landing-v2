# Linux Kernel Hardening Fundamentals

A hardened Linux kernel can reduce exposure to vulnerabilities and make exploitation more difficult, but there is no single setting that secures every host. The right configuration depends on the kernel version, distribution, workload, hardware, and operational requirements.

This checklist provides a repeatable way to evaluate Linux kernel hardening fundamentals on systems you own or are explicitly authorized to assess. It covers inventory, kernel configuration, runtime controls, module and boot protections, validation, remediation, and change safety. Treat the commands as assessment examples: confirm their effects on your distribution and applications before applying changes.

## What kernel hardening covers

Kernel hardening means reducing unnecessary kernel functionality and attack surface, enabling available defensive mechanisms, keeping the kernel maintained, and limiting access to sensitive interfaces. It is one layer of Linux security, alongside identity and access management, application controls, network protections, monitoring, and backups.

A useful assessment distinguishes three things:

- **Configured protections:** Options compiled into the kernel, such as address-space randomization or strict memory permissions.
- **Runtime protections:** Settings and policies active on the running system, such as restrictions on kernel logs or unprivileged tracing.
- **Operational controls:** Processes that keep the kernel current, manage modules, validate changes, and recover from failures.

A kernel option being available does not prove it is enabled, and an enabled setting does not automatically make a system secure. Validate the effective state and test for compatibility.

## Before you begin: establish a safe scope

- [ ] Confirm written authorization and identify the systems in scope.
- [ ] Record the host, workload, maintenance window, and responsible owner.
- [ ] Check whether the host is physical, virtual, a container host, or a guest. Some controls have different effects in containers or on shared hosts.
- [ ] Review distribution guidance and application requirements before changing kernel settings.
- [ ] Ensure you have console or out-of-band access, a tested recovery path, and a known-good boot entry where possible.
- [ ] Capture the current configuration and relevant settings so changes can be reviewed and reversed.
- [ ] Avoid testing exploit payloads or deliberately destabilizing production systems. Use a lab or approved test environment for intrusive validation.

## 1. Inventory the running kernel and platform

Start by recording the kernel release, architecture, distribution, and boot mode. These details determine which configuration options and controls are available.

```sh
uname -a
uname -r
uname -m
cat /etc/os-release
```

Check how the running kernel was built. A distribution may provide its configuration in `/boot`, or the kernel may expose it through `/proc/config.gz` if that feature is enabled.

```sh
if [ -r /proc/config.gz ]; then
  zcat /proc/config.gz
elif [ -r "/boot/config-$(uname -r)" ]; then
  cat "/boot/config-$(uname -r)"
else
  echo 'Kernel configuration is not available at common paths'
fi
```

For a focused review, filter for settings of interest rather than relying on one universal baseline:

```sh
config_file="/boot/config-$(uname -r)"
if [ -r "$config_file" ]; then
  grep -E '^(CONFIG_(RANDOMIZE_BASE|STRICT_KERNEL_RWX|STRICT_MODULE_RWX|MODULE_SIG|MODULE_SIG_FORCE|SECURITY|SECURITY_YAMA)=|# CONFIG_(RANDOMIZE_BASE|STRICT_KERNEL_RWX|STRICT_MODULE_RWX|MODULE_SIG|MODULE_SIG_FORCE|SECURITY|SECURITY_YAMA) is not set)' "$config_file"
fi
```

The exact options vary by architecture, kernel version, and vendor. Some protections are enabled by default, compiled out, or implemented differently across kernels. Compare findings with the documentation for the kernel package actually installed; do not interpret a missing option as a finding without checking whether it applies.

## 2. Check kernel maintenance and boot state

- [ ] Confirm the running kernel receives security updates from a supported distribution or vendor source.
- [ ] Compare the running release with the approved package version and the organization’s update policy.
- [ ] Check whether an update is installed but not yet running. A reboot may be needed to load the updated kernel.
- [ ] Review the bootloader configuration and preserve an approved recovery entry.
- [ ] Determine whether Secure Boot is enabled and whether the platform’s boot chain and module-signing policy match organizational requirements.

Useful commands vary by distribution:

```sh
# Debian- or Ubuntu-based systems
apt list --upgradable 2>/dev/null

# RPM-based systems with DNF
sudo dnf check-update

# Secure Boot state, when mokutil is installed
mokutil --sb-state
```

These commands provide package or firmware information; they do not prove that every security update is installed or that the running kernel is the intended one. Verify package provenance and compare against your approved patch process.

Secure Boot can help verify boot components according to platform policy, but it is not a complete kernel-hardening control. Its presence does not replace timely updates, access controls, or validation of the rest of the boot chain.

## 3. Review kernel build-time protections

Use the running kernel’s configuration as evidence, then compare it to a supported baseline for the system’s role. Commonly reviewed options include:

| Protection area | Example configuration | What to verify |
|---|---|---|
| Kernel address randomization | `CONFIG_RANDOMIZE_BASE` | Whether supported and enabled for the architecture and kernel build |
| Read-only kernel memory | `CONFIG_STRICT_KERNEL_RWX` | Whether applicable kernel memory regions receive strict permissions |
| Read-only module memory | `CONFIG_STRICT_MODULE_RWX` | Whether applicable module memory receives strict permissions |
| Module signing | `CONFIG_MODULE_SIG` and `CONFIG_MODULE_SIG_FORCE` | Whether modules are signed and whether enforcement matches policy |
| Security framework | `CONFIG_SECURITY` and relevant LSM options | Whether the required Linux Security Module support is available |
| Stack protection | Relevant compiler and kernel options | Whether the distribution enables supported protections for its build |

These are examples, not a universal pass/fail list. A vendor kernel may use different defaults or backports. An option may also have dependencies or affect hardware support. Record the expected state, actual state, evidence source, and any approved exception.

## 4. Review runtime kernel parameters

Kernel sysctls can restrict access to information and interfaces that might help an attacker. Inspect the effective values before changing anything:

```sh
sysctl kernel.kptr_restrict kernel.dmesg_restrict kernel.yama.ptrace_scope
sysctl kernel.perf_event_paranoid kernel.unprivileged_bpf_disabled
sysctl fs.protected_hardlinks fs.protected_symlinks
```

A key that is unavailable on a particular kernel may return an error; that does not by itself prove the system is vulnerable. Check whether the control exists for the installed kernel and whether an equivalent vendor mechanism applies.

Examples of settings to evaluate include:

- `kernel.kptr_restrict`: Limits exposure of kernel pointer information through certain interfaces. Select a value consistent with the kernel and diagnostic requirements.
- `kernel.dmesg_restrict`: Restricts access to kernel logs, which can contain sensitive system details.
- `kernel.yama.ptrace_scope`: Can limit process tracing by users who would otherwise be permitted to trace processes. Applications such as debuggers and monitoring tools may be affected.
- `kernel.perf_event_paranoid`: Restricts access to performance-monitoring interfaces. The available values and effects depend on the kernel version.
- `kernel.unprivileged_bpf_disabled`: Can restrict unprivileged use of eBPF, subject to kernel support and the setting’s documented behavior.
- `fs.protected_hardlinks` and `fs.protected_symlinks`: Add protections around certain hard-link and symbolic-link operations.

Do not copy a generic sysctl file without reviewing its contents. A setting that is appropriate for a dedicated server may interfere with development tools, observability, containers, or application behavior on another host.

### Apply a reviewed setting safely

For a reversible test, use `sysctl` to change one setting at a time, then verify the effective value and test relevant workloads. For example, only if approved for the host:

```sh
sudo sysctl -w kernel.dmesg_restrict=1
sysctl kernel.dmesg_restrict
```

For persistence, use a clearly named file under `/etc/sysctl.d/` and document the reason and owner. For example, after confirming the desired policy:

```sh
printf '%s\n' 'kernel.dmesg_restrict = 1' | sudo tee /etc/sysctl.d/60-local-kernel-hardening.conf
sudo sysctl --system
sysctl kernel.dmesg_restrict
```

Review the output of `sysctl --system` for errors and check whether another configuration file overrides the value. Keep a record of the previous value and the rollback procedure.

## 5. Assess kernel modules and device exposure

Loaded modules provide functionality, but unnecessary modules can add attack surface. Review what is currently loaded and what the system is configured to load:

```sh
lsmod
```

If available, inspect module metadata and the active module-signing policy:

```sh
modinfo module_name
cat /proc/sys/kernel/module_sig_enforce 2>/dev/null
```

Replace `module_name` with a module relevant to your system. The enforcement interface may not exist on every kernel, and its presence alone is not a complete assessment.

- [ ] Identify modules required for storage, networking, filesystems, virtualization, hardware, and monitoring.
- [ ] Investigate unexpected or unused modules against the host’s role and vendor guidance.
- [ ] Remove or block a module only after confirming it is not needed for boot, recovery, or workload operation.
- [ ] Check how the distribution manages module loading, including configuration under `/etc/modprobe.d/` where applicable.
- [ ] If module signing is required, validate the signing and key-management process as well as enforcement.

Avoid blanket module blacklists. Disabling a required driver or filesystem module can make a system unbootable or interrupt services. Test changes on a comparable system and retain console access.

The `kernel.modules_disabled` control can prevent further module loading and unloading after it is set. On kernels that support it, this is a restrictive, effectively irreversible setting until reboot. It can interfere with hardware discovery, maintenance, and recovery, so consider it only when the module set is known, loaded, and stable and the operational impact has been tested.

## 6. Evaluate Linux Security Modules and lockdown

Linux Security Modules (LSMs) provide enforcement frameworks used by controls such as SELinux, AppArmor, and other implementations. Check which LSMs are active and review their policy state using distribution-appropriate tools:

```sh
cat /sys/kernel/security/lsm 2>/dev/null
getenforce 2>/dev/null
aa-status 2>/dev/null
```

Not every command is installed on every distribution. A host may use one LSM, a combination of supported LSMs, or a vendor-specific setup. Confirm that the intended policy is loaded and enforcing; installing a tool or seeing an LSM name is not sufficient validation.

Kernel lockdown, where supported and configured, can restrict certain operations that could modify the running kernel. Its availability and behavior depend on the kernel, boot chain, and distribution. If the interface is present, inspect it with:

```sh
cat /sys/kernel/security/lockdown 2>/dev/null
```

Review vendor documentation before changing lockdown or LSM policy. These controls can affect debugging, hardware tools, third-party drivers, and incident-response procedures.

## 7. Validate the effective state

A hardening change is not complete until its effective state and operational impact have been checked.

- [ ] Re-read each changed sysctl and confirm the intended value is active.
- [ ] Confirm the running kernel release after any kernel update or reboot.
- [ ] Check boot logs and service status for module, driver, or policy failures.
- [ ] Verify that required applications, agents, storage, networking, and monitoring still work.
- [ ] Confirm that the intended LSM policy or lockdown mode is active where applicable.
- [ ] Compare results against the approved baseline and document exceptions with an owner and review date.
- [ ] Repeat checks after kernel upgrades, configuration-management changes, or changes to host role.

For a quick review of recent kernel messages and failed services, use the tools available on the distribution:

```sh
sudo journalctl -k -b --no-pager
systemctl --failed
```

Inspect findings in context. A warning may be expected, while a quiet log does not prove that a control is functioning correctly. For stronger validation, use approved configuration-management, compliance, or audit tooling and retain the evidence in the organization’s normal change records.

## 8. Remediate findings using a controlled workflow

For each gap, record the control, evidence, risk, proposed change, compatibility concerns, and rollback path. Then:

1. **Prioritize:** Address unsupported or outdated kernels and high-impact exposure first, following vendor advisories and organizational risk policy.
2. **Research:** Confirm the recommended value or configuration for the exact kernel, distribution, and workload.
3. **Test:** Apply the change in a representative non-production environment when feasible. Include boot, recovery, and application checks.
4. **Stage:** Use a documented change, a maintenance window when needed, and access to a recovery console.
5. **Apply narrowly:** Change one logical control at a time so failures can be isolated.
6. **Validate:** Recheck the effective setting and test the services or workflows that could be affected.
7. **Roll back if needed:** Restore the recorded previous value or configuration and reboot only when the control requires it.
8. **Track:** Record completion, exceptions, evidence, and the next review point.

Do not treat a successful command exit as proof of security. The goal is a supported, maintainable configuration that reduces risk without silently breaking the system.

## Troubleshooting common issues

### A sysctl key is missing

The setting may not be supported by the running kernel, may use a different interface, or may be provided only by a vendor kernel. Check the kernel version and vendor documentation before concluding that the host is misconfigured.

### A setting changes back after reboot

Look for an overriding file in `/etc/sysctl.d/`, `/run/sysctl.d/`, or the distribution’s system configuration directories. Check configuration-management tools and boot-time services that may reapply values. Use `sysctl --system` output to identify parsing or application errors.

### A module blacklist prevents boot or device access

Use the recovery entry or console to remove or revise the change, then regenerate any distribution-specific initramfs or boot artifacts if required. Validate the correct procedure with the distribution’s documentation before making boot-related changes.

### A hardening change breaks debugging or monitoring

Identify the specific interface the tool requires and assess whether a narrowly scoped exception is acceptable. Do not broadly weaken protections without documenting the need, approval, compensating controls, and review date.

## Practical assessment checklist

Use this summary to record a review:

- [ ] Scope and authorization confirmed; recovery access available.
- [ ] Kernel release, architecture, distribution, and configuration source recorded.
- [ ] Kernel support status and update process reviewed.
- [ ] Build-time protections compared with an applicable baseline.
- [ ] Runtime sysctls inspected and justified against workload needs.
- [ ] Loaded and loadable modules reviewed; signing policy checked where relevant.
- [ ] LSM and lockdown state verified where supported and required.
- [ ] Changes tested, validated, documented, and assigned an owner.
- [ ] Review scheduled after kernel updates or workload changes.

## FAQ

### Is Linux kernel hardening only about sysctl settings?

No. Sysctls are one part of the assessment. Kernel build options, updates, module management, boot protections, LSM policy, access to kernel interfaces, and operational recovery all matter.

### Should every server use the same kernel-hardening values?

Not necessarily. A baseline can provide consistency, but the appropriate settings depend on the kernel, distribution, host role, applications, and operational requirements. Document justified exceptions rather than applying values blindly.

### Does enabling Secure Boot mean the kernel is fully hardened?

No. Secure Boot can help validate boot components according to platform policy, but it does not replace kernel updates, runtime controls, module review, or broader Linux security practices.

### Can I disable all unused kernel modules?

Only after verifying what the system needs, including during boot and recovery. An overbroad blacklist can prevent hardware, storage, networking, or other essential functions from working.

### How often should I repeat a kernel-hardening review?

Review after significant kernel or distribution updates, changes in workload or host role, and changes to security policy. Also follow your organization’s regular configuration-review and vulnerability-management schedules.

## Conclusion

Linux kernel hardening fundamentals are best approached as a documented assessment and maintenance workflow, not a one-time list of settings. Inventory the running system, compare its build and runtime state with an appropriate baseline, make carefully scoped changes, and validate both security and compatibility. Repeating that process after updates and operational changes helps keep kernel protections useful without sacrificing reliability.
