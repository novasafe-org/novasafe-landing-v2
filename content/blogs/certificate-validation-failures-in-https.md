# Certificate Validation Failures in HTTPS

HTTPS certificate validation failures can appear as browser warnings, failed API requests, or TLS errors in application logs. The message may point to an expired certificate, an untrusted issuer, a hostname mismatch, or a missing intermediate certificate—but the same endpoint can work on one device and fail on another.

This guide provides a practical workflow for diagnosing certificate validation failures in HTTPS in an authorized environment. It covers the checks to run, how to interpret common results, and how to verify a fix without disabling certificate validation.

## What HTTPS certificate validation checks

During a TLS connection, a client evaluates the server certificate and the certificate chain presented by the server. The client typically checks that:

- The certificate is within its validity period.
- The requested hostname matches a name in the certificate’s Subject Alternative Name (SAN) extension.
- The certificate chains to a root CA trusted by that client.
- Required intermediate certificates are available and the chain can be built.
- The certificate is acceptable for the connection, including relevant key usage and algorithm constraints.
- Any applicable revocation or policy checks pass, according to the client’s configuration.

A certificate can be correctly installed on a server and still fail validation for a particular client. Different operating systems, browsers, runtimes, containers, proxies, and trust stores may evaluate or obtain trust information differently.

## Start with a safe troubleshooting workflow

Run tests only against systems you own or are authorized to assess. Record the exact hostname, URL, time of failure, client or runtime, network path, and full error message. Avoid using options that skip certificate checks as a fix: they can hide the problem while leaving the connection vulnerable to interception.

### 1. Reproduce the failure in the affected client

Begin with the client that reports the problem. Capture the complete error, including any certificate or TLS alert details. Note whether the failure occurs in a browser, command-line tool, service, container, or only on a particular network.

Compare the same URL from a known-good client, but do not treat success there as proof that the server is configured correctly. The clients may have different trust stores, clocks, proxy settings, or TLS implementations.

### 2. Check the system clock

A significantly incorrect clock can make a valid certificate appear not yet valid or expired. Check the time and time synchronization on both the client and, where relevant, the server. Correct the clock using the organization’s approved time service, then repeat the test.

### 3. Inspect the endpoint and certificate chain

Use OpenSSL to connect with the expected hostname as SNI and request verification:

```bash
openssl s_client -connect example.com:443 -servername example.com -verify_return_error -showcerts </dev/null
```

Replace `example.com` with the authorized target. The `-servername` option matters: servers hosting multiple sites may return a different certificate depending on the requested name. Look for the verification result near the end of the output and review the certificates sent by the server.

OpenSSL versions and local configurations differ in how they locate trusted CA certificates. If this command cannot find a local issuer, compare its result with the affected application and with `curl`; the discrepancy may indicate a trust-store or runtime difference rather than a server-side chain problem.

To inspect a certificate saved as `leaf.pem`, run:

```bash
openssl x509 -in leaf.pem -noout -subject -issuer -dates -ext subjectAltName
openssl x509 -in leaf.pem -noout -checkhost example.com
```

The first command shows the subject, issuer, validity dates, and SAN entries. The second checks whether the certificate matches the hostname. A certificate’s Common Name alone is not a reliable substitute for checking SANs.

### 4. Test with the client’s normal validation behavior

Run `curl` without options that disable verification:

```bash
curl -v https://example.com/ -o /dev/null
```

The verbose output can help distinguish a certificate problem from DNS, TCP, proxy, or protocol failures. If the request fails, preserve the exact error and compare it with the OpenSSL output. Different results can be useful evidence: `curl` may use a different TLS library or CA bundle than OpenSSL on the same machine.

If the hostname resolves to multiple addresses, test each authorized address while preserving the hostname for TLS verification and SNI:

```bash
curl -v --resolve example.com:443:203.0.113.10 https://example.com/ -o /dev/null
```

