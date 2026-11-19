# Web Cache Deception Explained

Web caches help websites deliver reusable content quickly, but a mismatch between a cache and an application can create a security problem. In a web cache deception attack, an attacker may trick a cache into storing a response that was intended to be private—then try to retrieve that response through a URL the cache considers public or cacheable.

For developers, the important question is not simply whether a response passes through a cache. It is whether the cache and the application agree about what a URL represents, what content can be shared, and which requests are allowed to reuse a stored response. This guide explains the risk and provides a practical workflow for evaluating it in an authorized environment.

## What is web cache deception?

A web cache deception vulnerability occurs when a cache stores a personalized or otherwise sensitive response as though it were reusable static content. This can happen when the cache and origin application interpret the request path differently.

For example, an application might route both `/account` and `/account/report.css` to the same account page. The application treats the latter path as a request for a personalized response, while a cache rule may treat the `.css` suffix as a sign of static content. If the cache stores the response and another user can request the same cache key, private content could be exposed.

This scenario depends on the actual application, cache configuration, and request flow. A suspicious URL alone does not prove a vulnerability. The response must be stored and then served to a request that should not be able to access that user’s data.

### Web cache deception versus cache poisoning

These issues involve different failure modes:

- **Web cache deception** aims to make a cache store a private or personalized response under a cacheable URL.
- **Web cache poisoning** aims to make a cache store a malicious or incorrect response that may then be served to other users.

Both involve disagreement about caching behavior, but their causes and validation requirements differ. A test for one should not be treated as evidence of the other.

## Conditions that can make an application vulnerable

A cache deception issue generally requires several conditions to align:

1. **A request returns user-specific or sensitive content.** This might be an account page, profile, or private report.
2. **The application routes a crafted path to that content.** For example, it may ignore or normalize an unexpected suffix or path segment.
3. **A shared cache considers the response cacheable.** A cache rule based on file extensions or path patterns can be one contributing factor.
4. **The stored response can be retrieved using a cache key that does not adequately separate users.** Authentication and cache-key behavior matter here.

The details vary among reverse proxies, CDNs, frameworks, and application routing rules. Cache headers such as `Cache-Control`, vendor-specific cache status headers, and the behavior of the origin all need to be assessed together.

## Safe, authorized testing workflow

Test only systems you own or are explicitly authorized to assess. Prefer a staging environment configured like production, and use test accounts with synthetic data. Do not use real customer information or attempt to retrieve another person’s content.

### 1. Map the request and caching path

Identify the relevant application route and how requests travel through the edge cache, reverse proxy, and origin. Review the cache configuration for rules based on file extensions, path patterns, response headers, cookies, and query parameters. Confirm which headers are forwarded and which components can override origin cache directives.

Record the normal behavior of the route before testing: status code, redirect behavior, relevant response headers, and whether the body is personalized. Do not assume a particular header will be present. `Age`, `X-Cache`, and provider-specific cache status headers can be useful signals, but their absence or presence alone is not conclusive.

### 2. Choose a controlled test response

Use a test account that contains a harmless, unique marker, such as `TEST-ACCOUNT-A-7f31`. Confirm that this marker appears only in the account’s authorized response. A unique marker helps distinguish a cached copy from a generic page without exposing sensitive data.

Select a route where an unexpected suffix or path segment can be tested safely. Do not guess at or enumerate sensitive production endpoints. If the application rejects malformed paths consistently, that is useful information; do not try to bypass access controls.

### 3. Establish a baseline

Request the ordinary route while authenticated as the test account. Save the response headers and body for comparison. For example, with a test environment and a cookie jar you control:

```bash
curl -sS -D baseline-headers.txt -o baseline-body.txt \
  -b test-account-a.cookies \
  'https://app.example.test/account'
```

Replace the example hostname and cookie-jar name with values for your authorized test environment. Protect test cookies as credentials, and remove temporary files when testing is complete.

### 4. Test a crafted path with a unique cache key

Request the candidate path while authenticated as the test account. The following is illustrative only; use a path that matches your application’s routing behavior:

```bash
curl -sS -D candidate-headers.txt -o candidate-body.txt \
  -b test-account-a.cookies \
  'https://app.example.test/account/probe.css'
```

Check whether the origin returns the same personalized content as the baseline, whether the response indicates that it was stored, and whether the cache’s behavior is consistent on a subsequent request. A first response may be a cache miss and a later response a hit, but cache indicators differ by platform. Compare response bodies and relevant headers rather than relying on a single status header.

Use a fresh, unique test path for the initial request so an unrelated existing cache entry does not confuse the result. Then repeat the exact same URL when checking whether that entry is reused. Keep requests limited and controlled to avoid affecting other users or production cache behavior.

### 5. Check whether the response crosses an authorization boundary

This is the key validation step. In a controlled environment, request the exact candidate URL without the first account’s credentials or with a separate test account. Confirm whether the response contains the first account’s unique marker. Do not perform this step using a real user’s URL or data.

A potentially serious finding requires evidence that a response associated with one test account is served to a request that should not be authorized to see it. If the cache requires the original user’s valid session and correctly serves only that user’s content, the observed cache behavior may not demonstrate cross-user disclosure. Document the precise conditions and avoid overstating the result.

