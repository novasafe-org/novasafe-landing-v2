# WebSocket Security Design

WebSockets enable two-way communication over a long-lived connection, making them useful for chat, collaboration, live dashboards, and other real-time features. That connection model also changes how teams need to think about security: a request that passes an initial check can remain active for minutes or hours, and each message can carry a new action or data request.

Effective **websocket security design** is not a single setting. It combines secure connection setup with per-message authorization, resource controls, careful handling of browser origins, and monitoring throughout the connection lifecycle. This guide explains how to assess a design, recognize common failure modes, and choose safeguards proportionate to the application.

## How WebSocket security differs from HTTP security

A WebSocket connection usually begins with an HTTP request that asks the server to switch protocols. If the server accepts, the connection is upgraded and subsequent communication uses WebSocket frames rather than separate HTTP requests.

That shift has practical security consequences:

- **The handshake is only the beginning.** Authentication at connection time does not automatically authorize every later message.
- **Connections persist.** Long-lived sessions consume server, proxy, and load-balancer resources.
- **Messages need their own controls.** A valid connection can still send malformed, oversized, unauthorized, or high-rate messages.
- **Browser behavior matters.** Browsers may include cookies in a WebSocket handshake, creating cross-site risks if the server trusts cookies without validating the request context.

WebSockets do not use browser CORS enforcement in the same way as ordinary cross-origin `fetch` requests. Servers should explicitly validate the `Origin` header for browser clients rather than assuming CORS configuration protects the endpoint.

## Start with a threat model

Before choosing controls, identify what the endpoint can do and what an attacker could gain. Consider:

1. **Who connects?** Browser users, native apps, service clients, or a mix?
2. **What credentials are available?** Session cookies, short-lived tokens, or mutual TLS between services?
3. **What actions can messages trigger?** Reading private data, changing account state, publishing events, or consuming expensive resources?
4. **What is the expected traffic pattern?** Typical and peak connection counts, message size, and message frequency?
5. **What happens when a connection is shared or compromised?** Can one user subscribe to another user’s channel or issue privileged commands?

Classify messages by the impact of the action they request. A public status subscription and a financial transaction should not receive identical authorization or rate-limit policies simply because both travel over WebSockets.

## Secure the handshake

### Use TLS in production

Use `wss://` for production WebSocket connections so the handshake and frames are protected in transit. Configure TLS at the application or trusted edge proxy, and ensure the proxy forwards upgrade requests correctly. Avoid redirect-based assumptions: clients should connect directly to the secure endpoint rather than relying on an insecure WebSocket connection being upgraded safely.

### Validate browser origins

For browser-facing endpoints, compare the handshake’s `Origin` value against an explicit allowlist of trusted origins. Match the expected scheme, hostname, and port as appropriate; do not use loose substring checks such as “contains `example.com`.” Reject missing or unexpected origins when the endpoint is intended only for browsers.

`Origin` is a browser security signal, not an identity credential. Non-browser clients can generally set their own headers, so origin validation must complement authentication rather than replace it.

### Authenticate deliberately

Choose an authentication pattern that fits the client and threat model:

- **Cookie-based sessions:** convenient for browser applications, but require strong origin checks and session protections to reduce cross-site WebSocket hijacking risk.
- **Short-lived access tokens:** can be sent through a mechanism supported by the client and server. Avoid placing sensitive, reusable tokens in URLs when possible; URLs can be captured in logs, diagnostics, or other infrastructure.
- **Authentication after upgrade:** sometimes useful when browser API limitations make handshake credentials awkward. If used, keep the connection unauthenticated until a valid authentication message is processed, set a short deadline, and accept no privileged operations before then.

Validate session expiry and revocation during long-lived connections. Depending on the application, this may mean closing a connection when a session expires, periodically rechecking authorization, or requiring reauthentication for sensitive actions.

## Authorize every meaningful message

Authentication answers “who is connected?” Authorization answers “may this identity perform this action on this resource now?” Enforce the latter for each message that reads or changes protected data.

For example, a client might send a subscription request for a room identifier. The server should verify that the authenticated user is permitted to access that room before joining the connection to its broadcast group. Do not trust a client-supplied user ID, role, tenant ID, or channel name as proof of permission. Derive identity from validated credentials and check resource access on the server.

A useful review question is: **If an attacker obtains a valid low-privilege connection, which messages could they send, and what would the server allow?** Trace each message type through parsing, authorization, and the operation it triggers.

## Validate messages as untrusted input

Treat every frame as untrusted, including messages from authenticated clients. Define a schema for each message type and reject data that does not match it. Validate at least:

- Message type and required fields
- Field types, lengths, and allowed values
- Identifiers and numeric ranges
- Nested object depth and collection sizes
- Whether the requested operation is valid in the current connection state

Set a maximum message size appropriate to the application. If the server accepts JSON, parse it safely and handle parse errors without exposing stack traces or internal details. Avoid passing client-controlled strings directly to SQL, shell commands, template engines, or other interpreters; use the relevant safe APIs and parameterization.

Example message contract:

```json
{
  "type": "subscribe",
  "channel": "room-42"
}
```

The server should verify that `type` is supported, `channel` has the expected format, and the authenticated principal may access that room. A syntactically valid message is not necessarily an authorized one.

## Limit abuse of connections and messages

