# SSRF in PDF and Image Processing Services

PDF conversion and image-processing features often look like ordinary file-handling tasks. But if a service accepts a URL, renders HTML, or follows external resources referenced by a document, it may also make network requests on behalf of an attacker. That turns a file-processing feature into a potential server-side request forgery (SSRF) entry point.

The right defense depends on what the product needs to process. A service that only transforms uploaded files can use a different design from one that must import images from partner websites. This guide compares those approaches and explains how to reduce SSRF risk without relying on URL validation alone.

## How SSRF arises in PDF and image processing

SSRF occurs when an attacker influences a server-side request and uses it to reach a destination the attacker could not access directly. Depending on the environment and the service’s permissions, a vulnerable processor could reach internal applications, administrative interfaces, or cloud instance metadata endpoints. Even when the response is not returned to the user, the request itself may trigger an action or expose information through logs, timing, or later processing behavior.

A PDF or image service may make requests in several ways:

- **URL import:** The application downloads a user-supplied URL before processing it.
- **HTML-to-PDF rendering:** A renderer loads images, stylesheets, fonts, frames, or other resources referenced by HTML or CSS.
- **SVG processing:** An SVG can reference external resources. Whether those resources are fetched depends on the library, configuration, and processing path.
- **Document references:** Some document formats or processing workflows can cause a tool to resolve linked resources. Do not assume that parsing a file is network-free; verify the behavior of the exact libraries and features in use.
- **Redirects and secondary fetches:** A permitted URL may redirect to a different host, or a fetched page may cause the renderer to request additional resources.

The risk is not limited to a particular file extension. It comes from a component making network requests using attacker-controlled input, often from a network location with more access than the user has.

## Common defensive approaches

There is no single control that fits every product. The most reliable designs reduce or eliminate network access first, then add narrowly scoped controls where fetching is a genuine requirement.

### 1. Accept uploads instead of arbitrary URLs

If users can upload a file directly, process the uploaded bytes rather than retrieving a user-provided URL. This removes the most direct SSRF path: the processor no longer needs to contact an attacker-chosen host to obtain its primary input.

**Advantages**

- A smaller network attack surface and simpler security model.
- No need to decide whether an arbitrary destination is safe.
- Easier to apply size limits, file-type checks, and malware scanning before processing.

**Tradeoffs**

- Users must provide the file themselves.
- Large uploads need suitable storage, upload limits, and lifecycle management.
- The processing library may still fetch external resources embedded in the file or generated HTML unless that behavior is disabled or isolated.

This is often the best default for thumbnail generation, file conversion, and document preview features that do not require remote imports.

### 2. Allowlist specific hosts

Some workflows legitimately import resources from a known set of domains, such as a company’s own asset store or approved partner systems. An application-level allowlist can restrict which hostnames users may request.

**Advantages**

- Supports required remote-fetch workflows.
- Can express business rules, such as allowing only approved storage domains.

**Tradeoffs**

- Hostname checks alone do not control where a connection ultimately goes.
- DNS answers can change, and redirects can lead somewhere outside the original allowlist.
- The allowlist can become difficult to maintain if users need access to many changing hosts.

An allowlist is useful as one layer, but it should not be treated as a complete SSRF defense. Enforce destination restrictions at connection time as well, and ensure redirects and every subsequent request follow the same policy.

### 3. Fetch through a controlled broker

A fetch broker is a dedicated service that retrieves remote resources under a strict policy. The PDF or image worker asks the broker for an approved resource; it does not get unrestricted network access itself. The broker can apply host rules, resolve and check destination addresses, constrain redirects, impose response limits, and log requests centrally.

**Advantages**

- Centralizes network policy for multiple processing services.
- Keeps complex URL-fetching logic out of each renderer or worker.
- Makes it easier to separate fetching from CPU- and memory-intensive file processing.

**Tradeoffs**

- Adds infrastructure and operational complexity.
- The broker itself becomes a security-sensitive service that needs careful design and monitoring.
- Its policy must cover redirects, DNS changes, proxy behavior, and response handling—not just the initial URL.

A broker is a strong option when remote fetching is required across several workflows and the organization can maintain a dedicated, tightly controlled component.

### 4. Disable network access in the processing worker

