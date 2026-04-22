// =============================================================================
// terminalfeed-api - Complete Cloudflare Worker (ES Module format)
// Handles ALL /api/* routes for terminalfeed.io
// IMPORTANT: Set Worker type to "ES Module" in Cloudflare dashboard
// =============================================================================
//
// ENV VARS (set in Cloudflare dashboard > Workers > Settings > Variables):
//   FINNHUB_API_KEY        - stock quotes from Finnhub
//   FRED_API_KEY           - economic data from FRED
//   X_API_KEY              - X/Twitter API consumer key
//   X_API_SECRET           - X/Twitter API consumer secret
//   X_ACCESS_TOKEN         - X/Twitter access token
//   X_ACCESS_TOKEN_SECRET  - X/Twitter access token secret
//   ADMIN_SECRET           - protects /api/tweet and /api/auto-briefing
//
// CRON TRIGGER (add in dashboard > Triggers):
//   0 14 * * *   (2 PM UTC / 9 AM ET - daily briefing tweet)
//
// =============================================================================


const workerStartTime = Date.now();

// --- In-Memory Cache ---

const _cache = {};

function getCached(key, ttlMs) {
  const entry = _cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts < ttlMs) return entry.data;
  return null;
}

function getStale(key) {
  const entry = _cache[key];
  return entry ? entry.data : null;
}

function setCache(key, data) {
  _cache[key] = { data: data, ts: Date.now() };
}

// Simple hit counter (resets on cold start, seeded from date for consistency)
let hitCounter = (function() {
  const d = new Date();
  let h = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return 800 + (Math.abs(h) % 600);
})();


// --- Utilities ---

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data, status, cacheSeconds) {
  status = status || 200;
  cacheSeconds = cacheSeconds || 0;
  var headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (cacheSeconds > 0) {
    headers['Cache-Control'] = 'public, max-age=' + cacheSeconds + ', s-maxage=' + cacheSeconds;
  }
  return new Response(JSON.stringify(data), { status: status, headers: headers });
}

function corsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function fetchWithTimeout(url, opts, timeoutMs) {
  timeoutMs = timeoutMs || 8000;
  opts = opts || {};
  opts.signal = AbortSignal.timeout(timeoutMs);
  // Some upstreams (CoinPaprika, Binance) reject/throttle Cloudflare's default UA
  opts.headers = Object.assign({
    'User-Agent': 'terminalfeed.io/1.0 (+https://terminalfeed.io)',
    'Accept': 'application/json',
  }, opts.headers || {});
  return fetch(url, opts);
}


// ---Twitter / X OAuth 1.0a 

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

async function hmacSha1(key, message) {
  var enc = new TextEncoder();
  var cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  var sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sig))));
}

async function postTweet(text, env) {
  var url = 'https://api.x.com/2/tweets';
  var params = {
    oauth_consumer_key: env.X_API_KEY,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: env.X_ACCESS_TOKEN,
    oauth_version: '1.0',
  };
  var paramStr = Object.keys(params).sort()
    .map(function(k) { return percentEncode(k) + '=' + percentEncode(params[k]); }).join('&');
  var baseStr = ['POST', percentEncode(url), percentEncode(paramStr)].join('&');
  var sigKey = percentEncode(env.X_API_SECRET) + '&' + percentEncode(env.X_ACCESS_TOKEN_SECRET);
  params.oauth_signature = await hmacSha1(sigKey, baseStr);
  var authHeader = 'OAuth ' + Object.keys(params).sort()
    .map(function(k) { return percentEncode(k) + '="' + percentEncode(params[k]) + '"'; }).join(', ');

  var res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text }),
  });
  return { status: res.status, data: await res.json() };
}


// ---Route Handlers 

// GET /api/
function handleIndex() {
  return jsonResponse({
    name: 'TerminalFeed API',
    version: '1.0',
    docs: 'https://terminalfeed.io/developers',
    endpoints: [
      '/api/briefing', '/api/btc-price', '/api/stocks', '/api/crypto-movers',
      '/api/fear-greed', '/api/earthquake', '/api/predictions', '/api/hackernews',
      '/api/service-status', '/api/cyber-threats', '/api/forex',
      '/api/humans-in-space', '/api/disaster-alerts', '/api/launches',
      '/api/economic-data', '/api/steam', '/api/weather', '/api/ai-stats',
      '/api/xkcd',
    ],
  });
}


// GET /api/btc-price
async function handleBtcPrice() {
  var KEY = 'btc-price';
  var cached = getCached(KEY, 15000);
  if (cached) return jsonResponse(cached, 200, 15);

  try {
    var res = await fetchWithTimeout('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT');
    var d = await res.json();
    var data = {
      data: {
        price_usd: parseFloat(d.lastPrice),
        change_24h_percent: parseFloat(d.priceChangePercent),
        high_24h: parseFloat(d.highPrice),
        low_24h: parseFloat(d.lowPrice),
        volume_24h: parseFloat(d.quoteVolume),
      },
    };
    setCache(KEY, data);
    return jsonResponse(data, 200, 15);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale, 200, 5);
    return jsonResponse({ data: { price_usd: 0, change_24h_percent: 0 } });
  }
}


// GET /api/stocks
async function handleStocks(env, url) {
  var DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'NFLX', 'CRM',
    'COIN', 'INTC', 'PYPL', 'SQ', 'SHOP', 'UBER', 'PLTR', 'SNOW', 'NET', 'CRWD',
    'MSTR', 'RIOT', 'MARA', 'HOOD', 'SOFI'];

  var requested = null;
  if (url && url.searchParams) {
    var q = url.searchParams.get('symbols');
    if (q) {
      requested = q.split(',')
        .map(function(s) { return s.trim().toUpperCase(); })
        .filter(function(s) { return /^[A-Z][A-Z0-9.-]{0,9}$/.test(s); })
        .slice(0, 30);
      requested = Array.from(new Set(requested));
    }
  }

  var symbols = (requested && requested.length > 0) ? requested : DEFAULT_SYMBOLS.slice(0, 15);
  var KEY = 'stocks:' + symbols.join(',');
  // 2-minute cache. Finnhub free tier is 60 calls/min; each cache miss
  // triggers up to 30 parallel upstream calls, so shorter TTLs risk blowing
  // the rate limit whenever traffic bursts.
  var cached = getCached(KEY, 120000);
  if (cached) return jsonResponse(cached, 200, 120);

  try {
    if (!env || !env.FINNHUB_API_KEY) {
      var stale0 = getStale(KEY);
      if (stale0) return jsonResponse(stale0, 200, 30);
      return jsonResponse({ data: [] });
    }

    var results = await Promise.allSettled(
      symbols.map(function(sym) {
        return fetchWithTimeout(
          'https://finnhub.io/api/v1/quote?symbol=' + sym + '&token=' + env.FINNHUB_API_KEY, {}, 6000
        ).then(function(res) { return res.json(); })
         .then(function(d) {
           return {
             symbol: sym,
             price: d.c || 0,
             change: d.d || 0,
             change_percent: d.dp || 0,
             high: d.h || 0,
             low: d.l || 0,
             prev_close: d.pc || 0,
           };
         });
      })
    );

    var stocks = results
      .filter(function(r) { return r.status === 'fulfilled' && r.value.price > 0; })
      .map(function(r) { return r.value; });

    if (stocks.length === 0) {
      // All upstream calls failed (likely rate-limited) — serve stale cache if we have one
      // and DON'T overwrite the cache with empty data.
      var stale1 = getStale(KEY);
      if (stale1) return jsonResponse(stale1, 200, 120);
      return jsonResponse({ data: [] });
    }

    var data = { data: stocks, ts: Date.now() };
    setCache(KEY, data);
    return jsonResponse(data, 200, 120);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale, 200, 120);
    return jsonResponse({ data: [] });
  }
}


