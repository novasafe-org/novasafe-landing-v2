# HTTP Security Headers Explained

HTTP security headers are instructions that a web server sends with its responses. Browsers use them to decide how a page may load resources, whether it can be embedded, and how to handle connections and sensitive information. Configured carefully, these controls can reduce the impact of common web attacks. They cannot, however, fix vulnerable application code or replace sound authentication and authorization.

This guide explains the most useful headers, compares their tradeoffs, and offers a practical approach to choosing and deploying them. The right configuration depends on the application’s features, third-party dependencies, and browser support requirements.

## What are HTTP security headers?

An HTTP response contains a status line, headers, and sometimes a body. Security headers are response headers that influence browser behavior. For example, a policy might tell a browser to load scripts only from the site itself or to refuse to display a page inside a frame.

You can inspect response headers with a command such as:

```bash
curl -I https://example.com
```

This displays the headers returned for the requested URL. It is a useful first check, but test important pages and response types too: redirects, error pages, authenticated routes, and static assets may be served through different configurations.

## Important HTTP security headers

### Content-Security-Policy (CSP)

CSP controls which sources a browser may use for scripts, styles, images, fonts, and other resources. It can also restrict framing and other behaviors. A restrictive policy can limit the damage from some cross-site scripting (XSS) and injection bugs, but it is not a substitute for fixing the underlying vulnerability.

A starting example for a simple site is:

```http
Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

This policy allows resources from the site by default, blocks plugin content, limits the document base URL, prevents framing, and asks the browser to upgrade eligible insecure resource requests. Real applications often need additional directives for images, fonts, API connections, or approved third-party services. `default-src` is a fallback, not a universal setting for every resource type.

**Tradeoff:** A strict CSP offers stronger restrictions but may block legitimate resources or inline scripts and styles. Avoid solving violations by broadly allowing `unsafe-inline` or `unsafe-eval`; these options weaken important protections. Prefer external files, hashes, or per-response nonces where appropriate.

Deploy CSP in stages. Start with `Content-Security-Policy-Report-Only` to observe violations without enforcing the policy, review reports and application behavior, then move to an enforced policy. Reports can contain sensitive URL or application details, so choose and protect reporting destinations carefully.

### Strict-Transport-Security (HSTS)

HSTS tells browsers to use HTTPS for future visits to a host for a period of time. A typical policy is:

```http
Strict-Transport-Security: max-age=31536000
```

Only send HSTS over HTTPS. Add `includeSubDomains` only when every covered subdomain supports HTTPS. The `preload` directive alone does not add a domain to browser preload lists; preload programs have separate eligibility requirements and operational consequences.

**Tradeoff:** HSTS helps prevent downgrade and certain cookie interception attacks after a browser has received the policy. A visitor’s first connection may still be vulnerable unless the domain is preloaded. A long duration or broad subdomain scope can also make certificate or HTTPS misconfigurations harder to recover from. Roll out cautiously, starting with a shorter `max-age` if HTTPS readiness is uncertain.

### X-Content-Type-Options

The value `nosniff` tells browsers not to guess certain resource types when the declared content type does not match. This helps reduce risks associated with MIME-type confusion:

```http
X-Content-Type-Options: nosniff
```

Serve files with accurate `Content-Type` values. The header is not a replacement for validating uploads or controlling where uploaded content is hosted.

### Clickjacking protection: CSP or X-Frame-Options

To prevent a page from being embedded in a frame, use CSP’s `frame-ancestors` directive:

```http
Content-Security-Policy: frame-ancestors 'none'
```

If a site must be embedded by selected partners, specify the allowed origins instead of blocking all framing. `X-Frame-Options: DENY` or `SAMEORIGIN` is a legacy alternative that remains useful for older browser compatibility, but it cannot express a list of trusted external origins. For modern browsers, prefer CSP `frame-ancestors`; where older clients matter, consider setting a compatible X-Frame-Options value as well.

### Referrer-Policy

Referrer Policy controls how much information about the current URL is sent in the `Referer` header when navigating or fetching resources. A common choice is:

```http
Referrer-Policy: strict-origin-when-cross-origin
```

This generally sends the full referrer for same-origin requests and only the origin for cross-origin requests, while avoiding referrer information when navigating from HTTPS to HTTP. Use `no-referrer` when no referrer information should be sent. Consider application needs: analytics, integrations, and workflows may rely on referrer data, while sensitive paths or query strings should not be exposed unnecessarily.

### Permissions-Policy

Permissions Policy controls whether a page and its embedded frames may use certain browser features, such as camera, microphone, or geolocation. For example:

```http
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

This disables those features for the page. If a feature is required, allow it only where needed and specify permitted origins carefully. Browser support and available directives vary, so check compatibility with the features your application uses.

### Cross-origin isolation headers

Three headers are relevant to cross-origin resource handling and isolation:

- **Cross-Origin-Opener-Policy (COOP)** can separate a top-level document from cross-origin windows. `same-origin` is one option for applications that need stronger browsing-context isolation.
- **Cross-Origin-Embedder-Policy (COEP)** can require a document to opt in to loading cross-origin resources. `require-corp` is a common value, but it can block resources that do not provide the required cross-origin permissions.
- **Cross-Origin-Resource-Policy (CORP)** lets a resource restrict which sites may load it, for example with `same-origin` or `same-site`.

