# API Authorization vs Authentication

Authentication and authorization are closely related, but they answer different questions. Authentication establishes who or what is making an API request. Authorization decides what that identity is allowed to do.

Confusing the two can leave an API exposed even when every request requires a valid token. A token may prove that a user is signed in, for example, without proving that the user may view a particular invoice. This guide explains the difference between API authorization and authentication, how common designs work, and what developers can do to protect endpoints and data.

## The short answer

- **Authentication (AuthN)** verifies the identity of a user, service, or application.
- **Authorization (AuthZ)** checks whether that authenticated identity may perform a specific action on a specific resource.

A typical API request needs both. First, the API validates the supplied credentials or token. Then it evaluates the identity’s permissions and the requested operation. Authentication without authorization can expose data across users or tenants; authorization without reliable authentication has no trustworthy identity on which to base its decision.

## What API authentication does

API authentication answers: **Who is making this request?** Depending on the system, the identity might be an end user, a backend service, or a client application.

Common authentication approaches include:

- **API keys:** Often identify an application or integration. A key alone does not necessarily identify an individual user, and it should not automatically be treated as proof of a user’s permissions.
- **Session cookies:** Common in browser-based applications. Secure cookie settings and defenses against cross-site request forgery (CSRF) matter when cookies are sent automatically by a browser.
- **Bearer access tokens:** Often issued through an identity provider or an OAuth 2.0 flow. Anyone who possesses a bearer token can generally use it until it expires or is otherwise invalidated, so it must be protected like a credential.
- **Mutual TLS (mTLS):** Uses client certificates to authenticate a client connection, often for service-to-service communication. It does not by itself determine which application actions are permitted.

Authentication is not the same as encryption. TLS protects data in transit and helps authenticate the server to the client, but an API still needs to verify the caller’s credentials or token.

## What API authorization does

API authorization answers: **What may this identity do?** It evaluates an authenticated identity against a requested action, resource, and relevant context.

For example, an API might authenticate a user as `user-42`, then authorize whether that user can read `invoice-917`. The decision may depend on whether the user owns the invoice, belongs to the correct organization, has a required role, or is acting within a permitted workflow.

Common authorization models include:

- **Role-based access control (RBAC):** Permissions are grouped into roles, such as `admin`, `editor`, or `viewer`. Roles can simplify administration, but broad roles can grant more access than a particular task requires.
- **Attribute-based access control (ABAC):** Decisions use attributes of the identity, resource, action, or environment. For instance, a user may edit a record only when they belong to its organization and the record is in a draft state.
- **Relationship-based access control (ReBAC):** Access depends on relationships, such as whether a user owns a document or is a member of a project.
- **Scopes and permissions:** Tokens may carry delegated permissions, such as `invoices:read`. These can limit what a client can request, but an API may still need to check access to each specific invoice.

A system can combine these models. A role may grant the general ability to manage projects, while a resource-level check limits management to projects in the caller’s organization.

## API authorization vs authentication: a comparison

| Question | Authentication | Authorization |
|---|---|---|
| Main purpose | Verify an identity | Decide whether an action is allowed |
| Typical inputs | Password, API key, certificate, session, or token | Identity, action, resource, roles, scopes, attributes, and relationships |
| Common failure | Invalid, expired, or missing credentials | Insufficient permission or access to the requested resource |
| Example | Confirm that a token belongs to a signed-in user | Confirm that the user may delete a particular project |
| Typical HTTP response | `401 Unauthorized` | `403 Forbidden`, or sometimes `404 Not Found` to avoid revealing resource existence |

HTTP status codes are useful signals, not a substitute for careful design. In general, return `401` when valid authentication is missing or cannot be established, and `403` when the caller is authenticated but not permitted. Some APIs return `404` for inaccessible resources to reduce information disclosure; apply that behavior consistently and document it for clients.

## How they work together in an API request

A secure request flow commonly looks like this:

1. **Protect the connection.** Use HTTPS so credentials and data are protected in transit.
2. **Authenticate the caller.** Validate the session, API key, client certificate, or access token.
3. **Build a trusted identity context.** Use verified identity data, not an identity or role supplied directly in an untrusted request field.
4. **Authorize the operation.** Check the requested action against the caller’s permissions and the specific resource.
5. **Perform the operation safely.** Apply the decision at the point where data is accessed or changed, and avoid returning fields the caller is not allowed to see.
6. **Record relevant events.** Log authentication failures and authorization denials without recording secrets such as passwords, full tokens, or private keys.

Authentication at an API gateway can help enforce consistent credential checks, rate limits, or token validation. However, a gateway’s broad check should not replace application-level authorization when the application knows the resource, tenant, or business rules involved.

## Example: a valid token is not enough

Suppose a request includes a valid access token for Alice:

```http
GET /api/invoices/invoice-917
Authorization: Bearer <access-token>
```

The API may successfully authenticate Alice. It must still check whether Alice is allowed to read `invoice-917`. If it returns the invoice merely because the token is valid, another user could change the identifier in the URL and access someone else’s data. This is an example of broken object-level authorization (BOLA), sometimes called an insecure direct object reference.

A safer design scopes the resource lookup to the caller’s authorized data, or explicitly checks access before returning it. For example, in pseudocode:

```text
identity = authenticate(request)
invoice = findInvoiceVisibleTo(identity, request.invoiceId)

if invoice is missing:
    return notFound()

return invoice
```

The key idea is that the lookup itself enforces the relevant ownership or relationship rule. Merely checking that the caller has a general `invoices:read` scope may not be enough to grant access to every invoice.

## Token and permission design choices

### Keep authentication and authorization data distinct

