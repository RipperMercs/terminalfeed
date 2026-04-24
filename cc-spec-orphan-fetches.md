# CC Spec — Orphan Direct-Fetch Cleanup (Rule #6 Enforcement)

**Date:** April 22, 2026
**Priority:** MEDIUM (cleanup of the same class of bug that caused the April 17, 2026 Finnhub key leak)
**Scope:** Route the last four direct-browser-to-external-API fetches through the Worker per `CLAUDE.md` rule #6. Close the loop on the backend hardening audit so the pre-deploy `verify-deploy.js` check can go blocking for direct `fetch('http` calls in `src/`.

---

## Executive Summary

The April 17 backend hardening spec cleaned up ~50 direct browser-to-external-API calls, including the Finnhub key leak. Four orphans were missed and are still fetching external services directly from the browser:

1. **DailyPaws** panel
2. **FooterQuote** component
3. **SolarWeather** panel
4. **TrendingMovies** panel

Each violation means: (a) CORS headers are the external service's problem, not ours, so outages hit users directly; (b) any API key embedded in the URL is exposed on every page load; (c) we can't cache, throttle, or fail over; (d) the rule #6 pre-deploy lint cannot go blocking until these are clean.

**This spec routes all four through the Worker with in-memory caching, CORS, and fallback behavior matching the rest of `/api/*`.**

---

## Sections

### 1. Inventory the four orphans

Before touching anything, confirm exactly what each component currently fetches. CC should grep:

```
grep -rn "fetch('http" src/ --include="*.tsx" --include="*.ts"
grep -rn "fetch(\"http" src/ --include="*.tsx" --include="*.ts"
grep -rn "axios.get" src/ --include="*.tsx" --include="*.ts"
grep -rn "XMLHttpRequest" src/ --include="*.tsx" --include="*.ts"
```

Expected matches inside: `DailyPawsPanel.tsx`, `FooterQuote.tsx`, `SolarWeatherPanel.tsx` (or similar name), `TrendingMoviesPanel.tsx` (or similar).

For each hit, record: the exact external URL, any API key embedded in the URL or headers, the polling cadence, and the data shape the component expects back. Save to `/tmp/orphan-fetches-inventory.txt`. This becomes the authoritative map for Sections 2-5.

If any of the four components no longer exists in the registry (removed in a prior cleanup), skip it and note in the commit message.

### 2. Add Worker routes

For each orphan, add a handler in `worker-additions/src/routes/`. Shared pattern, matching the existing `/api/*` routes:

- Path prefix: `/api/{slug}` where slug is `paws`, `quotes`, `solar`, `movies` (or whatever is clearest — flag for Evan if unsure).
- In-memory cache with per-endpoint TTL. Suggested TTLs:
  - `/api/paws` — 30 minutes (images rotate slowly, high cache value)
  - `/api/quotes` — 24 hours (quote pool is small, refresh rarely)
  - `/api/solar` — 5 minutes (space weather changes on the hour)
  - `/api/movies` — 60 minutes (trending shifts slowly)
- 8-second timeout on the external call.
- Return stale cache on failure. Never return 5xx to client.
- `Access-Control-Allow-Origin: *` on all responses.
- If any external service requires an API key, store via `wrangler secret put {NAME}` — do NOT commit keys.

Commit: `feat: add /api/paws /api/quotes /api/solar /api/movies Worker routes`.

Deploy Worker first: `npx wrangler deploy` from `worker-additions/`. Verify each endpoint returns 200 with real data before touching the frontend.

### 3. Update frontend components

One commit per component, in this order:

1. **DailyPaws** — replace the direct fetch with a call to `/api/paws`. Preserve the existing data-shape mapping; the Worker returns the same structure the component already parses.
2. **FooterQuote** — same pattern for `/api/quotes`.
3. **SolarWeather** — same pattern for `/api/solar`.
4. **TrendingMovies** — same pattern for `/api/movies`.

