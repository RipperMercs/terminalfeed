# CC Spec Round 2: Accessibility, Error Monitoring, Panel Extraction

Priority order. Do each as a separate commit. Test after every change.

---

## 1. Accessibility Pass (30 minutes)

### 1a. PanelHead.tsx - ARIA attributes

Current file: `src/components/PanelHead.tsx` (100 lines)

Update the organize mode controls (lines 89-96) to include ARIA labels:

Replace line 90:
```tsx
<span className="orgDragHandle" title="Drag to reorder">&#x2807;</span>
```
With:
```tsx
<span className="orgDragHandle" title="Drag to reorder" role="button" aria-label={`Reorder ${panelId} panel`} tabIndex={0}>&#x2807;</span>
```

Replace line 91:
```tsx
<button className="orgArrow" onClick={() => moveVisual('left')} title="Move left">&#9664;</button>
```
With:
```tsx
<button className="orgArrow" onClick={() => moveVisual('left')} title="Move left" aria-label={`Move ${panelId} panel left`}>&#9664;</button>
```

Same pattern for up (line 92), down (line 93), right (line 94):
```tsx
<button className="orgArrow" onClick={() => moveVisual('up')} title="Move up" aria-label={`Move ${panelId} panel up`}>&#9650;</button>
<button className="orgArrow" onClick={() => moveVisual('down')} title="Move down" aria-label={`Move ${panelId} panel down`}>&#9660;</button>
<button className="orgArrow" onClick={() => moveVisual('right')} title="Move right" aria-label={`Move ${panelId} panel right`}>&#9654;</button>
```

Replace line 95:
```tsx
<button className="orgHide" onClick={() => layout.toggleHidden(panelId)} title="Hide panel">&#128065;</button>
```
With:
```tsx
<button className="orgHide" onClick={() => layout.toggleHidden(panelId)} title="Hide panel" aria-label={`Hide ${panelId} panel`}>&#128065;</button>
```

### 1b. Skip to content link

In App.tsx, add as the FIRST element inside the top-level return (before any other JSX):
```tsx
<a href="#main-content" className="skip-link">Skip to dashboard</a>
```

Add the `id="main-content"` attribute to the main grid container div (the one with className="grid").

In App.css, add these styles (anywhere, but near the top layout section is ideal):
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
  font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
}
.skip-link:focus {
  top: 0;
}
```

### 1c. Panel region roles

In App.tsx, every panel wrapper div that has `data-panel-id={panelId}` should also have:
```tsx
role="region" aria-label={`${panelTitle} panel`}
```

Where `panelTitle` is a human-readable name. You can derive this from the ALL_PANELS array or the panel header text. If that's complex, at minimum just use the panelId:
```tsx
role="region" aria-label={`${panelId} panel`}
```

---

## 2. Error Monitoring - Worker Endpoint (10 minutes)

Go with Option B from the original spec: simple POST endpoint on the Worker. Zero cost, zero dependencies.

### 2a. Worker route

Add a POST `/api/error` route to the Worker (`terminalfeed-api`):

```javascript
// Inside the router/fetch handler
if (url.pathname === '/api/error' && request.method === 'POST') {
  try {
    const body = await request.json();
    console.log('[CLIENT_ERROR]', JSON.stringify({
      error: body.error?.substring(0, 500),
      stack: body.stack?.substring(0, 1000),
      url: body.url?.substring(0, 200),
      ua: request.headers.get('user-agent')?.substring(0, 100),
      ts: new Date().toISOString(),
    }));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch {
    return new Response('{}', { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
```

This logs errors to Cloudflare's built-in log viewer (Dashboard > Workers > Logs). Free, no setup, already available.

### 2b. ErrorBoundary integration

Find the ErrorBoundary component (likely in src/components/ or App.tsx). In its `componentDidCatch` method, add:

```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Report to Worker for Cloudflare dashboard visibility
  fetch('/api/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: error.message,
      stack: error.stack,
      url: window.location.href,
      component: errorInfo.componentStack?.substring(0, 500),
    }),
  }).catch(() => {});
}
```

### 2c. Global unhandled error reporter

In main.tsx (or wherever the app bootstraps), add:

```typescript
window.addEventListener('unhandledrejection', (event) => {
  fetch('/api/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: `Unhandled rejection: ${event.reason}`,
      url: window.location.href,
    }),
  }).catch(() => {});
});

