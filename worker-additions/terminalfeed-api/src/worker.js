// TerminalFeed API Worker
// Handles all /api/* routes with server-side caching

// In-memory cache (persists within each Worker instance, resets on deploy)
const cache = {};

const CACHE_TTL = {
  'briefing': 60000,
  'btc-price': 30000,
  'stocks': 15000,
  'crypto-movers': 30000,
  'fear-greed': 300000,
  'btc-network': 60000,
  'earthquake': 120000,
  'predictions': 60000,
  'hackernews': 60000,
  'dev-status': 60000,
  'weather': 600000,
  'cyber-threats': 60000,
  'github-trending': 300000,
  'disaster-alerts': 300000,
  'launches': 600000,
  'forex': 300000,
  'economic-data': 3600000,
  'humans-in-space': 3600000,
  'service-status': 60000,
  'ai-stats': 30000,
  'steam': 600000,
  'index': 0,
};

// API call tracker
const apiTracker = {
  totalHits: 0,
  calls: [],
  agents: new Set(),
};

function detectAgent(ua) {
  if (!ua) return 'unknown';
  const lower = ua.toLowerCase();
  if (lower.includes('claude') || lower.includes('anthropic')) return 'claude';
  if (lower.includes('openai') || lower.includes('gpt')) return 'gpt-4o';
  if (lower.includes('perplexity')) return 'perplexity';
  if (lower.includes('google') || lower.includes('gemini')) return 'gemini';
  if (lower.includes('copilot')) return 'copilot';
  if (lower.includes('mistral')) return 'mistral';
  if (lower.includes('python')) return 'python-bot';
  if (lower.includes('curl')) return 'curl';
  if (lower.includes('node')) return 'node-bot';
  if (lower.includes('mozilla') || lower.includes('chrome') || lower.includes('safari')) return null; // browser, not agent
  return 'agent-' + lower.slice(0, 12);
}

function trackCall(endpoint, userAgent) {
  const agent = detectAgent(userAgent);
  apiTracker.totalHits++;
  if (agent) {
    apiTracker.agents.add(agent);
    apiTracker.calls.unshift({
      endpoint,
      agent,
      timestamp: Date.now(),
    });
    apiTracker.calls = apiTracker.calls.slice(0, 50);
  }
}

function getCached(key) {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < (CACHE_TTL[key] || 60000)) {
    return entry.data;
  }
  return null;
}

function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}

// === TWITTER / X OAuth 1.0a ===

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

async function hmacSha1(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sig))));
}

async function postTweet(text, env) {
  const url = 'https://api.x.com/2/tweets';
  const params = {
    oauth_consumer_key: env.X_API_KEY,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: env.X_ACCESS_TOKEN,
    oauth_version: '1.0',
  };
  const paramStr = Object.keys(params).sort()
    .map(k => percentEncode(k) + '=' + percentEncode(params[k])).join('&');
  const baseStr = ['POST', percentEncode(url), percentEncode(paramStr)].join('&');
  const sigKey = percentEncode(env.X_API_SECRET) + '&' + percentEncode(env.X_ACCESS_TOKEN_SECRET);
  params.oauth_signature = await hmacSha1(sigKey, baseStr);
  const authHeader = 'OAuth ' + Object.keys(params).sort()
    .map(k => percentEncode(k) + '="' + percentEncode(params[k]) + '"').join(', ');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return { status: res.status, data: await res.json() };
}

async function buildBriefingTweet() {
  const [btcRes, fgRes, quakeRes] = await Promise.allSettled([
    fetchWithTimeout('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT'),
    fetchWithTimeout('https://api.alternative.me/fng/?limit=1'),
    fetchWithTimeout('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'),
  ]);

  const parts = ['>_ What\'s happening right now:', ''];

  if (btcRes.status === 'fulfilled') {
    try {
      const d = await btcRes.value.json();
      const price = Math.round(parseFloat(d.lastPrice));
      const change = parseFloat(d.priceChangePercent);
      const sign = change >= 0 ? '+' : '';
      parts.push('BTC: $' + price.toLocaleString() + ' (' + sign + change.toFixed(1) + '%)');
    } catch (e) {}
  }

  if (fgRes.status === 'fulfilled') {
    try {
      const d = await fgRes.value.json();
      const fg = d.data[0];
      parts.push('Fear & Greed: ' + fg.value + ' (' + fg.value_classification + ')');
    } catch (e) {}
  }

  if (quakeRes.status === 'fulfilled') {
    try {
      const d = await quakeRes.value.json();
      parts.push('Earthquakes (24h): ' + (d.features ? d.features.length : 0));
    } catch (e) {}
  }

  parts.push('', 'Full briefing: terminalfeed.io/live', '', '#bitcoin #crypto #markets #tech');

  let text = parts.join('\n');
  if (text.length > 280) text = text.slice(0, 277) + '...';
  return text;
}

