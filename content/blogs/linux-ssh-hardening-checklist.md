# Linux SSH Hardening Checklist

SSH is a common way to administer Linux systems remotely, which also makes it an important security boundary. A weak password, an exposed account, or a configuration change that locks out administrators can put both system security and availability at risk.

This Linux SSH hardening checklist explains the decisions behind common safeguards and how to apply them carefully. It is intended for intermediate administrators who can access a server console or another recovery method if remote access fails.

> **Before changing SSH:** keep an existing administrative session open, confirm access to a console or other recovery path, and test each change in a second session before closing the first.

## Linux SSH hardening checklist at a glance

- [ ] Update OpenSSH and the operating system through your normal patch process.
- [ ] Confirm which SSH daemon configuration files are actually in use.
- [ ] Create and test named administrative accounts with individual keys.
- [ ] Disable root SSH login where operationally practical.
- [ ] Disable password authentication only after key access has been tested.
- [ ] Preserve keyboard-interactive authentication if it is required for MFA.
- [ ] Limit SSH access at the network layer and, where appropriate, by account or source address.
- [ ] Restrict forwarding and other SSH features to what the workload needs.
- [ ] Validate configuration syntax and effective settings before reloading.
- [ ] Test a new connection and review authentication logs after changes.
- [ ] Maintain keys, access lists, host keys, and monitoring over time.

## Understand the risks and trade-offs

An SSH service exposed to a network can receive connection attempts from untrusted systems. Password authentication may be targeted with guessed, reused, or stolen credentials. A compromised administrator key can grant substantial access, especially when it is shared, poorly protected, or never removed after an employee or service no longer needs it.

Hardening is not just a matter of turning off features. For example, disabling keyboard-interactive authentication may break an MFA setup that relies on it. Disabling TCP forwarding may disrupt a legitimate deployment workflow or tunnel. The right configuration depends on how the system is used, but every enabled access path should have a clear purpose and an owner.

## 1. Patch and identify the active configuration

Keep the operating system and OpenSSH packages updated using your distribution’s supported update process. Security fixes may arrive through distribution packages, so check the package version and advisories for your system rather than relying only on an upstream version number.

Before editing settings, inspect the main configuration and any included files:

```bash
sudo grep -nE '^[[:space:]]*(Include|Port|PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)' /etc/ssh/sshd_config
```

The daemon may also read files from a directory such as `/etc/ssh/sshd_config.d/`. Paths and include order vary by distribution. OpenSSH generally uses the first obtained value for a setting, so a setting in an included file may not take effect if an earlier setting already applies. Do not assume that a drop-in file overrides the main configuration; verify the effective result.

Use the server configuration test before applying changes:

```bash
sudo sshd -t
```

No output normally indicates that the syntax test passed. To inspect effective settings, use:

```bash
sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|pubkeyauthentication|kbdinteractiveauthentication|x11forwarding|allowtcpforwarding) '
```

For settings that depend on a connection or account, `sshd -T -C` can evaluate a specific connection context. For example, replace the sample values with the intended user, host, and client address:

```bash
sudo sshd -T -C user=admin,host=server.example,addr=192.0.2.25
```

## 2. Use individual accounts and protect private keys

Give each administrator a named account rather than sharing one login. Individual accounts make access reviews and incident response clearer. Use `sudo` for privileged tasks and grant only the privileges required for each role.

Prefer public-key authentication for administrative access. A typical client-side key-generation command is:

```bash
ssh-keygen -t ed25519 -a 64 -C admin-laptop
```

Protect the private key with a strong passphrase and keep it on a device with appropriate access controls. The public key can be installed in the account’s `~/.ssh/authorized_keys` file. Check ownership and permissions if authentication fails:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

The account’s home directory and `.ssh` directory must also be owned and accessible in a way accepted by the server’s `StrictModes` checks. Do not copy private keys to servers or share one key among multiple people. Where a platform or compliance requirement calls for a different key type, follow that requirement and verify support on both client and server.

## 3. Restrict root and password-based login carefully

A common baseline for a server managed through named accounts is:

```text
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
```

`PermitRootLogin no` prevents direct SSH login as root; administrators can use an authorized account and `sudo` instead. Check whether automation, recovery procedures, or provisioning tools depend on root SSH access before changing this setting.

Disable password authentication only after confirming that every required administrator can log in with a key. Keep an existing session open while testing a fresh connection in another terminal. If a key is missing or misconfigured, do not close the working session until access is restored.

### Account for MFA and PAM

Keyboard-interactive authentication is often used by PAM-based MFA configurations. Do not disable it automatically. If your MFA setup depends on keyboard-interactive, disabling `KbdInteractiveAuthentication` can remove that authentication path or prevent legitimate access. Confirm the authentication flow with your identity and platform configuration before changing it.

For a server that does not use keyboard-interactive authentication, an administrator may choose to set:

```text
KbdInteractiveAuthentication no
```

Keep settings such as `UsePAM` aligned with the distribution and the authentication methods in use. Validate the effective configuration and test the complete login flow after changes.

## 4. Limit who can reach SSH

Use a host firewall, cloud security group, network ACL, or management network to allow SSH only from trusted sources where practical. Apply restrictions at the network layer as well as in the SSH daemon when appropriate. Ensure that permitted addresses include your actual administrative access path, including any VPN or bastion host.

