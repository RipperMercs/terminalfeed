import { useEffect, useState, useRef } from 'react';

export interface HNStory {
  id: number;
  title: string;
  url: string;
  score: number;
  by: string;
  time: number;
  descendants: number;
}

const TOP_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const ITEM_URL = 'https://hacker-news.firebaseio.com/v0/item';
const POLL_MS = 90_000;
const MAX_STORIES = 20;

// Filter for tech/AI/crypto keywords
const KEYWORDS = /\b(ai|gpt|llm|claude|openai|anthropic|bitcoin|btc|crypto|gpu|nvidia|amd|mining|blockchain|transformer|deep.?learning|machine.?learning|neural|model|agent|agi|gemini|mistral)\b/i;

export function useHackerNews() {
  const [stories, setStories] = useState<HNStory[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchStories = async () => {
      try {
        const res = await fetch(TOP_URL);
        if (!res.ok) return;
        const ids: number[] = await res.json();

        // Fetch top 50 stories, filter for relevant ones
        const batch = ids.slice(0, 50);
        const items = await Promise.all(
          batch.map(async (id) => {
            try {
              const r = await fetch(`${ITEM_URL}/${id}.json`);
              return r.ok ? r.json() : null;
            } catch { return null; }
          }),
        );

        if (!mountedRef.current) return;

        const filtered = items
          .filter((item): item is HNStory =>
            item !== null &&
            item.type === 'story' &&
            item.title &&
            KEYWORDS.test(item.title),
          )
          .slice(0, MAX_STORIES);

        // If not enough keyword matches, fill with top stories
        if (filtered.length < 8) {
          const top = items
            .filter((item): item is HNStory =>
              item !== null &&
              item.type === 'story' &&
              item.title &&
              !filtered.some((f) => f.id === item.id),
            )
            .slice(0, MAX_STORIES - filtered.length);
          filtered.push(...top);
        }

        setStories(filtered);
      } catch (e) { if (import.meta.env.DEV) console.warn('[HackerNews]', e); }
    };

    fetchStories();
    const id = setInterval(fetchStories, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return stories;
}
