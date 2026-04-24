# TerminalFeed.io — Claude Design brief

Everything Claude Design needs to produce a drop-in visual spec for the
TerminalFeed homepage. Generated 2026-04-17 from a live repo scan and live
API calls. Pair this with CLAUDE.md at the repo root for project-level
rules.

---

## 1. Stack & hard constraints

**Stack:** React 19.2 + Vite 7 + TypeScript 5.9. Global CSS in `src/index.css`
and `src/App.css`, plus CSS Modules for a handful of panels
(`*.module.css`). No Tailwind, no styled-components. No CSS-in-JS runtime.

**Package footprint:** production deps are exactly `react` and `react-dom`.
Everything else is dev-only. **Do not add any new runtime dependencies.**
Especially do not add:

- `@cloudflare/vite-plugin` — destroyed the project on 2026-04-15
- any new bundler plugin
- any CSS framework / preprocessor
- any chart library (roll charts in SVG or canvas, see hero BTC chart below)

**Don't touch:** `vite.config.ts`, `package.json` dependency list,
`wrangler.toml`, `worker-additions/**`. No root-level wrangler/vite config
files. Specs that request new runtime dependencies, new build tools, or any
Cloudflare config changes will be rejected.

**Panel layout invariants (absolute, from Apr 15 incident):**

- Panels MUST be `height: auto`. No `min-height`, no fixed height, no
  `flex-grow`. Panels shrink to fit their content.
- Main layout is CSS **columns** (`column-count`), NOT CSS Grid. Grid has
  been tried and produces uneven gaps. Claude Design may propose Grid-like
  visual effects within individual tiles but the top-level layout stays
  columns.
- Every panel is wrapped in an `ErrorBoundary`. A design that adds runtime
  risk (deep nested contexts, new reconciliation patterns) must not break
  that isolation.

**Design-time rule of thumb:** new visuals are CSS + JSX reorganizations of
existing hook outputs. No new data fetching, no new build steps.

---

## 2. Brand tokens (verbatim from `src/index.css`)

```css
:root {
  --bg:          #080808;   /* page background */
  --bg-panel:    #0D0D0F;   /* panel surface */
  --bg-hover:    #131318;   /* hover state */
  --border:      #1A1A22;   /* default borders */
  --border-glow: #252530;   /* emphasized borders */
  --text:        #C8C8C0;   /* default body text */
  --text-mid:    #7A7A72;   /* secondary */
  --text-dim:    #3E3E3A;   /* tertiary, timestamps */
  --green:       #4ADE80;   /* positive, LIVE */
  --green-dim:   #166534;
  --red:         #F87171;   /* negative, outage */
  --red-dim:     #991B1B;
  --amber:       #EF9F27;   /* warning, STALE */
  --gold:        #F9CB42;   /* BTC accent */
  --blue:        #60A5FA;   /* info / tools link */
  --purple:      #A78BFA;   /* AI Hub / agent */
  --cyan:        #4FD1C5;   /* accents */
  --mono:        'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

**Font stack:** JetBrains Mono everywhere. No sans-serif anywhere on the
page (intentional — it's the whole look).

**Body background has a 120s ambient shift** between 4 near-black shades
(`#080808 → #08090b → #090809 → #080908`). Keep it.

**Global overlays** (both fixed, pointer-events: none):

- CRT scanlines on `#root::after`: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.04) 2px, rgba(0,0,0,.04) 4px)`.
- Subtle green top/bottom phosphor glow on `#root::before`:
  `linear-gradient(180deg, rgba(74,222,128,.04) 0%, transparent 3%, transparent 97%, rgba(74,222,128,.02) 100%)`.

**Selection color:** green accent on rgba(74,222,128,.2) background.

**Scrollbars:** 3px wide, thumb `var(--border-glow)`, track transparent.

---

## 3. Motion vocabulary (already defined, reuse these)

