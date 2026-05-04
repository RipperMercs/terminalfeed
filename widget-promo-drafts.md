# /widgets Promo Drafts

Drafted May 3, 2026. Copy-paste ready. Read the rules of each subreddit before posting (especially r/Bitcoin and r/CryptoCurrency, both have strict self-promotion windows). Most subs allow self-promo if you have prior comment karma there.

---

## 1. Hacker News (Show HN)

**Title** (80 char limit, this is 71):
```
Show HN: Free embeddable Bitcoin ticker, no signup, sub-second updates
```

**URL field:** `https://terminalfeed.io/widgets`

**First comment** (post immediately after submission, HN expects this):
```
Builder here. Quick context on what this is and why I made it.

I run terminalfeed.io, a real-time data dashboard for crypto, stocks, news, and a bunch of other live feeds. The most-used piece is the BTC ticker at the top of the page, so I extracted it as an embeddable iframe widget anyone can drop on their site.

What's there:
- BTC price (Binance WebSocket primary, CoinCap fallback)
- BTC ticker with 24h change
- Crypto top movers
- Fear and Greed Index
- USGS earthquakes
- Hacker News top stories
- World clocks
- Service status (GitHub, Cloudflare, OpenAI, etc.)

Each one is one-line iframe, dark or light theme via query param. No JS bundle to load, no tracking pixels, no signup. The widgets pull from the same Cloudflare Worker that powers the dashboard, which has no auth and no published rate limit.

The whole thing is free and ad-free today (I'm in AdSense review, will be small manual placements only when approved).

Source on the Worker: it's a single ~7500 line worker.js (warts and all). I can put it on GitHub if there's interest.

Happy to answer questions about the architecture, the rate-limit handling, or why I picked WebSocket over polling for the price feed.
```

---

## 2. Reddit: r/CryptoCurrency

**Important:** This sub has aggressive self-promo filters. Post under "Strategy" or "Tools" flair only after you've been active in comments for at least a week. Likely to get removed if posted cold.

**Title:**
```
I built a free, ad-free Bitcoin price embed for blogs and dashboards (no signup, no key)
```

**Body:**
```
Hey all. I've been running terminalfeed.io as a real-time data dashboard for the last while, and a lot of people kept asking if they could grab just the BTC ticker for their own sites.

So I shipped /widgets: drop-in iframes for the BTC price, top crypto movers, Fear and Greed Index, etc. Dark or light theme. One line of HTML, no scripts, no tracking.

The price feed updates every second on desktop via Binance WebSocket. Falls back to CoinCap if Binance has issues. No API key, no rate limit you'll hit on a normal site.

Mostly built it because I wanted my own clean embed without the "Buy on Coinbase" CTA or the CMC ad load. Free for anyone to use.

Direct link: https://terminalfeed.io/widgets

Comparison writeups for the curious:
- vs CoinGecko: https://terminalfeed.io/blog/terminalfeed-vs-coingecko-ticker
- vs Coinbase widget: https://terminalfeed.io/blog/terminalfeed-vs-coinbase-price-widget
- vs CoinMarketCap: https://terminalfeed.io/blog/terminalfeed-vs-coinmarketcap-ticker

Happy to take feedback or feature requests.
```

---

## 3. Reddit: r/Bitcoin

**Important:** Very strict. Promotional posts get removed unless you have history in the sub. If you have karma there, post it; otherwise skip.

**Title:**
```
Free embeddable BTC ticker for your site, sub-second updates, no key
```

**Body:**
```
Built this for terminalfeed.io and figured the ticker is useful on its own. /widgets has a drop-in iframe for live BTC price (Binance WebSocket relay, CoinCap fallback). One line of HTML, dark or light theme.

No signup. No tracking. No "buy now" CTA. Just the price.

https://terminalfeed.io/widgets

Source: same Cloudflare Worker that powers the rest of the dashboard. Open API at /api/btc-price if you want raw JSON instead of the embed.

Hope it's useful.
```

---

## 4. Reddit: r/SideProject

(Friendlier sub for self-promo, post your story not your product.)

**Title:**
```
Shipped a free embeddable Bitcoin ticker after my dashboard's BTC price kept getting requested as a standalone
```

**Body:**
```
Background: I run terminalfeed.io, a dark dashboard with 30+ live feeds (crypto, stocks, news, prediction markets, earthquakes). The BTC hero at the top of the page is the most-requested standalone feature.

So I extracted it: terminalfeed.io/widgets has drop-in iframes for the BTC price, top crypto movers, Fear and Greed, world clocks, service status, etc. Each one is one line of HTML.

What I learned building it:
- WebSocket beats polling for live tickers, but you need to handle reconnect aggressively (mobile tabs suspend the connection on backgrounding).
- "Free no-key API" makes a sub-second ticker much harder to ship cleanly. Most upstreams (CoinGecko, CMC) gate the good frequencies behind keys, so I run Cloudflare Worker that holds an open WS to Binance and serves the cached value.
- People care about the absence of stuff (no tracking, no signup, no "buy now" CTA) more than I expected. The embed competitors (Coinbase, CMC) all bundle marketing surfaces.

Hosted on Cloudflare Pages + Worker. Free tier handles the load fine (~12K API requests/day so far).

https://terminalfeed.io/widgets

Open to questions or feedback.
```

