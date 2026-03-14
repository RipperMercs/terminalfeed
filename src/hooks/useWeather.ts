import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
  city: string;
}

const CACHE_KEY = 'weather';
const LOCATION_KEY = 'tf_weather_location';
const POLL_MS = 15 * 60_000; // 15 min

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
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return;
        const json = await res.json();
        const c = json.current;
        if (!c || !mountedRef.current) return;

        const result: WeatherData = {
          temperature: Math.round(c.temperature_2m),
          windSpeed: Math.round(c.wind_speed_10m),
          humidity: Math.round(c.relative_humidity_2m),
          weatherCode: c.weather_code,
          city,
        };

        setData(result);
        setCache(CACHE_KEY, result, 'open-meteo');
      } catch {}
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
