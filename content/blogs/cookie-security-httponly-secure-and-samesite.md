# Cookie Security: HttpOnly, Secure, and SameSite

Cookies often carry session identifiers or other sensitive state. If those cookies are exposed to scripts, sent over an unencrypted connection, or included in cross-site requests unexpectedly, an attacker may be able to steal or misuse them. Three attributes provide important protections: `HttpOnly`, `Secure`, and `SameSite`.

This guide explains what each attribute does and provides a practical workflow for evaluating cookie security in an application you own or are authorized to test. These settings reduce risk, but they are not a substitute for secure session management, HTTPS, or defenses against cross-site request forgery (CSRF).

## What the cookie attributes do

A server sets cookie attributes in the `Set-Cookie` response header. For example:

```http
Set-Cookie: __Host-session=REDACTED; Path=/; HttpOnly; Secure; SameSite=Lax
```

The browser stores the cookie and applies its attributes when handling it. The attributes are not included in the `Cookie` request header sent back to the server, so server-side application code should not expect to read them there.

### HttpOnly: restrict access from JavaScript

`HttpOnly` tells the browser not to make a cookie available through non-HTTP APIs such as `document.cookie`. The browser can still attach the cookie to eligible HTTP requests.

Use `HttpOnly` for session and authentication cookies unless client-side JavaScript genuinely needs to read the value. It can make cookie theft through some cross-site scripting (XSS) attacks harder, but it does not prevent XSS. Malicious script running in a page may still perform actions as the user or read sensitive data available to that page.

### Secure: send the cookie only over secure connections

`Secure` instructs the browser to send the cookie only over a secure connection, typically HTTPS. It helps prevent the cookie from being sent in cleartext over ordinary HTTP.

Use `Secure` for sensitive cookies in production. It does not enable HTTPS, repair a mixed-content issue, or protect a cookie after it reaches the server. Configure HTTPS across the application and any relevant proxy or load balancer. For local development, use a trusted local HTTPS setup where practical rather than weakening production settings.

### SameSite: control cross-site sending

`SameSite` controls whether a browser includes a cookie in requests initiated from another site. It is a useful layer of CSRF risk reduction, but it is not a complete CSRF defense.

- `SameSite=Strict` limits sending to same-site contexts. This offers the strongest restriction, but can disrupt legitimate flows such as arriving at a site from an external link and expecting to remain signed in.
- `SameSite=Lax` allows the cookie in some cross-site top-level navigations, generally for safe methods such as `GET`, while restricting many cross-site subrequests and form submissions. It is a common starting point for session cookies.
- `SameSite=None` allows cross-site sending. Modern browsers require `Secure` when `SameSite=None` is set. Use it only when the application needs cross-site cookie behavior, such as a supported embedded or federated flow, and pair it with appropriate CSRF protections.

Set `SameSite` explicitly rather than relying on browser defaults. Browser behavior and application flows can vary, so test the actual browsers and integrations you support.

## A practical cookie security assessment workflow

Perform testing only against systems you own or have explicit authorization to assess. Use a test account and avoid recording live session values in notes, screenshots, shell history, or issue trackers.

### 1. Identify sensitive cookies and expected behavior

List cookies involved in authentication, session management, account recovery, and other sensitive actions. For each cookie, record:

- The response or application flow that sets it.
- Its purpose and whether JavaScript must access it.
- Its expected host, path, lifetime, and cross-site behavior.
- Which browsers, subdomains, embedded contexts, or identity providers must support it.

Do not assume every cookie has the same requirements. Analytics or interface-preference cookies may have different needs from a session cookie. Avoid placing secrets in cookies that must be readable by JavaScript.

### 2. Inspect `Set-Cookie` responses

Use your browser's developer tools to inspect the Network panel while signing in and exercising relevant flows. Select the response that sets or updates the cookie and review each `Set-Cookie` header. The browser's Application or Storage panel can also show stored cookies and their attributes.

You can inspect response headers from an authorized test environment with `curl`:

```sh
curl -sS -D - -o /dev/null https://app.example.test/login
```

This displays response headers without printing the response body. The endpoint may require a test-specific request or authentication flow; use the same steps as a normal test user. Do not include real credentials or session values in shared command logs.

Check that sensitive cookies have the intended `HttpOnly`, `Secure`, and `SameSite` attributes. Also review `Domain`, `Path`, and expiration settings. A cookie scoped to a broad parent domain may be sent to more hosts than necessary. A narrower `Path` can reduce where a cookie is sent, but it is not a reliable security boundary between applications on the same host.

### 3. Validate behavior in a browser

A header review is necessary but does not prove that the browser or application behaves as intended. In an authorized test account:

1. Confirm the session cookie appears after authentication and is replaced or invalidated as expected at logout.
2. Check whether `document.cookie` exposes the session cookie. An `HttpOnly` cookie should not appear there.
3. Verify that the application uses HTTPS and that the browser does not send the `Secure` cookie over HTTP.
4. Test legitimate cross-site flows, including sign-in redirects, external links, embedded content, or payment and identity-provider callbacks where relevant.
5. With a controlled test page or a security test harness, check whether cross-site requests can trigger state-changing actions. Confirm that the application requires an appropriate CSRF token or other validated defense.

