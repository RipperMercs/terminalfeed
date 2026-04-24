# CC Spec — Per-Panel SEO (H2 + Anchor + Hidden Description)

**Date:** April 22, 2026
**Priority:** MEDIUM (extracted from `cc-spec-seo-haul.md` Section 3; runs independently after stuck-panels fix)
**Scope:** Add an SEO-crawlable header to every real-time panel: H2 title with keyword-rich phrasing, stable anchor ID, short hidden description the crawler reads but the human eye doesn't emphasize. Ships in batches of ~8 panels per commit.

---

## Executive Summary

TerminalFeed's 30+ panels are the product, but they are invisible to Google. Everything interesting is rendered by React after page load, so Googlebot sees empty panel shells. The existing static SEO block covers homepage keywords but not per-panel ones. This spec gives every panel a structured header that crawlers can index, while staying visually consistent with the terminal aesthetic.

The goal: rank for feed-level queries like "Fear Greed Index Live," "Live Prediction Markets," "Real-Time Earthquake Map," "Free ETH Gas Tracker," "Live Forex Rates," etc. Each panel becomes its own crawlable sub-surface of the homepage.

**What gets added to every panel:**

1. A stable anchor ID on the panel container (`data-panel-id="fear-greed"` already exists; add `id="panel-fear-greed"` for fragment linking).
2. An `<h2>` or semantic heading inside each panel with keyword-optimized text.
3. A short hidden SEO description (2-3 sentences) that the crawler reads, styled with `visibility:hidden` positioning or wrapped in a `<span class="sr-only">` pattern that Google reads but screen readers handle appropriately.

**What does NOT change:** panel visual layout, data rendering, interaction, or any behavior. The additions are markup-only and do not shift pixels.

---

## Gate

**Do not start this spec until `cc-spec-stuck-panels.md` has landed and the re-audit shows zero `loading...` placeholders.** Per-panel SEO on broken panels propagates the same React render bug into new markup that also won't render.

---

## Sections

### 1. Shared pattern: the panel header component

Define a single reusable component (React, TS) that every panel wraps itself with. This avoids drift across 39 panel implementations.

Proposed API:

```tsx
// src/components/panels/PanelHeader.tsx
interface PanelHeaderProps {
  title: string;        // visible H2 text, keyword-rich
  anchorId: string;     // stable slug, e.g. "fear-greed"
  seoDescription: string; // 2-3 sentence crawl target, hidden visually
}

export function PanelHeader({ title, anchorId, seoDescription }: PanelHeaderProps) {
  return (
    <>
      <h2 id={`panel-${anchorId}`} className="panel-title">{title}</h2>
      <span className="panel-seo-description">{seoDescription}</span>
    </>
  );
}
```

CSS for `.panel-seo-description`: use the accessibility `.sr-only` pattern so the text is in the DOM, crawlable by Googlebot, but not visually rendered.

