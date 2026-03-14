import { useState, useEffect, useRef, useCallback } from 'react';

interface CryptoItem {
  symbol: string;
  price: number;
  change: number;
}

// Real-time prices via CoinCap WebSocket
const COINCAP_WS = 'wss://ws.coincap.io/prices?assets=ethereum,solana,dogecoin,ripple,cardano';
const RECONNECT_MS = 5000;

// 24h stats from CoinGecko
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum,solana,dogecoin,ripple,cardano&sparkline=false';
const STATS_POLL_MS = 60_000;

const ASSET_MAP: Record<string, string> = {
  ethereum: 'ETH',
  solana: 'SOL',
  dogecoin: 'DOGE',
  ripple: 'XRP',
  cardano: 'ADA',
};

const ID_MAP: Record<string, string> = {
  ethereum: 'ETH',
  solana: 'SOL',
  dogecoin: 'DOGE',
  ripple: 'XRP',
  cardano: 'ADA',
};

export function useSimCrypto() {
  const [crypto, setCrypto] = useState<CryptoItem[]>([
    { symbol: 'ETH', price: 0, change: 0 },
    { symbol: 'SOL', price: 0, change: 0 },
    { symbol: 'DOGE', price: 0, change: 0 },
    { symbol: 'XRP', price: 0, change: 0 },
    { symbol: 'ADA', price: 0, change: 0 },
  ]);

  const mountedRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const changeRef = useRef<Record<string, number>>({});

  // Fetch 24h change from CoinGecko
  const fetchStats = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch(COINGECKO_URL);
      if (!res.ok) return;
      const coins = await res.json();
      if (!mountedRef.current) return;

      for (const coin of coins) {
        const sym = ID_MAP[coin.id];
        if (sym) {
          changeRef.current[sym] = coin.price_change_percentage_24h ?? 0;
        }
      }

      // Seed prices if we haven't gotten WS data yet
      setCrypto((prev) => {
        const hasData = prev.some((c) => c.price > 0);
        if (hasData) return prev;
        return prev.map((c) => {
          const coin = coins.find((gc: any) => ID_MAP[gc.id] === c.symbol);
          if (!coin) return c;
          return {
            ...c,
            price: coin.current_price,
            change: coin.price_change_percentage_24h ?? 0,
          };
        });
      });
    } catch {}
  }, []);

  // Real-time WS
  const connectWs = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(COINCAP_WS);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          setCrypto((prev) =>
            prev.map((c) => {
              const assetKey = Object.keys(ASSET_MAP).find((k) => ASSET_MAP[k] === c.symbol);
              if (!assetKey || !msg[assetKey]) return c;
              const price = parseFloat(msg[assetKey]);
              if (!price || isNaN(price)) return c;
              return {
                ...c,
                price,
                change: changeRef.current[c.symbol] ?? c.change,
              };
            }),
          );
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        reconnectTimer.current = setTimeout(connectWs, RECONNECT_MS);
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
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connectWs, fetchStats]);

  return crypto;
}
