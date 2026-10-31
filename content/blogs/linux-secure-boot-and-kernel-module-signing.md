# Linux Secure Boot and Kernel Module Signing

Linux Secure Boot and kernel module signing help defend a system against unauthorized changes to its boot path and kernel code. They are related controls, but they do different jobs: Secure Boot checks components as the machine starts, while module signing lets the running kernel verify code loaded into it later.

Understanding where each check happens—and which keys your system trusts—is important when installing a third-party driver, building a module with DKMS, or hardening Linux workstations and servers. This guide explains the mechanisms, their practical limitations, and a cautious workflow for signing a module you control.

## What Linux Secure Boot does

Secure Boot is a UEFI feature that uses cryptographic signatures to decide whether firmware should start a boot component. UEFI firmware maintains trusted and revoked certificates and hashes. Commonly, it verifies a first-stage loader, which may then verify later components such as the Linux kernel. The precise chain depends on the hardware, distribution, and boot configuration.

On many Linux systems, the chain involves **shim**, a small bootloader signed by a certificate trusted by the firmware. Shim can verify the distribution's bootloader and kernel. It may also support Microsoft-signed components and locally enrolled keys, depending on how the distribution configured it. Secure Boot is therefore not one universal Linux policy: the components and trust relationships vary.

At a high level, a typical chain looks like this:

1. UEFI firmware checks the first bootloader against its allowed and revoked signatures.
2. A trusted loader, such as shim, verifies the next boot component.
3. The bootloader starts a kernel accepted by the distribution's trust policy.
4. The kernel may enforce additional protections, including restrictions on loading unsigned modules.

A successful Secure Boot check means the relevant component was accepted under the configured trust policy. It does not prove that the component is vulnerability-free or that every part of the system is trustworthy.

## What kernel module signing does

A kernel module is code that can be loaded into the running kernel, for example a device driver or filesystem module. Because modules execute with kernel-level privileges, loading an untrusted or altered module can undermine the security of the entire system.

Linux supports module signatures. A signature is attached to a module file and checked when the kernel loads it. The kernel must have an appropriate trusted certificate, and the module must be signed using the matching private key. A change to the module after signing can invalidate the signature.

Kernel configuration and distribution policy determine what happens when a module is unsigned or has an invalid signature. Depending on the system, the kernel may reject it, allow it while recording a taint, or apply another policy. Enforcement can involve configuration such as `CONFIG_MODULE_SIG_FORCE` and, on some distributions, lockdown behavior associated with Secure Boot. Do not assume Secure Boot automatically means every Linux installation rejects every unsigned module; check the running system and distribution documentation.

Module signing answers a narrow question: **does this module match a signature made by a key this kernel trusts?** It does not establish that the module is safe, current, or appropriate for your system. A trusted signing key can sign malicious code, and a compromised private key can be abused to authorize code.

## How Secure Boot and module signing fit together

Secure Boot protects the startup path. Module signing protects a later point: loading kernel code while the system is running. A distribution may use its own signing key for kernel modules, while an administrator may enroll a separate key for locally built or third-party modules.

The trust path for a locally enrolled key is distribution-dependent. Some systems use shim's Machine Owner Key (MOK) mechanism and make enrolled MOK certificates available to the kernel for module verification. Other configurations may use different keyrings or enrollment procedures. A key enrolled in firmware is not necessarily interchangeable with a MOK, and a certificate that appears enrolled does not guarantee the running kernel will trust it for modules.

Check your distribution's documentation before changing trust settings. In particular, confirm how its shim, kernel, MOK tooling, and module-loading policy work together.

## Check the system's current state

Start by identifying the running kernel and Secure Boot status. The following commands are common on distributions that provide `mokutil` and expose the relevant kernel interfaces:

```bash
uname -r
mokutil --sb-state
cat /sys/kernel/security/lockdown 2>/dev/null
```

The lockdown file may be unavailable, and its output is not a complete summary of module-signing policy. To inspect a module's signature metadata, use:

```bash
modinfo -F signer ./example.ko
modinfo -F sig_id ./example.ko
```

An empty signer field can indicate that no signer metadata is present, but it does not by itself explain what policy the kernel will apply. For a failed load, inspect kernel messages as well:

```bash
sudo dmesg | tail -n 50
```

Look for messages about a missing key, a rejected signature, an invalid module format, or a version mismatch. These are different problems and require different fixes.

## Sign a locally built module

The following is an example workflow for a module you built or otherwise trust. It is not a substitute for your distribution's documented process. Paths and enrollment behavior vary, and some systems provide tooling that should be preferred over manual steps.

### 1. Create a signing key and certificate

On a system with OpenSSL, an example command to create a self-signed certificate in DER format is:

```bash
openssl req -new -x509 -newkey rsa:2048 \
  -keyout MOK.priv -outform DER -out MOK.der \
  -nodes -days 3650 -subj "/CN=Local module signing/"
```

This creates an **unencrypted** private key. Restrict access immediately and store it securely:

```bash
chmod 600 MOK.priv
```

For production use, follow organizational key-management requirements. Keep the private key off the machine where it is not needed, limit who can use it, and maintain a recovery and rotation plan. Anyone with the private key may be able to sign modules that your system accepts.

### 2. Enroll the certificate if your system requires it

On distributions that use MOK enrollment, the usual flow is to request enrollment and complete the confirmation in the firmware-style screen at the next reboot:

```bash
sudo mokutil --import MOK.der
```

The command typically asks you to set a one-time password for the enrollment confirmation. Reboot and follow the on-screen prompts. This process does not mean every Linux distribution will trust the certificate for module signing; verify the distribution-specific procedure. Do not enroll certificates from untrusted sources.

### 3. Sign the module

Use the `sign-file` script supplied with the kernel build or headers that match the running kernel. A commonly used path is `/lib/modules/$(uname -r)/build/scripts/sign-file`, but it may differ:

```bash
SIGN_FILE="/lib/modules/$(uname -r)/build/scripts/sign-file"
sudo "$SIGN_FILE" sha256 MOK.priv MOK.der ./example.ko
```

Run the signing step after compiling and making any other changes to the module. Do not strip or otherwise modify the module afterward: such changes can invalidate its signature. If the module is rebuilt, sign the new file again.

### 4. Install and test

Install the module using the method appropriate for your system. For a manually managed module, that may involve copying it into the matching `/lib/modules/$(uname -r)/` tree and refreshing dependency metadata:

```bash
sudo depmod -a
sudo modprobe example
```

Replace `example` with the module name, not necessarily its filename. Avoid replacing distribution-managed files without understanding package and update behavior. Confirm the module's signer and check kernel logs if loading fails:

```bash
modinfo -F signer ./example.ko
sudo dmesg | tail -n 50
```

A signature does not fix a module built for the wrong kernel version, missing dependencies, incompatible kernel interfaces, or incorrect installation paths.

## DKMS and kernel updates

DKMS can rebuild out-of-tree modules when a new kernel is installed. If a distribution enforces module signatures, the rebuilt module may need signing before it can load. Some distributions provide DKMS integration for signing and key enrollment; others require local configuration.

Plan for this before a kernel update. Confirm that the build process signs each new module, that the kernel trusts the signing certificate after reboot, and that you can recover if a driver is unavailable. Test update procedures on a representative system where possible. A key that is enrolled once may continue to be trusted, but the module still needs a valid signature after every rebuild.

## Security risks and design choices

### Trusting the wrong key

Enrolling a certificate expands the set of code that may be accepted under the system's trust policy. Enroll only keys whose origin and use you understand. Keep private keys protected and avoid sharing one signing key broadly when separate keys and access controls are practical.

### Assuming Secure Boot prevents all compromise

Secure Boot helps detect boot components that are not accepted by the configured trust chain. It does not prevent exploitation of a vulnerable but correctly signed kernel or bootloader, protect every runtime process, or replace patching and access controls. Firmware configuration, key management, and the physical security of the device also matter.

### Breaking the trust chain during maintenance

Firmware resets, changes to boot configuration, revoked certificates, distribution upgrades, or key rotation can affect whether a system boots or loads modules. Document how keys are enrolled and backed up, and test recovery procedures. Do not disable Secure Boot as a first response to a module error; diagnose the actual failure first.

### Confusing signature validity with software quality

A valid signature proves that a trusted key signed the file and that the signed content has not changed since signing. It is not a security review, provenance guarantee, or vulnerability scan. Obtain modules from trusted sources and keep them updated.

## Practical defensive recommendations

- Keep UEFI firmware, bootloaders, kernels, and modules updated through trusted distribution channels.
- Enable Secure Boot where it fits your threat model and operational requirements; understand which components and keys your platform trusts.
- Use distribution-supported module signing and enrollment procedures where available.
- Enroll only necessary certificates, protect signing keys, and define a process for key rotation and revocation.
- Sign modules after their final build or transformation, and repeat the process after every rebuild.
- Monitor module-load failures and kernel taint or lockdown state as part of troubleshooting and system maintenance.
- Test kernel updates and recovery paths before applying changes broadly, especially on systems that depend on proprietary or out-of-tree drivers.

## FAQ

### Does enabling Secure Boot automatically sign every Linux kernel module?

No. Secure Boot verifies components in the boot chain. Module signing is a separate mechanism used when the running kernel loads modules. A distribution may connect the policies, but the exact enforcement and key handling depend on its configuration.

### Can I use one key for Secure Boot and module signing?

Sometimes a certificate can participate in more than one trust path, but firmware keys, shim MOKs, and kernel module-verification keys are not automatically equivalent. Follow your distribution's guidance and use the least privilege and scope practical for your environment.

### Why does a signed module still fail to load?

Possible causes include a certificate the kernel does not trust, a signature invalidated by later modification, a module built for a different kernel, missing dependencies, or an incompatible module. Check `dmesg`, module metadata, and the distribution's enrollment instructions to distinguish these cases.

### Is disabling Secure Boot a good way to fix a driver problem?

Usually not as a first step. It may change the kernel's security policy, but it does not resolve issues such as an incompatible module or missing dependency. Identify the specific error and use a trusted signing or driver-installation process where appropriate.

## Conclusion

Linux Secure Boot and kernel module signing protect different stages of system operation. Secure Boot helps establish trust during startup; module signatures let the running kernel check code being loaded later. Their effectiveness depends on the trust chain, kernel policy, key management, and maintenance practices—not simply on whether a signature exists.

For administrators, the practical approach is to understand the distribution's enrollment model, protect signing keys, sign modules only after their final build, and test updates and recovery. These measures make the controls useful without mistaking them for a guarantee that trusted software is free of vulnerabilities.
