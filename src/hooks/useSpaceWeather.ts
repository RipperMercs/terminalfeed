import { useState, useEffect, useRef } from 'react';

export interface SpaceWeatherAlert {
  issue_time: string;
  message: string;
  product_id: string;
}

export interface SpaceWeatherData {
  kpIndex: number | null;
  kpStormLevel: string | null;
  auroraVisibility: string | null;
  solarWindSpeedKms: number | null;
  solarWindDensity: number | null;
  flareClass24h: string | null;
  activeAlerts: SpaceWeatherAlert[];
  updatedAt: string;
}

const POLL_MS = 5 * 60_000;
const MOBILE_POLL_MS = 10 * 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useSpaceWeather() {
  const [data, setData] = useState<SpaceWeatherData | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/space-weather', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        if (!mountedRef.current || !d) return;
        setData({
          kpIndex: d.kp_index ?? null,
          kpStormLevel: d.kp_storm_level ?? null,
          auroraVisibility: d.aurora_visibility ?? null,
          solarWindSpeedKms: d.solar_wind_speed_kms ?? null,
          solarWindDensity: d.solar_wind_density ?? null,
          flareClass24h: d.flare_class_24h ?? null,
          activeAlerts: Array.isArray(d.active_alerts) ? d.active_alerts.slice(0, 3) : [],
          updatedAt: json?.updated_at ?? '',
        });
      } catch (e) { if (import.meta.env.DEV) console.warn('[SpaceWeather]', e); }
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
  }, []);

  return data;
}
