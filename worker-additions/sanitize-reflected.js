// Narrow output-hardening helper for caller-supplied identifiers that get
// echoed straight back into a tool or response message (for example an ?event=
// filter reflected in data.filters.event, surfaced through the tf_climate_
// weather_alerts MCP tool). The MCP server emits text and JSON to an AI host
// and renders no web page, so this is defense in depth, not an XSS fix: it
// strips angle brackets so echoed markup cannot survive verbatim, and it
// length-caps the echo so a wall-of-text value cannot ride along. Valid inputs
// (plain names like "anthropic" or "Tornado Warning") pass through unchanged.
//
// This runs IN ADDITION to sanitizeForLLM in worker.js. It is intentionally
// tiny and only ever wraps echoed caller identifiers, never the server's own
// catalog names, prices, or dates.
//
// Tests: node worker-additions/scripts/test-sanitize-reflected.mjs

const MAX_REFLECTED_LEN = 120;

export function sanitizeReflectedValue(input) {
  if (typeof input !== 'string') return '';
  const stripped = input.replace(/[<>]/g, '');
  return stripped.length > MAX_REFLECTED_LEN
    ? stripped.slice(0, MAX_REFLECTED_LEN - 1) + '…'
    : stripped;
}
