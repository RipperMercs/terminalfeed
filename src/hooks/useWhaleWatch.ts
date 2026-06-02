// Whale Watch: large BTC transactions from mempool.space
// Shows recent transactions > 1 BTC flowing through the mempool

import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface WhaleTransaction {
  txid: string;
  btc: number;
  fee: number;
  time: number;
}

const API_URL = '/api/whale-watch'; // worker proxies + filters mempool.space (rule #6)
const CACHE_KEY = 'whale_watch';
const POLL_MS = 20_000; // 20 seconds

export function useWhaleWatch(): WhaleTransaction[] {
  const [whales, setWhales] = useState<WhaleTransaction[]>(() => {
    return getCache<WhaleTransaction[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok || !mountedRef.current) return;
        const results = await res.json();
        if (!Array.isArray(results)) return;

        // Worker already filtered (>= 1 BTC) and shaped the rows.
        if (results.length > 0 && mountedRef.current) {
          setWhales(results as WhaleTransaction[]);
          setCache(CACHE_KEY, results, 'whale-watch');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[WhaleWatch]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return whales;
}
