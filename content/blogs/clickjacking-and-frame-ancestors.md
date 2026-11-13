# Clickjacking and Frame-Ancestors

Clickjacking tricks people into interacting with a website element they cannot see or do not expect. An attacker may place a legitimate page inside a transparent or disguised frame, then position it beneath misleading content. A click intended for the visible page can activate a control in the framed site instead.

For developers, the main defense is to control which sites can embed your pages. The Content Security Policy (CSP) `frame-ancestors` directive provides a flexible way to do that. The older `X-Frame-Options` header can still help with compatibility, but it has more limited options. This guide compares the approaches, explains their tradeoffs, and offers practical steps for choosing and testing a policy.

## What is clickjacking?

Clickjacking, also called UI redressing, exploits the gap between what a user sees and what a browser actually receives. An attacker-controlled page can embed a target website in an `<iframe>` and place that frame beneath or alongside deceptive interface elements. If a user clicks or taps what appears to be an ordinary button, the action may land on a control in the framed page.

Potential targets include account settings, payment flows, consent prompts, and administrative actions. The impact depends on the actions available to the victim, the victim’s permissions, and the protections already in place. Clickjacking is distinct from cross-site scripting: it does not necessarily require injecting code into the target website. It abuses the browser’s ability to display one site within another.

The same-origin policy does not, by itself, prevent a site from being framed. It primarily restricts how scripts from one origin can read or interact with data from another origin. A framing policy is needed to tell browsers which parent pages may embed a response.

## How `frame-ancestors` works

`frame-ancestors` is a CSP directive that specifies which parent origins may embed a page in a frame. Browsers check the policy against the ancestors in the frame hierarchy. If an ancestor is not allowed, the browser blocks the page from being displayed in that frame.

The policy belongs in an HTTP response header:

```http
Content-Security-Policy: frame-ancestors 'none';
```

Common policies include:

```http
# Block framing by every site
Content-Security-Policy: frame-ancestors 'none';

# Allow pages from the same origin to frame the response
Content-Security-Policy: frame-ancestors 'self';

# Allow the same origin and a specific partner origin
Content-Security-Policy: frame-ancestors 'self' https://portal.example-partner.com;
```

Use origins you trust, and list only the sources the application needs. Avoid assuming that allowing a domain makes every page on that domain safe: a trusted site can be compromised, host user-generated content, or have subdomains with different security properties. Review the trust boundary before adding a source.

A few details matter when implementing the directive:

- `frame-ancestors` is not inherited from `default-src`. Add it explicitly to the policy.
- It must be delivered as an HTTP response header. A CSP `<meta>` element cannot enforce `frame-ancestors`.
- The directive controls who may embed the response; it does not control which frames the response itself can load. `frame-src` serves a different purpose.
- The policy is evaluated for the full ancestor chain, not just the page immediately surrounding the framed document.
- If a response has multiple enforced CSP policies, each policy applies. Adding another policy does not loosen an existing one.

## `frame-ancestors` vs. `X-Frame-Options`

`X-Frame-Options` (XFO) is an older HTTP response header that also helps prevent framing. Its commonly used values are:

```http
X-Frame-Options: DENY
```

This blocks framing, and:

```http
X-Frame-Options: SAMEORIGIN
```

This permits framing by pages from the same origin.

| Approach | Strengths | Limitations |
|---|---|---|
| CSP `frame-ancestors` | Supports explicit allowlists of trusted origins; can express policies such as allowing a specific partner | Requires an HTTP response header; older browsers may not support it |
| XFO `DENY` or `SAMEORIGIN` | Simple and supported by many older browsers | Does not provide a reliable modern cross-origin allowlist |
| Both headers | CSP protects capable browsers while XFO can provide a fallback for older clients | A restrictive XFO value can prevent legitimate framing in browsers that rely on it |

The XFO value `ALLOW-FROM` is obsolete and is not a dependable way to configure a cross-origin allowlist. Use CSP `frame-ancestors` when you need to allow selected partner origins.

For a page that must never be framed, a site may send both `frame-ancestors 'none'` and `X-Frame-Options: DENY`. For a page that needs to be embedded by a trusted external origin, choose the CSP allowlist deliberately. Adding `X-Frame-Options: SAMEORIGIN` as a fallback can block that intended embedding in older browsers. Make the compatibility decision based on the browsers you support and the page’s requirements rather than adding headers mechanically.

## Choosing the right defensive design

Start with the product requirement: does this page need to appear inside a frame at all?

### The page should never be framed

Use:

```http
Content-Security-Policy: frame-ancestors 'none';
```

Consider adding `X-Frame-Options: DENY` for older browser support. This is a strong default for sensitive pages that do not have a legitimate embedding use case.

### Only your own site should frame the page

Use:

```http
Content-Security-Policy: frame-ancestors 'self';
```

You may pair it with `X-Frame-Options: SAMEORIGIN` if that fallback suits your supported clients. Confirm that the application’s same-origin framing is intentional and necessary.

### A partner must embed the page

Allow the specific partner origin in CSP:

```http
Content-Security-Policy: frame-ancestors 'self' https://portal.example-partner.com;
```

