// Error-path output hardening for the MCP tool wrapper. When an MCP tool
// callback throws (a fetch helper throwing on a non-OK upstream, a handler
// bug, a timeout), the raw Error.message would otherwise reach the host LLM
// verbatim through the tools/call response. sanitizeErrorText runs that
// message through the SAME class of output scrub applied to tool-result data
// (prompt-injection neutralization + zero-width strip), redacts any known
// secret plus any tf_live_ bearer token that might ride along, and hard-caps
// the length so an upstream wall-of-text cannot flood the agent's context.
//
// This is defense in depth for an AI host, not a web-XSS fix. Valid, ordinary
// error strings ("upstream 503") pass through unchanged.
//
// SYNC NOTE: PROMPT_INJECTION_PATTERNS and the zero-width class below mirror
// _PROMPT_INJECTION_PATTERNS and _ZERO_WIDTH_RE in worker.js (the tool-result
// scrub used by sanitizeForLLM). If you change the pattern set in worker.js,
// mirror it here and bump SANITIZER_VERSION in worker.js. An equivalence check
// against worker.js lives in scripts/test-sanitize-error.mjs.
//
// Tests: node worker-additions/scripts/test-sanitize-error.mjs

// Zero-width / bidi-override characters used to smuggle hidden instructions.
// Built from explicit code points so this source carries no invisible
// characters. Ranges match the _ZERO_WIDTH_RE literal in worker.js:
// U+200B-U+200F, U+202A-U+202E, U+2060-U+2064, U+FEFF.
const _ZERO_WIDTH_RANGES = [[0x200b, 0x200f], [0x202a, 0x202e], [0x2060, 0x2064], [0xfeff, 0xfeff]];
const _ZERO_WIDTH_CLASS = _ZERO_WIDTH_RANGES.map(function (r) {
  return r[0] === r[1]
    ? String.fromCharCode(r[0])
    : String.fromCharCode(r[0]) + '-' + String.fromCharCode(r[1]);
}).join('');
export const ZERO_WIDTH_RE = new RegExp('[' + _ZERO_WIDTH_CLASS + ']', 'g');

// Prompt-injection shapes. Mirror of _PROMPT_INJECTION_PATTERNS in worker.js.
export const PROMPT_INJECTION_PATTERNS = [
  /ignore (all |any |the )?(previous|prior|above|earlier|preceding) (instructions?|prompts?|rules?|messages?|directives?|commands?)/gi,
  /disregard (all |any |the )?(previous|prior|above) (instructions?|prompts?)/gi,
  /system\s*[:>]\s*/gi,
  /assistant\s*[:>]\s*/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /\bnew (instructions?|task|directive)\s*[:>]/gi,
  /you are now (a |an )?[a-z\s]{0,40}(assistant|ai|model|chatbot)/gi,
  /(reveal|print|output|dump|leak|exfiltrate)\s+(your\s+)?(system\s+prompt|instructions|api\s+key|credentials|secrets?|env(ironment)?\s+vars?)/gi,
];

// Neutralize the FORM of an injected instruction and strip hidden characters.
// No length cap here (unlike sanitizeForLLM's 500-char per-field cap); the
// caller applies the error-specific cap below.
function stripInjection(text) {
  if (text === null || text === undefined) return text;
  if (typeof text !== 'string') return text;
  var t = text.replace(ZERO_WIDTH_RE, '');
  for (var i = 0; i < PROMPT_INJECTION_PATTERNS.length; i++) {
    t = t.replace(PROMPT_INJECTION_PATTERNS[i], '[redacted]');
  }
  return t;
}

const MAX_ERROR_CHARS = 4000;

// Scrub a raw Error.message before it is returned to the host LLM.
//   secrets: optional array of secret strings (env values) to redact by exact
//            match. Entries that are non-strings or shorter than 8 chars are
//            ignored, so passing a sparse env bag is safe.
export function sanitizeErrorText(input, secrets = []) {
  if (typeof input !== 'string' || input.length === 0) return input;
  var s = input;
  for (var i = 0; i < secrets.length; i++) {
    var secret = secrets[i];
    if (typeof secret === 'string' && secret.length >= 8) s = s.split(secret).join('[redacted]');
  }
  // TerminalFeed bearer tokens are tf_live_<64-char-hex>; redact any that slip
  // into an error string even when the exact value was not passed in secrets.
  s = s.replace(/tf_live_[A-Za-z0-9_-]{8,}/g, 'tf_live_[redacted]');
  s = stripInjection(s);
  return s.length > MAX_ERROR_CHARS ? s.slice(0, MAX_ERROR_CHARS - 15) + '\n...[truncated]' : s;
}