// GET /api/coingecko/markets — top 30 by market cap (CoinLore upstream)
// Output shape mirrors CoinGecko /coins/markets so frontend stays unchanged
async function handleCoingeckoMarkets() {
  var KEY = 'cg:markets';
  var cached = getCached(KEY, 120000);
  if (cached) return jsonResponse(cached, 200, 120);
  try {
    var res = await fetchWithTimeout('https://api.coinlore.net/api/tickers/?limit=30');
    if (!res.ok) throw new Error('upstream ' + res.status);
    var json = await res.json();
    var coins = Array.isArray(json.data) ? json.data : [];
    var mapped = coins.map(function(c) {
      return {
        id: c.nameid || (c.symbol || '').toLowerCase(),
        symbol: (c.symbol || '').toLowerCase(),
        name: c.name,
        current_price: parseFloat(c.price_usd) || 0,
        price_change_percentage_24h: parseFloat(c.percent_change_24h) || 0,
        market_cap: parseFloat(c.market_cap_usd) || 0,
        total_volume: parseFloat(c.volume24) || 0,
        image: null,
      };
    });
    var data = { data: mapped, ts: Date.now() };
    setCache(KEY, data);
    return jsonResponse(data, 200, 120);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale, 200, 120);
    return jsonResponse({ data: [] });
  }
}

// GET /api/coingecko/global — total market cap, BTC dominance, etc. (CoinLore upstream)
// Output shape mirrors CoinGecko /global
async function handleCoingeckoGlobal() {
  var KEY = 'cg:global';
  var cached = getCached(KEY, 300000);
  if (cached) return jsonResponse(cached, 200, 300);
  try {
    var res = await fetchWithTimeout('https://api.coinlore.net/api/global/');
    if (!res.ok) throw new Error('upstream ' + res.status);
    var arr = await res.json();
    var g = (Array.isArray(arr) && arr[0]) || {};
    var shaped = {
      active_cryptocurrencies: g.coins_count || 0,
      total_market_cap: { usd: g.total_mcap || 0 },
      total_volume: { usd: g.total_volume || 0 },
      market_cap_percentage: {
        btc: parseFloat(g.btc_d) || 0,
        eth: parseFloat(g.eth_d) || 0,
      },
      market_cap_change_percentage_24h_usd: parseFloat(g.mcap_change) || 0,
    };
    var data = { data: shaped, ts: Date.now() };
    setCache(KEY, data);
    return jsonResponse(data, 200, 300);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale, 200, 300);
    return jsonResponse({ data: null });
  }
}

// GET /api/coingecko/btc-chart — 24h BTC chart (Coinbase Exchange upstream)
// Output shape: { prices: [[timestamp_ms, price], ...] } matches CoinGecko market_chart
async function handleCoingeckoBtcChart() {
  var KEY = 'cg:btc-chart';
  var cached = getCached(KEY, 300000);
  if (cached) return jsonResponse(cached, 200, 300);
  try {
    // 15-min candles (granularity=900). Coinbase returns newest-first.
    var res = await fetchWithTimeout(
      'https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=900'
    );
    if (!res.ok) throw new Error('upstream ' + res.status);
    var candles = await res.json();
    // candle: [time_sec, low, high, open, close, volume] — reverse for chronological order
    var prices = (Array.isArray(candles) ? candles : [])
      .slice()
      .reverse()
      .map(function(k) { return [k[0] * 1000, parseFloat(k[4]) || 0]; })
      .filter(function(p) { return p[1] > 0; });
    var data = { prices: prices, ts: Date.now() };
    setCache(KEY, data);
    return jsonResponse(data, 200, 300);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale, 200, 300);
    return jsonResponse({ prices: [] });
  }
}

// GET /api/coingecko/gold — PAXG spot via Kraken (proxies XAU price)
async function handleCoingeckoGold() {
  var KEY = 'cg:gold';
  var cached = getCached(KEY, 180000);
  if (cached) return jsonResponse(cached, 200, 180);
  try {
    var res = await fetchWithTimeout('https://api.kraken.com/0/public/Ticker?pair=PAXGUSD');
    if (!res.ok) throw new Error('upstream ' + res.status);
    var json = await res.json();
    var t = (json && json.result && json.result.PAXGUSD) || null;
    if (!t) throw new Error('no PAXGUSD in response');
    var last = parseFloat(t.c && t.c[0]) || 0;
    var open = parseFloat(t.o) || 0;
    var change = open > 0 ? ((last - open) / open) * 100 : 0;
    var shaped = [{
      id: 'pax-gold',
      symbol: 'paxg',
      name: 'PAX Gold',
      current_price: last,
      price_change_percentage_24h: change,
    }];
    var data = { data: shaped, ts: Date.now() };
    setCache(KEY, data);
    return jsonResponse(data, 200, 180);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale, 200, 180);
    return jsonResponse({ data: [] });
  }
}


