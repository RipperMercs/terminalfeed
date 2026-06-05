// Structural invariant: every Bazaar pilot path MUST be strict-premium.
//
// A Bazaar pilot that is NOT in STRICT_PREMIUM_PATHS leaks: anonymous callers
// get a free-trial 200 with the full premium dataset, and CDP's Bazaar crawler
// never sees the 402 it needs to catalog the endpoint, the exact failure
// strict-premium exists to prevent. This test fails the build if a pilot is ever
// added to bazaar-pilots.js without also being made strict in worker.js, turning
// that leak from a silent runtime bug into a red build.
//
// Run: node scripts/test-strict-premium-pilots.mjs   (from worker-additions/)
// Propagated from the TensorFeed money-path audit, 2026-06-04.

import { readFileSync } from 'node:fs';
import { listPilots } from '../bazaar-pilots.js';

const src = readFileSync(new URL('../worker.js', import.meta.url), 'utf8');
const start = src.indexOf('const STRICT_PREMIUM_PATHS');
const fnIdx = src.indexOf('function isStrictPremiumPath', start);
if (start === -1 || fnIdx === -1) {
  console.error('FAIL: could not locate STRICT_PREMIUM_PATHS / isStrictPremiumPath in worker.js');
  process.exit(1);
}
const endMarker = src.indexOf('\n}', fnIdx); // first column-0 brace closes the function
const block = src.slice(start, endMarker + 2);
// eslint-disable-next-line no-new-func -- input is our own worker.js source, read at test time
const factory = new Function(block + '\nreturn { isStrictPremiumPath };');
const { isStrictPremiumPath } = factory();

// Deliberately bearer-only writes (handlers that hard-require a token and 401
// rather than serve a free-trial 200) may be exempted here with a reason.
// Empty today; TerminalFeed has no such pilot.
const ALLOWLIST = new Set([]);

const pilots = listPilots().map((p) => p.path);
let fail = 0;
for (const path of pilots) {
  if (ALLOWLIST.has(path)) continue;
  if (isStrictPremiumPath(path) !== true) {
    fail++;
    console.error(`FAIL: Bazaar pilot ${path} is NOT strict-premium (add it to STRICT_PREMIUM_PATHS in worker.js)`);
  }
}
if (pilots.length === 0) {
  console.log('strict-premium pilots: no pilots registered (nothing to assert)');
} else {
  console.log(`strict-premium pilots: ${pilots.length - fail}/${pilots.length} pilots are strict-premium`);
}
process.exit(fail === 0 ? 0 : 1);
