#!/usr/bin/env node
// Inject Related Articles + Related Tools block into every blog article.
// Safe to re-run: if an article already has the block, it is replaced with a
// freshly rendered one from the current MAPPING so the source of truth stays
// in this file rather than in 25+ hand-edited HTML files.

import fs from 'fs';
import path from 'path';

const BLOG_DIR = path.resolve('public/blog');

// slug -> { relatedSlugs: [3], tools: [0..2] }
// Uses the curated mapping from related-content-component-spec.md; for
// articles whose specced "related" slug does not exist on disk, I sub in
// the closest surviving match in the same category. For articles not in
// the original spec (2600-hz-whistle-history, claude-vs-chatgpt,
// rest-vs-graphql, websocket-vs-sse) I hand-picked 3 category neighbors.
const MAPPING = {
  // Crypto / markets. Reverse-linked to the Bitcoin Ticker batch where the
  // topic overlap is tight (mempool primer -> bitcoin-ticker-explained,
  // fear-greed -> best-bitcoin-ticker for "which ticker to use").
  'fear-greed-guide':                      { related: ['btc-extreme-fear-data', 'what-the-fear-greed-index-got-wrong', 'best-bitcoin-ticker'], tools: [] },
  'bitcoin-mempool':                       { related: ['fear-greed-guide', 'why-data-matters-for-traders', 'bitcoin-ticker-explained'], tools: [] },
  'prediction-markets':                    { related: ['fear-greed-guide', 'why-data-matters-for-traders', 'what-the-fear-greed-index-got-wrong'], tools: [] },
  'why-data-matters-for-traders':          { related: ['fear-greed-guide', 'prediction-markets', 'bitcoin-mempool'], tools: [] },
  'btc-extreme-fear-data':                 { related: ['fear-greed-guide', 'what-the-fear-greed-index-got-wrong', 'why-data-matters-for-traders'], tools: [] },
  'what-the-fear-greed-index-got-wrong':   { related: ['fear-greed-guide', 'btc-extreme-fear-data', 'prediction-markets'], tools: [] },

  // Dev tools. free-apis-2026 gets the ticker tutorial; websocket-vs-sse gets
  // the architecture deep dive.
  'free-apis-2026':                        { related: ['api-rate-limits-explained', 'free-api-testing-tools', 'bitcoin-ticker-for-your-site'], tools: ['json', 'jwt'] },
  'api-rate-limits-explained':             { related: ['free-apis-2026', 'free-api-testing-tools', 'rest-vs-graphql'], tools: ['json', 'timestamp'] },
  'free-api-testing-tools':                { related: ['free-apis-2026', 'api-rate-limits-explained', 'building-terminalfeed'], tools: ['json', 'base64'] },
  'cron-decoded':                          { related: ['free-apis-2026', 'free-api-testing-tools', 'self-hosting-is-back'], tools: ['cron', 'timestamp'] },
  'rest-vs-graphql':                       { related: ['free-apis-2026', 'api-rate-limits-explained', 'websocket-vs-sse'], tools: ['json', 'base64'] },
  'websocket-vs-sse':                      { related: ['real-time-vs-near-real-time', 'rest-vs-graphql', 'bitcoin-ticker-websocket-vs-polling'], tools: ['json', 'timestamp'] },

  // Security / culture.
  'read-your-browser-console':             { related: ['browser-extensions-watching', 'building-terminalfeed', '2600-still-matters'], tools: ['json', 'regex'] },
  'browser-extensions-watching':           { related: ['read-your-browser-console', '2600-still-matters', '2600-hz-whistle-history'], tools: [] },
  '2600-hz-whistle-history':               { related: ['2600-still-matters', 'read-your-browser-console', 'self-hosting-is-back'], tools: [] },

  // AI / models.
  'how-ai-agents-browse':                  { related: ['websites-humans-ai-agents', 'claude-vs-chatgpt', 'building-terminalfeed'], tools: ['json', 'regex'] },
  'claude-mythos-project-glasswing':       { related: ['how-ai-agents-browse', 'claude-vs-chatgpt', 'websites-humans-ai-agents'], tools: [] },
  'websites-humans-ai-agents':             { related: ['how-ai-agents-browse', 'claude-vs-chatgpt', 'free-apis-2026'], tools: ['json', 'uuid'] },
  'claude-vs-chatgpt':                     { related: ['how-ai-agents-browse', 'websites-humans-ai-agents', 'claude-mythos-project-glasswing'], tools: ['json', 'jwt'] },

  // Product / meta. building-terminalfeed and why-second-monitor-dashboards-matter
  // get the new Ripper Founder Friday piece.
  'building-terminalfeed':                 { related: ['self-hosting-is-back', 'why-second-monitor-dashboards-matter', 'real-time-data-dashboard-2026'], tools: ['json', 'timestamp'] },
  '2600-still-matters':                    { related: ['2600-hz-whistle-history', 'read-your-browser-console', 'self-hosting-is-back'], tools: [] },
  'self-hosting-is-back':                  { related: ['free-tier-is-dead', 'building-terminalfeed', 'free-apis-2026'], tools: ['json', 'cron'] },
  'free-tier-is-dead':                     { related: ['self-hosting-is-back', 'free-apis-2026', 'free-api-testing-tools'], tools: [] },
  'why-second-monitor-dashboards-matter':  { related: ['building-terminalfeed', 'real-time-vs-near-real-time', 'real-time-data-dashboard-2026'], tools: [] },

  'real-time-vs-near-real-time':           { related: ['websocket-vs-sse', 'building-terminalfeed', 'free-apis-2026'], tools: ['json', 'timestamp'] },

  // Bitcoin Ticker batch (April 22, 2026). Each is cross-linked back through
  // the reverse-link edits above so topical clusters reinforce each other.
  'bitcoin-ticker-explained':              { related: ['bitcoin-ticker-websocket-vs-polling', 'bitcoin-mempool', 'fear-greed-guide'], tools: ['satoshi', 'timestamp'] },
  'best-bitcoin-ticker':                   { related: ['bitcoin-ticker-explained', 'prediction-markets', 'why-data-matters-for-traders'], tools: ['satoshi', 'gwei'] },
  'bitcoin-ticker-for-your-site':          { related: ['bitcoin-ticker-websocket-vs-polling', 'free-apis-2026', 'websocket-vs-sse'], tools: ['json', 'base64'] },
  'bitcoin-ticker-websocket-vs-polling':   { related: ['websocket-vs-sse', 'real-time-vs-near-real-time', 'api-rate-limits-explained'], tools: ['json'] },
  'bitcoin-ticker-mobile':                 { related: ['bitcoin-ticker-websocket-vs-polling', 'why-second-monitor-dashboards-matter', 'read-your-browser-console'], tools: ['timestamp'] },
  'real-time-data-dashboard-2026':         { related: ['building-terminalfeed', 'why-second-monitor-dashboards-matter', 'free-apis-2026'], tools: ['satoshi', 'gwei', 'json'] },

  // BTC milestone post (May 3, 2026). Pairs sentiment-adjacent posts with the
  // mempool primer for the on-chain confirmation angle.
  'bitcoin-80k-sentiment-disconnect':      { related: ['fear-greed-guide', 'btc-extreme-fear-data', 'bitcoin-mempool'], tools: ['satoshi', 'gwei'] },
};