// GET /api/crypto-movers
async function handleCryptoMovers() {
  var KEY = 'crypto-movers';
  var cached = getCached(KEY, 120000);
  if (cached) return jsonResponse(cached, 200, 120);

  try {
    var res = await fetchWithTimeout(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&sparkline=false&price_change_percentage=24h'
    );
    var coins = await res.json();
    var data = {
      data: coins.slice(0, 15).map(function(c) {
        return {
          name: c.name,
          symbol: (c.symbol || '').toUpperCase(),
          price_usd: c.current_price,
          change_24h_percent: c.price_change_percentage_24h || 0,
          market_cap: c.market_cap,
          image: c.image,
        };
      }),
    };
    setCache(KEY, data);
    return jsonResponse(data, 200, 120);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}


// GET /api/fear-greed
async function handleFearGreed() {
  var KEY = 'fear-greed';
  var cached = getCached(KEY, 300000);
  if (cached) return jsonResponse(cached, 200, 300);

  try {
    var res = await fetchWithTimeout('https://api.alternative.me/fng/?limit=1');
    var d = await res.json();
    var fg = d.data[0];
    var data = { data: { value: parseInt(fg.value), label: fg.value_classification, timestamp: fg.timestamp } };
    setCache(KEY, data);
    return jsonResponse(data, 200, 300);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: { value: 0, label: 'Unknown' } });
  }
}


// GET /api/earthquake
async function handleEarthquake() {
  var KEY = 'earthquake';
  var cached = getCached(KEY, 120000);
  if (cached) return jsonResponse(cached, 200, 120);

  try {
    var res = await fetchWithTimeout(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
    );
    var d = await res.json();
    var quakes = (d.features || []).slice(0, 20).map(function(f) {
      return {
        magnitude: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        url: f.properties.url,
        coordinates: f.geometry.coordinates,
      };
    });
    var data = { data: quakes, count: d.features ? d.features.length : 0 };
    setCache(KEY, data);
    return jsonResponse(data, 200, 120);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [], count: 0 });
  }
}


// GET /api/predictions
async function handlePredictions() {
  var KEY = 'predictions';
  var cached = getCached(KEY, 120000);
  if (cached) return jsonResponse(cached, 200, 120);

  try {
    var res = await fetchWithTimeout(
      'https://gamma-api.polymarket.com/markets?closed=false&limit=15&order=volume24hr&ascending=false'
    );
    var markets = await res.json();
    var arr = Array.isArray(markets) ? markets : [];
    var data = {
      data: arr.slice(0, 15).map(function(m) {
        var yp = 0;
        try { yp = Math.round(parseFloat(JSON.parse(m.outcomePrices)[0]) * 100); } catch (e) {}
        return { question: m.question || m.title || '', yes_percent: yp, volume_usd: m.volume24hr || m.volumeNum || 0 };
      }).filter(function(m) { return m.question && m.yes_percent > 0 && m.yes_percent < 100; }),
    };
    setCache(KEY, data);
    return jsonResponse(data, 200, 120);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}


// ESPN proxy — whitelist sport/league pairs to block arbitrary upstream access.
const ESPN_LEAGUES = {
  basketball: { nba: 1, ncaab: 1 },
  hockey: { nhl: 1 },
  baseball: { mlb: 1 },
  football: { nfl: 1, 'college-football': 1 },
  soccer: { 'eng.1': 1, 'esp.1': 1, 'usa.1': 1 },
};

function espnPairAllowed(sport, league) {
  return !!(ESPN_LEAGUES[sport] && ESPN_LEAGUES[sport][league]);
}

// GET /api/sports-scoreboard?sport=basketball&league=nba
async function handleSportsScoreboard(url) {
  var sport = url.searchParams.get('sport') || '';
  var league = url.searchParams.get('league') || '';
  if (!espnPairAllowed(sport, league)) {
    return jsonResponse({ error: 'sport/league not allowed' }, 400);
  }
  var KEY = 'sports-sb-' + sport + '-' + league;
  var cached = getCached(KEY, 30000);
  if (cached) return jsonResponse(cached, 200, 30);
  try {
    var res = await fetchWithTimeout(
      'https://site.api.espn.com/apis/site/v2/sports/' + sport + '/' + league + '/scoreboard'
    );
    if (!res.ok) throw new Error('espn ' + res.status);
    var data = await res.json();
    setCache(KEY, data);
    return jsonResponse(data, 200, 30);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ events: [] });
  }
}

// GET /api/sports-summary?sport=basketball&league=nba&event=1234
async function handleSportsSummary(url) {
  var sport = url.searchParams.get('sport') || '';
  var league = url.searchParams.get('league') || '';
  var event = url.searchParams.get('event') || '';
  if (!espnPairAllowed(sport, league) || !/^\d+$/.test(event)) {
    return jsonResponse({ error: 'invalid params' }, 400);
  }
  var KEY = 'sports-sum-' + sport + '-' + league + '-' + event;
  var cached = getCached(KEY, 20000);
  if (cached) return jsonResponse(cached, 200, 20);
  try {
    var res = await fetchWithTimeout(
      'https://site.api.espn.com/apis/site/v2/sports/' + sport + '/' + league + '/summary?event=' + event
    );
    if (!res.ok) throw new Error('espn ' + res.status);
    var data = await res.json();
    setCache(KEY, data);
    return jsonResponse(data, 200, 20);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({});
  }
}

// GitHub helpers — uses GITHUB_TOKEN secret if set (5000/hr auth vs 60/hr unauth)
function ghHeaders(env) {
  var h = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'terminalfeed.io/1.0 (+https://terminalfeed.io)',
  };
  if (env && env.GITHUB_TOKEN) h['Authorization'] = 'Bearer ' + env.GITHUB_TOKEN;
  return h;
}

