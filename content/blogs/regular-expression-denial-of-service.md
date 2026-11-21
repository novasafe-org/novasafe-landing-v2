# Regular Expression Denial of Service

Regular expressions are useful for validating input, extracting data, and searching text. But some patterns can take an unexpectedly long time to match particular inputs. If an attacker can supply those inputs, the resulting slowdown can consume application resources and make a service unavailable. This class of issue is known as regular expression denial of service, or ReDoS.

A vulnerable expression is not automatically exploitable: the risk depends on the regex engine, the input an attacker can control, the size limits in place, and how the application runs matches. This guide explains how to assess those factors, recognize common failure modes, and apply proportionate safeguards in web application security.

## What is regular expression denial of service?

Many regex engines use backtracking to explore possible ways a pattern could match a string. When a pattern contains ambiguous choices, the engine may try many combinations before it can confirm a match or report failure. For certain patterns and inputs, the work can grow very quickly as the input gets longer.

For example, consider this JavaScript pattern:

```js
const vulnerable = /^(a+)+$/;
```

It matches one or more `a` characters from start to finish. The nested quantifiers allow the engine to consider multiple ways to divide a run of `a` characters into groups. A string of many `a` characters followed by a character that cannot match, such as `!`, can force the engine to explore those alternatives before it rejects the string.

The precise runtime depends on the engine and its implementation. The important point is that an attacker may be able to trigger disproportionate work with a comparatively small input. If a match runs synchronously on a web server's main thread, it can delay unrelated requests. In other configurations, it may consume CPU in a worker or process instead.

## Common failure modes

Look for patterns that create multiple overlapping ways to match the same text, especially when a later part of the pattern can fail and force the engine to reconsider earlier choices.

### Nested or repeated quantifiers

Examples include `(a+)+` and `(.*)+`. The inner and outer repetition can overlap in what they consume, creating many candidate matches. These patterns are not all equally dangerous in every engine, but they deserve review when they process attacker-controlled input.

### Overlapping alternatives

An expression such as `(a|aa)+$` can match a run of `a` characters in multiple ways: one character at a time or in pairs. A final non-matching character may make the engine revisit many combinations.

### Broad wildcards followed by restrictive checks

A pattern such as `.*something` may scan a large input, and more complicated combinations of broad wildcards, optional groups, and later constraints can make backtracking worse. A wildcard alone does not prove a vulnerability; examine the whole expression and the engine's behavior.

### Unbounded input and repeated matching

Even a pattern with ordinary runtime can become a problem if it is applied to very large inputs, run repeatedly, or evaluated concurrently at high volume. Assess the total work the application permits, not just the regex in isolation.

## How to assess a regex safely

A useful assessment connects the pattern to its real execution path. A suspicious-looking expression is a reason to investigate, not by itself proof of an exploitable issue.

1. **Find the patterns and their call sites.** Search application code, configuration, routing rules, validation libraries, and dependencies. Identify whether each expression runs on a request path, background job, or local-only workflow.
2. **Trace input control.** Determine whether an untrusted user can supply the full string being matched, a substring, or the pattern itself. Note transformations that happen before matching, such as decoding, normalization, or concatenation.
3. **Identify the engine and execution model.** Record the language, regex library, engine version, and relevant flags. Backtracking behavior and available safeguards differ between engines. Also determine whether matching blocks a request thread, event loop, worker, or separate process.
4. **Review the pattern for ambiguity.** Pay particular attention to nested repetition, overlapping alternatives, and broad matches followed by constraints. Consider how the expression behaves on a long near-match that fails near the end.
5. **Test in isolation.** Use a disposable process or sandbox, impose a strict time and resource limit, and start with short inputs. Increase input length gradually while recording elapsed time. Do not run a suspected catastrophic pattern against large inputs in a production process: a synchronous match may prevent an in-process timer from firing.
6. **Confirm application impact.** Check realistic input limits, request timeouts, concurrency, and whether one expensive match can block other work. A finding's severity depends on whether an attacker can reach the code and cause meaningful resource exhaustion.

Static analysis and security scanners can help locate risky expressions, but findings should be verified against the actual engine and call path. A scanner may flag a pattern that is safe under a particular limit or miss a problem introduced by how patterns and inputs are combined.

