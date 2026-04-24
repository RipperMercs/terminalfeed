import { memo, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { PriceTick } from '../hooks/useBtcPrice';
import { useReducedMotion } from '../hooks/useReducedMotion';
import styles from './BtcRollerCoaster.module.css';

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;

const STORAGE_KEY = 'tf_btc_roller';
const TOGGLE_EVENT = 'tf:btcroller-toggle';
const TEST_EVENT = 'tf:btcroller-test';

const SVG_W = 600;
const SVG_H = 180;

const THRESHOLD_PCT = 0.5;
const RIDE_MS = 4000;
const BIG_RIDE_MS = 6000;
const COOLDOWN_MS = 12_000;
const SPARK_INTERVAL_MS = 130;
const EMA_LOOKBACK_MS = 5 * 60_000;

interface RollerEvent {
  direction: 'up' | 'down';
  magnitude: 'small' | 'big';
  startedAt: number;
}

interface Props {
  pathRef: RefObject<SVGPathElement | null>;
  hostRef: RefObject<HTMLDivElement | null>;
  ticks: PriceTick[];
}

function calcEma(ticks: PriceTick[]): number | null {
  if (!ticks || ticks.length === 0) return null;
  const cutoff = Date.now() - EMA_LOOKBACK_MS;
  const recent = ticks.filter(t => t.time >= cutoff);
  if (recent.length === 0) return ticks[ticks.length - 1].price;
  const alpha = 2 / (recent.length + 1);
  let ema = recent[0].price;
  for (let i = 1; i < recent.length; i++) {
    ema = recent[i].price * alpha + ema * (1 - alpha);
  }
  return ema;
}

function readEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function useRollerEnabled(): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => readEnabled());
  useEffect(() => {
    const onToggle = () => setEnabled(readEnabled());
    window.addEventListener(TOGGLE_EVENT, onToggle);
    window.addEventListener('storage', onToggle);
    return () => {
      window.removeEventListener(TOGGLE_EVENT, onToggle);
      window.removeEventListener('storage', onToggle);
    };
  }, []);
  return enabled;
}

