# Cache Poisoning in Web Applications

A shared cache can make a web application faster and more resilient by serving a saved response instead of contacting the origin for every request. But if the cache and the application disagree about which requests should receive the same response, an attacker may be able to influence what gets stored and served to other users. This class of issue is known as cache poisoning.

For developers, the key challenge is not simply to “turn caching off.” It is to make sure that the cache key accurately represents every request property that can change a response—or to prevent sensitive and variable responses from being shared at all. This guide explains how cache poisoning in web applications happens, compares defensive approaches, and provides practical criteria for choosing a design.

## What is cache poisoning?

A cache poisoning vulnerability occurs when an attacker can cause a cache to store a response that is incorrect or unsafe for other requests that map to the same cache entry. The cache may be a reverse proxy, content delivery network (CDN), application-level cache, or another shared intermediary.

A simplified shared-cache flow looks like this:

1. A client sends a request.
2. The cache calculates a key from selected request properties, often including the URL and host.
3. If the key has a stored response, the cache returns it. Otherwise, the cache forwards the request to the origin.
4. The origin generates a response, and the cache may store it under the calculated key.
5. Later requests with the same key may receive that stored response.

Poisoning is possible when a request property changes the origin’s response but is not represented in the cache key, or when the cache and origin interpret a request differently. An attacker may then send a request that produces a harmful response at the origin, which the cache stores for other users.

Potential consequences depend on the application and the response. They can include incorrect content, broken functionality, exposure of information, or delivery of attacker-influenced content. The impact is not determined by caching alone: it depends on what can be influenced, what gets cached, who shares the cache entry, and how long the response remains available.

## How cache poisoning happens

The central risk is a mismatch between **response selection** and **cache-key construction**. The origin may consider more inputs than the cache does.

For example, suppose an origin reflects a request header into a page, but the CDN keys the response only by host and path. If the origin’s response is cacheable, a request with a chosen header value could lead to a response being stored under a key shared with ordinary visitors. Whether this is exploitable depends on the origin’s behavior and the cache’s exact configuration; the example illustrates the underlying mismatch, not a guarantee of impact.

Common sources of mismatch include:

- **Unkeyed headers:** The application uses a header to build links, select content, or alter output, while the cache does not include that header in its key.
- **Host or forwarding headers:** The application trusts values such as `Host` or proxy-related headers when generating redirects or absolute URLs, but the cache and origin validate or interpret them differently.
- **Query-string handling:** The cache ignores, reorders, or selectively removes query parameters that the application uses to change its response.
- **Cookies and authentication state:** The origin produces user-specific content, but the response is stored in a cache shared with other users.
- **Content negotiation:** The origin varies output by a header such as `Accept-Language` or `Accept-Encoding`, but the cache does not account for that variation correctly.
- **Path normalization:** The cache and origin disagree about encoded characters, duplicate slashes, path case, or other URL forms.
- **Cache directives and configuration:** The origin’s caching headers, CDN rules, or application-specific cache settings allow a response to be stored more broadly or longer than intended.

A response is not automatically safe to cache just because it is publicly reachable. Developers should examine whether it varies by identity, request headers, cookies, query parameters, or other inputs, and verify how the actual cache handles those inputs.

## Cache poisoning versus cache deception

Cache poisoning and cache deception are related but distinct problems:

- **Cache poisoning** involves getting an unsafe or incorrect response stored under a key that other requests use.
- **Cache deception** typically involves persuading a cache to store a response that should not have been shared, often by exploiting differences in how the cache and origin interpret a URL. A personalized response may then be served from a shared cache.

Both can arise from inconsistent caching rules or request interpretation. The distinction helps describe the attack, but the same defensive review should ask what the cache stores, how it builds keys, and whether different users can receive the same entry.

## Defensive approaches and their tradeoffs

There is no single cache configuration that fits every route. The main approaches are to vary the cache key, normalize inputs, bypass shared caching, or combine these controls.

### 1. Include response-changing inputs in the cache key

If a response legitimately varies based on a request property, the cache key can include that property. For HTTP caches, the `Vary` response header communicates selected request-header variation. For example:

```http
Vary: Accept-Language
```

This indicates that responses may differ according to the `Accept-Language` request header. CDNs and reverse proxies may also have product-specific cache-key settings for query parameters, cookies, headers, or other dimensions.

**Advantages**

