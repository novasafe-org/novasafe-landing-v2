# CORS Misconfiguration Troubleshooting

Cross-Origin Resource Sharing (CORS) errors can be confusing: an API may work in a terminal or server-side test but fail when a browser-based frontend calls it. The cause is often a mismatch between the browser request and the server’s CORS policy—not a network outage or a frontend bug.

This guide explains how CORS works, how to investigate common failures, and how to configure a policy that supports legitimate clients without granting unnecessary access. The goal of effective **cors misconfiguration troubleshooting** is to identify which part of the browser’s cross-origin check is failing, then correct the server response while preserving the application’s security boundaries.

## What CORS does—and does not do

The browser’s same-origin policy restricts how a page from one origin can read responses from another. An origin is the combination of a scheme, host, and port. For example, `https://app.example.com` and `https://api.example.com` are different origins, as are `http://app.example.com` and `https://app.example.com`.

CORS is a browser-enforced mechanism that lets a server state which origins may read certain cross-origin responses. The server communicates its policy through HTTP response headers, such as `Access-Control-Allow-Origin`.

CORS is **not authentication, authorization, or a general firewall**. It does not prevent non-browser clients from sending requests, and it should not be used to protect an API from unauthorized access. Enforce identity and permissions on the server for every protected operation, regardless of the request’s `Origin` header.

## How a browser evaluates a CORS request

### Simple cross-origin requests

For some requests, the browser sends the request and then checks the response for valid CORS headers. If the response does not satisfy the policy, the browser prevents page JavaScript from reading it. The server may still have received and processed the request.

### Preflight requests

For requests outside the browser’s CORS-safelisted conditions—for example, a request using certain methods or custom headers—the browser first sends an `OPTIONS` request called a **preflight**. It includes headers such as:

- `Origin`: the requesting page’s origin.
- `Access-Control-Request-Method`: the method the browser intends to use.
- `Access-Control-Request-Headers`: headers the browser intends to send, if any.

The server must respond with a policy that permits the requested origin, method, and headers. If preflight fails, the browser generally does not send the intended request. Proxies, gateways, or application middleware can cause problems if they reject `OPTIONS` requests or remove the relevant headers.

## A practical troubleshooting workflow

### 1. Capture the exact browser error

Open the browser’s developer tools, select the **Network** panel, and reproduce the failure. Check both the `OPTIONS` request, if present, and the intended request. Record:

- The request URL and method.
- The page’s origin, shown as the `Origin` request header.
- The response status and response headers.
- Any preflight request headers and the server’s corresponding CORS response headers.

Read the console message carefully. A missing allow-origin header, a rejected method, an unapproved request header, and a credential-related mismatch require different fixes. Also check whether the response is actually an application error, redirect, or gateway error; those responses may not include CORS headers even when the main endpoint is configured correctly.

### 2. Test the preflight response directly

Use `curl` to see what the server returns for an `OPTIONS` request. Substitute the API URL, frontend origin, method, and headers used by your application:

```bash
curl -i -X OPTIONS 'https://api.example.com/v1/items' \
  -H 'Origin: https://app.example.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type'
```

For a permitted request, inspect whether the response includes an appropriate `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers`. If the request uses cookies or other browser credentials, inspect `Access-Control-Allow-Credentials` too.

A `curl` request does **not** enforce browser CORS rules. It is useful for examining server behavior, but a successful `curl` call does not prove that browser JavaScript can read the response. Confirm the result in a browser as well.

### 3. Compare requested and allowed values

The origin must match the server’s policy, including scheme, host, and port. A policy for `https://app.example.com` does not automatically allow `http://app.example.com` or `https://app.example.com:8443`.

For preflight requests, compare the browser’s requested method and headers with the server’s allowed methods and headers. Header names are case-insensitive, but the server still needs to allow the headers the browser asks to send. CORS response headers should be sent on relevant error responses as well as successful responses if the browser needs to read those errors.

### 4. Check every layer in the request path

CORS headers may be set or changed by the application, reverse proxy, API gateway, CDN, load balancer, or serverless platform. Check the response that reaches the browser—not only the application’s local response. In particular, verify that:

- `OPTIONS` requests reach a handler that can respond successfully.
- A redirect does not send the preflight or actual request to an unexpected host or scheme.
- Error responses from the gateway or application include the required CORS headers when appropriate.
- No layer adds a second, conflicting `Access-Control-Allow-Origin` header.
- Cached responses are not reused across origins without the correct cache variation.

### 5. Re-test the actual browser request

After changing the configuration, clear or account for cached responses, repeat the request in the browser, and verify both the preflight and actual response. Test allowed and disallowed origins, the methods and headers your client uses, and credential behavior if applicable.

## Common CORS failures and how to fix them

### Missing or mismatched `Access-Control-Allow-Origin`

The server must return an allow-origin value that permits the requesting origin. For a public endpoint that does not use credentials, `Access-Control-Allow-Origin: *` can be appropriate. For a restricted endpoint, return an explicit origin from a controlled allowlist.

A common mistake is allowing the frontend’s development origin but not its deployed origin, or allowing a hostname while the browser uses a different scheme or port. Avoid copying arbitrary values from the request’s `Origin` header into the response; that effectively makes the policy permissive unless the origin is validated first.

