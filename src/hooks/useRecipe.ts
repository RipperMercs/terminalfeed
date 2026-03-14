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

interface RecipePair {
  recipes: RecipeData[];
  date: string;
}

const API_URL = 'https://www.themealdb.com/api/json/v1/1/random.php';
const CACHE_KEY = 'recipes_pair';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseRecipe(meal: Record<string, string>): RecipeData {
  return {
    name: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    thumbnail: meal.strMealThumb,
    url: meal.strSource || meal.strYoutube || `https://www.themealdb.com/meal/${meal.idMeal}`,
    date: todayKey(),
  };
}

export function useRecipe(): RecipeData[] {
  const [recipes, setRecipes] = useState<RecipeData[]>(() => {
    const cached = getCache<RecipePair>(CACHE_KEY);
    if (cached?.data && cached.data.date === todayKey()) return cached.data.recipes;
    return [];
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Already have today's recipes
    if (recipes.length >= 2 && recipes[0]?.date === todayKey()) return;

    const fetchRecipes = async () => {
      try {
        // Fetch 2 recipes in parallel
        const [res1, res2] = await Promise.all([
          fetch(API_URL, { signal: AbortSignal.timeout(5000) }),
          fetch(API_URL, { signal: AbortSignal.timeout(5000) }),
        ]);

        if (!mountedRef.current) return;

        const results: RecipeData[] = [];

        if (res1.ok) {
          const json = await res1.json();
          if (json.meals?.[0]) results.push(parseRecipe(json.meals[0]));
        }
        if (res2.ok) {
          const json = await res2.json();
          if (json.meals?.[0]) results.push(parseRecipe(json.meals[0]));
        }

        if (results.length > 0 && mountedRef.current) {
          setRecipes(results);
          setCache(CACHE_KEY, { recipes: results, date: todayKey() }, 'themealdb');
        }
      } catch {}
    };

    fetchRecipes();
    return () => { mountedRef.current = false; };
  }, [recipes]);

  return recipes;
}
