// UAP Sightings, curated from NUFORC recent reports
// Update periodically from nuforc.org/webreports/ndxevent.html
// Last updated: 2026-07-27
// Source: NUFORC "Index by DATE POSTED" batches p260725 and p260726
// (nuforc.org/ndx/?id=post). Every entry below is a real filed report; the
// date is the reported EVENT date, not the posting date, so the range runs
// a few weeks behind the posting batch. Durations are taken verbatim from
// each report's Duration field and lightly normalized for display only.

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
    date: '2026-07-19',
    city: 'Monroe',
    state: 'MI',
    shape: 'Cigar',
    duration: 'Approximately 3 minutes',
    summary: 'A witness filming a small aircraft departing Custer airport caught a light gold object with a rounded nose and tapering tail tracking south southwest below the plane, which NUFORC flags as possible space junk.',
  },
  {
    date: '2026-07-18',
    city: 'Fort Duchesne',
    state: 'UT',
    shape: 'Orb',
    duration: '10 minutes',
    summary: 'Four campers at the UFO Valley site next to Skinwalker Ranch watched an orb streak off the Mesa, hover behind their tent, then vanish and reappear in an erratic pattern along the tree line.',
  },
  {
    date: '2026-07-18',
    city: 'Kaiser',
    state: 'MO',
    shape: 'Light',
    duration: '1 hour 20 minutes',
    summary: 'A family of six at a lake condo watched three solid white lights hold perfectly still near the moon for roughly 40 minutes with no drift at full zoom, before the group descended lower and closer.',
  },
  {
    date: '2026-07-18',
    city: 'Nags Head',
    state: 'NC',
    shape: 'Cigar',
    duration: 'Not specified',
    summary: 'Two observers watching from a beachfront room reported a 20 to 30 foot cigar shaped object moving north to south just under the ocean surface near the pier, leaving no wake and no prop wash.',
  },
  {
    date: '2026-07-18',
    city: 'Fall Branch',
    state: 'TN',
    shape: 'Light',
    duration: '1 minute',
    summary: 'A witness monitoring late night severe weather saw a motionless red star like point hanging inside the storm cell before it disappeared in a bright red flash timed to a lightning strike.',
  },
  {
    date: '2026-07-17',
    city: 'Seal Beach',
    state: 'CA',
    shape: 'Sphere',
    duration: '2 to 3 minutes',
    summary: 'A freeway driver noticed cars swerving and stopping around them, looked up, and reported a large round gray object that appeared to darken itself out of view before reappearing twice in new positions.',
  },
  {
    date: '2026-07-14',
    city: 'Wellington',
    state: 'CO',
    shape: 'Triangle',
    duration: '8 seconds',
    summary: 'An observer who logs flight time with drones and model aircraft described a silent dark triangle the apparent size of an airliner zig zagging rapidly to the southwest at high altitude.',
  },
  {
    date: '2026-07-13',
    city: 'Mount Prospect',
    state: 'IL',
    shape: 'Triangle',
    duration: '3 to 5 minutes',
    summary: 'A witness near O Hare reported two translucent triangles rotating around each other that turned opaque white, were joined by a third craft in rigid formation, then merged and vanished in silence.',
  },
  {
    date: '2026-07-07',
    city: 'Murphysboro',
    state: 'IL',
    shape: 'Sphere',
    duration: '1 minute 25 seconds',
    summary: 'Two people watching the sky at sunset reported a pair of metallic silver spheres glowing blue and white with a visible wave pattern, closing to an estimated 500 feet.',
  },
  {
    date: '2026-06-28',
    city: 'Wanaque',
    state: 'NJ',
    shape: 'Disk',
    duration: 'Under 1 minute',
    summary: 'Two observers resting in a rowboat watched a dark disk descend, accelerate from a dead stop to a blur, and pass into a gap in the clouds that appeared black rather than open sky.',
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
