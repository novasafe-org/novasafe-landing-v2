# Content Security Policy Deployment Guide

A Content Security Policy (CSP) is a browser-enforced set of rules that controls which resources a web page can load and where scripts, styles, images, and other content may come from. A carefully designed policy can limit the impact of cross-site scripting (XSS) and other injection vulnerabilities. A policy that is too broad, too narrow, or deployed without testing can provide little protection—or break legitimate site features.

This guide explains how to plan a content security policy deployment, compare common implementation approaches, and move from observation to enforcement. It is written for developers responsible for a web application’s security and availability.

## How CSP works

A server sends CSP as an HTTP response header. The browser applies the directives in that policy when processing the response. For example, `script-src` restricts which scripts can run, while `img-src` restricts image sources.

A small starting policy might look like this:

```http
Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'
```

Here, `default-src 'self'` is a fallback for many resource directives: resources are allowed from the current origin unless a more specific directive says otherwise. `object-src 'none'` blocks plugin content, and `base-uri 'self'` restricts which URLs a page can use in a `<base>` element.

CSP is a defense-in-depth control, not a replacement for output encoding, secure templating, input validation, or fixing injection vulnerabilities. If an attacker can execute script that is authorized by the policy, CSP may not stop the attack.

## Choose an approach for scripts

Script policy is often the most consequential—and challenging—part of deployment. Choose an approach based on how your application renders pages and loads code.

### Nonce-based policy

A nonce is a cryptographically random value generated for a response. The server places it in the CSP header and on each trusted inline `<script>` element. The browser runs inline scripts only when their nonce matches the policy.

**Advantages:** Works well for server-rendered pages and inline bootstrap code; does not require maintaining hashes when script contents change.

**Tradeoffs:** The value must be unpredictable, unique for each response, and inserted consistently. Shared caches must not serve a page with a nonce that does not match its header. Nonces on scripts should be added only by trusted application code—not copied from user-controlled markup.

### Hash-based policy

A hash-based policy authorizes an inline script by the cryptographic hash of its exact contents. For example, a SHA-256 hash can appear as a source such as `'sha256-…'` in `script-src`.

**Advantages:** Suitable for static pages or stable inline scripts, and does not require generating a new token per response.

**Tradeoffs:** Any change to whitespace or script contents changes the hash. Build pipelines must calculate and update hashes reliably. Hashing does not make a dangerous script safe; it authorizes the exact content it covers.

### External scripts and `strict-dynamic`

A policy can allow scripts from specific origins, such as `'self'`, but an origin allowlist can be difficult to maintain and may trust more scripts than intended. A strict policy can instead authorize a nonce- or hash-trusted script and use `'strict-dynamic'` to extend trust to scripts that it loads programmatically in browsers that support the directive.

This approach requires careful review of how trusted scripts load other scripts. A trusted script that uses attacker-controlled input to choose a script URL can undermine the intended protection. For compatibility, some teams also include host sources as fallback for older browsers; assess the additional trust those sources grant.

Avoid adding `'unsafe-inline'` to `script-src` as a quick fix. It permits inline scripts and substantially weakens CSP’s protection against many XSS attacks. Likewise, avoid `'unsafe-eval'` unless a specific dependency requires it and the risk has been assessed.

## A practical deployment workflow

### 1. Inventory what the application loads

Review representative pages and identify where they obtain scripts, styles, images, fonts, frames, media, and network connections. Include third-party services such as analytics, payment providers, support widgets, and authentication flows.

Use browser developer tools to inspect loaded resources and console errors. Also review templates, JavaScript that creates elements dynamically, service workers, and environment-specific configuration. Test key user journeys—not only the home page.

### 2. Draft a policy that matches the application

Start with restrictive defaults, then add only the sources and capabilities the application needs. This example illustrates a nonce-based policy for a server-rendered application:

