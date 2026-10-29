# How Linux PAM Authentication Works

A Linux login is rarely a single password check. An application may need to verify credentials, decide whether an account is allowed to log in, update a password, and prepare the user’s session. Linux Pluggable Authentication Modules (PAM) provide a common framework for those tasks, so applications can use configurable authentication policies instead of implementing every check themselves.

Understanding how Linux PAM authentication works helps administrators make deliberate choices about local passwords, directory services, multifactor authentication, and account restrictions. It also helps explain why a valid password does not always result in a successful login: authentication is only one part of the process.

## What PAM does—and what it does not do

PAM is a set of libraries and loadable modules used by PAM-aware applications. An application calls the PAM library, identifies the service it represents, and requests operations such as authentication or session setup. The library reads the applicable PAM configuration and runs the modules in the configured order.

PAM is a policy and integration framework, not a credential database. Individual modules perform checks or actions. For example, a module might validate a local account password, contact a directory service, enforce an account rule, or create session resources.

PAM is also distinct from **Name Service Switch (NSS)**. NSS helps programs look up users, groups, and other system information. PAM handles authentication-related policy and operations. A system can use both NSS and PAM with a directory service, but configuring one does not automatically configure the other.

An application must be written to use PAM for PAM policy to affect it. Not every Linux program uses PAM, and different applications may have different PAM service configurations.

## The four PAM management groups

PAM divides common operations into four management groups. A module can participate in one or more of them, and a service can define a separate stack for each group.

| Group | Purpose | Example |
|---|---|---|
| `auth` | Authenticate the user or collect and verify credentials | Check a password or request a second factor |
| `account` | Decide whether the account is allowed to access the service now | Check account status, access rules, or permitted login times |
| `password` | Change or update authentication credentials | Apply password-change rules and update a credential store |
| `session` | Perform setup or cleanup around a session | Record session activity or set up session resources |

These groups are related but not interchangeable. A user can pass the `auth` checks and still be denied by an `account` module. A successful password change uses the `password` group, while session setup typically happens only after access has been granted.

## How a PAM request is processed

A simplified login flow looks like this:

1. **The application starts a PAM transaction.** It supplies a service name, such as `sshd`, and conversation callbacks that PAM modules can use to request input or display messages.
2. **PAM loads the service configuration.** On many Linux systems, service files are in `/etc/pam.d/`. Systems may also use the older `/etc/pam.conf` configuration file. A service file can include or reference shared configuration, depending on the distribution and its conventions.
3. **The application requests an operation.** For example, it may request `auth` checks, then `account` checks, and later session setup. The application controls which PAM operations it calls and when.
4. **PAM runs the relevant module stack.** Modules receive the request and return status codes. Control flags determine how each result affects the overall decision and whether processing continues.
5. **The application acts on the result.** It may deny access, ask for more information, or continue with the login process.

The exact sequence depends on the application and its implementation. PAM configuration influences the policy, but it cannot force an application to request every management group or to use PAM at all.

## PAM configuration: services, modules, and control flags

A typical line in a file under `/etc/pam.d/` has this general form:

```text
management_group  control_flag  module_path  module_arguments
```

For example, an illustrative line might look like:

```text
auth  required  pam_unix.so
```

Here, `auth` identifies the management group, `required` is the control flag, and `pam_unix.so` is the module. The actual configuration on your system may use different modules, arguments, and shared stacks. Do not replace a distribution’s PAM files with a short example: its existing configuration may provide important account, password, session, or recovery behavior.

### Common control flags

Control flags define how a module’s result affects the stack. The most commonly encountered flags are:

- **`required`**: A failure makes the overall stack fail, but PAM continues through the remaining modules in that stack. Continuing can allow later checks or cleanup to run.
- **`requisite`**: A failure makes the stack fail immediately. Later modules in that stack are not run.
- **`sufficient`**: A success can satisfy the stack and return success early, provided no earlier `required` module has failed. A failure is generally not treated as a stack failure by this flag alone.
- **`optional`**: The result usually matters only when no other module in the stack provides a decisive result.

PAM also supports extended control syntax, which can map particular module return values to actions such as continuing, ignoring a result, or returning immediately. These rules are powerful but easy to misread. A small ordering or control-flag change can alter whether a fallback method is reached or whether a failure denies access.

### Why ordering matters

PAM processes modules in stack order, and the control flags determine how that order affects the outcome. For instance, placing a module that can return success early before a required policy check may prevent the intended check from running. Conversely, a mandatory failure can deny access even if another module accepts the user.

When reviewing a stack, ask:

- Which modules must succeed for access to be granted?
- Which failures should stop processing immediately, and which should allow later checks to run?
- Is a fallback intended, and can an earlier success bypass it?
- Are account checks and session modules still reached on the expected paths?

## Common authentication approaches and their tradeoffs

PAM lets administrators combine different approaches, but a stack should reflect a clear access policy rather than simply accumulating modules.

### Local credentials with `pam_unix`

`pam_unix` is commonly used for local Unix account credentials. It is a straightforward choice for standalone systems or as part of a distribution’s standard configuration. It does not, by itself, provide a centralized identity service or multifactor authentication.

Local authentication can reduce dependencies on network services. Its tradeoff is that account management and credential changes may need to be handled separately on each system unless another management process is in place.

### Centralized identity with SSSD or directory-backed modules

A system using a service such as SSSD may use `pam_sss` in its PAM stack to consult configured identity providers. This can support centralized account policies and reduce the need to manage separate local credentials on every host.

Centralized authentication introduces dependencies: network access, the identity provider, and local service configuration can all affect logins. Administrators should plan for outages and define which accounts, if any, need a controlled local recovery path. That path should be secured and tested rather than added as an unexamined fallback.

