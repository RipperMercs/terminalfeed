# TensorFeed CC Spec: Add `/internal/validate-and-charge` Endpoint

**Date:** April 27, 2026
**Priority:** HIGH (unblocks TerminalFeed premium API tier; shipped surface returns 503 billing_unavailable until this lands)
**Scope:** Add a single internal HTTP endpoint to the TensorFeed Worker that other Anthropic-aligned agent-pay surfaces (starting with TerminalFeed.io) use to authenticate bearer tokens and decrement credits. Reuses TensorFeed's existing auth+charge logic; does not duplicate it.

---

## Executive Summary

TerminalFeed.io shipped its premium API tier (`/api/pro/briefing`, `/api/pro/macro`, `/api/pro/crypto-deep`) on April 27, 2026. The architecture has TensorFeed serving as the system of record for billing: same USDC wallet, same bearer tokens, shared credit pool. TerminalFeed's Worker calls TensorFeed's Worker on every premium API request to validate the token and decrement credits atomically.

The TerminalFeed Worker calls:

```
POST {TENSORFEED_AUTH_URL}/internal/validate-and-charge
Header: X-Internal-Auth: {SHARED_INTERNAL_SECRET}
Body:   { "token": "tf_live_xxx", "cost": 2, "endpoint": "tf:/api/pro/macro" }
```

A live probe of TensorFeed confirmed this endpoint does not yet exist (POST returns the catch-all 405; OPTIONS returns 405 without an `Allow` header; GET returns 404). The TensorFeed CC implementation needs to add this single route. Estimated effort: one commit, ~30-60 lines of new code that wraps the existing inline auth+charge logic that already powers `tf.routing()`, `tf.pricing_series()`, etc.

---

## Section 1: The Endpoint

### Path
`POST /internal/validate-and-charge`

### Authentication
Header `X-Internal-Auth` must match the Worker secret `SHARED_INTERNAL_SECRET`. Reject with 401 if missing or mismatched. This is the only authentication; there is no public-facing OAuth flow on `/internal/*`.

### Request body (JSON)
```json
{
  "token": "tf_live_<64-char-hex>",
  "cost": 2,
  "endpoint": "tf:/api/pro/macro"
}
```

- `token` (required, string): the bearer token presented by the agent. Must be validated against the existing token store.
- `cost` (required, integer >= 0): number of credits to decrement. 0 is permitted for "validate only without charging" but Phase 1 callers always pass >= 1.
- `endpoint` (required, string): a free-form audit label for logging. Convention: `<source>:<path>`, so `tf:/api/pro/macro` means "called from TerminalFeed, on the macro endpoint." Pass through to whatever audit log TensorFeed already maintains.

### Response (200 with JSON, even on logical failure)

Always return 200 if the request was authenticated and well-formed. Use the body to communicate logical state:

```json
{
  "ok": true,
  "credits_remaining": 47
}
```

or

```json
{
  "ok": false,
  "reason": "invalid_token" | "insufficient_credits" | "expired" | "revoked",
  "credits_remaining": 0
}
```

`reason` is required when `ok: false`. `credits_remaining` is always present. Consumers (TerminalFeed and any future site) read these two fields exclusively.

### Error responses

| Status | Condition |
|---|---|
| 401 | `X-Internal-Auth` missing or wrong |
| 400 | malformed body, missing required field, negative cost, etc. |
| 405 | non-POST method (Workers should still register OPTIONS for CORS preflight if other domains may probe; respond with `Allow: POST, OPTIONS`) |
| 500 | unexpected server error |

### Atomicity contract

The decrement MUST happen before returning `ok: true`. If the response is `ok: true`, the credit is gone from the pool, full stop. The caller (TerminalFeed) then attempts its own data fetch; if the upstream fetch fails, the credit still counts. This matches TensorFeed's existing model where `tf.routing()` charges the credit at the routing decision, not at successful upstream availability.

### Implementation hint

TensorFeed already has logic that:
1. Looks up a bearer token in the credit store
2. Verifies expiry, revocation, balance
3. Decrements N credits atomically (presumably with a Durable Object or D1 transaction)

Refactor that logic into a single internal function (e.g. `validateAndCharge(token, cost, auditLabel)`) that returns `{ ok, credits_remaining, reason? }`. Then:

- The new `/internal/validate-and-charge` route deserializes the body, calls the function, returns the result.
- Existing public endpoints (`/api/routing`, `/api/pricing_series`, etc.) refactor to call the same function instead of inlining the logic. This eliminates drift between the public and internal paths.

If the refactor is risky in a single commit, ship the new route as a thin wrapper over the existing inline logic FIRST (one commit, low risk) and refactor the public endpoints SECOND (separate commit, can be done later). The wrapper-first approach unblocks TerminalFeed immediately.

