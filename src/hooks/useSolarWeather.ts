import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface SolarEvent {
  type: string; // 'FLR' | 'CME' | 'GST'
  time: string;
  classType: string; // e.g. 'M1.2', 'X2.5'
  severity: 'low' | 'moderate' | 'high' | 'extreme';
}

export interface SolarData {
  events: SolarEvent[];
  kpIndex: number; // geomagnetic index 0-9
  solarWindSpeed: number;
}

const CACHE_KEY = 'solar_weather';
const POLL_MS = 15 * 60_000; // 15 min

export function useSolarWeather(): SolarData | null {
  const [data, setData] = useState<SolarData | null>(() => {
    return getCache<SolarData>(CACHE_KEY)?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        const startDate = weekAgo.toISOString().slice(0, 10);
        const endDate = now.toISOString().slice(0, 10);

        // Fetch solar flares
        const [flrRes, gstRes] = await Promise.allSettled([
          fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${endDate}&api_key=DEMO_KEY`, { signal: AbortSignal.timeout(8000) }),
          fetch(`https://api.nasa.gov/DONKI/GST?startDate=${startDate}&endDate=${endDate}&api_key=DEMO_KEY`, { signal: AbortSignal.timeout(8000) }),
        ]);

        if (!mountedRef.current) return;

        const events: SolarEvent[] = [];

        // Parse flares
        if (flrRes.status === 'fulfilled' && flrRes.value.ok) {
          const flares = await flrRes.value.json();
          if (Array.isArray(flares)) {
            for (const f of flares.slice(-5)) {
              const cls = f.classType || '';
              events.push({
                type: 'FLR',
                time: f.beginTime || '',
                classType: cls,
                severity: cls.startsWith('X') ? 'extreme' : cls.startsWith('M') ? 'high' : cls.startsWith('C') ? 'moderate' : 'low',
              });
            }
          }
        }

        // Parse geomagnetic storms
        if (gstRes.status === 'fulfilled' && gstRes.value.ok) {
          const storms = await gstRes.value.json();
          if (Array.isArray(storms)) {
            for (const s of storms.slice(-3)) {
              const kp = s.allKpIndex?.[0]?.kpIndex ?? 0;
              events.push({
                type: 'GST',
                time: s.startTime || '',
                classType: `Kp${kp}`,
                severity: kp >= 8 ? 'extreme' : kp >= 6 ? 'high' : kp >= 4 ? 'moderate' : 'low',
              });
            }
          }
        }

        events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        const result: SolarData = {
          events: events.slice(0, 6),
          kpIndex: 0,
          solarWindSpeed: 0,
        };

        setData(result);
        setCache(CACHE_KEY, result, 'nasa-donki');
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
