# CC Spec: HF Propagation Panel

**Date:** 2026-05-03
**Priority:** MEDIUM
**Estimated commits:** 5
**Author:** Ripper (drafted in Claude Code session, audit-feeds work)

## Executive summary

Add a real-time HF (high-frequency) radio propagation panel to the dashboard, sourced from N0NBH's solar XML feed at `hamqsl.com/solarxml.php`. The panel shows current solar/geomagnetic conditions and per-band openness ratings (80m through 10m) that ham radio operators use to decide whether to call CQ. Genre fit: same audience as the 2600 wire panel, cyber threats, and BTC network. Free upstream, no auth, updates every ~3 hours.

- New Worker route: `/api/hf-propagation`
- New hook: `useHFPropagation.ts`
- New panel: `HFPropagationPanel.tsx`
- New rule in `scripts/audit-feeds.js`
- Layout version bump in `useLayoutManager.ts`
- (Optional) Companion blog post by zer0day

## Data source

- URL: `https://www.hamqsl.com/solarxml.php`
- Format: XML, ~2KB, no auth
- Update cadence: every ~3 hours (solar conditions change slowly)
- Reliability: 15+ year track record, used by N1MM, Ham Radio Deluxe, etc.
- Author: Paul L. Herrman N0NBH

Sample fields used:
- `<solarflux>` — Solar Flux Index (SFI), HF-band proxy. Higher = better
- `<aindex>` / `<kindex>` — Geomagnetic activity. Lower = better
- `<sunspots>` — Sunspot count
- `<xray>` — X-ray class (e.g. "B5.2", "M1.0", "X2.4")
- `<solarwind>` — km/s
- `<geomagfield>` — `INACTIVE` / `QUIET` / `UNSETTLED` / `ACTIVE` / `STORM` / `SEVERE STORM`
- `<muf>` — Maximum Usable Frequency (MHz)
- `<calculatedconditions>` — per-band day/night ratings: `Poor` / `Fair` / `Good`
  - bands: `80m-40m`, `30m-20m`, `17m-15m`, `12m-10m`
- `<calculatedvhfconditions>` — VHF phenomena (E-skip, aurora) by region
- `<updated>` — last refresh timestamp from upstream

---

## Section 1: Worker route `/api/hf-propagation`

**File:** `worker-additions/worker.js`

Add a new handler `handleHFPropagation()` that fetches the XML, parses it via flat regex (no DOMParser in Workers), and returns normalized JSON. Cache for 15 minutes (upstream updates every ~3 hours but we can be more responsive than that).

Insert near other "data tile" handlers. Use the same `getCached`/`setCache`/`getStale`/`fetchWithTimeout` pattern as `handleHumansInSpace` for consistency.

### Response shape

```json
{
  "source": "terminalfeed.io",
  "endpoint": "hf-propagation",
  "updated_at": "2026-05-03T23:30:00.000Z",
  "data": {
    "upstream_updated": "03 May 2026 2300 GMT",
    "sfi": 168,
    "a_index": 5,
    "k_index": 2,
    "sunspots": 89,
    "xray": "B5.2",
    "solar_wind_kms": 411,
    "geomag_field": "QUIET",
    "muf_mhz": 34.4,
    "fof2_mhz": 11.3,
    "signal_noise": "S0-S1",
    "bands": [
      { "name": "80m-40m", "day": "Good", "night": "Fair" },
      { "name": "30m-20m", "day": "Good", "night": "Good" },
      { "name": "17m-15m", "day": "Good", "night": "Fair" },
      { "name": "12m-10m", "day": "Fair", "night": "Poor" }
    ],
    "vhf": [
      { "phenomenon": "E-Skip", "location": "europe", "status": "Band Closed" },
      { "phenomenon": "vhf-aurora", "location": "northern_hemi", "status": "Band Closed" }
    ]
  }
}
```

### Implementation notes

- XML parsing: hand-rolled regex per field. The XML is flat and predictable — no need for an XML parser dependency. Example:
  ```javascript
  function pickTag(xml, tag) {
    var m = xml.match(new RegExp('<' + tag + '>([^<]*)</' + tag + '>'));
    return m ? m[1].trim() : '';
  }
  function pickFloat(xml, tag) { var v = parseFloat(pickTag(xml, tag)); return isNaN(v) ? 0 : v; }
  function pickInt(xml, tag) { var v = parseInt(pickTag(xml, tag), 10); return isNaN(v) ? 0 : v; }
  ```
- For `<calculatedconditions>` band entries, parse each `<band name="..." time="...">value</band>` tuple and group by band name.
- For `<calculatedvhfconditions>`, parse each `<phenomenon name="..." location="...">value</phenomenon>` tuple. Filter to entries where status is NOT "Band Closed" if you want to show only active openings — or include all and let the panel filter.
- Use 8s `fetchWithTimeout` default. hamqsl.com is fast and reliable.
- On failure: return stale cache, then fall back to `{ data: null }`.
- Wire into the route dispatch switch alongside other free routes (search for `case 'cyber-threats':` for the pattern).
- Add `/api/hf-propagation` to the `free_endpoints` list near the top of `worker.js` (around line 850).

