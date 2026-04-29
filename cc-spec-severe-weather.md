# CC Spec: Severe Weather Alerts (Free + Premium) + Panel

**Date:** 2026-04-29
**Priority:** MEDIUM
**Owner:** Ripper
**Estimated commits:** 5

---

## Executive Summary

- Add `/api/severe-weather` (free, 60s cache, top 15 active US severe alerts by severity) and `/api/pro/severe-weather` (2 credits, 60s cache, full active alert list with geographic clustering and severity scoring).
- Source: National Weather Service public API (api.weather.gov). 100% open, no key, requires only a `User-Agent` header per their TOS.
- New `Severe Weather` panel surfaces tornado warnings, flash flood warnings, hurricane alerts, severe thunderstorms, and other CAP-coded events with red/amber severity badges and a count-by-state rollup.
- Differs from existing `/api/disaster-alerts` (GDACS, global, slow-moving disasters) and `/api/weather` (current conditions). This is US-focused, real-time, alert-grade.

---

## Section 1: Worker shared fetcher

**File:** `worker-additions/worker.js`

```js
async function fetchNwsActiveAlerts() {
  // NWS requires a descriptive User-Agent. Plain fetch defaults can return 403.
  var headers = {
    'User-Agent': 'terminalfeed.io (hello@terminalfeed.io) data-aggregator/1.0',
    'Accept': 'application/geo+json',
  };
  var res = await fetchWithTimeout('https://api.weather.gov/alerts/active', { headers: headers }, 8000);
  if (!res.ok) throw new Error('nws ' + res.status);
  var json = await res.json();
  var features = (json && json.features) || [];
  return features.map(function(f) {
    var p = f.properties || {};
    return {
      id: p.id || null,
      event: p.event || null,                    // e.g. "Tornado Warning"
      severity: p.severity || null,              // Extreme | Severe | Moderate | Minor | Unknown
      certainty: p.certainty || null,            // Observed | Likely | Possible | Unlikely | Unknown
      urgency: p.urgency || null,                // Immediate | Expected | Future | Past | Unknown
      headline: p.headline || null,
      area_desc: p.areaDesc || null,
      sender_name: p.senderName || null,
      effective: p.effective || null,
      expires: p.expires || null,
      onset: p.onset || null,
      ends: p.ends || null,
      affected_zones: Array.isArray(p.affectedZones) ? p.affectedZones.length : 0,
      message_type: p.messageType || null,
    };
  });
}

function _severityScore(a) {
  // Map severity + urgency + certainty into a single sortable score.
  var sevMap   = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };
  var urgMap   = { Immediate: 3, Expected: 2, Future: 1, Past: 0, Unknown: 0 };
  var certMap  = { Observed: 3, Likely: 2, Possible: 1, Unlikely: 0, Unknown: 0 };
  return (sevMap[a.severity] || 0) * 10 + (urgMap[a.urgency] || 0) + (certMap[a.certainty] || 0) * 0.5;
}

function _eventCategory(eventName) {
  if (!eventName) return 'other';
  var e = eventName.toLowerCase();
  if (e.indexOf('tornado') !== -1) return 'tornado';
  if (e.indexOf('hurricane') !== -1 || e.indexOf('tropical storm') !== -1) return 'tropical';
  if (e.indexOf('flood') !== -1) return 'flood';
  if (e.indexOf('thunderstorm') !== -1) return 'thunderstorm';
  if (e.indexOf('winter') !== -1 || e.indexOf('blizzard') !== -1 || e.indexOf('ice') !== -1) return 'winter';
  if (e.indexOf('fire') !== -1) return 'fire';
  if (e.indexOf('heat') !== -1) return 'heat';
  if (e.indexOf('wind') !== -1) return 'wind';
  return 'other';
}
```

---

## Section 2: Free endpoint `/api/severe-weather`

### 2a. Cache TTL
```js
'severe-weather': 60000,
```

### 2b. Route case
```js
case 'severe-weather':
  return await handleSevereWeather();
```

