# IPsec VPN Architecture and Common Mistakes

An IPsec VPN can securely connect offices, cloud networks, remote users, or other IP-enabled systems. But deploying IPsec is more than enabling encryption: the peers must agree on cryptographic settings, identify which traffic to protect, and route that traffic through the tunnel. A mismatch in any of those areas can leave a connection unavailable—or make it less secure than intended.

This guide explains the building blocks of IPsec VPN architecture, compares common design choices, and highlights practical mistakes to avoid. It is intended for readers who understand basic networking concepts and want to design or review an IPsec deployment more confidently.

## What is IPsec?

IPsec is a suite of protocols and mechanisms for protecting IP traffic. It can provide confidentiality, integrity, peer authentication, and protection against replay, depending on the protocol and algorithms configured. A VPN is a use of IPsec to create a protected connection across an untrusted network, such as the public internet.

IPsec is often described as operating at the network layer. Unlike an application-layer TLS connection, it can protect traffic between network endpoints without requiring each application to implement its own encryption. This also means that routing, firewall policy, and the IPsec configuration must work together.

## Core components of IPsec VPN architecture

A typical site-to-site deployment has two IPsec peers, such as firewalls or routers, with an untrusted network between them. Each peer has a public-facing address and protects traffic between defined private networks.

### IKE: negotiating and managing security associations

Internet Key Exchange (IKE) authenticates the peers and negotiates the parameters used to protect traffic. A security association (SA) is a set of agreed security parameters, including cryptographic algorithms, keys, and lifetimes. IPsec uses SAs to apply protection to packets.

With IKEv2, peers first establish an IKE SA for protected control-plane communication. They then negotiate one or more Child SAs to carry protected data traffic. IKEv1 uses different terminology, commonly referring to Phase 1 for the IKE negotiation and Phase 2 for IPsec SAs. The versions have different behavior and configuration details; avoid assuming that a setting or troubleshooting procedure applies to both.

IKE authentication can use a pre-shared key or certificates, among other supported methods. A pre-shared key must be sufficiently strong and handled securely. Certificates can support more scalable identity management, but require reliable certificate issuance, validation, renewal, and revocation processes.

### ESP: protecting data traffic

Encapsulating Security Payload (ESP) is the IPsec protocol most commonly used for VPN data traffic. Depending on the selected algorithms and mode, ESP can provide encryption and integrity protection, or use an authenticated-encryption algorithm that provides both together. Configure compatible, currently supported algorithms on both peers and follow your organization’s cryptographic standards.

Authentication Header (AH) provides integrity and authentication but not encryption. It is rarely appropriate for internet VPNs, in part because its handling of IP headers is incompatible with common NAT behavior. ESP is generally the practical choice for site-to-site VPNs.

### Tunnel mode and transport mode

In tunnel mode, ESP protects an entire inner IP packet and adds an outer IP header for delivery between the VPN peers. This is the usual mode for site-to-site VPNs: the inner packet carries traffic between the protected networks, while the outer packet travels across the internet.

In transport mode, ESP protects the payload of an IP packet while retaining its original IP header. It is typically used for host-to-host protection or other specialized designs, rather than for a conventional gateway-to-gateway VPN.

### Traffic selectors, policy, and routing

Traffic selectors define which traffic a Child SA is intended to protect. In a policy-based design, selectors are closely tied to rules that identify source and destination networks. In a route-based design, the VPN is associated with a virtual interface, and routing determines which traffic enters it. Implementations vary, and some combine both approaches.

A functioning tunnel does not automatically mean that the intended traffic will use it. Routes, selectors, security policies, and firewall rules must agree. The return path must also be correct; asymmetric routing or missing routes can cause one-way connectivity.

## A simplified site-to-site example

Suppose Office A uses `10.10.0.0/16` and Office B uses `10.20.0.0/16`. Each office has a VPN gateway with a reachable public address. A basic design needs both peers to:

1. Identify and authenticate the other peer.
2. Agree on compatible IKE and ESP proposals, including algorithms and lifetimes.
3. Define matching traffic selectors for `10.10.0.0/16` and `10.20.0.0/16`.
4. Route traffic for the remote network through the VPN, or apply matching policy-based rules.
5. Permit the necessary IKE and ESP traffic through upstream firewalls.
6. Permit the intended application traffic through the VPN gateways and internal firewalls.

