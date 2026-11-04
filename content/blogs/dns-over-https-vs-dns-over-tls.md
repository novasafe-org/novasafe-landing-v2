# DNS over HTTPS vs DNS over TLS

DNS lookups help devices find the IP addresses behind domain names, but traditional DNS is usually sent without encryption. That can expose queries to parties who can observe the network path between a device and its resolver. DNS over HTTPS (DoH) and DNS over TLS (DoT) both encrypt that client-to-resolver connection, but they differ in how they travel across a network and how easy they are to manage.

For teams assessing **DNS over HTTPS vs DNS over TLS**, the decision is not simply which protocol is more secure. Both can protect DNS queries in transit when configured correctly. The practical questions are which resolvers clients use, whether the organization can enforce its DNS policies, how failures appear, and what visibility operations teams need.

## DNS encryption: what DoH and DoT protect

With traditional DNS, a client commonly sends a query to a recursive resolver over an unencrypted connection. Someone able to observe that path may be able to read the query or interfere with it. DoH and DoT add encryption between the client and its selected recursive resolver.

That protection has limits. Encryption on this connection does not hide a query from the resolver itself, nor does it automatically encrypt DNS traffic between the recursive resolver and authoritative DNS servers. It also does not make a domain name private if it appears elsewhere, such as in an application request or other network metadata.

DoH and DoT are separate from DNS Security Extensions (DNSSEC). DNSSEC helps validate the authenticity and integrity of DNS data through cryptographic signatures. DoH and DoT encrypt the client-to-resolver transport. One does not replace the other.

## How DNS over HTTPS works

