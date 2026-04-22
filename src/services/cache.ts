// localStorage cache layer: every successful API response gets cached
// On next load, panels show cached data instantly while fresh data loads

const PREFIX = 'tf_cache_';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  source: string;
}

export function setCache<T>(key: string, data: T, source: string): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), source };
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable: silently skip
  }
}

export function getCache<T>(key: string): { data: T; age: number; source: string } | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return {
      data: entry.data,
      age: Date.now() - entry.timestamp,
      source: entry.source,
    };
  } catch {
    return null;
  }
}
