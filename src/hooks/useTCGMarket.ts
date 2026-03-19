import { useEffect, useState, useRef } from 'react';
import { getCache, setCache } from '../services/cache';

export interface TCGCard {
  name: string;
  game: 'Pokemon' | 'MTG' | 'Yu-Gi-Oh';
  price: number;
  set: string;
  rarity: string;
  image: string;
  url?: string;
}

export interface TCGMarketData {
  cards: TCGCard[];
  timestamp: number;
}

const CACHE_KEY = 'tcg_market';
const POLL_MS = 300_000; // 5 minutes

async function fetchPokemon(): Promise<TCGCard[]> {
  try {
    // Fetch high-value holofoil cards sorted by market price
    const res = await fetch(
      'https://api.pokemontcg.io/v2/cards?q=tcgplayer.prices.holofoil.market:[20 TO *]&orderBy=-tcgplayer.prices.holofoil.market&pageSize=8&select=id,name,set,rarity,tcgplayer,images',
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).map((c: any) => {
      const prices = c.tcgplayer?.prices;
      const priceObj = prices?.holofoil || prices?.reverseHolofoil || prices?.['1stEditionHolofoil'] || prices?.normal;
      return {
        name: c.name,
        game: 'Pokemon' as const,
        price: priceObj?.market ?? priceObj?.mid ?? 0,
        set: c.set?.name ?? '',
        rarity: c.rarity ?? '',
        image: c.images?.small ?? '',
        url: c.tcgplayer?.url,
      };
    }).filter((c: TCGCard) => c.price > 0);
  } catch { return []; }
}

async function fetchMTG(): Promise<TCGCard[]> {
  try {
    const res = await fetch(
      'https://api.scryfall.com/cards/search?q=usd>20&order=usd&dir=desc&page=1&unique=cards',
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).slice(0, 8).map((c: any) => ({
      name: c.name,
      game: 'MTG' as const,
      price: parseFloat(c.prices?.usd ?? '0') || parseFloat(c.prices?.usd_foil ?? '0') || 0,
      set: c.set_name ?? '',
      rarity: c.rarity ?? '',
      image: c.image_uris?.small ?? (c.card_faces?.[0]?.image_uris?.small ?? ''),
      url: c.scryfall_uri,
    })).filter((c: TCGCard) => c.price > 0);
  } catch { return []; }
}

async function fetchYGO(): Promise<TCGCard[]> {
  try {
    // Fetch a batch of staple/popular cards and sort by price client-side
    const res = await fetch(
      'https://db.ygoprodeck.com/api/v7/cardinfo.php?staple=yes&num=60&offset=0',
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? [])
      .map((c: any) => {
        const prices = c.card_prices?.[0];
        const price = parseFloat(prices?.tcgplayer_price ?? '0') || parseFloat(prices?.cardmarket_price ?? '0') || 0;
        return {
          name: c.name,
          game: 'Yu-Gi-Oh' as const,
          price,
          set: c.card_sets?.[0]?.set_name ?? c.archetype ?? '',
          rarity: c.card_sets?.[0]?.set_rarity_code ?? c.race ?? '',
          image: c.card_images?.[0]?.image_url_small ?? '',
          url: c.ygoprodeck_url,
        };
      })
      .filter((c: TCGCard) => c.price > 1)
      .sort((a: TCGCard, b: TCGCard) => b.price - a.price)
      .slice(0, 8);
  } catch { return []; }
}

export function useTCGMarket() {
  const [data, setData] = useState<TCGMarketData | null>(() => {
    const cached = getCache<TCGMarketData>(CACHE_KEY);
    return cached?.data ?? null;
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      const [pokemon, mtg, ygo] = await Promise.all([fetchPokemon(), fetchMTG(), fetchYGO()]);
      if (!mountedRef.current) return;

      // Interleave: take top cards from each game
      const combined: TCGCard[] = [];
      const maxLen = Math.max(pokemon.length, mtg.length, ygo.length);
      for (let i = 0; i < maxLen && combined.length < 15; i++) {
        if (pokemon[i]) combined.push(pokemon[i]);
        if (mtg[i]) combined.push(mtg[i]);
        if (ygo[i]) combined.push(ygo[i]);
      }

      const result: TCGMarketData = { cards: combined, timestamp: Date.now() };
      setData(result);
      setCache(CACHE_KEY, result, 'multi');
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
