#!/usr/bin/env node
// Weekly real-time feed audit. Hits every internal /api/* route the
// dashboard depends on, applies endpoint-specific freshness rules, and
// reports PASS / WARN / STALE / BROKEN per feed.
//
// Usage:
//   node scripts/audit-feeds.js                 # hit production
//   node scripts/audit-feeds.js --base=http://localhost:8787
//   node scripts/audit-feeds.js --json          # machine-readable output
//
// Exits 0 if every feed is PASS or WARN, 1 if any STALE or BROKEN.

const args = process.argv.slice(2);
const BASE = (args.find(a => a.startsWith('--base=')) || '--base=https://terminalfeed.io').slice(7);
const JSON_OUT = args.includes('--json');
const TIMEOUT_MS = 12000;
const NOW = Date.now();

const ANSI = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
const color = (s, c) => (process.stdout.isTTY ? `${ANSI[c]}${s}${ANSI.reset}` : s);

const minutes = n => n * 60_000;
const hours = n => n * 60 * 60_000;
const days = n => n * 24 * 60 * 60_000;

// Each rule returns { status, note } where status is PASS/WARN/STALE/BROKEN.
// `data` is the parsed JSON body. Throw to mark BROKEN.
const PASS = note => ({ status: 'PASS', note: note || '' });
const WARN = note => ({ status: 'WARN', note });
const STALE = note => ({ status: 'STALE', note });
const BROKEN = note => ({ status: 'BROKEN', note });

const ageHuman = ms => {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < hours(1)) return `${Math.round(ms / 60_000)}m`;
  if (ms < days(1)) return `${(ms / hours(1)).toFixed(1)}h`;
  return `${(ms / days(1)).toFixed(1)}d`;
};

