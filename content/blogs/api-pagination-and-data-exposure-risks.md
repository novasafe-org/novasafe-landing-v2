# API Pagination and Data Exposure Risks

Pagination divides a large collection into smaller responses. It can improve performance and make an API easier to use, but it also creates security decisions: which records may a caller page through, how much data can they request, and what does the API reveal about records they cannot access?

Understanding **API pagination data exposure risks** means treating pagination as part of the API’s authorization and resource-control design—not just a convenient way to split results. A secure implementation must enforce access rules on every request, constrain resource usage, and avoid exposing sensitive information through records, counts, cursors, or response metadata.

## How API pagination works

A client requests a subset of a collection instead of retrieving every record at once. Common approaches include:

- **Offset pagination:** The client supplies a page number or an offset, often with a page size. For example, `?limit=25&offset=50` requests 25 records after the first 50.
- **Page-number pagination:** The client supplies a page and page size, such as `?page=3&per_page=25`. The server typically derives an offset from those values.
- **Cursor pagination:** The client supplies a cursor that marks a position in an ordered collection. The server returns records after that position and may provide a cursor for the next request.

Each approach has tradeoffs. Offset pagination is simple, but can become costly for deep pages and may produce inconsistent results as records are added or removed. Cursor pagination can work better for large, changing collections, but requires a stable ordering and careful cursor handling. Neither approach provides authorization automatically.

## Where data exposure risks arise

### Authorization is missing or applied too late

A pagination endpoint must enforce authorization for the collection and its records on every request. A common mistake is to fetch a page globally and rely on the client to filter it, or to check access only when the first page is requested.

For example, a user allowed to view their own invoices should not be able to change `page`, `offset`, or `cursor` to retrieve another customer’s invoices. The server should scope the database query to the authenticated user’s permitted tenant or account before applying pagination.

This is an instance of broken access control, including insecure direct object reference (IDOR) patterns. A cursor or page number is not proof that the caller is authorized to see the records it identifies.

### Client-controlled limits enable excessive responses

If an endpoint accepts an unrestricted `limit`, a client might request an unusually large response. That can increase database work, memory use, response size, and downstream processing. It may also expose more records in a single response than the API intended to provide.

Validate pagination inputs on the server. Set a reasonable default and a firm maximum, reject invalid values, and consider rate limits or query-cost controls for expensive endpoints. A page-size cap is useful, but it does not replace authorization or other resource protections.

### Counts and metadata reveal information

Pagination metadata can disclose details even when the returned records are filtered. Examples include:

- A `total` count that includes records the caller cannot view.
- A `has_more` flag that reveals the existence of additional restricted records.
- Error messages that distinguish between an invalid cursor and a valid cursor for an inaccessible collection.
- `Link` headers or navigation URLs that contain sensitive filters, tokens, or internal identifiers.

Calculate counts from the same authorized scope as the returned records. Include metadata only when it is needed, and ensure links and error responses do not expose secrets or unnecessary details.

### Cursors are mistaken for secrets or permissions

Cursors can contain an identifier, timestamp, sort value, or other position information. Base64-encoding a cursor makes it less readable at a glance, but does not make it secret or trustworthy. Clients can inspect or alter an encoded value.

Treat cursors as untrusted input. Validate their structure and integrity, and continue to apply the caller’s current authorization rules on every request. If a cursor needs tamper protection, use an authenticated format, such as a server-side token or a signed value. Signing helps detect modification; it does not grant access to the referenced records. Avoid putting sensitive information in a cursor unless it is appropriately protected.

### Unstable ordering skips or repeats records

Pagination requires a deterministic order. Sorting only by a non-unique field, such as a creation timestamp, can cause records to appear on multiple pages or be skipped when records share the same value. Changes to a collection between requests can also shift offset-based pages.

Use a stable ordering with a unique tie-breaker, such as `(created_at, id)`. For cursor pagination, encode or reference all values needed to continue that ordering. If an API promises a consistent snapshot across pages, define how that snapshot is maintained; otherwise, document that results may change between requests.

### Sorting and filtering expose unintended fields

Allowing arbitrary client-supplied sort or filter expressions can create injection risks, expensive queries, or unintended ways to infer data. Do not concatenate untrusted values into SQL or other query languages. Allowlist supported sort fields and directions, validate filters, and enforce authorization within the query.

Even when records are authorized, returning every field can expose more data than the client needs. Apply field-level access controls and return only the fields appropriate for the caller and use case.

### Pagination can amplify denial-of-service risks

A small page limit does not guarantee a cheap query. Certain filters, sorts, joins, or deep offsets can still require substantial database work. Attackers may repeatedly request expensive pages or vary parameters to bypass simplistic caching and rate limits.

Review query plans for common pagination patterns, index the fields used for filtering and ordering where appropriate, and apply rate limits and workload controls. Set timeouts and monitor resource use for high-cost endpoints. Avoid assuming that pagination alone prevents denial of service.

## Defensive design recommendations

