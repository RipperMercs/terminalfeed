# CC Spec — Panel Polish & Index Updates

**Date:** April 20, 2026 (revised April 20, 2026 — Memecoin Radar removed per editorial policy)
**Priority:** HIGH (after `cc-spec-stuck-panels.md` lands)
**Scope:** Deprecate the `/api/meme-radar` Worker route, polish the ETH Gas Tracker panel, expand blog/tools indexes, and surface the new sections in navigation.

---

## Editorial Policy Change (read first)

**Memecoins are out.** Per updated `CLAUDE.md` Editorial Policy (April 20, 2026):
- No dedicated memecoin panels.
- No memecoin-focused blog content, tools, or API endpoints.
- General `crypto` panel (top movers by market cap / 24h change) stays.
- Focus on Bitcoin as primary subject, with ETH / SOL as supporting context where relevant.
- `/api/meme-radar` Worker route is DEPRECATED and must be removed in this spec.

If a prior version of this spec instructed you to add a `meme-radar` panel, **ignore those instructions**. The current spec below is authoritative.

---

## Executive Summary

Live audit of `terminalfeed.io` on April 20, 2026 found:

- **Fitness panel:** removed from registry ✓
- **ETH Gas panel (`gas`):** registered, `/api/gas` returns live data, but panel is stuck on `loading...` — **fix in `cc-spec-stuck-panels.md` Section 0** (render bug). This spec only covers visual polish once that lands.
- **Memecoin Radar panel:** NOT in the registry (stays that way per editorial policy). `/api/meme-radar` Worker route still exists and must be deprecated.
- **Flight Radar panel:** no longer in the registry. If it comes back, the self-healing timeout from `cc-spec-stuck-panels.md` will cover it.
- **Blog index, tools index, navigation:** need updates for the pages added since the last indexer run.

**Do NOT start the ETH Gas polish section until `cc-spec-stuck-panels.md` Section 0 has shipped and the re-audit shows zero `loading...` placeholders.** The Worker-only sections (memecoin deprecation, index updates) can land in parallel.

---

## Sections

### 1. Deprecate and remove `/api/meme-radar` Worker route

Per editorial policy (no memecoin surfaces). The route exists in the Worker but is no longer referenced by any frontend panel. Clean it up.

**Steps:**

1. In `worker-additions/src/`, locate the route handler for `/api/meme-radar` (grep for `meme-radar`).
2. Remove the handler, the route registration, and any related helper functions (DexScreener fetch, in-memory cache entry, etc.).
3. Remove any tests referencing `/api/meme-radar`.
4. If there's a frontend hook file like `src/hooks/useMemecoinRadar.ts` or panel component like `src/components/panels/MemecoinRadarPanel.tsx`, remove those too.
5. Remove from `panelRegistry` and `defaultLayout.ts` if any orphan references remain.
6. Bump layout version in `useLayoutManager.ts` to force-refresh any user who had the panel cached in their layout.
7. Deploy Worker first, then frontend.
8. After deploy, verify `curl https://terminalfeed.io/api/meme-radar` returns 404 (not 200).

Single commit. Commit message: `chore: deprecate memecoin radar per editorial policy`.

### 2. ETH Gas panel visualization polish

**Only start this after the render bug is fixed and the panel actually displays.**

Current `/api/gas` returns:

```json
{ "low": 8, "standard": 12, "fast": 18, "baseFee": 7, "lastBlock": 0, "ts": 1776747558755 }
```

`lastBlock: 0` suggests the Worker isn't capturing the block number — check `worker-additions/src/routes/gas.ts` and confirm it's parsing the Etherscan response correctly.

**Panel additions:**

- Add a 5-minute trend arrow: compare current `standard` gwei to 5-min-old value, show ▲ / ▼ / ▬
- Color thresholds on `low/standard/fast`:
  - `<10 gwei` → `var(--green)`
  - `10–30 gwei` → `var(--amber)`
  - `>30 gwei` → `var(--red)`
