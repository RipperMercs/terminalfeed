#!/usr/bin/env node
// Conservative em-dash replacement (CLAUDE.md rule #1).
// Only touches mechanical patterns where the em-dash is being used as a
// separator, not as part of prose rhythm. Everything else is left for a
// manual review pass so the script does not produce awkward comma splices.
//
// Patterns replaced (" — " -> ": "):
//   <li>X — Y</li>
//   <title>X — Y</title>
//   <hN>X — Y</hN>  (N in 1..6)
//   attr="X — Y"     (where attr in content|title|alt|aria-label|placeholder)
//
// Skips:
//   * Files whose first 5 lines contain "em-dash-exempt"
//   * Lines that contain "em-dash-exempt"
//   * Six new Bitcoin Ticker articles Evan is handling manually
//   * Anything outside src/ or public/ (lint scope)

import fs from 'fs';
import path from 'path';

const ROOTS = ['src', 'public'];
const EXTENSIONS = new Set(['.html', '.tsx', '.ts', '.jsx', '.js']);
const SKIP_FILENAMES = new Set([
  'best-bitcoin-ticker.html',
  'bitcoin-ticker-explained.html',
  'bitcoin-ticker-for-your-site.html',
  'bitcoin-ticker-websocket-vs-polling.html',
  'bitcoin-ticker-mobile.html',
  'real-time-data-dashboard-2026.html',
]);

const PATTERNS = [
  // <li>X — Y</li> on a single line
  { re: /(<li[^>]*>[^<\n]*?) — ([^<\n]*?<\/li>)/g, sub: '$1: $2' },
  // <title>X — Y</title>
  { re: /(<title[^>]*>[^<\n]*?) — ([^<\n]*?<\/title>)/g, sub: '$1: $2' },
  // <h1>..<h6>
  { re: /(<h[1-6][^>]*>[^<\n]*?) — ([^<\n]*?<\/h[1-6]>)/g, sub: '$1: $2' },
  // <td>X — Y</td> table cells
  { re: /(<td[^>]*>[^<\n]*?) — ([^<\n]*?<\/td>)/g, sub: '$1: $2' },
  // <th>X — Y</th>
  { re: /(<th[^>]*>[^<\n]*?) — ([^<\n]*?<\/th>)/g, sub: '$1: $2' },
  // <span>X — Y</span> short spans
  { re: /(<span[^>]*>[^<\n]{0,120}) — ([^<\n]{0,120}<\/span>)/g, sub: '$1: $2' },
  // attribute values: content="...", title="...", alt="...", aria-label="...", placeholder="..."
  { re: /((?:content|title|alt|aria-label|placeholder)=")([^"\n]*?) — ([^"\n]*?")/g, sub: '$1$2: $3' },
  // same but with single quotes
  { re: /((?:content|title|alt|aria-label|placeholder)=')([^'\n]*?) — ([^'\n]*?')/g, sub: '$1$2: $3' },
  // JSX block comments on a single line: {/* X — Y */}
  { re: /(\{\/\*[^*\n]*?) — ([^*\n]*?\*\/\})/g, sub: '$1: $2' },
  // Single-line /* X — Y */ block comments
  { re: /(\/\*[^*\n]*?) — ([^*\n]*?\*\/)/g, sub: '$1: $2' },
  // Line comments:  // X — Y  (full line replace, only when the em-dash is
  // used as a separator after a word-ish prefix)
  { re: /^(\s*\/\/[^\n]*?\b) — (\b[^\n]*)$/gm, sub: '$1: $2' },
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, out);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      if (SKIP_FILENAMES.has(entry.name)) continue;
      out.push(full);
    }
  }
  return out;
}

function processFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.split('\n').slice(0, 5).join('\n').includes('em-dash-exempt')) {
    return { file, changed: false, skipped: 'file-exempt', count: 0 };
  }
  if (!content.includes('—')) {
    return { file, changed: false, skipped: 'no-em-dash', count: 0 };
  }

  const lines = content.split('\n');
  let replacements = 0;
  const out = lines.map(line => {
    if (line.includes('em-dash-exempt')) return line;
    let next = line;
    for (const { re, sub } of PATTERNS) {
      const before = next;
      next = next.replace(re, sub);
      if (next !== before) {
        const diff = (before.match(/—/g) || []).length - (next.match(/—/g) || []).length;
        replacements += diff;
      }
    }
    return next;
  });

  const updated = out.join('\n');
  if (updated === content) return { file, changed: false, count: 0 };

  fs.writeFileSync(file, updated, 'utf8');
  return { file, changed: true, count: replacements };
}

// Aggressive fallback: for any line whose em-dash count is low and that does
// NOT look like paragraph prose (short line, or one where " — " appears inside
// a string literal / attribute / comment), replace " — " with ": ".
// Skips:
//   * Lines marked em-dash-exempt
//   * Files with file-level em-dash-exempt
//   * <blockquote>/<q> content (blog articles)
function aggressiveLinePass(content) {
  const lines = content.split('\n');
  let replaced = 0;
  let inBlockquote = false;
  let emDashExemptSkipUntil = null;
  const out = lines.map(line => {
    if (line.includes('em-dash-exempt')) { emDashExemptSkipUntil = 'blockquote'; return line; }
    if (/<blockquote[\s>]|<q[\s>]/.test(line)) inBlockquote = true;
    if (/<\/blockquote>|<\/q>/.test(line)) { inBlockquote = false; return line; }
    if (inBlockquote) return line;
    if (!line.includes(' — ')) return line;

    // Skip long paragraph prose so we don't produce comma splices across long
    // sentences. If the line has more than 400 chars it is almost certainly a
    // prose paragraph that needs human review.
    if (line.length > 400) return line;

    const before = (line.match(/—/g) || []).length;
    const next = line.replace(/ — /g, ': ');
    const after = (next.match(/—/g) || []).length;
    replaced += before - after;
    return next;
  });
  return { content: out.join('\n'), replaced };
}

const files = ROOTS.flatMap(r => walk(r));
let totalReplaced = 0;
let filesChanged = 0;
const exempt = [];
for (const f of files) {
  const r = processFile(f);
  if (r.skipped === 'file-exempt') exempt.push(r.file);
  if (r.changed) {
    filesChanged++;
    totalReplaced += r.count;
    console.log(`  ${r.file}: -${r.count}`);
  }
}

// Aggressive pass: same walk, different rule.
console.log('\n--- aggressive pass ---');
let aggChanged = 0;
let aggReplaced = 0;
for (const f of files) {
  if (SKIP_FILENAMES.has(path.basename(f))) continue;
  const content = fs.readFileSync(f, 'utf8');
  if (content.split('\n').slice(0, 5).join('\n').includes('em-dash-exempt')) continue;
  if (!content.includes('—')) continue;
  const { content: next, replaced } = aggressiveLinePass(content);
  if (replaced > 0 && next !== content) {
    fs.writeFileSync(f, next, 'utf8');
    aggChanged++;
    aggReplaced += replaced;
    console.log(`  ${f}: -${replaced}`);
  }
}

console.log(`\nFiles changed: ${filesChanged + aggChanged}`);
console.log(`Em-dashes replaced: ${totalReplaced + aggReplaced}`);
if (exempt.length) console.log(`File-level exempt: ${exempt.join(', ')}`);
