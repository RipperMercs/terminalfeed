import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface ForexRate {
  currency: string;
  rate: number;
  change: number; // vs yesterday
}

const API_URL = '/api/forex';
const CACHE_KEY = 'forex_heatmap';
const POLL_MS = 5 * 60_000; // 5 min

const DISPLAY_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'SEK', 'CNY', 'INR', 'BRL', 'KRW', 'MXN', 'SGD', 'HKD'];

export function useForexHeatmap(): ForexRate[] {
  const [rates, setRates] = useState<ForexRate[]>(() => {
    return getCache<ForexRate[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const payload = json?.data ?? {};
        const current: Record<string, number> = payload.rates || {};
        const previous: Record<string, number> = payload.prevRates || {};

        const results: ForexRate[] = DISPLAY_CURRENCIES
          .filter(c => typeof current[c] === 'number')
          .map(currency => {
            const rate = current[currency];
            const prev = previous[currency] || rate;
            const change = prev > 0 ? ((rate - prev) / prev) * 100 : 0;
            return { currency, rate, change };
          });

        if (results.length > 0 && mountedRef.current) {
          setRates(results);
          setCache(CACHE_KEY, results, 'frankfurter');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[ForexHeatmap]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return rates;
}