### 2c. Handler
```js
async function handleSevereWeather() {
  var cached = getCached('severe-weather');
  if (cached) return jsonResponse(cached);

  var alerts;
  try {
    alerts = await fetchNwsActiveAlerts();
  } catch (e) {
    var stale = cache['severe-weather'];
    if (stale) return jsonResponse(stale.data);
    return jsonResponse({
      source: 'terminalfeed.io',
      endpoint: 'severe-weather',
      updated_at: new Date().toISOString(),
      data: { top: [], counts_by_severity: {}, error: 'upstream_unavailable' },
    });
  }

  // Sort by severity score desc, take top 15
  var scored = alerts.map(function(a) { return Object.assign({}, a, { _score: _severityScore(a) }); })
                     .sort(function(x, y) { return y._score - x._score; });
  var top = scored.slice(0, 15).map(function(a) {
    return {
      event: a.event,
      severity: a.severity,
      urgency: a.urgency,
      area_desc: a.area_desc,
      headline: a.headline,
      effective: a.effective,
      expires: a.expires,
      category: _eventCategory(a.event),
    };
  });

  var counts = {};
  alerts.forEach(function(a) {
    var sev = a.severity || 'Unknown';
    counts[sev] = (counts[sev] || 0) + 1;
  });

  var result = {
    source: 'terminalfeed.io',
    endpoint: 'severe-weather',
    updated_at: new Date().toISOString(),
    data: {
      top: top,
      total_active: alerts.length,
      counts_by_severity: counts,
      attribution: 'National Weather Service (api.weather.gov)',
    },
  };
  if (alerts.length > 0) setCache('severe-weather', result);
  return jsonResponse(result);
}
```

### 2d. handleIndex listing
```js
'/api/severe-weather': 'NWS active US severe weather alerts (top 15 by severity)',
```

---

## Section 3: Premium endpoint `/api/pro/severe-weather`

### 3a. Pro fetcher
```js
async function fetchProSevereWeather(env, url) {
  var sourceMeta = [{ name: 'nws.alerts.active', start: Date.now() }];
  var settled = await Promise.allSettled([fetchNwsActiveAlerts()]);
  var alerts = settled[0].status === 'fulfilled' ? settled[0].value : [];

  var scored = alerts.map(function(a) {
    return Object.assign({}, a, {
      severity_score: _severityScore(a),
      category: _eventCategory(a.event),
    });
  }).sort(function(x, y) { return y.severity_score - x.severity_score; });

  // Counts by severity, urgency, category
  function _tally(field) {
    var t = {};
    alerts.forEach(function(a) { var k = a[field] || 'Unknown'; t[k] = (t[k] || 0) + 1; });
    return t;
  }
  var byCategory = {};
  alerts.forEach(function(a) {
    var c = _eventCategory(a.event);
    byCategory[c] = (byCategory[c] || 0) + 1;
  });

  // Crude state-level rollup from area_desc strings (NWS uses "County, ST" style)
  var byState = {};
  alerts.forEach(function(a) {
    if (!a.area_desc) return;
    var matches = a.area_desc.match(/, ([A-Z]{2})(?:;|$)/g) || [];
    var states = new Set();
    matches.forEach(function(m) {
      var st = m.replace(/[,; ]/g, '');
      states.add(st);
    });
    states.forEach(function(s) { byState[s] = (byState[s] || 0) + 1; });
  });

  return {
    source: 'terminalfeed-pro',
    endpoint: '/api/pro/severe-weather',
    generated_at: new Date().toISOString(),
    alerts: scored,
    aggregate: {
      total_active: alerts.length,
      by_severity: _tally('severity'),
      by_urgency: _tally('urgency'),
      by_certainty: _tally('certainty'),
      by_category: byCategory,
      by_state: byState,
    },
    notes: {
      source_attribution: 'National Weather Service api.weather.gov. Free public CAP feed.',
      cache_ttl: '1 minute. NWS pushes new alerts continuously; cache hit balances freshness vs upstream load.',
      use_case: 'Real-time risk dashboards for logistics, energy, insurance, news, and AI-agent monitoring of US severe weather.',
      caveat: 'Coverage is US-only (50 states + territories). For global disasters, use /api/disaster-alerts (GDACS).',
    },
    _meta: _premiumMeta('/api/pro/severe-weather', _buildSourcesMeta(settled, sourceMeta)),
  };
}
```

### 3b. Pro handler
```js
async function handleProSevereWeather(request, env, url) {
  return handlePremium(request, env, url, '/api/pro/severe-weather', 2, async function(env2, url2) {
    var KEY = 'pro:severe-weather';
    return await cacheLookupOrFetch(KEY, 60000, function() { return fetchProSevereWeather(env2, url2); });
  });
}
```

### 3c. Pro router
```js
case 'pro/severe-weather':   return await handleProSevereWeather(request, env, url);
```

### 3d. Pricing manifest
```js
{ path: '/api/pro/severe-weather', cost_credits: 2 },
```

### 3e. MCP tool registration
Path mapper:
```js
case 'tf_premium_severe_weather':       path = '/api/pro/severe-weather'; break;
```
Dispatcher:
```js
case 'tf_premium_severe_weather':       return await handleProSevereWeather(req, env, url);
```