### 1. Authorize before paginating

Derive the caller’s identity and permissions from trusted authentication context. Apply tenant, ownership, and record-level restrictions in the server-side query before `LIMIT`, `OFFSET`, or cursor conditions are applied. Do not rely on a client-provided tenant ID as the authorization decision.

### 2. Validate and bound pagination parameters

Define accepted parameter names, types, defaults, and maximums. Reject negative, malformed, or out-of-range values rather than silently interpreting them in surprising ways. Use consistent behavior across endpoints and document it for API consumers.

### 3. Use stable ordering and safe query construction

Allowlist supported sort fields and directions. Use parameterized queries for values, and construct dynamic SQL identifiers only from trusted allowlists. Include a unique tie-breaker in the ordering so page boundaries are deterministic.

### 4. Choose a pagination strategy for the data and use case

Offset pagination can be appropriate for small, relatively stable collections where users need direct page navigation. Cursor pagination is often a better fit for large or frequently changing collections, particularly for sequential browsing. The choice should account for query performance, consistency expectations, and client needs—not be treated as a security control by itself.

### 5. Minimize metadata and response fields

Return only necessary records and fields. Make sure totals, continuation indicators, and navigation links are derived from the caller’s authorized view. Do not include access tokens or sensitive filters in URLs that may be logged, cached, or shared.

### 6. Protect caches and logs

If responses vary by user, role, or tenant, configure caching so one caller cannot receive another caller’s data. Review cache keys and cache-control behavior for authenticated responses. Avoid logging credentials, sensitive query values, or full cursor contents when they could contain sensitive data; log enough context to investigate abuse without retaining unnecessary secrets.

## Example: scoped and bounded pagination

The following TypeScript-style example illustrates the important checks. It assumes authentication middleware has already populated `req.user`; the authorization scope is still included in the database query.

```ts
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function parseLimit(value: unknown): number {
  if (value === undefined) return DEFAULT_LIMIT;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    throw new Error("Invalid limit");
  }
  return parsed;
}

app.get("/invoices", async (req, res) => {
  const limit = parseLimit(req.query.limit);
  const offset = parseOffset(req.query.offset); // Also validate type and range.
  const user = req.user;

  const invoices = await db.query(
    `SELECT id, created_at, amount, status
       FROM invoices
      WHERE tenant_id = $1
        AND owner_id = $2
      ORDER BY created_at DESC, id DESC
      LIMIT $3 OFFSET $4`,
    [user.tenantId, user.id, limit, offset]
  );

  res.json({ data: invoices.rows });
});
```

This example is illustrative, not a complete application. The exact authorization scope depends on the data model and permissions. `parseOffset` should reject invalid or excessive values, and the database driver should safely bind query values. If administrators have different access rules, represent those rules explicitly in the server-side query rather than trusting request parameters.

For cursor pagination, use the same principles: validate the cursor, apply the caller’s authorization scope, and use a deterministic ordering. For example, a query ordered by `created_at DESC, id DESC` can use both values as its continuation position. The cursor tells the server where to continue; the authorization predicate determines which records the caller may see.

## Security testing checklist

Test pagination as an access-control boundary, not only as a functional feature:

- Request later pages as a user with limited access and verify that no unauthorized records appear.
- Change page, offset, limit, sort, filter, and cursor values; confirm that authorization remains enforced.
- Check whether totals or continuation indicators reveal restricted records.
- Try malformed, negative, very large, and unexpected parameter values.
- Modify or replay cursors, including across users and tenants, and verify that access is still checked.
- Test records with identical sort values and records added or removed between page requests.
- Confirm that response fields, cache behavior, error messages, and logs do not disclose unnecessary sensitive data.
- Exercise expensive filters and deep pages under expected rate and resource controls.

## Frequently asked questions

### Does pagination itself cause data exposure?

No. Pagination is a retrieval pattern, not an authorization mechanism. Exposure occurs when access checks, query scoping, metadata handling, or resource controls are implemented incorrectly.

### Is cursor pagination more secure than offset pagination?

Not by itself. Cursors can be harder to guess in some designs, but they must not be treated as credentials. Both approaches require server-side authorization on every request, input validation, and appropriate resource controls.

### Should an API return a total record count?

Only when the client needs it and it can be calculated safely. The count should reflect the caller’s authorized view. For some APIs, a `has_more` indicator is sufficient and avoids returning an exact count, though it too must be based on authorized data.

### What is the safest maximum page size?

There is no universal value. Choose a limit based on response size, query cost, and the needs of API clients. Enforce it server-side, test expensive query patterns, and combine it with suitable rate and workload controls.

## Conclusion

Pagination can improve API usability and performance, but every page is another opportunity to mishandle authorization, expose metadata, or consume excessive resources. Scope queries to the caller’s permissions, validate and bound inputs, use stable ordering, minimize response data, and treat cursors as untrusted navigation state. With those controls in place, pagination can serve clients without becoming a path to unintended data exposure.
