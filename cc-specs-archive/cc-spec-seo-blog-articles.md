# CC Spec — SEO Blog Articles (Bitcoin Ticker Batch)

**Date:** April 22, 2026
**Priority:** MEDIUM (no dashboard risk, pure content + static infra)
**Scope:** Ship six new SEO-targeted blog articles (already drafted, in `/public/blog/`), regenerate blog data, update RSS + sitemap, and extend the related-content mapping so they cross-link with the existing 26+ articles. Targets the Bitcoin Ticker keyword family from `cc-spec-seo-haul.md` Section 6.

---

## Executive Summary

Six new article HTML files have already been written and committed to `/public/blog/`. They follow the existing article template (JetBrains Mono, terminal dark palette, schema.org Article + BreadcrumbList JSON-LD, breadcrumbs, tag chips, author box, `/css/blog-related.css` link). All six target the Bitcoin Ticker keyword cluster and cross-link each other.

CC's job on this spec is NOT to write the articles. The drafts are done. CC's job is to wire them into the site infrastructure so Google, RSS readers, the homepage SEO block, and the related-content mapping all know about them.

**New article files (already present):**

```
/public/blog/bitcoin-ticker-explained.html              — Node,   ~8 min
/public/blog/best-bitcoin-ticker.html                   — Pulse,  ~9 min
/public/blog/bitcoin-ticker-for-your-site.html          — Node,  ~10 min
/public/blog/bitcoin-ticker-websocket-vs-polling.html   — Node,  ~10 min
/public/blog/bitcoin-ticker-mobile.html                 — Node,   ~8 min
/public/blog/real-time-data-dashboard-2026.html         — Ripper, ~10 min
```

Before starting: confirm all six files exist with `ls public/blog/ | grep -E "bitcoin-ticker|real-time-data-dashboard-2026"` — expect 6 results. If fewer, stop and flag.

---

## Sections

### 1. Regenerate blog data + homepage SEO block

The prebuild script `scripts/generate-blog-data.js` scans `/public/blog/` and writes `/public/blog-latest.json` (6 most recent) plus updates the static SEO content block in `index.html` between `<!-- LATEST_ARTICLES_START -->` and `<!-- LATEST_ARTICLES_END -->` markers.

**Steps:**

1. Run `node scripts/generate-blog-data.js` locally.
2. Diff `public/blog-latest.json` — expect the 6 new articles to appear as the newest 6 entries (all dated April 22, 2026).
3. Diff `index.html` — expect the SEO block to now show the 6 new titles, excerpts, and author bylines.
4. If the script doesn't pick up the new files, check that the articles' `<meta>` tags include `datePublished` in the JSON-LD and a matching `<meta name="date">` or whatever format the script parses. Worst case: add any missing meta tag to the articles (but do NOT change the article prose).
5. Commit: `chore: regenerate blog data for bitcoin ticker article batch`.

### 2. RSS feed entries (`/public/feed.xml`)

Add an `<item>` for each of the six new articles in RSS 2.0 format. Follow the existing pattern used for prior articles.

Per-article item template:

```xml
<item>
  <title>{Article Title}</title>
  <link>https://terminalfeed.io/blog/{slug}</link>
  <guid isPermaLink="true">https://terminalfeed.io/blog/{slug}</guid>
  <pubDate>Wed, 22 Apr 2026 00:00:00 GMT</pubDate>
  <author>hello@terminalfeed.io ({Author Persona})</author>
  <description>{Meta description from article}</description>
</item>
```

Authors and slugs:

- `bitcoin-ticker-explained` — Node — "Bitcoin Ticker: How Live BTC Price Updates Actually Work"
- `best-bitcoin-ticker` — Pulse — "The Best Free Bitcoin Ticker in 2026"
- `bitcoin-ticker-for-your-site` — Node — "How to Add a Free Bitcoin Ticker to Your Website"
- `bitcoin-ticker-websocket-vs-polling` — Node — "Why We Built a WebSocket Bitcoin Ticker Instead of Polling"
- `bitcoin-ticker-mobile` — Node — "Why Your Mobile Bitcoin Ticker Lies"
- `real-time-data-dashboard-2026` — Ripper — "Beyond the Bitcoin Ticker: Building a Real-Time Data Dashboard"

Place the new items at the TOP of the `<channel>` items block (newest first, per RSS convention). Update the `<lastBuildDate>` to the current deploy time.

If the build script already regenerates feed.xml automatically, verify that instead of editing by hand.

Commit: `feat: add bitcoin ticker article batch to RSS feed`.

