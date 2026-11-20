# Webhooks: Signature Verification and Replay Defense

Webhooks let one service notify another when an event occurs. They are convenient, but an exposed endpoint can also receive forged, altered, or repeated requests. A secure implementation must check that a request came from the expected sender, that its contents have not changed, and that an old valid request cannot trigger the same action again.

This guide presents a practical workflow for evaluating **webhooks signature verification replay defense** in an application you own or are authorized to test. The examples use HMAC-SHA-256, a timestamp, and an event identifier. Providers differ, so treat the code as an illustrative pattern and follow your provider’s signing specification for the exact headers, encoding, and signed message.

## What signature verification does—and does not do

A webhook signature is typically a message authentication code (MAC) or digital signature computed over request data. With HMAC, the sender and receiver share a secret. The receiver recomputes the MAC and compares it with the value in the request.

A valid signature can establish that the signed data was created by someone holding the shared secret and was not modified after signing. It does **not** by itself establish that:

- The request is recent. An attacker who captures a valid request may resend it.
- The event has not already been processed. Legitimate providers also retry deliveries.
- The event is safe to act on. Authorization and business rules still apply.
- The sender is trustworthy if the signing secret has been exposed.

That is why signature verification and replay defense should be designed together, with idempotent event handling as a further safeguard.

## A practical evaluation workflow

Perform these checks against a development or staging endpoint, or another system for which you have explicit authorization. Use test credentials and harmless test events; do not replay real customer events or send test traffic to a production endpoint without approval.

### 1. Confirm the provider’s signing contract

Read the provider’s current webhook documentation and record:

- Which headers carry the timestamp, signature, and event identifier.
- Which exact bytes are signed, and in what order. Some providers sign a timestamp plus the raw body; others use a different canonical format.
- Which algorithm and signature encoding are used, such as HMAC-SHA-256 with hexadecimal or Base64 output, or an asymmetric signature scheme.
- Whether multiple signatures are sent during secret rotation.
- The provider’s retry behavior and event-ID guarantees.

Do not assume that two providers use the same format just because both call a header a “signature.” A correct algorithm applied to the wrong input is still an incorrect verification implementation.

### 2. Inspect the endpoint’s request handling

Trace the request from the HTTP server through middleware to the webhook handler. Check that:

- The signature is verified over the **raw request bytes** required by the provider, before JSON parsing or transformations that could change them.
- The endpoint rejects missing, malformed, or invalid signatures.
- Comparisons use a constant-time comparison function where applicable.
- The timestamp is covered by the signature if the provider’s scheme supports it.
- No event-triggered side effect occurs before authentication succeeds.
- Secrets are loaded from an appropriate secret store or protected configuration, not committed to source control.

Frameworks may parse, normalize, or consume the request body. Confirm the handler can still access the exact bytes used for signature verification.

### 3. Test expected and rejected requests

In a controlled environment, exercise at least these cases:

1. A valid, fresh event is accepted and handled once.
2. A one-byte body change with the original signature is rejected.
3. A missing or malformed signature is rejected.
4. A valid signature with an expired timestamp is rejected, if timestamps are part of the provider scheme.
5. Repeating an already accepted event does not repeat its business side effects.
6. Two copies submitted concurrently do not both create the same effect.
7. A legitimate provider retry after a temporary failure can still be processed according to the application’s retry and idempotency design.

Use a provider’s test tooling or a local signing helper that follows its documented format. For example, send requests only to a local test server with test credentials:

```bash
curl -i -X POST http://localhost:8000/webhooks/provider \
  -H 'Content-Type: application/json' \
  -H 'X-Provider-Timestamp: <test-timestamp>' \
  -H 'X-Provider-Signature: <signature-generated-for-this-exact-body>' \
  --data-binary @payload.json
```

The placeholders above are not valid signatures. Generate the signature using the provider’s documented test method, and use `--data-binary` so the client does not unnecessarily alter the body bytes. Avoid putting real secrets directly into shell history or shared command logs.

## Example: verify an HMAC signature and timestamp