export const BtcRollerCoaster = memo(function BtcRollerCoaster({ pathRef, hostRef, ticks }: Props) {
  const enabled = useRollerEnabled();
  const reducedMotion = useReducedMotion();
  const rollerRef = useRef<HTMLDivElement | null>(null);
  const lastEventRef = useRef<number>(0);
  const wasAboveRef = useRef<boolean>(false);
  const animRef = useRef<Animation | null>(null);
  const sparkTimerRef = useRef<number | null>(null);
  const [event, setEvent] = useState<RollerEvent | null>(null);

  const inert = IS_MOBILE || reducedMotion;

  // Force-trigger via "+" key (App.tsx dispatches this). Bypasses cooldown
  // and EMA threshold, but still respects reduced-motion / mobile.
  useEffect(() => {
    if (inert) return;
    let toggle = false;
    const onTest = () => {
      toggle = !toggle;
      lastEventRef.current = 0;
      setEvent({
        direction: toggle ? 'up' : 'down',
        magnitude: toggle ? 'big' : 'small',
        startedAt: Date.now(),
      });
    };
    window.addEventListener(TEST_EVENT, onTest);
    return () => window.removeEventListener(TEST_EVENT, onTest);
  }, [inert]);

  useEffect(() => {
    if (inert || !enabled) return;
    if (!ticks || ticks.length < 2) return;

    const ema = calcEma(ticks);
    const last = ticks[ticks.length - 1];
    if (ema == null || ema <= 0 || !last) return;

    const pct = ((last.price - ema) / ema) * 100;
    const absPct = Math.abs(pct);
    const above = absPct >= THRESHOLD_PCT;

    if (above && !wasAboveRef.current) {
      const now = Date.now();
      if (now - lastEventRef.current >= COOLDOWN_MS) {
        const direction: 'up' | 'down' = pct >= 0 ? 'up' : 'down';
        const magnitude: 'small' | 'big' = absPct >= THRESHOLD_PCT * 2 ? 'big' : 'small';
        lastEventRef.current = now;
        setEvent({ direction, magnitude, startedAt: now });
      }
    }
    wasAboveRef.current = above;
  }, [ticks, inert, enabled]);

  useEffect(() => {
    if (!event) return;
    const roller = rollerRef.current;
    const path = pathRef.current;
    const host = hostRef.current;
    if (!roller || !path || !host) return;

    let cancelled = false;

    try {
      const rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const totalLen = path.getTotalLength();
      if (!Number.isFinite(totalLen) || totalLen <= 0) return;

      const samples = 80;
      const xScale = rect.width / SVG_W;
      const yScale = rect.height / SVG_H;
      let d = '';
      for (let i = 0; i <= samples; i++) {
        const pt = path.getPointAtLength((i / samples) * totalLen);
        const x = pt.x * xScale;
        const y = pt.y * yScale;
        d += (i === 0 ? 'M' : 'L') + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }

      roller.style.offsetPath = `path("${d.trim()}")`;
      // @ts-expect-error vendor prefix for older WebKit
      roller.style.webkitOffsetPath = `path("${d.trim()}")`;
      roller.style.offsetAnchor = '50% 80%';

      animRef.current?.cancel();
      const dur = event.magnitude === 'big' ? BIG_RIDE_MS : RIDE_MS;
      animRef.current = roller.animate(
        [
          { offsetDistance: '0%',   opacity: 0 },
          { offsetDistance: '6%',   opacity: 1, offset: 0.06 },
          { offsetDistance: '94%',  opacity: 1, offset: 0.94 },
          { offsetDistance: '100%', opacity: 0 },
        ],
        { duration: dur, fill: 'forwards', easing: 'cubic-bezier(.4,.05,.3,1)' }
      );

      // Spark trail
      if (sparkTimerRef.current != null) window.clearInterval(sparkTimerRef.current);
      sparkTimerRef.current = window.setInterval(() => {
        if (cancelled) return;
        const r = roller.getBoundingClientRect();
        const h = host.getBoundingClientRect();
        if (r.width === 0) return;
        const s = document.createElement('div');
        s.className = styles.spark;
        s.style.left = (r.left - h.left + r.width / 2) + 'px';
        s.style.top = (r.top - h.top + r.height * 0.7) + 'px';
        host.appendChild(s);
        window.setTimeout(() => { s.remove(); }, 700);
      }, SPARK_INTERVAL_MS);

      const stopAt = window.setTimeout(() => {
        if (sparkTimerRef.current != null) {
          window.clearInterval(sparkTimerRef.current);
          sparkTimerRef.current = null;
        }
        setEvent(null);
      }, dur + 100);

      return () => {
        cancelled = true;
        window.clearTimeout(stopAt);
        if (sparkTimerRef.current != null) {
          window.clearInterval(sparkTimerRef.current);
          sparkTimerRef.current = null;
        }
        animRef.current?.cancel();
      };
    } catch {
      // Any unexpected DOM/animation failure: silently bail. Hero panel keeps working.
      setEvent(null);
    }
  }, [event, pathRef, hostRef]);

  useEffect(() => {
    return () => {
      animRef.current?.cancel();
      if (sparkTimerRef.current != null) {
        window.clearInterval(sparkTimerRef.current);
        sparkTimerRef.current = null;
      }
    };
  }, []);

  if (inert) return null;

  const onToggleClick = () => {
    const next = enabled ? 'off' : 'on';
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event(TOGGLE_EVENT));
      if (next === 'on') window.dispatchEvent(new Event(TEST_EVENT));
    } catch { /* ignore */ }
  };

  return (
    <div className={styles.host}>
      {event && (
        <span
          className={`${styles.label} ${event.direction === 'up' ? styles.up : styles.down}`}
          aria-hidden="true"
        >
          {event.magnitude === 'big'
            ? (event.direction === 'up' ? '▲ SURGE' : '▼ DUMP')
            : (event.direction === 'up' ? '▲ MOVE'  : '▼ MOVE')}
        </span>
      )}
      <div ref={rollerRef} className={styles.roller} aria-hidden="true">
        <img src="/btc-roller.png" alt="" draggable={false} />
      </div>
      <button
        type="button"
        className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`}
        onClick={onToggleClick}
        aria-pressed={enabled}
        aria-label={enabled ? 'Disable BTC roller coaster animation' : 'Enable BTC roller coaster animation'}
        title={enabled ? 'Click to disable BTC roller' : 'Click to enable BTC roller (mascot rides chart on big moves)'}
      >
        ROLLER {enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
});