// GET /api/gh-trending?since=YYYY-MM-DD
async function handleGhTrending(url, env) {
  var since = (url.searchParams.get('since') || '').match(/^\d{4}-\d{2}-\d{2}$/)
    ? url.searchParams.get('since')
    : new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  var KEY = 'gh-trending-' + since;
  var cached = getCached(KEY, 300000);
  if (cached) return jsonResponse(cached, 200, 300);
  try {
    var res = await fetchWithTimeout(
      'https://api.github.com/search/repositories?q=created:>' + since + '&sort=stars&order=desc&per_page=10',
      { headers: ghHeaders(env) }
    );
    if (!res.ok) throw new Error('gh ' + res.status);
    var data = await res.json();
    var items = (data.items || []).map(function(r) {
      return {
        name: r.name,
        fullName: r.full_name,
        description: r.description || '',
        language: r.language || '',
        stars: r.stargazers_count || 0,
        url: r.html_url,
      };
    });
    var result = { data: items };
    setCache(KEY, result);
    return jsonResponse(result, 200, 300);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}

// GET /api/gh-events
async function handleGhEvents(env) {
  var KEY = 'gh-events';
  var cached = getCached(KEY, 30000);
  if (cached) return jsonResponse(cached, 200, 30);
  try {
    var res = await fetchWithTimeout(
      'https://api.github.com/events?per_page=20',
      { headers: ghHeaders(env) }
    );
    if (!res.ok) throw new Error('gh ' + res.status);
    var data = await res.json();
    var items = Array.isArray(data) ? data.slice(0, 20).map(function(e) {
      return {
        id: e.id,
        type: e.type,
        actor: (e.actor && e.actor.login) || 'unknown',
        repo: (e.repo && e.repo.name) || '',
        created_at: e.created_at || '',
      };
    }) : [];
    var result = { data: items };
    setCache(KEY, result);
    return jsonResponse(result, 200, 30);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}

// Shared: fetch HN story list by kind, hydrate items. Clamped 1..50.
async function fetchHnStories(listUrl, limit) {
  limit = Math.max(1, Math.min(50, limit | 0));
  var idsRes = await fetchWithTimeout(listUrl);
  var ids = (await idsRes.json()).slice(0, limit);

  var stories = await Promise.allSettled(
    ids.map(function(id) {
      return fetchWithTimeout('https://hacker-news.firebaseio.com/v0/item/' + id + '.json', {}, 5000)
        .then(function(r) { return r.json(); });
    })
  );

  return stories
    .filter(function(r) { return r.status === 'fulfilled' && r.value && r.value.title; })
    .map(function(r) { return r.value; })
    .map(function(s) {
      return {
        id: s.id,
        title: s.title,
        url: s.url || ('https://news.ycombinator.com/item?id=' + s.id),
        score: s.score || 0,
        by: s.by || '',
        time: s.time,
        descendants: s.descendants || 0,
        type: s.type || 'story',
      };
    });
}

// GET /api/rss?url=<encoded-feed-url>
// Proxy for rss2json.com. Whitelisted upstream feeds only; returns normalized
// { status, items: [{ title, link, pubDate, guid }] } matching rss2json shape.
const RSS_WHITELIST = [
  /^https:\/\/www\.gdacs\.org\/xml\/rss\.xml$/,
  /^https:\/\/www\.reddit\.com\/r\/[A-Za-z0-9_]+\/\.rss$/,
  /^https:\/\/www\.producthunt\.com\/feed$/,
  /^https:\/\/feeds\.arstechnica\.com\/arstechnica\/technology-lab$/,
  /^https:\/\/www\.theverge\.com\/rss\/index\.xml$/,
  /^https:\/\/techcrunch\.com\/feed\/?$/,
  /^https:\/\/lexfridman\.com\/feed\/podcast\/?$/,
  /^https:\/\/feeds\.megaphone\.fm\/darknetdiaries$/,
  /^https:\/\/changelog\.com\/podcast\/feed$/,
  /^https:\/\/feed\.syntax\.fm\/rss$/,
  /^https:\/\/anchor\.fm\/s\/[a-f0-9]+\/podcast\/rss$/,
];

function rssUrlAllowed(u) {
  return RSS_WHITELIST.some(function(re) { return re.test(u); });
}

function stripCdata(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function rssGetTag(chunk, tag) {
  var re = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i');
  var m = chunk.match(re);
  if (!m) return '';
  return stripCdata(m[1]).trim();
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

function parseRssItems(xml) {
  var items = [];
  var chunks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (var i = 0; i < chunks.length && items.length < 20; i++) {
    var chunk = chunks[i];
    var title = rssGetTag(chunk, 'title');
    var link = rssGetTag(chunk, 'link');
    if (!link) {
      var lm = chunk.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (lm) link = lm[1];
    }
    var pubDate = rssGetTag(chunk, 'pubDate') || rssGetTag(chunk, 'published') || rssGetTag(chunk, 'updated');
    var guid = rssGetTag(chunk, 'guid') || rssGetTag(chunk, 'id') || link;

    items.push({
      title: decodeEntities(title.replace(/<[^>]+>/g, '').trim()),
      link: link.trim(),
      pubDate: pubDate.trim(),
      guid: guid.trim(),
    });
  }
  return items;
}

async function handleRss(url) {
  var target = url.searchParams.get('url') || '';
  if (!target || !rssUrlAllowed(target)) {
    return jsonResponse({ status: 'error', error: 'URL not in whitelist', items: [] }, 400);
  }
  var key = 'rss:' + target;
  var cached = getCached(key, 300000);
  if (cached) return jsonResponse(cached, 200, 300);

  try {
    var res = await fetchWithTimeout(target, {
      headers: { 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
    }, 8000);
    if (!res.ok) throw new Error('upstream ' + res.status);
    var text = await res.text();
    var result = { status: 'ok', items: parseRssItems(text) };
    setCache(key, result);
    return jsonResponse(result, 200, 300);
  } catch (e) {
    var stale = getStale(key);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ status: 'error', items: [] });
  }
}

// GET /api/hackernews — legacy endpoint, fixed 15 top stories
async function handleHackerNews() {
  var KEY = 'hackernews';
  var cached = getCached(KEY, 120000);
  if (cached) return jsonResponse(cached, 200, 120);
  try {
    var items = await fetchHnStories('https://hacker-news.firebaseio.com/v0/topstories.json', 15);
    var data = { data: items };
    setCache(KEY, data);
    return jsonResponse(data, 200, 120);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}

// GET /api/hn-topstories?limit=50 — full 50-item pull for keyword-filter hook
async function handleHnTopStories(url) {
  var limit = parseInt(url.searchParams.get('limit') || '50', 10);
  var KEY = 'hn-top-' + limit;
  var cached = getCached(KEY, 120000);
  if (cached) return jsonResponse(cached, 200, 120);
  try {
    var items = await fetchHnStories('https://hacker-news.firebaseio.com/v0/topstories.json', limit);
    var data = { data: items };
    setCache(KEY, data);
    return jsonResponse(data, 200, 120);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}

// GET /api/hn-show?limit=10
async function handleHnShow(url) {
  var limit = parseInt(url.searchParams.get('limit') || '10', 10);
  var KEY = 'hn-show-' + limit;
  var cached = getCached(KEY, 180000);
  if (cached) return jsonResponse(cached, 200, 180);
  try {
    var items = await fetchHnStories('https://hacker-news.firebaseio.com/v0/showstories.json', limit);
    var data = { data: items };
    setCache(KEY, data);
    return jsonResponse(data, 200, 180);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}

// GET /api/hn-ask?limit=10
async function handleHnAsk(url) {
  var limit = parseInt(url.searchParams.get('limit') || '10', 10);
  var KEY = 'hn-ask-' + limit;
  var cached = getCached(KEY, 180000);
  if (cached) return jsonResponse(cached, 200, 180);
  try {
    var items = await fetchHnStories('https://hacker-news.firebaseio.com/v0/askstories.json', limit);
    var data = { data: items };
    setCache(KEY, data);
    return jsonResponse(data, 200, 180);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}


// GET /api/service-status
async function handleServiceStatus() {
  var KEY = 'service-status';
  var cached = getCached(KEY, 120000); // 2 min per spec
  if (cached) return jsonResponse(cached, 200, 120);

  var services = [
    { name: 'GitHub', url: 'https://www.githubstatus.com/api/v2/status.json' },
    { name: 'Cloudflare', url: 'https://www.cloudflarestatus.com/api/v2/status.json' },
    { name: 'Vercel', url: 'https://www.vercel-status.com/api/v2/status.json' },
    { name: 'OpenAI', url: 'https://status.openai.com/api/v2/status.json' },
    { name: 'Anthropic', url: 'https://status.anthropic.com/api/v2/status.json' },
    { name: 'npm', url: 'https://status.npmjs.org/api/v2/status.json' },
    { name: 'Discord', url: 'https://discordstatus.com/api/v2/status.json' },
    { name: 'Slack', url: 'https://status.slack.com/api/v2.0.0/current' },
    { name: 'Atlassian', url: 'https://status.atlassian.com/api/v2/status.json' },
    { name: 'Reddit', url: 'https://www.redditstatus.com/api/v2/status.json' },
    { name: 'Stripe', url: 'https://status.stripe.com/api/v2/status.json' },
    { name: 'Zoom', url: 'https://status.zoom.us/api/v2/status.json' },
    { name: 'Datadog', url: 'https://status.datadoghq.com/api/v2/status.json' },
  ];

  var results = await Promise.allSettled(
    services.map(function(svc) {
      return fetchWithTimeout(svc.url, {}, 5000)
        .then(function(res) { return res.ok ? res.json() : Promise.reject(new Error('status ' + res.status)); })
        .then(function(d) {
          // Statuspage standard: d.status.indicator + d.status.description.
          // Slack's v2.0.0 format: top-level { status: "active"|"ok", date_created, ... }
          var indicator = 'unknown';
          var description = '';
          if (d && d.status && typeof d.status === 'object') {
            indicator = d.status.indicator || 'unknown';
            description = d.status.description || '';
          } else if (d && typeof d.status === 'string') {
            // Slack-style
            indicator = (d.status === 'active' || d.status === 'ok') ? 'none' : 'minor';
            description = d.status;
          }
          return { name: svc.name, indicator: indicator, description: description };
        });
    })
  );

  var out = results.map(function(r, i) {
    return r.status === 'fulfilled'
      ? r.value
      : { name: services[i].name, indicator: 'unknown', description: 'Unreachable' };
  });

  var data = { data: out, ts: Date.now() };
  setCache(KEY, data);
  return jsonResponse(data, 200, 120);
}

// GET /api/claude-status — proxies status.claude.com summary.json
async function handleClaudeStatus() {
  var KEY = 'claude-status';
  var cached = getCached(KEY, 60000);
  if (cached) return jsonResponse(cached, 200, 60);
  try {
    var res = await fetchWithTimeout('https://status.claude.com/api/v2/summary.json', {}, 6000);
    if (!res.ok) throw new Error('upstream ' + res.status);
    var json = await res.json();
    setCache(KEY, json);
    return jsonResponse(json, 200, 60);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale, 200, 60);
    return jsonResponse({ status: { indicator: 'unknown', description: 'Unreachable' }, components: [], incidents: [] });
  }
}

// GET /api/cloud-status — GCP/AWS/Azure incident feeds
async function handleCloudStatus() {
  var KEY = 'cloud-status';
  var cached = getCached(KEY, 180000); // 3 min
  if (cached) return jsonResponse(cached, 200, 180);

  async function fetchGCP() {
    try {
      var res = await fetchWithTimeout('https://status.cloud.google.com/incidents.json', {}, 6000);
      if (!res.ok) throw new Error('upstream');
      var incidents = await res.json();
      var now = Date.now();
      var active = (incidents || []).filter(function(inc) {
        if (!inc.end) return true;
        return now - new Date(inc.end).getTime() < 2 * 60 * 60 * 1000;
      }).slice(0, 3);
      return {
        name: 'Google Cloud',
        status: active.length > 0 ? 'incident' : 'operational',
        incidents: active.map(function(inc) {
          return { title: inc.external_desc || inc.service_name || 'Event', severity: inc.severity || 'medium' };
        }),
      };
    } catch { return { name: 'Google Cloud', status: 'unknown', incidents: [] }; }
  }

  async function fetchAWS() {
    try {
      var res = await fetchWithTimeout('https://health.aws.amazon.com/public/currentevents', {}, 6000);
      if (!res.ok) throw new Error('upstream');
      var events = await res.json();
      var active = (Array.isArray(events) ? events : []).slice(0, 3);
      return {
        name: 'AWS',
        status: active.length > 0 ? 'incident' : 'operational',
        incidents: active.map(function(ev) {
          var sev = ev.status === '3' ? 'high' : ev.status === '2' ? 'medium' : 'low';
          return { title: ev.summary || ev.service_name || 'Service event', severity: sev };
        }),
      };
    } catch { return { name: 'AWS', status: 'unknown', incidents: [] }; }
  }

  async function fetchAzure() {
    // Workers have no DOMParser — use regex on the RSS XML.
    try {
      var res = await fetchWithTimeout('https://rssfeed.azure.status.microsoft/en-us/status/feed/', {}, 6000);
      if (!res.ok) throw new Error('upstream');
      var text = await res.text();
      var now = Date.now();
      var cutoff = now - 24 * 60 * 60 * 1000;
      var items = [];
      var re = /<item>([\s\S]*?)<\/item>/g;
      var m;
      while ((m = re.exec(text)) !== null && items.length < 10) {
        var block = m[1];
        var titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
        var dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        if (!titleMatch || !dateMatch) continue;
        var ts = new Date(dateMatch[1].trim()).getTime();
        if (!ts || ts < cutoff) continue;
        items.push({ title: titleMatch[1].trim(), severity: 'medium' });
      }
      return {
        name: 'Azure',
        status: items.length > 0 ? 'incident' : 'operational',
        incidents: items.slice(0, 3),
      };
    } catch { return { name: 'Azure', status: 'unknown', incidents: [] }; }
  }

  var providers = await Promise.all([fetchAWS(), fetchGCP(), fetchAzure()]);
  var data = { providers: providers, ts: Date.now() };
  setCache(KEY, data);
  return jsonResponse(data, 200, 180);
}


// GET /api/cyber-threats
async function handleCyberThreats() {
  var KEY = 'cyber-threats';
  var cached = getCached(KEY, 300000);
  if (cached) return jsonResponse(cached, 200, 300);

  try {
    var results = await Promise.allSettled([
      fetchWithTimeout('https://urlhaus-api.abuse.ch/v1/urls/recent/limit/10/', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
      fetchWithTimeout('https://threatfox-api.abuse.ch/api/v1/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'get_iocs', days: 1 }),
      }),
    ]);

    var threats = [];

    if (results[0].status === 'fulfilled') {
      try {
        var d = await results[0].value.json();
        if (d.urls) {
          d.urls.slice(0, 5).forEach(function(u) {
            threats.push({ source: 'URLhaus', type: 'malware_url', indicator: u.url || '', threat: u.threat || 'malware', date: u.date_added || '' });
          });
        }
      } catch (e) {}
    }

    if (results[1].status === 'fulfilled') {
      try {
        var d2 = await results[1].value.json();
        if (d2.data && Array.isArray(d2.data)) {
          d2.data.slice(0, 5).forEach(function(ioc) {
            threats.push({ source: 'ThreatFox', type: ioc.ioc_type || 'ioc', indicator: ioc.ioc || '', threat: ioc.malware_printable || ioc.threat_type || '', date: ioc.first_seen_utc || '' });
          });
        }
      } catch (e) {}
    }

    var data = { data: threats };
    setCache(KEY, data);
    return jsonResponse(data, 200, 300);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}


// GET /api/forex
async function handleForex() {
  var KEY = 'forex';
  var cached = getCached(KEY, 300000);
  if (cached) return jsonResponse(cached, 200, 300);

  try {
    var currencyList = 'EUR,GBP,JPY,CAD,AUD,CHF,CNY,INR,MXN,BRL,KRW,SGD,HKD,SEK,NOK,NZD';
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yStr = yesterday.toISOString().slice(0, 10);

    var both = await Promise.allSettled([
      fetchWithTimeout('https://api.frankfurter.app/latest?from=USD&to=' + currencyList),
      fetchWithTimeout('https://api.frankfurter.app/' + yStr + '?from=USD&to=' + currencyList),
    ]);

    if (both[0].status !== 'fulfilled') throw new Error('latest failed');
    var d = await both[0].value.json();
    var prevRates = {};
    if (both[1].status === 'fulfilled') {
      try { var pd = await both[1].value.json(); prevRates = pd.rates || {}; } catch (e) {}
    }

    var data = { data: { base: d.base || 'USD', date: d.date, rates: d.rates || {}, prevRates: prevRates } };
    setCache(KEY, data);
    return jsonResponse(data, 200, 300);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: { base: 'USD', date: '', rates: {}, prevRates: {} } });
  }
}


// GET /api/humans-in-space
async function handleHumansInSpace() {
  var KEY = 'humans-in-space';
  var cached = getCached(KEY, 3600000);
  if (cached) return jsonResponse(cached, 200, 3600);

  try {
    var res = await fetchWithTimeout('http://api.open-notify.org/astros.json');
    var d = await res.json();
    var data = {
      data: {
        count: d.number || 0,
        people: (d.people || []).map(function(p) { return { name: p.name, craft: p.craft }; }),
      },
    };
    setCache(KEY, data);
    return jsonResponse(data, 200, 3600);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({
      data: {
        count: 7,
        people: [
          { name: 'Oleg Kononenko', craft: 'ISS' }, { name: 'Nikolai Chub', craft: 'ISS' },
          { name: 'Tracy Dyson', craft: 'ISS' }, { name: 'Matthew Dominick', craft: 'ISS' },
          { name: 'Michael Barratt', craft: 'ISS' }, { name: 'Jeanette Epps', craft: 'ISS' },
          { name: 'Alexander Grebenkin', craft: 'ISS' },
        ],
      },
    });
  }
}


// GET /api/disaster-alerts
async function handleDisasterAlerts() {
  var KEY = 'disaster-alerts';
  var cached = getCached(KEY, 300000);
  if (cached) return jsonResponse(cached, 200, 300);

  try {
    var res = await fetchWithTimeout(
      'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,TC,FL,VO,WF&alertlevel=Green;Orange;Red&limit=10',
      { headers: { 'Accept': 'application/json' } }
    );
    var d = await res.json();
    var events = (d.features || []).slice(0, 10).map(function(f) {
      var p = f.properties || {};
      return {
        type: p.eventtype || '', name: p.name || p.eventname || '',
        alert_level: p.alertlevel || '', country: p.country || '',
        date: p.fromdate || '', url: (p.url && p.url.report) || '',
      };
    });
    var data = { data: events };
    setCache(KEY, data);
    return jsonResponse(data, 200, 300);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}


// GET /api/launches
async function handleLaunches() {
  var KEY = 'launches';
  var cached = getCached(KEY, 600000);
  if (cached) return jsonResponse(cached, 200, 600);

  try {
    var res = await fetchWithTimeout('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&mode=list');
    var d = await res.json();
    var launches = (d.results || []).map(function(l) {
      return {
        name: l.name, status: (l.status && l.status.name) || '', net: l.net,
        pad: (l.pad && l.pad.name) || '', location: (l.pad && l.pad.location && l.pad.location.name) || '',
        mission: (l.mission && l.mission.name) || '',
      };
    });
    var data = { data: launches };
    setCache(KEY, data);
    return jsonResponse(data, 200, 600);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}


// GET /api/economic-data
async function handleEconomicData(env) {
  var KEY = 'economic-data';
  var cached = getCached(KEY, 3600000);
  if (cached) return jsonResponse(cached, 200, 3600);

  if (!env || !env.FRED_API_KEY) return jsonResponse({ data: {} });

  var series = { fed_rate: 'FEDFUNDS', cpi: 'CPIAUCSL', unemployment: 'UNRATE', gdp_growth: 'A191RL1Q225SBEA' };

  try {
    var keys = Object.keys(series);
    var results = await Promise.allSettled(
      keys.map(function(key) {
        var id = series[key];
        return fetchWithTimeout(
          'https://api.stlouisfed.org/fred/series/observations?series_id=' + id + '&sort_order=desc&limit=1&api_key=' + env.FRED_API_KEY + '&file_type=json',
          {}, 6000
        ).then(function(res) { return res.json(); })
         .then(function(d) {
           var obs = d.observations && d.observations[0];
           return [key, { value: obs ? parseFloat(obs.value) : null, date: obs ? obs.date : '' }];
         });
      })
    );

    var econ = {};
    results.forEach(function(r) { if (r.status === 'fulfilled') econ[r.value[0]] = r.value[1]; });

    var data = { data: econ };
    setCache(KEY, data);
    return jsonResponse(data, 200, 3600);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: {} });
  }
}


// GET /api/steam
async function handleSteam() {
  var KEY = 'steam';
  var cached = getCached(KEY, 300000);
  if (cached) return jsonResponse(cached, 200, 300);

  try {
    var res = await fetchWithTimeout('https://steamspy.com/api.php?request=top100in2weeks');
    var d = await res.json();
    var games = Object.values(d)
      .map(function(g) { return { name: g.name, players_now: g.ccu || g.players_forever || 0 }; })
      .sort(function(a, b) { return b.players_now - a.players_now; })
      .slice(0, 15);
    var data = { data: games };
    setCache(KEY, data);
    return jsonResponse(data, 200, 300);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: [] });
  }
}


// GET /api/weather?lat=...&lon=...
async function handleWeather(parsedUrl) {
  var lat = parsedUrl.searchParams.get('lat') || '34.05';
  var lon = parsedUrl.searchParams.get('lon') || '-118.24';
  var KEY = 'weather-' + lat + '-' + lon;
  var cached = getCached(KEY, 300000);
  if (cached) return jsonResponse(cached, 200, 300);

  try {
    var res = await fetchWithTimeout(
      'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto'
    );
    var d = await res.json();
    var data = { data: d };
    setCache(KEY, data);
    return jsonResponse(data, 200, 300);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ data: {} });
  }
}


// GET /api/xkcd
async function handleXkcd() {
  var KEY = 'xkcd';
  var cached = getCached(KEY, 300000);
  if (cached) return jsonResponse(cached, 200, 300);

  try {
    var res = await fetchWithTimeout('https://xkcd.com/info.0.json', {
      headers: { 'User-Agent': 'TerminalFeed/1.0' },
    });
    var data = await res.json();
    setCache(KEY, data);
    return jsonResponse(data, 200, 300);
  } catch (e) {
    var stale = getStale(KEY);
    if (stale) return jsonResponse(stale);
    return jsonResponse({ error: 'XKCD unavailable' }, 502);
  }
}


// GET /api/ai-stats
function handleAiStats() {
  hitCounter++;
  return jsonResponse({ totalHits24h: hitCounter }, 200, 30);
}


// GET /api/briefing
async function handleBriefing() {
  var KEY = 'briefing';
  var cached = getCached(KEY, 60000);
  if (cached) return jsonResponse(cached, 200, 60);

  var results = await Promise.allSettled([
    fetchWithTimeout('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT'),
    fetchWithTimeout('https://api.alternative.me/fng/?limit=1'),
    fetchWithTimeout('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'),
    fetchWithTimeout('https://hacker-news.firebaseio.com/v0/topstories.json'),
    fetchWithTimeout('http://api.open-notify.org/astros.json'),
  ]);

  var sections = {};

  if (results[0].status === 'fulfilled') {
    try { var d = await results[0].value.json(); sections.crypto = { price_usd: parseFloat(d.lastPrice), change_24h_percent: parseFloat(d.priceChangePercent), volume_24h: parseFloat(d.quoteVolume) }; } catch (e) {}
  }
  if (results[1].status === 'fulfilled') {
    try { var d2 = await results[1].value.json(); var fg = d2.data[0]; sections.fear_greed = { value: parseInt(fg.value), label: fg.value_classification }; } catch (e) {}
  }
  if (results[2].status === 'fulfilled') {
    try { var d3 = await results[2].value.json(); sections.earthquakes = { count: d3.features ? d3.features.length : 0, latest: d3.features && d3.features[0] ? { magnitude: d3.features[0].properties.mag, place: d3.features[0].properties.place } : null }; } catch (e) {}
  }
  if (results[3].status === 'fulfilled') {
    try { var d4 = await results[3].value.json(); sections.hackernews = { top_story_count: d4.length }; } catch (e) {}
  }
  if (results[4].status === 'fulfilled') {
    try { var d5 = await results[4].value.json(); sections.humans_in_space = { count: d5.number || 0 }; } catch (e) {}
  }

  var data = { source: 'terminalfeed', generated_at: new Date().toISOString(), sections: sections };
  setCache(KEY, data);
  return jsonResponse(data, 200, 60);
}


// POST /api/tweet
async function handleTweet(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);

  var auth = request.headers.get('Authorization');
  if (!auth || auth !== 'Bearer ' + env.ADMIN_SECRET) return jsonResponse({ error: 'Unauthorized' }, 401);

  try {
    var body = await request.json();
    var text = body.text;
    if (!text || text.length === 0) return jsonResponse({ error: 'Missing text field' }, 400);
    if (text.length > 280) return jsonResponse({ error: 'Tweet exceeds 280 characters', length: text.length }, 400);

    var result = await postTweet(text, env);
    return jsonResponse({ tweeted: true, text: text, result: result });
  } catch (err) {
    return jsonResponse({ error: 'Tweet failed', message: err.message }, 500);
  }
}