### Acceptance for this section

- `npx wrangler deploy` from `worker-additions/` succeeds
- `Invoke-WebRequest https://terminalfeed.io/api/hf-propagation` (or the staging URL) returns the documented JSON shape
- All eight band condition cells are populated with `Good`/`Fair`/`Poor`
- `geomag_field` is one of the documented enum values

---

## Section 2: `src/hooks/useHFPropagation.ts`

Pattern after `useSpaceWeather.ts` or `useGasTracker.ts`. Polling cadence: every 15 minutes (matches Worker cache TTL — no point polling faster).

Required behavior:
- Initial fetch on mount with stagger (use the same stagger pattern as other panels — staggered initial loads at 0/0.5/1.5/3/4.5/6s per CLAUDE.md performance rules)
- Polling: 15 min desktop, 30 min mobile (per CLAUDE.md: doubled intervals on mobile)
- Tab visibility pause: stop polling when document is hidden, resume on visibilitychange
- AbortSignal.timeout(8000) on fetch
- Return shape: `{ data, loading, error, lastUpdate }`
- All fields null-safe: any consumer should be able to call `.toFixed()` without checking for undefined first (per CLAUDE.md panel safety rules)

### Acceptance

- Hook compiles in strict TS, no `any`
- `useEffect` cleanup function clears the interval
- Visibility-aware (pauses when tab hidden)

---

## Section 3: `src/components/panels/HFPropagationPanel.tsx`

New panel component, wrapped in the per-panel ErrorBoundary already used by every other panel (search any existing panel for the wrapping pattern — likely in `src/App.tsx` or a panel index). Use `React.memo`.

### Visual layout

```
┌─ HF PROPAGATION ──────────── 0m ago ─┐
│                                       │
│  SFI 168    SSN 89    A-idx 5  K 2   │
│                                       │
│  Geomagnetic: QUIET                   │
│  Solar wind: 411 km/s   MUF: 34.4 MHz │
│  X-ray: B5.2            Noise: S0-S1  │
│                                       │
│  BAND          DAY    NIGHT           │
│  80m-40m       •Good  •Fair           │
│  30m-20m       •Good  •Good           │
│  17m-15m       •Good  •Fair           │
│  12m-10m       •Fair  •Poor           │
│                                       │
│  VHF: E-Skip EU closed                │
│  VHF: Aurora N closed                 │
└───────────────────────────────────────┘
```

### Color rules

- `Good` / `QUIET` / `INACTIVE`: `#4ADE80` (green)
- `Fair` / `UNSETTLED`: `#EF9F27` (amber)
- `Poor` / `ACTIVE` / `STORM` / `SEVERE STORM`: `#F87171` (red)
- Numeric labels: existing dim text colors (`#8A8880`, `#D4D2CB`)
- Panel border + bg: standard panel chrome (match other panels)

### Critical safety (per CLAUDE.md April 15 incident)

Every numeric field needs a null-safe default before calling any method:

```tsx
// WRONG — crashes if API returns null
{data.sfi.toFixed(0)}

// RIGHT
{(data?.sfi ?? 0).toFixed(0)}
```

The `bands` array map MUST defend every field:

```tsx
{(data?.bands ?? []).map(b => (
  <Row key={b?.name ?? 'unknown'}>
    <span>{b?.name ?? '?'}</span>
    <Dot status={b?.day ?? 'Poor'} />
    <Dot status={b?.night ?? 'Poor'} />
  </Row>
))}
```

### Loading + error states

