# CC Spec — SEO Haul: Bitcoin Ticker Cluster + Panel Landing Pages

**Date:** April 20, 2026
**Priority:** HIGH
**Scope:** Own the "Bitcoin Ticker" keyword family, then compound with dedicated landing pages and Schema.org markup for every high-value real-time feed. This is a multi-commit, multi-week effort — CC executes in phases, Evan ships and monitors rank.

---

## Executive Summary

TerminalFeed has a free, sub-second Bitcoin Ticker at the top of the homepage and 30+ other real-time feeds below it. This is a category-leading product that is currently ranking nowhere because the site is optimized as a "dashboard" not as a "Bitcoin ticker". This spec flips that.

**Primary keyword targets (Tier 1 — Bitcoin ticker family):**

- Bitcoin Ticker
- Best Bitcoin Ticker
- Real-Time Bitcoin Ticker
- Live Bitcoin Ticker
- BTC Ticker
- Free Bitcoin Ticker
- Bitcoin Price Ticker
- Live BTC Price
- Real-Time BTC Price

**Secondary keyword targets (Tier 2 — feed-level):**

- Crypto Dashboard / Free Crypto Dashboard
- Real-Time Crypto Prices
- Fear Greed Index Live
- Live Prediction Markets / Polymarket Odds Live
- Real-Time Earthquake Map / Live Seismic Data
- Live Stock Ticker / Real-Time Stock Prices
- Live Hacker News Feed
- Real-Time GitHub Trending
- Live Space Launches
- Real-Time Disaster Alerts
- Live Cyber Threat Feed
- Real-Time Forex Rates

**Tertiary (long-tail, Tier 3):** these fall out naturally from the landing pages and blog cluster — don't target explicitly.

**Strategy:** rank Tier 1 via focused on-page SEO + a dedicated landing page at `/bitcoin-ticker`, then use that traffic to cross-promote the rest of the dashboard. Each real-time feed gets a lightweight landing page so the dashboard has 30+ entry points from search instead of just one.

**Constraint:** do NOT break the dashboard. The homepage must remain fast and functional. All SEO work is additive.

---

## Sections

### 1. Homepage on-page SEO overhaul

**File:** `public/index.html`

**Current state (inferred):** generic H1, title like "TerminalFeed — Free Real-Time Dashboard for Crypto, Stocks, News & More".

**Changes:**

#### 1a. Title tag
```html
<title>Bitcoin Ticker + Live Real-Time Data Dashboard | TerminalFeed</title>
```
- Exact-match "Bitcoin Ticker" at the front.
- 58 chars — well under the 60-char truncation line.
- Pipe separator (not em dash — CLAUDE.md rule).

#### 1b. Meta description
```html
<meta name="description" content="Free real-time Bitcoin Ticker with sub-second price updates, plus 30+ live data feeds: stocks, crypto, Fear & Greed, prediction markets, earthquakes, and more. No signup. No ads. Pure terminal UI.">
```
- 189 chars — under 160 is ideal but Google truncates to ~160 anyway. First 150 chars carry the weight.
- Leading with the ticker benefit, then the dashboard.

#### 1c. Open Graph + Twitter
```html
<meta property="og:title" content="Bitcoin Ticker + 30+ Live Data Feeds">
<meta property="og:description" content="Free, real-time Bitcoin Ticker with sub-second price updates. Plus stocks, crypto, Fear & Greed, prediction markets, earthquakes, and more.">
<meta property="og:image" content="https://terminalfeed.io/og-image.png">
<meta property="og:url" content="https://terminalfeed.io/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Bitcoin Ticker + 30+ Live Data Feeds">
<meta name="twitter:description" content="Free, real-time Bitcoin Ticker with sub-second price updates. No signup.">
<meta name="twitter:image" content="https://terminalfeed.io/og-image.png">
```

#### 1d. Static SEO content block
The existing hidden static SEO block (between `<!-- LATEST_ARTICLES_START -->` / `<!-- LATEST_ARTICLES_END -->`) already has blog articles. Expand it to lead with the ticker:

```html
<div class="seo-block" style="display:none" aria-hidden="true">
  <h1>Bitcoin Ticker &amp; Real-Time Data Dashboard</h1>
  <p>TerminalFeed is a free, real-time Bitcoin ticker and data dashboard. The BTC price updates every second via a direct WebSocket connection to Binance, with instant fallback to CoinCap if that stream drops. There is no signup, no subscription, and no ads.</p>
  <p>Below the Bitcoin ticker, 30+ live panels show stock prices, top crypto movers, the Fear &amp; Greed Index, Polymarket prediction markets, earthquake feeds from USGS, space launches, GitHub trending, Hacker News, cyber threat intelligence, and more. Every data source is free, public, and API-backed.</p>

  <h2>Real-Time Data Feeds</h2>
  <p>Live Bitcoin price from Binance. Real-time stock prices from Finnhub. Crypto market data from CoinGecko. Prediction markets from Polymarket. Earthquake data from USGS. Space launches from The Space Devs. Weather from Open-Meteo. Space station crew from Open Notify. Economic data from FRED.</p>

  <h2>Developer Tools</h2>
  <p>24 free developer tools including a JSON formatter, Base64 encoder, UUID generator, Unix timestamp converter, JWT decoder, regex tester, cron decoder, satoshi converter, gwei calculator, and hex converter.</p>

  <h2>TerminalFeed Originals</h2>
  <!-- LATEST_ARTICLES_START -->
  <!-- (existing prebuild script output) -->
  <!-- LATEST_ARTICLES_END -->

  <h2>Free API for AI Agents</h2>
  <p>TerminalFeed exposes its real-time data at terminalfeed.io/api/briefing — a one-call world snapshot for AI agents. Full API documentation at terminalfeed.io/developers. OpenAPI spec at terminalfeed.io/openapi.json. AI discovery file at terminalfeed.io/llms.txt.</p>
</div>
```

Keep this block hidden (display:none) since it exists specifically for the Google crawler. The React app mounts over it.

### 2. Dedicated `/bitcoin-ticker` landing page

**File:** `public/bitcoin-ticker/index.html`

Pure static HTML page designed to rank for the Tier 1 keywords. This page is NOT part of the React app — it's a dedicated landing page that links prominently to the main dashboard.

**Structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bitcoin Ticker — Free Real-Time BTC Price | TerminalFeed</title>
  <meta name="description" content="The best free real-time Bitcoin ticker on the web. Sub-second BTC price updates via Binance WebSocket, with CoinCap fallback. No signup, no ads.">
  <link rel="canonical" href="https://terminalfeed.io/bitcoin-ticker">

  <!-- OG + Twitter: same template as homepage but keyword-focused -->
  <!-- Schema.org: see Section 5 -->

  <style>
    /* Inline critical CSS — dark terminal aesthetic matches site */
  </style>
