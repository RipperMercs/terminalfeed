// Ethereum staking stats via Lido + DefiLlama.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface LidoStats {
  apr_percent: number | null;
  tvl_usd: number | null;
  change_1d_pct: number | null;
  change_7d_pct: number | null;
  as_of_unix: number | null;
}

export interface EthStakingData {
  lido: LidoStats;
}

const ENDPOINT = '/api/eth-staking';
const CACHE_KEY = 'eth-staking';
const POLL_MS = 30 * 60_000;

export function useEthStaking(): EthStakingData | null {
  const [data, setData] = useState<EthStakingData | null>(() => getCache<EthStakingData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: EthStakingData | undefined = json?.data;
        if (!d || !d.lido) return;
        setData(d);
        setCache(CACHE_KEY, d, 'eth-staking');
      } catch (e) { if (import.meta.env.DEV) console.warn('[EthStaking]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