// GET /api/auto-briefing
async function handleAutoBriefing(request, env) {
  var auth = request.headers.get('Authorization');
  if (!auth || auth !== 'Bearer ' + env.ADMIN_SECRET) return jsonResponse({ error: 'Unauthorized' }, 401);

  try {
    var tweetText = await buildBriefingTweet();
    var result = await postTweet(tweetText, env);
    return jsonResponse({ tweeted: true, text: tweetText, result: result });
  } catch (err) {
    return jsonResponse({ error: 'Auto-briefing tweet failed', message: err.message }, 500);
  }
}


// ---Briefing Tweet Builder 

async function buildBriefingTweet() {
  var results = await Promise.allSettled([
    fetchWithTimeout('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT'),
    fetchWithTimeout('https://api.alternative.me/fng/?limit=1'),
    fetchWithTimeout('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'),
  ]);

  var parts = ['>_ What\'s happening right now:', ''];

  if (results[0].status === 'fulfilled') {
    try {
      var d = await results[0].value.json();
      var price = Math.round(parseFloat(d.lastPrice));
      var change = parseFloat(d.priceChangePercent);
      var sign = change >= 0 ? '+' : '';
      parts.push('BTC: $' + price.toLocaleString() + ' (' + sign + change.toFixed(1) + '%)');
    } catch (e) {}
  }

  if (results[1].status === 'fulfilled') {
    try {
      var d2 = await results[1].value.json();
      var fg = d2.data[0];
      parts.push('Fear & Greed: ' + fg.value + ' (' + fg.value_classification + ')');
    } catch (e) {}
  }

  if (results[2].status === 'fulfilled') {
    try {
      var d3 = await results[2].value.json();
      parts.push('Earthquakes (24h): ' + (d3.features ? d3.features.length : 0));
    } catch (e) {}
  }

  parts.push('', 'Full briefing: terminalfeed.io/live', '', '#bitcoin #crypto #markets #tech');

  var text = parts.join('\n');
  if (text.length > 280) text = text.slice(0, 277) + '...';
  return text;
}


