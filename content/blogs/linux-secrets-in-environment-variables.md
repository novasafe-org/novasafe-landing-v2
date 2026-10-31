# Linux Secrets in Environment Variables

Environment variables are a common way to configure Linux applications. They are easy to pass to a process, supported by most programming languages, and widely used in deployment pipelines. That convenience makes them tempting for API keys, database passwords, and other secrets—but an environment variable is not a secret store.

Whether environment variables are appropriate depends on the threat model, how the application is launched, who can inspect the host, and what protections surround the process. This guide explains the risks, compares practical alternatives, and offers criteria for choosing a defensive design.

## What happens to an environment variable on Linux?

A process receives an environment when it starts. The environment is a collection of name-value pairs, such as `APP_MODE=production`, inherited by child processes unless they are removed or replaced. Applications commonly read these values at startup to configure behavior.

For example, a service might read a database password from `DATABASE_PASSWORD`. The variable is not inherently encrypted or marked as sensitive. It is data available to the process and, depending on permissions and system configuration, potentially to other software or users with access to the process.

Environment variables are useful configuration inputs. The security question is not simply whether they are good or bad, but who can access them, how long they remain available, and what happens if the process or its environment is exposed.

## How Linux secrets in environment variables can be exposed

### Process inspection

Linux exposes process information through `/proc`. Access to another process's details is governed by ownership, procfs mount options, ptrace access checks, and other system controls. Depending on those controls, users with the same UID—or more privileged users—may be able to inspect process information, including environment data.

The exact behavior varies by system. Settings such as `hidepid` on the `/proc` mount can restrict visibility between users, but they do not protect a secret from a privileged administrator or from software running with the same effective access as the target process. Do not assume that a variable is private merely because it is not displayed in a normal process listing.

### Inheritance by child processes

A child process normally inherits its parent's environment. If a web service launches a helper, shell, diagnostic tool, or plugin, that process may receive variables it does not need. A compromised or poorly designed child process can then disclose them through logs, errors, or external requests.

Keep the environment passed to subprocesses as small as practical. Where the application supports it, create a restricted environment for each child instead of passing every variable through.

### Logs, diagnostics, and crash reports

Applications and operational tools sometimes record environment values while producing debug output, support bundles, crash reports, or configuration summaries. A secret can also leak when a script prints the environment or when a deployment system captures process details.

Treat environment dumps as sensitive. Avoid logging all configuration indiscriminately, and redact secret-bearing keys in diagnostics. Review what monitoring and crash-reporting tools collect, not just what the application logs directly.

### Shell history and deployment records

Typing a secret directly into a shell command can put it in shell history. It may also be recorded by terminal session capture, command auditing, CI logs, or deployment tooling. For example, putting a real value in a command such as `export API_TOKEN='secret-value'` is risky because the command itself may be retained.

Avoid hard-coding secrets in commands, scripts, build files, or repository-tracked `.env` files. Disabling shell history is not a complete safeguard: other logging systems may still capture the command, and the variable remains available to the process after it is set.

### Process lifetime and cleanup

An environment variable remains available to the process for as long as the process retains it. Unsetting the variable after startup can reduce accidental exposure through later diagnostics, but it does not erase copies already made by the application, libraries, child processes, or the operating system. It is a limited mitigation, not a reliable secret-erasure mechanism.

## Comparing common approaches

| Approach | Advantages | Risks and limitations | Best suited for |
|---|---|---|---|
| Environment variable | Simple, widely supported, easy to inject at launch | Can be inherited, exposed through process inspection or diagnostics, and awkward for multiline or large secrets | Low-complexity deployments where process access is tightly controlled and the application expects variables |
| Protected file | Familiar, supports larger values, permissions can limit access | Secret exists on disk; backups, deployment artifacts, and incorrect permissions can expose it | Services that can read a restricted file and need a straightforward host-managed solution |
| systemd credential | Designed to provide service-specific credentials as files at runtime | Requires systemd support and correct unit configuration; does not protect against a compromised service or privileged host user | systemd-managed Linux services that need credentials without placing them in the service environment |
| Secret manager or agent | Can centralize access policy, rotation, and auditing, depending on the system | Adds operational dependencies, identity and availability considerations, and integration work | Dynamic workloads or organizations needing centralized lifecycle controls |
| Standard input or file descriptor | Can avoid storing a value in an argument or broad environment | The receiving process and any intermediaries still handle the secret; plumbing can be error-prone | Short-lived handoffs where the application supports a controlled input channel |

