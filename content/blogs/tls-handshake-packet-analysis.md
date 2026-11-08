# TLS Handshake Packet Analysis

A TLS handshake establishes the security parameters a client and server will use to communicate. Analyzing that exchange in a packet capture can help troubleshoot connection failures, verify protocol behavior, and investigate suspicious network activity. But modern TLS encrypts much of the handshake, so a capture does not always reveal everything an analyst might expect.

This guide explains how to approach **TLS handshake packet analysis** using Wireshark and `tshark`. It compares passive packet inspection with endpoint telemetry and active testing, explains important differences between TLS 1.2 and TLS 1.3, and offers criteria for choosing a defensive monitoring design.

## What a TLS handshake establishes

During a handshake, the client and server negotiate a protocol version and cipher suite, authenticate the server (and sometimes the client), and establish shared traffic keys. The exact messages depend on the TLS version, configuration, and whether the connection uses a full handshake, resumption, or early data.

A packet capture records network traffic, not an abstract sequence of handshake messages. TCP may split a TLS record across segments or carry several records in one segment. A packet analyzer usually reassembles the stream, but incomplete captures, packet loss, or capture-point limitations can prevent it from decoding the exchange correctly.

## TLS 1.2 and TLS 1.3 on the wire

Understanding the protocol version is essential when interpreting what a capture can show.

### Typical TLS 1.2 full handshake

A common TLS 1.2 full handshake follows this outline:

1. The client sends `ClientHello`, including supported versions, cipher suites, and extensions. It may include the server name indication (SNI).
2. The server responds with `ServerHello`, selects parameters, and usually sends its certificate. Depending on the key exchange, it may also send `ServerKeyExchange`, followed by `ServerHelloDone`.
3. The client sends the key-exchange message and, if requested, its certificate. The peers then exchange `ChangeCipherSpec` and `Finished` messages.
4. The connection proceeds with encrypted application data.

Details vary by cipher suite and authentication configuration. Resumed TLS 1.2 sessions can use an abbreviated handshake, so they do not necessarily include the same certificate and key-exchange messages as a full handshake.

### Typical TLS 1.3 handshake

A TLS 1.3 handshake usually begins with a `ClientHello` and `ServerHello`. The client advertises supported versions and key shares; the server selects parameters and provides its key share. After `ServerHello`, most remaining handshake messages are encrypted, including `EncryptedExtensions` and, when certificate authentication is used, the certificate and `CertificateVerify` messages.

This has a practical consequence: a passive capture can often show the initial negotiation, but it generally cannot reveal the server certificate or later handshake details without session secrets. A TLS 1.3 `ClientHello` also uses a legacy version field for compatibility; check the `supported_versions` extension rather than treating that field alone as the negotiated version.

TLS 1.3 can include compatibility-related records that resemble older protocol behavior. Do not conclude that a connection negotiated TLS 1.2 just because a compatibility field or record appears in the capture. Confirm the selected version using the relevant extension or trusted endpoint telemetry.

## Three approaches to handshake analysis

No single source provides a complete view in every environment. Choose an approach based on the question being answered and the sensitivity of the data involved.

| Approach | What it is good for | Key limitations | Best fit |
|---|---|---|---|
| Passive packet capture | Observing network-visible negotiation, timing, retransmissions, resets, and connection paths | Encrypted handshake messages remain hidden; capture loss and NAT can complicate interpretation | Network troubleshooting and perimeter or segment monitoring |
| Endpoint logs and key logs | Confirming negotiated parameters and, with authorized session secrets, inspecting encrypted handshake content | Requires access to endpoints; key logs are highly sensitive and application support varies | Controlled debugging and incident investigation |
| Active TLS testing | Checking how a server responds to new connections and configurations | Tests the service at test time, not necessarily the original client session or every network path | Configuration validation and recurring assessments |

These methods complement rather than replace one another. For example, a packet capture can show where a connection fails, while endpoint logs clarify which parameters the client actually negotiated.

## Analyze a capture with Wireshark

### 1. Capture the relevant traffic

Capture close to the client or server when possible, and record the capture point, time, interface, and filter used. A capture taken on the wrong side of a proxy, load balancer, or NAT device may show a different TLS connection from the one you intended to investigate.

