# TCP Three-Way Handshake Security Implications

The TCP three-way handshake is the setup exchange that lets two hosts establish a reliable TCP connection. It synchronizes sequence numbers and negotiates some connection parameters, but it does not authenticate either endpoint or encrypt traffic. That distinction matters: a connection can be established successfully and still be exposed to spoofing, interception, denial of service, or application-layer attacks.

This guide explains how the handshake works, where its security boundaries are, and which defensive measures help reduce risk. It is intended for readers who understand basic networking and want to assess the practical security implications of TCP connection setup.

## How the TCP three-way handshake works

A client and server exchange three TCP segments before ordinary data transfer begins:

1. **SYN:** The client sends a segment with the SYN flag set and an initial sequence number, such as `x`.
2. **SYN-ACK:** The server replies with SYN and ACK set. It provides its own initial sequence number, such as `y`, and acknowledges the client’s SYN with `x + 1`.
3. **ACK:** The client acknowledges the server’s SYN with `y + 1`. The connection is established, and both sides can send data.

A SYN consumes one sequence number, which is why the acknowledgments advance by one. The exchange also carries TCP options. Depending on what both endpoints support, those options can negotiate parameters such as the maximum segment size, window scaling, selective acknowledgments, and timestamps.

The handshake gives both sides a way to confirm that traffic can travel in both directions and to establish the sequence-number state needed for reliable delivery. It is not a login exchange, a cryptographic key exchange, or proof that a peer is who it claims to be.

## What the handshake does—and does not—secure

TCP sequence numbers help receivers order data and reject segments that do not fit the expected connection state. Modern TCP implementations use randomized initial sequence numbers to make blind, off-path guessing harder. These protections are useful, but they have limits.

The handshake itself does **not** provide:

- **Identity verification:** A source IP address is not a reliable identity credential. Addresses can be spoofed in some network conditions, and traffic may pass through intermediaries.
- **Confidentiality:** TCP sends application data in clear text unless a separate protocol, such as TLS, protects it.
- **Integrity against an on-path attacker:** Someone able to observe or modify traffic on the path may be able to interfere with an unencrypted connection.
- **Application authorization:** Establishing a TCP connection does not establish that a user or device is permitted to use the application.

TLS can protect application data and authenticate a server when clients validate its certificate correctly. TLS negotiation occurs above TCP in the common TCP-plus-TLS model; it does not make the TCP handshake itself an authenticated exchange. Other protections, such as IPsec or TCP Authentication Option (TCP-AO), address different parts of the problem and have their own deployment and key-management requirements.

## Security risks associated with TCP connection setup

### SYN floods and half-open connections

After receiving a SYN, a server typically keeps state while it waits for the final ACK. An attacker can send many SYNs without completing the handshake, consuming connection-tracking or backlog resources. This is a **SYN flood**, a denial-of-service technique that may prevent legitimate clients from connecting.

Spoofed source addresses can make it harder to identify the sender and can leave the server waiting for ACKs that never arrive. The exact impact depends on the operating system, network path, service configuration, and available resources. A SYN flood is not the same as a general traffic flood: it specifically targets the work and state associated with connection establishment.

### Source-address spoofing and blind attacks

TCP does not cryptographically verify that a sender controls the source IP address in a packet. Network ingress filtering helps prevent many spoofed packets from leaving networks, but filtering is not universal. An attacker who cannot observe a connection may also try to guess its sequence state, although modern sequence-number randomization makes blind injection substantially harder than it was on older systems.

An attacker on the path has a different advantage: they can observe packets and may be able to disrupt or manipulate traffic. Sequence numbers are not a substitute for encryption or peer authentication.

### Connection exhaustion and exposed services

A reachable TCP port provides an opportunity to consume server resources, even when the application ultimately rejects the connection. Excessive connection rates, slow clients, and large numbers of incomplete or idle connections can affect network devices and applications as well as the TCP stack. Handshake defenses alone cannot address every resource-exhaustion problem; services also need sensible connection limits and timeouts.

### TCP Fast Open considerations

TCP Fast Open is an optional extension that can allow data to be sent during the SYN exchange when supported and configured. This can reduce latency, but early data may have different replay considerations from data sent after a connection is fully established. Applications should not assume that data sent this way is fresh or safe to process more than once. Whether this matters depends on the implementation and the operation being performed.

## Defensive recommendations

### Reduce unnecessary exposure

- Expose only the TCP ports required for the service, and restrict administrative or internal services to trusted networks where possible.
- Apply firewall rules at appropriate network boundaries. Confirm that rules account for legitimate clients, monitoring, load balancers, and other intermediaries.
- Keep operating systems, network appliances, and TCP/IP stacks supported and patched.

### Use connection-flood protections thoughtfully

Many operating systems provide SYN backlog controls and SYN cookies. SYN cookies let a server defer storing some connection state until the client returns a valid ACK, which can reduce pressure from incomplete handshakes. They are a mitigation, not a complete solution: they do not absorb unlimited traffic, replace upstream filtering, or protect an overloaded application by themselves.

