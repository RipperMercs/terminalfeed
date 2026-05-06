// Adds FAQPage + HowTo JSON-LD to top tool pages for richer SEO surface.
// Idempotent: skips files that already have FAQPage schema.
//
// Each entry has:
//   slug:    the tool path (e.g. 'json' for /tools/json.html)
//   name:    display name used in HowTo
//   url:     canonical URL
//   faqs:    array of {q, a}
//   howTo:   { name, description, steps: [{name, text}] }

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = path.join(__dirname, '../public/tools');

const TOOLS = [
  {
    slug: 'json', name: 'JSON Formatter', url: 'https://terminalfeed.io/tools/json',
    faqs: [
      { q: 'What does a JSON formatter do?', a: 'It takes raw or minified JSON text and reformats it with consistent indentation, line breaks, and key alignment so it is readable. It also validates the JSON and reports the exact line and column of any syntax error.' },
      { q: 'Is my JSON sent to a server?', a: 'No. The TerminalFeed JSON formatter runs entirely in your browser. The data never leaves your machine. You can verify by checking your browser\'s network tab while using the tool.' },
      { q: 'How do I minify JSON instead of formatting it?', a: 'Toggle the minify option in the tool settings. Minified JSON removes all whitespace and is the standard format for API responses and storage.' },
      { q: 'What if my JSON is invalid?', a: 'The formatter will show the exact location of the error (line and column) and describe the syntax issue. Common causes are trailing commas, unquoted keys, or unmatched brackets.' },
      { q: 'Can it handle very large JSON files?', a: 'Yes, up to several megabytes in modern browsers. Extremely large files may slow down rendering; for multi-gigabyte JSON, use a streaming parser like jq or a server-side tool.' },
    ],
    howTo: {
      name: 'How to format JSON online',
      description: 'Quickly format and validate JSON in your browser without sending data to any server.',
      steps: [
        { name: 'Paste your JSON', text: 'Paste raw or minified JSON into the input area.' },
        { name: 'Format', text: 'The tool automatically formats the JSON with consistent indentation. Toggle minify to compress instead.' },
        { name: 'Inspect errors', text: 'If the JSON is invalid, the tool highlights the exact line and column of the syntax error.' },
        { name: 'Copy or download', text: 'Use the Copy button to grab the formatted result, or Download to save it to a .json file.' },
      ],
    },
  },
  {
    slug: 'jwt', name: 'JWT Decoder', url: 'https://terminalfeed.io/tools/jwt',
    faqs: [
      { q: 'What is a JWT?', a: 'A JSON Web Token is a compact, URL-safe means of representing claims between two parties. It has three parts: a header, a payload, and a signature, separated by dots and base64url-encoded.' },
      { q: 'Does this decoder verify the signature?', a: 'The decoder shows the algorithm and signature but does not verify the signature against a key. Verification requires the signing key, which you should never paste into a public tool. Use a server-side library for verification.' },
      { q: 'Is my token sent to a server?', a: 'No. JWT decoding happens entirely in your browser. The token never leaves your machine. This matters because JWTs often contain sensitive session data.' },
      { q: 'How do I check the expiration date of a JWT?', a: 'After decoding, look at the payload for the exp claim. It is a Unix timestamp in seconds. The tool also shows a human-readable expiry time.' },
      { q: 'Why is my JWT marked invalid?', a: 'Common causes: the token is missing a part (it should have three dot-separated sections), the base64url encoding is corrupted, or the payload is not valid JSON. The tool indicates which check failed.' },
    ],
    howTo: {
      name: 'How to decode a JWT online',
      description: 'Inspect the contents of a JSON Web Token in your browser without server roundtrips.',
      steps: [
        { name: 'Paste the JWT', text: 'Paste the full token (three dot-separated parts) into the input area.' },
        { name: 'Inspect the header', text: 'The header shows the signing algorithm (alg) and token type (typ).' },
        { name: 'Inspect the payload', text: 'The payload contains the claims: subject (sub), issuer (iss), expiry (exp), audience (aud), and any custom fields.' },
        { name: 'Check expiry', text: 'The tool converts the exp Unix timestamp to a human-readable date so you can confirm the token is still valid.' },
      ],
    },
  },
  {
    slug: 'base64', name: 'Base64 Encoder/Decoder', url: 'https://terminalfeed.io/tools/base64',
    faqs: [
      { q: 'What is Base64 encoding?', a: 'Base64 is a way to encode binary data as ASCII text using 64 printable characters (A-Z, a-z, 0-9, +, /, plus = for padding). It is used to embed binary in JSON, email attachments, data URIs, and HTTP headers.' },
      { q: 'Does Base64 encrypt my data?', a: 'No. Base64 is not encryption; it is just a text encoding. Anyone can decode it back to the original. For confidentiality, use real encryption (AES, ChaCha20, etc.).' },
      { q: 'What is the difference between Base64 and Base64url?', a: 'Base64url replaces + with - and / with _ so the output is safe to use in URLs and filenames without further encoding. JWTs use Base64url. Most other contexts use standard Base64.' },
      { q: 'Why does my Base64 string have = at the end?', a: 'The = characters are padding to make the encoded length a multiple of 4. Some Base64 variants strip padding; both forms are valid.' },
      { q: 'Is my data sent anywhere?', a: 'No. Base64 encoding and decoding happen entirely in your browser. Inputs and outputs never leave your machine.' },
    ],
    howTo: {
      name: 'How to encode and decode Base64',
      description: 'Convert text or binary data to and from Base64 representation in your browser.',
      steps: [
        { name: 'Choose direction', text: 'Pick Encode (text to Base64) or Decode (Base64 to text) using the toggle.' },
        { name: 'Paste your input', text: 'Paste plain text or a Base64 string into the input area.' },
        { name: 'Read the output', text: 'The tool computes the encoded or decoded result instantly as you type.' },
        { name: 'Copy the result', text: 'Click Copy to grab the output for use in your code, JSON payload, or HTTP header.' },
      ],
    },
  },
  {
    slug: 'regex', name: 'Regex Tester', url: 'https://terminalfeed.io/tools/regex',
    faqs: [
      { q: 'What is a regex?', a: 'A regular expression is a pattern that describes a set of strings. Regex is used for searching, validating, and extracting data from text. The TerminalFeed regex tester uses JavaScript regex syntax.' },
      { q: 'What flags does the tester support?', a: 'The standard JavaScript flags: g (global), i (case-insensitive), m (multiline), s (dotall), u (unicode), and y (sticky). Toggle each flag in the tool UI.' },
      { q: 'Why is my regex not matching what I expect?', a: 'Common causes: forgetting to escape special characters (. should be \\. for a literal dot), using greedy quantifiers when you want lazy ones (.+ vs .+?), or missing the global flag on multi-match patterns.' },
      { q: 'Can I see captured groups?', a: 'Yes. Each match shows the full match plus any capture groups defined with parentheses. Named groups (?<name>...) are also displayed by name.' },
      { q: 'Does the tester run my regex on a remote server?', a: 'No. Regex execution happens in your browser using the native JavaScript engine. Inputs and patterns never leave your machine.' },
    ],
    howTo: {
      name: 'How to test a regular expression',
      description: 'Test, debug, and visualize regex patterns against test text with live highlighting and capture group inspection.',
      steps: [
        { name: 'Enter your pattern', text: 'Paste or type your regex into the pattern field. Toggle flags (g, i, m, s, u, y) as needed.' },
        { name: 'Add test text', text: 'Paste sample text into the test area. Matches highlight in real-time as you edit either field.' },
        { name: 'Inspect matches', text: 'The match panel lists each match with its start index, length, and captured groups.' },
        { name: 'Iterate', text: 'Refine your pattern based on which matches you got and which you missed. Use the cheat sheet for syntax reference.' },
      ],
    },
  },
  {
    slug: 'uuid', name: 'UUID Generator', url: 'https://terminalfeed.io/tools/uuid',
    faqs: [
      { q: 'What is a UUID?', a: 'A UUID (Universally Unique Identifier) is a 128-bit value designed so that any two independently generated UUIDs are essentially guaranteed to differ. UUIDs are used as primary keys, distributed identifiers, and any context where centralized ID assignment is impractical.' },
      { q: 'What is the difference between UUID v4 and v7?', a: 'v4 is fully random (no time component). v7 includes a Unix timestamp prefix, which makes UUIDs sortable by creation time, which is desirable for database indexes. v7 is the modern recommendation for most use cases.' },
      { q: 'Are these UUIDs cryptographically secure?', a: 'Yes. The TerminalFeed UUID generator uses the Web Crypto API (crypto.getRandomValues), the same source browsers use for TLS key generation. Output is unpredictable and unguessable.' },
      { q: 'Can I generate many UUIDs at once?', a: 'Yes. The bulk generator produces up to several thousand UUIDs and supports CSV, newline, or JSON array output formats.' },
      { q: 'How likely is a UUID collision?', a: 'For UUID v4, collision probability is essentially zero in practice. You would need to generate billions of UUIDs before having a meaningful chance of any two matching.' },
    ],
    howTo: {
      name: 'How to generate a UUID',
      description: 'Generate cryptographically secure UUIDs (v1, v4, v7) for primary keys and distributed identifiers.',
      steps: [
        { name: 'Pick a version', text: 'Select v4 for fully random, v7 for time-sortable, or v1 for legacy MAC-address-based UUIDs.' },
        { name: 'Generate', text: 'Click Generate. The tool produces a UUID in canonical 8-4-4-4-12 format using cryptographically secure randomness.' },
        { name: 'Bulk mode', text: 'For multiple UUIDs at once, switch to bulk mode and pick how many (up to several thousand).' },
        { name: 'Copy or export', text: 'Copy a single UUID or download bulk results as CSV, plain text, or a JSON array.' },
      ],
    },
  },
  {
    slug: 'password', name: 'Password Generator', url: 'https://terminalfeed.io/tools/password',
    faqs: [
      { q: 'What makes a password strong?', a: 'Length matters more than complexity. A 20-character random password from a 95-symbol pool has roughly 131 bits of entropy and is effectively unbreakable. Reuse across sites is the bigger risk than any single password\'s strength.' },
      { q: 'Is the password sent to a server?', a: 'No. The password generator uses crypto.getRandomValues() in your browser. The generated password never leaves your machine.' },
      { q: 'Should I use special characters?', a: 'Yes if the site accepts them; they meaningfully expand the search space. If you can not use specials, just use a longer password to compensate.' },
      { q: 'What is a password manager and should I use one?', a: 'A password manager stores credentials in an encrypted vault unlocked by a single master password. Bitwarden, 1Password, KeePass, and others let you generate and reuse unique passwords across all sites without memorizing any of them.' },
      { q: 'How does the entropy meter work?', a: 'Entropy = log2(charset_size) * length. The meter computes this from your selected character classes and length and converts to bits. Above 80 bits is strong; above 100 is very strong.' },
    ],
    howTo: {
      name: 'How to generate a strong password',
      description: 'Generate a cryptographically secure random password with adjustable length and character classes.',
      steps: [
        { name: 'Choose length', text: 'Set the length slider. 16 characters is a reasonable minimum for sensitive accounts; 20+ for high-value targets.' },
        { name: 'Pick character classes', text: 'Toggle uppercase, lowercase, numbers, and symbols. More classes equals more entropy per character.' },
        { name: 'Generate', text: 'The tool produces a random password using cryptographically secure randomness. The entropy meter shows the strength in bits.' },
        { name: 'Copy and save', text: 'Copy the password directly to your password manager. Do not save to a clipboard manager or paste in chat.' },
      ],
    },
  },
  {
    slug: 'hash', name: 'Hash Generator', url: 'https://terminalfeed.io/tools/hash',
    faqs: [
      { q: 'What hash algorithms does the tool support?', a: 'MD5, SHA-1, SHA-256, SHA-384, and SHA-512. SHA-256 is the modern default for integrity checks; MD5 and SHA-1 are kept for legacy compatibility but should not be used for security.' },
      { q: 'Is my input sent to a server?', a: 'No. Hashing runs in your browser via the Web Crypto API. The input string and the hash output never leave your machine.' },
      { q: 'Can I reverse a hash to get the original input?', a: 'No. Hashes are one-way functions. For short or common inputs (passwords, dictionary words), an attacker can pre-compute hashes (rainbow tables) and look up matches, but for arbitrary input, hashes are not reversible.' },
      { q: 'Why is my hash different from another tool\'s output?', a: 'Common causes: the other tool added a trailing newline, used a different encoding (UTF-8 vs UTF-16), or hashed a different algorithm. Verify both inputs and the algorithm match exactly.' },
      { q: 'When should I use SHA-256 vs SHA-512?', a: 'SHA-256 is sufficient for most use cases (file integrity, content addressing, signatures). SHA-512 has a larger output and is slightly faster on 64-bit systems but gives only a marginal security benefit for typical use.' },
    ],
    howTo: {
      name: 'How to compute a cryptographic hash',
      description: 'Compute MD5, SHA-1, SHA-256, SHA-384, or SHA-512 of any text in your browser.',
      steps: [
        { name: 'Pick an algorithm', text: 'Choose MD5, SHA-1, SHA-256, SHA-384, or SHA-512. SHA-256 is the safe default.' },
        { name: 'Paste your input', text: 'Type or paste the input text. Hashing happens automatically as you type.' },
        { name: 'Copy the hash', text: 'The hash output appears in hexadecimal. Use the Copy button to grab it for verification scripts or content addressing.' },
        { name: 'Verify a file', text: 'For file integrity checks, compute the hash and compare against the published checksum from the file source.' },
      ],
    },
  },
  {
    slug: 'qr', name: 'QR Code Generator', url: 'https://terminalfeed.io/tools/qr',
    faqs: [
      { q: 'What can I encode in a QR code?', a: 'Any text up to several thousand characters: URLs, plain text, contact cards (vCard), WiFi credentials, calendar events, geographic coordinates. The TerminalFeed QR generator supports all of these formats.' },
      { q: 'What error correction level should I use?', a: 'Higher error correction makes the code readable even when partially obscured but produces a denser code. Use L (7%) for clean digital screens, M (15%) for printed material, Q or H (25-30%) for codes that may be damaged or have a logo overlay.' },
      { q: 'Can I add a logo to my QR code?', a: 'Yes if you use error correction level Q or H, which leave enough redundancy that a small center logo does not break scannability. Test the code with a phone before printing.' },
      { q: 'Is the QR code sent to a server?', a: 'No. QR codes are generated entirely in your browser. The encoded content never leaves your machine.' },
      { q: 'What size should my QR code be when printed?', a: 'A general rule is the QR code should be at least 1/10 the scanning distance. For a poster scanned from 1 meter away, that is a 10cm code. Smaller works on phones held close.' },
    ],
    howTo: {
      name: 'How to generate a QR code',
      description: 'Create a QR code from text, URL, or contact information in your browser, downloadable as PNG or SVG.',
      steps: [
        { name: 'Enter your content', text: 'Paste a URL, type plain text, or use the format selector for vCard, WiFi, or other structured content.' },
        { name: 'Choose error correction', text: 'L for clean digital, M for print, Q/H for damaged or logo-overlaid codes.' },
        { name: 'Customize', text: 'Adjust foreground and background colors, size, and margin. Test contrast with a phone before deploying widely.' },
        { name: 'Download', text: 'Save as PNG for digital use or SVG for scalable print. Both formats are watermark-free.' },
      ],
    },
  },
  {
    slug: 'timestamp', name: 'Timestamp Converter', url: 'https://terminalfeed.io/tools/timestamp',
    faqs: [
      { q: 'What is a Unix timestamp?', a: 'A Unix timestamp is the number of seconds (or milliseconds) since 1970-01-01 00:00:00 UTC. It is the standard way to represent a moment in time across systems independent of timezone or formatting.' },
      { q: 'Is this in seconds or milliseconds?', a: 'The tool auto-detects: 10-digit numbers are treated as seconds, 13-digit as milliseconds. You can also force a unit if your input is unusual.' },
      { q: 'How do I convert a timestamp to my local time?', a: 'The tool shows the timestamp in UTC, your local timezone, and ISO 8601 format. Most APIs return UTC; convert to local only for display.' },
      { q: 'What is ISO 8601?', a: 'ISO 8601 is a standard date-time format like 2026-05-05T14:00:00Z. The Z means UTC; +offset values like +05:30 indicate the local timezone offset. Most modern APIs use ISO 8601 for date fields.' },
      { q: 'How do I get the current timestamp?', a: 'The tool shows the current Unix timestamp at the top, updating once per second. Click it to copy.' },
    ],
    howTo: {
      name: 'How to convert a Unix timestamp',
      description: 'Convert between Unix timestamps (seconds or milliseconds) and human-readable dates in any timezone.',
      steps: [
        { name: 'Paste the timestamp', text: 'Paste a 10-digit (seconds) or 13-digit (milliseconds) Unix timestamp.' },
        { name: 'Read the conversions', text: 'The tool shows UTC, your local timezone, and ISO 8601 representations.' },
        { name: 'Reverse the direction', text: 'Type a human-readable date in any common format and the tool produces the Unix timestamp.' },
        { name: 'Copy the result', text: 'Click any field to copy. Most APIs expect ISO 8601 or seconds-since-epoch.' },
      ],
    },
  },
  {
    slug: 'url', name: 'URL Encoder/Decoder', url: 'https://terminalfeed.io/tools/url',
    faqs: [
      { q: 'What is URL encoding?', a: 'URL encoding (also called percent-encoding) replaces unsafe characters in URLs with %XX sequences. Spaces become %20, ampersands become %26, etc. This makes the URL safe to transmit over HTTP.' },
      { q: 'When do I need to encode a URL?', a: 'Whenever a URL parameter contains special characters: spaces, &, =, #, /, ?, or non-ASCII characters. Most HTTP libraries encode automatically, but if you build URLs by string concatenation, you must encode the parameter values yourself.' },
      { q: 'What is the difference between encodeURI and encodeURIComponent?', a: 'encodeURI preserves URL-structural characters like / and ?, intended for full URLs. encodeURIComponent encodes everything that is not alphanumeric, intended for individual parameter values. Use the second when assembling URLs by hand.' },
      { q: 'Why is my decoded URL still showing percent characters?', a: 'You may have double-encoded the URL. Decode again to get back to the original, or check the source for accidental double encoding.' },
      { q: 'Is my URL sent to a server?', a: 'No. URL encoding and decoding run in your browser. The URL never leaves your machine.' },
    ],
    howTo: {
      name: 'How to URL-encode or decode',
      description: 'Convert between raw text and percent-encoded URL-safe representation in your browser.',
      steps: [
        { name: 'Choose direction', text: 'Pick Encode (text to URL-safe) or Decode (URL-safe to text).' },
        { name: 'Paste your input', text: 'Paste the URL or string. The tool converts as you type.' },
        { name: 'Pick variant', text: 'Choose encodeURIComponent (encodes everything) or encodeURI (preserves URL structure) depending on what you are encoding.' },
        { name: 'Copy the result', text: 'Use the Copy button to grab the encoded or decoded output for use in your HTTP request.' },
      ],
    },
  },
  {
    slug: 'diff', name: 'Diff Checker', url: 'https://terminalfeed.io/tools/diff',
    faqs: [
      { q: 'What is a diff?', a: 'A diff is a representation of the differences between two pieces of text. Lines added, removed, or changed are highlighted, making it easy to spot what changed between two versions.' },
      { q: 'Does the diff tool work for code?', a: 'Yes. The tool highlights line-by-line differences, ignores trailing whitespace if you toggle that option, and works for any text including source code, JSON, YAML, prose, and configuration files.' },
      { q: 'Is my code sent to a server?', a: 'No. Diff computation runs in your browser. Both inputs stay on your machine.' },
      { q: 'Can I diff two files instead of pasting text?', a: 'Yes. Use the Upload button to load files from disk. The contents are read locally; nothing is uploaded to a server.' },
      { q: 'How do I see only the changed lines?', a: 'Toggle "show only diffs" in the tool settings. The unchanged context is hidden, leaving just the additions and removals.' },
    ],
    howTo: {
      name: 'How to compare two pieces of text',
      description: 'Find line-by-line differences between two texts, with additions and removals highlighted.',
      steps: [
        { name: 'Paste original text', text: 'Paste the original or "before" version into the left input area.' },
        { name: 'Paste modified text', text: 'Paste the modified or "after" version into the right input area.' },
        { name: 'Inspect differences', text: 'Lines that were added are highlighted green; removed lines red; changed lines show inline character diffs.' },
        { name: 'Refine view', text: 'Toggle whitespace handling, ignore case, or show only changed lines depending on what matters for your comparison.' },
      ],
    },
  },
  {
    slug: 'cron', name: 'Cron Expression Decoder', url: 'https://terminalfeed.io/tools/cron',
    faqs: [
      { q: 'What is a cron expression?', a: 'A cron expression is a string of five (or six) fields that defines a recurring schedule: minute, hour, day-of-month, month, day-of-week, and optionally seconds. Used by cron daemons, schedulers, and cloud functions.' },
      { q: 'How do I write "every 5 minutes"?', a: 'Use */5 * * * *. The */5 in the minute field means every 5 minutes; the asterisks in other fields mean every value. Most schedulers support this syntax.' },
      { q: 'What is the difference between standard cron and cron with seconds?', a: 'Standard Unix cron uses 5 fields and the smallest unit is one minute. Some schedulers (Quartz, Spring, AWS EventBridge) use 6 fields with seconds as the first field, allowing sub-minute precision.' },
      { q: 'How do I see when a cron expression will next run?', a: 'The decoder shows the next 5-10 trigger times in your local timezone, so you can verify the schedule visually before committing it to a config file.' },
      { q: 'Why does my expression run at unexpected times?', a: 'Common causes: confusing day-of-month with day-of-week, using local time when the scheduler uses UTC, or expecting day-of-month and day-of-week to AND when most schedulers OR them. The decoder makes the actual runs explicit.' },
    ],
    howTo: {
      name: 'How to decode a cron expression',
      description: 'Translate a cron expression into a human-readable schedule and preview the next run times.',
      steps: [
        { name: 'Paste the expression', text: 'Paste a cron expression (5 or 6 fields, space-separated) into the input field.' },
        { name: 'Read the description', text: 'The tool produces a plain-English description like "every 5 minutes" or "at 9:00 AM on weekdays".' },
        { name: 'Preview next runs', text: 'See the next 5-10 trigger times in your local timezone to verify the schedule matches your intent.' },
        { name: 'Refine if needed', text: 'Edit the expression and watch the description and previews update in real-time.' },
      ],
    },
  },
];

function buildFaqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function buildHowToJsonLd(tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: tool.howTo.name,
    description: tool.howTo.description,
    totalTime: 'PT2M',
    supply: [{ '@type': 'HowToSupply', name: 'A modern web browser' }],
    tool: [{ '@type': 'HowToTool', name: tool.name, url: tool.url }],
    step: tool.howTo.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      url: tool.url,
    })),
  };
}

let added = 0;
let skipped = 0;
let missing = 0;

for (const tool of TOOLS) {
  const filePath = path.join(TOOLS_DIR, `${tool.slug}.html`);
  if (!fs.existsSync(filePath)) {
    console.log(`MISSING: ${tool.slug}`);
    missing++;
    continue;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('FAQPage')) {
    skipped++;
    continue;
  }

  const faqJson = JSON.stringify(buildFaqJsonLd(tool.faqs));
  const howToJson = JSON.stringify(buildHowToJsonLd(tool));
  const inject = `<script type="application/ld+json">${faqJson}</script>\n<script type="application/ld+json">${howToJson}</script>\n`;

  // Insert just before the first <style> tag, which is the standard insertion
  // point on tool pages (after existing schema.org blocks, before page CSS).
  const styleIdx = html.indexOf('<style>');
  if (styleIdx === -1) {
    console.log(`NO <style> tag in ${tool.slug}, skipping`);
    skipped++;
    continue;
  }
  html = html.slice(0, styleIdx) + inject + html.slice(styleIdx);
  fs.writeFileSync(filePath, html);
  added++;
}

console.log(`Added schema to ${added} tool pages, skipped ${skipped}, missing ${missing}`);
