# Linux Firewall Rules With nftables

A Linux firewall is only as useful as the rules that control it. **nftables** is the modern framework for defining and managing packet-filtering rules on Linux. It can handle IPv4 and IPv6, and its syntax lets you express firewall policy in a consistent ruleset.

This tutorial explains the building blocks behind Linux firewall rules with nftables, then walks through a basic host-firewall configuration. The example is intended for an intermediate audience: it assumes you can use a shell with administrative privileges and understand the services your system needs to expose.

> **Warning:** A firewall change can cut off remote access. Keep a console or out-of-band recovery method available, and verify remote access from a second session before closing your current one. Do not replace an existing ruleset until you understand what it does.

## How nftables organizes firewall rules

nftables rules are arranged into **tables**, **chains**, and **rules**:

- A **table** groups related chains and rules. Its family determines which traffic it can process. The `inet` family supports both IPv4 and IPv6.
- A **chain** contains rules. Base chains attach to a network hook, such as traffic arriving at the host or traffic being forwarded through it. A base chain also has a priority and a policy.
- A **rule** checks conditions—such as the protocol, port, address, or connection state—and then takes an action, such as accepting or dropping a packet.

For a host firewall, the most relevant hooks are usually:

- `input`: packets destined for the local system.
- `output`: packets sent by the local system.
- `forward`: packets routed through the system to another destination.

A chain policy applies when a packet reaches the end of a base chain without matching a terminating verdict. For example, `policy drop` rejects unmatched traffic. Rules are evaluated in order, so a broad accept rule placed too early can undermine more specific restrictions.

## Plan the policy before writing rules

Before changing the firewall, identify what the machine does and which inbound connections it needs. A workstation, web server, VPN gateway, and container host have different requirements.

For a simple server, a reasonable starting design may be:

1. Allow loopback traffic.
2. Allow traffic belonging to established or related connections.
3. Drop invalid connection-tracking states.
4. Allow necessary ICMP and ICMPv6 traffic.
5. Allow only the required inbound services, such as SSH or HTTPS.
6. Drop other inbound traffic.
7. Keep forwarding disabled unless the host is intentionally routing traffic.

This is a starting point, not a universal policy. Check dependencies such as DHCP, VPN software, container platforms, monitoring agents, and remote-management tools. A firewall may also interact with rules installed by other software.

## Build a basic nftables host firewall

The following example allows SSH on TCP port 22 and leaves outbound traffic unrestricted. It applies to IPv4 and IPv6 through the `inet` table. Replace the SSH rule with the ports and access restrictions appropriate for your environment.

### 1. Check the current ruleset

Before making changes, inspect what is already loaded:

```bash
sudo nft list ruleset
```

If another tool or service manages firewall rules, find out how it works before editing the configuration. Replacing its rules can break networking, container connectivity, or system management.

### 2. Create a configuration file

On systems that use `/etc/nftables.conf`, a basic configuration could look like this:

```nft
#!/usr/sbin/nft -f

flush ruleset

table inet filter {
    chain input {
        type filter hook input priority filter; policy drop;

        iifname "lo" accept
        ct state established,related accept
        ct state invalid drop

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

The `flush ruleset` command removes all currently loaded nftables tables before adding this configuration. That makes the file self-contained, but it can also remove rules managed by other software. **Do not use it blindly on an existing system.** If you need to preserve other rules, coordinate with their owner and adapt the configuration rather than replacing the complete ruleset.

The input chain uses a default-drop policy. Loopback traffic is accepted, and connection tracking allows packets that belong to established or related connections. The two ICMP rules allow IPv4 ICMP and IPv6 ICMP, which carry more than echo requests—for example, some network error and control messages. Restricting ICMPv6 without accounting for IPv6 functions such as Neighbor Discovery and Path MTU Discovery can cause connectivity problems.

The SSH rule allows new inbound TCP connections on port 22 from any source. To restrict SSH to a trusted IPv4 network, replace it with a rule such as:

```nft
ip saddr 192.0.2.0/24 tcp dport 22 ct state new accept
```

Use the actual trusted address range for your environment; `192.0.2.0/24` is an example documentation range, not a real management network. An IPv4 source restriction does not restrict IPv6. If SSH is reachable over IPv6, define and test an appropriate IPv6 policy too.

For a web server, add an explicit rule for the required ports inside the `input` chain, before its closing brace:

```nft
tcp dport { 80, 443 } ct state new accept
```

Only open services that are installed, intentionally exposed, and protected by their own access controls. A firewall rule does not secure the application listening on that port.

### 3. Validate and load the rules

Check the file for syntax errors before applying it:

```bash
sudo nft -c -f /etc/nftables.conf
```

If validation succeeds, load it:

```bash
sudo nft -f /etc/nftables.conf
```

Then inspect the active rules:

```bash
sudo nft list ruleset
```

A successful syntax check confirms that nftables can parse the file; it does **not** confirm that the policy is right for your system or that remote access will remain available. When managing a remote host, apply changes while you have recovery access, keep the current session open, and test a new connection before ending it.

### 4. Enable persistence

Loading rules with `nft -f` applies them to the running system. Whether they return after a reboot depends on the distribution and its service configuration. Many distributions provide an nftables service that loads `/etc/nftables.conf`; check your distribution’s documentation and existing firewall setup. Where the service is provided and configured for that file, enabling it may look like:

```bash
sudo systemctl enable --now nftables
```

Do not enable a second firewall manager without checking how it interacts with the one already in use. After configuring persistence, verify the ruleset after a planned reboot or in a suitable test environment.

## Important design choices and security risks

### Default-drop versus default-accept

A default-drop input policy makes the allowed inbound services explicit and reduces accidental exposure. Its tradeoff is operational: a missing rule can block a required service. Document each exception and test the services the host depends on.

A default-accept policy is easier to adopt incrementally, but it does not provide the same inbound restriction. Choose a policy intentionally rather than relying on an undocumented default.

### Connection tracking and rule order

`ct state established,related accept` is commonly placed near the start of an input chain so replies to allowed connections can pass. The `related` state can also cover certain associated traffic, depending on the protocol and connection-tracking helpers in use. `ct state invalid drop` rejects packets that connection tracking identifies as invalid.

These rules are not a substitute for reviewing the rest of the policy. For example, an overly broad accept rule above a restrictive rule may make that restriction ineffective. Read the complete chain in order when troubleshooting or reviewing changes.

### IPv4 and IPv6 both need a policy

Using an `inet` table helps apply rules to both IP families, but it does not automatically guarantee that every rule behaves as intended for both. Check whether services listen on IPv6, and test reachability over IPv4 and IPv6 separately. Do not assume that disabling or filtering IPv4 also protects an IPv6-enabled host.

### The forward chain is not a complete router policy

The example drops forwarded traffic. If the system is a router, VPN gateway, or container host, it may need carefully scoped forwarding rules and related routing configuration. Forwarding can expose networks behind the host, so define which interfaces and destinations are permitted. NAT, when needed, is a separate concern and is not configured by this example.

### A firewall is one layer of defense

Firewall rules reduce network exposure; they do not patch vulnerable software, authenticate users, or replace application-level controls. Keep services and the operating system updated, disable unused listeners, use strong authentication, and monitor important systems. Review firewall changes as part of your normal change-management process.

## Troubleshooting nftables rules

If a connection fails after applying a ruleset, work through these checks:

1. **Confirm the active rules.** Run `sudo nft list ruleset` and check the relevant table, chain, policy, and rule order.
2. **Check the service itself.** Confirm that the application is running and listening on the expected address and port. A firewall cannot make a stopped service reachable.
3. **Check both address families.** Test IPv4 and IPv6 independently if both are enabled. Verify that the rule covers the family and source address being used.
4. **Look for another firewall manager.** A distribution service, container runtime, or security tool may install additional rules or alter packet handling.
5. **Check routing and upstream filtering.** A host firewall cannot fix a missing route, a cloud security-group restriction, or a firewall elsewhere in the network.
6. **Use counters or tracing where appropriate.** Adding `counter` to a rule can help show whether traffic matches it. `nft monitor trace` can display traced packets, but you must first mark relevant traffic for tracing with an `nftrace` rule; tracing is not automatically enabled for every packet.

When testing changes, make one deliberate change at a time and keep a known-good recovery path. Avoid repeatedly flushing the ruleset as a troubleshooting shortcut on a production or remote machine.

## FAQ

### Is nftables the same as iptables?

No. They are different user-space interfaces and rule-management approaches for Linux packet filtering. Many modern Linux distributions use nftables, and the `iptables` command may use an nftables compatibility backend. Check the tools and services installed on your system before mixing commands or management methods.

### Does the example block all unsolicited inbound traffic?

The input chain’s default policy drops traffic that reaches the end without matching an accept rule. Explicit accepts—including the ICMP rules and the SSH rule—still apply. Other chains, firewall managers, and network devices may also affect what traffic reaches the host.

### Should I allow all ICMP and ICMPv6 traffic?

The example does so as a simple baseline for a general-purpose host. ICMP carries network diagnostics and control messages; ICMPv6 is also important to normal IPv6 operation. If you choose to filter these messages more narrowly, understand the required message types for your network and test carefully.

### Will these rules survive a reboot?

Not by themselves. The `nft -f` command loads rules into the running system. Persistence depends on the distribution’s nftables service or another configured startup mechanism. Confirm which service owns the rules and verify the configuration after rebooting in a safe environment.

## Conclusion

Effective Linux firewall rules with nftables start with a clear understanding of the host’s role, required services, and recovery options. Use explicit policies, review rule order, account for IPv4 and IPv6, and avoid replacing rules managed by other software. Validate syntax before loading changes, test access from a separate session, and make persistence a deliberate part of the setup. A well-maintained firewall is a useful layer of Linux security, but it works best alongside secure services, patching, and ongoing review.
