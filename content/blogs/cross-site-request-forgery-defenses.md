# Cross-Site Request Forgery Defenses

Cross-site request forgery (CSRF) tricks a user's browser into sending an unwanted request to a site where that user is already authenticated. Because browsers can attach credentials automatically, an attacker may be able to trigger actions such as changing account settings or submitting a transaction without knowing the user's password.

Effective cross-site request forgery defenses combine sound request design with protections at the browser and application layers. This guide explains the threat, compares common defenses, and offers practical recommendations for developers building web applications and APIs.

## How CSRF works

A browser typically includes cookies for a site when making requests to that site. If a user is signed in to `bank.example`, for example, the browser may attach the site's session cookie to a request even when that request was initiated by a page on another website.

An attacker could try to make a victim's browser submit a form such as:

```html
<form action="https://bank.example/profile/email" method="POST">
  <input type="hidden" name="email" value="attacker@example.net">
  <button type="submit">Continue</button>
</form>
```

If the application accepts the request based only on the session cookie, it may treat the action as the user's own. The attacker does not need to read the response for the action to succeed.

CSRF is most relevant when a browser automatically supplies authentication credentials, such as session cookies or some forms of HTTP authentication. A bearer token that a client must explicitly add to an `Authorization` header is not normally attached to a cross-site form automatically, though token storage and cross-origin configuration still require careful security review.

## What makes a strong CSRF defense?

A robust approach makes the application distinguish a request initiated by its own trusted interface from one triggered by an untrusted site. In practice, use several layers rather than relying on one browser behavior.

### 1. Use anti-CSRF tokens for cookie-authenticated actions

A synchronizer token is an unpredictable value associated with the user's session. The server provides it to the application, and the client sends it back with each relevant state-changing request. The server checks that the submitted value matches the expected value for that session.

For a server-rendered form, the token can be included in a hidden field:

```html
<form method="POST" action="/account/email">
  <input type="hidden" name="csrf_token" value="SERVER_RENDERED_TOKEN">
  <input type="email" name="email" required>
  <button type="submit">Save email</button>
</form>
```

For a JavaScript client, the application can make the token available through a response rendered for the authenticated session, then send it in a custom header:

```javascript
await fetch('/api/account/email', {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ email: newEmail })
});
```

The server must validate the token before performing the action. A token should be difficult to guess and bound to the user's session or otherwise protected against substitution. Generate tokens with a cryptographically secure random source, and use a well-maintained framework or security library where possible. Do not place tokens in URLs, where they may leak through browser history, logs, or referrer data.

A token does not need to be single-use in every design. Per-session tokens are common and avoid problems with multiple tabs or concurrent requests. If a framework supports per-request tokens, understand how its design handles those cases before adopting it.

### 2. Set cookies deliberately

The `SameSite` cookie attribute can reduce cross-site cookie sending:

```http
Set-Cookie: session=...; Secure; HttpOnly; SameSite=Lax; Path=/
```

- `SameSite=Strict` is the most restrictive setting, but can interfere with legitimate navigation from other sites.
- `SameSite=Lax` generally allows cookies on certain top-level navigations while limiting many cross-site requests.
- `SameSite=None` permits cross-site use and must be paired with `Secure` in modern browsers.

Choose a setting that fits the application's authentication flows and test it in supported browsers. Do not depend on a browser's default value: defaults and behavior can vary. SameSite is a useful layer, not a replacement for tokens and server-side validation, especially when an application intentionally accepts cross-site requests or has complex integrations.

`Secure` limits a cookie to HTTPS connections, while `HttpOnly` prevents JavaScript from reading it. These attributes are important cookie protections, but neither is a direct CSRF defense on its own.

### 3. Check request origin where appropriate

For browser requests that change state, validate the `Origin` header against the exact origins the application trusts. Compare the scheme, hostname, and port rather than using a loose substring match. For example, `https://app.example.com.attacker.test` must not match `https://app.example.com`.

If `Origin` is absent, some applications use the `Referer` header as a fallback, subject to their privacy and compatibility requirements. Define a clear policy for missing or malformed headers rather than silently treating every request as trusted. Origin checks are a valuable additional layer, but should not replace a CSRF token where one is appropriate.

### 4. Use Fetch Metadata as an additional signal

Browsers can send Fetch Metadata headers, including `Sec-Fetch-Site`, which indicates the relationship between the request's site and the destination. An application can reject unexpected cross-site requests to sensitive endpoints while allowing known, necessary flows.

Treat these headers as defense in depth. Not every client sends them, and non-browser clients may behave differently. Test legitimate flows such as sign-in, payment-provider callbacks, and external identity-provider redirects before applying a blanket rule.

## Design endpoints to reduce risk

CSRF defenses are stronger when the application also follows safe request design:

- **Keep safe methods safe.** `GET`, `HEAD`, and other safe methods should not change account state, transfer funds, or perform other sensitive actions. Crawlers, previews, and links may request GET endpoints automatically.
- **Require a protected method for changes.** Use methods such as `POST`, `PUT`, `PATCH`, or `DELETE` for state-changing operations, and apply the relevant CSRF checks to them.
- **Validate input and authorization.** A valid CSRF token does not prove that a user is authorized to perform an action or that submitted data is safe. Enforce authentication, authorization, and business rules separately.
- **Re-authenticate for especially sensitive actions.** Changing credentials or making a high-impact transaction may warrant password confirmation, a one-time code, or another step-up check.

Changing a state-changing endpoint from `POST` to `GET` is not a defense. It can make the action easier to trigger unintentionally.

## CSRF, CORS, and XSS are different concerns

Cross-origin resource sharing (CORS) controls whether browser JavaScript from one origin can access a response from another origin. It does not, by itself, prevent a cross-site form from sending a request. Some cross-origin requests can be sent without a preflight, and a CSRF attack may succeed even if the attacker cannot read the response.

Custom request headers and strict CORS policies can be useful for APIs. A browser generally preflights certain cross-origin requests that use custom headers, giving the server a chance to reject an untrusted origin. But this approach only helps if the server rejects unwanted content types and methods, has a narrow CORS allowlist, and does not also accept an equivalent form submission without the required header. It should not be treated as a universal substitute for CSRF protection.

Cross-site scripting (XSS) is a separate, serious threat. If an attacker can run script in the trusted origin, that script may be able to read a token exposed to the page and submit authenticated requests. CSRF tokens do not fix XSS. Use output encoding, safe DOM practices, Content Security Policy where appropriate, and other measures to prevent script injection.

## A practical implementation checklist

Use this checklist when reviewing a web application:

1. Identify endpoints that change state and determine how each authenticates the caller.
2. For cookie-authenticated browser actions, enable the framework's CSRF middleware or use a well-reviewed token implementation.
3. Verify that tokens are unpredictable, associated with the appropriate session, and checked before the action is processed.
4. Set session cookies with `Secure`, `HttpOnly`, and an intentionally chosen `SameSite` value.
5. Validate `Origin` for sensitive browser requests, with a documented fallback policy if needed.
6. Consider Fetch Metadata checks as an additional signal, not the sole control.
7. Ensure GET and other safe methods do not modify state.
8. Keep CORS allowlists narrow and do not equate CORS with CSRF protection.
9. Test sign-in, sign-out, account changes, file uploads, and third-party authentication or payment flows.
10. Include CSRF checks in automated tests and monitor rejected requests for unexpected breakage.

When using a web framework, prefer its built-in CSRF protection and follow the framework's documentation. Custom implementations can miss details such as token lifecycle, session changes, or unusual content types.

## Common implementation mistakes

- **Protecting only forms:** An application may have state-changing endpoints called by JavaScript, mobile web views, or older clients. Inventory all relevant routes.
- **Checking only that a token exists:** The server must validate that the token is correct for the current security context.
- **Putting tokens in URLs:** URLs can be copied, logged, or included in referrer information.
- **Relying on SameSite alone:** Cookie settings help, but do not cover every deployment or integration scenario.
- **Allowing state changes through GET:** Link previews, crawlers, and accidental navigation can trigger these actions.
- **Assuming CORS blocks all cross-origin requests:** CORS primarily governs access to responses, not whether every request can be sent.
- **Ignoring XSS:** A script running in the trusted application origin may undermine token-based defenses.
- **Applying checks without testing integrations:** Strict origin or Fetch Metadata rules may disrupt legitimate external flows if exceptions and endpoints are not reviewed carefully.

## FAQ

### Are CSRF tokens still needed if cookies use `SameSite=Lax`?

They are usually a good additional defense for cookie-authenticated state changes. SameSite behavior is useful but depends on the request context and application requirements. Use a deliberate cookie policy and follow your framework's CSRF guidance rather than assuming one setting covers every case.

### Does CORS prevent cross-site request forgery?

No. CORS determines whether browser scripts can read cross-origin responses and governs some cross-origin requests through preflight. It does not block every request that can trigger a server-side action, such as a form submission.

### Do APIs need CSRF protection?

It depends on how the API authenticates requests and how it is used. An API that relies on cookies sent automatically by a browser can be exposed to CSRF and should use appropriate protections. A client that explicitly supplies a bearer token is less susceptible to classic cookie-based CSRF, but still needs secure token handling, authorization, and careful CORS configuration.

### Can a CSRF token prevent XSS?

No. A CSRF token helps distinguish trusted application requests from cross-site requests, but script running within the trusted origin may be able to use the application as the user. Prevent XSS separately.

## Conclusion

Cross-site request forgery defenses work best as a coordinated set of controls. For cookie-authenticated actions, use validated anti-CSRF tokens, set cookies deliberately, and consider exact origin and Fetch Metadata checks as additional layers. Keep safe methods free of side effects, test integrations, and address XSS separately. These practices make it harder for an untrusted site to turn a user's authenticated browser into an unintended client.
