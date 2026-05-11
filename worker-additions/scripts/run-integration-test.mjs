#!/usr/bin/env node
// End-to-end integration test wrapper. Portable Node version of the
// PowerShell helper (no execution-policy issues on Windows).
//
// What it does:
//   1. Generates a fresh tf_live_ bearer
//   2. Seeds TF's KV with a CreditsRecord using the exact shape TF's
//      validateOnly() expects (balance / created / last_used / agent_ua /
//      total_purchased), N credits, status active
//   3. Runs worker-additions/scripts/test-premium-integration.mjs against
//      terminalfeed.io with that bearer
//   4. Reads back the post-test balance so you can see how many credits
//      the run consumed (sanity check on the deferred-debit rail)
//   5. Burns the token (deletes the KV key) so the credits don't linger
//
// Usage:
//   node worker-additions/scripts/run-integration-test.mjs
//   node worker-additions/scripts/run-integration-test.mjs --credits 50
//   node worker-additions/scripts/run-integration-test.mjs --keep-token
//   node worker-additions/scripts/run-integration-test.mjs --base https://terminalfeed.io
//
// Prereqs:
//   * C:\projects\tensorfeed\worker must exist with wrangler.toml that
//     binds TENSORFEED_CACHE
//   * Logged in via `npx wrangler login` (account that owns the KV namespace)

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  if (i === -1) return def;
  return args[i + 1] ?? def;
}
function hasFlag(name) {
  return args.includes(name);
}

const credits = parseInt(getArg('--credits', '100'), 10);
const base = getArg('--base', 'https://terminalfeed.io');
const tfWorkerDir = getArg('--tf-dir', 'C:\\projects\\tensorfeed\\worker');
const keepToken = hasFlag('--keep-token');

const color = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
};

function wrangler(wranglerArgs) {
  return spawnSync('npx', ['wrangler', ...wranglerArgs], {
    cwd: tfWorkerDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    shell: true,
  });
}

function fail(msg) {
  console.error(color.red(`\n${msg}`));
  process.exit(1);
}

const token = 'tf_live_' + randomBytes(32).toString('hex');
const nowIso = new Date().toISOString();
const record = JSON.stringify({
  balance: credits,
  created: nowIso,
  last_used: nowIso,
  agent_ua: 'cc-integration-test',
  total_purchased: credits,
});

console.log();
console.log(color.cyan(`Test token:     ${token}`));
console.log(color.cyan(`Seeded credits: ${credits}`));
console.log(color.cyan(`Base URL:       ${base}`));
console.log();

// 1. Seed
console.log(color.yellow(`[1/4] Seeding pay:credits:${token.slice(0, 20)}...`));
const put = wrangler(['kv', 'key', 'put', '--binding=TENSORFEED_CACHE', `pay:credits:${token}`, record, '--remote']);
if (put.status !== 0) {
  console.log(color.gray(put.stdout || ''));
  console.error(color.red(put.stderr || ''));
  fail(`wrangler kv put failed (exit ${put.status})`);
}
console.log(color.gray((put.stdout || '').trim()));

// 2. Read back
console.log();
console.log(color.yellow('[2/4] Reading back to verify seed landed...'));
const getBefore = wrangler(['kv', 'key', 'get', '--binding=TENSORFEED_CACHE', `pay:credits:${token}`, '--remote']);
if (getBefore.status !== 0) {
  console.error(color.red(getBefore.stderr || ''));
  fail('wrangler kv get failed; seed did not land.');
}
console.log(color.gray(`Seed confirmed: ${(getBefore.stdout || '').trim()}`));

// 3. Integration test
console.log();
console.log(color.yellow(`[3/4] Running integration test against ${base}...`));
const testScript = path.join(__dirname, 'test-premium-integration.mjs');
const test = spawnSync(process.execPath, [testScript, token, base], { stdio: 'inherit' });
const testExit = test.status ?? 1;

// 4. Balance check + burn
console.log();
console.log(color.yellow('[4/4] Reading post-test balance...'));
const getAfter = wrangler(['kv', 'key', 'get', '--binding=TENSORFEED_CACHE', `pay:credits:${token}`, '--remote']);
const afterRaw = (getAfter.stdout || '').trim();
console.log(color.gray(`Post-test record: ${afterRaw}`));
try {
  const after = JSON.parse(afterRaw);
  const consumed = credits - after.balance;
  console.log(color.cyan(`Credits consumed: ${consumed} (started ${credits}, ended ${after.balance})`));
} catch {
  console.log(color.yellow('Could not parse balance from output'));
}

if (!keepToken) {
  console.log();
  console.log(color.yellow('Burning test token...'));
  const burn = wrangler(['kv', 'key', 'delete', '--binding=TENSORFEED_CACHE', `pay:credits:${token}`, '--remote']);
  if (burn.status !== 0) {
    console.error(color.red(`Burn failed: ${burn.stderr || ''}`));
    console.error(color.red(`Manually burn with: npx wrangler kv key delete --binding=TENSORFEED_CACHE "pay:credits:${token}" --remote`));
  }
} else {
  console.log();
  console.log(color.yellow('Keeping token (--keep-token). Burn manually with:'));
  console.log(color.gray(`  npx wrangler kv key delete --binding=TENSORFEED_CACHE "pay:credits:${token}" --remote`));
}

process.exit(testExit);
