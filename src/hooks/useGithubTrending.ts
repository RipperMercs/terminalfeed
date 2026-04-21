import { useState, useEffect, useRef } from 'react';

export interface TrendingRepo {
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  todayStars: number;
  url: string;
}

// GitHub trending via unofficial API
const POLL_MS = 5 * 60_000; // 5 min

export function useGithubTrending() {
  const [repos, setRepos] = useState<TrendingRepo[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchTrending = async () => {
      if (!mountedRef.current) return;
      try {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        const since = date.toISOString().split('T')[0];

        const res = await fetch(`/api/gh-trending?since=${since}`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        if (!mountedRef.current) return;

        setRepos(
          items.map((item: { name: string; fullName: string; description: string; language: string; stars: number; url: string }) => ({
            name: item.name,
            fullName: item.fullName,
            description: item.description || '',
            language: item.language || '',
            stars: item.stars ?? 0,
            todayStars: item.stars ?? 0,
            url: item.url,
          })),
        );
      } catch (e) { if (import.meta.env.DEV) console.warn('[GithubTrending]', e); }
    };

    fetchTrending();
    const id = setInterval(fetchTrending, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return repos;
}