// Route handler
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '').replace(/\/$/, '');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Track API call
    trackCall(path, request.headers.get('User-Agent'));

    // Route to handler
    try {
      switch (path) {
        case 'index':
        case '':
          return handleIndex();
        case 'briefing':
          return await handleBriefing(env);
        case 'btc-price':
          return await handleBtcPrice();
        case 'stocks':
          return await handleStocks(env);
        case 'crypto-movers':
          return await handleCryptoMovers();
        case 'fear-greed':
          return await handleFearGreed();
        case 'earthquake':
          return await handleEarthquake();
        case 'predictions':
          return await handlePredictions();
        case 'hackernews':
          return await handleHackerNews();
        case 'dev-status':
        case 'service-status':
          return await handleServiceStatus();
        case 'cyber-threats':
          return await handleCyberThreats();
        case 'github-trending':
          return await handleGithubTrending();
        case 'forex':
          return await handleForex();
        case 'humans-in-space':
          return await handleHumansInSpace();
        case 'disaster-alerts':
          return await handleDisasterAlerts();
        case 'launches':
          return await handleLaunches();
        case 'economic-data':
          return await handleEconomicData(env);
        case 'steam':
          return await handleSteam();
        case 'ai-stats':
          return handleAIStats();
        case 'weather':
          return await handleWeather(url);
        case 'tweet':
          return await handleTweet(request, env);
        case 'auto-briefing':
          return await handleAutoBriefing(request, env);
        default:
          return jsonResponse({ error: 'Unknown endpoint', available: 'GET /api/index' }, 404);
      }
    } catch (error) {
      return jsonResponse({ error: 'Internal error', message: error.message }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const text = await buildBriefingTweet();
        const result = await postTweet(text, env);
        console.log('Daily briefing tweeted:', result.status);
      } catch (err) {
        console.error('Daily briefing cron failed:', err.message);
      }
    })());
  },
};

// === ENDPOINT HANDLERS ===

function handleIndex() {
  return jsonResponse({
    name: 'TerminalFeed API',
    version: '1.0',
    description: 'Free real-time world data. No authentication required.',
    documentation: 'https://terminalfeed.io/llms.txt',
    endpoints: {
      '/api/briefing': 'One-call world snapshot for AI agents',
      '/api/btc-price': 'Bitcoin price and 24h stats',
      '/api/stocks': 'Top US stocks with daily movers',
      '/api/crypto-movers': 'Top crypto by market cap',
      '/api/fear-greed': 'Crypto Fear & Greed Index',
      '/api/earthquake': 'Recent global earthquakes',
      '/api/predictions': 'Polymarket prediction markets',
      '/api/hackernews': 'Trending HN stories',
      '/api/service-status': 'Major service operational status',
      '/api/weather': 'Weather (params: lat, lon)',
      '/api/cyber-threats': 'Recent malware and CVEs',
      '/api/github-trending': 'Trending GitHub repos',
      '/api/forex': 'Currency exchange rates',
      '/api/humans-in-space': 'People currently in orbit',
      '/api/disaster-alerts': 'Global disaster alerts',
      '/api/launches': 'Upcoming space launches',
      '/api/economic-data': 'Fed rate, inflation, unemployment',
      '/api/steam': 'Top Steam games by players',
      '/api/ai-stats': 'AI Hub API call statistics',
    },
    rate_limit: '100,000 requests/day (free tier)',
    contact: 'hello@terminalfeed.io',
  });
}

function handleAIStats() {
  return jsonResponse({
    source: 'terminalfeed.io',
    totalHits24h: apiTracker.totalHits,
    uniqueAgents24h: apiTracker.agents.size,
    recentCalls: apiTracker.calls.slice(0, 10).map(c => ({
      endpoint: c.endpoint,
      agent: c.agent,
      timeAgo: formatTimeAgo(c.timestamp),
    })),
  });
}

