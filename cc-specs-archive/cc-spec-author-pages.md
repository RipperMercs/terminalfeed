# CC Spec: Author Profile Pages (/team/[slug])

**Date:** April 24, 2026
**Priority:** MEDIUM-HIGH (SEO compounding; closes the Article-schema author-URL loop; pairs with shipped SEO haul Phases 1-2)
**Scope:** Build five permanent author profile pages at `/team/ripper`, `/team/zer0day`, `/team/pulse`, `/team/node`, `/team/signal`. Each page lists every article that author has bylined, renders Person + WebPage schema, and becomes the canonical destination for byline links across the entire blog system. Update existing Article-schema entries to point `author.url` at the new profile pages.

---

## Executive Summary

Every blog article on TerminalFeed already credits one of five author personas (Ripper, zer0day, Pulse, Node, Signal). Today those bylines link to the consolidated `/team` page or to nothing. That wastes SEO weight and breaks the Article schema's `author` reference, which expects a per-author URL.

This spec ships:

1. Five static author profile pages, one per persona, listing every article that author has bylined plus a short biographical block, area-of-focus tags, and Person schema.
2. Updated Article schema across all ~26 existing blog articles so `author.url` points at the new profile page.
3. Byline crosslinks: every blog article author tag becomes a do-follow link to the matching profile.
4. Updated `/team` page rows linking to the new profiles.
5. Sitemap + RSS feed updates.

**Why this matters:** Article schema is currently passing `author.name` without `author.url`. Search engines treat that as weaker authorship signal than a fully-resolved Person entity. Each author profile becomes a topical hub with 5-10 internal links pointing at it (one per byline) and 5-10 outbound links (one per archive entry), creating meaningful internal-link equity. Free SEO uplift on existing inventory, no new content required.

**Scope boundaries:**
- Five pages only. Do not create profile pages for guest contributors or anyone outside the five-persona editorial team.
- Do not edit article prose. Only the `<script type="application/ld+json">` Article-schema block and the byline `<a>` tag get touched.
- Do not modify the existing `/team` page content beyond converting each persona row's byline link into a profile URL.

---

## Sections

### 1. Inspect existing /team architecture and match pattern

Before building, determine how `/team` is currently implemented:

```
ls /sessions/jolly-dazzling-hamilton/mnt/terminalfeed/public/team* 2>/dev/null
ls /sessions/jolly-dazzling-hamilton/mnt/terminalfeed/src/pages/team* 2>/dev/null
grep -rn "Editorial team" src/ public/ 2>/dev/null | head -20
```

If `/team` is a static HTML file at `/public/team.html`, build profile pages as static HTML at `/public/team/[slug].html` to match. If `/team` is a React route under `src/pages/`, build profiles as React routes. **Do not invent a new pattern.** Per CLAUDE.md rule "match existing patterns."

Default assumption (verify first): blog articles are static HTML at `/public/blog/[slug].html`. The /team page likely follows the same pattern. Profile pages should match.

### 2. Author data file

Create `src/data/authors.ts` (or `/public/team/authors.json` if static-HTML pattern):

```ts
export interface AuthorProfile {
  slug: 'ripper' | 'zer0day' | 'pulse' | 'node' | 'signal';
  displayName: string;
  role: string;
  beats: string[];
  bio: string;
  joined: string; // ISO date
  socials?: { x?: string; github?: string };
}

export const AUTHORS: AuthorProfile[] = [
  {
    slug: 'ripper',
    displayName: 'Ripper',
    role: 'Founder & Editor-in-Chief',
    beats: ['product', 'weekly originals', 'the meta'],
    bio: 'Builds TerminalFeed solo. Sound designer and composer by training, full-stack engineer by necessity. Writes the Friday Founder column.',
    joined: '2026-01-15',
    socials: { x: 'https://x.com/RipperMercs' },
  },
  {
    slug: 'zer0day',
    displayName: 'zer0day',
    role: 'Security Correspondent',
    beats: ['cybersecurity', 'privacy', 'hacker culture'],
    bio: 'Covers vulnerabilities, breach analysis, surveillance trends, and the cultural side of the security world. Wednesday "Wire Wednesday" beat.',
    joined: '2026-02-01',
  },
  {
    slug: 'pulse',
    displayName: 'Pulse',
    role: 'Market Analyst',
    beats: ['crypto', 'stocks', 'prediction markets', 'macroeconomics'],
    bio: 'Reads the tape. Monday "Market Monday" recaps and standalone analysis pieces. Bitcoin-first, allergic to memecoin coverage.',
    joined: '2026-02-01',
  },
  {
    slug: 'node',
    displayName: 'Node',
    role: 'Developer Advocate',
    beats: ['APIs', 'developer tools', 'protocols', 'tutorials'],
    bio: 'Tuesday "Tool Tuesday" beat. Writes how-to guides, API explainers, and architecture decision records.',
    joined: '2026-02-01',
  },
  {
    slug: 'signal',
    displayName: 'Signal',
    role: 'Data & AI Editor',
    beats: ['AI agents', 'machine learning', 'data feeds', 'automation'],
    bio: 'Thursday "Data Thursday" beat. Tracks the agent ecosystem and the infrastructure that feeds it.',
    joined: '2026-02-01',
  },
];
```

