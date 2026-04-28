# CC Spec: Premium Tier Polish — From Shipped to B2B-Credible

**Date:** April 27, 2026
**Priority:** HIGH (closes the gap between "infrastructure works" and "actually worth paying for"; ships before any organic agent traffic from the discovery infrastructure starts converting)
**Scope:** Eight focused improvements that take the 12-endpoint premium tier from a working chassis to a product a serious B2B agent customer would build against without hesitation. Data-freshness signaling, sandbox evaluation tier, payment history, subscription resume, idempotency keys, retry-on-transient-failure, schema stability commitment, end-to-end smoke test.

---

## Executive Summary

The premium API tier is shipped and the discovery infrastructure is queued. Honest gut-check on remaining gaps surfaced eight concrete items that block "is this worth paying for" rather than "does it work":

1. **Data freshness in every response body** — agents paying for "real-time" data need to know which fields are live vs stale on every call. This is the single biggest trust signal we can add.
2. **Sandbox evaluation tier** — 10 free calls per IP per 24h so prospects can test response shapes before committing USDC. Adoption friction reducer.
3. **Payment history endpoint** — `GET /api/payment/history` so customers can audit their bill from their side. Currently unauditable.
4. **Subscription resume endpoint** — when an auto-paused subscription is topped up, the customer should be able to resume it without DELETE+CREATE.
5. **Idempotency keys on confirm-payment** — industry-standard replay safety; prevents double-credit on agent network retries.
6. **Retry-on-network-error for validate-and-charge** — single transient blip currently surfaces as `billing_unavailable`. One safe retry absorbs most flakes.
7. **Public schema stability commitment** — written promise that response shapes don't break without 90-day notice. B2B trust lock.
8. **End-to-end live smoke test script** — one repeatable script that exercises every code path including webhook delivery and all 21 MCP tools.

**Prerequisites you (Evan) handle in parallel:**

- `wrangler secret put FRED_API_KEY` on terminalfeed-api Worker. Restores macro, agent-context, correlation-matrix, sentiment to full completeness.
- `wrangler secret put GITHUB_TOKEN` on terminalfeed-api Worker. Lifts github-velocity from 60 req/hour shared to 5000/hour dedicated. Free GitHub PAT with `public_repo` scope is sufficient.

Both ~5 minutes. Spec assumes both are set before Section 8 smoke test runs.

**Hard non-goal:** do not modify existing field semantics on any premium endpoint. New fields (`_meta`, etc.) may be added; existing fields stay exactly as they are. This spec's value depends on the schema-stability promise being honest.

---

## Sections

### 1. Data-freshness `_meta` block on every premium response

Every `/api/pro/*` endpoint adds a top-level `_meta` field. Existing fields are unchanged, so the addition is purely additive — any client that destructures specific fields keeps working; clients reading the whole body just see one new top-level key.

**Schema:**

```json
{
  "_meta": {
    "generated_at": "2026-04-27T23:15:00.000Z",
    "endpoint": "/api/pro/macro",
    "tier": "premium",
    "sources": [
      {
        "name": "FRED.VIXCLS",
        "status": "live",
        "fetched_at": "2026-04-27T23:14:58.234Z",
        "latency_ms": 234
      },
      {
        "name": "Binance.BTCUSDT",
        "status": "live",
        "fetched_at": "2026-04-27T23:14:59.011Z",
        "latency_ms": 89
      },
      {
        "name": "DefiLlama.tvl",
        "status": "stale",
        "fetched_at": "2026-04-27T22:45:18.000Z",
        "age_seconds": 1782,
        "reason": "upstream_5xx"
      },
      {
        "name": "Etherscan.gas",
        "status": "fallback",
        "fetched_at": "2026-04-27T23:14:59.500Z",
        "fallback_source": "publicnode.com"
      }
    ]
  },
  "...existing fields unchanged...": "..."
}
```

**`status` enum values:**

- `live` — fetched fresh from primary source within this request's timeout
- `stale` — primary source was unreachable; cached value within TTL is being returned
- `fallback` — primary source unreachable, served from documented fallback (e.g., publicnode.com instead of Etherscan)
- `null` — source intentionally unavailable (e.g., FRED data when FRED_API_KEY not set); the corresponding fields in the response body will also be null

**`name` convention:** `{ProviderName}.{specific_metric_or_endpoint}`. Examples: `FRED.UNRATE`, `Binance.BTCUSDT`, `mempool.space.fees`, `Polymarket.gamma`. Stable identifiers — these are part of the documented schema.

