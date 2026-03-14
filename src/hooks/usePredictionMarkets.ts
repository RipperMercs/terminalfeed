import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface PredictionMarket {
  id: string;
  title: string;
  probability: number; // 0-100
  volume: number;
  source: string; // 'polymarket' | 'kalshi'
}

const POLYMARKET_URL = 'https://gamma-api.polymarket.com/markets?limit=10&active=true&order=volume&ascending=false';
const CACHE_KEY = 'prediction_markets';
const POLL_MS = 5 * 60_000; // 5 min

export function usePredictionMarkets(): PredictionMarket[] {
  const [markets, setMarkets] = useState<PredictionMarket[]>(() => {
    return getCache<PredictionMarket[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      const results: PredictionMarket[] = [];

      // Polymarket
      try {
        const res = await fetch(POLYMARKET_URL, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : [];
          for (const m of items.slice(0, 10)) {
            if (!m.question) continue;
            const price = parseFloat(m.outcomePrices?.[0] ?? m.bestAsk ?? '0');
            results.push({
              id: m.id || m.conditionId || String(results.length),
              title: m.question,
              probability: Math.round((price > 1 ? price : price * 100)),
              volume: parseFloat(m.volume ?? m.volumeNum ?? '0'),
              source: 'polymarket',
            });
          }
        }
      } catch {}

      // Kalshi fallback
      if (results.length < 5) {
        try {
          const res = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?limit=10&status=open', {
            signal: AbortSignal.timeout(8000),
          });
          if (res.ok) {
            const data = await res.json();
            for (const m of (data.markets || []).slice(0, 10 - results.length)) {
              results.push({
                id: m.ticker || String(results.length),
                title: m.title || m.subtitle || 'Unknown',
                probability: Math.round((m.last_price ?? m.yes_bid ?? 0) * 100),
                volume: m.volume ?? 0,
                source: 'kalshi',
              });
            }
          }
        } catch {}
      }

      if (mountedRef.current && results.length > 0) {
        results.sort((a, b) => b.volume - a.volume);
        setMarkets(results.slice(0, 10));
        setCache(CACHE_KEY, results.slice(0, 10), 'polymarket');
      }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return markets;
}
