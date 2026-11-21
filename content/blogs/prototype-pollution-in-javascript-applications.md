# Prototype Pollution in JavaScript Applications

Prototype pollution is a class of vulnerability in which attacker-controlled input changes properties on an object’s prototype. Because JavaScript objects can inherit properties, that change may influence code that later reads those properties—even when the affected object never set them directly.

For developers, the key question is not simply whether an application accepts a property named `__proto__`. The more useful question is whether untrusted data can reach code that interprets special property names, merges objects unsafely, or trusts inherited values. This guide explains how to assess prototype pollution in JavaScript applications, recognize common failure modes, and apply safeguards proportionate to the risk.

## How prototype pollution works

JavaScript objects can inherit properties from another object through their prototype chain. For example, if an object does not have its own `role` property, reading `object.role` may return a value inherited from its prototype.

Prototype pollution occurs when an attacker can influence a prototype that is shared by other objects, or otherwise affect objects beyond the intended data structure. A vulnerable merge or property-setting operation may treat special property names as instructions rather than as ordinary data.

Commonly relevant names include:

- `__proto__`, which can interact with a legacy accessor on ordinary objects.
- `constructor` and `prototype`, which may be used in nested property paths to reach a prototype.

The presence of these names in input is not, by itself, proof of a vulnerability. The risk depends on how the application processes them and what code later does with the resulting objects.

### JSON parsing is not the same as pollution

`JSON.parse()` can produce an object with an own property named `__proto__`. Parsing that JSON does not, by itself, change the prototype of the parsed object. Problems can arise later if code copies or merges that property in a way that invokes special object behavior.

This distinction matters during investigations: a scanner finding or a suspicious-looking JSON key is a lead to trace, not a complete diagnosis. Follow the value from its source through transformations to the operation that uses it.

## Common failure modes

### Recursive merges without key checks

A hand-written deep-merge function may recursively copy every input key into a target. If it accepts special property names or traverses inherited properties, an attacker may be able to alter a target’s prototype or reach a sensitive object through a nested path.

For example, this pattern is risky when `source` is untrusted and `target` is an ordinary object:

```javascript
function merge(target, source) {
  for (const key in source) {
    const value = source[key];

    if (value && typeof value === 'object') {
      target[key] = merge(target[key] || {}, value);
    } else {
      target[key] = value;
    }
  }

  return target;
}
```

The `for...in` loop can include inherited enumerable properties, and the code does not restrict which keys it copies. Depending on the input and runtime behavior, assignments or recursive traversal can interact with special property names. Replacing `for...in` with `Object.keys()` addresses inherited enumeration but does not, by itself, make arbitrary recursive merging safe.

### Assuming a familiar API is always safe

Different JavaScript operations handle properties differently. For example, `Object.assign()` writes properties to its target and can invoke setters on that target. Object spread creates own properties on a new object instead. These differences can matter for a particular pollution path, but they are not a substitute for validating untrusted data or reviewing the complete flow.

Likewise, a library’s reputation or a recent upgrade does not establish that every use is safe. Check the specific version, merge behavior, options, and how the application supplies input.

### Trusting inherited properties

Code that checks a value with `if (config.isAdmin)` or reads `options.enabled` may accept an inherited property as if it had been set intentionally. This is especially risky when security-sensitive decisions depend on the value.

When the application needs to know whether a property was explicitly supplied, check for an own property, for example with `Object.hasOwn(config, 'isAdmin')`, and validate its value and type. An own-property check is a useful guard, but it does not make an unsafe merge safe.

### Allowing arbitrary keys in configuration or request data

Configuration loaders, API handlers, plugin systems, and user-profile updates often accept flexible object shapes. If the application copies every supplied key into an internal object, an attacker may be able to influence properties that were never intended to be user-controlled.

A fixed schema with explicit fields is safer than accepting arbitrary object keys, particularly for authorization settings, feature flags, and other security-sensitive options.

## How to assess prototype pollution risk

A practical assessment follows the data flow and the consequences rather than focusing on one payload.

1. **Identify untrusted object sources.** Look at request bodies, query parameters, cookies, imported files, message queues, user-controlled configuration, and data returned by external services. JSON input is still untrusted even when it is syntactically valid.
2. **Find copying and merge operations.** Search for recursive merge helpers and uses of utilities such as `Object.assign()`, configuration-merging packages, and generic property setters. Review custom path-setting code that accepts a property path from input.
3. **Trace key handling.** Determine whether code copies keys such as `__proto__`, `constructor`, or `prototype`, whether it enumerates inherited properties, and whether it writes to ordinary objects.
4. **Check downstream reads.** Look for inherited-property reads that affect authorization, routing, template rendering, feature selection, or other sensitive behavior. Pollution may have no meaningful impact if no relevant code consumes the affected property, but that conclusion should be based on the actual data flow.
5. **Review dependencies and versions.** Identify packages that merge or set nested properties. Use the project’s normal dependency-audit process, review relevant advisories, and update to a maintained fixed version where one applies. A dependency scan is a starting point, not a replacement for checking how the package is used.
6. **Test in an isolated environment.** Use a test instance with harmless marker values. Check whether a suspicious input changes an object’s prototype or causes unrelated objects to expose a property they did not set. Avoid running destructive tests against production.

