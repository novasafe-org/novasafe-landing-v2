# Linux Symlink Race Conditions Explained

A program checks that a path points to a safe file, then opens that path moments later. If an attacker can change the path in between, the program may open something else—potentially a sensitive file or a device. This is a **time-of-check-to-time-of-use (TOCTOU) race**, and symbolic links are one way to exploit it.

Linux provides several ways to reduce this risk, but no single flag is right for every situation. The best defense depends on whether the program is creating a new file, opening an existing one, accepting paths from an untrusted user, or intentionally supporting symlinks. This guide explains the race, compares the main approaches, and offers criteria for choosing a defensive design.

## What is a symlink race condition?

A symbolic link, or symlink, is a filesystem object that refers to another path. When an application follows a symlink, the target path is resolved during a filesystem operation such as `open()`.

A race condition occurs when an attacker can change a pathname after a program checks it but before the program uses it. For example, vulnerable logic might:

1. Check that `/tmp/app-output` is a regular file or does not already exist.
2. Later open `/tmp/app-output` for writing.

If an attacker can modify the containing directory, they may replace the path between those operations with a symlink to a different file. The later open may follow the new link. If the program has elevated privileges, this can turn a writable temporary-file workflow into an unauthorized write elsewhere.

The core problem is that a pathname is not a stable reference to a filesystem object. Its meaning can change as directory entries change. A check on a path does not automatically protect a later operation on that path.

## When the risk matters

Symlink races are most relevant when all of these conditions are present:

- A program performs a filesystem operation using a path that an attacker can influence or alter.
- The attacker can modify the relevant directory entry or a component of the path.
- The program separates validation from use, leaving an opportunity to change the path.
- The operation has a security impact, such as writing, truncating, changing permissions, or reading sensitive data.

The risk is especially important for privileged programs, including services running as root, set-user-ID programs, installers, and maintenance scripts. However, an unprivileged application can also be affected if it handles another user’s files or operates in a shared directory.

A symlink by itself is not a vulnerability. Symlinks are a normal part of Linux filesystems. The issue is unsafe path handling in a context where an attacker can influence resolution.

## A simplified attack timeline

Suppose a privileged helper writes a report to a predictable name in a directory writable by an attacker:

```text
Helper: check that /tmp/report is safe
Attacker: replace /tmp/report with a symlink to another path
Helper: open /tmp/report and write the report
```

The helper’s check may have been correct when it ran. The failure is relying on that earlier result after the attacker has had a chance to change the directory entry. Repeating the check does not solve the underlying problem if the path can change again before use.

## Defenses: choose based on the operation

### 1. Create a new file atomically with exclusive creation

When the requirement is “create this file only if it does not already exist,” use an atomic create operation rather than checking first. In C, `open()` or `openat()` with `O_CREAT | O_EXCL` fails if the final path already exists. For this combination, the operation does not follow a symlink at the final path; an existing symlink causes the create to fail.

A directory file descriptor is useful when the parent directory is already trusted or has been opened safely:

```c
#define _GNU_SOURCE
#include <fcntl.h>
#include <unistd.h>

int create_report(int dirfd)
{
    int fd = openat(dirfd, "report.new",
                    O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW,
                    0600);
    if (fd == -1)
        return -1;

    /* Write using fd. Do not close it and reopen the pathname. */
    return fd;
}
```

The mode `0600` requests owner-only access; the process umask can further restrict permissions. `O_EXCL` is the key protection against an attacker pre-creating the name. `O_NOFOLLOW` makes the intent explicit for the final component, though exclusive creation already rejects an existing final symlink in this pattern.

This approach is not for safely opening an existing file. It also does not, by itself, make an attacker-controlled parent directory safe. Use a trusted directory or anchor operations to a directory descriptor that was opened and verified appropriately.

For temporary files, use a well-designed temporary-file API such as `mkstemp()` rather than inventing a predictable filename and checking whether it exists. Keep using the returned file descriptor; do not close it and reopen the generated pathname.

