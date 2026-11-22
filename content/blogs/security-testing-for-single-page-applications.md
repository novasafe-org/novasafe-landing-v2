# Security Testing for Single-Page Applications

Single-page applications (SPAs) can make web experiences responsive and interactive, but their architecture changes where security risks appear. A browser downloads and runs much of an SPA’s code, while the application’s APIs often handle sensitive data and business operations. That makes it important to test both the client and the services behind it.

Effective security testing for single-page applications is not just a scan of JavaScript files or a check of the login page. It combines code review, browser-based testing, API authorization checks, configuration review, and dependency management. This guide explains the key risks, shows how to test them, and offers practical defensive recommendations for developers.

## How SPA architecture affects security

An SPA typically loads an HTML shell and JavaScript bundles, then uses client-side routing and API requests to update the page without full-page navigations. Frameworks such as React, Vue, and Angular can help structure an application, but they do not automatically make it secure.

A useful mental model is to divide the system into two parts:

- **The browser client:** UI code, routes, input handling, local state, and browser storage. Users can inspect and modify this code and its data.
- **The backend and APIs:** Authentication, authorization, validation, business rules, and access to sensitive data. These must enforce security decisions independently of the UI.

A hidden button, disabled route, or client-side role check is not an authorization control. A user can change browser state or send requests directly to an API. Treat the browser as an untrusted environment and test the API as a primary part of the application’s security boundary.

## Common risks to test

### Cross-site scripting and unsafe DOM updates

An SPA can create DOM-based cross-site scripting (XSS) when untrusted data reaches an unsafe rendering operation. Potential sources include query parameters, URL fragments, API responses, form fields, and browser messages. Risky operations include assigning untrusted strings to `innerHTML` or using framework escape hatches that render raw HTML.

Prefer framework-default text rendering and safe DOM APIs such as `textContent` when displaying plain text. If the product must display user-authored HTML, sanitize it with a well-maintained library and a restrictive allowlist. Review every use of raw HTML rendering, dynamic script creation, and URL-based navigation. Test encoded and malformed inputs in a controlled environment, and verify that they render as text rather than executable markup.

Content Security Policy (CSP) can reduce the impact of some injection flaws, but it does not replace safe rendering. Test the deployed policy for overly broad sources and unnecessary allowances such as `unsafe-inline`; account for the application’s actual script-loading design.

### Authentication and token handling

Review how the application receives, stores, refreshes, and invalidates authentication credentials. A token in `localStorage` is accessible to JavaScript running in the page, so an XSS flaw may expose it. Cookie-based sessions can reduce direct JavaScript access when cookies use `HttpOnly`, but they need appropriate `Secure` and `SameSite` settings and a design for cross-site request forgery (CSRF) protection.

Test logout, token expiry, refresh behavior, account switching, and access from multiple tabs. Confirm that signing out invalidates the server-side session or refresh credential as intended; removing a value from browser storage alone may not invalidate a credential already copied elsewhere. Never put secrets, private keys, or privileged API credentials in a client bundle. Anything shipped to the browser should be treated as public.

### Broken API authorization

A user interface may hide records or actions that a user should not access, but the API must enforce those restrictions. Test for:

- **Broken object-level authorization:** changing an identifier in a request exposes another user’s record.
- **Broken function-level authorization:** a lower-privileged user can call an administrative or otherwise restricted endpoint.
- **Excessive data exposure:** an API returns fields the current user does not need, even if the UI does not display them.
- **Untrusted client-side state:** requests are accepted based on roles, prices, ownership, or other values supplied only by the browser.

Use accounts with different roles and records. For each sensitive endpoint, verify that access is allowed for the rightful user and denied for other users, including when requests are replayed or modified outside the UI. Authorization should be checked on every relevant server-side request.

### CSRF, CORS, and cross-origin behavior

