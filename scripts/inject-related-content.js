#!/usr/bin/env node
// Inject Related Articles + Related Tools block into every blog article.
// Run once; idempotent — skips articles that already have the block.

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
  'fear-greed-guide':                      { related: ['btc-extreme-fear-data', 'what-the-fear-greed-index-got-wrong', 'why-data-matters-for-traders'], tools: [] },
  'bitcoin-mempool':                       { related: ['fear-greed-guide', 'why-data-matters-for-traders', 'building-terminalfeed'], tools: [] },
  'prediction-markets':                    { related: ['fear-greed-guide', 'why-data-matters-for-traders', 'what-the-fear-greed-index-got-wrong'], tools: [] },
  'why-data-matters-for-traders':          { related: ['fear-greed-guide', 'prediction-markets', 'bitcoin-mempool'], tools: [] },
  'btc-extreme-fear-data':                 { related: ['fear-greed-guide', 'what-the-fear-greed-index-got-wrong', 'why-data-matters-for-traders'], tools: [] },
  'what-the-fear-greed-index-got-wrong':   { related: ['fear-greed-guide', 'btc-extreme-fear-data', 'prediction-markets'], tools: [] },

  'free-apis-2026':                        { related: ['api-rate-limits-explained', 'free-api-testing-tools', 'cron-decoded'], tools: ['json', 'jwt'] },
  'api-rate-limits-explained':             { related: ['free-apis-2026', 'free-api-testing-tools', 'rest-vs-graphql'], tools: ['json', 'timestamp'] },
  'free-api-testing-tools':                { related: ['free-apis-2026', 'api-rate-limits-explained', 'building-terminalfeed'], tools: ['json', 'base64'] },
  'cron-decoded':                          { related: ['free-apis-2026', 'free-api-testing-tools', 'self-hosting-is-back'], tools: ['cron', 'timestamp'] },
  'rest-vs-graphql':                       { related: ['free-apis-2026', 'api-rate-limits-explained', 'websocket-vs-sse'], tools: ['json', 'base64'] },
  'websocket-vs-sse':                      { related: ['real-time-vs-near-real-time', 'free-apis-2026', 'rest-vs-graphql'], tools: ['json', 'timestamp'] },

  'read-your-browser-console':             { related: ['browser-extensions-watching', 'building-terminalfeed', '2600-still-matters'], tools: ['json', 'regex'] },
  'browser-extensions-watching':           { related: ['read-your-browser-console', '2600-still-matters', '2600-hz-whistle-history'], tools: [] },
  '2600-hz-whistle-history':               { related: ['2600-still-matters', 'read-your-browser-console', 'self-hosting-is-back'], tools: [] },

  'how-ai-agents-browse':                  { related: ['websites-humans-ai-agents', 'claude-vs-chatgpt', 'building-terminalfeed'], tools: ['json', 'regex'] },
  'claude-mythos-project-glasswing':       { related: ['how-ai-agents-browse', 'claude-vs-chatgpt', 'websites-humans-ai-agents'], tools: [] },
  'websites-humans-ai-agents':             { related: ['how-ai-agents-browse', 'claude-vs-chatgpt', 'free-apis-2026'], tools: ['json', 'uuid'] },
  'claude-vs-chatgpt':                     { related: ['how-ai-agents-browse', 'websites-humans-ai-agents', 'claude-mythos-project-glasswing'], tools: ['json', 'jwt'] },

  'building-terminalfeed':                 { related: ['self-hosting-is-back', 'why-second-monitor-dashboards-matter', '2600-still-matters'], tools: ['json', 'timestamp'] },
  '2600-still-matters':                    { related: ['2600-hz-whistle-history', 'read-your-browser-console', 'self-hosting-is-back'], tools: [] },
  'self-hosting-is-back':                  { related: ['free-tier-is-dead', 'building-terminalfeed', 'free-apis-2026'], tools: ['json', 'cron'] },
  'free-tier-is-dead':                     { related: ['self-hosting-is-back', 'free-apis-2026', 'free-api-testing-tools'], tools: [] },
  'why-second-monitor-dashboards-matter':  { related: ['building-terminalfeed', 'real-time-vs-near-real-time', 'self-hosting-is-back'], tools: [] },

  'real-time-vs-near-real-time':           { related: ['websocket-vs-sse', 'building-terminalfeed', 'free-apis-2026'], tools: ['json', 'timestamp'] },
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
      const metaStr = [`By ${m.author}`, cat, when].filter(Boolean).join(' | ');
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

  // Inject block before </article> if present; otherwise before the shared
  // site footer. Some older articles use <div class="article-body"> with a
  // complex close structure and no <article> tag, so the footer is the
  // most reliable universal anchor.
  if (!/class="related-content"/.test(out)) {
    if (/<\/article>/.test(out)) {
      out = out.replace(/<\/article>/, block + '\n    </article>');
    } else {
      out = out.replace(/<footer class="footer">/, block + '\n  <footer class="footer">');
    }
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

  let updated = 0;
  let skipped = 0;
  for (const f of files) {
    const slug = path.basename(f, '.html');
    const html = fs.readFileSync(f, 'utf8');

    if (/class="related-content"/.test(html)) { skipped++; continue; }

    const block = buildBlock(slug, allMeta[slug], allMeta);
    if (!block) { skipped++; continue; }

    const out = injectIntoArticle(html, block);
    fs.writeFileSync(f, out, 'utf8');
    updated++;
  }

  console.log(`Updated: ${updated}, Skipped: ${skipped}`);
}

main();
