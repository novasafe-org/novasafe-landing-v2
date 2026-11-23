# Broken Function Level Authorization

An API can correctly identify a user and still let that user perform actions they should not be allowed to perform. For example, a regular account might be able to call an administrative endpoint simply by discovering its URL or changing an HTTP method. This is the core risk behind **broken function level authorization (BFLA)**.

BFLA is an authorization flaw in which an API does not adequately restrict access to a function or operation based on the caller’s permissions. Developers can reduce the risk by defining access rules for every operation, enforcing them on the server, and testing those rules independently of the user interface.

## What is broken function level authorization?

Authorization answers the question: **Is this authenticated caller allowed to perform this action?** Function-level authorization applies that question to an API operation, such as creating a user, exporting records, changing account settings, or deleting a resource.

A function is not limited to a named application feature. It may be represented by a route and HTTP method, a GraphQL mutation or resolver, an RPC method, or a background operation exposed through an API. If a caller can invoke an operation that should be restricted to another role or permission set, the API may have a function-level authorization weakness.

Authentication and authorization are different controls:

- **Authentication** establishes who or what is making a request.
- **Authorization** determines which actions that identity may perform.

A valid login, API key, or token does not imply permission to use every function in the API.

## How BFLA happens

Authorization gaps often arise when access rules are implicit rather than consistently enforced. Common causes include:

- **Relying on the UI to hide privileged actions.** A hidden button does not prevent a caller from sending a request directly.
- **Applying checks to only some routes.** A team might protect `GET /admin/reports` but forget to protect a related export or update endpoint.
- **Assuming a route is safe because it is difficult to guess.** Undocumented or obscure endpoints are still reachable if a caller discovers them.
- **Checking authentication but not permissions.** Middleware that verifies a token may allow any authenticated user through.
- **Using broad role checks inconsistently.** Different services or route handlers may interpret a role differently, or fail to check it at all.
- **Forgetting alternate ways to reach the same operation.** A function may be exposed through another route, HTTP method, GraphQL field, or API version.
- **Trusting client-controlled role or permission data.** Authorization decisions must use trusted, server-validated identity and policy data.

An API gateway can provide useful controls, but it should not be the only place where sensitive functions are protected. Requests may reach services through internal paths, alternate gateways, or other integrations. Each service should enforce the permissions required for its operations.

## Practical risks

The impact depends on what the exposed function can do and what data or systems it can reach. BFLA can allow an unauthorized caller to:

- Create, disable, or delete accounts.
- Change organization-wide settings or access controls.
- Export sensitive data or trigger privileged reports.
- Perform administrative actions, such as issuing invitations or managing users.
- Invoke operational functions that affect availability or business processes.

The key issue is not whether the endpoint is visible. It is whether the server permits a caller to execute a function without the required authority. A successful request may create confidentiality, integrity, or availability risks depending on the operation.

## BFLA versus broken object level authorization

Function-level and object-level authorization are related but distinct API security checks:

- **BFLA:** Can this caller perform this kind of operation? For example, may this user create new organization members?
- **Broken object level authorization (BOLA):** Can this caller perform the operation on this specific object? For example, may this user read this particular member record?

An endpoint may require both checks. A user could be permitted to edit projects in general but only projects belonging to their organization. The API should authorize the function and scope the target object to the caller’s permitted resources.

## Example: protecting an administrative function

Suppose an API exposes an endpoint for suspending a user:

```http
POST /api/users/123/suspend
Authorization: Bearer <token>
```

Checking only that the token is valid is insufficient if suspension is restricted to administrators or designated support staff. The server should verify a permission appropriate to the operation, then separately verify that the caller may act on the target user.

A simplified Express example might look like this:

```javascript
function requirePermission(permission) {
  return (req, res, next) => {
    // `req.user` must be set by trusted authentication middleware.
    if (!req.user?.permissions?.includes(permission)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

app.post(
  "/api/users/:userId/suspend",
  authenticate,
  requirePermission("users:suspend"),
  async (req, res) => {
    const target = await users.findById(req.params.userId);

    if (!target || !canManageUser(req.user, target)) {
      return res.status(404).json({ error: "Not found" });
    }

    await users.suspend(target.id);
    return res.status(204).end();
  }
);
```

This is illustrative, not a drop-in authorization system. In a real application, identity data and permissions should come from trusted server-side authentication and policy components, and `canManageUser` should implement the application’s documented access rules. Returning `404` rather than `403` for inaccessible objects may be appropriate in some APIs to avoid revealing their existence, but the choice should be consistent and should not replace the authorization check.

## Defensive design recommendations

### 1. Define permissions around actions

Document which identities can perform which operations. Use permissions that describe meaningful actions, such as `users:invite`, `billing:update`, or `reports:export`, rather than relying on vague assumptions about what a role can do.

