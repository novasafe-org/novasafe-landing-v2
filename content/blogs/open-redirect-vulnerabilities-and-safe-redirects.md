# Open Redirect Vulnerabilities and Safe Redirects

Redirects are a routine part of web applications: they send users to a dashboard after login, return them to a page they requested, or hand off to an external service. They become a security concern when an application lets a user influence the destination without checking it. An attacker can then turn a trusted application URL into a convincing link to an untrusted site.

This guide explains how to assess open redirect vulnerabilities, recognize common implementation failures, and choose proportionate safeguards. The examples focus on redirect destinations supplied through query parameters, but the same principles apply to form fields, stored preferences, and API inputs.

## What is an open redirect?

An open redirect is a flaw that lets an attacker cause an application on a trusted domain to redirect a user to a destination the attacker controls. A vulnerable endpoint might accept a URL in a parameter such as `next`, `returnUrl`, `continue`, or `redirect`:

```text
https://app.example.test/login?next=https://attacker.example
```

If the application uses that value without validation, it may respond with a redirect such as:

```http
HTTP/1.1 302 Found
Location: https://attacker.example
```

The link begins on a legitimate domain, which can make the destination less obvious to a recipient. Open redirects can support phishing, credential-harvesting flows, or navigation to malicious downloads. They can also undermine trust in links shared by an application. The vulnerability does not, by itself, give an attacker control of the application or bypass authentication; its impact depends on the surrounding flow and how users or other systems rely on the redirect.

## Where redirect vulnerabilities appear

Search for destinations that are influenced by user-controlled data. Common sources include:

- Query parameters such as `next`, `url`, `return`, `continue`, or `redirect_uri`.
- Form fields submitted during login, logout, or checkout.
- Values stored in cookies, sessions, or user profiles and later used as a destination.
- API responses that provide a URL for the client to navigate to.
- Error handlers or legacy routes that forward a supplied URL.

Also inspect redirect chains. A redirect to a same-origin route may still be risky if that route accepts another destination and forwards users externally. Review server-side redirects and client-side navigation, including uses of `window.location`, `location.assign()`, and framework router methods.

## How to assess open redirect vulnerabilities

Test only applications and environments you are authorized to assess. Start by mapping redirect behavior, then verify whether untrusted destinations are rejected or constrained.

### 1. Find redirect inputs and flows

Review routes and code for redirect calls and destination parameters. Trace each value from its source to its use. For example, a login flow may preserve the requested page in a `next` parameter before sending the user to authentication and then back again.

Record the expected behavior for each flow:

- Is the destination meant to be a local path, a known external site, or one of a small number of routes?
- Does the application need to preserve a query string or fragment?
- What should happen if the destination is missing or invalid?

A clear requirement helps avoid overly broad validation rules.

### 2. Try representative destination forms

In a test environment, try a harmless external domain and variations that commonly expose weak checks:

```text
https://attacker.example
//attacker.example
https://app.example.test.attacker.example
https://attacker.example/path
```

Depending on the application and URL parser, also test encoded characters, mixed case, whitespace, backslashes, user-info syntax, and nested redirect parameters. These inputs help identify brittle checks such as searching for a trusted hostname as a substring. Do not assume every variation behaves identically across browsers, frameworks, and servers; observe the actual response and resulting browser navigation.

### 3. Inspect the response and final destination

Check the HTTP status and `Location` header, then follow the flow in a browser or an HTTP client that does not automatically follow redirects. For example:

```bash
curl -i 'https://app.example.test/login?next=https%3A%2F%2Fattacker.example'
```

A safe implementation should send the user to a defined fallback or a permitted destination, not to the untrusted host. Test authenticated and unauthenticated paths where relevant, and check whether a local route creates a second external redirect.

### 4. Check edge cases and regression behavior

Test missing, empty, malformed, and excessively long values, as well as destinations with ports, credentials, fragments, or unusual encodings. Confirm that valid in-application return paths still work. Add automated tests for both accepted and rejected cases so that a future refactor does not reintroduce the weakness.

## Common failure modes

### Substring checks

A check such as `destination.includes("example.test")` can accept `https://example.test.attacker.example`. The trusted text appears in the value, but the hostname belongs to the attacker.

### Loose suffix checks

Checking whether a hostname ends with `example.test` without requiring a hostname boundary can accept `notexample.test`. If subdomains are intentionally allowed, compare parsed hostnames and enforce the exact domain boundary, such as `hostname === "example.test"` or `hostname.endsWith(".example.test")`.

### Blocking only `http://`

Rejecting values that start with one scheme does not cover scheme-relative URLs such as `//attacker.example`, alternate schemes, or parser-normalized forms. Validation should parse the destination and apply an explicit policy rather than trying to enumerate bad strings.

### Trusting a client-side check

A browser-side check can improve usability, but it is not a security boundary. An attacker can send a request directly to the server or alter client-side state. Enforce destination rules wherever the redirect is issued.

### Allowing a trusted redirector to be chained

A destination on your own domain may itself redirect to an external site. Allowlisting that route does not make the entire chain safe. Review the behavior of allowed endpoints and avoid passing an attacker-controlled destination through them.

### Confusing redirect parameters with OAuth redirect URIs

OAuth `redirect_uri` validation has protocol-specific requirements. Do not treat an OAuth callback as an ordinary post-login `next` value or apply a broad same-domain rule without considering the relevant authorization-server requirements. Register and validate callback URIs according to the OAuth implementation and its security guidance.

