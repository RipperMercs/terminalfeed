# CC Spec: Em Dash Audit & SEO Lint Enablement

**Date:** April 22, 2026 (patched same day with three amendments: exemption convention, CLAUDE.md carve-out, visual-diff gate)
**Priority:** MEDIUM (prereq for SEO lint going blocking; unlocks `cc-spec-seo-haul.md` Section 8c)
**Scope:** Find and replace every em dash (U+2014) across the codebase with ASCII punctuation. Enable an em-dash check in the SEO lint script in warning mode first, verify zero violations, clear a visual-diff gate on three live pages, then flip to blocking.

---

## Executive Summary

CLAUDE.md rule #1 has banned em dashes in user-facing text since April 2026. The rule was never fully enforced. CC's recent SEO audit flagged multiple em dashes still live in `index.html`, meta tag strings, a source code comment block, and several blog articles. This spec fixes all of them and adds a lint guard so regressions fail the build.

**Why this matters:** the SEO haul spec (Section 8c) wants a pre-deploy lint that fails on em dashes. Enabling that against the current codebase would break the build immediately. Clean up first, then lint.

**Scope boundaries:**
- Fix: all `.html`, `.md`, `.tsx`, `.ts`, `.jsx`, `.js`, `.css`, `.json` files under `src/`, `public/`, `worker-additions/`, and project root.
- Do not touch: vendor/minified code, `node_modules/`, `.git/`, files inside `cc-specs-archive/`, code-block contents that are explicitly documenting an em dash as an example.
- Do not touch: `CLAUDE.md` (internal working doc for CC, not user-facing), `cc-spec-*.md` files in root (active specs, will be archived when shipped), `design-spec-v2/` (design brief, not shipped code).
- The six Bitcoin Ticker articles (`bitcoin-ticker-*.html`, `best-bitcoin-ticker.html`, `real-time-data-dashboard-2026.html`): already cleaned in Cowork session (6 list-item em dashes fixed in `best-bitcoin-ticker.html` lines 139-144, replaced " — " with ": "). Grep will confirm clean.

---

## Sections

### 1. Inventory

Run a full scan and save the violation list:

```
grep -rn $'—' src/ public/ worker-additions/ *.md *.html 2>/dev/null \
  | grep -v node_modules \
  | grep -v cc-specs-archive \
  | tee /tmp/em-dash-violations.txt
```

Also check for en dashes (U+2013), figure dashes (U+2012), and horizontal bars (U+2015) which sometimes get auto-substituted by editors:

```
grep -rnP '[\x{2012}\x{2013}\x{2014}\x{2015}]' src/ public/ worker-additions/ *.md *.html 2>/dev/null \
  | grep -v node_modules | grep -v cc-specs-archive
```

Report the total count and file breakdown in the commit message.

### 2. Replacement strategy

Em dashes get replaced based on context. Don't do a blind global replace, it produces awkward text. Use these rules, in order:

1. **List-style " — "** (space-em-space used as a bullet or separator) to ", " or ": " depending on flow.
2. **Parenthetical " — ... — "** (em dashes used as parenthetical setters) to ", ... ," or " (... )" depending on how the sentence reads.
3. **Terminal " — phrase"** (em dash before trailing clause) to ". Phrase" (start a new sentence) or ": phrase" if definitional.
4. **Title/tagline em dashes** (e.g. "TerminalFeed — Real-Time Data") to ": " or " | " or drop entirely depending on which reads cleanest.
5. **Dialogue/quote em dashes** (in blog article quotes from external sources): preserve verbatim; these are direct quotes and should not be altered. Flag them in the commit message but do not rewrite them.

Do NOT replace em dashes that appear inside:
- Code-block contents that are literally documenting "the em dash character" as code
- Third-party library code under `node_modules/` or `dist/`
- Git history, cc-specs-archive, or test fixtures that verify em-dash handling
- Any file or line carrying an `em-dash-exempt` marker (see Section 2.5)

### 2.5. Exemption convention

Some files legitimately contain em dashes that MUST be preserved (external quoted material, reference text where the em dash is part of the quoted source). Precedent: the `rule-6-exempt` convention used by the orphan-fetches spec.

**File-level exemption.** Add a comment at the very top of the file. Any file with this header is skipped entirely by the lint grep:

```ts
// em-dash-exempt: external quote material preserved per CLAUDE.md rule #1
```

For HTML files, use an HTML comment on the first line of `<body>`:

```html
<!-- em-dash-exempt: external quote material preserved per CLAUDE.md rule #1 -->
```

**Line-level exemption.** For files where only a specific line or block contains preserved em dashes, add an inline marker on that line (or immediately preceding it for multi-line blocks):

```ts
const quote = "I don't care about your laws — I care about the truth"; // em-dash-exempt: Mitnick quote
```

For HTML `<blockquote>` or `<q>` blocks containing verbatim external quotes, wrap with:

```html
<!-- em-dash-exempt: external quote -->
<blockquote>"The hacker ethic — information should be free — is not optional." — Stallman</blockquote>
<!-- /em-dash-exempt -->
```

