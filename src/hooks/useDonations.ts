// Donation leaderboard: auto-fetches from mempool.space
// Monitors the BTC donation address for incoming transactions

import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface Donation {
  txid: string;
  amount: number; // BTC
  address: string; // sender (shortened)
  date: string;
  confirmed: boolean;
}

export interface DonationStats {
  donations: Donation[];
  totalBtc: number;
  totalCount: number;
}

const API_URL = '/api/donations'; // worker proxies + parses mempool.space (rule #6)
const CACHE_KEY = 'donations';
const POLL_MS = 5 * 60_000; // 5 min

export function useDonations(): DonationStats {
  const [stats, setStats] = useState<DonationStats>(() => {
    const cached = getCache<DonationStats>(CACHE_KEY);
    return cached?.data ?? { donations: [], totalBtc: 0, totalCount: 0 };
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const result = await res.json();
        if (!result || !Array.isArray(result.donations)) return;

        // Worker parses the address txs into the leaderboard shape.
        setStats(result as DonationStats);
        setCache(CACHE_KEY, result, 'donations');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Donations]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return stats;
}
