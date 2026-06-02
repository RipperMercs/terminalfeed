import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

const API_URL = '/api/fun-fact'; // worker proxy (uselessfacts), rule #6
const CACHE_KEY = 'fun_fact';
const POLL_MS = 30 * 60_000; // 30 min

export function useFunFact(): string {
  const [fact, setFact] = useState<string>(() => {
    return getCache<string>(CACHE_KEY)?.data ?? '';
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok || !mountedRef.current) return;
        const data = await res.json();
        if (data.text) {
          setFact(data.text);
          setCache(CACHE_KEY, data.text, 'uselessfacts');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[FunFact]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return fact;
}
