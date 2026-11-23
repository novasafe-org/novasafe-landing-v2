# Broken Object Level Authorization Testing

An API can authenticate a user correctly and still expose another person’s data. This happens when the server accepts a request for an object—such as an invoice, project, or profile—without checking whether the authenticated user may access that specific object. Testing for this flaw is a core part of API security work.

This guide presents a practical workflow for **broken object level authorization testing** in an environment you own or are explicitly authorized to assess. It covers test setup, request manipulation, evidence collection, common pitfalls, and remediation. The same underlying issue is often called insecure direct object reference (IDOR); BOLA is the API-focused term used by OWASP.

## What broken object level authorization means

Object level authorization answers a specific question: **may this user perform this action on this particular object?** Authentication establishes who is making a request. General authorization may determine which features a user can use. Object-level authorization must also account for the requested record and the user’s relationship to it.

For example, an API might expose:

```text
GET /api/invoices/INV-1042
```

A logged-in user may be allowed to view their own invoices. If the server returns invoice `INV-1042` to a different user merely because that user changed the identifier in the URL, the endpoint has a BOLA vulnerability.

Identifiers can be sequential numbers, UUIDs, slugs, or values in request bodies and headers. Making identifiers difficult to guess can reduce casual discovery, but it is not an authorization control. The server must enforce access rules for every relevant operation.

## Prepare a safe test environment

Use a staging system, local development environment, or approved test tenant. Confirm the scope, accounts, test data, and permitted actions before sending requests. Do not probe other people’s accounts or production records without explicit authorization.

Create at least two test users with distinct access contexts:

- **User A** owns object A, such as a test invoice.
- **User B** owns object B and does not have access to object A.
- If relevant, create a third user who shares a project or belongs to another tenant.

Record each user’s role, tenant, and intended relationships to the test objects. Keep test data clearly identifiable and avoid destructive actions unless the assessment explicitly permits them.

## A practical BOLA testing workflow

### 1. Inventory object-bearing endpoints

Review API documentation, application routes, frontend network traffic, and source code where available. Look for endpoints that read, create, update, delete, export, or act on records. Object references may appear in:

- URL paths, such as `/users/123` or `/orders/abc`.
- Query parameters, such as `?account_id=...`.
- JSON request bodies, such as `{"project_id":"..."}`.
- Nested routes, such as `/teams/7/members/19`.
- GraphQL arguments or identifiers embedded in input objects.

Build a small endpoint inventory that records the HTTP method, object type, identifier location, expected roles, and expected access rule. Include less obvious operations such as downloads, exports, attachments, and bulk actions.

### 2. Establish legitimate baseline behavior

Authenticate as User A and request an object A is allowed to access. Then repeat the equivalent request as User B for object B. Save the status code, response body, relevant headers, and any observable state changes.

For a local or approved test system, a baseline request might look like this:

```bash
curl -i 'http://localhost:3000/api/invoices/INV-A' \
  -H 'Authorization: Bearer USER_A_TEST_TOKEN'
```

Use the corresponding test token and object for User B. Baselines help distinguish an authorization failure from a malformed request, missing record, expired token, or unrelated server error.

### 3. Substitute the object identifier

Keep User B’s valid authentication context, but request object A. Change only the object reference so that the test isolates the access-control decision:

```bash
curl -i 'http://localhost:3000/api/invoices/INV-A' \
  -H 'Authorization: Bearer USER_B_TEST_TOKEN'
```

Compare the result with the baseline. A secure response should not disclose object A’s protected data or permit an unauthorized action. Depending on the API’s design, the server may return `403 Forbidden` or `404 Not Found`; either can be appropriate. A status code alone is not enough to conclude that access is correctly enforced. Inspect the body, headers, and side effects as well.

### 4. Test each operation and identifier location

Authorization may be implemented inconsistently across routes and methods. For each relevant object type, test the operations that the API supports:

| Operation | Example test | What to verify |
|---|---|---|
| Read | Request another user’s record | No protected fields or related data are disclosed |
| Update | Change a field on another user’s record | The record remains unchanged and no unauthorized effect occurs |
| Delete | Attempt to remove another user’s record | The record and dependent resources remain intact |
| Create or attach | Submit another user’s object ID in a body | The new resource cannot be linked to an unauthorized object |
| Export or download | Request another user’s file or export | The file contents and metadata are not accessible |
| Bulk action | Include mixed authorized and unauthorized IDs | Unauthorized items are rejected or safely excluded according to policy |

Repeat the identifier substitution in path parameters, query strings, bodies, nested routes, and GraphQL inputs where applicable. For update tests, use a harmless field and restore the test data afterward if necessary. Do not assume that a route is safe because its read operation is protected; each action needs the appropriate check.

### 5. Check relationship and tenant boundaries

Ownership is not always the complete rule. A user may access a project through membership, a support role, or an organization relationship. Test realistic boundary cases, such as:

- A user who has no relationship to the object.
- A user who belongs to the same tenant but not the same project.
- A user with a legitimate shared relationship but limited permissions.
- A user whose membership has been revoked.
- A user with a different role or account status.

Confirm that the observed behavior matches the product’s documented policy. A test should identify the authorization rule being evaluated, not assume that every cross-user request must be denied.