window.addEventListener('error', (event) => {
  fetch('/api/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: event.message,
      stack: `${event.filename}:${event.lineno}:${event.colno}`,
      url: window.location.href,
    }),
  }).catch(() => {});
});
```

---

## 3. Empty Catch Block Sweep (10 minutes)

Find all empty catch blocks in hooks:

```bash
grep -rn 'catch\s*{' src/hooks/ --include="*.ts"
grep -rn 'catch\s*(' src/hooks/ --include="*.ts" | grep -v console
```

For each empty catch, add at minimum:
```typescript
catch (e) { if (import.meta.env.DEV) console.warn('[hookName]', e); }
```

Where `[hookName]` is the actual hook filename. This doesn't affect production but makes debugging possible.

Also check:
- `src/services/cache.ts` (the localStorage cache layer)
- `src/App.tsx` (lines 182-184 have an empty catch for newsFilter localStorage)

---

## 4. Panel Extraction - Batch 1 (45 minutes)

Create `src/panels/` directory. Extract 5 panels from App.tsx as a first batch.

### Pattern

Each panel becomes its own file that receives props and returns JSX. The panel's hook stays in `src/hooks/` - we're only moving the JSX rendering, not the data layer.

### 4a. BitcoinPanel.tsx

This is the most complex panel (lines ~325-400 in App.tsx). Create:

```typescript
// src/panels/BitcoinPanel.tsx
import { memo } from 'react';
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

export const BitcoinPanel = memo(function BitcoinPanel({
  priceData, priceHistory, btcIsStale, layout, panelHealth, getGridCols
}: Props) {
  const btcPrice = priceData?.price ?? 0;
  const btcChange = priceData?.changePercent24h ?? 0;
  const isUp = btcChange >= 0;

  return (
    <div data-panel-id="bitcoin" role="region" aria-label="Bitcoin panel">
      <PanelHead panelId="bitcoin" isStale={panelHealth.isStale('bitcoin')} layout={layout} getGridCols={getGridCols}>
        {/* Copy existing PanelHead children from App.tsx */}
      </PanelHead>
      {/* Copy existing panel body JSX from App.tsx */}
    </div>
  );
});
```

Then in App.tsx, replace the bitcoin panel's JSX block with:
```tsx
'bitcoin': <BitcoinPanel priceData={priceData} priceHistory={priceHistory} btcIsStale={btcIsStale} layout={layout} panelHealth={panelHealth} getGridCols={getGridCols} />,
```

### 4b-4e. Same pattern for:

2. **CryptoPanel** - crypto movers panel (uses simCrypto data)
3. **WeatherPanel** - weather panel with WeatherScene (uses weather hook data)
4. **NewsPanel** - HN/RSS news feed (uses hackerNews + rssNews data)
5. **MarketsPanel** - stock prices panel (uses simStocks data)

### Rules for extraction:
- ALWAYS wrap with `memo()` (CLAUDE.md rule #13)
- Keep the `data-panel-id` attribute on the wrapper div
- Add `role="region"` and `aria-label` (combining with accessibility pass)
- Move ONLY the JSX, not the hooks - hooks stay as App.tsx calls
- Type the props interface explicitly
- Test the build after each panel extraction before moving to the next

### In App.tsx after extraction:

The panel rendering section should look like a clean map:
```typescript
const panelRegistry: Record<string, React.ReactNode> = {
  'bitcoin': <BitcoinPanel ... />,
  'crypto': <CryptoPanel ... />,
  'weather': <WeatherPanel ... />,
  'news': <NewsPanel ... />,
  'markets': <MarketsPanel ... />,
  // remaining inline panels for now
  'fear-greed': (<div data-panel-id="fear-greed">...</div>),
  // ...
};
```

---

## 5. ETH Gas Tracker Panel (new feature, 30 minutes)

### 5a. Worker route: `/api/gas`

Add to the Worker:

```javascript
if (url.pathname === '/api/gas') {
  const cacheKey = 'gas_oracle';
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 15000) {
    return jsonResponse(cached.data);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${env.ETHERSCAN_API_KEY}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const json = await res.json();

    if (json.status === '1' && json.result) {
      const data = {
        low: parseInt(json.result.SafeGasPrice),
        standard: parseInt(json.result.ProposeGasPrice),
        fast: parseInt(json.result.FastGasPrice),
        baseFee: parseFloat(json.result.suggestBaseFee),
        lastBlock: parseInt(json.result.LastBlock),
        ts: Date.now(),
      };
      apiCache.set(cacheKey, { data, ts: Date.now() });
      return jsonResponse(data);
    }
  } catch {}

  if (cached) return jsonResponse(cached.data);
  return jsonResponse({ low: 8, standard: 12, fast: 18, baseFee: 7, lastBlock: 0, ts: Date.now() });
}
```

Requires `ETHERSCAN_API_KEY` env var (free at etherscan.io/apis).
**Evan needs to: Register at etherscan.io, get free API key, run `npx wrangler secret put ETHERSCAN_API_KEY`**

### 5b. Hook: `src/hooks/useGasTracker.ts`

```typescript
import { useState, useEffect, useRef } from 'react';