**Implementation guidance:** the existing per-endpoint composition functions already track which upstreams they hit. Wrap each upstream fetch in a small helper that records `name`, `status`, `fetched_at`, `latency_ms`, and any fallback notes, then assemble the array at response build time. Do not refactor the upstream fetch logic itself; just instrument it.

Apply to all 12 current premium endpoints. Single commit per related batch:

- Commit: `feat: add _meta freshness block to /api/pro/briefing /api/pro/macro /api/pro/agent-context`
- Commit: `feat: add _meta freshness block to /api/pro/crypto-deep /api/pro/sentiment /api/pro/world-deltas`
- Commit: `feat: add _meta freshness block to /api/pro/correlation-matrix /api/pro/whales /api/pro/exchange-flows`
- Commit: `feat: add _meta freshness block to /api/pro/defi-tvl /api/pro/stablecoin-flows`

If endpoint #13+ has shipped since this spec was drafted, include it in the appropriate batch and adjust commits.

**Update `/openapi.json`** to document the `_meta` schema as a `components.schemas.PremiumMetaBlock` and reference it from every `/api/pro/*` operation's 200 response. If the agent-discovery spec has already extended `/openapi.json`, this is an additional commit on top of that work.

### 2. Sandbox evaluation tier

Goal: prospects can call any `/api/pro/*` endpoint up to 10 times per IP per 24-hour window without USDC commitment, with the same response shape so they can build and test.

**Behavior:**

- Request to `/api/pro/*` with NO `Authorization` header AND with `?evaluation=1` query param triggers sandbox path.
- If the IP has consumed <10 calls in the rolling 24h window, the call goes through normal premium logic (no credit deduction), response is returned with `_meta.tier: "evaluation"` and `_meta.evaluation_remaining: 7`.
- If the IP has consumed 10 calls already, return `429 Too Many Requests` with body:
  ```json
  {
    "error": "evaluation_quota_exhausted",
    "message": "Free evaluation is 10 calls per IP per 24 hours. Buy credits to continue.",
    "buy_url": "https://terminalfeed.io/api/payment/buy-credits",
    "docs_url": "https://terminalfeed.io/developers/agent-payments"
  }
  ```
- If `Authorization` header IS present, route through the normal premium path (auth wins; ignore `?evaluation=1`).

**Why opt-in via `?evaluation=1` rather than implicit on no-auth:**

- Prevents accidental bypass: an agent that forgets to send its bearer doesn't silently consume the IP's evaluation quota.
- Logs are clearer: explicit evaluation calls are easy to filter in Analytics Engine.
- Documentation aligns with intent: `/api/for-agents` says "add `?evaluation=1` for free testing."

**Storage:** Cloudflare KV with key `eval:<ip>:<date>` (date in YYYY-MM-DD UTC), value is the call count, TTL 25 hours. Increment on each call. The 25h TTL handles UTC-day-rollover edge cases. Use IP from `cf-connecting-ip` header (Cloudflare-injected, trustworthy on Workers).

**Caching note:** sandbox responses CAN be cached at the Worker layer because they're not personalized. Reuse the same cache as authenticated calls; the freshness model is identical. Just skip the credit-deduction step.

**Single commit:** `feat: sandbox evaluation tier on /api/pro/* endpoints (10 calls/IP/24h, opt-in via ?evaluation=1)`.

**Update `/api/for-agents`** with a "Try before you pay" callout block linking to a curl example with `?evaluation=1`. Same commit.

**Update `/openapi.json`** to document the `evaluation` query param on every `/api/pro/*` operation and the 429 response. Same commit.

### 3. `/api/payment/history` endpoint

`GET /api/payment/history?days=7`

**Auth:** Bearer required.

**Query params:**

- `days` (optional integer, default 7, max 30): how far back to look.

**Response (200 JSON):**

```json
{
  "ok": true,
  "token_prefix": "tf_live_bceca1...",
  "window_days": 7,
  "total_calls": 38,
  "total_credits_spent": 76,
  "calls": [
    {
      "timestamp": "2026-04-27T22:30:14.000Z",
      "endpoint": "/api/pro/macro",
      "site": "terminalfeed",
      "credits": 2,
      "balance_after": 12
    },
    {
      "timestamp": "2026-04-27T22:28:01.000Z",
      "endpoint": "/api/routing",
      "site": "tensorfeed",
      "credits": 1,
      "balance_after": 14
    }
  ]
}
```

