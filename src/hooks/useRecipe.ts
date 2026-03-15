import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface RecipeData {
  name: string;
  category: string;
  area: string;
  thumbnail: string;
  url: string;
}

const API_URL = 'https://www.themealdb.com/api/json/v1/1/random.php';
const CACHE_KEY = 'recipes_5';
const REFRESH_MS = 3 * 60 * 60_000; // 3 hours

function parseRecipe(meal: Record<string, string>): RecipeData {
  return {
    name: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    thumbnail: meal.strMealThumb,
    url: meal.strSource || meal.strYoutube || `https://www.themealdb.com/meal/${meal.idMeal}`,
  };
}

export function useRecipe(): RecipeData[] {
  const [recipes, setRecipes] = useState<RecipeData[]>(() => {
    const cached = getCache<RecipeData[]>(CACHE_KEY);
    // Use cache if less than 3 hours old
    if (cached?.data && cached.age < REFRESH_MS) return cached.data;
    return [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchRecipes = async () => {
      try {
        // Fetch 5 recipes in parallel
        const responses = await Promise.all(
          Array.from({ length: 5 }, () =>
            fetch(API_URL, { signal: AbortSignal.timeout(5000) })
          )
        );

        if (!mountedRef.current) return;

        const results: RecipeData[] = [];
        const seenNames = new Set<string>();

        for (const res of responses) {
          if (res.ok) {
            const json = await res.json();
            const meal = json.meals?.[0];
            if (meal && !seenNames.has(meal.strMeal)) {
              seenNames.add(meal.strMeal);
              results.push(parseRecipe(meal));
            }
          }
        }

        if (results.length > 0 && mountedRef.current) {
          setRecipes(results);
          setCache(CACHE_KEY, results, 'themealdb');
        }
      } catch {}
    };

    // Fetch on load if cache is stale or empty
    const cached = getCache<RecipeData[]>(CACHE_KEY);
    if (!cached?.data || cached.age >= REFRESH_MS) {
      fetchRecipes();
    }

    // Refresh every 3 hours
    const id = setInterval(fetchRecipes, REFRESH_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return recipes;
}
