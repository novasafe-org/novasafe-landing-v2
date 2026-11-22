# REST API Authentication Design

A sound REST API authentication design does more than check whether a request includes a credential. It defines how clients obtain and present credentials, how the server validates them, how access is limited, and what happens when a credential is compromised or expires.

The right approach depends on who or what is calling the API. A service-to-service integration has different needs from a mobile app, a browser-based application, or a public developer API. This guide compares common approaches, explains their tradeoffs, and offers criteria for choosing a defensive design.

## Authentication and authorization are different

**Authentication** establishes the identity associated with a request: for example, a user, service, or client application. **Authorization** determines what that identity is allowed to do, such as reading a particular record or invoking an administrative operation.

A valid credential does not automatically justify every action. A robust API checks both the credential and the request's permissions, including the resource and operation involved. Authentication is also distinct from encryption: use HTTPS to protect credentials and data in transit, but do not treat TLS alone as application-level authorization.

## Common REST API authentication approaches

| Approach | Best suited to | Main advantages | Main tradeoffs |
|---|---|---|---|
| API keys | Identifying or limiting access for simple integrations | Easy to issue and use | Often long-lived and difficult to scope; not a strong user identity mechanism |
| Opaque bearer tokens | First-party or delegated access where the server can check token state | Easy to revoke centrally; token contents stay server-side | Requires a lookup or introspection service |
| JWT access tokens | Distributed systems that need locally verifiable claims | Can be validated without a per-request token lookup | Revocation and key management require careful design |
| OAuth 2.0 access tokens | Delegated access and authorization across clients and services | Standardized flows and scopes | More components and configuration to operate correctly |
| Mutual TLS (mTLS) | High-assurance service-to-service connections | Client identity is bound to a certificate | Certificate issuance, rotation, and client support add operational work |
| HTTP Basic authentication | Limited legacy or tightly controlled cases | Widely supported and simple | Reusable credentials on every request; requires HTTPS and careful handling |

These approaches are not always mutually exclusive. For example, OAuth 2.0 can issue either opaque tokens or JWTs, and a service may use mTLS to authenticate a workload in addition to a bearer token.

### API keys

An API key is a shared secret presented by a client, commonly in a request header. It can identify a project or integration and support quotas, billing, or basic access control. Treat it as a secret: transmit it over HTTPS, store it securely, and avoid putting it in URLs, where it can leak through logs, browser history, or referrer data.

API keys are a poor substitute for user authentication. A key copied into a mobile app or browser can often be extracted by its users, and a single key may not distinguish individual end users. If you use keys, provide revocation and rotation, restrict their permissions and environment where practical, and avoid granting broad access by default.

### Opaque bearer tokens

A bearer token grants access to whoever possesses it, so anyone who obtains the token may be able to use it until it expires or is revoked. Send it in the `Authorization` header, not in a URL:

```http
Authorization: Bearer <access-token>
```

An opaque token is an unstructured value. The API or an authorization service looks it up to determine whether it is active and what permissions it carries. This makes central revocation and policy changes straightforward, but validation depends on the availability and performance of that lookup service. Caching can help, but it can also delay the effect of revocation.

### JWT access tokens

A JSON Web Token (JWT) is a signed token that can carry claims such as issuer, subject, audience, expiration, and scopes. A service with the right verification key can validate a JWT locally, which is useful when many services need to check access without calling a central store on every request.

A signature does not make a JWT confidential. Unless separately encrypted, its claims can be read by whoever has the token. Do not put passwords, secrets, or sensitive personal data in a signed JWT. Validate the signature and expected algorithm, issuer, audience, expiration, and any required permissions. Do not accept a token just because it is well-formed or signed by an untrusted key.

JWTs also have a revocation tradeoff: a locally validated token may remain usable until it expires unless the system adds a denylist, version check, or another revocation mechanism. Short lifetimes reduce that window but require a safe renewal strategy. Plan key rotation so services can accept appropriately current keys while retiring old ones.

### OAuth 2.0 and OpenID Connect

OAuth 2.0 is an authorization framework, not a single authentication method. It defines ways for a client to obtain access tokens for a resource server. For user sign-in and identity information, OpenID Connect (OIDC) adds an identity layer on top of OAuth 2.0.

Use a flow designed for the client type. Browser and native applications commonly use Authorization Code with Proof Key for Code Exchange (PKCE). Server-side applications can use Authorization Code with a confidential client, protecting the client secret on the server. Services acting on their own behalf often use the Client Credentials grant. Do not use the Resource Owner Password Credentials grant for new designs; it exposes user passwords to the client and is not an appropriate modern default.

Keep access tokens narrowly scoped to their intended API and audience. Treat refresh tokens as especially sensitive: store them securely, rotate or otherwise manage them according to the provider's capabilities, and revoke them when appropriate. OAuth adds dependencies such as an authorization server and client registration, so account for their availability, configuration, and incident response in the design.

### Mutual TLS

With mTLS, both the client and server present certificates during the TLS handshake. This can provide strong workload identity for controlled service-to-service environments, especially when certificates are issued and managed by a reliable platform. It does not remove the need for authorization: the API must still decide which operations the authenticated workload can perform.

Certificate provisioning, renewal, trust configuration, and support across proxies and client environments can make mTLS harder to operate than bearer tokens. It is often most useful for internal or high-assurance connections rather than as the only mechanism for a broad public API.

## A practical selection process