**Implementation:** TerminalFeed Worker proxies to TensorFeed's equivalent endpoint at `{TENSORFEED_AUTH_URL}/api/payment/history`. TensorFeed is the system of record for billing, so the proxy is a thin pass-through. Same pattern as `/api/payment/balance` proxy.

**Important dependency:** if TensorFeed does not yet expose `/api/payment/history` as an authenticated endpoint, this section blocks until the TensorFeed CC adds it. Quick probe:

```
curl -i https://tensorfeed.ai/api/payment/history?days=1 \
  -H "Authorization: Bearer <real_token>"
```

- 200: endpoint exists, proxy can be built immediately.
- 404: TensorFeed needs the endpoint added (separate TensorFeed CC spec).

If 404, the TensorFeed-side addition is small: call records are presumably already in TensorFeed's audit log; expose them via this endpoint, scoped to the requesting bearer's history only.

**Single commit:** `feat: /api/payment/history proxy to TensorFeed billing system of record`.

**Update `/openapi.json` and `/developers/agent-payments`** to document the endpoint.

### 4. Subscription resume endpoint

`POST /api/pro/subscribe/<id>/resume`

**Auth:** Bearer required (must match the subscription owner).

**Body:** empty (or `{}`).

**Behavior:**

1. Look up subscription by ID.
2. Verify the bearer token's wallet/account owns the subscription. If not, return 403.
3. If subscription is already active, return 200 with current state (idempotent).
4. If subscription is paused due to insufficient credits, check current balance via TensorFeed.
5. If balance >= one cycle's cost, flip `active: true` and return 200 with updated state.
6. If balance is still insufficient, return 402 with body explaining required top-up.

**Response (200 JSON):**

```json
{
  "ok": true,
  "subscription_id": "sub_abc123",
  "active": true,
  "next_run_at": "2026-04-28T09:00:00Z",
  "balance_remaining": 38,
  "credits_per_cycle": 2
}
```

**Response (402 JSON):**

```json
{
  "ok": false,
  "error": "insufficient_credits",
  "balance_remaining": 1,
  "credits_per_cycle": 2,
  "buy_url": "https://terminalfeed.io/api/payment/buy-credits"
}
```

