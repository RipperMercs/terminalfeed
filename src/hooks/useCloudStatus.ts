import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface CloudProvider {
  name: string;
  status: 'operational' | 'incident' | 'unknown';
  incidents: { title: string; severity: string }[];
}

export interface CloudStatusData {
  providers: CloudProvider[];
}

const API_URL = '/api/cloud-status';
const CACHE_KEY = 'cloud_status';
const POLL_MS = 180_000;

export function useCloudStatus() {
  const [data, setData] = useState<CloudStatusData | null>(() => {
    const cached = getCache<CloudStatusData>(CACHE_KEY);
    return cached?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current) return;
        const providers: CloudProvider[] = Array.isArray(json.providers) ? json.providers : [];
        if (providers.length === 0) return;
        const result = { providers };
        setData(result);
        setCache(CACHE_KEY, result, 'worker');
      } catch { /* keep last known */ }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
