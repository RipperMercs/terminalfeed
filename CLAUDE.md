# CLAUDE.md, TerminalFeed.io

Last updated: April 29, 2026

## Project Overview

TerminalFeed.io is a free real-time data dashboard, developer tools platform, and editorial publication with a dark terminal aesthetic. Built by Evan Marcus (Ripper) as an individual project (not under Pizza Robot Studios LLC). The site serves multiple audiences: developers who want a command-center second monitor, traders watching live market data, AI agents consuming structured data via the public API, and general tech readers consuming original blog content.

**Domain:** terminalfeed.io (Cloudflare Registrar)
**Hosting:** Cloudflare Pages (auto-deploy from GitHub master branch)
**Repo:** github.com/RipperMercs/terminalfeed
**API Backend:** Cloudflare Worker `terminalfeed-api` handling all /api/* routes + X bot
**Stack:** Next.js, React, TypeScript, Cloudflare Workers
**Creator:** Ripper (@terminalfeed on X, hello@terminalfeed.io)
**X Account:** @terminalfeed (automated bot + manual posts)

---

## Architecture

### Frontend
- Next.js + React on Cloudflare Pages
- CSS columns layout for masonry-style panel packing (NOT CSS Grid for main layout)
- Terminal aesthetic: dark background (#0A0A0C), monospace fonts (JetBrains Mono), teal accents (#5DCAA5)
- Panels must ALWAYS be height: auto, no fixed heights, no blank space
- Drag-and-drop panel reordering on desktop, up/down/left/right arrows on mobile
- Layout saves to localStorage (tf_panel_order, tf_has_custom_layout)
- Layout version bumps force refresh of cached layouts when new panels are added

### Backend API (Cloudflare Worker)
- Single Worker handles ALL /api/* routes via path-based routing
- Route: terminalfeed.io/api/* to terminalfeed-api Worker (fail open)
- In-memory caching with per-endpoint TTLs
- CORS enabled on all responses (Access-Control-Allow-Origin: *)
- 8-second timeout on all external API calls
- Stale cache returned on failure, never return 500 to client
- Free tier: 100,000 requests/day (currently using <1% of quota)
- X bot functions embedded in same Worker (tweet, auto-briefing endpoints + scheduled cron)
- **Premium /api/pro/\* tier** with credit-based billing, Bearer token auth, MCP tools, subscriptions, and webhook watches all live in the same Worker (see "Premium Tier" section below)

### CANONICAL WORKER FILE (read before editing)

The canonical Worker is `worker-additions/worker.js`, deployed via `worker-additions/wrangler.toml`. ~7500 lines. Contains all free `/api/*` routes, all 12 `/api/pro/*` premium routes, payment endpoints, MCP tools, KV binding (`WEBHOOK_SUBS`), Analytics Engine binding, dual cron (`0 14 * * *` daily briefing + `*/5 * * * *` source sync). This is what runs on terminalfeed.io.

The previous orphan subfolder `worker-additions/terminalfeed-api/` was deleted on 2026-04-30. Do not recreate it.

Always edit `worker-additions/worker.js` for any API route work. Deploy from `worker-additions/` with `npx wrangler deploy`.

### API Endpoints Live
```
/api/              — API directory
/api/briefing      — One-call world snapshot (AI agents use this)
/api/btc-price     — Bitcoin price (Binance with CoinCap fallback)
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
/api/gas           — ETH gas prices from Etherscan (15s cache)
/api/meme-radar    — DEPRECATED as of April 20, 2026. Remove in next cleanup. See Editorial Policy: No Dedicated Memecoin Surfaces.
/api/error         — POST client error reports (logged to Cloudflare Workers dashboard)
/api/tweet         — POST tweet to @terminalfeed (Bearer ADMIN_SECRET)
/api/auto-briefing — Generate and post automated briefing tweet (Bearer ADMIN_SECRET)
```

### Premium Tier: /api/pro/\* (live, paid, Bearer auth)

All `/api/pro/*` endpoints require `Authorization: Bearer tf_live_<64-char-hex>` and consume credits from the caller's balance. Tokens minted on TerminalFeed are also valid on TensorFeed and vice versa (cross-site credit pool). Each response includes a top-level `_meta` block describing source latencies and a `_meta.endpoint` echo.

```
/api/pro/briefing            — Composed BTC + Fear & Greed + earthquakes + HN + ISS + predictions  (1 cr)
/api/pro/macro               — FRED + Finnhub + Frankfurter rollup, history param supported       (2 cr)
/api/pro/crypto-deep         — Per-coin deep dive across CoinGecko + on-chain network stats        (2 cr)
/api/pro/agent-context       — Curated paste-ready system_prompt of current world state            (2 cr)
/api/pro/sentiment           — Crypto F&G + trending symbols with regex sentiment scoring          (2 cr)
/api/pro/world-deltas        — Polling endpoint, events newer than ?since=ISO timestamp            (2 cr)
/api/pro/correlation-matrix  — Computed correlations across 10 historical series                   (2 cr)
/api/pro/whales              — Large BTC/ETH/Solana transactions with attribution                  (2 cr)
/api/pro/exchange-flows      — 19-wallet labeled list of exchange-controlled addresses + flows     (2 cr)
/api/pro/defi-tvl            — Top-50 DeFi protocols + chain rollups (DefiLlama, normalized)       (2 cr)
/api/pro/stablecoin-flows    — Top-20 stablecoins with 1d/7d/30d deltas + aggregate bias           (2 cr)
/api/pro/github-velocity     — GitHub trending repos with computed velocity score                  (2 cr)
```

Auth + billing endpoints (live):
```
/api/pro/subscribe              — POST to start a webhook subscription (price/status/digest)
/api/pro/subscribe/<id>         — DELETE to cancel
/api/pro/subscribe/<id>/resume  — POST to reactivate
/api/pro/subscriptions          — GET list owned by the caller token
/api/payment/buy-credits        — POST to mint credits
/api/payment/confirm            — POST to confirm payment
/api/payment/balance            — GET caller balance
/api/payment/history            — GET caller transaction history
```

Credit pricing: 1 credit = $0.02. Validation + charge runs through `validateAndCharge(env, token, costCredits, 'tf:/api/pro/<slug>')`. Premium handlers wrap their logic in `handlePremium(request, env, url, '/api/pro/<slug>', costCredits, fetcher)` which handles auth, credit decrement, cache lookup, error mapping, and `_meta` envelope assembly. New premium endpoints MUST follow this pattern, never hand-roll auth/billing.

MCP tools: each pro endpoint is also exposed as an MCP tool (`tf_premium_<slug>`) via the agent-payments MCP server in the same Worker. Adding a new pro endpoint requires registering an MCP tool case in the same switch (search for `tf_premium_briefing` for the pattern).

### Quality bar (April 29, 2026 audit)

- Strong moats (keep as-is): macro, agent-context, exchange-flows (the labeled-wallet list IS the moat), correlation-matrix, whales.
- Real value-add despite upstream being free (keep at 2 cr): defi-tvl, stablecoin-flows. Both run ~150 lines of normalization, dust filtering, multi-window deltas, and aggregate bias on top of DefiLlama. Not thin passthroughs.
- Watch list (revisit pricing or upgrade scoring): sentiment (regex-only scoring is honest but easy to clone, consider LLM-tag upgrade or drop to 1 cr); github-velocity (verify the velocity score actually differentiates from the free GitHub events feed).

### Worker Environment Variables
- FINNHUB_API_KEY, stock quotes
- FRED_API_KEY, economic data from fred.stlouisfed.org
- ETHERSCAN_API_KEY, ETH gas prices from etherscan.io
- X_API_KEY, X/Twitter API consumer key
- X_API_SECRET, X/Twitter API consumer secret
- X_ACCESS_TOKEN, X/Twitter API access token
- X_ACCESS_TOKEN_SECRET, X/Twitter API access token secret
- ADMIN_SECRET, protects /api/tweet and /api/auto-briefing endpoints

### Cron Triggers (canonical worker)
- `0 14 * * *`, Daily at 9 AM ET (2 PM UTC), runs auto-briefing tweet via scheduled() handler in Worker
- `*/5 * * * *`, Every 5 minutes, source sync / cache warm for premium endpoints

### Worker KV / Analytics bindings
- `WEBHOOK_SUBS` (KV), stores active premium webhook subscriptions for `/api/pro/subscribe`
- `AGENT_ANALYTICS` (Analytics Engine, dataset `agent_traffic`), per-request agent traffic logging

---

## Site Pages

### Main Dashboard (/)
- 30+ real-time data panels in CSS columns layout
- Scrolling price ticker (stocks + crypto) at top
- Scrolling sports scores ticker
- World clocks in bottom status bar
- Drag-and-drop organize mode (desktop) + arrows (mobile)
- Full screen mode (press F)
- Panel presets: Default, Trader, Developer, News, Everything, Random (with auto-save undo toast)
- Static SEO content block in initial HTML (hidden by React on mount) for Google crawler
- TERMINALFEED ORIGINALS panel showing latest 6 blog articles with rotation

### Content Pages
```
/live          — Real-time world briefing, auto-refreshes every 5 minutes
/blog          — Blog index with all articles + weekly Originals section
/blog/[slug]   — Individual article pages (20+ articles)
/about         — About page (800+ words)
/features      — All 30+ panels described (~1500 words)
/changelog     — Running log of site updates
/team          — Editorial team page (Ripper, zer0day, Pulse, Node, Signal)
/developers    — Full API documentation with code examples
/privacy       — 13-section privacy policy
/terms         — 16-section terms of service
```

### Blog Articles Published
```
/blog/fear-greed-guide                     — What is the Crypto Fear & Greed Index
/blog/free-apis-2026                       — 30+ Free APIs guide
/blog/bitcoin-mempool                      — Bitcoin network health explained
/blog/building-terminalfeed                — Story of building the site
/blog/prediction-markets                   — Polymarket odds explained
/blog/api-security                         — API security in 2026
/blog/second-monitor                       — Second monitor setup guide
/blog/ai-agents-explained                  — AI agents on the web
/blog/earthquake-monitoring                — Real-time seismic data guide
/blog/terminal-aesthetic                   — Why terminal design is taking over
/blog/why-second-monitor-dashboards-matter — Dashboards vs distractions
/blog/api-rate-limits-explained            — How rate limits work
/blog/why-data-matters-for-traders         — Data indicators traders should watch
/blog/2600-still-matters                   — 2600 Magazine 41-year retrospective
/blog/self-hosting-is-back                 — Self-hosting resurgence in 2026
/blog/how-ai-agents-browse                 — How AI agents actually browse
/blog/free-tier-is-dead                    — Open source vs commercial tools
/blog/read-your-browser-console            — Browser console as privacy tool
/blog/what-the-fear-greed-index-got-wrong  — March 2026 sentiment analysis
/blog/claude-mythos-project-glasswing      — Anthropic Mythos release
/blog/originals/week-1                     — Weekly dispatch
/blog/originals/week-2                     — Dev tools vs funded tools
/blog/originals/week-3                     — Building AI infrastructure
```

### Author Personas
- **Ripper**, Founder & Editor-in-Chief (product, weekly originals)
- **zer0day**, Security Correspondent (cybersecurity, privacy, hacker culture)
- **Pulse**, Market Analyst (crypto, stocks, prediction markets, economics)
- **Node**, Developer Advocate (APIs, dev tools, programming, tutorials)
- **Signal**, Data & AI Editor (AI agents, machine learning, data feeds)

### Daily Content Schedule
```
Monday:    Market Monday, Pulse (crypto/stocks recap)
Tuesday:   Tool Tuesday, Node (dev tool or API topic)
Wednesday: Wire Wednesday, zer0day (security/privacy/hacker culture)
Thursday:  Data Thursday, Signal (AI/data/automation)
Friday:    Founder Friday, Ripper (weekly original dispatch)
Saturday:  Community Saturday, guest post or tutorial
Sunday:    Buffer day
```

### Tool Pages (live)
```
/tools             — Tool landing page / index
/tools/json        — JSON Formatter & Validator
/tools/base64      — Base64 Encode/Decode
/tools/uuid        — UUID Generator
/tools/timestamp   — Unix Timestamp Converter
/tools/jwt         — JWT Decoder
/tools/regex       — Regex Tester
```

### Planned Tools (priority order)
```
/tools/diff        — Text/Code Diff Viewer
/tools/cron        — Cron Expression Builder/Decoder
/tools/hash        — Hash Generator (MD5/SHA-1/SHA-256/SHA-512)
/tools/color       — Color Converter & Palette Tool
/tools/api         — API Request Tester (mini Postman)
/tools/markdown    — Markdown Preview/Editor
/tools/yaml        — YAML/JSON Converter
/tools/chmod       — Permission Calculator
/tools/port        — Common Port Reference
/tools/password    — Password Generator
/tools/dns         — DNS Lookup (needs Worker)
/tools/ssl         — SSL Certificate Checker (needs Worker)
/tools/ssh-key     — SSH Key Generator
/tools/qr          — QR Code Generator
```

### Planned Sections (specced, not yet built)
```
/widgets           — Embeddable widgets for other sites (iframe-based, backlink compounding)
/glossary          — Tech terminology dictionary (50 starter terms, targeting "what is X" searches)
/team/[author]     — Individual author profile pages (permanent author URLs)
```

### Other Pages
```
/wifi          — WiFi Speed Test & Diagnostic Tool
/agent         — AI Agent Tracker (52 agents, 7 categories, live status checks)
/radio         — Lo-fi/Ambient Terminal Radio (royalty-free streams, original music planned)
/feed.xml      — RSS feed of all blog articles
/llms.txt      — AI discovery file listing all API endpoints
/openapi.json  — OpenAPI spec for auto-discovery
/sitemap.xml   — Full sitemap
/robots.txt    — Allows all crawlers
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
Amber:         #EF9F27 (warnings, stale data, gold items, BLOG tag)
Purple:        #A78BFA (AI Hub, agent-related elements)
Gold:          #F9CB42 (BTC-related, premium indicators)
Blue:          #60A5FA (informational)
Font:          JetBrains Mono, SF Mono, Fira Code, Consolas, monospace
```

---

## Key Panels on Dashboard

### Locked Top Row
- Weather (living sky with sun/moon, palm trees for LA)
- BTC Price (live from Binance WebSocket, 1s desktop, 3s mobile)
- Tech/AI News Feed (HN + tech RSS)
- Dev/Ops Status + Markets (stock prices)

### Data Panels (CSS columns below top row)
- Crypto (top movers, gainers and losers sorted by 24h change)
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
- Whale Watch (large BTC transactions)
- The Wire (2600/hacker culture rotating quotes)
- AI Hub (API call tracking, world briefing display, endpoint list)
- **TerminalFeed Originals (rotates through latest blog articles every 15s)**
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

### REMOVED
- Fitness panel (was a joke for Rupture, removed April 2026 for professionalism)
- Memecoin Radar panel (removed April 20, 2026 — see Editorial Policy below)

### Editorial Policy: No Dedicated Memecoin Surfaces
Memecoins are not a viable long-term asset class. Industry data consistently shows more retail participants lose money on memecoins than make money, and surfacing them prominently on a data dashboard implicitly endorses them. TerminalFeed's editorial stance, effective April 20, 2026:

- **No dedicated memecoin panels.** The general `crypto` panel (top movers by market cap / 24h change) is fine and stays.
- **Focus on durable projects.** Bitcoin is the primary crypto subject. A small number of established alts with long-term utility (ETH, SOL for network activity data) are acceptable as supporting context, but not as dedicated panels.
- **No memecoin-focused blog content, tools, or API endpoints.** The `/api/meme-radar` Worker route should be deprecated and removed in the next cleanup pass (see Roadmap).
- **Apply this policy to any sister site** (TensorFeed, VR.org, DramaRadar) that adds crypto surfaces.

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
- Tab visibility pause, stop all polling when tab is hidden

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

## SEO Infrastructure

### Schema.org Structured Data
- Organization + WebSite + SearchAction schema on homepage
- Article schema on every blog post (with author URL, publisher logo, datePublished)
- BreadcrumbList on all multi-level pages (40+ pages)
- AboutPage schema on /about
- SoftwareApplication schema on tool pages
- Person schema on /team page

### Breadcrumbs (visible + JSON-LD)
- Home > Blog > Article (3-level)
- Home > Blog > Originals > Title (4-level for originals)
- Home > Tools > Tool Name (3-level)
- Home > Page Name (2-level for all other pages)

### RSS Feed
- Live at /feed.xml
- RSS 2.0 format
- All blog articles with author, pubDate, guid
- Autodiscovery link on homepage, blog index, and every blog article

### Static SEO Content Block (Homepage)
- Hidden HTML block in initial index.html (display:none via JS after React mount)
- Contains H1, description, 3 latest blog article titles + excerpts + bylines
- Sections on live data feeds, developer tools, and free API
- Internal links to /blog, /tools, /developers, individual articles
- Google crawler sees this before any JavaScript runs
- Updated automatically by prebuild script

### Build Script: scripts/generate-blog-data.js
- Runs as prebuild step on every deploy
- Scans /public/blog/ directory
- Extracts metadata from each HTML file's meta tags
- Outputs /public/blog-latest.json (6 most recent articles)
- Updates SEO content block in index.html between `<!-- LATEST_ARTICLES_START -->` and `<!-- LATEST_ARTICLES_END -->` markers

### Meta Tags (every page has)
- Unique title with keywords + "| TerminalFeed"
- Meta description (150-160 chars)
- OG title, description, image, url
- Twitter card (summary_large_image)
- Canonical URL
- JSON-LD structured data

### OG Image
- Custom Photoshop screenshot at /og-image.png (1200x630)
- Shows the dashboard with BTC price, panels, terminal aesthetic

### AI Agent Discovery
- /llms.txt, AI discovery file
- /openapi.json, OpenAPI spec
- /api/briefing, one-call world snapshot
- CORS enabled on all API routes
- AI meta tag in HTML head

### Google Search Console
- Domain property verified via Cloudflare DNS
- Sitemap submitted: terminalfeed.io/sitemap.xml
- All pages individually submitted for indexing
- Current status: "Alternate page with proper canonical tag" (informational only, language variants being properly canonicalized)

---

## Monetization

### Google AdSense (pending approval)
- Status history: Approved "Getting ready", rejected "Ads without publisher content", fixed, rejected "Low value content", fixed with blog system + Originals panel + SEO content block, awaiting re-review
- When approved: manual ad placements only (NOT auto ads), 3 slots max
- Top-left 300x250, mid-section 728x90, lower 300x250
- Dark styled to match site aesthetic
- Block own IP from seeing ads
- Revenue model: CPM (impressions) + CPC (clicks)
- ads.txt file: placeholder ready, needs publisher ID after approval

### BTC Donations
- Donation address visible in "Support the Terminal" panel
- Top donors leaderboard monitors mempool.space for incoming transactions

---

## X Bot (@terminalfeed)

### Setup
- X Developer account with $25 in credits
- OAuth 1.0a authentication (HMAC-SHA1 signing in Worker)
- All keys stored as encrypted secrets in terminalfeed-api Worker
- ADMIN_SECRET protects manual endpoints

### Automated Tweets
- **9 AM ET daily briefing** (cron: 0 14 * * *), scheduled() handler in Worker pulls from Binance, Alternative.me, USGS, formats and posts
- Manual article announcements via POST /api/tweet with Bearer ADMIN_SECRET

### Tweet Formats
- Daily briefing: BTC price + Fear & Greed + earthquake count + link to /live
- Article announcement: title + author + excerpt + link + hashtags
- Tool announcement: tool name + description + link + hashtags
- Curated news: biggest newsworthy item from data feeds with commentary

### Bio
">_ real-time feeds for crypto, stocks, news & more. 30+ live data streams on one dark dashboard. your second monitor, curated. terminalfeed.io. built by @RipperMercs"

---

## Email Setup (Cloudflare Email Routing to Gmail)
- hello@terminalfeed.io
- feedback@terminalfeed.io
- advertise@terminalfeed.io
- legal@terminalfeed.io
- support@terminalfeed.io
- security@terminalfeed.io

---

## Easter Eggs
- Type "2600", plays 2600 Hz tone, all panels flash teal
- Type "matrix", subtle matrix rain animation (10-30 min random intervals)
- Type "warp", warp speed star streaks
- Console.log message for DevTools users (2600/hacker culture)
- HTML comment in source code
- Ripper logo in footer, click 5x for spin animation

---

## Critical Rules for Claude Code

### ABSOLUTE RULE: NEVER CRASH THE SITE
A new panel, feature, or change must NEVER take down the entire site. This is the #1 rule above all others. If you are unsure whether something is safe, err on the side of caution. The site has real users and real traffic. A crashed site is unacceptable.

### Panel Safety Rules (learned the hard way - April 15, 2026 incident)
- **Every panel MUST have its own ErrorBoundary wrapper.** A single panel crash must NEVER take down the entire dashboard. Wrap every panel in a per-panel ErrorBoundary that catches errors and hides just that panel.
- **NEVER call .toFixed(), .toUpperCase(), .substring(), or any method on API data without null-safe defaults.** Always use `value ?? fallback` BEFORE calling methods. Example: `(t.priceChange24h ?? 0).toFixed(0)` not `t.priceChange24h.toFixed(0)`. This caused a full site crash on April 15, 2026.
- **NEVER trust external API response shapes.** Every field from an external API can be undefined, null, missing, or a different type than expected. Destructure with defaults. Validate before rendering.
- **Test new panels with REAL API data before deploying**, not just with mocked/assumed data shapes. If the Worker endpoint is not deployed yet, the panel MUST gracefully handle the missing endpoint (return null, not crash).
- **Worker routes MUST be deployed BEFORE frontend panels that depend on them.** Never deploy a frontend panel that calls a Worker endpoint that doesn't exist yet. Deploy order: Worker first, frontend second.
- **Every .map() callback that renders JSX must have defensive defaults on EVERY field it accesses.** If even one field is undefined, the entire app crashes.

### Existing Rules
1. **No em dashes**, never use em dashes in any text
2. **Panels must be height: auto**, NEVER set fixed heights on panels. No min-height. No flex-grow. Panels shrink to fit content. This was the #1 recurring bug.
3. **CSS columns for main layout**, use column-count, NOT CSS Grid for the panel layout
4. **align-items: start**, if using grid anywhere, panels don't stretch to match neighbors
5. **One change at a time**, make one change, test, commit, next. Never batch multiple changes.
6. **Every API route through the Worker**, never call external APIs directly from the browser. Everything goes through /api/* to avoid CORS.
7. **Cap all arrays**, every array in state must have .slice(0, N) to prevent memory leaks
8. **Cleanup all effects**, every setInterval, setTimeout, WebSocket, EventSource must have cleanup in useEffect return
9. **Self-healing panels**, if an API fails, show stale cache. If no cache, hide the panel. Never show error states to users.
10. **Save layout on every change**, localStorage auto-save via useEffect watchers, not a save button
11. **Specs as single files, NEVER inline**, all CC specs delivered as ONE downloadable file with a link. NEVER display spec content inline in the chat message. Save the file, provide the link, done. No pasting the full spec into the conversation. The user should copy ONE file, not 20+ blocks from a chat. This is non-negotiable.
12. **Test after every change**, verify the site still works before committing
13. **React.memo on all panels**, for performance on dashboards with 30+ panels rendering simultaneously
14. **Mobile-specific optimizations**, content-visibility: auto, doubled polling intervals, animations disabled, max 8 items per feed
15. **Every new panel requires a layout version bump**, in useLayoutManager.ts to force existing users to see the new panel
16. **Every new blog article triggers prebuild**, scripts/generate-blog-data.js regenerates blog-latest.json AND updates SEO block in index.html
17. **Always use `npx wrangler`** for Worker deployments, the browser editor is error-prone for large files
18. **No ad placeholders or AdSense script tags** until AdSense is approved, they caused the first rejection
19. **Use wrangler secret put for sensitive values**, never commit keys, even encrypted

### CC Spec Workflow (April 17, 2026)

All CC specs live in the **project root** of `terminalfeed/` as single markdown files. Evan copies the file contents directly into a new CC conversation. Workflow rules:

- **File naming convention:** `cc-spec-<topic>.md` (e.g., `cc-spec-backend-hardening.md`, `cc-spec-new-panels.md`). Use kebab-case. Dated prefixes are NOT needed — git history carries the date.
- **One spec = one file = one topic.** Never split a topic across files. Never combine unrelated topics.
- **Location:** `/terminalfeed/cc-spec-*.md` (project root). NOT in a subfolder. Evan finds them by listing the project root.
- **Workflow on Evan's side:** Opens the `.md` file in editor → select all → paste into new CC conversation in the terminal. The file IS the CC prompt.
- **Spec structure template:**
  1. Title + date + priority tier (CRITICAL / HIGH / MEDIUM / LOW)
  2. Executive summary (2-5 bullets of what this fixes and why)
  3. Numbered sections, each independently executable as a single commit
  4. Execution order list at the bottom
  5. Verification checklist (how to confirm success)
  6. Explicit "what this spec does NOT cover" to prevent scope creep
- **Every spec must re-state the infrastructure protection rules** in a "Note to CC" footer, because CC reads specs in fresh sessions without CLAUDE.md context.
- **Never paste spec content inline in a Cowork chat message** (rule #11 above). Always save as a file and link it via `computer://` URL.
- **Active spec files currently in root:**
  - `cc-improvement-spec.md`, `cc-spec-round2.md`, `cc-spec-hardening.md`, `new-panel-specs.md`, `related-content-component-spec.md`, `cc-spec-backend-hardening.md` (April 17, 2026 audit)
