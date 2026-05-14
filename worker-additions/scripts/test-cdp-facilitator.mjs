#!/usr/bin/env node
// Unit test for the CDP facilitator's path-constraint guard. This is the
// load-bearing safety check: even if the CDP key were ever wider than
// read-only-x402, we must refuse to sign JWTs for non-x402 paths.
//
// Run: node worker-additions/scripts/test-cdp-facilitator.mjs

import { _assertCdpPathAllowed, buildCdpJwt } from '../cdp-facilitator.js';

let failed = 0;
function pass(name) { console.log('  ok  ' + name); }
function fail(name, err) { failed += 1; console.error('  FAIL ' + name + ': ' + (err && err.message || err)); }

function assertThrows(name, fn, expectedFragment) {
  try {
    fn();
    fail(name, 'expected throw, got success');
  } catch (e) {
    if (expectedFragment && String(e.message || '').indexOf(expectedFragment) === -1) {
      fail(name, 'wrong error message: ' + e.message);
      return;
    }
    pass(name);
  }
}

function assertOk(name, fn) {
  try {
    fn();
    pass(name);
  } catch (e) {
    fail(name, e);
  }
}

console.log('cdp-facilitator path-constraint guard');

assertOk('allows /platform/v2/x402/verify', function () {
  _assertCdpPathAllowed('/platform/v2/x402/verify');
});
assertOk('allows /platform/v2/x402/settle', function () {
  _assertCdpPathAllowed('/platform/v2/x402/settle');
});
assertThrows('rejects /platform/v2/wallets', function () {
  _assertCdpPathAllowed('/platform/v2/wallets/123');
}, 'refusing to sign JWT');
assertThrows('rejects /platform/v2/onramp', function () {
  _assertCdpPathAllowed('/platform/v2/onramp/orders');
}, 'refusing to sign JWT');
assertThrows('rejects /v2/trade', function () {
  _assertCdpPathAllowed('/v2/trade');
}, 'refusing to sign JWT');
assertThrows('rejects empty string', function () {
  _assertCdpPathAllowed('');
}, 'refusing to sign JWT');
assertThrows('rejects null', function () {
  _assertCdpPathAllowed(null);
}, 'refusing to sign JWT');

console.log('\ncdp-facilitator buildCdpJwt env guard');

async function assertRejects(name, fn, expectedFragment) {
  try {
    await fn();
    fail(name, 'expected reject, got success');
  } catch (e) {
    if (expectedFragment && String(e.message || '').indexOf(expectedFragment) === -1) {
      fail(name, 'wrong error message: ' + e.message);
      return;
    }
    pass(name);
  }
}

await assertRejects('rejects when env missing', function () {
  return buildCdpJwt({}, 'POST', 'https://api.cdp.coinbase.com/platform/v2/x402/settle');
}, 'CDP_API_KEY_ID and CDP_API_KEY_SECRET must be set');

await assertRejects('rejects when CDP_API_KEY_SECRET missing', function () {
  return buildCdpJwt({ CDP_API_KEY_ID: 'kid' }, 'POST', 'https://api.cdp.coinbase.com/platform/v2/x402/settle');
}, 'CDP_API_KEY_ID and CDP_API_KEY_SECRET must be set');

await assertRejects('rejects when path is non-x402 even with full env', function () {
  return buildCdpJwt(
    { CDP_API_KEY_ID: 'kid', CDP_API_KEY_SECRET: 'AAAA' },
    'POST',
    'https://api.cdp.coinbase.com/platform/v2/wallets/123'
  );
}, 'refusing to sign JWT for path outside');

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll tests passed');