</head>
<body>
  <header>
    <nav><!-- standard site nav --></nav>
  </header>

  <main>
    <!-- Visible, indexable H1 with exact-match keyword -->
    <h1>Bitcoin Ticker</h1>
    <p class="lede">The fastest free Bitcoin ticker on the web. Sub-second BTC price updates, direct from Binance, with automatic fallback to CoinCap.</p>

    <!-- EMBEDDED LIVE BTC TICKER -->
    <!-- This is the hero. Either iframe the main dashboard's BTC panel, or render a standalone ticker here. -->
    <section class="btc-ticker-hero">
      <iframe src="/embed/btc-ticker" width="100%" height="240" frameborder="0" title="Live Bitcoin Ticker" loading="eager"></iframe>
    </section>

    <section>
      <h2>Why TerminalFeed's Bitcoin Ticker</h2>
      <ul>
        <li><strong>Sub-second updates.</strong> Direct WebSocket connection to Binance. Most sites poll every 5–30 seconds.</li>
        <li><strong>Automatic failover.</strong> If the primary stream drops, the ticker silently switches to CoinCap.</li>
        <li><strong>Free forever.</strong> No signup, no subscription, no rate limit.</li>
        <li><strong>Ad-free.</strong> No banner ads, no popups, no crypto shill.</li>
        <li><strong>Embeddable.</strong> Put the live Bitcoin ticker on your own site — see <a href="/widgets">widgets</a>.</li>
        <li><strong>Mobile-optimized.</strong> The ticker throttles to 3-second updates on mobile to save battery.</li>
      </ul>
    </section>

    <section>
      <h2>Real-Time Bitcoin Price Sources</h2>
      <p>The Bitcoin ticker on this page pulls its price from a primary and a fallback source. The primary is <strong>Binance</strong> via WebSocket, streaming trade tick data with zero polling interval. When the WebSocket connection fails — which can happen on corporate networks, ad blockers that block Binance, or during WebSocket library upgrades — the ticker falls back to <strong>CoinCap</strong>, polling every 3 seconds.</p>
      <p>This dual-source architecture means TerminalFeed's Bitcoin ticker keeps working when single-source tickers (like CoinMarketCap's widget) go stale.</p>
    </section>

    <section>
      <h2>Frequently Asked Questions</h2>
      <details>
        <summary>Is the Bitcoin ticker free?</summary>
        <p>Yes. No signup required. No rate limit.</p>
      </details>
      <details>
        <summary>How often does the Bitcoin price update?</summary>
        <p>On desktop, the ticker updates every second via Binance WebSocket. On mobile, it throttles to 3 seconds to preserve battery life. Most competing free tickers update every 5–60 seconds.</p>
      </details>
      <details>
        <summary>What if Binance goes down?</summary>
        <p>The ticker automatically falls back to CoinCap. The switchover is silent — users see no interruption.</p>
      </details>
      <details>
        <summary>Can I embed the Bitcoin ticker on my site?</summary>
        <p>Yes. Embed code is available at <a href="/widgets">terminalfeed.io/widgets</a>. The embeddable ticker is sandboxed and ad-free.</p>
      </details>
      <details>
        <summary>Does the ticker have an API?</summary>
        <p>Yes. The endpoint is <code>https://terminalfeed.io/api/btc-price</code>. It's free, public, and CORS-enabled. Full API docs at <a href="/developers">/developers</a>.</p>
      </details>
      <details>
        <summary>Where else can I see real-time data?</summary>
        <p>The main <a href="/">TerminalFeed dashboard</a> shows 30+ live data feeds in one view — stocks, crypto, prediction markets, earthquakes, space launches, and more.</p>
      </details>
    </section>

    <section>
      <h2>More Real-Time Feeds on TerminalFeed</h2>
      <!-- Internal link mesh to other /tickers/ and /feeds/ pages (Section 4) -->
      <ul class="feed-grid">
        <li><a href="/tickers/crypto">Real-Time Crypto Prices</a></li>
        <li><a href="/tickers/stocks">Live Stock Ticker</a></li>
        <li><a href="/feeds/fear-greed-index">Fear &amp; Greed Index Live</a></li>
        <li><a href="/feeds/prediction-markets">Live Polymarket Odds</a></li>
        <li><a href="/feeds/earthquakes">Real-Time Earthquake Map</a></li>
        <li><a href="/feeds/hacker-news">Live Hacker News Feed</a></li>
        <li><a href="/feeds/github-trending">Real-Time GitHub Trending</a></li>
        <li><a href="/feeds/space-launches">Live Space Launches</a></li>
      </ul>
    </section>

    <footer>
      <p><a href="/">Open the full TerminalFeed dashboard</a> — Bitcoin ticker plus 30+ live feeds in one view.</p>
    </footer>
  </main>
</body>
</html>
```

**Create the embed route too.** `public/embed/btc-ticker/index.html` — a minimal single-ticker page that iframe embedders can use. This is the same content as the BTC panel on the dashboard but with no site chrome.

### 3. Panel-level SEO enrichment (every dashboard panel)

Currently panels have `aria-label` but no visible heading, no permalink anchor, and no keyword-rich descriptive text for the Google crawler. Fix this without hurting the UI.

**For every panel:**

1. **Anchor ID:** add `id="panel-{panelId}"` to the outer panel div so each panel has a permalink (`terminalfeed.io/#panel-bitcoin`).
2. **Visible semantic heading:** the panel's existing title label should be an `<h2>` with keyword-rich text (see mapping below). This already exists visually — just make sure the tag is `<h2>` not a `<div>`.
3. **Hidden descriptive paragraph:** each panel includes a `<p class="sr-only">` with a keyword-rich sentence about what the panel shows. This is visible to screen readers and the Google crawler but not to sighted users.
4. **Source attribution:** each panel shows its data source in small text (many already do — standardize the phrasing to be keyword-friendly).
5. **Dataset Schema.org markup:** see Section 5.

**Keyword mapping per panel** (use for the H2 + hidden description):

