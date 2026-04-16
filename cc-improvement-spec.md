# CC Improvement Spec: Frontend, Backend, and Performance

Priority order. Do each as a separate commit.

---

## 1. Analytics (DO FIRST - 2 minutes)

Add Plausible analytics to index.html. This is the single highest-impact change because we're flying blind on 350+ daily visits.

Option A (paid, easiest): Sign up at plausible.io, add to `<head>` in index.html:
```html
<script defer data-domain="terminalfeed.io" src="https://plausible.io/js/script.js"></script>
```

Option B (free, self-hosted): Use Umami. Deploy on Vercel free tier or Cloudflare Worker.
Add to `<head>`:
```html
<script defer src="https://your-umami.vercel.app/script.js" data-website-id="YOUR_ID"></script>
```

Option C (free, simple): Use Cloudflare Web Analytics (already have Cloudflare):
Add to `<head>`:
```html
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
```

Cloudflare Web Analytics is probably the best move since you're already on Cloudflare. Free, privacy-friendly, no cookie banner needed. Enable it in Cloudflare Dashboard > Analytics > Web Analytics.

Also add to all major subpages: live.html, blog/index.html, tools/index.html, agent.html, radio.html, about.html, developers.html, status.html, glossary/index.html, cheatsheets/index.html.

---

## 2. Vite Build Optimization (5 minutes)

Replace vite.config.ts with:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'static-page-rewrites',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const rewrites: Record<string, string> = {
            '/cleaner': '/cleaner.html',
            '/buy': '/buy.html',
            '/buy/thanks': '/buy-thanks.html',
          }
          if (req.url && rewrites[req.url]) {
            req.url = rewrites[req.url]
          }
          next()
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    minify: 'terser',
    reportCompressedSize: true,
    target: 'es2020',
    sourcemap: false,
  },
})
```

This splits React into a separate vendor chunk (cached independently from app code) and enables terser minification for smaller bundles.

---

## 3. robots.txt Update (1 minute)

Replace public/robots.txt with:
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /embed/

Sitemap: https://terminalfeed.io/sitemap.xml
```

This tells crawlers not to index API endpoints directly (they should use /developers for docs) and keeps embed pages out of search results (they're meant for iframe use, not standalone browsing). The API is still accessible, just not indexed.

---

## 4. Service Worker API Caching (15 minutes)

Update public/sw.js to cache API responses as fallbacks:

```javascript
const CACHE_NAME = 'terminalfeed-v4'; // bump version
const API_CACHE = 'terminalfeed-api-v1';
const API_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // API calls: network first, cache fallback
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Don't cache external requests
  if (url.origin !== self.location.origin) return;

  // JS/CSS assets: network first, cache fallback
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Navigation: network first, offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
    return;
  }
});
```

Key change: API responses are now cached in a separate cache (`terminalfeed-api-v1`). If the network fails, the last successful response is returned. This means the dashboard shows stale data instead of broken panels when offline.

---

## 5. Empty Catch Block Sweep (10 minutes)

Find all empty catch blocks in hooks and add minimal logging:

```bash
# Find all empty catches
grep -rn 'catch\s*{' src/hooks/ --include="*.ts"
```

Replace `catch {}` with `catch (e) { /* [hookName] fetch failed */ }` at minimum.
Better: `catch (e) { if (import.meta.env.DEV) console.warn('[hookName]', e); }`

This doesn't affect production but makes dev debugging possible.

---

## 6. Accessibility Pass (30 minutes)

Priority items:

### Panel drag handles
In PanelHead.tsx, add aria attributes:
```tsx
<span className="orgDragHandle" title="Drag to reorder" role="button" aria-label={`Reorder ${panelId} panel`} tabIndex={0}>&#x2807;</span>
```

### Panel arrow buttons
Already have title attributes. Add aria-label:
```tsx
<button className="orgArrow" onClick={() => moveVisual('left')} title="Move left" aria-label={`Move ${panelId} panel left`}>&#9664;</button>
```

### Hide panel button
```tsx
<button className="orgHide" onClick={() => layout.toggleHidden(panelId)} title="Hide panel" aria-label={`Hide ${panelId} panel`}>&#128065;</button>
```

### Skip to content link
Add as first element in App.tsx body:
```tsx
<a href="#main-content" className="skip-link">Skip to dashboard</a>
```
CSS:
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--green);
  color: #000;
  padding: 8px 16px;
  z-index: 9999;
  font-size: 12px;
}
.skip-link:focus {
  top: 0;
}
```

### Panel content areas
Add role="region" and aria-label to each panel wrapper:
```tsx
<div data-panel-id={panelId} role="region" aria-label={`${panelTitle} panel`}>
```

---

## 7. Error Monitoring (10 minutes)

Option A: Sentry (free tier, 5K events/month):
```bash
npm install @sentry/react
```

In main.tsx:
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,
});
```

