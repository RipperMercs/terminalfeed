# CLAUDE.md — TerminalFeed.io

Last updated: April 14, 2026

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
/api/tweet         — POST tweet to @terminalfeed (Bearer ADMIN_SECRET)
/api/auto-briefing — Generate and post automated briefing tweet (Bearer ADMIN_SECRET)
```

### Worker Environment Variables
- FINNHUB_API_KEY, stock quotes
- FRED_API_KEY, economic data from fred.stlouisfed.org
- X_API_KEY, X/Twitter API consumer key
- X_API_SECRET, X/Twitter API consumer secret
- X_ACCESS_TOKEN, X/Twitter API access token
- X_ACCESS_TOKEN_SECRET, X/Twitter API access token secret
- ADMIN_SECRET, protects /api/tweet and /api/auto-briefing endpoints

### Cron Triggers
- `0 14 * * *`, Daily at 9 AM ET (2 PM UTC), runs auto-briefing tweet via scheduled() handler in Worker

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
/agent         — AI Agent Tracker (34 agents, 7 categories, live status checks)
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
11. **Specs as single files**, all CC specs delivered as one downloadable file, never split across multiple blocks
12. **Test after every change**, verify the site still works before committing
13. **React.memo on all panels**, for performance on dashboards with 30+ panels rendering simultaneously
14. **Mobile-specific optimizations**, content-visibility: auto, doubled polling intervals, animations disabled, max 8 items per feed
15. **Every new panel requires a layout version bump**, in useLayoutManager.ts to force existing users to see the new panel
16. **Every new blog article triggers prebuild**, scripts/generate-blog-data.js regenerates blog-latest.json AND updates SEO block in index.html
17. **Always use `npx wrangler`** for Worker deployments, the browser editor is error-prone for large files
18. **No ad placeholders or AdSense script tags** until AdSense is approved, they caused the first rejection
19. **Use wrangler secret put for sensitive values**, never commit keys, even encrypted

---

## Current Status (April 14, 2026)

- Dashboard: Live with 30+ panels including Originals panel
- API Worker: Live with 20+ data endpoints + X bot integration
- X Bot: Live, auto-posts daily briefing at 9 AM ET, manual tweets via POST /api/tweet
- Blog: 20+ substantial original articles across 5 author personas
- Tools: 7 live, 14 more planned
- i18n: Live in Spanish, Portuguese, German
- SEO: Schema.org + breadcrumbs + RSS feed + static SEO block all deployed
- AdSense: Rejected twice, fixes deployed, awaiting re-review
- Traffic: ~350 real visits/day with zero promotion. 12K+ API requests/day.
- Google Search Console: Verified, sitemap submitted, 95+ pages indexed

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
