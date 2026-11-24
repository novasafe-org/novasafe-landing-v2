# JWT Validation Mistakes to Avoid

A JSON Web Token (JWT) can carry identity and authorization data between an application and an API. But a token is not trustworthy just because it is well-formed—or because it was issued by a familiar service. The receiving API must verify its signature, validate relevant claims, and apply the right authorization rules before using its contents.

Small implementation oversights can undermine that process. Common JWT validation mistakes include accepting unexpected signing algorithms, skipping audience checks, mishandling keys, or treating token claims as permission to perform any action. This guide gives developers a practical workflow for finding and fixing these issues in systems they own or are explicitly authorized to assess.

## What JWT validation should establish

A signed JWT commonly consists of three Base64URL-encoded parts: a header, a payload, and a signature. The header and payload can be read without a secret or private key. The signature helps the API detect changes, but it does not encrypt the claims. Do not put passwords, private data, or other secrets in a signed token unless the token is also protected using an appropriate encryption scheme.

For an API to accept a token safely, its validation should answer questions such as:

- Was it signed with an algorithm and key this API explicitly trusts?
- Was it issued by the expected authority, and is this API its intended audience?
- Is it within its validity period?
- Does it represent the kind of token this endpoint accepts?
- Does the authenticated subject have permission to perform this specific action?

The exact checks depend on the token profile and application. Define those requirements deliberately rather than relying on a library’s defaults or on whichever claims happen to be present.

## Common JWT validation mistakes

### 1. Trusting the token’s algorithm choice

A JWT header contains an `alg` value. Treat it as untrusted input until verification succeeds. A dangerous pattern is to let the token choose which algorithms the application will accept, or to accept any algorithm supported by a library. This can create algorithm-confusion problems or make an unsigned token acceptable in a poorly configured verifier.

**Avoid it:** Configure an explicit allowlist of algorithms for the token type and trust relationship. Ensure the selected key is appropriate for that algorithm. Do not allow `none` for tokens that are expected to be signed. Do not switch between symmetric and asymmetric algorithms based solely on the token header.

### 2. Verifying the signature with the wrong key or trust source

A valid signature proves only that a token was signed by the corresponding key. It does not prove that the signer is trusted by your API. Mistakes include using a key from an untrusted source, mixing keys between environments, or using a shared HMAC secret across unrelated services.

**Avoid it:** Load verification keys from trusted configuration or a trusted issuer’s JWKS endpoint. Keep development, staging, and production keys separate. Restrict access to private signing keys and HMAC secrets. For asymmetric signing, APIs that only verify tokens generally need the public key, not the private signing key.

### 3. Selecting keys unsafely from token headers

The `kid` header parameter can help select a key from a trusted key set, but it is attacker-controlled until verification completes. Treating it as a file path, URL, database query fragment, or unrestricted network destination can introduce injection or server-side request risks. Accepting a key supplied through an untrusted header parameter is also unsafe.

**Avoid it:** Use `kid` only as a constrained lookup value within a trusted, preconfigured key set. Reject unknown identifiers. Never fetch keys from a URL supplied by the token. Validate that the chosen key is permitted for the expected algorithm and purpose.

### 4. Skipping issuer or audience validation

A token can have a valid signature and still be intended for a different service, client, or environment. If an API checks only the signature, it may accept tokens issued by an unexpected authority or tokens meant for another audience.

**Avoid it:** Check the expected `iss` (issuer) and `aud` (audience) values for each token profile. Use exact, documented configuration. Do not treat an issuer claim as trusted merely because it appears in the payload.

### 5. Ignoring expiration and other time claims

A token that has expired should generally not be accepted. Depending on the application’s token profile, `nbf` (not before) and `iat` (issued at) may also matter. Missing claims can be as important as invalid ones if the application relies on them.

**Avoid it:** Require the time claims your token profile mandates, validate them with a small, intentional clock-skew allowance, and keep hosts synchronized with a reliable time source. Do not use a generous leeway to hide clock or lifecycle problems. Set token lifetimes appropriate to the use case.

### 6. Treating decoding as verification

Many libraries can decode a token’s header and payload without checking its signature. That can be useful for diagnostics or for a carefully constrained key lookup, but the resulting values are untrusted. A common mistake is to make an authentication or authorization decision based on decoded claims before verification.

