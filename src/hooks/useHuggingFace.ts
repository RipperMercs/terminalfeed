import { useState, useEffect, useRef } from 'react';

export interface HuggingFaceModel {
  id: string;
  author: string;
  name: string;
  likes: number;
  downloads: number;
  pipeline: string;
  url: string;
  updated: string;
}

const POLL_MS = 10 * 60_000;
const MOBILE_POLL_MS = 20 * 60_000;

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

export function useHuggingFace() {
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    mountedRef.current = true;

    const fetchModels = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch('/api/hf-trending', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        if (!mountedRef.current) return;

        setModels(
          items.slice(0, 15).map((m: Partial<HuggingFaceModel>) => ({
            id: m.id ?? '',
            author: m.author ?? '',
            name: m.name ?? '',
            likes: m.likes ?? 0,
            downloads: m.downloads ?? 0,
            pipeline: m.pipeline ?? '',
            url: m.url ?? 'https://huggingface.co',
            updated: m.updated ?? '',
          })),
        );
      } catch (e) { if (import.meta.env.DEV) console.warn('[HuggingFace]', e); }
    };

    const poll = isMobile() ? MOBILE_POLL_MS : POLL_MS;
    fetchModels();
    intervalRef.current = setInterval(fetchModels, poll);

    const onVisChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchModels();
        intervalRef.current = setInterval(fetchModels, poll);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return models;
}