```http
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'nonce-{nonce}' 'strict-dynamic' 'self'; style-src 'self' 'nonce-{nonce}'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

Replace `{nonce}` with a fresh value for each response. Adjust the directives to match actual requirements. For example, add a carefully chosen origin to `connect-src` if the application makes API requests to another host. Add a frame origin to `frame-src` only if the page must load frames from it.

The example is not a universal drop-in policy. `frame-ancestors 'none'` prevents other sites from embedding the page; use a more appropriate value if embedding is an intended feature. `data:` in `img-src` allows data URLs, which may be unnecessary for your application. `upgrade-insecure-requests` can help upgrade HTTP resource URLs on HTTPS pages, but test legacy or mixed-content integrations before enabling it.

### 3. Generate and render nonces safely

In a Node.js application using Express, generate a nonce with a cryptographically secure random source, then use the same value in the response header and trusted script elements. For example:

```js
import crypto from 'node:crypto';

app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;

  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', policy);
  next();
});
```

In a trusted server-rendered template, include the same nonce on authorized inline scripts:

```html
<script nonce='{{cspNonce}}'>initializeApp();</script>
```

Use your template engine’s appropriate HTML attribute escaping. Do not reuse a nonce across responses, expose it through unrelated endpoints, or allow user input to determine which elements receive it. A nonce protects authorization of script elements; it does not sanitize their contents.

For a static site, a hash-based policy may be simpler. Calculate hashes during the build, include the resulting sources in the response header, and verify that the deployed inline script bytes match exactly. If your hosting setup cannot set the required response header, evaluate its configuration options before relying on a `<meta>` element: meta-delivered CSP has limitations and cannot express every directive.

### 4. Start with report-only mode

To observe likely violations without blocking resources, send the policy in the `Content-Security-Policy-Report-Only` header. The browser evaluates it and can report violations, but does not enforce that policy. Keep any existing enforced policy in place while evaluating a new one.

A reporting configuration can use the Reporting API and, where compatibility requires, the older `report-uri` directive:

```http
Reporting-Endpoints: csp-endpoint="https://reports.example.com/csp"
Content-Security-Policy-Report-Only: default-src 'self'; object-src 'none'; base-uri 'self'; report-to csp-endpoint; report-uri /csp-report
```

Reporting support and behavior vary across browsers. Treat received reports as untrusted input: validate and limit their size, rate-limit collection, and avoid logging sensitive data unnecessarily. Reports can contain URLs or other page context. Choose a reporting service and retention approach that meet your privacy and operational requirements.

### 5. Review violations and refine the policy

Group reports by directive, blocked resource, page, and browser. Determine whether each violation is caused by a legitimate dependency, an outdated integration, an application defect, or unexpected behavior. Do not automatically allow every reported source: injected content and browser extensions can also produce reports, and a reported URL is not proof that the source should be trusted.

Make the smallest necessary policy change. Prefer a narrow source or a nonce/hash-based authorization over broad sources such as `https:` or `'unsafe-inline'`. Retest pages and user journeys after each change.

### 6. Enforce gradually

Once report-only results are understood, deploy the policy as `Content-Security-Policy`. Roll out to a representative set of pages or users first when your deployment setup allows it, then expand. Monitor application errors, support reports, and CSP violations after enforcement. Keep a rollback path for outages, but do not silently remove protections without investigating the cause.

## Directive choices and tradeoffs

| Directive | What it controls | Practical guidance |
| --- | --- | --- |
| `default-src` | Fallback for many resource types | Set a restrictive baseline, commonly `'self'`, then define specific exceptions. |
| `script-src` | JavaScript and script-related execution | Prefer nonces or hashes for inline code; avoid `'unsafe-inline'` and `'unsafe-eval'` where possible. |
| `style-src` | Stylesheets and some inline styles | Use external stylesheets or nonces for permitted `<style>` elements. Nonces do not authorize `style` attributes. |
| `img-src` | Images | Add only necessary origins and schemes; consider whether `data:` is required. |
| `connect-src` | Fetch, XHR, WebSocket, and related connections | Include the application’s required API and telemetry endpoints only. |
| `object-src` | Plugin content such as `<object>` and `<embed>` | Usually set to `'none'`. |
| `base-uri` | URLs permitted in a `<base>` element | Restrict to `'self'` or `'none'` unless a broader need exists. |
| `form-action` | Form submission destinations | Specify intended destinations; it does not fall back to `default-src`. |
| `frame-ancestors` | Which sites may embed the page | Use `'none'` or a specific allowlist as appropriate. It does not fall back to `default-src` and cannot be delivered through a meta policy. |
| `frame-src` | Frames the page may load | Set separately when the application embeds other sites. |

CSP is not a complete clickjacking defense if it is absent from some relevant responses. Apply it consistently to pages that need protection, and coordinate `frame-ancestors` with any existing `X-Frame-Options` configuration.

## Common deployment problems and troubleshooting

- **A page works in report-only mode but breaks after enforcement:** Report-only does not block resources. Check the browser console and reports for the exact directive and resource, then determine whether the resource is required and trustworthy.
- **Inline scripts are blocked:** Confirm the nonce in the response header matches the nonce on the script, or recalculate the hash from the exact script contents. Check for inline event handlers such as `onclick`; these are not authorized by a nonce on a separate `<script>` element.
- **Nonces mismatch on cached pages:** A cached HTML response may contain a different nonce from a newly generated header, or a cached response may reuse a nonce. Configure caching so the HTML and corresponding policy remain consistent, or choose an approach better suited to the caching architecture.
- **A third-party integration stops working:** Identify every resource type it uses. A script loading successfully does not mean its API calls, frames, images, or fonts are allowed; each may require a different directive.
- **A stylesheet still violates CSP:** A nonce on a `<style>` element does not authorize a `style` attribute. Prefer moving styles into trusted stylesheets or using another narrowly scoped approach instead of broadly allowing inline styles.
- **Reports are noisy or unexpectedly large:** Filter and aggregate safely, set size and rate limits, and investigate recurring sources. Avoid treating every report as a required policy exception.
- **An HTTP header is missing:** Inspect the actual response, including redirects and error pages. Check reverse proxies, CDNs, application middleware, and hosting configuration for header removal or inconsistent policies.

To inspect the response header from a terminal, run:

```bash
curl -sI https://example.com | grep -i content-security-policy
```

Confirm that the response you inspect is the page response you intend to protect; redirects may return different headers.

## Practical recommendations

1. Prefer an HTTP response header and apply it consistently to relevant HTML responses.
2. Inventory real application behavior before choosing allowed sources.
3. Use nonces for dynamic server-rendered pages or hashes for stable inline code, based on the application’s architecture.
4. Keep source lists narrow and avoid broad exceptions introduced only to silence reports.
5. Test in report-only mode, examine violations, and then enforce with monitoring and a rollback plan.
6. Revisit the policy when adding dependencies, changing build or caching behavior, or introducing new page features.
7. Use CSP alongside secure coding practices and other appropriate web application security controls.

## FAQ

### Does Content Security Policy prevent all XSS attacks?

No. CSP can reduce the resources and scripts a browser will accept, limiting the impact of some injection flaws. It cannot replace secure output handling or guarantee that authorized scripts are safe.

### Should I use a nonce or a hash?

Use a nonce when the server can generate a fresh value for each response and render it consistently. A hash can suit static pages or inline scripts that remain stable and can be managed by the build process. Choose based on rendering, caching, and deployment needs.

### Is report-only mode a security control?

Report-only mode helps evaluate a proposed policy, but it does not block the resources that violate that policy. It is a testing and observation stage, not a substitute for an enforced CSP.

### Can I put CSP in a meta tag instead of an HTTP header?

A meta-delivered policy can be useful when headers cannot be configured, but it has limitations and cannot support every directive. An HTTP response header is generally the more capable deployment option.

### What should I do when a browser reports a violation?

Identify the page, directive, and blocked resource; determine whether the behavior is expected and trustworthy; then make the narrowest safe change. Do not add a broad source or weaken the policy just to make the report disappear.

## Conclusion

A successful content security policy deployment is a process: understand what the application loads, choose an approach that fits its rendering and caching model, observe violations in report-only mode, and enforce a carefully reviewed policy. Nonces and hashes can provide more precise script authorization than broad allowlists, while a gradual rollout helps uncover compatibility issues before they affect users. Keep the policy under review as the application changes, and treat CSP as one layer in a broader web application security strategy.
