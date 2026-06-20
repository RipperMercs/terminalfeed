// OSV.dev recent open-source package advisories (incl. malicious packages).
// Worker-proxied (/api/supply-chain), KV-cached from the OSV GCS export.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface Advisory {
  id: string;
  ecosystem: string;
  package: string;
  malicious: boolean;
  severity: string | null;
  summary: string;
  modified: string;
}

export interface SupplyChainData {
  count: number;
  advisories: Advisory[];
  source: string;
}

const ENDPOINT = '/api/supply-chain';
const CACHE_KEY = 'supply-chain';
const POLL_MS = 12 * 60_000;

export function useSupplyChain(): SupplyChainData | null {
  const [data, setData] = useState<SupplyChainData | null>(() => getCache<SupplyChainData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: SupplyChainData | undefined = json?.data;
        if (!d || !Array.isArray(d.advisories)) return;
        setData(d);
        setCache(CACHE_KEY, d, 'supply-chain');
      } catch (e) { if (import.meta.env.DEV) console.warn('[SupplyChain]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
