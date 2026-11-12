# Stored vs Reflected vs DOM-Based XSS

Cross-site scripting (XSS) is not a single injection pattern. The terms **stored**, **reflected**, and **DOM-based** describe different aspects of how attacker-controlled data reaches an executable context in a browser. Understanding those distinctions helps developers test the right paths, reproduce findings accurately, and choose fixes that address the underlying cause.

This guide compares the three forms of XSS and provides a practical workflow for evaluating them in an application you own or are explicitly authorized to test. The examples use harmless proof-of-execution checks; do not test systems without permission.

## The short version

| Type | Where the input typically travels | What distinguishes it | Common example |
|---|---|---|---|
| Stored XSS | Input is saved and later delivered to users | The application persists the input before it is rendered | A profile field appears unsafely on a profile page |
| Reflected XSS | Input is included in an immediate response | The input is returned in a response, often after a request | A search term is inserted unsafely into a results page |
| DOM-based XSS | Client-side code moves data into an unsafe browser sink | The vulnerable source-to-sink flow occurs in browser JavaScript | A URL fragment is assigned to `innerHTML` |

These labels are not always mutually exclusive. Stored and reflected describe how data is delivered, while DOM-based describes a client-side source-to-sink execution path. For example, data saved in a profile could later reach an unsafe DOM sink, making the issue both stored and DOM-based.

## What XSS means in practice

XSS occurs when untrusted data is interpreted as executable content in a user’s browser. The relevant question is not simply whether input contains characters such as `<` or `>`. It is whether the application places that input into a browser context where it can change the page’s structure or behavior.

The context matters. HTML text, an HTML attribute, a JavaScript string, a URL, and CSS each have different parsing rules. A defense that is safe for one context may be ineffective in another. The most reliable general approach is to avoid treating untrusted input as code: use context-aware output encoding, safe DOM APIs, and narrowly scoped sanitization when rich HTML is a product requirement.

## Stored XSS

Stored XSS occurs when an application saves attacker-controlled data and later renders it in a way that the browser interprets as executable content. The storage layer might be a database, a content management system, a message queue, or another persistence mechanism. The important property is that the input survives the original request and is delivered later.

Common locations to review include:

- User profiles, display names, and biographies
- Comments, reviews, support tickets, and messages
- Uploaded file names or metadata
- Administrative dashboards that display user-submitted content
- Logs or moderation tools that render submitted values

Stored XSS can affect users other than the person who submitted the data. The eventual viewer, their permissions, and the vulnerable page’s context determine the practical impact. Do not assume that a finding is harmless because the test account can only view its own submission.

### How to evaluate it

1. In an authorized test environment, submit a unique marker such as `xss-test-7f31` into a candidate field.
2. Check every relevant view that may display the value, including detail pages, lists, search results, and administrative interfaces.
3. Inspect the rendered DOM and the server response to determine where the marker appears and how it is encoded.
4. If the marker is inserted into an executable context, use a harmless proof of execution only in a controlled environment. A simple `alert(document.domain)` can demonstrate execution without collecting or transmitting data.
5. Remove the test record and verify that it no longer appears in other views or cached pages.

A stored value may be rendered safely in one page and unsafely in another. Test the different output paths rather than treating a single safe rendering as proof that the data is safe everywhere.

## Reflected XSS

Reflected XSS occurs when data from a request is included in the response associated with that request and is rendered unsafely. It commonly involves query parameters, form submissions, or path values, but other request inputs can also be relevant.

For example, a search page may read a query parameter and display it in a heading. If the value is inserted as HTML rather than encoded as text, crafted input could be interpreted by the browser. A reflected issue generally requires a victim to follow a crafted link or submit a crafted request; that does not make it safe or non-exploitable.

### How to evaluate it

1. Identify request parameters and form fields that are echoed in page content, error messages, or validation responses.
2. Submit a unique marker, such as `reflect-test-29ac`, and inspect the response body and rendered page.
3. Determine the exact output context. A marker in an HTML text node is different from one inside an attribute or script block.
4. In a non-production environment, use a harmless execution check if inspection confirms a plausible injection point.
5. Repeat with relevant response states, such as valid and invalid searches, localization, and authenticated versus unauthenticated views.

A quick command-line check can help locate a marker in a response, but it cannot establish whether the browser executes it:

```bash
curl -sG 'https://app.example.test/search' \
  --data-urlencode 'q=reflect-test-29ac' | grep -o 'reflect-test-29ac'
```

Use a test host and account that are within scope. Follow redirects and inspect the final response when the application’s behavior depends on them. Confirm execution in a browser, because server output alone does not show how the browser parses the page.

## DOM-based XSS

DOM-based XSS occurs when client-side JavaScript reads untrusted data from a source and passes it to a browser API or other sink in a way that enables script execution. The vulnerable transformation can happen entirely in the browser, so the server response may not contain the injected value as executable markup.

Potential sources include `location.search`, `location.hash`, `document.referrer`, and message data received from another window. Potentially dangerous sinks include `innerHTML`, `outerHTML`, `document.write`, and certain script or URL-related APIs when used with untrusted values. The security of a sink depends on its specific API and the data’s context; not every use of a listed API is automatically exploitable.

A simplified vulnerable example is:

```javascript
const message = new URLSearchParams(location.search).get('message');
document.querySelector('#message').innerHTML = message;
```

If the input is intended to be plain text, use a text-only API instead:

```javascript
const message = new URLSearchParams(location.search).get('message');
document.querySelector('#message').textContent = message ?? '';
```

### How to evaluate it