A WebSocket endpoint can be abused without exploiting a software bug. Apply controls at several levels:

- **Connection limits:** Cap concurrent connections per account, IP address, or other useful grouping. Account for shared networks and mobile clients to avoid overly restrictive IP-only rules.
- **Message and payload limits:** Bound frame size, parsing work, and the amount of data returned to a client.
- **Rate limits:** Limit connection attempts and message rates. Use stricter limits for expensive operations, broadcasts, and authentication attempts.
- **Idle timeouts and heartbeats:** Close abandoned connections and use ping/pong or equivalent health checks where supported by the framework and infrastructure.
- **Backpressure:** Avoid unbounded queues for slow consumers. Define whether to drop nonessential updates, reduce update frequency, or close clients that cannot keep up.
- **Resource budgets:** Consider limits on subscriptions, rooms, fan-out, and per-connection memory—not just raw message count.

Set limits based on observed application needs and test how they behave at expected load. A limit that is too permissive may not protect the service; one that is too strict can disrupt normal users.

## Handle errors and connection lifecycle safely

Use appropriate WebSocket close behavior and avoid sending sensitive diagnostics to clients. Log enough detail on the server to investigate failures, but do not include access tokens, session identifiers, private message contents, or other secrets in routine logs.

Plan for reconnects. Clients commonly reconnect after network changes or server restarts, so use bounded retry delays with jitter rather than synchronized rapid retries. Reconnection must not restore subscriptions or privileges without revalidating the user’s current authorization. For operations that may be retried, consider idempotency so a reconnect does not accidentally repeat a sensitive action.

Also review how infrastructure handles upgraded connections. Confirm that reverse proxies and load balancers support WebSocket upgrades, have suitable idle timeouts, and enforce connection limits where appropriate. Ensure that client IP information is trusted only when supplied by a proxy under your control; otherwise, forwarded headers can be spoofed.

## Common WebSocket security failure modes

| Failure mode | Why it matters | Proportionate safeguard |
|---|---|---|
| Trusting the handshake as permanent authorization | Roles or access may change while a connection remains open | Recheck access for sensitive operations and respond to session expiry or revocation |
| Accepting any browser origin | A victim’s browser may initiate a connection using ambient credentials | Enforce an explicit origin allowlist and authenticate the connection |
| Checking authorization only at connect time | Later messages may target resources the user cannot access | Authorize each protected action and subscription |
| No size or rate limits | Attackers can consume memory, CPU, or outbound bandwidth | Set message, connection, and operation-specific limits |
| Logging complete frames | Logs may retain credentials or private user data | Log event metadata and outcomes; redact or omit sensitive fields |
| Treating client identifiers as trusted | A client can request another user’s resource by changing an ID | Bind identity to server-validated credentials and check resource permissions |
| Unbounded queues for slow clients | A slow recipient can cause memory growth and service degradation | Apply backpressure, queue limits, or controlled disconnection |

## A practical assessment checklist

Use this checklist during design review, code review, and testing:

1. **Map the endpoint.** Document clients, handshake routes, credentials, message types, and downstream operations.
2. **Review transport and origin controls.** Confirm production uses `wss://` and browser origins are checked against a strict allowlist.
3. **Trace identity and authorization.** Verify how the user is authenticated, how expiry is handled, and where each message’s permissions are checked.
4. **Test malformed and excessive input.** Try unknown message types, missing fields, invalid identifiers, oversized frames, and bursts of messages in a controlled environment.
5. **Test cross-account access.** Attempt to subscribe to or act on another user’s resources using a valid low-privilege account.
6. **Exercise lifecycle behavior.** Check idle connections, reconnects, expired sessions, server restarts, and slow consumers.
7. **Inspect observability.** Confirm logs and metrics support investigation without collecting secrets or unnecessary message contents.
8. **Review deployment controls.** Check proxy upgrade handling, timeouts, trusted forwarded headers, and capacity limits.

Automated tests should cover message schemas and authorization rules, while integration tests should exercise the actual handshake and proxy path. Use test accounts and non-production data when probing abuse cases.

## FAQ

### Is a WebSocket connection encrypted by default?

No. Use `wss://` to protect WebSocket traffic with TLS in transit. A secure connection does not, by itself, provide authentication or authorization.

### Does CORS protect a WebSocket endpoint?

Do not rely on CORS as the WebSocket origin control. For browser clients, validate the handshake’s `Origin` header on the server. Continue to authenticate clients and authorize each protected operation.

### Should authorization happen only during the handshake?

Usually not. Handshake authentication establishes an identity, but permissions can vary by action and change over time. Check authorization for each message that accesses protected resources, and define how to handle session expiry or revocation.

### Are WebSockets safe for sensitive data?

They can be used for sensitive data when the full design is appropriate: TLS, secure authentication, per-message authorization, input and resource limits, and careful logging. Assess the sensitivity and impact of each operation rather than treating the transport choice as a complete security decision.

## Conclusion

A sound WebSocket security design treats the connection as a long-lived, stateful interface—not as a one-time HTTP check. Secure the handshake, validate browser origins, authenticate deliberately, authorize each meaningful message, and bound the resources a connection can consume. Then test the lifecycle and deployment path, including reconnects, slow clients, and expired credentials. These practices help teams apply safeguards that match the risks and behavior of their real-time features.
