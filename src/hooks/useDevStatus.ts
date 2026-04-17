import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface ServiceStatus {
  name: string;
  indicator: 'none' | 'minor' | 'major' | 'critical' | 'unknown';
  description: string;
}

const API_URL = '/api/service-status';
const CACHE_KEY = 'dev_status';
const POLL_MS = 120_000;

const PLACEHOLDER_SERVICES = [
  'GitHub', 'Cloudflare', 'Vercel', 'OpenAI', 'Anthropic', 'npm',
  'Discord', 'Slack', 'Atlassian', 'Reddit', 'Stripe', 'Zoom', 'Datadog',
];

export function useDevStatus(): ServiceStatus[] {
  const [statuses, setStatuses] = useState<ServiceStatus[]>(() => {
    const cached = getCache<ServiceStatus[]>(CACHE_KEY);
    return cached?.data ?? PLACEHOLDER_SERVICES.map(name => ({
      name,
      indicator: 'unknown' as const,
      description: 'Checking...',
    }));
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
        const data: ServiceStatus[] = Array.isArray(json.data) ? json.data : [];
        if (data.length === 0) return;
        setStatuses(data);
        setCache(CACHE_KEY, data, 'worker');
      } catch { /* keep last known */ }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return statuses;
}
