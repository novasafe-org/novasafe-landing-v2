# Subresource Integrity for Third-Party Scripts

Third-party JavaScript can add useful features to a web application, but it also creates a trust dependency. A script loaded from a content delivery network (CDN) or another external host can execute with the privileges of the page that includes it. If the file changes unexpectedly, the change may affect your users.

Subresource Integrity (SRI) gives the browser a way to check that a fetched script or stylesheet matches an expected cryptographic hash. When used carefully, it can help detect unexpected changes to third-party resources. It does not replace vendor review, Content Security Policy (CSP), or other web application security controls, but it can add a valuable verification step.

This guide explains how SRI works, what it protects against, and how developers can adopt it without creating fragile deployments.

## What is Subresource Integrity?

Subresource Integrity is a browser feature that verifies the contents of certain externally loaded resources. The page author places an `integrity` attribute on a supported HTML element, such as a `<script>` or `<link>`. The attribute contains one or more cryptographic hashes of the expected file.

The browser fetches the resource, computes its hash, and compares the result with the provided value. If the content does not match an accepted hash, the browser blocks the resource from being used.

An SRI value consists of a supported algorithm name, a hyphen, and a Base64-encoded digest. For example, an attribute may contain a value beginning with `sha384-`. SRI supports SHA-256, SHA-384, and SHA-512. SHA-384 is commonly used in examples, but the important operational requirement is that the hash accurately represents the exact resource bytes being served.

## Why third-party scripts need careful handling

A browser executes an included script in the context of the page that loaded it. Depending on the page and application, that code may be able to read or modify the DOM, interact with application data available to the page, and make network requests. A third-party script therefore creates more than a dependency on an external URL: it creates a dependency on the code delivered at that URL.

Risks can arise from several sources:

- **Compromise of a vendor or CDN:** An attacker who can alter a hosted file may be able to deliver changed code.
- **Unexpected vendor updates:** A provider may change a file without the application team reviewing the new content.
- **Supply-chain exposure:** A vendor may depend on other services or infrastructure that affect what users receive.
- **Untracked dependencies:** A script added for analytics, chat, advertising, or a widget may remain in production without clear ownership.

SRI helps address one specific part of this risk: it lets the browser reject a resource whose bytes differ from the expected version recorded in the page. It does not establish that the original code is safe, nor does it ensure that the vendor’s systems or the rest of the application are secure.

## How SRI works in the browser

Consider a page that includes a script from another origin. The page provides an integrity hash for the expected file. The browser retrieves the resource and checks its contents against the hash before allowing it to execute. If the check fails, the browser blocks the resource and reports an integrity error in the developer console.

A minimal example looks like this:

```html
<script
  src="https://cdn.example.net/library/1.2.3/library.min.js"
  integrity="sha384-REPLACE_WITH_THE_REAL_BASE64_DIGEST"
  crossorigin="anonymous"></script>
```

The hash above is a placeholder, not a usable digest. Replace it with a value generated from the exact file that the browser will receive.

For cross-origin resources, SRI requires the resource to be fetched using CORS. The `crossorigin="anonymous"` attribute requests a CORS fetch without cross-origin credentials. The remote server must return an appropriate `Access-Control-Allow-Origin` header for the requesting page. If the server does not allow the request through CORS, the browser cannot complete the cross-origin integrity check and the resource will not load as expected.

For same-origin resources, an integrity attribute can also be used. Test the browser behavior and deployment configuration for your application, especially if a resource is served from multiple origins or through a proxy.

## Generating an integrity hash

Generate a hash from the exact, production-ready file you intend to reference. For example, with OpenSSL:

```sh
openssl dgst -sha384 -binary library.min.js | openssl base64 -A
```

Prefix the resulting Base64 output with `sha384-` and place it in the `integrity` attribute. You can also use a trusted package manager, build tool, or CDN that provides integrity metadata, but verify that the value corresponds to the actual file and version you use.

A typical workflow is:

1. Select and pin a specific dependency version rather than using a moving URL such as `latest`.
2. Obtain the exact file that will be served to browsers, including the same minification or packaging used in production.
3. Generate the digest using a supported algorithm.
4. Add the digest to the HTML or template that includes the resource.
5. Test the page in a browser and confirm the resource loads without an integrity or CORS error.
6. Include the hash update in the dependency upgrade process.

SRI hashes are calculated over bytes, not over the meaning of the program. Changes to whitespace, line endings, minification, or other file content can produce a different hash. A hash generated from one build will not validate a different build, even if the two files appear functionally equivalent.

## Applying SRI to scripts and stylesheets

SRI can be used with external scripts and stylesheets. For example, a stylesheet can include an integrity value in its `<link>` element:

```html
<link
  rel="stylesheet"
  href="https://cdn.example.net/theme/4.0.1/theme.min.css"
  integrity="sha384-REPLACE_WITH_THE_REAL_BASE64_DIGEST"
  crossorigin="anonymous">
```

As with scripts, use a real digest for the exact file and confirm the server supports the necessary cross-origin request. Do not copy an example hash from documentation and assume it applies to a different version or URL.

SRI is intended for resources referenced through supported HTML elements. It is not a general mechanism for verifying every network response or every script loaded at runtime. For example, adding SRI to a top-level script does not automatically validate additional scripts that the code later loads. Each dependency needs its own appropriate controls.

## Practical design choices

### Pin versions and hashes together

A stable versioned URL and its integrity hash should be treated as a pair. Avoid mutable URLs that can return different contents over time. When updating a dependency, review the new version, update the URL and hash together, and test the application before release.