- Preserves shared caching for responses that have a finite, understood set of variants.
- Makes the intended variation explicit when supported consistently by the cache chain.

**Tradeoffs**

- Every additional key dimension can create more cache entries, reduce the hit rate, and increase storage or operational complexity.
- High-cardinality values, such as arbitrary headers or user-specific cookies, can create many distinct entries.
- A key is only effective if every cache layer uses compatible rules. A CDN, reverse proxy, and application cache may not share the same configuration.
- Adding a value to the key does not make it trustworthy. The application still needs to validate and safely use request data.

Use this approach when the response has a small, known set of legitimate variants and the cache can reliably represent them.

### 2. Normalize or reject ambiguous inputs

The application and cache should interpret URLs and headers consistently. Normalize valid inputs at a well-defined boundary, and reject malformed or conflicting forms rather than letting different layers resolve them differently.

Examples include:

- Allowing only expected hostnames and constructing canonical URLs from trusted configuration.
- Parsing query parameters consistently and defining which parameters affect the response.
- Rejecting duplicate or malformed parameters where their interpretation could differ across components.
- Avoiding reliance on untrusted forwarding headers unless a trusted proxy sets and sanitizes them.
- Ensuring that the CDN and origin agree on path normalization and encoding behavior.

**Advantages**

- Reduces ambiguity and may prevent multiple request forms from reaching the same cache entry with different origin behavior.
- Can simplify cache keys when the application has a clear canonical representation.

**Tradeoffs**

- Normalization must match the behavior of all relevant infrastructure. A fix in only one layer may leave the discrepancy intact.
- Aggressive normalization can change application behavior or reject legitimate requests.
- It does not replace correct caching rules for personalized or otherwise variable responses.

Use normalization when multiple representations of the same logical input are unnecessary, or when cache and origin parsing differences create risk. Document the canonical form and test it across the full request path.

### 3. Bypass shared caching for sensitive or highly variable responses

For authenticated, personalized, or sensitive content, the simplest safe design is often not to store the response in a shared cache. Depending on the application and cache behavior, response directives may include:

```http
Cache-Control: private, no-store
```

`private` indicates that a shared cache should not store the response; `no-store` instructs caches not to store it. Confirm how these directives are handled by every intermediary in your deployment, especially if a CDN has rules that override origin headers.

**Advantages**

- Avoids the need to create a shared cache key for many user-specific values.
- Reduces the chance that one user’s response will be reused for another user.

**Tradeoffs**

- Reduces or removes shared-cache benefits for those routes.
- May not address application-level caching or a proxy configured to ignore response directives.
- Requires careful handling of every response path, including errors and redirects that may contain user-specific data.

Use this approach for responses whose safe sharing cannot be established, particularly when they depend on authentication or sensitive account data.

### 4. Separate cacheable and non-cacheable routes

A clear route-level policy is often easier to reason about than broad rules with many exceptions. Public assets or pages with stable content can use shared caching, while account pages and personalized API responses bypass it. Apply the policy at the layer that controls the cache, and keep origin behavior aligned with it.

For example, a public product catalog might be cacheable with a short freshness lifetime, while a user’s account endpoint is marked private and excluded from CDN caching. The exact policy depends on how quickly the content changes and which request properties affect the response.

**Advantages**

- Makes expected behavior easier to document, review, and test.
- Limits the number of routes that need complex cache-key variation.

**Tradeoffs**

- Broad route patterns can accidentally include or exclude endpoints.
- Application changes can introduce new personalized behavior on a route that was previously public.

Use route separation when public and user-specific functionality can be cleanly divided. Revisit the policy when response behavior changes.

## Choosing an appropriate defensive design

Use these questions to select and validate a strategy:

1. **Can the response vary by user or sensitive state?** If yes, avoid shared caching unless there is a carefully designed and verified isolation mechanism.
2. **Which request inputs actually change the response?** Identify relevant headers, cookies, query parameters, host values, and path components. Do not guess based only on the URL.
3. **Are the variations finite and predictable?** If so, keying on a small set of dimensions may be practical. If they are arbitrary or high-cardinality, bypassing shared caching may be safer and simpler.
4. **Do all layers use the same interpretation?** Compare CDN, proxy, framework, and application behavior for the same request. A correct origin policy can be undermined by an inconsistent intermediary.
5. **What is the cost of a cache miss or stale response?** Consider performance, content freshness, and the consequences of serving a response to the wrong audience.
6. **Can the policy be tested and monitored?** Prefer a design that can be expressed in configuration, reviewed, and verified with repeatable tests.

