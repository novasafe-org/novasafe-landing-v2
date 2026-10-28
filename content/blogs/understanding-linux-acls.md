# Understanding Linux ACLs

Linux access control lists (ACLs) let administrators grant file and directory permissions to specific users or groups without changing ownership or relying only on the traditional owner-group-other permission model. Used thoughtfully, they can solve practical access problems. Used carelessly, they can create permissions that are difficult to see, explain, and audit.

This guide explains how Linux ACLs work, how to assess whether they fit a need, and how to inspect, apply, test, and troubleshoot them. The goal is proportionate access: grant only what a user or service needs, then verify the effective permissions.

## What are Linux ACLs?

Traditional Unix permissions assign read (`r`), write (`w`), and execute (`x`) permissions to three classes: the file owner, the owning group, and everyone else. For example:

```text
-rw-r----- 1 alice finance 2048 Jul 10 09:00 report.csv
```

Here, the owner can read and write, members of the owning group can read, and other users have no permissions.

Linux ACLs extend this model with entries for additional named users and groups. An ACL can grant a particular user access without making that user the file owner or adding them to a broad group. ACLs also support default entries on directories, which can provide permissions to objects created beneath them.

ACLs are an extension to discretionary access control, not a replacement for every Linux security mechanism. They do not override mandatory access controls such as SELinux or AppArmor, and they do not compensate for insecure application design or excessive privileges elsewhere.

## Access ACLs and default ACLs

An **access ACL** controls access to an existing file or directory. A **default ACL** can be set on a directory to influence the access ACL of new files and subdirectories created inside it. Default ACLs apply to directories, not directly to regular files.

A directory may have both. Its access ACL controls access to the directory itself; its default ACL provides inheritance rules for new children. Inheritance is affected by the permissions requested by the creating application, so a default ACL does not guarantee that every new object will receive every permission listed in the parent’s default ACL.

## How ACL permission checks work

A POSIX ACL can contain these entries:

- `user::` — permissions for the file owner.
- `user:NAME:` — permissions for a named user.
- `group::` — permissions for the owning group.
- `group:NAME:` — permissions for a named group.
- `mask::` — maximum effective permissions for named users, named groups, and the owning group entry.
- `other::` — permissions for users who do not match another applicable entry.

The mask is an important source of confusion. It does **not** limit the owner or `other` entry. It does limit the effective permissions of named user entries, named group entries, and the owning group entry. A permission shown on an entry may therefore be more permissive than the permission a user actually receives.

In general, Linux checks the owner entry first. If the process matches a named user entry, that entry applies, subject to the mask; matching group permissions are not added to it. Otherwise, Linux checks applicable group entries. If multiple group entries match, their permissions are combined and limited by the mask. If no owner, named-user, or group entry applies, the `other` entry is used.

For directories, permissions have practical consequences beyond file access:

- `r` allows listing directory names.
- `w` allows creating, removing, or renaming entries, usually in combination with `x`.
- `x` allows searching or traversing the directory when the user knows a name.

A user needs search (`x`) permission on every directory in a path to reach an item inside it. Granting access to a file alone may not be enough.

## Inspecting ACLs

Use `getfacl` to display an object’s ACL:

```bash
getfacl /srv/finance/report.csv
```

A result might look like this:

```text
# file: srv/finance/report.csv
# owner: alice
# group: finance
user::rw-
user:bob:r--
group::r--
mask::r--
other::---
```

In this example, Bob has read access. The mask allows read access, so his effective permission is `r--`. If the mask were `---`, Bob’s entry would remain visible but would provide no effective permissions.

The `ls -l` output can indicate that an ACL is present with a trailing `+`:

```bash
ls -l /srv/finance/report.csv
```

Treat this as a clue, not a complete ACL review. Use `getfacl` to see the entries and any effective-permission comments. To inspect the ACLs along a path, including parent directories, you can use:

```bash
namei -l /srv/finance/report.csv
getfacl /srv /srv/finance /srv/finance/report.csv
```

`namei` shows path components and their basic permissions; `getfacl` shows ACL entries. Together, they help identify where traversal is blocked or broader than intended.