const TOOLS = {
  json:      { name: 'JSON Formatter', desc: 'Format and validate JSON' },
  base64:    { name: 'Base64',         desc: 'Encode and decode' },
  uuid:      { name: 'UUID Generator', desc: 'Generate v4 UUIDs' },
  timestamp: { name: 'Unix Timestamp', desc: 'Convert to and from dates' },
  jwt:       { name: 'JWT Decoder',    desc: 'Decode and inspect tokens' },
  regex:     { name: 'Regex Tester',   desc: 'Test patterns live' },
  hash:      { name: 'Hash Generator', desc: 'MD5, SHA-1, SHA-256, SHA-512' },
  cron:      { name: 'Cron Decoder',   desc: 'Build and decode cron expressions' },
  satoshi:   { name: 'Satoshi Converter', desc: 'BTC to sats' },
  gwei:      { name: 'Gwei Calculator',   desc: 'Gas math in ETH and USD' },
  hex:       { name: 'Hex Converter',     desc: 'Hex, RGB, decimal' },
};

const MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function monthYear(isoDate) {
  if (!isoDate) return '';
  const m = isoDate.match(/^(\d{4})-(\d{2})/);
  if (!m) return '';
  return MONTH[parseInt(m[2], 10) - 1] + ' ' + m[1];
}

