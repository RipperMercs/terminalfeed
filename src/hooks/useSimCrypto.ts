import { useState, useEffect, useRef, useCallback } from 'react';
import { setCache, getCache } from '../services/cache';
import { STATIC_FALLBACKS } from '../data/staticFallbacks';

interface CryptoItem {
  symbol: string;
  price: number;
  change: number;
}

// Real-time prices via CoinCap WebSocket
const ASSETS = 'ethereum,solana,dogecoin,ripple,cardano,polkadot,avalanche-2,chainlink,litecoin,hyperliquid,hedera-hashgraph';
const COINCAP_WS = `wss://ws.coincap.io/prices?assets=${ASSETS.replace(/-2/g, '')}`;
const RECONNECT_MS = 5000;

// 24h stats from CoinGecko (includes more tokens)
const COINGECKO_URL =
  `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ASSETS}&sparkline=false&order=market_cap_desc`;
const STATS_POLL_MS = 60_000;

const GECKO_TO_SYMBOL: Record<string, string> = {
  ethereum: 'ETH',
  solana: 'SOL',
  dogecoin: 'DOGE',
  ripple: 'XRP',
  cardano: 'ADA',
  polkadot: 'DOT',
  'avalanche-2': 'AVAX',
  chainlink: 'LINK',
  litecoin: 'LTC',
  hyperliquid: 'HYPE',
  'hedera-hashgraph': 'HBAR',
};

// CoinCap uses slightly different names
const COINCAP_TO_SYMBOL: Record<string, string> = {
  ethereum: 'ETH',
  solana: 'SOL',
  dogecoin: 'DOGE',
  ripple: 'XRP',
  cardano: 'ADA',
  polkadot: 'DOT',
  avalanche: 'AVAX',
  chainlink: 'LINK',
  litecoin: 'LTC',
  hyperliquid: 'HYPE',
  hedera: 'HBAR',
};

const INITIAL_ORDER = ['ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'LTC', 'HYPE', 'HBAR'];

export function useSimCrypto(customSymbols: string[] = []) {
  // Merge custom symbols (uppercased) with defaults, no dupes
  const allSymbols = [
    ...INITIAL_ORDER,
    ...customSymbols.map((s) => s.toUpperCase()).filter((s) => !INITIAL_ORDER.includes(s)),
  ];

  const [crypto, setCrypto] = useState<CryptoItem[]>(() => {
    // Seed from cache or static fallbacks
    const cached = getCache<CryptoItem[]>('crypto_prices');
    if (cached) return cached.data;
    return allSymbols.map((sym) => {
      const fallback = STATIC_FALLBACKS.crypto_prices.find((c) => c.symbol === sym);
      return fallback || { symbol: sym, price: 0, change: 0 };
    });
  });

  const mountedRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const changeRef = useRef<Record<string, number>>({});

  const fetchStats = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch(COINGECKO_URL);
      if (!res.ok) return;
      const coins = await res.json();
      if (!mountedRef.current) return;

      for (const coin of coins) {
        const sym = GECKO_TO_SYMBOL[coin.id];
        if (sym) {
          changeRef.current[sym] = coin.price_change_percentage_24h ?? 0;
        }
      }

      // Seed prices if WS hasn't delivered yet
      setCrypto((prev) => {
        const hasData = prev.some((c) => c.price > 0);
        if (hasData) return prev;
        return prev.map((c) => {
          const coin = coins.find((gc: any) => GECKO_TO_SYMBOL[gc.id] === c.symbol);
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
          setCrypto((prev) => {
            const next = prev.map((c) => {
              const assetKey = Object.keys(COINCAP_TO_SYMBOL).find(
                (k) => COINCAP_TO_SYMBOL[k] === c.symbol,
              );
              if (!assetKey || !msg[assetKey]) return c;
              const price = parseFloat(msg[assetKey]);
              if (!price || isNaN(price)) return c;
              return {
                ...c,
                price,
                change: changeRef.current[c.symbol] ?? c.change,
              };
            });
            setCache('crypto_prices', next, 'coincap');
            return next;
          });
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
