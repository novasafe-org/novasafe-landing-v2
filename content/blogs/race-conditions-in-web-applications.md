# Race Conditions in Web Applications

A request can be correct on its own and still cause a security or data-integrity problem when it overlaps with another request. For example, two customers may try to buy the last item at the same time, or two payment callbacks may each trigger a fulfillment action. These are race conditions: outcomes depend on the timing or ordering of concurrent operations.

Race conditions in web applications are not limited to high-traffic systems. Retries, parallel browser requests, background workers, and third-party callbacks can all create overlap. The right response is not to add locks everywhere, but to identify operations whose correctness depends on shared state and protect them at the right boundary.

This guide explains common failure modes, practical ways to assess them, and proportionate safeguards for application teams.

## What is a race condition?

A race condition occurs when concurrent operations access or change shared state and the final result depends on their timing. A common pattern is **check, then act**:

1. Read a value or verify a condition.
2. Make a decision based on that result.
3. Update the state.

If another operation changes the state between the check and the update, the original decision may no longer be valid. This gap is often called a time-of-check-to-time-of-use (TOCTOU) window.

Consider an inventory check implemented as two separate steps:

```text
if stock is greater than zero:
    create order
    decrement stock
```

If two requests both read `stock = 1` before either decrements it, both may create an order. The code may work during ordinary testing but fail under overlapping requests.

Concurrency itself is not a vulnerability. It becomes a security or reliability concern when the application fails to preserve an important invariant—for example, that inventory never goes below zero, a coupon is redeemed only once, or a user cannot spend the same balance twice.

## Why web applications encounter races

Web applications have several sources of concurrency:

- **Parallel client requests:** A user double-clicks, opens multiple tabs, or a frontend sends requests concurrently.
- **Retries:** A client, proxy, job runner, or payment provider retries after a timeout. The first request may have completed even if its response was lost.
- **Multiple application instances:** Requests may reach different servers, so in-process locks do not coordinate the whole system.
- **Background workers:** Jobs can run at the same time as user requests or as other jobs.
- **External callbacks:** Webhooks and integrations may deliver duplicate or concurrent events.
- **Database isolation:** Separate reads and writes can interleave depending on transaction boundaries and isolation level.

A single-threaded runtime does not eliminate these risks. It may interleave asynchronous operations around network or database calls, and the database or another service may process concurrent requests independently.

## Common race-condition failure modes

### Duplicate actions after retries

A request to create an order, issue a refund, or send a gift card may be processed twice if the client retries after a timeout. A timeout does not prove that the server failed to complete the operation.

### Overselling or exceeding a limit

Two requests can both observe that stock, quota, or an account limit is available and then both consume it. Similar issues affect per-user limits, invitation counts, and one-time promotions.

### Lost updates

Two operations read the same value, calculate a change, and write their results. The later write can overwrite the earlier one. For example, two increments implemented as read-plus-write can leave a counter increased by only one.

### Reusing a one-time token or workflow state

If an application checks that a reset token, invitation, coupon, or approval is unused and marks it used in a separate step, concurrent requests may both pass the check.

### Authorization checks separated from changes

An application may verify that a user owns a resource and then update it later. If ownership, membership, or the resource state changes in between, the update may be based on stale authorization context. Keep authorization and state-changing operations appropriately tied together, and re-check relevant conditions where necessary.

## How to assess race conditions in web applications

Start with business invariants, not with a search for the word `lock`. Ask what must remain true even when requests overlap.

### 1. Identify sensitive shared state

Review operations involving:

- Money, balances, credits, refunds, or payments
- Inventory, quotas, rate limits, or usage counts
- One-time or limited-use tokens and promotions
- Account roles, memberships, ownership, or approval states
- Job status, order status, or other multi-step workflows
- Actions that create an external side effect, such as sending a message or provisioning an account

For each operation, write down the invariant. Examples include “a coupon can be redeemed at most once per account” or “a withdrawal cannot make the available balance negative.”

