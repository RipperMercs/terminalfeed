import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface DailyForecast {
  date: string;      // ISO YYYY-MM-DD
  high: number;      // °F
  low: number;       // °F
  weatherCode: number;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
  city: string;
  high: number;
  low: number;
  sunrise: string;
  sunset: string;
  isDaytime: boolean;
  forecast: DailyForecast[];
}

const CACHE_KEY = 'weather';
const POLL_MS = 5 * 60_000; // 5 min

// WMO weather codes → descriptions + icons
const WMO_CODES: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Clear', icon: '☀' },
  1: { desc: 'Mostly Clear', icon: '🌤' },
  2: { desc: 'Partly Cloudy', icon: '⛅' },
  3: { desc: 'Overcast', icon: '☁' },
  45: { desc: 'Fog', icon: '🌫' },
  48: { desc: 'Rime Fog', icon: '🌫' },
  51: { desc: 'Light Drizzle', icon: '🌦' },
  53: { desc: 'Drizzle', icon: '🌦' },
  55: { desc: 'Heavy Drizzle', icon: '🌧' },
  61: { desc: 'Light Rain', icon: '🌧' },
  63: { desc: 'Rain', icon: '🌧' },
  65: { desc: 'Heavy Rain', icon: '🌧' },
  71: { desc: 'Light Snow', icon: '🌨' },
  73: { desc: 'Snow', icon: '❄' },
  75: { desc: 'Heavy Snow', icon: '❄' },
  80: { desc: 'Rain Showers', icon: '🌦' },
  81: { desc: 'Rain Showers', icon: '🌧' },
  82: { desc: 'Heavy Showers', icon: '🌧' },
  95: { desc: 'Thunderstorm', icon: '⛈' },
  96: { desc: 'Thunderstorm + Hail', icon: '⛈' },
  99: { desc: 'Thunderstorm + Hail', icon: '⛈' },
};

export function weatherDescription(code: number): { desc: string; icon: string } {
  return WMO_CODES[code] ?? { desc: 'Unknown', icon: '?' };
}

export function useWeather(): WeatherData | null {
  const [data, setData] = useState<WeatherData | null>(() => {
    return getCache<WeatherData>(CACHE_KEY)?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchWeather = async () => {
      try {
        // worker proxy (open-meteo), rule #6. The worker geolocates the visitor
        // from the Cloudflare edge (request.cf), so no client-side IP lookup is
        // needed and the response carries the resolved city.
        const res = await fetch('/api/weather', { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const c = json.data?.current;
        if (!c) return;
        const city = json.city || 'Los Angeles';

        const daily = json.data?.daily;
        const sunrise = daily?.sunrise?.[0] || '';
        const sunset = daily?.sunset?.[0] || '';
        const now = new Date();
        const isDaytime = sunrise && sunset
          ? now >= new Date(sunrise) && now <= new Date(sunset)
          : now.getHours() >= 6 && now.getHours() <= 19;

        const dailyDates: string[] = daily?.time ?? [];
        const dailyHighs: number[] = daily?.temperature_2m_max ?? [];
        const dailyLows: number[] = daily?.temperature_2m_min ?? [];
        const dailyCodes: number[] = daily?.weather_code ?? [];
        const forecast: DailyForecast[] = dailyDates.map((d, i) => ({
          date: d,
          high: Math.round(dailyHighs[i] ?? c.temperature_2m),
          low: Math.round(dailyLows[i] ?? c.temperature_2m),
          weatherCode: dailyCodes[i] ?? c.weather_code,
        }));

        const result: WeatherData = {
          temperature: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature ?? c.temperature_2m),
          windSpeed: Math.round(c.wind_speed_10m),
          humidity: Math.round(c.relative_humidity_2m),
          weatherCode: c.weather_code,
          city,
          high: Math.round(daily?.temperature_2m_max?.[0] ?? c.temperature_2m),
          low: Math.round(daily?.temperature_2m_min?.[0] ?? c.temperature_2m),
          sunrise: sunrise ? new Date(sunrise).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
          sunset: sunset ? new Date(sunset).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
          isDaytime,
          forecast,
        };

        setData(result);
        setCache(CACHE_KEY, result, 'open-meteo');
      } catch (e) { if (import.meta.env.DEV) console.warn('[Weather]', e); }
    };

    fetchWeather();
    const id = setInterval(fetchWeather, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
