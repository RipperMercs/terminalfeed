# CC Spec: Back-End Hardening & API Route Migration

**Date:** April 17, 2026
**Priority:** CRITICAL > HIGH > MEDIUM
**Author:** Cowork (spec only — CC executes all changes)
**Scope:** Back-end only. No visual / UI changes in this round. Visual refresh comes separately once the Claude Design feature rolls out.

---

## Executive Summary

A live network audit of `terminalfeed.io` (conducted April 17, 2026) revealed the site is making 50+ direct browser-to-external-API calls, bypassing the Cloudflare Worker entirely. This violates CLAUDE.md rule #6 ("Every API route through the Worker") and has caused:

1. **Finnhub API key exposed in public URLs** (token `d6qig99r01qhcrmkbj4gd6qig99r01qhcrmkbj50` visible in every stock quote request). Anyone viewing the network tab can steal it and burn the paid quota.
2. **CoinGecko direct calls returning 503** (rate-limited because every visitor hits the shared IP pool).
3. **15+ status page APIs hit directly**, several 503'ing (Cloudflare, Anthropic, Slack, Stripe, Zoom).
4. **BTC hero panel showing STALE + static fallback** ($75,475) while `/api/btc-price` responds in 150ms with live data ($77,407). The Worker is healthy; the front-end hook is not falling back to the HTTP endpoint when the Binance WebSocket fails.
5. **21 panels stuck on "loading..."** indefinitely — violates CLAUDE.md rule #9 (self-healing panels).

This spec executes only back-end and data-layer fixes. Zero visual changes.

---

## Audit Results (April 17, 2026 - live network capture)

### ✅ Working Worker endpoints (200 OK, acceptable latency)
```
/api/gas             200  (cache hit)
/api/ai-stats        200
/api/predictions     200
/api/steam           200
/api/humans-in-space 200
/api/meme-radar      200
/api/btc-price       200  (150ms, real live data)
```

### ❌ Direct browser calls that MUST be moved to Worker

**Finnhub stock quotes (22 direct calls, API key exposed):**
```
finnhub.io/api/v1/quote?symbol=SPY&token=d6qig99r01...
finnhub.io/api/v1/quote?symbol=QQQ&token=...
...and 20 more symbols
```

