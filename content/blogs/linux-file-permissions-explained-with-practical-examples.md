# Linux File Permissions Explained With Practical Examples

Linux file permissions determine which users and groups can read, modify, or execute a file—and which can access a directory. Understanding them helps you troubleshoot access errors and reduce the risk of exposing sensitive data or granting excessive access.

This tutorial explains the permission model, demonstrates common commands, and covers special cases such as shared directories, ACLs, and the `umask`. The examples use standard Linux tools and are suitable for an intermediate audience.

## How Linux permissions are organized

Every file and directory has an owner, an associated group, and permission bits for three classes of users:

- **Owner:** The user that owns the object.
- **Group:** The group associated with the object.
- **Others:** All users who are neither the owner nor members of the associated group.

Run `ls -l` to see a file’s permissions and ownership:

```bash
ls -l report.txt
```

Example output:

```text
-rw-r----- 1 maya analysts 2400 Apr 12 10:30 report.txt
```

The first character describes the object type. A `-` means a regular file, while `d` means a directory. The next nine characters are permissions, grouped into owner, group, and others:

```text
-rw-r-----
 owner group others
 rw-   r--   ---
```

In this example, the owner can read and write the file, members of the `analysts` group can read it, and others have no access. The number after the permissions is the hard-link count; the next fields show the owner, group, size, modification time, and name.

## What read, write, and execute mean

The same permission letters have different practical effects on files and directories.

| Permission | Regular file | Directory |
|---|---|---|
| `r` | Read file contents | List directory entries, subject to other permissions |
| `w` | Modify file contents | Create, remove, or rename entries, usually together with `x` |
| `x` | Execute the file, if it is executable and its contents support execution | Search or traverse the directory to access entries by name |

Directory permissions are a frequent source of confusion. A process generally needs `x` on a directory to traverse it. It may need `r` as well to list names. To create or remove entries, it normally needs both `w` and `x` on the containing directory. Removing a file is generally controlled by its parent directory’s permissions, not by the file’s own write bit. The sticky bit adds an important restriction to shared directories, covered below.

A script or program also needs to be executable to run directly, but the execute bit does not make an arbitrary file safe or runnable. The file must have a usable format, and other controls may apply.

## Reading numeric permissions

Linux commonly displays permissions as letters, but `chmod` also accepts octal numbers. Each permission has a value:

- Read (`r`) = `4`
- Write (`w`) = `2`
- Execute (`x`) = `1`

Add the values for each user class. For example, `rwx` is `7`, `rw-` is `6`, and `r-x` is `5`.

```text
-rwxr-x---  =  750
```

That mode means the owner has read, write, and execute permission; the group has read and execute permission; others have none. A common private-file mode is `600` (`rw-------`), while `644` (`rw-r--r--`) allows everyone to read a file but only its owner to modify it.

### Change permissions with `chmod`

Use `chmod` to change permission bits. For example, give the owner read and write access and the group read access:

```bash
chmod 640 report.txt
```

Symbolic modes can be easier to understand when changing only one permission:

```bash
chmod u+x deploy.sh
chmod g-w shared-notes.txt
chmod o-r private-key.txt
```

The letters `u`, `g`, and `o` refer to the owner, group, and others. The operators `+`, `-`, and `=` add, remove, or set permissions. For example, `chmod g=rx directory` sets the group permissions to exactly read and execute.

Before changing permissions on a production path, inspect the target and confirm the intended owner, group, and access. Avoid using `chmod 777` as a general troubleshooting fix: it grants every local user read, write, and execute permissions, which can enable tampering or expose data.

## Change ownership with `chown` and `chgrp`

Permissions are evaluated in relation to a file’s owner and group. Use `chown` to change either or both:

```bash
sudo chown maya report.txt
sudo chown maya:analysts report.txt
```

Use `chgrp` when changing only the group:

```bash
sudo chgrp analysts report.txt
```

