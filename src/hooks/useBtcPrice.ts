import { useSyncExternalStore } from 'react';
import { setCache, getCache } from '../services/cache';
import { STATIC_FALLBACKS } from '../data/staticFallbacks';

export interface PriceTick {
  time: number;
  price: number;
}

interface BtcPriceData {
  price: number;
  prevPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdate: number;
  source: string;
}

interface BtcStore {
  data: BtcPriceData | null;
  connected: boolean;
  priceHistory: PriceTick[];
}

// Binance 24hr ticker: fires every ~1s with full daily stats
const BINANCE_WS = 'wss://stream.binance.com:9443/ws/btcusdt@ticker';

// Coinbase ticker: fires per-trade (sub-second). US-reachable, so this is the
// real-time source when Binance's WS is geo-blocked (most US visitors). Without
// it the panel falls back to REST polling, whose source only refreshes ~1x/min.
const COINBASE_WS = 'wss://ws-feed.exchange.coinbase.com';

// Fallback REST (Worker handles upstream)
const BTC_REST_URL = '/api/btc-price';
const BTC_CHART_URL = '/api/coingecko/btc-chart';

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;
const THROTTLE_MS = IS_MOBILE ? 3000 : 1000;
const RECONNECT_MS = 3000;
// Binance answers US visitors with HTTP 451 (geo-block), which is permanent for
// the session: stop after a few attempts instead of hammering a blocked endpoint
// and spamming the console. Coinbase + REST carry the feed.
const MAX_BINANCE_ATTEMPTS = 3;
// Coinbase is the real-time workhorse: retry forever, but back off exponentially
// (3s, 6s, 12s... capped at 60s) so a Coinbase outage doesn't turn into a
// reconnect storm.
const MAX_RECONNECT_MS = 60_000;
const MAX_TICKS = 300;
// When WS is connected, we only need HTTP for volume/market-cap refresh.
// When WS is NOT connected (ad blockers, corporate proxies, Binance blocked),
// HTTP is the primary source: poll faster.
const STATS_POLL_MS_SLOW = 60_000;
const STATS_POLL_MS_FAST = 10_000;
const FRESH_WINDOW_MS = 30_000;

// ---------------------------------------------------------------------------
// Module-level singleton connection engine.
//
// Three components consume this hook (top ticker, BTC hero, Live Now panel).
// When each hook instance owned its own sockets and poller, every visitor
// opened 3 Binance + 3 Coinbase sockets and triple-polled the Worker. One
// engine now feeds all subscribers through useSyncExternalStore; the sockets
// start with the first subscriber and close when the last one unmounts.
// ---------------------------------------------------------------------------

function initialStore(): BtcStore {
  const cached = getCache<BtcPriceData>('btc_price');
  const data = cached ? cached.data : (STATIC_FALLBACKS.btc_price as BtcPriceData);
  let priceHistory: PriceTick[] = [];
  if (cached?.data?.price) {
    // Seed with cached price so chart has at least 1 point immediately
    const now = Date.now();
    priceHistory = [
      { time: now - 60000, price: cached.data.price * 0.9999 },
      { time: now, price: cached.data.price },
    ];
  }
  return { data, connected: false, priceHistory };
}

let store: BtcStore = initialStore();
const listeners = new Set<() => void>();

function emit(patch: Partial<BtcStore>) {
  store = { ...store, ...patch };
  listeners.forEach((l) => l());
}

// Engine state (not React state: lives for the page session)
let engineRunning = false;
let ws: WebSocket | null = null;
let cbWs: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let cbReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let statsInterval: ReturnType<typeof setInterval> | null = null;
let freshnessTimer: ReturnType<typeof setInterval> | null = null;
let currentRate: number | null = null;
let wsOpen = false;
let coinbaseOpen = false;
let wsFailCount = 0;
let cbFailCount = 0;
let lastPushAt = 0;
let lastDataAt = 0;

function pushPrice(price: number, change: number, high: number, low: number, source: string, volumeUsd?: number) {
  if (!engineRunning) return;
  const now = Date.now();
  if (now - lastPushAt < THROTTLE_MS) return;
  lastPushAt = now;
  lastDataAt = now;

  const prev = store.data;
  const updated: BtcPriceData = {
    price,
    prevPrice: prev?.price ?? price,
    change24h: 0,
    changePercent24h: change,
    high24h: high,
    low24h: low,
    volume24h: (volumeUsd && volumeUsd > 0) ? volumeUsd : (prev?.volume24h ?? 0),
    marketCap: prev?.marketCap ?? 0,
    lastUpdate: now,
    source,
  };
  setCache('btc_price', updated, source);

  const nextHistory = [...store.priceHistory, { time: now, price }];
  emit({
    data: updated,
    connected: true,
    priceHistory: nextHistory.length > MAX_TICKS ? nextHistory.slice(-MAX_TICKS) : nextHistory,
  });
}

