# CC Spec: Curated Hero Tier + Weighted-Activity Panel Ordering

**Date:** April 22, 2026
**Priority:** HIGH (first-impression surface for new traffic; ships before any AdSense re-approval traffic blitz)
**Scope:** Replace the current default panel order with a two-layer system: a curated editorial "hero tier" directly under the BTC ticker, then a weighted-activity long tail below it. User unlock-and-rearrange still wins and sticks in localStorage exactly as today.

---

## Executive Summary

TerminalFeed's homepage default order was set once, early in the project's life, and has not been revisited as panels were added. As traffic ramps, the first-viewport panel lineup is the most valuable editorial real estate on the site and needs to be designed, not random.

This spec ships three things:

1. A **hero tier** of 6 to 8 editorially-chosen panels placed directly under the BTC ticker. High-signal, high-comprehension, low-frequency panels that benefit from being seen first (Fear and Greed, Prediction Markets, Earthquakes, etc.). These are stable across sessions; the lineup does not shuffle.
2. A **weighted-activity ranking** for every panel below the hero tier. The ranking rewards "something meaningful just happened" relative to a panel's own baseline, so a panel that tends to tick slowly but just spiked floats up, and a panel that ticks constantly (Wikipedia edits) does not automatically dominate.
3. **Backward compatibility:** users who have customized their layout via unlock-and-drag keep exactly what they have. Only visitors with no saved layout, or users who explicitly reset, see the new default.

Random stays as an opt-in preset (`useLayoutManager` already supports it per CLAUDE.md). Do not make it the default. First impressions should be designed.

---

## Sections

### 1. Define the hero tier (editorial)

The hero tier is a fixed, ordered list. Tuned for a first-visit audience who may not yet know why TerminalFeed exists. Every panel in this tier answers the implicit new-visitor question "is something interesting happening right now?"

Proposed hero tier, top to bottom, directly under the BTC price ticker:

1. **`fear-greed`** (Crypto Fear and Greed Index). One glance tells a new visitor whether the market is in extreme fear or extreme greed. Culturally recognized. Strong SEO phrase.
2. **`crypto`** (Top Crypto Movers). Live gainers and losers across the major coins. Reinforces that BTC is the headline but not the whole picture.
3. **`markets`** (Live US Stock Prices). Demonstrates the breadth: not a crypto-only site.
4. **`predictions`** (Live Polymarket Odds). Unique to TerminalFeed vs. most dashboards; great shareability.
5. **`seismic`** (Real-time Earthquake Feed). Universally interesting, visibly moves, real-world stakes.
6. **`launches`** (Upcoming Space Launches). Evergreen curiosity hook. Often has a near-term countdown.
7. **`news`** (Tech and AI News). Keeps developer-leaning visitors anchored.
8. **`gas`** (ETH Gas Tracker). Optional eighth slot: useful for the DeFi audience, and reinforces that the site covers multi-chain activity.

Hero order is **static**, not recomputed per session. Stability of the hero tier is the point. The top 8 are where the editorial voice lives.

Store the hero list as an exported constant in `src/data/defaultLayout.ts`:

```ts
export const HERO_TIER: PanelId[] = [
  'fear-greed', 'crypto', 'markets', 'predictions',
  'seismic', 'launches', 'news', 'gas',
];
```

If you later decide to swap a panel in or out of the hero tier, that is a single-line editorial change and a layout version bump.

### 2. Weighted-activity score for the long tail

Everything NOT in the hero tier gets sorted below it by an activity score. The score rewards recent meaningful change relative to a panel's own baseline, so a slow-ticking panel that just moved ranks above a fast-ticking panel at steady state.

#### 2a. What counts as a "meaningful change"

Each panel declares its own event, lightweight. Not every data refresh is an event. Examples:

| Panel | "Meaningful change" event |
|---|---|
| `crypto` | A coin enters or leaves the top-gainers or top-losers top 5 |
| `fear-greed` | Index shifts by >=5 points |
| `predictions` | A market price changes by >=2%, or a market resolves |
| `seismic` | A new earthquake of M3.0+ arrives |
| `disasters` | A new GDACS alert is added |
| `launches` | A launch enters the T-24h window, or status changes (GO / HOLD / SCRUB) |
| `btc-network` | Mempool size or fee estimate changes by >=15% |
| `gas` | Any tier (slow/standard/fast) changes bucket (green <=10, amber 10 to 30, red >30) |
| `forex` | A major pair moves >=0.3% |
| `whale-watch` | A new >=50 BTC transaction lands |
| `hn-community` | Top story changes |
| `github` | Trending list top-3 changes |
| `gh-events` | New event stream item (already implicit, but sampled) |
| `wiki-live` | Sampled; one event counted per 30s regardless of raw rate (down-weight fast feeds) |
| `tech-news`, `reddit`, `bluesky`, `producthunt`, `stackoverflow` | A new top story appears |
| `weather`, `market-hours`, `humans-in-space`, `this-day`, `nasa-apod`, `ai-leaderboard`, `the-wire`, `daily-paws`, `steam`, `podcasts`, `books`, `npm-trends`, `originals`, `ai-hub`, `cyber-threats`, `claude-status`, `cloud-status`, `service-status` | Default baseline event on meaningful update (per-panel judgment; can ship with a simple heuristic) |

