import { useEffect, useRef, useState, useCallback } from 'react';
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

export function useBtcPrice() {
  const [data, setData] = useState<BtcPriceData | null>(() => {
    const cached = getCache<BtcPriceData>('btc_price');
    if (cached) return cached.data;
    return STATIC_FALLBACKS.btc_price as BtcPriceData;
  });
  // `connected` = fresh data flowing from any source (WS or HTTP) in the last FRESH_WINDOW_MS
  const [connected, setConnected] = useState(false);
  const wsOpenRef = useRef(false);
  const coinbaseOpenRef = useRef(false);
  const lastDataAtRef = useRef(0);
  const [priceHistory, setPriceHistory] = useState<PriceTick[]>(() => {
    // Seed with cached price so chart has at least 1 point immediately
    const cached = getCache<BtcPriceData>('btc_price');
    if (cached?.data?.price) {
      const now = Date.now();
      return [
        { time: now - 60000, price: cached.data.price * 0.9999 },
        { time: now, price: cached.data.price },
      ];
    }
    return [];
  });

  const mountedRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cbWsRef = useRef<WebSocket | null>(null);
  const cbReconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushRef = useRef(0);
  const wsFailCount = useRef(0);
  const cbFailCount = useRef(0);
  // Mirrors priceHistory.length so seedChart can check it WITHOUT depending on
  // state. Depending on priceHistory.length gave seedChart (and therefore the
  // main effect) a new identity on every tick, so every price update tore down
  // and reopened both WebSockets mid-handshake and re-fired fetchREST, ~1/s,
  // until the tick buffer hit MAX_TICKS. That was the July 18 2026 churn bug.
  const historyLenRef = useRef(priceHistory.length);

  // Push a new price update
  const pushPrice = useCallback((price: number, change: number, high: number, low: number, source: string, volumeUsd?: number) => {
    if (!mountedRef.current) return;
    const now = Date.now();
    if (now - lastPushRef.current < THROTTLE_MS) return;
    lastPushRef.current = now;
    lastDataAtRef.current = now;
    setConnected(true);

    setData(prev => {
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
      return updated;
    });

    setPriceHistory(prev => {
      const next = [...prev, { time: now, price }];
      const capped = next.length > MAX_TICKS ? next.slice(-MAX_TICKS) : next;
      historyLenRef.current = capped.length;
      return capped;
    });
  }, []);

  // Primary: Binance WebSocket
  const connectWS = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(BINANCE_WS); // direct-fetch-exempt: persistent Binance trade WS, not Worker-proxiable
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        wsOpenRef.current = true;
        wsFailCount.current = 0;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
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

      ws.onclose = () => {
        if (!mountedRef.current) return;
        wsOpenRef.current = false;
        wsFailCount.current++;
        if (wsFailCount.current >= MAX_BINANCE_ATTEMPTS) {
          if (import.meta.env.DEV) console.warn('[BtcPrice] Binance WS unreachable (geo-blocked?); Coinbase/REST carry the feed');
          return;
        }
        reconnectTimer.current = setTimeout(connectWS, RECONNECT_MS * wsFailCount.current);
      };

      ws.onerror = () => { ws.close(); };
    } catch {
      wsFailCount.current++;
      if (wsFailCount.current < MAX_BINANCE_ATTEMPTS) {
        reconnectTimer.current = setTimeout(connectWS, 5000);
      }
    }
  }, [pushPrice]);

  // Secondary real-time WS: Coinbase ticker. Binance's WS is geo-blocked for
  // most US visitors, so without this the panel falls back to slow REST polling.
  // Coinbase is US-reachable and streams sub-second, restoring the fast-ticking
  // price. Both sockets feed the same throttled pushPrice; whichever is
  // reachable drives the price.
  const connectCoinbaseWS = useCallback(() => {
    if (!mountedRef.current) return;
    if (cbWsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(COINBASE_WS); // direct-fetch-exempt: persistent Coinbase ticker WS, not Worker-proxiable
      cbWsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        coinbaseOpenRef.current = true;
        cbFailCount.current = 0;
        try {
          ws.send(JSON.stringify({ type: 'subscribe', product_ids: ['BTC-USD'], channels: ['ticker'] }));
        } catch { /* socket closed between open and send */ }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
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

      ws.onclose = () => {
        if (!mountedRef.current) return;
        coinbaseOpenRef.current = false;
        const delay = Math.min(RECONNECT_MS * 2 ** cbFailCount.current, MAX_RECONNECT_MS);
        cbFailCount.current++;
        cbReconnectTimer.current = setTimeout(connectCoinbaseWS, delay);
      };

      ws.onerror = () => { ws.close(); };
    } catch {
      const delay = Math.min(5000 * 2 ** cbFailCount.current, MAX_RECONNECT_MS);
      cbFailCount.current++;
      cbReconnectTimer.current = setTimeout(connectCoinbaseWS, delay);
    }
  }, [pushPrice]);

  // Fallback: REST polling via Worker (if WS fails or is blocked)
  const fetchREST = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch(BTC_REST_URL, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const json = await res.json();
      const d = json?.data;
      if (!d || !mountedRef.current) return;

      const price = d.price_usd;
      if (price > 0) {
        pushPrice(
          price,
          d.change_24h_percent ?? 0,
          d.high_24h ?? price,
          d.low_24h ?? price,
          'worker-rest'
        );

        setData(prev => prev ? {
          ...prev,
          volume24h: d.volume_24h ?? prev.volume24h,
          marketCap: d.market_cap ?? prev.marketCap,
        } : prev);
      }
    } catch (e) { if (import.meta.env.DEV) console.warn('[BtcPrice]', e); }
  }, [pushPrice]);

  // Seed chart with historical data (tries multiple sources). Reads the tick
  // count from historyLenRef, NOT priceHistory state: a state dep here changes
  // this callback's identity every tick and re-runs the main effect (see the
  // historyLenRef comment above).
  const seedChart = useCallback(async () => {
    if (!mountedRef.current) return;

    // Skip if WS already delivering data
    if (historyLenRef.current > 10) return;

    // Try Worker-proxied chart data
    try {
      const res = await fetch(BTC_CHART_URL, { signal: AbortSignal.timeout(5000) });
      if (res.ok && mountedRef.current) {
        const data = await res.json();
        if (data.prices?.length > 10) {
          const step = Math.max(1, Math.floor(data.prices.length / 100));
          const seeded = data.prices
            .filter((_: [number, number], i: number) => i % step === 0)
            .map((p: [number, number]) => ({ time: p[0], price: p[1] }));
          historyLenRef.current = seeded.length;
          setPriceHistory(seeded);
          return;
        }
      }
    } catch (e) { if (import.meta.env.DEV) console.warn('[BtcPrice]', e); }

    // Fallback: use our Worker for current price and build a minimal line
    try {
      const res = await fetch('/api/btc-price', { signal: AbortSignal.timeout(5000) });
      if (res.ok && mountedRef.current) {
        const json = await res.json();
        const price = json.data?.price_usd;
        if (price) {
          const now = Date.now();
          // Create a simple 2-point line from the current price
          setPriceHistory(prev => {
            if (prev.length > 5) return prev;
            const line = [
              { time: now - 3600000, price: price * (1 - (json.data.change_24h_percent || 0) / 100) },
              { time: now, price },
            ];
            historyLenRef.current = line.length;
            return line;
          });
        }
      }
    } catch (e) { if (import.meta.env.DEV) console.warn('[BtcPrice]', e); }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    seedChart();
    connectWS();
    connectCoinbaseWS(); // US-reachable real-time source (Binance WS is often geo-blocked)
    fetchREST(); // immediate first HTTP fetch: covers ad-blocked / blocked-WS users

    // Adaptive polling: fast while WS isn't open, slow once it is.
    // Also drives the `connected` derivation (goes false when last data > FRESH_WINDOW_MS old).
    let statsInterval: ReturnType<typeof setInterval> | null = null;
    let currentRate: number | null = null;
    const schedule = () => {
      const desired = (wsOpenRef.current || coinbaseOpenRef.current) ? STATS_POLL_MS_SLOW : STATS_POLL_MS_FAST;
      if (currentRate === desired) return;
      currentRate = desired;
      if (statsInterval) clearInterval(statsInterval);
      statsInterval = setInterval(() => {
        fetchREST();
        // Re-evaluate rate after each tick (WS may have come back or dropped)
        schedule();
        // Drop `connected` if nothing fresh recently
        if (!mountedRef.current) return;
        if (Date.now() - lastDataAtRef.current > FRESH_WINDOW_MS && !wsOpenRef.current && !coinbaseOpenRef.current) {
          setConnected(false);
        }
      }, desired);
    };
    schedule();

    // Freshness watchdog: independent of polling cadence so `connected` flips within 5s
    const freshnessTimer = setInterval(() => {
      if (!mountedRef.current) return;
      const stale = Date.now() - lastDataAtRef.current > FRESH_WINDOW_MS;
      if (stale && !wsOpenRef.current && !coinbaseOpenRef.current) setConnected(false);
    }, 5000);

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
      if (cbReconnectTimer.current) clearTimeout(cbReconnectTimer.current);
      if (cbWsRef.current) { cbWsRef.current.onclose = null; cbWsRef.current.close(); }
      if (statsInterval) clearInterval(statsInterval);
      clearInterval(freshnessTimer);
    };
  }, [connectWS, connectCoinbaseWS, fetchREST, seedChart]);

  return { data, connected, priceHistory };
}
