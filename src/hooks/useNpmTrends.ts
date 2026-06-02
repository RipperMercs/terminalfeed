// NPM Download Trends: what devs are building with
import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface NpmPackage {
  name: string;
  downloads: number;
}

const API_URL = '/api/npm-trends'; // worker proxy (npmjs), rule #6
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
        const json = await res.json();
        if (!Array.isArray(json.data)) return;

        // Worker returns { data: [{ package, downloads, date }] }.
        const results: NpmPackage[] = json.data
          .map((p: { package: string; downloads: number | null }) => ({
            name: p.package,
            downloads: p.downloads ?? 0,
          }))
          .filter((p: NpmPackage) => p.downloads > 0)
          .sort((a: NpmPackage, b: NpmPackage) => b.downloads - a.downloads);

        if (results.length > 0) {
          setPackages(results);
          setCache(CACHE_KEY, results, 'npm-trends');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[NpmTrends]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return packages;
}