Do not test cross-site actions against real users or production data. A safe test should use a disposable account and a harmless state change that can be reversed.

### 4. Check for common configuration problems

Look for these issues during review:

- Authentication or session cookies missing one or more required attributes.
- `SameSite=None` without `Secure`, which browsers may reject.
- Cookies set over HTTP or inconsistent HTTPS behavior between the application and its proxy.
- A cookie value accessible to JavaScript when it does not need to be.
- Broad `Domain` scope that exposes a cookie to unnecessary subdomains.
- Multiple cookies with the same name but different paths or domains, leading to confusing server-side selection.
- A cookie configured correctly at login but overwritten later by another response with weaker attributes.
- A CSRF-sensitive endpoint that relies on `SameSite` alone rather than validating the request.

When checking for duplicate names, remember that the request's `Cookie` header contains cookie names and values, not their `Secure`, `HttpOnly`, or `SameSite` attributes. Review the responses that set the cookies and the browser's stored-cookie view.

### 5. Remediate and retest

Set attributes in the server-side framework or session middleware, not by trying to add them to the request's `Cookie` header. The exact configuration depends on your framework and deployment, but the resulting response should resemble:

```http
Set-Cookie: __Host-session=REDACTED; Path=/; HttpOnly; Secure; SameSite=Lax
```

The `__Host-` prefix has browser-enforced requirements: the cookie must be set with `Secure`, must use `Path=/`, and must not include a `Domain` attribute. It can help constrain cookie scope when those requirements fit your application. Confirm browser support and framework behavior before adopting a prefix.

After changing configuration, repeat the response-header and browser checks. Test every flow that depends on cross-site behavior, including sign-in and logout. Review proxy and TLS termination settings if the application behaves as though requests are insecure. Some frameworks use forwarded-protocol headers to determine whether a request used HTTPS; configure trust in those headers carefully so untrusted clients cannot spoof them.

## Choosing settings for common scenarios

| Cookie purpose | Typical starting point | Considerations |
| --- | --- | --- |
| First-party session | `HttpOnly; Secure; SameSite=Lax` | Test application flows and add CSRF defenses for state-changing requests. |
| Session that genuinely needs cross-site sending | `HttpOnly; Secure; SameSite=None` | Use only when required; implement and test CSRF protections. |
| Cookie that JavaScript must read | `Secure; SameSite=Lax` or a flow-specific value | Avoid storing session secrets in it. Assess XSS exposure and why script access is necessary. |

These are starting points, not universal prescriptions. The right policy depends on how the application is used, especially when authentication or embedded flows cross site boundaries.

## Security considerations beyond the three attributes

Cookie security is one part of protecting a session. Also consider:

- Use HTTPS throughout the application and redirect HTTP requests to HTTPS. Consider HTTP Strict Transport Security (HSTS) after assessing deployment requirements.
- Generate unpredictable session identifiers, rotate them after authentication or privilege changes, and invalidate them on logout and other relevant events.
- Apply CSRF tokens or another well-designed CSRF defense to state-changing requests. Validate request origin information where appropriate as an additional layer.
- Keep cookie lifetimes as short as the application can reasonably support, and avoid persistent sessions when they are not needed.
- Protect against XSS with context-aware output encoding, safe DOM practices, and an appropriate Content Security Policy. `HttpOnly` does not make an XSS flaw harmless.
- Review cookie scope and avoid sharing authentication cookies across subdomains unless that is a deliberate, reviewed requirement.

## FAQ

### Does `HttpOnly` stop XSS?

No. It prevents JavaScript from reading that cookie through browser APIs such as `document.cookie`, but injected script may still act within the user's session. Prevent and remediate XSS separately.

### Is `SameSite` enough to prevent CSRF?

No. It can reduce the situations in which browsers attach cookies to cross-site requests, but application flows, browser behavior, and request types matter. Use a suitable CSRF defense for state-changing operations and test it.

### Can a `Secure` cookie be used on localhost?

Secure-cookie behavior on localhost can vary by browser and development setup. Prefer a local HTTPS environment for realistic testing. Do not remove `Secure` from production cookies to accommodate an insecure development configuration.

### Should every cookie be `HttpOnly`?

No. Cookies that client-side code must read cannot also be protected from that code with `HttpOnly`. Avoid putting session secrets in JavaScript-readable cookies, and document why any cookie lacks the attribute.

### How can I tell whether a cookie is secure from a request header?

You generally cannot. The request's `Cookie` header does not include cookie attributes. Inspect the `Set-Cookie` response headers and the browser's cookie storage view instead.

## Conclusion

A practical cookie security review starts by identifying sensitive cookies, examining the responses that set them, and confirming their behavior in a real browser. Use `HttpOnly` to restrict script access to session cookies, `Secure` to require secure transport, and an explicit `SameSite` policy that matches the application's cross-site needs. Then retest authentication, logout, and CSRF defenses after remediation. These attributes are valuable controls, but they work best as part of a broader approach to secure sessions and web application security.
