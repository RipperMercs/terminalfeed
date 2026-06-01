// UAP Sightings, curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-06-01

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
    date: '2026-05-31',
    city: 'Sedona',
    state: 'AZ',
    shape: 'Orb',
    duration: '8 minutes',
    summary: 'Half a dozen glowing orange orbs rose one by one from behind the red rocks at dusk, flared brighter as they climbed and arranged into a loose triangle before winking out over the desert.',
  },
  {
    date: '2026-05-31',
    city: 'Tacoma',
    state: 'WA',
    shape: 'Triangle',
    duration: '5 minutes',
    summary: 'Silent black triangle with a dim white light at each corner drifted low above Commencement Bay, tracked north along the waterfront and was filmed by several people on the boardwalk before it faded into cloud.',
  },
  {
    date: '2026-05-30',
    city: 'Colorado Springs',
    state: 'CO',
    shape: 'Light',
    duration: '4 minutes',
    summary: 'Four steady amber lights held a tight T formation above the foothills near Garden of the Gods, hovered motionless for several minutes, then accelerated east in unison and vanished.',
  },
  {
    date: '2026-05-30',
    city: 'Savannah',
    state: 'GA',
    shape: 'Sphere',
    duration: '6 minutes',
    summary: 'Polished chrome sphere reflecting the late sun hovered above the Savannah River, made two sharp right-angle moves with no sound before climbing straight up and out of sight.',
  },
  {
    date: '2026-05-29',
    city: 'Duluth',
    state: 'MN',
    shape: 'Disk',
    duration: '3 minutes',
    summary: 'Domed metallic disk crossed silently above Lake Superior near Canal Park at low altitude, made one slow orbit over the lift bridge and then shot out across the water.',
  },
  {
    date: '2026-05-29',
    city: 'Albuquerque',
    state: 'NM',
    shape: 'Orb',
    duration: '10 minutes',
    summary: 'Cluster of orange orbs swarmed in shifting patterns against the Sandia Mountains at twilight, observed by a backyard gathering who said the orbs split apart and regrouped twice before fading.',
  },
  {
    date: '2026-05-28',
    city: 'Burlington',
    state: 'VT',
    shape: 'Cigar',
    duration: '5 minutes',
    summary: 'Long silver cylinder with no wings or exhaust drifted slowly above Lake Champlain at midday, reported as completely silent by witnesses on the waterfront before it angled into haze.',
  },
  {
    date: '2026-05-28',
    city: 'Fort Worth',
    state: 'TX',
    shape: 'Triangle',
    duration: '7 minutes',
    summary: 'Dark triangle with three pulsing red lights passed low over the Trinity River at night, paused above a rail yard for a moment and then climbed vertically into overcast and disappeared.',
  },
  {
    date: '2026-05-27',
    city: 'Eugene',
    state: 'OR',
    shape: 'Light',
    duration: '11 minutes',
    summary: 'Formation of seven steady white lights held a wide V over the Willamette Valley, kept formation for several minutes, then peeled off one at a time toward the coast range.',
  },
  {
    date: '2026-05-26',
    city: 'Providence',
    state: 'RI',
    shape: 'Disk',
    duration: '4 minutes',
    summary: 'Saucer with a rotating ring of rim lights hovered above the Providence River downtown, completed a single tight loop and then accelerated south out over Narragansett Bay.',
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
