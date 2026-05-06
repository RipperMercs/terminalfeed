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

  // ===== Round 2: round out coverage on remaining high-volume tools =====
  {
    slug: 'yaml', name: 'YAML / JSON Converter', url: 'https://terminalfeed.io/tools/yaml',
    faqs: [
      { q: 'Why convert between YAML and JSON?', a: 'JSON is the universal API format; YAML is more human-readable and is the standard for Kubernetes manifests, GitHub Actions, Docker Compose, and most modern config files. You often have data in one and need it in the other.' },
      { q: 'Are YAML and JSON exactly equivalent?', a: 'Almost. YAML is a superset of JSON, so any valid JSON is valid YAML. But YAML supports features (anchors, multi-document streams, more datatypes) that JSON does not, so going YAML to JSON can lose information.' },
      { q: 'Why does YAML break with tabs?', a: 'YAML mandates spaces, not tabs, for indentation. Mixing tabs and spaces or using tabs alone is the single most common YAML error. The converter shows the exact line of any indentation problem.' },
      { q: 'Is my data sent to a server?', a: 'No. The conversion runs entirely in your browser. Inputs and outputs never leave your machine.' },
      { q: 'How do I handle multi-document YAML?', a: 'YAML supports multiple documents separated by ---. The converter detects this and produces an array of JSON objects, one per document. Going back, set the multi-doc option to write --- separators.' },
    ],
    howTo: {
      name: 'How to convert YAML to JSON',
      description: 'Convert between YAML and JSON formats in your browser, with validation and indentation control.',
      steps: [
        { name: 'Pick direction', text: 'Choose YAML to JSON or JSON to YAML using the toggle.' },
        { name: 'Paste your input', text: 'Paste the YAML or JSON text into the input area. Conversion happens as you type.' },
        { name: 'Inspect errors', text: 'If parsing fails, the tool highlights the exact line and column of the syntax error.' },
        { name: 'Copy the output', text: 'Use the Copy button to grab the converted format for use in your config or API call.' },
      ],
    },
  },
  {
    slug: 'chmod', name: 'Chmod Calculator', url: 'https://terminalfeed.io/tools/chmod',
    faqs: [
      { q: 'What does chmod 755 mean?', a: 'It sets read+write+execute (7) for the owner, read+execute (5) for the group, and read+execute (5) for everyone else. The numeric form encodes 9 permission bits as 3 octal digits.' },
      { q: 'What is the difference between 755 and 777?', a: '755 lets the owner do anything but only allows read and execute for others. 777 lets anyone do anything, including write, which is almost never what you want for a real file.' },
      { q: 'When should I use chmod +x vs chmod 755?', a: '+x adds execute permission for everyone without changing other bits. 755 sets the full mode in one shot. Use +x when you just want to make a script runnable; use 755 to ensure standard public-readable script permissions.' },
      { q: 'What is the sticky bit and when do I use it?', a: 'The sticky bit (set with chmod 1777 or +t) on a directory lets anyone create files but only the owner can delete or rename them. /tmp uses this. The other special bits are setuid (4) and setgid (2).' },
      { q: 'Are these calculations done locally?', a: 'Yes. The chmod calculator runs entirely in your browser. Permission bit math is a tiny calculation; nothing is sent anywhere.' },
    ],
    howTo: {
      name: 'How to calculate chmod permissions',
      description: 'Compute the numeric (octal) chmod value from owner/group/other read/write/execute checkboxes, or decode an existing chmod value.',
      steps: [
        { name: 'Toggle permission bits', text: 'Check or uncheck Read, Write, Execute for Owner, Group, and Other. The numeric chmod value updates instantly.' },
        { name: 'Or paste a numeric value', text: 'Type a number like 755 or 644 to see what permissions it represents.' },
        { name: 'Copy the command', text: 'The tool generates the full chmod command (e.g. chmod 755 file) ready to paste into your shell.' },
        { name: 'Verify on your system', text: 'After running chmod, check with ls -l to confirm the permission bits match.' },
      ],
    },
  },
  {
    slug: 'color', name: 'Color Converter', url: 'https://terminalfeed.io/tools/color',
    faqs: [
      { q: 'What color formats does the converter support?', a: 'HEX, RGB, RGBA, HSL, HSLA, HSV, OKLCH, and named CSS colors. Paste any of them and get all the others instantly.' },
      { q: 'When should I use HSL vs RGB?', a: 'HSL is easier to reason about for design work because it separates hue, saturation, and lightness. RGB is the device-native format. Most CSS and design tools accept both.' },
      { q: 'What is OKLCH and why is it newer?', a: 'OKLCH is a perceptually-uniform color space added to CSS in 2023. It produces more visually-consistent colors when interpolating gradients and adjusting lightness. Modern design systems are increasingly adopting it.' },
      { q: 'Does the tool work on a server?', a: 'No. All color conversions run in your browser. Inputs and outputs never leave your machine.' },
      { q: 'How do I get a contrast ratio for accessibility?', a: 'Paste two colors and the tool computes the WCAG contrast ratio. AA needs 4.5:1 for body text and 3:1 for large text. AAA needs 7:1 and 4.5:1 respectively.' },
    ],
    howTo: {
      name: 'How to convert between color formats',
      description: 'Convert any color between HEX, RGB, HSL, HSV, OKLCH, and named CSS values.',
      steps: [
        { name: 'Paste your color', text: 'Type or paste any HEX, RGB, HSL, OKLCH, or named CSS color into the input.' },
        { name: 'See all formats', text: 'The tool displays the color in every supported format simultaneously.' },
        { name: 'Pick visually', text: 'Use the visual color picker to drag and click; all formats update in real time.' },
        { name: 'Check contrast', text: 'Pair with another color to see the WCAG contrast ratio for accessibility.' },
      ],
    },
  },
  {
    slug: 'lorem', name: 'Lorem Ipsum Generator', url: 'https://terminalfeed.io/tools/lorem',
    faqs: [
      { q: 'What is Lorem Ipsum?', a: 'Lorem Ipsum is placeholder text that has been used in design and typography since the 1500s. It is loosely based on a Cicero text but scrambled to look like Latin without conveying meaning, so designers can focus on layout instead of reading content.' },
      { q: 'Why use Lorem Ipsum instead of real text?', a: 'Placeholder text keeps reviewers from getting distracted by content. Real copy invites debate about wording; Lorem Ipsum keeps the focus on visual design and layout.' },
      { q: 'How long can I generate?', a: 'You can generate up to several thousand words at once, organized by paragraphs or sentences. The tool also supports starting with the classic "Lorem ipsum dolor sit amet..." opening or starting fresh.' },
      { q: 'Are there alternatives to Lorem Ipsum?', a: 'Yes. Hipster Ipsum, Cupcake Ipsum, Bacon Ipsum, and Hacker Ipsum are themed variants. The tool offers several alternatives so your placeholder text matches the project tone.' },
      { q: 'Is the text generated locally?', a: 'Yes. All Lorem Ipsum is assembled in your browser from a built-in word bank. Nothing is fetched or transmitted.' },
    ],
    howTo: {
      name: 'How to generate Lorem Ipsum text',
      description: 'Generate placeholder Lorem Ipsum text with adjustable length, paragraph count, and themed alternatives.',
      steps: [
        { name: 'Choose length', text: 'Pick number of paragraphs, sentences, or words. Most layouts need 3-5 paragraphs of typical length.' },
        { name: 'Choose variant', text: 'Pick classic Lorem Ipsum or a themed alternative (Hipster, Hacker, Cupcake) to match project tone.' },
        { name: 'Generate', text: 'Click Generate to assemble fresh placeholder text from the built-in word bank.' },
        { name: 'Copy or regenerate', text: 'Copy the result for your design, or click Generate again for a different sample.' },
      ],
    },
  },
  {
    slug: 'html-entity', name: 'HTML Entity Encoder', url: 'https://terminalfeed.io/tools/html-entity',
    faqs: [
      { q: 'What are HTML entities?', a: 'HTML entities are escape sequences for characters that have special meaning in HTML (like &lt; and &gt;) or that are hard to type. They start with & and end with ;. Examples: &amp; for &, &copy; for the copyright symbol.' },
      { q: 'When do I need to encode HTML entities?', a: 'Whenever you display user-supplied text inside HTML, to prevent XSS attacks. Modern frameworks (React, Vue) encode automatically. If you build HTML by string concatenation, you must encode the inserted values yourself.' },
      { q: 'What is the difference between named and numeric entities?', a: 'Named entities are mnemonic (&copy;, &mdash;). Numeric entities use Unicode code points (&#169;, &#x2014;). Both produce the same character. Numeric works for any Unicode character; named is limited to the official list.' },
      { q: 'Does this tool encode every character?', a: 'You can choose: encode just the HTML-special characters (recommended for security) or encode everything non-ASCII (useful for legacy environments). The decoder handles all valid entities regardless.' },
      { q: 'Is my text sent to a server?', a: 'No. Encoding and decoding happen in your browser. Text never leaves your machine.' },
    ],
    howTo: {
      name: 'How to encode HTML entities',
      description: 'Convert text to and from HTML-safe entity-encoded form to prevent rendering and security issues.',
      steps: [
        { name: 'Pick direction', text: 'Choose Encode (text to entities) or Decode (entities to text).' },
        { name: 'Paste your input', text: 'Paste the text or HTML you want to convert.' },
        { name: 'Pick encoding scope', text: 'Encode only HTML-special chars (safer for security) or encode everything non-ASCII.' },
        { name: 'Copy the result', text: 'Use the Copy button to grab the encoded or decoded text for your HTML.' },
      ],
    },
  },
  {
    slug: 'hex', name: 'Hex Converter', url: 'https://terminalfeed.io/tools/hex',
    faqs: [
      { q: 'What is hex?', a: 'Hexadecimal (hex) is a base-16 number system using digits 0-9 and letters A-F. It is widely used in computing because each hex digit corresponds to exactly 4 binary bits, making byte-level data compact and readable.' },
      { q: 'Why convert between hex and decimal?', a: 'Memory addresses, color codes, byte values, and crypto hashes are usually expressed in hex. Calculations and human-friendly display often use decimal. Converting back and forth is a routine debugging task.' },
      { q: 'What is the difference between hex and Base64?', a: 'Both encode binary as text. Hex uses 2 characters per byte (more readable for short data). Base64 uses ~1.33 characters per byte (more compact for longer data). Hex is preferred for hashes and short identifiers; Base64 for embedding binary in JSON or URLs.' },
      { q: 'How do I convert text to hex?', a: 'Pick text-to-hex mode and paste your text. Each character is encoded as its UTF-8 byte sequence in hex. ASCII characters become 2 hex digits each; multibyte characters become more.' },
      { q: 'Is the conversion done in my browser?', a: 'Yes. All hex math runs locally. Inputs and outputs never leave your machine.' },
    ],
    howTo: {
      name: 'How to convert hex to decimal or text',
      description: 'Convert between hexadecimal, decimal, binary, and UTF-8 text representations of any value.',
      steps: [
        { name: 'Pick conversion type', text: 'Choose hex to decimal, decimal to hex, hex to text, or text to hex.' },
        { name: 'Paste your input', text: 'Paste the value to convert. The tool processes as you type.' },
        { name: 'Inspect output', text: 'See the converted value plus binary representation if applicable.' },
        { name: 'Copy the result', text: 'Use the Copy button to grab the output for your code or debugger.' },
      ],
    },
  },
  {
    slug: 'gwei', name: 'Gwei Calculator', url: 'https://terminalfeed.io/tools/gwei',
    faqs: [
      { q: 'What is Gwei?', a: 'Gwei is a denomination of Ether (ETH). 1 ETH = 1,000,000,000 (10^9) Gwei. Gas prices on Ethereum are conventionally quoted in Gwei because typical gas prices are small fractions of an ETH.' },
      { q: 'How does Gwei relate to Wei?', a: '1 Gwei = 1,000,000,000 Wei. Wei is the smallest unit of Ether. The hierarchy: 1 ETH = 10^9 Gwei = 10^18 Wei.' },
      { q: 'How much does my transaction cost in USD?', a: 'Transaction cost in ETH = gas_price (Gwei) * gas_used / 10^9. Multiply by current ETH/USD rate for dollar cost. The calculator does this automatically using a live ETH price feed.' },
      { q: 'What is a typical gas price in Gwei?', a: 'On Ethereum mainnet in 2026, typical gas prices range from 5-50 Gwei depending on network congestion. EIP-1559 introduced base fees that adjust automatically with demand, plus optional priority tips for faster inclusion.' },
      { q: 'Why is my transaction more expensive on L1 vs L2?', a: 'L2 networks (Arbitrum, Optimism, Base) post compressed batches to L1 with a much lower per-transaction cost. A typical L1 transfer might cost $1-10 in gas; the same on L2 costs less than $0.10.' },
    ],
    howTo: {
      name: 'How to calculate gas cost in ETH and USD',
      description: 'Convert between Wei, Gwei, ETH, and USD; compute total transaction cost from gas price and gas used.',
      steps: [
        { name: 'Enter amounts', text: 'Type a value in any unit (Wei, Gwei, ETH). The other units update automatically.' },
        { name: 'Compute transaction cost', text: 'Enter the gas price (Gwei) and gas used (units). The tool computes total cost in ETH and USD.' },
        { name: 'Compare to L2', text: 'L2 networks typically charge 10-100x less. Use the comparison to see the savings for your transaction.' },
        { name: 'Copy the result', text: 'Use the Copy button to grab the cost figure for your records or report.' },
      ],
    },
  },
  {
    slug: 'satoshi', name: 'Satoshi Converter', url: 'https://terminalfeed.io/tools/satoshi',
    faqs: [
      { q: 'What is a Satoshi?', a: 'A Satoshi (or sat) is the smallest unit of Bitcoin. 1 BTC = 100,000,000 sats. The unit is named after Bitcoin\'s pseudonymous creator Satoshi Nakamoto. Lightning payments and microtransactions are typically denominated in sats.' },
      { q: 'How many sats are in a dollar?', a: 'It depends on the BTC price. At a $100,000 BTC price, $1 equals roughly 1,000 sats. The calculator pulls live BTC price and computes the conversion in real time.' },
      { q: 'Why use sats instead of BTC?', a: 'Sats avoid decimal-point confusion when prices are small. "500 sats" is clearer than "0.000005 BTC". As BTC price rises, sat-denominated thinking becomes more practical for everyday amounts.' },
      { q: 'How is this different from Lightning Network sats?', a: 'A Lightning sat is the same as a Bitcoin sat (1/100,000,000 of a BTC). Lightning channels can also handle millisat (msat) precision, which is 1/1000 of a sat, but most Lightning UX rounds to whole sats.' },
      { q: 'Does the tool fetch the BTC price?', a: 'Yes, from the TerminalFeed API. The conversion is computed in your browser; only the price feed is fetched.' },
    ],
    howTo: {
      name: 'How to convert between BTC, sats, and USD',
      description: 'Convert any amount between Bitcoin, Satoshi (sats), millisats, and USD using a live BTC price.',
      steps: [
        { name: 'Type any amount', text: 'Enter a value in BTC, sats, or USD. The other denominations update automatically.' },
        { name: 'Use live BTC price', text: 'The tool fetches the current BTC/USD price so conversions are accurate to the minute.' },
        { name: 'Switch to msats for Lightning', text: 'For sub-sat precision (Lightning channels, micropayments), switch to milli-sat mode.' },
        { name: 'Copy the value', text: 'Click any field to copy the converted amount for use in your wallet or invoice.' },
      ],
    },
  },
  {
    slug: 'markdown', name: 'Markdown Editor', url: 'https://terminalfeed.io/tools/markdown',
    faqs: [
      { q: 'What is Markdown?', a: 'Markdown is a lightweight markup language using plain text characters (* for emphasis, # for headings, [text](url) for links) that converts to HTML. It is the standard for README files, blog posts, and most technical documentation.' },
      { q: 'What flavor of Markdown does this support?', a: 'GitHub Flavored Markdown (GFM): all standard Markdown plus tables, task lists, fenced code blocks, strikethrough, and autolinks. This is the most widely-used variant.' },
      { q: 'Can I see the rendered output?', a: 'Yes. The editor has a side-by-side preview that updates as you type. Toggle to full-screen preview when you want to read your draft as a reader would.' },
      { q: 'Is my text sent to a server?', a: 'No. Markdown rendering happens in your browser using a JavaScript parser. Your text never leaves your machine.' },
      { q: 'How do I export the rendered HTML?', a: 'Use the Export button to download the rendered HTML or copy the HTML markup for use in a CMS, email, or static site.' },
    ],
    howTo: {
      name: 'How to write and preview Markdown',
      description: 'Edit Markdown text with live HTML preview and export options.',
      steps: [
        { name: 'Write or paste Markdown', text: 'Type or paste your Markdown into the left pane. Use # for headings, * for emphasis, [text](url) for links.' },
        { name: 'See live preview', text: 'The right pane renders the HTML in real time. Headings, code blocks, tables, and task lists all render correctly.' },
        { name: 'Toggle full-screen', text: 'Switch to full preview mode to read your draft as published.' },
        { name: 'Export', text: 'Copy the rendered HTML or download as a .html file for use in your CMS, email, or static site.' },
      ],
    },
  },
  {
    slug: 'csv-json', name: 'CSV / JSON Converter', url: 'https://terminalfeed.io/tools/csv-json',
    faqs: [
      { q: 'When do I need to convert between CSV and JSON?', a: 'Spreadsheets and old data feeds use CSV; modern APIs use JSON. Importing CSV into a JSON-based pipeline (or exporting JSON to a CSV for analysts) is a routine task.' },
      { q: 'How does the tool handle quoted CSV fields?', a: 'CSV with quoted fields (containing commas or newlines) is parsed correctly. Embedded quotes use the standard escape ("") format. The tool follows RFC 4180 for parsing.' },
      { q: 'What happens with nested JSON when converting to CSV?', a: 'CSV is flat by nature. The converter offers two strategies: flatten nested keys with dot notation (user.name) or stringify nested values as JSON in a single cell. Pick based on what your spreadsheet expects.' },
      { q: 'Can the tool handle large files?', a: 'Yes, up to several megabytes in modern browsers. For multi-gigabyte files, use a streaming tool like Miller (mlr) or pandas instead.' },
      { q: 'Does my data get uploaded?', a: 'No. Conversion runs entirely in your browser. Your data never leaves your machine.' },
    ],
    howTo: {
      name: 'How to convert CSV to JSON',
      description: 'Convert between CSV and JSON formats, with header detection, nested key handling, and RFC 4180 compliance.',
      steps: [
        { name: 'Pick direction', text: 'Choose CSV to JSON or JSON to CSV.' },
        { name: 'Paste your data', text: 'Paste the CSV or JSON text. The tool detects headers and structure automatically.' },
        { name: 'Configure options', text: 'For CSV to JSON: choose array of objects or array of arrays. For JSON to CSV: pick how to flatten nested fields.' },
        { name: 'Copy or download', text: 'Copy the result for use in your code, or download as .csv or .json.' },
      ],
    },
  },
  {
    slug: 'jsonpath', name: 'JSONPath Tester', url: 'https://terminalfeed.io/tools/jsonpath',
    faqs: [
      { q: 'What is JSONPath?', a: 'JSONPath is a query language for JSON, modeled on XPath for XML. It lets you extract values from a JSON document using a path expression like $.users[*].name.' },
      { q: 'What syntax does the tester support?', a: 'Standard JSONPath: $ for root, . for child access, [n] for index, [*] for wildcard, .. for recursive descent, and filter expressions [?(@.field == "value")]. The tool implements the de-facto IETF draft.' },
      { q: 'When should I use JSONPath vs jq?', a: 'JSONPath is simpler and works well for extraction. jq is more powerful: filtering, transforming, aggregating, and reformatting JSON. Use JSONPath in tools and config that accept it; use jq for command-line scripting.' },
      { q: 'Why is my expression returning unexpected results?', a: 'Common causes: forgetting the $ root, using brackets where dots are needed, escaping issues with quotes inside filters. Test incrementally: start with $ and add path components one at a time.' },
      { q: 'Is the tester local?', a: 'Yes. Both the JSON and the JSONPath query stay in your browser. No remote calls.' },
    ],
    howTo: {
      name: 'How to test a JSONPath expression',
      description: 'Test JSONPath queries against JSON documents with live results, including recursive descent and filter expressions.',
      steps: [
        { name: 'Paste your JSON', text: 'Paste a JSON document into the input area.' },
        { name: 'Write the JSONPath', text: 'Type your query starting with $. Examples: $.users[*].name, $..books[?(@.price < 10)]' },
        { name: 'Inspect results', text: 'The matched values appear in the result panel. The tool indicates how many matches were found.' },
        { name: 'Iterate', text: 'Refine your expression based on what was matched and what was missed.' },
      ],
    },
  },
  {
    slug: 'slugify', name: 'URL Slugifier', url: 'https://terminalfeed.io/tools/slugify',
    faqs: [
      { q: 'What is a slug?', a: 'A slug is the URL-friendly version of a string: lowercase, hyphenated, with special characters and accents stripped. "Hello World!" becomes "hello-world". Slugs are used in URLs, filenames, and database keys.' },
      { q: 'How does the tool handle non-ASCII characters?', a: 'Accented characters are transliterated to their closest ASCII equivalent (é to e, ü to u, ñ to n). Cyrillic, Chinese, and Arabic characters can be transliterated where standard mappings exist; otherwise they are stripped or replaced with placeholders.' },
      { q: 'Why slugify URLs?', a: 'Clean slugs are more readable, more shareable, and slightly better for SEO. They also avoid URL-encoding issues when paths contain spaces or special characters.' },
      { q: 'Can I customize the separator?', a: 'Yes. The default separator is hyphen (-) which is the SEO standard, but you can switch to underscore (_) or other characters. Hyphens are recommended unless you have a specific reason to use something else.' },
      { q: 'Is the conversion done locally?', a: 'Yes. Slug generation runs entirely in your browser. Inputs and outputs never leave your machine.' },
    ],
    howTo: {
      name: 'How to generate a URL slug',
      description: 'Convert any string into a clean, URL-safe slug with options for separator, case, and transliteration.',
      steps: [
        { name: 'Paste your text', text: 'Type or paste a title, name, or any string into the input area.' },
        { name: 'Configure options', text: 'Pick separator (- or _), case (lowercase recommended), and whether to strip stop words.' },
        { name: 'See the slug', text: 'The URL-safe slug appears instantly. Special characters are stripped or transliterated.' },
        { name: 'Copy and use', text: 'Copy the slug for your URL path, filename, or database key.' },
      ],
    },
  },
  {
    slug: 'case', name: 'Case Converter', url: 'https://terminalfeed.io/tools/case',
    faqs: [
      { q: 'What case formats are supported?', a: 'camelCase, PascalCase, snake_case, kebab-case, SCREAMING_SNAKE_CASE, Title Case, Sentence case, lowercase, UPPERCASE, dot.case, path/case. The tool detects the input format and converts to all the others.' },
      { q: 'When do I use camelCase vs snake_case vs kebab-case?', a: 'JavaScript and Java conventions use camelCase (myVariable). Python and Rust use snake_case (my_variable). HTML attributes, CSS classes, and CLI flags use kebab-case (my-variable). Most languages and frameworks have established conventions.' },
      { q: 'How does the tool handle multi-word phrases?', a: 'It tokenizes the input by detecting word boundaries (spaces, underscores, hyphens, case changes), then reformats with the chosen separator. "myAPIVariable" becomes "my_api_variable" or "my-api-variable" correctly.' },
      { q: 'What about acronyms?', a: 'Acronyms are tricky. "HTTPSession" can be HTTPSession (PascalCase) or HttpSession (camelCase) depending on convention. The tool detects acronyms and lets you pick the style; defaults follow the most common conventions for each language.' },
      { q: 'Does conversion happen locally?', a: 'Yes. All case conversion is browser-side. Inputs and outputs never leave your machine.' },
    ],
    howTo: {
      name: 'How to convert between case formats',
      description: 'Convert any string between camelCase, snake_case, kebab-case, PascalCase, and other common formats.',
      steps: [
        { name: 'Paste your text', text: 'Type or paste any string. The tool detects the input format automatically.' },
        { name: 'See all formats', text: 'The output shows your text in every supported case format simultaneously.' },
        { name: 'Pick the format you need', text: 'Click any output to copy that specific case for your code or config.' },
        { name: 'Customize for acronyms', text: 'Toggle acronym handling if your input contains all-caps abbreviations like API or HTTP.' },
      ],
    },
  },
  {
    slug: 'hmac', name: 'HMAC Generator', url: 'https://terminalfeed.io/tools/hmac',
    faqs: [
      { q: 'What is HMAC?', a: 'HMAC (Hash-based Message Authentication Code) combines a hash function with a secret key to produce a tag that proves both authenticity (the message is from someone with the key) and integrity (the message was not modified). Used in API signing, webhook verification, and JWT signing.' },
      { q: 'When should I use HMAC instead of plain hashing?', a: 'Whenever you need to verify a message came from a known sender. Plain hashes prove integrity but not authenticity (anyone can compute them). HMAC adds the secret key, so only parties with the key can produce a valid tag.' },
      { q: 'What hash algorithms work with HMAC?', a: 'Most secure hash functions: SHA-256, SHA-384, SHA-512, SHA-1 (legacy). HMAC-SHA256 is the modern default for API signing, JWT signatures, and AWS request signing.' },
      { q: 'Is my secret key sent to a server?', a: 'No. The TerminalFeed HMAC generator runs entirely in your browser using the Web Crypto API. Your key and message never leave your machine.' },
      { q: 'How long should my HMAC key be?', a: 'For HMAC-SHA256, at least 32 random bytes (256 bits). Longer keys are wasteful (HMAC truncates internally); shorter keys reduce security. Use the password generator to create a cryptographically random secret.' },
    ],
    howTo: {
      name: 'How to generate an HMAC',
      description: 'Compute HMAC-SHA256, HMAC-SHA512, or HMAC-SHA1 for API signing, webhook verification, and JWT generation.',
      steps: [
        { name: 'Paste the message', text: 'Paste the data you want to sign. Be careful with whitespace; HMAC is sensitive to exact byte content.' },
        { name: 'Paste the secret key', text: 'Enter the shared secret. This is computed locally and never transmitted.' },
        { name: 'Pick algorithm', text: 'HMAC-SHA256 is the modern default. Use SHA-512 or SHA-384 if your specification requires.' },
        { name: 'Copy the tag', text: 'The HMAC tag appears in hex (and optionally Base64). Copy and include in your Authorization header or signature field.' },
      ],
    },
  },
  {
    slug: 'port', name: 'Port Reference', url: 'https://terminalfeed.io/tools/port',
    faqs: [
      { q: 'What is a port number?', a: 'A port is a numbered endpoint on a networked device that directs traffic to specific services. HTTP uses port 80, HTTPS 443, SSH 22, etc. Ports range from 0 to 65535; 0-1023 are reserved for well-known services.' },
      { q: 'Which ports are commonly used?', a: 'HTTP (80), HTTPS (443), SSH (22), FTP (21), SMTP (25 or 587), DNS (53), MySQL (3306), PostgreSQL (5432), Redis (6379), MongoDB (27017). The reference covers 100+ standard assignments.' },
      { q: 'What is the difference between TCP and UDP ports?', a: 'TCP and UDP have separate port number spaces. Most services use TCP (HTTP, SSH, databases) for reliability. UDP is used for real-time protocols (DNS, VoIP, video streaming) where occasional packet loss is acceptable in exchange for lower latency.' },
      { q: 'How do I find what is using a port?', a: 'On Linux/macOS: lsof -i :PORT. On Windows: netstat -ano | findstr :PORT. The reference also lists which port is conventionally assigned to each service.' },
      { q: 'Does the tool need internet access?', a: 'No. The port reference is a static lookup table loaded with the page. Search and lookup happen entirely in your browser.' },
    ],
    howTo: {
      name: 'How to look up a network port',
      description: 'Search a comprehensive reference of well-known and registered TCP/UDP ports.',
      steps: [
        { name: 'Type a port number or service name', text: 'Search by number (443) or by service (https) or keyword (database).' },
        { name: 'Read the matches', text: 'The tool shows all matching entries with the protocol (TCP/UDP), service name, and description.' },
        { name: 'Note the protocol', text: 'Some services use both TCP and UDP for different purposes. Pay attention to which protocol your scenario uses.' },
        { name: 'Cross-check on your system', text: 'For local debugging, use lsof -i :PORT (Linux/macOS) or netstat -ano (Windows) to confirm what is actually bound.' },
      ],
    },
  },
  {
    slug: 'ssh-key', name: 'SSH Key Generator', url: 'https://terminalfeed.io/tools/ssh-key',
    faqs: [
      { q: 'Which SSH key algorithm should I pick?', a: 'Ed25519 is the right answer for almost all 2026 use cases: short keys, fast generation, secure curve. RSA 3072 or 4096 only when you must interoperate with old systems that pre-date Ed25519 support.' },
      { q: 'Are these keys generated locally?', a: 'Yes. Key generation uses the Web Crypto API in your browser. The private key never leaves your machine. The TerminalFeed server cannot see it.' },
      { q: 'Can I use the keys directly with ssh?', a: 'Yes. Save the private key as ~/.ssh/id_ed25519 (or id_rsa for RSA), set permissions to 600, and the SSH client will pick it up automatically. The public key goes in authorized_keys on the server.' },
      { q: 'Should I add a passphrase?', a: 'Yes for any key you actually use. The web tool generates without a passphrase because passphrase-protection requires bcrypt-pbkdf which is non-trivial in the browser. After generation, run ssh-keygen -p -f keyfile to add a passphrase.' },
      { q: 'Will the private key work with PuTTY on Windows?', a: 'Not directly. PuTTY uses its own .ppk format. After downloading the OpenSSH private key, run PuTTYgen and use Conversions > Import key, then save as .ppk.' },
    ],
    howTo: {
      name: 'How to generate an SSH keypair',
      description: 'Generate Ed25519 or RSA SSH keypairs in OpenSSH v1 format, entirely in your browser.',
      steps: [
        { name: 'Pick algorithm', text: 'Ed25519 is recommended. RSA 3072 or 4096 only if you need legacy compatibility.' },
        { name: 'Add a comment', text: 'Set the key comment (typically user@host) so you can identify the key in authorized_keys files.' },
        { name: 'Generate', text: 'Click Generate. The browser produces a keypair using the Web Crypto API. Output is ready-to-use OpenSSH format.' },
        { name: 'Save and install', text: 'Save the private key as ~/.ssh/id_ed25519 (chmod 600) and the public key on the server in authorized_keys.' },
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