**Known files that will need file-level exemption:**
- `src/hooks/useWire.ts` (22 instances, external hacker-culture quotes)
- `src/data/wireQuotes.ts` (13 instances, quoted source material)
- Any blog article quoting external sources verbatim (e.g. 2600 retrospective, Claude Mythos piece)

**The lint must skip exempt content.** Section 4's grep is responsible for excluding both file-level exempt files and line-level exempt lines. See updated lint code below.

### 3. Execute the replacements

Commit in batches by directory to make review easier:

- Commit 1: `fix: replace em dashes in public/*.html (homepage, tool pages, top-level static pages)`
- Commit 2: `fix: replace em dashes in public/blog/*.html`
- Commit 3: `fix: replace em dashes in src/ (components, hooks, panels)`
- Commit 4: `fix: replace em dashes in worker-additions/`
- Commit 5: `fix: replace em dashes in project root *.md files`

Any commit that touches zero files can be skipped. If a category has only 1-2 violations, fold it into an adjacent commit.

### 4. Add the em-dash check to SEO lint (warning mode)

If `scripts/verify-deploy.js` exists (it should per the April 17 incident log), extend it with an em-dash check. The grep must exclude: vendor directories, archived specs, the internal working doc (`CLAUDE.md`), active spec files (`cc-spec-*.md`), design-brief content, and any file or line carrying an `em-dash-exempt` marker:

```js
// em-dash guard
// scope: src/ + public/ only. CLAUDE.md, cc-spec-*.md, and design-spec-v2/ are explicitly excluded
// as non-user-facing working docs. em-dash-exempt files/lines are skipped (see Section 2.5).
const emDashRaw = execSync(
  "grep -rnP '[\\x{2014}]' src/ public/ " +
    "--include='*.html' --include='*.tsx' --include='*.ts' --include='*.jsx' --include='*.js' --include='*.md' " +
    "--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=cc-specs-archive --exclude-dir=design-spec-v2 " +
    "|| true",
  { encoding: 'utf8' }
);

// filter out file-level exemptions (any file whose first 3 lines contain em-dash-exempt)
// and line-level exemptions (any line containing em-dash-exempt)
const emDashFiles = emDashRaw
  .split('\n')
  .filter(line => line && !line.includes('em-dash-exempt'))
  .filter(line => {
    const match = line.match(/^([^:]+):/);
    if (!match) return true;
    const filePath = match[1];
    try {
      const head = execSync(`head -n 3 "${filePath}" 2>/dev/null || true`, { encoding: 'utf8' });
      return !head.includes('em-dash-exempt');
    } catch {
      return true;
    }
  })
  .join('\n');

if (emDashFiles.trim()) {
  console.warn('[seo-lint] em dashes found:');
  console.warn(emDashFiles);
  if (process.env.SEO_LINT_STRICT === '1') {
    console.error('[seo-lint] SEO_LINT_STRICT=1 and em dashes present: failing build');
    process.exit(1);
  }
} else {
  console.log('[seo-lint] em dash check: clean');
}
```

If `scripts/verify-deploy.js` does not exist, create it. Wire it into `package.json` as a `predeploy` or `prebuild` hook.

Deploy this in warning-only mode (no `SEO_LINT_STRICT=1` yet). Confirm the build passes cleanly on the first run (because Sections 1-3 removed all violations and Section 2.5 whitelisted preserved quotes).

Single commit: `feat: add em-dash check to pre-deploy lint (warning mode)`.

### 5. Flip the lint to blocking (visual-diff gate required)

**Do not flip to blocking on a clean grep alone.** Script-assisted replacements can produce comma splices, awkward run-ons, or dropped clauses that pass grep but read badly. The gate has two parts:

**5a. Clean warning-mode deploy.** One successful deploy with the warning-mode lint passing zero violations (after exemption filtering). Confirm by viewing build output: `[seo-lint] em dash check: clean`.

**5b. Visual-diff gate on three live pages.** Read the rendered HTML on the live site (not just the diff). Required checks:

1. **Homepage** (`https://terminalfeed.io/`): spot-check hero, panel headers, footer copy, meta description, OG tags. No awkward comma splices or dropped clauses.
2. **One high-traffic blog article** (suggest `https://terminalfeed.io/blog/building-terminalfeed` or `/blog/fear-greed-guide`): read top-to-bottom for prose flow. Pay attention to sentences that previously had parenthetical em-dash pairs (rule 2 in Section 2) where the replacement comma might have created ambiguity.
3. **One tool page** (suggest `https://terminalfeed.io/tools/json`): check headings, description copy, instructional text.

If any of the three reveal a replacement that reads badly, fix with a targeted commit before proceeding. Do not batch visual-gate fixes with the blocking-flip commit.

**5c. Flip the switch.** Once the visual gate is clear, set `SEO_LINT_STRICT=1` in the CI environment (or flip the default in the script) and re-deploy.

From this point forward, any PR or push that introduces an em dash in a monitored file path (outside the Section 2.5 exempt convention) fails the build.

