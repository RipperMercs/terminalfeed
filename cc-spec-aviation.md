# CC Spec: Aviation Status (Free + Premium) + Panel with Status Grid

**Date:** 2026-04-29
**Priority:** MEDIUM
**Owner:** Ripper
**Estimated commits:** 5

---

## Executive Summary

- Add `/api/aviation` (free, 5min cache, status of top 30 US airports with delay info, color-coded) and `/api/pro/aviation` (2 credits, 5min cache, full status table with weather conditions, ground-stop reasons, average/max delays, and aggregates).
- Source: FAA ASWS public API (soa.smext.faa.gov). One JSON call per airport. No auth. Loop top 30 in parallel.
- New `Aviation` panel with: a 6x5 grid of airport IATA codes using `StateChip` for color-coded status, a `CountUp` for "N airports delayed", and a top-5 "worst delays" list.
- Practical for travelers, useful for logistics agents, fills a gap (no aviation/transportation panel exists today).

---

## Section 1: Worker shared fetcher

**File:** `worker-additions/worker.js`

```js
var TOP_US_AIRPORTS = [
  'ATL', 'DFW', 'DEN', 'ORD', 'LAX',
  'JFK', 'LAS', 'MCO', 'MIA', 'CLT',
  'SEA', 'PHX', 'EWR', 'SFO', 'IAH',
  'BOS', 'FLL', 'MSP', 'LGA', 'DTW',
  'PHL', 'BWI', 'SLC', 'DCA', 'IAD',
  'SAN', 'MDW', 'TPA', 'BNA', 'AUS',
];

async function fetchFaaAirportStatus(iata) {
  // Returns null on failure rather than throwing, since one airport's outage shouldn't kill the whole call.
  try {
    var res = await fetchWithTimeout(
      'https://soa.smext.faa.gov/asws/api/airport/status/' + encodeURIComponent(iata),
      { headers: { 'Accept': 'application/json' } },
      6000
    );
    if (!res.ok) return null;
    var json = await res.json();
    if (!json) return null;
    return json;
  } catch (e) {
    return null;
  }
}

function _normalizeAirportStatus(iata, raw) {
  // FAA response shape (varies by airport state):
  // { ICAO, IATA, Name, City, State, Status: { Reason, Type, AvgDelay, MaxDelay, Trend, ClosureBegin, ClosureEnd, EndTime, MinDelay }, Weather: { Weather: [...], Visibility, Temp, Wind }, Delay: bool, DelayCount }
  if (!raw) {
    return {
      iata: iata,
      name: null,
      city: null,
      state: null,
      delay: null,                  // null = unknown
      status_type: null,
      reason: null,
      avg_delay_min: null,
      max_delay_min: null,
      trend: null,
      weather: null,
      severity: 'unknown',          // grid color band
    };
  }
  var st = raw.Status || {};
  var wx = raw.Weather || {};
  var weather = null;
  if (Array.isArray(wx.Weather) && wx.Weather.length > 0) {
    weather = String(wx.Weather[0]).slice(0, 60);
  }

  var avgDelay = _parseFaaDuration(st.AvgDelay);
  var maxDelay = _parseFaaDuration(st.MaxDelay);
  var delay = raw.Delay === true || raw.Delay === 'true';
  var statusType = st.Type || null;

  // Severity bucket for the status grid color
  var severity;
  if (statusType && /closure|ground stop|ground delay/i.test(statusType)) severity = 'major';
  else if (delay && (maxDelay >= 60 || avgDelay >= 30)) severity = 'major';
  else if (delay) severity = 'minor';
  else if (raw.IATA) severity = 'on_time';
  else severity = 'unknown';

  return {
    iata: raw.IATA || iata,
    name: raw.Name || null,
    city: raw.City || null,
    state: raw.State || null,
    delay: delay,
    status_type: statusType,
    reason: st.Reason || null,
    avg_delay_min: avgDelay,
    max_delay_min: maxDelay,
    trend: st.Trend || null,
    weather: weather,
    severity: severity,
  };
}

function _parseFaaDuration(s) {
  // FAA returns strings like "0 minutes", "1 hour and 15 minutes", "45 minutes". Return total minutes or null.
  if (!s || typeof s !== 'string') return null;
  var hours = 0, mins = 0;
  var hMatch = s.match(/(\d+)\s*hour/i);
  var mMatch = s.match(/(\d+)\s*minute/i);
  if (hMatch) hours = parseInt(hMatch[1], 10) || 0;
  if (mMatch) mins = parseInt(mMatch[1], 10) || 0;
  var total = hours * 60 + mins;
  return Number.isFinite(total) ? total : null;
}
```

