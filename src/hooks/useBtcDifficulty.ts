// Bitcoin difficulty adjustment progress + retarget estimates.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface BtcDifficultyData {
  progress_percent: number | null;
  difficulty_change_percent: number | null;
  previous_retarget_percent: number | null;
  remaining_blocks: number | null;
  remaining_time_ms: number | null;
  estimated_retarget_at: string | null;
  next_retarget_height: number | null;
  avg_block_time_seconds: number | null;
}

const ENDPOINT = '/api/btc-difficulty';
const CACHE_KEY = 'btc-difficulty';
const POLL_MS = 5 * 60_000;

export function useBtcDifficulty(): BtcDifficultyData | null {
  const [data, setData] = useState<BtcDifficultyData | null>(() => getCache<BtcDifficultyData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: BtcDifficultyData | undefined = json?.data;
        if (!d || d.progress_percent == null) return;
        setData(d);
        setCache(CACHE_KEY, d, 'btc-difficulty');
      } catch (e) { if (import.meta.env.DEV) console.warn('[BtcDiff]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
