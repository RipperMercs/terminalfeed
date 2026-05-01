import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
let errors = 0;

// 1. No root-level wrangler config (would hijack Pages project)
['wrangler.jsonc', 'wrangler.toml', 'wrangler.json'].forEach(f => {
  if (fs.existsSync(path.join(root, f))) {
    console.error(`FATAL: ${f} found at project root. This will destroy the Pages project.`);
    errors++;
  }
});

// 2. No @cloudflare/vite-plugin (converts Pages to Workers)
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
if (allDeps['@cloudflare/vite-plugin']) {
  console.error('FATAL: @cloudflare/vite-plugin found in package.json. This converts Pages to Workers.');
  errors++;
}

// 3. No wrangler deploy/dev in npm scripts
Object.entries(pkg.scripts || {}).forEach(([name, cmd]) => {
  if (typeof cmd === 'string' && (cmd.includes('wrangler deploy') || cmd.includes('wrangler dev'))) {
    console.error(`FATAL: npm script "${name}" contains wrangler deploy/dev. Pages deploys via git push only.`);
    errors++;
  }
});

// 4. vite.config.ts clean of cloudflare plugin
const vitePath = path.join(root, 'vite.config.ts');
if (fs.existsSync(vitePath)) {
  const viteConfig = fs.readFileSync(vitePath, 'utf8');
  if (viteConfig.includes('@cloudflare/vite-plugin') || viteConfig.includes('cloudflare()')) {
    console.error('FATAL: vite.config.ts contains @cloudflare/vite-plugin references.');
    errors++;
  }
}

// 5. package.json is valid JSON (catches truncation/corruption)
try {
  JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
} catch (e) {
  console.error('FATAL: package.json is not valid JSON. File may be corrupted.');
  errors++;
}

// 5b. No direct browser-to-external-API fetches in src/ (CLAUDE.md rule #6).
// Apr 17 2026 incident: ~50 direct fetches in src/ were exposing the Finnhub
// key on every page view. Every external call must route through the Worker
// at /api/*. This grep blocks new instances at build time.
//
// Allowed: relative paths like fetch('/api/...'), fetch(`/api/...`).
// Blocked: fetch('https://...'), fetch('http://...'), and the same with backticks.
// Exemptions: lines tagged with `direct-fetch-exempt` (e.g. WebSocket/SSE
// streams the Worker can't proxy at scale).
function scanDirectFetches() {
  const SCAN_ROOTS = ['src'];
  const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
  const violations = [];

  // Match fetch( / new EventSource( / new WebSocket( with a quoted/templated
  // absolute URL. Matches single quote, double quote, or backtick.
  // Example matches: fetch('https://x'), new WebSocket("wss://x"), fetch(`http://${h}`)
  const RE = /\b(fetch|EventSource|WebSocket)\s*\(\s*['"`](https?:|wss?:)/i;

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        walk(full);
      } else if (SCAN_EXT.has(path.extname(entry.name))) {
        scanFile(full);
      }
    }
  }

  function scanFile(file) {
    const content = fs.readFileSync(file, 'utf8');
    if (!RE.test(content)) return;

    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (!RE.test(line)) return;
      if (line.includes('direct-fetch-exempt')) return;
      violations.push({ file: path.relative(root, file), line: i + 1, text: line.trim().slice(0, 160) });
    });
  }

  for (const r of SCAN_ROOTS) walk(path.join(root, r));
  return violations;
}

const directFetches = scanDirectFetches();
if (directFetches.length) {
  console.error(`\n[direct-fetch] ${directFetches.length} direct external fetch(es) in src/:`);
  for (const v of directFetches) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  console.error('\n[direct-fetch] CLAUDE.md rule #6: every external API call must go through the Worker at /api/*.');
  console.error('[direct-fetch] If this is a WebSocket/SSE stream that cannot be proxied, append // direct-fetch-exempt to the line.');
  errors++;
} else {
  console.log('[direct-fetch] no direct external fetches in src/');
}

// 6. Em-dash guard (CLAUDE.md rule #1). Blocking by default as of
// 2026-04-22 after the visual-diff gate cleared on homepage,
// /blog/building-terminalfeed, and /tools/json. Set SEO_LINT_STRICT=0
// to downgrade to warning mode for emergency deploys. Scope matches
// the SEO haul spec:
// .html/.tsx/.ts/.md under src/ and public/. Exemptions:
//   - file-level: "em-dash-exempt" appears in the first 5 lines
//   - line-level: "em-dash-exempt" appears on the same line
//   - inline HTML: "<!-- em-dash-exempt -->" suppresses the following
//     <blockquote> or <q> block until its closing tag
function scanEmDashes() {
  const LINT_ROOTS = ['src', 'public'];
  const LINT_EXT = new Set(['.html', '.tsx', '.ts', '.md']);
  const violations = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        walk(full);
      } else if (LINT_EXT.has(path.extname(entry.name))) {
        scanFile(full);
      }
    }
  }

  function scanFile(file) {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('—')) return;

    const lines = content.split('\n');
    const head = lines.slice(0, 5).join('\n');
    if (head.includes('em-dash-exempt')) return;

    let suppressUntil = null; // 'blockquote' | 'q' | null
    let lastWasExemptMarker = false;

    lines.forEach((line, i) => {
      // Inline HTML exempt marker: suppresses the next <blockquote>/<q>
      if (/<!--\s*em-dash-exempt[\s\S]*?-->/.test(line)) {
        lastWasExemptMarker = true;
        return;
      }

      // Open a suppression window when a marker was just seen and we hit
      // the opening tag
      if (lastWasExemptMarker) {
        if (/<blockquote[\s>]/.test(line)) suppressUntil = 'blockquote';
        else if (/<q[\s>]/.test(line)) suppressUntil = 'q';
        lastWasExemptMarker = false;
      }

      if (suppressUntil) {
        if (suppressUntil === 'blockquote' && /<\/blockquote>/.test(line)) suppressUntil = null;
        if (suppressUntil === 'q' && /<\/q>/.test(line)) suppressUntil = null;
        return;
      }

      if (line.includes('em-dash-exempt')) return;
      if (!line.includes('—')) return;

      violations.push({ file: path.relative(root, file), line: i + 1, text: line.trim().slice(0, 160) });
    });
  }

  for (const r of LINT_ROOTS) walk(path.join(root, r));
  return violations;
}

const emDashViolations = scanEmDashes();
const strict = process.env.SEO_LINT_STRICT !== '0';
if (emDashViolations.length) {
  console.error(`\n[seo-lint] ${emDashViolations.length} em-dash violation(s):`);
  for (const v of emDashViolations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  if (strict) {
    console.error('\n[seo-lint] em-dashes are blocking (CLAUDE.md rule #1). DO NOT DEPLOY.');
    console.error('[seo-lint] Mark legitimate quotes with em-dash-exempt per cc-specs-archive/cc-spec-em-dash-audit.md Section 2.5.');
    console.error('[seo-lint] For emergency bypass: SEO_LINT_STRICT=0 npm run build (warning mode, use sparingly).');
    errors++;
  } else {
    console.warn('\n[seo-lint] warning mode (SEO_LINT_STRICT=0). Fix before next full deploy.');
  }
} else {
  console.log('[seo-lint] em-dash check: clean');
}

if (errors > 0) {
  console.error(`\n${errors} FATAL error(s) found. DO NOT DEPLOY.`);
  process.exit(1);
} else {
  console.log('Deploy safety checks passed.');
}
