# Linux File Integrity Monitoring With AIDE

Unexpected changes to system files can signal anything from a routine package update to a compromised host. Linux file integrity monitoring with AIDE gives administrators a way to detect those changes by comparing the current filesystem with a previously recorded baseline.

AIDE is useful, but it is not a real-time intrusion prevention system or a substitute for secure configuration management. Its results depend on what you monitor, how you establish the baseline, and whether that baseline is protected from attackers. This tutorial covers those decisions as well as installation, initialization, routine checks, and alert investigation.

## What AIDE does

AIDE, short for Advanced Intrusion Detection Environment, creates a database describing selected files and directories. Depending on its rules and configuration, that database can record attributes such as:

- File permissions and type
- Owner and group
- File size and timestamps
- Cryptographic checksums
- Extended attributes and access control lists, when configured

On a later run, AIDE compares the filesystem with the saved database and reports differences. A report might identify a modified checksum, a permission change, or a new or missing file.

This is **baseline-based file integrity monitoring**, not continuous monitoring. AIDE generally detects changes when a check runs; it does not necessarily report a change at the moment it occurs. It also cannot tell you whether a change was malicious. A package upgrade and an attacker modifying a binary may both produce differences that need investigation.

## Plan the monitoring scope

A useful deployment starts with clear goals. Monitoring every file is not always better: frequently changing files can create noisy reports, while an overly narrow policy may miss important changes.

### Prioritize security-sensitive paths

Common candidates include:

- System executables and libraries, such as `/usr/bin`, `/usr/sbin`, and relevant library directories
- System configuration, such as `/etc`
- Boot files and kernel-related configuration
- Authentication and privilege-related files, such as `/etc/passwd`, `/etc/shadow`, and sudo configuration
- Selected service configuration and application binaries

The right scope depends on the host. A server, workstation, and container host have different expected changes and risks. Check your distribution’s default AIDE policy before adding rules; package defaults may already cover important paths.

### Exclude volatile data deliberately

Directories such as caches, temporary files, runtime state, and frequently updated application data may change constantly. Excluding them can reduce noise, but exclusions should be narrow and justified. Avoid excluding a broad parent directory if it also contains security-critical files.

Be careful with directories such as `/var` and `/run`: they can contain both volatile data and important service configuration or state. Review the actual paths and rules on your system rather than applying a blanket exclusion.

## Install AIDE

Use your distribution’s package manager. For example:

```bash
# Debian or Ubuntu
sudo apt update
sudo apt install aide

# Fedora or a compatible RHEL-family distribution
sudo dnf install aide
```

Package names, configuration locations, and helper commands can vary. Some distributions install or generate a default configuration during package setup. Review the package documentation and local configuration before initializing the database.

## Configure AIDE and create a baseline

### 1. Review the configuration

The main configuration is commonly `/etc/aide/aide.conf`, though the path can differ. Check which configuration and database paths your installation uses:

```bash
sudo grep -E '^(database|database_out|@@include|@@define)' /etc/aide/aide.conf
```

AIDE configurations can include other files or use macros, so this command is only a starting point. Read the full configuration and any included files. If your installed version supports it, validate the configuration before proceeding:

```bash
sudo aide --config-check
```

Consult `man aide` or your distribution’s documentation if the option or configuration path differs.

### 2. Understand the rules

AIDE rules map paths to sets of attributes. Many packaged configurations define reusable rule names and apply them to directories. For example, a simplified configuration might contain a rule definition and path entries similar to:

```text
# Illustrative example only; check the syntax and existing rules
# in your distribution's configuration before using this.
NORMAL = p+i+n+u+g+s+m+c+sha256
/etc NORMAL
/usr/bin NORMAL
```

Here, the rule requests checks of attributes such as permissions (`p`), inode information (`i`), link count (`n`), ownership (`u` and `g`), size (`s`), timestamps (`m` and `c`), and a SHA-256 checksum. Exact attributes, supported syntax, and default rules vary by AIDE version and distribution. Do not paste this example over a working packaged configuration.

For critical files, a cryptographic checksum helps detect content changes even when size or timestamps appear unchanged. Metadata checks are also useful: a permission or ownership change can matter even if the file contents remain the same. Select attributes that fit your threat model and operational needs.

### 3. Initialize the database

The initial database records the filesystem state that future checks will treat as the baseline. Run the initialization command supported by your package:

```bash
sudo aide --init
```

Some distributions provide a wrapper such as `aideinit` instead. Initialization can take time, especially on a large filesystem. Review the command output and the configured `database_out` location to find the newly created database.

AIDE commonly writes a **new** database rather than replacing the active one. After checking that the baseline was created successfully, promote it to the configured active database path. For example, on a system that uses these uncompressed paths:

