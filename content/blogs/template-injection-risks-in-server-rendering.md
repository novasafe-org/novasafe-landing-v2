# Template Injection Risks in Server Rendering

Server-rendered pages often combine templates with data supplied by users, databases, or other services. That is normal. The risk begins when untrusted data is treated as template source and interpreted by a server-side template engine.

This flaw, commonly called server-side template injection (SSTI), can expose data or enable more serious server-side actions depending on the engine, configuration, and application context. It is not the same as ordinary HTML injection: the template engine may evaluate expressions before the response is sent to the browser.

This guide presents a practical workflow for evaluating template injection risks in an application you own or are explicitly authorized to test. It covers how to find risky rendering paths, validate them with low-impact checks, and remediate the root cause.

## What is server-side template injection?

A template engine turns a template and its data into output. In a safe design, the application controls the template, while variable values come from data:

```python
render_template_string('Hello {{ name }}', name=user_name)
```

Here, the template source is a fixed string written by the developer. The value of `user_name` is supplied as data and inserted into the template during rendering.

A risky design makes user input part of the template source:

```python
render_template_string('Hello ' + user_name)
```

If `user_name` contains template syntax, the engine may interpret it rather than display it as text. The precise behavior depends on the engine and how the application is configured.

SSTI is distinct from cross-site scripting (XSS). XSS occurs when browser-interpreted content is handled unsafely. SSTI happens during server-side template evaluation. Autoescaping can help prevent some HTML-based XSS, but it does not make untrusted template source safe.

## Where to look for template injection risks

Start with features that accept or store content and later render it on the server. Common examples include:

- Email, invoice, or notification previews
- User-editable themes, message templates, or page layouts
- Report and document generation
- CMS content and administrative preview tools
- Search, profile, or support pages that build templates dynamically
- Error pages and logging or monitoring views that render submitted values

Trace data through the application rather than relying only on endpoint names. Follow request fields, database values, imported content, and configuration values to the point where a template engine parses them. A value stored earlier can still be untrusted when it is rendered later.

Pay particular attention to APIs that compile or parse a string as a template, such as `from_string`, `compile`, or `render` methods that accept template source. Names and behavior vary by engine. Rendering a trusted template with untrusted variables is generally a different risk from compiling an untrusted string as the template itself.

## A safe evaluation workflow

### 1. Confirm authorization and scope

Test only systems for which you have explicit authorization. Agree on the target environment, endpoints, accounts, test window, and data-handling rules. Prefer a staging environment with representative configuration and synthetic data. If production testing is specifically authorized, coordinate a low-impact test plan and avoid actions that could change data or affect other users.

Record the routes and fields in scope before testing. Do not test third-party services or shared infrastructure unless the authorization explicitly includes them.

### 2. Map inputs to rendering sinks

For each candidate feature, document:

1. Where the value enters the application.
2. Whether it is validated, transformed, or stored.
3. Which code path renders it.
4. Whether it is passed as template data or used to construct template source.
5. Which engine, version, configuration, and output context are involved.

Review source code and configuration where possible. A useful code-review search is for dynamic template compilation and string-based rendering APIs. Search results are leads, not proof: inspect whether the input can actually reach the template source.

### 3. Establish a baseline

Send a normal value first and record the response, status code, and relevant behavior. Use a unique marker so you can distinguish your test input from other page content. If a feature has a preview mode, use that instead of triggering email delivery, document publication, or other side effects.

### 4. Use a low-impact expression check

In an authorized test environment, submit a simple arithmetic expression wrapped in syntax commonly recognized by the suspected engine. For example, the following Jinja-style probe is intended only to check whether an expression is evaluated:

```text
SSTI-CHECK-{{7*7}}-END
```

A request might look like this, adjusted for the application and approved scope:

```bash
curl -i --get 'https://staging.example.test/preview' \
  --data-urlencode 'name=SSTI-CHECK-{{7*7}}-END'
```

If the response contains `SSTI-CHECK-49-END`, that is evidence that the expression may have been evaluated. If it contains the original expression unchanged, that particular test did not demonstrate evaluation. Neither result alone establishes the complete security impact.

Use a probe appropriate to the suspected engine and context. Template syntaxes overlap, and some applications transform, encode, or reject input before rendering. A response can also contain text produced by a different component. Confirm the behavior with source review, a controlled test case, or another non-destructive check before reporting a finding.

Do not use probes that attempt to read files, access environment variables, make network requests, execute commands, or change application state. Such tests can expose secrets, disrupt services, or cross the agreed scope. A mathematical expression is sufficient to establish whether evaluation is occurring in many cases.

### 5. Distinguish SSTI from other behaviors

A value appearing in a response does not by itself prove template injection. Consider these possibilities:

- **Plain reflection:** The application returns the submitted text without evaluating it.
- **HTML escaping:** The application displays template characters as text, possibly in an encoded form.
- **Client-side rendering:** A browser-side framework processes the value after the server response.
- **Template evaluation:** The server-side engine processes the expression before returning the response.
- **Validation or transformation:** The application changes or removes characters before rendering.

