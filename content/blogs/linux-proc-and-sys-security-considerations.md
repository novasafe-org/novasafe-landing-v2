# Linux /proc and /sys Security Considerations

Linux exposes information and controls through virtual filesystems, especially `/proc` and `/sys`. These paths are essential to system administration, monitoring, and application behavior, but they can also reveal process details, kernel state, hardware information, or interfaces that affect system behavior.

The right approach is not to hide or disable everything. Teams should understand what each filesystem exposes in their environment, identify unnecessary access, and apply safeguards that fit the host's role and operational needs. This guide explains how to assess Linux `/proc` and `/sys` security considerations, recognize common failure modes, and make proportionate changes.

## What `/proc` and `/sys` expose

Both filesystems are usually mounted by the kernel and present information as files, but they serve different purposes.

### `/proc`: process and kernel information

`/proc` contains information about running processes and selected kernel settings. Directories such as `/proc/1234` correspond to process IDs. Depending on permissions, mount options, namespaces, and kernel policy, users may be able to inspect details such as command-line arguments, environment variables, open file descriptors, memory mappings, and process status.

Other entries expose system information and kernel controls. For example, `/proc/cpuinfo` reports processor details, while `/proc/sys` provides access to many kernel parameters, also commonly managed with `sysctl`.

Process information can be sensitive. Command-line arguments may contain credentials or tokens if applications handle secrets carelessly. Environment variables can also contain sensitive values, though access to process details is subject to permission checks and system configuration.

### `/sys`: devices, drivers, and kernel objects

`/sys`, generally mounted as sysfs, presents information about devices, drivers, buses, and other kernel objects. Many entries are informational; some are writable attributes used to change device or kernel behavior. Which attributes exist and who can write to them depends on the kernel, device, distribution, and permissions.

Sysfs is not simply a general-purpose configuration directory. Its interfaces are implemented by kernel subsystems and device drivers. Treat writable attributes as privileged control surfaces: restrict access to those that can affect system operation, and avoid changing them without understanding the specific interface.

## Why these filesystems matter to security

A security review should consider both confidentiality and integrity:

- **Confidentiality:** Process metadata and system details can help an attacker understand running services, installed components, or system configuration. The sensitivity of this information depends on the host and the data exposed by its applications.
- **Integrity:** Writable kernel parameters or sysfs attributes may change system behavior. The impact depends on the specific setting and the privileges required to change it.
- **Attack surface:** Applications and agents often read from these filesystems. Excessive privileges, broad mounts, or unnecessary access can increase the consequences of a compromised process.
- **Isolation:** Containers and other workload boundaries can be weakened by sharing host process information or granting broad device and kernel access.

These are not reasons to block `/proc` or `/sys` wholesale. Many tools and services rely on them, and indiscriminate restrictions can break monitoring, container runtimes, or system management.

## A practical assessment process

Assess the actual host configuration rather than relying on assumptions about a distribution or container runtime.

### 1. Identify mounts and options

Start by checking how the filesystems are mounted:

```sh
findmnt -no TARGET,OPTIONS /proc
findmnt -no TARGET,OPTIONS /sys
```

If `findmnt` is unavailable, inspect the mount table:

```sh
grep -E ' /proc | /sys ' /proc/mounts
```

Look for unexpected mount configurations, duplicate mounts, or differences between hosts that are meant to have the same role. Mount options vary in availability and behavior across kernel versions and distributions, so confirm support before standardizing them.

### 2. Check process visibility

Review which users can inspect other users' process information. You can examine directory permissions and test access using an unprivileged account, rather than relying only on a privileged administrator's view:

```sh
ls -ld /proc /proc/1
ps -eo user,pid,comm
```

The `ps` output is an example of process metadata that may be visible; it does not prove that every process detail is accessible. Access to individual process files is governed by their permissions and kernel checks.

On systems that support it, the procfs `hidepid` mount option can restrict visibility of other users' process directories. Common values include `hidepid=1`, which restricts access to process information, and `hidepid=2`, which also hides other users' process directories from normal listings. A `gid` option can grant a designated group access to process information when that is needed for monitoring or administration.

Before applying these options, test affected services. Monitoring agents, process supervisors, and operational tools may depend on visibility across users. Do not treat `hidepid` as a boundary against root or as a replacement for application-level secret handling.

### 3. Review kernel parameters

Use `sysctl` to inspect relevant settings individually. For example:

```sh
sysctl kernel.yama.ptrace_scope
sysctl kernel.kptr_restrict
sysctl kernel.dmesg_restrict
```

A setting may be absent, have different defaults, or behave differently depending on the kernel and distribution. Check local documentation and test the effect before changing it. Avoid publishing full diagnostic output without review: it may reveal system details that are not appropriate to share.

Also consider whether applications place credentials in command-line arguments or environment variables. Reducing visibility can help, but it is better to avoid putting secrets in process metadata where possible. Prefer appropriately managed secret files, credential stores, or service-specific mechanisms.

### 4. Inspect sysfs access and consumers

Review sysfs permissions and identify services that read or write device attributes. A targeted inspection might start with:

```sh
find /sys -maxdepth 3 -type f -perm /022 -print 2>/dev/null
```

