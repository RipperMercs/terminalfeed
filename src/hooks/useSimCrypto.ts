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

// 24h stats via Worker proxy — top 30 coins by market cap
const MARKETS_URL = '/api/coingecko/markets';
const STATS_POLL_MS = 120_000;

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
      const res = await fetch(MARKETS_URL, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const json = await res.json();
      const coins = Array.isArray(json.data) ? json.data : [];
      if (!mountedRef.current || coins.length === 0) return;

      // Update change refs for WS-connected coins
      for (const coin of coins) {
        const sym = GECKO_TO_SYMBOL[coin.id] || coin.symbol?.toUpperCase();
        if (sym) {
          changeRef.current[sym] = coin.price_change_percentage_24h ?? 0;
        }
      }

      // Build full list from CoinGecko data (top 30 by market cap)
      const fullList: CryptoItem[] = coins.map((coin: { id: string; symbol: string; current_price: number; price_change_percentage_24h: number }) => ({
        symbol: GECKO_TO_SYMBOL[coin.id] || coin.symbol?.toUpperCase() || '???',
        price: coin.current_price ?? 0,
        change: coin.price_change_percentage_24h ?? 0,
      })).filter((c: CryptoItem) => c.price > 0);

      setCrypto(fullList);
      setCache('crypto_prices', fullList, 'coingecko');
    } catch (e) { if (import.meta.env.DEV) console.warn('[SimCrypto]', e); }
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
        } catch (e) { if (import.meta.env.DEV) console.warn('[SimCrypto]', e); }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        reconnectTimer.current = setTimeout(connectWs, RECONNECT_MS);
      };

      ws.onerror = () => { ws.close(); };
    } catch (e) { if (import.meta.env.DEV) console.warn('[SimCrypto]', e); }
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
