# Path Traversal Vulnerabilities in Web Apps

A web app may let users download a report, view an image, or select a file from a workspace. If the app uses a user-supplied filename to build a filesystem path without enforcing the intended boundary, an attacker may be able to reach files outside that workspace. This class of flaw is known as **path traversal**, or directory traversal.

Path traversal vulnerabilities in web apps are not limited to a particular framework or programming language. They often result from a design assumption: that a filename supplied by a user will remain inside the directory the app intended. This guide explains how the flaw works, why common fixes can fail, and how developers can design safer file-handling features.

## What is path traversal?

A filesystem path identifies a file or directory. Relative paths can use components such as `..` to refer to a parent directory. For example, `reports/../images/logo.png` resolves to `images/logo.png` relative to the starting location.

A path traversal vulnerability occurs when an application accepts input that influences a filesystem path and fails to ensure the resulting path stays within an approved directory. An attacker may then access files the feature was not meant to expose, subject to the operating system account’s permissions.

A simplified vulnerable pattern looks like this:

```python
from pathlib import Path

BASE_DIR = Path('/srv/app/public-files')


def read_file(filename):
    return (BASE_DIR / filename).read_bytes()
```

If `filename` can contain traversal components, the joined path may point outside `BASE_DIR`. The exact outcome depends on the input, the application, the operating system, and filesystem permissions. The important issue is that joining a base directory and an untrusted path does not, by itself, enforce containment.

## How traversal reaches a vulnerable file feature

The input does not have to be a field literally named `path`. It might be a filename, document ID, image name, language code, template name, or archive entry. Common features that interact with files include:

- Download and preview endpoints
- User-uploaded files and attachment handling
- Image resizing or document conversion services
- Static-file handlers and custom file servers
- Report exports and backup retrieval
- Template loading and localization
- Archive extraction and import workflows

For example, a download endpoint might accept a parameter such as `file=quarterly-report.pdf`. If the server appends that value to a directory and opens the result, the endpoint needs a reliable way to establish that the selected file is authorized and contained within the intended storage area.

## What are the practical risks?

The impact depends on what the vulnerable process can read or change and what the endpoint exposes. Potential consequences include:

- **Disclosure of sensitive files:** The app may expose configuration files, source code, logs, or data belonging to other users.
- **Access-control bypass:** A file feature may allow access to files that are outside the requesting user’s authorized workspace.
- **Exposure of credentials or secrets:** If secrets are stored in files readable by the app process, a traversal flaw could disclose them.
- **Changes to files:** If an endpoint writes, deletes, or extracts files using an unsafe path, the impact can extend beyond reading.
- **Further compromise:** Information exposed through a file-handling flaw may help an attacker find or exploit other weaknesses.

These outcomes are possibilities, not automatic results. A process running with limited filesystem permissions has less access to expose than one with broad privileges. Authorization checks, storage layout, and the specific operation all affect risk.

## Why filtering `../` is not a complete defense

A common first attempt is to reject strings containing `../`. This can be fragile because path interpretation varies across operating systems, libraries, and application layers. Other separators, encoding and decoding steps, normalization behavior, or alternate path forms may matter. A check applied before a later decoding or normalization step may not evaluate the path the filesystem ultimately receives.

Likewise, replacing suspicious text or stripping `..` can produce unexpected paths rather than rejecting an invalid request. A blacklist tries to anticipate every unsafe representation. A stronger approach is to define what input is allowed, resolve it according to the application’s path rules, and verify that the result remains within a trusted boundary.

## Safer design choices

### Prefer identifiers over paths

When a user needs to select a file, accept an opaque identifier rather than a filesystem path. Look up that identifier in a database or storage service, then check that the authenticated user is authorized to access the corresponding object.

For example, an endpoint can accept a document ID, load the document record, verify ownership or sharing permissions, and retrieve the file using a server-controlled storage key. This separates user-facing selection from filesystem layout and reduces the amount of path interpretation required.

An identifier is not authorization by itself. The app must still check the user’s permission for the requested object; otherwise, an attacker may substitute another valid identifier.

### Canonicalize and enforce containment

If a feature genuinely needs a user-provided relative path, resolve the candidate path and confirm it is inside the approved root. Do not rely on a string prefix check: a path beginning with `/srv/app/files-backup` shares a textual prefix with `/srv/app/files` but is not inside that directory.

A basic Python example is:

```python
from pathlib import Path

BASE_DIR = Path('/srv/app/public-files').resolve()


def resolve_public_file(user_path):
    candidate = (BASE_DIR / user_path).resolve()

    try:
        candidate.relative_to(BASE_DIR)
    except ValueError:
        raise PermissionError('Path is outside the permitted directory')

    return candidate
```

This demonstrates canonical resolution followed by a path-component-aware containment check. The application should also handle missing files and other filesystem errors safely, avoid revealing sensitive absolute paths in responses, and enforce authorization for the requested file.