This is only a triage aid. Sysfs attributes may not behave like ordinary files, and the command does not establish whether a particular attribute is safe or exploitable. Investigate any unexpected writable paths in the context of the relevant driver, service, and device.

Check which processes have the capabilities and device access needed to interact with sensitive interfaces. A process running with broad privileges can often bypass protections that would constrain an ordinary user.

### 5. Evaluate namespaces and containers

For containers, determine whether `/proc` is mounted for the container's process namespace or exposes host process information. Review settings that share the host PID namespace, mount host paths, or grant broad device access. The exact behavior depends on the container runtime and its configuration.

A read-only root filesystem does not automatically make every exposed interface harmless. Review the container's capabilities, mounts, device mappings, and namespace configuration together. For example, a read-only mount can reduce writes through that mount where supported, but it does not compensate for excessive privileges or other writable paths to the same resources.

## Common failure modes

### Assuming defaults are universal

Defaults can differ across kernel versions, distributions, images, and runtime configurations. A secure configuration on one host may not match another. Verify effective mounts and permissions on deployed systems.

### Relying on `hidepid` as complete process isolation

`hidepid` can reduce cross-user process visibility, but it does not replace user separation, capability controls, namespaces, or careful secret management. Root and designated groups may retain access, and services may need exceptions.

### Exposing a host's `/proc` to a container

Sharing the host PID namespace or mounting host process information into a workload can reveal more than intended. Use the container runtime's supported isolation settings and verify the resulting mounts from inside the container.

### Treating every sysfs file as harmless or dangerous

Many sysfs entries are informational, while some are writable controls. Blanket assumptions lead either to unnecessary restrictions or overlooked risk. Assess individual interfaces and the privileges needed to use them.

### Making persistent changes without testing

A mount option or kernel parameter can affect monitoring, debugging, or service startup. Test changes in a representative environment, document exceptions, and define a rollback path before applying them broadly.

## Proportionate safeguards

Use safeguards that match the system's purpose and threat model:

1. **Minimize privileges.** Run services as dedicated, unprivileged users where practical. Avoid broad Linux capabilities and unnecessary device access.
2. **Limit process visibility where appropriate.** Consider supported procfs options such as `hidepid` on multi-user systems, while accounting for monitoring and administrative needs.
3. **Protect sensitive kernel information.** Review relevant kernel parameters, including those that affect pointer exposure, kernel message access, or process tracing. Validate availability and impact on the target kernel.
4. **Keep container boundaries narrow.** Avoid host PID namespace sharing and unnecessary host mounts. Use only the devices and capabilities a workload requires.
5. **Control changes to kernel interfaces.** Restrict privileged access to writable sysfs attributes and `/proc/sys` controls. Use established configuration management rather than ad hoc writes.
6. **Avoid secrets in process metadata.** Do not pass credentials as command-line arguments. Limit the use of sensitive environment variables and protect application logs and diagnostic outputs.
7. **Monitor configuration drift.** Compare effective mount options, permissions, and relevant kernel settings against an approved baseline. Investigate unexpected changes rather than assuming they are benign.
8. **Preserve operational access deliberately.** If an agent or administrator needs broader visibility, grant it through a documented, narrowly scoped exception instead of weakening controls for every user.

For persistent configuration, use the mechanisms supported by the operating system, such as the system's mount configuration or sysctl configuration files. The exact file and service behavior varies by distribution. Confirm the resulting state after reboot and after upgrades; a configuration file alone does not prove that a setting took effect.

## Troubleshooting safely

If a service stops working after a restriction is introduced, identify the specific access it needs before reverting all safeguards. Check its logs, service account, mount namespace, and permissions. Where appropriate, compare behavior under the previous and updated configuration in a test environment.

If a sysctl command reports an unknown key, the setting may not be available in that kernel or may be named differently. Do not create a similarly named file or copy settings from another system without checking kernel documentation.

If a process can still see information you expected to hide, verify the view from the same user and namespace as the process in question. Check for a `gid` exception, a separate procfs mount, elevated privileges, or shared namespaces.

## FAQ

### Is `/proc` a normal directory on disk?

No. It is a virtual filesystem provided by the kernel. Its entries reflect current process and kernel state, and many are generated dynamically rather than stored as ordinary files.

### Does mounting `/proc` with `hidepid=2` hide processes from root?

It is intended to restrict visibility for ordinary users, not to provide a security boundary against root. Access can also be granted to a configured group, and system behavior depends on the kernel and mount configuration.

### Should `/sys` always be mounted read-only?

Not necessarily. Some systems and services need to use writable sysfs attributes. A read-only mount may be appropriate in a particular environment, but assess compatibility and understand that it is only one part of access control.

### Can a container safely use the host's `/proc`?

It depends on the namespace and mount configuration, but exposing host process information can undermine workload isolation. Prefer a procfs view scoped to the container's process namespace, and verify the runtime's effective configuration.

## Conclusion

`/proc` and `/sys` are valuable kernel interfaces, not ordinary application directories. Their security implications depend on what is mounted, who can access it, which namespaces are in use, and what privileges a process holds. Assess those details on the actual host, focus on sensitive information and writable controls, and test changes against operational requirements. A measured approach—least privilege, deliberate isolation, and configuration monitoring—can reduce unnecessary exposure without disrupting the tools that depend on these filesystems.
