// Whale Watch — large BTC transactions from mempool.space
// Shows recent transactions > 1 BTC flowing through the mempool

import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface WhaleTransaction {
  txid: string;
  btc: number;
  fee: number;
  time: number;
}

const API_URL = 'https://mempool.space/api/mempool/recent';
const CACHE_KEY = 'whale_watch';
const POLL_MS = 20_000; // 20 seconds
const MIN_BTC = 1; // minimum 1 BTC to show

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
        const txs = await res.json();
        if (!Array.isArray(txs)) return;

        const results: WhaleTransaction[] = txs
          .filter((tx: { value: number }) => tx.value && tx.value / 1e8 >= MIN_BTC)
          .slice(0, 10)
          .map((tx: { txid: string; value: number; fee: number }) => ({
            txid: tx.txid,
            btc: tx.value / 1e8,
            fee: tx.fee || 0,
            time: Date.now(),
          }));

        if (results.length > 0 && mountedRef.current) {
          setWhales(results);
          setCache(CACHE_KEY, results, 'mempool');
        }
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return whales;
}