---

## Section 2: Free endpoint `/api/aviation`

### 2a. Cache TTL
```js
'aviation': 300000,
```

### 2b. Route case
```js
case 'aviation':
  return await handleAviation();
```

### 2c. Handler
```js
async function handleAviation() {
  var cached = getCached('aviation');
  if (cached) return jsonResponse(cached);

  var raws = await Promise.all(TOP_US_AIRPORTS.map(function(c) { return fetchFaaAirportStatus(c); }));
  var statuses = TOP_US_AIRPORTS.map(function(c, i) { return _normalizeAirportStatus(c, raws[i]); });

  var delayed = statuses.filter(function(s) { return s.delay === true; });
  var worst = delayed.slice()
    .sort(function(a, b) {
      var aMax = a.max_delay_min || 0;
      var bMax = b.max_delay_min || 0;
      if (bMax !== aMax) return bMax - aMax;
      return (b.avg_delay_min || 0) - (a.avg_delay_min || 0);
    })
    .slice(0, 5)
    .map(function(s) {
      return {
        iata: s.iata,
        city: s.city,
        avg_delay_min: s.avg_delay_min,
        max_delay_min: s.max_delay_min,
        reason: s.reason,
        status_type: s.status_type,
      };
    });

  var result = {
    source: 'terminalfeed.io',
    endpoint: 'aviation',
    updated_at: new Date().toISOString(),
    data: {
      airports: statuses,                  // grid input, full set of 30
      delayed_count: delayed.length,
      worst: worst,
      attribution: 'FAA Airport Status Web Service (soa.smext.faa.gov)',
    },
  };
  if (statuses.some(function(s) { return s.severity !== 'unknown'; })) setCache('aviation', result);
  return jsonResponse(result);
}
```

### 2d. handleIndex listing
```js
'/api/aviation': 'FAA status for top 30 US airports (delays, ground stops, weather)',
```

---

## Section 3: Premium endpoint `/api/pro/aviation`

### 3a. Pro fetcher
```js
async function fetchProAviation(env, url) {
  var sourceMeta = [{ name: 'faa.asws', start: Date.now() }];
  var settled = await Promise.allSettled([
    Promise.all(TOP_US_AIRPORTS.map(function(c) { return fetchFaaAirportStatus(c); }))
  ]);
  var raws = settled[0].status === 'fulfilled' ? settled[0].value : [];
  var statuses = TOP_US_AIRPORTS.map(function(c, i) { return _normalizeAirportStatus(c, raws[i]); });

  var delayed = statuses.filter(function(s) { return s.delay === true; });
  var withClosures = statuses.filter(function(s) { return s.status_type && /closure|ground stop/i.test(s.status_type); });

  var avgOfDelays = delayed.length
    ? delayed.reduce(function(sum, s) { return sum + (s.avg_delay_min || 0); }, 0) / delayed.length
    : 0;

  // Reason breakdown
  var byReason = {};
  delayed.forEach(function(s) {
    var r = s.reason || 'unspecified';
    byReason[r] = (byReason[r] || 0) + 1;
  });

  return {
    source: 'terminalfeed-pro',
    endpoint: '/api/pro/aviation',
    generated_at: new Date().toISOString(),
    airports: statuses,
    aggregate: {
      total_tracked: statuses.length,
      on_time_count: statuses.filter(function(s) { return s.severity === 'on_time'; }).length,
      delayed_count: delayed.length,
      ground_stop_or_closure_count: withClosures.length,
      avg_delay_minutes_across_delayed: parseFloat(avgOfDelays.toFixed(1)),
      reason_breakdown: byReason,
    },
    notes: {
      source_attribution: 'FAA Airport Status Web Service (soa.smext.faa.gov/asws). Free public endpoint, one call per airport.',
      cache_ttl: '5 minutes. FAA updates statuses continuously; sub-5min cache hammers upstream without delivering fresher data downstream.',
      use_case: 'Logistics dashboards, traveler itinerary apps, news-room operations, AI-agent route planning.',
      caveat: 'FAA reports cover top US airports only. International airports and small regionals are not included. Some statuses (general arrival/departure) coexist; we surface the most operationally relevant single severity bucket.',
    },
    _meta: _premiumMeta('/api/pro/aviation', _buildSourcesMeta(settled, sourceMeta)),
  };
}
```