No option makes a secret safe from a fully compromised process that is authorized to use it. The goal is to reduce unnecessary access, persistence, and accidental disclosure.

## When environment variables are a reasonable choice

Environment variables can be an acceptable choice when all of the following are true:

- The application requires or naturally supports environment-based configuration.
- Only trusted users and services can inspect the process or its execution context.
- The environment is not dumped into logs, support bundles, or monitoring systems.
- Child processes receive only the configuration they need.
- The secret can be rotated promptly if exposure is suspected.
- A more controlled delivery mechanism would add complexity without meaningfully reducing risk for the workload.

They are less appropriate when many unrelated users share a host, processes run under shared accounts, untrusted plugins or subprocesses are involved, or policy requires centralized secret access and rotation. Consider the consequences of a process inspection or diagnostic leak before choosing this design.

## Safer ways to provide secrets to Linux services

### Use systemd credentials for systemd-managed services

On systems that support systemd credentials, a unit can load a credential and make it available to the service as a file. The service reads the file path provided through `CREDENTIALS_DIRECTORY`, rather than receiving the secret value as an ordinary environment variable.

A simplified unit example is:

```ini
[Service]
LoadCredential=db-password:/etc/myapp/credentials/db-password
ExecStart=/usr/local/bin/myapp
```

The application can read the credential from the directory named by `CREDENTIALS_DIRECTORY`, using the filename `db-password`. Check the systemd documentation and local version for supported options and behavior. Protect the source credential file and the unit configuration, and remember that the application itself must still be trusted with the credential.

Avoid putting the secret value directly in a unit file. Unit files are configuration, not a secure vault, and may be readable by more people or copied into backups and support bundles.

### Use a protected file when the application supports it

A restricted file can be a pragmatic alternative when a service can read a secret from disk. For example, an administrator might create a credential file owned by the service account and limit its permissions:

```sh
sudo install -o myapp -g myapp -m 0600 /dev/null /etc/myapp/db-password
sudoedit /etc/myapp/db-password
```

This is only a starting point. Check parent-directory permissions, ensure backups and configuration-management systems handle the file appropriately, and avoid placing it in a web-accessible or repository directory. File permissions reduce access for other local users, but they do not protect against root or a compromised application running as `myapp`.

### Integrate with a secret manager when lifecycle controls matter

A secret manager can provide a workload with credentials based on its identity, and may support centralized access policies, rotation, or audit records. The exact features depend on the chosen system and configuration. Plan for authentication, network availability, caching, renewal, and failure behavior. A service should not silently fall back to a hard-coded secret if the manager is unavailable.

Secret managers can reduce the number of places where long-lived values are stored, but they do not eliminate the need to protect credentials after delivery to an application.

### Use file-backed secrets in containers where available

Container platforms differ in how they deliver secrets. Some support mounting secrets as files, while others also allow environment-variable injection. Prefer the platform's more restricted file-based mechanism when it fits the application, and verify how the secret is stored, mounted, and exposed to container processes. Do not assume every container runtime or orchestration setup provides identical protections.

For any container, avoid baking secrets into an image or placing them in image build arguments. Images and build metadata may be shared, cached, or retained beyond the intended lifetime of a credential.

## If an application only accepts environment variables

Sometimes the application interface leaves no practical alternative. In that case, reduce exposure around the variable:

1. **Inject it at runtime.** Do not commit it to source control, bake it into an image, or put it in a command that is likely to be recorded.
2. **Limit the process identity.** Run the service as a dedicated, unprivileged account. Restrict who can become that user and who can administer the host.
3. **Limit inheritance.** Pass only required variables to child processes, and avoid running unnecessary shells or diagnostic utilities inside the service context.
4. **Control process visibility.** Review host user boundaries and `/proc` mount options, including whether `hidepid` is appropriate for a multi-user system. These controls do not replace privileged-access controls.
5. **Redact operational output.** Prevent environment dumps and configuration summaries from exposing secret values. Review CI, logging, monitoring, and crash-reporting paths.
6. **Minimize lifetime.** Keep credentials scoped and short-lived where practical. Remove a variable after it is read only if the application can do so safely, and do not treat that step as secure erasure.
7. **Prepare for rotation.** Know how to replace the value and restart or reload the service. If a secret may have been exposed, rotate it rather than relying on deletion of the suspected copy.

