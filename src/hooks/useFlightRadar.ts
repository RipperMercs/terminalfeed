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

const API_URL = '/api/aviation';
const CACHE_KEY = 'flight_radar';
const POLL_MS = 120_000; // 2 minutes: respectful to free API
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
        // Worker proxies OpenSky and returns the precomputed rollup (rule #6).
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current || typeof json.totalAirborne !== 'number') return;

        const result: FlightStats = {
          totalAirborne: json.totalAirborne,
          totalOnGround: json.totalOnGround ?? 0,
          topCountries: Array.isArray(json.topCountries) ? json.topCountries : [],
          avgAltitude: json.avgAltitude ?? 0,
          avgSpeed: json.avgSpeed ?? 0,
          timestamp: json.timestamp ?? Math.floor(Date.now() / 1000),
        };

        setStats(result);
        setStatus('ready');
        setCache(CACHE_KEY, result, 'aviation');
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
