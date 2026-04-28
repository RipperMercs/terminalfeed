# TerminalFeed Premium API: State of the Tier

*Last updated: 2026-04-28. All endpoints live and mainnet-validated.*

This is the canonical reference for what the premium tier covers, why an
agent would pay for each endpoint, and how the discovery surface routes
agents to the tier. Use it when planning new endpoints, drafting
marketing copy, or onboarding contributors.

---

## The Premium Endpoints

| Path | Cost | Composes | Cache | Primary Agent Persona |
|---|---|---|---|---|
| `/api/pro/briefing` | 1 cr / $0.02 | 6 sources | 60s | Daily-briefing LLMs, content generators |
| `/api/pro/macro` | 2 cr / $0.04 | 14 sources | 5min | Trading bots, macro research agents |
| `/api/pro/crypto-deep` | 2 cr / $0.04 | 7 sources | 60s | Crypto traders, on-chain analysts |
| `/api/pro/agent-context` | 2 cr / $0.04 | 13 sources + system_prompt | 5min | Any agent at session start |
| `/api/pro/sentiment` | 2 cr / $0.04 | 7 sources | 5min | Sentiment trading, social monitors |
| `/api/pro/world-deltas` | 2 cr / $0.04 | 4 sources, time-sorted | 60s rolling 1h bucket | Monitor agents (poll loops) |
| `/api/pro/correlation-matrix` | 2 cr / $0.04 | 10 assets, 30d Pearson | 30min | Portfolio agents, risk sizing |
| `/api/pro/whales` | 2 cr / $0.04 | BTC mempool + ETH last 3 blocks | 5min | Trading bots watching institutional flow |
| `/api/pro/exchange-flows` | 2 cr / $0.04 | 7 CEX hot wallets, last 3 blocks | 5min | Regime-shift trading bots |

### Endpoint-by-endpoint detail

#### `/api/pro/briefing` — World Snapshot

Composes BTC ticker (Binance), Crypto Fear & Greed (alternative.me),
recent earthquakes (USGS), top HN story count, ISS crew, Polymarket
prediction markets sorted by 24h volume. Optional `?include=` filter,
optional `?history=24h` adds hourly BTC chart.

Single call replaces 6 separate auth-and-parse loops. The cheapest
"what's going on" probe before a more expensive composed call.
Differentiator vs. free `/api/briefing`: premium adds Polymarket
markets and the optional history series.

#### `/api/pro/macro` — Composed Macro Snapshot

FRED series (Fed funds rate, CPI, unemployment, GDP, 10Y treasury, WTI
oil, natural gas), Frankfurter forex (EUR/JPY/GBP/CHF base USD), gold
via Kraken PAXG, US indices (SPY/DIA/QQQ via Finnhub) and VIX (Finnhub
primary, FRED VIXCLS fallback). Optional `?history=30d`.

A trading bot's regime context. Without us: FRED key, Finnhub paid plan,
Frankfurter integration, code that reconciles four different timestamp
formats. The biggest single-call density of macro context any agent-
payable API ships.

#### `/api/pro/crypto-deep` — Deep Crypto Snapshot

Top 50 coins by market cap with 1h/24h/7d change (CoinLore), Binance
live ticker for top 20 USDT pairs by volume, mempool.space network stats
(block height, fee tiers, hashrate, mempool size), Etherscan gas oracle.
Optional `?coins=` filter, optional `?history=30d` for daily BTC OHLCV.

Replaces calling CoinGecko + Binance + mempool.space + Etherscan
separately. Crypto traders need all of these every cycle.

#### `/api/pro/agent-context` — The Curated System Prompt

Composes 13 sources into both a structured JSON `context` object and a
pre-formatted `system_prompt` string ~350 tokens that an agent pastes
verbatim into LLM context.

The deepest moat in the lineup. The data is free elsewhere. The
curation choices (which 13 signals matter, how to compress them, what
format) cannot be cloned by a competitor without making their own taste
decisions. Live test caught Microsoft/OpenAI deal ending, GitHub Copilot
pricing change, $26M Iran ceasefire prediction market, an
auto-detected Cloudflare minor issue, all in one paste-ready blob.

Killer use case: anything that wants the LLM to know "what's true right
now" before reasoning. Avoids hallucinated dates and stale knowledge
cutoffs.

#### `/api/pro/sentiment` — Composite Market Sentiment

Crypto Fear & Greed, VIX, top 15 trending tickers across HN top 30 +
Reddit r/CryptoCurrency / r/wallstreetbets / r/stocks hot posts (with
regex-based positive/negative keyword scoring), top Polymarket markets
by 24h volume.

Per-ticker output: mention_count_24h, sources breakdown, sentiment_score
(-1 to +1), label, 3 sample headlines. Honest scoring transparency in
the notes field.

#### `/api/pro/world-deltas` — Event Stream for Monitor Poll Loops

Time-sorted event stream from 4 upstream sources: USGS earthquakes
M4.0+, HN front-page items in window, recently-updated Polymarket
markets >= $10K 24h volume, space launches in [-1h, +12h] window.
`?since=<ISO>` filters to events after that timestamp.

Replaces 4 separate polls + client-side time merging. 1-hour rolling
cache means sub-second response when warm.