Use these questions to guide your REST API authentication design:

1. **Who is the client?** Separate end users, browser or mobile apps, partner integrations, and workloads. A credential safe to keep on a server is not necessarily safe to embed in a distributed client.
2. **Is access delegated?** If users authorize a client to act on their behalf, OAuth 2.0 is usually a better fit than inventing a token exchange. Use OIDC when the application also needs a standard identity layer.
3. **Where must identity be checked?** Opaque tokens support centralized state and revocation. JWTs can reduce per-request lookups across distributed services, but require disciplined validation and key management.
4. **How quickly must access be revoked?** If immediate central revocation is important, consider opaque tokens or an explicit revocation check. If using self-contained tokens, decide how expiration and any additional revocation controls meet the requirement.
5. **What can the credential access?** Prefer least privilege: define scopes, audiences, tenants, or resource-level permissions appropriate to the use case. Do not use authentication as a substitute for per-resource authorization.
6. **Can the team operate it safely?** Consider token issuance, secret storage, key and certificate rotation, monitoring, recovery, and dependency outages—not just implementation effort.

A small server-to-server integration might start with a narrowly scoped, revocable API key or client credentials flow, depending on its identity and delegation needs. A multi-service platform may use short-lived JWT access tokens with a well-managed signing-key process. A user-facing application that accesses an API on a user's behalf is generally better served by an appropriate OAuth 2.0 flow than by a shared API key.

## Defensive implementation checklist

### Protect credentials in transit and at rest

- Require HTTPS for API traffic and redirect or reject insecure connections at the appropriate edge.
- Accept credentials in the `Authorization` header or another documented secure header; do not put secrets in query strings.
- Keep server-side secrets in an approved secret store rather than source code, container images, or client bundles.
- Do not log raw access tokens, API keys, passwords, or authorization headers. Redact them in application, proxy, tracing, and error logs.

### Validate every request consistently

- Validate the credential on every protected request, including its signature or lookup status, expiration, issuer, audience, and intended use as applicable.
- Use a maintained library for protocol and token validation. Avoid custom cryptographic code and do not let a token choose arbitrary verification algorithms or keys.
- Fail closed when required validation or authorization checks cannot be completed. Return a suitable authentication or authorization error without exposing secrets or internal validation details.
- Enforce authorization at the resource and action level. Check ownership and tenant boundaries rather than relying only on a broad role or a valid token.

### Limit exposure and support recovery

- Use short-lived access credentials when appropriate, with a renewal process that does not expose long-lived credentials to untrusted clients.
- Provide a way to revoke, rotate, and replace keys, tokens, or certificates. Document how operators respond to suspected compromise.
- Apply rate limits and abuse monitoring to authentication and token-issuance endpoints. Avoid error messages that reveal whether a particular secret or account is valid.
- Review CORS configuration for browser clients. CORS controls which browser origins may read responses; it is not authentication and does not protect an API from non-browser clients.

## Example: sending a bearer token

A client can send an access token in the standard authorization header:

```bash
curl https://api.example.com/v1/profile \
  -H 'Authorization: Bearer <access-token>'
```

The server should validate the token before returning protected data and then authorize access to the requested profile. The example token is a placeholder; never commit a real credential to source control or paste one into shared documentation.

## Common design mistakes

- **Treating a key as proof of an end user.** A shared integration key identifies a credential, not necessarily the person behind a request.
- **Putting tokens in URLs.** URLs are commonly captured by logs and other systems. Use a header instead.
- **Trusting decoded JWT claims.** Decoding is not verification. Check the signature and all required claims using trusted configuration.
- **Using broad or long-lived credentials by default.** Excessive scope and lifetime increase the impact of theft.
- **Assuming stateless means safer.** Stateless validation can improve scalability, but it may complicate revocation and policy updates.
- **Confusing CORS with access control.** CORS is a browser policy, not a mechanism for authenticating or authorizing API callers.
- **Ignoring operational ownership.** Authentication design includes rotation, logging, monitoring, dependency failure, and incident response.

## FAQ

### Should a REST API use JWTs or opaque tokens?

Neither is universally better. Opaque tokens support centralized state and straightforward revocation, but usually require a lookup. JWTs can be validated locally and carry claims, but need careful claim and signature validation, key rotation, and a plan for revocation. Choose based on your distribution, latency, and operational requirements.

### Are API keys secure enough for a public API?

They can help identify and control access for integrations, but a key embedded in a public client should be considered discoverable. Restrict its permissions, monitor usage, and provide rotation and revocation. Use a user-delegation flow when the API needs to act on behalf of individual users.

### Is OAuth 2.0 authentication?

OAuth 2.0 is primarily an authorization framework for obtaining access to resources. OIDC adds standardized identity and sign-in information. Use the protocol and flow that match the application rather than treating every OAuth access token as proof of user identity.

### Does REST require stateless authentication?

REST constraints do not require a particular credential format. An API can validate self-contained tokens or consult server-side session or token state. The important design question is how to balance scalability, revocation, security controls, and operational complexity for your system.

## Conclusion

Good REST API authentication design matches the credential to the client and the access model. API keys can serve limited integration needs, opaque tokens simplify centralized control, JWTs support distributed validation, OAuth 2.0 enables delegated access, and mTLS can strengthen workload identity in suitable environments. Whichever approach you choose, combine secure transport and credential handling with strict validation, least-privilege authorization, revocation and rotation procedures, and ongoing monitoring.
