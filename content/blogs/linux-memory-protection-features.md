# Linux Memory Protection Features

Linux memory protections make it harder for bugs such as buffer overflows and use-after-free errors to become successful attacks. They do not eliminate vulnerabilities, and no single setting proves that a system is secure. Effective protection depends on the kernel, hardware, compiler, build configuration, and how a program behaves at runtime.

This guide explains key Linux memory protection features and provides a practical workflow for assessing them in an authorized environment. You will check system settings, inspect executable files, observe a running process, and identify reasonable remediation steps.

## What Linux memory protection features do

Memory protections limit where code can run, how memory regions can be accessed, and how predictable memory addresses are. They operate at different layers:

- **Kernel and hardware protections** apply to the operating system and processor.
- **Process protections** affect address layout and permissions at runtime.
- **Executable hardening** depends on how an application was compiled and linked.

A useful assessment considers all three. For example, system-wide Address Space Layout Randomization (ASLR) can be enabled while an individual application still lacks Position-Independent Executable (PIE) support.

## Key protections to understand

### Address Space Layout Randomization (ASLR)

ASLR varies the locations of memory regions, such as the stack, shared libraries, and—in suitable executables—the main program. Randomized locations can make it more difficult to reuse known addresses in an exploit.

On many Linux systems, the `kernel.randomize_va_space` setting controls ASLR:

- `0`: ASLR is disabled.
- `1`: Randomizes several process memory regions.
- `2`: Also randomizes the heap on systems that support this distinction.

The exact behavior can depend on the kernel and architecture. ASLR is not a substitute for fixing memory bugs, and a non-PIE main executable may not have its load address randomized even when ASLR is enabled.

### Non-executable memory (NX) and the `noexec` stack

NX, also called Data Execution Prevention on some platforms, uses hardware and operating-system support to prevent execution from memory regions that should contain data. A non-executable stack is a common example. This can obstruct attacks that try to place and execute code on the stack, but it does not prevent every form of code execution.

The `noexec` mount option is different: it restricts execution of files from a mounted filesystem. It does not, by itself, establish that a process’s stack or other memory mappings are non-executable.

### Position-Independent Executables (PIE)

A PIE executable can be loaded at different addresses, allowing ASLR to randomize the main program’s location. PIE is a build property; system-wide ASLR cannot make a conventional, non-PIE executable fully position-independent.

### RELRO

Relocation Read-Only (RELRO) hardens parts of an executable’s relocation data after the dynamic loader has processed them. **Full RELRO** also resolves symbols at startup, allowing relevant relocation areas to be made read-only. This can make some memory-corruption techniques harder, though it does not prevent the underlying bug.

### Stack canaries and related compiler protections

A stack canary is a value placed near certain stack data. When supported and enabled by the compiler, a function checks the value before returning and may terminate if it has changed. Canary coverage is not universal, and canaries do not protect every object or memory-corruption pattern.

Compiler options such as fortified library checks can add further safeguards for some operations. Their availability and coverage depend on the compiler, optimization level, system libraries, and application code.

### Kernel protections

Kernel protections operate below individual applications. Examples include **KASLR**, which randomizes the kernel’s location, and hardware-assisted protections such as **SMEP** and **SMAP** on supported x86 systems. These features help restrict certain kinds of execution or access from kernel mode. Their availability depends on the CPU and kernel configuration; a CPU flag alone does not establish that every relevant protection is active.

## Practical assessment workflow

Run these checks only on systems and binaries you own or are authorized to assess. Record the system, kernel, toolchain, target binary, and test conditions so results can be repeated and compared.

### 1. Record the system and ASLR setting

```sh
uname -a
cat /proc/sys/kernel/randomize_va_space
```

Interpret the ASLR value using the guidance above, while keeping in mind that behavior varies by kernel. A value of `0` is a clear finding to investigate on a general-purpose system. Do not change a production setting merely to make a test pass; first understand operational requirements and your organization’s configuration policy.