- **Lifecycle:** Once CC has fully executed a spec and it's shipped, move the file to `cc-specs-archive/` (create if missing). Keeps root clean. Do not delete — archive provides history.

### Infrastructure Protection Rules (learned from April 15, 2026 Pages deletion)
- **NEVER add @cloudflare/vite-plugin to this project.** It converts Pages projects into Workers projects and will destroy the deployment.
- **NEVER add wrangler.jsonc or wrangler.toml to the project root.** The only wrangler config allowed is inside `worker-additions/` for the API Worker. A root-level wrangler config with `"name": "terminalfeed"` will hijack the domain from the Pages project.
- **The canonical Worker source is `worker-additions/worker.js` deployed via `worker-additions/wrangler.toml`.** The old orphan subfolder `worker-additions/terminalfeed-api/` was deleted on 2026-04-30; do not recreate it. Any worker source other than the canonical one is forbidden.
- **NEVER add `wrangler deploy` or `wrangler dev` as npm scripts.** Those are Workers commands, not Pages commands. Pages deploys via git push to Cloudflare Pages, not via wrangler.
- **NEVER let Cowork or any non-CC tool directly edit vite.config.ts, package.json, or any Cloudflare config file.** These are critical infrastructure files. Other tools write specs, CC executes.
- **Before any deploy, verify the Pages project exists:** `npx wrangler pages project list` must show "terminalfeed". If it doesn't, STOP and investigate.
- **Deploy order: Worker API first (`worker-additions/`), then frontend via git push.** Never mix Workers and Pages deployments.

