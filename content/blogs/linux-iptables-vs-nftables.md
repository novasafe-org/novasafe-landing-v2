# Linux iptables vs nftables

Choosing between `iptables` and `nftables` is not just a matter of command syntax. The choice affects how firewall rules are organized, updated, persisted, and managed alongside other Linux services. It can also determine whether the commands you run are controlling the ruleset you think they are.

This guide compares the two tools, explains how they relate on current Linux systems, and offers practical checks and security recommendations. The key point: `iptables` remains in use, but on many modern distributions its familiar commands may operate through the `nftables` framework rather than the older legacy backend.

## The short answer

- **`iptables`** is the long-established command-line interface for configuring Linux packet filtering. Its traditional rules and tools are still common in existing systems and documentation.
- **`nftables`** is the newer Linux packet-filtering framework, configured with the `nft` command. It provides a unified ruleset model and features such as sets and maps.
- **`iptables-nft`** is a compatibility backend: the `iptables` command can translate rules into the nftables framework. This is different from **`iptables-legacy`**, which uses the older backend.
- **For a new deployment**, prefer the firewall tooling supported by your distribution and use one primary manager. For an established system, first identify its active backend and rule manager before changing anything.

Neither tool makes a firewall secure by itself. The quality of the policy, its persistence, and the care taken when applying changes matter more than the command name.

## What iptables does

`iptables` is a userspace command used to configure packet-filtering rules in the Linux kernel. Rules are organized into **tables**, **chains**, and **targets**. A table groups rules by purpose; a chain contains rules evaluated at a particular point in packet processing; and a target or verdict determines what happens when a rule matches.

Common tables include:

- `filter` for allowing or dropping traffic.
- `nat` for network address translation.
- `mangle` for specialized packet alterations.
- `raw` for rules that affect connection tracking behavior.

The familiar built-in chains include `INPUT` for traffic addressed to the local system, `OUTPUT` for locally generated traffic, and `FORWARD` for traffic routed through the system. Other tables have additional chains and processing behavior.

Rules are generally evaluated in order. A matching rule can accept or drop a packet, or send processing to another chain. If traffic reaches the end of a built-in chain without a decisive rule, the chain's policy applies. This makes rule order and default policies important: a broad accept rule placed too early can undermine later restrictions.

### Check which iptables backend is active

On systems with the common iptables 1.8 tooling, run:

```bash
iptables --version
```

The output may include `(nf_tables)` or `(legacy)`. The first indicates that the iptables command is using the nftables compatibility backend; the second indicates the legacy backend. Availability and defaults vary by distribution.

Useful inspection commands include:

```bash
iptables -S
iptables-save
ip6tables -S
nft list ruleset
```

The IPv4 and IPv6 commands are shown separately because traditional `iptables` and `ip6tables` tools manage their respective address families. The `nft` command can display nftables rules, including rules created through the iptables compatibility backend. Legacy rules are a separate concern and may not appear in `nft list ruleset`.

## What nftables does

`nftables` is the Linux packet-filtering framework that succeeds the legacy netfilter tools. Administrators configure it with the `nft` command. Rather than maintaining separate rule-management models for each protocol family, nftables provides a unified ruleset structure. For example, the `inet` family can contain rules that apply to both IPv4 and IPv6.

An nftables ruleset is made up of tables, chains, and rules. A **base chain** is attached to a packet-processing hook, such as input, output, or forward, and can have a priority and default policy. Regular chains can be used to organize rule flow. Sets and maps can represent groups of addresses, ports, or other values, which can make policies easier to maintain.

Nftables also supports applying a batch of changes as a transaction. A complete batch is checked and applied together, reducing the risk of leaving a partially updated ruleset if a command in the batch is invalid. This is useful, but it does not remove the need to validate changes or plan a safe rollback.

## iptables vs nftables: key differences

| Area | iptables | nftables |
|---|---|---|
| Main command | `iptables` and related commands | `nft` |
| Ruleset model | Tables, chains, rules, and targets; often separate IPv4 and IPv6 tools | Tables, base and regular chains, rules, sets, and maps; supports families such as `inet` |
| Updates | Often performed through a sequence of commands or a save/restore workflow | Supports batch transactions and ruleset files |
| Compatibility | Legacy backend or nftables compatibility backend, depending on the system | Native nftables interface |
| Existing ecosystem | Common in older systems, scripts, and operational knowledge | Common choice for new native rulesets where distribution tooling supports it |
| Main operational risk | Backend ambiguity, rule ordering, and separate IPv4/IPv6 management | Conflicting rule managers, incorrect hooks or policies, and unsafe ruleset replacement |

