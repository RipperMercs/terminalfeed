// UAP Sightings, curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-04-20

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
    date: '2026-04-20',
    city: 'Toms River',
    state: 'NJ',
    shape: 'Orb',
    duration: '7 minutes',
    summary: 'Three amber orbs hovered in a tight triangle formation over the Barnegat Bay, reported by dozens of residents before the orbs faded out one by one over the Atlantic.',
  },
  {
    date: '2026-04-20',
    city: 'Flagstaff',
    state: 'AZ',
    shape: 'Disk',
    duration: '4 minutes',
    summary: 'Silver metallic disk with a dark underside observed tumbling end over end above the San Francisco Peaks, then stabilized and shot west at extreme speed.',
  },
  {
    date: '2026-04-19',
    city: 'Phoenixville',
    state: 'PA',
    shape: 'Triangle',
    duration: '10 minutes',
    summary: 'Large black triangle with three dim white lights at its corners passed silently over the French Creek valley, tracked by multiple witnesses on Route 23.',
  },
  {
    date: '2026-04-19',
    city: 'Bellingham',
    state: 'WA',
    shape: 'Light',
    duration: '6 minutes',
    summary: 'Two pulsing yellow lights held a fixed position over Lake Whatcom for several minutes before splitting apart and vanishing in opposite directions.',
  },
  {
    date: '2026-04-18',
    city: 'Key Largo',
    state: 'FL',
    shape: 'Sphere',
    duration: '3 minutes',
    summary: 'Reflective chrome sphere the size of a beach ball paced a fishing boat at low altitude, made no sound and left no wake on the water below.',
  },
  {
    date: '2026-04-17',
    city: 'Colorado Springs',
    state: 'CO',
    shape: 'Cigar',
    duration: '8 minutes',
    summary: 'Long matte grey cylindrical craft observed near the Front Range, reported by a private pilot at 12,000 feet who watched it drift perpendicular to wind currents.',
  },
  {
    date: '2026-04-16',
    city: 'Asheville',
    state: 'NC',
    shape: 'Triangle',
    duration: '5 minutes',
    summary: 'Boomerang-shaped craft with seven dull red lights along its leading edge passed over the Blue Ridge Parkway, blotting out stars as it glided north.',
  },
  {
    date: '2026-04-15',
    city: 'Redondo Beach',
    state: 'CA',
    shape: 'Orb',
    duration: '12 minutes',
    summary: 'Formation of five white orbs observed offshore by beachgoers at sunset, drifted in a horizontal line before dropping straight down into the water.',
  },
  {
    date: '2026-04-15',
    city: 'Madison',
    state: 'WI',
    shape: 'Disk',
    duration: '4 minutes',
    summary: 'Domed disk with rotating rim lights hovered briefly over Lake Mendota, made a silent ninety degree turn and accelerated out of sight toward the west.',
  },
  {
    date: '2026-04-14',
    city: 'Santa Fe',
    state: 'NM',
    shape: 'Light',
    duration: '15 minutes',
    summary: 'Cluster of nine bright white lights arranged in a grid pattern hung motionless above the Sangre de Cristo Mountains, then collapsed to a single point before vanishing.',
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
