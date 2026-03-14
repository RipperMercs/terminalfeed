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
const POLL_MS = 15 * 60_000; // 15 min

export function useGithubTrending() {
  const [repos, setRepos] = useState<TrendingRepo[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchTrending = async () => {
      if (!mountedRef.current) return;
      try {
        // Use GitHub search API sorted by stars, created in last 7 days
        const date = new Date();
        date.setDate(date.getDate() - 7);
        const since = date.toISOString().split('T')[0];

        const res = await fetch(
          `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=10`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mountedRef.current || !data.items) return;

        setRepos(
          data.items.map((item: any) => ({
            name: item.name,
            fullName: item.full_name,
            description: item.description || '',
            language: item.language || '',
            stars: item.stargazers_count,
            todayStars: item.stargazers_count, // approx
            url: item.html_url,
          })),
        );
      } catch {}
    };

    fetchTrending();
    const id = setInterval(fetchTrending, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return repos;
}
