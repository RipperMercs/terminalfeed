import { useEffect, useState, useRef } from 'react';

export interface ISSData {
  latitude: number;
  longitude: number;
  timestamp: number;
  location: string; // reverse geocoded approximate location
}

const API_URL = 'http://api.open-notify.org/iss-now.json';
const CREW_URL = 'http://api.open-notify.org/astros.json';
const POLL_MS = 10_000; // 10 seconds

function approxLocation(lat: number, lon: number): string {
  // Simple reverse geocode based on coordinates
  if (lat > 60) return 'Arctic Region';
  if (lat < -60) return 'Antarctic Region';

  // Ocean checks (rough)
  if (lon > -30 && lon < 30 && lat > -35 && lat < 35) return 'Atlantic Ocean';
  if (lon > 100 || lon < -100) {
    if (lat > -10 && lat < 60) return 'Pacific Ocean';
    return 'Pacific Ocean';
  }

  // Continent approximations
  if (lon > -130 && lon < -60 && lat > 25 && lat < 50) return 'North America';
  if (lon > -130 && lon < -60 && lat > 10 && lat < 25) return 'Central America';
  if (lon > -85 && lon < -34 && lat > -56 && lat < 10) return 'South America';
  if (lon > -15 && lon < 40 && lat > 35 && lat < 72) return 'Europe';
  if (lon > -20 && lon < 55 && lat > -35 && lat < 35) return 'Africa';
  if (lon > 40 && lon < 100 && lat > 5 && lat < 55) return 'Asia';
  if (lon > 100 && lon < 155 && lat > -45 && lat < 0) return 'Australia';
  if (lon > 60 && lon < 150 && lat > 10 && lat < 55) return 'East Asia';
  if (lon > 20 && lon < 60 && lat > 10 && lat < 45) return 'Middle East';

  return 'Over Ocean';
}

export function useISSPosition() {
  const [data, setData] = useState<ISSData | null>(null);
  const [crewCount, setCrewCount] = useState<number>(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchPos = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        if (json.message !== 'success') return;

        const lat = parseFloat(json.iss_position.latitude);
        const lon = parseFloat(json.iss_position.longitude);

        setData({
          latitude: lat,
          longitude: lon,
          timestamp: json.timestamp * 1000,
          location: approxLocation(lat, lon),
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[ISSPosition]', e); }
    };

    const fetchCrew = async () => {
      try {
        const res = await fetch(CREW_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        if (json.message === 'success') {
          setCrewCount(json.number ?? 0);
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[ISSPosition]', e); }
    };

    fetchPos();
    fetchCrew();
    const id = setInterval(fetchPos, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return { position: data, crewCount };
}
