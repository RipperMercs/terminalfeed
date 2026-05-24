// HuggingFace community-curated daily AI papers, ranked by upvotes.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface HfPaper {
  title: string;
  arxiv_id: string | null;
  authors: string[];
  upvotes: number;
  published_at: string | null;
  summary: string;
  url: string | null;
}

const ENDPOINT = '/api/hf-papers';
const CACHE_KEY = 'hf-papers';
const POLL_MS = 60 * 60_000;

export function useHfPapers(): HfPaper[] {
  const [papers, setPapers] = useState<HfPaper[]>(() => getCache<HfPaper[]>(CACHE_KEY)?.data ?? []);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const arr: HfPaper[] = json?.data?.papers;
        if (!Array.isArray(arr) || arr.length === 0) return;
        setPapers(arr);
        setCache(CACHE_KEY, arr, 'hf-papers');
      } catch (e) { if (import.meta.env.DEV) console.warn('[HfPapers]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return papers;
}