| panelId | H2 text | Hidden description keyword-rich |
|---|---|---|
| bitcoin | "Bitcoin Ticker" | "Real-time Bitcoin price ticker from Binance WebSocket with CoinCap fallback. Live BTC price updates every second." |
| crypto | "Top Crypto Movers" | "Real-time cryptocurrency prices and top movers, gainers, and losers over 24 hours. Data from CoinGecko." |
| btc-network | "Bitcoin Network Status" | "Live Bitcoin network health: block height, mempool size, hashrate, and recommended fees from mempool.space." |
| markets | "Live Stock Ticker" | "Real-time stock prices and market ticker for S&P 500, tech, and crypto-adjacent equities. Data from Finnhub." |
| fear-greed | "Fear & Greed Index Live" | "Live Crypto Fear & Greed Index — real-time sentiment gauge from Alternative.me." |
| predictions | "Live Prediction Markets" | "Real-time Polymarket prediction market odds across politics, sports, and crypto." |
| seismic | "Real-Time Earthquake Map" | "Live earthquake feed from USGS — recent seismic events worldwide, magnitude 2.5 and up." |
| launches | "Live Space Launches" | "Upcoming rocket launches from SpaceX, ULA, Rocket Lab, and others. Data from The Space Devs." |
| weather | "Live Weather" | "Current conditions and 7-day forecast from Open-Meteo." |
| news | "Tech & AI News Feed" | "Real-time tech and AI news feed aggregated from Hacker News, The Verge, TechCrunch, and Ars Technica." |
| dev-status | "Dev/Ops Service Status" | "Real-time status of GitHub, Cloudflare, OpenAI, Discord, Vercel, npm, Reddit, and Atlassian." |
| hn-community | "Live Hacker News" | "Real-time Hacker News top, new, ask, and show stories." |
| github | "GitHub Trending Live" | "Real-time GitHub trending repositories by stars." |
| gh-events | "GitHub Events Live" | "Real-time GitHub coding activity — pushes, pull requests, and stars as they happen." |
| reddit | "Reddit Tech Feed" | "Real-time Reddit posts from technology, programming, AI, and ML subreddits." |
| stackoverflow | "Stack Overflow Hot" | "Live Stack Overflow hot questions across all tags." |
| bluesky | "Bluesky Live Feed" | "Real-time Bluesky posts from tech and developer accounts." |
| wiki-live | "Wikipedia Live Edits" | "Real-time Wikipedia edit stream via Wikimedia EventStreams." |
| producthunt | "Product Hunt Live" | "Real-time Product Hunt launches via RSS." |
| disasters | "Global Disaster Alerts" | "Live disaster alerts from GDACS — earthquakes, floods, cyclones, and wildfires worldwide." |
| gas | "ETH Gas Tracker" | "Real-time Ethereum gas prices — low, standard, and fast tiers from Etherscan. Live ETH transaction costs." |
| forex | "Forex Currency Rates" | "Real-time foreign exchange rates from Frankfurter." |
| humans-in-space | "Humans in Space" | "Live count of astronauts currently in space and on the ISS." |
| this-day | "This Day in History" | "Notable events on this date from Wikimedia." |
| nasa-apod | "NASA Astronomy Picture of the Day" | "Today's NASA Astronomy Picture of the Day." |
| steam | "Top Steam Games" | "Real-time top Steam games by current players." |
| ai-hub | "AI Hub & Briefing" | "Live AI agent activity and one-call world briefing endpoint for AI integrations." |
| ai-leaderboard | "AI Model Leaderboard" | "Current rankings of top large language models by benchmark." |
| podcasts | "Tech Podcasts" | "Latest episodes from Lex Fridman, Darknet Diaries, Changelog, Syntax, and more." |
| market-hours | "Market Hours" | "Real-time open/closed status of global stock exchanges — NYSE, NASDAQ, LSE, TSE, HKEX." |
| npm-trends | "NPM Download Trends" | "Real-time npm package download counts for popular JavaScript libraries." |
| books | "Trending Books" | "Currently trending books on Open Library." |
| daily-paws | "Daily Paws" | "A random cat or dog photo each visit, for dopamine between data panels." |
| tech-news | "Tech News Live" | "Aggregated tech news from The Verge, TechCrunch, Ars Technica, and Wired." |
| the-wire | "The Wire" | "Rotating quotes and dispatches from 2600, DEF CON, and hacker culture." |
| originals | "TerminalFeed Originals" | "Original editorial articles across crypto, dev tools, security, AI, and culture." |
| claude-status | "Anthropic Service Status" | "Real-time status of Anthropic's Claude API and related services." |
| cloud-status | "Cloud Provider Status" | "Real-time status of AWS, GCP, and Azure regional health." |

For panels not listed above (`uap`, `recipe`, `daily-learn`, `internet-pulse`, `live-now`, `seismic-timeline`, `tcg-market`, `good-news`, `trending-movies`, `museum-art`, `wikipedia`), confirm they have real content — if they're orphan registry entries per `cc-spec-stuck-panels.md`, delete them. If they stay, add similar mappings.

### 4. Dedicated landing pages per top feed

Create static landing pages for the top 10 panels, each targeting its own keyword cluster. Structure mirrors the `/bitcoin-ticker` page in Section 2 — smaller scope, same pattern.

**Pages to create** (one file each, `public/<path>/index.html`):

