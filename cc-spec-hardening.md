# TerminalFeed Hardening Spec — Round 3

**Date:** April 15, 2026  
**Author:** Cowork (spec only -- CC executes all changes)  
**Priority:** CRITICAL > HIGH > MEDIUM

---

## 1. Per-Panel ErrorBoundary Isolation [CRITICAL]

**Problem:** A single panel calling `.toFixed()` on undefined data crashed the entire site. No panel should ever be able to take down the dashboard.

**Implementation:**

Create `src/components/PanelErrorBoundary.tsx`:

```tsx
import React from 'react';

interface Props {
  panelName: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class PanelErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // POST to /api/error so we see it in Cloudflare logs
    fetch('/api/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `[PanelCrash:${this.props.panelName}] ${error.message}`,
        stack: info.componentStack?.substring(0, 1000) || '',
        url: window.location.href,
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) return null; // hide crashed panel silently
    return this.props.children;
  }
}

export default PanelErrorBoundary;
```

Then wrap EVERY panel in `App.tsx` like:

```tsx
<PanelErrorBoundary panelName="MemeRadar">
  <MemeRadarPanel />
</PanelErrorBoundary>
```

Do this for all 32+ panels. No exceptions. The render method returns `null` on error -- the panel just disappears instead of nuking the site.

---

## 2. Null-Safe Audit Across All Panels [CRITICAL]

**Problem:** Multiple panels likely have the same `.toFixed()` / `.toUpperCase()` / `.substring()` vulnerability that killed MemeRadarPanel.

**Instructions for CC:**

1. Search the entire `src/` directory for these patterns:
   - `.toFixed(` without a preceding `?? ` or `|| ` on the same line
   - `.toUpperCase(` without a preceding `?? ''` or `|| ''`
   - `.toLowerCase(` without a preceding `?? ''` or `|| ''`
   - `.substring(` without a preceding `?? ''` or `|| ''`
   - `.slice(` on a value that could be undefined (not on a literal array)
   - `.toString(` without null check
   - `.split(` without null check
   - `.trim(` without null check
   - `.replace(` without null check
   - `.includes(` on a potentially undefined string or array

2. For EVERY match, apply the pattern:
   - Numbers: `(value ?? 0).toFixed(2)` 
   - Strings: `(value ?? '').toUpperCase()`
   - Arrays: `(value ?? []).map(...)`

3. Also audit every `.map()` callback that renders JSX -- every field accessed inside must have a fallback.

4. Priority files to audit first (panels that consume external API data):
   - `src/panels/CryptoPanel.tsx`
   - `src/panels/StocksPanel.tsx`  
   - `src/panels/MemeRadarPanel.tsx`
   - `src/panels/GasTrackerPanel.tsx`
   - `src/panels/EarthquakePanel.tsx`
   - `src/panels/PredictionMarketsPanel.tsx`
   - `src/panels/CyberThreatsPanel.tsx`
   - `src/panels/ServiceStatusPanel.tsx`
   - `src/panels/ForexPanel.tsx`
   - `src/panels/EconomicDataPanel.tsx`
   - `src/panels/WhaleWatchPanel.tsx`
   - `src/panels/LaunchesPanel.tsx`
   - All panels in `App.tsx` that haven't been extracted yet

---

## 3. Route CORS-Failing Calls Through Worker [HIGH]

**Problem:** Console showed CORS errors for direct browser calls to external services. All external API calls must go through `/api/*`.

**Calls to audit and fix:**