### 3. Sitemap (`/public/sitemap.xml`)

Add six `<url>` entries:

```xml
<url>
  <loc>https://terminalfeed.io/blog/bitcoin-ticker-explained</loc>
  <lastmod>2026-04-22</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

Repeat for the other five slugs. Priority 0.7 matches the existing blog article priority. Use the same format/indentation as other blog article entries.

Single commit: `feat: add bitcoin ticker article slugs to sitemap`.

After deploy, resubmit the sitemap to Google Search Console.

### 4. Related-content mapping updates

Extend the content mapping in `related-content-component-spec.md` so the 6 new articles (a) have their own related-content block entries, and (b) get added as cross-links on relevant existing articles.

**4a. Entries for the 6 new articles** — Each gets 3 related articles + related tools. Suggested mapping (CC can adjust if it finds better matches):

```
bitcoin-ticker-explained:
  related: [websocket-vs-sse, bitcoin-mempool, fear-greed-guide]
  tools: [satoshi, timestamp]

best-bitcoin-ticker:
  related: [bitcoin-ticker-explained, prediction-markets, why-data-matters-for-traders]
  tools: [satoshi, gwei]

bitcoin-ticker-for-your-site:
  related: [bitcoin-ticker-websocket-vs-polling, free-apis-2026, websocket-vs-sse]
  tools: [json, base64]

bitcoin-ticker-websocket-vs-polling:
  related: [websocket-vs-sse, real-time-vs-near-real-time, api-rate-limits-explained]
  tools: [json]

bitcoin-ticker-mobile:
  related: [bitcoin-ticker-websocket-vs-polling, why-second-monitor-dashboards-matter, read-your-browser-console]
  tools: [timestamp]

real-time-data-dashboard-2026:
  related: [building-terminalfeed, why-second-monitor-dashboards-matter, free-apis-2026]
  tools: [satoshi, gwei, json]
```

Cross-check each related slug against the actual files in `/public/blog/`. If any slug doesn't exist, swap for the next-best match from the same category (crypto / dev / architecture / culture).

**4b. Add reverse cross-links on high-traffic existing articles** — Optional but high-SEO-value. Open the related-content block on these existing articles and add one of the new Bitcoin Ticker articles where it fits:

- `fear-greed-guide.html` → add `best-bitcoin-ticker` to related
- `bitcoin-mempool.html` → add `bitcoin-ticker-explained` to related
- `websocket-vs-sse.html` → add `bitcoin-ticker-websocket-vs-polling` to related
- `building-terminalfeed.html` → add `real-time-data-dashboard-2026` to related
- `free-apis-2026.html` → add `bitcoin-ticker-for-your-site` to related
- `why-second-monitor-dashboards-matter.html` → add `real-time-data-dashboard-2026` to related

If `cc-spec-related-content.md` hasn't shipped yet (i.e. the related-content blocks aren't on the existing articles yet), skip 4b entirely and just add these 6 articles to the mapping in `related-content-component-spec.md` so they land in the correct shape when that spec runs.

Commit per batch of ~5 articles touched (same cadence as `cc-spec-related-content.md`).

### 5. Blog index card updates (`/public/blog/index.html`)

Add card entries for the 6 new articles in the existing card pattern: title, author persona tag, category, date, 2-line excerpt, read link.

Card order: newest first (April 22, 2026 entries go at the top of the chronological list).

Suggested category tags by article:

- `bitcoin-ticker-explained` → BITCOIN / REAL-TIME / TUTORIAL
- `best-bitcoin-ticker` → BITCOIN / MARKETS / COMPARISON
- `bitcoin-ticker-for-your-site` → TUTORIAL / BITCOIN / JAVASCRIPT
- `bitcoin-ticker-websocket-vs-polling` → ARCHITECTURE / BITCOIN / PERFORMANCE
- `bitcoin-ticker-mobile` → MOBILE / BITCOIN / PERFORMANCE
- `real-time-data-dashboard-2026` → FOUNDER FRIDAY / PRODUCT / REAL-TIME

Single commit: `feat: add bitcoin ticker batch to blog index`.

### 6. llms.txt + openapi.json (if applicable)

If `/public/llms.txt` has a blog article list for AI agent discovery, add the six new slugs. Otherwise skip.

### 7. Verify homepage "TERMINALFEED ORIGINALS" panel rotation

The dashboard's TERMINALFEED ORIGINALS panel reads from `blog-latest.json` (regenerated in Section 1). After deploy, confirm the panel rotates through the 6 latest articles including the new batch. No code change expected; just a visual check.

---

## Execution Order

1. **Section 1** — Run prebuild, verify `blog-latest.json` and `index.html` SEO block updated. Single commit.
2. **Section 2** — RSS feed entries. Single commit.
3. **Section 3** — Sitemap entries. Single commit.
4. **Section 4a** — Add 6 new articles' mappings to `related-content-component-spec.md`. Single commit. (4b deferred if the blog-wide related-content spec hasn't landed.)
5. **Section 5** — Blog index cards. Single commit.
6. **Section 6** — llms.txt update if applicable. Single commit.
7. **Section 7** — Post-deploy visual check. No commit.

Total: 5-6 commits. No Worker changes. No dashboard changes. No risk to the live site.

---

## Verification Checklist

After deploy:

- [ ] `curl https://terminalfeed.io/blog/bitcoin-ticker-explained` returns 200
- [ ] `curl https://terminalfeed.io/blog/best-bitcoin-ticker` returns 200
- [ ] `curl https://terminalfeed.io/blog/bitcoin-ticker-for-your-site` returns 200
- [ ] `curl https://terminalfeed.io/blog/bitcoin-ticker-websocket-vs-polling` returns 200
- [ ] `curl https://terminalfeed.io/blog/bitcoin-ticker-mobile` returns 200
- [ ] `curl https://terminalfeed.io/blog/real-time-data-dashboard-2026` returns 200
- [ ] `curl https://terminalfeed.io/blog-latest.json | jq 'map(.slug)'` includes the 6 new slugs
- [ ] `curl https://terminalfeed.io/sitemap.xml | grep -c "bitcoin-ticker"` returns at least 5
- [ ] `curl https://terminalfeed.io/feed.xml | grep -c "bitcoin-ticker"` returns at least 5
- [ ] View page source of homepage, confirm the SEO block between `<!-- LATEST_ARTICLES_START -->` and `<!-- LATEST_ARTICLES_END -->` lists at least one of the new articles
- [ ] `/blog` index page visually shows new cards
- [ ] Open each of the 6 new articles in a browser, confirm:
  - Layout matches existing articles
  - Breadcrumbs work
  - Author link resolves
  - Cross-links in the prose resolve (no 404s)
  - Related-content block renders (if Section 4 shipped)