On Linux, an administrator can check the current SYN-cookie setting with:

```sh
sysctl net.ipv4.tcp_syncookies
```

The setting and its behavior are operating-system-specific. Review the relevant platform documentation and test changes under realistic load rather than copying a tuning value without context. During a large flood, upstream denial-of-service protection or filtering may be necessary because the network link itself can become saturated before traffic reaches the host.

Where appropriate, a load balancer or firewall with SYN proxy capabilities can complete or validate handshakes on behalf of a protected service. Such devices must be configured and monitored carefully; they add another component whose capacity and behavior affect availability.

### Protect traffic and verify identity at higher layers

Use TLS for application protocols that need confidentiality and integrity, and configure clients to validate server certificates. Use mutual TLS or another suitable authentication mechanism when the server also needs to verify clients. Do not treat a successful TCP connection, a source IP address, or a completed handshake as proof of user identity.

For specialized environments that need authentication of TCP segments, evaluate TCP-AO or other network-layer protections against the actual threat model and compatibility requirements. These are not drop-in replacements for TLS in ordinary web applications.

### Monitor connection behavior

Look for sudden increases in SYN traffic, incomplete connections, connection errors, or backlog pressure. Compare network telemetry with host and application logs: a high SYN rate may indicate a flood, a sudden workload change, a misconfigured health check, or a routing problem. Investigate before blocking broad ranges of source addresses, since shared networks and address translation can make such blocks disruptive.

## Inspecting TCP handshakes

A packet capture can help distinguish handshake attempts from completed connections. On Linux, this command displays TCP packets with the SYN flag on a chosen interface:

```sh
tcpdump -nn -i eth0 'tcp[tcpflags] & tcp-syn != 0'
```

Replace `eth0` with the relevant interface. SYN packets with ACK unset are initial connection attempts; SYN packets with ACK set are typically SYN-ACK responses. A capture point may not see both directions, especially when routing, load balancing, or asymmetric paths are involved. Packet captures can contain sensitive metadata, so store and share them according to your organization’s data-handling policy.

To inspect TCP sockets on a Linux host, use:

```sh
ss -tan
```

This shows TCP sockets and their states. A large number of sockets waiting for a handshake or a growing queue can be a useful clue, but a single snapshot does not prove an attack. Correlate it with traffic rates, service health, system resources, and logs.

### Troubleshooting checklist

If clients report that a TCP service is unreachable or intermittently slow:

1. Confirm that the destination address and port are correct and that routing works in both directions.
2. Check firewall, security-group, and network ACL rules on the client path, server path, and any load balancers.
3. Capture traffic at a suitable point to see whether SYNs arrive and whether SYN-ACKs leave.
4. Check host socket states and system resource usage, then review service and network-device logs.
5. Compare the observed behavior with recent configuration or traffic changes before increasing limits or disabling protections.

If a client’s SYN reaches the server but no SYN-ACK returns, investigate host filtering, service exposure, resource pressure, and the return path. If the SYN-ACK leaves but the final ACK does not arrive, examine the client side and any intermediate filtering or routing. These observations narrow the problem; they do not by themselves identify its cause.

## FAQ

### Does completing the TCP handshake authenticate the client?

No. It establishes TCP connection state and confirms that the endpoint completing the exchange can respond on the path. It does not prove a user’s identity or reliably prove ownership of a source IP address. Use an appropriate application or network-layer authentication mechanism.

### Does TLS protect the TCP three-way handshake?

Not in the usual TCP-plus-TLS design. TCP establishes the transport connection first, and TLS then negotiates protection for application traffic. TLS can authenticate a server and protect data when configured correctly, but it does not prevent every TCP-level availability attack.

### Do SYN cookies stop SYN floods?

They can reduce server-side state consumption from incomplete handshakes, but they do not stop all denial-of-service traffic or prevent an attacker from saturating a network link. Their effectiveness depends on the platform and deployment. Combine host protections with suitable network-level capacity, filtering, and monitoring.

### Can a firewall block all spoofed TCP traffic?

No single firewall rule can guarantee that all spoofing is prevented across the internet. Ingress and egress filtering can reduce spoofed traffic, while stateful filtering can restrict unexpected connections. Network path, routing, and firewall placement matter, and these controls do not replace cryptographic authentication.

## Conclusion

The TCP three-way handshake synchronizes connection state and negotiates transport parameters; it does not authenticate peers or encrypt data. Its security implications include resource exhaustion from incomplete connections, exposure to spoofed or on-path interference, and the risk of treating a reachable port as a trusted identity.

Defend the full connection path: limit unnecessary exposure, keep systems current, use platform-appropriate flood protections, monitor connection behavior, and protect application traffic with correctly configured encryption and authentication. Treat the handshake as transport setup—not as a security boundary.
