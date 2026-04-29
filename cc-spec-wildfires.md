# CC Spec: Wildfires (Free + Premium) + Panel with Mini-Map

**Date:** 2026-04-29
**Priority:** MEDIUM
**Owner:** Ripper
**Estimated commits:** 6

---

## Executive Summary

- Add `/api/wildfires` (free, 10min cache, top 25 most intense active fire detections in North America over last 24h, plus hourly count buckets) and `/api/pro/wildfires` (2 credits, 10min cache, full detection list with state-level rollup, satellite breakdown, and 7-day daily trend if data is available).
- Source: NASA FIRMS (Fire Information for Resource Management System), VIIRS SNPP NRT product. **Requires a free map key** from https://firms.modaps.eosdis.nasa.gov/api/map_key/ (instant signup, no review).
- New `Wildfires` panel with: a custom SVG mini-map of North America with red dots scaled by fire intensity (FRP), a `CountUp` for active detections, a `Cascade` of latest-5 detections with state/FRP, and a `Sparkline` of hourly detection counts.
- Fills the natural-disaster cluster gap. Pairs with `/api/severe-weather` (when that ships) and existing `/api/disaster-alerts`.

---

## Section 0: New env var

Add to the canonical worker's wrangler config and document:
```
NASA_FIRMS_MAP_KEY = <free-key-from-firms-api>
```

Set via:
```
cd worker-additions
npx wrangler secret put NASA_FIRMS_MAP_KEY
```

The free tier allows up to 5000 transactions per 10-minute window, more than enough for our caching strategy.

---

## Section 1: Worker shared fetcher

**File:** `worker-additions/worker.js`

```js
async function fetchFirmsNorthAmerica(env) {
  var key = env && env.NASA_FIRMS_MAP_KEY;
  if (!key) throw new Error('firms-no-key');
  // VIIRS SNPP NRT, USA + Canada + Mexico bbox, last 1 day
  var url = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/'
          + encodeURIComponent(key)
          + '/VIIRS_SNPP_NRT/-170,15,-50,72/1';
  var res = await fetchWithTimeout(url, {}, 12000);
  if (!res.ok) throw new Error('firms ' + res.status);
  var csv = await res.text();
  return _parseFirmsCsv(csv);
}

function _parseFirmsCsv(csv) {
  // CSV header: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
  if (!csv || typeof csv !== 'string') return [];
  var lines = csv.split('\n');
  if (lines.length < 2) return [];
  var header = lines[0].split(',').map(function(h) { return h.trim(); });
  var idx = {};
  header.forEach(function(h, i) { idx[h] = i; });
  var out = [];
  for (var i = 1; i < lines.length; i++) {
    var parts = lines[i].split(',');
    if (parts.length < header.length) continue;
    var lat = parseFloat(parts[idx.latitude]);
    var lon = parseFloat(parts[idx.longitude]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    out.push({
      lat: lat,
      lon: lon,
      brightness_ti4: parseFloat(parts[idx.bright_ti4]) || null,
      brightness_ti5: parseFloat(parts[idx.bright_ti5]) || null,
      scan: parseFloat(parts[idx.scan]) || null,
      track: parseFloat(parts[idx.track]) || null,
      acq_date: parts[idx.acq_date],
      acq_time: parts[idx.acq_time],
      satellite: parts[idx.satellite],
      confidence: parts[idx.confidence],   // 'l' | 'n' | 'h' for VIIRS
      frp: parseFloat(parts[idx.frp]) || 0,  // Fire Radiative Power in MW
      daynight: parts[idx.daynight],
    });
  }
  return out;
}

// Crude state-from-coords lookup for top-N filtering display.
// Workers can't ship a full geocoding lib; we use bbox checks for the most fire-prone US states.
function _approximateUsState(lat, lon) {
  var BOXES = [
    { st: 'CA', n: 42.0, s: 32.5, w: -124.5, e: -114.1 },
    { st: 'OR', n: 46.3, s: 42.0, w: -124.6, e: -116.5 },
    { st: 'WA', n: 49.0, s: 45.5, w: -124.8, e: -117.0 },
    { st: 'NV', n: 42.0, s: 35.0, w: -120.0, e: -114.0 },
    { st: 'AZ', n: 37.0, s: 31.3, w: -114.8, e: -109.0 },
    { st: 'NM', n: 37.0, s: 31.3, w: -109.1, e: -103.0 },
    { st: 'UT', n: 42.0, s: 37.0, w: -114.1, e: -109.0 },
    { st: 'CO', n: 41.0, s: 37.0, w: -109.1, e: -102.0 },
    { st: 'WY', n: 45.0, s: 41.0, w: -111.1, e: -104.0 },
    { st: 'MT', n: 49.0, s: 44.4, w: -116.1, e: -104.0 },
    { st: 'ID', n: 49.0, s: 42.0, w: -117.3, e: -111.0 },
    { st: 'TX', n: 36.5, s: 25.8, w: -106.7, e: -93.5 },
    { st: 'OK', n: 37.0, s: 33.6, w: -103.0, e: -94.5 },
    { st: 'FL', n: 31.0, s: 24.5, w: -87.6, e: -80.0 },
  ];
  for (var i = 0; i < BOXES.length; i++) {
    var b = BOXES[i];
    if (lat <= b.n && lat >= b.s && lon >= b.w && lon <= b.e) return b.st;
  }
  if (lat > 49 && lat < 72) return 'CA-CAN';   // Canada (rough)
  if (lat > 14 && lat < 33 && lon > -118 && lon < -86) return 'MX';
  return 'OTHER';
}

function _hourlyBuckets(detections) {
  // Returns 24-element array of detection counts per hour bucket relative to now.
  var now = Date.now();
  var buckets = new Array(24).fill(0);
  detections.forEach(function(d) {
    if (!d.acq_date || !d.acq_time) return;
    var hh = String(d.acq_time).padStart(4, '0');
    var iso = d.acq_date + 'T' + hh.slice(0, 2) + ':' + hh.slice(2, 4) + ':00Z';
    var t = Date.parse(iso);
    if (!Number.isFinite(t)) return;
    var hoursAgo = Math.floor((now - t) / 3600000);
    if (hoursAgo >= 0 && hoursAgo < 24) buckets[23 - hoursAgo]++;
  });
  return buckets;
}
```

