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
}

const COINCAP_WS = 'wss://ws.coincap.io/prices?assets=bitcoin';
const WS_RECONNECT_MS = 3000;
const WS_MAX_RECONNECT_MS = 30000;

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false';
const STATS_POLL_MS = 60_000;
const MAX_TICKS = 300;

export function useBtcPrice() {
  const [data, setData] = useState<BtcPriceData | null>(null);
  const [connected, setConnected] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceTick[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(WS_RECONNECT_MS);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const statsRef = useRef({
    change24h: 0,
    changePercent24h: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0,
    marketCap: 0,
  });

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

      setData((prev) => {
        if (prev) return prev;
        return {
          price: coin.current_price,
          prevPrice: coin.current_price,
          ...statsRef.current,
          lastUpdate: Date.now(),
        };
      });
    } catch {}
  }, []);

  const connectWs = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(COINCAP_WS);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        reconnectDelay.current = WS_RECONNECT_MS;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          const price = parseFloat(msg.bitcoin);
          if (!price || isNaN(price)) return;

          const now = Date.now();
          setData((prev) => ({
            price,
            prevPrice: prev?.price ?? price,
            ...statsRef.current,
            lastUpdate: now,
          }));
          setPriceHistory((prev) => {
            const next = [...prev, { time: now, price }];
            return next.length > MAX_TICKS ? next.slice(-MAX_TICKS) : next;
          });
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(
            reconnectDelay.current * 1.5,
            WS_MAX_RECONNECT_MS,
          );
          connectWs();
        }, reconnectDelay.current);
      };

      ws.onerror = () => { ws.close(); };
    } catch {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connectWs();
    fetchStats();
    statsTimer.current = setInterval(fetchStats, STATS_POLL_MS);

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (statsTimer.current) clearInterval(statsTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connectWs, fetchStats]);

  return { data, connected, priceHistory };
}