**CoinGecko (6 direct calls, all 503'ing):**
```
api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1       503
api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin                503
api.coingecko.com/api/v3/coins/markets?...order=market_cap_desc&per_page=30       503
api.coingecko.com/api/v3/coins/markets?...ids=pax-gold,tether-gold                503
api.coingecko.com/api/v3/global                                                   503
```

**Status pages (15 direct calls, 5 failing):**
```
status.anthropic.com/api/v2/status.json     503
status.slack.com/api/v2.0.0/current         503
status.stripe.com/api/v2/status.json        503
status.zoom.us/api/v2/status.json           503
www.cloudflarestatus.com/api/v2/status.json 503 (intermittent)
```

**Other direct external calls:**
```
mempool.space/api/v1/...          (6 calls, 200 OK but still direct)
api.artic.edu/api/v1/artworks     200
zenquotes.io/api/random           503
opensky-network.org/api/states    503
db.ygoprodeck.com/api/...         200
dog.ceo/api/breeds/image/random   200
```

### Panels currently stuck on "loading..."
```
market-hours, reddit, github, ai-leaderboard, disasters, gh-events,
books, forex, hn-community, wikipedia, producthunt, nasa-apod,
good-news, trending-movies, npm-trends, museum-art, daily-paws,
humans-in-space, this-day, originals, cloud-status
```

### Panels showing STALE / "Checking..." stuck state
```
bitcoin      (shows static fallback $75,475 while /api/btc-price returns $77,407)
dev-status   (Anthropic, Slack, Stripe, Zoom stuck on "Checking...")
cloud-status (likely same root cause)
```

---

## 1. [CRITICAL] Rotate Finnhub API key & route all stock quotes through Worker

**The most urgent item. Every page view is leaking the paid API key in the URL.**

### Step 1a: Rotate the key

1. Log in to finnhub.io → revoke the old key `d6qig99r01qhcrmkbj4gd6qig99r01qhcrmkbj50`
2. Generate a new key
3. Store in Worker secrets:
   ```bash
   cd worker-additions
   npx wrangler secret put FINNHUB_API_KEY
   # paste new key when prompted
   ```

### Step 1b: Verify Worker `/api/stocks` supports batch quotes

Check `worker-additions/worker.js` for the current `/api/stocks` handler. It should accept a comma-separated symbol list:
```
/api/stocks?symbols=SPY,QQQ,AAPL,MSFT,...
```

If it currently only returns a fixed top-N list, extend it to accept a `symbols` query param. Parse, dedupe, limit to 30, call Finnhub server-side with the stored secret, return:
```json
{
  "quotes": {
    "SPY": { "price": 710.14, "change": 1.21, "prevClose": 702.04 },
    "QQQ": { "price": 648.85, "change": 1.31, "prevClose": 640.47 },
    ...
  },
  "ts": 1745947800000
}
```

Cache with 30-second TTL per symbol-set. Return stale on upstream failure. 8-second timeout.

### Step 1c: Replace all front-end Finnhub calls

Search for direct Finnhub references:
```bash
grep -rn "finnhub.io" src/
grep -rn "FINNHUB" src/
```

Every match must be replaced with a call to `/api/stocks?symbols=...`. Likely offenders (based on the ticker running 22 direct calls): the top ticker component and the Markets panel.

### Step 1d: Verify in browser

After deploy, reload terminalfeed.io and confirm:
- No `finnhub.io` requests appear in DevTools Network tab
- Stock prices still populate correctly
- The stale/rotated key `d6qig99...bj50` is no longer anywhere in the built bundle:
  ```bash
  grep -rn "d6qig99r01qhcrmkbj" dist/ public/
  # must return zero matches
  ```

---

## 2. [CRITICAL] Route all CoinGecko calls through Worker

CoinGecko's free tier is 10-30 calls/min per IP. Every visitor making 6 direct calls means they hit the rate limit within seconds, hence the 503s.

### Step 2a: Add Worker endpoints

Add to `worker-additions/worker.js`:

```
/api/coingecko/markets       → proxies /coins/markets (top 30)
/api/coingecko/global        → proxies /global
/api/coingecko/btc-chart     → proxies /coins/bitcoin/market_chart?days=1
/api/coingecko/gold          → proxies /coins/markets?ids=pax-gold,tether-gold
```

Each endpoint:
- 60-second cache TTL (CoinGecko data does not move that fast)
- 8-second timeout on upstream
- Return cached-stale on upstream failure
- CORS `Access-Control-Allow-Origin: *` header

### Step 2b: Replace front-end CoinGecko calls

```bash
grep -rn "api.coingecko.com" src/
```

Replace every match with the corresponding `/api/coingecko/*` endpoint.

---

## 3. [HIGH] Consolidate status page checks through /api/service-status

The Worker should already have `/api/service-status`. Verify it covers all 15 services the front-end is calling directly. If any are missing (Datadog is called directly; add it), extend the Worker handler.

### Step 3a: Worker extension

`/api/service-status` returns:
```json
{
  "services": [
    { "name": "GitHub",     "status": "operational", "indicator": "none" },
    { "name": "Cloudflare", "status": "minor",       "indicator": "minor" },
    { "name": "Anthropic",  "status": "operational", "indicator": "none" },
    ...
  ],
  "ts": 1745947800000
}
```

Cache TTL: 2 minutes. 5-second timeout per upstream service. If an upstream fails, mark that service as `status: "unknown"` rather than failing the whole response.

### Step 3b: Front-end cleanup

Search for any direct status page fetches:
```bash
grep -rn "status.openai.com\|status.anthropic.com\|status.slack.com\|cloudflarestatus\|githubstatus\|vercel-status\|redditstatus\|zoom.us\|status.claude.com\|status.stripe.com\|status.datadoghq.com\|status.atlassian.com\|discordstatus\|npmjs.org" src/
```

Replace all with a single `/api/service-status` call. The Dev/Ops Status panel and Cloud Status panel should share the same data source.

---

## 4. [HIGH] Fix BTC hero panel static-fallback bug

**Symptom:** `/api/btc-price` returns $77,407 in 150ms, but the BTC panel shows $75,475 with "STALE / Unable to connect to live feeds" label.

**Root cause (suspected):** `useBtcPrice.ts` opens a WebSocket to `wss://stream.binance.com:9443/ws/btcusdt@trade` directly from the browser. That connection is being blocked (ad blocker, corporate network, or Binance blocking the origin). When the WS fails, the hook falls back to its hard-coded static value instead of polling `/api/btc-price`.

### Step 4a: Verify hook logic

Read `src/hooks/useBtcPrice.ts`. Locate the failure fallback path.

### Step 4b: Add HTTP fallback chain

New fallback order on WS failure:
1. Try WebSocket to Binance (existing behavior)
2. If WS fails within 3 seconds or errors, poll `GET /api/btc-price` every 2 seconds
3. Only as a last resort (both fail), use the static approximation with the STALE badge

```ts
// Pseudocode for the fallback
useEffect(() => {
  let wsFailed = false;
  const wsTimeout = setTimeout(() => { wsFailed = true; startPolling(); }, 3000);
  
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
  ws.onopen = () => { clearTimeout(wsTimeout); };
  ws.onmessage = (e) => { /* parse tick, update state */ };
  ws.onerror = ws.onclose = () => { if (!wsFailed) { wsFailed = true; startPolling(); } };
  
  const startPolling = () => {
    const poll = async () => {
      try {
        const res = await fetch('/api/btc-price');
        const { data } = await res.json();
        setPriceData({
          price: data.price_usd,
          changePercent24h: data.change_24h_percent,
          high24h: data.high_24h,
          low24h: data.low_24h,
          volume24h: data.volume_24h,
        });
      } catch {}
    };
    poll();
    pollIntervalRef.current = setInterval(poll, 2000);
  };
  
  return () => {
    clearTimeout(wsTimeout);
    ws.close();
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };
}, []);
```

### Step 4c: Faster-than-WS latency (optional, nice-to-have)

For a true real-time ticker without trusting the browser WebSocket, set up a Cloudflare Worker WebSocket proxy:
- Worker opens a single WebSocket to Binance
- Broadcasts ticks to all connected clients via Durable Object
- Browsers connect to `wss://terminalfeed.io/api/btc-stream` instead of Binance directly
- Bypasses ad blockers, survives corporate networks, and still ~150ms latency

This is a larger change and can ship separately after the HTTP fallback is in. Tracked as future work.

### Step 4d: Reduce polling interval to 1-2s for near-real-time feel

Once HTTP fallback is solid, change `/api/btc-price` cache TTL to 2 seconds (from whatever it is now) and poll from the browser every 2 seconds. That gives a near-real-time ticker without needing the WebSocket at all.

---

## 5. [HIGH] Self-healing timeout on every data hook

**Problem:** 21 panels are stuck on "loading..." forever because their hooks never resolve and never time out.

### Pattern for every data-fetching hook

Every `useXxx.ts` hook that starts in a loading state must:
1. Set an 8-second timer when the fetch begins
2. If the fetch has not resolved within 8 seconds, set state to `null` / empty
3. The corresponding panel must render `null` (hide) when data is null/empty, NOT render "loading..."

### CC implementation

For each hook file in `src/hooks/`:
```ts
const [data, setData] = useState<Foo | null>(null);
const [loaded, setLoaded] = useState(false);

useEffect(() => {
  let cancelled = false;
  const timeout = setTimeout(() => {
    if (!cancelled && !loaded) setLoaded(true); // gives up, data stays null
  }, 8000);
  
  fetch('/api/foo')
    .then(r => r.json())
    .then(d => { if (!cancelled) { setData(d); setLoaded(true); } })
    .catch(() => { if (!cancelled) setLoaded(true); });
  
  return () => { cancelled = true; clearTimeout(timeout); };
}, []);

return { data, loaded };
```

Panel component:
```tsx
const { data, loaded } = useFoo();
if (!loaded) return null;  // hide until first load OR timeout
if (!data) return null;    // hide permanently if no data
return <div data-panel-id="foo">...</div>;
```

**Do NOT render a "loading..." text state.** Either the panel is ready or it is hidden.

### Priority hooks to fix (based on April 17 audit)

```
useMarketHours, useReddit, useGithubTrending, useAiLeaderboard,
useDisasters, useGhEvents, useBooks, useForex, useHnCommunity,
useWikipedia, useProductHunt, useNasaApod, useGoodNews,
useTrendingMovies, useNpmTrends, useMuseumArt, useDailyPaws,
useHumansInSpace, useThisDay, useOriginals, useCloudStatus
```

---

## 6. [MEDIUM] Route all remaining external APIs through Worker

Per CLAUDE.md rule #6. Currently direct-called:

```
mempool.space/api/v1/*         → add /api/mempool/* Worker routes (cache 10s)
api.artic.edu/api/v1/artworks  → /api/museum-art (cache 6 hours)
zenquotes.io/api/random        → /api/quotes (cache 15 min)
opensky-network.org/api/states → /api/flights (cache 30s, 8s timeout, hide panel on timeout)
db.ygoprodeck.com/api/*        → /api/tcg (cache 1 hour)
dog.ceo/api/breeds/...         → /api/daily-paws (cache 1 hour)
api.nasa.gov/planetary/apod    → /api/nasa-apod (cache 1 hour)
```

Each new endpoint: 8-second upstream timeout, stale-cache-on-failure, CORS enabled, reasonable TTL.

### Search to find all remaining direct calls

```bash
grep -rn "fetch('http\|fetch(\"http" src/ --include="*.ts" --include="*.tsx"
```

Every match that is NOT already a `terminalfeed.io/api/*` URL needs to move to the Worker.

---

## 7. [MEDIUM] Ensure bitcoin panel static fallback only triggers after HTTP fallback fails

Currently the BTC panel shows the STALE badge + "Unable to connect to live feeds" message whenever the WS is not connected. This is misleading when the HTTP fallback is working perfectly.

### Fix

Only show STALE when BOTH the WebSocket AND `/api/btc-price` polling have failed in the last 30 seconds. If HTTP polling is succeeding, the panel should look normal (no STALE badge) and just not have a real-time pulse dot.

---

## 8. [MEDIUM] Rate limit the top ticker

The top scrolling ticker is calling Finnhub for 22 symbols on every page load. That's 22 calls per visitor. On 350 daily visits that is 7,700 calls/day, roughly half of Finnhub's free tier quota.

Once routed through the Worker:
- Single Worker cache entry for the whole ticker batch
- Single upstream call per 30-second cache window, regardless of traffic
- Visitors share the cached response → 2,880 upstream calls/day max regardless of visitor count

This is a natural byproduct of fix #1 but worth calling out as a monitoring item.

---

## 9. [LOW] Add API latency logging to the Worker

Add a simple in-memory ring buffer to the Worker that logs the latency of each upstream call. Expose at:

```
GET /api/metrics
```

Returns:
```json
{
  "endpoints": {
    "/api/btc-price":      { "p50_ms": 120, "p95_ms": 350, "error_rate": 0.01 },
    "/api/stocks":         { "p50_ms": 200, "p95_ms": 600, "error_rate": 0.02 },
    "/api/coingecko/markets": { ... },
    ...
  },
  "ts": 1745947800000
}
```

Useful for spotting degradation before users see it. No UI needed yet — raw JSON is fine.

---

## 10. [LOW] Consider Server-Sent Events for feed panels

Several panels poll constantly (Reddit, GitHub trending, Wikipedia, etc). Consider replacing with SSE streams where the upstream supports it (Wikipedia already does via Wikimedia stream). This reduces load and improves perceived latency. Not urgent — only do after everything above is stable.

---

## Execution Order (for CC)

Do each as a separate commit. Test after each. Never batch.

1. **Rotate Finnhub key + move stocks to Worker** (section 1) — ship ASAP, security issue
2. **CoinGecko proxy** (section 2) — fixes all the 503s in the crypto panels
3. **Consolidate status checks** (section 3) — fixes Anthropic/Slack/Stripe/Zoom "Checking..." and cloud-status panel
4. **BTC HTTP fallback** (section 4, parts a-b) — fixes the hero panel stale state
5. **Self-healing timeouts on all hooks** (section 5) — fixes the 21 "loading..." panels
6. **Remaining external API migrations** (section 6) — mempool, artic, zenquotes, opensky, ygoprodeck, dog, nasa
7. **BTC STALE badge logic fix** (section 7) — cosmetic-ish, nice polish
8. **Faster BTC polling** (section 4c-d) — real-time ticker
9. **Worker latency metrics endpoint** (section 9)
10. **Server-Sent Events** (section 10) — last

---

## Verification Checklist (run after sections 1-5)

Reload terminalfeed.io with DevTools Network tab open, filter for XHR/Fetch:

- [ ] Zero requests to `finnhub.io` (all should be `/api/stocks`)
- [ ] Zero requests to `api.coingecko.com` (all should be `/api/coingecko/*`)
- [ ] Zero requests to third-party `status.*` domains (all should be `/api/service-status`)
- [ ] No 503 responses from any origin
- [ ] BTC panel shows live price matching Crypto panel (no STALE badge when HTTP works)
- [ ] Zero panels showing "loading..." 10 seconds after page load — they should be populated OR hidden
- [ ] Dev/Ops Status panel has no "Checking..." entries — each service shows operational/minor/outage/unknown
- [ ] Bundle scan: `grep -rn "d6qig99r01qhcrmkbj" dist/` returns nothing

---

## What this spec does NOT cover

- Visual / UI changes — held until Claude Design feature rolls out
- New panels or features — this is strictly a cleanup pass
- Documentation / blog work — separate track
- AdSense work — separate track

---

## Note to CC

The CLAUDE.md infrastructure protection rules are non-negotiable:
- DO NOT add `@cloudflare/vite-plugin` to this project under any circumstances
- DO NOT add a root-level `wrangler.jsonc` / `wrangler.toml` / `wrangler.json`
- DO NOT add `wrangler deploy` or `wrangler dev` as npm scripts
- Worker deploys via `cd worker-additions && npx wrangler deploy`
- Pages deploys via `git push` to master only

One change at a time. Test after every change. Commit after every change.