---

## Section 2: Free endpoint `/api/wildfires`

### 2a. Cache TTL
```js
'wildfires': 600000,
```

### 2b. Route case
```js
case 'wildfires':
  return await handleWildfires(env);
```

### 2c. Handler
```js
async function handleWildfires(env) {
  var cached = getCached('wildfires');
  if (cached) return jsonResponse(cached);

  var detections;
  try {
    detections = await fetchFirmsNorthAmerica(env);
  } catch (e) {
    var stale = cache['wildfires'];
    if (stale) return jsonResponse(stale.data);
    return jsonResponse({
      source: 'terminalfeed.io',
      endpoint: 'wildfires',
      updated_at: new Date().toISOString(),
      data: { top: [], total: 0, error: 'upstream_unavailable' },
    });
  }

  // Sort by FRP desc; top 25
  var top = detections
    .slice()
    .sort(function(a, b) { return (b.frp || 0) - (a.frp || 0); })
    .slice(0, 25)
    .map(function(d) {
      return {
        lat: d.lat,
        lon: d.lon,
        frp_mw: d.frp,
        confidence: d.confidence,
        acq_date: d.acq_date,
        acq_time: d.acq_time,
        approx_state: _approximateUsState(d.lat, d.lon),
        satellite: d.satellite,
      };
    });

  var hourly = _hourlyBuckets(detections);
  var result = {
    source: 'terminalfeed.io',
    endpoint: 'wildfires',
    updated_at: new Date().toISOString(),
    data: {
      total_24h: detections.length,
      top: top,
      hourly_counts_24h: hourly,
      attribution: 'NASA FIRMS (Fire Information for Resource Management System), VIIRS SNPP NRT',
    },
  };
  if (detections.length > 0) setCache('wildfires', result);
  return jsonResponse(result);
}
```

### 2d. handleIndex listing
```js
'/api/wildfires': 'NASA FIRMS active fire detections (North America 24h, top 25 by FRP)',
```

---

## Section 3: Premium endpoint `/api/pro/wildfires`

