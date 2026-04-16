import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface FlightStats {
  totalAirborne: number;
  totalOnGround: number;
  topCountries: { country: string; count: number }[];
  avgAltitude: number; // meters
  avgSpeed: number; // m/s
  timestamp: number;
}

export type FlightStatus = 'loading' | 'ready' | 'failed';

const API_URL = 'https://opensky-network.org/api/states/all';
const CACHE_KEY = 'flight_radar';
const POLL_MS = 120_000; // 2 minutes — respectful to free API
const FETCH_TIMEOUT_MS = 8_000;
const FAIL_AFTER_MS = 10_000;

export function useFlightRadar(): { stats: FlightStats | null; status: FlightStatus } {
  const cached = getCache<FlightStats>(CACHE_KEY)?.data ?? null;
  const [stats, setStats] = useState<FlightStats | null>(cached);
  const [status, setStatus] = useState<FlightStatus>(cached ? 'ready' : 'loading');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // OpenSky is notoriously flaky. Self-heal: if first fetch doesn't return within FAIL_AFTER_MS
    // and we have no cache, mark failed so the panel hides instead of sticking on "Contacting...".
    const failTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      setStatus(prev => (prev === 'loading' ? 'failed' : prev));
    }, FAIL_AFTER_MS);

    const fetchFlights = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current || !json.states) return;

        const states: any[][] = json.states;
        let airborne = 0;
        let onGround = 0;
        let altSum = 0;
        let altCount = 0;
        let spdSum = 0;
        let spdCount = 0;
        const countryCounts: Record<string, number> = {};

        for (const s of states) {
          const isOnGround = s[8];
          if (isOnGround) { onGround++; } else { airborne++; }

          const alt = s[7]; // baro altitude in meters
          if (alt != null && !isOnGround) { altSum += alt; altCount++; }

          const spd = s[9]; // velocity m/s
          if (spd != null && !isOnGround) { spdSum += spd; spdCount++; }

          const country = s[2] as string;
          if (country) countryCounts[country] = (countryCounts[country] || 0) + 1;
        }

        const topCountries = Object.entries(countryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([country, count]) => ({ country, count }));

        const result: FlightStats = {
          totalAirborne: airborne,
          totalOnGround: onGround,
          topCountries,
          avgAltitude: altCount > 0 ? Math.round(altSum / altCount) : 0,
          avgSpeed: spdCount > 0 ? Math.round(spdSum / spdCount) : 0,
          timestamp: json.time,
        };

        setStats(result);
        setStatus('ready');
        setCache(CACHE_KEY, result, 'opensky');
      } catch (e) { if (import.meta.env.DEV) console.warn('[FlightRadar]', e); }
    };

    fetchFlights();
    const id = setInterval(fetchFlights, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
      clearTimeout(failTimer);
    };
  }, []);

  return { stats, status };
}
