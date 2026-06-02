#!/usr/bin/env node
// Drift guard for the premium catalog. Reads worker.js as TEXT (no import, no
// network) and asserts the published prices can never drift from what settles:
//
//   1. Every handlePremium(... '/api/pro/x', N ...) cost arg equals
//      PRO_ENDPOINT_CREDITS[x]  (handler charge == source-of-truth price).
//   2. Every PRO_ENDPOINT_CREDITS key has a real handlePremium handler
//      (no phantom priced rows).
//   3. Every handlePremium /api/pro/* path is priced in PRO_ENDPOINT_CREDITS
//      (no unpriced handler).
//   4. Every priced endpoint has a PRO_CATALOG_META row (catalog covers it).
//   5. The catalog metadata block holds no em-dash, en-dash, or double-hyphen.
//
// Exit 1 on any violation. Run before any premium-pricing deploy:
//   node worker-additions/scripts/verify-pro-catalog.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER = path.join(__dirname, '..', 'worker.js');
const src = readFileSync(WORKER, 'utf8');

const fail = [];

function block(name) {
  const start = src.indexOf('var ' + name + ' = {');
  if (start === -1) { fail.push(`Could not find ${name} block`); return ''; }
  // Find the matching close by scanning braces from the first '{'.
  const open = src.indexOf('{', start);
  let depth = 0, i = open;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(open, i + 1);
}

// 1. Parse PRO_ENDPOINT_CREDITS { '/api/pro/x': N, ... }
const creditsBlock = block('PRO_ENDPOINT_CREDITS');
const priceMap = {};
for (const m of creditsBlock.matchAll(/'(\/api\/pro\/[a-z/-]+)':\s*(\d+)/g)) {
  priceMap[m[1]] = Number(m[2]);
}
if (Object.keys(priceMap).length === 0) fail.push('PRO_ENDPOINT_CREDITS parsed empty');

// 2. Parse handlePremium cost args.
const handlerCost = {};
for (const m of src.matchAll(/handlePremium\(request,\s*env,\s*url,\s*'(\/api\/pro\/[a-z/-]+)',\s*(\d+)/g)) {
  handlerCost[m[1]] = Number(m[2]);
}
if (Object.keys(handlerCost).length === 0) fail.push('No handlePremium cost args parsed');

// 3. Parse PRO_CATALOG_META keys.
const metaBlock = block('PRO_CATALOG_META');
const catalogKeys = new Set();
for (const m of metaBlock.matchAll(/'(\/api\/pro\/[a-z/-]+)':\s*\{/g)) catalogKeys.add(m[1]);

// --- Assertions ---
for (const [p, cost] of Object.entries(handlerCost)) {
  if (!(p in priceMap)) fail.push(`handler ${p} (charges ${cost}) is not in PRO_ENDPOINT_CREDITS`);
  else if (priceMap[p] !== cost) fail.push(`PRICE DRIFT ${p}: handler charges ${cost}, PRO_ENDPOINT_CREDITS says ${priceMap[p]}`);
}
for (const p of Object.keys(priceMap)) {
  if (!(p in handlerCost)) fail.push(`priced ${p} has no handlePremium handler (phantom row)`);
  if (!catalogKeys.has(p)) fail.push(`priced ${p} has no PRO_CATALOG_META row`);
}
for (const p of catalogKeys) {
  if (!(p in priceMap)) fail.push(`PRO_CATALOG_META row ${p} is not priced in PRO_ENDPOINT_CREDITS`);
}

// 5. Banned punctuation in the catalog metadata block.
const banned = [];
for (let i = 0; i < metaBlock.length; i++) {
  const c = metaBlock.charCodeAt(i);
  if (c === 0x2014) banned.push('em-dash');
  else if (c === 0x2013) banned.push('en-dash');
}
if (metaBlock.includes('--')) banned.push('double-hyphen');
if (banned.length) fail.push(`PRO_CATALOG_META contains banned punctuation: ${[...new Set(banned)].join(', ')}`);

// --- Report ---
if (fail.length) {
  console.error('FAIL: premium catalog drift detected');
  fail.forEach((f) => console.error('  - ' + f));
  process.exit(1);
}
console.log(`OK: ${Object.keys(priceMap).length} premium endpoints, handler costs == catalog == source-of-truth, no banned punctuation.`);