### Multifactor authentication

A PAM module can add a second factor, such as a time-based one-time password, to a service’s authentication flow. This can reduce reliance on a password alone, but the result depends on how the stack is configured and how the factor is enrolled and recovered.

Before enabling MFA, determine which services will require it, how emergency access will work, and whether module ordering permits an unintended bypass. Test both successful and failed factor checks. Avoid assuming that adding an MFA module automatically protects every login method on the host.

### Account restrictions and access rules

Modules such as `pam_access` or `pam_time` can apply access rules, while `pam_faillock` can be used in configurations that track failed authentication attempts. These mechanisms have different purposes and configuration requirements. A lockout policy, for example, can reduce repeated guesses but may also lock out legitimate users or be abused to disrupt access if its thresholds and recovery process are unsuitable.

Prefer the mechanisms supported by your distribution, follow its documentation, and review the complete stack rather than inserting a module line in isolation.

## Practical review and troubleshooting

PAM changes can affect administrative access, remote logins, scheduled tasks, and other services. A syntax error or incorrect control flow may lock users out. Use a staged, recoverable workflow:

1. **Identify the service and its configuration.** Find the relevant file in `/etc/pam.d/` and follow any included or referenced files. For SSH, also verify that the SSH server is configured to use PAM where applicable; PAM files alone do not establish that.
2. **Read the whole stack.** Review all management groups, module arguments, and control flags. Consider the distribution’s defaults and any configuration-management tooling that may regenerate the files.
3. **Keep a recovery path.** Before editing, ensure you have a tested way to regain access, such as an existing privileged session and authorized console access. Do not close your last working administrative session during a remote change.
4. **Make one change at a time.** Preserve a copy of the original configuration and document the intended behavior of the change.
5. **Test the relevant paths.** Check valid and invalid credentials, account restrictions, MFA success and failure if used, and any required password or session behavior. Test the actual service, not only a different program that happens to use PAM.
6. **Review logs and confirm recovery.** Log locations vary by distribution and logging setup. Check the system journal and the configured authentication logs for messages from the application and PAM modules. Confirm that both intended access and denial cases behave correctly.

A PAM testing utility such as `pamtester` can help exercise a named service and operation when it is available and configured. For example, an administrator might test an authentication operation for a service with a command in this general form:

```bash
pamtester service_name user_name authenticate
```

Replace the placeholders with the actual service and test account. A utility test does not replace testing the target application: the application may make additional PAM calls or handle results differently.

If a login fails unexpectedly, check these points:

- Is the application using PAM and requesting the expected service name?
- Does the service configuration exist, and are included files present?
- Can the system load the referenced module? Check the module name, package, and architecture-specific module path where relevant.
- Are module arguments valid for the installed module version?
- Does an earlier `requisite`, `sufficient`, or extended control rule change the path through the stack?
- Is authentication succeeding while an `account` check denies access?
- Is a remote identity service reachable, and does the user resolve correctly through the system’s identity configuration?
- Do logs show a module error, an account restriction, or an application-level denial?

Avoid debugging by deleting modules or replacing a service file with a minimal stack. That can remove security checks or prevent recovery without revealing the real cause.

## Defensive design recommendations

A sound PAM design is explicit, testable, and compatible with the system’s operational needs.

- **Start from the distribution’s supported configuration.** Use its documented includes and module conventions instead of inventing a stack from scratch.
- **Separate authentication from authorization decisions.** Decide which modules verify identity and which enforce account eligibility, then confirm both are called where needed.
- **Minimize and justify exceptions.** Any fallback should have a defined purpose, limited scope, and a tested failure mode. Avoid broad success paths that can bypass stronger checks.
- **Plan for dependency failure.** For centralized identity or MFA, document what happens during an outage and how authorized administrators recover access.
- **Treat lockout controls as availability controls too.** Choose thresholds and recovery procedures that reduce abuse without making legitimate administration fragile.
- **Test after upgrades.** Module behavior, package defaults, and distribution-managed configuration can change. Revalidate important login paths after relevant system updates.
- **Protect administrative access during changes.** Use an out-of-band recovery option where available, preserve a working session, and apply changes through a controlled process.

The right design depends on whether the system is standalone or centrally managed, which services need protection, what identity providers are available, and what recovery options are acceptable. There is no universally correct PAM stack for every Linux host.

## FAQ

### Does PAM store Linux passwords?

PAM itself is a framework, not a password database. A module such as `pam_unix` can validate local credentials, while other modules can consult different credential or identity services.

### If a password is correct, why can PAM still deny login?

Authentication can succeed while a separate account check denies access. A service may also require another factor, fail to reach an identity provider, or apply a rule that restricts the account or service.

### Does editing `/etc/pam.d/sshd` secure every SSH login?

It changes PAM policy for the SSH service only when the SSH server is configured to use PAM for the relevant operations. SSH settings and authentication methods also affect the overall behavior, so test the actual SSH server configuration.

### Can I copy a PAM stack from another Linux distribution?

That is risky. Distributions may use different modules, include files, defaults, and account or session policies. Use the configuration and guidance intended for the system in question.

## Conclusion

Linux PAM provides a flexible way for applications to apply authentication, account, password, and session policies through configurable module stacks. To understand how Linux PAM authentication works, follow the application’s service configuration, identify the modules and control flags, and distinguish credential verification from account authorization and session setup.

Choose an approach that fits the host’s identity model and operational requirements. Then review the complete stack, test expected success and failure paths, and preserve a reliable recovery method before making changes. Those practices help make PAM flexible without turning its flexibility into an avoidable access risk.
