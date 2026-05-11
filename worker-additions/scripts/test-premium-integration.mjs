#!/usr/bin/env node
// Integration test for every paid /api/pro/* endpoint on TerminalFeed.
//
// Usage:
//   node test-premium-integration.mjs <tf_live_token> [base-url]
//
// The token must already have credits seeded (mint via /api/payment/buy-credits
// on either federation member; tokens minted on TensorFeed are also valid here).
// Default base-url is https://terminalfeed.io.
//
// Each endpoint is tested for:
//   1. Reachability + 200/4xx/503 with the token (auth path works)
//   2. Body has the expected top-level shape (or proper hint on 503)
//   3. Signed receipt embedded on every paid response (v:1, ed25519)
//   4. Billing block present with sane credits accounting
//   5. AFTA staleness path: a stale response carries no_charge_reason: 'stale_data'
//      and credits_charged: 0. Endpoints with NULL or compute-only SLAs skip this.
//
// Exit code 0 if every paid endpoint responds with a signed receipt and a
// well-formed billing block; 1 if any endpoint regresses.

const TOKEN = process.argv[2];
const BASE = process.argv[3] || process.env.TF_BASE || 'https://terminalfeed.io';

if (!TOKEN || !TOKEN.startsWith('tf_live_')) {
  console.error('Usage: node test-premium-integration.mjs <tf_live_token> [base-url]');
  console.error('  TF_BASE env var also works for the base URL.');
  process.exit(2);
}

// Test catalog covers all 12 paid /api/pro/* endpoints plus the public
// surfaces that should round-trip without auth: /api/meta, /api/afta-certify/check.

const tests = [
  {
    id: 'briefing',
    name: 'Premium briefing',
    path: '/api/pro/briefing',
    happyKeys: ['sections'],
    okErrors: [],
  },
  {
    id: 'macro',
    name: 'Macro rollup',
    path: '/api/pro/macro',
    happyKeys: ['rates', 'commodities', 'fx'],
    okErrors: ['upstream_error'],
  },
  {
    id: 'crypto-deep',
    name: 'Crypto deep-dive',
    path: '/api/pro/crypto-deep?coin=bitcoin',
    happyKeys: ['coin', 'price', 'network'],
    okErrors: ['upstream_error'],
  },
  {
    id: 'agent-context',
    name: 'Agent-context system prompt',
    path: '/api/pro/agent-context',
    happyKeys: ['system_prompt'],
    okErrors: [],
  },
  {
    id: 'sentiment',
    name: 'Crypto sentiment',
    path: '/api/pro/sentiment',
    happyKeys: ['fear_greed', 'trending'],
    okErrors: ['upstream_error'],
  },
  {
    id: 'world-deltas',
    name: 'World deltas (polling)',
    path: '/api/pro/world-deltas',
    happyKeys: ['events'],
    okErrors: [],
  },
  {
    id: 'correlation-matrix',
    name: 'Correlation matrix',
    path: '/api/pro/correlation-matrix',
    happyKeys: ['series', 'matrix'],
    okErrors: ['insufficient_history'],
  },
  {
    id: 'whales',
    name: 'Whale-watch',
    path: '/api/pro/whales',
    happyKeys: ['transactions'],
    okErrors: ['upstream_error'],
  },
  {
    id: 'exchange-flows',
    name: 'Labeled exchange flows',
    path: '/api/pro/exchange-flows',
    happyKeys: ['wallets', 'flows'],
    okErrors: ['upstream_error'],
  },
  {
    id: 'defi-tvl',
    name: 'DeFi TVL rollup',
    path: '/api/pro/defi-tvl',
    happyKeys: ['protocols', 'chains'],
    okErrors: ['upstream_error'],
  },
  {
    id: 'stablecoin-flows',
    name: 'Stablecoin flows',
    path: '/api/pro/stablecoin-flows',
    happyKeys: ['stablecoins', 'aggregate'],
    okErrors: ['upstream_error'],
  },
  {
    id: 'github-velocity',
    name: 'GitHub velocity',
    path: '/api/pro/github-velocity',
    happyKeys: ['repos'],
    okErrors: ['upstream_error'],
  },
  // Negative: missing-bearer path on a paid endpoint must 402 with no receipt
  {
    id: 'briefing-no-bearer',
    name: 'Briefing without bearer (expect 402)',
    path: '/api/pro/briefing',
    skipBearer: true,
    expectStatus: 402,
  },
];

