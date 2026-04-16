// Random fine art from the Art Institute of Chicago
// Classy counterbalance to the cat photos
import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface ArtworkData {
  title: string;
  artist: string;
  imageUrl: string;
  date: string;
}

const CACHE_KEY = 'museum_art';
const POLL_MS = 60 * 60_000; // 1 hour — rotate hourly

export function useMuseumArt(): ArtworkData | null {
  const [art, setArt] = useState<ArtworkData | null>(() => {
    return getCache<ArtworkData>(CACHE_KEY)?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetch_ = async () => {
      try {
        const page = Math.floor(Math.random() * 100) + 1;
        const res = await fetch(
          `https://api.artic.edu/api/v1/artworks?limit=1&fields=id,title,artist_display,image_id,date_display&page=${page}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const work = json.data?.[0];
        if (!work || !work.image_id) return;

        const result: ArtworkData = {
          title: work.title || 'Untitled',
          artist: work.artist_display?.split(',')[0]?.split('(')[0]?.trim() || 'Unknown',
          imageUrl: `https://www.artic.edu/iiif/2/${work.image_id}/full/400,/0/default.jpg`,
          date: work.date_display || '',
        };

        setArt(result);
        setCache(CACHE_KEY, result, 'artic');
      } catch (e) { if (import.meta.env.DEV) console.warn('[MuseumArt]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return art;
}