These controls are not interchangeable. COOP and COEP are often configured together when an application needs cross-origin isolation for certain browser capabilities. They can break popups, embedded content, or third-party resources if those dependencies are not configured to cooperate. Apply them only after reviewing the application’s cross-origin behavior.

### CORS headers are not a general access-control mechanism

Cross-Origin Resource Sharing (CORS) response headers tell browsers which origins may read certain cross-origin responses. CORS is important for browser-based integrations, but it does not authenticate a user, authorize an API action, or prevent requests from non-browser clients. Do not use a permissive `Access-Control-Allow-Origin` policy as a substitute for server-side access control. Avoid reflecting arbitrary origins or combining credentialed requests with overly broad origin rules.

### Headers that should not be relied on

`X-XSS-Protection` is a legacy browser feature and is not a modern replacement for CSP or output encoding. It is generally better to rely on current browser protections and application-level defenses. Likewise, headers such as `Server` or `X-Powered-By` may reveal implementation details; reducing unnecessary disclosure can be reasonable, but hiding them is not a meaningful substitute for fixing security weaknesses.

## Choosing a defensive design

There is no single header set that fits every site. Use these criteria to choose an appropriate configuration:

1. **Identify the application’s behavior.** List scripts, APIs, frames, fonts, media, and third-party services that pages need. Note whether pages use popups, cross-origin embeds, or browser features controlled by Permissions Policy.
2. **Set a baseline that matches actual use.** Start with protections that are broadly applicable, such as `nosniff` and a considered `Referrer-Policy`. Define CSP and framing rules based on the application’s resource and embedding requirements.
3. **Treat HTTPS scope deliberately.** Confirm HTTPS works across the host and any subdomains before adding HSTS scope or a long duration. Assess preload separately.
4. **Roll out restrictive policies in stages.** Use report-only mode for CSP where useful, test representative user journeys, and review browser console errors and reports. Do not leave a temporary report-only policy in place if enforcement is the intended outcome.
5. **Account for compatibility and ownership.** Confirm that teams responsible for third-party integrations and embedded content can update their systems. Test in supported browsers and environments.
6. **Verify every delivery path.** Check headers at the edge, application server, and CDN as applicable. Confirm they appear on relevant responses and that a proxy does not overwrite or duplicate them unexpectedly.
7. **Reassess after changes.** New scripts, vendors, routes, and subdomains can change what is safe to allow. Review policies as part of application and infrastructure changes.

## Practical verification checklist

- Inspect production responses with `curl -I` and browser developer tools.
- Test the homepage, key application pages, redirects, error responses, and static resources.
- Confirm HTTPS redirects and certificates work before enabling HSTS.
- Review CSP violations and validate the policy against real application flows before enforcement.
- Test framing, cross-origin requests, popups, and embedded resources after changing related policies.
- Check for conflicting or duplicated headers from the CDN, reverse proxy, and application server.
- Re-test after deployments that change resource hosting, domains, or browser integrations.

A header scanner can help identify missing or weak settings, but a generic grade cannot determine whether a policy breaks a feature or safely fits a particular application. Pair automated checks with functional testing and review of the application’s threat model.

## Common deployment mistakes

- Copying a strict CSP without identifying the resources the application actually uses.
- Adding `includeSubDomains` to HSTS before every subdomain is ready for HTTPS.
- Treating CORS as authentication or assuming it blocks all cross-origin requests.
- Setting a policy at one server layer while a CDN or proxy replaces it elsewhere.
- Assuming a header protects routes or response types where it is not present.
- Allowing broad script sources or inline execution to silence CSP errors without assessing the security impact.
- Enabling COEP or COOP without testing third-party resources, popups, and application workflows.

## FAQ

### Do HTTP security headers prevent XSS?

No header can guarantee that an application is free from XSS. CSP can reduce the ability of injected code to load or execute in some circumstances, but secure output encoding, safe handling of untrusted input, and appropriate application design remain essential.

### Should every website use the same security headers?

No. Some headers are broadly useful, but policy values depend on the site’s features, resource origins, embedding needs, and supported browsers. Start with a baseline, then tailor and test it rather than copying a configuration blindly.

### Is `X-Frame-Options` still needed if I use CSP?

CSP `frame-ancestors` is the more flexible modern control. An X-Frame-Options header may provide compatibility for older browsers, but its options are limited. Choose based on the browsers you support and the origins that need to embed your pages.

### Can I set security headers in a CDN instead of the application?

Yes, if the CDN or another edge layer reliably applies the intended headers to all relevant responses. The application server can also set them. Avoid conflicting settings across layers, and verify what clients actually receive rather than relying only on configuration files.

## Conclusion

HTTP security headers give browsers useful instructions for handling content, connections, framing, and cross-origin behavior. The strongest design is not necessarily the most restrictive one: it is the one that reduces risk while preserving required application behavior. Build policies around real dependencies, roll out potentially disruptive controls carefully, and verify the headers on live responses. These measures complement—not replace—secure coding, access controls, and ongoing application security testing.
