import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface CloudProvider {
  name: string;
  status: 'operational' | 'incident' | 'unknown';
  incidents: { title: string; severity: string }[];
}

export interface CloudStatusData {
  providers: CloudProvider[];
}

const CACHE_KEY = 'cloud_status';
const POLL_MS = 90_000;

async function fetchGCP(): Promise<CloudProvider> {
  try {
    const res = await fetch('https://status.cloud.google.com/incidents.json', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('not ok');
    const incidents: any[] = await res.json();
    // Active incidents = no end date or end date in last 2 hours
    const now = Date.now();
    const active = incidents.filter((inc) => {
      if (!inc.end) return true;
      return now - new Date(inc.end).getTime() < 2 * 60 * 60 * 1000;
    }).slice(0, 3);
    return {
      name: 'Google Cloud',
      status: active.length > 0 ? 'incident' : 'operational',
      incidents: active.map((inc) => ({
        title: inc.external_desc || inc.service_name,
        severity: inc.severity || 'medium',
      })),
    };
  } catch {
    return { name: 'Google Cloud', status: 'unknown', incidents: [] };
  }
}

async function fetchAWS(): Promise<CloudProvider> {
  try {
    const res = await fetch('https://health.aws.amazon.com/public/currentevents', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('not ok');
    const events: any[] = await res.json();
    const active = events.slice(0, 3);
    return {
      name: 'AWS',
      status: active.length > 0 ? 'incident' : 'operational',
      incidents: active.map((ev) => ({
        title: ev.summary || ev.service_name || 'Service event',
        severity: ev.status === '3' ? 'high' : ev.status === '2' ? 'medium' : 'low',
      })),
    };
  } catch {
    return { name: 'AWS', status: 'unknown', incidents: [] };
  }
}

async function fetchAzure(): Promise<CloudProvider> {
  try {
    const res = await fetch('https://rssfeed.azure.status.microsoft/en-us/status/feed/', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('not ok');
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    const now = Date.now();
    const active: { title: string; severity: string }[] = [];
    items.forEach((item) => {
      const title = item.querySelector('title')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent;
      // Only show items from the last 24 hours
      if (pubDate && now - new Date(pubDate).getTime() < 24 * 60 * 60 * 1000) {
        active.push({ title, severity: 'medium' });
      }
    });
    return {
      name: 'Azure',
      status: active.length > 0 ? 'incident' : 'operational',
      incidents: active.slice(0, 3),
    };
  } catch {
    return { name: 'Azure', status: 'unknown', incidents: [] };
  }
}

export function useCloudStatus() {
  const [data, setData] = useState<CloudStatusData | null>(() => {
    const cached = getCache<CloudStatusData>(CACHE_KEY);
    return cached?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      const providers = await Promise.all([fetchAWS(), fetchGCP(), fetchAzure()]);
      if (!mountedRef.current) return;
      const result = { providers };
      setData(result);
      setCache(CACHE_KEY, result, 'multi');
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
