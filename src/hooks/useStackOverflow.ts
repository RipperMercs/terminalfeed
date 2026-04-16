import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface SOQuestion {
  id: number;
  title: string;
  viewCount: number;
  answerCount: number;
  score: number;
  link: string;
  tags: string[];
}

const API_URL = 'https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&site=stackoverflow&pagesize=10&filter=withbody';
const CACHE_KEY = 'stackoverflow';
const POLL_MS = 3 * 60_000; // 3 min

export function useStackOverflow(): SOQuestion[] {
  const [questions, setQuestions] = useState<SOQuestion[]>(() => {
    return getCache<SOQuestion[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!json.items || !mountedRef.current) return;

        const results: SOQuestion[] = json.items.slice(0, 10).map((q: {
          question_id: number;
          title: string;
          view_count: number;
          answer_count: number;
          score: number;
          link: string;
          tags: string[];
        }) => ({
          id: q.question_id,
          title: decodeHtml(q.title),
          viewCount: q.view_count,
          answerCount: q.answer_count,
          score: q.score,
          link: q.link,
          tags: q.tags?.slice(0, 3) ?? [],
        }));

        setQuestions(results);
        setCache(CACHE_KEY, results, 'stackoverflow');
      } catch (e) { if (import.meta.env.DEV) console.warn('[StackOverflow]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return questions;
}

function decodeHtml(html: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}