CSRF risk depends on how credentials are sent. Browsers automatically attach eligible cookies to some cross-site requests, so cookie-authenticated state-changing actions need an appropriate defense, such as a carefully designed SameSite policy and, where required by the application, a CSRF token or origin validation. Bearer tokens added explicitly by application JavaScript have different CSRF characteristics, but can be exposed by client-side injection flaws.

Cross-Origin Resource Sharing (CORS) controls which origins browser scripts may read responses from; it is not an API authorization mechanism. Test that trusted origins are narrowly configured and that credentialed requests are not allowed from arbitrary origins. Also verify server-side access controls directly, since non-browser clients are not constrained by browser CORS enforcement.

### Client-side routing and access control

Routes such as `/admin` or `/account/billing` may be useful navigation controls, but a route guard is not sufficient to protect data or operations. Test protected routes by entering their URLs directly, refreshing the page, and calling their APIs without following the normal UI flow. The server must still verify identity, permissions, and resource ownership.

Check for sensitive information embedded in route state, query strings, browser history, analytics events, or error messages. URLs may be retained in history or sent in referrer headers depending on the application’s behavior and policy.

### Dependencies, build output, and deployment settings

SPAs commonly rely on many direct and transitive JavaScript packages. Review dependency updates and advisories, remove unused packages, and investigate unexpected changes to lockfiles. A dependency scanner is a useful signal, not proof that the application is secure.

Inspect production build output for accidental inclusion of secrets, development endpoints, debug code, and sensitive source maps. Source maps are not inherently vulnerabilities, but publishing them may make code easier to inspect; decide deliberately whether and where to expose them. Check security headers, HTTPS configuration, cache behavior for sensitive responses, and service-worker update and caching rules. Ensure private API responses are not accidentally served from a shared cache.

## A practical security testing workflow

### 1. Map the application and its trust boundaries

List the client entry points, routes, API endpoints, authentication flows, user roles, third-party scripts, and data types. Identify which actions change state and which records contain sensitive information. Write down the expected access rules—for example, which roles can read a report and whether a user can edit only their own profile.

Use this map to prioritize testing. A public marketing page and an administrative workflow do not have the same risk profile.

### 2. Review client code and build configuration

Search the codebase for common review targets, then inspect each finding in context. For example:

```sh
rg -n 'innerHTML|outerHTML|dangerouslySetInnerHTML|bypassSecurityTrust|eval\(' src
rg -n 'localStorage|sessionStorage|postMessage|targetOrigin' src
```

These searches are starting points, not vulnerability detectors. Frameworks and coding patterns differ, and a match may be safe or unsafe depending on how data flows into it. Review input sources, sanitization, message origin checks, and any code that bypasses framework escaping.

Check package and lockfile changes with the package manager and an appropriate dependency audit command. For npm projects, a basic check is:

```sh
npm audit
```

Review advisories for applicability and available fixes rather than assuming every reported issue is exploitable in the application. Also inspect build and deployment configuration for exposed environment variables and overly permissive security policies.

### 3. Exercise the application in a browser

Use a test environment with accounts and data you are authorized to access. A browser’s developer tools and an intercepting proxy can help you observe requests, responses, cookies, storage, and security headers. Test normal and abnormal flows, including:

1. Sign in, sign out, let a session expire, and attempt to reuse old credentials.
2. Open protected routes directly and refresh them.
3. Submit unexpected input and inspect how it is displayed and transmitted.
4. Change identifiers, role-like values, and other request parameters to test server-side enforcement.
5. Retry state-changing requests from an unauthorized account or without the expected CSRF defense.
6. Review responses for fields, errors, or records that the current user should not receive.

For an authorization test, create two test users with separate records. Capture a request made by the first user, then—only in your authorized test environment—try the same request while authenticated as the second user. The expected outcome is a denial or a response limited to the second user’s permitted data, not access to the first user’s record.

### 4. Test APIs independently of the UI

Document each endpoint’s authentication and authorization requirements. Use an API client or proxy to repeat requests with missing credentials, expired credentials, a different user, and modified object identifiers. Confirm that server-side validation rejects invalid state transitions and unexpected fields.