async function handleBtcPrice() {
  var cached = getCached('btc-price');
  if (cached) return jsonResponse(cached);

  var result = null;

  try {
    var res = await fetchWithTimeout('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT');
    var text = await res.text();
    var data = JSON.parse(text);

    result = {
      source: 'terminalfeed.io',
      endpoint: 'btc-price',
      updated_at: new Date().toISOString(),
      data: {
        price_usd: parseFloat(data.lastPrice),
        change_24h_percent: parseFloat(data.priceChangePercent),
        high_24h: parseFloat(data.highPrice),
        low_24h: parseFloat(data.lowPrice),
        volume_24h_usd: parseFloat(data.quoteVolume)
      }
    };
    setCache('btc-price', result);
    return jsonResponse(result);
  } catch (err1) {
    // Binance failed, try CoinCap
  }

  try {
    var res2 = await fetchWithTimeout('https://api.coincap.io/v2/assets/bitcoin');
    var text2 = await res2.text();
    var data2 = JSON.parse(text2);
    var btc = data2.data;

    result = {
      source: 'terminalfeed.io',
      endpoint: 'btc-price',
      updated_at: new Date().toISOString(),
      data: {
        price_usd: parseFloat(btc.priceUsd),
        change_24h_percent: parseFloat(btc.changePercent24Hr),
        high_24h: null,
        low_24h: null,
        volume_24h_usd: parseFloat(btc.volumeUsd24Hr)
      }
    };
    setCache('btc-price', result);
    return jsonResponse(result);
  } catch (err2) {
    // CoinCap also failed
  }

  return jsonResponse({
    source: 'terminalfeed.io',
    endpoint: 'btc-price',
    updated_at: new Date().toISOString(),
    error: 'All BTC APIs failed',
    data: null
  }, 500);
}

async function handleCryptoMovers() {
  const cached = getCached('crypto-movers');
  if (cached) return jsonResponse(cached);

  const res = await fetchWithTimeout('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&sparkline=false&price_change_percentage=24h');
  const coins = await res.json();
  const sorted = coins.sort((a, b) => Math.abs(b.price_change_percentage_24h || 0) - Math.abs(a.price_change_percentage_24h || 0));
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'crypto-movers',
    updated_at: new Date().toISOString(),
    data: {
      gainers: sorted.filter(c => c.price_change_percentage_24h > 0).slice(0, 5).map(c => ({ symbol: c.symbol, name: c.name, price: c.current_price, change_24h: c.price_change_percentage_24h })),
      losers: sorted.filter(c => c.price_change_percentage_24h < 0).slice(0, 5).map(c => ({ symbol: c.symbol, name: c.name, price: c.current_price, change_24h: c.price_change_percentage_24h })),
    },
  };
  setCache('crypto-movers', result);
  return jsonResponse(result);
}

async function handleFearGreed() {
  const cached = getCached('fear-greed');
  if (cached) return jsonResponse(cached);

  const res = await fetchWithTimeout('https://api.alternative.me/fng/?limit=1');
  const data = await res.json();
  const fg = data.data?.[0];
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'fear-greed',
    updated_at: new Date().toISOString(),
    data: { value: parseInt(fg?.value || 0), label: fg?.value_classification || 'Unknown' },
  };
  setCache('fear-greed', result);
  return jsonResponse(result);
}

async function handleEarthquake() {
  const cached = getCached('earthquake');
  if (cached) return jsonResponse(cached);

  const res = await fetchWithTimeout('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
  const data = await res.json();
  const quakes = (data.features || []).slice(0, 15).map(f => ({
    magnitude: f.properties.mag,
    location: f.properties.place,
    time: new Date(f.properties.time).toISOString(),
    depth_km: f.geometry.coordinates[2],
    url: f.properties.url,
  }));
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'earthquake',
    updated_at: new Date().toISOString(),
    data: { count: quakes.length, earthquakes: quakes },
  };
  setCache('earthquake', result);
  return jsonResponse(result);
}

