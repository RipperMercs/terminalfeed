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

// TMDB API: free tier, register at https://www.themoviedb.org/settings/api
// Paste your "API Read Access Token" (v4 bearer token) below
const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzNTJjNWEzNThmYzQ5ZTQ5ODZjODU4OTRiM2Y1ODhiMSIsIm5iZiI6MTc3MzU5ODE1OS4xNDgsInN1YiI6IjY5YjZmNWNmYjU5NzI2M2FhYzVjOWRlNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.rkZR1HpfyhHcyTnbkSSMiqmWf0P6pcVBCAq380cWTFw';
const CACHE_KEY = 'trending_movies';
const POLL_MS = 30 * 60_000; // 30 min
const MAX_ITEMS = 10;

async function fetchTrending(): Promise<TrendingMovie[]> {
  const items: TrendingMovie[] = [];

  try {
    const res = await fetch('https://api.themoviedb.org/3/trending/all/day?language=en-US', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return items;
    const data = await res.json();

    for (const item of (data.results ?? []).slice(0, MAX_ITEMS)) {
      const isMovie = item.media_type === 'movie';
      items.push({
        id: item.id,
        title: isMovie ? (item.title ?? '') : (item.name ?? ''),
        overview: item.overview ?? '',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w154${item.poster_path}` : '',
        rating: Math.round((item.vote_average ?? 0) * 10) / 10,
        releaseDate: isMovie ? (item.release_date ?? '') : (item.first_air_date ?? ''),
        mediaType: isMovie ? 'movie' : 'tv',
      });
    }
  } catch (e) { if (import.meta.env.DEV) console.warn('[TrendingMovies]', e); }

  return items;
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