// FEEDS: ordered list of [path, ruleFn]. Add new entries as new endpoints ship.
const FEEDS = [
  ['/api/health', d => d.status === 'ok' ? PASS(`v${d.version}`) : BROKEN('status not ok')],
  ['/api/briefing', d => {
    const t = new Date(d.generated_at).getTime();
    return NOW - t < hours(1) ? PASS(`generated ${ageHuman(NOW - t)} ago`) : STALE(`generated ${ageHuman(NOW - t)} ago`);
  }],
  ['/api/btc-price', d => (d?.data?.price_usd > 0) ? PASS(`$${d.data.price_usd.toFixed(0)}`) : BROKEN('no price')],
  ['/api/stocks', d => {
    if (!Array.isArray(d?.data) || d.data.length < 10) return BROKEN(`only ${d?.data?.length ?? 0} stocks`);
    if (!d.ts) return WARN('no ts field');
    const age = NOW - d.ts;
    return age < hours(72) ? PASS(`${d.data.length} stocks, ${ageHuman(age)} old`) : STALE(`${ageHuman(age)} old`);
  }],
  ['/api/crypto-movers', d => Array.isArray(d?.data) && d.data.length >= 10 ? PASS(`${d.data.length} coins`) : BROKEN(`only ${d?.data?.length ?? 0}`)],
  ['/api/coingecko/markets', d => Array.isArray(d?.data) && d.data.length >= 10 ? PASS(`${d.data.length} markets`) : BROKEN(`only ${d?.data?.length ?? 0}`)],
  ['/api/coingecko/global', d => d?.data?.total_market_cap?.usd > 0 ? PASS(`$${(d.data.total_market_cap.usd / 1e12).toFixed(2)}T cap`) : BROKEN('no market cap')],
  ['/api/coingecko/gold', d => d?.data?.[0]?.current_price > 0 ? PASS(`$${d.data[0].current_price.toFixed(0)}`) : BROKEN('no gold price')],
  ['/api/coingecko/btc-chart', d => {
    if (!Array.isArray(d?.prices) || d.prices.length < 50) return BROKEN(`only ${d?.prices?.length ?? 0} points`);
    const last = d.prices[d.prices.length - 1][0];
    const age = NOW - last;
    return age < hours(2) ? PASS(`${d.prices.length} points, last ${ageHuman(age)} ago`) : STALE(`last point ${ageHuman(age)} old`);
  }],
  ['/api/fear-greed', d => {
    const ts = parseInt(d?.data?.timestamp, 10) * 1000;
    if (!ts) return BROKEN('no timestamp');
    const age = NOW - ts;
    return age < hours(36) ? PASS(`${d.data.label} (${d.data.value}), ${ageHuman(age)} old`) : STALE(`${ageHuman(age)} old`);
  }],
  ['/api/earthquake', d => {
    if (!Array.isArray(d?.data) || d.data.length === 0) return BROKEN('empty');
    const age = NOW - d.data[0].time;
    return age < hours(24) ? PASS(`${d.data.length} events, latest ${ageHuman(age)} ago`) : STALE(`latest ${ageHuman(age)} ago`);
  }],
  ['/api/predictions', d => Array.isArray(d?.data) && d.data.length >= 5 ? PASS(`${d.data.length} markets`) : BROKEN(`only ${d?.data?.length ?? 0}`)],
  ['/api/hn-topstories?limit=10', d => {
    if (!Array.isArray(d?.data) || d.data.length === 0) return BROKEN('empty');
    const age = NOW - d.data[0].time * 1000;
    return age < hours(24) ? PASS(`top story ${ageHuman(age)} old`) : STALE(`top story ${ageHuman(age)} old`);
  }],
  ['/api/service-status', d => {
    if (!Array.isArray(d?.data) || d.data.length < 8) return BROKEN(`only ${d?.data?.length ?? 0} services`);
    const unknown = d.data.filter(s => s.indicator === 'unknown' || /unreachable/i.test(s.description));
    if (unknown.length >= d.data.length / 2) return STALE(`${unknown.length}/${d.data.length} unreachable`);
    if (unknown.length > 0) return WARN(`${unknown.length} unreachable: ${unknown.map(u => u.name).join(', ')}`);
    return PASS(`${d.data.length} services`);
  }],
  ['/api/cyber-threats', d => Array.isArray(d?.data) && d.data.length >= 5 ? PASS(`${d.data.length} threats`) : STALE(`only ${d?.data?.length ?? 0} threats — upstream silently failing`)],
  ['/api/forex', d => {
    if (!d?.data?.rates) return BROKEN('no rates');
    const date = d.data.date;
    const sameAsPrev = JSON.stringify(d.data.rates) === JSON.stringify(d.data.prevRates);
    if (sameAsPrev) return WARN(`prevRates identical to rates (delta math broken) — date ${date}`);
    return PASS(`base ${d.data.base}, date ${date}`);
  }],
  ['/api/humans-in-space', d => {
    if (!d?.data?.count) return BROKEN('no crew');
    // The May-2024 default Open-Notify crew. If we still see it in 2026 the upstream is dead.
    const stuck = ['Oleg Kononenko', 'Nikolai Chub', 'Tracy Caldwell Dyson'];
    const names = (d.data.people || []).map(p => p.name);
    const matches = stuck.filter(n => names.includes(n)).length;
    if (matches >= 2) return STALE(`crew matches May-2024 frozen open-notify snapshot (${d.data.count} people) — switch upstream`);
    return PASS(`${d.data.count} aboard`);
  }],
  ['/api/disaster-alerts', d => {
    if (!Array.isArray(d?.data) || d.data.length === 0) return BROKEN('empty');
    const age = NOW - new Date(d.data[0].date).getTime();
    return age < days(7) ? PASS(`${d.data.length} alerts, latest ${ageHuman(age)} ago`) : STALE(`latest ${ageHuman(age)} old`);
  }],
  ['/api/launches', d => Array.isArray(d?.data) && d.data.length >= 1 ? PASS(`${d.data.length} upcoming`) : STALE(`empty — upstream feed broken`)],
  ['/api/economic-data', d => {
    const fed = d?.data?.fed_rate?.date;
    if (!fed) return BROKEN('no fed_rate');
    const age = NOW - new Date(fed).getTime();
    return age < days(60) ? PASS(`fed=${d.data.fed_rate.value}% (${fed})`) : STALE(`latest ${ageHuman(age)} old`);
  }],
  ['/api/steam', d => Array.isArray(d?.data) && d.data.length >= 10 ? PASS(`${d.data.length} games`) : BROKEN(`only ${d?.data?.length ?? 0}`)],
  ['/api/weather?lat=34.05&lon=-118.24', d => {
    const t = new Date(d?.data?.current_weather?.time).getTime();
    if (!t) return BROKEN('no current_weather');
    const age = NOW - t;
    return age < hours(2) ? PASS(`${d.data.current_weather.temperature}°C`) : STALE(`current_weather ${ageHuman(age)} old`);
  }],
  ['/api/ai-stats', d => typeof d?.totalHits24h === 'number' ? PASS(`${d.totalHits24h} hits/24h`) : BROKEN('no totalHits24h')],
  ['/api/gas', d => {
    if (!d?.standard) return BROKEN('no gas data');
    if (!d.lastBlock) return WARN(`prices ok (${d.standard} gwei) but lastBlock=0`);
    return PASS(`${d.standard} gwei, block ${d.lastBlock}`);
  }],
  ['/api/cloud-status', d => {
    if (!Array.isArray(d?.providers)) return BROKEN('no providers');
    const stuck = d.providers.filter(p => p.status === 'unknown');
    if (stuck.length === d.providers.length) return BROKEN('all providers unknown');
    if (stuck.length > 0) return WARN(`stuck unknown: ${stuck.map(p => p.name).join(', ')}`);
    return PASS(`${d.providers.length} providers`);
  }],
  ['/api/claude-status', d => Array.isArray(d?.components) && d.components.length > 0 ? PASS(`${d.components.length} components`) : BROKEN('no components')],
  ['/api/severe-weather', d => {
    const t = new Date(d?.updated_at).getTime();
    if (!t) return BROKEN('no updated_at');
    const age = NOW - t;
    return age < hours(2) ? PASS(`${d.data?.top?.length ?? 0} alerts`) : STALE(`updated ${ageHuman(age)} ago`);
  }],
  ['/api/funding-rates', d => {
    const t = new Date(d?.updated_at).getTime();
    if (!t) return BROKEN('no updated_at');
    return Array.isArray(d?.data?.top) && d.data.top.length >= 5 ? PASS(`${d.data.top.length} venues`) : BROKEN(`only ${d?.data?.top?.length ?? 0}`);
  }],
  ['/api/wildfires', d => {
    const t = new Date(d?.updated_at).getTime();
    if (!t) return BROKEN('no updated_at');
    return d?.data?.total_24h > 0 ? PASS(`${d.data.total_24h} detections`) : STALE('total_24h is 0');
  }],
  ['/api/space-weather', d => {
    const t = new Date(d?.updated_at).getTime();
    if (!t) return BROKEN('no updated_at');
    const age = NOW - t;
    return age < hours(2) ? PASS(`Kp ${d.data?.kp_index}, ${d.data?.kp_storm_level}`) : STALE(`${ageHuman(age)} old`);
  }],
  ['/api/solana-network', d => {
    if (typeof d?.tps !== 'number') return BROKEN('no tps');
    if (d.tps === 0 && d.slot === 0) return BROKEN('all zeros — RPC call failing');
    return PASS(`${d.tps} tps, slot ${d.slot}`);
  }],
  ['/api/nasa-apod', d => d?.title && d?.date ? PASS(`"${d.title}" (${d.date})`) : BROKEN('no apod')],
  ['/api/xkcd', d => typeof d?.num === 'number' ? PASS(`#${d.num} "${d.safe_title}"`) : BROKEN('no num')],
  ['/api/harnesses', d => {
    const age = NOW - new Date(d?.generatedAt).getTime();
    if (!d?.generatedAt) return BROKEN('no generatedAt');
    return age < days(45) ? PASS(`generated ${ageHuman(age)} ago`) : STALE(`${ageHuman(age)} since manual refresh`);
  }],
  ['/api/gh-events', d => {
    if (!Array.isArray(d?.data) || d.data.length === 0) return BROKEN('empty');
    const age = NOW - new Date(d.data[0].created_at).getTime();
    return age < hours(1) ? PASS(`${d.data.length} events, latest ${ageHuman(age)} ago`) : STALE(`latest ${ageHuman(age)} ago`);
  }],
  ['/api/gh-trending?since=daily', d => Array.isArray(d?.data) && d.data.length >= 5 ? PASS(`${d.data.length} repos`) : BROKEN(`only ${d?.data?.length ?? 0}`)],
  ['/api/hf-trending', d => Array.isArray(d?.data) && d.data.length >= 5 ? PASS(`${d.data.length} models`) : BROKEN(`only ${d?.data?.length ?? 0}`)],
  ['/api/sports-scoreboard?sport=basketball&league=nba', d => Array.isArray(d?.leagues) && d.leagues.length > 0 ? PASS(`${d.leagues[0].name}`) : BROKEN('no leagues')],
  ['/api/rss?url=' + encodeURIComponent('https://www.gdacs.org/xml/rss.xml'), d => Array.isArray(d?.items) && d.items.length > 0 ? PASS(`${d.items.length} items`) : BROKEN('no items')],
];

