# VLAN Hopping Risks and Defenses

VLANs divide a switched network into separate Layer 2 broadcast domains, but that separation depends on correct switch configuration and handling of tagged traffic. A misconfigured port or trunk can create an unintended path between VLANs, a class of attacks known as **VLAN hopping**.

This guide explains the two commonly discussed techniques—switch spoofing and double-tagging—along with their limitations. It compares practical defenses and provides an example configuration you can adapt to your environment. Commands and behavior vary by vendor and software version, so verify syntax and test changes before deploying them.

## What is VLAN hopping?

VLAN hopping is an attempt to send traffic from one VLAN into another without being authorized to do so. It targets weaknesses in how switches negotiate trunks or process 802.1Q VLAN tags.

A successful attack can undermine network segmentation. Depending on the network and the destination services, an attacker might reach systems that are intended to be isolated, probe services across a boundary, or use that access as a step in lateral movement. VLAN hopping does not automatically grant access to every VLAN, bypass application authentication, or defeat encryption. Its impact depends on the configuration and the controls protecting reachable systems.

VLANs are useful segmentation tools, but they should not be treated as a complete security boundary by themselves. Firewalls, access control lists, host controls, and identity-based policies may be needed to enforce which systems can communicate.

## The two main VLAN hopping techniques

### 1. Switch spoofing through trunk negotiation

A switch port configured as a trunk can carry traffic for multiple VLANs. Some platforms support a negotiation protocol, such as Cisco Dynamic Trunking Protocol (DTP), that can negotiate trunk links between switches.

In a switch spoofing attempt, an attacker connects to a port that permits trunk negotiation and sends messages that make the device appear to be a switch. If the port negotiates a trunk, the attacker may be able to send or receive tagged traffic for VLANs allowed on that trunk.

This technique depends on several conditions: the switch must support a relevant negotiation protocol, the port must allow negotiation, and the resulting trunk must carry VLANs the attacker can exploit. It is not a universal property of Ethernet switches, and it does not work against a properly configured access port that cannot negotiate a trunk.

### 2. Double-tagging

An 802.1Q frame normally carries a VLAN tag identifying the VLAN for which it is intended. In a double-tagging attempt, an attacker crafts a frame with two VLAN tags. Under certain switch and trunk configurations, the first switch processes or removes the outer tag, while a downstream switch processes the inner tag and forwards the frame into another VLAN.

The classic scenario relies on the attacker being connected to the native VLAN of a trunk and on the native VLAN being sent untagged. It is generally a one-way technique: it may let a crafted frame reach a target VLAN, but it does not by itself provide a return path or a general two-way trunk connection.

Double-tagging is highly dependent on the network topology, switch behavior, and ingress filtering. Some switches reject tagged frames received on access ports or handle unexpected tags in ways that prevent the attack. Do not assume every network is vulnerable—or safe—based on the technique’s name alone. Review vendor documentation and validate behavior in a controlled environment.

## VLAN hopping risks and likely impact

The practical risks of VLAN hopping include:

- **Weakened segmentation:** Traffic may cross a boundary that network design intends to enforce.
- **Exposure of internal services:** A reachable service may disclose information or offer another path for attack.
- **Lateral movement opportunities:** If other controls are weak, cross-VLAN access can help an attacker move toward more sensitive systems.
- **Reduced confidence in network policy:** A trunk carrying more VLANs than necessary can increase the impact of a compromised endpoint or port.

The risk is not the same in every environment. Assess whether untrusted devices can reach switch ports, whether trunk negotiation is enabled, which VLANs are permitted on trunks, how native VLANs are handled, and what additional controls restrict inter-VLAN traffic.

## Defenses compared: what each control addresses

No single setting addresses every VLAN hopping path. A layered design makes unauthorized trunking harder and limits the damage if a configuration error remains.

