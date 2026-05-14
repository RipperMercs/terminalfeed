#!/usr/bin/env node
// Bazaar pilot verification. Run after deploying a worker that includes
// Section 1 (header fix) + Section 3 (pilot registry) + Section 5 (strict
// premium). Validates:
//
//   1. Anonymous GET to each pilot path returns 402 with:
//      - PAYMENT-REQUIRED header (base64 of canonical x402 V2 PaymentRequired)
//      - WWW-Authenticate: X402 requirements="<same base64>"
//      - Access-Control-Expose-Headers includes PAYMENT-REQUIRED
//      - body matches the header
//      - canonical.accepts[0].network === 'base'
//      - canonical.extensions.bazaar is present (pilot endpoints only)
//
//   2. The bazaar extension validates against its own schema (AJV 2020-12).
//
//   3. A real X-PAYMENT settle (when --settle flag passed) returns 200 with
//      a PAYMENT-RESPONSE header. EXTENSION-RESPONSES: bazaar: processing on
//      the underlying CDP settle is the cataloging signal; check Worker logs
//      with `wrangler tail` to see it.
//
// Run:
//   node worker-additions/scripts/smoke-bazaar-pilots.mjs
//   node worker-additions/scripts/smoke-bazaar-pilots.mjs --base=https://terminalfeed.io
//   node worker-additions/scripts/smoke-bazaar-pilots.mjs --settle --x-payment=<base64-payload>

import Ajv2020 from 'ajv/dist/2020.js';
import { listPilots } from '../bazaar-pilots.js';

const args = process.argv.slice(2);
function flag(name, fallback) {
  const hit = args.find((a) => a === '--' + name || a.startsWith('--' + name + '='));
  if (!hit) return fallback;
  const eq = hit.indexOf('=');
  if (eq === -1) return true;
  return hit.slice(eq + 1);
}

const BASE_URL = flag('base', 'https://terminalfeed.io');
const DO_SETTLE = !!flag('settle', false);
const X_PAYMENT_RAW = flag('x-payment', null);

let failed = 0;
function pass(name) { console.log('  ok  ' + name); }
function fail(name, err) {
  failed += 1;
  console.error('  FAIL ' + name + ': ' + (typeof err === 'string' ? err : JSON.stringify(err)));
}

const ajv = new Ajv2020({ strict: false, allErrors: true });

function b64decode(s) {
  // node has Buffer; use it directly without polyfilling
  return Buffer.from(s, 'base64').toString('utf8');
}

async function checkPilot402(path, config) {
  const url = BASE_URL + path;
  let res;
  try {
    // Send an allowlisted Origin so CORS expose-headers come through. Server-
    // to-server callers without Origin can still read PAYMENT-REQUIRED off the
    // raw response, but the Access-Control-Expose-Headers list is only emitted
    // for allowlisted browser origins (terminalfeed.io, tensorfeed.ai).
    res = await fetch(url, { method: 'GET', headers: { Origin: BASE_URL } });
  } catch (e) {
    fail(path + ' GET network', e.message);
    return;
  }
  if (res.status !== 402) {
    fail(path + ' expected 402, got ' + res.status);
    return;
  }
  const headerB64 = res.headers.get('PAYMENT-REQUIRED');
  if (!headerB64) {
    fail(path + ' missing PAYMENT-REQUIRED header');
    return;
  }
  const wwwAuth = res.headers.get('WWW-Authenticate');
  if (!wwwAuth) {
    fail(path + ' missing WWW-Authenticate header');
    return;
  }
  if (wwwAuth.indexOf(headerB64) === -1) {
    fail(path + ' WWW-Authenticate does not echo PAYMENT-REQUIRED');
    return;
  }
  const exposes = res.headers.get('Access-Control-Expose-Headers') || '';
  if (exposes.indexOf('PAYMENT-REQUIRED') === -1) {
    fail(path + ' Access-Control-Expose-Headers missing PAYMENT-REQUIRED');
    return;
  }

  let canonical;
  try {
    canonical = JSON.parse(b64decode(headerB64));
  } catch (e) {
    fail(path + ' PAYMENT-REQUIRED is not valid base64-JSON', e.message);
    return;
  }
  if (canonical.x402Version !== 2) {
    fail(path + ' canonical.x402Version != 2 (got ' + canonical.x402Version + ')');
    return;
  }
  if (!Array.isArray(canonical.accepts) || !canonical.accepts.length) {
    fail(path + ' canonical.accepts missing');
    return;
  }
  if (canonical.accepts[0].network !== 'base') {
    fail(path + ' accepts[0].network !== "base" (got ' + canonical.accepts[0].network + ')');
    return;
  }
  const bazaar = canonical.extensions && canonical.extensions.bazaar;
  if (!bazaar) {
    fail(path + ' canonical.extensions.bazaar missing');
    return;
  }

  // Body must match header (Section 1: spread canonical into body).
  let body;
  try {
    body = await res.json();
  } catch (e) {
    fail(path + ' body is not JSON', e.message);
    return;
  }
  if (body.x402Version !== 2) {
    fail(path + ' body.x402Version !== 2');
    return;
  }
  if (body.accepts && body.accepts[0] && body.accepts[0].network !== 'base') {
    fail(path + ' body.accepts[0].network !== "base"');
    return;
  }

  // Validate the bazaar extension against its own schema. CDP runs AJV
  // 2020-12 server-side; a mismatch silently drops the endpoint from the
  // catalog. The local registry's schema is the source of truth.
  const localBazaar = config.extension.bazaar;
  let validate;
  try {
    validate = ajv.compile(localBazaar.schema);
  } catch (e) {
    fail(path + ' local schema failed to compile', e.message);
    return;
  }
  if (!validate(bazaar.info)) {
    fail(path + ' deployed bazaar.info does not satisfy local schema', validate.errors);
    return;
  }
  pass(path);
}

async function checkSettle(path) {
  if (!X_PAYMENT_RAW) {
    fail(path + ' --settle requires --x-payment=<base64>');
    return;
  }
  const url = BASE_URL + path;
  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { 'X-PAYMENT': X_PAYMENT_RAW },
    });
  } catch (e) {
    fail(path + ' settle network', e.message);
    return;
  }
  if (res.status === 402) {
    fail(path + ' settle returned 402 (verify rejected the X-PAYMENT)');
    return;
  }
  if (res.status !== 200) {
    fail(path + ' settle returned ' + res.status);
    return;
  }
  const paymentResponse = res.headers.get('PAYMENT-RESPONSE');
  if (!paymentResponse) {
    fail(path + ' missing PAYMENT-RESPONSE header on successful settle');
    return;
  }
  pass(path + ' settle (check `wrangler tail` for cdp_settle.bazaar_processing)');
}

console.log('Bazaar pilot smoke test against ' + BASE_URL + '\n');

const pilots = listPilots();
for (const { path, config } of pilots) {
  await checkPilot402(path, config);
}

if (DO_SETTLE) {
  console.log('\nSettle path (live X-PAYMENT submission)');
  for (const { path } of pilots) {
    await checkSettle(path);
  }
}

if (failed > 0) {
  console.error('\n' + failed + ' check(s) failed');
  process.exit(1);
}
console.log('\nAll smoke checks passed');
