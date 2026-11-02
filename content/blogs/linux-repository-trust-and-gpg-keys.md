# Linux Repository Trust and GPG Keys

Linux package managers do more than download software: they check that package data comes from a repository the system is configured to trust and has not been altered in transit. GPG keys are part of that trust model, but adding a key is not, by itself, proof that a repository is safe.

This guide explains how repository trust works and provides a practical workflow for evaluating Linux repository trust and GPG keys in an authorized environment. It covers Debian-based systems using APT and RPM-based systems using DNF or YUM, with validation and remediation steps for common problems.

## What repository trust means

A repository is a source of packages and the metadata used to find and install them. Trust involves several related questions:

- **Who controls the repository?** Confirm that the source is approved for your system and workload.
- **Is the metadata authentic?** The package manager should verify signatures on repository metadata where the format and configuration support it.
- **Are packages authentic?** Package signatures can help establish that a package was signed by a trusted key and has not changed since signing.
- **Is the key itself trusted?** A signature is only meaningful if the signing key has been verified and deliberately trusted.
- **Is the trust scoped appropriately?** A key trusted for one repository should not automatically be trusted to sign packages from every source.

HTTPS protects a connection to a server, but it does not replace package signature verification. Conversely, a valid signature does not prove that software is benign, that the repository is well maintained, or that the signing key has not been compromised.

## How GPG keys fit into package verification

A repository maintainer signs metadata or packages with a private key. Administrators configure the corresponding public key so the package manager can verify signatures. The private key should remain under the maintainer’s control; it should never be needed on a client machine.

The exact verification path depends on the package format and package manager. APT verifies signed repository metadata and uses the metadata’s checksums to verify downloaded package files. RPM-based tools can verify package signatures, and DNF can also verify repository metadata when that check is enabled. These checks establish integrity and signing-key identity relative to the configured trust; they are not a general security assessment of the software.

## A practical repository trust workflow

Use this workflow when reviewing a repository in a system you own or are authorized to administer.

### 1. Inventory configured repositories

Start by recording repository URLs, distribution or release settings, enabled status, and key references. Look for unexpected third-party sources, duplicate entries, obsolete releases, and configurations that disable verification.

On Debian or Ubuntu, inspect traditional and Deb822 source files and APT preferences:

```bash
sudo grep -RniE '^(deb |URIs:|Suites:|Signed-By:|Enabled:|trusted=|allow-insecure=)' \
  /etc/apt/sources.list /etc/apt/sources.list.d 2>/dev/null
sudo grep -RniE '^(Package:|Pin:|Pin-Priority:)' /etc/apt/preferences /etc/apt/preferences.d 2>/dev/null
```

Review the effective APT configuration for verification-related settings:

```bash
apt-config dump | grep -iE 'AllowInsecure|AllowUnauthenticated|AllowDowngradeToInsecure|Check-Valid-Until'
```

On DNF-based systems, list repositories and inspect their configuration files:

```bash
dnf repolist --all
sudo grep -RniE '^\[|^(name|baseurl|metalink|mirrorlist|enabled|gpgcheck|repo_gpgcheck|gpgkey)=' \
  /etc/yum.repos.d
```

Commands and paths can vary by distribution. Treat a repository you cannot identify as an item to investigate, not as safe merely because it is enabled.

### 2. Confirm that each repository is expected

For every entry, identify its owner, purpose, supported distribution and release, and approved package scope. Check the repository URL against documentation obtained through a trusted channel, such as your organization’s software catalog or the vendor’s official documentation.

Be cautious with repositories that use an unexpected domain, redirect to an unrecognized host, target a different distribution release, or were added by an old installation script. A familiar name in a repository file is not evidence of ownership.

### 3. Verify the signing key before trusting it

Inspect the key’s full fingerprint and identity. Do not rely only on a short key ID, a filename, or a key downloaded from the same location as the repository. Obtain the expected fingerprint through an independent, authenticated channel—for example, vendor documentation reached separately or an approved internal record—and compare every fingerprint character.

For a local key file:

```bash
gpg --show-keys --with-fingerprint --with-subkey-fingerprint ./repository-signing-key.asc
```

