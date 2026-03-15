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

// ── Primary: CoinCap WebSocket ──
const COINCAP_WS = 'wss://ws.coincap.io/prices?assets=bitcoin';

// ── Fallback: Binance WebSocket ──
const BINANCE_WS = 'wss://stream.binance.com:9443/ws/btcusdt@ticker';

// ── Last resort: CoinGecko REST ──
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false';
const COINGECKO_CHART_URL =
  'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1';

const WS_RECONNECT_MS = 3000;
const WS_MAX_RECONNECT_MS = 30000;
const STATS_POLL_MS = 60_000;
const MAX_TICKS = 600;
const FALLBACK_DELAY_MS = 8000;
const PRICE_THROTTLE_MS = 1000; // update display max once per second

export function useBtcPrice() {
  // Initialize from cache or static fallback — never show $0.00
  const [data, setData] = useState<BtcPriceData | null>(() => {
    const cached = getCache<BtcPriceData>('btc_price');
    if (cached) return cached.data;
    return STATIC_FALLBACKS.btc_price as BtcPriceData;
  });
  const [connected, setConnected] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceTick[]>([]);

  const mountedRef = useRef(true);
  const primaryWsRef = useRef<WebSocket | null>(null);
  const fallbackWsRef = useRef<WebSocket | null>(null);
  const primaryReconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackReconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackActivateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectDelay = useRef(WS_RECONNECT_MS);
  const primaryAlive = useRef(false);

  const statsRef = useRef({
    change24h: 0,
    changePercent24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0,
    marketCap: 0,
  });

  const lastPushRef = useRef(0);

  const pushPrice = useCallback((price: number, source: string) => {
    if (!mountedRef.current) return;
    const now = Date.now();
    // Throttle display updates to 1 per second (WebSocket fires many times/sec)
    if (now - lastPushRef.current < PRICE_THROTTLE_MS) return;
    lastPushRef.current = now;
    const newData = {
      price,
      prevPrice: 0,
      ...statsRef.current,
      lastUpdate: now,
      source,
    };
    setData((prev) => {
      newData.prevPrice = prev?.price ?? price;
      setCache('btc_price', { ...newData, prevPrice: newData.prevPrice }, source);
      return { ...newData, prevPrice: newData.prevPrice };
    });
    setPriceHistory((prev) => {
      const next = [...prev, { time: now, price }];
      return next.length > MAX_TICKS ? next.slice(-MAX_TICKS) : next;
    });
  }, []);

  // ── CoinGecko REST (24h stats + last resort price) ──
  const fetchStats = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch(COINGECKO_URL);
      if (!res.ok) return;
      const [coin] = await res.json();
      if (!mountedRef.current) return;

      statsRef.current = {
        change24h: coin.price_change_24h ?? 0,
        changePercent24h: coin.price_change_percentage_24h ?? 0,
        high24h: coin.high_24h ?? 0,
        low24h: coin.low_24h ?? 0,
        volume24h: coin.total_volume ?? 0,
        marketCap: coin.market_cap ?? 0,
      };

      // Always update price from CoinGecko — it's accurate and has 24h stats
      const newPrice = coin.current_price;
      if (newPrice && newPrice > 0) {
        setData((prev) => {
          const updated = {
            price: newPrice,
            prevPrice: prev?.price ?? newPrice,
            ...statsRef.current,
            lastUpdate: Date.now(),
            source: 'coingecko',
          };
          setCache('btc_price', updated, 'coingecko');
          return updated;
        });
        setConnected(true);
      }
    } catch {}

    // If CoinGecko failed, try blockchain.info as backup
    if (!mountedRef.current) return;
    try {
      const res = await fetch('https://blockchain.info/ticker', { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return;
      const data = await res.json();
      const btcUsd = data?.USD?.last;
      if (!btcUsd || !mountedRef.current) return;

      // Only use if we don't have fresh CoinGecko data
      setData((prev) => {
        if (prev && prev.source === 'coingecko' && Date.now() - prev.lastUpdate < 120_000) return prev;
        const updated = {
          price: btcUsd,
          prevPrice: prev?.price ?? btcUsd,
          ...statsRef.current,
          lastUpdate: Date.now(),
          source: 'blockchain.info',
        };
        setCache('btc_price', updated, 'blockchain.info');
        return updated;
      });
      setConnected(true);
    } catch {}
  }, []);

  // ── Seed chart with 24h historical data ──
  const seedChart = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch(COINGECKO_CHART_URL);
      if (!res.ok) return;
      const data = await res.json();
      if (!mountedRef.current || !data.prices) return;

      // Only seed if we don't have WS ticks yet
      setPriceHistory((prev) => {
        if (prev.length > 10) return prev; // WS already delivering
        // Sample ~200 points from the 24h data
        const prices: PriceTick[] = data.prices.map((p: [number, number]) => ({
          time: p[0],
          price: p[1],
        }));
        // Take every Nth point to get ~200 data points
        const step = Math.max(1, Math.floor(prices.length / 200));
        return prices.filter((_: PriceTick, i: number) => i % step === 0);
      });
    } catch {}
  }, []);

  // ── Primary: Binance WS (fires every trade — real-time) ──
  const connectPrimary = useCallback(() => {
    if (!mountedRef.current) return;
    if (primaryWsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(BINANCE_WS);
      primaryWsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        primaryAlive.current = true;
        setConnected(true);
        reconnectDelay.current = WS_RECONNECT_MS;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          const price = parseFloat(msg.c); // current price from Binance ticker
          if (!price || isNaN(price)) return;
          primaryAlive.current = true;
          pushPrice(price, 'binance');
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        primaryAlive.current = false;
        setConnected(false);
        primaryReconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, WS_MAX_RECONNECT_MS);
          connectPrimary();
        }, reconnectDelay.current);
      };

      ws.onerror = () => { ws.close(); };
    } catch {}
  }, [pushPrice]);

  // ── Fallback: CoinCap WS ──
  const connectFallback = useCallback(() => {
    if (!mountedRef.current) return;
    if (fallbackWsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(COINCAP_WS);
      fallbackWsRef.current = ws;

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        if (primaryAlive.current) return;
        try {
          const msg = JSON.parse(event.data);
          const price = parseFloat(msg.bitcoin);
          if (!price || isNaN(price)) return;
          setConnected(true);
          pushPrice(price, 'coincap');
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        fallbackReconnectTimer.current = setTimeout(connectFallback, 10000);
      };

      ws.onerror = () => { ws.close(); };
    } catch {}
  }, [pushPrice]);

  useEffect(() => {
    mountedRef.current = true;

    // Seed chart with historical data immediately
    seedChart();

    // Start primary
    connectPrimary();

    // Start 24h stats polling
    fetchStats();
    statsTimer.current = setInterval(fetchStats, STATS_POLL_MS);

    // Activate fallback after delay if primary hasn't sent data
    fallbackActivateTimer.current = setTimeout(() => {
      if (!primaryAlive.current) {
        connectFallback();
      }
    }, FALLBACK_DELAY_MS);

    return () => {
      mountedRef.current = false;
      if (primaryReconnectTimer.current) clearTimeout(primaryReconnectTimer.current);
      if (fallbackReconnectTimer.current) clearTimeout(fallbackReconnectTimer.current);
      if (fallbackActivateTimer.current) clearTimeout(fallbackActivateTimer.current);
      if (statsTimer.current) clearInterval(statsTimer.current);
      if (primaryWsRef.current) { primaryWsRef.current.onclose = null; primaryWsRef.current.close(); }
      if (fallbackWsRef.current) { fallbackWsRef.current.onclose = null; fallbackWsRef.current.close(); }
    };
  }, [connectPrimary, connectFallback, fetchStats, seedChart]);

  return { data, connected, priceHistory };
}
