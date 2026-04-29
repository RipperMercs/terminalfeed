# CC Spec: Funding Rates (Free + Premium) + Panel

**Date:** 2026-04-29 (rev 2)
**Priority:** MEDIUM
**Owner:** Ripper
**Estimated commits:** 6

---

## Executive Summary

- Add a freemium pair of endpoints. `/api/funding-rates` (free, 60s cache, top 20 movers, powers the dashboard panel) and `/api/pro/funding-rates` (2 credits, 5min cache, full per-venue arrays + aggregates + cross-venue divergence flags).
- Both endpoints share the same 4 venue fetchers: Binance USD-M perps, Bybit linear, dYdX v4, Hyperliquid. All free at source, no API keys, no env vars.
- Frontend dashboard panel `Funding Rates` consumes the FREE endpoint. The premium version is for agents and downstream tooling that want depth.
- Edits target `worker-additions/worker.js` (the canonical Worker). Do NOT edit `worker-additions/terminalfeed-api/`, that subfolder is orphaned.
- Premium handler MUST wrap in `handlePremium(...)` and register an MCP tool case (`tf_premium_funding_rates`). Never hand-roll auth/billing.

This is rev 2 of an earlier spec that targeted a free-only endpoint and the wrong worker file. Rev 2 corrects both.

---

## Section 1: Shared venue fetchers (used by free + pro)

**File:** `worker-additions/worker.js`

Add the 4 fetcher functions in the premium-fetchers section (search for `async function fetchProStablecoinFlows` for the placement convention, put these adjacent). Each returns an array of normalized rows or throws.

Normalized row shape:
```
{ venue, symbol, periodHours, periodRate, annualizedPct, nextFundingTime, markPrice }
```

```js
async function fetchBinanceFunding() {
  var res = await fetchWithTimeout('https://fapi.binance.com/fapi/v1/premiumIndex', {}, 8000);
  if (!res.ok) throw new Error('binance ' + res.status);
  var arr = await res.json();
  if (!Array.isArray(arr)) return [];
  var periodHours = 8;
  var periodsPerYear = (365 * 24) / periodHours;
  return arr
    .filter(function(r) { return typeof r.symbol === 'string' && r.symbol.endsWith('USDT'); })
    .map(function(r) {
      var periodRate = parseFloat(r.lastFundingRate) || 0;
      return {
        venue: 'binance',
        symbol: r.symbol,
        periodHours: periodHours,
        periodRate: periodRate,
        annualizedPct: periodRate * periodsPerYear * 100,
        nextFundingTime: Number(r.nextFundingTime) || null,
        markPrice: parseFloat(r.markPrice) || null,
      };
    });
}

async function fetchBybitFunding() {
  var res = await fetchWithTimeout('https://api.bybit.com/v5/market/tickers?category=linear', {}, 8000);
  if (!res.ok) throw new Error('bybit ' + res.status);
  var json = await res.json();
  var list = json && json.result && json.result.list;
  if (!Array.isArray(list)) return [];
  var periodHours = 8;
  var periodsPerYear = (365 * 24) / periodHours;
  return list
    .filter(function(r) { return typeof r.symbol === 'string' && r.symbol.endsWith('USDT'); })
    .map(function(r) {
      var periodRate = parseFloat(r.fundingRate) || 0;
      return {
        venue: 'bybit',
        symbol: r.symbol,
        periodHours: periodHours,
        periodRate: periodRate,
        annualizedPct: periodRate * periodsPerYear * 100,
        nextFundingTime: Number(r.nextFundingTime) || null,
        markPrice: parseFloat(r.markPrice) || null,
      };
    });
}

async function fetchDydxFunding() {
  var res = await fetchWithTimeout('https://indexer.dydx.trade/v4/perpetualMarkets', {}, 8000);
  if (!res.ok) throw new Error('dydx ' + res.status);
  var json = await res.json();
  var markets = json && json.markets;
  if (!markets || typeof markets !== 'object') return [];
  // dYdX v4 funding is computed per 1h block on-chain
  var periodHours = 1;
  var periodsPerYear = (365 * 24) / periodHours;
  return Object.values(markets)
    .filter(function(m) { return m && typeof m.ticker === 'string'; })
    .map(function(m) {
      var periodRate = parseFloat(m.nextFundingRate) || 0;
      return {
        venue: 'dydx',
        symbol: m.ticker,
        periodHours: periodHours,
        periodRate: periodRate,
        annualizedPct: periodRate * periodsPerYear * 100,
        nextFundingTime: null,
        markPrice: parseFloat(m.oraclePrice) || null,
      };
    });
}

async function fetchHyperliquidFunding() {
  var res = await fetchWithTimeout('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
  }, 8000);
  if (!res.ok) throw new Error('hyperliquid ' + res.status);
  var json = await res.json();
  if (!Array.isArray(json) || json.length < 2) return [];
  var universe = json[0] && json[0].universe;
  var ctxs = json[1];
  if (!Array.isArray(universe) || !Array.isArray(ctxs)) return [];
  var periodHours = 1;
  var periodsPerYear = (365 * 24) / periodHours;
  return universe.map(function(u, i) {
    var ctx = ctxs[i] || {};
    var periodRate = parseFloat(ctx.funding) || 0;
    return {
      venue: 'hyperliquid',
      symbol: ((u && u.name) || '') + '-PERP',
      periodHours: periodHours,
      periodRate: periodRate,
      annualizedPct: periodRate * periodsPerYear * 100,
      nextFundingTime: null,
      markPrice: parseFloat(ctx.markPx) || null,
    };
  }).filter(function(r) { return r.symbol !== '-PERP'; });
}
```