```css
@keyframes pulse        /* 0%,100% opacity 1 ↔ 50% opacity .4    — for LIVE dots, slow feeds */
@keyframes blink        /* 0%,100% opacity 1 ↔ 50% opacity 0    — terminal cursor only */
@keyframes fadeIn       /* opacity 0 + translateY(4px) → 0      — panel enter */
@keyframes priceFlash   /* green 12% → transparent              — price tick up */
@keyframes priceFlashRed/* red 12% → transparent                — price tick down */
@keyframes livePulse    /* 2s ease, opacity 1 ↔ .3              — LIVE indicator */
@keyframes ambientShift /* 120s body color drift                — already global */
```

**Respect `prefers-reduced-motion`**: existing `.tickerTrack` and
`.activityTrack` already honor it. Any new scrolling/moving element must
include the same guard.

---

## 4. Layout structure (what's there now)

```
┌─ topBar ─────────────────────────────────────────────────────────┐
│ logo  nav links (Live | Tools | Agent | Radio | Wifi)   date time│
├─ tickerBar (scrolling prices, 28px tall) ─────────────────────────┤
├─ sportsTickerBar (scrolling scores, optional) ────────────────────┤
├─ grid (CSS columns, 4 cols desktop → 3 ≤1400px → … → 1 ≤900px) ──┤
│                                                                   │
│ [panel] [panel] [panel] [panel]  ← masonry packs by height        │
│ [panel] [panel] [panel]                                           │
│ [panel]                                                           │
│                                                                   │
├─ status bar with world clocks (bottom) ───────────────────────────┤
└───────────────────────────────────────────────────────────────────┘
```

Grid rule: `.grid { column-count: 4; column-gap: 4px; padding: 4px; }`.
Panel gutter is 4px (tight — terminal density is intentional).

**Organize mode** (user dragging panels) switches the grid to flex for
predictable target positions. Claude Design shouldn't need to touch this
mode — it already works.

**Panel presets** the user can apply at runtime: `everything`, `trader`,
`developer`, `crypto`. These just change `hiddenPanels`. Every tile should
look good at any width the masonry gives it (panels are always 1 column
wide currently, `defaultSpan: 1` across the board).

---

## 5. Panel catalog (the important table)