The exact configuration depends on the vendor, software version, topology, and whether the design is policy-based or route-based. Treat these items as a design checklist, not a copy-and-paste configuration.

## Common IPsec VPN architecture mistakes

### 1. Using weak or inconsistent cryptographic settings

A tunnel may be configured with outdated algorithms, weak key material, or a broad collection of proposals that includes options the organization no longer accepts. Alternatively, the peers may have no compatible proposals and fail to establish a connection.

**Improve the design:** Select algorithms and key sizes according to current organizational and vendor guidance. Remove obsolete options where possible, keep both peers’ settings aligned, and review them during regular configuration audits. Prefer a deliberate, limited proposal set over enabling every compatibility option.

### 2. Treating a pre-shared key as a minor setting

A shared key that is short, reused across many tunnels, stored in an insecure location, or sent through an unprotected channel can undermine peer authentication. A compromised key may allow an attacker to impersonate a peer, depending on the deployment and surrounding controls.

**Improve the design:** Use a long, unique, randomly generated key when pre-shared keys are appropriate. Store and distribute it through an approved secrets-management process, restrict access, and rotate it when exposure is suspected or policy requires. Consider certificate-based authentication when it better fits the scale and operational capabilities of the environment.

### 3. Mismatching traffic selectors or subnet definitions

A frequent cause of tunnel problems is a mismatch in local and remote network definitions. One peer may include a subnet that the other peer does not, use a different prefix length, or reverse the local and remote networks. A tunnel can appear established while some traffic fails to match the negotiated selectors.

**Improve the design:** Compare both sides’ selectors carefully, including prefixes and any host-specific entries. Check negotiated Child SA details as well as the initial IKE status. Document which networks are intended to communicate and remove unused selectors.

### 4. Confusing tunnel establishment with end-to-end reachability

A successful IKE negotiation proves that the peers established control-plane security. It does not prove that a host can reach an application across the VPN. Incorrect routes, local firewall rules, missing return routes, DNS issues, or blocked application ports can still prevent communication.

**Improve the design:** Test from representative hosts, not just from the gateways. Verify the route in both directions, inspect firewall logs, and test the required application port. Use packet captures or device counters to determine whether traffic is reaching the tunnel and whether replies return.

### 5. Overlooking NAT and network address translation traversal

NAT between peers can interfere with IPsec packet delivery. NAT traversal (NAT-T) encapsulates ESP traffic in UDP so it can pass through many NAT devices. Whether NAT-T is needed depends on the path and device behavior. NAT between the protected networks can also alter addresses and complicate selectors or application behavior.

**Improve the design:** Confirm whether either peer or an upstream device performs NAT. Ensure required IKE and NAT-T traffic is allowed by relevant firewalls, and verify that both peers detect and handle NAT as expected. If translating protected traffic, document the translation and ensure it is consistent with selectors, routing, and firewall policy.

### 6. Forgetting about MTU and fragmentation

ESP adds overhead to packets. With tunnel mode, the outer header and ESP fields reduce the space available for the inner packet. If path MTU discovery is blocked or packet sizing is not handled correctly, larger packets may be fragmented or dropped. The result can look like an application problem: small requests work, while large transfers or certain websites stall.

**Improve the design:** Account for encapsulation overhead and the path MTU. Use supported methods to adjust interface MTU or TCP maximum segment size where needed, and check for blocked ICMP messages that support path MTU discovery. Test with realistic application traffic rather than relying only on small ping packets.

### 7. Allowing more network access than necessary

Broad selectors and permissive firewall rules can turn a VPN into an unexpectedly large trust path. Connecting two private networks does not mean every host or service between them should be reachable.

**Improve the design:** Limit selectors, routes, and firewall rules to required networks and services. Apply segmentation on both sides of the tunnel, and review access when networks or business needs change. Treat the VPN as a transport path, not as a replacement for internal access control.

### 8. Ignoring rekeying, lifetimes, and availability