Notes:
- All 4 venues are free, no auth.
- Use `Promise.allSettled` at the call site, not in the fetchers themselves. Fetchers should throw on failure so the caller can record a per-source error in `_meta`.

---

## Section 2: Free endpoint `/api/funding-rates`

**File:** `worker-additions/worker.js`

### 2a. Cache TTL

Add to the `CACHE_TTL` map (search for existing TTL block near the free-endpoint cache section):
```js
'funding-rates': 60000,
```

### 2b. Route case

Add to the free `/api/*` switch statement, alongside `crypto-movers` and friends:
```js
case 'funding-rates':
  return await handleFundingRates();
```

### 2c. Handler

```js
async function handleFundingRates() {
  var cached = getCached('funding-rates');
  if (cached) return jsonResponse(cached);

  var settled = await Promise.allSettled([
    fetchBinanceFunding(),
    fetchBybitFunding(),
    fetchDydxFunding(),
    fetchHyperliquidFunding(),
  ]);
  var venueNames = ['binance', 'bybit', 'dydx', 'hyperliquid'];

  var flat = [];
  var failed = [];
  settled.forEach(function(r, i) {
    if (r.status === 'fulfilled') flat = flat.concat(r.value);
    else failed.push(venueNames[i]);
  });

  var top = flat
    .filter(function(r) { return Number.isFinite(r.annualizedPct); })
    .sort(function(a, b) { return Math.abs(b.annualizedPct) - Math.abs(a.annualizedPct); })
    .slice(0, 20);

  var result = {
    source: 'terminalfeed.io',
    endpoint: 'funding-rates',
    updated_at: new Date().toISOString(),
    data: { top: top, failed_venues: failed },
  };
  if (top.length > 0) setCache('funding-rates', result);
  return jsonResponse(result);
}
```

### 2d. handleIndex listing

Add to the `endpoints` object inside `handleIndex()`:
```js
'/api/funding-rates': 'Top 20 perp funding rates across Binance, Bybit, dYdX, Hyperliquid',
```

---

## Section 3: Premium endpoint `/api/pro/funding-rates`

**File:** `worker-additions/worker.js`

### 3a. Fetcher (the work)

Place adjacent to the venue fetchers from Section 1.