A keyserver can help locate public key material, but downloading a key from one does not establish that it belongs to the repository owner. Verify its fingerprint independently before use. Also check key expiration, revocation information, and whether the key is appropriate for the repository and signing purpose.

### 4. Check how trust is scoped

Prefer a key that is explicitly associated with only the repository it is meant to authenticate. Avoid broad, system-wide trust where a package manager supports repository-specific key configuration. Record the repository-to-key relationship so future key changes can be reviewed.

#### APT: use a dedicated keyring and `Signed-By`

APT’s older `apt-key` workflow is deprecated. For a third-party repository, a common pattern is to place its key in `/etc/apt/keyrings` and reference that key from the repository definition. First verify the fingerprint as described above. The following example uses placeholders; replace them with values confirmed from the repository owner.

```bash
sudo install -d -m 0755 /etc/apt/keyrings

# Convert an already downloaded and fingerprint-verified ASCII-armored key.
sudo gpg --dearmor \
  --output /etc/apt/keyrings/example-repo.gpg \
  ./example-repo-signing-key.asc
sudo chmod 0644 /etc/apt/keyrings/example-repo.gpg
```

A Deb822 source file can then scope the key to this source:

```text
# /etc/apt/sources.list.d/example.sources
Types: deb
URIs: https://packages.example.invalid/debian
Suites: stable
Components: main
Signed-By: /etc/apt/keyrings/example-repo.gpg
```

Use the actual repository URI, suite, and components published for your distribution. Do not copy placeholder values into a live system. The keyring must be readable by APT, which is why the example sets permissions to `0644`; the directory is traversable by the package manager.

`Signed-By` limits which key or keyring APT uses for that source. It does not make an unverified key trustworthy, nor does it validate the repository’s software policy.

#### RPM: enable package and, where supported, metadata checks

For a DNF repository, a configuration commonly includes settings like these:

```ini
[example-repo]
name=Example repository
baseurl=https://packages.example.invalid/rpm/$releasever/$basearch/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-example
```

Use values and settings supported by the distribution and repository. `gpgcheck=1` enables verification of RPM package signatures. `repo_gpgcheck=1` enables verification of repository metadata where the repository and DNF implementation support it. They check different things; enabling one does not imply the other is enabled.

Before importing a key, inspect its fingerprint and compare it with an independently verified value. RPM-based systems commonly import keys into the RPM database, so consider the scope of that trust and follow your distribution’s guidance for managing trusted keys. A repository configuration that points to a key file is not a substitute for verifying that key.

### 5. Refresh metadata and review verification results

After configuring a source, refresh metadata and read the complete output. Do not treat a successful command as proof that the repository is appropriate; it indicates that the package manager could process the configured sources under the current settings.

On Debian or Ubuntu:

```bash
sudo apt update
apt-cache policy
```

Review the output for signature errors and confirm that expected sources and release information appear. Use `apt-cache policy package-name` to examine which sources offer a particular package and which version APT would select.

On DNF-based systems:

```bash
sudo dnf clean metadata
sudo dnf makecache --refresh
sudo dnf repolist -v
```

Review the enabled repository details and any signature or metadata verification messages. To check a downloaded RPM package’s signature information, use:

```bash
rpmkeys --checksig -v ./package.rpm
```

A package signature check does not establish that the package is safe to install. Confirm that the package came from the expected source and that its signing key is trusted for that source.

### 6. Document the result

For each repository, record its owner, purpose, URL, supported releases, key fingerprint, key expiration or rotation guidance, verification settings, and approval. This makes future audits and key rotations easier to distinguish from unexpected changes.

## Common warnings and how to respond

### APT reports `NO_PUBKEY`

APT could not find an acceptable public key for a signature. Confirm that the repository is expected, identify the signing key through the repository owner’s official instructions, and verify its fingerprint independently. Then configure the key using an appropriately scoped keyring and `Signed-By` entry. Do not fetch an unidentified key and trust it simply to silence the warning.

### APT reports a signature or repository-information error