### 2. Trace the full read-check-write path

Follow the operation across the application, database, queue, and external services. Look for a decision based on data that may change before the write or side effect happens. Include retries and asynchronous processing in the trace.

Pay particular attention to patterns like:

```text
SELECT current state
check condition in application code
UPDATE later
```

This pattern is not always wrong, but it needs protection when another operation can invalidate the check in between.

### 3. Test overlapping requests

A useful test sends multiple requests for the same resource at nearly the same time and then checks the invariant. For instance, create one available unit and submit two purchase attempts concurrently. Verify that at most one succeeds and that the final stock is valid.

A simple shell example can help expose a problem during manual testing:

```bash
for i in 1 2; do
  curl -sS -X POST http://localhost:3000/api/purchase \
    -H 'Content-Type: application/json' \
    -d '{"itemId":"test-item"}' &
done
wait
```

This is only a basic probe: shell timing is nondeterministic, and two requests may not overlap in a particular run. Prefer an automated test or load-testing tool that can issue controlled concurrent requests and assert the resulting database state. Run tests in an isolated environment with disposable data; do not create duplicate charges or other real-world side effects while testing.

### 4. Test retries and duplicate delivery

Repeat the same request with the same idempotency key, and test what happens if the server completes the operation but the client does not receive the response. For webhook handlers, replay the same event and send duplicate events concurrently. The expected behavior should be explicit and verifiable.

### 5. Inspect logs and database constraints

Logs can reveal duplicate processing, conflicting updates, or unexpected state transitions, but a lack of obvious errors does not prove correctness. Review database constraints and transaction boundaries as well. Application-level checks alone may not protect against another server instance or code path writing to the same data.

## Safeguards and when to use them

Choose the narrowest safeguard that preserves the business invariant across all relevant processes. A lock in one application process is not sufficient if other instances can perform the same operation.

### Use atomic conditional updates

When the decision and change can be expressed in one database statement, an atomic conditional update is often a simple option. For example, with SQL:

```sql
UPDATE inventory
SET stock = stock - 1
WHERE item_id = $1
  AND stock > 0;
```

Check the number of affected rows. One affected row means a unit was reserved; zero means the condition was not met. The database evaluates the condition and applies the update as one statement, avoiding the separate application-level read-then-write gap for this operation.

The same pattern can enforce a state transition:

```sql
UPDATE reset_tokens
SET used_at = CURRENT_TIMESTAMP
WHERE token_hash = $1
  AND used_at IS NULL
  AND expires_at > CURRENT_TIMESTAMP;
```

Proceed only if exactly one row was updated. Keep relevant constraints in the database so correctness does not depend solely on every caller following the same application convention.

### Add unique and check constraints

A unique constraint can prevent duplicate records even if two requests race. For example, a unique key on `(account_id, promotion_id)` can enforce one redemption per account and promotion. A check constraint can enforce a valid range, such as a nonnegative stock count, when supported by the database and appropriate to the data model.

Treat constraint violations as expected outcomes where contention is possible. Handle them safely and return a suitable result rather than exposing internal database errors.

### Use transactions for related database changes

Transactions are useful when multiple database changes must succeed or fail together. For example, creating an order and recording its inventory reservation may need to be atomic. Choose transaction isolation and locking behavior based on the invariant and database semantics; a transaction at a default isolation level does not automatically prevent every race, particularly when application logic reads data and later makes a decision.

Where necessary, use row locks, optimistic concurrency (such as a version column), or a stronger isolation level. Understand the trade-offs: locks can reduce throughput, and transactions that touch resources in inconsistent orders can deadlock. Keep transactions as short as practical and retry only errors that are safe to retry.

### Make retried operations idempotent

For operations that clients may retry, accept an idempotency key and store the outcome associated with that key. A repeated request with the same key should return the original result or a defined equivalent, rather than repeat the side effect. Scope keys appropriately, validate them, and define their retention period.