Single commit: `feat: make em-dash lint a blocking check`.

### 6. Optional: pre-commit hook

If a husky or similar pre-commit hook already exists, add an em-dash grep to it so violations are caught before the commit, not at deploy time. If no pre-commit infra exists, skip this section.

---

## Execution Order

1. Section 1: Inventory. No commit.
2. Section 2.5: Add `em-dash-exempt` headers to known preserved-quote files (`useWire.ts`, `wireQuotes.ts`, any affected blog article). Single commit: `fix: mark external-quote files em-dash-exempt per spec convention`.
3. Sections 2-3: Replacements in batches. 3-5 commits.
4. Section 4: Warning-mode lint. Single commit.
5. Section 5a: Wait for one clean warning-mode deploy. No commit.
6. Section 5b: Visual-diff gate on homepage + one blog article + one tool page. Fix-up commits only if needed.
7. Section 5c: Blocking-flip commit.
8. Section 6: Optional pre-commit hook. Single commit if relevant.

Total: 6-9 commits. Zero dashboard risk. Zero Worker changes.

---

## Verification Checklist

- [ ] `grep -rn $'—' src/ public/ worker-additions/ 2>/dev/null | grep -v node_modules | grep -v cc-specs-archive | grep -v design-spec-v2 | grep -v em-dash-exempt` returns empty (after filtering file-level exempt files)
- [ ] `useWire.ts`, `wireQuotes.ts`, and any external-quote blog articles carry the `em-dash-exempt` file-level header
- [ ] `npm run build` passes with warning-mode lint enabled; build output shows `[seo-lint] em dash check: clean`
- [ ] Visual-diff gate (Section 5b) cleared on all three pages: homepage, `/blog/building-terminalfeed` (or similar), `/tools/json`
- [ ] `SEO_LINT_STRICT=1 npm run build` passes after the visual gate is cleared
- [ ] `curl https://terminalfeed.io/ | grep -c $'—'` returns 0
- [ ] `curl https://terminalfeed.io/blog/bitcoin-ticker-explained | grep -c $'—'` returns 0 (sanity check on a new article)
- [ ] `curl https://terminalfeed.io/blog/building-terminalfeed | grep -c $'—'` returns 0 (sanity check on a high-traffic older article)

---

## What this spec does NOT cover

- General copyediting or prose improvements beyond em-dash replacement
- Smart-quote normalization, ellipsis characters, non-breaking spaces, or other typographic cleanups (could be a separate spec if value warrants)
- Lint rules beyond em-dash (SEO haul Section 8c has the full lint plan; this spec only enables the em-dash subset)
- Editing direct external quotes in blog articles (preserve verbatim with attribution)

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** This spec only changes text characters and adds a lint step. Low risk, but spot-check live pages after each commit.
2. **Context-sensitive replacement.** Do not run a blind sed `s/—/,/g` across the codebase. Each occurrence needs a judgment call per Section 2 rules.
3. **Preserve direct quotes via the exempt convention.** If a file contains external quoted material with em dashes, add the `em-dash-exempt` header per Section 2.5 instead of rewriting the quote. File-level for fully-quoted files (`useWire.ts`, `wireQuotes.ts`), inline marker or HTML comment wrapper for mixed files.
4. **One commit per directory batch** per Section 3. Never batch "fix em dashes everywhere" into a single commit.
5. **Warning mode first, visual-diff gate second, blocking third.** The grep passing clean is not sufficient to flip the lint. Section 5b visual gate on three live pages is mandatory.
6. **Do not touch `cc-specs-archive/`, `CLAUDE.md`, `cc-spec-*.md` (active specs), or `design-spec-v2/`.** All are scoped out of the lint and out of Section 3 batches.
7. **Do not touch `node_modules/` or `dist/`.** Vendor/build output is not ours to edit.
8. **The six Bitcoin Ticker articles are already clean.** Do not re-process them; grep will confirm.

---

## Shipped (added when archived, 2026-04-22)

Executed across this session. Result summary for future reference:

- **Total em-dashes cleaned:** ~280 across the lint scope (`src/` + `public/`).
- **Commits:** 8 directory-batched commits (index.html, public top-level + team, public/tools, src/ + exempt headers, public prose, src prose, script tooling, warning-mode lint).
- **Script tooling added:** `scripts/fix-em-dashes.js` (conservative mechanical-pattern pass + aggressive line pass with 400-char prose cap).
- **Exempt files:** `src/hooks/useWire.ts`, `src/data/wireQuotes.ts` (file-level headers applied).
- **Lint:** `scripts/verify-deploy.js` extended with em-dash scanner, respects file-level + line-level + inline HTML exempt markers, warning mode by default, `SEO_LINT_STRICT=1` switches to blocking.
- **Visual-diff gate:** pending Evan's spot-check on homepage + `/blog/building-terminalfeed` + `/tools/json` before flipping to strict.
- **Remaining known violations:** none in the lint scope outside exempt files. The six Bitcoin Ticker articles pre-cleaned by Evan in Cowork.