Roles can still be useful: they can group permissions for easier administration. The important requirement is that the API evaluates an explicit, trusted authorization policy for each protected function. Avoid treating a client-supplied role name as proof of permission.

### 2. Deny by default

Every operation should require an explicit authorization decision. If a policy is missing, cannot be loaded, or returns an error, the safe default for a protected function is to deny the request rather than allow it. Be especially cautious with new routes and newly added methods: they should not inherit access accidentally.

### 3. Enforce authorization on the server

Client-side controls improve usability but are not security boundaries. Enforce permissions in server-side middleware, service-layer policies, or another trusted component that all relevant request paths must use. Keep the check close enough to the operation that alternate entry points cannot bypass it.

### 4. Review routes, methods, and alternate interfaces

Maintain an inventory of API operations and their required permissions. Review each route and method, including administrative, internal, legacy, and versioned endpoints. For GraphQL, apply authorization to fields and mutations where appropriate; protecting only the overall GraphQL endpoint does not decide which operations a caller may invoke.

### 5. Check the target object as well as the function

A caller with permission to perform an action may still be restricted to certain tenants, teams, or records. Scope database queries and service calls to the caller’s authorized resources, and test cross-tenant access explicitly. Do not assume that a function-level permission also grants access to every object.

### 6. Make policy behavior consistent

Centralized policy helpers or a shared authorization layer can reduce inconsistent checks across handlers. Keep the policy understandable, reviewable, and suitable for the needs of the application. Avoid a single broad “admin” bypass when different administrative tasks require different levels of access.

### 7. Audit sensitive authorization decisions

For high-impact actions, record useful audit details such as the acting identity, attempted operation, target, outcome, and timestamp, while avoiding unnecessary sensitive data in logs. Monitor repeated denied requests and unusual access patterns. Logs support investigation; they do not substitute for enforcement.

## How to test for BFLA

Test authorization as a matrix of identities and operations, not just as a happy-path check for one administrator. For each protected function, verify that:

1. An unauthenticated request is rejected when authentication is required.
2. An authenticated caller without the required permission is denied.
3. A caller with the required permission can perform the allowed operation.
4. A caller with the function permission cannot access objects outside their permitted scope.
5. Alternate HTTP methods, API versions, and interfaces do not expose an unprotected path.
6. Permission changes and revoked access take effect according to the application’s token and policy design.

Automated integration tests can make these expectations concrete. For example, create a regular-user test identity and assert that a request to an administrative operation returns the documented denial response, then repeat with an authorized identity. Include tests for tenant boundaries where applicable.

During security reviews, inspect the API specification and compare it with the deployed routes. Manual testing tools can help send requests under different identities, but only test systems you are authorized to assess. Do not treat a successful `403` test on one endpoint as evidence that every function is protected.

## Common implementation pitfalls

- **Protecting only the frontend:** An attacker can call the API without using the interface.
- **Using authentication middleware as authorization:** A valid token establishes identity, not permission for every action.
- **Checking roles in only one layer:** Different entry points may bypass the check unless policy enforcement is consistent.
- **Trusting endpoint names or obscurity:** Naming a route `/internal` or keeping it out of documentation does not secure it.
- **Assuming read and write access are equivalent:** List, export, update, and delete operations may require different permissions.
- **Ignoring errors in policy evaluation:** A policy-service failure should not silently turn into an allow decision for sensitive operations.
- **Testing only the expected role:** Negative tests are essential for confirming that unauthorized identities are denied.

## FAQ

### Is broken function level authorization the same as broken access control?

BFLA is a specific kind of access-control weakness: the API permits a caller to invoke a function they are not authorized to use. The broader term broken access control covers other authorization failures too, including access to objects outside a caller’s permitted scope.

### Does requiring a login prevent BFLA?

No. Login or token validation provides authentication. The API must still check whether the authenticated identity has permission for the requested function and, where relevant, the specific target object.

### Are hidden or undocumented endpoints protected?

No. An endpoint should be considered reachable if a caller can send a request to it. Use explicit server-side authorization rather than relying on secrecy, unusual URLs, or a hidden user-interface control.

### Should authorization be implemented in middleware or business logic?

Either can be part of a sound design if the check is enforced consistently and cannot be bypassed. Middleware can handle common permission checks, while service or domain logic may be needed for context-dependent rules such as tenant membership or ownership. Many APIs need both.

### How is BFLA different from BOLA?

BFLA concerns permission to perform a type of operation. BOLA concerns permission to access or act on a particular object. A secure API often needs to check both.

## Conclusion

Broken function level authorization occurs when an API lets a caller execute a function without the required permission. Prevent it by documenting access rules, denying access by default, enforcing authorization on the server, and testing both permitted and denied cases across routes and objects. Treat every API operation as an explicit security decision—not as safe merely because it is authenticated, hidden, or intended for a particular user interface.
