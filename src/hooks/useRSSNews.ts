// Additional tech news from RSS feeds — Ars Technica, The Verge, TechCrunch
import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface RSSItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  time: number; // unix timestamp
}

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

const FEEDS = [
  { name: 'Ars', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
  { name: 'Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'TC', url: 'https://techcrunch.com/feed/' },
];

const CACHE_KEY = 'rss_news';
const POLL_MS = 3 * 60_000; // 3 min

// Filter out politics
const BLOCK_WORDS = /\b(politic|election|democrat|republican|congress|senate|partisan|trump|biden|liberal|conservative|vote|ballot|legislation)\b/i;

export function useRSSNews(): RSSItem[] {
  const [items, setItems] = useState<RSSItem[]>(() => {
    return getCache<RSSItem[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      const allItems: RSSItem[] = [];

      await Promise.allSettled(
        FEEDS.map(async (feed) => {
          try {
            const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed.url)}`, {
              signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return;
            const data = await res.json();
            if (!data.items?.length) return;

            for (const item of data.items.slice(0, 5)) {
              if (BLOCK_WORDS.test(item.title || '')) continue;
              const title = (item.title || '')
                .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'").replace(/&quot;/g, '"');
              allItems.push({
                title,
                link: item.link || '',
                source: feed.name,
                pubDate: item.pubDate || '',
                time: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
              });
            }
          } catch (e) { if (import.meta.env.DEV) console.warn('[RSSNews]', e); }
        })
      );

      if (mountedRef.current && allItems.length > 0) {
        allItems.sort((a, b) => b.time - a.time);
        const sliced = allItems.slice(0, 12);
        setItems(sliced);
        setCache(CACHE_KEY, sliced, 'rss');
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return items;
}
