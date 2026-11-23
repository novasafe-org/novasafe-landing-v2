# OWASP API Security Risks Explained

APIs connect applications, services, and data—but they also expose functionality that attackers can probe and abuse. A valid login does not guarantee that a caller can access the right records, perform the right actions, or use an endpoint without limits. Effective API security depends on controlling all three.

The OWASP API Security Top 10 is a useful guide to common API risk areas. It helps developers identify weaknesses in authorization, authentication, business logic, configuration, and third-party integrations. It is a risk-awareness resource, not a complete security standard or a substitute for threat modeling.

This guide explains the risks in the OWASP API Security Top 10 (2023), shows how they differ, and offers criteria for choosing defensive designs that fit your API.

## What is the OWASP API Security Top 10?

The OWASP API Security Top 10 is a list of categories that describe important API security risks. The 2023 edition includes ten categories, from broken object-level authorization to unsafe consumption of APIs. The categories can overlap: one attack may exploit weak authorization and excessive resource use together.

The list is most useful when applied to real application flows. For each endpoint, ask:

- Who can call it, and how is the caller authenticated?
- Which objects and properties can that caller access or change?
- What actions are allowed for that caller and object?
- What limits apply to requests and business operations?
- Which systems does the endpoint trust or call?

## The OWASP API Security risks

### 1. Broken Object Level Authorization (BOLA)

BOLA occurs when an API fails to verify that a caller is allowed to access a particular object. A user may be authenticated and permitted to use an endpoint, but still be able to retrieve another user’s invoice by changing an ID in the request.

For example, `GET /invoices/4821` must check whether the authenticated user can access invoice 4821. It is not enough to check that the user has a valid session or that the invoice ID exists. Sequential IDs are not the underlying problem; missing object-level authorization is.

**Defensive design:** Apply authorization at the point where the object is fetched or changed. Scope database queries to the caller’s permissions where possible, and test with accounts that should not have access to one another’s data. Do not rely on hiding identifiers or checking permissions only in the user interface.

### 2. Broken Authentication

Broken authentication covers weaknesses in proving and maintaining caller identity. Examples include insecure credential handling, weak session management, inadequate token validation, and authentication flows that make account takeover easier.

**Defensive design:** Use established identity and token libraries, validate token signature and relevant claims, set appropriate expiration and revocation behavior, and protect credentials in transit and at rest. Add stronger verification for sensitive actions where the threat model warrants it. Authentication answers “who is calling?”; it does not answer “what may they do?”

### 3. Broken Object Property Level Authorization (BOPLA)

BOPLA concerns authorization at the level of individual object properties. An API may return fields a caller should not see, or accept changes to fields the caller should not control. This category brings together concerns often described as excessive data exposure and mass assignment.

For example, a profile update endpoint should not let a user set their own `role` or `account_status` simply because those properties are accepted by a general-purpose model binder.

**Defensive design:** Define explicit response schemas and writable fields for each operation. Use request and response data-transfer objects rather than exposing database models directly. Test both the fields returned and the fields accepted, including unexpected and privileged properties.

### 4. Unrestricted Resource Consumption

An API can be abused when requests consume excessive compute, memory, bandwidth, storage, or paid downstream services. Large uploads, expensive searches, unbounded pagination, and repeated resource-intensive actions can cause service degradation or unexpected costs.

**Defensive design:** Set limits based on the operation: request size, page size, execution time, concurrent work, and per-caller or per-tenant usage. Apply rate limits and quotas where they meaningfully control risk. A single request-per-second limit is not sufficient if requests have very different costs. Monitor rejections and resource use so that limits can be tuned without hiding normal failures from users.

### 5. Broken Function Level Authorization (BFLA)

BFLA occurs when a caller can invoke a function they should not be allowed to use. For example, a regular user may reach an administrative endpoint because the API checks only for a valid login, or because authorization rules are inconsistently applied across routes.

**Defensive design:** Deny access by default and enforce permissions on the server for every operation. Use clear role, permission, or policy checks, and test each function with multiple user types. Do not treat an obscure URL or an undocumented endpoint as a security control.

### 6. Unrestricted Access to Sensitive Business Flows

Some API operations are valid and authorized individually but can be abused at scale or in an unintended sequence. Examples may include reservation attempts, account registrations, promotional redemptions, or ticket purchases. The issue is not necessarily a technical vulnerability in one endpoint; it may be that the business flow lacks controls against automation or misuse.

**Defensive design:** Identify flows with meaningful financial, operational, or user impact. Add controls suited to the flow, such as per-account limits, queueing, verification, or anomaly review. CAPTCHAs and similar challenges can add friction but are not universal defenses; consider accessibility, bypass risk, and the cost of false positives.

### 7. Server-Side Request Forgery (SSRF)

SSRF arises when an API makes a server-side request to a destination influenced by a caller, and that request can reach systems or data the caller should not access. Features such as URL previews, webhook testing, and remote file imports can create this risk.