Panels without a defined event fall back to "1 event per data refresh" but with a floor-and-ceiling cap so they do not dominate or disappear.

#### 2b. The score formula

```
score(panel) = baseline(panel) + sum over events in last window of decay(elapsed)
```

where:

- `baseline(panel)` is a small constant (0.1) so every panel has a non-zero starting score and ordering is stable when nothing has happened recently.
- `last window` is 10 minutes.
- `decay(elapsed_seconds) = exp(-elapsed_seconds / 240)` (half-life ~2.77 minutes). Events from a minute ago count nearly full; events from ten minutes ago count very little.

Panels are sorted descending by `score(panel)`. Ties broken by the static `defaultLayout` order so behavior stays deterministic when every panel is at baseline.

Hero tier is NOT scored; hero order is fixed.

#### 2c. Smoothing

Rank changes are applied with a minimum dwell time of **30 seconds** per panel in its current slot. This prevents the long tail from visibly reshuffling every few seconds as events land, which would feel chaotic. The activity score updates continuously in memory; the rendered order re-sorts at most every 30 seconds.

Further smoothing: a panel must gain or lose at least **1 rank position** AND see its score change by at least **20%** before re-ordering. Small noise does not move panels around.

### 3. Implementation

#### 3a. Activity tracker

New file: `src/hooks/usePanelActivity.ts`.

Exports:

```ts
export function recordPanelEvent(panelId: PanelId): void;
export function usePanelActivityScores(): Record<PanelId, number>;
```

`recordPanelEvent` is called by each data hook when its "meaningful change" condition fires. It appends a timestamp to a ring buffer (`Map<PanelId, number[]>`), capped at 50 entries per panel to bound memory.

`usePanelActivityScores` is a hook that returns the current activity score map. Recomputes every 30 seconds via `setInterval` (not faster, per the dwell-time rule). Component subscribers re-render when scores change.

Activity state is **session-scoped** only: it lives in memory, not localStorage. Fresh page load starts every panel at baseline. This is intentional. Reaching a high score requires activity during the current session, not a stale record from yesterday.

#### 3b. Layout manager integration

`src/hooks/useLayoutManager.ts` currently reads from `defaultLayout.ts` when a user has no saved layout or has hit reset. Extend that path to:

1. Emit the `HERO_TIER` constant as the first 8 entries.
2. For the remaining panels, sort by `usePanelActivityScores()` descending, with ties broken by the panel's index in `defaultLayout.ts`.
3. Collapsed and hidden panels follow the existing behavior (they stay at the bottom, hidden).

Users with a saved customized layout go through the exact same code path they do today. Their layout is untouched.

Add a new preset option `'Active'` to the existing presets dropdown (Default, Trader, Developer, News, Everything, Random, **Active**). Selecting `Active` gives you the hero tier + activity-sorted long tail explicitly, even if you have a saved custom layout. `Default` stays as the editorial static lineup without activity sorting (for people who want exactly the order CC ships).

#### 3c. Per-panel hook updates

Each data hook gains a small block that calls `recordPanelEvent` when its meaningful-change condition is met. Keep it colocated with the data-update logic, not scattered:

```ts
import { recordPanelEvent } from './usePanelActivity';

// inside the hook, where new data arrives:
if (didMeaningfullyChange(oldData, newData)) {
  recordPanelEvent('fear-greed');
}
```

Implement hooks in batches of 6 to 8 per commit, same discipline as any other panel work.

### 4. Backward compatibility and migration

- **Do not bump `CURRENT_VERSION`** in `useLayoutManager.ts`. Bumping it forces every existing user back to the new default; that is a destructive migration for anyone who has customized their layout.
- **Users with no saved layout** (new visitors, incognito, users who cleared localStorage) see the new hero + activity-sorted default on first visit.
- **Users with a saved customized layout** keep exactly what they had. They can opt in by selecting the new `Active` preset from the presets dropdown, which overrides their saved order.
- **Users who hit "Reset Layout"** get the new default. Same as today.
- **Random preset** stays as an opt-in. Not the default. Not wired into the activity-sorted long tail; it is its own deterministic-per-session shuffle.