Errors such as `EXPKEYSIG`, `BADSIG`, or an invalid or expired release file can have different causes, including an expired key, an incomplete mirror update, a changed signing key, or unexpected content. Check the repository owner’s current key-rotation notices and compare the configured source and system clock. If the change is unexplained, stop installations from that source and investigate rather than bypassing verification.

### DNF reports a missing or incorrect key

Check that the repository points to the intended key, that the key file is readable, and that its fingerprint matches the expected value. Confirm whether the failure concerns a package signature or repository metadata; `gpgcheck` and `repo_gpgcheck` cover different checks. If the repository owner has rotated keys, validate the replacement key before updating the configuration.

### The repository works only when verification is disabled

Treat this as a security issue, not a routine workaround. Restore signature checking and investigate the source, key, metadata, system clock, and network path. Do not use APT options such as `--allow-unauthenticated` or insecure-repository settings to force an installation. Do not set `gpgcheck=0` or `repo_gpgcheck=0` to suppress an unexplained error.

## Remediation for untrusted or misconfigured repositories

If a source is unauthorized, no longer needed, or cannot be validated:

1. **Disable or remove the repository** using the distribution’s package-manager configuration.
2. **Remove its dedicated keyring or key configuration** if it is not used by another approved source. Confirm the impact before removing any shared key.
3. **Refresh package metadata** and verify that the source no longer appears.
4. **Review package history and installed packages** for software that may have come from the source. Package history can help identify changes, but it may not establish a package’s complete provenance.
5. **Assess potential exposure** based on what was installed, the repository’s trust scope, and available system logs. Follow your organization’s incident-response process if the source may have been malicious or compromised.
6. **Document the change** and obtain an approved replacement source if the software is still required.

For a legitimate repository with an expired or rotated key, use the owner’s verified rotation instructions. Validate the new fingerprint through an independent channel, update the scoped key configuration, and confirm that metadata and package checks succeed. Avoid leaving old keys trusted indefinitely when they are no longer required.

## Security recommendations

- Keep the set of enabled repositories small and tied to a clear business or operational need.
- Prefer distribution-maintained repositories where they meet your requirements; review third-party sources before enabling them.
- Verify full key fingerprints through an independent trusted channel before importing keys.
- Scope keys to individual repositories where supported instead of granting unnecessary global trust.
- Keep package and metadata signature checks enabled, and investigate failures rather than suppressing them.
- Review repository configuration and key changes during system builds, upgrades, and periodic security reviews.
- Monitor key expiration and rotation notices so updates can be planned and validated.
- Remember that signature verification authenticates signed content relative to a key; it does not replace software review, least privilege, or endpoint security controls.

## FAQ

### Does a GPG key prove that a Linux repository is safe?

No. It helps verify that signed metadata or packages match a trusted signing key and have not been altered since signing. It does not prove that the software is harmless, that the repository owner is reputable, or that the signing key has never been compromised.

### Is HTTPS enough if a repository uses it?

No. HTTPS protects the connection to a server, but package-manager signature verification provides a separate check of signed repository data or packages. Use both where available and appropriate.

### Should I use `apt-key` to add a third-party key?

APT’s `apt-key` workflow is deprecated. For third-party sources, use a dedicated keyring and associate it with the source using `Signed-By`, after independently verifying the key fingerprint. Follow current instructions for your distribution’s own archive keys.

### What is the difference between `gpgcheck` and `repo_gpgcheck`?

In DNF repository configuration, `gpgcheck` controls verification of RPM package signatures. `repo_gpgcheck` controls verification of repository metadata when supported. They are separate settings and should be evaluated separately.

### What should I do when a repository key changes?

Confirm the change through the repository owner’s trusted documentation or another independent channel. Verify the replacement key’s full fingerprint, update the repository’s scoped configuration, and refresh metadata. If the change cannot be explained or validated, disable the repository and investigate before installing from it.

## Conclusion

Linux repository trust depends on more than having a GPG key present. A sound process identifies each source, verifies its owner and signing-key fingerprint, scopes trust appropriately, checks metadata and package signatures, and investigates failures without bypassing safeguards. With a documented inventory and a careful validation workflow, administrators can manage repository trust and key changes more confidently across APT and RPM-based systems.