Useful code-search terms include `merge`, `assign`, `set`, `deep`, and `Object.keys`, as well as property-path utilities. Search results need manual review: safe uses and vulnerable uses can look similar at a glance.

## Safeguards for JavaScript applications

### Prefer schemas and explicit field selection

For API requests and configuration, define which fields are accepted and validate their types and values. Copy only those fields into the application’s internal representation. Reject unexpected keys when practical, especially in security-sensitive objects.

This is generally more robust than accepting any key except a short list of known dangerous names. A denylist can be a useful additional defense, but it may miss a new path or behave unexpectedly when applied inconsistently.

### Avoid generic deep merges of untrusted data

Where possible, replace a generic merge with code that updates specific fields. If a general-purpose merge is genuinely needed, use a maintained implementation, understand its handling of special keys, and configure it according to the data model. Keep the dependency current and add tests for the behavior your application relies on.

### Reject dangerous keys when normalizing JSON

For a JSON-only input, a normalization step can reject special keys before the data reaches other code. This example also creates null-prototype objects for records, so copied keys cannot invoke inherited setters on those records:

```javascript
const dangerousKeys = new Set(['__proto__', 'constructor', 'prototype']);

function normalizeJson(value, depth = 0) {
  if (depth > 20) {
    throw new Error('Input is too deeply nested');
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeJson(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const result = Object.create(null);

    for (const key of Object.keys(value)) {
      if (dangerousKeys.has(key)) {
        throw new Error('Input contains a disallowed property');
      }

      result[key] = normalizeJson(value[key], depth + 1);
    }

    return result;
  }

  return value;
}

const parsed = JSON.parse(requestBody);
const safeInput = normalizeJson(parsed);
```

The depth limit shown is an example, not a universal setting. Applications should also set appropriate request-size and collection-size limits. This function is intended for values produced by JSON parsing; do not assume it safely handles arbitrary JavaScript objects with getters, proxies, or other custom behavior.

Rejecting `constructor` or `prototype` may be too restrictive for some legitimate data models. If those names are valid business fields, prefer a schema that explicitly determines where they are allowed rather than applying a broad rule without considering compatibility. Also note that null-prototype objects do not have methods such as `hasOwnProperty`; use `Object.hasOwn()` or `Object.prototype.hasOwnProperty.call()` when checking them.

### Use own-property checks for security decisions

When a decision should depend only on a value explicitly provided on an object, check ownership and validate the value:

```javascript
if (Object.hasOwn(settings, 'enabled') && settings.enabled === true) {
  enableFeature();
}
```

For older runtimes without `Object.hasOwn()`, use `Object.prototype.hasOwnProperty.call(settings, 'enabled')`. Do not rely on truthiness alone for authorization or other security controls.

### Consider `Map` for dynamic dictionaries

If keys are user-controlled labels rather than application object fields, a `Map` can make the intended behavior clearer and avoid treating those labels as object properties. It is not a complete input-validation strategy: validate allowed values, limits, and business rules regardless of the data structure.

### Add regression tests

Tests should cover special keys at the levels your application accepts, including nested input if nested objects are valid. Assert that invalid input is rejected or safely handled and that unrelated objects do not gain unexpected properties. Keep tests focused on observable application behavior rather than assuming a particular exploit payload applies to every runtime or library.

## Troubleshooting assessment findings

- **A scanner reports a vulnerable merge package:** Confirm the installed version and affected code path. Determine whether untrusted input reaches the relevant operation, then update or replace the package and test the application’s expected merge behavior.
- **A test finds `__proto__` in parsed input:** Check whether it is merely an own data property or whether a later operation changes a prototype. Trace subsequent copies, merges, and property reads before classifying impact.
- **A workaround breaks configuration:** Check whether valid data uses a newly blocked key or depends on ordinary object prototypes. Prefer narrowing accepted fields and adapting consumers over removing safeguards wholesale.
- **A fix passes unit tests but risk remains unclear:** Add an integration test for the complete input path, including parsing, validation, transformation, and the security-sensitive use of the resulting data.

## Frequently asked questions

### Is every `__proto__` property a vulnerability?

No. The property may appear as ordinary input data, and JSON parsing alone does not necessarily pollute a prototype. The risk depends on later operations and whether an affected property can influence application behavior.

### Does using `Object.create(null)` solve prototype pollution?

It helps when using an object as a dictionary because the object has no inherited prototype or inherited setters. It does not validate input, fix an unsafe merge elsewhere, or protect code that later copies the data into an ordinary object. Consider compatibility with code that expects standard object methods.

### Can prototype pollution lead to account takeover or code execution?

It can create serious downstream effects if polluted properties influence sensitive application logic, but the outcome is not automatic. Assess the affected property, the code that reads it, and the execution context before making an impact claim.

### Are `constructor` and `prototype` always forbidden?

Not universally. They are important names to review in generic nested-object handling because some vulnerable paths use them. Whether to reject them depends on the application’s schema and how it processes those properties.

## Conclusion

Prototype pollution in JavaScript applications is best assessed as a data-flow and object-handling problem. Identify untrusted sources, review merge and property-setting logic, and determine whether inherited values can influence security-sensitive behavior. Prefer explicit schemas and field selection, avoid generic deep merges of untrusted input, and use own-property checks where ownership matters. Add regression tests for the real application path, then choose safeguards that address the demonstrated risk without breaking valid data handling.
