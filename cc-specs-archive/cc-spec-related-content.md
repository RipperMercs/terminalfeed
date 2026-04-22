# CC Spec — Related Articles & Related Tools (Blog Footer)

**Date:** April 20, 2026
**Priority:** MEDIUM (can land in parallel with `cc-spec-new-panels.md`, no dependencies)
**Scope:** Add a "Related Articles" + "Related Tools" block to the bottom of every blog article. Pure internal-linking SEO play. Zero dashboard risk.

---

## Executive Summary

Every blog article currently ends after the author box. Adding a curated Related Articles + Related Tools block to all 26+ articles:

- Strengthens topical clusters (crypto, dev-tools, security, AI, culture, data).
- Increases pages-per-session and internal link depth.
- Signals content relationships to Google's crawler.
- Bridges the `/blog` and `/tools` sections naturally.

Articles each get 3 related articles + 0–2 related tools, manually curated using the mapping in `related-content-component-spec.md` (already in project root — CC should read it first).

No Worker changes. No React state. No risk to the dashboard. Pure HTML + CSS inside static blog article files.

---

## Sections

### 1. Shared CSS

Options, in order of preference:

**Option A (recommended): Create `/public/css/blog.css`** and include it via a single `<link>` in each article's `<head>`. This is the right long-term pattern — every article already duplicates a lot of CSS.

**Option B (fallback):** Inline the block inside each article's existing `<style>` tag. Faster to ship, but duplicates 120 lines of CSS across 26+ files.

If Option A, the shared stylesheet contains everything currently inline-duplicated in the articles (headings, author-box, code blocks, quotes) PLUS the related-content block below. Migrating all articles to the shared stylesheet is out of scope for this spec — that's a separate cleanup.

For this spec, use **Option A**, but only add the `related-content` styles to `blog.css` (or create `blog-related.css` if cleaner). Each article links it additionally; no existing styles get touched.

CSS to add (verbatim from `related-content-component-spec.md`):

```css
.related-content {
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid #1E1E24;
}

.related-content h3 {
  font-size: 10px;
  color: #4E4D49;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.related-article {
  display: block;
  padding: 12px 0;
  border-bottom: 1px solid #1A1A1E;
  text-decoration: none;
}

.related-article:last-child {
  border-bottom: none;
}

.related-article:hover .related-title {
  color: #5DCAA5;
}

.related-title {
  font-size: 13px;
  color: #F0EDE6;
  font-weight: 600;
  margin-bottom: 3px;
  transition: color 0.15s;
}

.related-title::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #5DCAA5;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}

.related-meta {
  font-size: 10px;
  color: #4E4D49;
  padding-left: 14px;
}

.related-tools {
  margin-top: 20px;
}

.related-tool {
  display: block;
  padding: 8px 0;
  font-size: 12px;
  color: #8A8880;
  text-decoration: none;
  border-bottom: 1px solid #1A1A1E;
}

.related-tool:last-child {
  border-bottom: none;
}

.related-tool:hover {
  color: #5DCAA5;
}

.related-tool .tool-prefix {
  color: #4ADE80;
  margin-right: 6px;
}

.related-tool .tool-desc {
  color: #4E4D49;
  margin-left: 6px;
}
```

### 2. HTML block template

Insert inside `<article class="article-body">`, after the author-box, before the `</div>` container close:

```html
<div class="related-content">
  <h3>RELATED ARTICLES</h3>
  <a href="/blog/{slug-1}" class="related-article">
    <div class="related-title">{Title 1}</div>
    <div class="related-meta">By {Author} | {Category} | {Month Year}</div>
  </a>
  <a href="/blog/{slug-2}" class="related-article">
    <div class="related-title">{Title 2}</div>
    <div class="related-meta">By {Author} | {Category} | {Month Year}</div>
  </a>
  <a href="/blog/{slug-3}" class="related-article">
    <div class="related-title">{Title 3}</div>
    <div class="related-meta">By {Author} | {Category} | {Month Year}</div>
  </a>

  <div class="related-tools">
    <h3>RELATED TOOLS</h3>
    <a href="/tools/{tool-slug-1}" class="related-tool">
      <span class="tool-prefix">&gt;_</span> {Tool Name 1}
      <span class="tool-desc">{One-line description}</span>
    </a>
    <a href="/tools/{tool-slug-2}" class="related-tool">
      <span class="tool-prefix">&gt;_</span> {Tool Name 2}
      <span class="tool-desc">{One-line description}</span>
    </a>
  </div>
</div>
```

