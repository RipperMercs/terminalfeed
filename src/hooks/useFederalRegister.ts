// Federal Register recent docs: rules, proposed rules, notices, presidential
// documents from the last 7 days. Worker handles the federalregister.gov API
// call; we just consume.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface FedRegDoc {
  title: string;
  type: string;            // 'Rule' | 'Proposed Rule' | 'Notice' | 'Presidential Document'
  publication_date: string;
  agencies: string[];
  abstract: string;
  document_number: string;
  url: string;
}

const ENDPOINT = '/api/federal-register';
const CACHE_KEY = 'federal-register';
const POLL_MS = 30 * 60_000;

export function useFederalRegister(): FedRegDoc[] {
  const [docs, setDocs] = useState<FedRegDoc[]>(() => getCache<FedRegDoc[]>(CACHE_KEY)?.data ?? []);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const arr: FedRegDoc[] = Array.isArray(json?.data) ? json.data : [];
        if (arr.length === 0) return;
        setDocs(arr);
        setCache(CACHE_KEY, arr, 'federal-register');
      } catch (e) { if (import.meta.env.DEV) console.warn('[FedReg]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return docs;
}
