// Daily downloads for curated Python packages. Worker may return a partial
// list when pypistats.org rate-limits us, so consumers should not assume a
// fixed length.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface PypiPackage {
  package: string;
  downloads_last_day: number | null;
  downloads_last_week: number | null;
  downloads_last_month: number | null;
}

const ENDPOINT = '/api/pypi-trends';
const CACHE_KEY = 'pypi-trends';
const POLL_MS = 6 * 60 * 60_000;  // 6h

export function usePypiTrends(): PypiPackage[] {
  const [pkgs, setPkgs] = useState<PypiPackage[]>(() => getCache<PypiPackage[]>(CACHE_KEY)?.data ?? []);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const arr: PypiPackage[] = Array.isArray(json?.data) ? json.data : [];
        if (arr.length === 0) return;
        setPkgs(arr);
        setCache(CACHE_KEY, arr, 'pypi-trends');
      } catch (e) { if (import.meta.env.DEV) console.warn('[PyPI]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return pkgs;
}
