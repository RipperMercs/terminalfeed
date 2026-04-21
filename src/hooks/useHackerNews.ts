import { useEffect, useState, useRef } from 'react';

export interface HNStory {
  id: number;
  title: string;
  url: string;
  score: number;
  by: string;
  time: number;
  descendants: number;
  type?: string;
}

const API_URL = '/api/hn-topstories?limit=50';
const POLL_MS = 90_000;
const MAX_STORIES = 20;

const KEYWORDS = /\b(ai|gpt|llm|claude|openai|anthropic|bitcoin|btc|crypto|gpu|nvidia|amd|mining|blockchain|transformer|deep.?learning|machine.?learning|neural|model|agent|agi|gemini|mistral)\b/i;

export function useHackerNews() {
  const [stories, setStories] = useState<HNStory[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchStories = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        const items: HNStory[] = Array.isArray(json?.data) ? json.data : [];
        if (!mountedRef.current) return;

        const filtered = items
          .filter((s) => s && s.title && KEYWORDS.test(s.title))
          .slice(0, MAX_STORIES);

        if (filtered.length < 8) {
          const fill = items
            .filter((s) => s && s.title && !filtered.some((f) => f.id === s.id))
            .slice(0, MAX_STORIES - filtered.length);
          filtered.push(...fill);
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
