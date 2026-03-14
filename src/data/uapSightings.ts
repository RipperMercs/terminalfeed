// UAP Sightings — curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-03-14

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
    date: '2026-03-12',
    city: 'Bridgewater',
    state: 'NJ',
    shape: 'Triangle',
    duration: '3 minutes',
    summary: 'Silent triangular craft hovering over Route 22, three white lights at corners, departed at extreme speed.',
  },
  {
    date: '2026-03-11',
    city: 'Phoenix',
    state: 'AZ',
    shape: 'Orb',
    duration: '8 minutes',
    summary: 'Orange orb splitting into three separate objects then reforming into single light before vanishing.',
  },
  {
    date: '2026-03-10',
    city: 'San Diego',
    state: 'CA',
    shape: 'Disk',
    duration: '4 minutes',
    summary: 'Metallic disk-shaped object reflecting sunlight, completely stationary at high altitude, then instant acceleration.',
  },
  {
    date: '2026-03-09',
    city: 'Austin',
    state: 'TX',
    shape: 'Light',
    duration: '12 minutes',
    summary: 'Formation of 5 lights moving in perfect unison, no sound whatsoever, shifted from V to line formation.',
  },
  {
    date: '2026-03-08',
    city: 'Portland',
    state: 'OR',
    shape: 'Cigar',
    duration: '2 minutes',
    summary: 'Long cigar-shaped craft with no wings, pulsating blue-white light along its length, moving against wind.',
  },
  {
    date: '2026-03-07',
    city: 'Miami',
    state: 'FL',
    shape: 'Orb',
    duration: '6 minutes',
    summary: 'Bright white orb hovering over ocean, dropped into water creating brief green glow beneath surface.',
  },
  {
    date: '2026-03-05',
    city: 'Denver',
    state: 'CO',
    shape: 'Triangle',
    duration: '1 minute',
    summary: 'Large dark triangle blocking out stars, absolutely silent, three dim red lights at vertices.',
  },
  {
    date: '2026-03-04',
    city: 'Seattle',
    state: 'WA',
    shape: 'Sphere',
    duration: '15 minutes',
    summary: 'Silver sphere at very high altitude, reflecting sunlight, performed impossible right-angle turn.',
  },
  {
    date: '2026-03-02',
    city: 'Nashville',
    state: 'TN',
    shape: 'Light',
    duration: '5 minutes',
    summary: 'Two amber lights performing coordinated maneuvers, accelerating and stopping instantaneously.',
  },
  {
    date: '2026-03-01',
    city: 'Las Vegas',
    state: 'NV',
    shape: 'Disk',
    duration: '3 minutes',
    summary: 'Disk with rotating multicolored lights on rim, descended slowly then shot upward at extreme velocity.',
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
