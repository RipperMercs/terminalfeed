import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface SpaceLaunch {
  id: string;
  name: string;
  provider: string;
  date: string; // human readable
  dateTs: number; // ms timestamp for countdown
  location: string;
  status: string; // "Go" | "TBD" | "TBC" | etc
}

const API_URL = '/api/launches'; // worker proxy (thespacedevs), rule #6
const CACHE_KEY = 'space_launches';
const POLL_MS = 30 * 60_000; // 30 min

interface LaunchRow {
  id?: string;
  name?: string;
  provider?: string;
  date?: string;
  dateTs?: number;
  location?: string;
  status?: string;
  status_abbrev?: string;
}

export function useSpaceLaunches(): SpaceLaunch[] {
  const [launches, setLaunches] = useState<SpaceLaunch[]>(() => {
    return getCache<SpaceLaunch[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        // Worker fetches thespacedevs server-side and returns id/provider/date/
        // dateTs/status_abbrev alongside the legacy fields.
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const rows: LaunchRow[] = Array.isArray(json.data) ? json.data : [];
        if (rows.length === 0) return;

        const results: SpaceLaunch[] = rows.map((l) => ({
          id: String(l.id ?? ''),
          name: l.name ?? 'Unknown Mission',
          provider: l.provider ?? 'Unknown',
          date: l.date ?? 'TBD',
          dateTs: l.dateTs ?? 0,
          location: l.location ?? 'Unknown',
          status: l.status_abbrev ?? l.status ?? 'TBD',
        }));

        setLaunches(results);
        setCache(CACHE_KEY, results, 'thespacedevs');
      } catch (e) { if (import.meta.env.DEV) console.warn('[SpaceLaunches]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return launches;
}
