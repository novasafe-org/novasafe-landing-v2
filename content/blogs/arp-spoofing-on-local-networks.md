# ARP Spoofing on Local Networks

Address Resolution Protocol (ARP) helps devices on an IPv4 local network find the hardware address associated with an IP address. Because traditional ARP does not authenticate those answers, a device on the same local network can send false information and influence where other devices send traffic.

This guide explains how arp spoofing on local networks works, how teams can assess warning signs, and which safeguards fit different environments. The goal is to support investigation and defense—not to treat every unexpected ARP message as proof of an attack.

## What ARP spoofing is

When a device needs to send an IPv4 packet to another device on its local subnet, it needs the destination's link-layer address, usually a MAC address. The sender checks its ARP cache first. If it has no current entry, it broadcasts an ARP request asking which device has the target IP. A device replies with its MAC address, and the sender may cache the mapping for a period of time.

ARP was designed for local network communication, not for verifying identity. A host generally cannot confirm from an ARP reply alone that the sender is entitled to claim a particular IP address. In ARP spoofing—also called ARP poisoning—an attacker on the same Layer 2 network sends misleading ARP messages to make one or more devices associate an IP address with the attacker's MAC address.

A common target is the default gateway. If a victim accepts a false mapping for the gateway, traffic intended for the gateway may instead be sent to the wrong device. Depending on network conditions and the attacker's position, this can cause disruption or put traffic in a position where it may be observed or manipulated. The attacker may also try to impersonate a victim to the gateway, creating a man-in-the-middle path.

ARP spoofing is generally a local-network threat: the attacker needs a way to send traffic on the relevant Layer 2 segment. It is not the same as DNS spoofing, which targets name resolution, or IP spoofing, which forges an IP source address. IPv6 uses Neighbor Discovery Protocol (NDP), not ARP, and needs separate controls.

## What teams should assess

Start with context. Identify the affected VLAN or wireless network, the relevant IP addresses, the normal gateway MAC address, and recent network changes. Check whether the report coincides with DHCP activity, a gateway failover, a virtual machine move, or a device replacement. These events can legitimately change an address-to-MAC mapping.

Look for multiple indicators rather than relying on a single alert:

- An important IP address, such as the default gateway, is associated with an unexpected MAC address.
- The same IP-to-MAC mapping changes repeatedly in a short period without a known operational reason.
- Multiple endpoints report different MAC addresses for the same gateway IP.
- Network monitoring shows an unusual volume of ARP replies or unsolicited ARP messages.
- Users report intermittent connectivity, certificate warnings, or unexpected redirects at the same time.
- Switch or wireless-controller logs show an unfamiliar device or port in the affected segment.

These indicators are clues, not conclusive evidence. A duplicate IP, high-availability transition, proxy ARP configuration, or routine infrastructure change can produce similar symptoms.

## Practical checks on endpoints

Use approved administrative access and collect observations before changing caches or disconnecting devices. Record the time, interface, IP address, MAC address, and network segment for each observation. Compare results with an authoritative inventory or a verified gateway configuration where available.

### View the ARP or neighbor cache

On Linux, inspect IPv4 neighbor entries with:

```bash
ip neigh show
```

The older `arp` utility may also be available:

```bash
arp -an
```

On Windows, use Command Prompt:

```text
arp -a
```

Or PowerShell:

```powershell
Get-NetNeighbor -AddressFamily IPv4
```

On macOS, a common option is:

```bash
arp -an
```

These commands show the local system's current view. A cache entry does not establish that the mapping is legitimate, and different devices may have different cache contents. Record the interface and subnet so that entries from separate networks are not confused.

### Observe ARP traffic

A packet capture can help determine whether mappings are changing and which frames are visible from the capture point. On Linux, replace the interface name with the correct one:

```bash
sudo tcpdump -eni enp3s0 arp
```

In Wireshark, use the display filter:

```text
arp
```

Capture at an endpoint or, when authorized, from a switch mirror (SPAN) port. A switched network usually does not deliver every other device's unicast traffic to an ordinary endpoint, so one host's capture may not show the full picture. Keep captures limited to what the investigation needs, store them securely, and follow organizational privacy and evidence-handling procedures.

### Compare observations with network records

Check the expected gateway mapping against trusted network documentation or the network team's configuration—not just another endpoint's cache. Correlate packet observations with DHCP leases, switch MAC address tables, wireless-controller records, access-control logs, and change tickets. These sources can help identify whether a MAC address belongs to a known router, virtual interface, failover node, or endpoint.

## Common failure modes and false positives

A surprising ARP mapping is worth investigating, but it does not automatically mean spoofing is taking place. Common benign causes include:

- **Gateway or firewall failover:** A replacement device may take over an IP address, sometimes using a new MAC address.
- **Duplicate IP addresses:** Two devices configured with the same IP can cause inconsistent ARP behavior and intermittent connectivity.
- **Virtualization and mobility:** A virtual machine moving between hosts or network interfaces changing can alter the observed MAC address.
- **Proxy ARP:** A router or other configured device may answer ARP requests on behalf of another address.
- **Device replacement or configuration changes:** Network cards, access points, and infrastructure upgrades can change expected mappings.
- **Stale or incomplete observations:** A cache may be out of date, and a capture point may see only part of the network's traffic.

