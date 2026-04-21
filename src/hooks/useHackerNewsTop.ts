// Top Show HN / Ask HN — the community-driven content
// These are the posts people actually discuss, not just link-share
import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface HNTopItem {
  id: number;
  title: string;
  score: number;
  comments: number;
  url: string;
  type: string; // 'show' | 'ask'
}

const CACHE_KEY = 'hn_community';
const POLL_MS = 3 * 60_000; // 3 min

async function fetchFromWorker(endpoint: string, type: string, limit: number): Promise<HNTopItem[]> {
  try {
    const res = await fetch(`/api/${endpoint}?limit=${limit}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const json = await res.json();
    const items = Array.isArray(json?.data) ? json.data : [];
    return items.map((s: { id: number; title?: string; score?: number; descendants?: number; url?: string }) => ({
      id: s.id,
      title: s.title || '',
      score: s.score || 0,
      comments: s.descendants || 0,
      url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      type,
    }));
  } catch { return []; }
}

export function useHNShowAsk(): HNTopItem[] {
  const [items, setItems] = useState<HNTopItem[]>(() => {
    return getCache<HNTopItem[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      const [showItems, askItems] = await Promise.all([
        fetchFromWorker('hn-show', 'show', 4),
        fetchFromWorker('hn-ask', 'ask', 4),
      ]);

      if (!mountedRef.current) return;
      const combined = [...showItems, ...askItems].sort((a, b) => b.score - a.score).slice(0, 8);
      if (combined.length > 0) {
        setItems(combined);
        setCache(CACHE_KEY, combined, 'hn');
      }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return items;
}
