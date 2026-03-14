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

// Curated tech/crypto accounts on Bluesky (public feeds, no auth needed)
const FEEDS = [
  { handle: 'jay.bsky.team', name: 'Jay (Bluesky)' },
  { handle: 'pfrazee.com', name: 'Paul Frazee' },
  { handle: 'mackuba.eu', name: 'Kuba Suder' },
];

const CACHE_KEY = 'bluesky';
const POLL_MS = 5 * 60_000; // 5 min

// Resolve handle to DID then fetch feed
async function fetchAccountFeed(handle: string): Promise<BskyPost[]> {
  try {
    // Resolve handle to DID
    const resolveRes = await fetch(
      `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!resolveRes.ok) return [];
    const { did } = await resolveRes.json();
    if (!did) return [];

    // Fetch feed
    const feedRes = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${did}&limit=3&filter=posts_no_replies`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!feedRes.ok) return [];
    const data = await feedRes.json();

    return (data.feed || []).map((item: {
      post: {
        uri: string;
        author: { displayName?: string; handle: string };
        record: { text?: string; createdAt?: string };
        likeCount?: number;
      };
    }) => ({
      uri: item.post.uri,
      author: item.post.author?.displayName || item.post.author?.handle || 'anon',
      handle: item.post.author?.handle || '',
      text: (item.post.record?.text || '').slice(0, 140),
      createdAt: item.post.record?.createdAt || '',
      likeCount: item.post.likeCount ?? 0,
    }));
  } catch {
    return [];
  }
}

export function useBluesky(): BskyPost[] {
  const [posts, setPosts] = useState<BskyPost[]>(() => {
    return getCache<BskyPost[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      const allPosts: BskyPost[] = [];

      const results = await Promise.allSettled(
        FEEDS.map(f => fetchAccountFeed(f.handle))
      );

      for (const r of results) {
        if (r.status === 'fulfilled') allPosts.push(...r.value);
      }

      if (mountedRef.current && allPosts.length > 0) {
        // Sort newest first
        allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const sliced = allPosts.slice(0, 8);
        setPosts(sliced);
        setCache(CACHE_KEY, sliced, 'bluesky');
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return posts;
}