### 3a. Pro fetcher
```js
async function fetchProWildfires(env, url) {
  var sourceMeta = [{ name: 'firms.viirs_snpp_nrt', start: Date.now() }];
  var settled = await Promise.allSettled([fetchFirmsNorthAmerica(env)]);
  var detections = settled[0].status === 'fulfilled' ? settled[0].value : [];

  // State rollup
  var byState = {};
  detections.forEach(function(d) {
    var st = _approximateUsState(d.lat, d.lon);
    if (!byState[st]) byState[st] = { count: 0, total_frp_mw: 0 };
    byState[st].count++;
    byState[st].total_frp_mw += (d.frp || 0);
  });

  // Satellite breakdown
  var bySat = {};
  detections.forEach(function(d) {
    var s = d.satellite || 'unknown';
    bySat[s] = (bySat[s] || 0) + 1;
  });

  // Confidence breakdown (VIIRS uses l/n/h)
  var byConf = {};
  detections.forEach(function(d) {
    var c = d.confidence || 'unknown';
    byConf[c] = (byConf[c] || 0) + 1;
  });

  // Top hotspots clustered by 0.25-degree grid (about 25km buckets)
  var clusters = {};
  detections.forEach(function(d) {
    var gx = Math.round(d.lat * 4) / 4;
    var gy = Math.round(d.lon * 4) / 4;
    var key = gx + ',' + gy;
    if (!clusters[key]) clusters[key] = { lat: gx, lon: gy, count: 0, total_frp_mw: 0 };
    clusters[key].count++;
    clusters[key].total_frp_mw += (d.frp || 0);
  });
  var topClusters = Object.values(clusters)
    .sort(function(a, b) { return b.total_frp_mw - a.total_frp_mw; })
    .slice(0, 20)
    .map(function(c) {
      return {
        lat: c.lat,
        lon: c.lon,
        approx_state: _approximateUsState(c.lat, c.lon),
        detection_count: c.count,
        total_frp_mw: parseFloat(c.total_frp_mw.toFixed(2)),
      };
    });

  return {
    source: 'terminalfeed-pro',
    endpoint: '/api/pro/wildfires',
    generated_at: new Date().toISOString(),
    detections: detections.slice(0, 500),  // cap response size
    aggregates: {
      total_24h: detections.length,
      by_state: byState,
      by_satellite: bySat,
      by_confidence: byConf,
      hourly_counts_24h: _hourlyBuckets(detections),
    },
    top_hotspots: topClusters,
    notes: {
      source_attribution: 'NASA FIRMS (firms.modaps.eosdis.nasa.gov), VIIRS SNPP NRT product. Free with map key.',
      cache_ttl: '10 minutes. FIRMS NRT updates approximately every 30 minutes upstream.',
      use_case: 'Wildfire monitoring for insurance, supply chain (forestry/agriculture), AQI correlation, news, and AI-agent risk dashboards.',
      caveat: 'NRT detections may include false positives (gas flares, industrial heat sources). Confidence values l/n/h indicate low/nominal/high detection confidence.',
    },
    _meta: _premiumMeta('/api/pro/wildfires', _buildSourcesMeta(settled, sourceMeta)),
  };
}
```

### 3b. Pro handler
```js
async function handleProWildfires(request, env, url) {
  return handlePremium(request, env, url, '/api/pro/wildfires', 2, async function(env2, url2) {
    var KEY = 'pro:wildfires';
    return await cacheLookupOrFetch(KEY, 600000, function() { return fetchProWildfires(env2, url2); });
  });
}
```

### 3c. Pro router case
```js
case 'pro/wildfires':   return await handleProWildfires(request, env, url);
```

### 3d. Pricing manifest
```js
{ path: '/api/pro/wildfires', cost_credits: 2 },
```

### 3e. MCP tool registration
Path mapper:
```js
case 'tf_premium_wildfires':       path = '/api/pro/wildfires'; break;
```
Dispatcher:
```js
case 'tf_premium_wildfires':       return await handleProWildfires(req, env, url);
```

### 3f. MCP tool definition
```js
{
  name: 'tf_premium_wildfires',
  description: 'NASA FIRMS active fire detections in North America (24h) with state rollup, satellite/confidence breakdowns, and clustered hotspots. Costs 2 credits.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  url: 'https://terminalfeed.io/api/pro/wildfires',
}
```

---

## Section 4: Frontend hook + panel (with viz)

**File (new):** `src/hooks/useWildfires.ts`

Polls `/api/wildfires` every 10min desktop / 20min mobile. Visibility-aware. 8s timeout.

```ts
export interface FireDetection {
  lat: number;
  lon: number;
  frpMw: number;
  confidence: string;
  acqDate: string;
  acqTime: string;
  approxState: string;
  satellite: string;
}
export interface WildfiresData {
  total24h: number;
  top: FireDetection[];
  hourlyCounts24h: number[];   // length 24, oldest to newest
}
```

**File (new):** `src/panels/WildfiresPanel.tsx`

Visual layout (top to bottom):

1. **Header**: title `Wildfires`, tag `NASA FIRMS`, stale indicator, `10m` refresh hint.

2. **Headline stat row**: `CountUp` from `0` to `total24h` over 600ms, label "active in 24h". Use `var(--red)` color when > 200, else `var(--amber)`. Mirror the format used by other CountUp panels (search the codebase for `CountUp` usage examples).

