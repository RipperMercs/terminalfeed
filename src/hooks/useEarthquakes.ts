import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number; // ms timestamp
  url: string;
}

const API_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
const CACHE_KEY = 'earthquakes';
const POLL_MS = 2 * 60_000; // 2 min

export function useEarthquakes(): Earthquake[] {
  const [quakes, setQuakes] = useState<Earthquake[]>(() => {
    return getCache<Earthquake[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!json.features || !mountedRef.current) return;

        const results: Earthquake[] = json.features
          .slice(0, 12)
          .map((f: { id: string; properties: { mag: number; place: string; time: number; url: string } }) => ({
            id: f.id,
            magnitude: f.properties.mag,
            place: f.properties.place,
            time: f.properties.time,
            url: f.properties.url,
          }));

        setQuakes(results);
        setCache(CACHE_KEY, results, 'usgs');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Earthquakes]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return quakes;
}
