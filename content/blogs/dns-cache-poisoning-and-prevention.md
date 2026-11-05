# DNS Cache Poisoning and Prevention

DNS is the system that helps devices find services by translating domain names into records such as IP addresses. To answer queries quickly, recursive DNS resolvers temporarily store— or cache—those records. If an attacker can trick a resolver into storing a false answer, users may be sent to an attacker-controlled destination even when they enter the correct domain name.

This attack is known as **DNS cache poisoning**. Effective dns cache poisoning prevention relies on several layers: secure resolver behavior, DNSSEC validation, protected authoritative DNS, and sensible incident response. This guide explains the mechanics, practical risks, and defensive choices for IT and security teams.

## What is DNS cache poisoning?

A recursive resolver receives a DNS query from a client, contacts the relevant DNS servers, and returns an answer. It normally caches the response for the record’s time to live (TTL), so it can answer later requests without repeating the full lookup.

In a cache-poisoning attack, an adversary causes the resolver to accept and cache forged DNS data. Later clients using that resolver may receive the false record until it expires or is removed. The affected record could point a domain to a malicious IP address or, depending on the record type and attack, direct users to an unauthorized mail or service endpoint.

Cache poisoning is different from changing a device’s local hosts file or compromising an authoritative DNS account. Those can also alter name resolution, but they involve different systems and require different investigation steps.

## How a poisoning attempt works

A simplified attack often follows this sequence:

1. The attacker identifies a recursive resolver used by a target or group of users.
2. The attacker causes the resolver to look up a domain, sometimes by triggering requests for names that are not already cached.
3. The resolver sends a query to an authoritative DNS server and waits for a response.
4. The attacker tries to send a forged response that appears to match the outstanding query and arrives before the legitimate answer.
5. If the resolver accepts the forged data, it may cache it and return it to clients.

Resolvers use response-matching details—including the query name and type, transaction ID, and network addresses and ports—to distinguish a valid response from an unrelated one. Modern resolvers also use techniques such as unpredictable source ports and strong transaction-ID randomization to make blind forgery harder. These measures reduce risk, but they do not provide cryptographic proof that an answer is authentic.

An attacker who can observe or modify traffic on the path, compromise a resolver, or control relevant DNS infrastructure may have capabilities beyond blind response guessing. Defenses should therefore be layered rather than dependent on a single randomization measure.

## Why DNS cache poisoning matters

A poisoned answer can affect more than one user. If a shared resolver stores bad data, every client relying on that cached record may be affected until the record expires or an administrator clears it. Potential consequences include:

- **Phishing and credential theft:** users can be directed to a convincing lookalike site.
- **Malware delivery:** a false answer can send clients to infrastructure hosting malicious content.
- **Service disruption:** incorrect records can make legitimate services unreachable.
- **Email routing manipulation:** forged or altered DNS data may interfere with mail delivery, depending on which records are affected and what other protections are in place.
- **Loss of trust:** users may blame the legitimate organization when its domain appears to behave incorrectly.

A changed DNS answer does not automatically defeat HTTPS. A browser may still reject a certificate that does not match the requested hostname. However, attackers may attempt to obtain valid certificates for domains they control, exploit users who ignore warnings, or target services that do not use strong authentication. DNS integrity is important even when transport encryption is widely deployed.

## Core defenses for dns cache poisoning prevention

### 1. Use a maintained recursive resolver

Choose a resolver that is actively maintained and configured to use current security practices. Keep DNS software and operating systems patched, and review vendor guidance for security updates. Avoid exposing a recursive resolver to the public internet unless there is a specific, controlled need; open resolvers can be abused and may expose users to unnecessary risk.

For enterprise resolvers, restrict which networks can submit recursive queries, monitor administrative access, and secure the host and its management interfaces. Apply access controls and change-management practices to resolver configuration.

### 2. Enable DNSSEC validation

DNS Security Extensions (DNSSEC) add cryptographic signatures to DNS data. A validating recursive resolver checks those signatures and the chain of trust from a configured trust anchor. If the data fails validation, the resolver should reject it rather than treat it as trustworthy.

DNSSEC is one of the strongest protections against forged DNS data, but deployment requires care:

- The domain’s authoritative zone must be correctly signed, and its parent zone must publish the necessary delegation information.
- The recursive resolver must perform validation, not merely request DNSSEC records.
- Signing keys and rollover procedures must be managed securely.
- Broken signatures or incorrect delegation records can make a domain fail validation and appear unavailable to validating clients.

DNSSEC does not encrypt DNS queries, hide the names users look up, or protect a compromised endpoint or resolver. It authenticates signed DNS data; it does not guarantee that the signed data points to a safe service. Domain owners should monitor signing status and plan key changes carefully.

### 3. Preserve resolver response protections

Confirm that the resolver uses unpredictable query transaction IDs and source ports, along with other response-validation measures supported by its software. Do not weaken these protections to accommodate a legacy system without assessing the risk and considering a safer fix.

Some resolvers support additional hardening, such as case randomization in DNS query names. Such features can add friction for blind forgery, but compatibility and implementation vary. Treat them as supplementary controls, not substitutes for DNSSEC validation or software maintenance.

### 4. Protect authoritative DNS and domain accounts

A resolver can validate a response correctly and still receive harmful data if the authoritative zone or domain account has been compromised. Protect domain registrar and DNS hosting accounts with multifactor authentication, strong unique credentials, and restricted administrative access. Review account recovery options and alerting. Limit zone changes to authorized personnel and keep an audit trail.

