# DNS Security Extensions Explained

The Domain Name System (DNS) helps applications find the IP addresses and other records associated with a domain. Traditional DNS, however, does not provide a built-in way for a resolver to verify that an answer is authentic and has not been altered in transit. DNS Security Extensions (DNSSEC) add that verification through digital signatures and a chain of trust.

DNSSEC is useful, but it is not a complete security solution. It does not encrypt DNS queries, prevent outages, or protect a domain if its signing keys or registrar account are compromised. A sound evaluation therefore checks both the cryptographic chain and the operational practices around it.

This guide explains how DNSSEC works and provides a practical workflow for assessing it in a domain you own or are explicitly authorized to test.

## What DNSSEC does

DNSSEC lets a validating resolver verify that DNS data came from the correct zone and was not modified without detection. It adds signed records to DNS responses and links a child zone’s keys to its parent zone.

The main DNSSEC record types are:

- **DNSKEY**: Publishes the public keys used to verify a zone’s signatures.
- **RRSIG**: Contains a digital signature for a set of DNS records, such as an A or MX record set.
- **DS**: A digest of a child zone’s DNSKEY, published in the parent zone to connect the child to the DNSSEC chain of trust.
- **NSEC or NSEC3**: Provides signed evidence that a requested name or record does not exist. NSEC3 can limit straightforward enumeration of names, but it should not be treated as a privacy control.

A validating resolver starts with a trusted root key and follows the chain through parent and child zones. At each step, it checks the relevant signatures and key relationships. If a required link is invalid, the resolver can reject the response rather than return data it cannot validate.

## What DNSSEC does not do

DNSSEC provides data-origin authentication and integrity for signed DNS data. It does **not** provide:

- **Confidentiality:** DNS queries and answers are not encrypted by DNSSEC. DNS over HTTPS or DNS over TLS can encrypt a connection to a resolver, but those protocols serve a different purpose.
- **Availability:** DNSSEC cannot stop denial-of-service attacks, resolver outages, or an unreachable authoritative server.
- **Protection from every domain compromise:** An attacker with control of a zone’s signing keys, DNS hosting account, or registrar account may be able to make valid changes.
- **A guarantee that a record is safe:** A valid signature confirms that data is associated with the zone’s authorized keys; it does not establish that the destination itself is benign.

These limits matter when choosing security best practices. DNSSEC is one layer of networking security, not a replacement for access controls, monitoring, resilient DNS hosting, or encrypted transport where needed.

## A practical DNSSEC evaluation workflow

Use this workflow only for domains and DNS infrastructure you own or have permission to assess. The commands below use `example.com` as a placeholder; replace it with your authorized domain and use a trusted recursive resolver when indicated.

### 1. Define the scope and expected state

Record the domain, its parent zone, authoritative DNS providers, and the recursive resolvers relevant to your users or applications. Establish whether the domain is intended to be signed. A domain without DNSSEC may be an intentional choice; absence of a DS record alone is not proof of a fault.

Also identify the expected DNS records and any important subdomains or delegations. DNSSEC must be considered across delegation boundaries: a signed parent does not automatically mean every child zone is signed.

### 2. Check for a DS record in the parent

A DS query asks about the child name in the parent zone. For example:

```sh
dig +dnssec example.com DS
```

If a DS record is returned, the parent is publishing information that should match a DNSKEY in the child zone. If no DS record is present, the child is generally treated as insecure rather than validated through a DNSSEC chain, assuming the parent response itself is valid.

To inspect the delegation path, you can also run:

```sh
dig +trace +dnssec example.com DS
```

This displays responses along the delegation path and can help locate where DS information is published. A trace is a diagnostic view, not by itself proof that every signature has been cryptographically validated.

### 3. Inspect the child’s DNSKEY and signatures

Query the zone’s DNSKEY set and a few representative record types:

```sh
dig +dnssec example.com DNSKEY
dig +dnssec example.com A
dig +dnssec example.com MX
```

Look for DNSKEY records and corresponding RRSIG records. A DNSKEY response alone does not establish that the delegation is correct: the DS in the parent must correspond to an appropriate child key, and signatures must be valid and current.

Repeat relevant queries against each authoritative nameserver. Different answers from different servers can indicate incomplete propagation, inconsistent configuration, or a signing problem. Check the zone apex and important delegated subdomains, not just one A record.

### 4. Test validation with a validating resolver

A recursive resolver can validate DNSSEC on behalf of clients. Query a resolver you trust and inspect the response:

```sh
dig @1.1.1.1 +dnssec example.com A
```

In `dig` output, the `ad` flag means the resolver reports that it authenticated the data. Treat that flag as meaningful only when you trust the resolver and the path to it. The flag is not a substitute for securing the client-to-resolver connection, because ordinary DNS transport may be observable or alterable.

For an independent validation check, BIND installations commonly provide `delv`:

```sh
delv example.com A
```

`delv` performs DNSSEC validation using its configured trust information and resolver behavior. Review the tool’s local configuration and documentation, especially in environments with custom trust anchors or nonstandard resolver setups. Tool output and options can vary by version.

### 5. Interpret results carefully

Use the combined results rather than relying on a single flag or query:

- **Signed and validating:** The zone has a working chain of trust for the data tested, and the validating resolver accepts it.
- **Unsigned or insecure:** There is no applicable DS chain for the zone. This may be expected, but the data is not authenticated by DNSSEC.
- **Validation failure:** The chain may be broken, a signature may be expired or otherwise invalid, or resolver configuration may be incorrect. Users of validating resolvers may receive `SERVFAIL`.
- **Inconsistent answers:** Authoritative servers, recursive caches, or delegation data may not be synchronized. Compare servers and account for TTLs before changing configuration.

The DNSSEC `DO` bit requests DNSSEC-related records in a response; it does not mean the querying client has validated them. Likewise, `dig +trace` exposes delegation responses but does not replace a validating resolver or validator.

## If you operate the zone: deployment and remediation

DNSSEC configuration is often managed through a DNS provider, registrar, or both. Follow the providers’ supported process and confirm which party signs the zone and which party publishes the DS record.

A cautious deployment sequence is:

1. **Confirm signing support and responsibilities.** Identify who manages signing keys, key rollovers, and DS publication. Verify how the provider handles key generation, backup, and recovery.
2. **Enable signing and inspect authoritative answers.** Confirm that authoritative servers consistently serve DNSKEY and valid signatures for the records that should be signed.
3. **Verify the DS values before publishing them.** Compare the provider’s DS information with the DNSKEY used for the chain. Check key tag, algorithm, digest type, and digest as applicable; do not copy values from an unrelated zone or stale configuration.
4. **Publish the DS through the parent or registrar.** After publication, query the parent and test through a validating resolver. Allow for cached delegation data and TTLs during propagation.
5. **Monitor validation and renewal operations.** Check for signature expiration, failed key transitions, missed renewals, and provider alerts. Document ownership and escalation paths.

If validation fails after a change, first determine where the chain breaks. Compare the parent’s DS with the child’s current DNSKEY, check signature validity and authoritative-server consistency, and inspect resolver logs if available. Correct the underlying mismatch rather than asking users to bypass validation.

A particularly risky failure occurs when a DS record remains in the parent but no longer matches the child’s DNSKEY. The child can then appear bogus to validating resolvers, causing lookup failures. Before disabling DNSSEC, coordinate the change: remove the DS from the parent and allow relevant caches to expire before removing signatures from the child. Follow the DNS provider’s documented process and account for TTLs; do not improvise key or DS changes during an incident.

### Troubleshooting a `SERVFAIL`

A `SERVFAIL` does not prove that DNSSEC is the cause. Compare results from authoritative servers and more than one trusted validating resolver, then inspect the DS, DNSKEY, and RRSIG records. Check for expired signatures, mismatched keys, incomplete updates, incorrect system time on infrastructure, or resolver-side issues.

For diagnosis only, `dig +cdflag` asks a recursive resolver not to perform checking for that query:

```sh
dig @1.1.1.1 +dnssec +cdflag example.com A
```

If this returns data while an ordinary validating query fails, DNSSEC validation may be involved. This is a clue, not a repair or proof that the returned data is trustworthy. Do not use checking-disabled results as a production workaround or instruct users to disable validation.

## Security best practices for DNSSEC operations

- Keep registrar, DNS provider, and key-management accounts protected with strong authentication and least-privilege access.
- Document who is responsible for signing, DS publication, key rollover, and incident response.
- Use supported automated signing and rollover mechanisms where available, and monitor their health rather than assuming automation cannot fail.
- Test changes in a controlled process and verify them from authoritative and validating perspectives.
- Track TTLs and propagation when publishing or removing DS records.
- Monitor for unexpected changes to DS, DNSKEY, and critical zone records.
- Maintain resilient authoritative DNS and an incident plan; DNSSEC does not provide availability.
- Use encrypted DNS transport when confidentiality on the client-to-resolver path is required, while recognizing that encryption and DNSSEC solve different problems.

## FAQ

### Does DNSSEC encrypt DNS queries?

No. DNSSEC adds signatures that allow validation of DNS data. It does not encrypt queries or responses. DNS over HTTPS and DNS over TLS can encrypt a client’s connection to a resolver, but they do not replace DNSSEC’s data-validation role.

### Does a DS record mean a domain is secure?

A DS record indicates that the parent publishes a link to the child’s DNSSEC keys. The chain is useful only if the DS matches the child’s keys and the relevant signatures validate. A mismatch can cause validating resolvers to reject answers.

### Why might a DNSSEC-enabled domain return `SERVFAIL`?

A validating resolver may return `SERVFAIL` when it cannot validate the response. Common causes include a stale or mismatched DS record, invalid or expired signatures, inconsistent authoritative servers, or resolver configuration problems. Investigate the chain before changing client settings.

### Can DNSSEC prevent phishing or malicious domains?

Not on its own. DNSSEC can help detect forged or altered DNS data for signed zones, but it does not determine whether a legitimately published domain is trustworthy. Use it alongside other security controls.

## Conclusion

DNSSEC strengthens DNS by letting validating resolvers authenticate signed data through a chain of trust. A reliable evaluation checks the parent DS, child DNSKEY and RRSIG records, authoritative-server consistency, and validation through a trusted resolver. If you manage the zone, treat signing and DS changes as coordinated operational changes, monitor them, and remediate broken chains at their source. DNSSEC is a valuable part of networking security, but it works best alongside availability, access-control, and privacy protections.
