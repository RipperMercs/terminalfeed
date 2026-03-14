import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface BskyPost {
  uri: string;
  author: string;
  handle: string;
  text: string;
  createdAt: string;
  likeCount: number;
}

const SEARCH_TERMS = ['bitcoin', 'AI', 'crypto', 'GPT', 'Claude', 'coding'];
const CACHE_KEY = 'bluesky';
const POLL_MS = 2 * 60_000; // 2 min

export function useBluesky(): BskyPost[] {
  const [posts, setPosts] = useState<BskyPost[]>(() => {
    return getCache<BskyPost[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);
  const termIdx = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      // Rotate through search terms
      const term = SEARCH_TERMS[termIdx.current % SEARCH_TERMS.length];
      termIdx.current++;

      try {
        const res = await fetch(
          `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(term)}&limit=8&sort=latest`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        if (!json.posts) return;

        const results: BskyPost[] = json.posts.slice(0, 8).map((p: {
          uri: string;
          author: { displayName: string; handle: string };
          record: { text: string; createdAt: string };
          likeCount?: number;
        }) => ({
          uri: p.uri,
          author: p.author?.displayName || p.author?.handle || 'anon',
          handle: p.author?.handle || '',
          text: p.record?.text?.slice(0, 120) || '',
          createdAt: p.record?.createdAt || '',
          likeCount: p.likeCount ?? 0,
        }));

        setPosts(results);
        setCache(CACHE_KEY, results, 'bluesky');
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return posts;
}
