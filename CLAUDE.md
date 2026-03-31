# CLAUDE.md — TerminalFeed.io

## Project Overview

TerminalFeed.io is a free real-time data dashboard and developer tools platform with a dark terminal aesthetic. Built by Evan Marcus (Ripper) as an individual project (not under Pizza Robot Studios LLC). The site serves as a real-time command center for crypto, stocks, news, earthquakes, prediction markets, weather, AI agent tracking, developer tools, and more.

**Domain:** terminalfeed.io (Cloudflare Registrar)
**Hosting:** Cloudflare Pages (auto-deploy from GitHub)
**Repo:** github.com/RipperMercs/terminalfeed
**API Backend:** Cloudflare Worker (terminalfeed-api) handling all /api/* routes
**Stack:** Next.js, React, TypeScript
**Creator:** Ripper (@terminalfeed on X, hello@terminalfeed.io)

---

## Architecture

### Frontend
- Next.js + React on Cloudflare Pages
- CSS columns layout for masonry-style panel packing (NOT CSS Grid for main layout)
- Terminal aesthetic: dark background (#0A0A0C), monospace fonts (JetBrains Mono), teal accents (#5DCAA5)
- Panels must ALWAYS be height: auto — no fixed heights, no blank space

### Backend API (Cloudflare Worker)
- Single Worker handles ALL /api/* routes via path-based routing
- Route: terminalfeed.io/api/* → terminalfeed-api Worker (fail open)
- In-memory caching with per-endpoint TTLs
- CORS enabled on all responses (Access-Control-Allow-Origin: *)
- 8-second timeout on all external API calls
- Stale cache returned on failure — never return 500 to client
- Free tier: 100,000 requests/day

### API Endpoints Live
```
/api/              — API directory
/api/briefing      — One-call world snapshot (AI agents use this)
/api/btc-price     — Bitcoin price from Binance (data-api.binance.vision)
/api/stocks        — Top US stocks from Finnhub
/api/crypto-movers — Top 15 crypto from CoinGecko
/api/fear-greed    — Fear & Greed Index from Alternative.me
/api/earthquake    — Recent earthquakes from USGS
/api/predictions   — Polymarket prediction markets (Gamma API)
/api/hackernews    — Top HN stories from Firebase
/api/service-status — Status of GitHub, Cloudflare, Discord, OpenAI, Vercel, npm, Reddit, Atlassian
/api/cyber-threats — Malware/IOCs from URLhaus/ThreatFox
/api/github-trending — GitHub events
/api/forex         — Currency rates from Frankfurter
/api/humans-in-space — ISS crew from Open Notify
/api/disaster-alerts — GDACS alerts
/api/launches      — Space launches from The Space Devs
/api/economic-data — Fed rate, CPI, unemployment from FRED
/api/steam         — Top Steam games from SteamSpy
/api/weather       — Weather from Open-Meteo (params: lat, lon)
/api/ai-stats      — API call tracking for AI Hub panel
```

### Environment Variables (Worker)
- FINNHUB_API_KEY — for stock quotes
- FRED_API_KEY — for economic data (from fred.stlouisfed.org)

---

## Site Pages

### Main Dashboard (/)
- 30+ real-time data panels in CSS columns layout
- Scrolling price ticker (stocks + crypto) at top
- Scrolling sports scores ticker (ESPN, live games only)
- World clocks integrated into bottom status bar
- Organize mode: drag-and-drop (desktop) + arrows (mobile) to reorder panels
- Layout saves to localStorage (tf_panel_order, tf_has_custom_layout)
- Full screen mode (press F) with subtle scan line overlay
- Panel presets: Default, Trader, Developer, News, Everything, Random
- Auto-save before randomize with undo toast

### Content Pages
```
/live          — Real-time world briefing, auto-refreshes every 5 minutes
/blog          — Blog index with articles and weekly Originals section
/blog/fear-greed-guide      — Guide to Crypto Fear & Greed Index
/blog/free-apis-2026        — 30+ Free APIs guide
/blog/bitcoin-mempool       — Bitcoin network health explained
/blog/building-terminalfeed — Story of building the site
/blog/prediction-markets    — Polymarket odds explained
/blog/originals/week-1      — Weekly dispatch (ongoing series)
/about         — About page (800+ words)
/features      — All 30+ panels described (~1500 words)
/changelog     — Running log of updates
/developers    — Full API documentation with code examples
/privacy       — 13-section privacy policy
/terms         — 16-section terms of service
```

### Tool Pages
```
/tools             — Tool landing page / index
/tools/json        — JSON Formatter & Validator
/tools/base64      — Base64 Encode/Decode
/tools/uuid        — UUID Generator
/tools/timestamp   — Unix Timestamp Converter
/tools/jwt         — JWT Decoder
/tools/regex       — Regex Tester
/tools/diff        — Text/Code Diff Viewer (planned)
/tools/cron        — Cron Expression Builder (planned)
/tools/hash        — Hash Generator MD5/SHA (planned)
/tools/color       — Color Converter & Palette (planned)
/tools/api         — API Request Tester / mini Postman (planned)
/tools/markdown    — Markdown Preview (planned)
/tools/yaml        — YAML/JSON Converter (planned)
/tools/chmod       — Permission Calculator (planned)
/tools/port        — Common Port Reference (planned)
/tools/password    — Password Generator (planned)
/tools/dns         — DNS Lookup (planned, needs Worker)
/tools/ssl         — SSL Certificate Checker (planned, needs Worker)
/tools/ssh-key     — SSH Key Generator (planned)
/tools/qr          — QR Code Generator (planned)
```

### Other Pages
```
/wifi          — WiFi Speed Test & Diagnostic Tool
/agent         — AI Agent Tracker (34 agents, 7 categories, live status)
/radio         — Lo-fi/Ambient Terminal Radio
```

### i18n
- Spanish (/es/*), Portuguese (/pt/*), German (/de/*)
- Covers all tool pages + /agent + /radio
- Language switcher in bottom-right corner
- hreflang tags for SEO
- Cloudflare _redirects handles URL rewrites

---

## Design System

```
Background:    #0A0A0C (page), #111114 (panels), #0D0D10 (dark sections)
Borders:       #1E1E24 (panel borders), #1A1A1E (inner dividers)
Text:          #F0EDE6 (bright), #D4D2CB (normal), #8A8880 (mid), #4E4D49 (dim), #3A3A44 (ultra dim)
Green:         #4ADE80 (positive, operational, live indicators)
Red:           #F87171 (negative, errors, outages)
Teal:          #5DCAA5 (primary accent, links, highlights)
Amber:         #EF9F27 (warnings, stale data, gold items)
Purple:        #A78BFA (AI Hub, agent-related elements)
Gold:          #F9CB42 (BTC-related, premium indicators)
Blue:          #60A5FA (informational)
Font:          JetBrains Mono → SF Mono → Fira Code → Consolas → monospace
```

---

## Key Panels on Dashboard

### Locked Top Row
- Weather (living sky with sun/moon, palm trees for LA)
- BTC Price (live from Binance WebSocket, 1s updates desktop, 3s mobile)
- Tech/AI News Feed (HN + tech RSS)
- Dev/Ops Status + Markets (stock prices)

### Data Panels (CSS columns below top row)
- Crypto (top movers — gainers and losers sorted by 24h change)
- BTC Network (block height, mempool, hashrate, fees from mempool.space)
- Crypto Market Global (total cap, BTC dominance, 24h volume)
- Fear & Greed Index
- Prediction Markets (Polymarket via Worker)
- Market Hours (global exchanges open/closed)
- Reddit Feed
- GitHub Trending
- Stack Overflow Hot Questions
- Wikipedia Live Edits (SSE stream from Wikimedia)
- GitHub Events (live coding activity)
- Earthquake / Seismic (USGS + Seismic Portal WebSocket)
- Global Disaster Alerts (GDACS)
- Cyber Threats (URLhaus + ThreatFox + CISA)
- Whale Watch (large BTC transactions from mempool.space)
- The Wire (2600/hacker culture rotating quotes and history)
- AI Hub (API call tracking, world briefing display, endpoint list)
- Bluesky Feed
- AI Leaderboard (model rankings)
- Podcasts
- Space Launches
- NASA APOD
- Steam Top Games
- Daily Paws (random cat/dog images)
- Humans in Space (ISS crew)
- This Day in History (Wikimedia)
- Forex Currency Rates
- Commodities
- Internet Pulse (aggregate stats)
- Trending Books (Open Library)
- Fitness (easter egg — pizza eating photo for Rupture)

---

## Performance Rules

### Desktop
- React.memo on every panel component
- Each panel manages its own state (no global state object)
- Arrays capped at 20-30 items max
- WebSocket/SSE streams buffered and flushed every 500ms
- API calls staggered on initial load (0s, 500ms, 1.5s, 3s, 4.5s, 6s)
- All setInterval/setTimeout must have cleanup in useEffect return
- All WebSocket/EventSource must close on unmount
- Tab visibility pause — stop all polling when tab is hidden

### Mobile
- content-visibility: auto on all panels
- BTC WebSocket throttled to 3s (vs 1s desktop)
- Wikipedia SSE throttled to 3s
- All polling intervals doubled on mobile
- Live dot animations disabled
- Weather animations disabled
- Max 8 items per feed panel (vs 15 desktop)
- Tickers pause when scrolled past
- Matrix rain / warp speed effects disabled

---

## SEO & Marketing

### Google Search Console
- Property verified via Cloudflare DNS
- Sitemap submitted: terminalfeed.io/sitemap.xml
- All pages individually submitted for indexing

### Meta Tags (every page must have)
- Unique title with keywords + "| TerminalFeed"
- Meta description (150-160 chars)
- OG title, description, image, url
- Twitter card (summary_large_image)
- Canonical URL
- JSON-LD structured data

### OG Image
- Custom Photoshop screenshot at /og-image.png (1200x630)
- Shows the dashboard with BTC price, panels, terminal aesthetic
- ">_ TERMINALFEED.io — Real-time feeds. Your second monitor."

### AI Agent Discovery
- /llms.txt — AI discovery file listing all API endpoints
- /openapi.json — OpenAPI spec for auto-discovery
- /api/briefing — one-call world snapshot
- CORS enabled on all API routes
- AI meta tag in HTML head

### Marketing Plan (execute after AdSense approved)
1. Hacker News "Show HN" post (Tuesday/Wednesday 8-10 AM ET)
2. Reddit posts across 8 subreddits (1 per day, different angles)
3. X launch tweet from @terminalfeed
4. Dev.to technical article
5. Product Hunt launch (when fully polished)
6. YouTube screen recording

### X Account
- Handle: @terminalfeed
- Bio: ">_ real-time feeds for crypto, stocks, news & more. 30+ live data streams on one dark dashboard. your second monitor, curated. terminalfeed.io. built by @RipperMercs"
- Profile pic: Green >_ on dark background

---

## Monetization

### Google AdSense (pending approval)
- Status: "Getting ready" → rejected for "low value content" → adding blog + articles → resubmit
- Manual placements only (NOT auto ads)
- 3 ad slots max: top-left 300x250, mid-section 728x90, lower 300x250
- Dark styled to match site aesthetic
- Block own IP from seeing ads
- Revenue model: CPM (impressions) + CPC (clicks)

### BTC Donations
- Donation address visible in "Support the Terminal" panel
- Top donors leaderboard (monitors mempool.space for incoming transactions)

---

## Email Setup (Cloudflare Email Routing → Gmail)
- hello@terminalfeed.io
- feedback@terminalfeed.io
- advertise@terminalfeed.io
- legal@terminalfeed.io
- support@terminalfeed.io
- security@terminalfeed.io

---

## Easter Eggs
- Type "2600" → plays 2600 Hz tone, all panels flash teal
- Type "matrix" → subtle matrix rain animation
- Type "warp" → warp speed star streaks
- Console.log message for DevTools users (2600/hacker culture)
- HTML comment in source code
- Fitness panel (pizza eating photo for Rupture)
- Ripper logo in footer — click 5x for spin animation

---

## Critical Rules for Claude Code

1. **No em dashes** — never use em dashes in any text
2. **Panels must be height: auto** — NEVER set fixed heights on panels. No min-height. No flex-grow. Panels shrink to fit content. This is the #1 recurring bug.
3. **CSS columns for layout** — use column-count, NOT CSS Grid for the main panel layout
4. **align-items: start** — if using grid anywhere, panels don't stretch to match neighbors
5. **One change at a time** — make one change, test, commit, next. Never batch multiple changes.
6. **Every API route through the Worker** — never call external APIs directly from the browser. Everything goes through /api/* to avoid CORS.
7. **Cap all arrays** — every array in state must have .slice(0, N) to prevent memory leaks
8. **Cleanup all effects** — every setInterval, setTimeout, WebSocket, EventSource must have cleanup in useEffect return
9. **Self-healing panels** — if an API fails, show stale cache. If no cache, hide the panel. Never show error states to users.
10. **Save layout on every change** — localStorage auto-save via useEffect watchers, not a save button
11. **Specs as single files** — all CC specs delivered as one downloadable file, never split across multiple blocks
12. **Test after every change** — verify the site still works before committing

---

## Current Status (March 2026)

- Dashboard: Live with 30+ panels
- API Worker: Live with 20+ endpoints
- Tools: 7 live, 13 more planned
- Blog: Building 5 launch articles + weekly Originals section
- i18n: Live in Spanish, Portuguese, German (tools + agent + radio)
- AdSense: Rejected twice (first: ads without content, second: low value content). Adding blog/articles to fix. Will resubmit after content deployed.
- Traffic: ~350 real visits/day with zero promotion. 12K+ API requests/day.
- Google Search Console: Verified, sitemap submitted, 48+ pages indexed
- Marketing: Not started — waiting for AdSense approval before the push

## Upcoming Roadmap
1. Deploy blog articles + expanded tool descriptions → resubmit AdSense
2. Build remaining tools (diff, cron, hash, color, API tester, etc.)
3. AdSense approval → place manual ads
4. Marketing blitz (HN, Reddit, X, Dev.to)
5. Build /live into a shareable content engine
6. Expand AI agent ecosystem
7. Weekly Originals editorial content
8. Potential /gifs page (curated tech/crypto memes) after ads established