## Safer redirect patterns

The strongest and simplest option is to avoid accepting arbitrary URLs. Choose a pattern that matches the product requirement.

### Prefer route identifiers or a fixed mapping

If users need to choose among a few destinations, accept a short identifier and map it to a known route:

```js
const destinations = {
  dashboard: "/dashboard",
  orders: "/account/orders",
  support: "/help"
};

function destinationFor(value) {
  return destinations[value] ?? "/";
}
```

This avoids URL parsing and makes the set of possible destinations explicit.

### Accept only local paths when that is sufficient

For a return-to-page flow, resolve the supplied value against a configured application origin and accept it only if the parsed origin matches. Return a path, query, and fragment rather than an absolute URL. The following Node.js example is suitable for an application that intentionally allows any same-origin path; use a route allowlist instead if only a few paths are appropriate.

```js
const APP_ORIGIN = new URL(process.env.APP_ORIGIN);

function safeLocalRedirect(value, fallback = "/") {
  if (typeof value !== "string" || value.length > 2048) {
    return fallback;
  }

  try {
    const target = new URL(value, APP_ORIGIN);

    if (target.origin !== APP_ORIGIN.origin) {
      return fallback;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
```

Configure `APP_ORIGIN` as a trusted, fixed application origin, for example `https://app.example.test`. Do not derive the trusted origin from an unvalidated `Host` header. The URL parser handles many syntactic variations more reliably than ad hoc string checks, but parsing alone is not a complete policy: decide which same-origin paths are actually safe, and review downstream routes for further redirects.

### Allowlist external destinations when necessary

Some applications have a genuine need to redirect to external services. In that case, compare parsed URLs against a small, explicit allowlist. Require HTTPS unless there is a documented reason not to, and check the hostname exactly or with a deliberate subdomain-boundary rule. Consider whether non-default ports, paths, and query parameters should be permitted. Avoid checks based only on a URL's displayed text or substring matches.

Where possible, map a user-facing option to a configured destination instead of accepting a complete URL. This reduces the number of parsing and policy decisions the application must make.

### Use a safe fallback

If a destination is absent or invalid, send the user to a fixed, useful page such as the home page or account overview. Do not reflect an invalid value in an error link or pass it to another redirect handler. Keep the fallback independent of user-controlled input.

## Implementation and operational considerations

- **Validate at the point of use.** A value stored earlier may become unsafe or may have been written through another code path. Apply the policy when issuing the redirect.
- **Keep policy narrow.** Allow only the destinations the flow needs. A route allowlist is safer than allowing every path when users only need to return to a few pages.
- **Preserve usability deliberately.** If return paths need query strings, decide whether particular parameters should be retained. Avoid unintentionally forwarding sensitive tokens or state to another route.
- **Review status-code behavior.** `301` and `308` are permanent redirects and may be cached. `302` and `303` are commonly used for temporary navigation; `307` and `308` preserve the request method. Choose a status code that matches the flow, especially after a form submission, and avoid making a security decision depend on the code alone.
- **Log carefully.** Security logs can record rejected redirect attempts, but avoid storing secrets or sensitive query values unnecessarily. Rate-limit or aggregate noisy events if they could overwhelm monitoring.
- **Test in context.** Browsers and server frameworks can normalize URLs differently. Verify behavior using the actual stack, and keep regression tests for tricky inputs and redirect chains.

A minimal test matrix might include:

| Input | Expected result for a same-origin-only policy |
|---|---|
| `/account` | Accept if the route is permitted |
| `https://app.example.test/account` | Accept only if absolute same-origin URLs are intentionally supported |
| `https://attacker.example/` | Reject and use the fallback |
| `//attacker.example/` | Reject and use the fallback |
| `not a URL` | Reject and use the fallback |
| Empty or missing value | Use the fallback |

Adjust the expected results to match the policy. For example, an implementation that accepts only relative paths should reject absolute same-origin URLs too.

## FAQ

### Are all redirects based on user input unsafe?

No. Redirects are a normal application feature. The risk arises when untrusted input can select a destination outside the intended policy. Fixed destinations and tightly validated return paths are common safe patterns.

### Is checking that a URL starts with `/` enough?

Not as a general rule. URL interpretation can be affected by forms such as `//host`, backslashes, and encoding, and different layers may parse or normalize a value differently. Use a URL parser and an explicit same-origin or allowlist policy. If the requirement is only to accept application-relative paths, enforce that requirement consistently and test edge cases in your stack.

### Can a same-origin redirect still be a problem?

Yes. A same-origin path may expose sensitive content, forward users to another external redirector, or behave unexpectedly in a particular workflow. Same-origin validation prevents direct redirects to other origins, but it does not replace route-level authorization or review of redirect chains.

### Should I remove every redirect parameter?

Not necessarily. Return destinations can be important for usability. Replace arbitrary URLs with route identifiers where possible, or constrain destinations to the paths or hosts the flow actually needs and provide a safe fallback.

## Conclusion

Open redirect vulnerabilities arise when applications treat a user-provided destination as trusted. To assess them, trace redirect inputs through the full flow, test representative URL variations, inspect the final `Location` response, and check for chained redirects. To prevent them, prefer fixed route mappings, enforce a narrow same-origin or explicit host allowlist when dynamic destinations are necessary, and use a safe fallback for invalid input. Pair the policy with regression tests so safe redirects remain safe as the application evolves.