### Incident Log
- **April 17, 2026 - API LEAKAGE & LOADING-STATE STALLS:** Live network audit revealed ~50 direct browser-to-external-API calls bypassing the Worker entirely, violating rule #6. Most urgent: Finnhub paid API key `d6qig99r01qhcrmkbj4gd6qig99r01qhcrmkbj50` exposed in 22+ URLs on every page view (anyone can steal it). Secondary: CoinGecko 503'ing from rate limits (6 direct calls per visitor), 5 status page APIs 503'ing (Anthropic/Slack/Stripe/Zoom/Cloudflare), BTC hero panel stuck on static $75,475 fallback while `/api/btc-price` returns live $77,407 in 150ms (front-end hook does not fall back to HTTP when WebSocket fails), 21 panels stuck on "loading..." indefinitely (no self-healing timeout, violates rule #9). Fix spec: `cc-spec-backend-hardening.md`. Prevention: add `grep` check for `fetch('http` to pre-deploy verification script in `scripts/verify-deploy.js`, fail the build if any direct external API call is detected in `src/`.
- **April 15, 2026 - FULL SITE DESTRUCTION:** Cowork session added `@cloudflare/vite-plugin` to package.json, created `wrangler.jsonc` at root with `"name": "terminalfeed"`, and changed npm scripts to use `wrangler deploy`. This converted the entire project from Cloudflare Pages to Cloudflare Workers, created a competing Worker that stole the terminalfeed.io domain route, and deleted/orphaned the original Pages project. The MemeRadarPanel also crashed the app by calling `.toFixed()` on undefined API data. Cowork then corrupted package.json while trying to fix it, making rebuilds impossible. CC had to recreate the Pages project from scratch and restore all config files. Root causes: (1) dangerous plugin added without understanding Cloudflare Pages vs Workers distinction, (2) no null-safe defaults on API data, (3) non-CC tool editing critical config files. Prevention: infrastructure protection rules above.

