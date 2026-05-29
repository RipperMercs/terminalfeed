import { useState, useEffect, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface TrendingMovie {
  id: number;
  title: string;
  overview: string;
  poster: string;
  rating: number;
  releaseDate: string;
  mediaType: 'movie' | 'tv';
}

// Trending movies/TV come from TMDB via the Worker at /api/trending-movies.
// The TMDB read token lives in a Worker secret (TMDB_READ_TOKEN), never client-side.
const CACHE_KEY = 'trending_movies';
const POLL_MS = 30 * 60_000; // 30 min
const MAX_ITEMS = 10;

async function fetchTrending(): Promise<TrendingMovie[]> {
  try {
    const res = await fetch('/api/trending-movies', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const list: TrendingMovie[] = Array.isArray(json?.data) ? json.data : [];
    return list.slice(0, MAX_ITEMS);
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[TrendingMovies]', e);
    return [];
  }
}

export function useTrendingMovies() {
  const [movies, setMovies] = useState<TrendingMovie[]>(() => {
    return getCache<TrendingMovie[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const doFetch = async () => {
      if (!mountedRef.current) return;
      const items = await fetchTrending();
      if (mountedRef.current && items.length > 0) {
        setMovies(items);
        setCache(CACHE_KEY, items, 'tmdb');
      }
    };

    const cached = getCache<TrendingMovie[]>(CACHE_KEY);
    if (!cached?.data || cached.age >= POLL_MS) {
      const timer = setTimeout(doFetch, 5000);
      const id = setInterval(doFetch, POLL_MS);
      return () => { mountedRef.current = false; clearTimeout(timer); clearInterval(id); };
    }

    const id = setInterval(doFetch, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return movies;
}