```js
// Returns the full premium response. Must be called via handlePremium().
async function fetchProFundingRates(env, url) {
  var sourceMeta = [
    { name: 'binance.fapi', start: Date.now() },
    { name: 'bybit.linear', start: Date.now() },
    { name: 'dydx.indexer', start: Date.now() },
    { name: 'hyperliquid.info', start: Date.now() },
  ];
  var settled = await Promise.allSettled([
    fetchBinanceFunding(),
    fetchBybitFunding(),
    fetchDydxFunding(),
    fetchHyperliquidFunding(),
  ]);
  var venueNames = ['binance', 'bybit', 'dydx', 'hyperliquid'];

  var byVenue = {};
  venueNames.forEach(function(v, i) {
    byVenue[v] = settled[i].status === 'fulfilled' ? settled[i].value : [];
  });

  // Per-venue aggregates
  function _aggForVenue(rows) {
    if (!rows.length) return { count: 0, avg_annualized_pct: null, max_long_pay: null, max_short_pay: null, inverted_count: 0 };
    var avg = rows.reduce(function(s, r) { return s + (r.annualizedPct || 0); }, 0) / rows.length;
    var sorted = rows.slice().sort(function(a, b) { return b.annualizedPct - a.annualizedPct; });
    var inverted = rows.filter(function(r) { return r.annualizedPct < 0; }).length;
    return {
      count: rows.length,
      avg_annualized_pct: parseFloat(avg.toFixed(4)),
      max_long_pay: sorted[0] || null,            // longs paying the most (highest positive)
      max_short_pay: sorted[sorted.length - 1] || null, // shorts paying the most (most negative)
      inverted_count: inverted,
    };
  }
  var aggregates = {};
  venueNames.forEach(function(v) { aggregates[v] = _aggForVenue(byVenue[v]); });

  // Cross-venue divergence: same base symbol with funding rate sign disagreement >50 bps annualized
  var bySymbol = {};
  Object.keys(byVenue).forEach(function(v) {
    byVenue[v].forEach(function(r) {
      var base = r.symbol.replace(/USDT$|-PERP$/, '');
      if (!bySymbol[base]) bySymbol[base] = [];
      bySymbol[base].push(r);
    });
  });
  var divergences = [];
  Object.keys(bySymbol).forEach(function(base) {
    var rows = bySymbol[base];
    if (rows.length < 2) return;
    var max = Math.max.apply(null, rows.map(function(r) { return r.annualizedPct; }));
    var min = Math.min.apply(null, rows.map(function(r) { return r.annualizedPct; }));
    if (max - min >= 50) {
      divergences.push({ symbol: base, spread_pct: parseFloat((max - min).toFixed(4)), rows: rows });
    }
  });
  divergences.sort(function(a, b) { return b.spread_pct - a.spread_pct; });

  return {
    source: 'terminalfeed-pro',
    endpoint: '/api/pro/funding-rates',
    generated_at: new Date().toISOString(),
    venues: byVenue,
    aggregates: aggregates,
    divergences: divergences.slice(0, 30),
    notes: {
      source_attribution: 'Binance USD-M perps (fapi.binance.com), Bybit linear (api.bybit.com), dYdX v4 (indexer.dydx.trade), Hyperliquid (api.hyperliquid.xyz). All free public endpoints.',
      cache_ttl: '5 minutes. Funding rates change once per period (1h on dYdX/Hyperliquid, 8h on Binance/Bybit).',
      use_case: 'Funding-rate arbitrage screening, sentiment proxy (extreme positive funding = leveraged longs paying), cross-venue dislocation detection.',
      caveat: 'periodHours and periodRate are venue-native. annualizedPct is the cross-venue comparable. Mark prices are per-venue and may differ slightly from spot.',
    },
    _meta: _premiumMeta('/api/pro/funding-rates', _buildSourcesMeta(settled, sourceMeta)),
  };
}
```

### 3b. Handler wrapper

Place near other `handleProX` handlers (search `handleProStablecoinFlows` for placement).

```js
async function handleProFundingRates(request, env, url) {
  return handlePremium(request, env, url, '/api/pro/funding-rates', 2, async function(env2, url2) {
    var KEY = 'pro:funding-rates';
    return await cacheLookupOrFetch(KEY, 300000, function() { return fetchProFundingRates(env2, url2); });
  });
}
```

### 3c. Pro router case

In the `/api/pro/<slug>` switch (search for `case 'pro/stablecoin-flows':`), add:
```js
case 'pro/funding-rates':   return await handleProFundingRates(request, env, url);
```

### 3d. Pricing manifest

Search for the array containing `{ path: '/api/pro/stablecoin-flows', cost_credits: 2 }`. Add a sibling entry:
```js
{ path: '/api/pro/funding-rates', cost_credits: 2 },
```

### 3e. MCP tool registration

Search for `tf_premium_stablecoin_flows`. Two switches need updating in the same file:

In the path/method mapper:
```js
case 'tf_premium_funding_rates':       path = '/api/pro/funding-rates'; break;
```

In the dispatcher:
```js
case 'tf_premium_funding_rates':       return await handleProFundingRates(req, env, url);
```

Confirm both insertions, the file has both blocks adjacent.

### 3f. MCP tool definition

Search for an existing MCP tool definition entry like `'/api/pro/stablecoin-flows'` in a tool-listing array (around line 3284 in current revision). Add a sibling:
```js
{
  name: 'tf_premium_funding_rates',
  description: 'Perp funding rates across Binance, Bybit, dYdX, and Hyperliquid with per-venue aggregates and cross-venue divergence flags. Costs 2 credits.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  url: 'https://terminalfeed.io/api/pro/funding-rates',
}
```
Match the exact shape of the surrounding entries; the example above is illustrative.

---

## Section 4: Frontend hook + panel (free endpoint only)

