import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface TCGCard {
  name: string;
  game: 'Pokemon' | 'MTG' | 'Yu-Gi-Oh';
  price: number;
  set: string;
  rarity: string;
  image: string;
  url?: string;
}

export interface TCGMarketData {
  cards: TCGCard[];
  timestamp: number;
}

const CACHE_KEY = 'tcg_market';
const POLL_MS = 300_000; // 5 minutes

export function useTCGMarket() {
  const [data, setData] = useState<TCGMarketData | null>(() => {
    const cached = getCache<TCGMarketData>(CACHE_KEY);
    return cached?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      try {
        // worker proxy (pokemontcg.io + scryfall + ygoprodeck), rule #6:
        // all three upstreams fetched, mapped and interleaved server-side
        const res = await fetch('/api/tcg-market', { signal: AbortSignal.timeout(12000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const cards: TCGCard[] = Array.isArray(json.cards) ? json.cards : [];
        if (cards.length === 0) return;

        const result: TCGMarketData = { cards, timestamp: json.timestamp ?? Date.now() };
        setData(result);
        setCache(CACHE_KEY, result, 'multi');
      } catch (e) { if (import.meta.env.DEV) console.warn('[TCGMarket]', e); }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
