# API Rate Limiting Strategies

Rate limiting controls how many requests a client can make within a defined period or how much work it can consume. Done well, it helps protect an API from accidental overload, abusive traffic, and unfair resource use while preserving a usable experience for legitimate clients.

There is no single best algorithm for every API. A public read endpoint, a costly report-generation operation, and a login route have different resource and security needs. Choosing among API rate limiting strategies means considering traffic patterns, what the API needs to protect, how clients are identified, and whether limits must be shared across multiple servers.

This guide compares common approaches and offers practical criteria for designing and operating rate limits.

## What rate limiting protects

A rate limit sets a boundary on request activity. Depending on the design, that boundary may apply to requests per time period, concurrent work, or a weighted measure of resource consumption.

Rate limits can help with:

- **Overload protection:** Reduce the impact of traffic spikes on application servers and dependencies.
- **Fairness:** Prevent a single client from consuming a disproportionate share of capacity.
- **Abuse resistance:** Make high-volume credential guessing, scraping, or resource exhaustion harder.
- **Cost control:** Constrain operations that consume expensive compute, third-party API calls, or paid resources.

Rate limiting is not a complete denial-of-service defense. It works best as one layer alongside capacity planning, request validation, authentication, caching, monitoring, and upstream network protections.

## Common rate limiting strategies

### Fixed window

A fixed-window limiter counts requests during discrete intervals, such as 100 requests per minute. The counter resets at the start of each interval.

**Advantages:**

- Simple to understand and implement.
- Low storage requirements: usually one counter and an expiry per key.
- Easy to explain to clients and operators.

**Tradeoffs:**

Traffic can bunch up at a window boundary. A client could make its full allowance just before a reset and then make another full allowance immediately after it. For a limit of 100 requests per minute, that can mean close to 200 requests in a short span across the boundary.

**Use it when:** A straightforward limit is sufficient, traffic bursts are acceptable, and implementation simplicity matters more than smooth enforcement.

### Sliding-window log

A sliding-window log records request timestamps and counts the requests that fall within the most recent interval. For example, it can enforce no more than 100 requests in any rolling 60-second period.

**Advantages:**

- Enforces a precise rolling-window limit.
- Avoids the fixed-window boundary burst.

**Tradeoffs:**

- Stores more data because individual request timestamps must be tracked.
- Can require more work to maintain and query, especially at high request volume.

**Use it when:** A precise rolling limit is important and the request volume or storage cost is manageable.

### Sliding-window counter

A sliding-window counter approximates a rolling limit using the current and previous fixed-window counters. It weights the previous counter according to how much of that window overlaps the current rolling period.

**Advantages:**

- Smoother enforcement than a simple fixed window.
- Typically less storage and processing than a per-request log.

**Tradeoffs:**

- It is an approximation, not an exact record of request timestamps.
- Correctness depends on how counters and window boundaries are implemented.

**Use it when:** You want a good balance between smooth behavior and modest storage costs.

### Token bucket

A token bucket has a maximum capacity and refills at a configured rate. Each request consumes one or more tokens. Requests are accepted while enough tokens remain; otherwise, they are delayed or rejected.

For example, a bucket might hold 60 tokens and refill at one token per second. It allows a burst of up to 60 requests when full, while limiting sustained traffic to about one request per second after the burst is used.

**Advantages:**

- Allows controlled bursts while limiting sustained traffic.
- Provides intuitive controls for burst capacity and refill rate.
- Works well for APIs whose normal traffic arrives unevenly.

**Tradeoffs:**

- Requires choosing both a bucket capacity and a refill rate.
- A burst may still be too large for a fragile dependency unless other safeguards are in place.

**Use it when:** Clients need some burst flexibility, but sustained consumption should remain bounded. It is a common fit for general API request limits.

### Leaky bucket and request shaping

A leaky-bucket design processes requests at a controlled rate, often by placing them in a queue. This can smooth incoming bursts rather than rejecting every excess request immediately.

**Advantages:**

- Can produce a steadier rate of work.
- Useful when requests can safely wait in a bounded queue.

**Tradeoffs:**

- Queues add latency and operational complexity.
- Unbounded or overloaded queues can consume memory and make failures worse.
- Some API operations should fail fast rather than wait.

**Use it when:** Work can be queued, the queue has firm capacity limits, and clients can tolerate the added delay. For synchronous APIs, rejecting excess work may be safer and simpler.

### Concurrency limits

A concurrency limit caps the number of operations that may be in progress at once. Unlike a request-per-time limit, it controls simultaneous work.

This matters for slow or resource-intensive operations. A client making only a few requests per minute could still exhaust a service if each request occupies a worker for a long time.

**Advantages:**

- Directly limits simultaneous pressure on workers or downstream services.
- Complements time-based request limits.