**Defensive design:** Prefer allowlists of required destinations over accepting arbitrary URLs. Validate destinations after parsing, account for redirects, and restrict outbound network access so application servers cannot freely reach sensitive internal services. URL validation alone is difficult to get right, so combine it with network-level controls and careful handling of DNS resolution.

### 8. Security Misconfiguration

Misconfiguration includes insecure defaults and deployment mistakes: overly permissive cross-origin settings, unnecessary services, verbose error responses, exposed debug interfaces, or inconsistent security settings between environments.

**Defensive design:** Keep configuration versioned and reviewable, use secure defaults, remove unused endpoints and services, and avoid returning stack traces or secrets to clients. Check production settings as part of deployment and periodically verify that infrastructure and application configurations remain aligned.

### 9. Improper Inventory Management

Teams cannot protect APIs they do not know exist. Old versions, forgotten test environments, undocumented endpoints, and third-party-facing interfaces may remain accessible after their owners assume they have been retired.

**Defensive design:** Maintain an inventory of API hosts, versions, owners, environments, and data sensitivity. Make deprecation and retirement explicit, communicate changes to consumers, and verify that retired endpoints are actually disabled. Discovery should include gateways, cloud deployments, and services that may not be routed through the primary gateway.

### 10. Unsafe Consumption of APIs

An application that consumes another API may trust its responses too much. A third-party or internal service can return malformed, unexpected, or malicious data, and the consuming application may process it unsafely. Encryption or a trusted network does not make returned content inherently safe.

**Defensive design:** Validate and constrain responses against expected schemas, handle errors and timeouts, and avoid passing untrusted values directly into sensitive operations. Keep dependencies and integrations inventoried, and apply appropriate network and access controls to outbound calls.

## Choosing the right defensive approach

The best design depends on what the endpoint does, what data it handles, and how costly misuse would be. A useful starting point is to separate controls by the question they answer:

| Security question | Example controls | Main tradeoff |
| --- | --- | --- |
| Is the caller who they claim to be? | Session or token validation, strong credential handling | More verification can add user and operational friction |
| May this caller perform this action on this object? | Object- and function-level authorization, policy checks | Fine-grained rules take effort to model and test |
| Which data may they read or change? | Explicit schemas, property allowlists | Separate schemas require maintenance as APIs evolve |
| How much work may they cause? | Quotas, rate limits, payload and query limits | Strict limits can block legitimate bursts or large workloads |
| Which destinations and integrations are trusted? | Destination allowlists, egress controls, response validation | Allowlist changes and integration failures require operational handling |

Use layered controls rather than relying on one safeguard. For example, a gateway can apply broad rate limits and authentication checks, while the application enforces object permissions and business rules. A gateway usually cannot infer every relationship between a user, an object, and a business operation.

For each API operation, document its caller, permission, data fields, resource cost, and dependencies. Then prioritize controls according to the consequences of unauthorized access or abuse. Sensitive administrative actions may need stricter authorization and auditing than a public read-only endpoint. A public endpoint can still need resource limits and careful input handling.

## Practical testing recommendations

Build security tests around expected denials, not only successful requests. For example:

1. Create two users with separate records and confirm each cannot read or modify the other’s records.
2. Try privileged operations as an ordinary user and verify they are rejected server-side.
3. Submit unexpected properties in update requests and check that protected fields remain unchanged.
4. Exercise pagination, uploads, and expensive searches at and beyond documented limits.
5. Test malformed or unexpected responses from dependencies, along with timeouts and failures.
6. Review deployed API versions and environments against the API inventory.

Automated tests can cover repeatable authorization and validation rules, while manual review helps uncover business-flow abuse and assumptions not captured in code. Include security checks in development and release workflows, and re-test when routes, data models, permissions, or integrations change.

## FAQ

### Is the OWASP API Security Top 10 a checklist?

It is a useful starting point for finding risk areas, but it is not a complete checklist or proof that an API is secure. Adapt it to the application’s data, users, architecture, and business flows.

### What is the difference between BOLA and BFLA?

BOLA is about whether a caller may access a particular object. BFLA is about whether a caller may invoke a particular function. An API can have one problem without the other, so test both.

### Are API gateways enough to prevent API security risks?

No. Gateways can help with shared controls such as routing, authentication integration, and traffic limits. Application code still needs to enforce data- and business-specific authorization, validate properties, and handle dependencies safely.

### Should every API use the same rate limit?

Not necessarily. Operations have different costs and abuse potential. Set limits based on endpoint behavior, caller or tenant needs, and service capacity, then monitor their effect on legitimate traffic.

## Conclusion

The OWASP API Security risks describe common ways APIs fail to protect identities, objects, functions, data, resources, and integrations. Developers can use the categories to structure reviews, but effective defense comes from applying controls at the right layer: authenticate callers, authorize every action and object, constrain accepted and returned data, limit costly operations, and treat external responses as untrusted.

Start with the API inventory and the operations that have the greatest impact. Test both allowed and denied behavior, and revisit those tests whenever the API or its dependencies change.