async function handlePredictions() {
  const cached = getCached('predictions');
  if (cached) return jsonResponse(cached);

  const res = await fetchWithTimeout('https://gamma-api.polymarket.com/markets?closed=false&order=volume&ascending=false&limit=10');
  const markets = await res.json();
  const formatted = markets.filter(m => m.outcomePrices && parseFloat(m.volume || 0) > 10000).map(m => {
    let prices = [];
    try { prices = JSON.parse(m.outcomePrices); } catch (e) {}
    return {
      question: m.question,
      yes_percent: prices[0] ? Math.round(parseFloat(prices[0]) * 100) : null,
      no_percent: prices[1] ? Math.round(parseFloat(prices[1]) * 100) : null,
      volume_usd: parseFloat(m.volume || 0),
    };
  }).slice(0, 8);
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'predictions',
    updated_at: new Date().toISOString(),
    data: formatted,
  };
  setCache('predictions', result);
  return jsonResponse(result);
}

async function handleHackerNews() {
  const cached = getCached('hackernews');
  if (cached) return jsonResponse(cached);

  const idsRes = await fetchWithTimeout('https://hacker-news.firebaseio.com/v0/topstories.json');
  const ids = await idsRes.json();
  const stories = await Promise.all(
    ids.slice(0, 10).map(id =>
      fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
    )
  );
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'hackernews',
    updated_at: new Date().toISOString(),
    data: stories.filter(s => s).map(s => ({ title: s.title, url: s.url, score: s.score, comments: s.descendants })),
  };
  setCache('hackernews', result);
  return jsonResponse(result);
}

async function handleServiceStatus() {
  const cached = getCached('service-status');
  if (cached) return jsonResponse(cached);

  const services = [
    { name: 'GitHub', url: 'https://www.githubstatus.com/api/v2/status.json' },
    { name: 'Cloudflare', url: 'https://www.cloudflarestatus.com/api/v2/status.json' },
    { name: 'Discord', url: 'https://discordstatus.com/api/v2/status.json' },
    { name: 'OpenAI', url: 'https://status.openai.com/api/v2/status.json' },
    { name: 'Vercel', url: 'https://www.vercel-status.com/api/v2/status.json' },
    { name: 'npm', url: 'https://status.npmjs.org/api/v2/status.json' },
    { name: 'Reddit', url: 'https://www.redditstatus.com/api/v2/status.json' },
    { name: 'Atlassian', url: 'https://status.atlassian.com/api/v2/status.json' },
  ];

  const statuses = await Promise.allSettled(
    services.map(async s => {
      try {
        const res = await fetchWithTimeout(s.url, {}, 5000);
        const data = await res.json();
        return {
          name: s.name,
          status: data.status?.indicator === 'none' ? 'operational' : data.status?.indicator || 'unknown',
          description: data.status?.description || '',
        };
      } catch (e) {
        return { name: s.name, status: 'unknown', description: 'Could not reach status page' };
      }
    })
  );

  const result = {
    source: 'terminalfeed.io',
    endpoint: 'service-status',
    updated_at: new Date().toISOString(),
    data: statuses.map(s => s.status === 'fulfilled' ? s.value : { name: 'Unknown', status: 'error' }),
  };
  setCache('service-status', result);
  return jsonResponse(result);
}

async function handleForex() {
  const cached = getCached('forex');
  if (cached) return jsonResponse(cached);

  const res = await fetchWithTimeout('https://api.frankfurter.app/latest?from=USD');
  const data = await res.json();
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'forex',
    updated_at: new Date().toISOString(),
    data: { base: 'USD', rates: data.rates, date: data.date },
  };
  setCache('forex', result);
  return jsonResponse(result);
}

async function handleHumansInSpace() {
  const cached = getCached('humans-in-space');
  if (cached) return jsonResponse(cached);

  const res = await fetchWithTimeout('http://api.open-notify.org/astros.json');
  const data = await res.json();
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'humans-in-space',
    updated_at: new Date().toISOString(),
    data: { count: data.number, people: data.people },
  };
  setCache('humans-in-space', result);
  return jsonResponse(result);
}

async function handleGithubTrending() {
  const cached = getCached('github-trending');
  if (cached) return jsonResponse(cached);

  const res = await fetchWithTimeout('https://api.github.com/events?per_page=20', {
    headers: { 'Accept': 'application/vnd.github.v3+json' },
  });
  const events = await res.json();
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'github-trending',
    updated_at: new Date().toISOString(),
    data: events.filter(e => e.type === 'WatchEvent').slice(0, 10).map(e => ({
      repo: e.repo?.name,
      actor: e.actor?.login,
      type: 'starred',
    })),
  };
  setCache('github-trending', result);
  return jsonResponse(result);
}