**Tradeoffs:**

- Requires reliable tracking of when work starts and finishes, including failures and timeouts.
- A per-client concurrency limit alone may not protect total service capacity.

**Use it when:** Requests are long-running or resource-intensive. Consider both per-client limits and a global capacity guard.

## Comparing the approaches

| Strategy | Smooths bursts | Precision | Storage and coordination | Best suited to |
|---|---|---|---|---|
| Fixed window | No | Low at window boundaries | Low | Simple, coarse limits |
| Sliding-window log | Yes | High | Higher | Precise rolling limits |
| Sliding-window counter | Mostly | Approximate | Moderate | Balanced rolling limits |
| Token bucket | Allows bounded bursts | Controlled by configuration | Moderate | General API traffic with bursts |
| Leaky bucket | Yes, by shaping work | Depends on queue and drain rate | Queue required | Work that can safely wait |
| Concurrency limit | Not a time-based limit | Controls active work | Requires lifecycle tracking | Slow or expensive operations |

These approaches are not mutually exclusive. An API may use a token bucket for request frequency, a concurrency limit for expensive jobs, and a separate global safeguard to protect a database.

## Choose limits based on risk and capacity

Start by identifying the resource or behavior the limit should protect. A single requests-per-minute number is rarely enough for every route.

### 1. Classify endpoints by cost and risk

Group endpoints by their behavior. For example:

- Cached reads may be relatively inexpensive.
- Search or aggregation queries may consume significant database capacity.
- File processing or report generation may need concurrency limits.
- Login, password reset, and verification routes need abuse-focused controls.

Set stricter limits where requests are costly or abuse-sensitive. Avoid assuming that every request has the same cost.

### 2. Choose a client identity

A limiter needs a key to decide which requests share a quota. Common choices include:

- **Authenticated user or API key:** Often appropriate for account-level quotas.
- **Organization or tenant:** Useful when a customer's users should share a plan allowance.
- **IP address:** Useful for some unauthenticated traffic, but can group many legitimate users behind a shared address or be evaded by distributed sources.
- **Route or operation:** Helps distinguish expensive endpoints from inexpensive ones.

Identity should match the intended policy. For example, if a quota is meant to apply to an organization, limiting only by individual user may let its users collectively exceed the intended allowance. Many systems combine dimensions, such as a per-account limit plus an IP-based limit for unauthenticated requests.

Do not trust client-supplied identity headers unless a trusted proxy removes or overwrites them. Incorrect proxy configuration can let an attacker spoof an IP-based key. Apply limits at a layer that has a reliable view of the identity and request path.

### 3. Set a rate, burst, and scope

Define the sustained rate and, where the algorithm supports it, the permitted burst. Decide whether limits apply per user, API key, organization, route, or some combination.

Use observed traffic and tested service capacity to set initial values. Account for normal bursts, scheduled jobs, and legitimate client retries. A limit that is too low can cause avoidable failures; one that is too high may not protect the resource. Revisit the values as usage and capacity change.

### 4. Decide what happens when the limit is reached

For synchronous APIs, the usual response is to reject excess requests with **HTTP 429 Too Many Requests**. Include a clear error body and, when the wait time is known, a `Retry-After` header. For example:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 10
Content-Type: application/json

{"error":"rate_limit_exceeded","message":"Try again later."}
```

The value in `Retry-After` should reflect the policy and reset or refill timing. It is guidance, not a guarantee that a retry will succeed if other limits or service conditions apply. Document how clients should back off, and encourage jitter so many clients do not retry simultaneously.

If the API queues work instead of rejecting it, set a queue capacity and an expiration policy. Communicate whether the request was accepted for later processing rather than leaving clients uncertain.

## Implementing a distributed limiter

An in-memory counter can work for a single process or a local development environment, but it is not a reliable shared limit across multiple application instances. Each instance would keep a separate count, and restarts would reset local state.

For a distributed limiter, use shared state or an edge/API gateway that can enforce a consistent policy. The operation that checks and updates a quota should be atomic. Otherwise, concurrent requests can all observe the same remaining allowance and exceed it.

A token-bucket implementation needs to store at least the token balance and the time of the last refill for each limit key. Conceptually, an atomic update does the following:

```text
elapsed = now - last_refill
available = min(capacity, tokens + elapsed * refill_rate)

if available >= request_cost:
    tokens = available - request_cost
    allowed = true
else:
    tokens = available
    allowed = false