1. Review client-side code for flows from controllable sources to HTML, script, URL, or other sensitive sinks.
2. Test query parameters and URL fragments separately. A fragment is not normally sent in the HTTP request, so a server-side response inspection will not reveal client-side processing of it.
3. Set a unique marker in the candidate source, then use browser developer tools to inspect the DOM and trace relevant code. Search bundled scripts if source maps or readable source are available.
4. Where a flow appears unsafe, confirm it with a harmless proof of execution in a local or staging environment. Avoid payloads that access cookies, make network requests, or alter other users’ data.
5. Check whether client-side routing, framework rendering, or third-party libraries create additional paths to the same sink.

Frameworks often escape values in standard text-rendering paths, but that protection can be bypassed when developers opt into raw HTML rendering or use unsafe DOM APIs. Review the actual rendering path rather than assuming that use of a framework makes XSS impossible.

## A practical workflow for comparing the three

Use the same disciplined process for each suspected issue:

### 1. Confirm authorization and scope

Record the approved hosts, accounts, test data, and time window. Prefer local development or staging environments. Avoid testing other tenants or users, and do not use payloads that steal credentials, access browser storage, or transmit data externally.

### 2. Trace the input lifecycle

For each candidate input, ask:

- Is it saved and displayed later? Investigate stored XSS.
- Is it returned in the response to the same request? Investigate reflected XSS.
- Does browser-side code read it and place it into a sensitive sink? Investigate DOM-based XSS.

More than one answer may apply. Document both the delivery path and the execution path.

### 3. Use markers before execution checks

Start with a unique, non-executable string. Search the raw response, inspect the rendered DOM, and check whether the value is encoded or transformed. This reduces risk and often pinpoints the relevant template or client-side code before an execution test is necessary.

### 4. Confirm safely and capture evidence

If a proof of execution is needed, use a benign check in a controlled environment. Record the affected route, input, user role, browser, relevant request and response, execution context, and steps to reproduce. Redact session tokens and personal data from evidence.

### 5. Fix the cause and retest the full path

Apply the appropriate remediation, then repeat the original test and check related pages that display the same data. A fix that blocks one test string but leaves the unsafe source-to-sink flow intact is not sufficient validation.

## Remediation: match the fix to the context

### Prefer safe rendering APIs

For plain text in browser code, use `textContent` or framework-supported text interpolation rather than building HTML strings. Avoid inserting untrusted data with `innerHTML` or similar APIs. When dynamic HTML is genuinely required, use a well-maintained sanitizer configured for the allowed elements and attributes; do not treat ad hoc string replacement as a sanitizer.

### Encode output for its exact context

Apply output encoding at the point where data is rendered, using a trusted templating system or context-specific encoder. HTML text, attributes, JavaScript, CSS, and URL contexts require different handling. Do not assume that validation or encoding performed at input time will remain suitable for every later output context.

### Validate and constrain data

Input validation is useful for enforcing business rules, such as limiting a display name’s length or allowed format. It is not a replacement for safe output handling. If users may submit formatted content, define the supported subset and sanitize it with an appropriate HTML sanitizer before rendering.

### Use browser security controls as defense in depth

A restrictive Content Security Policy (CSP) can reduce the impact of some XSS paths, but it does not repair unsafe rendering and should not be the sole fix. Keep security headers and framework protections configured appropriately, and retest changes in the browsers and application flows that matter to your product.

## Common testing and remediation mistakes

- **Classifying every issue as one exclusive type:** Stored and reflected describe data delivery; DOM-based describes a client-side execution path. Findings can overlap.
- **Checking only the raw response:** DOM-based behavior may be introduced after the page loads.
- **Checking only one page:** The same stored value may be rendered by several components with different safety properties.
- **Relying on input filtering alone:** Characters that appear harmless in one context can be meaningful in another.
- **Treating CSP as the fix:** CSP is an additional control, not a substitute for correcting unsafe data handling.
- **Using intrusive payloads in production:** Prefer markers and controlled proofs in a test environment, and follow the agreed rules of engagement.

## FAQ

### Can an XSS issue be both stored and DOM-based?

Yes. Stored describes persistence and later delivery. DOM-based describes a client-side source-to-sink path. A stored value can be loaded into the page and then inserted unsafely by JavaScript.

### Is reflected XSS always caused by server-side code?

Reflected XSS commonly involves a request value returned in a server-generated response. However, the classification should follow the actual data flow. If browser-side code processes request-derived data and sends it to an unsafe sink, there may also be a DOM-based path.

### Does escaping input once prevent XSS everywhere?

No. Safe handling depends on the output context, and the same stored value may be used in different contexts. Encode at the rendering boundary with the appropriate method, and use safe APIs for client-side rendering.

### How can I tell whether a finding is DOM-based?

Look for a client-side source-to-sink flow. Test URL components and other browser-controlled sources, inspect the live DOM, and trace the relevant JavaScript. A value appearing in the original server response is not required for a DOM-based issue.

### Is an alert box enough to validate a vulnerability?

A harmless alert can demonstrate script execution in a controlled test, but it does not describe the full impact or root cause. Include the affected input, execution context, user conditions, reproducible steps, and evidence of the source-to-sink or rendering path.

## Conclusion

The practical distinction between **stored reflected DOM-based XSS** comes down to tracing how untrusted data reaches the browser. Stored XSS persists before later rendering; reflected XSS returns data in an immediate response; DOM-based XSS arises from unsafe client-side data flows. These categories can overlap, so identify both the delivery mechanism and the execution mechanism when documenting a finding.

For developers, the durable fix is to keep data separate from code: render plain text with safe APIs, encode output for its context, sanitize only when rich HTML is intentionally supported, and retest every relevant rendering path. Conduct testing only in systems and environments where you have authorization.