---

## 5. Dev.to

**Title:**
```
I Built a Free Embeddable Bitcoin Ticker (No Signup, Sub-Second Updates) in a Cloudflare Worker
```

**Tags:** `webdev`, `javascript`, `crypto`, `cloudflare`

**Body (markdown):**
```markdown
# I Built a Free Embeddable Bitcoin Ticker in a Cloudflare Worker

If you've ever tried to drop a live Bitcoin price on a side project, you've hit one of these walls:

- **CoinGecko free tier:** Rate limited, requires attribution, updates roughly every 60 seconds.
- **CoinMarketCap free API:** Key required, restrictive limits, slow on the free tier.
- **Coinbase widget:** Branded with their logo and a "Buy on Coinbase" CTA pointed at your visitors.
- **Roll your own:** Now you're maintaining a WebSocket reconnect loop and rate-limit handling.

I hit all four while building [terminalfeed.io](https://terminalfeed.io), so I extracted the BTC ticker into a free embed anyone can use.

## What's in the embed

- Live BTC price, ~1s update via Binance WebSocket
- 24h change, color-coded
- Auto-fallback to CoinCap if Binance is unreachable
- Stale indicator if both fail (instead of showing a wrong number)
- Dark or light theme via query param
- One line of HTML, no JavaScript bundle, no third-party trackers

## How to use it

```html
<iframe
  src="https://terminalfeed.io/embed/btc-ticker?theme=dark"
  width="280"
  height="100"
  frameborder="0">
</iframe>
```

That's it. Swap `theme=dark` for `theme=light` if your site is light-mode.

If you want raw data instead of the rendered widget, the underlying API is also open:

```javascript
const r = await fetch('https://terminalfeed.io/api/btc-price');
const { data } = await r.json();
// data.price_usd, data.change_24h_percent, data.high_24h, data.low_24h
```

No key, no auth, CORS open, returns last-known-good value with a timestamp if upstreams flake.

## How it works under the hood

The whole thing is a single Cloudflare Worker (~7500 lines, growing). It holds a hot WebSocket connection to Binance for the live BTC price, caches the value with an explicit TTL, and serves it through `/api/btc-price`. The embed at `/embed/btc-ticker` is a tiny static HTML file that polls the API and renders the value.

The cache + WebSocket combination is what makes the "no rate limit" claim work. The Worker hits Binance once and serves thousands of clients from the cache.

## Other widgets in the gallery

[/widgets](https://terminalfeed.io/widgets) also has embeds for crypto top movers, Fear and Greed Index, USGS earthquakes, Hacker News top stories, world clocks, and service status (GitHub, Cloudflare, OpenAI, etc.).

## Why I built it

Honest answer: I needed a clean BTC ticker for my own dashboard, and the existing options either had marketing CTAs aimed at my visitors or update frequencies measured in minutes. Once I had it working for myself, extracting it as a public widget was a few hundred lines and felt like the right thing to do.

Free, MIT-spirit, no telemetry. Hope it's useful.

---

If you want to dig into the architecture trade-offs, I wrote a longer piece on [why we chose WebSocket over polling](https://terminalfeed.io/blog/bitcoin-ticker-websocket-vs-polling) and [a comparison vs CoinGecko's API](https://terminalfeed.io/blog/terminalfeed-vs-coingecko-ticker).
```

---

## 6. X / Twitter (from @terminalfeed)

**Tweet 1 (announcement):**
```
new: free embeddable bitcoin ticker

> sub-second updates (binance ws relay)
> no signup, no key, no rate limit
> one line of html, dark or light theme
> falls back gracefully when upstreams flake

drop it on any site:
terminalfeed.io/widgets
```

**Tweet 2 (reply / quote-bait):**
```
also free at the api layer:

curl https://terminalfeed.io/api/btc-price

returns json, cors open, no auth. last-known-good with timestamp if binance is down.

build whatever you want with it.
```

**Tweet 3 (technical, for devs):**
```
the architecture is one cloudflare worker holding a hot websocket connection to binance and serving the cached price to thousands of clients.

that's how "no rate limit" works. one upstream connection, cached output, free for everyone.
```

---

## Posting order suggestion

Day 1: HN Show HN (highest leverage, time-of-day matters: post Tue-Thu morning ET)
Day 1 evening: X thread (3 tweets above)
Day 2: r/SideProject (friendliest sub, low risk)
Day 3: Dev.to (slow burn but stays in feed for weeks)
Day 5+: r/CryptoCurrency / r/Bitcoin only if you've been active enough in comments to not get auto-filtered

Skip the crypto-specific subs entirely if you don't have karma there. The post will get nuked and the link can get flagged.