### 2. Open relative to a directory file descriptor

`openat()` and related interfaces accept a directory file descriptor and a relative path. This helps avoid repeatedly resolving an absolute path from the process’s current working directory and gives the program a stable reference to the starting directory.

A directory descriptor is not a universal path-safety guarantee. If the relative path contains multiple components, symlinks in those components may still be followed unless the application restricts resolution. Likewise, an attacker may still change entries within a directory they can write to. Combine directory-relative operations with appropriate flags and directory permissions.

A common safe pattern is to open a trusted directory once, retain its descriptor, and perform later operations relative to it. Validate that user input is an expected leaf name if the design only allows a single filename. Do not assume that rejecting `..` alone makes arbitrary path resolution safe.

### 3. Refuse symlink following for the final component

`O_NOFOLLOW` makes an open fail if the final component is a symlink. It is useful when the program must open a specific path but must not follow a link at the end of it.

There is an important limitation: on its own, `O_NOFOLLOW` applies to the final component, not necessarily every earlier component in a multi-component path. For example, a path can contain a symlinked directory before the final filename. If the security policy forbids symlinks anywhere in the path, use a mechanism that enforces that broader policy, or resolve each component under carefully controlled rules.

Also consider what happens after opening. Perform operations on the returned file descriptor, not by checking the path and then reopening it. If the program needs a regular file, inspect the opened object with `fstat()` and reject unexpected file types. That check describes the object already opened; it does not make opening an attacker-controlled device or other special file harmless. Where possible, operate in a directory whose contents and permissions are controlled.

### 4. Constrain path resolution with `openat2()`

On Linux systems that support it, `openat2()` offers resolution controls that can express stronger policies for paths relative to a directory descriptor. For example:

- `RESOLVE_BENEATH` prevents resolution from escaping above the supplied starting directory.
- `RESOLVE_IN_ROOT` treats the supplied directory descriptor as a temporary root for resolution. It is an alternative to `RESOLVE_BENEATH`; do not combine the two.
- `RESOLVE_NO_SYMLINKS` rejects symlink traversal throughout the path.
- `RESOLVE_NO_MAGICLINKS` rejects magic links, such as certain entries under `/proc`.

These controls are valuable when accepting multi-component paths from less-trusted sources. They do not replace sensible permissions, file-type checks, or careful handling of the returned descriptor. They also require a sufficiently recent Linux kernel and a program that handles unsupported-kernel or unsupported-flag errors safely. If the application must run on older systems, define and test a fallback policy rather than silently dropping the protections.

### 5. Use atomic replacement when updating a file

If the goal is to replace a file’s contents, one robust design is to create a new file securely in the destination directory, write and close it, then rename it into place. A rename within the same filesystem is atomic as a namespace operation: observers see the old name or the new name rather than a partially renamed entry.

This does not automatically solve every problem. The temporary file must be created safely, the destination directory must be appropriate for the operation, and permissions and ownership must be set deliberately. If durability across a crash matters, the application may also need to sync the file and directory. Atomic visibility and crash durability are different properties.

## Comparing the approaches

| Approach | Best fit | Main tradeoff |
|---|---|---|
| `O_CREAT | O_EXCL` | Creating a new file that must not already exist | Does not open an existing file or secure an untrusted parent directory |
| `mkstemp()` | Creating a unique temporary file | The returned descriptor must be retained; do not reopen by name |
| `openat()` with a directory descriptor | Anchoring operations to a known directory | Does not automatically block symlinks in all path components |
| `O_NOFOLLOW` | Refusing a symlink at the final path component | Does not by itself prohibit symlinks earlier in a multi-component path |
| `openat2()` resolution flags | Enforcing path-containment or no-symlink policies | Linux and kernel-version dependent; requires deliberate fallback handling |
| Secure temporary file plus `rename()` | Replacing a file without exposing partial contents | Requires careful temporary-file, permission, and durability handling |

