// Standardized durations and easing curves for the motion primitive library.
// Every primitive reads from this file so ambient motion feels cohesive
// across the whole dashboard. Don't add new durations here without a reason:
// if a primitive needs something outside this set, it probably wants a tuning
// CSS variable, not a new token.

export const DURATION = {
  /** Micro-interaction: hover, focus, state swap. */
  fast: 180,
  /** Standard transition: width/opacity changes, entry animation. */
  normal: 340,
  /** Deliberate transition: value change on a dial, probability bar. */
  slow: 800,
  /** Ambient loop: sweep arm, orbit, sparkline tip pulse. */
  ambient: 3000,
  /** Parallax / background drift. */
  parallax: 90_000,
} as const;

export const EASING = {
  /** Overshoot-free, natural deceleration. Default for entrances. */
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Symmetric ease, good for bounded oscillations like dial jitter. */
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  /** Continuous rotation / sweep. */
  linear: 'linear',
  /** Step-end for blinking carets, CRT flicker. */
  stepEnd: 'step-end',
} as const;

export type DurationToken = keyof typeof DURATION;
export type EasingToken = keyof typeof EASING;