Use the real address for your environment; `203.0.113.10` is an example address. This test helps identify inconsistent certificates or configurations across load balancers and servers. Do not use an IP address as the URL unless the certificate is intended to cover that IP.

### 5. Identify where the chain or trust path breaks

A typical public certificate chain contains a leaf certificate for the website and one or more intermediate CA certificates. The client usually already trusts the root CA. A server should generally send the leaf and required intermediate certificates, not rely on the client to discover a missing intermediate.

Review the chain for these issues:

- **Missing intermediate:** Some clients can retrieve or cache an intermediate that others cannot. Configure the server with the complete intended chain.
- **Untrusted issuer:** The issuer may be a private CA, an unknown CA, or a root absent from the client’s trust store.
- **Wrong certificate served:** The endpoint may return a default certificate, an outdated certificate, or a certificate for another virtual host because of incorrect SNI or load-balancer configuration.
- **Different results by route:** A CDN, reverse proxy, load balancer, or individual backend may have a different certificate or chain.

When a certificate is issued by an organization’s private CA, confirm that the CA is approved and distribute its root certificate through an authenticated, managed process. Do not trust a certificate or CA merely because it makes the warning disappear.

### 6. Check hostname, validity, and certificate purpose

Confirm that the exact hostname in the URL appears in the certificate’s SAN entries. A certificate for `www.example.com` does not automatically cover `example.com`; wildcard certificates also have defined matching limits.

Check the `notBefore` and `notAfter` dates against the client’s clock. If the certificate is expired or not yet valid, inspect renewal automation and deployment processes. Also confirm that the certificate is intended for server authentication and that the server is presenting the expected leaf certificate.

### 7. Compare clients, networks, and trust stores

If only one client fails, investigate its environment before changing the server. Check:

- Whether the operating system and CA certificates are current.
- Whether an application, language runtime, or container uses a separate CA bundle or trust store.
- Whether a corporate proxy or security gateway terminates and re-encrypts TLS using an organization-issued certificate.
- Whether VPN, DNS, proxy, or split-horizon routing sends the client to a different endpoint.
- Whether the application uses a pinned certificate or public key that no longer matches the deployed certificate.

If failure occurs only on a managed network, coordinate with the network or security team. TLS inspection can be intentional, but clients must receive the organization’s approved trust configuration through managed channels. An unexpected issuer can also indicate an incorrect proxy configuration or a security incident; investigate rather than adding it to the trust store.

## Common errors and corrective actions

| Symptom | Likely causes | Validation and remediation |
|---|---|---|
| Certificate has expired | Renewal failed, deployment missed the renewed certificate, or a backend serves an old copy | Check the dates on every endpoint and backend. Renew and deploy the intended certificate and chain, then retest each route. |
| Hostname does not match | Wrong certificate, incorrect URL, or misconfigured virtual host/SNI | Compare the URL hostname with SAN entries. Correct the DNS, SNI, or certificate assignment as appropriate. |
| Unknown issuer or untrusted certificate | Missing intermediate, private CA not trusted, or unexpected TLS inspection | Inspect the served chain and client trust store. Install the correct intermediate on the server or distribute an approved private CA through managed configuration. |
| Unable to get local issuer certificate | Incomplete chain or missing CA certificates in the client environment | Compare the server’s chain with the client’s CA bundle. Configure the server to send required intermediates; update the client’s approved CA package if needed. |
| Works in a browser but fails in an application | Different CA store, runtime, proxy settings, or certificate pinning | Identify the application’s TLS library and trust source. Test from the same runtime and environment, then correct its managed configuration. |
| Works on one network but not another | Different DNS answer, proxy, TLS inspection, or backend path | Compare DNS resolution, proxy settings, and the certificate presented on each route. Escalate unexpected differences to the responsible team. |

## Remediation by environment

### Web servers, proxies, and load balancers