A token can convey identity and authorization-related claims, but claims must be interpreted carefully. A subject identifier may identify the user; a scope or role may express a permission. Neither should be trusted until the token has been validated, and a broad role claim should not silently replace checks for a specific resource.

For signed JWTs, verify the signature using trusted key material and validate relevant claims, such as issuer, audience, and expiration. Select acceptable algorithms from server-side configuration rather than trusting an untrusted token header to dictate validation behavior. A signed JWT is not necessarily encrypted, so avoid putting secrets or sensitive personal data in its payload.

Opaque access tokens are validated through the issuing system or an introspection mechanism, depending on the architecture. Either way, define how expiration, revocation, and key or credential rotation are handled.

### Choose scopes that match client needs

OAuth scopes can express the permissions a client has been granted, such as `projects:read` or `projects:write`. Prefer appropriately narrow permissions over a single all-powerful scope. Scopes commonly describe what a client may do in general; resource ownership and tenant boundaries may still require checks within the API.

### Decide where policy belongs

Centralized policy logic can improve consistency across services, while local checks may be simpler for small systems. Whichever approach you choose, make sure each sensitive endpoint has an explicit authorization decision and that policy changes are tested. Avoid relying on a user interface to hide actions: clients can call API endpoints directly.

## Common security risks

- **Broken object-level authorization:** The API verifies a token but fails to check whether the caller may access the requested record.
- **Broken function-level authorization:** A regular user can call an administrative endpoint because the server checks authentication but not the required permission.
- **Tenant isolation failures:** Queries use a caller-controlled tenant identifier without confirming that the identity belongs to that tenant.
- **Overly broad credentials:** Long-lived API keys or tokens with excessive permissions increase the impact of theft.
- **Trusting client-supplied roles:** A request body, query parameter, or unsigned claim is used as the source of truth for permissions.
- **Inconsistent checks:** One route enforces a policy while another route that accesses the same data does not.
- **Sensitive error messages:** Detailed responses reveal whether a resource exists or disclose internal authorization logic.

These are API security issues, not just identity-provider issues. A correctly authenticated user can still exploit a missing authorization check.

## Security best practices for developers

1. **Require HTTPS** for API traffic and avoid sending credentials in URLs, where they can end up in logs, browser history, or referrer data.
2. **Validate credentials consistently.** Check token signatures or introspection results, issuer, audience, expiration, and other claims relevant to your token format and deployment.
3. **Enforce least privilege.** Issue credentials with only the permissions and lifetime needed for their purpose. Rotate and revoke credentials through a defined process.
4. **Authorize every sensitive operation.** Check the action and the exact resource, including tenant membership and ownership where applicable. Do this on the server for every request.
5. **Deny by default.** An unrecognized identity, missing policy, or absent permission should not result in access being granted.
6. **Use trusted identity context.** Derive user and service identities from validated credentials, not from caller-controlled headers or request fields unless those values are independently verified.
7. **Protect non-browser service credentials.** Store secrets in an appropriate secret-management system, limit who and what can access them, and avoid committing them to source control.
8. **Test negative cases.** Verify that users cannot read, update, or delete another user’s resources, cross tenant boundaries, or call privileged functions. Include tests for missing, expired, and insufficient credentials.
9. **Log decisions safely.** Record enough context to investigate denials and suspicious access patterns, but redact tokens, passwords, and other secrets. Restrict access to security logs.
10. **Review authorization when APIs change.** New routes, bulk operations, alternate formats, and background jobs can create paths that bypass existing checks.

## How to evaluate an API security design

When comparing an implementation approach or API security solution, ask practical questions rather than relying on a label such as OAuth, JWT, or zero trust:

- Does it distinguish authenticating a client from authorizing access to a resource?
- Can it enforce both broad permissions and resource-level or tenant-level rules?
- How are token validation, expiration, revocation, and key rotation handled?
- Are authorization checks consistent across services and API versions?
- Can developers test allowed and denied cases, and can operators investigate decisions without exposing secrets?
- Does the approach fit the application’s identity provider, deployment model, and operational requirements?

No single authentication mechanism supplies every authorization rule. Choose components based on the identities involved, the sensitivity of the data, and where the API can reliably evaluate access policies.

## FAQ

### Can an API authenticate a request without authorizing it?

Yes. Authentication can establish a caller’s identity without granting access to a particular action or resource. A valid token should not be treated as blanket permission to use every endpoint or retrieve every record.

### Are API keys authentication or authorization?

Usually, an API key identifies or authenticates an application or integration. It may be associated with permissions, but possession of the key should not automatically grant unrestricted access. Use narrowly scoped keys, protect them as secrets, and apply appropriate authorization checks.

### Does a JWT handle both authentication and authorization?

A JWT is a token format, not a complete security policy. After validating it, an API may use its subject claim to establish an identity and its scope or role claims as inputs to authorization. The API still needs to verify access to the requested action and resource.

### Should an API return 401 or 403 for denied access?

Use `401` when the request lacks valid authentication, and generally use `403` when an authenticated caller lacks permission. Some APIs use `404` to conceal the existence of a resource from unauthorized callers. Choose behavior deliberately and keep it consistent.

### Are OAuth scopes enough to prevent access to another user’s data?

Not necessarily. A scope can allow a client to read a category of data, but the API may still need to verify that the authenticated user can access the specific object and tenant requested.

## Conclusion

API authentication establishes who is calling; API authorization determines what that caller may do. Both are essential, and neither replaces the other. Validate credentials and tokens carefully, grant only the permissions needed, and enforce authorization on every sensitive operation—including access to individual records and tenant data. Treating identity and access as separate checks is a foundational API security best practice and helps prevent valid credentials from becoming a path to unauthorized data.