Before deployment, verify the exact origin, including the scheme and hostname. An origin does not include a URL path. Avoid broad patterns unless you have assessed every matching subdomain and can manage the resulting trust relationship. If there are multiple partners, document why each is permitted and who owns the relationship.

### Only some routes need embedding

Apply policy per route or response type when the application supports it. For example, a dedicated embedded dashboard may need an allowlist while account management and payment pages should not be frameable. Avoid a broad site-wide exception when a smaller, route-specific policy will work.

## Practical implementation and testing

### 1. Inventory framing requirements

Identify pages that are framed by your own application, customer portals, or partner sites. Check embedded workflows, authentication redirects, and error pages as well as the main content. Record the required parent origins and confirm them with the owners of those integrations.

### 2. Set the response header

Configure the policy where it will be applied consistently, such as application middleware, a reverse proxy, or a web server. For example, an Nginx location could include:

```nginx
add_header Content-Security-Policy "frame-ancestors 'self'" always;
```

The `always` parameter asks Nginx to add the header to responses regardless of status code. Adapt the configuration to your routing and deployment setup. Check that upstream services, CDNs, or proxies do not remove or replace the header, and make sure the final response contains the intended policy.

For a partner-embedded route, use a route-specific policy such as:

```nginx
add_header Content-Security-Policy "frame-ancestors 'self' https://portal.example-partner.com" always;
```

Do not copy a sample origin without replacing it with an origin you have verified and approved.

### 3. Inspect the deployed response

Use `curl` to check the response headers:

```sh
curl -sSI https://app.example.com/account | grep -iE 'content-security-policy|x-frame-options'
```

Also inspect the request in browser developer tools, since redirects, caching layers, and route-specific behavior can affect the final response. Check representative pages, including error responses where practical.

### 4. Test permitted and blocked parents

From a controlled test page, attempt to embed the route in an iframe hosted on an allowed origin and on a disallowed origin. Confirm that the permitted integration still works and that the browser blocks unauthorized framing. Browser console messages can help identify enforcement failures, but test behavior in the browsers your application supports.

`Content-Security-Policy-Report-Only` can help assess other CSP directives without enforcing them, but it does not provide an enforceable `frame-ancestors` policy. Validate framing changes in a controlled environment, and use the actual enforced header when verifying the protection.

## Security considerations and common mistakes

- **Do not rely on a client-side frame-busting script as the primary defense.** Scripts can be disabled or constrained, and browser-level response policies are a more direct control.
- **Do not assume `default-src` covers framing.** Set `frame-ancestors` explicitly.
- **Do not put the directive only in a meta tag.** It must be sent in the response header to be enforced.
- **Avoid unnecessary wildcard trust.** A broad allowlist can include origins that are not equally controlled or trustworthy.
- **Check every relevant response.** Headers may differ between routes, error pages, or services behind a proxy.
- **Review header combinations.** Multiple CSP policies combine restrictively, and XFO may conflict with a legitimate cross-origin embedding requirement in older browsers.
- **Treat framing controls as one layer.** They do not replace authorization checks, CSRF defenses, secure session handling, or confirmation steps for high-impact actions.

`SameSite` cookie settings can reduce some cross-site request risks, depending on browser behavior and application design. They are not a substitute for a framing policy: clickjacking is about misleading interface interaction, and the appropriate controls depend on the complete workflow.

## FAQ

### Is `frame-ancestors 'none'` the same as `X-Frame-Options: DENY`?

Both are intended to prevent framing. CSP `frame-ancestors 'none'` is the modern, flexible policy mechanism. XFO `DENY` can provide a fallback for older browsers. Whether to send both depends on compatibility needs and any legitimate embedding requirements.

### Can I allow one external partner with X-Frame-Options?

There is no dependable modern XFO value for an origin allowlist. Use CSP `frame-ancestors` to permit the partner’s specific origin, then test the integration in supported browsers.

### Does `frame-ancestors` need to be added to every page?

It needs to be present on each response you want to protect. You can apply a consistent policy site-wide or use route-specific policies where embedding requirements differ. Make sure the policy is not accidentally omitted from important routes.

### Can I configure `frame-ancestors` in a CSP meta tag?

No. Browsers enforce this directive from an HTTP response header, not a CSP meta element.

### Does blocking frames prevent every clickjacking attack?

It prevents unauthorized framing of the protected response in browsers that enforce the policy. It does not replace other security controls or address every form of deceptive interaction. Assess the application’s workflows and use appropriate authorization, request-protection, and user-confirmation measures as well.

## Conclusion

Clickjacking defenses should match how each page is used. For pages that do not need embedding, `frame-ancestors 'none'` is a straightforward policy. Use `'self'` for same-origin framing, or list specific trusted origins when a verified partner integration requires it. X-Frame-Options can complement CSP for older clients, but its limited options make it unsuitable for modern cross-origin allowlists.

Inventory your framing requirements, set the policy in HTTP responses, inspect the deployed headers, and test both allowed and blocked cases. This makes clickjacking protection a practical part of web application security rather than an unverified configuration change.