**File (new):** `src/hooks/useFundingRates.ts`

Mirror `src/hooks/useGasTracker.ts`:
- Hits `/api/funding-rates` (free, no auth)
- 60s polling desktop, 120s mobile
- 8s `AbortSignal.timeout`
- Pause polling on `visibilitychange` hidden
- Cleanup interval + listener in return
- Slice top 20 of `data.top`
- Null-safe defaults on every field consumed

```ts
export interface FundingRate {
  venue: 'binance' | 'bybit' | 'dydx' | 'hyperliquid';
  symbol: string;
  periodHours: number;
  periodRate: number;
  annualizedPct: number;
  nextFundingTime: number | null;
  markPrice: number | null;
}
```

When mapping the response:
```ts
const top = (json?.data?.top ?? []).slice(0, 20).map((r: any) => ({
  venue: r?.venue ?? 'binance',
  symbol: String(r?.symbol ?? ''),
  periodHours: Number(r?.periodHours) || 8,
  periodRate: Number(r?.periodRate) || 0,
  annualizedPct: Number(r?.annualizedPct) || 0,
  nextFundingTime: Number.isFinite(r?.nextFundingTime) ? r.nextFundingTime : null,
  markPrice: Number.isFinite(r?.markPrice) ? r.markPrice : null,
}));
```

**File (new):** `src/panels/FundingRatesPanel.tsx`

