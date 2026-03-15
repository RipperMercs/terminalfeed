// Prediction Markets — now via our own Worker (no CORS issues)
import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface PredictionMarket {
  id: string;
  title: string;
  probability: number;
  volume: number;
  source: string;
}

const API_URL = '/api/predictions';
const CACHE_KEY = 'prediction_markets';
const POLL_MS = 60_000; // 1 min

export function usePredictionMarkets(): PredictionMarket[] {
  const [markets, setMarkets] = useState<PredictionMarket[]>(() => {
    return getCache<PredictionMarket[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const data = json.data || json;
        if (!Array.isArray(data) || data.length === 0) return;

        const results: PredictionMarket[] = data
          .filter((m: { question?: string; yes_percent?: number }) => m.question && m.yes_percent != null && m.yes_percent > 0 && m.yes_percent < 100)
          .slice(0, 10)
          .map((m: { question: string; yes_percent: number; volume_usd?: number }, i: number) => ({
            id: String(i),
            title: m.question,
            probability: m.yes_percent,
            volume: m.volume_usd ?? 0,
            source: 'polymarket',
          }));

        if (results.length > 0 && mountedRef.current) {
          setMarkets(results);
          setCache(CACHE_KEY, results, 'worker');
        }
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return markets;
}