| Defense | Primarily reduces | Tradeoffs and considerations |
|---|---|---|
| Configure endpoint ports as static access ports | Switch spoofing through trunk negotiation | Ports serving phones, access points, or other devices that require multiple VLANs need a deliberate, platform-specific design. |
| Disable trunk negotiation where supported | Switch spoofing | The command and behavior are vendor-specific. Set the port mode explicitly as well; disabling negotiation alone is not a substitute for a correct port mode. |
| Restrict trunk allowed VLANs | The number of VLANs exposed through a trunk | Requires accurate documentation and maintenance when VLANs change. Avoid relying on a broad default list. |
| Use an unused native VLAN and tag native traffic where supported | Common double-tagging preconditions | Both ends of each trunk must be configured consistently. Native VLAN tagging support and behavior vary by platform. |
| Shut down and isolate unused ports | Unauthorized device connections | Port inventories and operational processes are needed to avoid disrupting legitimate connections. |
| Apply Layer 3 policy between VLANs | Limits the impact of cross-VLAN reachability | Does not prevent Layer 2 trunk negotiation or fix a vulnerable Layer 2 design; policies must match required traffic. |

### Configure endpoint ports explicitly

Set ordinary endpoint ports to access mode and assign only the intended access VLAN. On platforms that support dynamic trunk negotiation, disable it on ports that should never become trunks. Do not leave user-facing ports in a dynamic or automatic mode.

Ports for devices such as wireless access points, IP phones, or virtualization hosts may legitimately need more than one VLAN. Treat these as exceptions: document the requirement, configure the necessary VLANs explicitly, and avoid using a broadly permissive trunk template.

### Limit trunks to required VLANs

A trunk should carry only the VLANs needed on the link. Restricting the allowed VLAN list reduces unnecessary exposure and can limit the impact of a mistake or compromised endpoint. Apply compatible settings at both ends, and update the list through change control when the link’s purpose changes.

A VLAN allowed on a trunk is not automatically reachable from every other VLAN. Routing and other controls still matter, but a smaller trunk allowlist is a useful defense in depth.

### Make native VLAN handling deliberate

Do not use the native VLAN for ordinary endpoint traffic. Assign a dedicated VLAN that is otherwise unused for the native VLAN on trunks, and configure both ends of each trunk consistently. Where supported and appropriate, enable tagging of native VLAN traffic to remove the untagged-frame condition used in the classic double-tagging scenario.

These choices are not a replacement for correct access-port and trunk configuration. An unused native VLAN should remain unused for hosts and services, and any native VLAN change should be coordinated across both ends to avoid a mismatch.

### Disable unused ports and apply access controls

Administratively shut down unused switch ports, or place them in a restricted, non-production VLAN if operational requirements call for keeping them enabled. Use controls such as 802.1X, port security, or network access control where they fit the environment. These measures help control who can connect, but they do not replace secure trunk configuration.

### Enforce policy beyond Layer 2

Use routing policy, firewalls, or access control lists to specify which VLANs may communicate and which services are permitted. This helps contain the impact of an unexpected Layer 2 path. Monitor configuration changes and network traffic for unexpected trunk formation, VLAN membership changes, or cross-segment communication.

## Example: hardening access ports and a trunk

The following Cisco IOS-style example illustrates common settings. It is not universal configuration guidance: commands, defaults, and support for features such as native VLAN tagging differ across platforms. Confirm the intended behavior in your switch documentation and test before applying changes.

```text
! Example endpoint port
interface GigabitEthernet1/0/10
 description User endpoint
 switchport mode access
 switchport access vlan 20
 switchport nonegotiate
 spanning-tree portfast

! Example switch-to-switch trunk
interface GigabitEthernet1/0/48
 description Uplink to distribution switch
 switchport mode trunk
 switchport trunk allowed vlan 20,30,40
 switchport trunk native vlan 999
 switchport nonegotiate

! Example unused port
interface GigabitEthernet1/0/24
 description Unused
 shutdown
```

On platforms that support native VLAN tagging, a separate global or interface-level command may be required. Confirm its scope and effect before using it. Configure matching trunk parameters on the neighboring switch, and verify that VLAN 999 is not assigned to endpoints or used for production services.

