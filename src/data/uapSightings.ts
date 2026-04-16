// UAP Sightings — curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-04-15

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
    date: '2026-04-14',
    city: 'Newark',
    state: 'NJ',
    shape: 'Triangle',
    duration: '6 minutes',
    summary: 'Large silent triangle with three white lights hovering over Newark Bay, departed vertically at extreme speed.',
  },
  {
    date: '2026-04-13',
    city: 'Scottsdale',
    state: 'AZ',
    shape: 'Orb',
    duration: '4 minutes',
    summary: 'Bright orange orb appeared stationary over McDowell Mountains, pulsed twice, then split into two objects before vanishing.',
  },
  {
    date: '2026-04-12',
    city: 'Boise',
    state: 'ID',
    shape: 'Light',
    duration: '12 minutes',
    summary: 'Formation of seven white lights moving in a perfect grid pattern, no sound, shifted to diamond formation before fading out.',
  },
  {
    date: '2026-04-10',
    city: 'Dutch John',
    state: 'UT',
    shape: 'Light',
    duration: '8 minutes',
    summary: 'Brilliant light ship hovering over Flaming Gorge Reservoir, illuminated the water surface, moved north and disappeared behind mountains.',
  },
  {
    date: '2026-04-09',
    city: 'Trenton',
    state: 'NJ',
    shape: 'Sphere',
    duration: '3 minutes',
    summary: 'Metallic sphere reflecting moonlight at low altitude, performed impossible stop-start maneuvers, no sound whatsoever.',
  },
  {
    date: '2026-04-07',
    city: 'Ninole',
    state: 'HI',
    shape: 'Disk',
    duration: '5 minutes',
    summary: 'Two disk-shaped objects observed over the Pacific coast, moving in tandem with synchronized banking turns.',
  },
  {
    date: '2026-04-06',
    city: 'Ojo de Agua',
    state: 'MX',
    shape: 'Disk',
    duration: '2 minutes',
    summary: 'White disk-shaped object hovering at high altitude, completely stationary, disappeared instantly without acceleration.',
  },
  {
    date: '2026-04-05',
    city: 'Edison',
    state: 'NJ',
    shape: 'Triangle',
    duration: '7 minutes',
    summary: 'Silent dark triangle with dim red lights at vertices drifting slowly over the NJ Turnpike, multiple witnesses from vehicles.',
  },
  {
    date: '2026-04-03',
    city: 'Winterhaven',
    state: 'CA',
    shape: 'Orb',
    duration: '15 minutes',
    summary: 'Fleet of amber orbs in loose formation over the desert near the Colorado River, at least 8 objects, slowly dispersed.',
  },
  {
    date: '2026-04-01',
    city: 'Charleston',
    state: 'SC',
    shape: 'Cigar',
    duration: '4 minutes',
    summary: 'Long dark cigar-shaped craft with no wings observed at dusk, pulsating blue-white glow along its length, moving against prevailing wind.',
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