All 47 panels, in default visual order. "Hook" is the React hook feeding the
tile. "Source" is the ultimate data origin. "Via Worker" means the tile
calls `/api/*` on our Cloudflare Worker rather than an external origin
(preferred pattern — see CLAUDE.md rule #6).

| # | ID | Label | Hook | Source | Via Worker | Cadence | Kind |
|---|---|---|---|---|---|---|---|
| 1 | `bitcoin` | Bitcoin Price | `useBtcPrice` | Binance WS + `/api/btc-price` | Hybrid | WS ~1s / REST 10–60s | Number + sparkline |
| 2 | `markets` | Markets (US) | `useSimStocks` | `/api/stocks?symbols=…` (Finnhub) | Yes | 30s / 60s mobile | Table of tickers |
| 3 | `crypto` | Crypto | `useSimCrypto` | CoinCap WS + `/api/coingecko/markets` (CoinLore) | Hybrid | WS ~1s / REST 120s | Table of tickers |
| 4 | `btc-network` | BTC Network | `useBtcNetwork` | mempool.space directly | No | 30s | Stats card |
| 5 | `gas` | ETH Gas | `useGasTracker` | `/api/gas` (Etherscan) | Yes | 15s | 3 numbers |
| 6 | `meme-radar` | Memecoin Radar | `useMemecoinRadar` | `/api/meme-radar` (DexScreener) | Yes | 60s | Token list |
| 7 | `market-hours` | Market Hours | `useMarketHours` | computed locally | — | 1 min | Exchange status list |
| 8 | `news` | Tech / AI Feed | `useRSSNews` | rss2json aggregator | No | 5 min | Headline list |
| 9 | `tech-news` | Tech News | `useRSSNews` variant | rss2json | No | 5 min | Headline list |
| 10 | `reddit` | Reddit | `useRedditTech` | rss2json (reddit RSS) | No | 2 min | Post list w/ score |
| 11 | `github` | GitHub Trending | `useGithubTrending` | github search/trending | No | 5 min | Repo list |
| 12 | `claude-status` | Claude Status | `useClaudeStatus` | `/api/claude-status` | Yes | 60s | Component grid |
| 13 | `cloud-status` | Cloud Status | `useCloudStatus` | `/api/cloud-status` | Yes | 3 min | 3-provider card |
| 14 | `dev-status` | Dev/Ops Status | `useDevStatus` | `/api/service-status` | Yes | 2 min | 13-service grid |
| 15 | `flight-radar` | Flight Radar | `useFlightRadar` | opensky-network direct | No | 30s | Count + sample list |
| 16 | `stackoverflow` | Stack Overflow | `useStackOverflow` | stackexchange api | No | 5 min | Question list |
| 17 | `seismic` | Earthquakes | `useEarthquakes` | USGS geojson direct | No | 5 min | Event list |
| 18 | `weather` | Weather | `useWeather` | `/api/weather` (Open-Meteo) | Yes | 10 min | Living scene + forecast |
| 19 | `launches` | Space Launches | `useSpaceLaunches` | rocketlaunch.live + TheSpaceDevs | No | 1 hour | Countdown list |
| 20 | `daily-learn` | Daily Learn | static (`techTerms`) | bundled | — | daily | Glossary card |
| 21 | `podcasts` | Podcasts | `usePodcasts` | rss2json | No | 30 min | Episode list |
| 22 | `uap` | UAP Sightings | static (`uapSightings`) | bundled | — | static | List + stats |
| 23 | `predictions` | Prediction Markets | `usePredictionMarkets` | `/api/predictions` (Polymarket) | Yes | 5 min | Market rows w/ odds |
| 24 | `tcg-market` | TCG Market Watch | `useTCGMarket` | ygoprodeck direct | No | 1 hour | Card prices |
| 25 | `steam` | Steam Games | `useSteamGames` | `/api/steam` (SteamSpy) | Yes | 1 hour | Game list |
| 26 | `ai-hub` | AI Hub | `useAIHub` | `/api/ai-stats` | Yes | 30s | API usage stats |
| 27 | `the-wire` | The Wire | `useWire` | bundled rotating quotes | — | rotates 30s | Quote card |
| 28 | `wiki-live` | Wikipedia Live | `useWikipediaLive` | Wikimedia EventStreams SSE | Direct SSE | real-time | Scrolling edit feed |
| 29 | `disasters` | Global Alerts | `useGDACS` | `/api/disaster-alerts` | Yes | 15 min | Alert list |
| 30 | `gh-events` | GitHub Live | `useGithubEvents` | github events api | No | 1 min | Activity scroll |
| 31 | `books` | Trending Books | `useTrendingBooks` | openlibrary / nyt | No | 6 hours | Book covers + titles |
| 32 | `forex` | Forex Heatmap | `useForexHeatmap` | `/api/forex` (Frankfurter) | Yes | 10 min | 15 pairs grid |
| 33 | `hn-community` | Show/Ask HN | `useHNShowAsk` | HN firebase direct | No | 5 min | Story list |
| 34 | `wikipedia` | Wikipedia | `useWikipedia` | en.wikipedia featured | No | daily | Single article card |
| 35 | `producthunt` | Product Hunt | `useProductHunt` | PH RSS via rss2json | No | 1 hour | Product list |
| 36 | `ai-leaderboard` | AI Leaderboard | static (`aiLeaderboard`) | bundled | — | static | Ranked models |
| 37 | `bluesky` | Bluesky | `useBluesky` | bsky firehose/api | No | 1 min | Post list |
| 38 | `internet-pulse` | Internet Pulse | `useInternetPulse` | computed / derived | — | 5s | Health gauge |
| 39 | `nasa-apod` | NASA Photo | `useNasaApod` | `/api/nasa-apod` | Yes | 1 hour | Photo + caption |
| 40 | `good-news` | Good News | `useGoodNews` | rss2json | No | 1 hour | Headline list |
| 41 | `trending-movies` | Trending Movies | `useTrendingMovies` | themoviedb.org direct | No | 1 hour | Poster + rating list |
| 42 | `npm-trends` | NPM Trends | `useNpmTrends` | npmjs.org/downloads | No | 1 hour | Bar list by downloads |
| 43 | `museum-art` | Museum Art | `useMuseumArt` | api.artic.edu direct | No | 6 hours | Image + caption |
| 44 | `daily-paws` | Daily Paws | `useDailyPaws` | thecatapi + dog.ceo | No | 1 hour | Random pet image |
| 45 | `recipe` | Tonight's Recipe | `useRecipe` | themealdb.com direct | No | daily | Meal card |
| 46 | `humans-in-space` | Humans In Space | `useHumansInSpace` | `/api/humans-in-space` | Yes | 1 day | Crew list |
| 47 | `this-day` | This Day In History | `useThisDay` | wikipedia api | No | daily | Event list |
| 48 | `originals` | TF Originals | reads `/blog-latest.json` | prebuild output | — | build-time | Rotating article cards |

There's also a top **ticker bar** (continuously scrolling stock + crypto
prices from `useSimStocks` + `useSimCrypto`) and a **sports ticker bar**
from `useSportsScores` (ESPN). Ticker is always visible, not in the grid.