IKE and Child SAs have lifetimes and are rekeyed. Incompatible settings or implementation differences can cause negotiation failures or brief interruptions around rekey events. A single gateway can also become a point of failure, and failover can be ineffective if state, routes, or peer configuration are not handled correctly.

**Improve the design:** Align lifetimes and rekey behavior where required by the platforms, and monitor logs for repeated negotiation or rekey errors. If availability matters, design and test gateway redundancy, routing convergence, and failover behavior. A configured backup is not proven until the failover path has been exercised.

### 9. Neglecting monitoring and change control

Without useful logs and ownership, expired credentials, configuration drift, or a changed route can go unnoticed. Unreviewed changes to one peer can also break compatibility with the other.

**Improve the design:** Monitor tunnel state, negotiation errors, traffic counters, and relevant gateway health. Protect management access, keep a record of approved settings, and review both peers after changes. Avoid exposing administrative interfaces to untrusted networks unless that access is explicitly secured and necessary.

## A practical review checklist

Before deploying or auditing an IPsec VPN, confirm that:

- Peer identities and authentication methods are defined and verified.
- IKE and ESP proposals use approved, compatible settings.
- Traffic selectors, routes, and firewall rules reflect least privilege.
- The correct VPN mode and architecture fit the topology.
- NAT, NAT-T, and any address translation are accounted for.
- MTU, fragmentation, and path MTU behavior have been tested.
- Return routes and application-level access have been verified from endpoints.
- Rekeying, logging, monitoring, credential management, and failover have been considered.
- Configuration changes and ownership are documented.

## Troubleshooting a connection that does not work

Start by locating the failure in the connection path rather than changing several settings at once:

1. **Check IKE status.** If peers cannot establish IKE, inspect reachability, peer identities, authentication, and IKE proposal compatibility.
2. **Check the data SAs.** If IKE is up but data traffic fails, confirm that the expected Child SA exists and that its selectors match the traffic.
3. **Check routing and policy.** Confirm that traffic is directed into the VPN and that the remote side has a route back. Review firewall rules on gateways and endpoints.
4. **Check packet flow.** Use logs, counters, and packet captures at appropriate points to see whether packets enter the tunnel, leave the remote gateway, and receive replies.
5. **Test packet size and applications.** If small tests pass but larger transfers fail, investigate MTU and fragmentation. Test the actual ports and protocols users need.
6. **Review recent changes.** Compare both peers’ configuration and check for changes to routes, keys, certificates, firmware, or upstream network devices.

Avoid weakening security settings as a first troubleshooting step. If a temporary change is needed for diagnosis, document it, limit its scope, and restore the approved configuration afterward.

## FAQ

### Is IPsec the same thing as a VPN?

No. IPsec is a suite of protocols that can protect IP traffic. A VPN is a protected network connection or virtual network. IPsec is commonly used to build VPNs, but VPNs can use other technologies as well.

### Should I use policy-based or route-based IPsec?

It depends on the platform and network design. Policy-based VPNs associate protected traffic with explicit selectors or policies. Route-based VPNs use a virtual interface and routing decisions to direct traffic. Route-based designs can be convenient for dynamic routing or more complex topologies, but support and behavior vary by vendor. Choose based on operational requirements and verify how the implementation handles selectors and firewall policy.

### Does an established tunnel mean all traffic is encrypted?

Not necessarily. A tunnel can be established while only selected traffic is protected. Other traffic may use a different route or bypass the VPN, depending on the routes, selectors, and policy. Confirm the actual traffic path and the intended scope of protection.

### Why does a VPN pass small tests but fail with large transfers?

Encapsulation reduces the effective packet size. MTU, fragmentation, or blocked path MTU discovery can cause larger packets to fail even when small packets work. Check packet sizing and test with realistic traffic.

## Conclusion

Reliable IPsec VPN architecture depends on more than choosing encryption algorithms. IKE authentication, ESP protection, traffic selectors, routing, firewall rules, NAT handling, MTU, monitoring, and failover all contribute to whether a VPN is secure and dependable.

The most useful way to avoid common mistakes is to define the traffic and trust boundaries first, configure both peers consistently, restrict access to what is required, and test the complete path from endpoint to endpoint. Review the design as networks and operational requirements change, rather than treating a tunnel that is up as a tunnel that is fully secure.