For authoritative DNS infrastructure, restrict zone transfers to approved systems, use secure management channels, and monitor for unexpected record changes. DNSSEC protects the authenticity of signed records, but it does not prevent an authorized attacker—or someone who has taken over an account—from publishing harmful changes and signing them through legitimate controls.

### 5. Use encrypted DNS transport where appropriate

DNS over TLS (DoT) and DNS over HTTPS (DoH) encrypt the connection between a client and a resolver. This can help protect queries from observation or modification on that network path. However, encrypted transport does **not** prove that the resolver’s answer is authentic, and it does not repair a poisoned cache at the resolver. Pair it with a trusted resolver and DNSSEC validation where available.

Organizations should decide which resolvers devices are allowed to use. Unmanaged encrypted DNS settings can bypass corporate filtering, logging, or incident-response controls. Set a clear policy and configure endpoints accordingly.

## Practical checks and response steps

If users report that a domain resolves to an unexpected address, first establish whether the issue is local, resolver-wide, or authoritative. A single unexpected result is not proof of cache poisoning: DNS changes, split-horizon DNS, stale records, VPN settings, and local caches can produce different answers.

### Compare answers from configured and alternate resolvers

Use `dig` on Linux or macOS, or an equivalent DNS query tool, to inspect the answer from the resolver in use:

```sh
dig example.com A
```

You can query a specific resolver by adding its address after the name:

```sh
dig @192.0.2.53 example.com A
```

Replace the example address with an approved resolver in your environment. Compare results with a trusted reference resolver and, where useful, the domain’s authoritative servers. Do not send sensitive internal names to public resolvers during troubleshooting.

To request DNSSEC-related records and see whether a validating resolver reports the answer as authenticated, try:

```sh
dig +dnssec example.com A
```

The `AD` flag in a response indicates that the resolver reports the data as authenticated. It is meaningful only when you trust the resolver and the channel to it; it is not a signature that a client can independently verify merely by seeing the flag. DNS tooling and resolver behavior can differ, so check local documentation when interpreting results.

### Investigate methodically

1. **Record the symptoms:** note the affected hostname, record type, time, client network, resolver address, and observed answers.
2. **Compare multiple vantage points:** check the client’s configured resolver, the organization’s recursive resolvers, and authoritative DNS where appropriate.
3. **Check for expected causes:** review recent DNS changes, TTLs, VPN or split-DNS configuration, endpoint security software, and local host overrides.
4. **Verify DNSSEC status:** use a validating resolver or DNSSEC-aware diagnostic tool to determine whether validation succeeds or fails.
5. **Contain and correct:** if a resolver is confirmed to hold incorrect data, follow its vendor-specific procedure to remove the affected cache entry or restart the service if necessary. Preserve logs and evidence before taking disruptive action.
6. **Address the source:** investigate resolver compromise, unauthorized zone changes, registrar access, and network-path interference. Clearing a cache alone does not remove the cause and a false answer may return.

A device’s local cache can also be cleared during troubleshooting. For example, Windows provides:

```powershell
ipconfig /flushdns
```

On systems using systemd-resolved, the command is commonly:

```sh
resolvectl flush-caches
```

Commands and service behavior vary by operating system and configuration. Clearing a client cache only affects that device; it does not clear a shared recursive resolver’s cache.

## Common design trade-offs

Caching improves performance and reduces repeated upstream queries, so disabling it is generally not a practical prevention strategy. Instead, use a trustworthy resolver and appropriate TTLs, and avoid unusually long TTLs for records where rapid recovery is important. A shorter TTL does not authenticate data and is not, by itself, a defense against poisoning.

Centralized enterprise resolvers can improve policy enforcement and visibility, but they become important infrastructure that must be secured, monitored, and made resilient. Redundant resolvers should have consistent security settings and access controls. If clients can silently switch to unapproved resolvers, incident response and DNS policy may be undermined.

DNSSEC validation can expose configuration errors that non-validating resolvers tolerate. Test changes before broad deployment, monitor validation failures, and have a documented rollback process that does not permanently disable validation as a routine workaround.

## FAQ

### Does DNS over HTTPS prevent DNS cache poisoning?

Not by itself. DoH encrypts the client-to-resolver connection, which can reduce on-path observation and tampering. It does not cryptographically validate the resolver’s DNS answer or prevent a poisoned cache on that resolver. DNSSEC validation addresses the authenticity of signed DNS data.

### Can HTTPS protect users if DNS is poisoned?

HTTPS can prevent many connections to an attacker from succeeding because browsers verify certificates for the requested hostname. It is an important layer, but it is not a complete DNS defense. Users may encounter warnings, and other services or misconfigurations may not provide the same protection.

### Should organizations disable DNS caching?

Usually not. Caching is a normal and useful part of DNS and disabling it can increase latency and upstream query volume. Secure the resolver, keep it updated, enable validation where appropriate, and monitor its behavior instead.

### Does flushing DNS fix a poisoned answer?

It may remove a stale or incorrect entry from the cache you flush, but it does not correct a compromised resolver, authoritative zone, or network path. The false data may be cached again unless the underlying cause is resolved.

## Conclusion

DNS cache poisoning attempts to make a resolver store and distribute false DNS answers. Modern resolver protections make blind forgery more difficult, while DNSSEC validation provides cryptographic verification for signed DNS data. Neither replaces secure administration: keep resolvers updated, restrict access, protect authoritative DNS and domain accounts, and use encrypted transport with a trusted resolver where it fits your policy.

For effective dns cache poisoning prevention, combine these controls with monitoring and a response process that compares answers across resolvers, preserves evidence, and addresses the source of incorrect data—not just the cache entry.
