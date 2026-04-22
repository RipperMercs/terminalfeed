// World Clocks: shows time in major financial/tech cities
// Pure client-side, no API needed

import { useState, useEffect } from 'react';

export interface WorldClock {
  city: string;
  timezone: string;
  time: string;
  date: string;
  isBusinessHours: boolean;
}

const CITIES = [
  { city: 'New York', timezone: 'America/New_York' },
  { city: 'London', timezone: 'Europe/London' },
  { city: 'Tokyo', timezone: 'Asia/Tokyo' },
  { city: 'Sydney', timezone: 'Australia/Sydney' },
  { city: 'Dubai', timezone: 'Asia/Dubai' },
  { city: 'Singapore', timezone: 'Asia/Singapore' },
  { city: 'Berlin', timezone: 'Europe/Berlin' },
  { city: 'São Paulo', timezone: 'America/Sao_Paulo' },
];

function getClocks(): WorldClock[] {
  const now = new Date();
  return CITIES.map(({ city, timezone }) => {
    const time = now.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false });
    const date = now.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' });
    const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }));
    const isBusinessHours = hour >= 8 && hour < 18;
    return { city, timezone, time, date, isBusinessHours };
  });
}

export function useWorldClock(): WorldClock[] {
  const [clocks, setClocks] = useState<WorldClock[]>(getClocks);

  useEffect(() => {
    const id = setInterval(() => setClocks(getClocks()), 5000);
    return () => clearInterval(id);
  }, []);

  return clocks;
}