- `/tickers/bitcoin` → Bitcoin Ticker (canonical target; same keywords as Section 2's `/bitcoin-ticker` — pick one URL, 301 the other. Recommend keeping `/bitcoin-ticker` as primary since it's a cleaner URL.)
- `/tickers/crypto` → Real-Time Crypto Prices / Top Crypto Movers
- `/tickers/stocks` → Live Stock Ticker / Real-Time Stock Prices
- `/tickers/ethereum` → Real-Time Ethereum Price (reuses crypto panel data filtered)
- `/feeds/fear-greed-index` → Fear & Greed Index Live
- `/feeds/prediction-markets` → Live Prediction Markets / Polymarket Odds
- `/feeds/earthquakes` → Real-Time Earthquake Map / Live Seismic Data
- `/feeds/hacker-news` → Live Hacker News Feed
- `/feeds/github-trending` → Real-Time GitHub Trending Repositories
- `/feeds/space-launches` → Live Space Launches / Upcoming Rocket Launches
- `/feeds/disaster-alerts` → Global Disaster Alerts Live
- `/feeds/cyber-threats` → Real-Time Cyber Threat Intelligence

**Page template:**

Each page follows the `/bitcoin-ticker` structure:
1. `<h1>` with exact-match keyword
2. Lede paragraph (40–60 words) with primary + secondary keywords woven in naturally
3. Embedded live feed (iframe of the relevant panel, 240–400px tall)
4. 3–5 benefit bullets
5. "How it works" paragraph (technical explanation for depth)
6. FAQ section (5 questions per page)
7. "Related feeds" internal link mesh back to other `/tickers/` and `/feeds/` pages
8. Footer CTA linking to the main dashboard

**Do NOT keyword-stuff.** Each page should read naturally. If a phrase feels forced, rewrite it.

### 5. Schema.org structured data expansion

Add JSON-LD blocks to each page type:

#### 5a. Homepage — `WebApplication` with `featureList`

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "TerminalFeed",
  "url": "https://terminalfeed.io/",
  "description": "Free real-time Bitcoin ticker and data dashboard with 30+ live feeds.",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "featureList": [
    "Real-time Bitcoin ticker",
    "Live stock prices",
    "Top crypto movers",
    "Fear and Greed Index",
    "Polymarket prediction markets",
    "USGS earthquake feed",
    "Space launch schedule",
    "GitHub trending",
    "Hacker News live",
    "Global disaster alerts",
    "Cyber threat intelligence",
    "ETH gas tracker",
    "Weather forecast",
    "Global market hours",
    "Forex exchange rates"
  ],
  "publisher": {
    "@type": "Organization",
    "name": "TerminalFeed",
    "url": "https://terminalfeed.io/"
  }
}
</script>
```

#### 5b. Homepage — `FAQPage`

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is the Bitcoin ticker free?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. No signup, no subscription, no rate limit." }
    },
    {
      "@type": "Question",
      "name": "How often does the Bitcoin price update?",
      "acceptedAnswer": { "@type": "Answer", "text": "Every second on desktop via Binance WebSocket, every 3 seconds on mobile for battery efficiency." }
    },
    {
      "@type": "Question",
      "name": "Can I embed the Bitcoin ticker on my site?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Embeds are available at terminalfeed.io/widgets." }
    },
    {
      "@type": "Question",
      "name": "What data sources does TerminalFeed use?",
      "acceptedAnswer": { "@type": "Answer", "text": "Binance, CoinCap, CoinGecko, Finnhub, Polymarket, USGS, The Space Devs, Alternative.me, Open-Meteo, mempool.space, Etherscan, Frankfurter, FRED, and more." }
    }
  ]
}
</script>
```

#### 5c. Per-feed landing pages — `Dataset`

