// One-shot sweep: fill author.url in Article schema, wrap "By [Name]"
// bylines with /team/[slug] links. Idempotent — safe to re-run.
//
// Scope: public/blog/**/*.html (articles + index + originals).
// Untouched: footer "/team" nav links, body prose mentioning authors.

import fs from 'fs';
import path from 'path';

const NAME_TO_SLUG = {
  'Ripper': 'ripper',
  'zer0day': 'zer0day',
  'Pulse': 'pulse',
  'Node': 'node',
  'Signal': 'signal',
};

// walk() recurses, so public/blog covers public/blog/originals too.
const BLOG_DIRS = ['public/blog'];
let schemaFixed = 0;
let bylineWrapped = 0;
const filesTouched = new Set();

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let content = original;

  for (const [name, slug] of Object.entries(NAME_TO_SLUG)) {
    // Article schema author block: "name": "[Name]", "url": "https://terminalfeed.io/team"
    // Capture everything up to and including the .io, replace just the trailing /team".
    const schemaRe = new RegExp(
      `("name":\\s*"${name}",\\s*"url":\\s*"https://terminalfeed\\.io)/team"`,
      'g'
    );
    content = content.replace(schemaRe, (m) => {
      schemaFixed++;
      return m.replace('/team"', `/team/${slug}"`);
    });

    // Byline wrap: >By [Name] becomes >By <a href="/team/[slug]" class="byline-link">[Name]</a>
    // The leading ">" prevents matching body prose. Word boundary after [Name] keeps
    // partial matches (e.g., "Signaler") from getting wrapped.
    const bylineRe = new RegExp(`(>\\s*By )${name}\\b`, 'g');
    const bylineStyle = 'color:inherit;text-decoration:none;border-bottom:1px dotted currentColor';
    content = content.replace(bylineRe, (m, prefix) => {
      bylineWrapped++;
      return `${prefix}<a href="/team/${slug}" class="byline-link" style="${bylineStyle}">${name}</a>`;
    });
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    filesTouched.add(filePath);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.html')) {
      processFile(full);
    }
  }
}

for (const dir of BLOG_DIRS) walk(dir);

console.log(`schema author.url fixed: ${schemaFixed}`);
console.log(`bylines wrapped: ${bylineWrapped}`);
console.log(`files touched: ${filesTouched.size}`);
