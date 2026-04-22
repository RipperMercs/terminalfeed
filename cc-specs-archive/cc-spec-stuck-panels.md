# CC Spec — Stuck Loading Panels + Remaining Direct API Calls

**Date:** April 20, 2026
**Priority:** CRITICAL
**Scope:** Finish what `cc-spec-backend-hardening.md` Section 5 was supposed to ship, plus clean up the direct external API calls the previous spec didn't cover.

---

## Executive Summary

Post-deploy live audit of `terminalfeed.io` (bundle `index-C0VlnuGo.js`) confirms:

- ✅ **Finnhub key** `d6qig99r01qhcrmkbj4gd6qig99r01qhcrmkbj50` is gone from the bundle.
- ✅ **CoinGecko proxy** working — all calls go through `/api/coingecko/*`.
- ✅ **Status page proxies** working — `/api/service-status`, `/api/claude-status`, `/api/cloud-status` all Worker-routed.
- ✅ **BTC hero panel** live and ticking (title flipping every ~1s as expected).
- ✅ **PanelErrorBoundary** present in bundle.
- ❌ **42 panels still stuck on "loading..."** — Section 5 of the previous spec did NOT deploy. Bundle regex check:
  - `/loadingTimeout|LOADING_TIMEOUT|hideIfNotLoaded|useLoadingTimeout|stuckTimeout/i` → **false** (no timeout hook exists)