**World clocks bar** at the bottom (useWorldClock) is also always visible.

---

## 6. Live data shapes (actual JSON from production)

All Worker endpoints are under `https://terminalfeed.io/api/*`, CORS open
(`Access-Control-Allow-Origin: *`), so Claude Design can hit them directly
while prototyping.

### Worker endpoints (preferred source)

```jsonc
// GET /api/btc-price
{
  "data": {
    "price_usd": 77047.92,
    "change_24h_percent": 2.7,
    "high_24h": 78333,
    "low_24h": 74529.4,
    "volume_24h": 1985029051.65
  }
}

// GET /api/stocks?symbols=SPY,QQQ,AAPL,NVDA,TSLA    (or no params → top 15)
{
  "data": [
    { "symbol": "AAPL", "price": 270.23, "change": 6.83,
      "change_percent": 2.593, "high": 272.30, "low": 266.72,
      "prev_close": 263.40 }
    // … up to 30 items
  ],
  "ts": 1776472654418
}

// GET /api/coingecko/markets   (top 30 by market cap, CoinGecko-shaped)
{
  "data": [
    { "id": "bitcoin", "symbol": "btc", "name": "Bitcoin",
      "current_price": 77450.74, "price_change_percentage_24h": 3.39,
      "market_cap": 1546757356947, "total_volume": 62800616123,
      "image": null }
  ],
  "ts": 1776472654418
}

// GET /api/coingecko/global
{
  "data": {
    "active_cryptocurrencies": 14573,
    "total_market_cap": { "usd": 5211014288702 },
    "total_volume":     { "usd":  198655762441 },
    "market_cap_percentage": { "btc": 29.59, "eth": 5.69 },
    "market_cap_change_percentage_24h_usd": 2.7
  },
  "ts": 1776472654418
}

// GET /api/coingecko/btc-chart   (24h at 15-minute candles)
{
  "prices": [[1776150900000, 74705.83], [1776151800000, 74536.00], /* 96 points */],
  "ts": 1776472654418
}

// GET /api/coingecko/gold
{
  "data": [{ "id": "pax-gold", "symbol": "paxg", "name": "PAX Gold",
             "current_price": 4819.35, "price_change_percentage_24h": 0.89 }],
  "ts": 1776472654418
}

// GET /api/fear-greed
{ "data": { "value": 26, "label": "Fear", "timestamp": "1776470400" } }

// GET /api/predictions
{ "data": [
    { "question": "Hornets vs. Magic", "yes_percent": 10, "volume_usd": 4194792 },
    { "question": "Strait of Hormuz traffic returns to normal by end of April?",
      "yes_percent": 37, "volume_usd": 3667458 }
  ] }

// GET /api/service-status   (13 services)
{ "data": [
    { "name": "GitHub", "indicator": "none",  "description": "All Systems Operational" },
    { "name": "Cloudflare","indicator":"minor","description": "Minor Service Outage" }
    // indicators: "none" | "minor" | "major" | "critical" | "unknown"
  ] }

// GET /api/claude-status   (proxies status.claude.com/api/v2/summary.json raw)
{
  "page": { "name": "Claude", "url": "https://status.claude.com" },
  "components": [
    { "id": "rwppv331jlwc", "name": "claude.ai", "status": "operational" }
    // status: "operational" | "degraded_performance" | "partial_outage" | "major_outage"
  ],
  "incidents": [ /* array of active incidents */ ]
}

// GET /api/cloud-status
{ "providers": [
    { "name": "AWS",          "status": "unknown",     "incidents": [] },
    { "name": "Google Cloud", "status": "operational", "incidents": [] },
    { "name": "Azure",        "status": "operational", "incidents": [] }
    // status: "operational" | "incident" | "unknown"
  ] }

// GET /api/gas
{ "low": 8, "standard": 12, "fast": 18, "baseFee": 7, "lastBlock": 0, "ts": 1776472658727 }

// GET /api/meme-radar   (note: TOP-LEVEL array, not {data: [...]})
[ { "name": "…", "symbol": "…", "chain": "solana",
    "icon": "…", "url": "https://dexscreener.com/…", "totalAmount": 100 } ]

// GET /api/earthquake
{ "data": [
    { "magnitude": 5.1, "place": "127 km WNW of Ternate, Indonesia",
      "time": 1776468577922, "url": "https://earthquake.usgs.gov/...",
      "coordinates": [126.32, 1.20, 35.0] }
  ] }

// GET /api/hackernews
{ "data": [
    { "id": 47806725, "title": "Claude Design", "url": "https://www.anthropic.com/...",
      "score": 809, "by": "meetpateltech", "time": 1776438249, "descendants": 537 }
  ] }

// GET /api/forex
{ "data": { "base": "USD", "date": "2026-04-17",
            "rates": { "AUD": 1.39, "EUR": 0.85, "GBP": 0.74, "JPY": 159.13, /* … */ } } }

// GET /api/humans-in-space
{ "data": { "count": 12,
            "people": [ { "name": "Oleg Kononenko", "craft": "ISS" } ] } }

// GET /api/disaster-alerts
{ "data": [
    { "type": "EQ", "name": "Earthquake in Indonesia",
      "alert_level": "Green", "country": "Indonesia",
      "date": "2026-04-17T23:21:29", "url": "https://www.gdacs.org/..." }
  ] }

// GET /api/launches                  (5 upcoming; may be empty)
{ "data": [ /* same shape as TheSpaceDevs 2.3.0: name, net, pad, provider */ ] }

// GET /api/steam
{ "data": [ { "name": "Counter-Strike: Global Offensive", "players_now": 1013936 } ] }

// GET /api/nasa-apod                 (may 404 between 10am ET publishes)
{ "data": { "title": "…", "url": "…", "hdurl": "…", "explanation": "…",
            "media_type": "image" | "video", "date": "YYYY-MM-DD" } }

// GET /api/briefing                  (consolidated world snapshot for AI agents)
{ "source": "terminalfeed",
  "generated_at": "2026-04-18T00:38:05Z",
  "sections": { /* btc, stocks, earthquakes, fear_greed, etc. */ } }

// GET /api/ai-stats                  (this Worker's own usage)
{ "totalHits24h": 1196 }
```