```bash
sudo install -o root -g root -m 600 \
  /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

Treat those paths as an example, not a universal command. Your distribution may use a different path, a compressed database, or a helper that performs the promotion. Follow the paths and instructions reported by your installation; do not overwrite an existing trusted database without first preserving or reviewing it.

### 4. Protect the baseline

AIDE’s value depends on the integrity of its database and configuration. If an attacker with sufficient privileges can alter both the monitored files and the baseline, they may be able to hide changes from later comparisons.

At minimum:

- Restrict write access to AIDE’s configuration and database to trusted administrators.
- Keep the database outside directories that untrusted users or services can modify.
- Consider storing a protected copy off-host or on read-only or otherwise separately controlled storage.
- Protect backups and any signing or verification keys according to your organization’s procedures.
- Review AIDE reports through a channel an attacker on the monitored host cannot silently rewrite, where feasible.

A read-only or off-host copy improves resistance to tampering, but it does not make a compromised host trustworthy. Treat AIDE as one layer in a broader monitoring and incident response plan.

## Run checks and interpret results

Once the baseline is active, run a check:

```bash
sudo aide --check
```

Use the command and schedule recommended by your distribution. AIDE can be run manually or through a scheduled job or systemd timer. Confirm that the scheduled task actually runs, that reports are retained, and that someone reviews them. A check that produces an unread report is not an effective monitoring process.

### Test the monitoring workflow

A controlled test can confirm that a path is included in the policy and that reports reach the right place. Only do this on a system where you have permission and where `/etc` is monitored by your rules:

```bash
sudo touch /etc/aide-test-file
sudo aide --check
sudo rm /etc/aide-test-file
sudo aide --check
```

The first check should report the test file as a change if the rule covers it. After removing the file, the second check should no longer report it relative to the original baseline. If the test does not behave as expected, verify the path rules, database paths, and command output before relying on scheduled monitoring.

### Investigate changes before updating the baseline

A report is a lead, not a verdict. For each unexpected difference:

1. Identify the exact path and attributes AIDE reports.
2. Check whether a package update, administrator change, deployment, or configuration-management run explains it.
3. Verify the change against trusted package records, deployment artifacts, logs, or other independent evidence.
4. If the change is unexplained, preserve relevant evidence and follow your incident response process before modifying the host.
5. Record approved changes and update the baseline only after verification.

Do not automatically replace the active database just because a check reports differences. Doing so can accept an attacker’s changes as the new normal.

### Update the baseline after approved changes

AIDE’s update operation commonly compares the current filesystem with the existing baseline and writes a candidate database. The exact command and output path depend on the installed version and configuration. A common command is:

```bash
sudo aide --update
```

Review the report and candidate database, then promote the candidate to the active database using your distribution’s documented procedure. Keep a copy of the previous baseline and record why the update was approved. For planned changes, running a check before and after maintenance can help distinguish expected modifications from unrelated ones.

## Practical design and security considerations

### Balance coverage and noise

A policy that monitors only a few files can miss relevant changes. A policy that includes every rapidly changing file can produce reports administrators stop reading. Start with high-value system paths, test the report volume, and refine the rules based on observed changes and documented risk.

### Account for package and configuration management

System updates legitimately change binaries, libraries, and configuration files. Coordinate AIDE checks and baseline updates with package maintenance and deployments. Keep change records so a report can be tied to an approved activity rather than dismissed as routine without verification.

### Understand what AIDE cannot prove

AIDE reports differences relative to its database; it does not establish that the original baseline was clean, identify who made a change, or explain intent. A host that was already compromised when initialized can have a compromised baseline. Build the first baseline from a trusted installation or verified state, and protect it from unauthorized changes.

AIDE also does not replace access controls, patching, backups, centralized logging, endpoint detection, or incident response. It is a detection aid whose usefulness depends on secure operations around it.

### Monitor database and configuration changes too

The AIDE configuration determines what is checked, and the database determines what state is trusted. Protect both. Changes to rules may silently reduce coverage, while changes to the database may conceal filesystem changes. Review administrative changes to these files and retain protected copies when appropriate.

## Troubleshooting common issues

### AIDE reports many changes after an update

This may be expected after a package upgrade or deployment. Compare the affected paths with trusted package and change records. Verify the changes before creating and promoting a new baseline.

### AIDE reports changes on every run

Look for monitored files that legitimately change often, such as logs, caches, or runtime data. Adjust rules narrowly where appropriate, and confirm that the exclusions do not remove security-critical files from coverage. Also verify that the active database is not being replaced inconsistently.

### The check cannot find or read the database

Compare the configured `database` path with the location produced during initialization. Check file ownership and permissions, whether the database is compressed, and whether a distribution helper expects a particular name or format. Avoid changing paths based only on an example from another distribution.

### A change is not reported

Confirm that the path is included by an effective rule and that the relevant attribute is being checked. Check for exclusions, included configuration files, and the database actually used by the check. Run a controlled test on an authorized system and inspect the full AIDE output.

### The configuration is rejected

Use the configuration-validation option available in your installed version, if present, and inspect the error location. AIDE rule syntax and supported attributes can differ between versions. Compare with the installed manual and packaged example configuration rather than assuming a rule from another platform will work unchanged.

## FAQ

### Is AIDE real-time file integrity monitoring?

No. AIDE is generally run periodically or on demand and compares the current filesystem with a saved database. It detects differences at check time, not necessarily when a change happens.

### Can AIDE tell whether a file change is malicious?

No. It reports differences in configured attributes. Administrators must investigate whether a change came from an approved update, a deployment, an administrative action, or suspicious activity.

### Should I update the AIDE database after every alert?

No. Verify and document changes first. Updating the database without investigation can accept unauthorized changes into the trusted baseline.

### Where should I store the AIDE database?

Keep it root-controlled and protected from untrusted modification. An independently protected or off-host copy can make tampering harder, but the correct design depends on your environment and recovery requirements.

## Conclusion

Linux file integrity monitoring with AIDE can help surface unexpected changes to important system files, provided the policy is thoughtfully scoped and the baseline is trustworthy. Review your distribution’s rules, protect the database and configuration, schedule checks, investigate differences, and promote a new baseline only after verifying approved changes. Used this way, AIDE is a practical detection layer—not a replacement for broader host security controls.
