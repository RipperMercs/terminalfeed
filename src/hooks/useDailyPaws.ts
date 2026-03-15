// Daily Paws — random cats and dogs between earthquake data and market crashes
// The internet was built for this.

import { useEffect, useState, useRef } from 'react';

export interface PawData {
  url: string;
  type: 'cat' | 'dog';
  breed: string | null;
}

const POLL_MS = 30_000; // new friend every 30 seconds

async function fetchCat(): Promise<PawData | null> {
  try {
    const res = await fetch('https://api.thecatapi.com/v1/images/search?size=small&mime_types=jpg,png&limit=1', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.[0]?.url) return null;
    return {
      url: data[0].url,
      type: 'cat',
      breed: data[0].breeds?.[0]?.name || null,
    };
  } catch { return null; }
}

async function fetchDog(): Promise<PawData | null> {
  try {
    const res = await fetch('https://dog.ceo/api/breeds/image/random', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.message) return null;
    // Extract breed from URL: .../breeds/retriever-golden/image.jpg
    const parts = data.message.split('/');
    const idx = parts.indexOf('breeds');
    const breed = idx >= 0 ? parts[idx + 1]?.replace(/-/g, ' ') : null;
    return { url: data.message, type: 'dog', breed };
  } catch { return null; }
}

export function useDailyPaws() {
  const [paw, setPaw] = useState<PawData | null>(null);
  const [fading, setFading] = useState(false);
  const mountedRef = useRef(true);

  const fetchNew = async () => {
    if (!mountedRef.current) return;
    setFading(true);
    await new Promise(r => setTimeout(r, 400));
    if (!mountedRef.current) return;

    const isCat = Math.random() > 0.5;
    let result = isCat ? await fetchCat() : await fetchDog();
    if (!result) result = isCat ? await fetchDog() : await fetchCat(); // fallback

    if (result && mountedRef.current) {
      // Preload image
      const img = new Image();
      img.onload = () => { if (mountedRef.current) { setPaw(result); setFading(false); } };
      img.onerror = () => { if (mountedRef.current) setFading(false); };
      img.src = result.url;
    } else {
      if (mountedRef.current) setFading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchNew();
    const id = setInterval(fetchNew, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return { paw, fading, fetchNew };
}
