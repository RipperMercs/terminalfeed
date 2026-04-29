# CC Spec: Space Weather (Free + Premium) + Panel

**Date:** 2026-04-29
**Priority:** MEDIUM
**Owner:** Ripper
**Estimated commits:** 5

---

## Executive Summary

- Add `/api/space-weather` (free, 5min cache, current Kp + solar wind + active flare class + active alerts) and `/api/pro/space-weather` (2 credits, 5min cache, full 24h Kp series + solar wind series + GOES X-ray history + storm forecast).
- Source: NOAA Space Weather Prediction Center (services.swpc.noaa.gov). 100% open, no auth, no API key, US government stable infrastructure.
- New `Space Weather` panel on the dashboard with current Kp dial, solar wind speed, flare class indicator, and aurora visibility hint when Kp is elevated.
- Edits target `worker-additions/worker.js` (canonical). Do NOT edit the orphan subfolder.

Why this fills a gap: zero existing panels cover space weather, geomagnetic activity, or solar conditions. Niche enough that few sites surface it, structured enough that agents can consume it. Pairs naturally with the existing earthquake / disaster-alerts panels in the "world physical state" cluster.

---

## Section 1: Worker shared fetchers

**File:** `worker-additions/worker.js`

Add 4 fetchers in the premium-fetchers section. All 4 hit free NOAA SWPC endpoints; no auth or User-Agent customization needed.

```js
async function fetchSwpcKpIndex() {
  // Returns last 24h of 3-hour Kp values: [["time_tag", "Kp", "a_running", "station_count"], ...] with header row
  var res = await fetchWithTimeout('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', {}, 8000);
  if (!res.ok) throw new Error('swpc-kp ' + res.status);
  var arr = await res.json();
  if (!Array.isArray(arr) || arr.length < 2) return [];
  // Skip header row, parse remaining
  return arr.slice(1).map(function(row) {
    return {
      time: row[0],
      kp: parseFloat(row[1]) || 0,
      a_running: parseFloat(row[2]) || null,
    };
  });
}

async function fetchSwpcSolarWind() {
  // Last 24h of 1-min solar wind plasma: density, speed, temperature
  var res = await fetchWithTimeout('https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json', {}, 8000);
  if (!res.ok) throw new Error('swpc-wind ' + res.status);
  var arr = await res.json();
  if (!Array.isArray(arr) || arr.length < 2) return [];
  return arr.slice(1).map(function(row) {
    return {
      time: row[0],
      density: parseFloat(row[1]) || null,
      speed: parseFloat(row[2]) || null,
      temperature: parseFloat(row[3]) || null,
    };
  });
}

async function fetchSwpcXrays() {
  // GOES primary X-ray flux, 1-day resolution
  var res = await fetchWithTimeout('https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json', {}, 8000);
  if (!res.ok) throw new Error('swpc-xrays ' + res.status);
  var arr = await res.json();
  if (!Array.isArray(arr)) return [];
  return arr.map(function(p) {
    return {
      time: p.time_tag,
      flux: parseFloat(p.flux) || 0,
      energy: p.energy,
    };
  });
}

async function fetchSwpcAlerts() {
  // Active and recent space weather alerts (CME, geomagnetic storm, radio blackout, etc.)
  var res = await fetchWithTimeout('https://services.swpc.noaa.gov/products/alerts.json', {}, 8000);
  if (!res.ok) throw new Error('swpc-alerts ' + res.status);
  var arr = await res.json();
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 50).map(function(a) {
    return {
      issue_time: a.issue_datetime,
      message: a.message,
      product_id: a.product_id,
      space_weather_message_code: a.space_weather_message_code,
    };
  });
}

// Helpers shared by both free and pro
function _classifyXrayFlux(maxFlux) {
  // Standard X-ray flare classification
  if (maxFlux === null || maxFlux === undefined) return null;
  if (maxFlux < 1e-7) return 'A';
  if (maxFlux < 1e-6) return 'B';
  if (maxFlux < 1e-5) return 'C';
  if (maxFlux < 1e-4) return 'M';
  return 'X';
}
function _kpStormLevel(kp) {
  if (kp == null) return null;
  if (kp < 5) return 'quiet';
  if (kp < 6) return 'minor_storm';     // G1
  if (kp < 7) return 'moderate_storm';  // G2
  if (kp < 8) return 'strong_storm';    // G3
  if (kp < 9) return 'severe_storm';    // G4
  return 'extreme_storm';                // G5
}
function _auroraVisibilityHint(kp) {
  if (kp == null) return null;
  if (kp < 4) return 'high_latitude_only';
  if (kp < 5) return 'northern_us_canada';
  if (kp < 6) return 'mid_us_states';
  if (kp < 7) return 'central_us_states';
  return 'southern_us_states';
}
```