This pattern is not a universal substitute for a secure filesystem design. Symbolic links, concurrent filesystem changes, platform-specific behavior, and the operation being performed can affect safety. If an attacker can create or replace files or links in the storage tree, checking a resolved path and opening it later may leave a time-of-check-to-time-of-use race. For higher-risk operations, use platform-supported APIs that open files relative to a trusted directory handle and prevent escaping that directory, or use a storage abstraction that does not expose arbitrary filesystem paths.

### Use allowlists when the feature has a fixed set of files

If the application serves a known set of assets, map a small set of accepted names to server-controlled paths:

```python
ASSETS = {
    'logo': '/srv/app/assets/logo.png',
    'guide': '/srv/app/assets/guide.pdf',
}


def get_asset(name):
    try:
        return ASSETS[name]
    except KeyError:
        raise FileNotFoundError('Unknown asset')
```

The user selects a logical name, not a path. For dynamic collections, use a database record or generated storage key rather than expanding the input language to arbitrary filesystem paths.

### Separate storage from executable application files

Store uploads and other user-controlled content outside directories used for application code or public static assets. Apply restrictive filesystem permissions so the web process can access only the files and operations it needs. If the app only needs to read a storage area, avoid granting it write access there.

Keep sensitive configuration and credentials outside directories that file-serving features can reach. Least privilege cannot fix unsafe path handling, but it can reduce the amount of data an error can expose and limit the consequences of a compromise.

### Treat archive extraction as a separate path boundary

ZIP and other archive formats can contain entry names that refer to paths outside the extraction directory. Before writing an archive entry, validate the destination after joining it to the extraction root and ensure it remains inside that root. Do not assume an archive is safe because it was uploaded by an authenticated user. Also consider symbolic links and other filesystem features supported by the archive format and extraction library.

## A practical review and testing checklist

When reviewing a file-handling feature, trace the value from the request to the filesystem operation. Check every transformation along the way, including URL decoding, application-level decoding, path joining, normalization, and the final open, write, delete, or extraction operation.

Use this checklist:

1. **Identify all file operations.** Search for file reads, writes, deletes, directory listing, template loading, and archive extraction.
2. **Trace user-controlled input.** Include indirect inputs such as database fields, imported metadata, and archive entry names.
3. **Look for path construction.** Check whether input is concatenated with a base directory or passed into a filesystem API.
4. **Verify authorization separately.** Confirm the user is allowed to access the selected file, even when the path is contained.
5. **Test boundary cases safely.** In a test environment, verify that parent-directory references and unexpected separators are rejected, and that valid in-directory files still work.
6. **Check links and races where relevant.** Consider whether an untrusted user can create or alter symlinks or directories between validation and use.
7. **Review error handling.** Return a generic not-found or access-denied response where appropriate; avoid exposing server paths or file contents in error messages.
8. **Confirm permissions.** Ensure the application process cannot read or modify unrelated sensitive files when it does not need to.

Tests should assert that invalid requests cannot access data outside the intended storage boundary. Avoid testing against real secrets or production files. Use a dedicated test directory with harmless fixtures, including a file inside the permitted root and a separate file outside it.

## Common implementation mistakes

- **Joining paths and assuming that is enough:** Joining constructs a path; it does not prove containment.
- **Checking a raw string prefix:** Textual prefixes do not reliably represent directory boundaries.
- **Validating before decoding or normalization:** A later transformation may change what the filesystem receives.
- **Treating an opaque ID as permission:** IDs still require authorization checks.
- **Relying on hidden filenames:** Obscurity does not prevent access if the endpoint accepts attacker-controlled selectors.
- **Ignoring write operations:** Traversal can affect uploads, extraction, deletion, or other changes as well as reads.
- **Using broad process permissions:** Excessive access can magnify the impact of a path-handling flaw.

## FAQ

### Is path traversal the same as local file inclusion?

They are related but not identical. Path traversal describes using path components or path manipulation to reach a location outside an intended directory. Local file inclusion usually refers to an application loading or including a local file, often in a way that affects application behavior. A vulnerable file-inclusion feature may involve traversal, but not every traversal flaw is a file-inclusion flaw.

### Does URL encoding make a traversal input harmless?

No. Encoding is a representation, not a security boundary. Different application layers may decode or normalize a value at different times. The application should validate the path it will actually use and enforce containment at the filesystem boundary.

### Is checking that a path starts with the storage directory safe?

Not as a plain string comparison. Similar directory names can share a prefix without one being a child of the other. Resolve the path and use a path-aware containment check, or avoid accepting arbitrary paths by using server-controlled identifiers.

### Can path traversal happen when users only download files?

Yes. A read-only endpoint can still disclose files the user should not be able to access. Read-only behavior reduces some possible impacts but does not remove the need for containment and authorization checks.

## Conclusion

Path traversal vulnerabilities in web apps occur when user-influenced paths escape the directory or storage boundary a feature was designed to use. The most reliable designs avoid accepting arbitrary paths: use authorized object identifiers or allowlisted names, keep storage boundaries clear, and limit the web process’s filesystem permissions. When paths are necessary, resolve them using the platform’s path rules, enforce containment, and account for links and race conditions where relevant. Careful testing of the complete input-to-filesystem flow helps ensure that file features expose only the resources they are meant to serve.
