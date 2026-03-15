// Open Library — Trending books worldwide

import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface TrendingBook {
  title: string;
  author: string;
  key: string;
  url: string;
}

const API_URL = 'https://openlibrary.org/trending/daily.json';
const CACHE_KEY = 'trending_books';
const POLL_MS = 30 * 60_000; // 30 min

export function useTrendingBooks(): TrendingBook[] {
  const [books, setBooks] = useState<TrendingBook[]>(() => {
    return getCache<TrendingBook[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const data = await res.json();
        if (!data.works?.length) return;

        const results: TrendingBook[] = data.works.slice(0, 8).map((w: {
          title: string;
          author_name?: string[];
          key: string;
        }) => ({
          title: w.title || 'Unknown',
          author: w.author_name?.[0] || 'Unknown',
          key: w.key || '',
          url: `https://openlibrary.org${w.key}`,
        }));

        setBooks(results);
        setCache(CACHE_KEY, results, 'openlibrary');
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return books;
}
