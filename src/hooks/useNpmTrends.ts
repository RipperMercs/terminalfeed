// NPM Download Trends — what devs are building with
import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface NpmPackage {
  name: string;
  downloads: number;
}

const PACKAGES = ['react', 'next', 'vue', 'svelte', 'typescript', 'tailwindcss', 'vite', 'express', 'axios', 'zod'];
const API_URL = `https://api.npmjs.org/downloads/point/last-day/${PACKAGES.join(',')}`;
const CACHE_KEY = 'npm_trends';
const POLL_MS = 60 * 60_000; // 1 hour

export function useNpmTrends(): NpmPackage[] {
  const [packages, setPackages] = useState<NpmPackage[]>(() => {
    return getCache<NpmPackage[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const data = await res.json();

        const results: NpmPackage[] = PACKAGES
          .map(name => ({
            name,
            downloads: data[name]?.downloads ?? 0,
          }))
          .filter(p => p.downloads > 0)
          .sort((a, b) => b.downloads - a.downloads);

        if (results.length > 0) {
          setPackages(results);
          setCache(CACHE_KEY, results, 'npmjs');
        }
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return packages;
}