### Direct (non-Worker) endpoints — sample shapes

These are called from the browser directly. Shapes are summarized; hit
them live if you need more detail.

- **mempool.space** (`useBtcNetwork`): `/api/v1/fees/recommended`,
  `/api/blocks/tip/height`, `/api/mempool`. Returns integers + small objects.
- **USGS earthquake** (`useEarthquakes`):
  `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson`
  → standard GeoJSON with `features[].properties.mag/place/time/url`.
- **Frankfurter / Open-Meteo** — standard.
- **HN Firebase** (`useHackerNews`, `useHNShowAsk`): `topstories.json` →
  array of IDs; then `/v0/item/{id}.json` → `{id, title, url, score, by,
  time, descendants}`.
- **Wikimedia EventStreams** (`useWikipediaLive`): SSE stream at
  `https://stream.wikimedia.org/v2/stream/recentchange`. Each event is JSON
  with `{title, user, bot, server_name, length, timestamp}`. Buffered and
  flushed every 500ms.
- **opensky-network** (`useFlightRadar`): `/api/states/all` → `{states:
  [[icao24, callsign, origin_country, lng, lat, altitude, ...]]}`. 17 indexed
  fields per aircraft.
- **Reddit** via rss2json: `{items: [{title, link, pubDate, author}]}`.
- **CoinCap WebSocket** (`useSimCrypto`): connect to
  `wss://ws.coincap.io/prices?assets=ethereum,solana,…`; messages are
  `{assetId: priceString}` deltas.

