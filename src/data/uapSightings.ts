// UAP Sightings, curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-05-25

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
    date: '2026-05-24',
    city: 'Phoenix',
    state: 'AZ',
    shape: 'Orb',
    duration: '6 minutes',
    summary: 'Group of seven amber orbs hovered above South Mountain at dusk, drifted into a perfect triangle formation before fading out one by one over the desert.',
  },
  {
    date: '2026-05-24',
    city: 'Reno',
    state: 'NV',
    shape: 'Triangle',
    duration: '4 minutes',
    summary: 'Silent black triangle with three steady white lights at its corners passed slowly above the Truckee River, witnessed by a downtown patio crowd who said it blotted out the stars as it tracked east.',
  },
  {
    date: '2026-05-23',
    city: 'Wichita',
    state: 'KS',
    shape: 'Light',
    duration: '9 minutes',
    summary: 'Five steady white lights held a tight diamond formation above the Arkansas River, paced a private aircraft for several miles before splitting in four directions and accelerating out of sight.',
  },
  {
    date: '2026-05-23',
    city: 'Bangor',
    state: 'ME',
    shape: 'Disk',
    duration: '3 minutes',
    summary: 'Reflective metallic disk with a domed top crossed silently above Interstate 95 at low altitude, made one tight orbit over a wooded ridge before vanishing into low cloud.',
  },
  {
    date: '2026-05-22',
    city: 'Asheville',
    state: 'NC',
    shape: 'Sphere',
    duration: '7 minutes',
    summary: 'Polished chrome sphere reflecting the morning sun hovered above the Blue Ridge Parkway, performed several sharp right-angle turns without any audible engine before climbing vertically into clear sky.',
  },
  {
    date: '2026-05-22',
    city: 'Charleston',
    state: 'SC',
    shape: 'Cigar',
    duration: '5 minutes',
    summary: 'Long silver cylindrical craft with no wings or visible exhaust passed slowly above Charleston Harbor at midday, witnessed by dockworkers who reported it as completely silent.',
  },
  {
    date: '2026-05-21',
    city: 'Boise',
    state: 'ID',
    shape: 'Orb',
    duration: '8 minutes',
    summary: 'Cluster of four glowing orange orbs lit the sky above the Boise Foothills, observed by hikers who said the orbs paced their group along a ridgeline for nearly a mile before fading one by one.',
  },
  {
    date: '2026-05-21',
    city: 'Madison',
    state: 'WI',
    shape: 'Triangle',
    duration: '6 minutes',
    summary: 'Dark triangle with three pulsing red lights crossed low above Lake Mendota at sunset, paced a sailboat for several minutes before climbing vertically into thick overcast and vanishing.',
  },
  {
    date: '2026-05-20',
    city: 'San Diego',
    state: 'CA',
    shape: 'Light',
    duration: '12 minutes',
    summary: 'Fleet of nine steady amber lights observed in a precise V formation over Mission Bay, held position for several minutes before peeling off in nine different directions toward the Pacific.',
  },
  {
    date: '2026-05-19',
    city: 'Pittsburgh',
    state: 'PA',
    shape: 'Disk',
    duration: '4 minutes',
    summary: 'Saucer-shaped craft with rotating rim lights observed above the Monongahela River near the South Side, performed a single tight loop before accelerating west and vanishing behind Mount Washington.',
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
