// UAP Sightings, curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-06-15

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
    date: '2026-06-14',
    city: 'Nashua',
    state: 'NH',
    shape: 'Orb',
    duration: '6 minutes',
    summary: 'A glowing orange orb hovered low over a treeline before fading out, part of a wider cluster of orb reports across the Northeast this month.',
  },
  {
    date: '2026-06-14',
    city: 'Tucson',
    state: 'AZ',
    shape: 'Triangle',
    duration: '4 minutes',
    summary: 'A silent dark triangle with three dim corner lights drifted slowly south across a clear desert sky before accelerating out of view.',
  },
  {
    date: '2026-06-13',
    city: 'Erie',
    state: 'PA',
    shape: 'Cigar',
    duration: '7 minutes',
    summary: 'A long featureless cigar shaped object reflected sunlight as it tracked east over Lake Erie with no wings, sound, or contrail.',
  },
  {
    date: '2026-06-13',
    city: 'Sarasota',
    state: 'FL',
    shape: 'Disk',
    duration: '5 minutes',
    summary: 'A metallic disk tilted on edge and hovered over the coast, catching the late afternoon light before climbing rapidly into cloud.',
  },
  {
    date: '2026-06-12',
    city: 'Boulder',
    state: 'CO',
    shape: 'Light',
    duration: '9 minutes',
    summary: 'A single bright point of light made several sharp right angle turns over the foothills, far faster than any aircraft the witness recognized.',
  },
  {
    date: '2026-06-12',
    city: 'Salem',
    state: 'OR',
    shape: 'Sphere',
    duration: '6 minutes',
    summary: 'A pale white sphere split into two smaller spheres that circled each other briefly before merging again and drifting off.',
  },
  {
    date: '2026-06-11',
    city: 'Worcester',
    state: 'MA',
    shape: 'Orb',
    duration: '5 minutes',
    summary: 'Several red orbs appeared in a loose line over the city, holding formation for a few minutes before winking out one by one.',
  },
  {
    date: '2026-06-10',
    city: 'Bakersfield',
    state: 'CA',
    shape: 'Light',
    duration: '3 minutes',
    summary: 'A starlike light brightened and dimmed in an irregular rhythm while holding a fixed position, then shot straight up and vanished.',
  },
  {
    date: '2026-06-10',
    city: 'Chattanooga',
    state: 'TN',
    shape: 'Triangle',
    duration: '8 minutes',
    summary: 'A large triangular craft passed low and silently over a ridge, blotting out stars as it moved with a steady, deliberate glide.',
  },
  {
    date: '2026-06-09',
    city: 'Lincoln',
    state: 'NE',
    shape: 'Orb',
    duration: '7 minutes',
    summary: 'A lone amber orb hovered over open farmland, pulsing slowly in brightness before drifting toward the horizon and out of sight.',
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
