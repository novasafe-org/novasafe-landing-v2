# GraphQL Query Complexity Protection

GraphQL lets clients request exactly the fields they need, but that flexibility can make server costs hard to predict. A short query may trigger deeply nested lookups, expensive calculations, or large collections of records. Without safeguards, a client can submit a valid operation that consumes excessive CPU, memory, database capacity, or downstream service calls.

GraphQL query complexity protection helps an API estimate or constrain that work before it becomes an availability problem. It is most effective as part of a layered design: combine operation analysis with pagination limits, runtime timeouts, rate limits, and efficient resolver behavior. No single complexity score can perfectly predict the cost of every request.

This guide compares common approaches, explains their tradeoffs, and offers criteria for choosing a defensive design.

## What does GraphQL query complexity mean?

A GraphQL operation’s cost is not determined by its character count. Consider a query that requests a user and the user’s posts:

```graphql
query UserAndPosts($userId: ID!, $first: Int!) {
  user(id: $userId) {
    name
    posts(first: $first) {
      title
      comments(first: 20) {
        author {
          name
        }
      }
    }
  }
}
```

The query is compact, but its work can grow with the number of posts and comments returned. Each nested collection may cause additional resolver calls, database reads, or service requests. Whether those operations are batched or indexed also changes the actual cost.

A **complexity score** is an estimate assigned to an operation before execution. A simple model assigns a base cost to each field and adds costs for nested selections. A more useful model also considers arguments, such as pagination limits, and field-specific costs, such as a search or report resolver.

The score is an admission-control signal, not a guarantee of execution time. Two operations with the same score may have very different real-world costs.

## Common protection approaches

### 1. Maximum query depth

A depth limit rejects operations whose selection trees exceed a configured number of nested levels.

**Advantages**

- Simple to understand and configure.
- Helps prevent extremely deep recursive selections.
- Can be useful as a basic safeguard on APIs with predictable schemas.

**Limitations**

- Depth is not a measure of breadth or data volume. A shallow query can request many records or expensive fields.
- A deep query may be inexpensive if its fields are cheap and tightly bounded.
- A single global threshold may be too strict for some legitimate operations and too permissive for others.

Use depth limits as a guardrail, not as the only form of GraphQL query complexity protection.

### 2. Weighted field complexity

A weighted model assigns costs to fields and combines them across the operation. For example, a scalar field might cost 1, while a full-text search or analytics field might cost 20. A connection field’s cost can increase with its requested page size.

A simplified model might look like this:

```text
cost(field) = baseCost(field) + multiplier(field, arguments) × childCost
```

The exact calculation depends on the estimator. For a list field, the multiplier might use a validated `first` argument, with a configured fallback when no limit is supplied. The total operation score is then compared with an allowed maximum.

**Advantages**

- Can reflect differences between inexpensive and expensive resolvers.
- Can account for arguments that affect data volume.
- Supports a single budget across fields with different costs.

**Limitations**

- Requires a maintained cost model and careful defaults.
- May misestimate work when resolver behavior depends on data, cache state, or downstream systems.
- A field cost that ignores pagination or nested list sizes can create a false sense of protection.

Weighted complexity is often a good fit when clients send dynamic operations and the schema has a mix of cheap and expensive fields.

### 3. Pagination and argument limits

Pagination controls limit the amount of data returned by collection fields. Enforce maximum values on arguments such as `first` and `last`, and require pagination for potentially large collections. Validate these limits on the server; a client-side convention is not a security boundary.

Pagination is valuable even when complexity analysis is enabled. It provides a direct bound on a major source of work, while a complexity score can account for the combined shape of the operation. Pagination alone does not constrain expensive scalar fields, broad search operations, or costly resolver behavior.

### 4. Persisted or allowlisted operations

With persisted operations, clients send an operation identifier rather than arbitrary query text. The server looks up a previously registered operation. An allowlist can restrict execution to reviewed operations, and each registered operation can be tested or assigned a known budget.

**Advantages**

- Limits which operation shapes can reach execution when arbitrary operations are disallowed.
- Makes it easier to inspect, test, and monitor known client operations.
- Can reduce repeated parsing and validation work when the implementation supports caching.

**Limitations**

- Requires an operation registration and deployment workflow.
- Does not make an approved operation harmless: variables may still request too much unless bounded.
- Is less convenient for public APIs that intentionally support ad hoc queries or third-party clients.

Persisted operations are particularly useful for controlled clients, such as a first-party application. They work best alongside argument validation and runtime limits.

### 5. Runtime and infrastructure controls

Request timeouts, database statement limits, concurrency limits, and rate limits constrain the impact of work that passes pre-execution checks. Rate limits may be applied by account, API key, client, or another trusted identity. Consider both request counts and resource-oriented measures where practical; one request can represent much more work than another.

These controls are essential backstops, but they do not replace query analysis. A timeout can stop a slow request after resources have already been consumed, and a request-count limit alone treats cheap and expensive operations alike.

## Choosing a defensive design

Choose controls based on how clients use the API, how predictable resolver costs are, and what the service can measure.

| Approach | Best suited to | Main blind spot |
|---|---|---|
| Depth limit | Basic protection against deeply nested selections | Does not measure breadth or resolver cost |
| Weighted complexity | Dynamic queries with varied field costs | Estimate quality depends on the cost model |
| Pagination limits | Collections and other variable-sized results | Does not cover all expensive work |
| Persisted operations | Controlled, first-party clients | Approved operations can still be costly with unbounded variables |
| Runtime limits and rate limits | Limiting impact across the service | Often react to resource use rather than preventing costly shapes |

