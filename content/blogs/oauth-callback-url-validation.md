# OAuth Callback URL Validation

An OAuth callback URL is where an authorization server sends a user after they approve or deny an application’s request. That redirect is a critical security boundary: if an attacker can influence it, they may be able to capture authorization codes, misdirect users, or exploit an open redirect in the application.

OAuth callback URL validation—more precisely, validation of the OAuth **redirect URI**—ensures that authorization responses go only to destinations registered and approved for a particular client. This guide explains the core concepts, common failure modes, and practical recommendations for developers implementing or reviewing OAuth integrations.

## What is an OAuth callback URL?

In OAuth 2.0, the client application supplies a `redirect_uri` parameter in an authorization request. The authorization server sends the browser back to that URI after the authorization step. Many developers call this endpoint a callback URL; OAuth specifications generally call it a **redirect URI**.

For example, an application might send a user to an authorization endpoint with parameters such as:

```text
https://identity.example/authorize?response_type=code&client_id=web-client&redirect_uri=https%3A%2F%2Fapp.example%2Foauth%2Fcallback&state=opaque-value
```

After authorization, the identity provider might redirect the browser to:

```text
https://app.example/oauth/callback?code=authorization-code&state=opaque-value
```

The callback handler then verifies the response and, in an authorization code flow, exchanges the code at the token endpoint. The callback URL is not a secret. Its security depends on restricting where the authorization server is allowed to send responses and correctly validating the response when it arrives.

## Why callback URL validation matters

If an authorization server accepts an attacker-controlled redirect URI, it may send an authorization response to a site the attacker controls. Depending on the flow and other protections, the attacker may capture an authorization code or manipulate the user’s authorization experience.

Common consequences include:

- **Authorization code interception:** A code sent to an unintended destination may be exchanged for tokens if the attacker can also satisfy the client’s requirements.
- **Token or response leakage:** Incorrect response handling, implicit flows, or unsafe redirect chains can expose sensitive response data.
- **Open redirect abuse:** A callback endpoint that accepts a user-controlled destination may redirect users—and sometimes OAuth responses—outside the intended application.
- **Account confusion or login CSRF:** A response may be associated with the wrong browser session if the application does not validate `state` or otherwise bind the flow to the initiating session.
- **Trust-boundary bypasses:** Loose matching rules can let a URI controlled by an attacker pass checks intended to allow only a trusted domain.

Strict redirect URI checks are important, but they are only one part of a secure OAuth implementation. They do not replace `state`, PKCE, secure token handling, or protections against authorization server mix-up.

## How redirect URI validation should work

An authorization server should associate each OAuth client with a known set of permitted redirect URIs. When the client makes an authorization request, the server should validate the supplied `redirect_uri` against that client’s registered values before sending an authorization response.

For most web clients, use an exact match against a pre-registered URI. The comparison should include the relevant URI components, such as:

- Scheme, such as `https`
- Hostname
- Port, when present
- Path
- Query component, if your design permits one

For example, if the registered URI is:

```text
https://app.example/oauth/callback
```

These should not be treated as equivalent without an explicit, safe reason:

```text
http://app.example/oauth/callback
https://app.example.attacker.test/oauth/callback
https://app.example/other-path
https://app.example@attacker.test/oauth/callback
```

The last example is especially deceptive: in URL syntax, the text before `@` can be user information, while the actual host is `attacker.test`.

OAuth 2.0 specifies redirect URI comparison rules, and current security guidance favors exact matching. Native applications have a specific exception for loopback redirect URIs, where the operating system may assign a dynamic port. Do not generalize that exception to web applications or other URI components.

## Avoid loose matching and ad hoc URL checks

A common implementation mistake is to validate only part of a URL. For example, checks such as “starts with the trusted domain,” “contains the expected hostname,” or “ends with the expected path” can be bypassed by carefully chosen input.

Avoid patterns like:

```text
redirect_uri.startsWith("https://app.example")
redirect_uri.includes("app.example")
redirect_uri.endsWith("/oauth/callback")
```

These checks do not reliably establish the actual scheme, host, port, path, or parsing behavior. Regular expressions can also be error-prone when they try to reproduce URL parsing and normalization rules.

