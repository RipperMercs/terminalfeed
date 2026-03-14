import { useState, useEffect } from 'react';

export interface MarketInfo {
  name: string;
  abbr: string;
  timezone: string;
  openHour: number;
  openMin: number;
  closeHour: number;
  closeMin: number;
  isOpen: boolean;
  nextEvent: string; // "opens in 2h 14m" or "closes in 45m"
  localTime: string;
}

const MARKETS = [
  { name: 'New York', abbr: 'NYSE', timezone: 'America/New_York', openHour: 9, openMin: 30, closeHour: 16, closeMin: 0 },
  { name: 'London', abbr: 'LSE', timezone: 'Europe/London', openHour: 8, openMin: 0, closeHour: 16, closeMin: 30 },
  { name: 'Tokyo', abbr: 'TSE', timezone: 'Asia/Tokyo', openHour: 9, openMin: 0, closeHour: 15, closeMin: 0 },
  { name: 'Hong Kong', abbr: 'HKEX', timezone: 'Asia/Hong_Kong', openHour: 9, openMin: 30, closeHour: 16, closeMin: 0 },
  { name: 'Sydney', abbr: 'ASX', timezone: 'Australia/Sydney', openHour: 10, openMin: 0, closeHour: 16, closeMin: 0 },
  { name: 'Frankfurt', abbr: 'FRA', timezone: 'Europe/Berlin', openHour: 9, openMin: 0, closeHour: 17, closeMin: 30 },
  { name: 'Toronto', abbr: 'TSX', timezone: 'America/Toronto', openHour: 9, openMin: 30, closeHour: 16, closeMin: 0 },
  { name: 'Bitcoin', abbr: 'BTC', timezone: 'UTC', openHour: 0, openMin: 0, closeHour: 24, closeMin: 0 },
];

function getMarketTime(tz: string): { hours: number; minutes: number; day: number; timeStr: string } {
  const now = new Date();
  const str = now.toLocaleString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  });
  const parts = str.split(', ');
  const dayStr = parts[0] || '';
  const timeParts = (parts[1] || parts[0]).split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = dayMap[dayStr] ?? new Date().getDay();

  const timeStr = now.toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return { hours, minutes, day, timeStr };
}

function formatDuration(minutes: number): string {
  if (minutes < 0) minutes += 24 * 60;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function useMarketHours() {
  const [markets, setMarkets] = useState<MarketInfo[]>([]);

  useEffect(() => {
    const update = () => {
      setMarkets(
        MARKETS.map((mkt) => {
          // BTC is always open
          if (mkt.abbr === 'BTC') {
            return {
              name: mkt.name,
              abbr: mkt.abbr,
              timezone: mkt.timezone,
              openHour: mkt.openHour,
              openMin: mkt.openMin,
              closeHour: mkt.closeHour,
              closeMin: mkt.closeMin,
              isOpen: true,
              nextEvent: '24/7',
              localTime: '',
            };
          }

          const { hours, minutes, day, timeStr } = getMarketTime(mkt.timezone);
          const currentMin = hours * 60 + minutes;
          const openMin = mkt.openHour * 60 + mkt.openMin;
          const closeMin = mkt.closeHour * 60 + mkt.closeMin;
          const isWeekend = day === 0 || day === 6;
          const isOpen = !isWeekend && currentMin >= openMin && currentMin < closeMin;

          let nextEvent = '';
          if (isOpen) {
            nextEvent = `closes ${formatDuration(closeMin - currentMin)}`;
          } else if (!isWeekend && currentMin < openMin) {
            nextEvent = `opens ${formatDuration(openMin - currentMin)}`;
          } else {
            // After hours or weekend — calculate time to next Monday open
            const daysUntilMonday = day === 6 ? 2 : day === 0 ? 1 : 0;
            if (daysUntilMonday > 0) {
              nextEvent = `opens Mon`;
            } else {
              nextEvent = `opens ${formatDuration(24 * 60 - currentMin + openMin)}`;
            }
          }

          return {
            name: mkt.name,
            abbr: mkt.abbr,
            timezone: mkt.timezone,
            openHour: mkt.openHour,
            openMin: mkt.openMin,
            closeHour: mkt.closeHour,
            closeMin: mkt.closeMin,
            isOpen,
            nextEvent,
            localTime: timeStr,
          };
        }),
      );
    };

    update();
    const id = setInterval(update, 30_000); // update every 30s
    return () => clearInterval(id);
  }, []);

  return markets;
}
