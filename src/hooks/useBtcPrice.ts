import { useEffect, useRef, useState, useCallback } from 'react';

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

const WS_RECONNECT_MS = 3000;
const WS_MAX_RECONNECT_MS = 30000;
const STATS_POLL_MS = 60_000;
const MAX_TICKS = 600; // ~10 min of live data
const FALLBACK_DELAY_MS = 8000; // switch to fallback after 8s of no data

export function useBtcPrice() {
  const [data, setData] = useState<BtcPriceData | null>(null);
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

  const pushPrice = useCallback((price: number, source: string) => {
    if (!mountedRef.current) return;
    const now = Date.now();
    setData((prev) => ({
      price,
      prevPrice: prev?.price ?? price,
      ...statsRef.current,
      lastUpdate: now,
      source,
    }));
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

      // Seed price if no WS data yet
      setData((prev) => {
        if (prev) return prev;
        return {
          price: coin.current_price,
          prevPrice: coin.current_price,
          ...statsRef.current,
          lastUpdate: Date.now(),
          source: 'coingecko',
        };
      });
    } catch {}
  }, []);

  // ── Primary: CoinCap WS ──
  const connectPrimary = useCallback(() => {
    if (!mountedRef.current) return;
    if (primaryWsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(COINCAP_WS);
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
          const price = parseFloat(msg.bitcoin);
          if (!price || isNaN(price)) return;
          primaryAlive.current = true;
          pushPrice(price, 'coincap');
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

  // ── Fallback: Binance WS ──
  const connectFallback = useCallback(() => {
    if (!mountedRef.current) return;
    if (fallbackWsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(BINANCE_WS);
      fallbackWsRef.current = ws;

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        // Only use fallback data if primary is dead
        if (primaryAlive.current) return;
        try {
          const msg = JSON.parse(event.data);
          const price = parseFloat(msg.c);
          if (!price || isNaN(price)) return;
          setConnected(true);
          pushPrice(price, 'binance');
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
  }, [connectPrimary, connectFallback, fetchStats]);

  return { data, connected, priceHistory };
}
