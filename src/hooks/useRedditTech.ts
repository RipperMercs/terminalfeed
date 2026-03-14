import { useState, useEffect, useRef } from 'react';

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

// Use CORS-friendly endpoint
const SUBREDDITS = ['technology', 'programming', 'artificial', 'MachineLearning', 'bitcoin'];
const POLL_MS = 5 * 60_000;
const MAX_POSTS = 12;

const BLOCK_WORDS = /\b(politic|election|democrat|republican|congress|senate|partisan|trump|biden|liberal|conservative|vote|ballot|legislation|governor|mayor)\b/i;

export function useRedditTech() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchPosts = async () => {
      if (!mountedRef.current) return;

      const allPosts: RedditPost[] = [];

      // Fetch sequentially to avoid rate limiting
      for (const sub of SUBREDDITS) {
        if (!mountedRef.current) break;
        try {
          // Reddit requires a user-agent-like header; use .json endpoint
          const res = await fetch(
            `https://www.reddit.com/r/${sub}/hot.json?limit=6&raw_json=1`,
            {
              headers: { 'Accept': 'application/json' },
            },
          );
          if (!res.ok) continue;
          const data = await res.json();
          if (!mountedRef.current) break;

          for (const child of data?.data?.children || []) {
            const post = child.data;
            if (!post || post.stickied) continue;
            if (BLOCK_WORDS.test(post.title)) continue;

            allPosts.push({
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
        } catch {
          // Reddit CORS can be flaky — silently skip
        }
      }

      if (mountedRef.current && allPosts.length > 0) {
        allPosts.sort((a, b) => b.score - a.score);
        setPosts(allPosts.slice(0, MAX_POSTS));
      }
    };

    // Delay first fetch slightly to not hammer APIs on page load
    const initTimer = setTimeout(fetchPosts, 2000);
    const id = setInterval(fetchPosts, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      clearInterval(id);
    };
  }, []);

  return posts;
}