For each `/tickers/` and `/feeds/` page, add a `Dataset` JSON-LD block describing the live data:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Real-Time Bitcoin Price",
  "description": "Live Bitcoin price from Binance WebSocket with CoinCap fallback, updated every second.",
  "url": "https://terminalfeed.io/bitcoin-ticker",
  "keywords": ["Bitcoin Ticker", "BTC Price", "Real-Time Bitcoin", "Live BTC"],
  "creator": { "@type": "Organization", "name": "TerminalFeed" },
  "temporalCoverage": "2025-01-01/..",
  "variableMeasured": "Bitcoin price in USD",
  "distribution": {
    "@type": "DataDownload",
    "encodingFormat": "application/json",
    "contentUrl": "https://terminalfeed.io/api/btc-price"
  }
}
</script>
```

Adapt the variables per feed (prices, index values, event counts, etc.).

#### 5d. Breadcrumbs on every landing page

Standard `BreadcrumbList` schema, visible + JSON-LD. Home > Tickers > Bitcoin, Home > Feeds > Fear & Greed, etc.

### 6. Blog cluster around "Bitcoin Ticker"

Publish 6 new articles targeting the keyword family. Each goes through the normal blog pipeline (prebuild script regenerates `blog-latest.json`, RSS updates, sitemap updates).

**Article slugs + titles + target keyword:**

1. `/blog/bitcoin-ticker-explained` — "Bitcoin Ticker: How Live BTC Price Updates Actually Work" (primary: Bitcoin Ticker, secondary: Real-Time Bitcoin)
2. `/blog/best-bitcoin-ticker` — "The Best Free Bitcoin Ticker in 2026" (comparison article: TerminalFeed vs CoinMarketCap widget vs TradingView ticker vs Blockchain.com)
3. `/blog/bitcoin-ticker-for-your-site` — "How to Add a Free Bitcoin Ticker to Your Website" (tutorial, leads into /widgets embed)
4. `/blog/bitcoin-ticker-websocket-vs-polling` — "Why We Built a WebSocket Bitcoin Ticker Instead of Polling" (technical deep-dive, Node persona)
5. `/blog/bitcoin-ticker-mobile` — "Why Your Mobile Bitcoin Ticker Lies" (performance article, how throttling affects accuracy)
6. `/blog/real-time-data-dashboard-2026` — "Beyond the Bitcoin Ticker: Building a Real-Time Data Dashboard" (Ripper Founder Friday dispatch)

**Author persona mapping per CLAUDE.md daily schedule.**

**Word count:** 900–1500 words each. Substantive, not filler. Use 2–3 images or diagrams per article.

**Internal linking:** every article links to `/bitcoin-ticker`, to the homepage, and to 2–3 related blog articles from `cc-spec-related-content.md`.

### 7. Internal linking mesh

#### 7a. Footer
Add a keyword-rich footer section visible on every page:

```html
<footer>
  <nav class="footer-feeds" aria-label="Real-Time Feeds">
    <h3>Real-Time Feeds</h3>
    <ul>
      <li><a href="/bitcoin-ticker">Bitcoin Ticker</a></li>
      <li><a href="/tickers/crypto">Crypto Prices</a></li>
      <li><a href="/tickers/stocks">Stock Ticker</a></li>
      <li><a href="/feeds/fear-greed-index">Fear &amp; Greed</a></li>
      <li><a href="/feeds/prediction-markets">Prediction Markets</a></li>
      <li><a href="/feeds/earthquakes">Earthquakes</a></li>
      <li><a href="/feeds/hacker-news">Hacker News Feed</a></li>
      <li><a href="/feeds/github-trending">GitHub Trending</a></li>
      <li><a href="/feeds/space-launches">Space Launches</a></li>
    </ul>
  </nav>
  <!-- existing footer content -->