- [ ] BTC hero still ticking live on homepage (no regressions)
- [ ] Submit updated `sitemap.xml` to Google Search Console

---

## What this spec does NOT cover

- Writing the articles. Already done.
- Section-by-section rollout of `cc-spec-seo-haul.md` (homepage overhaul, `/bitcoin-ticker` landing page, per-panel H2s, `/tickers/*` and `/feeds/*` landing pages, schema.org expansion). Those are separate sections of the SEO haul spec.
- Dashboard changes. Zero panel code touched.
- Worker changes. Zero API changes.
- Adding `cc-spec-related-content.md`'s CSS/HTML blocks to existing articles. That's the other spec.

---

## Target Keywords (for reference)

Primary cluster (Tier 1 from cc-spec-seo-haul.md):

- Bitcoin Ticker
- Best Bitcoin Ticker
- Real-Time Bitcoin Ticker
- Live Bitcoin Ticker
- BTC Ticker
- Free Bitcoin Ticker
- Bitcoin Price Ticker
- Live BTC Price

Each article targets 1-2 of these in title, meta description, OG tags, and article H2s.

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** This spec touches only static content + build output. Safest possible spec. Smoke-test the homepage after Section 1 to confirm the SEO block didn't break the markup.
2. **NEVER add `@cloudflare/vite-plugin`** to the project. Not relevant to this spec but sticky rule.
3. **NEVER add `wrangler.jsonc` or `wrangler.toml` to project root.** Only inside `worker-additions/`.
4. **No em dashes in user-facing text.** The articles already follow this — if you find any during verification, flag them (do not edit the article prose without asking; the author-byline drafts were approved by Evan).
5. **One commit per section.** No batching.
6. **Pages deploys via git push.** No `wrangler deploy` for the frontend.
7. **Deploy order doesn't matter here** since no Worker changes are involved. Just git push.
8. **If `scripts/generate-blog-data.js` runs as prebuild,** don't hand-edit `blog-latest.json` or the SEO block in `index.html`. Let the script do it. Verify the diff after.
9. **If `scripts/generate-blog-data.js` does NOT run automatically,** run it manually before committing and include the regenerated files in the commit.

No gates on this spec. It can land in parallel with `cc-spec-stuck-panels.md` and `cc-spec-new-panels.md`. Pure content/infra, zero dashboard risk.
