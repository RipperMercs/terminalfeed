# CC Spec: Premium API Tier for AI Agents (USDC Micropayments)

**Date:** April 24, 2026
**Priority:** HIGH (revenue line; pairs with the proven TensorFeed payment infra)
**Scope:** Ship a Phase 1 premium API tier on terminalfeed-api Worker. Three new gated endpoints (`/api/pro/briefing`, `/api/pro/macro`, `/api/pro/crypto-deep`), bearer-token auth via the existing TensorFeed payment Worker (shared credit pool), and the public surfaces required for agent discovery and ToS compliance. Free tier endpoints remain untouched.

---

## Executive Summary

TensorFeed.ai shipped agent-pays-USDC for premium API access on the first deploy attempt. The full loop works: `tf.buy_credits()` → on-chain USDC transfer on Base → `tf.confirm()` → bearer token → metered API calls. The SDK is live on PyPI. The infrastructure is proven.

TerminalFeed's data is a stronger fit than TensorFeed's. We aggregate 23+ real-time feeds (markets, crypto, macro, predictions, cyber threats, space, weather, infrastructure status), absorb the upstream paid-key costs (Finnhub, FRED, Etherscan), and serve on a stale-cache-on-failure contract that means agents always get a response. That's a service, not a data dump. Hard to scrape, harder to replicate.

This spec ships:

1. **Three premium endpoints** at `/api/pro/*` that compose multi-source data into one-call deliverables agents would otherwise build themselves.
2. **Bearer-token auth** delegated to the TensorFeed payment Worker via internal HTTP contract. Same USDC wallet, same Base chain, shared credit pool: a token bought on either site spends on both.
3. **ToS amendments** for premium endpoints (no-training / inference-only license, 24-hour refund window, replay protection note, no SLA, wallet cross-verification).
4. **Public discovery surfaces** so agents find the tier without human handholding (`/developers/agent-payments` page, updated `/llms.txt`, updated `/terms`, X-TerminalFeed-Pricing response header).

**Hard non-goal:** do not change any existing free `/api/*` endpoint. No rate-limit tightening, no field removal, no schema change. Premium tier is purely additive. This is the trust contract for the existing 50K+ daily requests, mostly agents.

---

## Architecture Decisions (made; flag if you want to override)

1. **Shared credit pool with TensorFeed.** Same USDC wallet, same Base chain, bearer tokens issued by TensorFeed are valid on TerminalFeed and vice versa. One credit purchase, spends on either site. Stronger bundle, simpler agent UX.
2. **TensorFeed Worker is the system of record for billing.** TerminalFeed Worker calls a TensorFeed internal endpoint (`POST /internal/validate-and-charge`) to authenticate bearer tokens and decrement credits. TerminalFeed never holds wallet keys, never directly receives payment, never tracks credit balances itself.
3. **URL prefix `/api/pro/*`.** Neutral, signals "gated" without locking in marketing language. Matches the URL stability promise of the free tier (no future renaming).
4. **Pricing parity with TensorFeed.** $1 USDC = 50 credits at quote time. Endpoint costs: 1 credit for single-composite calls, 2 credits for multi-composite or history-extended calls. Tunable post-launch from a config block, not from code.
5. **No SDK in Phase 1.** Agents authenticate via `Authorization: Bearer tf_live_...` header on standard HTTP. The existing `tensorfeed` Python SDK can be extended to wrap TerminalFeed endpoints in Phase 2 once we see traffic.
6. **Free tier is untouched.** All existing `/api/*` endpoints remain on current rate limits with current schemas. The premium tier adds NEW URLs only.

If any of these read wrong, flag before sending to CC and the spec gets patched.

---

## Sections

### 1. Worker route table

Add three premium routes to `worker-additions/src/routes/`:

| Route | Cost (credits) | Composes | Optional params |
|---|---|---|---|
| `/api/pro/briefing` | 1 | All free /api/briefing modules + selectable filtering | `?include=btc,fear-greed,predictions` (comma-list); `?history=24h` |
| `/api/pro/macro` | 2 | FRED (Fed rate, CPI, unemployment, GDP, 10Y treasury) + forex (USD index, EUR/USD, JPY/USD, GBP/USD, CHF/USD) + commodities (gold, silver, oil, nat gas) + market context (S&P 500, Dow, Nasdaq, VIX) | `?history=30d` for time-series |
| `/api/pro/crypto-deep` | 2 | CoinGecko top 50 + Binance live prices top 20 + mempool.space network stats + Etherscan gas | `?coins=btc,eth,sol` filter; `?history=30d` for price/volume series |

All three follow the existing /api/* Worker conventions per CLAUDE.md:
- 8-second timeout on every external call.
- In-memory cache with per-endpoint TTL: briefing 60s, macro 5min, crypto-deep 60s.
- Stale cache returned on upstream failure. Never 5xx the agent.
- `Access-Control-Allow-Origin: *` on all responses.
- Response format JSON only. No HTML, no XML.

History endpoints use the `history` query param to upgrade the response: when present, the response includes a `series` array of timestamped snapshots in addition to the current snapshot. Match the data shape pattern TensorFeed uses for `pricing_series`/`benchmark_series` so the future SDK can reuse the same parser.

### 2. Auth & billing flow

Every premium endpoint follows the same pattern:

```
Agent → GET /api/pro/macro (Authorization: Bearer tf_live_<hex>)
TerminalFeed Worker → POST {TENSORFEED_AUTH_URL}/internal/validate-and-charge
                      body: { token: <bearer>, cost: 2, endpoint: "tf:/api/pro/macro" }
                      header: X-Internal-Auth: {SHARED_INTERNAL_SECRET}
TensorFeed Worker → returns { ok: true, credits_remaining: 47 }
                          OR  { ok: false, reason: "invalid_token" | "insufficient_credits" | "expired" }
TerminalFeed Worker → if ok, fetch + return data with header X-Credits-Remaining: 47
                       if not ok, return 402 Payment Required with body explaining why and link to /developers/agent-payments
```

Bearer token format: `tf_live_<32-char-hex>`. Already established by TensorFeed. Do not invent a new format.

Internal contract assumption: TensorFeed Worker exposes `POST /internal/validate-and-charge` accepting `{ token, cost, endpoint }` and returning `{ ok, credits_remaining, reason? }`. **This endpoint must exist on the TensorFeed Worker before the TerminalFeed deploy lands.** If it doesn't, ship the TensorFeed-side spec first. Coordinate with the TensorFeed Cowork session to confirm the contract is live.

`SHARED_INTERNAL_SECRET` and `TENSORFEED_AUTH_URL` are stored as Worker secrets:
```
npx wrangler secret put TENSORFEED_AUTH_URL  # value: https://tensorfeed.ai
npx wrangler secret put SHARED_INTERNAL_SECRET  # value: matches tensorfeed-api Worker secret
```

Atomic-charge property: TensorFeed Worker decrements credits BEFORE returning ok:true. If the credit decrement fails (insufficient balance, expired, race), `ok:false` is returned and TerminalFeed must NOT serve the response. If TerminalFeed's upstream fetch fails after credits were decremented, the call still counts (matches TensorFeed's existing model — the credit pays for the routing decision and aggregation work, not a guaranteed upstream success). Document this clearly in the /developers/agent-payments page.

Replay protection: tokens themselves carry a server-side counter on the TensorFeed side. TerminalFeed does not need to manage replay state. Trust the auth response.

### 3. Quote, confirm, and balance endpoints

Agents need to be able to buy credits without leaving TerminalFeed's surface. Add three proxy endpoints in terminalfeed-api Worker that forward to TensorFeed:

| Route | Method | Forwards to | Notes |
|---|---|---|---|
| `/api/buy-credits` | POST | `{TENSORFEED_AUTH_URL}/api/buy-credits` | Body: `{ amount_usd }`. Returns memo + wallet address + quote. |
| `/api/confirm-payment` | POST | `{TENSORFEED_AUTH_URL}/api/confirm-payment` | Body: `{ tx_hash, nonce }`. Returns bearer token + credit count. |
| `/api/balance` | GET | `{TENSORFEED_AUTH_URL}/api/balance` | Header: `Authorization: Bearer tf_live_...`. Returns credits remaining. |

Proxy logic is dumb: forward request body, forward auth header, forward response. Add `X-Forwarded-By: terminalfeed` header so TensorFeed can log cross-site usage if useful.

Why proxy instead of redirecting: agents reading /llms.txt should see all relevant URLs on terminalfeed.io. Sending them off-domain mid-flow breaks the discoverability contract.

### 4. Public-facing additions

#### 4a. /developers/agent-payments page

New page at `/public/developers/agent-payments.html`. Mirror the TensorFeed page structure if accessible; otherwise structure it as:

1. **Headline:** "TerminalFeed Premium API for AI Agents — Pay in USDC, get aggregated real-time data."
2. **Quick start:** 3-block code example showing buy_credits → send USDC → confirm → call /api/pro/macro. Use curl, not an SDK (Phase 1 has no SDK).
3. **Endpoints reference:** Table from Section 1 with example requests + responses.
4. **Pricing:** $1 USDC = 50 credits. Per-call costs. No subscription. No expiry on credits.
5. **Wallet:** Published wallet address (the same USDC wallet TensorFeed uses on Base mainnet). Include the wallet at four published locations per the TensorFeed pattern: this page, /terms, /llms.txt, GitHub repo README.
6. **No-training clause:** Brief plain-English version with link to /terms.
7. **Refund policy:** 24-hour window, manual USDC return on request to support@terminalfeed.io.
8. **Cross-site bundle note:** "Credits bought here also work on TensorFeed.ai, and vice versa. One purchase, both data sources."
9. **Footer:** Link to /terms, link to TensorFeed equivalent page, X handle.

#### 4b. /llms.txt update

Add a Premium API section after the existing endpoint list:

```
## Premium API (USDC micropayments)
Base path: https://terminalfeed.io/api/pro/
Buy credits: POST /api/buy-credits
Confirm payment: POST /api/confirm-payment
Check balance: GET /api/balance (Bearer auth required)

Endpoints:
- GET /api/pro/briefing (1 credit; ?include= filter, ?history=24h supported)
- GET /api/pro/macro (2 credits; ?history=30d supported)
- GET /api/pro/crypto-deep (2 credits; ?coins= filter, ?history=30d supported)

Pricing: $1 USDC on Base mainnet = 50 credits. No subscription. No expiry.
Cross-site: credits work on tensorfeed.ai. See /developers/agent-payments.
Wallet (published): {WALLET_ADDRESS}
```

Replace `{WALLET_ADDRESS}` with the live address. Must match the address on /terms, /developers/agent-payments, and the GitHub README.

#### 4c. /terms update

Add a section "Premium API Tier" with the following clauses (plain language, no em dashes):

1. **Inference-only license.** Premium API responses are licensed for inference and reasoning use by agents and applications. Not licensed for use as training data, fine-tuning input, or model distillation. Free tier endpoints retain their existing permissive license.
2. **Bearer token responsibility.** Tokens are bearer credentials. Theft equals loss. Treat them like API keys: store securely, scope per-agent, rotate on compromise.
3. **No SLA.** Best-effort uptime. We owe no guarantee of availability or response time. Stale cache may be returned on upstream failure.
4. **Replay protection.** Server-side nonce tracking applies. Replayed tx hashes will not credit the account twice.
5. **Refund window.** 24 hours from credit purchase, manual USDC return on email request.
6. **Wallet cross-verification.** The published wallet address is duplicated at four locations (/terms, /developers/agent-payments, /llms.txt, GitHub repo README). If any disagree, do not send funds and contact support.
7. **Tax handling.** Agents are responsible for their own tax handling on USDC purchases.
8. **Cross-site applicability.** Credits and tokens are jointly redeemable on terminalfeed.io and tensorfeed.ai. Refund policy applies to the purchase regardless of which site the credits were spent on.

Match the heading style and section numbering of the existing /terms page. Do not edit existing sections.

#### 4d. Free tier response header

Add a hint header to all free `/api/*` responses (not just premium) so curious agents discover the tier:

```
X-TerminalFeed-Pricing: https://terminalfeed.io/developers/agent-payments
```

One-line addition in the shared response builder. Zero risk to existing clients (header is informational, no client should be reading or relying on a custom X- header).

### 5. Endpoint implementations

For each `/api/pro/*` route, the handler skeleton is:

```js
async function handlePro(req, env, endpoint, costCredits, fetchFn) {
  // 1. Extract bearer token
  const auth = req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return json402('missing_token', '/developers/agent-payments');
  }

  // 2. Validate + charge via TensorFeed
  const validation = await fetch(`${env.TENSORFEED_AUTH_URL}/internal/validate-and-charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Auth': env.SHARED_INTERNAL_SECRET,
    },
    body: JSON.stringify({ token, cost: costCredits, endpoint: `tf:${endpoint}` }),
  });

  if (!validation.ok) {
    return json402('billing_unavailable', '/developers/agent-payments');
  }

  const result = await validation.json();
  if (!result.ok) {
    return json402(result.reason, '/developers/agent-payments');
  }

  // 3. Fetch the actual data (with timeout, cache, stale-on-failure per CLAUDE.md)
  const data = await fetchFn(req, env);

  // 4. Return with credits-remaining header
  return jsonResponse(data, {
    'X-Credits-Remaining': String(result.credits_remaining),
    'X-TerminalFeed-Pricing': 'https://terminalfeed.io/developers/agent-payments',
    'Cache-Control': 'no-store',  // do not let CDNs cache premium responses; they vary by token
  });
}
```

The `fetchFn` for each endpoint composes its upstream sources using the same patterns as the existing free endpoints. Reuse helpers from `worker-additions/src/lib/` where possible (cache, timeout, fetch-with-fallback).

`json402(reason, url)` returns a 402 Payment Required with `{ error: reason, signup: url, pricing: { '$1_usd': '50_credits' } }`.

### 6. Wallet & secret setup

Before deploying:

```
# In worker-additions/
npx wrangler secret put TENSORFEED_AUTH_URL    # https://tensorfeed.ai
npx wrangler secret put SHARED_INTERNAL_SECRET  # value matches tensorfeed-api Worker
```

Confirm the same `SHARED_INTERNAL_SECRET` is set on the TensorFeed Worker. Without that, `validate-and-charge` will reject TerminalFeed's calls.

The wallet address is not a Worker secret (it's intentionally public on /llms.txt and /terms). Hardcode it as a constant in `worker-additions/src/lib/wallet.ts`:

```ts
// Same wallet used by TensorFeed. Cross-verified at 4 locations per /terms.
export const PUBLISHED_USDC_WALLET = '0x...'; // fill in from TensorFeed config
```

### 7. Verification checklist

Before marking the spec shipped, all the following must pass:

- [ ] `curl -X POST https://terminalfeed.io/api/buy-credits -d '{"amount_usd":1.00}'` returns a memo, wallet address, and quote
- [ ] Wallet address in the quote matches the address on /terms, /developers/agent-payments, /llms.txt, and the GitHub repo README (cross-verification)
- [ ] After sending 1 USDC on Base mainnet, `curl -X POST https://terminalfeed.io/api/confirm-payment -d '{"tx_hash":"0x...","nonce":"..."}'` returns a bearer token and 50 credits
- [ ] `curl https://terminalfeed.io/api/balance -H "Authorization: Bearer <token>"` returns 50
- [ ] `curl https://terminalfeed.io/api/pro/macro -H "Authorization: Bearer <token>"` returns FRED + forex + commodities + market data; balance drops to 48
- [ ] `curl https://terminalfeed.io/api/pro/briefing -H "Authorization: Bearer <token>"` returns briefing payload; balance drops to 47
- [ ] `curl https://terminalfeed.io/api/pro/crypto-deep -H "Authorization: Bearer <token>"` returns crypto + on-chain + gas; balance drops to 45
- [ ] Same token works on tensorfeed.ai for `tf.routing()` (cross-site verification)
- [ ] `curl https://terminalfeed.io/api/pro/macro` (no auth) returns 402 with body pointing to /developers/agent-payments
- [ ] `curl https://terminalfeed.io/api/pro/macro -H "Authorization: Bearer invalid_token"` returns 402 with reason `invalid_token`
- [ ] `curl -i https://terminalfeed.io/api/btc-price` shows `X-TerminalFeed-Pricing` response header
- [ ] /developers/agent-payments page renders cleanly on mobile and desktop, no em dashes, schema.org TechArticle JSON-LD present
- [ ] /terms page has the new Premium API Tier section, properly numbered, no em dashes, no edits to existing sections
- [ ] /llms.txt has the Premium API section
- [ ] GitHub repo README has the wallet address (manual update after deploy)
- [ ] Existing free endpoints unchanged: bundle hash flipped only for the new code, free `/api/briefing` returns identical payload to pre-deploy
- [ ] No new direct-external-fetch violations (rule #6 lint passes)

### 8. Rollout plan

1. **Confirm TensorFeed Worker has `/internal/validate-and-charge`** before any TerminalFeed-side work. If not, ship the TensorFeed-side spec first.
2. **Deploy Worker first.** All `/api/pro/*` and `/api/buy-credits|confirm-payment|balance` routes ship in `worker-additions/`. `npx wrangler deploy`. Smoke-test with a test wallet sending real USDC end-to-end.
3. **Frontend additions.** /developers/agent-payments page, /terms update, /llms.txt update, X-TerminalFeed-Pricing header. Single git push, Pages auto-deploys.
4. **GitHub README update.** Wallet address added by Evan as a manual edit (not in CC's scope).
5. **Announce.** X post from @terminalfeed announcing the tier with a link to /developers/agent-payments. Optional; doesn't block deploy.

Total commits: 5-7. Worker deploy first, frontend second per CLAUDE.md rule.

### 9. Phase 2 follow-ups (out of scope here, capture for later)

- Python SDK extension: add TerminalFeed methods (`tf.briefing_pro()`, `tf.macro()`, `tf.crypto_deep()`) to the existing `tensorfeed` PyPI package, OR ship a `terminalfeed` package with shared auth primitives
- TypeScript SDK
- Webhook delivery for time-series subscriptions (`/api/pro/macro/subscribe?webhook_url=...`)
- Per-endpoint historical archives (S3-style cold storage of pre-computed daily snapshots)
- Enriched directory of all premium customers / public usage stats
- Human-readable agent-billing dashboard
- More premium endpoints: deep stocks history, prediction-markets archive, full economic-data series, on-chain analytics composites
- Rate-limit tightening on the FREE tier IF traffic patterns suggest agents are bypassing premium by hammering free endpoints (do not do this preemptively)

---

## Execution Order

1. Section 1 + 5: Build three `/api/pro/*` route handlers in `worker-additions/`. Single commit: `feat: add /api/pro/* premium endpoints scaffolding (auth-gated, no upstream fetch yet)`.
2. Wire the three upstream fetch composers (briefing/deep, macro, crypto-deep). Three commits, one per endpoint, so each is independently reviewable.
3. Section 3: Proxy endpoints `/api/buy-credits`, `/api/confirm-payment`, `/api/balance`. Single commit.
4. Section 4d: X-TerminalFeed-Pricing header on free responses. Single commit.
5. Section 6: Worker secrets via `wrangler secret put`. No commit (no source change). Verify with `wrangler secret list`.
6. **Deploy Worker.** Smoke-test the auth flow before any frontend work.
7. Section 4a: /developers/agent-payments page. Single commit.
8. Section 4c: /terms update. Single commit.
9. Section 4b: /llms.txt update. Single commit.
10. Section 7: Verification checklist. Fixes only if needed.

Total: 8-10 commits. Two deploys (Worker, then frontend).

---

## What this spec does NOT cover

- Python or TypeScript SDK. Phase 1 is HTTP + curl only. SDK is Phase 2.
- The TensorFeed-side `/internal/validate-and-charge` endpoint. That's a separate spec for the TensorFeed CC session. Confirm it's live before starting TerminalFeed work.
- Free tier rate-limit changes. Premium is purely additive.
- New premium endpoints beyond the three named. List of candidates is in Section 9.
- Marketing launch sequence (HN, Reddit, X campaign). Out of scope here; cover in a separate marketing brief.
- AdSense interaction. Premium API tier does not conflict with AdSense (different surface). If AdSense ToS questions arise during re-approval, handle separately.
- Wallet rotation policy. Phase 1 uses the same wallet TensorFeed uses. Future rotation is a separate decision.
- Token expiry. TensorFeed's existing model has non-expiring credits per its own ToS. Match.
- Bulk discounts (e.g. $50 = 3000 credits). Future tuning, not Phase 1.

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** Every new route ships behind error handling. Auth failures return 402, never propagate upstream errors as 500. Timeouts are 8 seconds across the board. Stale cache wins over a broken response.
2. **Free tier is sacred.** Do not modify any existing `/api/*` route, do not change any existing schema, do not tighten any existing rate limit. Premium is purely additive. The trust contract with the existing 50K+ daily requests is the most valuable thing this site has.
3. **TensorFeed contract first.** Do not deploy TerminalFeed-side until the TensorFeed Worker has `/internal/validate-and-charge` exposed and the shared secret is configured. Verify by curling the TensorFeed endpoint with a test token before shipping.
4. **No em dashes** in any new endpoint response, error message, /developers/agent-payments page copy, /terms text, or /llms.txt entry. The em-dash lint will catch regressions if Section 5 of `cc-spec-em-dash-audit.md` is wired.
5. **Wallet cross-verification at four locations.** /terms, /developers/agent-payments, /llms.txt, GitHub README. If any drift, the trust signal breaks. Verify after deploy.
6. **Worker secrets via `wrangler secret put` only.** Never commit `SHARED_INTERNAL_SECRET` or any credential. Wallet address is fine in source (it's intentionally public).
7. **Worker first, frontend second.** Per CLAUDE.md rule #6 / deploy ordering. The /developers/agent-payments page must not 404 on a Worker route that doesn't exist yet.
8. **One commit per logical unit** per the execution order. No batching.
9. **Cache-Control: no-store on premium responses.** Do not let CDNs or shared caches store responses that vary by bearer token. Free tier caching is unchanged.
10. **Atomic charge property.** TensorFeed Worker decrements credits before returning ok:true. If the TensorFeed call returns ok:true but TerminalFeed's upstream fetch then fails, the credit still counts. Document this on /developers/agent-payments. Matches TensorFeed's existing model.
11. **402, not 401.** Auth failures on premium endpoints return 402 Payment Required, not 401 Unauthorized. The agent's token may be valid but out of credits. Use the `reason` field to disambiguate.
12. **The X-TerminalFeed-Pricing header on free endpoints is the discovery flywheel.** Every free response advertises the premium tier. Do not skip this.