Changing ownership usually requires elevated privileges. On shared systems, verify that the destination user and group are correct before making a change. A permission mode that is appropriate for one owner or group may grant access to the wrong people after ownership changes.

## Practical example: secure a private file

Suppose a configuration file contains a credential and should be readable only by its owner. First inspect it:

```bash
ls -l app.conf
stat app.conf
```

Then set the owner and mode to the intended values:

```bash
sudo chown appuser:appgroup app.conf
sudo chmod 600 app.conf
```

The mode `600` grants read and write access to the owner and none to the group or others. Confirm the result:

```bash
stat -c '%A %a %U:%G %n' app.conf
```

File mode alone does not guarantee that the file is protected. Check that untrusted users cannot traverse its parent directories, and consider whether backups, copies, or application logs contain the same data.

## Practical example: set up a team directory

A shared directory can use a group so team members can work on files without making them accessible to every local user. For example, create a directory owned by the `analysts` group and enable the setgid bit:

```bash
sudo chown root:analysts /srv/analysis
sudo chmod 2770 /srv/analysis
```

The `2` in `2770` sets the setgid bit on the directory. New entries created inside it generally inherit the directory’s group, which helps keep team files associated with `analysts`. The `770` portion gives the owner and group full access and denies access to others.

Group inheritance does not automatically guarantee that every new file is group-writable. A process’s `umask` or an ACL can affect the resulting permissions. Confirm the permissions on newly created files and use a default ACL if the team needs consistent inherited access.

## The `umask`: permissions on new files

A process’s `umask` removes permissions from the mode requested when it creates a file or directory. Inspect the current value with:

```bash
umask
```

For a typical `umask` of `0022`, applications commonly request a maximum mode of `666` for regular files and `777` for directories. Applying the mask results in file permissions of `644` and directory permissions of `755`. Executable bits are not normally added to newly created regular files by this calculation; the application’s requested mode matters.

Set a more restrictive mask for the current shell with:

```bash
umask 077
```

With that mask, newly created files and directories will not grant access to the group or others, subject to the mode requested by the creating application. A shell’s `umask` affects processes started from that shell; system services and other sessions may have their own settings.

Directories with a default ACL have additional inheritance behavior. In that case, the ACL and the mode requested by the application influence the resulting access. Do not assume that the simple `requested mode minus umask` model explains every ACL-enabled directory.

## Special permission bits

The leading digit in a four-digit octal mode can represent special bits:

- **Setuid (`4`):** On executable files, a process may run with the file owner’s effective user ID, subject to system behavior and security controls. Setuid programs are security-sensitive. The bit generally has no useful effect on ordinary data files, and Linux does not honor setuid on scripts in the usual way.
- **Setgid (`2`):** On executables, it can affect the process’s effective group ID. On directories, it generally causes new entries to inherit the directory’s group.
- **Sticky (`1`):** On a directory, it restricts who can remove or rename entries. In a sticky directory, users generally may remove or rename only entries they own, the directory itself, or entries they have appropriate privilege to manage.

For example, `/tmp` is commonly configured as mode `1777`: all users can create entries, while the sticky bit limits removal of entries owned by other users. Setuid and setgid bits should be used only when there is a specific, reviewed need.

## Access control lists (ACLs)

Traditional permission bits provide one owner, one group, and an others class. POSIX ACLs can grant access to additional named users or groups. Use `getfacl` to inspect an object:

```bash
getfacl report.txt
```

Use `setfacl` to grant a specific user read access without changing the file’s owner:

```bash
setfacl -m u:lee:r report.txt
```

Remove that named-user entry with:

```bash
setfacl -x u:lee report.txt
```

An ACL may include a **mask**, which limits the effective permissions for named users, named groups, and the owning group entry. As a result, an ACL entry can appear to grant access while the effective access is narrower. `getfacl` reports effective permissions when the mask limits an entry.

To set a default ACL on a directory so new children can inherit access rules, use a command such as:

