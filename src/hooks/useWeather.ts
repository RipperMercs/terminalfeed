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
const LOCATION_KEY = 'tf_weather_location';
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

interface SavedLocation {
  lat: number;
  lon: number;
  city: string;
}

function getSavedLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocation(loc: SavedLocation): void {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
  } catch {}
}


export function useWeather(): WeatherData | null {
  const [data, setData] = useState<WeatherData | null>(() => {
    return getCache<WeatherData>(CACHE_KEY)?.data ?? null;
  });
  const mountedRef = useRef(true);
  const locationRef = useRef<SavedLocation | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    const fetchWeather = async (lat: number, lon: number, city: string) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return;
        const json = await res.json();
        const c = json.current;
        if (!c || !mountedRef.current) return;

        const daily = json.daily;
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

    const init = async () => {
      // Check for saved location first
      let loc = getSavedLocation();

      if (!loc) {
        // IP-based geolocation — no browser prompt needed
        const ipApis = [
          'https://ipapi.co/json/',
          'https://ip-api.com/json/',
        ];
        for (const url of ipApis) {
          try {
            const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
            if (!res.ok) continue;
            const json = await res.json();
            const lat = json.latitude ?? json.lat;
            const lon = json.longitude ?? json.lon;
            const city = json.city ?? 'Unknown';
            if (lat && lon) {
              loc = { lat, lon, city };
              saveLocation(loc);
              break;
            }
          } catch {
            continue;
          }
        }
        // Final fallback — Los Angeles
        if (!loc) {
          loc = { lat: 34.05, lon: -118.24, city: 'Los Angeles' };
          saveLocation(loc);
        }
      }

      locationRef.current = loc;
      fetchWeather(loc.lat, loc.lon, loc.city);
    };

    init();

    const id = setInterval(() => {
      const loc = locationRef.current;
      if (loc) fetchWeather(loc.lat, loc.lon, loc.city);
    }, POLL_MS);

    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
