# Linux cgroups and Resource Abuse Prevention

A single process can consume far more CPU, memory, or process slots than a host can spare. A runaway workload, compromised service, or fork bomb can degrade other applications or make a system unresponsive. Linux control groups, usually called **cgroups**, help administrators account for and constrain resource use by groups of processes.

Cgroups are a useful part of **Linux cgroups resource abuse prevention**, but they are not a complete security boundary. Effective controls depend on choosing appropriate limits, placing workloads in the right groups, and combining resource management with permissions, isolation, monitoring, and operational safeguards.

This guide explains the cgroup model, common resource-abuse risks, practical ways to inspect and apply limits, and design choices for safer Linux systems.

## What are Linux cgroups?

A cgroup organizes processes into a hierarchy and applies resource accounting or controls to a group and its descendants. A process belongs to a cgroup, and child processes normally inherit that membership. This makes cgroups useful for grouping a service, container, user session, or batch job rather than trying to control each process separately.

Cgroups are commonly used to:

- **Account for usage:** Observe CPU time, memory events, process counts, and other activity.
- **Limit consumption:** Set ceilings or apply throttling for supported resources.
- **Distribute resources:** Give groups relative priority when resources are contested.
- **Contain workload impact:** Reduce the chance that one workload exhausts resources needed by others.

Cgroups do not, by themselves, isolate files, network access, system calls, or user identities. Containers and service sandboxes often combine cgroups with namespaces, Linux capabilities, seccomp, filesystem restrictions, and other controls.

## Cgroup v1 and v2

Linux has two cgroup implementations:

- **Cgroup v1** uses separate hierarchies for different controllers. Its layout and behavior depend on how the host is configured.
- **Cgroup v2** uses a unified hierarchy and a consistent set of interfaces. It is the default on many current distributions, though older systems and some environments may still use v1 or a hybrid setup.

Check the filesystem type mounted at the usual cgroup location:

```bash
stat -fc %T /sys/fs/cgroup
```

A result of `cgroup2fs` indicates a unified v2 hierarchy. On v2, available controllers can be listed with:

```bash
cat /sys/fs/cgroup/cgroup.controllers
```

The exact files and controls available depend on the kernel, hierarchy, and host configuration. Do not assume that a v2 command or file layout applies unchanged to v1.

## Resources that matter for abuse prevention

### CPU

CPU controls can provide a hard quota or a relative share of CPU time. In cgroup v2, `cpu.max` sets a quota over a period; `cpu.weight` influences relative allocation when groups compete for CPU. A weight is not a hard cap. On a systemd-managed host, the `CPUQuota` property provides a convenient quota setting.

A quota can protect other workloads from CPU saturation, but an overly restrictive value can make legitimate work slow or cause timeouts. Consider expected concurrency and latency before setting one.

### Memory

Cgroup v2 provides several memory controls. `memory.max` is a hard limit: reaching it can trigger reclaim and, if the limit cannot be met, an out-of-memory event affecting processes in the cgroup. `memory.high` is a pressure threshold that prompts stronger reclaim and throttling before the hard limit is reached; it is not a substitute for a hard ceiling when one is needed.

Memory limits should account for normal peaks, caches, and workload bursts. A limit set too low can cause repeated reclaim, failures, or out-of-memory kills. Depending on configuration, swap can also affect behavior; v2 exposes `memory.swap.max` where supported.

### Process and thread count

A process storm can exhaust process slots or other kernel resources. In cgroup v2, `pids.max` limits the number of tasks, including threads, in a cgroup and its descendants. When the limit is reached, attempts to create more tasks can fail. Systemd exposes a related control through `TasksMax`.

Set this limit with care: applications that use worker pools or many threads may need more tasks than a simple process count suggests.

### I/O

Cgroup I/O controls can limit or prioritize access to supported block devices. In v2, `io.max` can impose bandwidth or IOPS limits for a device, while `io.weight` influences relative distribution. Device support and the exact effect depend on the storage stack and kernel. I/O controls do not automatically limit every kind of storage or network traffic.

## How resource abuse happens

Resource abuse is not always an intentional attack. A software defect, bad configuration, or unexpected workload can have similar effects. Common examples include:

- **CPU exhaustion:** An unbounded loop or computationally expensive request keeps CPUs busy.
- **Memory exhaustion:** A service allocates memory without effective bounds, potentially causing host-wide pressure.
- **Process exhaustion:** A fork bomb or uncontrolled worker creation consumes task capacity.
- **I/O contention:** A job generates heavy disk activity that slows latency-sensitive services.
- **Noisy-neighbor impact:** One tenant or workload consumes a disproportionate share of shared resources.

Cgroups reduce the potential impact by applying controls to the workload as a group. They do not determine whether the workload is authorized, stop every form of denial of service, or guarantee that the host remains available. For example, network bandwidth controls generally require separate mechanisms, and a privileged administrator can change cgroup settings.

## Apply practical limits with systemd

On many Linux distributions, systemd creates and manages cgroups for services and scopes. A transient scope is a practical way to run a command with temporary resource controls:

```bash
sudo systemd-run --scope --unit=limited-job \
  -p MemoryMax=512M \
  -p CPUQuota=50% \
  -p TasksMax=128 \
  -- /usr/bin/python3 -c 'print("Run the workload here")'
```