Run conversion and image-processing tools in an environment that has no route to internal networks or the public internet. Where possible, also configure the tool to disable external resource loading.

**Advantages**

- Limits the impact of unexpected network requests by a parser or renderer.
- Protects against features that application-level URL checks may not anticipate.
- Complements upload-only designs and controlled-fetch architectures.

**Tradeoffs**

- Some renderers need network access for legitimate resources unless those resources are fetched separately.
- Network isolation can require changes to container, host, or orchestration configuration.
- A network block does not stop other problems such as parser vulnerabilities or resource-exhaustion attacks.

For many systems, this is a baseline containment measure rather than an alternative to input and application controls.

## A practical decision framework

Choose the least permissive design that meets the product requirement:

| Requirement | Suitable starting design | Important follow-up controls |
|---|---|---|
| Users convert files they already have | Direct upload; no URL import | Isolate workers, limit input and output, disable external resource loading |
| Users import from a few known domains | Strict host allowlist or fetch broker | Check resolved addresses, control redirects, enforce egress rules |
| Users can import from arbitrary public websites | Dedicated fetch broker with narrow public-internet access | Block private and special-use destinations, constrain redirects and response sizes, monitor requests |
| HTML or SVG is rendered into an image or PDF | Prefer sanitized or trusted input and local resources | Disable external loads where possible; isolate the renderer from networks |

If arbitrary public URLs are a core feature, acknowledge that the fetcher is a high-risk component. Do not give the conversion worker broad network access simply because the feature needs to retrieve one image.

## Build defense in depth

### Validate the URL, but do not stop there

If a URL must be accepted, parse it with a well-maintained URL parser and define a narrow policy. For example, require an expected scheme such as HTTPS, reject embedded credentials, and restrict ports and hostnames according to the product’s needs. Avoid ad hoc checks such as searching for `localhost` or checking whether a URL contains a trusted domain as a substring.

A hostname may resolve to an address that should not be reachable. Resolve the hostname and reject loopback, private, link-local, and other non-public or otherwise prohibited address ranges according to your environment’s policy. Apply the rule to all relevant address families, including IPv4 and IPv6. Be aware that DNS results can change between validation and connection; a check performed only before connecting may be vulnerable to time-of-check/time-of-use problems.

Prefer a fetch implementation that can enforce the policy on the actual connection. If that is not available, use an egress proxy or network controls that prevent the worker from reaching prohibited destinations even if application validation fails.

### Treat redirects as new requests

A safe-looking initial URL can redirect to another host or address. Either disable redirects or validate every redirect target using the same rules as the original URL. Set a small redirect limit, and ensure the HTTP library does not silently bypass your policy when following a redirect.

### Restrict egress at the network layer

Give workers only the network access they need. For an upload-only processor, that may mean no outbound network access at all. If workers need to retrieve files, route that traffic through an approved proxy or broker and block direct access to internal services and metadata endpoints at the network layer.

Network restrictions should be tested from the actual runtime environment. A policy that works on a developer laptop may differ from the rules applied to a container, virtual machine, or orchestration namespace.

### Isolate the processor

Treat PDF renderers and image libraries as untrusted-input parsers. Run them with a dedicated low-privilege identity, limited filesystem access, restricted CPU and memory, and no unnecessary credentials. Use temporary working directories and avoid mounting sensitive host paths or application secrets into the processing environment.

Where possible, separate the web-facing application from the worker that performs conversion. A queue-based design can help keep the request handler away from complex parsers and make it easier to apply distinct network and resource policies.

### Limit resource consumption

SSRF is not the only risk in file processing. Large or malformed inputs can consume excessive memory, CPU, disk, or processing time. Set limits for upload size, decoded dimensions, page count, processing time, output size, and concurrency as appropriate for the formats you support. Use library-specific protections for deeply nested or unusually complex inputs where available.

These controls address resource exhaustion; they do not replace SSRF protections. Conversely, blocking network access does not make an unbounded parser safe.

### Keep resources local when rendering

For HTML-to-PDF or HTML-to-image workflows, prefer templates and assets controlled by your application. Store approved fonts, stylesheets, and images locally or provide them through a controlled asset mechanism. If user-supplied HTML is supported, define which elements and resource types are permitted and test the renderer’s behavior rather than assuming sanitization removes every network-capable feature.