---

## Current Status (April 15, 2026)

- Dashboard: Live with 30+ panels including ETH Gas Tracker, TF Originals
- API Worker: Live with 23+ data endpoints (/api/gas, /api/error added Apr 15; /api/meme-radar deprecated Apr 20 — remove next cleanup) + X bot
- X Bot: Live, auto-posts daily briefing at 9 AM ET, manual tweets via POST /api/tweet
- Blog: 26+ substantial original articles across 5 author personas
- Tools: 24 live (added satoshi, gwei, hex converters)
- Glossary: 45+ terms across crypto, dev, AI, security categories
- Cheatsheets: Git, Docker, HTTP status codes
- i18n: Live in Spanish, Portuguese, German
- SEO: Schema.org + breadcrumbs + RSS feed + static SEO block all deployed
- Accessibility: ARIA labels, skip-to-content link, role="region" on all panels
- Error monitoring: Client errors POST to /api/error, visible in Cloudflare Workers logs
- AdSense: Rejected twice, fixes deployed, awaiting re-review
- Traffic: ~350 real visits/day with zero promotion. 12K+ API requests/day.
- Google Search Console: Verified, sitemap submitted, 140+ pages indexed

---

## Upcoming Roadmap

### Immediate (this week)
1. Verify static SEO content block is visible in Google Search Console URL Inspection
2. Request re-indexing of homepage
3. Resubmit AdSense with "I confirm I have fixed the issues"
4. Write and publish 3-5 more daily blog articles
5. Monitor X bot for cron reliability