This example asks systemd to run the command in a scope with a 512 MiB memory ceiling, a CPU quota of 50% of one CPU over the quota period, and a maximum of 128 tasks. The settings are examples, not universal recommendations. Confirm that your systemd version supports the properties and that the resulting limits match your workload.

For a long-running service, configure resource properties in its systemd unit instead of relying on a one-off command. For example, a service drop-in might contain:

```ini
[Service]
MemoryHigh=400M
MemoryMax=512M
CPUQuota=50%
TasksMax=128
```

Apply unit changes with `systemctl daemon-reload`, then restart the service when appropriate. Review the service's logs and resource behavior after changing limits. A limit that prevents abuse but repeatedly kills a legitimate service is not a successful operational configuration.

## Inspect cgroup usage and configuration

Useful systemd tools include:

```bash
systemd-cgtop
systemd-cgls
```

`systemd-cgtop` displays resource use by cgroup, while `systemd-cgls` shows the cgroup tree. Their available columns and details depend on the system.

To locate a systemd unit's cgroup path, use:

```bash
systemctl show limited-job.scope -p ControlGroup
```

The returned path is relative to the cgroup mount on a unified v2 system. Inspect the relevant files in that directory, such as `memory.current`, `memory.events`, `cpu.stat`, or `pids.current`, if they are present. These files can help distinguish an active limit from a workload that is simply using resources normally.

For a v2 hierarchy, controllers must be available and enabled appropriately through the hierarchy. A controller may appear unavailable in a child if it has not been enabled by its parent. Systemd generally manages this structure for its units; manually editing cgroup files on a systemd-managed host can conflict with the manager and may not persist.

## Design recommendations for cgroup-based prevention

1. **Set limits at the workload boundary.** Put each service, tenant, or batch job in a distinct managed unit or container cgroup. A limit on one unrelated process does not protect a workload that is outside that cgroup.
2. **Use a layered set of controls.** Consider CPU, memory, and task limits together. Add I/O controls where storage contention is a material risk and the platform supports them.
3. **Choose limits from observed behavior.** Measure typical use and legitimate peaks, then allow reasonable headroom. Avoid copying example values without considering the application.
4. **Distinguish caps from priorities.** CPU and I/O weights influence sharing; they do not provide the same guarantee as a hard quota or maximum.
5. **Plan for failure behavior.** Decide how the service should respond to memory pressure, task creation failures, or CPU throttling. Test the behavior in a safe environment before production rollout.
6. **Restrict who can change controls.** Limit access to privileged systemd operations, cgroup delegation, and container runtime administration. A user who can move processes or change relevant controls may undermine the intended policy.
7. **Monitor both usage and events.** Track utilization, throttling, limit events, restarts, and application health. Resource metrics are most useful when connected to alerts and an incident response process.
8. **Keep hierarchy and ownership clear.** Use systemd or the relevant container runtime as the authoritative manager where possible. Avoid competing tools that make ownership and enforcement difficult to understand.
9. **Test escape and delegation assumptions.** Cgroups are not a complete isolation boundary. Review privileges, namespaces, mount visibility, and delegation settings for workloads that should not be able to alter their placement or limits.
10. **Account for host-level needs.** Leave capacity for the operating system and critical services. If every workload is allowed to consume all available resources, individual caps may still leave no practical reserve for the host.

## Troubleshooting common problems

- **A resource property is rejected:** Check the systemd version, unit type, property spelling, and whether the host uses cgroup v1 or v2. Consult the local `systemd.resource-control` documentation.
- **A controller or file is missing:** Confirm which hierarchy is mounted and which controllers are available. On v2, controller availability and delegation depend on the parent hierarchy.
- **A limit appears ineffective:** Verify that the workload is actually inside the expected cgroup. Check the unit's `ControlGroup` property and inspect its current usage and limit files.
- **A service fails after a limit is added:** Review service logs and cgroup event counters. The limit may be below legitimate demand, or the application may need more tasks, memory, or CPU time.
- **A rootless command cannot apply a setting:** Some controls require privileges or systemd delegation. Do not work around this by granting broad privileges; configure the appropriate manager and permissions instead.

## FAQ

### Are cgroups the same as containers?

No. Cgroups account for and control resources. Containers usually combine cgroups with other isolation features, such as namespaces and restricted capabilities. A cgroup alone does not provide a complete container security boundary.

### Can cgroups prevent a fork bomb?

A task limit can constrain the number of tasks created within a cgroup, reducing the impact of a fork bomb confined to that group. It does not protect processes outside the group, and correct placement and permissions still matter.

### Does a CPU weight cap CPU usage?

No. A CPU weight sets relative priority when groups compete for CPU. Use a quota, such as systemd's `CPUQuota`, when a hard CPU ceiling is required.

### Should I set memory limits for every service?

Limits can improve resilience, especially on shared hosts, but values that are too low can disrupt normal operation. Measure usage, allow headroom, understand the service's behavior under pressure, and monitor for limit events after deployment.

## Conclusion

Linux cgroups provide a flexible way to group workloads, measure their resource use, and apply controls that reduce the impact of runaway or abusive processes. Effective Linux cgroups resource abuse prevention starts with placing workloads in the right hierarchy, choosing limits based on real demand, and monitoring both resource use and failure events.

Use cgroups alongside appropriate permissions and isolation controls, and test the effects of limits before relying on them in production. This makes resource controls a practical part of a broader Linux security and reliability strategy.