Bios above are starter copy. Evan can edit before deploy if any read off-brand. None contain em dashes (per rule #1) or any external quotes.

### 3. Profile page template

Each `/team/[slug]` page renders:

1. Header: display name + role + beats (as small tags).
2. Bio paragraph (1-3 sentences from `authors.ts`).
3. Article archive: chronological list (newest first) of every article this author bylined. Pull from `/public/blog-latest.json` if it stores all articles, or extend `scripts/generate-blog-data.js` to also write `/public/team/[slug]-articles.json`.
4. Optional: latest 3 articles in card format (matches blog index card pattern). Below that, a flat list with title + date for the rest.
5. Cross-links: "More from the team" footer linking to the four other profile pages.
6. JSON-LD: Person + WebPage schema (Section 4).
7. Breadcrumb: Home > Team > [Author Name].

Match the blog article visual treatment: same dark background, same JetBrains Mono, same teal accents. No new components — reuse whatever the blog index card and /team row use today.

### 4. Schema.org Person + WebPage

Each profile page includes a JSON-LD block:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Ripper",
  "url": "https://terminalfeed.io/team/ripper",
  "jobTitle": "Founder & Editor-in-Chief",
  "worksFor": {
    "@type": "Organization",
    "name": "TerminalFeed",
    "url": "https://terminalfeed.io"
  },
  "knowsAbout": ["product", "weekly originals", "the meta"],
  "sameAs": ["https://x.com/RipperMercs"]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "url": "https://terminalfeed.io/team/ripper",
  "mainEntity": { "@type": "Person", "name": "Ripper" },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://terminalfeed.io" },
      { "@type": "ListItem", "position": 2, "name": "Team", "item": "https://terminalfeed.io/team" },
      { "@type": "ListItem", "position": 3, "name": "Ripper", "item": "https://terminalfeed.io/team/ripper" }
    ]
  }
}
</script>
```

Repeat per author with the right values pulled from `AUTHORS`.

### 5. Update existing Article schema across all blog articles

Every blog article currently has an Article schema block. The `author` field today is one of:

```json
{ "@type": "Person", "name": "Pulse" }
```

Update it everywhere to:

```json
{ "@type": "Person", "name": "Pulse", "url": "https://terminalfeed.io/team/pulse" }
```

Affected files: every HTML file in `/public/blog/*.html` and `/public/blog/originals/*.html`. Roughly 26 articles.

**Strategy:** scriptable. Author name maps deterministically to slug (Pulse → pulse, zer0day → zer0day, etc.). A small Node script can find each Article schema block, look up the author's slug, and inject the URL field. Run the script, review the diff, commit.

Commit: `feat: add author.url to Article schema across blog articles`.

### 6. Update byline crosslinks

Every blog article header has a byline like:

```html
<span class="byline">By <a href="/team">Pulse</a></span>
```

Replace with:

```html
<span class="byline">By <a href="/team/pulse">Pulse</a></span>
```

Same script as Section 5 can do this in the same pass. Commit together: `feat: link bylines to author profile pages`.

### 7. Update /team page rows

Each persona row on the existing /team page becomes a card linking to the profile. Minimal change — wrap the existing row with `<a href="/team/[slug]">` or replace inline byline link.

Commit: `refactor: link /team rows to author profile pages`.

### 8. Sitemap, RSS, and llms.txt

Add the five new URLs to `/public/sitemap.xml`:

```xml
<url><loc>https://terminalfeed.io/team/ripper</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
<url><loc>https://terminalfeed.io/team/zer0day</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
<url><loc>https://terminalfeed.io/team/pulse</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
<url><loc>https://terminalfeed.io/team/node</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
<url><loc>https://terminalfeed.io/team/signal</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
```

Add a section to `/public/llms.txt`:

```
## Editorial Team
- Ripper: https://terminalfeed.io/team/ripper (founder, weekly originals)
- zer0day: https://terminalfeed.io/team/zer0day (security, privacy, hacker culture)
- Pulse: https://terminalfeed.io/team/pulse (markets, crypto, predictions)
- Node: https://terminalfeed.io/team/node (APIs, developer tools, tutorials)
- Signal: https://terminalfeed.io/team/signal (AI agents, data, automation)
```

RSS feed (`/public/feed.xml`) does not need URL changes (already references articles, not authors), but the `<author>` tag in each `<item>` should resolve to a real email if not already present. Optional polish, not required for shipping.

Commit: `feat: add author profile URLs to sitemap and llms.txt`.

---

## Execution Order

1. Section 1: Inspect existing patterns. No commit.
2. Section 2: `src/data/authors.ts` (or JSON equivalent). Single commit: `feat: add author profile data`.
3. Sections 3-4: Build the five profile pages with schema. Single commit: `feat: add author profile pages with Person/WebPage schema`.
4. Sections 5-6: Article schema author.url + byline crosslinks (script-driven sweep). Single commit: `feat: link bylines and Article schema to author profile pages`.
5. Section 7: /team page row linkification. Single commit.
6. Section 8: Sitemap + llms.txt updates. Single commit.

Total: 5 commits. Zero Worker changes. Zero panel changes. Zero risk to dashboard.

---

## Verification Checklist

- [ ] All five profile URLs return 200: `/team/ripper`, `/team/zer0day`, `/team/pulse`, `/team/node`, `/team/signal`
- [ ] Each profile page lists every article that author has bylined (cross-check against the daily-content schedule in CLAUDE.md)
- [ ] Person schema validates in Google Rich Results Test (https://search.google.com/test/rich-results)
- [ ] BreadcrumbList schema validates on each profile
- [ ] `curl https://terminalfeed.io/blog/fear-greed-guide | grep -A2 '"author"'` shows the new `url` field
- [ ] `curl https://terminalfeed.io/blog/building-terminalfeed | grep '/team/ripper'` finds the byline link
- [ ] `/team` page rows now link to `/team/[slug]`, not just `/team`
- [ ] Sitemap.xml contains all five new URLs
- [ ] llms.txt contains the Editorial Team section
- [ ] No em dashes introduced (per rule #1; the lint will catch this if Section 5 of the em-dash spec is wired)
- [ ] Each profile page's article archive links work and load correctly
- [ ] Mobile rendering: profile pages stack cleanly, no horizontal scroll, no layout breaks

---

## What this spec does NOT cover

- New author personas. Five-persona editorial team is fixed per CLAUDE.md.
- Author photos, avatars, or visual portraits. Optional later polish.
- Per-author RSS feeds (e.g. `/team/pulse/feed.xml`). Possible follow-up if any author profile gains traction.
- Author-specific dashboards or analytics surfaces.
- Editing existing article prose, even if it would read better with the new author URL nearby.
- Schema.org NewsMediaOrganization or similar parent-org schema beyond what's already on the homepage.

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** Pure additive content pages plus a JSON-LD field swap. Low risk, but verify each commit doesn't break the blog index, /team, or any article page.
2. **Match existing patterns.** Section 1 is mandatory. If /team is static HTML, profiles are static HTML. If React, React. No mixing.
3. **No em dashes.** Bios in `authors.ts` and any new copy must use ASCII punctuation. The em-dash lint will catch regressions if Section 5 of `cc-spec-em-dash-audit.md` is wired.
4. **Script-driven sweep for Sections 5-6.** Twenty-six articles is too many to hand-edit. Write a small Node script, run it, review diff, commit.
5. **Author slug is canonical.** `ripper`, `zer0day` (with the zero, not `zeroday`), `pulse`, `node`, `signal`. Lowercase. No dashes in slugs.
6. **Do not touch article prose.** Only the JSON-LD block and the byline `<a>` tag.
7. **Run the prebuild blog-data script after deploy.** If `scripts/generate-blog-data.js` is the source of truth for author counts, regenerate so the new profile pages show accurate archive lists.
8. **One commit per section** per the execution order. Never fold "add profiles + sweep articles" into one commit.