// Helpers

function color(s, c) {
  const codes = { red: 31, green: 32, yellow: 33, gray: 90, bold: 1 };
  return `\x1b[${codes[c] ?? 0}m${s}\x1b[0m`;
}

function checkReceipt(body) {
  const r = body.receipt;
  if (!r || typeof r !== 'object') return { ok: false, reason: 'missing receipt' };
  const required = ['v', 'id', 'endpoint', 'method', 'credits_charged', 'request_hash', 'response_hash'];
  for (const f of required) {
    if (!(f in r)) return { ok: false, reason: `receipt missing ${f}` };
  }
  if (r.v !== 1) return { ok: false, reason: `unexpected receipt v=${r.v}, expected 1` };
  if (typeof r.signature !== 'string' || !r.signature) return { ok: false, reason: 'receipt has no signature' };
  return { ok: true };
}

function checkBilling(body) {
  const b = body.billing;
  if (!b || typeof b !== 'object') return { ok: false, reason: 'missing billing' };
  if (typeof b.credits_charged !== 'number') return { ok: false, reason: 'billing missing credits_charged' };
  if (typeof b.credits_remaining !== 'number') return { ok: false, reason: 'billing missing credits_remaining' };
  return { ok: true };
}

async function runOne(t) {
  const url = `${BASE}${t.path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (!t.skipBearer) headers.Authorization = `Bearer ${TOKEN}`;
  const startedAt = Date.now();
  let res, body;
  try {
    res = await fetch(url, { headers });
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = { _raw: text.slice(0, 200) };
    }
  } catch (err) {
    return { id: t.id, name: t.name, pass: false, reason: `fetch threw: ${err.message}`, ms: Date.now() - startedAt };
  }
  const ms = Date.now() - startedAt;

  // Negative auth path: expect a specific status, no receipt required
  if (t.expectStatus) {
    if (res.status !== t.expectStatus) {
      return { id: t.id, name: t.name, pass: false, reason: `expected status ${t.expectStatus}, got ${res.status}`, ms, body };
    }
    return { id: t.id, name: t.name, pass: true, reason: `${res.status} (expected)`, ms };
  }

  // 503 / 5xx no-charge path
  if (res.status >= 500) {
    const rc = checkReceipt(body);
    if (!rc.ok) return { id: t.id, name: t.name, pass: false, reason: `5xx without receipt: ${rc.reason}`, ms, body };
    const billing = body.billing || {};
    if (billing.no_charge_reason !== '5xx' && billing.no_charge_reason !== 'circuit_breaker') {
      return { id: t.id, name: t.name, pass: false, reason: `5xx without no_charge_reason=5xx (got: ${billing.no_charge_reason})`, ms, body };
    }
    return { id: t.id, name: t.name, pass: true, reason: `${res.status} + signed receipt + no-charge`, ms, awaitingData: true };
  }

  if (res.status >= 400) {
    const errStr = body.error || '';
    if (t.okErrors && t.okErrors.includes(errStr)) {
      return { id: t.id, name: t.name, pass: true, reason: `${res.status} (${errStr}), expected`, ms, awaitingData: true };
    }
    return { id: t.id, name: t.name, pass: false, reason: `unexpected ${res.status}: ${errStr || body._raw || 'no body'}`, ms, body };
  }

  // 200 path: happy shape + receipt + billing
  if (res.status !== 200) {
    return { id: t.id, name: t.name, pass: false, reason: `unexpected status ${res.status}`, ms, body };
  }
  for (const k of t.happyKeys) {
    if (!(k in body)) {
      return { id: t.id, name: t.name, pass: false, reason: `body missing key: ${k}`, ms, body };
    }
  }
  const rc = checkReceipt(body);
  if (!rc.ok) return { id: t.id, name: t.name, pass: false, reason: rc.reason, ms, body };
  const bc = checkBilling(body);
  if (!bc.ok) return { id: t.id, name: t.name, pass: false, reason: bc.reason, ms, body };

  // Stale-path verification: if body.stale === true, billing must reflect no-charge
  if (body.stale === true) {
    const billing = body.billing || {};
    if (billing.no_charge_reason !== 'stale_data') {
      return { id: t.id, name: t.name, pass: false, reason: 'body.stale=true but no_charge_reason!=stale_data', ms, body };
    }
    if (billing.credits_charged !== 0) {
      return { id: t.id, name: t.name, pass: false, reason: 'stale response but credits_charged>0', ms, body };
    }
    return { id: t.id, name: t.name, pass: true, reason: '200 + stale_data no-charge + signed receipt', ms, creditsRemaining: billing.credits_remaining };
  }

  return { id: t.id, name: t.name, pass: true, reason: '200 + shape + signed receipt + billing', ms, creditsRemaining: body.billing.credits_remaining };
}

// Public surface tests (no bearer required)
async function runPublic(name, path, expectKeys) {
  const url = `${BASE}${path}`;
  const t0 = Date.now();
  let res, body;
  try {
    res = await fetch(url);
    body = await res.json();
  } catch (err) {
    return { name, pass: false, reason: `fetch threw: ${err.message}`, ms: Date.now() - t0 };
  }
  const ms = Date.now() - t0;
  if (res.status !== 200) return { name, pass: false, reason: `status ${res.status}`, ms, body };
  for (const k of expectKeys) {
    if (!(k in body)) return { name, pass: false, reason: `body missing ${k}`, ms, body };
  }
  return { name, pass: true, reason: `200 + shape`, ms };
}

// Main

console.log(color('\nTerminalFeed premium integration tests', 'bold'));
console.log(color(`  base: ${BASE}`, 'gray'));
console.log(color(`  token: ${TOKEN.slice(0, 14)}...${TOKEN.slice(-6)}`, 'gray'));
console.log();

const results = [];
for (const t of tests) {
  const r = await runOne(t);
  results.push(r);
  const status = r.pass ? color('PASS', 'green') : color('FAIL', 'red');
  const tag = r.awaitingData ? color(' [upstream / partial]', 'yellow') : '';
  console.log(`  ${status}  ${r.name}${tag}`);
  console.log(color(`        ${r.reason} (${r.ms}ms)`, 'gray'));
  if (!r.pass && r.body) {
    console.log(color(`        body: ${JSON.stringify(r.body).slice(0, 240)}`, 'gray'));
  }
}

console.log();
console.log(color('Public surfaces', 'bold'));
const publicChecks = [
  await runPublic('/api/meta', '/api/meta', ['agent_fair_trade', 'payment']),
  await runPublic('/api/afta-certify/check (self)', '/api/afta-certify/check?domain=terminalfeed.io', ['checks', 'score', 'verdict']),
  await runPublic('/.well-known/agent-fair-trade.json', '/.well-known/agent-fair-trade.json', ['no_charge_guarantees']),
];
for (const r of publicChecks) {
  const status = r.pass ? color('PASS', 'green') : color('FAIL', 'red');
  console.log(`  ${status}  ${r.name}`);
  console.log(color(`        ${r.reason} (${r.ms}ms)`, 'gray'));
}

const allResults = results.concat(publicChecks);
const passes = allResults.filter(r => r.pass).length;
const fails = allResults.filter(r => !r.pass).length;
const awaits = results.filter(r => r.awaitingData).length;

console.log();
console.log(color(`Results: ${passes}/${allResults.length} passing  (${awaits} awaiting upstream)`, 'bold'));
if (fails > 0) {
  console.log(color(`        ${fails} failed, see output above`, 'red'));
  process.exit(1);
}
process.exit(0);
