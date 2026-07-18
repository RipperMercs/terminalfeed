// OpenRouter catalog watch: the newest LLM drops (model id, context window,
// prompt price) plus total catalog size. Worker-proxied (/api/llm-models),
// KV-cached ~3h. OpenRouter's usage rankings have no public API, so this
// tracks arrivals, which is where new releases show up first.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface LlmModel {
  id: string;
  created: number;
  context_length: number;
  prompt_per_m: number | null;
}

export interface LlmModelsData {
  total_models: number;
  newest: LlmModel[];
}

const ENDPOINT = '/api/llm-models';
const CACHE_KEY = 'llm_models';
const POLL_MS = 30 * 60_000;

export function useLlmModels(): LlmModelsData | null {
  const [data, setData] = useState<LlmModelsData | null>(() => getCache<LlmModelsData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retried = false;
    const fetch_ = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d: LlmModelsData | undefined = json?.data;
        if (!d || !Array.isArray(d.newest) || d.newest.length === 0) {
          // KV feed still warming: one short retry instead of an empty panel
          // until the next 30-minute poll.
          if (!retried && mountedRef.current) { retried = true; retryTimer = setTimeout(fetch_, 20000); }
          return;
        }
        retried = false;
        setData(d);
        setCache(CACHE_KEY, d, 'openrouter');
      } catch (e) { if (import.meta.env.DEV) console.warn('[LlmModels]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); if (retryTimer) clearTimeout(retryTimer); };
  }, []);

  return data;
}
