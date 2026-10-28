# Linux umask and Secure Default Permissions

A newly created file or directory does not automatically receive one universal set of permissions. The creating application requests an initial mode, and Linux applies the process’s **umask** to remove permissions from that request. Choosing a suitable umask helps reduce accidental exposure, but it is only one part of a permissions strategy: it does not change existing files, override every access-control mechanism, or guarantee that an application creates files securely.

This guide explains how `umask` works, how to select a value for personal or shared environments, and how to configure and verify secure default permissions on Linux.

## What is umask?

The umask is a per-process setting that controls which permission bits are **removed** when a process creates a file or directory. A process inherits its umask from its parent, so a shell’s setting is normally passed to commands launched from that shell. Services and other session types may start with different settings.

A useful way to think about the calculation is:

```text
resulting permissions = requested permissions & ~umask
```

The umask can take permissions away; it cannot add permissions that the application did not request. For example, a typical file-creation request is `0666` (read and write for owner, group, and others, with no execute bits), while a typical directory request is `0777`. The umask filters those requested permissions. Applications can request other modes, so these are common examples rather than a guarantee for every program.

The leading zero in values such as `0027` indicates an octal number. The digits correspond to the owner, group, and others permission classes. In this context, a set bit in the umask means that the corresponding permission is removed from the requested mode.

## Common umask values and their effects

Here is how several common values affect typical creation modes:

| Umask | Typical new-file mode (`0666`) | Typical new-directory mode (`0777`) | Common use |
|---|---:|---:|---|
| `0022` | `0644` | `0755` | General default that denies write access to group and others |
| `0027` | `0640` | `0750` | Owner access and group access, with no permissions for others |
| `0077` | `0600` | `0700` | Private files and directories for the owner |
| `0002` | `0664` | `0775` | Group collaboration, when shared access is intentional |

The file modes shown assume the application requested `0666`; the directory modes assume it requested `0777`. For example, with a umask of `0027`, a typical regular file is created as `0640`, and a typical directory as `0750`.

A `0002` umask can be useful for a team, but it makes group write access possible for newly created objects that request it. It does not, by itself, ensure that files belong to the intended group or that group members have access to a shared directory. Group ownership, directory permissions, and sometimes the setgid bit need to be configured as well.

## Why secure default permissions matter

A permissive umask can expose newly created data to other local users. Depending on the application and requested mode, that could include logs, temporary output, configuration files, source code, or data exports. In shared environments, unintended write permissions can also allow other users to alter files or directories.

A restrictive umask reduces some of these risks by default. It is particularly useful when programs create files without explicitly selecting a narrower mode. However, it is not a complete security boundary:

- It affects permissions at creation time, not permissions on existing objects.
- It only removes permissions requested by the creating application.
- Access can also be affected by access-control lists (ACLs), ownership, group membership, mount options, and application behavior.
- A process can change its own umask, and another process may use an explicit permission change after creating an object.

Treat umask as a defensive default, not a substitute for reviewing sensitive data access or setting application-specific permissions.

## Choosing a secure default

The right value depends on who should be able to access newly created data.

### Personal accounts and sensitive data

Use `0077` when new files and directories should be accessible only to the account owner by default. This is a straightforward choice for personal workstations, accounts handling sensitive data, and environments where sharing should happen only through an explicit permission change.

### Systems with limited group sharing

Use `0027` when group members may need read or directory access, but users outside the owner’s group should not have access. This can suit managed multi-user systems, provided group membership is controlled and the intended access model is clear.

### Collaborative directories

A value such as `0002` may be appropriate when group collaboration is a deliberate requirement. Pair it with suitable group ownership and directory configuration. For example, the setgid bit on a shared directory can help new entries inherit that directory’s group:

```sh
sudo install -d -o root -g project -m 2770 /srv/project
```

This creates a directory owned by `root:project` with owner and group access and the setgid bit. Members still need to belong to the `project` group, and the directory’s access policy should match the organization’s needs. A collaborative umask should not be used as a shortcut for defining group access.

## Set and inspect umask in a shell

Run `umask` without arguments to display the current value in the current shell:

```sh
umask
```

Set a value for the current shell and its subsequently launched child processes with the shell builtin:

```sh
umask 077
```

To check the result in a temporary location, run:

```sh
umask 027
workdir=$(mktemp -d)
cd "$workdir" || exit 1
touch test-file
mkdir test-dir
stat -c '%a %n' test-file test-dir
```

On a typical GNU/Linux system, this reports `640` for `test-file` and `750` for `test-dir`. If the output differs, check whether the application requested different modes or whether a default ACL applies. Remove the temporary directory afterward if it is no longer needed:

```sh
cd /
rm -rf -- "$workdir"
```

The `stat -c` option is provided by GNU `stat`; other Unix-like systems may use different `stat` syntax. Some shells also support `umask -S` to display a symbolic representation, but the exact output and supported options can vary by shell.