---

## Section 2: Free endpoint `/api/space-weather`

**File:** `worker-additions/worker.js`

### 2a. Cache TTL
Add to `CACHE_TTL`:
```js
'space-weather': 300000,
```

### 2b. Route case
Add to free `/api/*` switch:
```js
case 'space-weather':
  return await handleSpaceWeather();
```

### 2c. Handler
```js
async function handleSpaceWeather() {
  var cached = getCached('space-weather');
  if (cached) return jsonResponse(cached);

  var settled = await Promise.allSettled([
    fetchSwpcKpIndex(),
    fetchSwpcSolarWind(),
    fetchSwpcXrays(),
    fetchSwpcAlerts(),
  ]);
  var kp = settled[0].status === 'fulfilled' ? settled[0].value : [];
  var wind = settled[1].status === 'fulfilled' ? settled[1].value : [];
  var xrays = settled[2].status === 'fulfilled' ? settled[2].value : [];
  var alerts = settled[3].status === 'fulfilled' ? settled[3].value : [];

  var currentKp = kp.length > 0 ? kp[kp.length - 1].kp : null;
  var currentWind = wind.length > 0 ? wind[wind.length - 1] : null;
  var maxXrayFlux = xrays.length > 0 ? Math.max.apply(null, xrays.map(function(x) { return x.flux || 0; })) : null;

  var result = {
    source: 'terminalfeed.io',
    endpoint: 'space-weather',
    updated_at: new Date().toISOString(),
    data: {
      kp_index: currentKp,
      kp_storm_level: _kpStormLevel(currentKp),
      aurora_visibility: _auroraVisibilityHint(currentKp),
      solar_wind_speed_kms: currentWind && currentWind.speed != null ? Math.round(currentWind.speed) : null,
      solar_wind_density: currentWind && currentWind.density != null ? parseFloat(currentWind.density.toFixed(2)) : null,
      flare_class_24h: _classifyXrayFlux(maxXrayFlux),
      active_alerts: alerts.slice(0, 5),
      attribution: 'NOAA Space Weather Prediction Center',
    },
  };
  setCache('space-weather', result);
  return jsonResponse(result);
}
```

### 2d. handleIndex listing
Add to the `endpoints` object in `handleIndex()`:
```js
'/api/space-weather': 'NOAA SWPC: Kp index, solar wind, flare class, active alerts',
```

---

## Section 3: Premium endpoint `/api/pro/space-weather`

