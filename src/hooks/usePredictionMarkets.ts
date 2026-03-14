import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface PredictionMarket {
  id: string;
  title: string;
  probability: number; // 0-100
  volume: number;
  source: string;
}

// Filter out esports, sports betting, and low-quality markets
const BLOCK_WORDS = /\b(bo[123]|esports?|counter-strike|valorant|league of legends|dota|overwatch|csgo|cs2|map\s?\d|acend|bebop|navi|faze|fnatic|round\s?\d|game\s?\d|match|tournament|championship|group\s?[a-d]|play.?in|bracket|series\s?#)/i;

const POLYMARKET_URL = 'https://gamma-api.polymarket.com/markets?limit=30&active=true&closed=false&order=volume&ascending=false';
const CACHE_KEY = 'prediction_markets';
const POLL_MS = 5 * 60_000;

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
          for (const m of items) {
            if (results.length >= 10) break;
            if (!m.question) continue;
            // Filter out esports/gambling
            if (BLOCK_WORDS.test(m.question)) continue;

            // Parse probability — outcomePrices is an array of strings like ["0.65", "0.35"]
            let prob = 0;
            try {
              const prices = JSON.parse(m.outcomePrices || '[]');
              const yesPrice = parseFloat(prices[0] ?? '0');
              prob = Math.round(yesPrice * 100);
            } catch {
              // Fallback to other fields
              prob = Math.round((parseFloat(m.lastTradePrice ?? m.bestBid ?? '0')) * 100);
            }

            // Skip markets with 0% or 100% (already resolved or broken)
            if (prob <= 0 || prob >= 100) continue;

            results.push({
              id: m.id || m.conditionId || String(results.length),
              title: m.question,
              probability: prob,
              volume: parseFloat(m.volumeNum ?? m.volume ?? '0'),
              source: 'polymarket',
            });
          }
        }
      } catch {}

      // Kalshi fallback
      if (results.length < 5) {
        try {
          const res = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?limit=20&status=open', {
            signal: AbortSignal.timeout(8000),
          });
          if (res.ok) {
            const data = await res.json();
            for (const m of (data.markets || [])) {
              if (results.length >= 10) break;
              const title = m.title || m.subtitle || '';
              if (!title || BLOCK_WORDS.test(title)) continue;
              const prob = Math.round((m.last_price ?? m.yes_bid ?? 0) * 100);
              if (prob <= 0 || prob >= 100) continue;
              results.push({
                id: m.ticker || String(results.length),
                title,
                probability: prob,
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
