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

// Binance 24hr ticker — fires every ~1s with full daily stats
const BINANCE_WS = 'wss://stream.binance.com:9443/ws/btcusdt@ticker';

// Fallback REST
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false';

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;
const THROTTLE_MS = IS_MOBILE ? 3000 : 1000;
const RECONNECT_MS = 3000;
const MAX_TICKS = 300;
const STATS_POLL_MS = 60_000;

export function useBtcPrice() {
  const [data, setData] = useState<BtcPriceData | null>(() => {
    const cached = getCache<BtcPriceData>('btc_price');
    if (cached) return cached.data;
    return STATIC_FALLBACKS.btc_price as BtcPriceData;
  });
  const [connected, setConnected] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceTick[]>([]);

  const mountedRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushRef = useRef(0);
  const wsFailCount = useRef(0);

  // Push a new price update
  const pushPrice = useCallback((price: number, change: number, high: number, low: number, source: string) => {
    if (!mountedRef.current) return;
    const now = Date.now();
    if (now - lastPushRef.current < THROTTLE_MS) return;
    lastPushRef.current = now;

    setData(prev => {
      const updated: BtcPriceData = {
        price,
        prevPrice: prev?.price ?? price,
        change24h: 0,
        changePercent24h: change,
        high24h: high,
        low24h: low,
        volume24h: prev?.volume24h ?? 0,
        marketCap: prev?.marketCap ?? 0,
        lastUpdate: now,
        source,
      };
      setCache('btc_price', updated, source);
      return updated;
    });

    setPriceHistory(prev => {
      const next = [...prev, { time: now, price }];
      return next.length > MAX_TICKS ? next.slice(-MAX_TICKS) : next;
    });
  }, []);

  // Primary: Binance WebSocket
  const connectWS = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(BINANCE_WS);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
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
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        wsFailCount.current++;
        reconnectTimer.current = setTimeout(connectWS, RECONNECT_MS);
      };

      ws.onerror = () => { ws.close(); };
    } catch {
      wsFailCount.current++;
      reconnectTimer.current = setTimeout(connectWS, 5000);
    }
  }, [pushPrice]);

  // Fallback: CoinGecko REST polling (if WS fails repeatedly)
  const fetchREST = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch(COINGECKO_URL, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const [coin] = await res.json();
      if (!coin || !mountedRef.current) return;

      const price = coin.current_price;
      if (price > 0) {
        pushPrice(
          price,
          coin.price_change_percentage_24h ?? 0,
          coin.high_24h ?? price,
          coin.low_24h ?? price,
          'coingecko'
        );

        // Update extra stats
        setData(prev => prev ? {
          ...prev,
          volume24h: coin.total_volume ?? 0,
          marketCap: coin.market_cap ?? 0,
        } : prev);
      }
    } catch {}
  }, [pushPrice]);

  useEffect(() => {
    mountedRef.current = true;

    // Start WebSocket
    connectWS();

    // Also poll REST for volume/market cap stats
    fetchREST();
    const statsInterval = setInterval(fetchREST, STATS_POLL_MS);

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
      clearInterval(statsInterval);
    };
  }, [connectWS, fetchREST]);

  return { data, connected, priceHistory };
}
