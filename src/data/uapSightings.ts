// UAP Sightings, curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-04-27

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
    date: '2026-04-27',
    city: 'Toms River',
    state: 'NJ',
    shape: 'Light',
    duration: '12 minutes',
    summary: 'Cluster of bright stationary lights hovered above the Barnegat Bay before drifting silently inland, witnessed by dozens of residents during evening dog walks.',
  },
  {
    date: '2026-04-27',
    city: 'Cherry Hill',
    state: 'NJ',
    shape: 'Triangle',
    duration: '4 minutes',
    summary: 'Large dark triangle with three white lights at its vertices crossed low over Route 70, made no sound as it tracked southwest toward the Delaware River.',
  },
  {
    date: '2026-04-26',
    city: 'Reno',
    state: 'NV',
    shape: 'Disk',
    duration: '6 minutes',
    summary: 'Disk-shaped craft with rotating rim lights observed near the Mount Rose foothills at dusk, performed two tight orbits before climbing rapidly out of sight.',
  },
  {
    date: '2026-04-26',
    city: 'Saugerties',
    state: 'NY',
    shape: 'Orb',
    duration: '9 minutes',
    summary: 'Glowing orange orbs lit the Catskills sky in a slow arc above the Hudson River, paced each other for several minutes before fading out one by one.',
  },
  {
    date: '2026-04-25',
    city: 'Asheville',
    state: 'NC',
    shape: 'Sphere',
    duration: '5 minutes',
    summary: 'Reflective metallic sphere drifted above the Blue Ridge Parkway near Mount Pisgah, made several silent direction changes before vanishing behind the ridgeline.',
  },
  {
    date: '2026-04-25',
    city: 'Winterhaven',
    state: 'CA',
    shape: 'Light',
    duration: '14 minutes',
    summary: 'Fleet of seven steady white lights observed in formation over the Imperial Valley desert, held a fixed grid pattern before peeling off in different directions.',
  },
  {
    date: '2026-04-24',
    city: 'Boulder',
    state: 'CO',
    shape: 'Triangle',
    duration: '5 minutes',
    summary: 'Black equilateral triangle with three steady amber lights at its corners crossed silently above the Flatirons, blocking stars as it moved north toward Lyons.',
  },
  {
    date: '2026-04-23',
    city: 'Pensacola',
    state: 'FL',
    shape: 'Disk',
    duration: '3 minutes',
    summary: 'Metallic saucer with a domed top hovered above the Gulf at low altitude near the Naval Air Station, then accelerated vertically and vanished into a low cloud bank.',
  },
  {
    date: '2026-04-22',
    city: 'Burlington',
    state: 'VT',
    shape: 'Orb',
    duration: '11 minutes',
    summary: 'Cluster of five glowing white orbs hovered above Lake Champlain, slowly merged into a single bright object and drifted west toward the Adirondacks.',
  },
  {
    date: '2026-04-21',
    city: 'Sedona',
    state: 'AZ',
    shape: 'Cigar',
    duration: '7 minutes',
    summary: 'Long cylindrical craft with no wings or visible exhaust passed slowly over Cathedral Rock at sunset, observed by a tour group who reported it as completely silent.',
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