### 3a. Pro fetcher
Place adjacent to the venue fetchers:
```js
async function fetchProSpaceWeather(env, url) {
  var sourceMeta = [
    { name: 'swpc.kp_index', start: Date.now() },
    { name: 'swpc.solar_wind', start: Date.now() },
    { name: 'swpc.xrays', start: Date.now() },
    { name: 'swpc.alerts', start: Date.now() },
  ];
  var settled = await Promise.allSettled([
    fetchSwpcKpIndex(),
    fetchSwpcSolarWind(),
    fetchSwpcXrays(),
    fetchSwpcAlerts(),
  ]);
  var kp = settled[0].status === 'fulfilled' ? settled[0].value : [];
  var wind = settled[1].status === 'fulfilled' ? settled[1].value : [];
  var xrays = settled[2].status === 'fulfilled' ? settled[2].value : [];
  var alerts = settled[3].status === 'fulfilled' ? settled[3].value : [];

  var currentKp = kp.length > 0 ? kp[kp.length - 1].kp : null;
  var maxKp24h = kp.length > 0 ? Math.max.apply(null, kp.map(function(k) { return k.kp; })) : null;
  var maxXrayFlux = xrays.length > 0 ? Math.max.apply(null, xrays.map(function(x) { return x.flux || 0; })) : null;
  var currentWind = wind.length > 0 ? wind[wind.length - 1] : null;

  // Downsample wind to ~1 sample per 5min for response size
  var sampledWind = wind.filter(function(_, i) { return i % 5 === 0; });

  return {
    source: 'terminalfeed-pro',
    endpoint: '/api/pro/space-weather',
    generated_at: new Date().toISOString(),
    current: {
      kp: currentKp,
      kp_storm_level: _kpStormLevel(currentKp),
      max_kp_24h: maxKp24h,
      max_kp_storm_level_24h: _kpStormLevel(maxKp24h),
      aurora_visibility: _auroraVisibilityHint(currentKp),
      solar_wind: currentWind,
      flare_class_24h: _classifyXrayFlux(maxXrayFlux),
      max_xray_flux_24h: maxXrayFlux,
    },
    series: {
      kp_24h: kp,
      solar_wind_5min: sampledWind,
      xrays_1day: xrays,
    },
    alerts: {
      active: alerts,
      count: alerts.length,
    },
    notes: {
      source_attribution: 'NOAA Space Weather Prediction Center (services.swpc.noaa.gov). Free public data, no auth required.',
      cache_ttl: '5 minutes. Kp updates every 3 hours; solar wind updates every minute upstream.',
      use_case: 'Monitoring for HF radio disruption, GPS/satellite degradation risk, aurora forecasting, satellite operator alerts.',
      caveat: 'Kp values for the most recent 3-hour window are preliminary and may be revised. NOAA classifies storms by max Kp in a 3-hour interval.',
    },
    _meta: _premiumMeta('/api/pro/space-weather', _buildSourcesMeta(settled, sourceMeta)),
  };
}
```

### 3b. Pro handler wrapper
```js
async function handleProSpaceWeather(request, env, url) {
  return handlePremium(request, env, url, '/api/pro/space-weather', 2, async function(env2, url2) {
    var KEY = 'pro:space-weather';
    return await cacheLookupOrFetch(KEY, 300000, function() { return fetchProSpaceWeather(env2, url2); });
  });
}
```

### 3c. Pro router case
In the `/api/pro/<slug>` switch:
```js
case 'pro/space-weather':   return await handleProSpaceWeather(request, env, url);
```

### 3d. Pricing manifest
Add to the cost_credits array:
```js
{ path: '/api/pro/space-weather', cost_credits: 2 },
```

### 3e. MCP tool registration
In the path/method mapper switch:
```js
case 'tf_premium_space_weather':       path = '/api/pro/space-weather'; break;
```
In the dispatcher switch:
```js
case 'tf_premium_space_weather':       return await handleProSpaceWeather(req, env, url);
```

### 3f. MCP tool definition
Add a sibling to existing premium MCP tool definitions:
```js
{
  name: 'tf_premium_space_weather',
  description: 'Geomagnetic Kp index, solar wind, X-ray flare class, and active NOAA alerts with 24h series. Costs 2 credits.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  url: 'https://terminalfeed.io/api/pro/space-weather',
}
```

---

## Section 4: Frontend hook + panel

**File (new):** `src/hooks/useSpaceWeather.ts`

Mirror `useGasTracker.ts`. Polls `/api/space-weather` every 5min desktop / 10min mobile. Visibility-aware. 8s timeout.

Shape:
```ts
export interface SpaceWeatherData {
  kpIndex: number | null;
  kpStormLevel: string | null;
  auroraVisibility: string | null;
  solarWindSpeedKms: number | null;
  solarWindDensity: number | null;
  flareClass24h: string | null;
  activeAlerts: Array<{ issueTime: string; message: string; productId: string }>;
}
```

