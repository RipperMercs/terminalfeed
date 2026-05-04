import { useState, useEffect, useRef } from 'react';

export interface ShodanTarget {
  name: string;
  ip: string;
  ports: number[];
  vulns: string[];
  hostnames: string[];
  tags: string[];
  cpes: string[];
  error?: string;
}

export interface ShodanData {
  targets: ShodanTarget[];
  updatedAt: string;
}

const POLL_MS = 60 * 60_000;
const MOBILE_POLL_MS = 120 * 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useShodan() {
  const [data, setData] = useState<ShodanData | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/shodan', { signal: AbortSignal.timeout(10000) });
        if (!res.ok) return;
        const json = await res.json();
        const targets = json?.data?.targets;
        if (!mountedRef.current || !Array.isArray(targets)) return;
        setData({
          targets: targets.map((t: Record<string, unknown>) => ({
            name: typeof t.name === 'string' ? t.name : '',
            ip: typeof t.ip === 'string' ? t.ip : '',
            ports: Array.isArray(t.ports) ? (t.ports as number[]).slice(0, 30) : [],
            vulns: Array.isArray(t.vulns) ? (t.vulns as string[]).slice(0, 20) : [],
            hostnames: Array.isArray(t.hostnames) ? (t.hostnames as string[]).slice(0, 10) : [],
            tags: Array.isArray(t.tags) ? (t.tags as string[]).slice(0, 10) : [],
            cpes: Array.isArray(t.cpes) ? (t.cpes as string[]).slice(0, 10) : [],
            error: typeof t.error === 'string' ? t.error : undefined,
          })),
          updatedAt: json?.updated_at ?? '',
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[Shodan]', e); }
    };

    const poll = isMobile() ? MOBILE_POLL_MS : POLL_MS;
    fetchData();
    intervalRef.current = setInterval(fetchData, poll);

    const onVisChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchData();
        intervalRef.current = setInterval(fetchData, poll);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return data;
}