</footer>
```

#### 7b. In-panel links
Each dashboard panel's header gets a subtle "See more →" link to its `/tickers/` or `/feeds/` landing page (use the teal accent color, not a loud button). This creates ~30 internal links on the homepage flowing to the landing pages.

#### 7c. Blog article body links
Every blog article that mentions Bitcoin or real-time data should link once to `/bitcoin-ticker`. Keep anchor text natural and varied — "our Bitcoin ticker", "the live BTC price", "TerminalFeed's real-time Bitcoin data". Do NOT use the same anchor text repeatedly (Google flags that as over-optimization).

### 8. Technical SEO

#### 8a. Core Web Vitals on `/bitcoin-ticker`
The landing page should hit green on LCP (< 2.5s), INP (< 200ms), and CLS (< 0.1).

- Inline critical CSS in `<head>`.
- Preload the embedded iframe's initial HTML with `<link rel="preload" href="/embed/btc-ticker" as="document">`.
- No web fonts on the landing page — use the system monospace stack inline (`font-family: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;`).
- No JS framework on the landing pages — plain HTML + tiny inline `<script>` only if needed.

#### 8b. Mobile optimization
Every new landing page must pass Google's Mobile-Friendly test. Viewport tag, tap targets > 48px, no horizontal scroll.

#### 8c. Pre-deploy SEO lint
Add `scripts/verify-seo.js` that checks every HTML file in `public/` for:
- Exactly one `<h1>` per page
- Title tag length 30–60 chars
- Meta description length 70–160 chars
- `<meta name="viewport">` present
- `<link rel="canonical">` present
- At least one internal link
- No em dashes in visible text (per CLAUDE.md rule #1)

Fail the build if any check fails. Add to `package.json` as a prebuild step.

### 9. Sitemap + RSS + llms.txt

#### 9a. Sitemap
Add to `public/sitemap.xml`:

```xml
<url><loc>https://terminalfeed.io/bitcoin-ticker</loc><priority>0.9</priority><changefreq>daily</changefreq></url>
<url><loc>https://terminalfeed.io/tickers/crypto</loc><priority>0.8</priority></url>
<url><loc>https://terminalfeed.io/tickers/stocks</loc><priority>0.8</priority></url>
<url><loc>https://terminalfeed.io/tickers/ethereum</loc><priority>0.7</priority></url>
<url><loc>https://terminalfeed.io/feeds/fear-greed-index</loc><priority>0.8</priority></url>
<url><loc>https://terminalfeed.io/feeds/prediction-markets</loc><priority>0.7</priority></url>
<url><loc>https://terminalfeed.io/feeds/earthquakes</loc><priority>0.7</priority></url>
<url><loc>https://terminalfeed.io/feeds/hacker-news</loc><priority>0.7</priority></url>
<url><loc>https://terminalfeed.io/feeds/github-trending</loc><priority>0.7</priority></url>
<url><loc>https://terminalfeed.io/feeds/space-launches</loc><priority>0.7</priority></url>
<url><loc>https://terminalfeed.io/feeds/disaster-alerts</loc><priority>0.6</priority></url>
<url><loc>https://terminalfeed.io/feeds/cyber-threats</loc><priority>0.6</priority></url>
<!-- plus the 6 new blog articles from Section 6 -->
```

#### 9b. RSS
Regenerate `/feed.xml` after the 6 new blog articles ship.

#### 9c. llms.txt
Update to list the new feed landing pages so AI agents can discover them:

```
# TerminalFeed - Real-Time Data Dashboard

## Flagship
- Bitcoin Ticker: https://terminalfeed.io/bitcoin-ticker
- API Briefing: https://terminalfeed.io/api/briefing

## Tickers
- Bitcoin: https://terminalfeed.io/tickers/bitcoin
- Ethereum: https://terminalfeed.io/tickers/ethereum
- Crypto: https://terminalfeed.io/tickers/crypto
- Stocks: https://terminalfeed.io/tickers/stocks

## Feeds
- Fear & Greed Index: https://terminalfeed.io/feeds/fear-greed-index
- Prediction Markets: https://terminalfeed.io/feeds/prediction-markets
- Earthquakes: https://terminalfeed.io/feeds/earthquakes
- Hacker News: https://terminalfeed.io/feeds/hacker-news
- GitHub Trending: https://terminalfeed.io/feeds/github-trending
- Space Launches: https://terminalfeed.io/feeds/space-launches

