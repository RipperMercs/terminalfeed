// Lichess TV: the current featured live game per channel (top rated, bullet,
// blitz, rapid, classical, chess960). Worker-proxied (/api/lichess-tv), 60s
// server cache. Pure fun.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface LichessChannel {
  key: string;
  label: string;
  player: string;
  rating: number;
  game_id: string;
  url: string;
}

export interface LichessTvData {
  channels: LichessChannel[];
}

const ENDPOINT = '/api/lichess-tv';
const CACHE_KEY = 'lichess_tv';
const POLL_MS = 2 * 60_000;

export function useLichessTv(): LichessTvData | null {
  const [data, setData] = useState<LichessTvData | null>(() => getCache<LichessTvData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: LichessTvData | undefined = json?.data;
        if (!d || !Array.isArray(d.channels) || d.channels.length === 0) return;
        setData(d);
        setCache(CACHE_KEY, d, 'lichess');
      } catch (e) { if (import.meta.env.DEV) console.warn('[LichessTv]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