Map response fields with `?? fallback` defaults on every access.

**File (new):** `src/panels/SpaceWeatherPanel.tsx`

- `React.memo` wrapped
- Returns `null` if data is null
- Header: title `Space Weather`, tag `NOAA`, stale indicator, `5m` refresh hint
- Body sections:
  1. Kp dial (use existing `Dial` primitive from `src/primitives`, range 0-9, label = current Kp value, color: green if <5, amber if 5-6, red if >=7)
  2. Solar wind row: speed in km/s, density label
  3. Flare class chip: `A/B/C/M/X` with corresponding color (A/B green, C amber, M/X red)
  4. Aurora hint line (only render if `auroraVisibility` is set and not `'high_latitude_only'`)
  5. Active alerts: top 3, dim text, max 60 char per line
- Color tokens: use existing `--green`, `--amber`, `--red`, `--text`, `--text-dim`
- `value ?? fallback` on every field accessed in render

---

## Section 5: Register panel + bump layout version

**File:** `src/hooks/useLayoutManager.ts`

In `ALL_PANELS`, add (near the science cluster, after `seismic` or alongside `weather`):
```ts
{ id: 'space-weather', label: 'Space Weather', defaultSpan: 1 },
```

Bump `CURRENT_VERSION` by 1 from current value.

**File:** `src/App.tsx`

1. Import the hook and panel.
2. Call the hook alongside others.
3. `panelHealth.reportData('space-weather')` when `spaceWeather` is non-null.
4. Add to the panel render map: `'space-weather': <SpaceWeatherPanel data={spaceWeather} ... />`
5. Confirm wrapped in the existing per-panel ErrorBoundary.

**Files:** `public/llms.txt`, `public/openapi.json`, `CLAUDE.md`

Add lines for both `/api/space-weather` (free) and `/api/pro/space-weather` (2cr) following existing patterns.

---

## Execution Order

1. Section 1 (4 fetchers + helpers in canonical worker).
2. Section 2 (free endpoint, deploy worker, verify with `curl https://terminalfeed.io/api/space-weather | jq '.data.kp_index'`).
3. Section 3 (pro endpoint + MCP, redeploy, verify with bearer token).
4. Section 4 (hook + panel).
5. Section 5 (register, version bump, docs).

One commit per section.

---

## Verification Checklist

- [ ] `curl https://terminalfeed.io/api/space-weather` returns 200 with `data.kp_index` numeric.
- [ ] Pro endpoint returns 401 without bearer, 200 with valid bearer, charges 2 credits.
- [ ] `data.flare_class_24h` is one of `A/B/C/M/X` or null.
- [ ] `data.kp_storm_level` is one of `quiet/minor_storm/moderate_storm/strong_storm/severe_storm/extreme_storm` or null.
- [ ] Panel renders without crashing when any field is null (test by editing the worker to return `kp_index: null`).
- [ ] Panel renders the Kp dial in the correct color band.
- [ ] No direct browser fetch to swpc.noaa.gov; all routes through worker.

---

## Out of Scope

- Aurora visualization (skip for v1; the visibility hint string is enough).
- Historical Kp database (would need storage; skip).
- Other space weather sources (e.g., NASA DONKI). NOAA SWPC is enough.
- Push notifications when Kp goes high (separate webhook spec).
- i18n.

---

## Note to CC

- Edit ONLY `worker-additions/worker.js`. The `worker-additions/terminalfeed-api/` subfolder is orphaned.
- Pro endpoint MUST use `handlePremium(...)` and register MCP tool. Mirror an existing pro endpoint pattern (e.g., `handleProStablecoinFlows`).
- Null-safe defaults on every API field accessed in the frontend. Wrap panel in per-panel ErrorBoundary.
- No em dashes anywhere.
- Worker first, frontend second. Push to GitHub after each commit for Pages auto-deploy.

End of spec.