Idempotency is not a replacement for all concurrency controls. Ensure that recording the key and performing the associated state change are coordinated so two simultaneous requests with the same key cannot both perform the action.

### Design external side effects carefully

A database transaction cannot usually roll back an email, payment-provider call, or message already sent to another system. For workflows that combine database changes and external actions, consider an outbox pattern: commit the intended event in the same database transaction as the state change, then have a worker deliver it with deduplication or idempotent handling. Use the external provider’s idempotency mechanisms where available, and reconcile uncertain outcomes rather than assuming a timeout means failure.

### Use distributed locks selectively

A distributed lock can coordinate work across instances, but it introduces failure modes of its own: expiration, network partitions, stale lock holders, and incorrect release behavior. Use one only when simpler database-level approaches do not fit, and make the protected operation safe against a worker continuing after its lock is no longer valid. A process-local mutex is useful for local coordination but does not protect shared data across multiple application instances.

## A practical decision guide

- **One conditional change to one row:** Prefer an atomic update and inspect affected rows.
- **Preventing duplicate records:** Add a database uniqueness constraint and handle conflicts.
- **Several related database writes:** Use a transaction, then choose suitable isolation or locking based on the invariant.
- **Client or provider retries:** Add idempotency and duplicate-event handling.
- **Database update plus external side effect:** Use an outbox or another explicit delivery and reconciliation design.
- **Coordination across independent workers:** Consider a distributed coordination mechanism only after checking whether the database or queue can enforce the required behavior more simply.

## Common mistakes to avoid

- **Checking in application code and assuming the check is exclusive.** Another request can pass the same check before either request updates the state.
- **Relying on an in-memory lock in a multi-instance deployment.** It coordinates only the process that owns the lock.
- **Assuming a transaction fixes every race.** The result depends on transaction boundaries, isolation, query patterns, and the database.
- **Treating a timeout as proof that an operation failed.** The operation may have completed while its response was lost.
- **Retriying every error blindly.** Retrying a non-idempotent action can repeat a side effect; retry transient conflicts only with a safe retry strategy.
- **Testing only with sequential requests.** Sequential tests cannot demonstrate behavior under overlap.
- **Returning internal errors on constraint conflicts.** Convert expected conflicts into controlled application responses and log useful diagnostic details without exposing sensitive data.

## FAQ

### Are race conditions always security vulnerabilities?

No. Some races cause reliability or data-quality issues rather than exploitable security impact. They become security-relevant when an attacker can use concurrency to bypass authorization, exceed a limit, reuse a one-time action, or obtain value they should not receive. Assess both the invariant and the impact of violating it.

### Can a single-threaded web server have race conditions?

Yes. Asynchronous requests can interleave while waiting for databases or other services. In addition, multiple server processes, database workers, queues, and external systems can operate concurrently even if one runtime executes JavaScript callbacks on a single thread.

### Is a database transaction enough to prevent race conditions?

Not necessarily. A transaction groups changes, but the protection depends on the database’s isolation level and how the application reads and writes data. Use atomic conditional statements, constraints, locks, or an appropriate isolation strategy to preserve the specific invariant, and test the behavior under concurrent operations.

### How can I reproduce a race reliably?

Use a test harness that starts requests together, controls relevant barriers where possible, and checks final state rather than relying only on response codes. Repeat the test and include duplicate requests and retry scenarios. Run it against an isolated environment with representative database behavior.

## Conclusion

Race conditions arise when concurrent requests make decisions from shared state that can change before the operation completes. To assess them, identify critical invariants, trace each read-check-write path, and test overlapping requests and retries. Then apply safeguards at the right boundary: atomic updates and database constraints for simple invariants, transactions and suitable concurrency controls for related changes, and idempotent designs for retries and external side effects.

The goal is not to eliminate concurrency. It is to make important outcomes correct and predictable no matter how requests overlap.
