# Broken Access Control Testing

Broken access control occurs when an application lets a user perform an action or access data beyond the permissions they should have. A user might view another customer’s invoice by changing an ID in a URL, call an administrative API directly, or alter a request to update a field that the interface never exposes.

**Broken access control testing** checks whether the server consistently enforces authorization rules for every relevant request. It is not enough to hide a button or rely on a user interface to prevent an action. The application must verify that the authenticated user is allowed to access the specific resource and perform the specific operation.

This guide compares practical testing approaches, explains what to test, and offers criteria for choosing a defensive design. The examples are intended for applications and environments you own or are authorized to assess.

## What to test

Authentication establishes who a user is. Authorization determines what that user can do. Broken access control testing focuses on the second question, including whether the application correctly checks:

- **Function-level access:** Can a user reach an action or endpoint reserved for another role, such as deleting an account or managing users?
- **Object-level access:** Can a user access or modify a particular record, such as another user’s order?
- **Property-level access:** Can a user read or change fields they should not control, such as an account role or payment status?
- **Tenant boundaries:** Can a user in one organization access another organization’s data?
- **Workflow and state rules:** Can a user skip a required step or perform an action in an invalid state?

These categories can overlap. For example, a request to update an invoice may involve a function permission, ownership of the invoice, tenant membership, and restrictions on which invoice fields can be changed.

## Build an authorization test matrix

Before testing, describe the expected policy in a small matrix. Include the user, resource, action, and expected result. A simplified example:

| User | Resource | Action | Expected result |
|---|---|---|---|
| Alice, owner | Alice’s project | Read and update | Allow |
| Bob, regular member | Alice’s project | Read or update | Deny unless explicitly shared |
| Administrator | Alice’s project | Read or update | Allow if policy grants it |
| Alice, owner | Bob’s project | Delete | Deny |
| Alice, owner | Alice’s project | Change its owner to an unrelated user | Deny unless explicitly permitted |

The matrix should reflect the application’s actual rules, not assumptions based on its interface. Include unauthenticated users, users with different roles, different tenants, resource owners, and users who have no relationship to a resource. Add edge cases such as suspended accounts, expired invitations, and archived records if those states affect permissions.

A useful rule of thumb is to test both **who** is making the request and **which exact resource and fields** the request targets.

## Practical testing workflow

### 1. Map the application’s access paths

List the routes, API operations, background jobs, and administrative actions that read or change protected data. Review API specifications and server-side route definitions where available. Also inspect the interface and browser network traffic, but do not treat the interface as a complete inventory: hidden or undocumented endpoints may still be callable.

For each operation, record:

- The required authentication state.
- The roles or relationships that should permit access.
- The resource identifiers and tenant context involved.
- The data that may be read or changed.
- The expected behavior when access is denied.

### 2. Prepare controlled test identities and resources

In a local or staging environment, create separate accounts for different roles and, where relevant, different tenants. Create test records owned by each account. Keep the identities and records distinct so a test can clearly reveal an authorization failure.

Use synthetic data rather than real customer information. Make sure test accounts have only the permissions needed for the assessment, and avoid running destructive tests against production unless there is explicit approval and a safe test plan.

### 3. Capture a legitimate request

Sign in as a user who is allowed to perform an operation and capture the request using a browser’s developer tools or an authorized testing proxy. Record the method, path, headers, body, and response. This gives you a valid request to replay with controlled changes.

For example, suppose Alice can read her project at `/api/projects/101`. With a test token for Alice, a baseline request might be:

```bash
curl -i -H 'Authorization: Bearer ALICE_TOKEN' https://staging.example.test/api/projects/101
```

The token and host above are placeholders. Use credentials and systems in your authorized test environment.

### 4. Change one authorization-relevant input at a time

Repeat the request while changing a single factor, such as the user token, project ID, HTTP method, or body field. One-variable-at-a-time tests make it easier to identify which policy check failed.

For an object-level check, try Alice’s token with Bob’s project ID:

```bash
curl -i -H 'Authorization: Bearer ALICE_TOKEN' https://staging.example.test/api/projects/202
```

If Alice should not have access to project 202, the server should deny the request without returning protected data. The exact denial response depends on the API’s design: a service may return `403 Forbidden`, or use `404 Not Found` to avoid revealing whether a resource exists. The important requirement is that unauthorized data or actions are not exposed.

For a function-level check, sign in as a regular user and directly call a known administrative route. For a property-level check, submit a field that the user should not be able to set, such as a role or tenant identifier. Do not assume that a field is protected just because it is absent from the normal form.

### 5. Check reads, writes, and side effects

Test more than whether a request returns an error. For each protected operation, verify that:

- The response contains no unauthorized data.
- The target record was not modified or deleted.
- Related side effects did not occur, such as a notification, payment, or permission change.
- Bulk operations apply authorization to every affected item.
- Error responses do not reveal sensitive information through messages, stack traces, or excessive detail.

A denied response is not sufficient if the server changed data before checking permission. Confirm the resource’s state afterward using a permitted method or a test database inspection process.

### 6. Automate repeatable checks

Authorization tests are valuable regression tests. Add them to the application’s test suite so changes to routes, data access, or roles do not silently weaken policy. A simple integration-test pattern is to make the same request as an allowed and a denied user, then verify both the response and the database state.

```python
def test_project_is_only_visible_to_authorized_user(client, alice_token, bob_project):
    response = client.get(
        f'/api/projects/{bob_project.id}',
        headers={'Authorization': f'Bearer {alice_token}'},
    )

    assert response.status_code in (403, 404)
    assert 'private_notes' not in response.get_json()
```

Adapt the fixture names, response format, and expected status to your application. The test should reflect the intended policy, not simply accept any error. If the endpoint returns `404`, for example, verify that this behavior is deliberate and consistent. Add corresponding positive tests to ensure authorized users can still perform permitted actions.

## Testing approaches and tradeoffs

No single method finds every access control defect. Combining approaches provides broader coverage.

| Approach | Strengths | Limitations | Best fit |
|---|---|---|---|
| Manual testing | Flexible; useful for discovering unexpected workflows and business-rule gaps | Time-consuming and difficult to repeat consistently | Exploratory assessment and complex policies |
| Automated integration tests | Repeatable; can check response and persisted state; fit naturally into development | Cover only the cases and routes engineers write tests for | Regression coverage for known rules |
| Dynamic application testing | Exercises a running application and can help identify exposed routes or inconsistent responses | Often lacks the user, tenant, and business context needed to judge whether access is valid | Broad discovery when configured with suitable accounts |
| Static analysis and code review | Can reveal missing checks, unsafe data access patterns, or inconsistent enforcement before deployment | May not understand runtime relationships or application-specific policy | Reviewing implementation and identifying risky code paths |

Automated scanners can help find candidates, but their results need context. A scanner may not know that a particular user is expected to access a record, and it may miss routes that require a specific sequence of actions. Use scanner findings as input to verification, not as proof that authorization is correct.

## Choosing a defensive design

The right design depends on the application’s roles, resource relationships, tenancy model, and operational complexity. Common approaches include:

### Role-based access control

Role-based access control (RBAC) assigns permissions to roles, then assigns users to those roles. It works well when permissions correspond to a manageable set of job functions, such as viewer, editor, and administrator.

**Tradeoff:** RBAC is straightforward to reason about when roles are stable, but broad roles can accumulate excessive permissions. It may also be awkward when access depends on a specific relationship, such as whether a user belongs to the organization that owns a record.

### Attribute-based access control

Attribute-based access control (ABAC) evaluates attributes of the user, resource, action, and context. A policy might allow a user to edit a document only when the user belongs to its organization and the document is in an editable state.

**Tradeoff:** ABAC can express fine-grained rules, but policy complexity can make behavior harder to understand and test. Keep policies explicit, reviewable, and covered by representative tests.

### Relationship-based checks