A monitoring rule that treats every unsolicited ARP reply or mapping change as malicious can create alert fatigue. Baseline expected behavior by segment, account for documented failover and proxy ARP, and tune alerts to prioritize unexpected changes to critical addresses or repeated changes without a corresponding change record.

## Proportionate safeguards

Choose controls based on the network's equipment, risk, and operational needs. No single measure replaces sound segmentation, monitoring, and change management.

### Enable Dynamic ARP Inspection where supported

Dynamic ARP Inspection (DAI) is a switch feature that checks ARP messages against trusted bindings, commonly learned through DHCP snooping. Configure and test it carefully. Devices with static IP addresses may need explicit bindings or another supported exception; otherwise, legitimate ARP traffic may be dropped. Follow the switch vendor's guidance and roll out changes in stages.

### Use DHCP snooping and access-layer controls

DHCP snooping can build a trusted record of IP-to-MAC-to-port relationships for DHCP clients and can provide binding information to DAI. Mark only legitimate DHCP server-facing ports as trusted. Incorrect trust settings can undermine the control or interrupt network service.

Port security, 802.1X, and network access control can help limit or identify which devices connect to a switch port. They are useful layers, but they do not independently validate every ARP mapping. Apply them alongside appropriate ARP inspection and monitoring.

### Reduce the impact of a compromised segment

Separate users, servers, management interfaces, and other sensitive systems into appropriately controlled VLANs or network segments. Segmentation can limit where a device can send local traffic, though devices sharing a Layer 2 segment may still be exposed to one another. On Wi-Fi, use suitable client isolation for guest networks where it fits the use case; do not assume that every wireless network isolates clients by default.

Use encrypted application protocols such as HTTPS and secure administrative protocols, and consider a VPN on networks that are not trusted. Encryption helps protect traffic contents in transit, but it does not prevent ARP disruption, availability attacks, or all forms of redirection. Maintain certificate validation and investigate unexpected certificate warnings rather than bypassing them.

### Monitor and maintain an accurate baseline

Keep an inventory of gateways, infrastructure MAC addresses, static IP assignments, and expected failover behavior. Monitor for unexpected mapping changes and correlate alerts with network and change-management records. Review switch configurations periodically, especially after hardware changes or network redesigns.

## Responding to a suspected incident

1. **Validate the observation.** Confirm the affected subnet, interface, IP-to-MAC mapping, time, and capture point. Compare with an authoritative source.
2. **Assess scope.** Check whether other devices see the same mapping and review relevant switch, DHCP, wireless, and authentication logs.
3. **Coordinate containment.** If evidence supports an active incident, work with the network team to isolate the relevant switch port or device using established procedures. Avoid disconnecting infrastructure based on an unverified alert.
4. **Preserve useful evidence.** Retain relevant logs and authorized packet captures with timestamps and access controls. Record actions and changes made during response.
5. **Restore service and verify.** After containment, confirm that clients resolve the correct gateway mapping and that connectivity is stable. Investigate and remediate the underlying access or configuration issue.

Flushing an ARP cache can make a host learn mappings again, but it is not a fix if false replies continue. It can also remove useful evidence or briefly affect connectivity. Use cache-clearing steps only when appropriate to the investigation and recovery plan.

## Frequently asked questions

### Can ARP spoofing affect devices outside my local network?

ARP operates within a local Layer 2 network, so an attacker typically needs access to the same segment as the target. Routing and segmentation can limit exposure between networks, but they do not protect devices that share an affected segment.

### Does HTTPS stop ARP spoofing?

No. HTTPS does not stop an attacker from sending false ARP messages or disrupting connectivity. Properly validated TLS helps protect application data from being read or altered in transit, but users should still report certificate warnings and administrators should investigate suspicious redirection or availability problems.

### Is a changed gateway MAC address proof of an attack?

No. Failover, hardware replacement, virtual infrastructure changes, and other legitimate events can change the mapping. Verify the change against network records and correlate it with traffic and operational logs before drawing a conclusion.

### Does a static ARP entry solve the problem?

A static entry can protect a particular host's mapping in some situations, but managing entries across a large or changing environment is difficult. It may become stale during legitimate infrastructure changes and does not protect other devices. Switch-based inspection, segmentation, and monitoring are generally more manageable controls when supported and configured correctly.

## Conclusion

ARP spoofing exploits the lack of authentication in traditional IPv4 address resolution to influence traffic on a local network. Effective assessment combines endpoint cache checks, authorized packet observation, trusted infrastructure records, and awareness of normal network changes. Teams can reduce risk with carefully tested ARP inspection, DHCP snooping, access-layer controls, segmentation, encryption, and monitoring. A measured response—one that verifies evidence and accounts for false positives—helps protect service while avoiding unnecessary disruption.