If an article has zero related tools (per the mapping), omit the entire `<div class="related-tools">` block — do not render an empty heading.

### 3. Content mapping (authoritative)

CC reads this from `related-content-component-spec.md` — that file already contains the full mapping for all 26+ articles across crypto/markets, dev tools, security, AI, culture/meta, and data categories. Use it verbatim. Do not re-curate.

Cross-check each article's suggested related-articles against `blog-latest.json` and the actual article files in `/public/blog/` to confirm the slugs exist. If a slug in the mapping points to a nonexistent article, skip it and pick the next-best match from the same category.

### 4. Tool metadata

For the `related-tools` block, you need a tool name + one-line description for each tool slug. Source:

- `json` → JSON Formatter — Format and validate JSON
- `base64` → Base64 — Encode and decode
- `uuid` → UUID Generator — Generate v4 UUIDs
- `timestamp` → Unix Timestamp — Convert to/from dates
- `jwt` → JWT Decoder — Decode and inspect tokens
- `regex` → Regex Tester — Test patterns live
- `hash` → Hash Generator — MD5, SHA-1, SHA-256, SHA-512
- `cron` → Cron Decoder — Build and decode cron expressions
- `satoshi` → Satoshi Converter — BTC to sats
- `gwei` → Gwei Calculator — Gas math in ETH and USD
- `hex` → Hex Converter — Hex, RGB, decimal

If any of these tool slugs doesn't exist yet on the site, skip it and pick a tool that does.

### 5. Build script hook

The prebuild script `scripts/generate-blog-data.js` already runs on every deploy and regenerates `blog-latest.json`. Consider extending it (optional, nice-to-have) to also write out an `author-metadata.json` that the related-content block can pull byline + date from, to avoid hardcoding this into the HTML blocks. Out of scope for this spec — the hardcoded HTML is fine for now.

---

## Execution Order

1. **Section 1** — Ship `/public/css/blog-related.css` or add styles to `/public/css/blog.css`. Single commit. No articles modified yet.
2. **Section 2+3** — For each of the 26+ articles, insert the related-content HTML block using the mapping from `related-content-component-spec.md`. **Commit per batch of 5 articles** (not per article — that would be 26+ commits). Expected ~6 commits total.
3. **Section 4** — Verify tool slugs exist on live site; fix up any broken links surfaced.

---

## Verification Checklist

- [ ] Every article in `/public/blog/*.html` has exactly one `.related-content` block
- [ ] Every `.related-article` and `.related-tool` link resolves to a real page (no 404s)
- [ ] Blog article bundle size per page did not increase by more than ~2 KB
- [ ] Site still loads, no CSS regressions
- [ ] Running `curl https://terminalfeed.io/blog/fear-greed-guide | grep -c related-content` returns `1`

---

## What this spec does NOT cover

- Auto-generated related content (this is manually curated per the mapping).
- Tag system or full taxonomy — just the curated 3-article + tools block.
- New articles. If new articles are added AFTER this spec lands, their related-content block must be added as part of the new-article PR.
- Dashboard changes. Zero panel code touched.

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** This spec only touches static blog HTML + CSS — low risk, but smoke-test after each batch commit by loading a sample article in a browser.
2. **No em dashes in any user-facing text.** The block's byline separators use `|`, not em dashes.
3. **One commit per batch** (5 articles at a time is fine).
4. **Don't touch the dashboard, panel code, Worker, or any build config.** This spec is blog-only.
5. **Verify the CSS load order:** if Option A (shared `blog.css`), the new `<link>` goes after any existing article stylesheet link so the related-content styles win cascade on any conflict.

Primary reference: `related-content-component-spec.md` in the project root contains the full content mapping and HTML/CSS specs. This spec is the executable wrapper around it.