Version pinning improves predictability, but it does not prove that a particular version is safe. Review the dependency and its release source as part of the normal software supply-chain process.

### Decide how updates are reviewed

SRI intentionally makes silent file changes fail closed: if the content changes but the page still contains the old hash, the browser blocks the resource. This can protect users from unexpected changes, but it can also cause a feature outage after a legitimate vendor update.

Define who owns each third-party resource and how changes are approved. A useful process includes checking release notes, reviewing the new artifact where practical, regenerating the hash, and deploying the updated URL and hash together. Avoid automatically replacing hashes without review; doing so can remove the protection SRI is meant to provide.

### Account for regional or personalized content

Some providers serve different file bytes based on region, request headers, user state, or optimization settings. If the response varies, one fixed SRI hash may not match every response. Confirm that the provider serves a stable artifact compatible with SRI. If it does not, consider hosting a reviewed copy yourself or choosing another integration approach.

Self-hosting can give your team more control over the artifact and update schedule, but it also transfers responsibility for delivery, patching, and maintenance to your team. Choose based on your operational requirements rather than assuming either approach is always safer.

### Use SRI alongside CSP

Content Security Policy can restrict which origins are allowed to supply scripts and other resources. SRI checks the contents of a specific resource against a known hash. These controls address different concerns and can complement each other: CSP helps limit permitted sources, while SRI helps detect unexpected changes to a resource that is permitted.

Neither control makes a trusted third-party script harmless. A malicious or vulnerable script that already matches the approved hash can still cause harm. Keep the set of external dependencies small, and review their purpose and access regularly.

## Common troubleshooting issues

If a resource does not load after adding SRI, check the following:

- **The hash is wrong:** Recompute it from the exact response file. Check that the algorithm prefix and Base64 value are copied correctly.
- **The file changed:** Confirm the URL still serves the version used to generate the hash. A vendor update or build change can invalidate the digest.
- **CORS is not configured:** For a cross-origin resource, inspect the response headers and confirm the server allows the requesting origin. Ensure the element uses the appropriate `crossorigin` setting, commonly `anonymous` for public assets.
- **A proxy or optimization layer modifies the response:** Compare the bytes delivered to the browser with the file used to generate the hash. Compression performed at the transport layer is generally distinct from changing the resource content, but transformations such as rewriting or minification can change the bytes.
- **The wrong file was hashed:** Check that the digest was generated for the exact path, version, and build artifact referenced by the page, rather than a source file or a different distribution.

Use the browser developer console and Network panel to inspect integrity and CORS failures. Test the production delivery path as well as local development, because CDNs and deployment systems may serve different content or headers in each environment.

## Defensive recommendations

For practical use of subresource integrity for third-party scripts, follow these guidelines:

1. **Inventory external resources.** Record each script and stylesheet, its business purpose, vendor, owner, and update process.
2. **Minimize dependencies.** Remove resources that are unused or no longer justified. Fewer third-party scripts mean fewer external trust relationships.
3. **Prefer stable, versioned artifacts.** Avoid URLs whose contents can change without a corresponding application release.
4. **Generate hashes from production artifacts.** Do not rely on a digest for a similar file or a different build.
5. **Automate carefully.** Build tooling can generate and verify hashes, but updates should still follow your dependency review policy.
6. **Monitor failures.** Watch for browser console errors and application behavior that could indicate a blocked resource. Have a plan for legitimate vendor updates and rollback.
7. **Use layered controls.** Combine SRI where applicable with CSP, dependency review, secure release practices, and appropriate monitoring.
8. **Do not treat SRI as a security approval.** A matching hash proves only that the fetched bytes match the value in the page. It does not prove that those bytes are trustworthy or free of vulnerabilities.

## Frequently asked questions

### Does SRI protect against a compromised CDN?

It can help when an attacker changes a resource on the CDN but cannot also change the page containing the expected hash. The browser detects the mismatch and blocks the altered resource. If an attacker can modify both the resource and the page or its integrity value, SRI alone may not help. Protecting the application’s own deployment and HTML is essential.

### Do I need `crossorigin="anonymous"` for every SRI resource?

Cross-origin resources need to be fetched using CORS for SRI verification. The `crossorigin="anonymous"` attribute is commonly used for public cross-origin scripts and stylesheets, and the remote server must allow the request through its CORS response headers. Same-origin cases differ, so test the actual resource and browser behavior rather than adding attributes without checking the delivery configuration.

### Does SRI automatically cover scripts loaded by another script?

No. SRI on an HTML element checks the resource referenced by that element. It does not automatically validate every additional resource that code may load later. Apply suitable controls to each dependency and use CSP to limit allowed sources where appropriate.

### What happens when a vendor updates a file?

If the updated bytes no longer match the page’s integrity hash, the browser blocks the resource. Update the hash only after deciding to accept the new artifact, then deploy the corresponding URL and hash together. This is why ownership and a review process are important.

## Conclusion

Subresource Integrity gives browsers a clear way to verify that eligible third-party scripts and stylesheets match expected content. It can reduce exposure to unexpected changes at a CDN or resource host, provided the page containing the hash remains trustworthy and the resource is served in a compatible way.

For developers, the key is to make SRI part of dependency management: pin versions, generate hashes from exact production artifacts, verify CORS behavior, and review updates deliberately. Used alongside CSP and broader supply-chain practices, SRI is a practical layer of web application security—not a substitute for evaluating the code you choose to run.