---

## Section 2: Worker secret

Set `SHARED_INTERNAL_SECRET` on the TensorFeed Worker. The same value must be set on the TerminalFeed Worker. Suggested generation:

```
openssl rand -hex 32
```

Once generated, set on both:

```
# in tensorfeed-api/
npx wrangler secret put SHARED_INTERNAL_SECRET

# in terminalfeed-api/ (worker-additions/)
npx wrangler secret put SHARED_INTERNAL_SECRET
```

Secret rotation policy: any time the secret is rotated, both Workers must be updated within the same maintenance window. Mismatched secrets cause every premium TerminalFeed call to return 503 billing_unavailable.

---

## Section 3: Verification

After deploying:

1. **Probe with no auth** (expect 401):
   ```
   curl -i -X POST https://tensorfeed.ai/internal/validate-and-charge \
     -H 'Content-Type: application/json' \
     -d '{"token":"tf_live_test","cost":1,"endpoint":"probe"}'
   ```

2. **Probe with wrong auth** (expect 401):
   ```
   curl -i -X POST https://tensorfeed.ai/internal/validate-and-charge \
     -H 'Content-Type: application/json' \
     -H 'X-Internal-Auth: wrong-secret' \
     -d '{"token":"tf_live_test","cost":1,"endpoint":"probe"}'
   ```

3. **Probe with right auth + invalid token** (expect 200 with `ok: false, reason: "invalid_token"`):
   ```
   curl -i -X POST https://tensorfeed.ai/internal/validate-and-charge \
     -H 'Content-Type: application/json' \
     -H 'X-Internal-Auth: <SHARED_INTERNAL_SECRET>' \
     -d '{"token":"tf_live_<bogus>","cost":1,"endpoint":"probe"}'
   ```

4. **End-to-end with a real test token from TensorFeed's own credit purchase flow** (expect 200 with `ok: true` and `credits_remaining` decremented):
   ```
   curl -i -X POST https://tensorfeed.ai/internal/validate-and-charge \
     -H 'Content-Type: application/json' \
     -H 'X-Internal-Auth: <SHARED_INTERNAL_SECRET>' \
     -d '{"token":"<real_tf_live_token>","cost":1,"endpoint":"probe"}'
   ```
   Confirm credits actually decremented by calling `tf.balance()` after.

5. **Cross-site smoke test** — once SHARED_INTERNAL_SECRET is set on both Workers and TerminalFeed has TENSORFEED_AUTH_URL set, hit `https://terminalfeed.io/api/pro/macro` with the same real token. Should return 200 with macro data and `X-Credits-Remaining` header showing one fewer credit than before.

---

## Section 4: What this spec does NOT cover

- Refactoring the existing public endpoints (`/api/routing`, etc.) to call the same shared function. Recommended but optional and can be a follow-up commit.
- Building the equivalent of this for any third site beyond TerminalFeed. The `endpoint` audit label is the only thing that needs per-caller customization; the route accepts any value there.
- Rate limiting on `/internal/*` paths. The shared secret is the only auth and there's only one peer caller (TerminalFeed Worker, also Cloudflare-hosted). If a third site is added later, consider per-source rate limits.
- Webhooks or callback notifications when credits run low. Phase 2 candidate.
- Bulk validate (multi-token, single request). Phase 1 callers always pass one token at a time.
- Refunds. Refund flow already exists on TensorFeed; this internal route is for live charging only.

---

## Note to TensorFeed CC

1. **Atomicity.** The decrement must be transactional. Two concurrent calls with cost=1 against a 1-credit balance must result in exactly one `ok: true` and one `ok: false` reason `insufficient_credits`. If TensorFeed already uses a Durable Object or D1 transaction for `tf.routing()`'s charge step, reuse that primitive.
2. **Always return 200 for logical failures.** `ok: false` is in the body, not the HTTP code. The HTTP code is reserved for transport-level issues (auth header missing, malformed JSON, Worker error). This matches the pattern TensorFeed's own `tf.confirm()` already uses.
3. **No em dashes** in any error message, response body, or comment string. Match TensorFeed's existing rule.
4. **Log every call** to whatever audit/telemetry stack TensorFeed uses for billing. Include `endpoint` audit label, token (hashed or last-8 chars only, not full), cost, ok/reason, credits_remaining.
5. **Single commit preferred.** This is a small, well-scoped addition. If you decide to also refactor public endpoints to share the function, do that as a separate follow-up commit. Do not bundle.
6. **Coordinate with TerminalFeed** before deploying so we can flip the secret on both Workers within minutes of each other. The cross-site smoke test in Section 3 step 5 is the success criterion for both sides.