DNS over HTTPS carries DNS messages over HTTPS. The standard is defined in [RFC 8484](https://www.rfc-editor.org/rfc/rfc8484). In typical deployments, DoH uses HTTPS on port 443, the port widely used for secure web traffic. The DNS message is carried as an HTTP request and response, protected by TLS.

DoH can be built into an operating system, browser, application, or network agent. This flexibility can help with deployment, but it also creates a management challenge: a browser or application may use its own DoH resolver instead of the DNS resolver configured for the device or network.

Since DoH traffic resembles other HTTPS traffic, network monitoring tools may have a harder time distinguishing it from ordinary web connections based on port alone. That can make broad blocking less reliable and may reduce DNS visibility for network teams unless they have appropriate endpoint or resolver telemetry.

## How DNS over TLS works

DNS over TLS encrypts DNS messages using TLS on a dedicated transport, commonly TCP port 853. The protocol is specified in [RFC 7858](https://www.rfc-editor.org/rfc/rfc7858). A client connects to a DoT-capable resolver, establishes a TLS session, and sends DNS messages through it.

The dedicated port can make DoT easier for network teams to identify and control at network boundaries. That visibility can also make it easier to block, whether intentionally under policy or unintentionally through a firewall rule. DoT support varies across operating systems, applications, and network equipment, so verify actual client behavior rather than assuming that a configured resolver setting means all queries use DoT.

## DNS over HTTPS vs DNS over TLS: key differences

| Consideration | DNS over HTTPS (DoH) | DNS over TLS (DoT) |
| --- | --- | --- |
| Transport | DNS messages carried over HTTPS | DNS messages carried over TLS on a dedicated DNS transport |
| Common port | Usually TCP 443; HTTP/3 deployments may use QUIC over UDP 443 | Commonly TCP 853 |
| Network visibility | Can resemble other HTTPS traffic | Dedicated port is easier to identify at the network layer |
| Typical deployment | Operating systems, browsers, apps, and managed clients | Operating systems, network clients, and managed resolver configurations |
| Common operational concern | Apps may use a resolver that bypasses network DNS policy | Port 853 may be blocked or unavailable on a network path |
| Encryption endpoint | The selected recursive resolver | The selected recursive resolver |

The protocols provide similar protection for the client-to-resolver hop when the client validates the resolver connection and the resolver is trusted. Neither is inherently more private just because it uses a different transport. The resolver operator, the client configuration, and the surrounding network policy matter.

## How to assess which protocol fits

Choose based on client support, policy requirements, and operational needs—not on the protocol name alone. Use the following assessment before rollout:

1. **Inventory clients and resolvers.** Identify operating systems, browsers, mobile devices, applications, VPN clients, and network appliances that make DNS queries. Record whether each uses system DNS settings or can select a resolver independently.
2. **Define the resolver policy.** Decide which resolvers are approved, whether internal domains require split DNS, and which filtering or logging requirements apply. Confirm that the resolver can handle the organization’s expected workloads and policy needs.
3. **Check enforcement points.** Determine whether the organization manages DNS settings on endpoints, controls browser policies, restricts outbound DNS, or uses a managed network agent. A port-based rule alone may not control every DoH implementation.
4. **Test real network paths.** Validate behavior in offices, remote-work networks, VPNs, guest networks, and other relevant environments. Include captive portals and networks with restrictive firewalls.
5. **Confirm monitoring and incident response.** Establish how teams will identify the resolver in use, investigate unusual queries, and distinguish a policy violation from a configuration or connectivity problem.
6. **Pilot and measure failures.** Start with a representative device group. Test internal name resolution, failover, application behavior, and resolver outages before making a broad change.

### When DoH may be a fit

DoH may be appropriate when managed clients support it and the organization can direct those clients to an approved resolver. Its use of familiar HTTPS paths may help in environments where other outbound traffic is limited, but it can also make network-only classification more difficult. Treat endpoint configuration and resolver selection as part of the deployment, not as optional details.

### When DoT may be a fit

DoT may suit environments that want a distinct DNS encryption transport and can permit and monitor its dedicated port. It can make network-level policy easier to express, provided clients support it and the route to the resolver allows it. Verify that firewalls, VPNs, and upstream networks do not silently block the connection.

## Common failure modes and how to troubleshoot them

### Clients bypass the organization’s resolver

A browser, application, or operating system may have its own encrypted DNS setting. The device can appear to have correct system DNS configuration while a particular app sends queries elsewhere.

**What to do:** Review managed browser and endpoint settings, test representative applications, and compare observed resolver traffic with the approved configuration. Apply controls at the endpoint or application layer where possible. Do not assume that blocking one port will prevent all DNS-over-HTTPS use.

### Internal or split-DNS names stop resolving

A public resolver may not know private company hostnames. If a client sends those queries to a public encrypted resolver instead of the organization’s resolver, internal applications may fail to resolve.

**What to do:** Test internal domains from each relevant network location. Configure managed clients to use an approved resolver that supports the required internal zones, or provide a policy-controlled mechanism to route internal queries appropriately. Confirm behavior both on and off the VPN.

### Firewall or captive portal blocks encrypted DNS

A network may block TCP port 853, restrict HTTPS destinations, or require a web sign-in before general connectivity is available. In these conditions, encrypted DNS may fail even when ordinary browsing later works.

**What to do:** Check connection logs and resolver reachability from the affected network. Test before and after captive-portal sign-in, and confirm that any fallback behavior matches organizational policy. Avoid silently falling back to unencrypted DNS if that would undermine the intended protection.

### Resolver configuration or certificate validation fails

A misspelled resolver hostname, incorrect client policy, expired or untrusted certificate, or incorrect system time can prevent a TLS connection from being established. A connection that does not validate the intended resolver should not be treated as successfully protected DNS.

**What to do:** Verify the resolver name and client configuration, check device time and certificate validation, and inspect relevant client or resolver logs. Avoid disabling certificate checks as a workaround.

### Failover works, but weakens policy

Some clients may fall back to another resolver or to conventional DNS when their encrypted resolver is unavailable. That can restore name resolution while sending queries through an unapproved path or without the expected encryption.

**What to do:** Document the client’s fallback behavior and test it during the pilot by making the approved resolver unavailable in a controlled environment. Decide whether fail-closed behavior, an approved secondary resolver, or another defined recovery path is appropriate for each device group.

## Practical checks for a deployment

For a low-risk evaluation, use a test domain such as `example.com` and a managed test device. Confirm which resolver the client is configured to use, then validate both connectivity and the observed client behavior. A successful lookup alone does not prove that the query used the intended encrypted protocol.

For example, if `kdig` is installed and supports TLS queries, a DoT connectivity check may look like:

```bash
kdig +tls @1.1.1.1 example.com
```

The exact options and resolver support depend on the installed tool and its version. This command tests a direct query to the specified resolver; it does not prove that browsers or other applications use the same resolver.

Some DNS providers also expose an HTTPS JSON API that can be queried with `curl`, for example:

```bash
curl --get 'https://cloudflare-dns.com/dns-query' \
  --data-urlencode 'name=example.com' \
  --data-urlencode 'type=A' \
  -H 'accept: application/dns-json'
```

This example uses a provider-specific JSON interface over HTTPS. It is useful for checking HTTPS reachability, but it is not by itself a test of a device’s standard DoH configuration or proof that the device’s DNS traffic is using RFC 8484. Use endpoint configuration, resolver logs, and network telemetry to verify the deployed behavior.

When troubleshooting, compare results across the device’s system resolver, the managed encrypted resolver, and the affected application. Record the network location, VPN status, resolver endpoint, and error details. Avoid using real sensitive internal hostnames in tests against public resolvers.

## Proportionate safeguards for teams

- **Use approved resolvers.** Select resolvers based on privacy, reliability, policy, and operational requirements. Understand what query data the resolver collects and how it handles it.
- **Manage endpoints consistently.** Configure operating systems and browsers through supported management controls. Recheck settings after browser updates or changes to device profiles.
- **Preserve internal DNS behavior.** Test private zones, VPN connections, service discovery, and conditional forwarding before rollout.
- **Monitor without overrelying on ports.** Port 853 can help identify DoT. DoH may use ordinary HTTPS paths, so combine network observations with endpoint configuration and resolver-side telemetry where available.
- **Plan fallback deliberately.** Define what clients should do when an encrypted resolver is unavailable. Test the behavior and document exceptions.
- **Limit disruption.** Roll out to a pilot group, review failure reports, and expand only after confirming that critical applications and network workflows still work.
- **Separate transport security from other controls.** Encrypted DNS does not replace endpoint protection, access control, DNS filtering, DNSSEC validation, or network monitoring.

## FAQ

### Is DNS over HTTPS more secure than DNS over TLS?

Neither protocol is automatically more secure in every deployment. Both can encrypt the connection from a client to a recursive resolver. Security depends on correct configuration, certificate validation, the chosen resolver, and whether clients actually use the approved service.

### Does DoH hide DNS queries from the resolver?

No. The resolver must process queries to return answers. DoH protects the connection in transit between the client and resolver, but the resolver can see the queries it receives.

### Can an organization block DoH or DoT?

Organizations can apply controls, but effectiveness depends on client behavior and network architecture. DoT’s dedicated port can make network-level identification more straightforward. DoH can use common HTTPS paths, so endpoint management and application policy may be needed in addition to network rules.

### Do DoH and DoT protect queries to authoritative DNS servers?

Not by themselves. They protect the client-to-recursive-resolver connection. The recursive resolver’s subsequent communications are separate and depend on the resolver’s own configuration and transport choices.

### Should teams enable both protocols?

Not necessarily. Supporting both can be useful if clients and policy require it, but it can also complicate enforcement and troubleshooting. Start with the organization’s client inventory and requirements, then define a clear resolver and fallback policy.

## Conclusion

DNS over HTTPS and DNS over TLS both address exposure of DNS queries on the connection between a client and its recursive resolver. DoH commonly travels over HTTPS, while DoT uses a dedicated TLS transport, often on port 853. That difference affects visibility, enforcement, and compatibility more than it changes the basic trust model.

For an effective comparison, assess the clients in use, resolver ownership, internal DNS needs, network restrictions, monitoring, and fallback behavior. Pilot the chosen approach, verify what clients actually do, and apply safeguards that preserve both encrypted transport and the organization’s DNS policy.