**Implementation:** subscription state lives in KV (per CC's report: "KV-backed webhook subscriptions"). Read, modify, write atomically. The TensorFeed balance check reuses the existing `validate-and-charge` call with `cost: 0` — this validates the token without charging, returns current balance. Document this trick in the implementation comments so future maintainers don't add a redundant balance-check endpoint.

**Single commit:** `feat: POST /api/pro/subscribe/<id>/resume to reactivate auto-paused subs`.

**Update `/openapi.json` and `/developers/agent-payments`** to document the endpoint.

### 5. Idempotency keys on `/api/payment/confirm`

Industry-standard pattern. Client passes `Idempotency-Key: <uuid>` header. Server stores key + response for 24 hours. Same key replayed = cached response, no re-processing.

**Behavior:**

1. Read `Idempotency-Key` header on incoming POST `/api/payment/confirm`. If absent, process normally without idempotency.
2. If present, look up `idempotency:<key>` in KV.
3. If hit, return the cached response verbatim (same status, same body, plus header `X-Idempotency-Replay: true`).
4. If miss, process the confirm logic. Store the resulting response (status, body) in KV with TTL 86400 (24h). Return the response.

**Failure modes:**

- Two concurrent requests with the same idempotency key: second one may see a miss because the first hasn't written yet. Acceptable — they'll both process; the on-chain replay-protection layer ensures only one of them actually credits the account. The idempotency key is best-effort, not transactional.
- Different request body with the same idempotency key: do not detect or reject. Cache the FIRST response and serve it for any later replay. This matches Stripe's behavior.

**Storage key convention:** `idempotency:<sha256(token_or_anonymous_marker + ":" + key)>`. Hashing prevents collisions across users and prevents one user from learning another's idempotency keys via collision attacks.

**Single commit:** `feat: idempotency keys on /api/payment/confirm (24h KV-backed)`.

**Update `/openapi.json` and `/developers/agent-payments`** to document the `Idempotency-Key` header convention.

### 6. Retry on network error in `validate-and-charge`

When TerminalFeed Worker calls `{TENSORFEED_AUTH_URL}/internal/validate-and-charge`, certain failure classes are transient and safe to retry; others are not.

**Retry on:**

- Network error: connection refused, DNS failure, TCP reset, fetch timeout (Cloudflare Workers' fetch throws).
- These mean the request never reached TensorFeed's atomic charge logic, so retrying cannot double-charge.

**Do NOT retry on:**

- Any HTTP response from TensorFeed (including 5xx). A 5xx means the request DID reach TensorFeed and TensorFeed errored mid-process. We cannot tell whether the credit was decremented before the error. Retrying risks double-charge.
- 401 (auth wrong), 400 (bad request body), 200 with `ok: false` — these are normal logical responses, not transient failures.

**Retry policy:** one retry, fixed 200ms delay. After the second failure, return `503 billing_unavailable` to the client with a body explaining transient billing unavailability and suggesting retry from their side.

**Implementation sketch:**

```js
async function validateAndCharge(env, token, cost, endpoint, attempt = 1) {
  try {
    const resp = await fetch(`${env.TENSORFEED_AUTH_URL}/internal/validate-and-charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Auth': env.SHARED_INTERNAL_SECRET,
      },
      body: JSON.stringify({ token, cost, endpoint }),
      // Cloudflare fetch timeout: Workers fetch defaults to ~30s. Set explicit short timeout.
      signal: AbortSignal.timeout(8000),
    });
    return { http_ok: true, response: resp };
  } catch (err) {
    // Network error or timeout. Safe to retry once.
    if (attempt === 1) {
      await new Promise(r => setTimeout(r, 200));
      return validateAndCharge(env, token, cost, endpoint, 2);
    }
    return { http_ok: false, error: err };
  }
}
```

Single commit: `feat: retry validate-and-charge once on network error (no retry on HTTP responses)`.

### 7. Schema stability commitment

Add a section to `/terms` and a callout block on `/api/for-agents`.

**Text for `/terms` (add as a new numbered section under the existing Premium API Tier section):**

> ### Schema Stability
>
> TerminalFeed commits to not breaking premium API response schemas without 90 days of public deprecation notice.
>
> 1. New fields may be added to any response at any time. Clients must tolerate unknown fields gracefully.
> 2. Existing documented fields will not be removed, renamed, or have their type changed without 90 days of advance notice via the public changelog at /changelog and a per-response `X-TerminalFeed-Deprecation` header on the affected endpoint.
> 3. The `_meta` block on every `/api/pro/*` response is governed by the same stability commitment.
> 4. Sandbox evaluation responses share the same schema as authenticated responses, except for the `_meta.tier` and `_meta.evaluation_remaining` fields, which only appear in evaluation mode.
> 5. URL paths for premium endpoints are stable. New endpoints may be added; existing endpoint paths will not be removed without the same 90-day notice.

**`X-TerminalFeed-Deprecation` header convention:** when a field or endpoint is being deprecated, every response on the affected endpoint includes a header like:

```
X-TerminalFeed-Deprecation: field=foo,bar; sunset=2026-08-01; replacement=baz
```

Until the sunset date, the field continues to be served. After sunset, it may be removed.

**Add a "Schema Stability" callout block on `/api/for-agents`** with a one-paragraph plain-language version plus a link to the full /terms section.

**Update `/openapi.json` `info.description`** with one sentence pointing at the stability commitment.

**Single commit:** `feat: publish schema stability commitment in /terms and /api/for-agents`.

### 8. End-to-end live smoke test script

Create `scripts/smoke-test-premium.sh` (or `.js` if Node is more idiomatic for the existing repo). Single repeatable script that exercises every code path. Run on demand, not in CI (it costs real credits).

**Steps:**

1. **Buy 1 USDC of credits.** POST `/api/payment/buy-credits` with `{ amount_usd: 1.00 }`. Capture memo + wallet + nonce. (Manual step: human sends the USDC, pastes tx hash into the script.)
2. **Confirm payment.** POST `/api/payment/confirm` with tx_hash + nonce. Capture bearer token. Verify response has 50 credits.
3. **Test idempotency on confirm.** Re-POST with the same `Idempotency-Key`. Verify response is identical and includes `X-Idempotency-Replay: true`.
4. **Test all 12 premium endpoints.** Loop, call each with bearer auth. For each: verify HTTP 200, verify `_meta` block exists with non-empty `sources` array, verify `X-Credits-Remaining` decremented appropriately. Log per-endpoint timings.
5. **Test sandbox evaluation tier.** Call `/api/pro/macro?evaluation=1` 11 times without auth. Verify first 10 succeed with `_meta.tier: "evaluation"`, 11th returns 429 with `evaluation_quota_exhausted`.
6. **Test webhook delivery.** Create a subscription pointed at a webhook.site inbox. Wait for next cycle to fire (or trigger manually if there's an admin endpoint for that). Fetch from webhook.site API, verify delivery received within timeout, verify HMAC signature with the shared webhook secret.
7. **Test subscription resume.** Pause the test subscription manually (or wait for it to auto-pause if balance is low). Top up credits if needed. Call `/api/pro/subscribe/<id>/resume`. Verify 200 with `active: true`.
8. **Test payment history.** Call `/api/payment/history?days=1`. Verify the response shows the calls just made above.
9. **Test all 21 MCP tools.** Run `terminalfeed-mcp` (the MCP server build, when shipped) in a test harness, dispatch each of the 21 tools, verify each returns expected shape. (If MCP server is not yet shipped at the time this script first runs, mark these steps as skipped with `MCP server not yet deployed`.)
10. **Cleanup.** Delete the test subscription. Optionally request refund of remaining credits via support email (out of script scope).

**Output:** PASS/FAIL per check, total wall time, total credits spent, summary at end. Exit code 0 if all pass, 1 if any fail.

**Single commit:** `chore: add scripts/smoke-test-premium.sh for end-to-end live verification`.

**Cost estimate:** ~30-35 credits per full run (12 endpoints × 1-3 credits each + a few subscription cycles). One $1 USDC purchase covers a run plus headroom.

---

## Execution Order

1. **Evan prereqs in parallel:** `wrangler secret put FRED_API_KEY`, `wrangler secret put GITHUB_TOKEN`. ~10 min.
2. **Section 1:** `_meta` block on all 12 premium endpoints. 4 commits batched by endpoint group + 1 OpenAPI commit. Most foundational; everything else benefits from it.
3. **Section 7:** Schema stability commitment. Single commit. Cheap, valuable, sets the trust contract before sandbox lands.
4. **Section 2:** Sandbox evaluation tier. Single commit. Depends on `_meta` shape from Section 1.
5. **Section 5:** Idempotency keys on confirm. Single commit. Independent.
6. **Section 6:** Retry-on-network-error. Single commit. Independent.
7. **Section 3:** Payment history endpoint. Single commit. (Probe TensorFeed first; may block on TensorFeed-side spec.)
8. **Section 4:** Subscription resume. Single commit. Independent.
9. **Section 8:** Smoke test script. Single commit. Run it after deploy, capture results.

Total: 10-12 commits. No Durable Objects. KV-only state additions. Estimated CC time: 4-5 hours.

---

## Verification Checklist

- [ ] `curl https://terminalfeed.io/api/pro/macro -H "Authorization: Bearer <token>"` response includes top-level `_meta` block with `generated_at`, `endpoint`, `tier: "premium"`, and `sources` array
- [ ] At least one `_meta.sources[]` entry has `status: "live"` with non-zero `latency_ms`
- [ ] `curl https://terminalfeed.io/api/pro/macro?evaluation=1` (no auth) returns 200 with `_meta.tier: "evaluation"` and `_meta.evaluation_remaining` shown
- [ ] 11th sandbox call from same IP within 24h returns 429 with `evaluation_quota_exhausted`
- [ ] `curl https://terminalfeed.io/api/payment/history?days=7 -H "Authorization: Bearer <token>"` returns 200 with `calls` array including both terminalfeed and tensorfeed entries (cross-site visibility)
- [ ] `curl -X POST https://terminalfeed.io/api/pro/subscribe/<id>/resume -H "Authorization: Bearer <token>"` flips a paused sub to active=true when balance is sufficient
- [ ] Same `Idempotency-Key` on `/api/payment/confirm` returns the same response with `X-Idempotency-Replay: true` on second call
- [ ] Forced network-error simulation between TerminalFeed and TensorFeed (e.g., temporarily wrong TENSORFEED_AUTH_URL during dev) shows one retry attempt before returning 503
- [ ] `/terms` page contains the new "Schema Stability" section with all five numbered points
- [ ] `/api/for-agents` page contains a Schema Stability callout linking to /terms
- [ ] `/openapi.json` documents `_meta`, `evaluation` query param, idempotency header, history endpoint, resume endpoint, and the schema stability commitment in `info.description`
- [ ] `scripts/smoke-test-premium.sh` runs to completion with all PASS, total credit spend matches expectation
- [ ] Free tier endpoints: confirm bodies are identical pre/post-deploy (no accidental changes)
- [ ] No em dashes anywhere in new content (lint enforces)
- [ ] FRED_API_KEY set: `/api/pro/macro` returns non-null Fed rate, CPI, unemployment, GDP, treasury values; `_meta.sources[].status` is `live` not `null`
- [ ] GITHUB_TOKEN set: `/api/pro/world-deltas` and any github-velocity-using endpoint shows `live` source status without rate-limit errors in `_meta`

---

## What this spec does NOT cover

- LLM-based sentiment scoring upgrade. Phase 2; per-call LLM cost is margin-thin on a 2-credit endpoint.
- Per-endpoint public health/status page (`/status` or similar). Phase 2; the `_meta` block in this spec gives per-call freshness which is the immediate need.
- Pricing experiments (sentiment vs whales at same price feels uneven). Defer until traffic data informs the design.
- Volume discount tiers beyond the flat $1 = 50 credits. Phase 2 once revenue patterns emerge.
- Webhook delivery infrastructure rebuild. CC reports KV-backed subs and Analytics Engine writes already work; this spec just adds the resume endpoint and the smoke-test verification.
- TensorFeed-side `/api/payment/history` endpoint. If absent, separate TensorFeed CC spec needed (small, ~30 lines exposing existing audit log).
- New premium endpoints. Hold the line at 12 until acquisition flywheel is observed.
- Webhook secret rotation flow. Phase 2.
- Customer-facing dashboard for usage analytics. Phase 2 once traffic justifies it.
- Automated refund processing. Phase 2; manual via support@ stays for now per existing /terms.
- Idempotency keys on premium endpoints themselves. Premium calls are read-only and cheap; idempotency on payment writes is sufficient.

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** Existing premium endpoints have customers (or will have very soon). Each commit must be smoke-testable in isolation. The `_meta` block addition is the highest-blast-radius change in this spec because it touches all 12 endpoints. Ship in batches of 3 and verify after each batch.
2. **Existing field semantics are inviolable.** New fields like `_meta` are additive. Do NOT change any existing field's name, type, or meaning. The schema stability commitment in Section 7 hinges on this being literally true.
3. **Probe TensorFeed for `/api/payment/history` BEFORE starting Section 3.** Curl it with a real bearer. If 404, Section 3 blocks until a TensorFeed-side spec ships. Don't try to work around it; the proxy pattern requires the source to exist.
4. **Validate `/openapi.json` after every edit.** A broken OpenAPI doc poisons every downstream agent framework that imports it. Use `npx @redocly/cli lint openapi.json` or equivalent. Fix every error before commit.
5. **No em dashes** anywhere. The em-dash lint will catch regressions. New text in `/terms`, `/api/for-agents`, `_meta` field descriptions, and error messages must use ASCII punctuation.
6. **The `_meta.sources[].name` values are part of the schema.** Once published, they cannot change without 90-day deprecation per Section 7. Pick names carefully. Convention: `{Provider}.{specific_metric}`. Use the actual provider name as it's documented publicly (FRED, Binance, Polymarket, Etherscan, mempool.space, DefiLlama, etc.).
7. **KV operations on Workers are not transactional across keys.** The idempotency-key write in Section 5 and the subscription state read-modify-write in Section 4 both must tolerate concurrent calls without corruption. When in doubt, document the failure mode rather than fight for atomicity. KV is eventually consistent; the on-chain replay-protection layer is the real source of truth for billing.
8. **Sandbox tier must NOT call validate-and-charge.** That call decrements credits. Sandbox bypasses billing entirely. Verify by inspecting Worker logs after a sandbox call: there should be zero TensorFeed traffic.
9. **Do not change response status codes on existing endpoints.** A client expecting 200 should still get 200. New status codes (429 for evaluation quota, 503 for billing transient, 402 with new error reasons) are introduced only on new code paths.
10. **The smoke-test script should be safe to re-run.** No state that breaks if run twice. Section 8 step 10 cleanup is mandatory; do not leave test subscriptions live in production state.
11. **Webhook signature secret must NOT be logged.** The smoke test verifies signatures but should never echo the secret to stdout. Read it from env, use it, do not print it.
12. **Idempotency cache key includes the bearer token (or "anonymous" marker for unauthenticated calls).** Two different customers using the same `Idempotency-Key` value MUST NOT collide. Section 5's hashing convention prevents this; do not skip it.
