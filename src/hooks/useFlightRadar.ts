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

const API_URL = 'https://opensky-network.org/api/states/all';
const CACHE_KEY = 'flight_radar';
const POLL_MS = 120_000; // 2 minutes — respectful to free API

export function useFlightRadar() {
  const [stats, setStats] = useState<FlightStats | null>(() => {
    const cached = getCache<FlightStats>(CACHE_KEY);
    return cached?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchFlights = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(15000) });
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
        setCache(CACHE_KEY, result, 'opensky');
      } catch {}
    };

    fetchFlights();
    const id = setInterval(fetchFlights, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return stats;
}