```css
.panel-seo-description {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

The visible `.panel-title` styling must match the existing panel title appearance — do not introduce a new visual heading style. If panels currently use a `<div class="panel-title">`, upgrade to `<h2 class="panel-title">` with identical CSS.

Ship the component + CSS in a single commit. No panels wired up yet.

Commit: `feat: add PanelHeader component for per-panel SEO markup`.

### 2. Panel keyword mapping (authoritative)

This table is the source of truth. Each batch commit below wires panels according to this mapping. Review with Evan before execution if any phrasing feels off-brand.

| Panel ID | Title (H2) | Target Keywords | SEO Description |
|---|---|---|---|
| btc-price | Live Bitcoin Ticker | bitcoin ticker, live btc price, real-time bitcoin | Real-time Bitcoin price updated every second from Binance WebSocket with REST fallback. Free live BTC ticker, no signup. |
| crypto | Crypto Top Movers | crypto movers, top gainers losers, live crypto prices | Live crypto prices and 24-hour top movers across major coins, sorted by percentage change. Data from CoinGecko. |
| fear-greed | Crypto Fear and Greed Index Live | fear greed index, crypto sentiment, btc fear index | Live Crypto Fear and Greed Index updated hourly from Alternative.me. Track market sentiment from extreme fear to extreme greed in real-time. |
| predictions | Live Prediction Markets | polymarket live, prediction markets, election odds | Real-time Polymarket prediction market odds on politics, elections, economics, and current events. Live prices pulled from the Polymarket Gamma API. |
| gas | ETH Gas Tracker | eth gas tracker, ethereum gas price, gwei tracker | Live Ethereum gas prices in gwei with low, standard, and fast tiers. Free ETH gas tracker sourced from Etherscan, updated every 15 seconds. |
| btc-network | Bitcoin Network Status | bitcoin mempool, btc hashrate, block height | Live Bitcoin network health: mempool size, unconfirmed transactions, hashrate, block height, and fee estimates from mempool.space. |
| crypto-market-global | Crypto Market Cap Live | total crypto market cap, btc dominance, 24h volume | Total cryptocurrency market capitalization, Bitcoin dominance percentage, and 24-hour global trading volume. Aggregated from CoinGecko. |
| whale-watch | Bitcoin Whale Watch | large btc transactions, whale alert, bitcoin whales | Track large Bitcoin transactions as they clear on-chain. Real-time whale watch for high-value transfers on the Bitcoin network. |
| stocks / markets | Live Stock Prices | live stock ticker, top us stocks, real-time stocks | Real-time US stock prices for the largest companies by market cap. Live quotes from Finnhub, refreshed every minute during market hours. |
| forex | Live Forex Rates | forex rates, currency exchange rates live, fx ticker | Real-time foreign exchange rates across major currency pairs. Free live forex data sourced from Frankfurter. |
| commodities | Commodities Prices Live | gold price live, oil price ticker, commodity prices | Live commodity prices including gold, silver, oil, and other major futures. Real-time commodity ticker. |
| economic-data | Economic Indicators | fed funds rate, cpi live, unemployment rate | Live US economic indicators including the federal funds rate, CPI inflation, and unemployment rate. Data from the St. Louis Fed FRED API. |
| market-hours | Global Market Hours | stock market hours, market open close, global exchanges | Real-time open/closed status of major global stock exchanges. Check if NYSE, LSE, Tokyo, Hong Kong, and other markets are currently trading. |
| seismic | Live Earthquake Map | earthquake tracker, real-time earthquakes, seismic activity | Real-time earthquake data from USGS and Seismic Portal. Live global seismic activity with magnitude, depth, and location. |
| disasters | Global Disaster Alerts | disaster alerts, natural disasters live, gdacs alerts | Live natural disaster alerts from GDACS including floods, fires, storms, and volcanic activity. Real-time global disaster monitoring. |
| launches | Upcoming Space Launches | space launches, rocket launch schedule, spacex launch | Real-time upcoming rocket launch schedule from SpaceX, NASA, and global space agencies. Data from The Space Devs. |
| humans-in-space | Humans Currently in Space | astronauts in space, iss crew, current astronauts | Live roster of astronauts currently in orbit on the ISS and other spacecraft. Real-time crew tracking from Open Notify. |
| nasa-apod | NASA Picture of the Day | astronomy picture of the day, nasa apod, daily space image | Daily astronomy picture from NASA's Astronomy Picture of the Day archive. Fresh space image each day with official NASA caption. |
| weather | Live Weather | live weather, weather dashboard, real-time weather | Real-time local weather with temperature, conditions, and forecast from Open-Meteo. Free weather data, no API key required. |
| tech-news | Live Tech News | tech news feed, hacker news live, tech headlines | Live technology news aggregated from Hacker News and major tech publications. Real-time headlines refreshed continuously. |
| hn-community / hackernews | Hacker News Top Stories | hacker news top stories, hn front page, hn live | Real-time top stories from Hacker News front page. Live HN feed with scores, comments, and discussion links. |
| reddit | Reddit Live Feed | reddit live, reddit feed, top reddit posts | Real-time posts from major subreddits. Live Reddit feed covering tech, crypto, news, and discussion. |
| github | GitHub Trending | github trending, trending repos, popular github | Live GitHub trending repositories updated in real-time. Track the most starred projects across all languages. |
| gh-events | Live GitHub Activity | github events live, coding activity, github firehose | Real-time GitHub event stream showing live coding activity, pushes, pull requests, and repository creation across the platform. |
| stackoverflow | Stack Overflow Hot Questions | stack overflow hot, live dev questions, trending programming | Live hot questions from Stack Overflow across programming languages. Real-time developer Q&A trending feed. |
| wiki-live / wikipedia | Wikipedia Live Edits | wikipedia live edits, wiki stream, real-time wikipedia | Live Wikipedia edit stream via Wikimedia's SSE event stream. Watch every edit across Wikipedia in real-time. |
| this-day | This Day in History | this day in history, on this date, history today | Daily historical events from Wikipedia covering births, deaths, and notable events on this date throughout history. |
| cyber-threats | Live Cyber Threats | cyber threat intel, live malware, ioc feed | Live malware and cyber threat intelligence from URLhaus, ThreatFox, and CISA. Real-time indicators of compromise. |
| claude-status / cloud-status / service-status | Cloud Service Status | is github down, cloudflare status, openai down | Live status of major cloud services: GitHub, Cloudflare, Discord, OpenAI, Vercel, npm, Reddit, Atlassian, Anthropic. Real-time "is it down" tracker. |
| steam | Steam Top Games | steam most played, top steam games, steam charts | Live Steam most-played games ranked by concurrent players. Real-time Steam charts from SteamSpy. |
| podcasts | Tech Podcasts | tech podcasts, developer podcasts, latest podcasts | Latest tech and developer podcast episodes. Curated real-time feed from major tech podcasts. |
| ai-hub | AI API Hub | ai api calls, live ai usage, ai hub | Live AI API call tracking, world briefing display, and endpoint catalog for the TerminalFeed AI data hub. |
| ai-leaderboard | AI Model Leaderboard | ai leaderboard, llm rankings, best ai model | Current rankings of top AI models by benchmark performance. Live LLM leaderboard across major evaluation suites. |
| bluesky | Bluesky Live Feed | bluesky feed, bluesky trending, atproto live | Real-time posts from the Bluesky firehose. Live feed from the AT Protocol social network. |
| daily-paws | Daily Paws | cat pictures, dog pictures, daily pet photos | Random cat and dog photos refreshed daily. Free pet photo feed from curated public APIs. |
| originals | TerminalFeed Originals | terminalfeed blog, original tech articles, founder dispatch | Latest original articles from the TerminalFeed editorial team rotating every 15 seconds. Fresh writing from five author personas. |
| the-wire | Hacker Culture Wire | 2600 quotes, hacker culture, phreak wire | Rotating hacker culture quotes and 2600 Magazine references. Live cultural feed for the hacker tradition. |
| npm-trends | NPM Download Trends | npm trending, top npm packages, javascript packages | Live NPM package download trends. Track the fastest-growing JavaScript libraries in real-time. |
| producthunt | Product Hunt Live | product hunt trending, latest product launches, ph today | Real-time Product Hunt launches and trending products. Live feed of new tech products launching today. |

Panels not in the table above (e.g. `recipe`, `uap`, `internet-pulse`, `daily-learn`, `live-now`, `seismic-timeline`, `tcg-market`, `good-news`, `trending-movies`, `museum-art`, `books`) — flag to Evan during batch execution and pause for phrasing before shipping. Don't invent SEO copy for niche panels without signoff.

### 3. Batch 1: Crypto cluster (8 panels)

Wire `PanelHeader` into: `btc-price`, `crypto`, `fear-greed`, `predictions`, `gas`, `btc-network`, `crypto-market-global`, `whale-watch`.

For each panel:
1. Import `PanelHeader` at the top of the panel component.
2. Replace the existing title element (or add one if missing) with `<PanelHeader title="..." anchorId="..." seoDescription="..." />`.
3. Remove any duplicate `<h2>` or `<div class="panel-title">` if the new component replaces it.
4. Visual smoke test: open the dashboard, confirm each of the 8 panels renders with no layout shift and the title text is unchanged.

Single commit: `feat: panel SEO markup for crypto panels (batch 1)`.

### 4. Batch 2: Markets cluster (6 panels)

Panels: `stocks`/`markets`, `forex`, `commodities`, `economic-data`, `market-hours`, `steam`.

Same procedure. Commit: `feat: panel SEO markup for markets panels (batch 2)`.

### 5. Batch 3: News/Social cluster (8 panels)

Panels: `tech-news`, `hn-community`, `reddit`, `github`, `gh-events`, `stackoverflow`, `bluesky`, `producthunt`.

Commit: `feat: panel SEO markup for news/social panels (batch 3)`.

### 6. Batch 4: Science/World cluster (6 panels)

Panels: `seismic`, `disasters`, `launches`, `humans-in-space`, `nasa-apod`, `weather`.

Commit: `feat: panel SEO markup for science/world panels (batch 4)`.

### 7. Batch 5: Dev/AI/Status cluster (7 panels)

Panels: `cyber-threats`, `service-status` (or however the status panel is currently named), `ai-hub`, `ai-leaderboard`, `npm-trends`, `wiki-live`, `this-day`.

Commit: `feat: panel SEO markup for dev/AI/status panels (batch 5)`.

### 8. Batch 6: Culture/Misc cluster (remaining panels)

Panels: `originals`, `the-wire`, `daily-paws`, `podcasts`, plus any panels from the table above not yet wired. Flag unlisted panels to Evan for phrasing approval before shipping.

Commit: `feat: panel SEO markup for culture/misc panels (batch 6)`.

### 9. Verification and sitemap

After all batches ship:

1. View source on `https://terminalfeed.io/` — expect every panel's `seoDescription` to appear in the static HTML.
2. Open the page in Chrome with JS disabled — panel titles should be visible, `seoDescription` spans should not (they're `sr-only` styled).
3. Run a Lighthouse audit — expect no regressions in Accessibility or Best Practices.
4. Googlebot simulate: use Google Search Console URL Inspection on the homepage, confirm the new H2s appear in the crawled DOM view.
5. Optional: add anchor-style internal links from the blog and tool pages to specific panels, e.g. `https://terminalfeed.io/#panel-fear-greed`. Not required for this spec.

### 10. Schema.org WebApplication featureList extension

If the homepage `WebApplication` JSON-LD was previously extended (per `cc-spec-seo-haul.md` Section 5a/5b, which just shipped in the Bitcoin Ticker landing page session), confirm the `featureList` array enumerates all panels with their keyword-rich titles. If not yet exhaustive, extend it now.

Single commit: `feat: extend WebApplication featureList with all panel keywords`.

---

## Execution Order

1. Section 1 — `PanelHeader` component. Single commit.
2. Sections 3-8 — Batch commits, one per cluster. 6 commits total.
3. Section 9 — Verification. No commit unless fixes needed.
4. Section 10 — Schema extension. Single commit.

Total: 7-8 commits. Moderate dashboard risk (panel markup changes). One-batch-at-a-time discipline is mandatory.

---

## Verification Checklist

After each batch:

- [ ] Bundle hash changed
- [ ] Site loads, no crashes
- [ ] All panels in the batch render, no layout shift
- [ ] `curl https://terminalfeed.io/ | grep -c 'panel-seo-description'` increases by the batch count
- [ ] `curl https://terminalfeed.io/ | grep -c '<h2'` increases by the batch count
- [ ] No panel is stuck on `loading...` (would indicate a render regression introduced by the spec)
- [ ] BTC hero still ticking live
- [ ] Mobile layout unchanged visually

After all batches:

- [ ] Lighthouse SEO score on homepage ≥ previous baseline
- [ ] Google Search Console URL Inspection shows the new H2s in the rendered DOM
- [ ] `sr-only` CSS is in the bundle and applied correctly (span is in DOM but not visible)

---

## What this spec does NOT cover

- Dedicated `/tickers/*` and `/feeds/*` landing pages (SEO haul Section 4, separate spec).
- Blog content targeting panel-level keywords (SEO haul Section 6, partially covered by the 6 Bitcoin Ticker articles).
- Internal link mesh rewiring in the footer (SEO haul Section 7).
- Rank-check scripting (SEO haul Section 11).
- The stuck-panels fix itself (`cc-spec-stuck-panels.md`). This spec assumes panels are rendering correctly.

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** Panel markup changes have burned us before. Every batch must be smoke-tested before moving to the next.
2. **GATE: stuck-panels fix must have landed first.** If any panel in a batch is currently stuck on `loading...`, do not wire its SEO header yet — adding markup to a broken shell propagates the bug.
3. **No em dashes in any `title` or `seoDescription` string.** The mapping table above was written without them; verify before shipping.
4. **One commit per batch.** No stacking batches into a single commit.
5. **No visual regressions.** The whole point of `sr-only` styling is that the new content is invisible to users. Any pixel shift is a bug.
6. **`PanelHeader` is a pure markup component.** It must not add state, effects, or data fetching. It's a presentational wrapper.
7. **Flag unlisted panels to Evan.** Any panel currently in the dashboard but not in the Section 2 mapping needs approved phrasing before wiring.
8. **Do not break drag-and-drop panel ordering.** Panels are reorderable; the new H2 is inside the panel container, not outside.
9. **Mobile layout must not shift.** Test at 375px width after each batch.
10. **React.memo is mandatory.** Existing panels use `React.memo`. The new component does not need memoization itself (it's trivially cheap to render) but must not break memoization of the parent panel.