For many APIs, a practical baseline is to enforce pagination limits, apply a complexity budget, and use request and execution limits. Add a depth limit if deeply nested selections are a meaningful risk. Use persisted operations when the client and release process allow an operation allowlist.

## Implementing a complexity budget

The following example illustrates the shape of a complexity rule using the `graphql-query-complexity` package. Exact integration depends on your GraphQL server and version; install the rule in the server’s validation pipeline, before resolvers execute.

```js
import {
  createComplexityLimitRule,
  fieldExtensionsEstimator,
  simpleEstimator,
} from "graphql-query-complexity";

const complexityRule = createComplexityLimitRule({
  maximumComplexity: 500,
  estimators: [
    fieldExtensionsEstimator(),
    simpleEstimator({ defaultComplexity: 1 }),
  ],
  onCost: (cost) => {
    console.info("GraphQL operation complexity", { cost });
  },
});
```

This is a configuration example, not a universal threshold. Check the package documentation for the API supported by your installed version and connect the rule through the appropriate validation hook for your server. A field-extension estimator can read costs defined in schema field extensions, while a simple estimator provides a fallback. Configure list-field costs so they account for validated pagination arguments; a constant cost for every list size will not represent variable result volumes.

A useful rollout process is:

1. **Inventory costly fields.** Identify list resolvers, search, reporting, fan-out calls, and fields that trigger expensive computation.
2. **Bound variable inputs.** Validate pagination and other cost-driving arguments, including defaults and maximums.
3. **Assign and test costs.** Start with conservative estimates for expensive fields. Test representative operations at their maximum allowed arguments and inspect resolver and database behavior.
4. **Observe before tightening.** In a controlled rollout, record operation scores and rejection counts. Avoid logging sensitive variables or full query contents unless you have a clear need and appropriate safeguards.
5. **Set the budget.** Choose a maximum based on service capacity, latency goals, and observed workloads. Consider different budgets for trusted client classes only when identity and policy enforcement are reliable.
6. **Handle rejections clearly.** Return a client-safe validation error that explains the limit and, where useful, how to reduce the operation. Do not expose internal cost calculations or infrastructure details unnecessarily.
7. **Reassess over time.** Schema changes and resolver changes can alter real costs. Review the model when adding fields or changing data access patterns.

## Security and implementation considerations

### Analyze the expanded operation

Fragments and aliases can make source text look smaller than the work it represents. Complexity analysis should account for the operation’s selected fields after fragment expansion and should handle repeated selections according to GraphQL execution semantics. Confirm how your chosen tool treats aliases, fragments, directives, and variables, then test those cases.

### Validate variables and defaults

A cost estimator that uses a pagination argument needs a safe value when the argument is omitted, invalid, or supplied through a variable. Enforce argument bounds in server-side validation or resolver logic as appropriate. Do not assume the estimator alone replaces input validation.

### Treat mutations and subscriptions separately

Mutations may have side effects and can invoke costly downstream work. Apply appropriate authorization, input validation, and rate controls, and consider whether mutation operations need distinct budgets. Subscriptions create longer-lived work and may execute repeatedly as events arrive; a one-time query complexity check is not a complete control for their ongoing resource use. Apply connection limits, authorization, and lifecycle controls suited to subscription behavior.

### Avoid relying on one score

Database indexes, batching, caching, concurrency, and data distribution affect execution cost. Monitor real signals such as resolver duration, database load, timeout rates, and rejection rates alongside estimated complexity. A score is useful only when its assumptions remain aligned with the implementation.

### Keep authorization independent

Complexity limits are availability controls, not access controls. Enforce authorization for every protected field and object, even when an operation is within budget. Avoid exposing sensitive information through detailed validation errors or operational logs.

## Common mistakes

- **Using depth as the only limit:** shallow, wide operations can still be costly.
- **Leaving collections unbounded:** a complexity rule cannot help if list costs ignore result size.
- **Setting the maximum without measurement:** overly high limits may not constrain abuse; overly low limits can reject legitimate work.
- **Counting requests instead of their cost:** request-rate controls may not distinguish a simple lookup from an expensive operation.
- **Treating persisted operations as a complete defense:** variable values and resolver behavior still need limits.
- **Forgetting operational visibility:** without rejection and performance metrics, it is difficult to tune the policy or spot regressions.

## FAQ

### Is a GraphQL depth limit the same as query complexity protection?

No. A depth limit restricts nesting. Complexity protection estimates the combined cost of selected fields and may account for field weights and arguments. Depth can complement complexity analysis, but it does not measure how much work a shallow operation triggers.

### What is a good maximum complexity score?

There is no universal value. Scores depend on the estimator, schema, resolver behavior, and available capacity. Begin with representative operations, enforce input bounds, observe scores and real resource use, and choose a limit that supports legitimate workloads without allowing unacceptable work.

### Should every GraphQL API use persisted operations?

Not necessarily. They are a strong option when clients and operations are controlled, but may be impractical for public APIs that support arbitrary queries. Complexity analysis and runtime protections can still help APIs that accept ad hoc operations.

### Can query complexity limits prevent denial-of-service attacks?

They can reduce the risk from operations whose cost is recognized by the model, but they cannot prevent every denial-of-service scenario. Combine them with authentication where appropriate, rate and concurrency controls, timeouts, input limits, secure resolver design, and infrastructure monitoring.

## Conclusion

GraphQL query complexity protection is most reliable when it reflects how the API actually performs work. Depth limits are simple guardrails, weighted complexity can model different resolver costs, pagination caps data volume, persisted operations restrict operation shapes, and runtime controls limit impact. Compare their tradeoffs rather than relying on a single mechanism. Start with bounded inputs and a measured complexity model, then layer controls according to your clients, schema, and operational requirements.