**Avoid it:** Use the library’s verification API with explicit algorithms, keys, issuer, audience, and required claims. Keep unverified parsing limited to what is necessary to select a candidate key; do not use unverified identity or permission claims.

### 7. Confusing authentication with authorization

A valid token establishes that a trusted issuer signed a set of claims under the configured rules. It does not automatically mean the subject may access every resource or perform every action. APIs can also make mistakes by trusting a role or scope claim without checking whether it applies to the requested resource.

**Avoid it:** After authentication, apply authorization checks for the requested action and resource. Validate that roles and scopes come from the expected issuer and token profile. Where needed, check resource ownership or tenant boundaries using trusted application data.

### 8. Mishandling token types, parsing, and errors

An ID token, access token, and other JWT profiles may share a format but have different intended uses. Accepting one type where another is expected can cause token substitution. Inconsistent parsing, duplicate JSON claim names, oversized tokens, or verbose error messages can also create security and reliability problems.

**Avoid it:** Define the token type expected by each endpoint and follow the issuer’s profile. Where the profile defines a `typ` value or other distinguishing claim, validate it. Use a well-maintained JWT library with consistent parsing behavior. Enforce reasonable request and token-size limits, and return generic authentication errors to clients while recording useful, non-sensitive diagnostic details internally.

## A practical workflow for evaluating JWT validation

Use this workflow only against applications and environments you own or have explicit authorization to test. Prefer a staging environment and test tokens issued for that environment. Never paste live credentials or production tokens into public debugging websites.

### Step 1: Document the expected token profile

Before testing, write down what the API is supposed to accept:

- Expected issuer and audience.
- Allowed signing algorithm or algorithms.
- Trusted key source and key-rotation process.
- Required claims, such as `exp`, `iss`, `aud`, or `sub`.
- Expected token type, scopes, and authorization rules.
- Intended behavior for expiration, clock skew, and missing claims.

This turns a vague security review into checks that can be repeated and automated.

### Step 2: Locate the verification boundary

Trace the request from the authorization header to the code that accepts or rejects the token. Confirm that every protected route uses the same intended validation path, including background jobs or alternate API entry points where applicable. Look for code that decodes claims before verifying the signature, catches verification exceptions and continues, or falls back to a permissive configuration.

### Step 3: Review the verifier configuration

Check the library and its version, then inspect its configuration. Confirm that the algorithm list is explicit, keys come from a trusted source, and issuer and audience are checked. Determine whether required claims are actually required, rather than merely validated if present. Review the behavior for unknown `kid` values and key rotation.

### Step 4: Run negative tests with test tokens

In an authorized test environment, verify that the API rejects tokens with each of these properties:

1. A modified payload or signature.
2. An algorithm outside the configured allowlist, including an unsigned token where signed tokens are required.
3. An unknown key identifier or a key that does not match the trusted issuer’s key set.
4. The wrong issuer or audience.
5. An expired token, a token used before its `nbf`, or a missing required claim.
6. A token of the wrong type or one without the scope required for the operation.

Also test a valid token for the intended audience and a valid token after a legitimate key rotation. Negative tests should confirm both the expected rejection and the absence of unintended side effects. Do not use forged tokens to access systems outside your authorization.

### Step 5: Fix the root cause and retest

Update the verifier configuration or authorization logic rather than adding one-off checks to individual routes. Add regression tests for the failure case and a positive test for valid tokens. Confirm that key rotation works as intended, logs do not expose tokens, and error responses do not reveal sensitive validation details.

## Example: explicit verification with PyJWT

The following Python example illustrates verification of an RS256 access token with PyJWT. It assumes `trusted_key_for_kid` looks up a key only in a trusted, locally configured or issuer-provided key set. The resolver must reject unknown keys and ensure the selected key is appropriate for RS256. It must not follow a token-supplied URL or treat `kid` as a path.