### Verify the configuration

On Cisco IOS-style devices, these commands can help inspect port modes, trunk status, and VLAN assignments:

```text
show interfaces GigabitEthernet1/0/10 switchport
show interfaces trunk
show vlan brief
```

Look for endpoint ports operating as access ports, trunks limited to required VLANs, the intended native VLAN on both ends, and unused ports that are shut down. Use equivalent commands and configuration-audit tools for other platforms.

## Troubleshooting common problems

- **A legitimate endpoint stops working:** Check whether the port needs a voice VLAN, multiple VLANs, or a vendor-specific access policy. Do not convert it to a permissive trunk without confirming the device’s requirements.
- **A trunk does not come up:** Confirm that both ends use compatible trunk settings, that trunking is supported, and that the required VLANs are permitted on both sides.
- **Traffic fails after a native VLAN change:** Check for a mismatch between the two ends and review how the platform handles untagged and native-VLAN traffic. Make coordinated changes during an approved maintenance window.
- **A VLAN is missing from the trunk:** Review the allowed VLAN list, VLAN existence and state, and any platform-specific pruning or spanning-tree conditions.
- **Commands are rejected or behave differently:** Verify the software version, interface type, feature support, and vendor documentation. Similar commands can have different defaults or implications across platforms.

## Choosing an appropriate defensive design

Choose controls based on how the port is used and what the network needs to protect:

1. **Inventory ports and links.** Identify endpoint ports, switch uplinks, wireless infrastructure, phones, hypervisors, and other devices that may require multiple VLANs.
2. **Set a strict default for endpoints.** Use static access mode and an explicit VLAN for ordinary user and device ports. Disable negotiation where the platform supports it and the port should not trunk.
3. **Minimize trunk scope.** Permit only the VLANs required on each trunk, and document the reason for every exception.
4. **Standardize native VLAN handling.** Use a dedicated unused native VLAN, keep both trunk ends consistent, and consider native VLAN tagging where supported.
5. **Contain failures at Layer 3.** Apply explicit rules between VLANs so that a Layer 2 mistake does not automatically grant broad access to internal services.
6. **Validate and monitor.** Review switch configuration, check trunk status, alert on unexpected changes, and retest after network changes or upgrades.

The right design balances security with operational needs. A campus access port, a switch uplink, and an access point connection should not all receive the same configuration by default. Use the narrowest configuration that supports each device’s documented role.

## FAQ

### Does VLAN hopping work on every switch?

No. The techniques depend on switch features, port configuration, topology, and frame-handling behavior. Switch spoofing requires a relevant trunk negotiation path; classic double-tagging relies on specific native VLAN and tag-processing conditions. Check your vendor’s documentation and test your own configuration.

### Is changing the native VLAN enough to stop VLAN hopping?

No. An unused native VLAN can remove a common precondition for classic double-tagging, but it does not prevent a port from negotiating a trunk. Configure endpoint ports explicitly, restrict trunk VLANs, and use additional segmentation controls.

### Should every switch port be configured as an access port?

No. Ordinary endpoint ports should generally be access ports, but switch uplinks and some infrastructure connections need trunking. Configure those exceptions deliberately and restrict them to the VLANs they require.

### Do VLANs provide security on their own?

VLANs provide Layer 2 separation, but they are not a complete security boundary. Control inter-VLAN routing with appropriate policies, secure the endpoints and services in each segment, and monitor for configuration drift or unexpected connectivity.

## Conclusion

VLAN hopping risks arise when trunk negotiation or tag handling creates a path that the network design did not intend. Switch spoofing and double-tagging rely on different conditions, so defenses should address both: configure endpoint ports explicitly, disable unnecessary negotiation, restrict trunk VLANs, handle native VLANs consistently, and shut down unused ports. Add Layer 3 policy and monitoring to limit the impact of mistakes. Together, these practices make VLAN segmentation more dependable without assuming that any single setting eliminates every risk.
