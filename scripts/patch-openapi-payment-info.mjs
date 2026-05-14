#!/usr/bin/env node
// Tags every premium operation in public/openapi.json with
// `x-payment-required: true` and `x-payment-info` in the x402scan canonical
// structured shape. Pay-skills (Solana Foundation) and x402scan use these
// extensions to detect paid endpoints; the @agentcash/discovery validator
// flags the legacy flat `{ pricingMode, price }` shape as L2_PAYMENT_INFO_LEGACY,
// so we force-overwrite rather than skip, ensuring the legacy shape can't
// leak back in.
//
// Idempotent: rerunning with no changes produces no diff. Run after every
// pricing change to keep OpenAPI in sync with /.well-known/x402.json.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OPENAPI_PATH = resolve(__dirname, '..', 'public', 'openapi.json');

const PREMIUM_PATH_PREFIX = '/api/pro/';
const USD_PER_CREDIT = 0.02;

function structuredPaymentInfo(usdAmount) {
  // Canonical shape per Merit-Systems/x402scan docs/DISCOVERY.md. NOT the
  // legacy flat `{ pricingMode, price }` form. amount is a string-formatted
  // USD value with 2 decimals; mode is 'fixed' until tiered pricing exists.
  return {
    protocols: [{ x402: {} }],
    price: {
      mode: 'fixed',
      currency: 'USD',
      amount: usdAmount.toFixed(2),
    },
  };
}

function patchOperation(operation) {
  if (!operation || typeof operation !== 'object') return false;
  const credits = typeof operation['x-pricing-credits'] === 'number'
    ? operation['x-pricing-credits']
    : 1;

  // Management / control-plane operations (x-pricing-credits === 0) like
  // /api/pro/subscribe and /api/pro/subscriptions are bearer-gated but don't
  // charge per call. Tagging them x-payment-required: true at amount $0.00
  // is incoherent for x402scan's structured shape (which models per-call
  // price), so we explicitly strip any stale tags and skip them.
  if (credits === 0) {
    let stripped = false;
    if ('x-payment-required' in operation) {
      delete operation['x-payment-required'];
      stripped = true;
    }
    if ('x-payment-info' in operation) {
      delete operation['x-payment-info'];
      stripped = true;
    }
    return stripped;
  }

  const usd = credits * USD_PER_CREDIT;
  const targetInfo = structuredPaymentInfo(usd);

  let changed = false;
  if (operation['x-payment-required'] !== true) {
    operation['x-payment-required'] = true;
    changed = true;
  }
  const current = operation['x-payment-info'];
  const currentSerialized = current ? JSON.stringify(current) : '';
  const targetSerialized = JSON.stringify(targetInfo);
  if (currentSerialized !== targetSerialized) {
    operation['x-payment-info'] = targetInfo;
    changed = true;
  }
  return changed;
}

async function main() {
  const raw = await readFile(OPENAPI_PATH, 'utf8');
  const spec = JSON.parse(raw);
  if (!spec.paths || typeof spec.paths !== 'object') {
    console.error('No paths object in', OPENAPI_PATH);
    process.exit(1);
  }

  const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
  let patched = 0;
  let visited = 0;
  for (const [path, item] of Object.entries(spec.paths)) {
    if (!path.startsWith(PREMIUM_PATH_PREFIX)) continue;
    if (!item || typeof item !== 'object') continue;
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      visited += 1;
      if (patchOperation(op)) patched += 1;
    }
  }

  // Preserve final newline. Use 2-space indent to match existing file.
  const next = JSON.stringify(spec, null, 2) + '\n';
  if (next === raw) {
    console.log('OpenAPI payment-info already up to date (' + visited + ' premium operations checked).');
    return;
  }
  await writeFile(OPENAPI_PATH, next, 'utf8');
  console.log('Patched ' + patched + ' of ' + visited + ' premium operations in ' + OPENAPI_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
