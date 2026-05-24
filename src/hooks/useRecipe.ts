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

// Recipes come from HangryHQ (sister site) via our own Worker, which picks
// 5 deterministically per UTC day. All visitors today see the same 5; the
// set rotates at UTC midnight. Frontend just displays what the Worker
// returns: no client-side shuffle, no localStorage staleness.
const API_URL = '/api/hangry-recipes';
const CACHE_KEY = 'recipes_hangry_daily';
const REFRESH_MS = 30 * 60_000;   // poll every 30 min so we catch the daily flip quickly

function parse(json: unknown): RecipeData[] {
  const recipes = (json as { data?: { recipes?: unknown } })?.data?.recipes;
  if (!Array.isArray(recipes)) return [];
  const out: RecipeData[] = [];
  for (const raw of recipes) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name.trim() : '';
    const url = typeof r.url === 'string' ? r.url.trim() : '';
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
  // Seed from localStorage only for the very first paint to avoid an empty
  // panel on cold load. We always refetch from the Worker on mount.
  const [recipes, setRecipes] = useState<RecipeData[]>(() => {
    return getCache<RecipeData[]>(CACHE_KEY)?.data ?? [];
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
        const picks = parse(json);
        if (picks.length > 0) {
          setRecipes(picks);
          setCache(CACHE_KEY, picks, 'hangryhq');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[Recipe]', e); }
    };

    fetchRecipes();
    const id = setInterval(fetchRecipes, REFRESH_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return recipes;
}
