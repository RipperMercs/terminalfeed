import { useState, useEffect, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface GoodNewsItem {
  id: string;
  title: string;
  subreddit: string;
  url: string;
  permalink: string;
  score: number;
  created: number;
}

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';
const SUBREDDITS = ['UpliftingNews', 'goodnews', 'MadeMeSmile'];
const CACHE_KEY = 'good_news';
const POLL_MS = 5 * 60_000; // 5 min
const MAX_ITEMS = 12;

const BLOCK_WORDS = /\b(politic|election|democrat|republican|congress|senate|partisan|trump|biden|liberal|conservative)\b/i;

async function fetchSubreddit(sub: string): Promise<GoodNewsItem[]> {
  const items: GoodNewsItem[] = [];

  // Primary: RSS2JSON
  try {
    const rssUrl = encodeURIComponent(`https://www.reddit.com/r/${sub}/.rss`);
    const res = await fetch(`${RSS2JSON_BASE}${rssUrl}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      if (json.items?.length) {
        for (const item of json.items.slice(0, 6)) {
          if (BLOCK_WORDS.test(item.title)) continue;
          items.push({
            id: item.guid || item.link || `${sub}-${items.length}`,
            title: item.title?.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"') ?? '',
            subreddit: sub,
            url: item.link ?? '',
            permalink: item.link ?? '',
            score: 0,
            created: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
          });
        }
        return items;
      }
    }
  } catch {}

  // Fallback: Direct RSS XML
  try {
    const res = await fetch(`https://www.reddit.com/r/${sub}/.rss`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      const entries = doc.querySelectorAll('entry');
      entries.forEach((entry, i) => {
        if (i >= 6) return;
        const title = entry.querySelector('title')?.textContent ?? '';
        if (BLOCK_WORDS.test(title)) return;
        const link = entry.querySelector('link')?.getAttribute('href') ?? '';
        const updated = entry.querySelector('updated')?.textContent ?? '';
        items.push({
          id: entry.querySelector('id')?.textContent ?? `${sub}-${i}`,
          title,
          subreddit: sub,
          url: link,
          permalink: link,
          score: 0,
          created: updated ? Math.floor(new Date(updated).getTime() / 1000) : Math.floor(Date.now() / 1000),
        });
      });
    }
  } catch {}

  return items;
}

export function useGoodNews() {
  const [posts, setPosts] = useState<GoodNewsItem[]>(() => {
    return getCache<GoodNewsItem[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      if (!mountedRef.current) return;

      const allPosts: GoodNewsItem[] = [];
      const results = await Promise.allSettled(
        SUBREDDITS.map(sub => fetchSubreddit(sub))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allPosts.push(...result.value);
        }
      }

      if (mountedRef.current && allPosts.length > 0) {
        allPosts.sort((a, b) => b.created - a.created);
        const sliced = allPosts.slice(0, MAX_ITEMS);
        setPosts(sliced);
        setCache(CACHE_KEY, sliced, 'reddit-goodnews');
      }
    };

    const initTimer = setTimeout(fetchAll, 4000);
    const id = setInterval(fetchAll, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      clearInterval(id);
    };
  }, []);

  return posts;
}