The following Python function illustrates a generic scheme in which the sender signs `timestamp + "." + raw_body` and sends a hexadecimal SHA-256 HMAC in a header such as `v1=<hex>`. This format is **not universal**; adapt the input construction and parsing to the provider’s specification.

```python
import hashlib
import hmac
import time


def verify_webhook(raw_body: bytes, timestamp_header: str,
                   signature_header: str, secret: bytes,
                   now: int | None = None, tolerance_seconds: int = 300) -> int:
    """Verify the illustrative timestamp-and-body HMAC format.

    Return the verified timestamp, or raise ValueError if verification fails.
    """
    try:
        timestamp = int(timestamp_header)
    except (TypeError, ValueError) as exc:
        raise ValueError('invalid timestamp') from exc

    current_time = int(time.time()) if now is None else now
    if abs(current_time - timestamp) > tolerance_seconds:
        raise ValueError('timestamp outside allowed window')

    if not signature_header.startswith('v1='):
        raise ValueError('unsupported signature format')

    supplied_signature = signature_header[3:]
    signed_message = str(timestamp).encode('ascii') + b'.' + raw_body
    expected_signature = hmac.new(
        secret,
        signed_message,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, supplied_signature):
        raise ValueError('signature mismatch')

    return timestamp
```

The endpoint should obtain `raw_body` without first parsing and re-serializing JSON. The timestamp check limits how long a captured request remains acceptable, but it does not stop the same request from being replayed repeatedly inside the allowed window. Also ensure the timestamp is included in the authenticated input; checking an unsigned timestamp would let an intermediary change it.

Set the allowed time window according to provider behavior, clock synchronization, and operational needs. A very narrow window can reject legitimate deliveries when clocks drift or requests are delayed. A very wide window leaves more time for captured requests to be reused. Monitor clock synchronization on the receiving systems.

## Add replay defense with event-level idempotency

A timestamp is a freshness check, not a one-time-use token. A replay cache or durable event store is needed to recognize an event that has already been accepted. Prefer a stable, provider-issued event ID that is covered by the signature—usually because it is part of the signed body.

A reliable pattern is:

1. Verify the signature and freshness before trusting the event body.
2. Parse the authenticated body and validate its schema and event ID.
3. In a database transaction, insert the event into a durable inbox with a unique key such as `(provider, event_id)`.
4. If the insert conflicts, treat it as a duplicate and do not repeat the side effect.
5. Process pending inbox records with retryable workers. Record completion only after the work succeeds, and make downstream actions idempotent too.

For example, a relational inbox table can enforce uniqueness:

```sql
CREATE TABLE webhook_inbox (
    provider   text        NOT NULL,
    event_id   text        NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now(),
    payload    jsonb       NOT NULL,
    status     text        NOT NULL DEFAULT 'pending',
    PRIMARY KEY (provider, event_id)
);
```

After signature verification and payload validation, insert with a conflict-safe operation such as `INSERT ... ON CONFLICT DO NOTHING`. Check whether a row was inserted, and arrange for pending rows to be processed reliably. Keep the inbox record for at least as long as the provider can retry or an event could be replayed under your threat model; retention should account for operational recovery and privacy requirements.

A short-lived cache using an atomic “set if absent” operation can be appropriate for some systems, but it needs careful failure handling. If the cache marks an event as seen before processing and the process then crashes, a legitimate retry may be discarded. If it marks the event only after processing, concurrent deliveries can both perform the side effect. A durable inbox, unique database constraint, and idempotent worker commonly provide a clearer way to handle both retries and concurrency.

If the provider does not supply a stable event ID, choose a documented deduplication strategy based on authenticated data. A body hash alone can incorrectly collapse two distinct but identical legitimate events, so consider the event semantics before using it as a key.

## Validation and remediation checklist

Use this checklist to record an evaluation and prioritize fixes:

- **Signature input:** Confirm the exact provider-defined bytes are signed; verify against the raw body where required.
- **Algorithm and parsing:** Accept only documented algorithms and signature versions. Parse headers strictly and reject malformed values.
- **Comparison:** Use a constant-time comparison for MAC values. Avoid logging secrets or full signature material.
- **Freshness:** Validate a signed timestamp within a reasonable tolerance and monitor clock health.
- **Replay handling:** Deduplicate authenticated event IDs atomically, including concurrent deliveries.
- **Side effects:** Make processing idempotent and avoid performing business actions before verification and durable acceptance.
- **Failure behavior:** Return the provider’s expected success response only when the event is durably accepted or already known. Use retries and worker recovery for transient failures.
- **Secret management:** Restrict access, rotate compromised secrets promptly, and support a controlled overlap period if the provider allows multiple active secrets.
- **Operations:** Log useful metadata such as provider, event ID, verification outcome, and processing state. Avoid logging sensitive payload data unless necessary and protected.
- **Abuse controls:** Apply sensible request-size limits and rate limits. These controls complement signature verification; they do not replace it.

When a check fails, first confirm that the implementation matches the provider’s exact signing format. Then correct the relevant layer: restore raw-body access, fix header parsing, add timestamp validation, introduce durable deduplication, or make downstream operations idempotent. Add regression tests for each issue before deploying the remediation.

## Common troubleshooting issues

### Every signature fails

Check that the configured secret is the correct environment’s secret and that the signed message uses the required byte encoding, separators, timestamp representation, and signature encoding. Confirm that middleware has not altered the body. Do not “fix” failures by disabling verification in production.

### Valid deliveries fail intermittently

Investigate clock drift, network delays, proxy behavior, and provider retry timing. Confirm the freshness tolerance is compatible with the provider’s documented delivery behavior. Do not simply remove the timestamp check; adjust it deliberately and retain event-level deduplication.

### Retries create duplicate actions

A verified signature does not make a delivery unique. Add a unique event key at the persistence boundary and make the side effect safe to retry. For example, use an idempotency key when calling a downstream service if that service supports one.

### Events disappear after a transient error

Review when the event is marked as processed or seen. Store verified events durably before acknowledging them, and ensure pending work can be retried after a process or worker failure.

## Security considerations

Treat the signing secret as a credential. Restrict who and what can read it, avoid exposing it in diagnostics, and rotate it if exposure is suspected. During rotation, accept old and new secrets only for a limited, planned overlap if the provider supports that process; remove the old secret afterward.

A valid signature does not eliminate the need for input validation. Enforce payload size limits, validate expected fields and types, and authorize each resulting action according to application rules. A webhook endpoint should not trust a requested account, resource, or role merely because it appears in a signed event.

Finally, design for the possibility that delivery is repeated, delayed, or arrives out of order. Use event timestamps or sequence information only as the provider documents, and avoid assuming that network delivery order always matches event order.

## FAQ

### Does signature verification prevent replay attacks?

No. It detects unauthorized changes and, depending on the scheme, helps authenticate the sender. A captured valid request can still be resent. Use a signed freshness timestamp and event-level deduplication or another provider-supported replay defense.

### Is checking a timestamp enough to prevent replay?

No. It limits the period during which a request may be accepted, but the same request can be replayed multiple times within that period. Track event IDs or otherwise enforce idempotent processing.

### Should I verify the signature before parsing JSON?

Verify using the exact bytes and construction required by the provider, commonly the raw request body plus other signed fields. Parse the body only after verification where possible. If the provider’s documented scheme requires a different process, follow that specification precisely.

### Should a duplicate delivery receive an error response?

Usually, once an authenticated event is durably recorded or already known, return the success response expected by the provider so it does not retry indefinitely. Confirm the provider’s retry contract and do not acknowledge an event that has not been safely accepted for processing.

## Conclusion

A robust webhook implementation combines provider-specific signature verification, signed timestamp checks where available, atomic event deduplication, and idempotent processing. Evaluate each layer with controlled tests for tampering, stale requests, repeated deliveries, and concurrency. Then use durable storage and operational monitoring so legitimate retries recover safely without repeating sensitive business actions.