async function audit(path, rule) {
  const url = `${BASE}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'tf-feed-audit/1.0' } });
    const ms = Date.now() - t0;
    if (!res.ok) {
      return { path, status: res.status === 404 ? 'BROKEN' : 'BROKEN', note: `HTTP ${res.status}`, ms };
    }
    const body = await res.json();
    const verdict = rule(body);
    return { path, ...verdict, ms };
  } catch (err) {
    const ms = Date.now() - t0;
    return { path, status: 'BROKEN', note: err.name === 'AbortError' ? `timeout after ${TIMEOUT_MS}ms` : err.message, ms };
  } finally {
    clearTimeout(timer);
  }
}

const STATUS_COLOR = { PASS: 'green', WARN: 'yellow', STALE: 'yellow', BROKEN: 'red' };
const STATUS_ORDER = { BROKEN: 0, STALE: 1, WARN: 2, PASS: 3 };

(async () => {
  if (!JSON_OUT) {
    console.log(color(`\n  TerminalFeed feed audit — ${new Date().toISOString()}`, 'bold'));
    console.log(color(`  Base: ${BASE}`, 'dim'));
    console.log(color(`  Auditing ${FEEDS.length} feeds…\n`, 'dim'));
  }

  const results = await Promise.all(FEEDS.map(([path, rule]) => audit(path, rule)));
  results.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.path.localeCompare(b.path));

  if (JSON_OUT) {
    console.log(JSON.stringify({ base: BASE, auditedAt: new Date().toISOString(), results }, null, 2));
  } else {
    for (const r of results) {
      const tag = color(r.status.padEnd(6), STATUS_COLOR[r.status]);
      const ms = color(`${String(r.ms).padStart(4)}ms`, 'gray');
      console.log(`  ${tag} ${ms}  ${color(r.path.padEnd(60), 'cyan')} ${color(r.note, 'dim')}`);
    }
    const counts = results.reduce((acc, r) => (acc[r.status] = (acc[r.status] || 0) + 1, acc), {});
    const summary = ['BROKEN', 'STALE', 'WARN', 'PASS']
      .filter(k => counts[k])
      .map(k => `${color(counts[k], STATUS_COLOR[k])} ${k}`)
      .join('  ');
    console.log(`\n  ${summary}\n`);
  }

  const fail = results.some(r => r.status === 'BROKEN' || r.status === 'STALE');
  process.exit(fail ? 1 : 0);
})();
