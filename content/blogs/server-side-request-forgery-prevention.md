# Server-Side Request Forgery Prevention

Server-side request forgery (SSRF) happens when an application makes a network request based on input an attacker can influence. A feature that fetches an image, checks a webhook, imports a document, or previews a URL can become a route to internal services if it accepts arbitrary destinations.

Effective server-side request forgery prevention is not just a matter of rejecting `localhost`. A secure design controls which destinations the application can reach, how URLs are interpreted, what happens after redirects, and which response data the application accepts. This guide compares the main defensive approaches and explains when to use each.

## How SSRF happens

A typical vulnerable flow looks like this:

1. A user supplies a URL.
2. The application sends a request to that URL from its own network environment.
3. The application returns, stores, or processes the response.

The attacker may try to make the server contact internal application endpoints, cloud instance metadata services, or other destinations that are not exposed publicly. The request might use HTTP, HTTPS, or another protocol supported by the application’s URL-fetching library. Even if the response is not shown to the user, the request can still cause harm—for example, by reaching a sensitive service or triggering an action.

SSRF commonly appears in URL previews, webhook delivery and testing, remote file imports, image or document fetchers, PDF generation, and integrations that let users specify an endpoint. Treat any user-influenced outbound request as a security-sensitive feature.

## Start with the narrowest destination policy

The strongest application-level defense is to avoid accepting arbitrary destinations. If a feature only needs to contact a known service, configure that destination in trusted application settings and do not let users supply a complete URL.

When users need some control, define precisely what they may choose. For example, let them select an integration from a list of configured providers rather than entering a host and path. A narrower interface makes security rules easier to enforce and reduces the number of URL parsing and network edge cases.

A useful order of preference is:

1. **Fixed destination:** The application contacts one configured host and endpoint.
2. **Host allowlist:** Users can choose from a small set of approved hosts.
3. **Constrained external fetching:** The feature must reach arbitrary public URLs, so a dedicated outbound-fetch service applies strict URL, DNS, IP, redirect, and network policies.

The more destinations a feature accepts, the more important defense in depth becomes.

## Compare the main SSRF prevention approaches

| Approach | Best suited to | Benefits | Limitations |
|---|---|---|---|
| Fixed destination or exact hostname allowlist | Integrations and known providers | Simple policy; limits attacker choice | Requires careful hostname matching and network controls; can be difficult to maintain as providers change |
| URL and scheme validation | Any user-influenced URL feature | Rejects malformed or unsupported input early | Parsing and string checks alone do not prove where a connection will go |
| DNS and IP validation | Features that must fetch external URLs | Can reject destinations that resolve to prohibited addresses | DNS can change between validation and connection; redirects and address formats add complexity |
| Redirect restrictions | Fetchers that follow HTTP redirects | Stops an approved URL from redirecting to a disallowed destination | Disabling redirects may affect compatibility; manually followed redirects must be checked again |
| Egress filtering or a controlled outbound proxy | Services that make outbound requests | Enforces destination policy at the network or connection boundary | Requires infrastructure and policy maintenance; a proxy must be configured to resist bypass |
| Isolation and least privilege | All outbound-request services | Limits the impact of a missed application check | Reduces impact but does not make an unsafe request policy safe by itself |

These measures work best together. Input validation can reject obviously invalid requests, while network egress controls prevent the application from reaching destinations that should never be accessible.

## Validate URLs carefully

Use a well-maintained URL parser rather than trying to validate a URL with a regular expression or a few string checks. Define a policy and enforce it consistently:

- Allow only the schemes the feature needs, usually HTTPS. Reject unexpected schemes rather than trying to support every protocol a library might understand.
- Reject URLs containing embedded usernames or passwords.
- Restrict ports to the ones the feature requires. If the service only uses HTTPS, for example, permit the default HTTPS port or an explicitly approved alternative.
- Match allowlisted hostnames exactly. A check such as `host.endswith('trusted.example')` can also accept an attacker-controlled name like `not-trusted.example` if implemented carelessly.
- Normalize hostnames consistently, including case and trailing dots. If internationalized domain names are in scope, define and test a consistent IDNA policy instead of comparing visually similar strings.
- Set limits on URL length and on any path or query components that the feature does not need.

