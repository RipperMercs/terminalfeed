import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, '../public/blog');
const OUTPUT_JSON = path.join(__dirname, '../public/blog-latest.json');
const INDEX_HTML = path.join(__dirname, '../index.html');

function extractMetadata(htmlContent, slug) {
  const title = (htmlContent.match(/<meta property="og:title" content="([^"]+)"/) ||
                 htmlContent.match(/<title>([^|<]+)/))?.[1]?.trim() || '';
  const excerpt = htmlContent.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
  const datePublished = (htmlContent.match(/"datePublished":\s*"([^"]+)"/)?.[1] || '').slice(0, 10);
  const readTime = htmlContent.match(/<span>(\d+ min read)<\/span>/)?.[1] || '';

  // Author: prefer JSON-LD (reliable across layouts), fall back to legacy "By X" span
  const author = (
    htmlContent.match(/"author"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/)?.[1] ||
    htmlContent.match(/<span>By ([^<]+)<\/span>/)?.[1] ||
    ''
  ).trim();

  // Extract tags from article-tag spans
  const tagMatches = [...htmlContent.matchAll(/<span class="article-tag">([^<]+)<\/span>/g)];
  const tags = tagMatches.map(m => m[1].trim()).slice(0, 2);

  // Author title mapping
  const authorTitles = {
    'Ripper': 'Founder',
    'zer0day': 'Security Correspondent',
    'Pulse': 'Market Analyst',
    'Node': 'Dev Tools Editor',
    'Signal': 'Infrastructure Writer',
  };

  return {
    slug,
    title,
    excerpt,
    author,
    author_title: authorTitles[author] || 'Contributor',
    tags,
    published: datePublished,
    read_time: readTime,
  };
}

function scanBlogArticles() {
  const flatFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

  const ORIGINALS_DIR = path.join(BLOG_DIR, 'originals');
  const originalsFiles = fs.existsSync(ORIGINALS_DIR)
    ? fs.readdirSync(ORIGINALS_DIR).filter(f => f.endsWith('.html') && f !== 'index.html')
    : [];

  const articles = [
    ...flatFiles.map(file => {
      const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
      return extractMetadata(content, file.replace('.html', ''));
    }),
    ...originalsFiles.map(file => {
      const content = fs.readFileSync(path.join(ORIGINALS_DIR, file), 'utf-8');
      return extractMetadata(content, 'originals/' + file.replace('.html', ''));
    }),
  ].filter(a => a.title && a.published);

  // Sort by published date descending
  articles.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

  return articles.slice(0, 6);
}

function updateBlogJson(articles) {
  const data = {
    updated: new Date().toISOString(),
    articles,
  };
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(data, null, 2));
}

function updateSeoBlock(articles) {
  const html = fs.readFileSync(INDEX_HTML, 'utf-8');

  const latestArticlesHtml = articles.slice(0, 3).map(a => `      <article style="margin-bottom:16px">
        <h3 style="font-family:monospace;color:#F0EDE6;font-size:13px;margin-bottom:4px"><a href="/blog/${a.slug}" style="color:#5DCAA5;text-decoration:none">${a.title}</a></h3>
        <p style="font-family:monospace;color:#8A8880;font-size:11px;line-height:1.6;margin-bottom:4px">${a.excerpt}</p>
        <p style="font-family:monospace;color:#4E4D49;font-size:10px">By ${a.author} · ${a.author_title} · ${a.published}</p>
      </article>`).join('\n');

  const updated = html.replace(
    /<!-- LATEST_ARTICLES_START -->[\s\S]*?<!-- LATEST_ARTICLES_END -->/,
    `<!-- LATEST_ARTICLES_START -->\n${latestArticlesHtml}\n      <!-- LATEST_ARTICLES_END -->`
  );

  if (updated !== html) {
    fs.writeFileSync(INDEX_HTML, updated);
    console.log(`Updated SEO block with ${Math.min(3, articles.length)} articles`);
  }
}

const articles = scanBlogArticles();
updateBlogJson(articles);
console.log(`Generated blog-latest.json with ${articles.length} articles`);

// Only update SEO block if markers exist
const indexHtml = fs.readFileSync(INDEX_HTML, 'utf-8');
if (indexHtml.includes('LATEST_ARTICLES_START')) {
  updateSeoBlock(articles);
}
