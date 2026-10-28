# Linux Ownership and Group Permissions

Linux ownership and group permissions determine who can read, change, or execute files and directories. They are a core part of Linux security, but a permission string rarely tells the whole story: supplementary groups, directory traversal, access control lists (ACLs), and the identity of the running process can all affect access.

This guide provides a practical workflow for reviewing and correcting ownership and permissions in an authorized environment. It focuses on inspecting the current state, identifying effective access, applying narrow changes, and validating the result without making broad, risky permission changes.

## How Linux ownership and permissions work

Every filesystem object has a user owner and a group owner. In a long listing, these appear after the permission bits:

```text
-rw-r----- 1 maya analysts 1842 May 12 09:30 report.txt
```

Here, `maya` is the owner and `analysts` is the group. The permission bits are split into three classes:

- **User (owner):** permissions for the file's owner.
- **Group:** permissions for users who match the file's group, including through supplementary group membership.
- **Other:** permissions for everyone else.

For regular files, `r` means read file contents, `w` means modify contents, and `x` means execute the file. For directories, the meanings differ:

- `r` allows listing directory entries.
- `w` allows creating, removing, or renaming entries, subject to other controls.
- `x` allows traversing the directory and accessing entries when their names are known.

A user generally needs execute permission on every directory in a path to reach an item. Directory write permission is particularly important: it can allow removal or replacement of entries even when the files themselves are not writable by that user. Sticky-bit directories, such as `/tmp`, add a restriction on who can remove or rename entries.

### Reading numeric modes

The three basic permission bits are represented by values: read is `4`, write is `2`, and execute is `1`. Add the values for each class to get a numeric mode. For example, `640` means owner read/write (`6`), group read (`4`), and no permissions for other (`0`).

A leading special-bit digit may also appear. For example, `2750` sets the setgid bit on a directory and gives the owner `rwx`, the group `r-x`, and others no access. Special bits affect how access or ownership behaves; they should be reviewed deliberately rather than copied blindly.

## A practical ownership and permissions workflow

Run these checks only on systems and paths you are authorized to inspect. Start with a defined scope, such as an application directory or a data mount, instead of changing permissions across the entire system.

### 1. Identify the path and the relevant identity

Confirm the exact path and the user or service account that needs access. Check the current shell identity and its groups:

```bash
id
id appuser
getent group app-readers
```

`id` without a username reports the identity and groups of the current process. A group added to an account may not be present in already-running sessions or services. When group membership changes, verify using a fresh login or restart the relevant service according to your operational process.

### 2. Inspect ownership and mode bits

Use a detailed listing and `stat` to capture the current state:

```bash
ls -ld /srv/reports /srv/reports/summary.csv
stat -c '%A %a %U:%G %n' /srv/reports /srv/reports/summary.csv
```

The first command shows the directory and file without listing the directory's contents. The `stat` output includes a symbolic mode, numeric mode, owner, group, and path. If the `ls` permissions end in `+`, an ACL may provide additional access rules; inspect it rather than relying on the mode string alone.

For a path that contains several directories, inspect each component:

```bash
namei -l /srv/reports/summary.csv
```

This helps reveal a missing traversal permission on a parent directory. It is also useful when a file's own permissions appear correct but a user still cannot reach it.

### 3. Check ACLs and effective access

Inspect access and default ACLs with:

```bash
getfacl -p /srv/reports /srv/reports/summary.csv
```

An access ACL can grant or restrict access for named users and groups beyond the basic owner/group/other entries. The ACL mask limits the effective permissions of named users, named groups, and the file's group-class entry. As a result, an ACL entry may show `rwx` while its effective permissions are narrower. `getfacl` displays effective permissions when the mask reduces them.

A directory may also have a **default ACL**, which can be inherited by newly created items. Default ACLs matter when a directory is intended to provide consistent shared access. The requested permissions for a new file are still affected by the creating application and its mode; default ACLs do not make a program request permissions it did not ask for.

### 4. Search within the approved scope

Use `find` to locate files or directories with specific permission bits. These GNU `find` examples match entries with a particular bit set:

```bash
find /srv/app -xdev -type f -perm /0002 -print
find /srv/app -xdev -type f -perm /6000 -print
find /srv/app -xdev -type d -perm /0020 -print
```

The first example finds files that are writable by other; the second finds regular files with setuid or setgid bits; the third finds directories with group-write permission. `-xdev` keeps the search on the same filesystem, which can help keep a review within scope. It does not replace careful path selection, and permission errors or separate mounts may require additional checks.

Treat results as review items, not automatic findings. A shared directory may intentionally be group-writable, and a setgid directory may be needed for collaborative work. Confirm the purpose and owner before changing anything.

### 5. Compare observed access with intended access

For each path, record:

- The intended owner and group.
- Which users or service accounts need access.
- Whether they need read, write, or traversal access.
- Whether access should be inherited by new files or directories.
- Whether ACLs or special bits are part of the design.

Access can be affected by more than mode bits. Consider ACLs, every parent directory, supplementary groups, the process's current identity, and application behavior. On systems using mandatory access controls, such as SELinux or AppArmor, those controls can also deny access even when traditional permissions appear sufficient.

## Remediating ownership and permissions safely

Make the smallest change that meets the documented access requirement. If possible, record the original state and use a maintenance or change-control process for sensitive paths.

### Change ownership or group ownership

Use `chown` to set an owner and group, and confirm the result afterward:

