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
// at /api/*.
//
// This scanner is content-aware (audit 2026-05-29). The old single-line regex
// had two blind spots: it only matched an inline URL literal sitting directly
// inside the call (missing `const URL = 'https://...'; fetch(URL)`), and it
// tested per line (missing multiline `fetch(\n  'https://...')`). It reported
// "clean" while ~15 hooks fetched externally. This version strips comments,
// spans newlines, and resolves URL-in-constant indirection.
//
// Allowed: relative paths like fetch('/api/...').
// Blocked: fetch('https://...') / fetch(`http://${h}`) / fetch(EXTERNAL_URL_CONST).
// Exemptions:
//   - line-level: `direct-fetch-exempt` on (or within) the call, for genuine
//     WebSocket/SSE streams the Worker cannot proxy at scale.
//   - DIRECT_FETCH_DEBT: pre-existing keyless public-API hooks tracked for
//     migration behind the Worker (audit item #5). Reported as warnings, not
//     errors, so the build is not blocked while the list is whittled down. Any
//     NEW or keyed direct fetch outside this list is a hard error. Do NOT add
//     keyed endpoints here; migrate those instead.
// EMPTY as of 2026-06-02: the rule #6 migration is complete. Every keyless
// public-API hook that used to fetch an external host directly from the browser
// now routes through the Worker. Migrated this pass: useAstros (-> /api/humans-in-space),
// useFlightRadar (-> /api/aviation), useISSPosition (-> /api/iss-position + /api/humans-in-space),
// useFooterQuote (-> /api/quote), useBtcNetwork (-> /api/btc-network), useDonations
// (-> /api/donations), useWhaleWatch (-> /api/whale-watch), useEarthquakes (-> /api/earthquake),
// useFearGreed (-> /api/fear-greed), useNpmTrends (-> /api/npm-trends), useDevJoke
// (-> /api/dev-joke), useFunFact (-> /api/fun-fact), useTrendingBooks (-> /api/trending-books),
// useStackOverflow (-> /api/stackoverflow), useThisDay (-> /api/this-day), useMuseumArt
// (-> /api/museum-art), useWikipedia (-> /api/wiki-featured), useBluesky (-> /api/bluesky),
// useTCGMarket (-> /api/tcg-market), useSpaceLaunches (-> /api/launches), useWeather
// (-> /api/weather, now with request.cf geolocation + 7-day forecast).
// Keep this Set empty: any new external browser fetch is now a hard build error.
// Genuine WebSocket/SSE streams the Worker cannot proxy use a line-level
// `direct-fetch-exempt` marker instead of this list.
const DIRECT_FETCH_DEBT = new Set([]);

function stripComments(src) {
  // Replace block + line comments with same-length whitespace, preserving
  // newlines so reported line numbers stay aligned with the original file.
  // Intentionally naive (does not parse strings/regex); a build guard should
  // err toward over-detection. The `[^:]` guard avoids treating the `//` in
  // https:// or wss:// as the start of a line comment.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (full, p1) => p1 + ' '.repeat(full.length - p1.length));
}