```bash
setfacl -m d:g:analysts:rwx /srv/analysis
```

Check the resulting ACL and test with the relevant account. ACL support and behavior can depend on the filesystem and mount configuration.

## Recursive changes: proceed carefully

The recursive option can apply a change to every object beneath a directory:

```bash
chmod -R 750 /srv/application
```

This may be wrong for a mixed tree. Regular files may not need execute permission, while directories often need it for traversal. A safer pattern is to handle directories and regular files separately after checking the target tree:

```bash
find /srv/application -type d -exec chmod 750 {} +
find /srv/application -type f -exec chmod 640 {} +
```

These modes are examples, not universal defaults. Applications may need executable scripts, special ownership, or specific group access. Review the file types and application requirements before applying recursive changes, and avoid running broad commands from an uncertain working directory.

## Troubleshooting permission errors

A `Permission denied` message does not always mean the target file’s mode is wrong. Work through the path and the process context:

1. **Check the file and its owner:**
   ```bash
   ls -l /path/to/file
   stat /path/to/file
   ```
2. **Check every directory in the path:**
   ```bash
   namei -l /path/to/file
   ```
   The process needs search (`x`) permission on each parent directory it traverses.
3. **Check supplementary groups:**
   ```bash
   id username
   ```
   A user may need to start a new login session before a newly assigned group appears in the session’s group list.
4. **Check for ACL entries:**
   ```bash
   getfacl /path/to/file
   ```
5. **Check mount and system controls:** A read-only filesystem, an application’s sandbox, or a mandatory access control system such as SELinux or AppArmor may deny an operation even when the basic mode bits look permissive. Review relevant system logs and policy status rather than weakening permissions blindly.

Root and privileged processes can bypass many discretionary permission checks, but not every restriction. Capabilities, mandatory access controls, read-only mounts, immutable attributes, and other system policies may still affect access.

## Defensive recommendations

- Grant the minimum access needed by each user, group, and service.
- Keep secrets and private keys restricted to the intended account; confirm parent-directory access as well as file mode.
- Use dedicated groups and setgid directories for shared work rather than making files writable by everyone.
- Set an appropriate `umask` for interactive sessions and services, and inspect the permissions applications actually create.
- Review ACLs with `getfacl` when ordinary mode bits do not explain access.
- Avoid broad recursive permission changes and never treat `chmod 777` as a safe default.
- Review ownership and permissions after deployments, restores, and changes to service accounts.

## Frequently asked questions

### What does `chmod 755` mean?

The owner has read, write, and execute permissions. The group and others have read and execute permissions, but cannot write. This is commonly suitable for some directories and executable files, but it is not appropriate for every object.

### Why can’t I access a file that has read permission?

You also need permission to traverse its parent directories. An ACL, group membership, mount option, sandbox, or mandatory access control policy may also affect access. Use `namei -l` and `getfacl` to investigate the path and ACLs.

### Does `chmod 777` fix permission problems?

It may remove a discretionary permission barrier, but it also grants all local users write access and can create serious security risks. Identify which user or process needs access, then grant the narrowest suitable permission instead.

### What is the difference between `chmod` and `chown`?

`chmod` changes permission bits. `chown` changes the file’s owner or associated group. Both ownership and permissions influence which users can access an object.

### How do I make new files private by default?

A restrictive `umask`, such as `077`, prevents group and others permissions from being granted by ordinary creation modes in that shell’s child processes. Services and other sessions may use different settings, and default ACLs can affect inheritance, so verify the resulting permissions.

## Conclusion

Linux file permissions provide a flexible way to control access, but the result depends on more than a single `rwx` string. Ownership, directory traversal, groups, ACLs, special bits, the `umask`, and system-level controls can all matter. Inspect the full path and access context before changing permissions, then grant only the access users and services need. Practicing with `ls`, `stat`, `chmod`, `chown`, `namei`, and `getfacl` makes both troubleshooting and defensive administration more reliable.
