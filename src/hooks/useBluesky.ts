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

const CACHE_KEY = 'bluesky';
const POLL_MS = 2 * 60_000; // 2 min

export function useBluesky(): BskyPost[] {
  const [posts, setPosts] = useState<BskyPost[]>(() => {
    return getCache<BskyPost[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      try {
        // worker proxy (bsky public API), rule #6: resolves handles + merges feeds server-side
        const res = await fetch('/api/bluesky', { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const sliced: BskyPost[] = Array.isArray(json.data) ? json.data : [];
        if (sliced.length > 0) {
          setPosts(sliced);
          setCache(CACHE_KEY, sliced, 'bluesky');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[Bluesky]', e); }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return posts;
}