// --- ETH Gas Tracker (Etherscan) ---
async function handleGas(env) {
  var cached = getCached('gas_oracle', 15000);
  if (cached) return jsonResponse(cached);

  try {
    var apiKey = env.ETHERSCAN_API_KEY || '';
    var res = await fetchWithTimeout(
      'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=' + apiKey,
      {}, 8000
    );
    var json = await res.json();

    if (json.status === '1' && json.result) {
      var data = {
        low: parseInt(json.result.SafeGasPrice) || 0,
        standard: parseInt(json.result.ProposeGasPrice) || 0,
        fast: parseInt(json.result.FastGasPrice) || 0,
        baseFee: parseFloat(json.result.suggestBaseFee) || 0,
        lastBlock: parseInt(json.result.LastBlock) || 0,
        ts: Date.now(),
      };
      setCache('gas_oracle', data);
      return jsonResponse(data);
    }
  } catch (e) {
    console.error('Gas fetch failed:', e.message);
  }

  var stale = getStale('gas_oracle');
  if (stale) return jsonResponse(stale);
  return jsonResponse({ low: 8, standard: 12, fast: 18, baseFee: 7, lastBlock: 0, ts: Date.now() });
}


// --- NASA APOD ---
async function handleNasaApod() {
  var cached = getCached('nasa_apod', 3600000); // 1 hour
  if (cached) return jsonResponse(cached);

  try {
    var today = new Date();
    for (var i = 0; i < 5; i++) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var dateStr = d.toISOString().slice(0, 10);
      var res = await fetchWithTimeout(
        'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=' + dateStr,
        {}, 8000
      );
      if (!res.ok) continue;
      var json = await res.json();
      if (json.media_type !== 'image') continue;
      var data = {
        title: json.title || '',
        url: json.url || '',
        hdurl: json.hdurl || json.url || '',
        explanation: json.explanation || '',
        date: json.date || '',
        media_type: 'image',
        copyright: json.copyright || null,
        ts: Date.now(),
      };
      setCache('nasa_apod', data);
      return jsonResponse(data, 200, 3600);
    }
  } catch (e) {
    console.error('NASA APOD fetch failed:', e.message);
  }

  var stale = getStale('nasa_apod');
  if (stale) return jsonResponse(stale);
  return jsonResponse({ error: 'No APOD available' }, 503);
}


