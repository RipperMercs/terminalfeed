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

const API_URL = 'https://fdo.rocketlaunch.live/json/launches/next/5';
const FALLBACK_URL = 'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=5&mode=list';
const CACHE_KEY = 'space_launches';
const POLL_MS = 30 * 60_000; // 30 min

export function useSpaceLaunches(): SpaceLaunch[] {
  const [launches, setLaunches] = useState<SpaceLaunch[]>(() => {
    return getCache<SpaceLaunch[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchPrimary = async (): Promise<SpaceLaunch[] | null> => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;
        const json = await res.json();
        if (!json.result?.length) return null;

        return json.result.map((l: {
          id: number;
          name: string;
          provider: { name: string };
          date_str: string;
          t0: string;
          pad: { location: { name: string } };
          launch_description: string;
        }) => ({
          id: String(l.id),
          name: l.name ?? l.launch_description ?? 'Unknown Mission',
          provider: l.provider?.name ?? 'Unknown',
          date: l.date_str ?? 'TBD',
          dateTs: l.t0 ? new Date(l.t0).getTime() : 0,
          location: l.pad?.location?.name ?? 'Unknown',
          status: 'Go',
        }));
      } catch {
        return null;
      }
    };

    const fetchFallback = async (): Promise<SpaceLaunch[] | null> => {
      try {
        const res = await fetch(FALLBACK_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;
        const json = await res.json();
        if (!json.results?.length) return null;

        return json.results.map((l: {
          id: string;
          name: string;
          launch_service_provider: { name: string };
          net: string;
          pad: { location: { name: string } };
          status: { abbrev: string };
        }) => ({
          id: l.id,
          name: l.name ?? 'Unknown Mission',
          provider: l.launch_service_provider?.name ?? 'Unknown',
          date: l.net ? new Date(l.net).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
          dateTs: l.net ? new Date(l.net).getTime() : 0,
          location: l.pad?.location?.name ?? 'Unknown',
          status: l.status?.abbrev ?? 'TBD',
        }));
      } catch {
        return null;
      }
    };

    const fetch_ = async () => {
      let results = await fetchPrimary();
      if (!results) results = await fetchFallback();
      if (!results || !mountedRef.current) return;

      setLaunches(results);
      setCache(CACHE_KEY, results, 'rocketlaunch.live');
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return launches;
}