async function handleCyberThreats() {
  const cached = getCached('cyber-threats');
  if (cached) return jsonResponse(cached);

  let threats = [];
  try {
    const res = await fetchWithTimeout('https://urlhaus-api.abuse.ch/v1/urls/recent/limit/5/', { method: 'POST' });
    const data = await res.json();
    if (data.urls) {
      threats = data.urls.slice(0, 5).map(u => ({
        type: 'malware_url',
        threat: u.threat || 'unknown',
        tags: u.tags || [],
        source: 'URLhaus',
        time: u.dateadded,
      }));
    }
  } catch (e) {}

  const result = {
    source: 'terminalfeed.io',
    endpoint: 'cyber-threats',
    updated_at: new Date().toISOString(),
    data: threats,
  };
  setCache('cyber-threats', result);
  return jsonResponse(result);
}

async function handleDisasterAlerts() {
  const cached = getCached('disaster-alerts');
  if (cached) return jsonResponse(cached);

  const result = {
    source: 'terminalfeed.io',
    endpoint: 'disaster-alerts',
    updated_at: new Date().toISOString(),
    data: { note: 'GDACS XML parsing - use earthquake endpoint for seismic events' },
  };
  setCache('disaster-alerts', result);
  return jsonResponse(result);
}

async function handleLaunches() {
  const cached = getCached('launches');
  if (cached) return jsonResponse(cached);

  const res = await fetchWithTimeout('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&mode=list');
  const data = await res.json();
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'launches',
    updated_at: new Date().toISOString(),
    data: (data.results || []).map(l => ({ name: l.name, net: l.net, status: l.status?.name, provider: l.launch_service_provider?.name })),
  };
  setCache('launches', result);
  return jsonResponse(result);
}

async function handleEconomicData(env) {
  const cached = getCached('economic-data');
  if (cached) return jsonResponse(cached);

  const key = env?.FRED_API_KEY || 'DEMO_KEY';
  const series = ['FEDFUNDS', 'CPIAUCSL', 'UNRATE', 'DGS10', 'MORTGAGE30US'];

  const results = {};
  for (const id of series) {
    try {
      const res = await fetchWithTimeout(`https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${key}&file_type=json&limit=1&sort_order=desc`);
      const data = await res.json();
      results[id] = data.observations?.[0]?.value || null;
    } catch (e) {
      results[id] = null;
    }
  }

  const result = {
    source: 'terminalfeed.io',
    endpoint: 'economic-data',
    updated_at: new Date().toISOString(),
    data: {
      fed_funds_rate: results.FEDFUNDS,
      cpi_inflation: results.CPIAUCSL,
      unemployment_rate: results.UNRATE,
      treasury_10y: results.DGS10,
      mortgage_30y: results.MORTGAGE30US,
    },
  };
  setCache('economic-data', result);
  return jsonResponse(result);
}

async function handleSteam() {
  const cached = getCached('steam');
  if (cached) return jsonResponse(cached);

  const res = await fetchWithTimeout('https://steamspy.com/api.php?request=top100in2weeks');
  const data = await res.json();
  const games = Object.values(data).sort((a, b) => (b.ccu || 0) - (a.ccu || 0)).slice(0, 10).map(g => ({
    name: g.name,
    players_now: g.ccu || 0,
    peak_today: g.peak || 0,
  }));
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'steam',
    updated_at: new Date().toISOString(),
    data: games,
  };
  setCache('steam', result);
  return jsonResponse(result);
}