// Primary: Binance WebSocket (geo-blocked for most US visitors; capped retries)
function connectWS() {
  if (!engineRunning) return;
  if (ws?.readyState === WebSocket.OPEN) return;

  try {
    const sock = new WebSocket(BINANCE_WS); // direct-fetch-exempt: persistent Binance trade WS, not Worker-proxiable
    ws = sock;

    sock.onopen = () => {
      if (!engineRunning) return;
      wsOpen = true;
      wsFailCount = 0;
    };

    sock.onmessage = (event) => {
      if (!engineRunning) return;
      try {
        const d = JSON.parse(event.data);
        const price = parseFloat(d.c);  // current price
        const change = parseFloat(d.P); // 24h change %
        const high = parseFloat(d.h);   // 24h high
        const low = parseFloat(d.l);    // 24h low
        if (price > 0) {
          pushPrice(price, change, high, low, 'binance');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[BtcPrice]', e); }
    };

    sock.onclose = () => {
      if (!engineRunning) return;
      wsOpen = false;
      wsFailCount++;
      if (wsFailCount >= MAX_BINANCE_ATTEMPTS) {
        if (import.meta.env.DEV) console.warn('[BtcPrice] Binance WS unreachable (geo-blocked?); Coinbase/REST carry the feed');
        return;
      }
      reconnectTimer = setTimeout(connectWS, RECONNECT_MS * wsFailCount);
    };

    sock.onerror = () => { sock.close(); };
  } catch {
    wsFailCount++;
    if (wsFailCount < MAX_BINANCE_ATTEMPTS) {
      reconnectTimer = setTimeout(connectWS, 5000);
    }
  }
}

// Secondary real-time WS: Coinbase ticker. Binance's WS is geo-blocked for
// most US visitors, so without this the panel falls back to slow REST polling.
// Coinbase is US-reachable and streams sub-second, restoring the fast-ticking
// price. Both sockets feed the same throttled pushPrice; whichever is
// reachable drives the price.
function connectCoinbaseWS() {
  if (!engineRunning) return;
  if (cbWs?.readyState === WebSocket.OPEN) return;

  try {
    const sock = new WebSocket(COINBASE_WS); // direct-fetch-exempt: persistent Coinbase ticker WS, not Worker-proxiable
    cbWs = sock;

    sock.onopen = () => {
      if (!engineRunning) return;
      coinbaseOpen = true;
      cbFailCount = 0;
      try {
        sock.send(JSON.stringify({ type: 'subscribe', product_ids: ['BTC-USD'], channels: ['ticker'] }));
      } catch { /* socket closed between open and send */ }
    };

    sock.onmessage = (event) => {
      if (!engineRunning) return;
      try {
        const d = JSON.parse(event.data);
        if (d.type !== 'ticker') return;
        const price = parseFloat(d.price);
        if (!(price > 0)) return;
        const open = parseFloat(d.open_24h);   // 24h open
        const high = parseFloat(d.high_24h);
        const low = parseFloat(d.low_24h);
        const volBtc = parseFloat(d.volume_24h); // volume is in BTC
        const change = open > 0 ? ((price - open) / open) * 100 : 0;
        pushPrice(
          price,
          change,
          high > 0 ? high : price,
          low > 0 ? low : price,
          'coinbase',
          volBtc > 0 ? volBtc * price : undefined,
        );
      } catch (e) { if (import.meta.env.DEV) console.warn('[BtcPrice/coinbase]', e); }
    };

    sock.onclose = () => {
      if (!engineRunning) return;
      coinbaseOpen = false;
      const delay = Math.min(RECONNECT_MS * 2 ** cbFailCount, MAX_RECONNECT_MS);
      cbFailCount++;
      cbReconnectTimer = setTimeout(connectCoinbaseWS, delay);
    };

    sock.onerror = () => { sock.close(); };
  } catch {
    const delay = Math.min(5000 * 2 ** cbFailCount, MAX_RECONNECT_MS);
    cbFailCount++;
    cbReconnectTimer = setTimeout(connectCoinbaseWS, delay);
  }
}

// Fallback: REST polling via Worker (if WS fails or is blocked)
async function fetchREST() {
  if (!engineRunning) return;
  try {
    const res = await fetch(BTC_REST_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return;
    const json = await res.json();
    const d = json?.data;
    if (!d || !engineRunning) return;

    const price = d.price_usd;
    if (price > 0) {
      pushPrice(
        price,
        d.change_24h_percent ?? 0,
        d.high_24h ?? price,
        d.low_24h ?? price,
        'worker-rest'
      );

      if (store.data) {
        emit({
          data: {
            ...store.data,
            volume24h: d.volume_24h ?? store.data.volume24h,
            marketCap: d.market_cap ?? store.data.marketCap,
          },
        });
      }
    }
  } catch (e) { if (import.meta.env.DEV) console.warn('[BtcPrice]', e); }
}

// Seed chart with historical data (tries multiple sources)
async function seedChart() {
  if (!engineRunning) return;

  // Skip if WS already delivering data
  if (store.priceHistory.length > 10) return;

  // Try Worker-proxied chart data
  try {
    const res = await fetch(BTC_CHART_URL, { signal: AbortSignal.timeout(5000) });
    if (res.ok && engineRunning) {
      const data = await res.json();
      if (data.prices?.length > 10) {
        const step = Math.max(1, Math.floor(data.prices.length / 100));
        emit({
          priceHistory: data.prices
            .filter((_: [number, number], i: number) => i % step === 0)
            .map((p: [number, number]) => ({ time: p[0], price: p[1] })),
        });
        return;
      }
    }
  } catch (e) { if (import.meta.env.DEV) console.warn('[BtcPrice]', e); }

  // Fallback: use our Worker for current price and build a minimal line
  try {
    const res = await fetch(BTC_REST_URL, { signal: AbortSignal.timeout(5000) });
    if (res.ok && engineRunning) {
      const json = await res.json();
      const price = json.data?.price_usd;
      if (price && store.priceHistory.length <= 5) {
        const now = Date.now();
        // Create a simple 2-point line from the current price
        emit({
          priceHistory: [
            { time: now - 3600000, price: price * (1 - (json.data.change_24h_percent || 0) / 100) },
            { time: now, price },
          ],
        });
      }
    }
  } catch (e) { if (import.meta.env.DEV) console.warn('[BtcPrice]', e); }
}

// Adaptive polling: fast while no WS is open, slow once one is.
// Also drives the `connected` derivation (goes false when data stops flowing).
function schedule() {
  if (!engineRunning) return;
  const desired = (wsOpen || coinbaseOpen) ? STATS_POLL_MS_SLOW : STATS_POLL_MS_FAST;
  if (currentRate === desired) return;
  currentRate = desired;
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = setInterval(() => {
    fetchREST();
    // Re-evaluate rate after each tick (WS may have come back or dropped)
    schedule();
    if (!engineRunning) return;
    if (Date.now() - lastDataAt > FRESH_WINDOW_MS && !wsOpen && !coinbaseOpen && store.connected) {
      emit({ connected: false });
    }
  }, desired);
}

function startEngine() {
  if (engineRunning) return;
  engineRunning = true;
  wsFailCount = 0;
  cbFailCount = 0;
  currentRate = null;

  seedChart();
  connectWS();
  connectCoinbaseWS(); // US-reachable real-time source (Binance WS is often geo-blocked)
  fetchREST(); // immediate first HTTP fetch: covers ad-blocked / blocked-WS users
  schedule();

  // Freshness watchdog: independent of polling cadence so `connected` flips within 5s
  freshnessTimer = setInterval(() => {
    if (!engineRunning) return;
    const stale = Date.now() - lastDataAt > FRESH_WINDOW_MS;
    if (stale && !wsOpen && !coinbaseOpen && store.connected) emit({ connected: false });
  }, 5000);
}

function stopEngine() {
  engineRunning = false;
  wsOpen = false;
  coinbaseOpen = false;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (cbReconnectTimer) { clearTimeout(cbReconnectTimer); cbReconnectTimer = null; }
  if (statsInterval) { clearInterval(statsInterval); statsInterval = null; }
  if (freshnessTimer) { clearInterval(freshnessTimer); freshnessTimer = null; }
  if (ws) { ws.onclose = null; ws.close(); ws = null; }
  if (cbWs) { cbWs.onclose = null; cbWs.close(); cbWs = null; }
}

let subscriberCount = 0;
function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  subscriberCount++;
  if (subscriberCount === 1) startEngine();
  return () => {
    listeners.delete(onChange);
    subscriberCount--;
    if (subscriberCount === 0) stopEngine();
  };
}

function getSnapshot(): BtcStore {
  return store;
}

export function useBtcPrice() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
