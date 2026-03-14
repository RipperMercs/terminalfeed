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

// Subreddits to pull from — tech/AI/markets only, no politics
const SUBREDDITS = ['technology', 'programming', 'artificial', 'MachineLearning', 'bitcoin'];
const POLL_MS = 5 * 60_000; // 5 min
const MAX_POSTS = 12;

// Politics filter
const BLOCK_WORDS = /\b(politic|election|democrat|republican|congress|senate|partisan|trump|biden|liberal|conservative|vote|ballot|legislation|governor|mayor)\b/i;

export function useRedditTech() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchPosts = async () => {
      if (!mountedRef.current) return;

      const allPosts: RedditPost[] = [];

      await Promise.all(
        SUBREDDITS.map(async (sub) => {
          try {
            const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=8`);
            if (!res.ok) return;
            const data = await res.json();
            if (!mountedRef.current) return;

            for (const child of data.data?.children || []) {
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
          } catch {}
        }),
      );

      if (mountedRef.current) {
        // Sort by score descending, take top N
        allPosts.sort((a, b) => b.score - a.score);
        setPosts(allPosts.slice(0, MAX_POSTS));
      }
    };

    fetchPosts();
    const id = setInterval(fetchPosts, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return posts;
}
