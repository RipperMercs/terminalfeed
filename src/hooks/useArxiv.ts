// Latest arXiv preprints in cs.AI / cs.LG / cs.CL.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface ArxivPaper {
  arxiv_id: string;
  title: string;
  authors: string[];
  primary_category: string;
  published: string;
  updated: string;
  summary: string;
  url: string;
  pdf_url: string;
}

const ENDPOINT = '/api/arxiv';
const CACHE_KEY = 'arxiv';
const POLL_MS = 60 * 60_000;

export function useArxiv(): ArxivPaper[] {
  const [papers, setPapers] = useState<ArxivPaper[]>(() => getCache<ArxivPaper[]>(CACHE_KEY)?.data ?? []);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const arr: ArxivPaper[] = Array.isArray(json?.data) ? json.data : [];
        if (arr.length === 0) return;
        setPapers(arr);
        setCache(CACHE_KEY, arr, 'arxiv');
      } catch (e) { if (import.meta.env.DEV) console.warn('[arXiv]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return papers;
}
