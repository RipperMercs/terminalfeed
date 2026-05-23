// Last-24h GitHub releases from a curated list of major repos. Worker
// aggregates 12 repos; we just consume.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface GhRelease {
  repo: string;          // 'microsoft/vscode'
  tag: string;
  name: string;
  prerelease: boolean;
  published_at: string;
  url: string;
  author: string | null;
}

export interface GhReleasesData {
  recent: GhRelease[];          // top 25 across all tracked repos
  fresh_24h: GhRelease[];       // subset published in last 24h
  repos_tracked: number;
  fresh_count: number;
}

const ENDPOINT = '/api/gh-releases';
const CACHE_KEY = 'gh-releases';
const POLL_MS = 60 * 60_000;   // 1h to match Worker cache

export function useGhReleases(): GhReleasesData | null {
  const [data, setData] = useState<GhReleasesData | null>(() => getCache<GhReleasesData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: GhReleasesData | undefined = json?.data;
        if (!d || !Array.isArray(d.recent)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'gh-releases');
      } catch (e) { if (import.meta.env.DEV) console.warn('[GhReleases]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