These differences are practical rather than a simple measure of security. A carefully maintained iptables policy can be safer than an nftables ruleset that is misconfigured or overwritten by another service.

## Understanding iptables-legacy and iptables-nft

The phrase “iptables versus nftables” can be misleading because `iptables` may refer to more than one implementation.

- **iptables-legacy** uses the older iptables backend.
- **iptables-nft** provides the iptables command interface while storing rules in the nftables framework.
- **nft** is the native command-line interface for managing nftables rules.

With the compatibility backend, a team may continue using familiar iptables commands while the kernel rules are managed through nftables. That can help with migration, but it can also obscure who owns the firewall configuration. A script using `iptables` may interact with the same nftables ruleset as a service using `nft`, depending on the system. Conversely, legacy rules and nftables rules can exist in separate parts of the firewall stack.

Before migrating or troubleshooting, establish which backend is active, inspect all relevant rules, and identify services that may load or modify firewall policy. Do not assume that `iptables -S` shows every rule affecting traffic on the host.

## A practical nftables example for a host firewall

The following is a **starting point for discussion**, not a universal firewall policy. It creates an `inet` table with an input chain that drops unsolicited inbound traffic by default, permits established connections and loopback traffic, and allows new SSH connections on TCP port 22. It also allows ICMP and ICMPv6, which are important for normal network functions and troubleshooting. Outbound traffic is allowed, while forwarding is denied.

```nft
 table inet host_filter {
     chain input {
         type filter hook input priority filter; policy drop;
         iifname "lo" accept
         ct state established,related accept
         ip protocol icmp accept
         meta l4proto ipv6-icmp accept
         tcp dport 22 ct state new accept
     }

     chain forward {
         type filter hook forward priority filter; policy drop;
     }

     chain output {
         type filter hook output priority filter; policy accept;
     }
 }
```

Remove the leading space before `table` if copying the block into a ruleset file; it is included here only to align the example visually. Save the corrected ruleset as a file, then check its syntax before applying it:

```bash
sudo nft -c -f /etc/nftables.conf
```

If validation succeeds, apply it with:

```bash
sudo nft -f /etc/nftables.conf
```

Inspect the result with:

```bash
sudo nft list ruleset
```

This example has important limitations. It permits SSH from any source, does not account for every host's required services, and may conflict with rules managed by a distribution firewall service, container platform, VPN, or configuration-management system. Restrict SSH to trusted addresses or interfaces where practical, and add only the inbound services the host actually needs. Ensure the rules are loaded through the persistence mechanism supported by your distribution; applying a file once does not necessarily make rules survive a reboot.

Do not add a blanket `flush ruleset` to a configuration or run it interactively without understanding the impact. It can remove rules owned by other components and expose services or disrupt networking. Likewise, changing an input policy to drop over a remote connection can lock you out. Use a console or out-of-band access when possible, keep a recovery plan, and test changes before relying on them.

## Equivalent iptables rule examples

A common stateful firewall rule allows packets belonging to established or related connections. With an iptables-style command, it can look like this:

```bash
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
```

The corresponding nftables expression in an input chain is:

```nft
ct state established,related accept
```

These snippets are not complete firewall policies. In iptables, `-A` appends a rule, so its position relative to other rules matters. In nftables, the rule must be placed in a chain attached to the appropriate hook. In either case, adding an allow rule does not automatically create a safe default policy or ensure IPv6 is handled.

## Which should you choose?

### Choose native nftables when

- You are building a new ruleset and your distribution supports nftables as its normal firewall framework.
- You want a unified ruleset for IPv4 and IPv6, or need nftables features such as sets and maps.
- Your team can manage, test, persist, and audit native nftables configuration consistently.

### Keep iptables when

- Existing applications, scripts, or operational procedures depend on it and are correctly maintained.
- Your distribution or network environment explicitly supports an iptables workflow.
- A migration would introduce more risk than benefit without a clear testing and rollback plan.