## Practical design checklist

When reviewing Linux file-handling code, ask:

1. **Can an attacker modify any directory in the path?** If not, document why the directory is trusted and enforce that with ownership and permissions.
2. **Is the code checking a pathname and later using it?** Replace check-then-open logic with one operation that enforces the needed condition, or open once and use the resulting descriptor.
3. **Is the program creating a new file or opening an existing one?** Use exclusive creation for the former; do not treat it as a general existing-file defense.
4. **Are symlinks allowed?** If not, specify whether the restriction applies only to the final component or to the entire path, then choose flags that enforce that policy.
5. **Can the code use a trusted directory descriptor?** Prefer directory-relative operations over rebuilding and repeatedly resolving absolute paths.
6. **Does the application use the file descriptor after opening?** Avoid closing and reopening by pathname, which reintroduces the race.
7. **Are file type, ownership, and permissions appropriate?** Check the opened object and apply least privilege. Do not assume a path’s name tells you what type of object it refers to.
8. **What happens when a security flag is unsupported or an operation fails?** Fail safely; do not retry with weaker behavior without an explicit policy.

## Common mistakes

- **Using `access()` before `open()`:** The check and the open are separate operations. An attacker may change the path between them.
- **Checking with `lstat()` and then opening the same name:** `lstat()` reports on a symlink itself, but the directory entry can change before the later open.
- **Relying on a random-looking filename alone:** Unpredictability can help, but it is not a substitute for atomic creation and safe directory handling.
- **Assuming `O_NOFOLLOW` protects the entire path:** It generally addresses the final component; consider every component and use stronger resolution controls when needed.
- **Reopening a safely created temporary file by its name:** Keep and use the descriptor returned by the creation call.
- **Treating sticky directories as a complete solution:** The sticky bit restricts certain users’ ability to remove or rename entries, but it does not make every file operation in a shared directory safe.

## Frequently asked questions

### Are all symlinks a security problem?

No. Symlinks are a normal filesystem feature. They become a security concern when an attacker can influence path resolution and a program performs a sensitive operation based on an unsafe check or assumption.

### Does `O_NOFOLLOW` prevent every symlink race?

No. It prevents following a symlink at the final path component for the relevant open operation. It does not automatically prevent symlinks in earlier components or protect later operations that reopen the pathname. Use directory-relative resolution and, where appropriate, `openat2()` constraints for broader policies.

### Is `O_CREAT | O_EXCL` enough for a privileged program?

It is a strong choice when the program must create a new file and fail if the name already exists. It does not make an untrusted parent directory safe, and it is not a method for opening an existing file securely. Consider the directory, permissions, and subsequent use of the returned descriptor as part of the design.

### Should I use `openat()` or `openat2()`?

Use `openat()` when a directory descriptor and simpler relative-path handling meet the requirement. Consider `openat2()` when you need explicit controls over multi-component path resolution, such as refusing symlinks or preventing escape from a directory. Account for kernel compatibility and define a safe fallback.

### Does atomic rename eliminate all file-update risks?

No. Rename can prevent readers from observing a partially replaced directory entry, but the temporary file still needs to be created safely, and permissions, ownership, and crash durability need separate consideration.

## Conclusion

Linux symlink race conditions arise when a program treats a pathname check as a guarantee about a later filesystem operation. The most dependable designs avoid that gap: create new files atomically, anchor operations to trusted directory descriptors, apply the right path-resolution restrictions, and continue working through the opened file descriptor.

Choose defenses according to the operation. `O_CREAT | O_EXCL` fits new-file creation, `O_NOFOLLOW` addresses a final-component symlink, and `openat2()` can impose broader rules on path traversal. In every case, assess directory trust, file type, permissions, compatibility, and failure behavior. That context—not a single flag—determines whether a design is safe.