### 3b. Pro handler
```js
async function handleProAviation(request, env, url) {
  return handlePremium(request, env, url, '/api/pro/aviation', 2, async function(env2, url2) {
    var KEY = 'pro:aviation';
    return await cacheLookupOrFetch(KEY, 300000, function() { return fetchProAviation(env2, url2); });
  });
}
```

### 3c. Pro router case
```js
case 'pro/aviation':   return await handleProAviation(request, env, url);
```

### 3d. Pricing manifest
```js
{ path: '/api/pro/aviation', cost_credits: 2 },
```

### 3e. MCP tool registration
Path mapper:
```js
case 'tf_premium_aviation':       path = '/api/pro/aviation'; break;
```
Dispatcher:
```js
case 'tf_premium_aviation':       return await handleProAviation(req, env, url);
```

### 3f. MCP tool definition
```js
{
  name: 'tf_premium_aviation',
  description: 'FAA status for top 30 US airports with delay info, weather, ground-stop reasons, and aggregate breakdowns. Costs 2 credits.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  url: 'https://terminalfeed.io/api/pro/aviation',
}
```

---

## Section 4: Frontend hook + panel (with viz)

**File (new):** `src/hooks/useAviation.ts`

Polls `/api/aviation` every 5min desktop / 10min mobile. Visibility-aware. 8s timeout.

```ts
export type AirportSeverity = 'on_time' | 'minor' | 'major' | 'unknown';

export interface AirportStatus {
  iata: string;
  name: string | null;
  city: string | null;
  state: string | null;
  delay: boolean | null;
  statusType: string | null;
  reason: string | null;
  avgDelayMin: number | null;
  maxDelayMin: number | null;
  weather: string | null;
  severity: AirportSeverity;
}

export interface AviationData {
  airports: AirportStatus[];
  delayedCount: number;
  worst: Array<{
    iata: string;
    city: string | null;
    avgDelayMin: number | null;
    maxDelayMin: number | null;
    reason: string | null;
    statusType: string | null;
  }>;
}
```

**File (new):** `src/panels/AviationPanel.tsx`

Visual layout:

1. **Header**: title `Aviation`, tag `FAA`, stale indicator, `5m` refresh hint.

2. **Headline stat row**:
   - `CountUp` from `0` to `delayedCount`, label `delayed of 30 tracked`. Color: `var(--red)` if >=10, `var(--amber)` if >=3, `var(--green)` else.

3. **Status grid** (the visual centerpiece, 6 columns x 5 rows = 30 IATA codes):
   - Use the existing `StateChip` primitive for each airport.
   - Map severity to `StateChipKind` (look up the kind values in `src/primitives/StateChip.tsx`; common kinds are usually `ok`, `warn`, `error`, `idle` or similar):
     - `on_time` → ok-equivalent (green)
     - `minor` → warn-equivalent (amber)
     - `major` → error-equivalent (red)
     - `unknown` → idle-equivalent (dim grey)
   - Chip label: the IATA code (3 chars).
   - Chip tooltip / `title` attribute: `<city>, <state>: <reason or "on time">` for hover info on desktop.
   - Layout: CSS grid `grid-template-columns: repeat(6, 1fr); gap: 4px;`. Each chip is the natural StateChip size; if a custom width is needed, wrap in a div.
   - If `StateChip` does not accept a click/title prop, use a wrapping `<span title="...">` for hover.