Relationship-based authorization evaluates connections between users and resources, such as owner, member, or invited collaborator. It is useful for applications where permissions follow resource relationships.

**Tradeoff:** Relationship checks can model sharing and ownership naturally, but the application must keep those relationships accurate and enforce them consistently across operations.

### A practical selection checklist

Choose a design by asking:

1. Are permissions mostly determined by a small set of stable roles?
2. Do ownership, organization membership, sharing, or record state affect access?
3. Must the same policy apply consistently across APIs, background jobs, and administrative tools?
4. Can the team explain and review the policy without relying on hidden conventions?
5. Can the policy be tested with clear allowed and denied cases?

Many applications combine approaches. For instance, a role may grant the ability to edit projects generally, while a relationship check ensures that the project belongs to the user’s organization. Whatever the model, enforce authorization on the server at the point where protected data or actions are accessed. Avoid relying solely on client-side checks or on identifiers being difficult to guess.

## Defensive implementation practices

- **Deny by default.** Require an explicit policy decision to grant access rather than assuming access is allowed when a check is missing.
- **Centralize policy where practical.** Shared authorization logic reduces the chance that individual routes implement different rules. Centralization should not obscure which resource and action are being checked.
- **Check every request and resource.** Do not assume that an earlier page load or a prior authorization decision makes a later API request safe.
- **Scope data queries to the authorized user or tenant.** Whenever possible, retrieve a resource through an access-scoped query rather than loading arbitrary data and hoping every caller remembers a separate check.
- **Allowlist writable fields.** Define which properties a user may update. Do not bind an untrusted request body directly to a model that includes sensitive fields.
- **Protect indirect paths.** Apply equivalent checks to exports, search, bulk actions, file downloads, GraphQL resolvers, and background processing where users can initiate work.
- **Log useful security events carefully.** Record denied high-risk actions when appropriate, but do not put credentials, tokens, or unnecessary sensitive data in logs.
- **Review caches and asynchronous work.** Ensure cached responses are not shared across users or tenants when their contents differ, and ensure background jobs preserve the correct authorization context.

## Common testing mistakes

- Testing only through the normal interface, which may hide routes that remain reachable directly.
- Checking that an error status was returned without checking response contents or side effects.
- Testing only different roles while ignoring ownership and tenant boundaries.
- Changing several request elements at once, making the cause of a result unclear.
- Assuming unpredictable IDs prevent unauthorized access. Identifier complexity is not a substitute for authorization.
- Treating a successful scan as proof that all access paths and business rules are covered.
- Writing only negative tests. Positive tests help confirm that legitimate access still works after a policy change.

## FAQ

### Is broken access control the same as missing authentication?

No. Authentication verifies identity; access control decides what that identity may do. A user can be correctly authenticated and still access another user’s data if authorization checks are missing or incorrect.

### Should an unauthorized request return 403 or 404?

Either may be appropriate depending on the API and whether revealing a resource’s existence is sensitive. Choose a consistent behavior, document it, and test that no protected information or action is exposed. A particular status code alone does not prove the check is correct.

### Are random or unguessable IDs enough to protect records?

No. Hard-to-guess identifiers can reduce casual discovery, but a user who obtains an identifier may still try it. The server must verify that the requesting user is authorized for the specific resource and action.

### How often should access control tests run?

Run focused authorization tests as part of normal automated testing whenever relevant code changes. Perform broader manual or dynamic assessments when routes, roles, tenancy rules, or major workflows change, and as part of a planned security review.

## Conclusion

Effective broken access control testing starts with a clear policy and identities that represent the application’s real permission boundaries. Test direct API access as well as interface workflows, vary users and resource identifiers, inspect response data and side effects, and turn important cases into repeatable integration tests.

The strongest defensive design is one your team can explain, enforce consistently on the server, and verify with explicit allowed and denied cases. Match the model to your application: roles may be enough for stable job functions, while resource relationships or attributes may be necessary for ownership, tenant, and state-dependent rules. Combine methods where useful, and treat every protected operation as a decision that must be checked—not an assumption.