// --- Client Error Reporting ---
async function handleErrorReport(request) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST only' }, 405);
  }
  try {
    var body = await request.json();
    console.log('[CLIENT_ERROR]', JSON.stringify({
      error: (body.error || '').substring(0, 500),
      stack: (body.stack || '').substring(0, 1000),
      url: (body.url || '').substring(0, 200),
      ua: (request.headers.get('user-agent') || '').substring(0, 100),
      ts: new Date().toISOString(),
    }));
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: 'Bad request' }, 400);
  }
}


// --- Main Export (ES Module format) ---
// IMPORTANT: In Cloudflare dashboard, set Worker type to "ES Module" (not "Service Worker")

export default {
  async fetch(request, env) {
    var url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') return corsResponse();

    // Count every request for ai-stats
    hitCounter++;

    // Strip /api/ prefix and trailing slashes
    var path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');

    switch (path) {
      case '':               return handleIndex();
      case 'btc-price':      return await handleBtcPrice();
      case 'stocks':         return await handleStocks(env, url);
      case 'crypto-movers':  return await handleCryptoMovers();
      case 'coingecko/markets':   return await handleCoingeckoMarkets();
      case 'coingecko/global':    return await handleCoingeckoGlobal();
      case 'coingecko/btc-chart': return await handleCoingeckoBtcChart();
      case 'coingecko/gold':      return await handleCoingeckoGold();
      case 'fear-greed':     return await handleFearGreed();
      case 'earthquake':     return await handleEarthquake();
      case 'predictions':    return await handlePredictions();
      case 'hackernews':     return await handleHackerNews();
      case 'rss':            return await handleRss(url);
      case 'sports-scoreboard': return await handleSportsScoreboard(url);
      case 'sports-summary':    return await handleSportsSummary(url);
      case 'gh-trending':    return await handleGhTrending(url, env);
      case 'gh-events':      return await handleGhEvents(env);
      case 'hn-topstories':  return await handleHnTopStories(url);
      case 'hn-show':        return await handleHnShow(url);
      case 'hn-ask':         return await handleHnAsk(url);
      case 'service-status': return await handleServiceStatus();
      case 'cloud-status':   return await handleCloudStatus();
      case 'claude-status':  return await handleClaudeStatus();
      case 'cyber-threats':  return await handleCyberThreats();
      case 'forex':          return await handleForex();
      case 'humans-in-space':return await handleHumansInSpace();
      case 'disaster-alerts':return await handleDisasterAlerts();
      case 'launches':       return await handleLaunches();
      case 'economic-data':  return await handleEconomicData(env);
      case 'steam':          return await handleSteam();
      case 'weather':        return await handleWeather(url);
      case 'xkcd':           return await handleXkcd();
      case 'ai-stats':       return handleAiStats();
      case 'briefing':       return await handleBriefing();
      case 'tweet':          return await handleTweet(request, env);
      case 'auto-briefing':  return await handleAutoBriefing(request, env);
      case 'gas':            return await handleGas(env);
      case 'nasa-apod':      return await handleNasaApod();
      case 'error':          return await handleErrorReport(request);
      case 'health':         return jsonResponse({ status: 'ok', version: '2.1.0', uptime: Date.now() - workerStartTime, ts: Date.now() });
      default:
        return jsonResponse({ error: 'Not found', path: '/api/' + path }, 404);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil((async function() {
      try {
        var text = await buildBriefingTweet();
        var result = await postTweet(text, env);
        console.log('Daily briefing tweeted:', result.status);
      } catch (err) {
        console.error('Daily briefing cron failed:', err.message);
      }
    })());
  },
};