1. **Frankfurter API** (forex rates) -- if any panel calls `api.frankfurter.app` directly, route through existing `/api/forex`
2. **Status checks** (GitHub, Cloudflare, Discord, OpenAI, Vercel, npm, Reddit, Atlassian, Stripe, AWS, Anthropic, Slack, Zoom) -- if ServiceStatusPanel is calling status pages directly, all should go through `/api/service-status`
3. **Any other direct external calls** -- search `src/` for `fetch('http` that doesn't start with `fetch('/api/` or `fetch(window.location`

**For CC:** Run this search across all `.tsx` and `.ts` files in `src/`:
```
grep -rn "fetch('http" src/ --include="*.tsx" --include="*.ts"
grep -rn 'fetch("http' src/ --include="*.tsx" --include="*.ts"
```

Every match that isn't going through `/api/` needs to be rerouted through the Worker. If a Worker endpoint doesn't exist yet for that data source, add one to `worker-additions/worker.js` first, deploy the Worker, THEN update the frontend.

---

## 4. Global Error Boundary as Final Safety Net [HIGH]

**Problem:** Even with per-panel ErrorBoundaries, a crash in the layout code, ticker, status bar, or top-level component would still take down the site.

**Implementation:**

Create `src/components/AppErrorBoundary.tsx`:

```tsx
import React from 'react';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    fetch('/api/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `[APP_CRASH] ${error.message}`,
        stack: info.componentStack?.substring(0, 1000) || '',
        url: window.location.href,
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#0A0A0C',
          color: '#5DCAA5',
          fontFamily: 'JetBrains Mono, monospace',
          padding: 40,
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>&gt;_ TerminalFeed</h1>
          <p style={{ color: '#8A8880', fontSize: 14 }}>
            Dashboard temporarily unavailable. Refreshing in 10 seconds...
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
```

Wrap the entire app in `main.tsx`:

```tsx
<AppErrorBoundary>
  <App />
</AppErrorBoundary>
```

Add a `useEffect` in the fallback or a script tag to auto-reload after 10 seconds. This is the absolute last line of defense. If everything else fails, users see a branded "refreshing..." screen instead of a white page.

---

## 5. Pre-Deploy Verification Script [HIGH]

**Problem:** Dangerous packages and config files were added without realizing the consequences. Need automated guardrails.

**Create `scripts/verify-deploy.js`:**

```js
const fs = require('fs');
const path = require('path');

let errors = 0;

// 1. No root-level wrangler config
['wrangler.jsonc', 'wrangler.toml', 'wrangler.json'].forEach(f => {
  if (fs.existsSync(path.join(__dirname, '..', f))) {
    console.error('FATAL: ' + f + ' found at project root. This will destroy the Pages project.');
    errors++;
  }
});

// 2. No @cloudflare/vite-plugin in package.json
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
if (allDeps['@cloudflare/vite-plugin']) {
  console.error('FATAL: @cloudflare/vite-plugin found in package.json. This converts Pages to Workers.');
  errors++;
}

// 3. No wrangler deploy/dev in scripts
Object.entries(pkg.scripts || {}).forEach(([name, cmd]) => {
  if (cmd.includes('wrangler deploy') || cmd.includes('wrangler dev')) {
    console.error('FATAL: npm script "' + name + '" contains wrangler deploy/dev. Pages deploys via git push only.');
    errors++;
  }
});

// 4. vite.config.ts doesn't import cloudflare
const viteConfig = fs.readFileSync(path.join(__dirname, '..', 'vite.config.ts'), 'utf8');
if (viteConfig.includes('@cloudflare/vite-plugin') || viteConfig.includes('cloudflare()')) {
  console.error('FATAL: vite.config.ts contains @cloudflare/vite-plugin references.');
  errors++;
}

// 5. package.json is valid JSON (catches truncation)
try {
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
} catch (e) {
  console.error('FATAL: package.json is not valid JSON. File may be corrupted.');
  errors++;
}

if (errors > 0) {
  console.error('\n' + errors + ' FATAL error(s) found. DO NOT DEPLOY.');
  process.exit(1);
} else {
  console.log('All deploy safety checks passed.');
}
```

Add to `package.json` scripts:

```json
"verify": "node scripts/verify-deploy.js",
"prebuild": "node scripts/verify-deploy.js && node scripts/generate-blog-data.js"
```

This runs automatically on every build. If anyone adds a dangerous package or config, the build fails BEFORE it reaches Cloudflare.

---

## 6. Empty Catch Block Sweep [MEDIUM]

**Problem:** Empty `catch {}` blocks swallow errors silently, making debugging impossible.

**For CC:** Search all `.tsx` and `.ts` files for empty catch blocks:

```
grep -rn "catch.*{" src/ --include="*.tsx" --include="*.ts" -A1
```

Every empty catch should at minimum log to console:

```ts
catch (e) {
  console.error('[PanelName] fetch failed:', e instanceof Error ? e.message : e);
}
```

For panels that are critical (BTC, Stocks, Crypto), also POST to `/api/error`.

---

## 7. TypeScript Strict Null Checks [MEDIUM]

**Problem:** TypeScript isn't catching undefined access because `strictNullChecks` may not be enabled.

**For CC:** Check `tsconfig.json`. If `strictNullChecks` is not `true`, set it:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

This will surface compile-time errors for every unguarded `.toFixed()` and `.toUpperCase()` call, catching them BEFORE deploy instead of in production. Expect a lot of new errors -- fix them all with `?? fallback` patterns. This is a one-time investment that prevents the entire class of "undefined method call" crashes permanently.

---

## 8. Worker Health Check Endpoint [MEDIUM]

**Problem:** No easy way to verify the Worker is running and all routes are functional.

**Add to `worker-additions/worker.js`:**

```js
case 'health':
  return jsonResponse({
    status: 'ok',
    version: '2.1.0',  // bump on each deploy
    routes: 24,         // update when adding routes
    uptime: Date.now() - workerStartTime,
    ts: Date.now(),
  });
```

Add `var workerStartTime = Date.now();` at the top of the Worker file (outside the fetch handler).

This gives a quick way to verify the Worker is alive and responding. Could also be used by an external uptime monitor later.

---

## 9. Stale Data Indicator on Panels [LOW]

**Problem:** Panels can silently show stale data for hours without users knowing.

**Pattern for all data-fetching panels:**

Track `lastUpdated` timestamp in state. If data is older than 2x the expected refresh interval, show a subtle indicator:

```tsx
{isStale && (
  <span style={{ color: '#EF9F27', fontSize: 9, marginLeft: 8 }} title="Data may be stale">
    STALE
  </span>
)}
```

Use the amber warning color (#EF9F27) to match the design system. Keep it tiny and unobtrusive -- just enough that power users notice.

---

## 10. Panel Extraction Continuation [LOW]

**Problem:** `App.tsx` is 1,486+ lines. Makes it hard to audit, hard to add ErrorBoundaries, and easy to introduce bugs.

**For CC:** Continue extracting panels into `src/panels/` as individual files. Each panel gets:
- Its own `.tsx` file in `src/panels/`
- `React.memo` wrapper
- Own `useEffect` for data fetching
- Own error handling (try/catch with fallback rendering)
- Wrapped in `PanelErrorBoundary` when imported into `App.tsx`

Do this incrementally, one panel at a time, with a build verification after each extraction.

---

## Execution Order

1. **ErrorBoundaries** (sections 1 + 4) -- immediate, prevents any future panel from crashing the site
2. **Null-safe audit** (section 2) -- immediate, fixes existing vulnerabilities  
3. **Pre-deploy verification script** (section 5) -- immediate, prevents infrastructure destruction
4. **CORS fixes** (section 3) -- this week, fixes console errors
5. **Empty catch blocks** (section 6) -- this week, improves debugging
6. **TypeScript strict nulls** (section 7) -- this week, long-term prevention
7. **Worker health check** (section 8) -- when convenient
8. **Stale indicators** (section 9) -- when convenient
9. **Panel extraction** (section 10) -- ongoing

---

Each section is independent and can be executed as a standalone CC task. One change at a time, test after each, commit after each. No batching.