## Adding a targeted ACL

Suppose Bob needs read-only access to a single report, but should not be added to the finance group. First inspect the current permissions, then add a named-user entry:

```bash
getfacl /srv/finance/report.csv
sudo setfacl -m u:bob:r-- /srv/finance/report.csv
getfacl /srv/finance/report.csv
```

For a directory, a user who must list its contents and access items by name usually needs both read and search permissions:

```bash
sudo setfacl -m u:bob:rx /srv/finance
```

Do not grant directory write permission unless the user needs to create, remove, or rename entries there. Also check every parent directory in the path: Bob needs search permission on each one to reach the target.

To add a named group entry, use `g:GROUP:PERMISSIONS`:

```bash
sudo setfacl -m g:auditors:r-- /srv/finance/report.csv
```

Review the result with `getfacl`. Adding an entry can change the ACL mask, so check both the listed permissions and the effective permissions.

## Setting a default ACL for new directory contents

If a team needs consistent access to files created in a shared directory, a default ACL may help. For example, to provide the `auditors` group with read and search access to new directories and read access to new files, set a default group entry on the shared directory:

```bash
sudo setfacl -m d:g:auditors:rx /srv/finance
getfacl /srv/finance
```

Review the directory’s default ACL and test with representative file-creation workflows. New objects inherit permissions according to the default ACL and the mode requested by the creating application; applications may request restrictive modes, so verify the actual result. A default ACL does not necessarily update existing files and subdirectories. Plan separate changes for existing content if required, and avoid recursive changes until you understand their scope.

## Understanding and managing the ACL mask

The mask determines the maximum effective permission for the group class of an extended ACL. You can set it explicitly, but changing it can affect several entries at once:

```bash
sudo setfacl -m m::r-- /srv/finance/report.csv
getfacl /srv/finance/report.csv
```

After setting a mask, check the `#effective:` comments from `getfacl`. A mask that is too restrictive can silently reduce access for several entries; one that is too permissive can make existing entries effective more broadly than expected.

The `chmod` command can also affect ACL permissions. On Linux, the group permission bits shown by `ls -l` correspond to the ACL mask when an extended ACL is present. A later `chmod` may therefore change effective permissions for named users and groups. After changing permissions with `chmod`, inspect the ACL again instead of assuming named entries are unchanged.

## Removing ACL entries safely

Remove one named user entry with `-x`:

```bash
sudo setfacl -x u:bob /srv/finance/report.csv
```

Remove a named group entry similarly:

```bash
sudo setfacl -x g:auditors /srv/finance/report.csv
```

To remove extended access ACL entries and return an object to the base owner-group-other ACL, use:

```bash
sudo setfacl -b /srv/finance/report.csv
```

To remove default ACL entries from a directory, use:

```bash
sudo setfacl -k /srv/finance
```

These operations can remove legitimate access arrangements. Inspect first, retain a record of the existing ACL where appropriate, and confirm the result afterward. For review or recovery, `getfacl` output can be saved and later supplied to `setfacl --restore`:

```bash
getfacl -R /srv/finance > finance-acls.txt
```

A recursive snapshot is useful only if stored and handled securely; ACL output may reveal usernames, group names, and directory structure.

## Testing effective access

An ACL listing is not a substitute for testing access as the intended account. Where permitted, run a check as that user:

```bash
sudo -u bob test -r /srv/finance/report.csv && echo "read allowed" || echo "read denied"
sudo -u bob test -w /srv/finance/report.csv && echo "write allowed" || echo "write denied"
```

For directory traversal and listing, test the relevant operations as well:

```bash
sudo -u bob ls /srv/finance
sudo -u bob stat /srv/finance/report.csv
```

The exact test should reflect the application’s real behavior. A command run as the user may still differ from a service process because of its supplementary groups, namespace, mount, or mandatory access-control context. When possible, test through the same service account and execution environment used in production.

## Common ACL failure modes

### 1. Granting file access but not directory traversal

A user may have read permission on a file but still be unable to reach it because a parent directory lacks search permission. Inspect each path component and grant only the traversal permissions required.