### 6. Look for indirect data exposure and side effects

A denied response can still leak information. Check whether error messages, response sizes, timing, or metadata reveal sensitive details beyond what the API intends to expose. Inspect related endpoints for the same object, including comments, activity logs, attachments, notifications, and child records.

For state-changing requests, verify the object after the attempt using an authorized account or a controlled test database. A `403` response does not prove that no change occurred if the server performed the action before returning an error. Check for emails, webhooks, queued jobs, or other effects when they are in scope.

## Automate repeatable checks

A small test matrix can make manual testing easier to repeat. For example, store test cases as pairs of a user token and object ID, then assert that each user receives the expected result for each object. Avoid hard-coding real credentials; use environment variables or your test framework’s secret-management mechanism.

A useful automated test should verify more than the status code. It can assert that:

1. The owner can perform the expected action.
2. An unrelated user cannot access the object’s protected fields.
3. An unauthorized update does not change persisted data.
4. A user with a valid shared relationship receives only the access allowed by policy.

Run these checks in continuous integration against seeded test data where practical. Keep fixtures isolated so test order does not affect the result, and clean up data created during the test. Avoid running state-changing checks against production unless they are specifically approved and safely controlled.

## Common testing pitfalls

- **Using a nonexistent identifier:** A `404` for a missing record does not establish how the API treats an existing record owned by another user. Use controlled objects whose existence is known.
- **Changing several variables at once:** If the token, method, body, and identifier all change, it is harder to identify why the response changed. Start with one controlled substitution.
- **Treating UUIDs as protection:** Unpredictable IDs do not replace server-side authorization checks.
- **Testing only the user interface:** A hidden button is not an access-control boundary. Test the API directly with authorized test credentials.
- **Checking only reads:** Create, update, delete, export, and bulk operations can have separate authorization gaps.
- **Trusting a status code:** Inspect returned data and verify state changes, especially for mutations.
- **Ignoring legitimate sharing:** Access may be allowed through a team, tenant, or delegated relationship. Compare results with the intended policy.

## Remediation: enforce authorization at the data boundary

The server should derive the acting user from the authenticated session and enforce the object-level policy on every request. Do not trust a client-supplied owner ID, tenant ID, or role as proof of permission.

A common design is to scope the lookup to resources the current user is permitted to access, then perform the action only on a matching record. For example, instead of loading any invoice by ID and relying on a later check, a service can query for the invoice within the user’s authorized scope. The exact scope depends on the application’s ownership and sharing rules.

Illustrative pseudocode:

```javascript
async function getInvoiceForUser(user, invoiceId) {
  const invoice = await invoices.findOne({
    id: invoiceId,
    tenantId: user.tenantId
  });

  if (!invoice || !await canViewInvoice(user, invoice)) {
    throw new NotFoundError();
  }

  return invoice;
}
```

This example is illustrative, not a drop-in authorization library. If access depends on project membership, delegated permissions, or other relationships, `canViewInvoice` must evaluate those rules consistently. Apply equivalent checks to mutations, exports, and related records. Where possible, combine authorization conditions with the database operation so an unauthorized record is never modified between a separate check and update.

Additional safeguards include:

- Centralizing policy decisions to reduce inconsistent checks across endpoints.
- Denying access by default when the policy cannot be established.
- Validating every object reference in nested and bulk requests.
- Limiting returned fields to what the authorized user needs.
- Logging access-control failures with enough context for investigation, while avoiding sensitive data in logs.
- Adding regression tests for each confirmed issue and for expected sharing behavior.

After remediation, repeat the original test cases with the same users and objects. Verify both that unauthorized access is blocked and that legitimate access still works. Recheck related routes that use the same object type or service layer; a fix to one endpoint does not automatically protect every other endpoint.

## FAQ

### Is BOLA the same as IDOR?

They describe closely related issues. IDOR commonly refers to exposing a direct reference that lets a user access an object they should not. BOLA emphasizes the missing object-level authorization decision in an API. The identifier may be predictable or opaque; the core problem is inadequate authorization.

### Should an API return 403 or 404 for an unauthorized object?

Either may be appropriate depending on the API’s privacy and consistency requirements. A `404` can avoid confirming that a protected object exists, while a `403` communicates that access is forbidden. The important requirement is that protected data and actions remain inaccessible and that the behavior is applied consistently.

### Are random or UUID-based identifiers enough to prevent BOLA?

No. They can make identifiers harder to guess, but an identifier is not a permission. The API must verify the authenticated user’s rights to the specific object for each relevant operation.

### How often should developers test for BOLA?

Test during implementation and code review, include regression checks for known access rules, and reassess when routes, roles, data relationships, or tenant boundaries change. The appropriate cadence depends on the application’s release and risk processes.

## Conclusion

Effective broken object level authorization testing is a controlled comparison: establish what each test user is allowed to do, substitute an object they should not access, and verify the response and any side effects. Cover every operation and identifier location, account for legitimate sharing rules, and treat status codes as only one part of the evidence. Remediation belongs on the server: enforce object-specific policy on every request, then rerun the same tests to confirm both protection and expected access.
