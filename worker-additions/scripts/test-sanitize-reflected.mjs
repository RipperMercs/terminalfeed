#!/usr/bin/env node
// Unit test for sanitizeReflectedValue, the narrow output-hardening helper for
// caller-supplied identifiers echoed back into a response message. Confirms
// markup is stripped, valid names pass through untouched, oversized values are
// length-capped with an ellipsis, and non-strings collapse to ''.
//
// Run: node worker-additions/scripts/test-sanitize-reflected.mjs

import { sanitizeReflectedValue } from '../sanitize-reflected.js';

let failed = 0;
function pass(name) { console.log('  ok  ' + name); }
function fail(name, detail) { failed += 1; console.error('  FAIL ' + name + ': ' + detail); }

function assertEqual(name, actual, expected) {
  if (actual === expected) {
    pass(name);
  } else {
    fail(name, 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

console.log('sanitizeReflectedValue');

// Strips angle brackets so echoed markup cannot survive verbatim.
assertEqual(
  'strips angle brackets from a script payload',
  sanitizeReflectedValue('<script>alert(1)</script>'),
  'scriptalert(1)/script'
);

// A normal identifier passes through unchanged.
assertEqual('leaves a plain name unchanged', sanitizeReflectedValue('anthropic'), 'anthropic');

// A valid multi-word NWS event name passes through unchanged.
assertEqual('leaves a valid event name unchanged', sanitizeReflectedValue('Tornado Warning'), 'Tornado Warning');

// A 500-char input is capped to exactly 120 chars ending in an ellipsis.
var long = 'a'.repeat(500);
var capped = sanitizeReflectedValue(long);
assertEqual('caps a 500-char input to length 120', capped.length, 120);
assertEqual('capped output ends in an ellipsis', capped.slice(-1), '…');
assertEqual('capped output is 119 chars plus the ellipsis', capped, 'a'.repeat(119) + '…');

// A value at the 120 boundary is returned untouched (no ellipsis).
var exact = 'b'.repeat(120);
assertEqual('leaves a 120-char input untouched', sanitizeReflectedValue(exact), exact);

// Non-string inputs collapse to ''.
assertEqual('returns empty string for null', sanitizeReflectedValue(null), '');
assertEqual('returns empty string for undefined', sanitizeReflectedValue(undefined), '');
assertEqual('returns empty string for a number', sanitizeReflectedValue(12345), '');
assertEqual('returns empty string for an object', sanitizeReflectedValue({ toString: function () { return '<x>'; } }), '');

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll tests passed');