3. **Mini-map of North America** (custom SVG, ~60-80px tall):
   - viewBox: `0 0 240 80`
   - Draw a simplified outline path (provided below) for US + Canada + Mexico landmass
   - Plot each `top` detection as a circle:
     - Project lat/lon to map space using `x = (lon + 170) / 120 * 240; y = (72 - lat) / 57 * 80;` (matching the bbox -170,15,-50,72 used in the worker)
     - Radius scaled by FRP: `r = Math.max(1.5, Math.min(5, Math.sqrt(frpMw) / 4))`
     - Fill: `var(--red)` with opacity `Math.min(0.9, 0.3 + frpMw / 100)`
     - No animation on dots (would jitter when polling).
   - Include the SVG path data inline. Keep it compact (a stylized landmass outline, not actual borders). Sample path:
     ```
     M 12 36 L 28 22 L 60 14 L 110 10 L 150 18 L 190 16 L 220 24 L 232 38 L 226 50 L 210 62 L 170 70 L 140 70 L 110 64 L 90 70 L 70 72 L 56 64 L 36 56 L 18 50 Z
     ```
     This is a stylized landmass blob suitable for "I see fires roughly where I expect them," not a geographic-accuracy map. Stroke `var(--text-dim)` 0.5, fill `rgba(48,48,52,0.4)`.
   - Above the map: tiny label "North America 24h" in `var(--text-dim)` 9px.

4. **Hourly trend Sparkline**: pass `hourlyCounts24h` to the existing `Sparkline` primitive. Width fills panel, height 24px. Color: `var(--amber)` for positive trend (last hour > first hour), else `var(--text-dim)`. Label below: `24h hourly detections`.

5. **Top detections list** (latest 5 by FRP, max 5 rows):
   - Use `Cascade` primitive with `CascadeEvent` shape (look up the type from `src/primitives/Cascade.tsx` or its index export).
   - Each event line: `[STATE] FRP NNN MW · conf-h/n/l · time-ago`
   - Color the FRP value: red if FRP >= 50, amber if >= 10, dim otherwise.

Footer: `Source: NASA FIRMS VIIRS SNPP NRT` in `var(--text-dim)` 9px.

**Critical rules:**
- Wrap panel in `React.memo`.
- Returns `null` if `total24h === 0` AND `top.length === 0`.
- Every field accessed in render uses `?? fallback` defaults.
- The mini-map circles should never throw if a detection has missing lat/lon; filter those out before mapping.

---

## Section 5: Register panel + bump layout version

**File:** `src/hooks/useLayoutManager.ts`

Add near `seismic` / `disasters`:
```ts
{ id: 'wildfires', label: 'Wildfires', defaultSpan: 1 },
```
Bump `CURRENT_VERSION` by 1 from current.

**File:** `src/App.tsx`

1. Import hook + panel.
2. Call hook.
3. `panelHealth.reportData('wildfires')` when `wildfires?.total24h > 0`.
4. Add `'wildfires': <WildfiresPanel data={wildfires} ... />` to render map.
5. Wrap in per-panel ErrorBoundary.

**Files:** `public/llms.txt`, `public/openapi.json`, `CLAUDE.md` — add lines for both endpoints.

---

## Execution Order

1. Section 0 (set the FIRMS map key as a Worker secret).
2. Section 1 (fetcher + helpers in canonical worker).
3. Section 2 (free endpoint, deploy, verify with `curl https://terminalfeed.io/api/wildfires | jq '.data.total_24h'`).
4. Section 3 (pro endpoint + MCP, redeploy, verify with bearer).
5. Section 4 (hook + panel with mini-map SVG and Sparkline + Cascade + CountUp).
6. Section 5 (register, version bump, docs).

---

## Verification Checklist

- [ ] `npx wrangler secret list` shows `NASA_FIRMS_MAP_KEY` set on the worker.
- [ ] `curl https://terminalfeed.io/api/wildfires` returns 200 with `data.total_24h` numeric and `data.hourly_counts_24h` length 24.
- [ ] Pro endpoint returns `aggregates.by_state`, `aggregates.by_satellite`, `top_hotspots`.
- [ ] Mini-map SVG renders without hard-coded sizes that break responsive layout.
- [ ] Mini-map dot positions look roughly geographic (CA fires on left, FL fires on bottom-right).
- [ ] Sparkline shows variation across 24 hours (FIRMS data is bursty by daylight).
- [ ] Panel hides when `total_24h` is zero and `top` is empty.
- [ ] No direct browser fetch to firms.modaps.eosdis.nasa.gov.

---

## Out of Scope

- Real interactive map (would need a tile lib like Leaflet, too heavy).
- Burn perimeter polygons (FIRMS provides points, not perimeters; perimeter data is NIFC and slower).
- Push notifications for new high-FRP detections.
- Worldwide coverage (limit to North America for v1; world data is too large to serve responsively at 10min cache without further work).
- 7-day historical trend (would need either daily snapshots or repeated FIRMS calls; skip for v1).

---

## Note to CC

- Edit ONLY `worker-additions/worker.js`. Orphan subfolder is off-limits.
- The mini-map is a stylized blob outline, not real GeoJSON. Keep it inline SVG; do not add a map library.
- Pro endpoint via `handlePremium(...)` only. Register MCP tool in both switches.
- Null-safe defaults on every field consumed in the panel.
- No em dashes anywhere.
- Worker first (and secret first), frontend second.

End of spec.