```python
from datetime import timedelta

import jwt

EXPECTED_ISSUER = "https://identity.example.test/"
EXPECTED_AUDIENCE = "orders-api"


def verify_access_token(token: str) -> dict:
    # Header values are untrusted at this point. The algorithm check is an
    # early rejection; jwt.decode below still performs the actual verification.
    header = jwt.get_unverified_header(token)
    if header.get("alg") != "RS256":
        raise jwt.InvalidAlgorithmError("Unexpected signing algorithm")

    kid = header.get("kid")
    if not isinstance(kid, str) or not kid:
        raise jwt.InvalidTokenError("Missing key identifier")

    key = trusted_key_for_kid(kid)  # Trusted key set only; reject unknown kid.

    return jwt.decode(
        token,
        key=key,
        algorithms=["RS256"],
        issuer=EXPECTED_ISSUER,
        audience=EXPECTED_AUDIENCE,
        leeway=timedelta(seconds=30),
        options={"require": ["exp", "iss", "aud", "sub"]},
    )
```

The function intentionally uses an algorithm allowlist and verifies the issuer, audience, expiration, and required claims. Adapt the required claims and token-type checks to the issuer’s documented profile and your application’s needs. Do not copy the example’s placeholder issuer or audience into production without replacing them with trusted configuration. Catch the library’s expected token-validation exceptions at the application boundary and reject the request; do not continue with partially decoded claims.

## Key rotation and operational checks

Key rotation needs to preserve trust without accepting arbitrary keys. For a JWKS-based issuer, use a trusted, configured JWKS location, cache keys sensibly, and refresh according to the issuer’s guidance. When a token presents an unknown `kid`, a controlled refresh may be appropriate; avoid unbounded refreshes or making every invalid request trigger repeated network calls. If the key remains unknown, reject the token.

Operationally, monitor validation failures without logging raw bearer tokens. Record enough context to investigate patterns—such as the endpoint, failure category, and a safe correlation identifier—while avoiding sensitive claims. Ensure TLS protects tokens in transit and avoid placing bearer tokens in URLs, where they can leak through logs, browser history, or referrer data.

## Troubleshooting common validation failures

- **Valid tokens suddenly fail after rotation:** Check whether the verifier has the issuer’s current public keys, whether the old key is still needed for unexpired tokens, and whether key caching or refresh behavior matches the rotation plan.
- **Tokens fail only on some servers:** Compare issuer, audience, algorithm, key-set configuration, system clocks, and library versions across instances.
- **A token works for one API but not another:** This may be correct if the audiences differ. Issue or request a token intended for the API being accessed rather than weakening audience validation.
- **Recently issued tokens fail `nbf` or `iat` checks:** Check clock synchronization and the issuer’s timestamp behavior. Use only a small, documented leeway; do not disable time validation to mask a clock issue.
- **A token is accepted but an action should be denied:** Review authorization after authentication, including scopes, roles, tenant boundaries, and resource ownership.

## FAQ

### Is decoding a JWT the same as validating it?

No. Decoding reads the token’s contents. Validation verifies the signature and checks configured claims and policy. Treat decoded values as untrusted until the full verification process succeeds.

### Should every API validate the audience claim?

An API should follow the token issuer’s profile and its own trust requirements. When a token is intended for a particular service, checking `aud` helps prevent accepting a token meant for a different service. Define the expected audience rather than relying on a token’s signature alone.

### Can I accept a token after its expiration with clock skew?

A small, deliberate leeway can account for minor differences between system clocks. It should not become a way to extend token lifetimes substantially. Fix clock synchronization issues and use the shortest leeway consistent with the environment.

### Is a JWT encrypted by default?

No. A signed JWT’s header and payload are typically readable by anyone who has the token. Signing protects integrity and helps authenticate the signer; it does not provide confidentiality. Avoid putting secrets in claims unless using an appropriate encryption design.

### What should an API return when JWT validation fails?

Reject the request with an appropriate generic authentication response, and do not disclose internal key, signature, or configuration details to the client. Log a safe failure category for troubleshooting, without recording the bearer token itself.

## Conclusion

Reliable JWT validation is a set of explicit checks, not a single signature-verification call. Configure trusted algorithms and keys, validate issuer, audience, and time claims, enforce the expected token profile, and keep authorization separate from authentication. Then test both valid and invalid cases in an authorized environment and add regression tests for every issue you remediate. These practices help developers avoid common JWT validation mistakes and build more dependable API security.
