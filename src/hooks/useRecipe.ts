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
//
// We append `?day=YYYY-MM-DD` to the URL so each day is a unique URL from
// the CF edge cache's perspective. Without this, the edge can hold a stale
// response for up to its prior Cache-Control max-age (was 6h in the old
// shape), preventing the panel from flipping at UTC midnight.
const API_PATH = '/api/hangry-recipes';
// v3 bumps past the v2 (`recipes_hangry_daily`) cache key that briefly
// held 30 stale recipes from the pre-rotation worker response.
const CACHE_KEY = 'recipes_hangry_v3';
const REFRESH_MS = 30 * 60_000;   // poll every 30 min so we catch the daily flip quickly

function utcDateKey(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
        const url = `${API_PATH}?day=${utcDateKey()}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const json = await res.json();
        if (!mountedRef.current) return;
        const picks = parse(json);
        // Defensive: if the worker / CDN somehow gave us a non-rotated set
        // (>5 items would mean we're seeing the old shape), skip caching.
        if (picks.length > 0 && picks.length <= 5) {
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