### Post-AdSense Approval
1. Place manual ad units (3 slots, dark styled)
2. Update ads.txt with publisher ID
3. Marketing blitz: HN Show HN post, Reddit cross-posts across 8 subreddits, X launch tweet, Dev.to article, Product Hunt launch
4. Build /widgets section (embeddable iframe widgets for backlink compounding)
5. Build /glossary section (50+ term dictionary for "what is X" SEO)
6. Build author profile pages (/team/ripper, /team/zer0day, etc.)

### Medium Term
1. Build remaining planned tools (diff, cron, hash, color, API tester, markdown, yaml, chmod, port, password, dns, ssl, ssh-key, qr)
2. Add new API feeds: FRED expansions, NOAA space weather, NASA FIRMS wildfires, NPM download trends
3. Expand to daily article cadence with CC-assisted drafting + manual editorial review
4. Explore /gifs section (curated tech/crypto memes) after AdSense established
5. Original ambient music tracks for /radio (Evan produces in Cubase)

### Long Term
1. Potential premium tier via Lemon Squeezy (advanced tools, saved API collections, custom dashboards)
2. Mobile app (React Native/Expo reusing existing components)
3. Editorial expansion, guest contributors, weekly newsletter
4. Partnership with AI agent platforms for official data source status

---

## Related Projects

Evan runs a similar setup for two sister sites with shared patterns:
- **TensorFeed.ai**, AI news aggregator, same Cloudflare Pages + Worker stack
- **VR.org**, Rebuilt as Next.js editorial/aggregator with X bot (@vrdotorg, 8-10 posts/day)
- **DramaRadar.com**, Reality TV aggregator for Carly on Cloudflare Pages/Worker/KV

All three use the same core patterns: Cloudflare Pages frontend, Worker API backend, original blog content for SEO, X bot for automated social posting, AdSense for monetization.

---

## App Ideas (Saved for Later)
- "Note to Self", simple note-taking app, iOS/Android/web
- "Watch Claude Cook", mobile app to stream Claude Code terminal output to phone in real-time