- `React.memo` wrapped
- Returns `null` if data is empty (rule #9, hide rather than error)
- Header: title `Funding Rates`, tag `PERPS`, stale indicator, `60s` refresh hint
- Rows: 12-15 max, each with venue badge, symbol (truncate 10), annualized rate (`+47.3% APR` green / `-12.1% APR` red), period hint (`8h` or `1h`) in dim text
- Footer: `<n> markets across <m> venues` plus a `Failed: <list>` line if any
- Venue badge colors using existing tokens, 0.15 alpha background:
  - binance: `var(--amber)`
  - bybit: `var(--teal)`
  - dydx: `var(--purple)`
  - hyperliquid: `var(--blue)`
- Every `.map()` callback uses `value ?? fallback` before any method call. Non-negotiable.

---

## Section 5: Register panel + bump layout version

**File:** `src/hooks/useLayoutManager.ts`

In `ALL_PANELS` (Row 2 alongside `crypto` and `markets`):
```ts
{ id: 'funding-rates', label: 'Funding Rates', defaultSpan: 1 },
```

Bump `CURRENT_VERSION` from `'42'` to `'43'`.

**File:** `src/App.tsx`

1. Import the hook and panel
2. Call the hook alongside other hooks
3. Add to the `panelHealth.reportData` block:
   ```tsx
   if (fundingRates && fundingRates.top.length > 0) panelHealth.reportData('funding-rates');
   ```
4. Add to the panel render map:
   ```tsx
   'funding-rates': <FundingRatesPanel data={fundingRates} layout={layout} panelHealth={panelHealth} getGridCols={getGridCols} />,
   ```
5. Confirm the panel sits inside the existing per-panel ErrorBoundary the App uses (mirror how GasPanel is wrapped).

---

## Section 6: Documentation

**File:** `public/llms.txt` — add a line for `/api/funding-rates` and another for `/api/pro/funding-rates`. Match the existing format.

**File:** `public/openapi.json` — add path entries for both endpoints. Mirror the schema of `/api/crypto-movers` (free) and `/api/pro/stablecoin-flows` (premium) for the response shapes.

**File:** `CLAUDE.md` — under `### API Endpoints Live`, add the free endpoint line. Under the `### Premium Tier` table, add the pro endpoint line at 2 cr.

---

## Execution Order

1. **Commit 1:** Section 1 (4 venue fetchers in canonical worker).
2. **Commit 2:** Section 2 (free endpoint + cache TTL + route case + handleIndex). Deploy worker. Verify with `curl https://terminalfeed.io/api/funding-rates | jq '.data.top | length'`.
3. **Commit 3:** Section 3 (pro fetcher + handler + pro router case + pricing manifest + MCP registration + MCP tool definition). Deploy worker. Verify with `curl -H "Authorization: Bearer tf_live_<test_token>" https://terminalfeed.io/api/pro/funding-rates | jq '.aggregates | keys'`.
4. **Commit 4:** Section 4 (`useFundingRates.ts` hook).
5. **Commit 5:** Section 4 cont (`FundingRatesPanel.tsx`).
6. **Commit 6:** Section 5 + 6 (register panel, bump version 42 to 43, wire App.tsx, update llms.txt + openapi.json + CLAUDE.md).

Worker first. Frontend after. Push to GitHub master after each frontend commit for Cloudflare Pages auto-deploy.

---

## Verification Checklist

- [ ] `curl https://terminalfeed.io/api/funding-rates` returns 200 with `data.top` populated, length up to 20.
- [ ] `data.failed_venues` lists only venues that actually failed (typically empty or 1).
- [ ] BTC perp annualized rate on Binance is in roughly -50% to +50% range. If you see millions or billions, the period normalization is wrong.
- [ ] `curl -H "Authorization: Bearer tf_live_<token>" https://terminalfeed.io/api/pro/funding-rates` returns 200 with `venues.binance`, `venues.bybit`, `venues.dydx`, `venues.hyperliquid` arrays, plus `aggregates` and `divergences`.
- [ ] Premium response includes a `_meta` envelope with per-source latencies, matching the shape of other pro endpoints.
- [ ] Calling the pro endpoint without a token returns the same 401 shape as other pro endpoints.
- [ ] Calling the pro endpoint with a token charges 2 credits (check `/api/payment/balance` before/after, or inspect the `X-Credits-Remaining` response header).
- [ ] MCP tool `tf_premium_funding_rates` is invocable via the agent-payments MCP server.
- [ ] Dashboard panel renders top 12-15 rows, color-coded green/red, venue badges, never crashes when a field is missing.
- [ ] Layout version 43 forces existing users to refresh and see the new panel.
- [ ] `grep -r "fapi.binance\|api.bybit\|dydx.trade\|hyperliquid.xyz" src/` returns zero matches (browser does not call venues directly).
- [ ] No em dashes anywhere in any file touched.

---

## Out of Scope

- Historical funding (would require D1/KV writes; separate spec).
- Per-venue subroutes like `/api/pro/funding-rates/binance` (filterable later via query params if there's demand).
- Frontend consumption of the pro endpoint (browser uses free; pro is for agents and downstream).
- Editing `worker-additions/terminalfeed-api/`. That subfolder is orphaned and must not be touched.
- WebSocket streaming. 5-minute pro cache is fine; funding rates change every 1h or 8h.
- A blog post or marketing copy. Editorial is separate.
- i18n translations for the panel label.
- Adding the panel to dashboard preset menus (Trader, Developer). Default visibility is enough.
- The other two TensorFeed CC ideas (`regulatory-pulse`, `onchain-flow-history`). Separate specs each.

---

## Note to CC (read before starting)

Restated because CC reads specs in fresh sessions without CLAUDE.md fully loaded.

**Worker file targeting:**
- The CANONICAL Worker is `worker-additions/worker.js` deployed via `worker-additions/wrangler.toml`. ALL edits in this spec target that file.
- Do NOT edit `worker-additions/terminalfeed-api/src/worker.js` or its `wrangler.jsonc`. That subfolder is an orphan; deploying it would clobber production.
- Deploy from `worker-additions/` with `npx wrangler deploy`, never from the orphan subfolder.

**Premium-tier discipline:**
- Pro endpoints MUST wrap in `handlePremium(request, env, url, '/api/pro/<slug>', costCredits, fetcher)`. Never hand-roll Bearer auth or credit decrement.
- Pro endpoints MUST register an MCP tool case (`tf_premium_<slug>`) in both the path/method mapper switch AND the dispatcher switch. Both are in the same worker.js.
- Pro endpoints MUST return a `_meta` envelope built via `_premiumMeta(...)` and `_buildSourcesMeta(...)`. Mirror existing pro endpoints exactly.

**Panel safety (April 15 incident):**
- Every field from an external API can be undefined or null. Use `value ?? fallback` BEFORE calling any method.
- Wrap the new panel in the per-panel ErrorBoundary App.tsx already uses.
- The Worker route MUST be deployed before the frontend panel is pushed.

**Infrastructure protection:**
- Do NOT add `@cloudflare/vite-plugin` to package.json.
- Do NOT add a root-level `wrangler.jsonc` or `wrangler.toml`. Wrangler config lives only in `worker-additions/`.
- Do NOT add `wrangler deploy` or `wrangler dev` as scripts in the root `package.json`. Pages deploys via git push.

**Style:**
- No em dashes anywhere. Not in code comments, not in UI text, not in this spec, not in commit messages. Use commas, periods, parentheses, or rewrite.
- No double hyphens (`--`) used as em-dash substitutes either.

**Workflow:**
- One commit per section. Test the site after each commit.
- Push to GitHub master after each commit so Cloudflare Pages auto-deploys.

---

End of spec.
