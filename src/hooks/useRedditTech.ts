import { useState, useEffect, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  score: number;
  url: string;
  permalink: string;
  numComments: number;
  created: number;
}

// RSS feeds are WAY more reliable than Reddit's JSON API
const SUBREDDITS = ['technology', 'programming', 'artificial', 'MachineLearning', 'bitcoin'];
const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';
const POLL_MS = 10 * 60_000; // 10 min — cache aggressively
const MAX_POSTS = 12;
const CACHE_KEY = 'reddit_tech';

const BLOCK_WORDS = /\b(politic|election|democrat|republican|congress|senate|partisan|trump|biden|liberal|conservative|vote|ballot|legislation|governor|mayor)\b/i;

async function fetchSubredditRSS(sub: string): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];

  // Primary: RSS2JSON (most reliable)
  try {
    const rssUrl = encodeURIComponent(`https://www.reddit.com/r/${sub}/.rss`);
    const res = await fetch(`${RSS2JSON_BASE}${rssUrl}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      if (json.items?.length) {
        for (const item of json.items.slice(0, 6)) {
          if (BLOCK_WORDS.test(item.title)) continue;
          posts.push({
            id: item.guid || item.link || `${sub}-${posts.length}`,
            title: item.title?.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"') ?? '',
            subreddit: sub,
            score: 0, // RSS doesn't have score, we'll show recency instead
            url: item.link ?? '',
            permalink: item.link ?? '',
            numComments: 0,
            created: item.pubDate ? Math.floor(new Date(item.pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
          });
        }
        return posts;
      }
    }
  } catch {}

  // Fallback: Direct RSS XML parsing
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
        posts.push({
          id: entry.querySelector('id')?.textContent ?? `${sub}-${i}`,
          title,
          subreddit: sub,
          score: 0,
          url: link,
          permalink: link,
          numComments: 0,
          created: updated ? Math.floor(new Date(updated).getTime() / 1000) : Math.floor(Date.now() / 1000),
        });
      });
      if (posts.length > 0) return posts;
    }
  } catch {}

  // Last resort: old JSON API
  try {
    const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=6&raw_json=1`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      for (const child of data?.data?.children || []) {
        const post = child.data;
        if (!post || post.stickied) continue;
        if (BLOCK_WORDS.test(post.title)) continue;
        posts.push({
          id: post.id,
          title: post.title,
          subreddit: post.subreddit,
          score: post.score,
          url: post.url,
          permalink: `https://reddit.com${post.permalink}`,
          numComments: post.num_comments,
          created: post.created_utc,
        });
      }
    }
  } catch {}

  return posts;
}

export function useRedditTech() {
  const [posts, setPosts] = useState<RedditPost[]>(() => {
    return getCache<RedditPost[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      if (!mountedRef.current) return;

      const allPosts: RedditPost[] = [];

      // Fetch all subreddits in parallel via RSS
      const results = await Promise.allSettled(
        SUBREDDITS.map(sub => fetchSubredditRSS(sub))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allPosts.push(...result.value);
        }
      }

      if (mountedRef.current && allPosts.length > 0) {
        // Sort by created time (newest first) since RSS doesn't have scores
        allPosts.sort((a, b) => {
          // If we have scores (from JSON fallback), use those
          if (a.score > 0 && b.score > 0) return b.score - a.score;
          return b.created - a.created;
        });
        const sliced = allPosts.slice(0, MAX_POSTS);
        setPosts(sliced);
        setCache(CACHE_KEY, sliced, 'reddit-rss');
      }
    };

    // Delay first fetch to not hammer on page load
    const initTimer = setTimeout(fetchAll, 2000);
    const id = setInterval(fetchAll, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      clearInterval(id);
    };
  }, []);

  return posts;
}