## API Endpoints
<existing list>
```

### 10. External signals prep (Evan's manual work, not CC's)

CC doesn't post on HN or Reddit. But CC can prepare the launch copy as drafts in `/marketing/` folder (git-tracked, not deployed):

- `marketing/hn-show-hn-draft.md` — "Show HN: Free Real-Time Bitcoin Ticker + 30+ Live Data Feeds" with 3 body paragraph variants
- `marketing/reddit-bitcoin-launch.md` — 4 variant posts for r/Bitcoin, r/CryptoCurrency, r/BitcoinBeginners, r/btc (each tailored to sub's tone)
- `marketing/product-hunt-launch.md` — tagline + gallery captions
- `marketing/x-launch-thread.md` — 5-tweet thread for @terminalfeed announcing the Bitcoin Ticker landing page

Evan personally posts these on launch day. Coordinate with AdSense re-approval.

### 11. Monitor + measure

Not CC's work directly, but CC should add:

- `scripts/rank-check.js` (optional, nice-to-have) — uses a free SERP API (SerpAPI free tier, 100 queries/month) to check weekly rankings for the Tier 1 keywords and write a `rank-history.json` to `/public/`. Evan can build a simple rank dashboard panel later if desired.

---

## Execution Order

**Phase 1 — Foundation (week 1)**
1. Section 1 (homepage on-page SEO overhaul) — 1 commit
2. Section 5a + 5b (homepage Schema.org) — 1 commit
3. Section 8c (SEO lint script) — 1 commit, blocks later deploys until enforced

**Phase 2 — Flagship landing page (week 1)**
4. Section 2 (`/bitcoin-ticker` landing page + embed route) — 1 commit
5. Section 5c + 5d (Schema.org for the new page) — 1 commit

**Phase 3 — Panel enrichment (week 2)**
6. Section 3 (per-panel H2 + hidden description + anchor IDs) — commit per 5 panels, ~8 commits total
7. Section 7b (in-panel "See more →" links) — 1 commit after Section 6 panel pages exist

**Phase 4 — Feed landing pages (week 2–3)**
8. Section 4 (one commit per landing page, 10–12 commits)

**Phase 5 — Content cluster (week 3)**
9. Section 6 (blog articles) — 1 commit per article, 6 commits over the week per daily schedule

**Phase 6 — Wiring + signals (week 3)**
10. Section 7a (footer) — 1 commit
11. Section 7c (blog internal link pass) — 1 commit
12. Section 9 (sitemap + RSS + llms.txt) — runs automatically via prebuild once new pages exist
13. Section 10 (marketing drafts) — 1 commit

Each commit tested individually. No batching. Push between each.

---

## Verification Checklist

After Phase 2:
- [ ] Google "site:terminalfeed.io bitcoin ticker" returns `/bitcoin-ticker` as a result
- [ ] Google's Rich Results Test passes for homepage + `/bitcoin-ticker` (no schema errors)
- [ ] Google PageSpeed Insights scores 90+ on Performance for `/bitcoin-ticker`
- [ ] Mobile-Friendly test passes for `/bitcoin-ticker`

After Phase 3:
- [ ] Every panel on the homepage has an `<h2>` (use DevTools: `$$('.panel h2').length` should equal total panel count)
- [ ] Every panel has an anchor ID (`document.querySelectorAll('[id^="panel-"]').length` > 30)

After Phase 4:
- [ ] All 12 landing pages return 200
- [ ] Sitemap includes all new URLs
- [ ] Each landing page has a valid Dataset JSON-LD

After Phase 5:
- [ ] 6 new blog articles live, all linking to `/bitcoin-ticker`
- [ ] `blog-latest.json` regenerated, static SEO block on homepage updated

After Phase 6:
- [ ] Footer visible on every page with keyword-rich feed links
- [ ] `marketing/` folder exists with 4 draft files
- [ ] `robots.txt` still allows all crawlers
- [ ] Google Search Console submission: request indexing on `/bitcoin-ticker` first, then all new landing pages

**Ongoing (Evan):**
- [ ] Weekly check of Google Search Console: impressions trend for "bitcoin ticker" variants
- [ ] Monthly: compare rankings with an SERP tool

---

## What this spec does NOT cover

- **The stuck-panels render bug** (that's `cc-spec-stuck-panels.md` — fix that first; the panel-level SEO in Section 3 depends on panels actually rendering their content).
- **Dashboard redesign via Claude Design** (separate track).
- **New panels or data sources beyond what already exists.**
- **AdSense approval work** — this spec is about organic SEO; monetization is separate.
- **Backlink outreach.** That's manual, ongoing, and requires actual humans.
- **Changing the React framework, bundler, or deploy pipeline.**

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** The homepage must remain functional after every commit. Pull the dashboard up in a real browser after every push and verify the Bitcoin ticker still ticks, panels still load.
2. **NEVER add `@cloudflare/vite-plugin`** to the project.
3. **NEVER add `wrangler.jsonc` or `wrangler.toml` to project root.**
4. **NEVER add `wrangler deploy` or `wrangler dev` as npm scripts.**
5. **All external APIs through `/api/*`** — if the new landing pages need live data, they call the same Worker endpoints the dashboard uses.
6. **No em dashes in any user-facing text.** Use pipes (`|`), colons (`:`), or parentheses. The SEO lint script in Section 8c enforces this.
7. **Null-safe defaults on every API field.**
8. **One commit per section (or per landing page / per article).** No batching.
9. **Test Core Web Vitals after every landing page** — LCP target < 2.5s.
10. **Do NOT keyword-stuff.** Every piece of text should read naturally. If a sentence feels like it's written for Google instead of a human, rewrite it.
11. **Layout version bump in `useLayoutManager.ts`** only if you change the dashboard panel DOM (Section 3 will require one bump).
12. **Prebuild script regenerates blog-latest.json AND static SEO block** on every deploy. Don't break it.

**Priority signal:** Section 1 + Section 2 + Section 5 (homepage + flagship landing page + schema) are the highest-leverage commits. If you only ship Phase 1 and Phase 2 in the first week, that's fine — rank momentum builds before you ship the long tail.

**Gate:** confirm `cc-spec-stuck-panels.md` Section 0 (render bug fix) has landed before starting Section 3 (per-panel enrichment). Otherwise the panels you're enriching are still wedged on `loading...` and the Google crawler will see empty content with nice H2s and Schema.