### 2. Misreading the mask

A named entry such as `user:bob:rwx` does not guarantee effective write or execute access. Check `mask::` and the effective-permission annotations in `getfacl`.

### 3. Assuming `chmod` leaves ACLs untouched

A permission change can update the ACL mask, changing effective access for named users and groups. Re-run `getfacl` after using `chmod` on an ACL-managed object.

### 4. Expecting default ACLs to fix existing content

Default ACLs affect newly created objects, not all existing files and directories. Inventory and handle existing content separately, with a scoped plan.

### 5. Applying recursive ACL changes without reviewing the target

A recursive command can change permissions across many files and directories, including objects with different roles or owners. Start with a read-only inventory, define the intended scope, test on a representative subset, and verify the result. Be especially careful with recursive default ACL changes, which should be applied to the intended directories rather than indiscriminately to regular files.

### 6. Overlooking file-system and policy constraints

ACL behavior depends on the file system and how it is mounted. Network file systems and containers can add their own identity-mapping or permission considerations. SELinux or AppArmor policy may also deny an operation even when the POSIX ACL permits it. Check the file system, mount options, service identity, and relevant security policy when results do not match expectations.

### 7. Letting exceptions become permanent

One-off ACL grants can accumulate and become hard to explain. Assign an owner to each exception, document its purpose and expiry or review date, and remove it when the need ends.

## A proportionate ACL assessment workflow

Before applying Linux ACLs, use a short risk assessment to establish whether an exception is justified and manageable:

1. **Identify the resource and data sensitivity.** Is it a public file, internal working data, or sensitive information? More sensitive data calls for tighter scope and stronger review.
2. **Identify the principal.** Grant access to a specific service or well-managed group where possible. Avoid broad groups or individual exceptions that have no clear owner.
3. **Define the minimum operation.** Decide whether the principal needs to read, write, list, traverse, create, or delete. Do not grant `rwx` by default.
4. **Check existing controls.** Review ownership, group membership, ACLs, parent-directory traversal, application behavior, and mandatory access controls before adding another rule.
5. **Apply the narrowest change.** Prefer one object or a clearly bounded directory tree. Use default ACLs only when future children need a consistent rule.
6. **Verify effective access.** Inspect with `getfacl`, check the mask, and test both allowed and denied operations as the intended identity.
7. **Record and review.** Document the reason, owner, scope, and review date. Reassess the ACL when users, services, or data sensitivity change.

This approach helps teams judge whether ACLs are the simplest suitable control or whether ownership, a dedicated group, or another access-management design would be easier to maintain.

## FAQ

### Do Linux ACLs replace traditional file permissions?

No. ACLs extend the traditional owner-group-other model. The familiar permission bits remain relevant, and the group bits represent the ACL mask when an extended ACL is present. Use `getfacl` for a full view.

### How can I tell whether a file has an ACL?

`ls -l` may show a `+` after the permission string, but it does not display the complete ACL. Run `getfacl FILE` to inspect entries and effective permissions.

### Why does a named user entry not grant the access it appears to show?

The ACL mask may limit that entry. A user may also lack search permission on a parent directory, or another security layer such as SELinux may deny the operation. Inspect the mask and path, then test as the relevant user or service.

### Do default ACLs change files that already exist?

No. Default ACLs on a directory are inheritance rules for new children. Existing files and subdirectories need a separate, carefully scoped review and update if they also require a change.

### Are ACLs always better than adding a user to a group?

No. ACLs are useful for narrow exceptions, but a well-scoped group can be easier to understand and maintain when access is shared by a stable team. Choose the approach that keeps permissions least-privileged, visible, and reviewable.

## Conclusion

Linux ACLs provide a flexible way to grant file and directory access beyond basic ownership and group permissions. Their flexibility comes with responsibilities: understand the mask, account for directory traversal and inheritance, check how `chmod` affects the result, and test access as the intended identity.

Treat every ACL as an access-control decision that needs a defined purpose, narrow scope, and review owner. With those safeguards, teams can use ACLs to address real sharing needs without allowing exceptions to become invisible or overbroad.
