# Insecure Direct Object Reference Explained

A user opens an invoice in a web application at `/invoices/1042`. If changing `1042` to `1043` lets that user view someone else’s invoice, the application has an access-control problem—not merely a guessable ID.

An **insecure direct object reference (IDOR)** occurs when an application uses a client-supplied reference to find an object but fails to verify that the current user is allowed to perform the requested action on it. The reference might be an integer in a URL, a UUID in a JSON body, a filename, or an identifier sent to an API. The core issue is missing or inadequate authorization.

For developers, the practical question is not whether an identifier is easy to guess. It is whether every request that reads or changes a protected object checks the requester’s permission. This guide explains common failure modes, a safe way to assess them, and safeguards that fit typical applications.

## What is an insecure direct object reference?

A direct object reference is a value the application uses to locate a specific resource. Examples include:

- `/api/users/42`
- `/documents/9f3a...`
- A JSON field such as `{"invoiceId": "1042"}`
- A storage key or filename used to retrieve an upload
- An object identifier in a GraphQL query or batch request

A reference becomes insecure when the server trusts that value without enforcing the relevant access policy. For example, authentication can establish that a request belongs to Alice, but it does not automatically establish that Alice may read invoice 1042.

IDOR is often discussed as a form of broken access control. It can expose data, allow unauthorized changes, or enable actions such as deleting another user’s records. The same underlying flaw can affect web pages, APIs, mobile back ends, and internal services.

## How an IDOR vulnerability works

Consider an endpoint that returns an invoice based only on its identifier:

```js
app.get('/api/invoices/:invoiceId', requireAuth, async (req, res) => {
  const invoice = await Invoice.findById(req.params.invoiceId);

  if (!invoice) {
    return res.sendStatus(404);
  }

  return res.json(invoice);
});
```

The route requires a logged-in user, but the database lookup does not connect the invoice to that user or check another permission. If a logged-in user can change `invoiceId` and receive a different user’s invoice, the endpoint has an IDOR.

A safer design scopes the lookup to records the requester is allowed to access. For an application where invoices belong to individual users, that might look like:

```js
app.get('/api/invoices/:invoiceId', requireAuth, async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.invoiceId,
    ownerId: req.user.id
  });

  if (!invoice) {
    return res.sendStatus(404);
  }

  return res.json(invoice);
});
```

This example assumes ownership is the complete access policy. Real applications may need to account for roles, delegated access, support workflows, or organization membership. The important property is that the server enforces the intended policy for the requested object and action.

## Common failure modes

### Trusting authentication to provide authorization

A login check answers “Who is making this request?” Authorization answers “May this user perform this action on this object?” Requiring a valid session or token is not enough if the application then accepts any object ID.

### Checking access in the interface, not the server

Hiding a link or disabling a button can improve the user experience, but it does not protect an endpoint. A user can send a request directly, modify its parameters, or use a different client. Enforce access rules on the server for every request.

### Applying checks to reads but not writes

A page may correctly restrict viewing while an update, delete, download, or sharing endpoint fails to do the same. Check authorization for each operation, including less obvious actions such as changing ownership, exporting data, or triggering a workflow.

### Assuming unguessable identifiers solve the problem

UUIDs and other high-entropy identifiers can make opportunistic discovery harder, but they are not authorization controls. IDs can leak through links, logs, browser history, referrers, shared screenshots, or other application features. Continue to check permissions even when identifiers are difficult to guess.

### Checking a parent object but not a nested object

An endpoint might verify that a user can access a project, then accept an arbitrary task ID from the request and update that task without confirming that it belongs to the project. Validate relationships between every referenced object, not just the first one.

### Relying on client-supplied ownership or tenant fields

Fields such as `userId`, `ownerId`, and `tenantId` should not be trusted merely because they appear in a request body. Derive identity and membership from trusted server-side authentication and authorization context, then apply them when querying or modifying records.

### Overlooking alternate entry points

The same object may be reachable through a REST route, GraphQL resolver, export job, file download, mobile API, or administrative workflow. Review all paths that access the object, including batch operations and background jobs that act on a user’s behalf.

## How to assess for IDOR

Only test systems you own or have explicit permission to assess. Use test accounts and non-production data where possible, and avoid changing or exposing real users’ information.

1. **Map object references.** Review routes, API schemas, forms, and client requests for IDs, filenames, slugs, and other values that select an object. Include read, update, delete, download, and sharing operations.
2. **Write down the access policy.** For each operation, identify who should be allowed to act and under what conditions. Consider ownership, roles, organization membership, delegated access, and object state.
3. **Create separate test identities.** For example, create User A and User B, each with a separate record. If the application is multi-tenant, create users in separate test tenants too.
4. **Compare authorized and unauthorized requests.** Confirm that User A can access their own object. Then, while authenticated as User A, substitute User B’s test object reference. Repeat for each relevant operation and API route.
5. **Test relationships and edge cases.** Try mismatched parent and child IDs, records from another tenant, batch requests containing mixed ownership, and objects that are deleted or no longer shared.
6. **Record the result and fix the server-side check.** Note the affected operation, object type, and expected policy. Retest the allowed and denied cases after the change.