The safest general approach is to compare the received URI against a finite list of exact, pre-registered values for that client. Do not construct the allowed destination from user-controlled input, and do not accept arbitrary destinations merely because they share a domain suffix.

## A practical validation pattern

At authorization-request handling time, look up the client’s registered redirect URIs and require the supplied value to match one of them. The following Node.js example illustrates the allowlist pattern; production code should also validate the client, request parameters, and protocol requirements.

```js
const registeredRedirectUris = new Map([
  ["web-client", new Set([
    "https://app.example/oauth/callback",
    "https://staging.app.example/oauth/callback"
  ])]
]);

function validateRedirectUri(clientId, redirectUri) {
  const allowedUris = registeredRedirectUris.get(clientId);

  if (!allowedUris || typeof redirectUri !== "string") {
    return false;
  }

  return allowedUris.has(redirectUri);
}
```

The key property is that the request value is matched against configured values, not transformed into a new destination. Keep the allowlist associated with the client ID; one client must not be able to use another client’s registered callback.

If your system has a registration interface, validate URIs when they are added and enforce the same policy when requests arrive. Store the canonical registered string you intend to compare, and be careful not to normalize the incoming string differently from the registered one. URL parsers are useful for inspecting a URI’s structure, but parsing alone is not an authorization decision.

### Keep the authorization code exchange consistent

For the authorization code flow, bind the code to the client and redirect URI according to the protocol, and require the token request to use the same redirect URI when applicable. The authorization server must not allow a code issued for one client or redirect URI to be redeemed under another context.

Use PKCE, especially for public clients such as native and browser-based applications, to protect authorization codes against interception. PKCE complements redirect URI validation; it is not a reason to accept untrusted callback destinations.

## Design choices for redirect URI registration

### Prefer fixed callback paths

Use a small number of stable callback endpoints, such as `/oauth/callback`, rather than accepting a destination supplied by the user or creating a unique callback URL for each request. Keep post-login navigation separate from the OAuth redirect URI.

For example, after the callback is processed, the application can navigate to a previously stored, validated local route. Do not treat a `next`, `returnTo`, or similar parameter as trusted simply because it arrived alongside a valid OAuth response.

### Be cautious with query parameters

A registered redirect URI may include a query component, but dynamic query parameters complicate matching and can create ambiguity. Prefer callback URIs without query parameters. If your integration requires a fixed query component, register and validate the complete URI according to your authorization server’s rules. Do not allow an untrusted request parameter to append or replace the destination’s query string.

OAuth authorization responses may themselves be delivered in query parameters, so the callback handler must parse them safely. Reject malformed or duplicate security-sensitive parameters rather than choosing an arbitrary value when your framework or protocol handling leaves ambiguity.

### Do not use fragments in registered redirect URIs

A fragment is not sent to the server in an HTTP request. OAuth 2.0 prohibits a fragment component in a `redirect_uri`. Do not register callback destinations that depend on fragments for server-side validation or response processing.

### Use HTTPS for web callbacks

For web applications, register HTTPS callback URLs in production. Plain HTTP can expose the authorization response to network attackers. Development environments may need local exceptions, but keep them isolated from production client registrations and credentials.

Native applications have different redirect URI patterns, including claimed HTTPS links and custom URI schemes. Follow the relevant native-app guidance, and do not apply web-client assumptions to those clients. Where a custom scheme is used, another application may be able to claim the same scheme on some platforms; PKCE and platform-appropriate app-link mechanisms help address that risk.

## Protect the callback handler too

A valid redirect URI only gets the response to the expected endpoint. The application must still verify that the response belongs to the flow it initiated.