export interface GasData {
  low: number;
  standard: number;
  fast: number;
  baseFee: number;
  lastBlock: number;
  ts: number;
}

export function useGasTracker() {
  const [gas, setGas] = useState<GasData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let cancelled = false;

    const fetchGas = async () => {
      try {
        const res = await fetch('/api/gas');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setGas(data);
      } catch {}
    };

    fetchGas();
    intervalRef.current = setInterval(fetchGas, 15000);

    const onVisChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchGas();
        intervalRef.current = setInterval(fetchGas, 15000);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return gas;
}
```

### 5c. Panel component: `src/panels/GasPanel.tsx`

```typescript
import { memo } from 'react';
import { PanelHead } from '../components/PanelHead';
import type { GasData } from '../hooks/useGasTracker';
import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  gas: GasData | null;
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

function gweiColor(gwei: number): string {
  if (gwei <= 10) return 'var(--green)';
  if (gwei <= 30) return 'var(--amber)';
  return 'var(--red)';
}

export const GasPanel = memo(function GasPanel({ gas, layout, panelHealth, getGridCols }: Props) {
  if (!gas) return null; // Self-healing: hide if no data

  return (
    <div data-panel-id="gas" role="region" aria-label="ETH Gas Tracker panel">
      <PanelHead panelId="gas" isStale={panelHealth.isStale('gas')} layout={layout} getGridCols={getGridCols}>
        <span className="panelTitle">ETH GAS</span>
        <span className="panelSource">ETHERSCAN</span>
        <span className="panelInterval">15s</span>
      </PanelHead>
      <div style={{ padding: '8px 10px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-dim)' }}>SLOW</span>
          <span style={{ color: gweiColor(gas.low) }}>{gas.low} gwei</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>~5 min</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-dim)' }}>STANDARD</span>
          <span style={{ color: gweiColor(gas.standard) }}>{gas.standard} gwei</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>~1 min</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-dim)' }}>FAST</span>
          <span style={{ color: gweiColor(gas.fast) }}>{gas.fast} gwei</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>~15 sec</span>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', fontSize: '10px', color: 'var(--text-dim)' }}>
          Base Fee: {gas.baseFee?.toFixed(1)} gwei
          {gas.lastBlock > 0 && <span style={{ float: 'right' }}>Block: {gas.lastBlock.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  );
});
```

### 5d. Registration

In App.tsx:
1. Import `useGasTracker` and `GasPanel`
2. Call `const gas = useGasTracker();` with the other hooks
3. Add `'gas'` to the panel registry
4. Report to panelHealth

In `src/hooks/useLayoutManager.ts`:
1. Add `'gas'` to ALL_PANELS array (after crypto panels)
2. Add to default panel order
3. **Bump layout version** (currently 32, bump to 33)

---

## 6. Memecoin Radar Panel (new feature, 30 minutes)

### 6a. Worker route: `/api/meme-radar`

```javascript
if (url.pathname === '/api/meme-radar') {
  const cacheKey = 'meme_radar';
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 60000) {
    return jsonResponse(cached.data);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/trending', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const json = await res.json();

    if (json && Array.isArray(json)) {
      const tokens = json
        .filter((t: any) => t.volume?.h24 > 50000)
        .slice(0, 8)
        .map((t: any) => ({
          name: t.baseToken?.name?.substring(0, 20) || 'Unknown',
          symbol: t.baseToken?.symbol?.substring(0, 10) || '???',
          chain: t.chainId || 'unknown',
          price: t.priceUsd ? parseFloat(t.priceUsd) : 0,
          priceChange24h: t.priceChange?.h24 ?? 0,
          volume24h: t.volume?.h24 ?? 0,
          pairUrl: t.url || '',
        }));

      apiCache.set(cacheKey, { data: tokens, ts: Date.now() });
      return jsonResponse(tokens);
    }
  } catch {}

  if (cached) return jsonResponse(cached.data);
  return jsonResponse([]);
}
```

No API key needed - DexScreener is free and keyless.

### 6b. Hook: `src/hooks/useMemecoinRadar.ts`

```typescript
import { useState, useEffect, useRef } from 'react';