---

## 7. Hero tier / importance weighting

From `CLAUDE.md` the **locked top row** on desktop historically is:

1. **Weather** — living sky scene (day/night, palm trees for LA). Visual
   showpiece.
2. **BTC Price** — biggest number on the page, live WS, flashing ticks.
3. **Tech/AI News Feed** — headline density.
4. **Dev/Ops Status + Markets** — operational at-a-glance.

These four are the **hero tier**. Everything else earns its spot through
use. Heat-ordering (`applyHeatOrder` in `useLayoutManager`) moves
user-actually-used panels upward automatically.

If you're ranking for "where should a giant card go", treat these as
candidates:

- **Hero cards (big, chart-forward, ~2× normal tile):** bitcoin, markets,
  crypto, weather, predictions.
- **Feature cards (visual, medium):** nasa-apod, museum-art, daily-paws,
  launches, seismic.
- **Dense list cards (terminal-native, default size):** news, reddit,
  github, stackoverflow, hackernews, hn-community, dev-status, claude-status,
  podcasts, producthunt, this-day.
- **Stat-micro cards (could shrink):** gas, fear-greed, humans-in-space,
  ai-hub, internet-pulse, market-hours.

You can safely propose a 2-column-wide hero treatment for BTC+chart —
the layout manager supports `defaultSpan` but it's currently always 1.
Setting one tile to `defaultSpan: 2` is a low-risk change.

---

## 8. Behavior quirks (motion priority)

**Real-time (deserves tick-flashes / pulse):**
- `useBtcPrice` — Binance WS every ~1s desktop, 3s mobile. Use priceFlash.
- `useSimCrypto` — CoinCap WS. Use priceFlash per row.
- `useWikipediaLive` — SSE. New items animate in.
- `useSimStocks` — polled every 30s (was WS, intentionally downgraded to
  REST via Worker). Treat as fast-poll, not true real-time.

**Fast poll (every 15–60s):** `useGasTracker`, `useAIHub`, `useGithubEvents`,
`useMemecoinRadar`, `useFlightRadar`, `useBtcNetwork`. A subtle breathing
pulse on the LIVE dot is enough.

**Medium poll (2–10 min):** most list feeds. No motion; just let content
refresh.

**Slow (hourly / daily):** `useNasaApod`, `useHumansInSpace`, `useRecipe`,
`useThisDay`, `useWikipedia`, `useGoodNews`, `useTrendingMovies`,
`useSpaceLaunches`. No motion at all — these are "card of the day" moments.

**Static (bundled data):** `useWire`, `aiLeaderboard`, `uapSightings`,
`techTerms`, podcasts list. No indicator needed.

**Mobile overrides already in place (keep them):**
- `content-visibility: auto` on every panel.
- BTC WS throttled 3s, Wikipedia SSE throttled 3s, polling intervals
  doubled, weather + matrix animations disabled, max 8 items per feed,
  tickers pause when scrolled past.

