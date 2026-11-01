# Linux Sticky Bit and Shared Directory Security

Shared directories make collaboration easier, but they also let users affect files created by others. On Linux, the sticky bit can limit who may delete or rename entries in a directory. It is useful, but it does not replace careful permissions, group design, or access controls.

This guide explains what the sticky bit does, how it fits into shared-directory permissions, and how to assess common configurations and failure modes.

## What the sticky bit does on a directory

When the sticky bit is set on a directory, users with write permission cannot ordinarily delete or rename another user's entries in that directory. Those actions are generally allowed for:

- The owner of the file or directory entry
- The owner of the containing directory
- A privileged process, such as one with the relevant capability

On Linux, the relevant capability for bypassing the sticky-directory ownership check is `CAP_FOWNER`. Root can also perform these operations.

The sticky bit is most familiar from `/tmp`, which is commonly owned by `root` and assigned mode `1777`. The leading `1` sets the sticky bit; the remaining `777` grants read, write, and search permissions to everyone. Because the sticky bit is set, an ordinary user cannot delete another user's files there just because `/tmp` is world-writable.

The sticky bit is a restriction on directory-entry removal and renaming. It does **not** make files private, prevent users from creating entries, or stop someone who has write permission on a file from changing its contents. File permissions, ACLs, and application behavior still matter.

## Read the mode bits correctly

Use `ls -ld` or `stat` to inspect a directory:

```sh
ls -ld /tmp
stat -c '%A %a %U:%G %n' /tmp
```

In symbolic permissions, a lowercase `t` in the final position means the sticky bit is set and the directory's other-execute/search bit is also set. An uppercase `T` means the sticky bit is set but that execute/search bit is not set. For a directory, search permission is needed to access entries by name.

To set the sticky bit without changing the other permission bits, use:

```sh
chmod +t /path/to/shared-directory
```

To set a specific mode, include the special bit in the numeric mode. For example, `1777` is appropriate for a deliberately world-writable temporary directory, but it is not a safe default for every shared directory:

```sh
chmod 1777 /path/to/public-temp
```

Avoid applying `1777` broadly. It permits all users to create entries and read or search the directory, which may expose filenames and create opportunities for unwanted content or resource use.

## Sticky bit, setgid, and ACLs solve different problems

Shared-directory security often depends on several controls working together:

| Control | What it does | What it does not do |
| --- | --- | --- |
| Sticky bit | Restricts which users may remove or rename other users' entries | Does not restrict reading, creating, or modifying file contents |
| Group ownership and mode bits | Grant access to members of a group | Do not, by themselves, prevent group members from deleting each other's entries |
| Setgid on a directory | Causes new entries to inherit the directory's group on Linux | Does not guarantee new files are group-writable |
| Default ACL | Sets inherited access rules for new entries | Does not override restrictive application modes or eliminate the need to review effective permissions |

A common team-workspace pattern is a directory owned by a collaboration group, with setgid and group write/search permissions. Add the sticky bit if group members should not remove or rename one another's entries. For example, a mode of `3770` sets both setgid and sticky, gives the owner and group full directory access, and denies access to others:

```sh
sudo chown root:project-team /srv/project-drop
sudo chmod 3770 /srv/project-drop
```

This is a starting point, not a universal policy. In a collaborative editing directory, users may need to modify one another's files, and the sticky bit does not stop that. In a private team workspace, access for `others` may need to remain disabled, as in this example.

### Group inheritance is not the same as group write access

The setgid bit helps new files and subdirectories inherit the directory's group. But a new file's mode is also affected by the creating program, its requested permissions, and the process umask. A setgid directory alone does not ensure every new file is writable by the team.

Where appropriate, a default ACL can provide inherited group access. For example:

```sh
sudo setfacl -m g:project-team:rwx /srv/project-drop
sudo setfacl -m d:g:project-team:rwx /srv/project-drop
getfacl /srv/project-drop
```

Review the resulting ACL rather than assuming that the command guarantees a particular effective permission. The ACL mask can limit effective rights, and programs may create files with restrictive requested modes. Test with the actual tools and workflows the team uses.

## Assess a shared directory step by step

### 1. Confirm the directory and its parent path

Check the directory's owner, group, mode, and ACL:

```sh
namei -l /srv/project-drop
stat -c '%A %a %U:%G %n' /srv/project-drop
getfacl /srv/project-drop
```

`namei -l` helps reveal restrictive or unexpectedly permissive permissions on parent directories. Access depends on the full path, not only the final directory. Also confirm that the path is the expected mount or filesystem; container mount namespaces and bind mounts can make the view differ between hosts or processes.

### 2. Identify who can create, remove, and access entries

Check which users are in the directory's group and whether the directory grants write and search access to the intended users. For directories, write permission allows creating and removing entries, while search permission allows traversing and looking up names. Review ACLs as well as traditional mode bits.

