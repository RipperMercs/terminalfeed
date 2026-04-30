// Generate a fresh Ed25519 keypair for the TerminalFeed AFTA receipt rail.
//
// Run from the project root: node worker-additions/scripts/generate-receipt-key.mjs
//
// What it does:
//   1. Mints a fresh Ed25519 keypair (via Node webcrypto, same as Workers runtime).
//   2. Writes the PUBLIC JWK to public/.well-known/terminalfeed-receipt-key.json.
//   3. Prints the PRIVATE JWK on stdout so you can paste it into wrangler.
//
// After running, finish bootstrap with:
//   cd worker-additions
//   npx wrangler secret put RECEIPT_PRIVATE_KEY_JWK    (paste the printed private)
//   cd ..
//   git add public/.well-known/terminalfeed-receipt-key.json
//   git commit -m "feat(afta): provision TerminalFeed receipt signing key"
//   git push
//
// Rotation: re-run this script, update the secret, push the new public key.
// Phase 1 ships single-key only.
//
// Each AFTA adopter mints its own keypair. Never share private keys across
// sister sites; trust is federated via the open standard, not via shared
// secrets.

import { webcrypto } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
  { name: 'Ed25519' },
  true,
  ['sign', 'verify'],
);

const pubJwk = await webcrypto.subtle.exportKey('jwk', publicKey);
const privJwk = await webcrypto.subtle.exportKey('jwk', privateKey);

// Stable kid (key id): first 16 hex chars of SHA-256(public x).
const xBytes = Buffer.from(pubJwk.x.replace(/-/g, '+').replace(/_/g, '/') + '==', 'base64');
const digest = await webcrypto.subtle.digest('SHA-256', xBytes);
const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
const kid = hex.slice(0, 16);

const publicEnriched = {
  ...pubJwk,
  kid,
  use: 'sig',
  alg: 'EdDSA',
  verify_doc: 'https://terminalfeed.io/agent-fair-trade#receipts',
};
const privateEnriched = {
  ...privJwk,
  kid,
  use: 'sig',
  alg: 'EdDSA',
};

// Write the public key file so the user does not need to edit JSON manually.
const publicKeyPath = resolve(process.cwd(), 'public', '.well-known', 'terminalfeed-receipt-key.json');
mkdirSync(dirname(publicKeyPath), { recursive: true });
writeFileSync(publicKeyPath, JSON.stringify(publicEnriched, null, 2) + '\n', 'utf8');

console.log('');
console.log('Public key written to:');
console.log('  ' + publicKeyPath);
console.log('');
console.log('Key id (kid): ' + kid);
console.log('');
console.log('=== PRIVATE JWK (copy the line below, paste into wrangler) ===');
console.log('');
console.log(JSON.stringify(privateEnriched));
console.log('');
console.log('Next steps:');
console.log('  cd worker-additions');
console.log('  npx wrangler secret put RECEIPT_PRIVATE_KEY_JWK   (paste the line above)');
console.log('  cd ..');
console.log('  git add public/.well-known/terminalfeed-receipt-key.json');
console.log('  git commit -m "feat(afta): provision TerminalFeed receipt signing key"');
console.log('  git push');
console.log('');