You can also restrict eligible accounts with settings such as:

```text
AllowUsers admin deploy
```

Replace these examples with the specific accounts that need access. `AllowUsers` can unintentionally block legitimate users, especially when accounts are managed dynamically or when connection patterns differ from expectations. Review the list whenever staff, services, or infrastructure change. `AllowGroups` may be easier to maintain in environments with well-managed access groups.

Changing the default port may reduce noise in logs, but it is not a substitute for strong authentication, patching, or network restrictions. If you change the port, update firewall rules, monitoring, automation, and client configuration together.

## 5. Disable unneeded SSH features

Turn off features that the host does not require. For example:

```text
X11Forwarding no
```

If the server does not need SSH forwarding, consider disabling forwarding options such as TCP and agent forwarding. The exact controls include `AllowTcpForwarding` and `AllowAgentForwarding`; their impact depends on how users and applications connect. A blanket restriction can break legitimate tunnels, deployment processes, or administrative workflows, so document exceptions and test them.

Avoid copying lists of ciphers, key-exchange algorithms, or MACs from old guides without checking current OpenSSH and distribution guidance. Algorithm support changes over time, and unnecessary overrides can cause interoperability problems or weaken a configuration. Prefer maintained system defaults unless you have a specific compatibility or policy requirement.

## 6. Make conservative changes and validate them

A safe change process helps prevent both lockouts and unintended access:

1. Record the current configuration and identify the file and service used by your distribution.
2. Keep an active session open and confirm console or recovery access.
3. Make one logical group of changes at a time.
4. Run `sudo sshd -t` after editing.
5. Review effective settings with `sudo sshd -T`, including connection-specific evaluation where needed.
6. Reload the daemon using the service name for your distribution.
7. Open a new SSH connection and test required accounts and authentication methods.
8. Review logs and monitor for failures before ending the original session.

Service names differ. Common reload commands include:

```bash
sudo systemctl reload sshd
```

or, on some Debian-based systems:

```bash
sudo systemctl reload ssh
```

Check the service name on the host before running a command. If reload is unsupported or the service does not become healthy, use the distribution’s documented recovery procedure. Do not restart or reload a remote daemon without a way to recover from a failed configuration.

## 7. Monitor access and maintain keys

Review authentication logs for unexpected accounts, repeated failures, and successful logins at unusual times. Log locations and journal identifiers vary by distribution. You can often inspect the system journal with:

```bash
sudo journalctl -u sshd --since today
```

On systems where the unit is named `ssh`, use that service name instead. Logging helps with detection and troubleshooting, but it does not prevent compromise by itself. Make sure logs are retained and monitored in a way appropriate to the system’s risk.

Maintain an inventory of authorized keys and remove access when people, devices, or services no longer need it. Rotate keys when they are exposed, when ownership changes, or when your policy requires rotation. Keep a documented process for lost keys and emergency access. Treat server host keys separately from user keys: clients use host keys to identify servers, so unexplained host-key changes should be investigated rather than dismissed.

## Troubleshooting common SSH problems

### A key is rejected

Check that the public key is in the correct account’s `authorized_keys` file, that file and directory permissions are acceptable, and that the server permits public-key authentication. Use verbose client output to narrow down the failure:

```bash
ssh -vvv admin@server.example
```

Do not share the output publicly without reviewing it for hostnames, usernames, addresses, or other sensitive details.

### The configuration test passes, but access still fails

A syntax test does not prove that the effective settings match your intention or that a firewall permits the connection. Check `sshd -T`, connection-specific `Match` rules, firewall and network controls, account status, and server logs. Also confirm that the client is connecting to the expected host and port.

### A reload command fails

Check the service name and status for your distribution, then inspect the journal for the relevant unit. Run `sshd -t` again and review recent changes. If remote access is unavailable, use the console or recovery path rather than making further unverified changes remotely.

## FAQ

### Is changing the SSH port enough to secure a Linux server?

No. A non-default port may reduce automated scan noise, but it does not stop a determined attacker or replace strong authentication, patching, access restrictions, and monitoring.

### Should I disable password authentication?

For many administrative servers, key-based authentication is a suitable choice, but disable passwords only after testing key access for every required account and confirming that automation and recovery procedures will continue to work. Account for any MFA design that uses password or keyboard-interactive authentication.

### Is it safe to disable root SSH login?

It is a common hardening measure when administrators can use named accounts and `sudo`. Confirm that your recovery and provisioning processes do not depend on direct root login, and test a privileged workflow before removing the existing access path.

### Do I need to specify SSH ciphers manually?

Usually not. Manually pinning algorithms can create compatibility problems and may preserve outdated choices. Follow current distribution guidance and change algorithm settings only to meet a specific, reviewed requirement.

## Conclusion

Effective Linux SSH hardening combines sound authentication, limited access, careful configuration, and ongoing maintenance. Use individual accounts and protected keys, disable access paths you do not need, and preserve MFA or forwarding capabilities that your environment relies on. Most importantly, validate effective settings and test a new connection before closing your working session. Revisit this checklist whenever accounts, networks, software, or operational requirements change.