If iptables is using the nftables compatibility backend, continuing to use iptables commands may still mean that rules are implemented in the nftables framework. That can be a reasonable transitional choice, but document the backend and avoid mixing independent configuration approaches without a clear ownership model.

## Linux security best practices for either tool

1. **Use one authoritative firewall manager.** Decide whether a distribution service, a configuration-management system, or a team-maintained ruleset owns the policy. Avoid competing tools that rewrite or flush one another's rules.
2. **Inspect the active backend and the full ruleset.** Check both IPv4 and IPv6 coverage, and account for legacy rules, compatibility layers, and services that add their own rules.
3. **Set deliberate default policies.** For a host firewall, consider a default-deny inbound policy and explicitly allow required services. Do not apply this blindly to routers, gateways, or systems that must forward traffic.
4. **Keep access narrow.** Limit administrative ports by source address, interface, or VPN where feasible. Remove obsolete exceptions and avoid broad rules that permit more traffic than the service requires.
5. **Account for connection tracking and ICMP.** Stateful rules can allow return traffic without opening every port in both directions. Do not block essential ICMP or ICMPv6 traffic indiscriminately; network diagnostics and functions such as path MTU discovery can depend on it.
6. **Make rules persistent and reviewable.** Use the distribution's supported persistence mechanism. Store configuration in version control where appropriate, document why exceptions exist, and review changes as part of normal change management.
7. **Validate and test before remote changes.** Check syntax, inspect the planned ruleset, maintain console access or a rollback path, and verify access from a separate session before ending the current one.
8. **Test the actual exposure.** Confirm that intended services are reachable and unintended ports are not, from relevant network locations. A local ruleset listing alone does not prove that routing, cloud firewalls, or upstream network controls behave as expected.

## Troubleshooting common problems

### The rules I added do not appear where I expect

Check `iptables --version` to identify the backend, then inspect `nft list ruleset` and the relevant iptables commands. If the system uses the legacy backend, its rules may not be visible in the nftables ruleset. Also check whether a firewall service or container platform is managing rules.

### A service is still unreachable after adding an allow rule

Confirm that the rule is in the chain and hook that process the traffic, that an earlier rule does not drop it, and that the service is listening on the expected address and port. Check IPv4 and IPv6 separately where applicable, as well as host routing and upstream firewalls.

### The firewall works until reboot

A manually applied ruleset may not be configured to load at startup. Follow the persistence instructions for your distribution and check the status and logs of the relevant firewall service. Avoid enabling multiple services that each restore or rewrite firewall rules.

### A remote firewall change cut off access

Use console or out-of-band access to restore the previous configuration. If neither is available, follow the recovery process for the hosting environment. For future changes, keep an existing session open, establish a second test session, and arrange a timed rollback where your environment supports it.

## FAQ

### Is nftables more secure than iptables?

Not automatically. Both can enforce effective packet-filtering policies. Security depends on the rules, correct handling of IPv4 and IPv6, reliable persistence, and avoiding conflicts between managers. Nftables offers a newer ruleset model, but it still needs careful administration.

### Does using iptables mean a system is not using nftables?

No. The iptables command may use the `iptables-nft` compatibility backend and manage rules through nftables. Check `iptables --version` and inspect the ruleset rather than inferring the backend from the command name alone.

### Can iptables and nftables run at the same time?

A system may have rules managed through different backends or tools, but that does not mean mixing them is a good operational practice. Multiple rule managers can make policy harder to understand and can cause unexpected access or outages. Identify all owners and choose a clear source of truth.

### Should I migrate an existing server from iptables to nftables?

Migrate when there is a clear operational benefit and you can inventory the current policy, test an equivalent ruleset, verify persistence, and maintain a rollback path. Avoid a rushed conversion on a remote production system or one with undocumented rules.

## Conclusion

The practical choice in **Linux iptables vs nftables** depends on your distribution, active backend, existing tooling, and ability to maintain the ruleset. Iptables remains useful for compatibility and established environments; nftables provides a native, unified framework with a flexible ruleset model. Identify what is actually managing packets before making changes, keep one clear firewall owner, and test every policy update with a recovery plan. Those habits matter more to Linux security than choosing a particular command-line interface.
