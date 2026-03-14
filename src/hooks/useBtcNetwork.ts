import { useEffect, useRef, useState, useCallback } from 'react';
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
  // Connection status
  connected: boolean;
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

const MEMPOOL_WS = 'wss://mempool.space/api/v1/ws';
const MEMPOOL_API = 'https://mempool.space/api';
const RECONNECT_DELAY = 5000;
const CACHE_KEY = 'btc_network';
const REST_POLL_MS = 60_000; // 1 min for REST endpoints

const defaultData: BtcNetworkData = {
  blockHeight: 0, blockTimestamp: 0, blockTxCount: 0, blockSize: 0, blockPool: '',
  feeFastest: 0, feeHalfHour: 0, feeHour: 0, feeEconomy: 0, feeMinimum: 0,
  mempoolCount: 0, mempoolVsize: 0,
  diffProgress: 0, diffChange: 0, diffRemainingBlocks: 0, diffRetargetDate: 0,
  hashrate: 0, difficulty: 0,
  recentBlocks: [],
  connected: false,
};

export function useBtcNetwork(): BtcNetworkData {
  const [data, setData] = useState<BtcNetworkData>(() => {
    const cached = getCache<BtcNetworkData>(CACHE_KEY);
    return cached?.data ? { ...cached.data, connected: false } : defaultData;
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;

  const update = useCallback((partial: Partial<BtcNetworkData>) => {
    if (!mountedRef.current) return;
    setData(prev => {
      const next = { ...prev, ...partial };
      setCache(CACHE_KEY, next, 'mempool.space');
      return next;
    });
  }, []);

  // REST fetches for data not available via WebSocket
  const fetchRest = useCallback(async () => {
    if (!mountedRef.current) return;

    // Parallel fetch: fees, difficulty, hashrate, recent blocks, mempool
    const [feesRes, diffRes, hashrateRes, blocksRes, mempoolRes] = await Promise.allSettled([
      fetch(`${MEMPOOL_API}/v1/fees/recommended`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${MEMPOOL_API}/v1/difficulty-adjustment`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${MEMPOOL_API}/v1/mining/hashrate/1m`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${MEMPOOL_API}/v1/blocks`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${MEMPOOL_API}/mempool`, { signal: AbortSignal.timeout(5000) }),
    ]);

    if (!mountedRef.current) return;

    const partial: Partial<BtcNetworkData> = {};

    // Fees
    if (feesRes.status === 'fulfilled' && feesRes.value.ok) {
      try {
        const fees = await feesRes.value.json();
        partial.feeFastest = fees.fastestFee ?? 0;
        partial.feeHalfHour = fees.halfHourFee ?? 0;
        partial.feeHour = fees.hourFee ?? 0;
        partial.feeEconomy = fees.economyFee ?? 0;
        partial.feeMinimum = fees.minimumFee ?? 0;
      } catch {}
    }

    // Difficulty adjustment
    if (diffRes.status === 'fulfilled' && diffRes.value.ok) {
      try {
        const diff = await diffRes.value.json();
        partial.diffProgress = diff.progressPercent ?? 0;
        partial.diffChange = diff.difficultyChange ?? 0;
        partial.diffRemainingBlocks = diff.remainingBlocks ?? 0;
        partial.diffRetargetDate = diff.estimatedRetargetDate ?? 0;
      } catch {}
    }

    // Hashrate
    if (hashrateRes.status === 'fulfilled' && hashrateRes.value.ok) {
      try {
        const hr = await hashrateRes.value.json();
        partial.hashrate = hr.currentHashrate ?? 0;
        partial.difficulty = hr.currentDifficulty ?? 0;
      } catch {}
    }

    // Recent blocks
    if (blocksRes.status === 'fulfilled' && blocksRes.value.ok) {
      try {
        const blocks = await blocksRes.value.json();
        if (Array.isArray(blocks)) {
          partial.recentBlocks = blocks.slice(0, 8).map((b: {
            height: number;
            timestamp: number;
            tx_count: number;
            size: number;
            extras?: { pool?: { name?: string }; totalFees?: number; medianFee?: number };
          }) => ({
            height: b.height,
            timestamp: b.timestamp,
            txCount: b.tx_count,
            size: b.size,
            pool: b.extras?.pool?.name ?? 'Unknown',
            totalFees: b.extras?.totalFees ?? 0,
            medianFee: b.extras?.medianFee ?? 0,
          }));
          // Update block height from latest block
          if (blocks[0]) {
            partial.blockHeight = blocks[0].height;
            partial.blockTimestamp = blocks[0].timestamp;
            partial.blockTxCount = blocks[0].tx_count;
            partial.blockSize = blocks[0].size;
            partial.blockPool = blocks[0].extras?.pool?.name ?? 'Unknown';
          }
        }
      } catch {}
    }

    // Mempool
    if (mempoolRes.status === 'fulfilled' && mempoolRes.value.ok) {
      try {
        const mem = await mempoolRes.value.json();
        partial.mempoolCount = mem.count ?? 0;
        partial.mempoolVsize = mem.vsize ?? 0;
      } catch {}
    }

    update(partial);
  }, [update]);

  // WebSocket for real-time updates
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(MEMPOOL_WS);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        update({ connected: true });
        ws.send(JSON.stringify({ action: 'want', data: ['blocks', 'stats', 'mempool-blocks'] }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          const partial: Partial<BtcNetworkData> = {};

          if (msg.block) {
            partial.blockHeight = msg.block.height;
            partial.blockTimestamp = msg.block.timestamp;
            partial.blockTxCount = msg.block.tx_count;
            partial.blockSize = msg.block.size;
            partial.blockPool = msg.block.extras?.pool?.name ?? 'Unknown';
          }
          if (msg.mempoolInfo) {
            partial.mempoolCount = msg.mempoolInfo.size ?? 0;
            partial.mempoolVsize = msg.mempoolInfo.vsize ?? 0;
          }
          if (msg.fees) {
            partial.feeFastest = msg.fees.fastestFee ?? 0;
            partial.feeHalfHour = msg.fees.halfHourFee ?? 0;
            partial.feeHour = msg.fees.hourFee ?? 0;
            partial.feeEconomy = msg.fees.economyFee ?? 0;
            partial.feeMinimum = msg.fees.minimumFee ?? 0;
          }

          if (Object.keys(partial).length > 0) update(partial);
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        update({ connected: false });
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => { ws.close(); };
    } catch {}
  }, [update]);

  useEffect(() => {
    mountedRef.current = true;

    // Connect WebSocket for real-time block/fee/mempool updates
    connect();

    // REST fetch for data not in WebSocket (difficulty, hashrate, recent blocks)
    fetchRest();
    const restInterval = setInterval(fetchRest, REST_POLL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(restInterval);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect, fetchRest]);

  return data;
}
