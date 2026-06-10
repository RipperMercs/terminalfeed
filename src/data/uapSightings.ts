// UAP Sightings, curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-06-08

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
    date: '2026-06-06',
    city: 'Centerburg',
    state: 'OH',
    shape: 'Orb',
    duration: '5 minutes',
    summary: 'A single orb was seen bouncing through storm clouds, moving in step with the flashes of lightning before the weather closed in.',
  },
  {
    date: '2026-06-06',
    city: 'Richmond',
    state: 'VA',
    shape: 'Light',
    duration: '6 minutes',
    summary: 'An object the size of a distant star moved at random speeds and directions across the night sky with no steady flight path.',
  },
  {
    date: '2026-06-06',
    city: 'Monroe',
    state: 'NC',
    shape: 'Light',
    duration: '4 minutes',
    summary: 'Two blinking star sized lights flickered as they tracked across the sky together, observed by a witness late in the evening.',
  },
  {
    date: '2026-06-05',
    city: 'Foster',
    state: 'RI',
    shape: 'Sphere',
    duration: '7 minutes',
    summary: 'Dozens of white lights emerged from a single central point near the Big Dipper and flew outward in a controlled, deliberate pattern.',
  },
  {
    date: '2026-06-05',
    city: 'Pope Valley',
    state: 'CA',
    shape: 'Orb',
    duration: '9 minutes',
    summary: 'A lone orb hovered nearly motionless in one spot, drifting only slightly over several minutes before the witness lost sight of it.',
  },
  {
    date: '2026-06-05',
    city: 'Radcliff',
    state: 'KY',
    shape: 'Cigar',
    duration: '3 minutes',
    summary: 'Unidentified cylindrical objects were reported moving away from military personnel near Fort Knox in the early morning hours.',
  },
  {
    date: '2026-06-02',
    city: 'Port Clinton',
    state: 'OH',
    shape: 'Orb',
    duration: '5 minutes',
    summary: 'Two white orbs appeared behind a parent and child and slowly approached to roughly 200 to 300 feet of altitude before retreating.',
  },
  {
    date: '2026-06-01',
    city: 'Portsmouth',
    state: 'RI',
    shape: 'Disk',
    duration: '6 minutes',
    summary: 'A huge silver saucer shaped disk hung stationary then moved without any sound, showing bright white, red and teal lights.',
  },
  {
    date: '2026-06-01',
    city: 'Eufaula',
    state: 'OK',
    shape: 'Cigar',
    duration: '8 minutes',
    summary: 'A vertical, stationary object larger than a 747 sat at high altitude in clear skies, with a passing plane below offering scale.',
  },
  {
    date: '2026-06-01',
    city: 'Cleveland',
    state: 'OH',
    shape: 'Triangle',
    duration: '4 minutes',
    summary: 'A vivid blueish white, well defined, two dimensional scalene triangle moved at a constant velocity across the western sky.',
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