export interface MemeToken {
  name: string;
  symbol: string;
  chain: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  pairUrl: string;
}

export function useMemecoinRadar() {
  const [tokens, setTokens] = useState<MemeToken[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let cancelled = false;

    const fetchMemes = async () => {
      try {
        const res = await fetch('/api/meme-radar');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setTokens(data.slice(0, 8));
      } catch {}
    };

    fetchMemes();
    intervalRef.current = setInterval(fetchMemes, 60000);

    const onVisChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchMemes();
        intervalRef.current = setInterval(fetchMemes, 60000);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return tokens;
}
```

### 6c. Panel component: `src/panels/MemeRadarPanel.tsx`

```typescript
import { memo } from 'react';
import { PanelHead } from '../components/PanelHead';
import type { MemeToken } from '../hooks/useMemecoinRadar';
import type { LayoutManager } from '../hooks/useLayoutManager';

interface Props {
  tokens: MemeToken[];
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

export const MemeRadarPanel = memo(function MemeRadarPanel({ tokens, layout, panelHealth, getGridCols }: Props) {
  if (tokens.length === 0) return null; // Self-healing: hide if no data

  return (
    <div data-panel-id="meme-radar" role="region" aria-label="Memecoin Radar panel">
      <PanelHead panelId="meme-radar" isStale={panelHealth.isStale('meme-radar')} layout={layout} getGridCols={getGridCols}>
        <span className="panelTitle">MEMECOIN RADAR</span>
        <span className="panelSource">DEXSCREENER</span>
        <span className="panelInterval">60s</span>
      </PanelHead>
      <div style={{ padding: '4px 10px 8px', fontSize: '11px' }}>
        {tokens.map((t, i) => {
          const isHot = t.priceChange24h > 100;
          const badge = isHot ? 'HOT' : 'NEW';
          const badgeColor = isHot ? 'var(--red)' : 'var(--green)';
          const changeColor = t.priceChange24h >= 0 ? 'var(--green)' : 'var(--red)';

          return (
            <div key={`${t.symbol}-${i}`} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '4px 0', borderBottom: i < tokens.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{
                fontSize: '8px', padding: '1px 4px', borderRadius: '2px',
                background: badgeColor, color: '#000', fontWeight: 700, marginRight: '6px',
              }}>{badge}</span>
              <span style={{ flex: 1, color: 'var(--text-bright)' }}>{t.symbol}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '9px', marginRight: '8px' }}>{t.chain.toUpperCase().substring(0, 5)}</span>
              <span style={{ color: changeColor, minWidth: '60px', textAlign: 'right' }}>
                {t.priceChange24h >= 0 ? '+' : ''}{t.priceChange24h.toFixed(0)}%
              </span>
            </div>
          );
        })}
        <div style={{ marginTop: '6px', fontSize: '9px', color: 'var(--text-dim)', textAlign: 'center' }}>
          High risk. Not financial advice. DYOR.
        </div>
      </div>
    </div>
  );
});
```

### 6d. Registration

Same pattern as Gas panel:
1. Import hook and panel component in App.tsx
2. Call hook, add to panel registry
3. Add 'meme-radar' to ALL_PANELS in useLayoutManager.ts (after crypto panels)
4. Layout version should be 33 (same bump as gas - do both panels in the same version bump)

---

## Priority Order for CC

1. Accessibility pass (PanelHead ARIA + skip link + panel roles) - 30 min
2. Error monitoring Worker endpoint + ErrorBoundary integration - 10 min
3. Empty catch block sweep - 10 min
4. Panel extraction batch 1 (Bitcoin, Crypto, Weather, News, Markets) - 45 min
5. ETH Gas Tracker panel (hook + panel component, Worker route is separate) - 20 min
6. Memecoin Radar panel (hook + panel component, Worker route is separate) - 20 min

**Note on Worker routes:** Items 5 and 6 include Worker route code, but deploying to the Worker requires `npx wrangler deploy`. The frontend hooks and panels can be built and deployed to Pages independently - they'll gracefully handle the missing API endpoints (self-healing rule). Deploy the Worker routes first, then the frontend.

**Note on Gas panel:** Evan needs to register for a free Etherscan API key and run `npx wrangler secret put ETHERSCAN_API_KEY` before the gas endpoint will return real data.