If the directory is intended for a defined team, verify that access is not accidentally granted to `others` or an overly broad group. Consider whether filenames themselves contain sensitive information: listing a directory requires read permission, but search permission and other controls affect what a user can do with known names.

### 3. Check whether deletion protection matches the policy

If users should not remove or rename entries owned by other users, verify that the sticky bit is set. It can be enabled without changing the other mode bits:

```sh
sudo chmod +t /srv/project-drop
ls -ld /srv/project-drop
```

Then verify the owner and group still match the intended design. Setting the sticky bit does not make an otherwise overly permissive directory private.

### 4. Test with separate unprivileged accounts

A controlled test can confirm the effective behavior more reliably than reading the mode alone. Use test accounts and disposable files, not production data. For example, with a directory configured for both users:

```sh
sudo -u alice touch /srv/project-drop/alice-test
sudo -u bob rm /srv/project-drop/alice-test
```

With the sticky bit set, Bob's removal should ordinarily be denied if Bob is neither the file owner nor the directory owner and has no privilege that bypasses the check. Alice, as the file owner, should be able to remove her test entry. Clean up the test file afterward.

Also test the operations your workflow needs. A failed `rm` test does not establish that file contents are protected: if Bob can write the file, he may still be able to change it. For a meaningful assessment, use the same groups, ACLs, umask, and applications that users will have in practice.

### 5. Look for risky writable directories

This command finds directories on the current filesystem that are writable by `others` but do not have the sticky bit:

```sh
find / -xdev -type d -perm -0002 ! -perm -1000 -print 2>/dev/null
```

Review each result in context before changing it. Some directories may be intentional, and a broad permission change can disrupt services. This search does not find every risky configuration: group-writable directories, ACL grants, other mounted filesystems, and permissions inside containers require separate review.

## Common failure modes

### Assuming sticky protects file contents

The sticky bit governs removal and renaming of directory entries; it is not a read-only or file-integrity control. If a file is group-writable or world-writable, another user with the relevant file access may be able to modify it. Set file permissions and ACLs according to whether collaboration means sharing, editing, or merely dropping files.

### Using `1777` for every team directory

A world-writable directory with sticky protection is useful for certain temporary-use cases, but it still allows anyone to create entries and may reveal names. Prefer a dedicated group and a least-privilege mode when access should be limited to team members.

### Setting setgid but forgetting effective file permissions

Setgid can provide group inheritance, but the resulting file may not be group-writable. Check ACLs, masks, umasks, application behavior, and actual test files rather than inferring access from the directory mode alone.

### Treating sticky as protection against privileged users

The sticky bit is not a boundary against root or processes with the relevant privilege. It also does not protect against a compromised account that owns a file or the directory. Restrict privileged access and secure the applications and accounts that write to shared locations.

### Relying on a shared temporary directory for sensitive data

Do not place sensitive files in a shared directory merely because it has the sticky bit. Use private per-user or per-job temporary directories with restrictive permissions, such as directories created safely by `mktemp -d`, and ensure cleanup and application behavior are appropriate. A sticky bit does not prevent filename exposure, content access permitted by file modes, or resource exhaustion from excessive entries.

## Practical safeguards

- Grant directory access to a specific group or ACL where possible; avoid unnecessary world access.
- Use setgid when group inheritance is part of the design, and test whether new files receive the required effective permissions.
- Use the sticky bit when users share a writable directory but should not remove or rename one another's entries.
- Set file permissions and ACLs separately to control reading and modification of file contents.
- Audit parent directories, mount points, ACLs, group membership, and service accounts—not just the final directory's mode.
- Test create, list, read, modify, rename, and delete actions with representative unprivileged users.
- Monitor and clean temporary locations according to the system's operational requirements; sticky permissions are not a storage quota or cleanup policy.

## FAQ

### Does the sticky bit stop users from deleting their own files?

No. A file's owner can ordinarily remove or rename their own entry in a sticky directory if they have the necessary directory permissions. The directory owner and privileged processes can also do so.

### Does the sticky bit prevent users from editing another user's file?

No. It restricts removal and renaming of entries in the directory. Whether someone can read or modify a file's contents depends on that file's permissions, ACLs, and any other applicable access controls.

### Is setgid a replacement for the sticky bit?

No. Setgid on a directory helps new entries inherit its group. The sticky bit restricts who may remove or rename other users' entries. A shared workspace may use both, depending on its collaboration policy.

### Should every shared directory use mode `1777`?

No. That mode grants access to everyone and is appropriate only when a directory is intentionally world-writable, such as a properly configured temporary location. Team directories often need restricted group or ACL access instead.

## Conclusion

The Linux sticky bit is a focused safeguard for writable directories: it helps prevent ordinary users from deleting or renaming one another's entries. It does not control file contents, provide privacy, or replace group permissions and ACLs. Assess the full path and effective access, choose a directory design that matches the team's workflow, and validate it with tests run as representative unprivileged users.