## Safer processing flow

A design for a service that does not need remote imports can keep the processing worker offline:

1. Authenticate and authorize the upload request.
2. Enforce request and file-size limits before storing the file.
3. Store the original in a controlled location and create a processing job that refers to it by an internal identifier, not a user-supplied path or URL.
4. Pass the file bytes or a narrowly scoped local object reference to an isolated worker.
5. Run the converter with external resource loading disabled where supported and with outbound network access blocked.
6. Validate the generated output, store it, and return an authorized download reference.
7. Record failures and processing metadata without logging secrets or sensitive document contents.

For a service that must fetch URLs, insert a controlled fetch step before conversion. The fetcher should enforce the URL and destination policy, limit response size and time, and provide the worker with the retrieved bytes. The worker should still be isolated, because document processing can have risks beyond SSRF.

An internal job should generally carry an asset identifier or a reference to a broker-approved object rather than granting a renderer a general-purpose URL-fetching capability.

## Testing and operational checks

Test the behavior of the full workflow, including the application, fetch library, renderer, and deployed network environment. In an authorized test environment, verify that:

- Disallowed schemes, ports, hostnames, and destination address ranges are rejected.
- Redirects to disallowed destinations are blocked.
- A hostname that resolves to a prohibited address cannot be used to reach that address.
- HTML, CSS, or SVG references do not cause unexpected requests from an offline worker.
- The worker cannot connect directly to internal services or metadata endpoints.
- Timeouts, oversized responses, malformed files, and excessive processing workloads fail safely.
- Logs and errors do not disclose credentials, internal addresses, or sensitive file contents.

Monitor outbound requests from processing components. Unexpected destinations, repeated denied connections, or new network dependencies can reveal a misconfiguration or a change in renderer behavior. Review library updates and configuration changes because resource-loading behavior can vary between versions.

## Common implementation mistakes

- **Checking only the URL string:** A string-level check does not prove where the eventual connection goes.
- **Allowlisting a hostname but trusting redirects:** Every redirect target needs the same enforcement.
- **Blocking only IPv4 private addresses:** IPv6 and other special-use ranges also need consideration.
- **Validating DNS once and connecting later:** The answer may change, so enforce policy at connection time or through network controls.
- **Relying only on a renderer setting:** Keep network egress restricted even when external loading is disabled in the library.
- **Assuming uploaded files cannot trigger network access:** Test the supported formats and processing paths, especially HTML and SVG rendering.
- **Using a broad application credential in the worker:** Give the processor only the permissions it needs, and avoid exposing cloud credentials to it.

## FAQ

### Can PDF conversion cause SSRF if users upload a PDF rather than provide a URL?

It depends on the processor and workflow. A simple conversion may not make network requests, but features that resolve external references or render related content can behave differently. Check the specific tool, configuration, and input formats, then restrict worker egress so an unexpected request cannot reach sensitive destinations.

### Is blocking private IP addresses enough?

No. It is one useful control, but it does not address every risk. A robust design also considers IPv6 and special-use ranges, DNS changes, redirects, allowed schemes and ports, proxy behavior, and network-layer restrictions. The policy should be enforced on the connection, not only against the original URL string.

### Should a PDF or image worker have internet access?

Only when a documented feature requires it. For upload-and-convert workflows, an offline worker is usually simpler to secure. If remote imports are required, prefer a controlled fetch service and prevent the processing worker from making arbitrary outbound requests.

### Does URL allowlisting eliminate SSRF?

Not by itself. Allowlisting can reduce the set of acceptable destinations, but redirects, DNS behavior, and address resolution still matter. Combine it with connection-time checks and egress controls, and reapply the policy to every request in the fetch chain.

## Conclusion

SSRF in PDF and image processing services is primarily a question of who controls network access during fetching and rendering. If remote retrieval is unnecessary, accept uploads and keep the worker offline. If it is required, use a narrowly scoped allowlist or controlled fetch broker, validate destinations throughout the request chain, and enforce egress restrictions independently of application checks.

Finally, isolate processors and limit their resources. These measures do not make every document safe, but they reduce the chance that a URL-handling flaw or unexpected parser behavior can reach sensitive systems or disrupt the service.