#### `/api/pro/correlation-matrix` — Cross-Asset Pearson

30-day Pearson correlation matrix on daily returns across 10 assets:
BTC, ETH, SOL, AVAX, LINK (Coinbase candles), gold via PAXG, treasury
10Y/2Y, USD trade-weighted index, WTI oil (FRED). Both pairs array and
NxN matrix.

Saves portfolio agents from fetching 10 historical price series and
running covariance math each cycle.

#### `/api/pro/whales` — Large On-Chain Movements

BTC mempool transactions >= 10 BTC (mempool.space), ETH transactions
>= 100 ETH from the last 3 blocks (publicnode JSON-RPC). Each tx
tagged with USD-equivalent at current spot, hash, addresses (ETH only),
explorer URL.

Trading bots watching for institutional flow. Live test caught a 600 ETH
($1.37M) whale on first call.

#### `/api/pro/exchange-flows` — CEX Net Flow

ETH transfers in/out of 19 hardcoded CEX hot wallets across 7 exchanges
(Binance, Coinbase, OKX, Kraken, Bybit, Crypto.com, KuCoin) in the last
3 blocks. Per-exchange aggregates and global with bias label
(inflow_dominant / outflow_dominant / balanced).

Sustained large net inflow historically precedes selling pressure;
outflow precedes accumulation. Hard signal that requires a
labeled-address dataset; we ship the curated list.

---

## Discovery Infrastructure

**Machine-readable manifests:**
- `/openapi.json` (OpenAPI 3.1.0): full spec, `agentBearer` security
  scheme, `x-pricing-credits` / `x-pricing-usd` extensions on every
  premium operation
- `/.well-known/ai-plugin.json`: OpenAI plugin manifest format
- `/llms.txt`: discovery section at top, full endpoint inventory
- `/agents.txt`: capability manifest in INI-like format
- `/api/llm-tools`: pre-baked OpenAI / Anthropic function-calling
  tool defs for all tools, `?format=anthropic|openai|raw|both`
- `/api/mcp`: HTTP MCP server, JSON-RPC 2.0, protocolVersion 2024-11-05.
  All tools native. Bearer doubles as MCP credential.

**HTTP-level signals on every `/api/*` response:**
- `X-TerminalFeed-Pricing` header
- `Link` header (RFC 8288) with rels: service-desc, describedby,
  alternate, payment

**SEO landing pages:**
- `/api/for-agents`: canonical agent-builder landing, why-not-DIY table,
  full endpoint catalog, three code-language quick-starts
- `/api/usdc-payable`: X402-pattern landing, what 1 USDC buys, FAQ
- `/developers/agent-payments`: full developer guide with 6 JSON-LD
  blocks (TechArticle, BreadcrumbList, HowTo, FAQPage, Product+Offer,
  WebAPI)
- `/use-cases/trading-bots`: 1000-word landing for "API for AI trading
  bots"
- `/compare/vs-subscription-apis`: honest comparison vs Messari /
  CoinAPI / Alpha Vantage paid / Polygon.io with pricing math

**Crawler hygiene:**
- `/robots.txt` explicitly allows GPTBot, ChatGPT-User, OAI-SearchBot,
  ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User,
  Google-Extended, Applebot-Extended, CCBot, Meta-ExternalAgent,
  cohere-ai, DuckAssistBot, MistralAI-User, YouBot, Diffbot. Plus the
  two `/api/` SEO pages explicitly allowed for general crawlers.

---

## Payment Rail

- Wallet `0x549c82e6bfc54bdae9a2073744cbc2af5d1fc6d1` on Base mainnet,
  USDC. Cross-verified at `/terms#premium`,
  `/developers/agent-payments`, `/llms.txt`, GitHub README.
- Mainnet validation tx:
  `0x6aa357c7e984e9bedef0987021f67ac4616b5446c3895d2eb64da5e98c56614c`
- Pricing: $1 USDC = 50 credits. No subscription. No expiry. 24-hour
  refund window. Inference-only license (premium responses are not
  training data).
- Atomic charge: credits decrement before upstream fetch begins;
  partial responses still count.

## Webhooks (Push Mode)

- `POST /api/pro/subscribe` creates a sub. `GET /api/pro/subscriptions`
  lists. `DELETE /api/pro/subscribe/<id>` cancels.
- Cron `*/5 * * * *` scans active subs, charges 1 credit per fire
  ($0.02), HMAC-SHA256-signs payload with sub-specific secret, POSTs.
- Cheaper than polling. Per-token cap 5 active subs. Auto-pause on
  insufficient_credits. SSRF-safe URL validation.

## Observability

- `GET /api/admin/agent-traffic` (gated by `ADMIN_SECRET`): live
  counters for total requests, by_endpoint, by_user_agent_family,
  bearer-vs-no-bearer split, MCP method/tool calls, payment events,
  webhook stats, active and paused sub counts.
- Workers Analytics Engine (`agent_traffic` dataset): structured data
  point on every request, SQL-queryable for long-horizon analysis.

## Cross-Site Bundle

Tokens minted by `/api/payment/confirm` on terminalfeed.io are jointly
redeemable on tensorfeed.ai. Same wallet, same chain, shared credit
pool. One USDC purchase, two data sources.