For an initial investigation, capture a short, focused interval. A broad capture can collect unrelated traffic and sensitive data. Follow your organization’s authorization, retention, and privacy requirements.

### 2. Find TLS handshakes

Open the capture in Wireshark and use display filters to narrow the view:

- `tls.handshake` — show packets containing decoded TLS handshake messages.
- `tls.handshake.type == 1` — show ClientHello messages.
- `tls.handshake.type == 2` — show ServerHello messages.
- `tcp.port == 443` — show TCP traffic using the common HTTPS port; this alone does not prove the traffic is TLS.
- `tcp.stream eq 3` — isolate one TCP stream, replacing `3` with the stream number shown in Wireshark.

A port-based filter can miss TLS on nonstandard ports. Conversely, traffic on port 443 may not be TLS. Use decoded protocol fields and connection context rather than relying on a port alone.

### 3. Inspect the ClientHello and ServerHello

Select a decoded handshake message and expand its fields. Depending on the protocol version and available data, useful details may include:

- Offered and selected protocol versions.
- Offered cipher suites and the selected cipher suite.
- SNI, when present and visible.
- Supported groups and key-share information.
- ALPN protocols, such as `h2` or `http/1.1`, when visible.
- Alerts, retransmissions, and the timing between messages.

The ClientHello shows what a client offered; it does not establish what the server selected. Compare it with the ServerHello or endpoint records before drawing conclusions. SNI and other ClientHello information can also be hidden by mechanisms such as Encrypted ClientHello (ECH), when negotiated and supported by the client and server.

### 4. Follow the stream and check completeness

Use **Follow > TCP Stream** to inspect a connection as a reassembled byte stream. Check whether the capture contains both directions and starts early enough to include the handshake. If the first observed data is application traffic, the handshake may have occurred before capture began, or the connection may have been resumed or reused elsewhere in the path.

For UDP-based HTTP/3, TLS handshake messages are carried inside QUIC rather than ordinary TCP TLS records. Use a packet analyzer with QUIC dissection enabled and look at the QUIC connection; TCP filters and assumptions about TLS-over-TCP will not apply.

## Command-line inspection with tshark

To list decoded TLS handshake messages and basic packet context from a capture file:

```bash
tshark -r capture.pcapng \
  -Y 'tls.handshake' \
  -T fields \
  -e frame.number \
  -e ip.src \
  -e ip.dst \
  -e tls.handshake.type
```

To focus on ClientHello messages, change the display filter to:

```bash
-Y 'tls.handshake.type == 1'
```

Field availability and names can vary with Wireshark versions and dissector support. Check the installed field list or inspect the packet tree if a field is blank. A blank field does not necessarily mean the message lacks that value: the relevant handshake content may be encrypted, unavailable, or not decoded.

## Decrypting a capture in an authorized test

When packet-level inspection of encrypted handshake messages is necessary, use session secrets from a test client or another authorized endpoint. Many browsers can write TLS session secrets to a key-log file when started with the `SSLKEYLOGFILE` environment variable. For example, on a Unix-like shell:

```bash
export SSLKEYLOGFILE="$PWD/tls-keys.log"
# Start the supported browser or test application from this shell.
```

In Wireshark, configure the TLS protocol preferences to use that file as the TLS key log. Then reopen or reload the capture. Support depends on the application and its TLS library; setting the variable does not guarantee that every client will produce a usable file.

Treat the key-log file as a secret. Anyone with the capture and corresponding secrets may be able to decrypt recorded sessions, subject to the protocol and capture contents. Restrict access, avoid collecting secrets from production users, and securely remove test key logs when they are no longer needed. Do not use decryption to inspect traffic without proper authorization.

## What packet analysis can reveal—and what it cannot

A well-positioned, complete capture can help identify:

- Whether a client attempted a TLS connection and whether the server replied.
- Visible version and cipher negotiation details.
- Some ClientHello extensions, depending on protocol features and encryption.
- Connection timing, retransmissions, resets, and network-path behavior.
- Visible TLS alerts, although some later alerts may be encrypted.