For example, a request to retrieve a record should not succeed merely because the client supplied a valid-looking record ID. The server should establish that the authenticated user is permitted to access that particular record. Avoid using production accounts or real customer data for these tests.

### 5. Automate repeatable checks

Add tests for security-sensitive behavior to the development workflow. Useful candidates include:

- API tests for role and ownership rules.
- Regression tests for input encoding and safe rendering.
- Checks that protected endpoints reject unauthenticated requests.
- Dependency and secret scanning during development or CI.
- Browser tests for session expiry and critical access-control flows.

Automation helps detect regressions, but it cannot establish that every endpoint or role is correctly protected. Review test coverage when routes, data models, or permissions change.

## Defensive design recommendations

- **Make the server authoritative.** Enforce authentication, authorization, validation, and business rules at the backend for every relevant operation.
- **Use safe rendering by default.** Keep framework escaping enabled, avoid raw HTML sinks, and sanitize intentionally supported HTML.
- **Choose credential storage deliberately.** Assess the trade-offs between cookies and browser-accessible tokens, including XSS and CSRF exposure. Do not treat any storage choice as a substitute for preventing injection.
- **Apply least privilege.** Limit each account, API token, and service to the permissions it needs. Return only necessary data.
- **Set appropriate browser protections.** Use HTTPS and review CSP, cookie attributes, framing restrictions, and other response headers against the application’s requirements.
- **Validate messages and redirects.** For `postMessage`, check the expected origin and validate message contents. Avoid open redirects and unsafe dynamic URL construction.
- **Manage dependencies and releases.** Keep dependencies current, review changes, protect build credentials, and verify that production configuration does not expose secrets.
- **Test realistic role combinations.** Include account ownership, tenant boundaries, administrators, and unauthenticated users in test plans where applicable.

## Common testing mistakes

A few shortcuts can create false confidence:

- **Testing only the visible interface:** APIs can be called directly, so UI behavior does not prove server-side authorization.
- **Treating a clean scanner report as a security assessment:** automated tools can miss logic flaws and may report findings that need contextual review.
- **Assuming CORS blocks unauthorized access:** CORS is enforced by browsers and does not replace authentication or authorization.
- **Checking only the logged-in path:** test expired sessions, direct route access, alternate roles, and modified requests.
- **Testing with excessive or real data:** use controlled accounts and datasets, and obtain authorization before assessing any environment.

## FAQ

### Is security testing for a single-page application different from testing a traditional website?

The core principles are the same, but SPAs put more emphasis on client-side JavaScript, asynchronous API calls, browser storage, and client-side routing. The APIs still need independent authorization testing, and the browser client must be treated as untrusted.

### Does a frontend framework prevent XSS?

Frameworks commonly escape interpolated text by default, which helps when used as intended. Risk can return through raw HTML features, unsafe URL handling, third-party code, or direct DOM manipulation. Review data flows and test the rendered result rather than relying on the framework name.

### Is storing a token in localStorage always unsafe?

It is accessible to JavaScript in the application’s origin, which means an XSS flaw can potentially expose it. Whether it is appropriate depends on the application’s threat model and token design. Compare that risk with cookie-based approaches, including CSRF considerations, and use short-lived, narrowly scoped credentials where suitable.

### Can automated tools test an SPA completely?

No. Static analysis, dependency checks, browser scanners, and API tests can find useful classes of problems, but they do not fully assess business logic or every authorization rule. Combine automation with manual testing based on roles, data ownership, and the application’s threat model.

## Conclusion

Security testing for single-page applications needs to cover both the code running in the browser and the backend services it depends on. Focus on safe rendering, credential handling, API authorization, cross-origin behavior, dependencies, and deployment configuration. Most importantly, verify security rules by sending requests directly—not just by observing what the interface allows. A repeatable mix of code review, browser testing, API tests, and regression checks helps developers catch weaknesses before they reach users.
