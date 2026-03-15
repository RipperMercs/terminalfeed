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

const SHOW_URL = 'https://hacker-news.firebaseio.com/v0/showstories.json';
const ASK_URL = 'https://hacker-news.firebaseio.com/v0/askstories.json';
const ITEM_URL = 'https://hacker-news.firebaseio.com/v0/item';
const CACHE_KEY = 'hn_community';
const POLL_MS = 3 * 60_000; // 3 min

async function fetchItems(url: string, type: string, limit: number): Promise<HNTopItem[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const ids: number[] = await res.json();

    const items = await Promise.all(
      ids.slice(0, limit).map(async (id) => {
        try {
          const r = await fetch(`${ITEM_URL}/${id}.json`, { signal: AbortSignal.timeout(3000) });
          if (!r.ok) return null;
          const item = await r.json();
          return {
            id: item.id,
            title: item.title || '',
            score: item.score || 0,
            comments: item.descendants || 0,
            url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
            type,
          };
        } catch { return null; }
      })
    );

    return items.filter(Boolean) as HNTopItem[];
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
        fetchItems(SHOW_URL, 'show', 4),
        fetchItems(ASK_URL, 'ask', 4),
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
