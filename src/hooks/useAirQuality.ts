import { useState, useEffect, useRef } from 'react';

export interface AirQualitySnapshot {
  time: string | null;
  usAqi: number | null;
  europeanAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
}

export type AirQualityLabel = 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface AirQualityCategory {
  label: AirQualityLabel;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'maroon';
}

export interface AirQualityData {
  lat: number;
  lon: number;
  snapshot: AirQualitySnapshot;
  category: AirQualityCategory | null;
  updatedAt: string;
}

const POLL_MS = 30 * 60_000;
const MOBILE_POLL_MS = 60 * 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useAirQuality(lat?: number, lon?: number) {
  const [data, setData] = useState<AirQualityData | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const qs = (typeof lat === 'number' && typeof lon === 'number')
          ? `?lat=${lat}&lon=${lon}`
          : '';
        const res = await fetch(`/api/air-quality${qs}`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        if (!mountedRef.current || !d || !d.snapshot) return;
        const s = d.snapshot;
        const c = d.category;
        setData({
          lat: typeof d.lat === 'number' ? d.lat : 34.05,
          lon: typeof d.lon === 'number' ? d.lon : -118.24,
          snapshot: {
            time: s.time ?? null,
            usAqi: s.us_aqi ?? null,
            europeanAqi: s.european_aqi ?? null,
            pm25: s.pm2_5 ?? null,
            pm10: s.pm10 ?? null,
            ozone: s.ozone ?? null,
            no2: s.nitrogen_dioxide ?? null,
            so2: s.sulphur_dioxide ?? null,
            co: s.carbon_monoxide ?? null,
          },
          category: c && c.label ? { label: c.label, color: c.color } : null,
          updatedAt: json?.updated_at ?? '',
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[AirQuality]', e); }
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
  }, [lat, lon]);

  return data;
}