- Loading: skeleton rows that match the final layout (don't show "Loading..." text — show shimmer placeholders the same shape as the data)
- Error/no data: hide the panel entirely (per CLAUDE.md rule #9 — never show error states to users)
- Stale cache: show with a small dim "stale" badge if the upstream `updated_at` is more than 6h old

### Mobile

- `content-visibility: auto`
- No animations
- Polling interval doubled (30 min)
- Same layout (panel is already compact enough)

### Acceptance

- Panel renders without crashing on `{ data: null }`, `{ data: {} }`, and the full payload
- Wraps in per-panel ErrorBoundary
- `React.memo` on the export
- Height: auto, no fixed heights anywhere

---

## Section 4: Wire into layout

**File:** `src/hooks/useLayoutManager.ts`

- Add `'hf-propagation'` (or whatever id matches the existing convention — check `useLayoutManager.ts` for the panel ID format) to the default panel order. Place it near `space-weather` since they're conceptually adjacent.
- **Bump the layout version constant** so existing users with cached layouts see the new panel (per CLAUDE.md rule #15).

**File:** `src/App.tsx` (or wherever the panel switch lives)

- Add a render case for the new panel id that renders `<HFPropagationPanel />` wrapped in the per-panel ErrorBoundary.
- Add the panel metadata (display name, category, default-visible flag) to whatever registry exists.

### Acceptance

- Panel appears on the live dashboard for new visitors and existing visitors after the version bump
- Panel can be reordered, hidden, and shown via the existing organize-mode controls
- Panel respects the existing presets (Default, Trader, Developer, News, Everything, Random)

---

## Section 5: Add audit rule to `scripts/audit-feeds.js`

Add an entry to the `FEEDS` array so the weekly auditor catches regressions. Pattern after `/api/space-weather`:

```javascript
['/api/hf-propagation', d => {
  const t = new Date(d?.updated_at).getTime();
  if (!t) return BROKEN('no updated_at');
  if (!d?.data?.bands || d.data.bands.length !== 4) return BROKEN(`only ${d?.data?.bands?.length ?? 0} bands`);
  const age = NOW - t;
  return age < hours(2) ? PASS(`SFI ${d.data.sfi}, geomag ${d.data.geomag_field}`) : STALE(`updated ${ageHuman(age)} ago`);
}],
```

### Acceptance

- `npm run audit:feeds` includes `/api/hf-propagation` and reports PASS

---

## Section 6 (optional): Companion blog post

**Author:** zer0day (Wire Wednesday slot fits)
**Slug suggestion:** `/blog/why-ham-radio-still-matters` or `/blog/hf-propagation-explained`
**Target length:** 700-1000 words
**Angle:** Why amateur radio still matters in 2026 — what it does that the internet doesn't, how operators read solar conditions to decide which band to use, and why this kind of "off-grid resilience" is back in conversation alongside self-hosting.

This is optional and can ship later. If shipped, follow the standard content-batch deploy: blog HTML in `/public/blog/`, run `npm run prebuild` to regenerate `blog-latest.json` and the SEO content block, update `feed.xml` and `sitemap.xml`.

---

## Execution order

1. **Section 1** — Worker route + deploy + verify with Invoke-WebRequest
2. **Section 5** — Add audit rule, run `npm run audit:feeds` to confirm PASS
3. **Section 2** — Hook
4. **Section 3** — Panel component
5. **Section 4** — Layout wiring + version bump
6. **Section 6** — (optional) blog post on a separate day

Each section is one commit. Worker MUST be deployed and verified BEFORE the frontend panel is wired up (CLAUDE.md April 15 incident).

## Verification checklist

- [ ] `https://terminalfeed.io/api/hf-propagation` returns JSON matching the documented shape
- [ ] All four bands present with day + night ratings
- [ ] `geomag_field` is one of the documented enum values
- [ ] `npm run audit:feeds` reports the new endpoint as PASS
- [ ] Panel renders on `/` for both desktop and mobile
- [ ] Panel survives `{ data: null }` without crashing the dashboard
- [ ] Panel respects organize mode, presets, and the layout-version bump (existing users see it)
- [ ] No console errors
- [ ] No em dashes in any UI text, blog post, or comment

## What this spec does NOT cover

- DX Cluster spots (separate panel, separate spec — would be the natural next add)
- APRS position feed (separate spec)
- WebSDR audio streaming (out of scope, not how the dashboard works)
- AM/FM internet radio streams (that belongs on `/radio`, not the dashboard)
- A propagation forecast/history chart (just the current snapshot for v1)
- The optional blog post — write later if desired

---

## Note to CC (infrastructure protection rules — read before coding)

You are reading this spec in a fresh session without `CLAUDE.md` context loaded. The site has real users. Before making any change:

1. **NEVER add `@cloudflare/vite-plugin` to this project.** It will destroy the Pages deployment.
2. **NEVER add `wrangler.jsonc` or `wrangler.toml` to the project root.** The only wrangler config allowed is inside `worker-additions/`.
3. **NEVER add `wrangler deploy` or `wrangler dev` as npm scripts.** Pages deploys via git push.
4. **The canonical Worker source is `worker-additions/worker.js` deployed via `worker-additions/wrangler.toml`.** Do NOT edit any other worker file. The orphan subfolder `worker-additions/terminalfeed-api/` is forbidden territory.
5. **Deploy order: Worker first (`cd worker-additions && npx wrangler deploy`), then frontend (git push for Pages auto-deploy).** Never reverse this.
6. **Every panel needs a per-panel ErrorBoundary wrapper.** A single panel crash must NEVER take down the whole dashboard.
7. **Every API field needs a null-safe default before any method call.** `(value ?? 0).toFixed(0)`, never `value.toFixed(0)`.
8. **No em dashes anywhere.** Not in code, comments, UI, blog, or meta. Use commas, periods, or rewrite.
9. **All API calls go through the Worker (`/api/*`).** Never call hamqsl.com directly from the browser.
10. **Cap arrays, clean up effects, React.memo all panels, mobile optimizations** — see CLAUDE.md "Critical Rules for Claude Code" section if unclear.
11. **One change at a time.** Make one change, test, commit, next. Never batch multiple sections into one commit.