## Practical safeguards

Choose controls that address the cause and fit the application. Multiple layers are often more reliable than relying on a single regex rewrite.

### Simplify the expression

Prefer a pattern that directly describes the accepted input. For the example above, if the intended input is one or more `a` characters, `^a+$` expresses that without nested repetition:

```js
const safer = /^a+$/;
```

For more complex patterns, reduce overlapping alternatives, avoid unnecessary nested quantifiers, and split validation into understandable steps where that improves clarity. Test that a revised expression still accepts and rejects the intended cases; a faster pattern that changes validation semantics may create a different bug.

### Bound input before matching

Set a maximum length based on the application's requirements and reject oversized input before running expensive validation. Apply limits at the point where data enters the system, and consider limits after decoding or normalization if those steps can change its size. Input length limits do not fix an ambiguous expression, but they can cap the amount of work it can cause.

### Choose an engine suited to the workload

Some regex engines are designed to provide linear-time matching for supported features, often by restricting constructs that require general backtracking. Consider such an engine when matching untrusted input is a central requirement. Check its syntax and feature limitations before switching: a pattern may need to be rewritten, and using a different engine does not remove the need for input limits and testing.

### Use time and resource limits appropriately

Where supported, configure a regex match timeout. Check the language and library documentation for what the timeout covers and how it reports a timeout. If the engine does not offer a reliable timeout, consider isolating risky matching in a process or worker that can be terminated and limiting its CPU and memory. A timeout on the surrounding request is not always sufficient: synchronous matching can block the same event loop that would need to handle the timeout.

### Keep user-provided patterns separate from ordinary input

Allowing users to submit regex syntax introduces a different level of risk: they may control the pattern as well as the text being matched. If this is a necessary feature, consider a restricted syntax or a non-backtracking engine, enforce limits on both pattern and input sizes, and isolate execution. Escaping a value before inserting it into a pattern can prevent unintended regex syntax, but it does not make an independently supplied pattern safe.

### Add operational controls

Rate limits, concurrency limits, request deadlines, and monitoring can reduce the impact of expensive requests. They are defense-in-depth controls, not substitutes for fixing a known problematic expression. Log timeouts and unusual match durations without recording sensitive input unnecessarily.

## A review checklist for development teams

Before approving a regex that processes untrusted data, ask:

- Is the pattern necessary, or would simpler parsing or validation be clearer?
- Can repeated groups or alternatives consume the same characters in multiple ways?
- Does the pattern have a meaningful input length bound?
- Which engine runs it, and does that engine support a match timeout or predictable complexity for this pattern?
- Could a match block other requests or shared application work?
- Have both successful inputs and long, near-matching failures been tested in an isolated environment?
- Are resource limits and monitoring in place for the relevant endpoint or job?

## FAQ

### Is every nested quantifier a vulnerability?

No. Nested quantifiers are a useful review signal, but exploitability depends on the full pattern, engine, input, and execution context. Test and assess the actual code path rather than treating a syntax pattern as conclusive evidence.

### Can an in-process timer stop a slow regex match?

Not necessarily. If the match blocks the event loop or thread responsible for running the timer, the timeout callback may not run until matching finishes. Use an engine-supported timeout or isolate the match so it can be interrupted externally.

### Does limiting input length solve ReDoS?

It can substantially limit risk when the maximum is small enough for the application's workload, but it does not remove the underlying ambiguity. Combine sensible length limits with pattern review, suitable engine behavior, and execution controls.

### Should teams replace all backtracking regex engines?

Not automatically. Backtracking engines support useful features and can be appropriate for trusted, bounded inputs. Consider a non-backtracking engine for workloads that match untrusted data when its supported syntax meets the application's needs, and retain other safeguards either way.

## Conclusion

Regular expression denial of service occurs when matching can consume disproportionate resources, often because a backtracking engine must explore many alternatives before rejecting an input. Developers can reduce risk by tracing attacker-controlled data to regex call sites, testing suspicious patterns in isolation, simplifying ambiguous expressions, and bounding input. Engine choice, timeouts, execution isolation, and operational controls provide additional protection when the workload warrants them. Assess the whole path from input to match so safeguards are proportionate to the actual risk.