A shell script can avoid echoing a value while prompting for it, but the secret still becomes part of the environment if exported:

```sh
read -r -s -p 'API token: ' API_TOKEN
printf '\n'
export API_TOKEN
exec /usr/local/bin/myapp
```

This avoids putting the value directly in the command text, but it does not prevent environment inspection, inheritance, or later logging. Prefer a purpose-built credential mechanism when stronger separation is needed.

## Common mistakes to avoid

- **Assuming `export` makes a value private.** It makes a variable available to the current shell and child processes; it does not encrypt or protect it.
- **Using a `.env` file as if its name were a security control.** A file is only as protected as its permissions, location, backups, and handling. Keep real secrets out of version control.
- **Putting secrets in command-line arguments.** Arguments can be exposed through process inspection and logs. Environment variables are not automatically safe, but command-line arguments are generally not a better secret channel.
- **Dumping the whole environment for debugging.** Environment output can reveal credentials and other sensitive configuration. Log selected, sanitized values instead.
- **Sharing a service account.** Multiple services or users running under the same UID can weaken isolation between their process data and files.
- **Believing that root-level threats can be solved by delivery method.** A host administrator or equivalent privileged compromise can usually access data needed by local services. Protect the host and limit administrative access.

## A practical decision checklist

Before selecting an approach for Linux secrets, answer these questions:

1. Which users, services, and administrators can access the process or its files?
2. Does the application need the secret in its environment, or can it read a file or credential channel?
3. Will subprocesses inherit the value, and can that inheritance be limited?
4. Could logs, crash reports, backups, container images, or CI records capture it?
5. How will the secret be rotated, revoked, and replaced during an outage?
6. Does the workload need centralized identity, auditing, or automated rotation?

Choose the least complex mechanism that meets the workload's security and operational requirements. A protected file or systemd credential may be sufficient for a single host service. A secret manager may be justified when access policy, rotation, or workload scale calls for centralized controls. Environment variables may remain reasonable for a constrained service, provided their exposure paths are understood and controlled.

## FAQ

### Are Linux environment variables encrypted?

No. Environment variables are ordinary process configuration data, not encrypted storage. Protecting the host and controlling access to the process are essential.

### Can another user read my process environment?

It depends on process ownership, privileges, kernel access checks, and `/proc` configuration. Same-UID access and privileged access deserve particular attention. Test the controls on the actual system rather than assuming one universal behavior.

### Is a `.env` file safer than an environment variable?

Not by itself. A `.env` file can be exposed through weak permissions, source control, backups, or deployment tooling. It may be useful as an input to a controlled launch process, but it is not automatically a secure vault. Do not commit real secrets to it.

### Should I unset a secret after an application starts?

It may reduce accidental exposure through later environment dumps, if the application can safely do it. However, copies may already exist, and unsetting does not guarantee that the secret has been erased. Use it as a limited defense, not as the main protection.

### What is the best way to store secrets on Linux?

There is no universal best method. Choose based on who needs access, how the application consumes credentials, the host and deployment model, and requirements for rotation and auditing. For systemd services, systemd credentials can be a useful file-based option; for broader lifecycle needs, consider an appropriately configured secret manager.

## Conclusion

Environment variables are convenient, but convenience does not make them confidential. On Linux, secrets in the environment can be exposed through process access, inheritance, diagnostics, and deployment practices. A sound design starts with a clear threat model, limits which processes and users can access each credential, and avoids unnecessary copies in logs, files, and build artifacts.

Use environment variables when their tradeoffs fit the workload and you can control the surrounding risks. Where stronger delivery controls are needed, compare protected files, systemd credentials, and secret managers against your operational requirements. In every case, plan for least privilege, careful handling, and reliable credential rotation.
