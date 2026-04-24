# Terminalfeed — Visual Spec v2

**Target repo:** `src/` (React 19.2 + Vite 7 + TS 5.9)
**Brief reference:** `claude-design-brief.md` §2 tokens, §4 layout, §5 panels, §6 shapes
**Hard constraints respected:** no new deps, no `vite.config.ts` / `package.json` / `wrangler.toml` changes, `height: auto` panels, CSS columns layout, every panel wrapped in `ErrorBoundary`.

---

## 1. Deliverable format

New JSX components + CSS additions that slot into existing structure. One commit per tile — staged rollout.

## 2. New / refreshed components (7 commits)

| # | Component | Hook(s) used | Replaces | Risk |
|---|---|---|---|---|
| 1 | `BtcHero.tsx` | `useBtcPrice` + `/api/coingecko/btc-chart` | `PricePanel` in default layout | Low — same hook contract |
| 2 | `MarketsPanel.tsx` CSS | `useSimStocks` | inline restyle | None — CSS only |
| 3 | `CryptoPanel.tsx` CSS + row flash | `useSimCrypto` | inline restyle | Low |
| 4 | `StatusWall.tsx` | `useClaudeStatus` + `useCloudStatus` + `useDevStatus` | merges 3 tiles (opt-in via preset) | Medium — composite |
| 5 | `LiveNowPanel.tsx` | `useBtcPrice` + `useWikipediaLive` + `useHackerNews` + `useGithubEvents` + `useEarthquakes` | new tile | Medium |
| 6 | `WorldMap.tsx` | `useEarthquakes` + `useFlightRadar` + `useSpaceLaunches` | new tile | Medium |
| 7 | `WeatherForecastStrip.tsx` | extends `useWeather` output | additive | None |

## 3. BtcHero spec

- `column-span: all` — spans full grid width (safe CSS columns opt-out).
- Left column: big price (44px), change line, 24h high/low/vol, range bar with live marker dot.
- Right column: 24h sparkline SVG from `/api/coingecko/btc-chart`, pulsing gold dot at last point, dashed baseline lines at 25/50/75% of range.
- On tick: `priceFlash` on up, `priceFlashRed` on down.
- Set `defaultSpan: 2` in layout registry for this panel only.

## 4. StatusWall spec

Grid: 6 cols × N rows of cells. Each cell ≈ aspect 1.6:1.
Color mapping by `indicator`:
- `none` → green lamp, `OK` badge, border rgba(74,222,128,0.25)
- `minor` → amber lamp, `DEGR`, border rgba(239,159,39,0.35)
- `major` / `critical` → red lamp, `DOWN`, background rgba(248,113,113,0.04), fast pulse
- `unknown` → dim lamp

Summary row: `OK 11 · DEGRADED 2 · INCIDENTS 0`.
Presented in `preset === 'developer'` layout as replacement for the three separate status tiles.

## 5. LiveNowPanel spec

Unified real-time rail. Merge sources into `{ src, time, body, value }`.
- `BTC` — gold, on WS tick
- `WIKI` — blue, on SSE event (throttled to 1 per 500ms buffer)
- `HN` — amber, on new story
- `USGS` — red, on new quake
- `GH` — purple, on firehose event

Keep 14 events visible, new item fades in top, oldest drops off.

## 6. WorldMap spec

SVG canvas, ~240px tall. Continent mask rendered via dotted grid (no geojson dep).
Ripple pings (`@keyframes wmPing`) per incoming event:
- quake → red, earthquake coords
- flight → cyan, opensky lat/lng
- launch → gold, pad coords

Legend in bottom-left.

## 7. Layout invariants honored

- `.grid { column-count: 4; column-gap: 4px; padding: 4px }` unchanged
- All `.panel` have `break-inside: avoid` and `height: auto`
- Hero uses `column-span: all` (only) — no masonry math broken
- `content-visibility: auto` retained
- `prefers-reduced-motion` disables all marquee tracks

## 8. Motion priority (brief §8)

- WS feeds → `priceFlash` + `livePulse` dot
- Fast poll (15–60s) → subtle `livePulse` only
- Medium poll (2–10min) → `fadeIn` on refresh
- Slow/daily → no motion
- Static bundled → no indicator

## 9. Files touched

New: `src/components/BtcHero.tsx`, `BtcHero.module.css`, `StatusWall.tsx`, `StatusWall.module.css`, `LiveNowPanel.tsx`, `LiveNowPanel.module.css`, `WorldMap.tsx`, `WorldMap.module.css`, `WeatherForecastStrip.tsx`.
Edit: `src/App.tsx` (wire new components), `src/App.css` (token-consistent additions only).
Untouched: `package.json`, `vite.config.ts`, `wrangler.toml`, `worker-additions/**`.