- **Validate `state`:** Generate an unpredictable value for each authorization request, bind it to the user’s session, and compare it on return. Reject missing or mismatched values. This helps prevent cross-site request forgery and response injection.
- **Use PKCE:** Create a verifier and challenge for the authorization request, then use the verifier at the token endpoint. Store the verifier safely for the duration of the flow.
- **Check the issuer when relevant:** In deployments involving multiple authorization servers, use the applicable issuer-identification and mix-up protections so a response from one server is not mistaken for another’s.
- **Handle errors safely:** Treat authorization errors as untrusted input. Do not include raw error descriptions in HTML or use them to create redirects without appropriate encoding and validation.
- **Avoid leaking codes:** Do not log authorization codes, access tokens, refresh tokens, or full callback query strings. Consider the callback page’s referrer policy and avoid loading unnecessary third-party resources before processing the response.
- **Use secure session handling:** Protect session cookies with appropriate `Secure`, `HttpOnly`, and `SameSite` settings for the application’s flow, and avoid exposing session identifiers to client-side scripts.
- **Use the authorization code flow:** For applications that can use it, the authorization code flow with PKCE is generally preferable to returning access tokens directly through the browser.

## Common implementation mistakes

### Wildcard subdomains

A rule such as `https://*.example.com/oauth/callback` can be risky if users, tenants, or other parties can control content or subdomains under `example.com`. Prefer explicitly registered callback URIs. If wildcard support is unavoidable, define precisely which hosts are eligible and ensure no untrusted party can claim them.

### Accepting any URI on a trusted host

Allowing every path on a host can expose unexpected endpoints, including open redirects. Register the exact callback path rather than only checking the hostname.

### Redirecting again from the callback

A callback handler may be tempted to read a `returnTo` parameter and redirect immediately. If that value is not independently validated, the callback can become an open redirect. Use a server-side mapping or a strict set of allowed local destinations instead.

### Comparing decoded and encoded values inconsistently

Percent-encoding and URL normalization can cause different components to interpret the same input differently. Avoid decoding, re-encoding, or normalizing the request value in ways that broaden the set of accepted destinations. Test the exact behavior of the authorization server and any framework components involved.

### Treating `state` as a substitute for URI validation

`state` helps bind an authorization response to a browser session, but it does not make an unsafe redirect URI safe. Apply both redirect URI validation and response correlation.

## Testing your validation rules

Build automated tests around the full URI, not only the expected hostname. Include at least:

1. An exact registered URI that should be accepted.
2. A different scheme, host, port, or path that should be rejected.
3. A lookalike domain, such as `app.example.attacker.test`.
4. A user-information form, such as `app.example@attacker.test`.
5. A URI with unexpected query parameters or a fragment.
6. An unknown client ID and a URI registered to a different client.
7. Malformed URI input and duplicate authorization parameters.
8. A callback request with missing or incorrect `state`.

Also test environment separation: a development callback should not be accepted for a production client unless it is explicitly registered for that client. Review logs and error responses to make sure rejected requests do not disclose sensitive details.

## FAQ

### Is an OAuth callback URL the same as a redirect URI?

In common developer usage, yes: “callback URL” usually refers to the OAuth `redirect_uri` where the authorization server returns the browser. The specifications generally use the term “redirect URI.”

### Should redirect URI matching be case-insensitive?

Do not invent case-insensitive matching rules for the full URI. URI components have different comparison rules, and implementation-specific normalization can create security gaps. For typical web clients, use exact matching against the registered URI strings and follow the authorization server’s documented protocol behavior.

### Can I use a wildcard in a callback URL?

Avoid wildcards where possible. They broaden the set of accepted destinations and can be dangerous when untrusted users can control matching subdomains or paths. Explicitly register each callback URI instead.

### Does PKCE eliminate the need to validate the redirect URI?

No. PKCE protects authorization codes against certain interception and injection attacks, but it does not authorize arbitrary redirect destinations. Keep strict redirect URI validation and use PKCE as an additional defense.

### Can the callback redirect users to a page after login?

Yes, but keep that navigation separate from the OAuth redirect URI. Validate the post-login destination independently, preferably against a short allowlist of local paths or a server-side mapping. Never blindly redirect to a user-supplied URL.

## Conclusion

OAuth callback URL validation is a fundamental part of protecting authorization responses. Register exact redirect URIs per client, reject unregistered values, and avoid wildcards, substring checks, and user-controlled destination construction. Then secure the callback flow with `state`, PKCE, careful code exchange, and safe response handling. Treat validation as an end-to-end design requirement—not just a string check at one endpoint.
