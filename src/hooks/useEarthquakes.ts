import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number; // ms timestamp
  url: string;
  coordinates?: [number, number]; // [lng, lat] from USGS GeoJSON, depth dropped
}

const API_URL = '/api/earthquake'; // worker proxy (USGS), rule #6
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
        if (!Array.isArray(json.data) || !mountedRef.current) return;

        // Worker already normalized the USGS GeoJSON to {id, magnitude, place, time, url, coordinates}.
        const results: Earthquake[] = json.data
          .slice(0, 12)
          .map((q: { id: string; magnitude: number; place: string; time: number; url: string; coordinates?: number[] }) => {
            const c = q.coordinates;
            const lngLat: [number, number] | undefined =
              Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number'
                ? [c[0], c[1]]
                : undefined;
            return {
              id: q.id,
              magnitude: q.magnitude,
              place: q.place,
              time: q.time,
              url: q.url,
              coordinates: lngLat,
            };
          });

        setQuakes(results);
        setCache(CACHE_KEY, results, 'earthquake');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Earthquakes]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return quakes;
}
