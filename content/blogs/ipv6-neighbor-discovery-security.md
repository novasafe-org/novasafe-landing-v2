# IPv6 Neighbor Discovery Security

IPv6 Neighbor Discovery (ND) helps devices find each other on a local network, discover routers, and determine how to reach destinations. Because it performs several jobs that IPv4 networks often handle with ARP and other mechanisms, weaknesses in ND can affect more than address resolution: they can expose hosts to traffic interception, denial of service, or unauthorized network configuration.

This guide explains the main ND security risks and provides a practical workflow for evaluating protections in an authorized lab or network. The goal is to observe normal behavior, identify gaps, validate controls safely, and make targeted improvements—not to disrupt production systems.

## What Neighbor Discovery does

Neighbor Discovery is part of ICMPv6. Its messages support several functions on a local link:

- **Router Solicitation (RS, type 133):** A host asks routers to send configuration information.
- **Router Advertisement (RA, type 134):** A router advertises its presence and may provide prefixes, a default route, and other configuration information.
- **Neighbor Solicitation (NS, type 135):** A host resolves a link-layer address, checks whether an address is already in use, or performs reachability checks.
- **Neighbor Advertisement (NA, type 136):** A host or router responds to an NS or announces a change in link-layer information.
- **Redirect (type 137):** A router tells a host about a potentially better next hop for a destination.

These messages are not interchangeable with DHCPv6. Router Advertisements can provide key network configuration even when DHCPv6 is not in use. A network assessment should therefore review both ND and any DHCPv6 services present.

## Why ND needs security controls

ND is essential to IPv6 operation, but a host that accepts misleading messages may make incorrect decisions about its network. Depending on the network and the attacker’s position, potential outcomes include:

- **Rogue Router Advertisements:** An unauthorized device advertises itself as a router, potentially influencing a host’s default route or prefix configuration.
- **Neighbor-cache manipulation:** Forged or unexpected neighbor information can associate an IPv6 address with the wrong link-layer address, creating opportunities for traffic interception or disruption.
- **Denial of service:** Incorrect or conflicting information may interrupt communication or cause hosts to use an unavailable route.
- **Rogue redirects:** A host may be directed toward an unexpected next hop if redirects are accepted without appropriate controls.
- **Address-configuration disruption:** Malicious or mistaken advertisements can interfere with how hosts configure or select addresses.

The risks depend on the network topology, host behavior, switch configuration, and the attacker’s access to the local link. ND is link-local in scope, but a compromised endpoint or untrusted device on that link can still create meaningful risk.

## A practical assessment workflow

### 1. Define scope and establish a baseline

Get written authorization and identify the exact VLANs, interfaces, devices, and test window in scope. Begin with passive observation. Do not introduce test advertisements or neighbor messages on a production segment unless the network owner has explicitly approved the method and impact controls.

Record the expected configuration for each segment:

- Which devices are authorized to send RAs?
- Which prefixes, default routers, and lifetimes are expected?
- Are hosts expected to use DHCPv6, SLAAC, or both?
- Which switch ports connect to routers, managed endpoints, and untrusted devices?
- Are IPv6 redirects required for the environment?

A baseline makes it easier to distinguish a genuine control gap from a legitimate router or configuration change.

### 2. Observe ICMPv6 and inspect host state

On a Linux system, capture ICMPv6 traffic on the interface under review. Replace `eth0` with the correct interface name:

```bash
ip -6 addr show dev eth0
ip -6 route show
sudo tcpdump -ni eth0 -vv 'icmp6'
```

The broad `icmp6` capture is useful for an initial review. It includes ND messages as well as other ICMPv6 traffic, so inspect the decoded message types rather than treating every packet as ND. A short, approved capture can reveal unexpected RAs, frequent neighbor updates, or messages from unfamiliar link-local addresses. Avoid collecting or retaining more traffic than needed.

Review the local neighbor cache and routes:

```bash
ip -6 neigh show dev eth0
ip -6 route show dev eth0
```

Compare the results with the expected router and neighbor inventory. A cache entry changing is not, by itself, proof of an attack; normal connectivity changes can update neighbor state. Investigate unexpected changes alongside packet captures, switch logs, and device ownership records.

### 3. Review host-side acceptance settings

Linux exposes per-interface IPv6 settings through `sysctl`. Check the interface-specific values as well as global and default settings:

```bash
sysctl net.ipv6.conf.all.accept_ra
sysctl net.ipv6.conf.default.accept_ra
sysctl net.ipv6.conf.eth0.accept_ra
sysctl net.ipv6.conf.all.accept_redirects
sysctl net.ipv6.conf.eth0.accept_redirects
```

For `accept_ra`, a value of `0` disables RA acceptance, `1` accepts RAs when the system is not forwarding, and `2` permits acceptance even when forwarding is enabled. The right value depends on the system’s role. A router, a host that intentionally learns its route from an RA, and a server with static networking may need different settings.

Do not apply a blanket setting without checking the role and the effective per-interface configuration. For example, disabling RA acceptance on a host that relies on SLAAC or RA-learned default routes can break connectivity. Persist settings through the operating system’s supported network configuration method, then verify them after a restart or interface reconnection.

### 4. Review network-edge controls

Host settings are only one layer. On managed switches, review controls that restrict which ports can send router advertisements. **RA Guard** is commonly used to permit RAs only from trusted router-facing ports and block them on untrusted access ports. Depending on the platform, additional features may include DHCPv6 Guard, neighbor-discovery inspection, or controls that bind trusted device information to a port.

