import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface RecipeData {
  name: string;
  category: string;
  area: string;
  thumbnail: string;
  url: string;
  timeMinutes: number;
}

// Recipes come from HangryHQ (sister site) via our own Worker. Every link
// points to a hangryhq.com/recipes/<slug> page so the panel funnels traffic
// there. Routed through /api/* per the no-direct-external-fetch rule.
const API_URL = '/api/hangry-recipes';
const CACHE_KEY = 'recipes_hangry_1';
const REFRESH_MS = 6 * 60 * 60_000; // 6 hours
const SHOW_COUNT = 5;

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function parse(json: unknown): RecipeData[] {
  const recipes = (json as { data?: { recipes?: unknown } })?.data?.recipes;
  if (!Array.isArray(recipes)) return [];
  const out: RecipeData[] = [];
  for (const raw of recipes) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name.trim() : '';
    const url = typeof r.url === 'string' ? r.url.trim() : '';
    // Only render rows that actually link back to a HangryHQ recipe page.
    if (!name || !/^https:\/\/hangryhq\.com\/recipes\//.test(url)) continue;
    out.push({
      name,
      category: typeof r.category === 'string' ? r.category : 'Recipe',
      area: typeof r.area === 'string' ? r.area : '',
      thumbnail: typeof r.thumbnail === 'string' ? r.thumbnail : '',
      url,
      timeMinutes: typeof r.time_minutes === 'number' ? r.time_minutes : 0,
    });
  }
  return out;
}

export function useRecipe(): RecipeData[] {
  const [recipes, setRecipes] = useState<RecipeData[]>(() => {
    const cached = getCache<RecipeData[]>(CACHE_KEY);
    if (cached?.data && cached.age < REFRESH_MS) return cached.data;
    return [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchRecipes = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current) return;

        const pool = parse(json);
        if (pool.length > 0) {
          // Shuffle so the "recipes of the day" rotate between visits.
          const picked = shuffle(pool).slice(0, SHOW_COUNT);
          setRecipes(picked);
          setCache(CACHE_KEY, picked, 'hangryhq');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[Recipe]', e); }
    };

    const cached = getCache<RecipeData[]>(CACHE_KEY);
    if (!cached?.data || cached.age >= REFRESH_MS) {
      fetchRecipes();
    }

    const id = setInterval(fetchRecipes, REFRESH_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return recipes;
}
