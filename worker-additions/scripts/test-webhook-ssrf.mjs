// Regression test for the webhook callback-URL SSRF guard.
//
// Extracts the real _parseFlexibleIPv4 / _ipv4OctetsArePrivate /
// _isPrivateOrLocalHostname functions straight out of worker.js (so the test
// tracks the deployed code, not a copy) and asserts that the documented SSRF
// bypasses are blocked while legitimate public webhook hosts are allowed.
//
// Run: node scripts/test-webhook-ssrf.mjs   (from worker-additions/)
// Propagated from the TensorFeed money-path audit, 2026-06-04.

import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../worker.js', import.meta.url), 'utf8');
const start = src.indexOf('function _parseFlexibleIPv4');
const end = src.indexOf('function _validateWebhookUrl');
if (start === -1 || end === -1 || end <= start) {
  console.error('FAIL: could not locate the SSRF guard functions in worker.js');
  process.exit(1);
}
const block = src.slice(start, end);
// eslint-disable-next-line no-new-func
const factory = new Function(block + '\nreturn { _isPrivateOrLocalHostname };');
const { _isPrivateOrLocalHostname } = factory();

// hostnames that MUST be treated as private/local (blocked at registration)
const BLOCK = [
  'localhost', 'sub.localhost',
  '127.0.0.1', '127.1', '0.0.0.0',
  '2130706433',        // decimal 127.0.0.1
  '0x7f000001',        // hex 127.0.0.1
  '017700000001',      // octal 127.0.0.1
  '0x7f.0.0.1',        // dotted-hex 127.0.0.1
  '10.0.0.1', '0x0a000001', // 10/8 in decimal-dotted + hex
  '172.16.5.4', '172.31.255.1',
  '192.168.1.1',
  '169.254.169.254',   // cloud metadata
  '2852039166',        // decimal 169.254.169.254
  '100.64.0.1',        // CGNAT
  '192.0.0.1',         // IETF protocol block
  '224.0.0.1', '239.1.1.1', '255.255.255.255', // multicast / reserved
  '::1', '[::1]', '::',
  'fe80::1', 'fea0::1', 'febf::1234',
  'fc00::1', 'fd12:3456:789a::1',
  '::ffff:127.0.0.1', '[::ffff:169.254.169.254]',
  'fe80::1%eth0',      // zone id stripped
  'metadata.google.internal',
  'db.internal', 'svc.local', 'host.lan', 'thing.corp', 'x.consul', 'a.home.arpa',
];

// hostnames that MUST be allowed (real public webhook receivers)
const ALLOW = [
  'hooks.example.com', 'api.stripe.com', 'example.com', 'webhook.site',
  'a.b.c.example.com', 'my-app.fly.dev',
  '8.8.8.8', '1.1.1.1', '203.0.113.5',  // public IPv4 literals stay allowed
  '2606:4700:4700::1111',                 // public IPv6 (Cloudflare DNS)
];

let pass = 0, fail = 0;
for (const h of BLOCK) {
  if (_isPrivateOrLocalHostname(h) === true) { pass++; }
  else { fail++; console.error(`FAIL (should BLOCK): ${h}`); }
}
for (const h of ALLOW) {
  if (_isPrivateOrLocalHostname(h) === false) { pass++; }
  else { fail++; console.error(`FAIL (should ALLOW): ${h}`); }
}

console.log(`webhook SSRF guard: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