A practical default is to cache only responses that are intentionally public and whose variation is understood. Add key dimensions only for legitimate, bounded variation. Keep personalized responses out of shared caches unless the isolation model is explicit and proven in the deployed configuration.

## Practical review and testing checklist

Review cache behavior in a staging environment that matches production as closely as possible. Avoid testing with real user data or sending potentially harmful content to a public cache.

- Inventory every cache layer, including CDN, reverse proxy, framework, and application caches.
- For each route, record whether it is public, personalized, or sensitive, and document its cache policy.
- Compare the cache key with the inputs the origin uses to generate the response.
- Test relevant query parameters, headers, cookies, host values, and path encodings using safe, distinctive values.
- Send requests in different orders and verify that one request does not alter the response another user or request context receives.
- Inspect response headers such as `Cache-Control`, `Vary`, and cache-specific hit or status headers. These are useful evidence, but confirm behavior at the cache itself rather than relying on headers alone.
- Check redirects, errors, and alternate content types; they may follow different caching rules from successful HTML responses.
- Verify that CDN rules do not override intended origin directives or include untrusted input in generated cache keys.
- Test purge and invalidation procedures so that an incorrect entry can be removed promptly.
- Repeat relevant tests after changes to routing, middleware, CDN configuration, or response generation.

When troubleshooting a suspicious response, first determine whether it came from a cache, which cache layer served it, and what key that layer used. Then compare the original request with the requests receiving the stored response. Do not assume that adding a cache-busting parameter is a reliable diagnostic: the cache may ignore that parameter, or it may create a different key than expected.

## Common implementation mistakes

- **Caching authenticated responses by URL alone:** A URL does not necessarily identify the user or the response’s authorization context.
- **Adding every header to the key:** This can create excessive variants without fixing unsafe application behavior. Key only on inputs that legitimately determine a cacheable response.
- **Treating `Vary` as a universal fix:** It helps communicate header-based variation, but it does not solve every CDN-specific configuration issue or account for cookies and other inputs automatically.
- **Trusting a single cache layer:** A CDN may honor different settings from an origin proxy or application cache. Verify the complete path.
- **Assuming a public route always returns public content:** A route can become personalized as the application evolves. Review response behavior, not just route names.
- **Ignoring purge behavior:** A configuration fix may stop future poisoning but leave an incorrect response available until it expires or is explicitly invalidated.

## FAQ

### Does cache poisoning require a vulnerability in the application code?

Not necessarily. The problem can result from a mismatch between application behavior and cache configuration, including rules in a CDN or reverse proxy. However, application code that reflects untrusted inputs, trusts unvalidated headers, or returns personalized content under a shared-cache policy can contribute to the risk.

### Is `Vary: Cookie` a good way to protect personalized pages?

It depends on the cache and the application, and it is not a universal substitute for a private or non-cacheable policy. Cookies can have many possible values, producing a large number of cache entries, and cache products may handle cookies differently. For sensitive or user-specific pages, excluding the response from shared caching is often easier to reason about. Verify the actual behavior of your infrastructure before relying on cookie-based variation.

### Should every dynamic response bypass the cache?

No. A response can be dynamically generated and still be safe to share if its output is public, its variation is understood, and the cache key and freshness policy are correct. The decision should be based on response sensitivity and variation, not simply on whether the response is generated dynamically.

### What should I do if a cache has stored an unsafe response?

Correct the underlying cache or application behavior, then purge or invalidate affected entries using the procedures for your cache layers. Verify the fix with controlled requests and confirm that the response is no longer served from an incorrect entry. If sensitive information may have been exposed, follow your organization’s incident response and notification processes.

## Conclusion

Cache poisoning in web applications is fundamentally a problem of shared state and mismatched assumptions: the origin changes a response based on inputs that the cache does not represent, or the two layers interpret a request differently. Effective web application security therefore depends on treating cache behavior as part of the application’s design, not as an isolated performance setting.

For each route, identify what changes the response, decide whether it is safe to share, and choose among bounded cache-key variation, consistent input normalization, or bypassing shared caching. Then test the complete request path—including cache rules, origin behavior, and purge procedures. A deliberate policy is safer and easier to maintain than relying on defaults.
