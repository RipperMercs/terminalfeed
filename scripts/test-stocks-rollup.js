// Test: /api/stocks feed-level freshness rollup.
//
// Why this exists. /api/stocks is the only feed whose payload carries a
// SEPATE timestamp per item: 31 symbols, each refreshed independently by the
// */5 cron, each keeping its last-good value when Finnhub's free tier throttles
// that particular symbol. Every other feed has one fetch timestamp for the whole
// body, so it cannot land in a mixed-age state.
//
// The rollup used to be a max() over per-symbol age, so ONE lagging ticker out
// of 31 set X-TF-Stale:true and the feed-health monitor recorded the whole feed
// as degraded. That is what drove /api/stocks to roughly a 25% lifetime stale
// rate while its dark rate stayed at 9 checks out of ~17,900: the endpoint was
// serving fine essentially always, it just had a straggler.
//
// The rule now: per-symbol staleness stays exactly as it was (consumers still
// see precisely which tickers lag, and the panel still dims them), while the
// FEED-level flag trips only when a quarter or more of the symbols are stale.
// A real Finnhub outage ages every symbol at once and still trips it.
//
// Run: node scripts/test-stocks-rollup.js
import assert from 'node:assert/strict';
import { computeStocksFeedRollup, STOCKS_FEED_STALE_RATIO } from '../worker-additions/worker.js';

const NOW = Date.UTC(2026, 7, 2, 20, 0, 0);
const MIN = 60 * 1000;

// Build a stocks payload: `ages` is a list of per-symbol ages in minutes.
function payload(ages) {
  return ages.map((mins, i) => {
    const asOf = NOW - mins * MIN;
    return {
      symbol: 'S' + i,
      as_of: new Date(asOf).toISOString(),
      age_seconds: Math.round((NOW - asOf) / 1000),
      stale: NOW - asOf > 12 * MIN,
    };
  });
}

const fresh = (n, mins = 1.5) => Array(n).fill(mins);
let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('  ok  ' + name);
}

console.log('stocks feed rollup');

// The regression this test was written for.
check('one straggler out of 31 does NOT mark the feed stale', () => {
  const p = payload([...fresh(30), 15]);
  const r = computeStocksFeedRollup(p, NOW);
  assert.equal(r.stale, false, 'feed should stay ok when 30/31 symbols are fresh');
  assert.equal(r.stale_count, 1);
  assert.equal(r.total, 31);
});

check('the straggler is still individually flagged stale', () => {
  const p = payload([...fresh(30), 15]);
  assert.equal(p[30].stale, true, 'per-symbol honesty must not be weakened');
  assert.equal(p[0].stale, false);
});

// The rollup must still catch genuine breakage.
check('a full upstream outage still marks the feed stale', () => {
  const r = computeStocksFeedRollup(payload(Array(31).fill(20)), NOW);
  assert.equal(r.stale, true, 'every symbol stale must trip the feed flag');
  assert.equal(r.stale_count, 31);
});

check('a quarter of symbols stale trips the feed flag', () => {
  const n = 31;
  const staleN = Math.ceil(n * STOCKS_FEED_STALE_RATIO);
  const r = computeStocksFeedRollup(payload([...fresh(n - staleN), ...Array(staleN).fill(20)]), NOW);
  assert.equal(r.stale, true, `${staleN}/${n} stale should trip the flag`);
});

check('just under the quarter threshold does not trip it', () => {
  const n = 31;
  const staleN = Math.ceil(n * STOCKS_FEED_STALE_RATIO) - 1;
  const r = computeStocksFeedRollup(payload([...fresh(n - staleN), ...Array(staleN).fill(20)]), NOW);
  assert.equal(r.stale, false, `${staleN}/${n} stale should not trip the flag`);
});

// as_of stays conservative so age is never overstated as fresher than it is.
check('as_of still reports the OLDEST symbol', () => {
  const r = computeStocksFeedRollup(payload([...fresh(30), 15]), NOW);
  assert.equal(r.ts, NOW - 15 * MIN, 'ts must be the oldest symbol, not the median');
});

// Degenerate inputs must not throw or silently claim freshness.
check('an empty payload is stale, not silently ok', () => {
  const r = computeStocksFeedRollup([], NOW);
  assert.equal(r.stale, true, 'no data must never report fresh');
  assert.equal(r.total, 0);
});

check('a single-symbol request behaves sanely', () => {
  assert.equal(computeStocksFeedRollup(payload([1]), NOW).stale, false);
  assert.equal(computeStocksFeedRollup(payload([20]), NOW).stale, true);
});

check('malformed entries do not throw', () => {
  const r = computeStocksFeedRollup([{ symbol: 'X' }, null], NOW);
  assert.equal(typeof r.stale, 'boolean');
});

console.log(`\n${passed} passed`);