### 5. Optional UI polish (v2, not required for ship)

- Subtle "warming up" indicator on panels whose activity score is trending upward. A small teal dot in the panel header that grows when the panel is above its baseline. Do not use a loud badge; the terminal aesthetic prefers understatement.
- Tooltip on the panel header showing "last meaningful change: X seconds ago" for curious users.
- Presets dropdown gets a short tooltip explaining what `Active` means vs. `Default`.

Ship v2 only after v1 is live and shown to not cause regressions.

### 6. Analytics and validation

Not required for the spec to ship, but worth flagging: once live, track whether the `Active` preset (or the default, which is effectively `Active` for new users) correlates with higher average session depth than the pure static `Default` lineup. If it does, the investment was worth it. If it does not, revisit the weighting formula or the hero tier.

No CC implementation of analytics needed; Evan can instrument this manually via the existing `/api/ai-stats` pattern or Cloudflare Web Analytics.

---

## Execution Order

1. **Section 1** (Hero tier constant + documentation in `defaultLayout.ts`). Single commit. No behavior change yet.
2. **Section 3a** (`usePanelActivity.ts` tracker, no panel integrations yet). Single commit.
3. **Section 3c** (per-panel hook updates, batched 6 to 8 per commit). Approximately 5 commits across crypto, markets, news/social, science/world, dev/AI/status clusters.
4. **Section 3b** (layout manager wiring, `Active` preset added). Single commit.
5. **Section 2c smoothing** (dwell-time and hysteresis rules). Can fold into 3b if timing works, otherwise single commit.
6. **Section 4** (migration/backward compat verification). No commit if 3b is done correctly; otherwise a small fixup commit.
7. **Section 5** (v2 polish). Defer. Separate session.

Total: 7 to 9 commits. No Worker changes. Moderate dashboard risk (changes default layout code path).

---

## Verification Checklist

After each commit:

- [ ] Bundle hash changed
- [ ] Site loads, BTC ticker still ticks
- [ ] No panel crashes
- [ ] Existing users with a saved layout see no change to their order (check in an already-seasoned browser profile)

After Section 3b ships:

- [ ] Incognito visit shows the hero tier directly under BTC in the specified order
- [ ] Below the hero, the remaining panels are sorted by activity
- [ ] Trigger a meaningful change on a slow panel (e.g., watch `seismic` for 10 minutes or use a known-quiet panel) and confirm it moves up
- [ ] Re-order manually via unlock, reload, confirm order persisted
- [ ] Hit reset, confirm the new default returns
- [ ] `Random` preset still works as an explicit opt-in
- [ ] `Active` preset shows the activity-sorted view even over a saved custom layout

Lighthouse / performance:

- [ ] No regression in Performance score (activity tracker is O(events) and capped at 50 per panel)
- [ ] No new memory leaks (ring buffer is bounded, event listeners cleaned up on unmount)

---

## What this spec does NOT cover

- New panels, panel data sources, or API changes
- Per-panel SEO markup (that is `cc-spec-panel-seo.md`)
- Visual redesign of panels
- Server-side activity tracking (all activity state is client-side, session-scoped)
- A/B testing of hero tier compositions
- Internationalization of the `Active` preset label (the existing preset labels are English-only; keep the pattern)
- Mobile-specific ordering rules (mobile gets the same hero tier; the long tail may render differently due to CSS columns but the sort order is the same)

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** Layout manager changes have reach. Smoke-test after each commit.
2. **NEVER add `@cloudflare/vite-plugin`** to the project.
3. **NEVER add `wrangler.jsonc` or `wrangler.toml` to project root.**
4. **NEVER add `wrangler deploy` or `wrangler dev` as npm scripts.**
5. **All external APIs through `/api/*`.** This spec adds no new external calls; all activity detection is derived from data hooks already running.
6. **Null-safe defaults on every API field.** The "meaningful change" detectors compare old and new values; if either is undefined, treat as no event (do not throw).
7. **One commit per section / batch.** No stacking.
8. **No em dashes in any user-facing strings.** Preset label is `Active`, not some em-dashed variant. Commit messages follow the same rule for consistency.
9. **Do NOT bump `CURRENT_VERSION`** in `useLayoutManager.ts`. Preserving existing user layouts is load-bearing.
10. **React.memo on all panels** must survive the integration. The activity score state should live above the panel, not be passed into every panel's props, to avoid re-render storms.
11. **Session-scoped state only** for activity tracking. Do not persist to localStorage. Stale scores are worse than starting fresh.

**Gate:** this spec can land in parallel with em-dash cleanup and per-panel SEO. No external dependency on either.
