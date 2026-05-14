#!/usr/bin/env node
// Validates every Bazaar pilot's `info` block against its `schema` using AJV
// draft 2020-12 — the exact validator CDP runs server-side when indexing.
// A schema/info mismatch results in the endpoint being silently dropped from
// the Bazaar catalog (no `bazaar: processing` on the EXTENSION-RESPONSES
// header), so this test is the only thing that catches drift before deploy.
//
// Run: node worker-additions/scripts/test-bazaar-pilots.mjs

import Ajv2020 from 'ajv/dist/2020.js';
import { listPilots } from '../bazaar-pilots.js';

let failed = 0;
function pass(name) { console.log('  ok  ' + name); }
function fail(name, err) { failed += 1; console.error('  FAIL ' + name + ': ' + (err && (err.message || JSON.stringify(err)) || String(err))); }

const ajv = new Ajv2020({ strict: false, allErrors: true });

console.log('bazaar-pilots draft 2020-12 schema validation\n');

const pilots = listPilots();
if (pilots.length === 0) {
  console.error('no pilots registered (expected at least Wave 0)');
  process.exit(1);
}

for (const { path, config } of pilots) {
  const bazaar = config && config.extension && config.extension.bazaar;
  if (!bazaar) {
    fail(path + ' has no extension.bazaar block');
    continue;
  }
  if (!bazaar.schema) {
    fail(path + ' has no extension.bazaar.schema');
    continue;
  }
  if (!bazaar.info) {
    fail(path + ' has no extension.bazaar.info');
    continue;
  }
  let validate;
  try {
    validate = ajv.compile(bazaar.schema);
  } catch (e) {
    fail(path + ' schema failed to compile: ' + e.message);
    continue;
  }
  const ok = validate(bazaar.info);
  if (!ok) {
    fail(path + ' info does not satisfy schema', validate.errors);
    continue;
  }
  pass(path);
}

if (failed > 0) {
  console.error('\n' + failed + ' pilot(s) failed validation');
  process.exit(1);
}
console.log('\nAll pilots passed AJV draft 2020-12 validation (' + pilots.length + ' total)');
