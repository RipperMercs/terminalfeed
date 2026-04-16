// Donation leaderboard — auto-fetches from mempool.space
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

const BTC_ADDRESS = '3GLimw2rSrne3hfrsanjoVxrM2Dwsbmkdy';
const API_URL = `https://mempool.space/api/address/${BTC_ADDRESS}/txs`;
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
        const txs = await res.json();
        if (!Array.isArray(txs)) return;

        const donations: Donation[] = [];

        for (const tx of txs) {
          // Find outputs that go to our address
          for (const vout of (tx.vout || [])) {
            if (vout.scriptpubkey_address === BTC_ADDRESS) {
              const amountBtc = (vout.value || 0) / 1e8;
              // Get sender address from first input
              const senderAddr = tx.vin?.[0]?.prevout?.scriptpubkey_address || 'anonymous';
              const shortened = senderAddr.length > 10
                ? `${senderAddr.slice(0, 6)}...${senderAddr.slice(-4)}`
                : senderAddr;

              const timestamp = tx.status?.block_time
                ? new Date(tx.status.block_time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'pending';

              donations.push({
                txid: tx.txid,
                amount: amountBtc,
                address: shortened,
                date: timestamp,
                confirmed: tx.status?.confirmed ?? false,
              });
            }
          }
        }

        // Sort by amount descending (leaderboard)
        donations.sort((a, b) => b.amount - a.amount);

        const totalBtc = donations.reduce((sum, d) => sum + d.amount, 0);

        const result: DonationStats = {
          donations: donations.slice(0, 10),
          totalBtc,
          totalCount: donations.length,
        };

        setStats(result);
        setCache(CACHE_KEY, result, 'mempool');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Donations]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return stats;
}
