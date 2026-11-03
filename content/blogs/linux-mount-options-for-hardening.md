# Linux Mount Options for Hardening

Mount options can add useful security boundaries to a Linux system by limiting what can happen on selected filesystems. Options such as `nodev`, `nosuid`, `noexec`, and `ro` are straightforward to configure, but applying them everywhere can break applications or system services.

This checklist explains what each option does, where it may fit, how to apply it safely, and how to verify the result. The goal is to choose mount options based on the purpose of each filesystem—not to apply a one-size-fits-all hardening recipe.

## Linux mount options hardening checklist

Use this checklist when reviewing a server, workstation, or virtual machine:

- [ ] Identify filesystems and mount points that accept untrusted or temporary data.
- [ ] Consider `nodev` and `nosuid` for data-only filesystems.
- [ ] Consider `noexec` only where applications do not need to execute files from that filesystem.
- [ ] Use read-only mounts for data that does not need to change at runtime.
- [ ] Check application, boot, backup, and recovery requirements before changing options.
- [ ] Apply changes in a controlled way and verify the effective mount options.
- [ ] Document exceptions and recheck them after system or application changes.

## What the main mount options do

| Option | Effect | Common consideration |
|---|---|---|
| `nodev` | Does not allow device special files on the mount to function as devices. | Often suitable for filesystems used only for ordinary data. |
| `nosuid` | Ignores set-user-ID and set-group-ID bits and file capabilities on that mount. | Can prevent programs on the mount from gaining privileges through those mechanisms. |
| `noexec` | Prevents direct execution of files on the mount through the normal kernel execution path. | Can disrupt software that runs programs or scripts from that location; it is not a complete execution-control boundary. |
| `ro` | Mounts the filesystem read-only. | Services that need to write there will fail; read-only does not prevent privileged remounting. |

These options affect a particular mount, not every copy of the same data. A different writable mount, bind mount, or mount namespace may provide another path to the files. Mount options complement permissions, access controls, patching, and monitoring; they do not replace them.

### `nodev`: make device files inert

Device files provide interfaces to devices and kernel functionality. On a mount marked `nodev`, device special files present in the filesystem are not treated as usable devices. This is a sensible default for many data-only locations, including temporary storage and user-upload areas.

It is generally less disruptive than `noexec`, but it should still be tested against application requirements. It does not stop access to devices exposed elsewhere, such as the system's normal `/dev` mount.

### `nosuid`: prevent privilege gain through file metadata

The `nosuid` option suppresses the effect of set-user-ID and set-group-ID bits on files in the mount and disables file capabilities there. It is useful where users or services can place files but should not be able to use those files to gain privileges.

It does not remove the bits or capabilities from the files. It changes how the kernel treats them on that mount. It also does not prevent privilege escalation through unrelated vulnerabilities or privileged services.

### `noexec`: restrict direct execution, with limits

The `noexec` option blocks normal direct execution of files from the mount. It can reduce risk on locations used for temporary files or uploads, especially when combined with `nodev` and `nosuid`.

However, `noexec` is not a general-purpose application allowlist. For example, a readable script may still be passed as input to an interpreter located on an executable filesystem, such as `sh /tmp/script.sh`. Software installers, build systems, language runtimes, and applications that unpack and run helper programs may also fail. Test actual workflows before enabling it.

### `ro`: make a filesystem read-only

A read-only mount prevents writes through that mount while it remains read-only. This is appropriate for filesystems whose contents should not change during normal operation, such as some static content or carefully managed system images.

A read-only mount is not immutable: a sufficiently privileged administrator may be able to remount it read-write, and the same storage could be exposed through another writable mount. Plan how updates, logs, temporary state, and recovery will work before relying on `ro`.

## Choose options by mount point

The right design depends on what each filesystem stores and which processes use it. Treat these as starting points, not universal rules:

| Location or purpose | Options to evaluate | Tradeoffs and checks |
|---|---|---|
| `/tmp` | `nodev,nosuid`; optionally `noexec` | Programs sometimes execute temporary files. Confirm installer, build, and application behavior. |
| `/var/tmp` | `nodev,nosuid`; optionally `noexec` | Data may persist longer than in `/tmp`; check software that uses it for executable files. |
| `/dev/shm` | `nodev,nosuid,noexec` | Commonly used for shared memory, but confirm local application requirements and existing distribution defaults. |
| Uploads or user-controlled data | `nodev,nosuid,noexec` where compatible | Keep executable application code outside these locations when possible. Enforce authorization and validate uploads as well. |
| `/home` | Often `nodev,nosuid`; evaluate `noexec` | `noexec` can disrupt user tools, development workflows, and applications. It does not stop interpreted scripts from being read by an interpreter. |
| Static or dedicated data | `ro`, possibly with `nodev,nosuid` | Confirm update and service write paths; use a separate writable location for state where practical. |

Avoid applying restrictive options indiscriminately to core system filesystems. For example, software and services may need to execute files under `/usr` or write state under parts of `/var`. Understand the filesystem's role before changing its mount policy.

## Configure options in `/etc/fstab`

For a persistent filesystem, mount options are commonly configured in `/etc/fstab`. First identify the filesystem and its current mount point:

```bash
findmnt -o TARGET,SOURCE,FSTYPE,OPTIONS
```

Back up `/etc/fstab` before editing it. A dedicated data filesystem might have an entry like this:

```fstab
UUID=11111111-2222-3333-4444-555555555555 /srv/uploads ext4 defaults,nodev,nosuid,noexec 0 2
```

Replace the example UUID, mount point, and filesystem type with values from the actual system. The options are comma-separated. The `noexec` choice is appropriate only if files on `/srv/uploads` do not need direct execution. For a read-only data filesystem, `ro` may be appropriate instead of `defaults` or `rw`, but verify that nothing needs to write there.

For a temporary filesystem, a system may use an entry such as:

```fstab
tmpfs /tmp tmpfs rw,nosuid,nodev,noexec,mode=1777 0 0
```

This example illustrates a possible policy, not a guarantee that every system should replace its existing `/tmp` configuration. Check distribution defaults and application requirements first. The `mode=1777` setting provides the conventional shared temporary-directory permissions; it is separate from the mount security flags.

### Apply changes carefully

1. **Record the current state.** Save the relevant `findmnt` output and back up `/etc/fstab`.
2. **Review dependencies.** Check services, scheduled tasks, installers, and recovery procedures that use the target path.
3. **Edit one mount at a time.** Avoid changing several critical filesystems in one untested deployment.
4. **Check the configuration.** On systems with a sufficiently recent util-linux version, run `findmnt --verify --verbose` to check `/etc/fstab` entries. Review any warnings rather than assuming they are harmless.
5. **Apply and test.** For a noncritical mount, use the appropriate remount operation with the intended options, or schedule a maintenance window and reboot to test the persistent configuration. For example:

   ```bash
   sudo mount -o remount,rw,nodev,nosuid,noexec /srv/uploads
   ```

   Include the options you intend to enforce, and confirm that the mount point and filesystem are correct before running the command. A remount can fail if the filesystem is busy or the requested configuration conflicts with its state.
6. **Verify the effective options.** Run `findmnt` for the target path and check the `OPTIONS` column. Then test the application workflows that depend on the mount.
7. **Keep a recovery path.** Make sure you can access the system through a console or recovery environment if a change prevents a service or boot process from working.

Example verification:

```bash
findmnt -no TARGET,SOURCE,FSTYPE,OPTIONS /srv/uploads
```

The `OPTIONS` output shows the active mount flags. Do not rely only on the text in `/etc/fstab`: a configuration entry does not prove that the mount succeeded with the intended options.

## Bind mounts, containers, and mount namespaces

A bind mount presents an existing directory at another path. Review bind mounts as well as ordinary filesystem mounts: a path may be reachable through more than one mount, and the security properties of a specific mount point may differ from those of the underlying filesystem. Inspect the live mount tree with `findmnt` and check the options on the path used by the application.

Containers and services may run in mount namespaces with a mount view different from the host's. A host-side restriction does not automatically describe every mount inside every namespace. Check the service or container configuration and verify the mount from the relevant runtime context. Where supported, use the runtime's documented controls for read-only mounts and mount propagation rather than assuming host `/etc/fstab` covers them.

## Common pitfalls and troubleshooting

- **An application cannot start after `noexec`:** Check whether it runs a helper or executable from the affected filesystem. Move executable code to an appropriate location or choose a narrower policy; do not remove the restriction without understanding the need.
- **A service cannot write after `ro`:** Identify its required state, cache, or log paths. Keep immutable content read-only and provide narrowly scoped writable locations where feasible.
- **A mount option appears missing:** Confirm the active mount with `findmnt`, not just the fstab entry. Check for duplicate entries, systemd-generated mount units, and namespace differences.
- **A remount fails:** Check that the mount point is correct, the filesystem is active, and no process or filesystem condition prevents the operation. Consult system logs for the specific error.
- **A hardening change breaks boot:** Use a recovery console to restore the backed-up configuration or correct the failing entry, then test the change on a non-production system before retrying.

## Final review checklist

Before considering a mount hardened, confirm that:

- [ ] The filesystem's purpose and users are documented.
- [ ] Each selected option addresses a relevant risk without breaking required behavior.
- [ ] Data-only and user-writable locations have been reviewed for `nodev` and `nosuid`.
- [ ] `noexec` is applied only after checking execution and interpreter-based workflows.
- [ ] Read-only mounts have a clear update and recovery process.
- [ ] Bind mounts and service or container namespaces have been considered.
- [ ] Active options and application behavior have been verified after the change.

## FAQ

### Is `noexec` enough to stop malicious scripts?

No. It blocks direct execution from that mount, but a readable script may still be interpreted by a program on an executable filesystem. Combine mount policy with appropriate permissions, application controls, and other security measures.

### Should I enable `nodev`, `nosuid`, and `noexec` on every filesystem?

No. These options have different effects, and blanket use can disrupt normal operation. Consider them per mount point, based on what the filesystem stores and which workloads use it.

### Do mount options apply inside containers?

Not necessarily in the same way as on the host. Containers and services can have separate mount namespaces and runtime-specific mount settings. Verify the mount from the context where the workload runs.

### Does `ro` make data immutable?

No. It prevents writes through that read-only mount while the restriction is active. A privileged user may remount it, or the same storage may be accessible through another writable path.

## Conclusion

Linux mount options are practical controls for reducing risk on selected filesystems. `nodev` and `nosuid` are often useful for data-only locations, while `noexec` and `ro` require closer attention to application behavior and operating procedures. Choose options based on the role of each mount, test the changes, and verify the active configuration—including bind mounts and namespace-specific views. A carefully scoped policy is more reliable than applying the strictest flags everywhere.