## Configure umask for interactive and login sessions

A command entered at a prompt changes only that shell’s umask. To make a setting persistent, configure it in the mechanism that starts the relevant user sessions. For an individual account, a shell startup file such as `~/.profile` may be appropriate for login sessions:

```sh
umask 077
```

The right file depends on the shell, distribution, and whether the session is a login shell, an interactive non-login shell, or a graphical session. System-wide shell files may also differ in which sessions read them. Confirm the setting in the actual session types you use instead of assuming one startup file covers every process.

Avoid adding the same setting to many startup files without understanding how they are loaded. That can make the policy harder to maintain and troubleshoot. After making a change, start a new session and check its effective value with `umask`.

## Configure umask for systemd services

A user’s shell umask is not a reliable way to configure a system service. For a systemd service, a unit can set its own umask with `UMask=`. For example, an administrator can add a drop-in override:

```ini
[Service]
UMask=0077
```

Create or edit the service’s drop-in using the system’s normal administrative process, then reload systemd’s unit configuration and restart the service for the change to take effect. Confirm the service’s effective behavior by examining files it creates and the service configuration. Use a value appropriate to the service: a service that intentionally creates group-readable shared data may need a different policy.

Other service managers, schedulers, containers, and login mechanisms have their own configuration paths. Set umask where the process is launched, and test the resulting permissions rather than assuming an interactive shell’s value applies.

## Umask, ACLs, and other permission controls

On Linux, a directory may have a default ACL that is inherited by new files and subdirectories. When a parent directory has a default ACL, the ACL inheritance rules govern the new object’s permissions; the umask is not applied in the usual way. The permissions requested by the creating application still constrain the inherited ACL. This means a restrictive umask alone may not produce the result you expect in a directory with a default ACL.

Inspect ACLs with `getfacl` when available:

```sh
getfacl /path/to/directory
```

A default ACL is shown with entries prefixed by `default:`. Review both the ACL and the object’s mode bits when investigating access. Also account for ownership, group membership, special permission bits, and any application-specific access controls.

## Troubleshooting unexpected permissions

If new files or directories are more or less accessible than expected, check the following:

1. **Inspect the creating process’s umask.** Run `umask` in the relevant shell or examine the service’s configuration. A different process may have a different inherited value.
2. **Check the requested creation mode.** The application may request a mode other than the common `0666` for files or `0777` for directories. It may also change permissions after creation.
3. **Check for default ACLs.** Use `getfacl` on the parent directory and review inherited entries.
4. **Verify the actual object.** Use `stat` and, where relevant, `getfacl` rather than inferring permissions from configuration alone.
5. **Remember that existing objects are unchanged.** Changing umask affects future creation; use a carefully reviewed `chmod` or ACL update to correct existing permissions.
6. **Check the session or service startup path.** A setting in a shell profile may not affect a graphical application, scheduled job, or system service.

When adjusting existing permissions recursively, avoid applying a single mode indiscriminately to files and directories. Directories need execute permission for traversal, while regular data files often should not be executable. Review the target and test changes before applying them broadly.

## Practical recommendations

- Choose a umask based on an explicit access policy: `0077` for owner-only defaults, `0027` for limited group access, or `0002` when collaboration is intentional.
- Configure the setting in the relevant session or service startup mechanism, not only in one interactive shell.
- Test representative files and directories and inspect their actual modes and ACLs.
- Use directory ownership, group membership, setgid directories, and ACLs when shared access is required.
- Set application-specific permissions for sensitive files; do not rely on umask as the only safeguard.
- Review existing data separately, because changing umask does not alter files that already exist.

## FAQ

### Is `umask 022` secure?

It may be suitable for systems where newly created files should be readable by other local users but not writable by them. Typical file and directory modes are `0644` and `0755`. For private data or accounts where other users should have no default access, `0077` is more restrictive.

### Can umask make a new file executable?

No. Umask only removes requested permissions. A regular file created with the common `0666` mode has no execute bits to begin with, so changing the umask cannot add them. An application that requests execute permissions may receive them unless the umask removes them.

### Does changing umask fix permissions on existing files?

No. Umask affects future file and directory creation by processes using that setting. Existing objects must be reviewed and corrected separately with appropriate permission or ACL changes.

### Does umask always control permissions when a default ACL is present?

No. On Linux, when a parent directory has a default ACL, ACL inheritance is used instead of applying the umask in the usual way. Inspect the parent ACL as well as the new object’s permissions to understand the result.

## Conclusion

Linux umask provides a simple way to remove unwanted permissions from newly created files and directories. The right value depends on whether access should be private, limited to a group, or intentionally collaborative. Set the policy where each relevant process starts, verify the permissions it actually produces, and account for ACLs and application behavior. Used alongside sound ownership and access-control practices, a suitable umask helps establish safer default permissions without being mistaken for a complete security control.