// Pull title / author / datePublished out of JSON-LD if present; fall back
// to meta tags. Returns { title, author, category, monthYear }.
function parseArticle(html) {
  let title = '';
  let author = '';
  let datePublished = '';
  let category = '';

  const jsonLd = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLd) {
    try {
      const obj = JSON.parse(jsonLd[1]);
      const first = Array.isArray(obj) ? obj[0] : obj;
      title = first.headline || first.name || '';
      author = (first.author && (first.author.name || first.author)) || '';
      datePublished = first.datePublished || '';
      if (first.articleSection) category = first.articleSection;
    } catch {}
  }

  if (!title) {
    const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i);
    if (og) title = og[1];
  }
  if (!title) {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) title = h1[1].replace(/<[^>]+>/g, '').trim();
  }

  if (!author) {
    const byline = html.match(/class=["']article-author["'][^>]*>\s*(?:By\s*)?([^<]+?)</i);
    if (byline) author = byline[1].trim();
  }

  if (!category) {
    const tag = html.match(/class=["']article-tag["'][^>]*>\s*([^<]+?)</i);
    if (tag) category = tag[1].trim();
  }

  return {
    title: (title || '').replace(/&amp;/g, '&').trim(),
    author: (author || 'Ripper').trim(),
    category: (category || 'Article').trim(),
    monthYear: monthYear(datePublished),
  };
}

function buildBlock(slug, meta, allMeta) {
  const entry = MAPPING[slug];
  if (!entry) return null;

  const relatedArticles = entry.related
    .filter(s => allMeta[s])
    .slice(0, 3)
    .map(s => {
      const m = allMeta[s];
      const cat = m.category || 'Article';
      const when = m.monthYear || '';
      const authorSlug = (m.author || '').toLowerCase().replace(/\s+/g, '-');
      const authorHtml = authorSlug
        ? `<a href="/team/${authorSlug}" class="byline-link" style="color:inherit;text-decoration:none;border-bottom:1px dotted currentColor">${m.author}</a>`
        : m.author;
      const metaStr = [`By ${authorHtml}`, cat, when].filter(Boolean).join(' | ');
      return `  <a href="/blog/${s}" class="related-article">
    <div class="related-title">${m.title}</div>
    <div class="related-meta">${metaStr}</div>
  </a>`;
    })
    .join('\n');

  const toolsList = entry.tools.filter(t => TOOLS[t]);
  const toolsBlock = toolsList.length === 0 ? '' : `
  <div class="related-tools">
    <h3>RELATED TOOLS</h3>
${toolsList.map(t => {
  const tool = TOOLS[t];
  return `    <a href="/tools/${t}" class="related-tool">
      <span class="tool-prefix">&gt;_</span> ${tool.name}
      <span class="tool-desc">${tool.desc}</span>
    </a>`;
}).join('\n')}
  </div>`;

  return `
<div class="related-content">
  <h3>RELATED ARTICLES</h3>
${relatedArticles}
${toolsBlock}
</div>
`;
}

function injectIntoArticle(html, block) {
  let out = html;

  // Inject stylesheet link before </head> if not already present
  if (!/\/css\/blog-related\.css/.test(out)) {
    out = out.replace(/<\/head>/, '  <link rel="stylesheet" href="/css/blog-related.css">\n</head>');
  }

  // If a block is already present, strip it so we can replace with the
  // freshly rendered one. This makes the script re-runnable so MAPPING is
  // the single source of truth.
  out = out.replace(/\s*<div class="related-content">[\s\S]*?<\/div>\s*(?=<\/article>|<footer class="footer">)/, '\n');

  // Inject block before </article> if present; otherwise before the shared
  // site footer. Some older articles use <div class="article-body"> with a
  // complex close structure and no <article> tag, so the footer is the
  // most reliable universal anchor.
  if (/<\/article>/.test(out)) {
    out = out.replace(/<\/article>/, block + '\n    </article>');
  } else {
    out = out.replace(/<footer class="footer">/, block + '\n  <footer class="footer">');
  }

  return out;
}

function main() {
  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .map(f => path.join(BLOG_DIR, f));

  const allMeta = {};
  for (const f of files) {
    const slug = path.basename(f, '.html');
    allMeta[slug] = parseArticle(fs.readFileSync(f, 'utf8'));
  }

  let written = 0;
  let unchanged = 0;
  let skipped = 0;
  for (const f of files) {
    const slug = path.basename(f, '.html');
    const html = fs.readFileSync(f, 'utf8');

    const block = buildBlock(slug, allMeta[slug], allMeta);
    if (!block) { skipped++; continue; }

    const out = injectIntoArticle(html, block);
    if (out === html) { unchanged++; continue; }

    fs.writeFileSync(f, out, 'utf8');
    written++;
  }

  console.log(`Written: ${written}, Unchanged: ${unchanged}, Skipped (no mapping): ${skipped}`);
}

main();