last_refill = now
save(tokens, last_refill)
```

The read, calculation, and write must be performed as one atomic operation in the shared store. Store keys should have an expiry so inactive clients do not leave counters indefinitely. Use a consistent time source and define behavior for clock anomalies. For weighted operations, set `request_cost` according to the resource being protected rather than treating every call as equal.

Also decide how the API behaves if the limiter's shared store is unavailable. **Fail open** preserves availability but may leave the service less protected. **Fail closed** preserves enforcement but can block legitimate traffic during a limiter outage. The right choice depends on the endpoint and risk; a login or expensive operation may warrant different handling from a low-risk cached read. Document and monitor the decision.

## Security and operational considerations

- **Layer limits:** Combine per-identity limits with global capacity protections where appropriate. Per-client quotas do not guarantee that total service load stays safe.
- **Avoid easy bypasses:** Verify that clients cannot rotate unauthenticated identities cheaply or spoof forwarded IP headers. IP-only controls have important limitations.
- **Protect authentication routes:** Rate limiting can reduce the pace of password guessing or verification abuse, but it should work alongside account protections and monitoring. Avoid relying on a single IP limit for these routes.
- **Prevent collateral blocking:** Shared IP addresses, carrier networks, and corporate proxies can group unrelated users. Prefer authenticated identities where possible and examine false positives.
- **Bound state and queues:** Expire inactive limiter keys, limit queue size, and consider the memory impact of attacker-controlled key creation.
- **Keep responses useful:** Return 429 for quota rejection, provide consistent error details, and avoid exposing sensitive internal policy information.
- **Monitor the policy:** Track allowed and rejected requests by route and policy, limiter-store errors, queue depth, and downstream health. Avoid high-cardinality labels that create excessive monitoring costs.
- **Test changes safely:** Load-test representative traffic, verify behavior across application instances, and check boundary conditions before changing production limits.

## Practical rollout checklist

1. Identify the resource, endpoint, or abuse pattern the policy should address.
2. Choose the identity key and confirm that it cannot be spoofed through untrusted headers.
3. Select an algorithm that fits the traffic pattern and required precision.
4. Set a sustained rate, burst capacity, and scope based on capacity and observed use.
5. Enforce the limit atomically at a shared layer when requests can reach multiple instances.
6. Return a documented 429 response and provide retry guidance where appropriate.
7. Test concurrency, window boundaries, limiter outages, and legitimate peak traffic.
8. Monitor rejections and service health, then adjust the policy based on evidence.

## Troubleshooting common problems

**Legitimate clients receive frequent 429 responses.** Check whether the key is too broad, such as an IP address shared by many users. Review the route, quota scope, burst size, and client retry behavior before simply raising every limit.

**Traffic exceeds the configured quota.** Confirm that all instances use shared, atomic state and the same policy configuration. Look for requests reaching an unprotected route or a different gateway path. Check whether the observed burst is an expected property of the chosen algorithm.

**Clients retry and make overload worse.** Make sure the response provides accurate retry guidance. Recommend exponential backoff with jitter, and check that clients do not immediately retry every 429 response.

**The limiter is slow or consuming too much state.** Review key cardinality, expiry behavior, and storage access patterns. If precise per-request timestamps are costly, consider a counter-based approximation or token bucket, provided it meets the policy requirements.

## FAQ

### Which rate limiting strategy is best for a public API?

There is no universal best choice. A token bucket is a practical option when clients need bounded bursts and sustained traffic must be controlled. A fixed window may be enough for a simple quota. Choose based on endpoint cost, traffic shape, acceptable burst behavior, and implementation constraints.

### Is rate limiting the same as throttling?

The terms are sometimes used interchangeably. Rate limiting describes a policy on request or resource consumption. Throttling often refers to slowing, delaying, or rejecting traffic when a policy or capacity threshold is reached. Be explicit in API documentation about whether excess requests are rejected or queued.

### Should I rate-limit by IP address or API key?

Use the identity that matches the policy. API keys or authenticated accounts are usually more meaningful for customer quotas. IP addresses can help control some unauthenticated traffic, but shared addresses can cause false positives and distributed traffic can evade IP-only controls. Combining dimensions may be appropriate.

### What status code should an API return when a client exceeds a limit?

Use HTTP 429 Too Many Requests for a request rejected because of a rate limit. Include a clear error response and a `Retry-After` header when the time to retry can be determined. Document client backoff behavior.

### Can a rate limiter prevent denial-of-service attacks?

It can help constrain traffic at the application or API layer, but it is not a complete denial-of-service defense. Distributed attacks, upstream bandwidth saturation, and other failure modes require additional network, infrastructure, and capacity protections.

## Conclusion

Effective API rate limiting balances protection with legitimate client needs. Fixed windows are simple, sliding approaches improve rolling-window behavior, token buckets allow controlled bursts, and concurrency limits protect against too much simultaneous work. The right design depends on the resource at risk, client identity, traffic pattern, and tolerance for delay or rejection.

Start with a clearly defined policy, enforce it consistently across instances, return useful 429 responses, and monitor both rejected traffic and service health. Treat limits as an operational control that should evolve as the API and its usage change.
