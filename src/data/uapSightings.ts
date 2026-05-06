// UAP Sightings, curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-05-04

export interface UAPSighting {
  date: string;
  city: string;
  state: string;
  shape: string;
  duration: string;
  summary: string;
}

export const uapSightings: UAPSighting[] = [
  {
    date: '2026-05-03',
    city: 'Galloway',
    state: 'NJ',
    shape: 'Light',
    duration: '8 minutes',
    summary: 'Cluster of nine bright white lights drifted in loose formation above the Pinelands, observed by multiple residents who reported the lights stopped and reversed direction without any audible engine.',
  },
  {
    date: '2026-05-03',
    city: 'Bridgewater',
    state: 'NJ',
    shape: 'Triangle',
    duration: '5 minutes',
    summary: 'Black equilateral triangle with three steady red lights at its corners passed silently above the Raritan River, blocked stars as it tracked east toward Somerville at low altitude.',
  },
  {
    date: '2026-05-02',
    city: 'Atlantic City',
    state: 'NJ',
    shape: 'Orb',
    duration: '7 minutes',
    summary: 'Three glowing orange orbs hovered above the boardwalk near the Steel Pier, slowly merged into a single brighter object before climbing rapidly out over the Atlantic.',
  },
  {
    date: '2026-05-02',
    city: 'Cinnaminson',
    state: 'NJ',
    shape: 'Disk',
    duration: '4 minutes',
    summary: 'Reflective metallic disk with a domed top crossed slowly above Route 130 at dusk, made one tight orbit over a residential cul-de-sac before vanishing into low cloud.',
  },
  {
    date: '2026-05-01',
    city: 'Chatham Township',
    state: 'NJ',
    shape: 'Sphere',
    duration: '6 minutes',
    summary: 'Polished metallic sphere reflecting the sunset hovered above the Great Swamp, made several silent direction changes before drifting north toward Morristown and fading from view.',
  },
  {
    date: '2026-04-30',
    city: 'Austin',
    state: 'TX',
    shape: 'Light',
    duration: '11 minutes',
    summary: 'Fleet of five steady amber lights observed in a precise V formation over Lake Travis, held position for several minutes before peeling off in five different directions.',
  },
  {
    date: '2026-04-30',
    city: 'Sacramento',
    state: 'CA',
    shape: 'Cigar',
    duration: '5 minutes',
    summary: 'Long silver cylindrical craft with no wings or visible exhaust passed slowly above the American River at noon, witnessed by a road crew who reported it as completely silent.',
  },
  {
    date: '2026-04-29',
    city: 'Portland',
    state: 'OR',
    shape: 'Triangle',
    duration: '4 minutes',
    summary: 'Dark triangle with three pulsing white lights crossed low above the St. Johns Bridge, paced traffic on the deck for several blocks before climbing vertically into thick overcast.',
  },
  {
    date: '2026-04-29',
    city: 'Tampa',
    state: 'FL',
    shape: 'Orb',
    duration: '9 minutes',
    summary: 'Cluster of four glowing red orbs lit the sky above Hillsborough Bay, observed by boaters who said the orbs paced their vessel for nearly a mile before fading one by one.',
  },
  {
    date: '2026-04-28',
    city: 'Albuquerque',
    state: 'NM',
    shape: 'Disk',
    duration: '3 minutes',
    summary: 'Saucer-shaped craft with rotating rim lights observed near the Sandia Mountains foothills at sunset, performed a single tight loop before accelerating east and vanishing.',
  },
];

export function getShapeStats(): { shape: string; count: number; pct: number }[] {
  const counts: Record<string, number> = {};
  for (const s of uapSightings) {
    counts[s.shape] = (counts[s.shape] || 0) + 1;
  }
  const total = uapSightings.length;
  return Object.entries(counts)
    .map(([shape, count]) => ({ shape, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}