Install the correct certificate and its required intermediate chain at every TLS termination point. Verify that each virtual host or listener selects the intended certificate for the requested SNI name. If traffic is distributed across multiple nodes, check all nodes rather than only the one reached by a single test.

After deployment, repeat the checks from an external client and from the affected network path. Confirm the hostname, dates, chain, and verification result. Monitor renewal and deployment jobs so a renewed certificate is not left unused while an older one remains active.

### Linux systems and containers

On Debian- or Ubuntu-based systems, the `ca-certificates` package and `update-ca-certificates` command are commonly used to manage system trust. On Red Hat-based systems, CA trust is commonly managed through the `ca-certificates` package and `update-ca-trust`. Follow the distribution’s documentation and organizational policy; commands and locations can differ by release.

A container may have its own CA bundle, separate from the host. Ensure the image includes the required public CA package or approved private CA configuration, and rebuild or redeploy it after changes. Avoid copying arbitrary certificates into an image without validating their origin and purpose.

### Java and other application runtimes

Some runtimes use a dedicated trust store rather than the operating system’s CA store. Check the application’s configured trust store, runtime version, and proxy settings. For Java, for example, inspect the trust-store configuration and confirm that any required CA certificate is the approved certificate obtained through a trusted channel. Make trust changes narrowly and document them; do not import a website’s leaf certificate as a broad substitute for a correctly managed CA chain.

## Verify the fix

A remediation is not complete until the original failing client succeeds with normal certificate validation enabled. Repeat the same request and compare the result with the baseline. Verify:

1. The endpoint returns the intended certificate for the hostname and SNI name.
2. The certificate is currently valid and covers the hostname.
3. The full required chain is available and trusted by the affected client.
4. All relevant addresses, backends, proxies, and application environments behave consistently.
5. Renewal or configuration automation will preserve the fix.

Keep the diagnostic output and change record according to your organization’s procedures. If the failure remains intermittent or the presented certificate is unexpected, escalate to the team responsible for DNS, network routing, proxying, or certificate management.

## Security considerations

Do not treat disabling TLS verification as a remediation. It removes a core protection that helps clients confirm they are connected to the intended server. Likewise, do not add an unknown root CA, accept an unexpected proxy certificate, or pin a leaf certificate without understanding the operational and security consequences.

A certificate error may be caused by routine misconfiguration, but an unexpected certificate can also be a sign of traffic interception or a compromised endpoint. Preserve the details, validate the certificate through trusted administrative channels, and follow incident-response procedures when the issuer or route is unexplained.

## FAQ

### Why does HTTPS work in my browser but fail in an application?

The browser and application may use different CA stores, TLS libraries, proxy settings, or certificate-pinning rules. Test from the application’s actual host or container and identify which trust store its runtime uses.

### Does a valid certificate mean the server sent the complete chain?

Not necessarily. A client may already have a missing intermediate cached or may obtain it through another mechanism. Test with a fresh or different client and inspect the certificates the server presents. Configure the server to provide the required intermediates.

### Should I install the server’s certificate into the client trust store?

Usually not as a general fix. First determine whether the server has an incomplete chain or whether the client lacks an approved CA. For private PKI, distribute the authorized CA certificate through managed, authenticated processes rather than trusting an unverified leaf certificate.

### Can a certificate validation failure indicate an attack?

It can, though configuration, clock, or trust-store problems are common causes. If the certificate, issuer, or network path is unexpected, do not bypass the warning. Confirm the expected configuration with the responsible team and investigate under your organization’s security procedures.

## Conclusion

Resolving certificate validation failures in HTTPS starts with reproducing the issue in the affected client, checking time and hostname, inspecting the presented chain, and comparing trust stores and network paths. Apply the narrowest appropriate correction, then verify it with normal certificate checks enabled across the relevant clients and endpoints. This workflow helps distinguish server misconfiguration from client or network issues while preserving the security that HTTPS is meant to provide.
