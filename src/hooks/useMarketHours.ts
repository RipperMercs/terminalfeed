import { useState, useEffect } from 'react';

export interface MarketInfo {
  name: string;
  abbr: string;
  flag: string;
  timezone: string;
  openHour: number;
  openMin: number;
  closeHour: number;
  closeMin: number;
  isOpen: boolean;
  isExtended: boolean;
  nextEvent: string;
  localTime: string;
  sortOrder: number;
}

interface MarketDef {
  name: string;
  abbr: string;
  flag: string;
  timezone: string;
  openHour: number;
  openMin: number;
  closeHour: number;
  closeMin: number;
  extended?: boolean;
}

const MARKETS: MarketDef[] = [
  { name: 'New York', abbr: 'NYSE', flag: 'US', timezone: 'America/New_York', openHour: 9, openMin: 30, closeHour: 16, closeMin: 0 },
  { name: 'Pre-Market', abbr: 'PRE', flag: 'US', timezone: 'America/New_York', openHour: 4, openMin: 0, closeHour: 9, closeMin: 30, extended: true },
  { name: 'After-Hours', abbr: 'AH', flag: 'US', timezone: 'America/New_York', openHour: 16, openMin: 0, closeHour: 20, closeMin: 0, extended: true },
  { name: 'London', abbr: 'LSE', flag: 'GB', timezone: 'Europe/London', openHour: 8, openMin: 0, closeHour: 16, closeMin: 30 },
  { name: 'Frankfurt', abbr: 'FRA', flag: 'DE', timezone: 'Europe/Berlin', openHour: 9, openMin: 0, closeHour: 17, closeMin: 30 },
  { name: 'Tokyo', abbr: 'TSE', flag: 'JP', timezone: 'Asia/Tokyo', openHour: 9, openMin: 0, closeHour: 15, closeMin: 0 },
  { name: 'Hong Kong', abbr: 'HKEX', flag: 'HK', timezone: 'Asia/Hong_Kong', openHour: 9, openMin: 30, closeHour: 16, closeMin: 0 },
  { name: 'Shanghai', abbr: 'SSE', flag: 'CN', timezone: 'Asia/Shanghai', openHour: 9, openMin: 30, closeHour: 15, closeMin: 0 },
  { name: 'Sydney', abbr: 'ASX', flag: 'AU', timezone: 'Australia/Sydney', openHour: 10, openMin: 0, closeHour: 16, closeMin: 0 },
  { name: 'Mumbai', abbr: 'NSE', flag: 'IN', timezone: 'Asia/Kolkata', openHour: 9, openMin: 15, closeHour: 15, closeMin: 30 },
  { name: 'Seoul', abbr: 'KRX', flag: 'KR', timezone: 'Asia/Seoul', openHour: 9, openMin: 0, closeHour: 15, closeMin: 30 },
  { name: 'Toronto', abbr: 'TSX', flag: 'CA', timezone: 'America/Toronto', openHour: 9, openMin: 30, closeHour: 16, closeMin: 0 },
  { name: 'Singapore', abbr: 'SGX', flag: 'SG', timezone: 'Asia/Singapore', openHour: 9, openMin: 0, closeHour: 17, closeMin: 0 },
  { name: 'Sao Paulo', abbr: 'B3', flag: 'BR', timezone: 'America/Sao_Paulo', openHour: 10, openMin: 0, closeHour: 17, closeMin: 0 },
];

function getMarketTime(tz: string): { hours: number; minutes: number; day: number; timeStr: string } {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dayStr = now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' });
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = dayMap[dayStr] ?? 1;

  return { hours, minutes, day, timeStr };
}

function formatDuration(mins: number): string {
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function useMarketHours() {
  const [markets, setMarkets] = useState<MarketInfo[]>([]);

  useEffect(() => {
    const update = () => {
      const results: MarketInfo[] = MARKETS.map((mkt) => {
        const { hours, minutes, day, timeStr } = getMarketTime(mkt.timezone);
        const currentMin = hours * 60 + minutes;
        const openMin = mkt.openHour * 60 + mkt.openMin;
        const closeMin = mkt.closeHour * 60 + mkt.closeMin;
        const isWeekend = day === 0 || day === 6;
        const isOpen = !isWeekend && currentMin >= openMin && currentMin < closeMin;

        let nextEvent = '';
        let sortOrder = 2; // closed

        if (isOpen) {
          const remaining = closeMin - currentMin;
          nextEvent = `closes ${formatDuration(remaining)}`;
          sortOrder = mkt.extended ? 1 : 0; // extended hours sort after regular
        } else if (!isWeekend && currentMin < openMin) {
          nextEvent = `opens ${formatDuration(openMin - currentMin)}`;
        } else if (isWeekend) {
          nextEvent = 'opens Mon';
        } else {
          nextEvent = `opens ${formatDuration(24 * 60 - currentMin + openMin)}`;
        }

        return {
          name: mkt.name,
          abbr: mkt.abbr,
          flag: mkt.flag,
          timezone: mkt.timezone,
          openHour: mkt.openHour,
          openMin: mkt.openMin,
          closeHour: mkt.closeHour,
          closeMin: mkt.closeMin,
          isOpen,
          isExtended: mkt.extended ?? false,
          nextEvent,
          localTime: timeStr,
          sortOrder,
        };
      });

      // Sort: open first (regular, then extended), then closed
      results.sort((a, b) => a.sortOrder - b.sortOrder);

      // Add crypto at the end
      results.push({
        name: 'Crypto',
        abbr: 'BTC',
        flag: '',
        timezone: 'UTC',
        openHour: 0,
        openMin: 0,
        closeHour: 24,
        closeMin: 0,
        isOpen: true,
        isExtended: false,
        nextEvent: '24/7/365',
        localTime: '',
        sortOrder: -1,
      });

      setMarkets(results);
    };

    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, []);

  return markets;
}
