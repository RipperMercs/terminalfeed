# CC Spec (for TensorFeed): Expose `/api/internal/validate-and-charge`

**Date:** April 27, 2026
**Priority:** HIGH (unblocks TerminalFeed premium tier launch)
**Scope:** Lift the existing in-process credit-validation logic on the TensorFeed Worker into a callable internal HTTP endpoint that the TerminalFeed Worker (and any future sister-site Worker) can call. Authenticate the call with a shared secret. Do not change any existing public endpoint.

---

## Why this exists

TerminalFeed's premium tier (`/api/pro/briefing`, `/api/pro/macro`, `/api/pro/crypto-deep`) is shipped, deployed, and live behind bearer-token auth at <https://terminalfeed.io>. The bearer tokens are minted by **TensorFeed's** payment Worker and the credit pool is shared (one purchase, both sites — that is the bundle pitch).

Today, TensorFeed's `/api/routing` (and any other premium TensorFeed endpoint) validates the bearer token and decrements credits **internally**, by calling a private function inside the same Worker. TerminalFeed lives in a different Worker on a different zone and needs to perform the same validation over HTTP.

We have already verified the rest of the contract works:

- `POST https://terminalfeed.io/api/payment/buy-credits` proxies to `https://tensorfeed.ai/api/payment/buy-credits` and returns a real wallet/memo/quote (live test, April 27, 2026).
- The wallet `0x549c82e6bfc54bdae9a2073744cbc2af5d1fc6d1` is the same wallet TensorFeed uses, cross-verified at four locations.
- TerminalFeed's `validateAndCharge` helper already POSTs to `${TENSORFEED_AUTH_URL}/internal/validate-and-charge` with body `{token, cost, endpoint}` and header `X-Internal-Auth: ${SHARED_INTERNAL_SECRET}` — but the path does not exist yet on the TensorFeed Worker, so every premium TerminalFeed call returns `402 billing_unavailable`.

This spec ships that endpoint.

---

## Architecture (proposed)

1. **One new route on the TensorFeed Worker: `POST /api/internal/validate-and-charge`.**
2. **Authenticated by an `X-Internal-Auth` header that must equal the `SHARED_INTERNAL_SECRET` Worker secret.** Any other value, missing header, or wrong method returns 401 immediately. No body parsing on auth failure.
3. **Body**: `{ token: string, cost: integer, endpoint: string }`.
4. **Behavior**: identical to the existing in-process validation that `/api/routing` and friends already use. Look up the token, atomically decrement `cost` credits, return result.
5. **Response shape (always 200, even on logical failure, so downstream can read the body cleanly)**:
   ```json
   { "ok": true, "credits_remaining": 47 }
   ```
   or
   ```json
   { "ok": false, "reason": "invalid_token" | "insufficient_credits" | "expired" | "replayed" }
   ```
6. **Atomic-charge property**: credits are decremented before this endpoint returns `ok:true`. If `ok:false`, no credit was decremented. This matches the agent-payments documented contract on both sites and the existing internal behavior.

Do **not** add this endpoint to `/api/payment/info`, the public 404 endpoint list, `/llms.txt`, the `/openapi.json`, or any agent-facing surface. It is internal infrastructure.

---

## Sections

### 1. Refactor existing validate logic into a reusable function

If TensorFeed's premium endpoints currently inline the validate-and-charge logic, lift it into a shared helper module:

```js
// tensorfeed-api/src/lib/credits.js (or wherever fits the existing structure)
export async function validateAndCharge(env, { token, cost, endpoint }) {
  // Existing logic that:
  //  - Looks up the token in the credit ledger (KV / D1 / wherever)
  //  - Verifies it is not expired or revoked
  //  - Atomically decrements cost credits if balance >= cost
  //  - Increments the per-endpoint usage counter (for analytics)
  //  - Returns { ok: true, credits_remaining } or { ok: false, reason }
  //
  // Should be a pure function over env. No HTTP, no side-effects beyond the ledger.
}
```

The existing premium handlers (`/api/routing`, etc.) call this helper with `endpoint: "tensorfeed:/api/routing"`. The new internal handler will call the same helper with whatever endpoint string the caller passed.

### 2. Add the `/api/internal/validate-and-charge` route