A useful test matrix might look like this:

| Requester | Object | Expected result |
| --- | --- | --- |
| User A | User A’s invoice | Allowed, if policy permits |
| User A | User B’s invoice | Denied |
| Tenant A member | Tenant B’s project | Denied, unless explicitly shared |
| Unauthenticated user | Private document | Denied |
| User A | User B’s invoice in a batch request | That item is denied or omitted according to a documented policy |

Automated tests can make these checks repeatable. For example, an integration test should create two users and two invoices, authenticate as one user, and assert that the other user’s invoice cannot be retrieved or modified. Test the response and the data state: a denied update must not have changed the record.

## Practical safeguards

### Enforce object-level authorization on the server

Perform a permission check for the specific object and requested action. Depending on the application, this can be implemented through a policy layer, service method, or scoped database query. Keep the rule close to the operation so alternate routes cannot accidentally bypass it.

For example, in a multi-tenant application, a query might include the tenant derived from the authenticated user:

```js
const project = await Project.findOne({
  _id: req.params.projectId,
  tenantId: req.user.tenantId
});
```

This is appropriate only if tenant membership is sufficient for the requested action. If access is limited to project members or particular roles, include those checks too. Do not take the trusted tenant identity from an unvalidated request parameter.

### Check authorization for every action and reference

Reading, editing, deleting, downloading, exporting, and sharing can each have different rules. If a request contains multiple object references, authorize each one. For nested resources, verify both the parent-child relationship and the requester’s permission to act on the relevant objects.

### Use safe query patterns

Where practical, combine the object identifier and access scope in the lookup rather than fetching an unrestricted record and relying on a later check that may be forgotten. For more complex rules, use a centralized authorization policy and make failures explicit. Avoid mass assignment: allow only intended fields to be updated, and do not let clients change protected ownership or tenant fields through ordinary update requests.

### Handle denial consistently

An application may return `403 Forbidden` when a resource exists but the user lacks permission, or `404 Not Found` to avoid confirming that a particular resource exists. Either can be appropriate depending on the product and threat model. Apply the chosen behavior consistently, and do not include protected object data in error messages.

### Protect files and indirect access paths

A protected page does not secure a file if the file is available at a public storage URL. Check authorization when issuing downloads or use storage controls appropriate to the application. Review generated links, exports, previews, and background jobs as part of the object’s access paths.

### Log useful events without leaking sensitive data

Security logs can help investigate repeated denied access attempts. Record relevant context, such as the authenticated account, action, and outcome, while following the application’s privacy and data-retention requirements. Avoid logging secrets, full sensitive documents, or tokens.

### Add regression tests and review coverage

Keep tests for both permitted and denied access. Include role and tenant boundaries, nested objects, and important alternate endpoints. During code review, look for client-controlled identifiers and ask where the corresponding server-side authorization decision occurs.

## Security considerations and trade-offs

Authorization should reflect the product’s actual access model. A simple owner check may be correct for a personal notes app but insufficient for an organization with shared projects, delegated administration, or support staff. Define policy explicitly before implementing checks; otherwise, a fix can block legitimate workflows or leave exceptions unprotected.

Avoid treating identifier replacement as the only assessment method. Review code and API behavior for missing checks, and test different object types and operations. Also consider race conditions and state changes: for sensitive operations, authorization should be evaluated as part of the operation using current, trusted state.

Finally, do not rely on obscurity, frontend behavior, or a single global role check as substitutes for object-level authorization. These measures can complement a sound design, but the server must decide whether the requester can perform the requested action on the specific object.

## FAQ

### Is an IDOR the same as broken access control?

IDOR is a common example of broken access control: a request references an object, and the application does not adequately verify the requester’s permission for it. The term describes a pattern; the underlying issue is the authorization failure.

### Are UUIDs enough to prevent IDOR?

No. UUIDs may be harder to guess than sequential IDs, but they do not prove that a requester is authorized. Check permissions for every object and operation regardless of how the reference is generated.

### Can an IDOR affect data even if the application requires login?

Yes. Authentication identifies the user; it does not automatically grant access to every object. A logged-in user may still be able to access another user’s data if object-level authorization is missing.

### Should unauthorized requests return 403 or 404?

Both responses can be valid. Use `403` when the application can safely state that access is forbidden, or `404` when concealing the object’s existence is appropriate. The authorization check matters more than the specific status code; keep behavior consistent and avoid leaking protected information.

### What should developers test after fixing an IDOR?

Test that authorized users can still perform permitted actions, unauthorized users are denied, denied writes do not change data, and the same rules apply across related routes, nested objects, downloads, and batch operations.

## Conclusion

An insecure direct object reference is not caused simply by putting an ID in a URL. It occurs when a server uses a user-controlled reference without checking whether that requester may access or change the referenced object. Assess the application’s access rules, test with separate identities, and enforce authorization for each object and action on the server. Treat identifier complexity as a design choice—not a replacement for access control—and add regression tests so the boundary remains intact as the application evolves.