```bash
sudo chown appuser:app-readers /srv/reports/summary.csv
stat -c '%A %a %U:%G %n' /srv/reports/summary.csv
```

Avoid adding `-R` as a convenience. Recursive ownership changes can alter files managed by packages, services, or other teams. If a recursive change is necessary and authorized, first review the exact target set and understand how the command handles links and mounted filesystems on your system.

### Set mode bits deliberately

Use a numeric or symbolic mode that matches the access requirement:

```bash
sudo chmod 640 /srv/reports/summary.csv
sudo chmod u=rw,g=r,o= /srv/reports/summary.csv
```

Both examples leave the owner able to read and write, allow the group to read, and grant no permissions to other. Choose modes based on how the file is used; `640` is not a universal secure default. Executable files, configuration files, private keys, and shared data may need different modes.

For a shared directory where members of a group need access, a setgid directory can help new entries inherit the directory's group:

```bash
sudo chown root:app-readers /srv/reports
sudo chmod 2770 /srv/reports
```

The setgid bit on a directory causes new entries created within it to inherit the directory's group on typical Linux filesystems. It does not by itself guarantee that new files are group-writable. The creating program's requested mode and umask still matter.

If consistent inherited access is required, consider a default ACL after reviewing the existing ACL design:

```bash
sudo setfacl -m g:app-readers:rwx /srv/reports
sudo setfacl -d -m g:app-readers:rwx /srv/reports
getfacl -p /srv/reports
```

The first command changes the directory's access ACL; the second sets a default ACL for new entries. Adjust the requested permissions to the actual need, and verify the resulting ACL and effective mask. Be aware that `chmod` can change the ACL mask and therefore affect the effective permissions of ACL entries.

### Handle special bits and ACL cleanup carefully

Setuid and setgid bits on executable files can cause programs to run with elevated user or group identity, so investigate their purpose before altering them. The setgid bit on a directory has a different, commonly used group-inheritance behavior. The sticky bit on a shared directory limits which users can remove or rename entries, but it does not make the directory contents private.

Do not remove ACLs simply to make output look simpler. `setfacl -b` removes an access ACL, while `setfacl -k` removes a directory's default ACL. Use those commands only when you have confirmed the ACL is unnecessary and understand the impact on users and applications.

## Validate the change

After remediation, inspect the object again and test access as the identity that will actually use it:

```bash
stat -c '%A %a %U:%G %n' /srv/reports /srv/reports/summary.csv
getfacl -p /srv/reports /srv/reports/summary.csv
sudo -u appuser -- test -r /srv/reports/summary.csv && echo 'read access works'
sudo -u appuser -- test -w /srv/reports/summary.csv && echo 'write access works'
sudo -u appuser -- test -x /srv/reports && echo 'directory traversal works'
```

These checks test particular access operations, but they do not prove that an application can complete its full workflow. Validate using the real service account, runtime environment, and application where practical. A service may have a different set of groups or additional security controls.

Also verify that users who should not have access remain unable to perform the relevant operation. For changes to shared directories, create a test file as an authorized account in a controlled location and check its group, mode, and ACL. Remove test artifacts when finished.

## Common troubleshooting cases

### The file is readable, but the user gets permission denied

Check every parent directory with `namei -l`. A missing execute bit on a parent directory blocks traversal even if the file grants read access. Then inspect ACLs and confirm the user's effective groups and the identity of the process making the request.

### A group change does not appear to work

Confirm the account's group database entry with `id username` or `getent group groupname`. Then check the running process: group membership is established for a process and may not update in an existing login session or service. Test from a fresh session or restart the service through the approved procedure.

### The mode looks correct, but access is still unexpected

Check for ACL entries and the ACL mask with `getfacl`. Also consider the sticky, setgid, or setuid bits, the umask and application behavior when files are created, and mandatory access controls such as SELinux or AppArmor. Traditional mode bits are only one part of the access decision.

### A new file has the wrong group or permissions

Inspect the parent directory's group and setgid bit, any default ACL, the creating process's group membership, and its umask. A setgid directory influences group inheritance but does not force every new file to be group-writable.

## FAQ

### What is the difference between file ownership and group permissions?

Ownership identifies the user and group associated with an object. The permission bits then define access for the owner, the object's group class, and other users. A user's supplementary group membership can make the group permissions apply even when the user's primary group differs.

### Does `chmod 777` fix Linux permission problems?

It grants read, write, and execute permissions to everyone, which is usually broader than necessary and may expose or allow modification of sensitive data. Diagnose the specific owner, group, path traversal, ACL, and process identity issue, then make a narrow correction.

### Does the setgid bit on a directory make new files group-writable?

No. It helps new entries inherit the directory's group, but the creating program's requested mode and umask affect their permissions. Use and validate a default ACL if the design requires consistent inherited access.

### Why does a user have access through a group they do not own?

The group permission class applies when the user is a member of the file's group, including through supplementary groups. ACLs can also grant access to named users or groups. Use `id` and `getfacl` to investigate both sources.

## Conclusion

A reliable review of Linux ownership and group permissions starts with the intended access, then checks owners, groups, mode bits, ACLs, parent-directory traversal, and the identity of the process involved. Remediate with narrow changes, avoid unreviewed recursive operations, and validate both allowed and disallowed access afterward. This workflow makes permission changes easier to explain, safer to operate, and more consistent with least privilege.
