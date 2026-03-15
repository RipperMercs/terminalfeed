// Who's in Space right now — tiny, awe-inspiring
import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface AstroData {
  count: number;
  people: { name: string; craft: string }[];
}

const API_URL = 'http://api.open-notify.org/astros.json';
const CACHE_KEY = 'astros';
const POLL_MS = 30 * 60_000; // 30 min — crew doesn't change often

export function useAstros(): AstroData | null {
  const [data, setData] = useState<AstroData | null>(() => {
    return getCache<AstroData>(CACHE_KEY)?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        if (json.message !== 'success') return;

        const result: AstroData = {
          count: json.number ?? 0,
          people: (json.people || []).map((p: { name: string; craft: string }) => ({
            name: p.name,
            craft: p.craft,
          })),
        };

        setData(result);
        setCache(CACHE_KEY, result, 'open-notify');
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
