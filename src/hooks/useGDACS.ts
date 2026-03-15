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

const API_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,TC,FL,VO,WF&alertlevel=Green;Orange;Red&limit=10';
const RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://www.gdacs.org/xml/rss.xml');
const CACHE_KEY = 'gdacs_alerts';
const POLL_MS = 5 * 60_000; // 5 min

const TYPE_NAMES: Record<string, string> = {
  EQ: 'EARTHQUAKE', TC: 'CYCLONE', FL: 'FLOOD', VO: 'VOLCANO', WF: 'WILDFIRE',
};

export function useGDACS(): DisasterAlert[] {
  const [alerts, setAlerts] = useState<DisasterAlert[]>(() => {
    return getCache<DisasterAlert[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      // Try RSS feed (more reliable via RSS2JSON)
      try {
        const res = await fetch(RSS_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error('RSS failed');
        const data = await res.json();
        if (!data.items?.length) throw new Error('No items');

        const results: DisasterAlert[] = data.items.slice(0, 8).map((item: {
          title: string;
          link: string;
          pubDate: string;
          description: string;
        }, i: number) => {
          // Parse type from title (e.g., "Green earthquake...")
          const titleLower = item.title.toLowerCase();
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
      } catch {
        // Direct API fallback
        try {
          const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
          if (!res.ok || !mountedRef.current) return;
          const data = await res.json();
          const features = data.features || [];

          const results: DisasterAlert[] = features.slice(0, 8).map((f: {
            properties: { eventtype: string; name: string; country: string; alertlevel: string; fromdate: string; url: string };
          }) => ({
            id: f.properties.name,
            type: f.properties.eventtype,
            title: `${TYPE_NAMES[f.properties.eventtype] || f.properties.eventtype} — ${f.properties.name}`,
            country: f.properties.country || '',
            alertLevel: f.properties.alertlevel || 'Green',
            date: f.properties.fromdate || '',
            url: f.properties.url || 'https://www.gdacs.org',
          }));

          if (results.length > 0) {
            setAlerts(results);
            setCache(CACHE_KEY, results, 'gdacs');
          }
        } catch {}
      }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return alerts;
}
