# File Path Canonicalization Security

An application that accepts a filename or path from a request must decide which file that input refers to. That decision can become a security problem when the application checks one representation of a path but the operating system, framework, or another component later interprets a different one. Attackers may try path traversal inputs, alternate separators, or encoded characters to reach files outside the intended directory.

This guide explains file path canonicalization security and offers a practical workflow for evaluating it in an authorized test environment. You will learn what to inspect, how to test safely, how to interpret results, and how to strengthen the implementation.

## What is file path canonicalization?

A path can have multiple textual forms that refer to the same location. Canonicalization is the process of resolving a path into a consistent form according to the filesystem and operating system. Depending on the platform and operation, this can involve resolving relative segments such as `.` and `..`, following symbolic links, and interpreting separators or drive and network prefixes.

For example, `reports/../public/notice.txt` may resolve to `public/notice.txt`. Whether `reports\\..\\public\\notice.txt` has equivalent meaning depends on the platform and the component interpreting it. Percent-encoded characters may also be decoded by a web server or framework before application code receives a value.

A common vulnerability occurs when an application validates the raw input, then uses a transformed path without repeating an appropriate containment check. The reverse can also happen: one layer decodes or normalizes a value while another layer decodes it again. In either case, the checked path and the used path may differ.

Canonicalization is not a substitute for authorization. A normalized path can still identify a file the current user should not access. Applications need both a safe way to resolve a file and an authorization decision for the requested resource.

## Why it matters in web application security

Path handling often appears in features such as:

- Downloading reports or user-uploaded files
- Serving static assets from a selected directory
- Importing or exporting files
- Reading templates or configuration files
- Extracting archives
- Creating files based on user-supplied names

If an attacker can make one of these features access an unintended location, the impact depends on the application’s permissions and the operation. A read feature could expose files the application can access. A write or extraction feature could overwrite or create files in an unintended location. Do not assume that filtering the string `../` alone is sufficient: separators, encoding, operating-system rules, symlinks, and multiple processing layers all matter.

## A practical, authorized assessment workflow

Test only systems and data you are authorized to assess. Prefer a local or staging environment with test accounts and harmless canary files. Avoid using real sensitive files as test targets.

### 1. Map the input-to-file flow

Identify the feature that accepts a filename, path, or file identifier. Trace the value through the system:

1. Where does the value enter: URL path, query parameter, form, JSON body, or upload metadata?
2. Which web server, proxy, framework, or library decodes or normalizes it?
3. Does the application join it to a base directory, pass it to a storage API, or use it in another way?
4. Where are authorization and filesystem checks performed?
5. Which operating system and filesystem will interpret the final path?

Review code as well as behavior when possible. A black-box test may show that a request is rejected, but it cannot always establish which layer rejected it or whether another route has different behavior.

### 2. Establish a safe baseline

Use a known-good filename that should be accessible to the test account. Confirm the expected response and record the status, content type, and returned file. Then create a harmless canary file outside the permitted directory, if you control the test environment. Give it a unique, non-sensitive marker so you can distinguish an actual read from an error page or cached response.

Do not probe for operating-system files or attempt to retrieve real credentials. A canary you created is enough to test whether the feature escapes its intended directory.

### 3. Test path variations systematically

Change one property at a time and compare the results with the baseline. Depending on the feature and platform, test cases may include:

- Relative segments such as `../canary.txt`
- Equivalent separators for the deployed operating system
- Encoded separators or dots, if the input passes through URL decoding
- Repeated encoding, to check whether different layers decode at different times
- Absolute paths or drive and network prefixes, where relevant
- Symbolic links inside the permitted directory that point outside it
- Empty values, dot-only paths, and unusually long values

A safely scoped request might look like this, with the host and parameter replaced by those in your staging application:

```sh
curl -i --get \
  --data-urlencode 'name=../canary.txt' \
  'https://staging.example.test/download'
```

Use a canary file that you created outside the allowed directory. A secure result should not return its marker. Depending on the application’s design, it may reject the request, return a not-found response, or resolve an approved resource through a separate identifier. Record the actual behavior rather than relying on a particular status code alone.

Test encoded and alternate forms only when they are relevant to the application’s request path. For example, a proxy may normalize a URL before the application sees it. Use request logs or application instrumentation in staging to understand the value at each boundary. Avoid assuming that a value shown in a browser or command line is exactly the value the filesystem receives.

### 4. Check authorization separately

Try the same permitted file with users who should and should not have access. A path containment check prevents access outside a directory; it does not prove that one user is allowed to read another user’s file within that directory. Verify that the application checks ownership, tenant boundaries, role permissions, or other relevant access rules on every request.

### 5. Document and reproduce findings

For each case, record the route, account role, input representation, observed response, and relevant server-side logs. Preserve only the minimum evidence needed, such as the unique canary marker. A useful finding explains how to reproduce the behavior safely and identifies the check that should be fixed.

## Safer path handling in Python

For an application that serves existing files from a fixed directory, resolve the requested path and verify that the resolved target remains within the resolved root. The following example is for a POSIX deployment and assumes the root directory is controlled by the application:

```python
from pathlib import Path

ROOT = Path('/srv/app/private').resolve(strict=True)


def resolve_download_path(raw_name: str) -> Path:
    if not raw_name or chr(0) in raw_name:
        raise ValueError('Invalid file name')

    requested = Path(raw_name)
    if requested.is_absolute():
        raise ValueError('Absolute paths are not allowed')

    target = (ROOT / requested).resolve(strict=True)

    try:
        target.relative_to(ROOT)
    except ValueError:
        raise ValueError('Path is outside the permitted directory')

    if not target.is_file():
        raise ValueError('File not found')

    return target
```

The containment check uses path components rather than a string-prefix comparison. A string check such as `target.startswith(root)` can incorrectly treat a sibling directory whose name begins with the root directory’s name as being inside the root.

This example has important limits. It uses the path rules of the operating system where it runs; do not assume POSIX behavior matches Windows behavior. It also resolves an existing target, so it is not a complete pattern for creating a new file. Finally, resolving and checking a path and then opening it are separate operations. In a directory that an attacker can modify concurrently, a symlink could change between the check and the open. For higher-risk write or extraction operations, use platform-appropriate APIs that safely operate relative to an already-open directory, prevent symlink traversal where needed, and handle the check and use without an exploitable race. Restrict write access to the storage tree as an additional safeguard.

When possible, avoid accepting filesystem paths from clients at all. Accept an opaque file ID, look up the corresponding server-side record, authorize the user, and retrieve the file from a controlled storage location. This reduces ambiguity and keeps filesystem layout out of the request interface.

## Remediation checklist

Use these measures together, based on the feature’s requirements:

- **Prefer identifiers over paths.** Map a server-validated file ID to a stored object instead of letting the client select an arbitrary filesystem path.
- **Define one trusted base directory.** Keep sensitive files outside directories intended for user-controlled content, and grant the application only the filesystem permissions it needs.
- **Validate after decoding at the correct boundary.** Know which layer decodes input. Avoid repeated decoding, and do not rely on checks against only the raw request string.
- **Resolve and enforce containment.** Use the platform’s path APIs and verify that the resolved target is within the intended root. Do not use string-prefix checks as a substitute.
- **Apply authorization to the resource.** Check the requester’s permissions for the specific file, not merely whether it lies inside a directory.
- **Handle symlinks and races.** Consider who can create or replace files and directories. For sensitive operations, use safe directory-relative file APIs and restrictive filesystem permissions.
- **Constrain writes and archive extraction.** Validate each extracted or created destination, prevent escape from the destination directory, and avoid following unexpected links.
- **Fail safely and log usefully.** Return a generic error to the client while recording enough internal context to diagnose rejected paths. Do not disclose filesystem layout or sensitive file contents in error messages.
- **Add regression tests.** Include normal filenames, traversal attempts, relevant encodings, symlink cases, and authorization boundaries for the supported platforms.

## Common troubleshooting notes

**A traversal test returns an error, but you are unsure why.** Check application and proxy logs in staging to see the value each layer received. A rejection may come from routing, decoding, validation, authorization, or the filesystem; those have different fixes and regression tests.

**The issue appears only on one operating system.** Path separators, drive prefixes, case handling, and filesystem behavior vary. Test on the same operating system and filesystem configuration used in production, and use APIs native to that deployment rather than hand-written path rules.

**A resolved path passes containment checks, but a race is still possible.** Path resolution is not automatically an atomic guarantee that a later open uses the same object. Restrict who can modify the directory tree, and use safer directory-relative operations for sensitive cases.

**A file is contained but still belongs to another user.** Treat this as an authorization issue. Enforce per-file access control independently of path canonicalization.

## FAQ

### Is removing `../` enough to prevent path traversal?

No. That check can miss alternate separators, encoded input, platform-specific path forms, symlinks, or transformations performed by another layer. Use operating-system path resolution, enforce containment, and test the actual request-to-filesystem flow.

### Should an application decode a path before checking it?

The application should understand what decoding has already occurred and validate the value that will ultimately be used. Decode at a defined boundary, avoid decoding repeatedly, and perform the final path resolution and containment check using the relevant platform APIs.

### Does canonicalization replace file authorization?

No. Canonicalization helps establish which filesystem object a path refers to and whether it is within an allowed root. The application must still verify that the current user is permitted to access that object.

### Can path containment checks prevent symlink attacks and race conditions?

A resolved-path containment check can detect a symlink that currently points outside the root, but a separate check and open may leave a race if an attacker can change the filesystem in between. Limit filesystem write access and use appropriate directory-relative APIs for sensitive operations.

## Conclusion

File path canonicalization security depends on checking the same effective path that the filesystem will use, enforcing containment, and applying authorization to the requested file. In an authorized staging environment, trace the input through each processing layer, test relevant path variations with harmless canary files, and verify the result with logs and regression tests. Where possible, replace client-supplied paths with server-side file identifiers and keep storage permissions narrowly scoped.