function scanDirectFetches() {
  const SCAN_ROOTS = ['src'];
  const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
  const violations = [];
  const debt = [];

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
    const stripped = stripComments(content);
    const rel = path.relative(root, file).split(path.sep).join('/');
    const lines = content.split('\n');

    // Module-level URL string constants: const/let/var NAME = 'http(s)/ws(s)://...'
    const urlConsts = new Set();
    const constRe = /\b(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*['"`](?:https?:|wss?:)\/\//g;
    let cm;
    while ((cm = constRe.exec(stripped))) urlConsts.add(cm[1]);

    // Every fetch/EventSource/WebSocket call. `\s*` spans newlines so multiline
    // calls are caught. First arg is either an inline absolute-URL literal or an
    // identifier (which is a violation only if it is a known external-URL const).
    const callRe = /\b(fetch|EventSource|WebSocket)\s*\(\s*(?:(['"`])(?:https?:|wss?:)\/\/|([A-Za-z0-9_$]+)\s*[),])/g;
    let m;
    while ((m = callRe.exec(stripped))) {
      const inlineUrl = !!m[2];
      const ident = m[3];
      if (!inlineUrl && !(ident && urlConsts.has(ident))) continue;

      const startLine = stripped.slice(0, m.index).split('\n').length;
      const endLine = stripped.slice(0, callRe.lastIndex).split('\n').length;
      // Exempt if the tag appears on any line the call spans.
      let exempt = false;
      for (let i = startLine - 1; i < endLine && i < lines.length; i++) {
        if (lines[i].includes('direct-fetch-exempt')) { exempt = true; break; }
      }
      if (exempt) continue;

      const rec = { file: rel, line: startLine, text: (lines[startLine - 1] || '').trim().slice(0, 160) };
      if (DIRECT_FETCH_DEBT.has(rel)) debt.push(rec);
      else violations.push(rec);
    }
  }

  for (const r of SCAN_ROOTS) walk(path.join(root, r));
  return { violations, debt };
}

const { violations: directFetches, debt: directFetchDebt } = scanDirectFetches();
if (directFetchDebt.length) {
  console.warn(`\n[direct-fetch] ${directFetchDebt.length} known pre-existing direct fetch(es) to migrate behind /api/* (audit #5):`);
  for (const v of directFetchDebt) console.warn(`  ${v.file}:${v.line}  ${v.text}`);
}
if (directFetches.length) {
  console.error(`\n[direct-fetch] ${directFetches.length} NEW direct external fetch(es) in src/:`);
  for (const v of directFetches) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  console.error('\n[direct-fetch] CLAUDE.md rule #6: every external API call must go through the Worker at /api/*.');
  console.error('[direct-fetch] If this is a WebSocket/SSE stream that cannot be proxied, append // direct-fetch-exempt to the line.');
  console.error('[direct-fetch] If it is a known pre-existing keyless hook, it belongs on DIRECT_FETCH_DEBT (never add keyed endpoints there).');
  errors++;
} else {
  const tail = directFetchDebt.length ? ` (${directFetchDebt.length} known on the migration list)` : '';
  console.log(`[direct-fetch] no NEW direct external fetches in src/${tail}`);
}

// 5c. No hardcoded secrets in src/ (audit 2026-05-29). A live TMDB read JWT
// shipped in the client bundle because the husky prefix scan never matched raw
// JWTs. Hard error, no debt allowance: anything matching here must move to a
// Worker secret and be proxied via /api/*. Tag a genuine false positive with
// `secret-scan-exempt` on the line.
function scanHardcodedSecrets() {
  const SCAN_ROOTS = ['src'];
  const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
  const hits = [];
  const SECRET_RES = [
    { name: 'jwt', re: /eyJ[A-Za-z0-9_=-]{10,}\.[A-Za-z0-9_=-]{10,}/ },
    { name: 'bearer-literal', re: /['"`]Bearer\s+[A-Za-z0-9._-]{12,}['"`]/ },
    { name: 'key-prefix', re: /(sk-ant-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{30,}|re_[A-Za-z0-9_-]{16,}|xoxb-[A-Za-z0-9-]{16,}|ghp_[A-Za-z0-9]{30,}|gho_[A-Za-z0-9]{30,})/ },
  ];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        walk(full);
      } else if (SCAN_EXT.has(path.extname(entry.name))) {
        const content = fs.readFileSync(full, 'utf8');
        const rel = path.relative(root, full).split(path.sep).join('/');
        content.split('\n').forEach((line, i) => {
          if (line.includes('secret-scan-exempt')) return;
          for (const s of SECRET_RES) {
            if (s.re.test(line)) {
              hits.push({ file: rel, line: i + 1, kind: s.name, text: line.trim().slice(0, 80) });
              break;
            }
          }
        });
      }
    }
  }

  for (const r of SCAN_ROOTS) walk(path.join(root, r));
  return hits;
}

const secretHits = scanHardcodedSecrets();
if (secretHits.length) {
  console.error(`\n[secret-scan] ${secretHits.length} hardcoded secret(s) in src/:`);
  for (const v of secretHits) console.error(`  ${v.file}:${v.line}  [${v.kind}]  ${v.text}`);
  console.error('\n[secret-scan] Move the secret to a Worker secret (wrangler secret put) and proxy via /api/*. Never ship a key in the client bundle.');
  errors++;
} else {
  console.log('[secret-scan] no hardcoded secrets in src/');
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