For each component:
- Update the fetch URL from the external origin to `/api/{slug}`.
- Confirm null-safe defaults on every rendered field (per rule #1 and the April 15 learning).
- Confirm the panel has an `ErrorBoundary` wrapper.
- Visual smoke test: panel still renders, no crashes, data displays as before.

Commit per component: `refactor: route {component} through /api/{slug} Worker (rule #6)`.

### 4. Extend the pre-deploy lint

`scripts/verify-deploy.js` (or wherever the pre-deploy grep lives) already checks for `fetch('http` in `src/`. After all four components are clean, flip the lint from warning to blocking for this check.

If the lint script doesn't yet have the `fetch('http` guard, add it:

```js
// rule #6 guard: no direct external fetches from src/
const directFetches = execSync(
  "grep -rnP \"fetch\\(['\\\"]https?://\" src/ --include='*.ts' --include='*.tsx' || true",
  { encoding: 'utf8' }
);
if (directFetches.trim()) {
  console.error('[verify-deploy] rule #6 violation: direct external fetch in src/');
  console.error(directFetches);
  process.exit(1);
}
```

Exception list: the BTC price hook legitimately opens a direct WebSocket to Binance (`wss://stream.binance.com`). WebSockets are out of the scope of this lint; only `fetch('http` / `fetch("http` patterns are caught by the grep above. If any other legitimate direct WebSocket or fetch exists and is known-safe, whitelist by adding an inline comment like `// rule-6-exempt: direct Binance WS` that the lint script grep-excludes.

Commit: `feat: block deploys on direct external fetches in src/ (rule #6)`.

### 5. Verify

After deploy:

- [ ] `curl https://terminalfeed.io/api/paws` returns 200 with image URL(s)
- [ ] `curl https://terminalfeed.io/api/quotes` returns 200 with a quote object
- [ ] `curl https://terminalfeed.io/api/solar` returns 200 with space weather data
- [ ] `curl https://terminalfeed.io/api/movies` returns 200 with trending titles
- [ ] `grep -rnP "fetch\(['\"]https?://" src/` returns zero matches (or only whitelisted exemptions)
- [ ] All four affected panels render live data on the dashboard
- [ ] Bundle hash flipped
- [ ] No console errors referencing CORS or failed direct fetches
- [ ] Network tab shows only `/api/*` requests, no third-party origins for these panels

---

## Execution Order

1. Section 1 — Inventory. No commit.
2. Section 2 — Worker routes. Single commit. Deploy Worker first.
3. Section 3 — Frontend component swaps. Four commits, one per component. Deploy via git push.
4. Section 4 — Blocking lint. Single commit.
5. Section 5 — Verify. No commit unless fixes needed.

Total: 6 commits. Worker deploy required before the four frontend commits. No dashboard-level risk since each panel already has an ErrorBoundary (if not, add one as part of the refactor).

---

## What this spec does NOT cover

- Panels introduced after this spec is written. Any new panel must go through `/api/*` from day one.
- WebSocket connections (Binance BTC, Wikimedia SSE). Different pattern, not targeted by this cleanup.
- Auth token management for any of the four services if they require keys (CC handles per-service during Section 2 execution using `wrangler secret put`).
- Blog or tool pages. Scope is `src/` components only.

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** Frontend commits must maintain ErrorBoundary on every modified panel. Null-safe defaults on every field.
2. **Worker first, frontend second.** Do not ship a component that calls `/api/paws` before the Worker route exists.
3. **Never embed API keys in URLs or frontend code.** Keys belong in `wrangler secret put` only.
4. **One commit per component.** No batching the four frontend swaps into one commit.
5. **Match existing `/api/*` patterns.** TTLs, stale-cache-on-failure, CORS headers, 8-second timeout. Do not invent new patterns.
6. **After this spec lands, the `fetch('http` lint goes blocking.** Any future PR that introduces a direct external fetch from `src/` fails the build.
7. **No em dashes** in any new Worker response strings, error messages, or component UI copy.
8. **If any external service rate-limits** the Worker origin, cache harder and stale-return. Never 503 the client.
9. **Incident reference:** April 17, 2026 Finnhub leak was caused by exactly this pattern. This spec closes the last four instances.