Compare the baseline and probe responses, check where the value appears, and examine server-side code or logs when available. Avoid concluding that a particular engine is in use based on one syntax probe alone.

### 6. Assess impact without escalating the test

Once evaluation is demonstrated, assess the code path and configuration rather than attempting to prove impact through invasive actions. Establish:

- Whether an unauthenticated or low-privilege user can reach the feature
- Whether the input is persistent or only used in a one-time preview
- Whether the rendering process has access to sensitive data or powerful application objects
- Whether template compilation is isolated, resource-limited, or otherwise constrained
- Whether the output is returned to the requester, sent to another user, or stored

Template injection does not have one universal impact. Outcomes depend on the engine, available objects, application permissions, and deployment controls. Report only what you verified, and clearly separate confirmed behavior from potential impact.

## Remediation: keep template source trusted

The most reliable fix is to keep templates under application control and pass untrusted values as data. Do not attempt to make arbitrary user-supplied template source safe merely by removing a few characters or applying HTML escaping.

### Use fixed templates and variable bindings

For example, keep the template literal trusted and pass the value separately:

```python
render_template_string('Hello {{ name }}', name=user_name)
```

For an EJS-based application, render a developer-controlled template and provide data separately:

```javascript
ejs.render('<p><%= name %></p>', { name: userName });
```

In EJS, `<%=` is the escaped-output form, while `<%-` outputs unescaped content. Choose output handling based on the destination context, and avoid unescaped output for untrusted values unless there is a carefully reviewed, context-appropriate reason.

### Treat user-authored templates as a separate feature

Some products intentionally allow users to author templates. This is a higher-risk design than ordinary data substitution. If it is a requirement:

- Use an engine designed for restricted templates, with only the minimum required features enabled.
- Expose a small, explicit set of data rather than application objects, request objects, or service handles.
- Do not assume a sandbox alone prevents every escape or denial-of-service risk.
- Apply execution time, memory, output-size, and request-rate limits where supported by the architecture.
- Keep rendering permissions and available data separate from the web application's broader privileges.
- Review engine documentation and security updates, and test restrictions as part of ongoing maintenance.
- Make clear to users which template features are supported and validate templates before saving or rendering them.

The right controls depend on the engine and threat model. If arbitrary template execution is not essential, removing that capability is safer and simpler than trying to constrain it.

### Encode output for its destination

After fixing template-source handling, use context-appropriate output encoding to address separate injection risks such as XSS. HTML text, HTML attributes, JavaScript, URLs, and CSS require different handling. Prefer the framework's supported escaping mechanisms and avoid marking untrusted content as safe. Escaping output is not a substitute for keeping untrusted input out of template source.

### Add regression tests

Create tests that verify both the safe behavior and the intended display:

- A value containing template delimiters is rendered literally rather than evaluated.
- Expected variable substitution still works in trusted templates.
- HTML-sensitive input is handled safely in the relevant output context.
- User-authored templates, if supported, cannot access data or features outside their documented scope.
- Size and time limits handle unusually large or expensive input predictably.

Tests should exercise the same rendering path used by the application, including preview and background-job paths where applicable.

## Reporting findings clearly

A useful security report includes the affected feature, the input field, the rendering path, the test environment, the exact low-impact probe, and the observed response. Explain whether evaluation was confirmed and describe the relevant access requirements and data flow. Include a focused remediation recommendation: use trusted template source and pass user-controlled values as data.

Do not overstate impact based only on a successful arithmetic probe. If you did not verify access to sensitive data or other effects, describe those as possible risks rather than confirmed outcomes.

## FAQ

### Is every user-controlled value rendered by a template engine vulnerable?

No. Passing a value as data to a trusted template is a normal and generally safer pattern. The core concern is allowing untrusted input to become template source or otherwise control template evaluation.

### Does HTML autoescaping prevent server-side template injection?

No. Autoescaping helps encode output for certain HTML contexts. It does not stop a server-side engine from evaluating untrusted template syntax in the template source.

### Can a simple arithmetic probe confirm SSTI?

It can provide a useful signal when the result appears where the expression was submitted, but it is not conclusive in every application. Transformations, client-side processing, and other components can produce misleading results. Confirm the data flow and rendering behavior safely.

### Is a template sandbox enough to make user-authored templates safe?

Not automatically. A sandbox can reduce available capabilities, but its effectiveness depends on the engine, configuration, exposed objects, and resource controls. Prefer trusted templates where possible, and treat user-authored templates as a feature requiring dedicated isolation and review.

## Conclusion

Evaluating template injection risks in server rendering is primarily a data-flow exercise: identify untrusted inputs, trace them to rendering code, and determine whether they are treated as data or parsed as template source. In an authorized environment, a controlled expression check can help validate a suspected issue without attempting to access files, execute commands, or affect other systems.

The most effective remediation is to keep template source trusted, bind user input as data, and apply appropriate output encoding for the destination. Add regression tests and, if user-authored templates are essential, constrain and isolate that capability as a distinct security-sensitive feature.
