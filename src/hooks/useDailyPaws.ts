// Daily Paws: random cats and dogs between earthquake data and market crashes
// The internet was built for this.

import { useEffect, useState, useRef } from 'react';

export interface PawData {
  url: string;
  type: 'cat' | 'dog';
  breed: string | null;
}

const POLL_MS = 30_000; // new friend every 30 seconds

async function fetchCat(): Promise<PawData | null> {
  // Try up to 3 times to get a non-Tumblr image
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.thecatapi.com/v1/images/search?size=small&mime_types=jpg,png&limit=1', {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const url = data?.[0]?.url;
      if (!url) return null;
      // Skip Tumblr-hosted images: they frequently get removed
      if (url.includes('tumblr') || url.includes('media.tumblr')) continue;
      return {
        url,
        type: 'cat',
        breed: data[0].breeds?.[0]?.name || null,
      };
    } catch { return null; }
  }
  return null;
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
  const turnRef = useRef(0); // alternates: even=cat, odd=dog

  const fetchNew = async () => {
    if (!mountedRef.current) return;
    setFading(true);
    await new Promise(r => setTimeout(r, 400));
    if (!mountedRef.current) return;

    const isCat = turnRef.current % 2 === 0;
    turnRef.current++;
    let result = isCat ? await fetchCat() : await fetchDog();
    if (!result) result = isCat ? await fetchDog() : await fetchCat(); // fallback

    if (result && mountedRef.current) {
      // Preload image: retry on error
      const img = new Image();
      img.onload = () => {
        if (mountedRef.current) { setPaw(result); setFading(false); }
      };
      img.onerror = () => {
        // Image failed (Tumblr removed, 404, etc.): try a dog instead
        if (!mountedRef.current) return;
        fetchDog().then(fallback => {
          if (fallback && mountedRef.current) {
            const retry = new Image();
            retry.onload = () => { if (mountedRef.current) { setPaw(fallback); setFading(false); } };
            retry.onerror = () => { if (mountedRef.current) setFading(false); };
            retry.src = fallback.url;
          } else {
            if (mountedRef.current) setFading(false);
          }
        });
      };
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
