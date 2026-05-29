// Generate public/sitemap.xml from the actual files on disk.
//
// Why this exists (audit 2026-05-29): the sitemap was hand-maintained and drifted
// badly. It was missing 15 of 35 tool pages and the 5 newest blog originals, every
// lastmod was frozen, and it listed 27 phantom /es//pt//de/ URLs that are only
// _redirects rewrites to the English files (the "Alternate page with proper
// canonical" noise in Search Console). Enumerating real files fixes all of that:
// new pages appear automatically, lastmods come from git history, and the
// non-existent language directories simply never show up.
//
// Runs in prebuild after generate-blog-data.js. Pure file walk, no network.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(PUBLIC, 'sitemap.xml');
const BASE = 'https://terminalfeed.io';

// Directories whose pages are never indexed.
const EXCLUDE_DIRS = new Set(['embed', '_internal']);
// Individual files that should not be in the sitemap (error/utility/thank-you).
const EXCLUDE_FILES = new Set(['404.html', 'offline.html', 'buy-thanks.html']);

// Worker-served and non-HTML discovery surfaces worth keeping indexed. These are
// not .html files on disk, so the walk cannot find them; list them explicitly.
const EXTRA_URLS = [
  { path: '/openapi.json', changefreq: 'weekly', priority: '0.6' },
  { path: '/agents.txt', changefreq: 'weekly', priority: '0.6' },
  { path: '/.well-known/ai-plugin.json', changefreq: 'monthly', priority: '0.5' },
  { path: '/api/for-agents', changefreq: 'weekly', priority: '0.8' },
  { path: '/api/usdc-payable', changefreq: 'weekly', priority: '0.8' },
];

// One git pass: map repo-relative POSIX path -> latest commit date (YYYY-MM-DD).
// Newest commit first, so the first time we see a file is its most recent change.
function buildGitDateMap() {
  const map = {};
  try {
    const out = execFileSync('git', ['log', '--format=C:%cs', '--name-only'], {
      cwd: ROOT,
      maxBuffer: 64 * 1024 * 1024,
    }).toString();
    let cur = null;
    for (const line of out.split('\n')) {
      if (line.startsWith('C:')) { cur = line.slice(2).trim(); continue; }
      const f = line.trim();
      if (f && cur && !(f in map)) map[f] = cur;
    }
  } catch (e) {
    // No git (e.g. shallow CI checkout). Fall back to file mtime per entry.
  }
  return map;
}

const gitDates = buildGitDateMap();
const today = new Date().toISOString().slice(0, 10);

function lastmod(absFile) {
  const repoRel = path.relative(ROOT, absFile).split(path.sep).join('/');
  if (gitDates[repoRel] && /^\d{4}-\d{2}-\d{2}$/.test(gitDates[repoRel])) return gitDates[repoRel];
  try {
    return new Date(fs.statSync(absFile).mtimeMs).toISOString().slice(0, 10);
  } catch (e) {
    return today;
  }
}

// Map a public-relative path (POSIX) to its clean URL path.
function urlPathFor(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
  return '/' + rel.slice(0, -'.html'.length);
}

// changefreq + priority by section (first path segment).
function rank(urlPath) {
  const seg = urlPath.split('/')[1] || '';
  const isIndex = urlPath === `/${seg}` && seg !== '';
  switch (seg) {
    case '': return { changefreq: 'daily', priority: '1.0' };
    case 'blog': return urlPath === '/blog'
      ? { changefreq: 'daily', priority: '0.9' }
      : { changefreq: 'weekly', priority: '0.7' };
    case 'developers': return { changefreq: 'weekly', priority: '0.9' };
    case 'for-devs': return { changefreq: 'weekly', priority: '0.8' };
    case 'use-cases':
    case 'compare': return { changefreq: 'weekly', priority: '0.8' };
    case 'tools':
    case 'glossary':
    case 'http':
    case 'crypto':
    case 'cheatsheets':
      return isIndex
        ? { changefreq: 'weekly', priority: '0.7' }
        : { changefreq: 'monthly', priority: '0.6' };
    case 'live':
    case 'agent':
    case 'radio':
    case 'wifi':
    case 'widgets':
    case 'status':
    case 'team':
    case 'harnesses':
      return { changefreq: 'weekly', priority: '0.7' };
    default: return { changefreq: 'monthly', priority: '0.6' };
  }
}

function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      if (EXCLUDE_FILES.has(entry.name)) continue;
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
}

const urls = [];

// Homepage (root index.html is the SPA entry, not under public/).
urls.push({
  loc: BASE + '/',
  lastmod: lastmod(path.join(ROOT, 'index.html')),
  changefreq: 'daily',
  priority: '1.0',
});

for (const file of walk(PUBLIC, [])) {
  const rel = path.relative(PUBLIC, file).split(path.sep).join('/');
  const urlPath = urlPathFor(rel);
  if (urlPath === '/') continue; // home already added
  const r = rank(urlPath);
  urls.push({ loc: BASE + urlPath, lastmod: lastmod(file), ...r });
}

for (const e of EXTRA_URLS) {
  urls.push({ loc: BASE + e.path, lastmod: today, changefreq: e.changefreq, priority: e.priority });
}

// Stable order: home first, then alphabetical by loc.
urls.sort((a, b) => (a.loc === BASE + '/' ? -1 : b.loc === BASE + '/' ? 1 : a.loc.localeCompare(b.loc)));

const body = urls.map(u =>
  `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

fs.writeFileSync(OUT, xml, 'utf8');
console.log(`Generated sitemap.xml with ${urls.length} URLs`);