### Preflight fails because of a method or header

If the browser requests `PATCH`, the server must permit that method. If the browser requests `Authorization` or `Content-Type`, the preflight response must permit those request headers. Do not add every method or header by default; allow only what the client needs.

### Credentials conflict with a wildcard origin

When a browser request includes credentials, such as cookies, the server must explicitly allow credentials with `Access-Control-Allow-Credentials: true` and return a specific allowed origin. A wildcard origin cannot be used for a credentialed CORS response. The client must also opt into sending credentials where its API and browser client require that setting.

CORS permission does not replace cookie protections. Set appropriate cookie attributes, use suitable CSRF defenses for state-changing requests, and validate authorization on the server.

### `OPTIONS` is rejected or handled by the wrong component

A framework route may not recognize `OPTIONS`, or a proxy may block it before it reaches the application. Configure the relevant layer to respond to preflight requests. The response should indicate the permitted origin, method, and requested headers; it does not need to perform the intended operation.

### The browser reports a CORS error for a server failure

A browser may show a CORS error when the actual underlying response is a `401`, `403`, `404`, `500`, or gateway error without CORS headers. Inspect the Network panel and server logs to find the underlying status. Fix the application failure and, when appropriate, ensure the error response also includes the intended CORS headers.

### Caching serves the wrong origin’s response

If a server dynamically returns an allow-origin value based on the request, shared caches need to know that the response varies by origin. Send `Vary: Origin` so caches do not treat responses for different origins as interchangeable. If preflight responses are cached, review the cache behavior and relevant `Vary` headers for request method and requested headers as well.

## Example: explicit origin allowlist in Express

This example illustrates a small allowlist for an API. Adjust the origins, methods, and headers to match your application. The credential header is included only for an application that actually requires browser credentials; remove it if it is not needed.

```js
const allowedOrigins = new Set([
  'https://app.example.com',
  'https://admin.example.com'
]);

app.use((req, res, next) => {
  const origin = req.get('Origin');

  // Dynamic origin responses must be separated in shared caches.
  res.vary('Origin');

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    if (origin && !allowedOrigins.has(origin)) {
      return res.sendStatus(403);
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Request-ID'
    );

    return res.sendStatus(204);
  }

  next();
});
```

This is a starting point, not a complete security policy for every deployment. Make sure middleware ordering allows the CORS handler to run before routes that reject `OPTIONS`, and verify how your framework and infrastructure handle error responses. If the API does not need credentials, omit `Access-Control-Allow-Credentials` rather than enabling it by habit.

## Security best practices for CORS

- **Use an explicit allowlist for private or sensitive APIs.** Validate the complete origin against known values before returning it.
- **Avoid reflecting arbitrary origins.** A response that echoes any supplied origin can expose readable responses to untrusted websites, especially when combined with credentials.
- **Keep permissions narrow.** Allow only required methods and request headers. Do not treat broad CORS access as a substitute for endpoint authorization.
- **Use wildcard access only when appropriate.** It can suit public, non-credentialed resources, but it is not suitable for credentialed CORS responses.
- **Handle credentials deliberately.** Enable them only when needed, and review cookies, CSRF defenses, and server-side authorization together.
- **Treat `Origin: null` cautiously.** It can be sent by some sandboxed or opaque-origin contexts. Do not allow it unless there is a specific, reviewed requirement.
- **Account for caches.** Use `Vary: Origin` when the response’s CORS policy varies by origin, and check CDN and proxy behavior.
- **Test negative cases.** Confirm that unapproved origins, methods, and headers are not accidentally permitted.
- **Do not rely on CORS for access control.** Non-browser clients can make requests without browser CORS enforcement. Authenticate and authorize requests on the server.

These practices turn CORS from a collection of quick fixes into a deliberate part of web application security. A restrictive, tested policy is easier to maintain than a permissive configuration added to silence browser errors.

## FAQ

### Does a CORS error mean the API request never reached the server?

Not necessarily. A browser can send a simple cross-origin request and then block JavaScript from reading the response. A failed preflight usually prevents the browser from sending the intended request. Check the Network panel and server logs to determine which occurred.

### Why does the request work in `curl` but fail in the browser?

`curl` does not enforce the browser’s same-origin policy or CORS checks. The server may return a response that `curl` displays but the browser will not expose to page JavaScript. Compare the browser’s `Origin` and preflight headers with the server’s CORS response.

### Can I use `Access-Control-Allow-Origin: *` for my API?

It can be suitable for resources intended to be readable by any website when the request does not use credentials. For credentialed CORS requests, the server must return a specific permitted origin rather than `*`. Public availability also does not remove the need for appropriate server-side controls.

### Should I add CORS headers to every response?

Return the relevant CORS headers on responses that an allowed browser client needs to read, including useful error responses. Apply the policy consistently through the application and any proxy or gateway, but avoid granting access to origins that should not have it.

## Conclusion

Reliable **cors misconfiguration troubleshooting** starts with observing the browser’s actual request and response, then checking origin matching, preflight handling, methods, headers, credentials, and the infrastructure between client and API. Fix the specific mismatch rather than broadly allowing every origin or request. Keep CORS narrowly scoped, test both permitted and denied cases, and enforce authentication and authorization independently on the server.
