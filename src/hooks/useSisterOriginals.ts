// Owned sister-site editorial, blended into the Tech / AI feed as real rows
// with real on-site permalinks (drives cross-site traffic to vr.org and
// tensorfeed.ai). Both feeds go through our own whitelisted /api/rss proxy.
import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface SisterItem {
  title: string;
  link: string;
  source: 'VR.ORG' | 'TENSORFEED';
  time: number;
}

const RSS = '/api/rss?url=';

const FEEDS: { source: SisterItem['source']; url: string; host: string }[] = [
  { source: 'VR.ORG', url: 'https://vr.org/feed.xml', host: 'vr.org' },
  { source: 'TENSORFEED', url: 'https://tensorfeed.ai/originals.xml', host: 'tensorfeed.ai' },
];

const CACHE_KEY = 'sister_originals_1';
const POLL_MS = 15 * 60_000; // 15 min; editorial changes slowly
// Keep owned rows light so HN still leads the feed: at most 2 per site,
// 3 total stacked at the top.
const PER_FEED = 2;
const MAX_ITEMS = 3;

export function useSisterOriginals(): SisterItem[] {
  const [items, setItems] = useState<SisterItem[]>(() => {
    return getCache<SisterItem[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      const all: SisterItem[] = [];

      await Promise.allSettled(
        FEEDS.map(async (feed) => {
          try {
            const res = await fetch(`${RSS}${encodeURIComponent(feed.url)}`, {
              signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return;
            const data = await res.json();
            const list = Array.isArray(data?.items) ? data.items : [];
            for (const it of list.slice(0, PER_FEED)) {
              const title = typeof it?.title === 'string' ? it.title.trim() : '';
              const link = typeof it?.link === 'string' ? it.link.trim() : '';
              // Only surface items that actually link back to the sister site.
              if (!title || !link.includes(feed.host)) continue;
              const t = it?.pubDate ? Math.floor(new Date(it.pubDate).getTime() / 1000) : 0;
              all.push({
                title,
                link,
                source: feed.source,
                time: Number.isFinite(t) && t > 0 ? t : Math.floor(Date.now() / 1000),
              });
            }
          } catch (e) { if (import.meta.env.DEV) console.warn('[SisterOriginals]', e); }
        })
      );

      if (mountedRef.current && all.length > 0) {
        all.sort((a, b) => b.time - a.time);
        const sliced = all.slice(0, MAX_ITEMS);
        setItems(sliced);
        setCache(CACHE_KEY, sliced, 'sister');
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return items;
}