Wrap ErrorBoundary with Sentry:
```typescript
const SentryErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: <ErrorFallback />,
});
```

Option B: Simple error reporting to Worker (zero cost):
Add a POST /api/error endpoint to the Worker that logs errors to console.log (visible in Cloudflare dashboard). In the ErrorBoundary componentDidCatch:
```typescript
fetch('/api/error', {
  method: 'POST',
  body: JSON.stringify({ error: error.message, stack: error.stack, url: window.location.href }),
}).catch(() => {});
```

This is simpler and keeps everything on Cloudflare.

---

## 8. App.tsx Panel Extraction (45 minutes, can be incremental)

This is the biggest refactor. Do it incrementally, one panel at a time.

### Pattern
Create src/panels/ directory. Each panel becomes its own file:

```typescript
// src/panels/BitcoinPanel.tsx
import { PanelHead } from '../components/PanelHead';
import { BtcMiniChart } from '../components/BtcMiniChart';
import type { BtcPriceData, PriceTick } from '../hooks/useBtcPrice';
import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  priceData: BtcPriceData | null;
  priceHistory: PriceTick[];
  btcIsStale: boolean;
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

export function BitcoinPanel({ priceData, priceHistory, btcIsStale, layout, panelHealth, getGridCols }: Props) {
  const btcPrice = priceData?.price ?? 0;
  const btcChange = priceData?.changePercent24h ?? 0;
  const isUp = btcChange >= 0;

  return (<>
    <PanelHead panelId="bitcoin" isStale={panelHealth.isStale('bitcoin')} layout={layout} getGridCols={getGridCols}>
      {/* ... existing JSX ... */}
    </PanelHead>
    {/* ... rest of panel ... */}
  </>);
}
```

Then in App.tsx:
```typescript
'bitcoin': <BitcoinPanel priceData={priceData} priceHistory={priceHistory} btcIsStale={btcIsStale} layout={layout} panelHealth={panelHealth} getGridCols={getGridCols} />,
```

### Priority order for extraction:
1. BitcoinPanel (most complex, good test case)
2. CryptoPanel
3. WeatherPanel
4. NewsPanel
5. MarketsPanel
6. ...remaining panels

Do NOT try to extract all 30+ at once. Do 3-5 per commit.

---

## 9. App.css Modularization (30 minutes, incremental)

Split App.css into logical files. Create src/styles/:

```
src/styles/
  variables.css      -- CSS custom properties (already partially in index.css)
  layout.css         -- grid, columns, responsive breakpoints
  panels.css         -- panel chrome, headers, status indicators
  typography.css     -- text styles, code blocks
  animations.css     -- transitions, flash effects, pulse
  controls.css       -- buttons, inputs, organize mode, arrows
  ticker.css         -- scrolling tickers (price, sports)
  responsive.css     -- all @media queries consolidated
```

Then App.css becomes just:
```css
@import './styles/variables.css';
@import './styles/layout.css';
@import './styles/panels.css';
@import './styles/typography.css';
@import './styles/animations.css';
@import './styles/controls.css';
@import './styles/ticker.css';
@import './styles/responsive.css';
```

Do this AFTER the panel extraction so you can associate styles with their panels.

---

## 10. PWA Manifest Enhancement (5 minutes)

Update public/manifest.json:
```json
{
  "name": "TerminalFeed - Real-Time Command Center",
  "short_name": "TerminalFeed",
  "description": "Live crypto, stocks, gold, AI news & more. The dashboard for your second monitor.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#080808",
  "theme_color": "#080808",
  "orientation": "any",
  "categories": ["finance", "news", "utilities"],
  "icons": [
    {
      "src": "/logo.png",
      "sizes": "400x400",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/logo.png",
      "sizes": "400x400",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/og-image.png",
      "sizes": "1200x630",
      "type": "image/png",
      "form_factor": "wide",
      "label": "TerminalFeed Dashboard"
    }
  ]
}
```

Key changes: Split icon purposes (some Android devices handle "any maskable" poorly), added screenshots for PWA install prompt.

---

## Priority Order for CC

1. Analytics (Cloudflare Web Analytics) -- 2 min
2. robots.txt update -- 1 min
3. Vite build config -- 5 min
4. Service worker upgrade -- 15 min
5. Empty catch block sweep -- 10 min
6. Manifest.json update -- 5 min
7. Accessibility pass -- 30 min
8. Error monitoring setup -- 10 min
9. Panel extraction (incremental) -- 45 min per batch
10. CSS modularization (after panel extraction) -- 30 min