- L2 row: show static estimates for Arbitrum, Base, Optimism, Polygon (not critical to wire up live — they're labelled "estimated")
- USD equivalent per tier using the live BTC/ETH price already in the panel ecosystem — use `(gwei * 21000 * ethPriceUSD * 1e-9).toFixed(2)` for a simple ETH transfer.

### 3. Blog index update

Run `node scripts/generate-blog-data.js` to refresh `/public/blog-latest.json` after every new article commit.

New articles that need cards on `/blog/index.html`:

```
cron-decoded
browser-extensions-watching
real-time-vs-near-real-time
rest-vs-graphql
websocket-vs-sse
claude-vs-chatgpt
```

Also update:
- `/public/feed.xml` — new RSS entries for each article
- `/public/sitemap.xml` — add the 6 new blog slugs

Each card on the blog index follows the existing card pattern: title, author persona tag, category, date, 2-line excerpt, read link.

### 4. Tools index update

Add cards on `/tools/index.html` for:

- `/tools/satoshi` — Satoshi / BTC converter
- `/tools/gwei` — Gwei / ETH / USD calculator
- `/tools/hex` — Hex / RGB / decimal converter

Also update:
- `/public/sitemap.xml` — add the 3 new tool slugs

### 5. Navigation updates

Main nav or footer should surface:

- `/status` — "Is It Down" status tracker
- `/cheatsheets` — Developer Cheatsheets (Git, Docker, HTTP)

Do not add more than 6 top-level nav items. If the nav is already at 6, put these in the footer instead.

### 6. Sitemap batch update

New URLs to add to `/public/sitemap.xml` (full list from previous session):

```
/status
/tools/satoshi
/tools/gwei
/tools/hex
/cheatsheets
/cheatsheets/git
/cheatsheets/docker
/cheatsheets/http
/blog/cron-decoded
/blog/browser-extensions-watching
/blog/real-time-vs-near-real-time
/blog/rest-vs-graphql
/blog/websocket-vs-sse
/blog/claude-vs-chatgpt
```

Plus 25 new glossary pages (see glossary spec).

Submit the refreshed sitemap to Google Search Console after deploy.

---

## Execution Order

1. **Section 1** — Deprecate `/api/meme-radar` and remove any orphan code. Worker first, frontend second. Can run anytime, not gated.
2. **Gate check for Section 2:** Confirm `cc-spec-stuck-panels.md` Section 0 has landed and re-audit shows zero `loading...` placeholders. If not, STOP. Fix that first before polishing.
3. **Section 2** — ETH Gas polish. Single commit.
4. **Section 3** — Blog index + feed.xml. Single commit.
5. **Section 4** — Tools index. Single commit.
6. **Section 5** — Nav updates. Single commit.
7. **Section 6** — Sitemap batch. Single commit.

---

## Verification Checklist

After every commit:

- [ ] Bundle hash changed
- [ ] Site still loads (critical — no crashes)
- [ ] For Section 1: `curl https://terminalfeed.io/api/meme-radar` returns 404; `grep -ri "meme.radar\|memecoin\|MemeRadar" src/ worker-additions/` returns zero matches; no `data-panel-id="meme-radar"` anywhere in DOM
- [ ] For Section 3/4: `/blog`, `/tools`, `/feed.xml`, `/sitemap.xml` all return 200 with updated content
- [ ] For Section 5: nav items present, no visual regressions on mobile/desktop
- [ ] BTC hero still ticking live (no regressions)

---

## What this spec does NOT cover

- The stuck-panels render bug — that's `cc-spec-stuck-panels.md`.
- Related Articles / Tools blog footer component — that's `cc-spec-related-content.md`.
- Dashboard redesign via Claude Design — separate track.
- Backend API endpoint additions beyond what `/api/meme-radar` already provides.

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** Every new panel needs its own `ErrorBoundary`. Null-safe defaults on every API field.
2. **NEVER add `@cloudflare/vite-plugin`** to the project. Converts Pages to Workers, destroys deploy.
3. **NEVER add `wrangler.jsonc` or `wrangler.toml` to project root.** Only inside `worker-additions/`.
4. **NEVER add `wrangler deploy` or `wrangler dev` as npm scripts.** Pages deploys via git push (or `wrangler pages deploy dist` for manual).
5. **Deploy order: Worker first, frontend second.** Never deploy a panel that calls a Worker route that doesn't exist yet.
6. **All external APIs through `/api/*` Worker.** No direct browser fetches to DexScreener.
7. **One commit per section.** No batching.
8. **No em dashes in user-facing text.**
9. **Layout version bump in `useLayoutManager.ts`** for every new panel added.
10. **Bump the prebuild script** after every new article so `blog-latest.json` and the SEO content block in `index.html` update automatically.

Gate: this spec does NOT run until the render bug in `cc-spec-stuck-panels.md` Section 0 is fixed. Adding a new panel to a broken panel shell means the new panel will also be stuck. Verify the fix with a browser-level bundle regex + DOM loading-placeholder count BEFORE starting Section 1.