```js
// tensorfeed-api/src/worker.js (or wherever the route table lives)

// In the route dispatcher:
case 'internal/validate-and-charge':
  return await handleInternalValidateAndCharge(request, env);

// Handler:
async function handleInternalValidateAndCharge(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST only' }, 405);
  }
  const auth = request.headers.get('X-Internal-Auth') || '';
  if (!auth || auth !== env.SHARED_INTERNAL_SECRET) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'bad_json' }, 400);
  }
  const { token, cost, endpoint } = body || {};
  if (!token || typeof cost !== 'number' || cost < 0) {
    return jsonResponse({ error: 'bad_request' }, 400);
  }
  // Reuse the existing helper — no behavior change relative to in-process callers.
  const result = await validateAndCharge(env, { token, cost, endpoint: endpoint || 'tf:unknown' });
  return jsonResponse(result, 200);
}
```

CORS is intentionally NOT added on this endpoint. It is server-to-server only. Browser-side calls should never reach it.

### 3. Set the shared secret

```sh
# On the tensorfeed-api Worker (where this code lives):
npx wrangler secret put SHARED_INTERNAL_SECRET
# Paste the SAME value that is set on terminalfeed-api.
# Evan: the value we generated and set on terminalfeed-api is:
#   sis_8c4f2a91b7e6d503fa12e8b9c4d7f0a23b56e1f8c290d4a76b81e35f7c2a90db
# Use the same string here.
```

After this, `npx wrangler secret list` on tensorfeed-api should show `SHARED_INTERNAL_SECRET` alongside the existing secrets.

### 4. Verification

Once deployed, Evan can run from any shell:

```sh
# Wrong auth — should return 401, no body parsing
curl -sS -o /dev/null -w "%{http_code}\n" -X POST https://tensorfeed.ai/api/internal/validate-and-charge \
  -H "X-Internal-Auth: wrong" -d '{}'
# Expect: 401

# Correct auth, fake token — should return 200 with ok:false
curl -sS -X POST https://tensorfeed.ai/api/internal/validate-and-charge \
  -H "X-Internal-Auth: sis_8c4f2a91b7e6d503fa12e8b9c4d7f0a23b56e1f8c290d4a76b81e35f7c2a90db" \
  -H "Content-Type: application/json" \
  -d '{"token":"tf_live_<HEX64-placeholder>","cost":1,"endpoint":"tf:/api/pro/macro"}'
# Expect: {"ok": false, "reason": "invalid_token"}

# After buying real credits via /api/payment/buy-credits + /api/payment/confirm,
# call with the real token:
curl -sS -X POST https://tensorfeed.ai/api/internal/validate-and-charge \
  -H "X-Internal-Auth: sis_..." \
  -H "Content-Type: application/json" \
  -d '{"token":"tf_live_<real-token>","cost":1,"endpoint":"tf:/api/pro/briefing"}'
# Expect: {"ok": true, "credits_remaining": 49}
```

Then on TerminalFeed:

```sh
curl -sS https://terminalfeed.io/api/pro/macro -H "Authorization: Bearer tf_live_<real-token>"
# Expect: real macro payload, X-Credits-Remaining header
```

If both pass, the cross-site contract is live and TerminalFeed's premium tier is fully integrated.

### 5. Rollout plan

1. Refactor existing in-process validate logic into a shared helper. Single commit.
2. Add `/api/internal/validate-and-charge` route + handler. Single commit.
3. `wrangler secret put SHARED_INTERNAL_SECRET` (same value as on terminalfeed-api). No commit.
4. `npx wrangler deploy`.
5. Run the three verification curl calls above.
6. Paste the result back to Evan so the TerminalFeed-side launch can proceed.

Total: 2 commits, 1 deploy, ~15-30 minutes of work.

---

## What this spec does NOT cover

- Any public-facing endpoint. `/api/internal/*` is server-to-server only.
- Any change to `/api/payment/*`. Those are working and live.
- Any change to TensorFeed premium endpoints. They keep using the in-process helper directly.
- Token rotation, revocation, or refund mechanics. Existing behavior unchanged.
- Per-caller usage analytics or rate limits on the internal endpoint. Add later if abuse becomes a concern.

---

## Note to CC

1. **Do not break `/api/payment/*`.** Those are how agents buy credits. They are working today and a TerminalFeed live test depends on them.
2. **Do not expose the new endpoint via `/llms.txt`, `/openapi.json`, the public 404 endpoint listing, or any docs page.** It is internal.
3. **The 401 path must NOT leak whether the endpoint exists.** Return 401 with a generic body before any body parsing, JSON validation, or token lookup. Constant-time comparison of the secret would be ideal but a strict equality check is acceptable for v1.
4. **The existing validate-and-charge helper must not change behavior** relative to its current in-process callers. The new handler is a thin HTTP wrapper, nothing more. If you find yourself rewriting credit logic, stop — that is out of scope.
5. **No CORS on `/api/internal/*`.** Server-to-server only.
6. **Worker secrets via `wrangler secret put` only.** Never commit `SHARED_INTERNAL_SECRET`.
