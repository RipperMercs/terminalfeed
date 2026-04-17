import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface CryptoGlobalData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  activeCryptos: number;
}

const API_URL = '/api/coingecko/global';
const CACHE_KEY = 'crypto_global';
const POLL_MS = 120_000;

export function useCryptoGlobal(): CryptoGlobalData | null {
  const [data, setData] = useState<CryptoGlobalData | null>(() => {
    return getCache<CryptoGlobalData>(CACHE_KEY)?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const json = await res.json();
        const d = json.data;
        if (!d || !mountedRef.current) return;

        const result: CryptoGlobalData = {
          totalMarketCap: d.total_market_cap?.usd ?? 0,
          totalVolume24h: d.total_volume?.usd ?? 0,
          btcDominance: d.market_cap_percentage?.btc ?? 0,
          ethDominance: d.market_cap_percentage?.eth ?? 0,
          marketCapChange24h: d.market_cap_change_percentage_24h_usd ?? 0,
          activeCryptos: d.active_cryptocurrencies ?? 0,
        };

        setData(result);
        setCache(CACHE_KEY, result, 'coingecko');
      } catch (e) { if (import.meta.env.DEV) console.warn('[CryptoGlobal]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