async function handleStocks(env) {
  const cached = getCached('stocks');
  if (cached) return jsonResponse(cached);

  const key = env?.FINNHUB_API_KEY || '';
  const tickers = ['SPY', 'QQQ', 'DIA', 'NVDA', 'AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA', 'META', 'AMD', 'COIN', 'PLTR'];

  const quotes = [];
  for (const symbol of tickers) {
    try {
      const res = await fetchWithTimeout(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`);
      const data = await res.json();
      if (data.c > 0) quotes.push({ symbol, price: data.c, change_percent: data.dp, change: data.d });
    } catch (e) {}
  }

  const sorted = quotes.sort((a, b) => Math.abs(b.change_percent || 0) - Math.abs(a.change_percent || 0));
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'stocks',
    updated_at: new Date().toISOString(),
    data: {
      gainers: sorted.filter(s => s.change_percent > 0).slice(0, 5),
      losers: sorted.filter(s => s.change_percent < 0).slice(0, 5),
      indices: quotes.filter(s => ['SPY', 'QQQ', 'DIA'].includes(s.symbol)),
    },
  };
  setCache('stocks', result);
  return jsonResponse(result);
}

async function handleWeather(url) {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  if (!lat || !lon) return jsonResponse({ error: 'Missing lat and lon parameters' }, 400);

  const cacheKey = `weather-${lat}-${lon}`;
  const cached = getCached(cacheKey);
  if (cached) return jsonResponse(cached);

  const res = await fetchWithTimeout(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
  );
  const data = await res.json();
  const result = {
    source: 'terminalfeed.io',
    endpoint: 'weather',
    updated_at: new Date().toISOString(),
    data: data.current || {},
  };
  cache[cacheKey] = { data: result, timestamp: Date.now() };
  return jsonResponse(result);
}

async function handleBriefing(env) {
  const cached = getCached('briefing');
  if (cached) return jsonResponse(cached);

  const [btc, fg, quakes, predictions, news, status] = await Promise.allSettled([
    handleBtcPrice().then(r => r.json()),
    handleFearGreed().then(r => r.json()),
    handleEarthquake().then(r => r.json()),
    handlePredictions().then(r => r.json()),
    handleHackerNews().then(r => r.json()),
    handleServiceStatus().then(r => r.json()),
  ]);

  const safe = (r) => r.status === 'fulfilled' ? r.value?.data : null;
  const btcData = safe(btc);
  const fgData = safe(fg);
  const quakeData = safe(quakes);
  const predData = safe(predictions);
  const newsData = safe(news);
  const statusData = safe(status);

  const parts = [];
  if (btcData?.price_usd) parts.push(`BTC at $${btcData.price_usd.toLocaleString()} (${btcData.change_24h_percent >= 0 ? '+' : ''}${btcData.change_24h_percent?.toFixed(1)}% 24h).`);
  if (fgData?.value) parts.push(`Fear & Greed: ${fgData.value} (${fgData.label}).`);
  if (quakeData?.earthquakes?.length) {
    const biggest = quakeData.earthquakes[0];
    parts.push(`${quakeData.count} recent earthquakes, largest M${biggest.magnitude} near ${biggest.location}.`);
  }
  if (predData?.length) parts.push(`Top prediction: "${predData[0].question}" - ${predData[0].yes_percent}% Yes.`);
  const outages = statusData?.filter(s => s.status !== 'operational') || [];
  if (outages.length > 0) parts.push(`Outages: ${outages.map(s => s.name).join(', ')}.`);
  else if (statusData) parts.push('All major services operational.');
  if (newsData?.length) parts.push(`Top HN: "${newsData[0].title}".`);

  const result = {
    source: 'terminalfeed.io',
    endpoint: 'briefing',
    generated_at: new Date().toISOString(),
    summary: parts.join(' '),
    sections: {
      crypto: btcData,
      fear_greed: fgData,
      earthquakes: quakeData,
      predictions: predData?.slice(0, 5),
      news: newsData?.slice(0, 5),
      services: statusData,
    },
  };
  setCache('briefing', result);
  return jsonResponse(result);
}

// === TWEET HANDLERS ===

async function handleTweet(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);

  const auth = request.headers.get('Authorization');
  if (!auth || auth !== 'Bearer ' + env.ADMIN_SECRET) return jsonResponse({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const text = body.text;
    if (!text || text.length === 0) return jsonResponse({ error: 'Missing text field' }, 400);
    if (text.length > 280) return jsonResponse({ error: 'Tweet exceeds 280 characters', length: text.length }, 400);

    const result = await postTweet(text, env);
    return jsonResponse({ tweeted: true, text, result });
  } catch (err) {
    return jsonResponse({ error: 'Tweet failed', message: err.message }, 500);
  }
}

async function handleAutoBriefing(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || auth !== 'Bearer ' + env.ADMIN_SECRET) return jsonResponse({ error: 'Unauthorized' }, 401);

  try {
    const tweetText = await buildBriefingTweet();
    const result = await postTweet(tweetText, env);
    return jsonResponse({ tweeted: true, text: tweetText, result });
  } catch (err) {
    return jsonResponse({ error: 'Auto-briefing tweet failed', message: err.message }, 500);
  }
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}
