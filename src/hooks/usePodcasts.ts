import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface PodcastEpisode {
  title: string;
  show: string;
  link: string;
  pubDate: string;
  spotifyId: string; // for embed
}

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

const SHOWS = [
  { name: 'Lex Fridman', rss: 'https://lexfridman.com/feed/podcast/', spotifyShow: '2MAi0BvDc6GTFvKFPXnkCL' },
  { name: 'Darknet Diaries', rss: 'https://feeds.megaphone.fm/darknetdiaries', spotifyShow: '4XPl3uEEL9hvqMkoZrzbx5' },
  { name: 'Changelog', rss: 'https://changelog.com/podcast/feed', spotifyShow: '5bBki72YeKSLUMVRhNFMo1' },
  { name: 'Syntax FM', rss: 'https://feed.syntax.fm/rss', spotifyShow: '4kYCRYJ3yK5DQbP5tbfZby' },
  { name: 'AI Daily Brief', rss: 'https://anchor.fm/s/f7cac464/podcast/rss', spotifyShow: '7gKwwMLFLc6RmjmRpbMtEO' },
];

const CACHE_KEY = 'podcasts';
const POLL_MS = 30 * 60_000; // 30 min

export function usePodcasts(): PodcastEpisode[] {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>(() => {
    return getCache<PodcastEpisode[]>(CACHE_KEY)?.data ?? [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      const results: PodcastEpisode[] = [];

      await Promise.allSettled(
        SHOWS.map(async (show) => {
          try {
            const res = await fetch(`${RSS2JSON}${encodeURIComponent(show.rss)}`, {
              signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return;
            const data = await res.json();
            if (!data.items?.length) return;

            // Take latest 2 episodes per show
            for (const item of data.items.slice(0, 2)) {
              results.push({
                title: item.title ?? 'Untitled',
                show: show.name,
                link: item.link ?? '',
                pubDate: item.pubDate ?? '',
                spotifyId: show.spotifyShow,
              });
            }
          } catch (e) { if (import.meta.env.DEV) console.warn('[Podcasts]', e); }
        })
      );

      if (mountedRef.current && results.length > 0) {
        // Sort by date, newest first
        results.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        setEpisodes(results.slice(0, 8));
        setCache(CACHE_KEY, results.slice(0, 8), 'rss');
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return episodes;
}
