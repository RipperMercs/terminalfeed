// GDACS — Global Disaster Alert and Coordination System
// Fires, floods, cyclones, volcanoes, earthquakes from UN/EU

import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface DisasterAlert {
  id: string;
  type: string; // EQ, TC, FL, VO, WF
  title: string;
  country: string;
  alertLevel: string; // Green, Orange, Red
  date: string;
  url: string;
}

const RSS_URL = '/api/rss?url=' + encodeURIComponent('https://www.gdacs.org/xml/rss.xml');
const CACHE_KEY = 'gdacs_alerts';
const POLL_MS = 5 * 60_000; // 5 min

export function useGDACS(): DisasterAlert[] {
  const [alerts, setAlerts] = useState<DisasterAlert[]>(() => {
    return getCache<DisasterAlert[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(RSS_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.items?.length) return;

        const results: DisasterAlert[] = data.items.slice(0, 8).map((item: {
          title: string;
          link: string;
          pubDate: string;
        }, i: number) => {
          const titleLower = (item.title || '').toLowerCase();
          let type = 'EQ';
          let alertLevel = 'Green';
          if (titleLower.includes('cyclone') || titleLower.includes('hurricane')) type = 'TC';
          else if (titleLower.includes('flood')) type = 'FL';
          else if (titleLower.includes('volcano')) type = 'VO';
          else if (titleLower.includes('wildfire') || titleLower.includes('fire')) type = 'WF';

          if (titleLower.startsWith('red') || titleLower.includes('red alert')) alertLevel = 'Red';
          else if (titleLower.startsWith('orange') || titleLower.includes('orange alert')) alertLevel = 'Orange';

          return {
            id: String(i),
            type,
            title: item.title,
            country: '',
            alertLevel,
            date: item.pubDate || '',
            url: item.link || '',
          };
        });

        if (mountedRef.current && results.length > 0) {
          setAlerts(results);
          setCache(CACHE_KEY, results, 'gdacs');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[GDACS]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return alerts;
}
