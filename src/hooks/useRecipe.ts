import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface RecipeData {
  name: string;
  category: string;
  area: string;
  thumbnail: string;
  url: string;
  date: string; // YYYY-MM-DD
}

const API_URL = 'https://www.themealdb.com/api/json/v1/1/random.php';
const CACHE_KEY = 'recipe';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useRecipe(): RecipeData | null {
  const [data, setData] = useState<RecipeData | null>(() => {
    const cached = getCache<RecipeData>(CACHE_KEY);
    if (cached?.data && cached.data.date === todayKey()) return cached.data;
    return null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Already have today's recipe
    if (data?.date === todayKey()) return;

    const fetch_ = async () => {
      try {
        const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const json = await res.json();
        const meal = json.meals?.[0];
        if (!meal || !mountedRef.current) return;

        const result: RecipeData = {
          name: meal.strMeal,
          category: meal.strCategory,
          area: meal.strArea,
          thumbnail: meal.strMealThumb,
          url: meal.strSource || meal.strYoutube || `https://www.themealdb.com/meal/${meal.idMeal}`,
          date: todayKey(),
        };

        setData(result);
        setCache(CACHE_KEY, result, 'themealdb');
      } catch {}
    };

    fetch_();
    return () => { mountedRef.current = false; };
  }, [data]);

  return data;
}
