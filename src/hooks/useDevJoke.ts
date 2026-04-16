import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface DevJokeData {
  joke: string;
  timestamp: number;
}

const API_URL = 'https://v2.jokeapi.dev/joke/Programming?type=single&blacklistFlags=nsfw,racist,sexist,explicit';
const CACHE_KEY = 'dev_joke';
const REFRESH_MS = 2 * 60 * 60_000; // 2 hours

export function useDevJoke(): string {
  const [joke, setJoke] = useState<string>(() => {
    const cached = getCache<DevJokeData>(CACHE_KEY);
    if (cached?.data && cached.age < REFRESH_MS) return cached.data.joke;
    return '';
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const cached = getCache<DevJokeData>(CACHE_KEY);
    if (cached?.data && cached.age < REFRESH_MS) {
      setJoke(cached.data.joke);
      return;
    }

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!json.joke || !mountedRef.current) return;

        setJoke(json.joke);
        setCache(CACHE_KEY, { joke: json.joke, timestamp: Date.now() }, 'jokeapi');
      } catch (e) { if (import.meta.env.DEV) console.warn('[DevJoke]', e); }
    };

    fetch_();
    const id = setInterval(fetch_, REFRESH_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return joke;
}
