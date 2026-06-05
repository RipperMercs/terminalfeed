// Regression test for capture-time provenance (finding D).
//
// Extracts the real cacheLookupOrFetch out of worker.js and asserts it tags
// every response with _captured_at set to the TRUE capture time (the cache
// entry's write time for a cached/stale serve, the fetch time for a fresh one),
// not the moment the response was composed. aftaPremiumResponse promotes that
// value to captured_at, which the freshness SLA and the signed receipt depend on.
//
// Run: node scripts/test-provenance.mjs   (from worker-additions/)
// Propagated from the TensorFeed money-path audit, 2026-06-04.

import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../worker.js', import.meta.url), 'utf8');
const start = src.indexOf('async function cacheLookupOrFetch');
const end = src.indexOf('async function handleHealthPremium');
if (start === -1 || end === -1 || end <= start) {
  console.error('FAIL: could not locate cacheLookupOrFetch in worker.js');
  process.exit(1);
}
const block = src.slice(start, end);

const preamble = `
  var _cache = {};
  function setCache(key, data) { _cache[key] = { data: data, ts: Date.now() }; }
  function _recordEndpointSuccess() {}
  function _recordEndpointError() {}
  var STALE_SERVE_MAX_MS = 3600000;
`;
// eslint-disable-next-line no-new-func -- input is our own worker.js source, read at test time
const factory = new Function(preamble + block +
  '\nreturn { cacheLookupOrFetch: cacheLookupOrFetch, setEntry: function(k,d,ts){ _cache[k] = { data: d, ts: ts }; } };');
const { cacheLookupOrFetch, setEntry } = factory();

let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; } else { fail++; console.error('FAIL: ' + name); } }
const isIso = (s) => typeof s === 'string' && !Number.isNaN(Date.parse(s));

const run = async () => {
  // 1. Fresh fetch: _captured_at present, ~now, age 0.
  const fresh = await cacheLookupOrFetch('k1', 10000, async () => ({ x: 1 }));
  check('fresh: _cached false', fresh._cached === false);
  check('fresh: _captured_at is ISO', isIso(fresh._captured_at));
  check('fresh: _captured_at within 2s of now', Math.abs(Date.parse(fresh._captured_at) - Date.now()) < 2000);

  // 2. Cached serve: _captured_at equals the entry write time, NOT now.
  const writtenTs = Date.now() - 120000; // entry captured 2 minutes ago
  setEntry('k2', { x: 2 }, writtenTs);
  const cached = await cacheLookupOrFetch('k2', 300000, async () => { throw new Error('should not refetch'); });
  check('cached: _cached true', cached._cached === true);
  check('cached: _captured_at equals entry write time', Date.parse(cached._captured_at) === writtenTs);
  check('cached: _captured_at is ~120s old, not now', Math.abs(Date.parse(cached._captured_at) - Date.now()) > 100000);
  check('cached: _cache_age_seconds ~120', cached._cache_age_seconds >= 119 && cached._cache_age_seconds <= 121);

  // 3. Stale serve (expired TTL + upstream throws): _captured_at = entry write time, _stale_serve set.
  const staleTs = Date.now() - 600000; // 10 minutes ago
  setEntry('k3', { x: 3 }, staleTs);
  const stale = await cacheLookupOrFetch('k3', 1000, async () => { throw new Error('upstream down'); });
  check('stale: _stale_serve true', stale._stale_serve === true);
  check('stale: _captured_at equals stale entry write time', Date.parse(stale._captured_at) === staleTs);

  // 4. Promotion logic mirror (the snippet in aftaPremiumResponse): _captured_at
  //    becomes captured_at only when the fetcher did not set its own.
  function promote(body) {
    if (typeof body.captured_at !== 'string' && typeof body._captured_at === 'string') {
      body.captured_at = body._captured_at;
    }
    if ('_captured_at' in body) delete body._captured_at;
    return body;
  }
  const p1 = promote({ _captured_at: '2026-06-04T00:00:00.000Z' });
  check('promote: sets captured_at from _captured_at', p1.captured_at === '2026-06-04T00:00:00.000Z');
  check('promote: strips _captured_at', !('_captured_at' in p1));
  const p2 = promote({ captured_at: '2026-01-01T00:00:00.000Z', _captured_at: '2026-06-04T00:00:00.000Z' });
  check('promote: fetcher captured_at wins', p2.captured_at === '2026-01-01T00:00:00.000Z');
  check('promote: strips _captured_at even when not used', !('_captured_at' in p2));

  console.log(`provenance: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
};
run().catch((e) => { console.error('FAIL (threw): ' + e.message); process.exit(1); });