### 3f. MCP tool definition
```js
{
  name: 'tf_premium_severe_weather',
  description: 'NWS active US severe weather alerts with severity scoring, state rollup, and category breakdown. Costs 2 credits.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  url: 'https://terminalfeed.io/api/pro/severe-weather',
}
```

---

## Section 4: Frontend hook + panel

**File (new):** `src/hooks/useSevereWeather.ts`

Polls `/api/severe-weather` every 60s desktop / 120s mobile. Visibility-aware. 8s timeout.

```ts
export interface SevereAlert {
  event: string;
  severity: string;
  urgency: string;
  areaDesc: string;
  headline: string;
  effective: string;
  expires: string;
  category: 'tornado' | 'tropical' | 'flood' | 'thunderstorm' | 'winter' | 'fire' | 'heat' | 'wind' | 'other';
}
export interface SevereWeatherData {
  top: SevereAlert[];
  totalActive: number;
  countsBySeverity: Record<string, number>;
}
```

**File (new):** `src/panels/SevereWeatherPanel.tsx`

- `React.memo`, returns `null` if `top.length === 0` AND `totalActive === 0`.
- Header: title `Severe Weather`, tag `US`, stale indicator, `1m` refresh hint.
- Body: count strip at top (`<n> active`, `<extreme_n> extreme`, `<severe_n> severe`), then top 8 alert rows.
- Each row: category icon (text glyph is fine), event name, severity badge (color-coded), area_desc truncated to 50 chars, expires-in label.
- Severity colors:
  - Extreme: `var(--red)` background 0.15 alpha, text full color
  - Severe: `var(--amber)` background 0.15 alpha
  - Moderate: `var(--blue)` background 0.15 alpha
  - Minor / Unknown: `var(--text-dim)` no background
- Category glyph map (text-only, no emoji):
  - tornado: `[T]`
  - tropical: `[H]`
  - flood: `[F]`
  - thunderstorm: `[S]`
  - winter: `[W]`
  - fire: `[!]`
  - heat: `[*]`
  - wind: `[~]`
  - other: `[ ]`
- All field accesses use `?? fallback` defaults.

---

## Section 5: Register panel + bump layout version

**File:** `src/hooks/useLayoutManager.ts`

Add near `weather` and `disasters`:
```ts
{ id: 'severe-weather', label: 'Severe Weather', defaultSpan: 1 },
```

Bump `CURRENT_VERSION` by 1 from current.

**File:** `src/App.tsx`

1. Import hook + panel.
2. Call hook.
3. `panelHealth.reportData('severe-weather')` when data has `totalActive > 0`.
4. Add `'severe-weather': <SevereWeatherPanel data={severeWeather} ... />` to panel render map.
5. Wrap in per-panel ErrorBoundary.

**Files:** `public/llms.txt`, `public/openapi.json`, `CLAUDE.md` — add lines for both endpoints.

---

## Execution Order

1. Section 1 (fetcher + helpers in canonical worker).
2. Section 2 (free endpoint, deploy, verify with `curl https://terminalfeed.io/api/severe-weather | jq '.data.total_active'`).
3. Section 3 (pro endpoint + MCP, redeploy, verify with bearer).
4. Section 4 (hook + panel).
5. Section 5 (register, version bump, docs).

---

## Verification Checklist

- [ ] `curl https://terminalfeed.io/api/severe-weather` returns 200 with `data.top` array.
- [ ] Severity badges render correctly for Extreme/Severe/Moderate/Minor.
- [ ] If NWS upstream returns 403, the worker is sending the User-Agent header. Check the Cloudflare Workers log.
- [ ] Pro endpoint returns aggregates including `by_state` and `by_category`.
- [ ] Panel hides cleanly when there are zero active US alerts (rare but possible at quiet times).
- [ ] No direct browser fetch to api.weather.gov.

---

## Out of Scope

- International weather alerts (GDACS already covers global disasters).
- Map visualization (would need a tile layer).
- Push notifications (separate webhook spec).
- Historical alert archive.
- i18n.

---

## Note to CC

- Edit ONLY `worker-additions/worker.js`. The terminalfeed-api subfolder is orphaned.
- NWS REQUIRES a descriptive User-Agent header. The fetcher in Section 1 sets one; do not remove it.
- Pro endpoint via `handlePremium(...)` only.
- Null-safe defaults everywhere on the frontend.
- No em dashes anywhere.
- Worker first, frontend second.

End of spec.