4. **Worst delays list** (top 5):
   - Each row: `[IATA] · <city> · max <Nm> · avg <Nm> · <reason short>`.
   - Use `var(--red)` for IATA when severity is major, `var(--amber)` for minor.
   - If `worst.length === 0`, render a single line "No major delays" in `var(--green)`.

Footer: `Source: FAA Airport Status Web Service` in `var(--text-dim)` 9px.

**Critical rules:**
- `React.memo` wrapped.
- Returns `null` if `airports.length === 0`.
- Every field accessed in render uses `?? fallback` defaults.
- The `severity` value `'unknown'` means we couldn't reach FAA for that airport. Render the chip in idle/dim style and don't count it in the delayed total.

---

## Section 5: Register panel + bump layout version

**File:** `src/hooks/useLayoutManager.ts`

Add near `flight-radar` (the existing Flight Radar panel):
```ts
{ id: 'aviation', label: 'Aviation', defaultSpan: 1 },
```
Bump `CURRENT_VERSION` by 1 from current.

**File:** `src/App.tsx`

1. Import hook + panel.
2. Call hook.
3. `panelHealth.reportData('aviation')` when `aviation && aviation.airports.length > 0 && aviation.airports.some(a => a.severity !== 'unknown')`.
4. Add `'aviation': <AviationPanel data={aviation} ... />` to render map.
5. Wrap in per-panel ErrorBoundary.

**Files:** `public/llms.txt`, `public/openapi.json`, `CLAUDE.md` — add lines for both endpoints.

---

## Execution Order

1. Section 1 (fetcher + helpers).
2. Section 2 (free endpoint, deploy, verify with `curl https://terminalfeed.io/api/aviation | jq '.data.delayed_count'`).
3. Section 3 (pro endpoint + MCP, redeploy).
4. Section 4 (hook + panel with grid + CountUp).
5. Section 5 (register, version bump, docs).

---

## Verification Checklist

- [ ] `curl https://terminalfeed.io/api/aviation` returns 200 with `data.airports` length 30.
- [ ] At least 25 of the 30 airports have `severity` other than `'unknown'` (some FAA endpoints flap; complete failure of >5 indicates a problem).
- [ ] Status grid renders 30 chips in a 6x5 layout, color-coded.
- [ ] Hovering an airport chip shows the city + reason in a tooltip.
- [ ] Worst-delays list shows up to 5 items when there are real delays.
- [ ] `_parseFaaDuration("1 hour and 15 minutes")` returns 75; `_parseFaaDuration("45 minutes")` returns 45 (worth a sanity check during dev).
- [ ] Panel hides cleanly when `airports.length === 0`.
- [ ] No direct browser fetch to soa.smext.faa.gov.

---

## Out of Scope

- International airports (FAA covers US only; ICAO does not have a comparable free endpoint).
- Per-route delay (e.g., LAX-JFK specifically). FAA gives airport-level only.
- Historical delay archive.
- Push notifications for ground stops.
- Ad-hoc airport lookup by IATA query param (could ship later as `?iata=`).

---

## Note to CC

- Edit ONLY `worker-additions/worker.js`. Orphan subfolder is off-limits.
- 30 parallel FAA calls per cache miss is fine (5min cache means at most 12 burst-30 cycles per hour = 360 upstream calls; FAA has no documented rate limit but this is well within courteous use).
- Check the actual `StateChipKind` values exported from `src/primitives/StateChip.tsx` and map severity accordingly. Don't hard-code colors; use the chip's kind prop so the design system stays consistent.
- Pro endpoint via `handlePremium(...)` only.
- Null-safe defaults on every field consumed.
- No em dashes anywhere.
- Worker first, frontend second.

End of spec.