### 6. Verify the result at the origin and edge

Where possible, correlate test requests with application and cache logs. Confirm whether the second response came from the cache or the origin, and whether the cache key, cookies, and request path behaved as expected. Headers can be misleading or suppressed, so server-side evidence is valuable.

Stop if a test returns unexpected real data, affects another user, or behaves outside the authorized scope. Preserve only the minimum evidence needed for a report, and handle it according to your organization’s data-handling rules.

## Interpreting results and troubleshooting

A route that returns a personalized page for a path ending in `.css` is not, by itself, proof of web cache deception. The assessment needs to establish both unsafe storage and unsafe reuse.

If repeated requests do not show a cache hit, consider whether the environment bypasses caching for authenticated requests, the response is explicitly uncacheable, the cache key changes between requests, or the test route is not routed as expected. These outcomes may indicate that the particular test did not reproduce the risk; they do not automatically prove that every route is safe.

If cache headers suggest a hit but the response body changes between users, investigate whether the cache is actually serving the response, whether the headers come from another layer, and which response fields are included in the cache key. Avoid changing several variables at once. Repeat with controlled accounts, a stable test path, and logs from the relevant layers.

When reporting a finding, include the affected route pattern, the test conditions, the response evidence, the cache layer involved if known, and the authorization boundary crossed. Redact cookies, tokens, and unrelated personal information.

## Remediation and validation

### Prevent personalized responses from being shared

For sensitive, user-specific responses, set an explicit policy such as:

```http
Cache-Control: private, no-store
```

`private` indicates that shared caches should not store the response, while `no-store` instructs caches not to store it. Confirm that the CDN or reverse proxy honors the intended policy; edge rules can sometimes override origin headers. For especially sensitive routes, configure an explicit cache bypass at the shared-cache layer as appropriate for your architecture.

Do not rely on a browser-facing header alone without checking the behavior of every intermediary cache. Also avoid making sensitive responses publicly cacheable merely because a route has a static-looking suffix.

### Make routing and cache decisions consistent

Use strict route matching and reject unexpected suffixes or path segments where they are not supported. Normalize paths consistently at the edge and origin, including relevant handling of encoded characters, repeated separators, and trailing segments. Avoid cache rules that infer content safety solely from a filename extension when the application can return dynamic content for that path.

Where caching is appropriate, define cacheability based on the response and route semantics. Review whether cookies, authorization state, query parameters, and other content-varying inputs are handled correctly. Including user-specific values in a shared cache key is not a substitute for avoiding shared caching of sensitive responses unless the design has been carefully reviewed.

### Purge and retest

If testing or incident response confirms that sensitive content was cached, follow your incident process. Purge affected cache entries where possible, assess logs and exposure scope, and notify the appropriate security and privacy stakeholders. A purge can remove stored copies but does not correct the underlying configuration.

Retest using the same controlled workflow after remediation. Verify that the response is not stored by shared caches, that a second test account cannot receive the first account’s marker, and that ordinary application behavior still works. Test relevant route variants and confirm the deployed edge configuration—not only local development behavior.

## Security best practices for developers

- Treat all authenticated or personalized responses as non-shareable by default.
- Review CDN and reverse-proxy rules alongside application cache headers.
- Avoid extension-only cache policies for routes that can return dynamic content.
- Keep route normalization consistent between the edge and origin.
- Include cache behavior in security testing for account, profile, and private-data routes.
- Use synthetic test data and separate test accounts when validating authorization boundaries.
- Monitor cache configuration changes and retest after routing or CDN updates.

## Frequently asked questions

### Does a cache hit prove web cache deception?

No. A cache hit only shows that some layer reused a response. To confirm deception, establish that a personalized response was stored under an unintended cacheable request and then made available across an authorization boundary.

### Can a response be vulnerable even if it has a `Cache-Control` header?

Potentially. The header’s directives, the cache’s configuration, and any intermediary overrides all matter. Verify actual behavior at the shared cache rather than assuming the origin header is enforced.

### Is adding `Vary: Cookie` enough to fix the problem?

Not necessarily. Cache implementations may handle `Vary` differently, and creating cache variants by cookie can introduce complexity or operational risk. For sensitive personalized responses, an explicit shared-cache bypass and appropriate `private` or `no-store` directives are generally clearer safeguards. Validate the effective configuration.

### How is this different from normal browser caching?

The concern is usually a shared cache, such as a CDN or reverse proxy, reusing one user’s response for another request. Browser caching is scoped to an individual user’s browser, though private data should still receive appropriate cache directives for the application’s requirements.

## Conclusion

Web cache deception is a mismatch between application routing and shared-cache behavior that can expose private responses. A reliable assessment checks the full chain: whether a crafted path reaches personalized content, whether a shared cache stores it, and whether another authorized test context can retrieve it. Use synthetic data, controlled accounts, and server-side evidence to validate the risk. Remediate with explicit cache controls, consistent routing, and cache rules based on application semantics, then retest the deployed configuration.
