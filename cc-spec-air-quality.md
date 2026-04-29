# CC Spec: Air Quality (Free + Premium) + Panel

**Date:** 2026-04-29
**Priority:** MEDIUM
**Owner:** Ripper
**Estimated commits:** 5

---

## Executive Summary

- Add `/api/air-quality?lat=&lon=` (free, 30min cache, current AQI + 4 main pollutants for one location) and `/api/pro/air-quality` (2 credits, 30min cache, multi-city snapshot covering 12 major global cities + 24h forecast for the requested coords).
- Source: Open-Meteo air quality API (air-quality-api.open-meteo.com). Already used for `/api/weather`. Free, no key, generous rate limits, attribution-friendly.
- New `Air Quality` panel co-locates with the existing weather panel; defaults to LA coords (the project's home base) but honors user-selected location if one exists.
- Fills a real gap: zero current panels surface pollution data, which is genuinely useful for trip planning, fitness, and global event tracking (wildfires, dust storms).

---

## Section 1: Worker shared fetcher

**File:** `worker-additions/worker.js`

```js
async function fetchOpenMeteoAirQuality(lat, lon, hours) {
  hours = hours || 1;
  var hourly = 'us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone';
  var url = 'https://air-quality-api.open-meteo.com/v1/air-quality'
          + '?latitude=' + encodeURIComponent(lat)
          + '&longitude=' + encodeURIComponent(lon)
          + '&hourly=' + hourly
          + '&timezone=auto'
          + '&past_hours=0'
          + '&forecast_hours=' + hours;
  var res = await fetchWithTimeout(url, {}, 8000);
  if (!res.ok) throw new Error('open-meteo-aq ' + res.status);
  var json = await res.json();
  if (!json || !json.hourly) return null;
  return json;
}

function _aqiCategory(usAqi) {
  // Standard EPA AQI bands
  if (usAqi == null) return null;
  if (usAqi <= 50) return { label: 'good', color: 'green' };
  if (usAqi <= 100) return { label: 'moderate', color: 'yellow' };
  if (usAqi <= 150) return { label: 'unhealthy_sensitive', color: 'orange' };
  if (usAqi <= 200) return { label: 'unhealthy', color: 'red' };
  if (usAqi <= 300) return { label: 'very_unhealthy', color: 'purple' };
  return { label: 'hazardous', color: 'maroon' };
}

function _firstHourSnapshot(json) {
  if (!json || !json.hourly) return null;
  var h = json.hourly;
  return {
    time: (h.time && h.time[0]) || null,
    us_aqi: (h.us_aqi && h.us_aqi[0] != null) ? h.us_aqi[0] : null,
    european_aqi: (h.european_aqi && h.european_aqi[0] != null) ? h.european_aqi[0] : null,
    pm2_5: (h.pm2_5 && h.pm2_5[0] != null) ? h.pm2_5[0] : null,
    pm10: (h.pm10 && h.pm10[0] != null) ? h.pm10[0] : null,
    ozone: (h.ozone && h.ozone[0] != null) ? h.ozone[0] : null,
    nitrogen_dioxide: (h.nitrogen_dioxide && h.nitrogen_dioxide[0] != null) ? h.nitrogen_dioxide[0] : null,
    sulphur_dioxide: (h.sulphur_dioxide && h.sulphur_dioxide[0] != null) ? h.sulphur_dioxide[0] : null,
    carbon_monoxide: (h.carbon_monoxide && h.carbon_monoxide[0] != null) ? h.carbon_monoxide[0] : null,
  };
}
```

---

## Section 2: Free endpoint `/api/air-quality?lat=&lon=`

### 2a. Cache TTL
```js
'air-quality': 1800000,
```

### 2b. Route case
```js
case 'air-quality':
  return await handleAirQuality(url);
```

### 2c. Handler
```js
async function handleAirQuality(url) {
  var lat = parseFloat(url.searchParams.get('lat'));
  var lon = parseFloat(url.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    // Default to LA (project home base)
    lat = 34.0522;
    lon = -118.2437;
  }
  // Round to 2 decimal places to maximize cache hit rate (~1 km bucket)
  lat = Math.round(lat * 100) / 100;
  lon = Math.round(lon * 100) / 100;
  var cacheKey = 'air-quality:' + lat + ',' + lon;

  var cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 1800000) {
    return jsonResponse(cached.data);
  }

  var raw;
  try {
    raw = await fetchOpenMeteoAirQuality(lat, lon, 1);
  } catch (e) {
    if (cached) return jsonResponse(cached.data);
    return jsonResponse({
      source: 'terminalfeed.io',
      endpoint: 'air-quality',
      updated_at: new Date().toISOString(),
      data: { error: 'upstream_unavailable', lat: lat, lon: lon },
    });
  }

  var snap = _firstHourSnapshot(raw);
  var category = snap ? _aqiCategory(snap.us_aqi) : null;
  var result = {
    source: 'terminalfeed.io',
    endpoint: 'air-quality',
    updated_at: new Date().toISOString(),
    data: {
      lat: lat,
      lon: lon,
      timezone: raw && raw.timezone || null,
      snapshot: snap,
      category: category,
      attribution: 'Open-Meteo Air Quality API (open-meteo.com)',
    },
  };
  cache[cacheKey] = { data: result, timestamp: Date.now() };
  return jsonResponse(result);
}
```

Note: this handler uses a per-coords cache key rather than the global `getCached/setCache` since the response varies by query params. Mirror how `/api/weather` handles location params (search `handleWeather` for the existing pattern and align if it differs).

### 2d. handleIndex listing
```js
'/api/air-quality': 'Open-Meteo air quality (US AQI, PM2.5, ozone) for given lat/lon, defaults to LA',
```

---

## Section 3: Premium endpoint `/api/pro/air-quality`

### 3a. Pro fetcher

The pro version covers two things at once:
1. 12 major global cities snapshot (NYC, LA, London, Paris, Tokyo, Beijing, Delhi, Mumbai, Mexico City, Sao Paulo, Lagos, Sydney)
2. 24h forecast for the requested lat/lon (or default LA)

```js
var GLOBAL_AQ_CITIES = [
  { name: 'New York', country: 'US', lat: 40.71, lon: -74.01 },
  { name: 'Los Angeles', country: 'US', lat: 34.05, lon: -118.24 },
  { name: 'London', country: 'GB', lat: 51.51, lon: -0.13 },
  { name: 'Paris', country: 'FR', lat: 48.86, lon: 2.35 },
  { name: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69 },
  { name: 'Beijing', country: 'CN', lat: 39.91, lon: 116.40 },
  { name: 'Delhi', country: 'IN', lat: 28.61, lon: 77.21 },
  { name: 'Mumbai', country: 'IN', lat: 19.08, lon: 72.88 },
  { name: 'Mexico City', country: 'MX', lat: 19.43, lon: -99.13 },
  { name: 'Sao Paulo', country: 'BR', lat: -23.55, lon: -46.63 },
  { name: 'Lagos', country: 'NG', lat: 6.52, lon: 3.38 },
  { name: 'Sydney', country: 'AU', lat: -33.87, lon: 151.21 },
];

async function fetchProAirQuality(env, url) {
  var lat = parseFloat(url.searchParams.get('lat'));
  var lon = parseFloat(url.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) { lat = 34.0522; lon = -118.2437; }

  var sourceMeta = [{ name: 'open-meteo.air_quality', start: Date.now() }];

  // Fetch all 12 cities + the requested location's 24h forecast in parallel
  var fetches = GLOBAL_AQ_CITIES.map(function(c) {
    return fetchOpenMeteoAirQuality(c.lat, c.lon, 1).catch(function() { return null; });
  });
  fetches.push(fetchOpenMeteoAirQuality(lat, lon, 24).catch(function() { return null; }));

  var settled = await Promise.allSettled([Promise.all(fetches)]);
  var results = settled[0].status === 'fulfilled' ? settled[0].value : [];

  var citySnapshots = GLOBAL_AQ_CITIES.map(function(c, i) {
    var raw = results[i];
    var snap = _firstHourSnapshot(raw);
    return {
      city: c.name,
      country: c.country,
      lat: c.lat,
      lon: c.lon,
      snapshot: snap,
      category: snap ? _aqiCategory(snap.us_aqi) : null,
    };
  });

  var forecastRaw = results[GLOBAL_AQ_CITIES.length];
  var forecast = null;
  if (forecastRaw && forecastRaw.hourly) {
    var h = forecastRaw.hourly;
    var hours = (h.time || []).length;
    forecast = {
      lat: lat,
      lon: lon,
      timezone: forecastRaw.timezone || null,
      points: [],
    };
    for (var i = 0; i < hours; i++) {
      forecast.points.push({
        time: h.time[i],
        us_aqi: (h.us_aqi && h.us_aqi[i] != null) ? h.us_aqi[i] : null,
        pm2_5: (h.pm2_5 && h.pm2_5[i] != null) ? h.pm2_5[i] : null,
        pm10: (h.pm10 && h.pm10[i] != null) ? h.pm10[i] : null,
        ozone: (h.ozone && h.ozone[i] != null) ? h.ozone[i] : null,
      });
    }
  }

  // Rank cities by US AQI descending (worst air first, most actionable)
  var ranked = citySnapshots.slice()
    .filter(function(c) { return c.snapshot && c.snapshot.us_aqi != null; })
    .sort(function(a, b) { return b.snapshot.us_aqi - a.snapshot.us_aqi; });

  return {
    source: 'terminalfeed-pro',
    endpoint: '/api/pro/air-quality',
    generated_at: new Date().toISOString(),
    cities: citySnapshots,
    cities_ranked_worst_to_best: ranked,
    forecast_24h: forecast,
    notes: {
      source_attribution: 'Open-Meteo Air Quality API (open-meteo.com). Free public data, attribution required.',
      cache_ttl: '30 minutes. Open-Meteo updates hourly; sub-30min cache adds load without freshness gain.',
      use_case: 'Multi-city air quality dashboards, AI agent queries on travel/exercise advisories, wildfire smoke spread tracking.',
      caveat: 'Air quality models combine satellite, in-situ, and reanalysis data. Hyperlocal accuracy varies, especially in cities without dense ground stations.',
    },
    _meta: _premiumMeta('/api/pro/air-quality', _buildSourcesMeta(settled, sourceMeta)),
  };
}
```

### 3b. Pro handler
```js
async function handleProAirQuality(request, env, url) {
  return handlePremium(request, env, url, '/api/pro/air-quality', 2, async function(env2, url2) {
    var lat = parseFloat(url2.searchParams.get('lat'));
    var lon = parseFloat(url2.searchParams.get('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) { lat = 34.0522; lon = -118.2437; }
    var KEY = 'pro:air-quality:' + Math.round(lat * 100) / 100 + ',' + Math.round(lon * 100) / 100;
    return await cacheLookupOrFetch(KEY, 1800000, function() { return fetchProAirQuality(env2, url2); });
  });
}
```

### 3c. Pro router
```js
case 'pro/air-quality':   return await handleProAirQuality(request, env, url);
```

### 3d. Pricing manifest
```js
{ path: '/api/pro/air-quality', cost_credits: 2 },
```

### 3e. MCP tool registration
Path mapper:
```js
case 'tf_premium_air_quality':       path = '/api/pro/air-quality'; break;
```
Dispatcher:
```js
case 'tf_premium_air_quality':       return await handleProAirQuality(req, env, url);
```

### 3f. MCP tool definition
```js
{
  name: 'tf_premium_air_quality',
  description: 'Air quality snapshot for 12 major global cities plus 24h forecast for any lat/lon. Costs 2 credits.',
  inputSchema: {
    type: 'object',
    properties: {
      lat: { type: 'number', description: 'Latitude for forecast location (default 34.0522)' },
      lon: { type: 'number', description: 'Longitude for forecast location (default -118.2437)' },
    },
    additionalProperties: false,
  },
  url: 'https://terminalfeed.io/api/pro/air-quality',
}
```

---

## Section 4: Frontend hook + panel

**File (new):** `src/hooks/useAirQuality.ts`

Polls `/api/air-quality?lat=<lat>&lon=<lon>` every 30min desktop / 60min mobile. Default to LA. If the existing weather panel exposes a user-selected location via context or props, reuse those coords; otherwise use LA defaults.

```ts
export interface AirQualitySnapshot {
  time: string | null;
  usAqi: number | null;
  europeanAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
}
export interface AirQualityCategory {
  label: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  color: string;
}
export interface AirQualityData {
  snapshot: AirQualitySnapshot | null;
  category: AirQualityCategory | null;
}
```

**File (new):** `src/panels/AirQualityPanel.tsx`

- `React.memo`, returns `null` if data is null or `snapshot.usAqi` is null.
- Header: title `Air Quality`, tag `AQI`, stale indicator, `30m` refresh hint.
- Body:
  1. Big AQI number (use existing `Dial` primitive, range 0-300, label = current AQI value)
  2. Category label below dial (`MODERATE`, `UNHEALTHY`, etc.) in the category color
  3. Pollutant list: PM2.5, PM10, Ozone, NO2, with values and units
  4. Footer: `Source: Open-Meteo` in dim text
- Color tokens, mapped from category color string:
  - `green` → `var(--green)`
  - `yellow` → `var(--amber)`
  - `orange` → `#f59e0b`
  - `red` → `var(--red)`
  - `purple` → `var(--purple)`
  - `maroon` → `#7f1d1d`
- Null-safe everything.

---

## Section 5: Register panel + bump layout version

**File:** `src/hooks/useLayoutManager.ts`

Add adjacent to `weather`:
```ts
{ id: 'air-quality', label: 'Air Quality', defaultSpan: 1 },
```

Bump `CURRENT_VERSION` by 1.

**File:** `src/App.tsx`

1. Import hook + panel.
2. Call `useAirQuality(lat, lon)` (or no-args if hook reads from context).
3. `panelHealth.reportData('air-quality')` when snapshot is non-null.
4. Add to render map.
5. Wrap in per-panel ErrorBoundary.

**Files:** `public/llms.txt`, `public/openapi.json`, `CLAUDE.md` — add lines for both endpoints.

---

## Execution Order

1. Section 1 (fetcher + helpers).
2. Section 2 (free endpoint, deploy, verify with `curl 'https://terminalfeed.io/api/air-quality?lat=34.05&lon=-118.24' | jq '.data.snapshot.us_aqi'`).
3. Section 3 (pro endpoint + MCP, redeploy, verify with bearer).
4. Section 4 (hook + panel).
5. Section 5 (register, version bump, docs).

---

## Verification Checklist

- [ ] Free endpoint returns 200 with `snapshot.us_aqi` numeric for known locations.
- [ ] Default coords (no params) returns LA snapshot.
- [ ] Cache key per coords (rounded to 2 decimals) prevents cache thrash from minor lat/lon variations.
- [ ] Pro endpoint returns 12 city snapshots plus a 24h forecast for the requested location.
- [ ] Pro endpoint charges 2 credits regardless of params.
- [ ] Panel renders `Dial` with correct color per AQI band.
- [ ] No direct browser fetch to open-meteo.com for air quality.

---

## Out of Scope

- Multi-language pollutant labels.
- Historical AQI database (would need storage).
- Local ground-station data (PurpleAir, AirNow).
- Map heatmap visualization.
- Push notifications.

---

## Note to CC

- Edit ONLY `worker-additions/worker.js`. Orphan subfolder is off-limits.
- Per-coords cache key is intentional. Use the rounded lat/lon to bucket nearby requests.
- Pro endpoint via `handlePremium(...)` only.
- Null-safe defaults on every field consumed in the panel.
- No em dashes anywhere.
- Worker first, frontend second.

End of spec.
