# New Dashboard Panel Specs for CC

## 1. ETH Gas Tracker Panel

### Data Source
Free endpoint: https://api.etherscan.io/api?module=gastracker&action=gasoracle (needs free API key)
Alternative: https://api.blocknative.com/gasprices/blockprices (free tier)
Fallback: Use etherscan's gas oracle which returns low/average/fast gwei prices

### API Worker Route
Add `/api/gas` endpoint to the Worker:
- Cache TTL: 15 seconds (gas changes fast)
- Returns: { low, standard, fast, baseFee, lastBlock }
- Needs ETHERSCAN_API_KEY env var (free registration)

### Hook: `useGasTracker.ts`
- Poll /api/gas every 15 seconds
- Track 5-minute history for trend arrows
- Static fallback: { low: 8, standard: 12, fast: 18 }

### Panel Display
```
ETH GAS                         GWEI     15s
-------------------------------------------------
SLOW        8 gwei      ~$0.38    ~5 min
STANDARD   12 gwei      ~$0.57    ~1 min
FAST       18 gwei      ~$0.86    ~15 sec
-------------------------------------------------
Base Fee: 7.2 gwei    Block: 19,847,223
-------------------------------------------------
L2 GAS (estimated)
Arbitrum    ~0.1 gwei   Base    ~0.08 gwei
Optimism    ~0.1 gwei   Polygon ~30 gwei
```

### Colors
- Slow: var(--green) when under 10, var(--amber) 10-30, var(--red) over 30
- Standard: same scale
- Fast: same scale
- L2 prices always var(--text-dim) since they're estimates

### Panel ID: `gas`
Add to defaultLayout.ts panel order. Suggested position: after crypto panels.


## 2. Memecoin Radar Panel

### Data Source
DexScreener API (free, no key needed):
- https://api.dexscreener.com/latest/dex/tokens/trending
- Returns trending tokens with price, volume, age, chain

### API Worker Route
Add `/api/meme-radar` endpoint:
- Cache TTL: 60 seconds
- Filter: only tokens < 7 days old, > $50K volume
- Return top 8 by volume
- Fields: name, symbol, chain, price, priceChange24h, volume24h, age, pairUrl

### Hook: `useMemecoinRadar.ts`
- Poll /api/meme-radar every 60 seconds
- Cap array at 8 items
- No static fallback needed (hide panel if no data)

### Panel Display
```
MEMECOIN RADAR               DEXSCREENER    60s
-------------------------------------------------
HOT    PEPE2.0   SOL    $0.00042  +342%   2d
HOT    WOJAK     ETH    $0.0018   +127%   5d
NEW    DEGEN     BASE   $0.0031   +89%    1d
NEW    MOON      SOL    $0.00001  +2100%  6h
...
-------------------------------------------------
source: dexscreener.com
```

### Colors
- HOT badge: var(--red) background with white text (tokens > 100% gain)
- NEW badge: var(--green) background (tokens < 24h old)
- Price change: green if positive, red if negative
- Chain labels: dim text

### Panel ID: `meme-radar`
Suggested position: after crypto panels, near whale watch.

### Warning
Add a subtle disclaimer at bottom: "High risk. Not financial advice. DYOR."


## 3. Panel Fixes Needed

### Remove Fitness Panel
The Fitness panel is still visible at the bottom of the dashboard (showing steps, pizza consumed, etc. with a bacon image). Per CLAUDE.md, this was supposed to be removed in April 2026 for professionalism.

Action:
1. Remove from panelRegistry in App.tsx
2. Remove from defaultLayout.ts panel order
3. Remove useFitness hook if it exists (or just the panel entry)
4. Bump layout version to force refresh

### Fix Predictions Panel Loading State
The Polymarket predictions panel was stuck on "loading markets..." during my review. This violates the self-healing rule.

Action:
1. Add a 10-second timeout to the predictions fetch
2. If still loading after 10s AND no cached data, hide the panel
3. If cached data exists, show it with a "stale" indicator
4. Check if the Gamma API endpoint has changed or needs a different path

### Fix Flight Radar Loading State
Same issue: "Contacting OpenSky Network..." was showing indefinitely.

Action:
1. OpenSky's free API is notoriously unreliable. Add 8-second timeout.
2. If no data after timeout, hide panel entirely (no "Contacting..." message)
3. Consider switching to ADS-B Exchange API or removing the panel if OpenSky stays flaky

### Blog Index Update
The 6 new blog articles (3 from previous session + 3 comparison articles) need to be added to:
1. `/public/blog/index.html` (add article cards)
2. Run `node scripts/generate-blog-data.js` to update blog-latest.json
3. Update `/public/feed.xml` with new RSS entries
4. Update `/public/sitemap.xml` with all new pages (see deploy checklist below)

### Tools Index Update
The tools index page needs 3 new cards for:
- Satoshi Converter (/tools/satoshi)
- Gwei Calculator (/tools/gwei)
- Hex Converter (/tools/hex)

### Navigation Updates
Consider adding to the top nav or footer:
- /status (Is It Down)
- /cheatsheets (Developer Cheatsheets)


## Deploy Checklist for All New Pages

### New pages to add to sitemap.xml:
```
/status
/tools/satoshi
/tools/gwei
/tools/hex
/cheatsheets
/cheatsheets/git
/cheatsheets/docker
/cheatsheets/http
/blog/cron-decoded
/blog/browser-extensions-watching
/blog/real-time-vs-near-real-time
/blog/rest-vs-graphql
/blog/websocket-vs-sse
/blog/claude-vs-chatgpt
```
Plus 25 new glossary pages (all the ones we created earlier).

Total new URLs for sitemap: ~39 pages

### Estimated site total after deploy:
- Blog articles: 27 (was 21 + 6 new)
- Tools: 24 (was 21 + 3 new converters)
- Glossary terms: 50 (was 25 + 25 new)
- Cheatsheets: 4 (new section)
- Standalone pages: ~15 (adding /status)
- Embed widgets: 9
- **Total indexable pages: ~170+**