Check the kernel command line for an explicit KASLR opt-out:

```sh
cat /proc/cmdline
```

The presence of `nokaslr` indicates that KASLR has been disabled through that boot parameter. Its absence does not prove KASLR is active: kernel support, configuration, boot process, and platform also matter. Kernel logs may provide additional information, but access and messages vary by distribution.

### 2. Inspect the executable’s ELF hardening

Use `readelf` to inspect the target binary:

```sh
readelf -hW ./target
readelf -lW ./target
readelf -dW ./target
```

Check the output for the following indicators:

- **PIE:** An ELF type of `DYN` can indicate PIE for an executable, but shared libraries also use this type. Confirm that the file is an executable and, where available, use a tool such as `checksec` to summarize the result.
- **Non-executable stack:** In the program headers, look for `GNU_STACK`. Permissions such as `RW` indicate a stack that is not marked executable; `RWE` is a warning to investigate. Interpret the result in the context of the platform and application.
- **RELRO:** Look for a `GNU_RELRO` program header. Full RELRO also requires immediate symbol binding, commonly shown by `BIND_NOW` or a corresponding dynamic flag. A `GNU_RELRO` header alone does not establish full RELRO.
- **Stack canaries:** A reference to `__stack_chk_fail` in the binary can be a useful clue, but it is not proof that every relevant function is protected. Absence is also not a complete assessment of all compiler or runtime defenses.

For a convenient summary, if `checksec` is installed:

```sh
checksec --file=./target
```

Options and output can differ between versions. Treat the summary as a triage aid, then verify important findings with the ELF headers and build configuration. A static inspection describes the file; it does not show every protection active in a running process.

### 3. Observe the running process

For a long-running test application, start it and inspect its mappings while it is running:

```sh
./target &
pid=$!
cat "/proc/$pid/maps"
wait "$pid"
```

The `/proc/<pid>/maps` output shows mapped address ranges and permissions. For example, `r-xp` describes a readable, executable, private mapping; `rw-p` describes a readable, writable, private mapping. Investigate unexpected writable-and-executable mappings, but account for legitimate uses such as just-in-time (JIT) compilation. Some programs create executable memory by changing permissions during operation, so one snapshot may not capture the full behavior.

To assess ASLR for a target that stays alive long enough, repeat the launch and compare relevant mapping addresses across runs. Use the same binary and conditions each time. Debuggers and test harnesses can alter process behavior; for example, a debugger may disable ASLR unless configured otherwise. Do not infer normal runtime behavior solely from a debugging session.

### 4. Check relevant kernel and CPU support

On supported x86 systems, CPU flags can indicate advertised SMEP and SMAP support:

```sh
grep -m1 -oE 'smep|smap' /proc/cpuinfo
```

This reports flags exposed through `/proc/cpuinfo`; it does not independently verify the complete kernel configuration or prove that a specific mitigation is effective. For kernel configuration, check the configuration file provided by your distribution, if available, such as `/boot/config-$(uname -r)`, or `/proc/config.gz` where enabled. Configuration names and availability vary between kernels.

### 5. Triage and document findings

For each finding, capture:

1. The affected host, kernel, executable, and version.
2. The command and evidence, including relevant output rather than just a pass/fail label.
3. Whether the result is confirmed, uncertain, or not applicable.
4. The proposed owner, remediation, and retest conditions.

Prioritize protections that are missing across many exposed programs, then investigate exceptions individually. A JIT runtime with executable mappings, for example, needs a different review from an ordinary command-line utility. Do not classify a feature as absent solely because one inspection tool could not detect it.

## Remediation guidance

### Restore appropriate system settings

If ASLR is unexpectedly disabled, first identify why. Review configuration management, boot parameters, security baselines, and any application-specific compatibility requirements. An administrator can inspect the current value with `sysctl`:

```sh
sysctl kernel.randomize_va_space
```

A temporary change can be made for a controlled test, where authorized:

```sh
sudo sysctl -w kernel.randomize_va_space=2
```