- ❌ **Several high-frequency direct external API calls** still bypass the Worker (rule #6 violation), including 50+ direct HN Firebase calls per page load.

This spec finishes the job.

---

## Stuck Panels — The Full List

Audit at 2026-04-20 identified these 42 `data-panel-id` elements rendering only `"loading..."` indefinitely:

```
market-hours, seismic, reddit, github, ai-leaderboard, stackoverflow, weather,
podcasts, launches, bluesky, internet-pulse, uap, recipe, daily-learn, gas,
tech-news, live-now, seismic-timeline, claude-status, cloud-status, predictions,
tcg-market, steam, ai-hub, the-wire, wiki-live, disasters, gh-events, books,
forex, hn-community, wikipedia, producthunt, nasa-apod, good-news,
trending-movies, npm-trends, museum-art, daily-paws, humans-in-space,
this-day, originals
```

**Critical observation (April 20, 2026 live audit):** The data layer is healthy. Direct in-browser probes confirmed:

- `/api/predictions` → 200, returns `{ data: [...] }` with Polymarket entries
- `/api/gas` → 200, returns `{ low, standard, fast, baseFee, lastBlock, ts }`
- `/blog-latest.json` → 200, returns `{ updated, articles: [...] }`
- `earthquake.usgs.gov/...2.5_day.geojson` → 200, 64 earthquake features

**The data arrives. The panels do not render it.** The root cause is a React render bug, not an API problem. Likely suspects in priority order:

1. **Shared render bug in the base panel component.** A common `<PanelShell>` or `useBackendData` hook is returning `loading: true` indefinitely, OR the child render never commits. All 42 stuck panels have identical `innerHTML_len: 174` and a single `<div>loading...</div>` child, suggesting they're all wedged at the same placeholder layer.
2. **IntersectionObserver gate is broken.** Bundle contains `IntersectionObserver` usage and `Suspense`, but no `content-visibility` CSS and no `React.lazy`. If the observer fires but the "mount real panel" path throws silently, the fallback stays forever. Observed behavior: scrolling a stuck panel into viewport does NOT unstick it — so even IO intersection isn't helping.
3. **Hooks that throw silently** after first render and leave `loading` on.
4. **Unimplemented hooks** for panels added to the registry without real data hooks (`uap`, `recipe`, `daily-learn`, `internet-pulse`, `live-now`, `seismic-timeline`, `tcg-market`, `good-news`, `trending-movies`).

**CC must root-cause #1 first.** The `useLoadingTimeout` in Section 1 is a safety net so stuck panels hide after 10 s instead of wedging visitor eyes on `loading...` indefinitely — but it is NOT a fix for the underlying bug. CC needs to:

1. Find the shared panel shell / data hook (likely in `src/components/PanelShell.tsx`, `src/hooks/useBackendData.ts`, or equivalent).
2. Log state transitions in dev mode (`console.log('[panel:seismic] state=', state)`) to confirm whether the hook never sets `loading: false`, or sets it but the parent doesn't re-render.
3. Fix the render path so panels flip to `loaded` when data arrives.
4. THEN add `useLoadingTimeout` as the defense-in-depth safety net.

---

## Sections

### 0. Root-cause the render bug BEFORE adding the safety net

Add a dev-mode instrumentation commit (do NOT ship to production — feature-flag it behind `?debug=1` URL param):

```ts
// src/hooks/useBackendData.ts (or wherever the shared panel hook lives)
if (new URLSearchParams(location.search).has('debug')) {
  console.log(`[${panelId}] state=`, { loading, hasData: !!data, error });
}
```

Evan then loads `https://terminalfeed.io/?debug=1` in Cowork, the browser console shows one of:

- Hook never logs `loading: false` → state transition bug inside the hook (fetch succeeded but `setLoading(false)` never called). Fix: audit the hook's `useEffect`.
- Hook logs `loading: false, hasData: true` but panel still shows "loading..." → parent component isn't re-rendering when the hook returns new state. Fix: check memoization / reference equality.
- Hook throws uncaught exception → wrap in try/catch and surface via `error` state.

**Commit this first.** Without knowing the actual mode, any fix is a guess. Revert the debug log in the commit AFTER the real fix ships.

### 1. `useLoadingTimeout` hook — the safety net

**File:** `src/hooks/useLoadingTimeout.ts` (new)

```ts
import { useEffect, useState, useRef } from 'react';

/**
 * Returns `shouldHide: true` after `timeoutMs` if `hasData` never flips to true.
 * Used by every panel to self-heal when a hook is stuck on the loading state.
 *
 * Usage:
 *   const { data, loading } = useSomeData();
 *   const shouldHide = useLoadingTimeout(!!data, 10000);
 *   if (shouldHide) return null;
 */
export function useLoadingTimeout(hasData: boolean, timeoutMs = 10000): boolean {
  const [shouldHide, setShouldHide] = useState(false);
  const hasDataRef = useRef(hasData);
  hasDataRef.current = hasData;

  useEffect(() => {
    if (hasData) return;
    const t = setTimeout(() => {
      if (!hasDataRef.current) setShouldHide(true);
    }, timeoutMs);
    return () => clearTimeout(t);
  }, [hasData, timeoutMs]);

  // Reset if data ever arrives later
  useEffect(() => {
    if (hasData && shouldHide) setShouldHide(false);
  }, [hasData, shouldHide]);

  return shouldHide;
}
```

**Apply to every panel component.** Pattern:

```tsx
function SomePanel() {
  const { data, loading } = useSomeData();
  const shouldHide = useLoadingTimeout(!!data && !loading, 10000);
  if (shouldHide) return null;
  if (loading && !data) return <LoadingPlaceholder />;
  return <div className="panel">{/* render data */}</div>;
}
```

**Timeout values by panel type:**
- API-backed panels (most): `10000` (10 s)
- Slow/flaky panels (Flight Radar, OpenSky, Frankfurter forex): `8000` (8 s)
- WebSocket/SSE panels (Wikipedia live edits, BTC WS): `15000` (15 s) — WS handshake can be slow
- "Cosmetic" panels that should rarely fail (cats, pokemon, recipe): `12000` (12 s)

### 2. Kill the generic "loading..." placeholder for unimplemented panels

Some of the 42 stuck panels look like they were added to the registry but never had hooks implemented (`uap`, `recipe`, `daily-learn`, `internet-pulse`, `live-now`, `seismic-timeline`, `tcg-market`, `good-news`, `trending-movies`). Audit these:

- If the hook doesn't exist in `src/hooks/`, REMOVE the panel from `panelRegistry` in `App.tsx` and `defaultLayout.ts`.
- Bump layout version in `useLayoutManager.ts` to force cache refresh.
- Commit with message: `chore: remove unimplemented panels that never rendered`.

### 3. Proxy HackerNews through the Worker

**Why:** Audit showed 50+ direct calls to `hacker-news.firebaseio.com` per page load. HN Firebase is public but (a) violates rule #6, (b) slow DNS, (c) no shared caching across visitors.

**Worker route:** `/api/hn-items?ids=47834213,47822940,...`

```ts
// worker: batch fetch HN items with 60s cache
const ids = (url.searchParams.get('ids') || '').split(',').slice(0, 30);
const items = await Promise.all(ids.map(id =>
  cacheOrFetch(`hn:${id}`, 60, () =>
    fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
  )
));
return json(items);
```

Replace all `fetch('https://hacker-news.firebaseio.com/v0/item/${id}.json')` calls in `useHackerNews.ts` and `useHnCommunity.ts` with `/api/hn-items?ids=...`.

Also proxy `/api/hn-top`, `/api/hn-show`, `/api/hn-ask` for the three top-lists (already showing 3 direct calls in audit).

### 4. Proxy api.rss2json.com through the Worker

**Why:** Audit showed 20+ calls to `api.rss2json.com` (Reddit, podcasts, news RSS). This is a third-party service — if they go down or rate-limit, the whole site feed section breaks. Proxy it.

**Worker route:** `/api/rss?url=<encoded-feed-url>`

- TTL: 300 s (RSS feeds change slowly)
- Whitelist the allowed feed URLs (Reddit subs, podcasts, verge, techcrunch, etc.) — do NOT accept arbitrary URLs.
- Cache key: hash of the URL.

Replace all `api.rss2json.com` callers with `/api/rss?url=...`.

### 5. Proxy GitHub API calls

**Why:** `api.github.com/search/repositories` and `api.github.com/events` are rate-limited to 60 req/hour unauthenticated. One Cloudflare Worker call shared across all visitors >> every visitor hitting GitHub directly.

**Worker routes:**
- `/api/gh-trending?since=2026-04-14` (60s cache, 300s stale-while-revalidate)
- `/api/gh-events` (30s cache)

Add a `GITHUB_TOKEN` secret to the Worker (unauthenticated rate limit → 5000/hr authenticated).

### 6. Proxy ESPN sports tickers

**Why:** 6 direct ESPN calls per load (NBA/NHL/MLB scoreboard + 3 summaries). Proxy for cache + consistency.

**Worker route:** `/api/sports?league=nba|nhl|mlb&endpoint=scoreboard|summary&event=...`

TTL: 30 s during live games, 300 s otherwise. Simple.

### 7. Proxy Frankfurter forex (currently 503)

**Why:** `api.frankfurter.app/latest?from=USD` returned 503 in the audit. Existing `/api/forex` endpoint is listed in CLAUDE.md but the `forex` panel is hitting the upstream directly. Switch the panel hook to `/api/forex`.

### 8. Kill the rogue DynamoDB calls

**Suspicious finding:** Audit showed 4 direct calls from the browser to:
- `dynamodb.us-east-1.amazonaws.com`
- `dynamodb.us-west-2.amazonaws.com`
- `dynamodb.eu-west-1.amazonaws.com`
- `dynamodb.ap-northeast-1.amazonaws.com`

These return 200 but are almost certainly a latency probe from the `internet-pulse` panel. **AWS DynamoDB endpoints accept anonymous requests** and return 200 with an XML error body — which is fine for a ping, but exposes the user's IP to AWS.

Action: audit `useInternetPulse.ts` and replace AWS-region probes with either:
- Cloudflare's own edge regions (`https://<colo>.cloudflare.com/cdn-cgi/trace`), or
- A new `/api/latency-probe` Worker route that the client pings (Worker measures its own edge-to-origin latency).

### 9. Kill the DNS probe 503s

- `dns.google/resolve` — 503
- `dns.quad9.net:5053/dns-query` — 503
- `doh.opendns.com/dns-query` — 503
- `google.com/generate_204` — 503

These all look like they come from a connectivity/DNS health panel (probably `internet-pulse`). DoH providers return 503 when they detect bot traffic. Remove these probes or route them through the Worker with proper headers.

### 10. Finnhub key rotation (Evan's action, not CC's)

Once Sections 1–9 are verified in a re-audit, Evan revokes the old key:

1. Go to https://finnhub.io/dashboard
2. Revoke `d6qig99r01qhcrmkbj4gd6qig99r01qhcrmkbj50`
3. Confirm `/api/stocks` still returns data using the new key stored as `FINNHUB_API_KEY` Worker secret.

**Do NOT do this until the bundle re-scan is clean.** If any visitor is mid-session on a stale cached bundle, their stock ticker will break.

---

## Execution Order

1. **Section 0** (debug instrumentation + root-cause of render bug) — ship first, use to diagnose, then push the actual fix in the same section. Single commit for instrumentation, second commit for the fix, third commit to remove debug logs.
2. **Section 1** (`useLoadingTimeout` hook) — defense-in-depth, after Section 0 fix lands.
3. **Section 2** (audit + remove unimplemented panels).
3. **Section 3** (HN Worker proxy) — Worker first, then frontend.
4. **Section 4** (rss2json proxy) — Worker first, then frontend.
5. **Section 5** (GitHub proxy) — Worker first (with `GITHUB_TOKEN` secret), then frontend.
6. **Section 6** (ESPN proxy) — Worker first, then frontend.
7. **Section 7** (Frankfurter — switch `forex` panel hook to `/api/forex`) — one-line commit.
8. **Section 8** (DynamoDB — kill or reroute AWS probes).
9. **Section 9** (DNS 503s — kill or proxy).
10. **Section 10** — tell Evan it's safe to rotate the Finnhub key.

Each section = one commit. Do not batch.

---

## Verification Checklist

After every section ships, Evan runs this audit in Cowork:

- [ ] Bundle hash in `<script src="/assets/index-*.js">` changed
- [ ] Zero rendered `"loading..."` placeholders after 15-second wait
- [ ] `fetch('/assets/index-*.js').then(r=>r.text()).then(t=>/useLoadingTimeout/.test(t))` → `true`
- [ ] Zero direct `hacker-news.firebaseio.com` calls in network tab
- [ ] Zero direct `api.rss2json.com` calls in network tab
- [ ] Zero direct `api.github.com` calls in network tab
- [ ] Zero direct `site.api.espn.com` calls in network tab
- [ ] Zero direct `dynamodb.*.amazonaws.com` calls in network tab
- [ ] Zero 503 responses in network tab
- [ ] BTC hero still showing live price with `▲` or `▼` in tab title, ticking every ~1 s

---

## What this spec does NOT cover

- New panel additions or deprecations (ETH Gas visualization tweaks, `/api/meme-radar` deprecation — those are in `cc-spec-new-panels.md`).
- Related Articles / Related Tools blog component (in `related-content-component-spec.md`).
- Dashboard visual redesign via Claude Design (separate track, pending rollout).
- New features or UI changes. This is exclusively cleanup of what the last spec missed + finishing rule #6 enforcement.

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** A single panel must never take down the dashboard. Every panel needs its own `ErrorBoundary`.
2. **NEVER add `@cloudflare/vite-plugin`** to the project. That converts Pages to Workers and destroyed the site on April 15.
3. **NEVER add `wrangler.jsonc` or `wrangler.toml` to the project root.** Only allowed inside `worker-additions/`.
4. **NEVER add `wrangler deploy` or `wrangler dev` as npm scripts.** Pages deploys via git push (or `wrangler pages deploy dist` if the webhook is dead).
5. **Deploy order: Worker first, frontend second.** Never deploy a frontend panel that calls a Worker route that doesn't exist yet.
6. **All external APIs through `/api/*` Worker.** This spec exists because rule 6 was violated in dozens of places.
7. **Null-safe defaults on every API field** (`value ?? fallback` before calling `.toFixed()`, `.toUpperCase()`, etc.).
8. **One commit per section.** No batching.
9. **Verify the Pages project exists before deploying:** `npx wrangler pages project list` must show `terminalfeed`.
10. **No em dashes in any user-facing text.**

Previous incident: April 17 audit revealed Finnhub key leak; `cc-spec-backend-hardening.md` was supposed to fix everything; CC reported all 5 sections shipped; post-deploy audit on April 20 confirmed Sections 1–4 DID ship but Section 5 (`useLoadingTimeout`) DID NOT, despite CC's report. This spec exists because of that. Please verify with a browser-level check (regex in bundle + DOM count of `"loading..."` placeholders) BEFORE reporting completion this time.
