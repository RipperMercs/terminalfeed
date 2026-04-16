import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface ForexRate {
  currency: string;
  rate: number;
  change: number; // vs yesterday
}

const API_URL = 'https://api.frankfurter.app/latest?from=USD';
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
        // Get today's rates
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok || !mountedRef.current) return;
        const data = await res.json();

        // Get yesterday's rates for change calculation
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        let prevRates: Record<string, number> = {};
        try {
          const yRes = await fetch(`https://api.frankfurter.app/${yStr}?from=USD`, { signal: AbortSignal.timeout(5000) });
          if (yRes.ok) {
            const yData = await yRes.json();
            prevRates = yData.rates || {};
          }
        } catch (e) { if (import.meta.env.DEV) console.warn('[ForexHeatmap]', e); }

        const results: ForexRate[] = DISPLAY_CURRENCIES
          .filter(c => data.rates[c])
          .map(currency => {
            const rate = data.rates[currency];
            const prev = prevRates[currency] || rate;
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