This changes a system-wide setting and may affect other processes. For a persistent change, use the configuration mechanism supported by the distribution and organization; do not assume that a manually edited file is the right source of truth. Validate the setting after reboot and check that no boot parameter or management tool overrides it.

### Rebuild applications with suitable hardening

When you maintain the application, review the project’s supported compiler and linker options. A typical GCC/glibc-oriented starting point for a compatible project is:

```sh
gcc -O2 \
  -D_FORTIFY_SOURCE=3 \
  -fstack-protector-strong \
  -fPIE -pie \
  -Wl,-z,relro,-z,now \
  -Wl,-z,noexecstack \
  -o target source.c
```

This is an example, not a universal drop-in build recipe. `_FORTIFY_SOURCE=3` requires suitable compiler and library support; use an appropriate supported level where it is unavailable. Build systems may need separate compile and link flags, and projects with assembly, custom loaders, JITs, or special runtime requirements need additional review. Test the rebuilt application and its dependencies, then repeat the ELF and runtime checks.

For software you do not maintain, check for a vendor update or report the finding through the appropriate support channel. Avoid patching binaries or changing memory permissions without understanding the security and reliability implications.

## Common troubleshooting points

- **ASLR is enabled, but an executable address appears stable:** The main binary may not be PIE, the test may be using a debugger that changes ASLR behavior, or the comparison may not involve equivalent runs. Check the ELF type and repeat a controlled runtime test.
- **`checksec` reports a different result from `readelf`:** Tool versions and detection heuristics differ. Inspect the relevant ELF headers and dynamic flags directly, then document the evidence.
- **An executable mapping appears in `/proc/<pid>/maps`:** Determine whether it is expected, when it is created, and whether the program can use a safer permission transition. JITs and runtime systems may have legitimate needs, but those mappings deserve review.
- **A kernel feature is listed in CPU flags:** Treat that as evidence of hardware capability, not proof of kernel configuration or active mitigation. Consult the running kernel’s configuration and trusted distribution documentation.
- **A hardening rebuild breaks the application:** Identify which option caused the incompatibility, check toolchain support, and test a narrowly scoped adjustment. Do not remove all hardening flags as a blanket workaround.

## Security considerations

Memory protections are defense in depth. They can make exploitation more difficult, but they do not repair unsafe code, prevent all information leaks, or guarantee that an exploit will fail. Keep software updated, use secure development and review practices, and assess application behavior as well as configuration.

Avoid disabling ASLR or other protections on shared or production systems for convenience. If a controlled test requires a changed setting, isolate it, record the change, limit its duration, and restore and verify the approved configuration afterward.

## FAQ

### Is ASLR enough to protect a Linux application?

No. ASLR makes addresses less predictable, but it does not fix memory-safety bugs. Its effectiveness also depends on factors such as PIE support, available information leaks, and the application’s runtime behavior.

### Does an enabled ASLR setting mean every executable is randomized?

No. A non-PIE executable may have a fixed main-program address even when the system randomizes other regions. Inspect the binary and validate its mappings across comparable runs.

### Does `GNU_STACK` marked `RW` mean the whole process has no executable memory?

No. It indicates the stack is not marked executable in that ELF program header. A process can still have executable code or other executable mappings, so inspect the full program and its runtime behavior.

### Is full RELRO the same as PIE?

No. They are separate hardening features. PIE supports relocation of the main executable, while RELRO helps protect relocation-related data after loading. An application can have one without the other.

### Can I test these protections on a system I do not own?

Only with explicit authorization and within the agreed scope. Even read-only inspection can expose sensitive process or system information. Use an approved test environment and follow the system owner’s rules.

## Conclusion

Evaluating Linux memory protection features requires more than checking one kernel setting. A reliable workflow combines system and kernel review, ELF inspection, runtime mapping checks, and validation after remediation. Use the results to identify concrete gaps, account for legitimate application behavior, and retest changes under conditions that match normal operation.
