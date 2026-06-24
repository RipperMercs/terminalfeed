// UAP Sightings, curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-06-22

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
    date: '2026-06-21',
    city: 'Haverhill',
    state: 'MA',
    shape: 'Sphere',
    duration: '5 minutes',
    summary: 'Two anglers near a pond watched a glowing red sphere rise over a mountaintop and hold position, echoing the pond orb reports highlighted in the latest Pentagon UAP file release.',
  },
  {
    date: '2026-06-20',
    city: 'Concord',
    state: 'NH',
    shape: 'Orb',
    duration: '8 minutes',
    summary: 'Witnesses described an orange mother orb that appeared above a ridgeline and spawned two to four smaller red orbs before they blinked out, matching the Northeast cluster pattern in the newly declassified files.',
  },
  {
    date: '2026-06-19',
    city: 'Salt Lake City',
    state: 'UT',
    shape: 'Disk',
    duration: '4 minutes',
    summary: 'A bright white disk hovered over the valley in clear daylight, holding steady for several minutes before climbing vertically out of sight.',
  },
  {
    date: '2026-06-19',
    city: 'Erie',
    state: 'PA',
    shape: 'Cigar',
    duration: '7 minutes',
    summary: 'A long featureless cigar shaped object reflected sunlight as it tracked east over Lake Erie with no wings, sound, or contrail.',
  },
  {
    date: '2026-06-18',
    city: 'Portland',
    state: 'ME',
    shape: 'Orb',
    duration: '6 minutes',
    summary: 'A loose line of red orbs drifted over the harbor at dusk, holding rough formation before fading one by one into the night sky.',
  },
  {
    date: '2026-06-18',
    city: 'Tucson',
    state: 'AZ',
    shape: 'Triangle',
    duration: '4 minutes',
    summary: 'A silent dark triangle with three dim corner lights drifted slowly south across a clear desert sky before accelerating out of view.',
  },
  {
    date: '2026-06-17',
    city: 'Boulder',
    state: 'CO',
    shape: 'Light',
    duration: '9 minutes',
    summary: 'A single bright point of light made several sharp right angle turns over the foothills, far faster than any aircraft the witness recognized.',
  },
  {
    date: '2026-06-16',
    city: 'Sarasota',
    state: 'FL',
    shape: 'Disk',
    duration: '5 minutes',
    summary: 'A metallic disk tilted on edge and hovered over the coast, catching the late afternoon light before climbing rapidly into cloud.',
  },
  {
    date: '2026-06-16',
    city: 'Chattanooga',
    state: 'TN',
    shape: 'Triangle',
    duration: '8 minutes',
    summary: 'A large triangular craft passed low and silently over a ridge, blotting out stars as it moved with a steady, deliberate glide.',
  },
  {
    date: '2026-06-15',
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