Without session secrets, packet analysis may not reveal the contents of TLS 1.3 handshake messages after `ServerHello`, application data, or certificates sent within the encrypted portion of the handshake. A capture can also miss the relevant exchange entirely if traffic bypasses the sensor, the connection began earlier, or an intermediary terminates and re-establishes TLS.

TLS packet analysis also does not, by itself, prove that an endpoint is trustworthy or that an application request is safe. Use endpoint identity and application context when investigating security events.

## Common troubleshooting patterns

### ClientHello appears, but no ServerHello follows

Check whether the server response is absent at the capture point, whether the return path is asymmetric, and whether a firewall or intermediary is dropping or redirecting traffic. Compare captures from both sides if available. Also verify that capture loss or filtering did not omit the response.

### A TLS alert appears

Record the alert direction, timing, and whether it is decoded or encrypted. A visible alert can narrow down where negotiation stopped, but avoid assigning a cause from the alert name alone. Correlate it with client and server logs, configuration, and the handshake messages that preceded it.

### Wireshark shows “application data” where handshake details are expected

For TLS 1.3, handshake messages after `ServerHello` are encrypted and may be labeled as application data in a capture without secrets. Confirm the negotiated version and whether a valid key log is available before treating this as anomalous.

### The capture contains no recognizable TLS handshake

Confirm the correct interface, capture time, and network path. Check for nonstandard ports, a proxy that terminates TLS, QUIC over UDP, or a connection that was already established before capture began. A port filter alone can also exclude the traffic.

## Choosing a defensive monitoring design

Use these criteria to decide where to invest in visibility:

1. **Define the question.** Network reachability and retransmission analysis usually favor packet capture. Confirming an application’s negotiated protocol or certificate validation outcome favors endpoint telemetry.
2. **Map TLS termination points.** Document where TLS is terminated and restarted, including proxies, load balancers, service meshes, and inspection gateways. Each leg may be a separate TLS session.
3. **Plan for encrypted visibility.** If a security control requires handshake details that TLS 1.3 encrypts, determine whether suitable endpoint telemetry is available. Do not assume passive sensors can reconstruct the full exchange.
4. **Minimize secret exposure.** Prefer metadata and application logs where they answer the question. Reserve session-key collection for narrowly scoped, authorized investigations with access controls and retention limits.
5. **Validate coverage.** Test that sensors see both directions and relevant paths, and account for QUIC, nonstandard ports, and resumed connections.
6. **Correlate sources.** Use synchronized timestamps and connection identifiers where possible to match packet evidence with endpoint, DNS, proxy, and server records.

A layered design is usually more useful than relying on deep packet inspection alone: network telemetry helps identify path and timing problems, while endpoint and service logs provide context about validation and configuration.

## FAQ

### Can I see the server certificate in a TLS packet capture?

Often in a typical TLS 1.2 full handshake, because the certificate is sent before the connection switches to encrypted records. In TLS 1.3, the certificate is normally sent after `ServerHello` in encrypted handshake messages, so a passive capture generally needs the appropriate session secrets to reveal it. Resumption and other handshake variations can change what appears.

### Does a ClientHello show the TLS version actually used?

Not by itself. It shows client capabilities and offers. Check the server’s selection and relevant version-negotiation fields, and use endpoint records when available. In TLS 1.3, the legacy version field can be misleading if interpreted alone.

### Can Wireshark decrypt TLS traffic without a private key?

It can decrypt supported sessions when it has the corresponding session secrets, such as secrets provided through a key-log file. A server’s private key is not a general substitute for session secrets, particularly for modern forward-secret key exchanges.

### Is TLS handshake packet analysis enough to detect malicious activity?

No. It can provide useful indicators, such as unusual negotiation patterns or unexpected destinations, but encrypted content and missing context limit conclusions. Combine packet evidence with endpoint, identity, DNS, proxy, and application telemetry.

## Conclusion

TLS handshake packet analysis helps explain how connections are negotiated and where network-level failures occur, but protocol evolution limits what passive capture can reveal. TLS 1.2 and TLS 1.3 expose different portions of the handshake, and QUIC changes where analysts look for TLS messages. Use packet capture for network behavior, endpoint telemetry for negotiated and application context, and session secrets only in controlled, authorized investigations. Choosing the right combination produces more reliable findings with less risk to sensitive data.
