// CISA KEV (in-the-wild exploited) + NIST NVD recent CVEs.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface KevVuln {
  cve: string;
  vendor: string;
  product: string;
  name: string;
  date_added: string;
  due_date: string;
  known_ransomware: boolean;
  short_description: string;
  url: string;
}

export interface NvdVuln {
  cve: string;
  published: string;
  modified: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  score: number | null;
  description: string;
  url: string;
}

export interface CveData {
  kev_exploited: KevVuln[];
  nvd_recent: NvdVuln[];
  kev_count: number;
  nvd_count: number;
}

const ENDPOINT = '/api/cve';
const CACHE_KEY = 'cve';
const POLL_MS = 5 * 60_000;

export function useCve(): CveData | null {
  const [data, setData] = useState<CveData | null>(() => getCache<CveData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: CveData | undefined = json?.data;
        if (!d) return;
        setData(d);
        setCache(CACHE_KEY, d, 'cve');
      } catch (e) { if (import.meta.env.DEV) console.warn('[CVE]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