---

## 9. Existing component primitives

Reusable in `src/components/`:

- `Panel.tsx` + `Panel.module.css` — standard panel shell.
- `PanelHead.tsx` — title row with optional stale badge.
- `PanelErrorBoundary.tsx` — wrap around each tile. MANDATORY.
- `PricePanel.tsx` + css — existing BTC-style hero treatment.
- `BtcMiniChart.tsx` — SVG sparkline generator (feeds from priceHistory
  returned by `useBtcPrice`).
- `LiveChart.tsx` — reusable line chart (SVG).
- `BlockPanel.tsx` + css — BTC network stats card.
- `FearGreedPanel.tsx` + module css — gauge component.
- `NewsPanel.tsx` + module css — headline list.
- `OriginalsPanel.tsx` — blog article rotator.
- `LazyPanel.tsx` — IntersectionObserver-gated wrapper.
- `LoadingOrHide.tsx` — shows a label for N ms then returns null (use for
  empty-state placeholders that would otherwise get stuck).

A design spec should ideally deliver as JSX + CSS updates that slot into
these (or add siblings). New primitives are fine if they follow the same
naming pattern.

---

## 10. What to prune / merge (my editorial take — you decide)

No panels are currently slated for removal. Fitness was already removed
April 2026. Candidates to consider, in descending "maybe":

- `good-news`, `recipe`, `daily-paws` — low-signal, niche. Candidates for
  a single "human moment" rotating card if you want to reduce tile count.
- `hn-community` + `news` + `tech-news` — three headline lists, some
  overlap. Could unify into one "feed" with source filters.
- `gh-events` + `github` — both show GitHub activity. The first is
  firehose-style, the second is trending. Could merge into tabs.
- `wiki-live` + `wikipedia` + `this-day` — three Wikipedia surfaces.
  Probably deliberate, but a single "From Wikipedia" panel with tabs
  could tighten this.

The user's call. Leave anything ambiguous alone.

---

## 11. What to add (ideas, not prescription)

- A truly massive hero BTC card (2 columns wide, big sparkline with
  candles, 24h range bar, volume). The data is already all there in
  `useBtcPrice` + `/api/coingecko/btc-chart`.
- A world map surface — plot earthquakes, flights, and launches on one
  canvas/SVG. All three feeds have lat/lng.
- A unified "Status" supercard — the three status panels (claude-status,
  cloud-status, dev-status) visualized as a traffic-light wall.
- A "live right now" column on the left that ONLY shows real-time
  feeds (BTC ticks, Wikipedia edits, HN story count changes) — the
  moving parts in one concentrated place.

---

## 12. How to deliver the spec

A good spec from Claude Design:

1. Uses only existing hooks (`use*`) or asks if a new hook should be
   added — it shouldn't write new data fetching logic.
2. Ships as **component + CSS changes** inside `src/`. Ideally a new
   component file per new tile, plus the JSX wiring in `src/App.tsx`,
   plus CSS in `src/App.css` or a new module.
3. Respects the layout invariants: `height: auto`, CSS columns, no fixed
   heights.
4. Does NOT touch `package.json`, `vite.config.ts`, any wrangler file, or
   anything in `worker-additions/`.
5. Groups changes small enough to commit one tile at a time, so the
   rollout can be staged and any regression is isolated to one commit.

CC will execute the spec commit-by-commit with a typecheck + build + live
smoke test between each, same pattern we've been running.

---

## 13. Verified-working live URLs (for prototyping)

- Live site: https://terminalfeed.io
- Live Worker (CORS open, hit directly): https://terminalfeed.io/api/*
- OpenAPI spec: https://terminalfeed.io/openapi.json
- AI discovery: https://terminalfeed.io/llms.txt
- RSS feed: https://terminalfeed.io/feed.xml
- Briefing (one-shot world snapshot): https://terminalfeed.io/api/briefing

Hit `/api/briefing` once for a consolidated world snapshot without caring
about individual endpoints.
