import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface BtcNetworkData {
  // Block info
  blockHeight: number;
  blockTimestamp: number;
  blockTxCount: number;
  blockSize: number;
  blockPool: string;
  // Fees (sat/vB)
  feeFastest: number;
  feeHalfHour: number;
  feeHour: number;
  feeEconomy: number;
  feeMinimum: number;
  // Mempool
  mempoolCount: number;
  mempoolVsize: number;
  // Difficulty
  diffProgress: number;
  diffChange: number;
  diffRemainingBlocks: number;
  diffRetargetDate: number; // timestamp ms
  // Hashrate
  hashrate: number; // H/s
  difficulty: number;
  // Recent blocks
  recentBlocks: RecentBlock[];
  // Projected upcoming blocks (mempool queue)
  mempoolBlocks: MempoolBlock[];
  // Connection status
  connected: boolean;
}

export interface MempoolBlock {
  medianFee: number; // sat/vB
  nTx: number;
  blockVSize: number; // vbytes
  totalFees: number; // sats
}

export interface RecentBlock {
  height: number;
  timestamp: number;
  txCount: number;
  size: number;
  pool: string;
  totalFees: number;
  medianFee: number;
}

const CACHE_KEY = 'btc_network';
const POLL_MS = 30_000; // poll the Worker aggregate every 30s

const defaultData: BtcNetworkData = {
  blockHeight: 0, blockTimestamp: 0, blockTxCount: 0, blockSize: 0, blockPool: '',
  feeFastest: 0, feeHalfHour: 0, feeHour: 0, feeEconomy: 0, feeMinimum: 0,
  mempoolCount: 0, mempoolVsize: 0,
  diffProgress: 0, diffChange: 0, diffRemainingBlocks: 0, diffRetargetDate: 0,
  hashrate: 0, difficulty: 0,
  recentBlocks: [],
  mempoolBlocks: [],
  connected: false,
};

// Polls /api/btc-network, which aggregates mempool.space server-side (block, fees,
// mempool, difficulty, hashrate, recent + projected blocks). mempool.space sends no
// CORS headers, so the browser cannot fetch it directly; the previous direct REST +
// WebSocket both browser-failed. The Worker also caches + merges intermittent
// upstream gaps, so the panel stays populated. (rule #6)
export function useBtcNetwork(): BtcNetworkData {
  const [data, setData] = useState<BtcNetworkData>(() => {
    const cached = getCache<BtcNetworkData>(CACHE_KEY);
    // Spread defaults first so any new fields get safe defaults even when
    // localStorage holds a stale cache from a prior deploy.
    return cached?.data ? { ...defaultData, ...cached.data, connected: false } : defaultData;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const poll = async () => {
      try {
        const res = await fetch('/api/btc-network', { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        if (typeof json.blockHeight !== 'number') return;
        const next: BtcNetworkData = { ...defaultData, ...json };
        setCache(CACHE_KEY, next, 'btc-network');
        if (mountedRef.current) setData(next);
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[BtcNetwork]', e);
      }
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, []);

  return data;
}