Do not treat a valid-looking URL as proof that its destination is safe. The hostname is only one input to the network connection; DNS resolution and redirects can change the eventual destination.

### Example: exact-host validation for a known integration

This Python example illustrates scheme, hostname, credential, and port checks for a feature that only contacts one known partner. It is not a complete defense against DNS changes or network-level attacks; pair it with outbound network restrictions and the redirect policy described below.

```python
from urllib.parse import urlsplit

ALLOWED_HOSTS = {'api.partner.example'}


def validate_partner_url(raw_url: str) -> str:
    try:
        parsed = urlsplit(raw_url)
        port = parsed.port  # Access may raise ValueError for an invalid port.
    except ValueError as exc:
        raise ValueError('Invalid URL') from exc

    host = parsed.hostname
    if parsed.scheme.lower() != 'https' or not host:
        raise ValueError('Only HTTPS URLs are accepted')

    if parsed.username is not None or parsed.password is not None:
        raise ValueError('Credentials in URLs are not accepted')

    normalized_host = host.rstrip('.').lower()
    if normalized_host not in ALLOWED_HOSTS:
        raise ValueError('Host is not allowed')

    if port not in (None, 443):
        raise ValueError('Port is not allowed')

    return raw_url
```

Use the returned URL only in a client configured for the feature’s policy. For example, disable automatic redirects and set connection and read timeouts. If a response is streamed, enforce a maximum response size. Keep TLS certificate verification enabled. Also review client settings such as environment-derived proxies so requests cannot unexpectedly bypass your intended network path.

This example deliberately does not claim to make arbitrary URL fetching safe. If a hostname can resolve to different addresses over time, application-level validation alone may not ensure the connection uses the address that was checked.

## Validate the resolved destination—and prevent time-of-check/time-of-use gaps

When a feature must fetch user-supplied public URLs, resolve the hostname and evaluate the resulting addresses against a maintained destination policy. Reject addresses that are not permitted, including loopback, private, link-local, and other special-purpose ranges relevant to your environment. Apply the policy to both IPv4 and IPv6, including IPv4-mapped IPv6 forms where the networking stack may treat them as equivalent.

A common mistake is to resolve a hostname, check that the result is public, and then make a separate request using the hostname. The HTTP client may perform another DNS lookup at connection time. If the answer changes between those operations, the connection may reach a different address. This is a time-of-check/time-of-use gap and is one reason a one-time DNS check is not sufficient on its own.

Safer designs enforce the destination policy at the point where the connection is made. Options include a carefully configured outbound proxy that resolves and filters destinations, or a client that connects to a validated address while preserving correct TLS hostname verification and HTTP host handling. These implementations are easy to get wrong; use mature, well-reviewed components and test their DNS and connection behavior. Recheck the address policy for every new connection as appropriate to the client’s connection reuse and DNS behavior.

Do not maintain a short hand-written list of addresses to block and assume it covers every environment. Address ranges and cloud or network layouts vary. Define the policy for your deployment, keep it current, and test both IPv4 and IPv6 paths.

## Handle redirects as new requests

A URL that passes validation may return a redirect to a different host or address. If the HTTP library follows redirects automatically, the application may contact a destination that the original URL policy would have rejected.

For sensitive fetchers, disable automatic redirect following. If redirects are necessary, handle each redirect explicitly:

1. Parse the redirect target using a standards-compliant URL parser.
2. Resolve relative locations against the current URL.
3. Apply the full scheme, hostname, port, DNS, and IP policy again.
4. Enforce a small redirect limit and reject loops.
5. Do not forward credentials, authorization headers, or other sensitive request headers to a different origin.

A redirect is not permission to expand the original destination policy. Apply the same restrictions to every hop.

## Add network-level controls and least privilege

Application checks can contain bugs or miss library behavior. Network controls provide an additional boundary:

- Place URL-fetching workers in a network segment that cannot reach internal services they do not need.
- Deny outbound access to internal and restricted address ranges at the firewall or egress gateway.
- Allow only the destinations and ports required by the feature where practical.
- Route outbound traffic through a controlled proxy when it is important to centralize DNS resolution, filtering, and logging.
- Give the fetcher limited credentials and no access to unrelated application secrets.
- Keep cloud instance metadata and control-plane access out of the fetcher’s reachable network path where possible.

A proxy is not automatically protective. Check that the application cannot bypass it, that the proxy applies destination rules after DNS resolution, and that it handles redirects and IPv6 consistently with your policy.

## Limit what a fetch can do

SSRF prevention also includes limiting resource use and side effects. Configure:

- Connection and read timeouts.
- A maximum redirect count.
- A maximum response size and, where relevant, decompression limits.
- Allowed content types and safe parsing rules for downloaded content.
- Concurrency and rate limits appropriate to the feature.
- A restricted set of HTTP methods and request headers.

Do not blindly return fetched responses to users or process them as trusted input. A fetched document may contain malicious content, misleading metadata, or data from an unintended endpoint. Treat it as untrusted and validate it for its next use.

## Choosing a defensive design

Use these criteria to select an approach:

- **Are destinations predictable?** If yes, use a fixed destination or exact allowlist rather than arbitrary URL input.
- **Must users fetch arbitrary public URLs?** If yes, isolate that capability in a dedicated service with connection-time DNS/IP enforcement, redirect checks, and restricted egress.
- **Can the request reach sensitive networks?** If yes, reduce that reachability at the network layer instead of relying on application code alone.
- **Does the feature need redirects, uncommon ports, or multiple protocols?** Support only what the business requirement demands; each exception increases policy complexity.
- **Can you observe and test the policy?** Log policy decisions and test denied destinations, redirects, IPv6, DNS changes, and client configuration in a controlled environment.

For most integrations, the best tradeoff is a fixed or allowlisted HTTPS destination, no automatic redirects, strict time and size limits, and network egress rules that block unnecessary internal access. Arbitrary URL fetching should be treated as a higher-risk capability with dedicated isolation and connection-level controls.

## Testing and operational checks

Include SSRF cases in code review and security testing. Verify that the application rejects unsupported schemes, unexpected ports, credential-bearing URLs, deceptive hostnames, and prohibited IP addresses. Test that a redirect to a disallowed destination is blocked, and confirm that IPv4 and IPv6 policies behave consistently.

Also inspect the actual request path: which resolver and HTTP client are used, whether proxies are inherited from the environment, whether DNS is rechecked on connection, and whether redirects are followed by the library. Record enough information to investigate rejected requests without logging secrets, authorization headers, or sensitive query values. Revisit the policy when integrations, network routes, or client libraries change.

## FAQ

### Is validating the URL enough to prevent SSRF?

No. URL validation is useful for rejecting malformed input and enforcing application rules, but it does not by itself control DNS results, connection-time address selection, redirects, or network reachability. Combine it with connection-level and egress controls appropriate to the feature.

### Is blocking `localhost` enough?

No. Internal services may be addressed through private, link-local, or other special-purpose addresses, and IPv6 must be considered as well. Use a maintained address policy and restrict the network paths the service can reach.

### Should an application always disable redirects?

Not necessarily. Disabling redirects is the simplest policy when redirects are not required. If the feature needs them, validate every redirect target as a new request, limit the number of hops, and avoid forwarding sensitive headers across origins.

### When should URL fetching run in a separate service?

Consider a dedicated fetcher when users can supply arbitrary URLs, when the application handles sensitive credentials, or when outbound requests should have stricter network access than the main application. Isolation makes it easier to apply a narrow egress policy and contain mistakes, but the fetcher still needs robust validation and resource limits.

## Conclusion

Server-side request forgery prevention works best as a layered design. Prefer fixed destinations or exact allowlists, validate URL components with a proper parser, enforce DNS and IP policy at connection time, revalidate redirects, and restrict outbound network access. Add timeouts, response limits, and least privilege so a missed check has less room to cause harm.

Choose controls based on what the feature genuinely needs to reach. The narrower the destination policy and the smaller the fetcher’s network privileges, the easier it is to build and maintain effective web application security.