Check the implementation and configuration, not just whether a feature is enabled. Confirm that:

- Trusted ports are limited to authorized routers and infrastructure.
- Untrusted access ports cannot send RAs toward other hosts.
- Policies cover the relevant VLANs, link types, and switch paths.
- The implementation correctly handles IPv6 extension headers and packet fragmentation where applicable.
- Denied packets and policy changes are logged in a way the operations team can review.

RA Guard implementations and capabilities vary by vendor and software version. Validate the behavior against the platform documentation and a controlled test plan rather than assuming all implementations inspect packets identically.

### 5. Validate controls safely

Use an isolated lab or a dedicated test VLAN with explicit approval before generating test traffic. A controlled validation plan should specify the source port, test device, expected block or alert, rollback steps, and monitoring owner.

A safe test should establish whether an unauthorized test port’s RA is blocked or logged without changing production hosts’ routes. Use a dedicated test host and a test prefix or otherwise harmless configuration. Confirm the result at both ends where possible: inspect the switch policy counters or logs and capture traffic on the receiving side. Do not test by sending rogue RAs on a shared production segment; even a short-lived advertisement can alter host configuration.

For neighbor-cache protections, use platform-supported inspection and validation procedures in the same isolated environment. Compare observed behavior with the product documentation and record any exceptions. Avoid treating a single packet capture or a single host’s cache as conclusive evidence of network-wide enforcement.

### 6. Document findings and remediate

For each finding, record the affected segment, evidence, expected behavior, actual behavior, business impact, and recommended owner. Prioritize fixes that prevent untrusted ports from influencing router configuration, then address host-specific hardening and monitoring gaps.

## Remediation recommendations

### Restrict router advertisements at the network edge

Configure RA Guard or an equivalent control so only authorized router-facing ports can send RAs. Keep the trusted-port list narrow and review it when switch connections or network roles change. Where supported and appropriate, add DHCPv6 Guard and related inspection features as part of a broader IPv6 access-layer policy.

### Harden hosts according to their role

Disable RA or redirect acceptance only where the host’s network design permits it. Systems that require SLAAC or RA-learned routes must continue to receive legitimate advertisements. For Linux, verify the effective settings on each relevant interface and make changes through the distribution’s persistent configuration mechanism.

### Limit unnecessary redirects

If redirects are not needed, disable their acceptance on systems where doing so will not interfere with the network design. If they are required, ensure the network’s router and host behavior is understood and monitored. Do not assume that disabling redirects addresses rogue RAs or neighbor-cache manipulation; these are separate concerns.

### Monitor for unexpected changes

Track authorized routers, expected prefixes, and network-edge policy. Alert on unexpected RA sources, configuration changes, or repeated neighbor updates when the available tooling supports reliable detection. Monitoring should help an operator investigate; it should not automatically classify every unusual ND packet as malicious.

### Keep IPv6 protections in scope

IPv6 may be enabled on endpoints even when a network is primarily managed as IPv4. Include IPv6 interfaces, switch policies, firewall rules, and host configuration in routine network reviews. Disabling IPv6 without understanding dependencies can cause operational problems and may not be an appropriate substitute for securing it.

## Common troubleshooting considerations

- **A host loses its default route after hardening:** Check whether it relies on RAs, whether `accept_ra` is set appropriately, and whether a switch policy is blocking the legitimate router.
- **A control appears enabled but rogue RAs still reach hosts:** Verify the policy is applied to the correct VLAN and ingress ports, review trusted-port assignments, and check platform limitations and software updates.
- **Packet captures show no ND traffic:** Confirm the interface, VLAN, capture permissions, and observation point. ND traffic is link-local and may not be visible from a different routed segment.
- **Neighbor entries change frequently:** Correlate the changes with normal address assignment, device movement, interface events, and packet captures before concluding that malicious activity is occurring.
- **Settings differ between `all`, `default`, and an interface:** Review the operating system’s behavior and network-management configuration. Confirm the effective interface value after applying changes and after a restart.

## FAQ

### Is Neighbor Discovery the IPv6 version of ARP?

Not exactly. ND includes address resolution, but it also supports router discovery, reachability detection, duplicate address detection, and redirects. Its broader role is why IPv6 security reviews should examine more than neighbor-cache entries.

### Does a firewall replace RA Guard?

Usually not. A host or routed firewall may filter traffic at particular points, but RA Guard is designed to control which switch ports can send RAs on a local link. Use controls appropriate to each layer and verify their actual coverage.

### Should I disable IPv6 to avoid ND risks?

Not as a default response. IPv6 may be used by applications or operating-system services even when it is not prominent in network documentation. A better starting point is to inventory IPv6 use, restrict unauthorized configuration at the network edge, and harden hosts according to their role.

### What is SEND, and should every network deploy it?

Secure Neighbor Discovery (SEND) is a protocol intended to add cryptographic protections to certain ND operations. Its suitability depends on client and infrastructure support, deployment complexity, and operational requirements. It is not a universal substitute for access-layer controls and careful network configuration.

## Conclusion

IPv6 Neighbor Discovery security is best assessed in layers. Establish the expected router and host behavior, observe ICMPv6 and local state, review host settings and switch controls, then validate enforcement in an isolated, authorized environment. Remediate based on system roles and verify that legitimate IPv6 configuration still works. This workflow helps reduce exposure to rogue advertisements and neighbor manipulation without treating normal IPv6 behavior as inherently suspicious.
