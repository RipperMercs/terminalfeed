import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useEarthquakes } from '../hooks/useEarthquakes';
import { PanelHead } from './PanelHead';
import { LatencyChip } from './LatencyChip';
import type { LayoutManager } from '../hooks/useLayoutManager';
import styles from './SeismicTimeline.module.css';

interface Props {
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MIN_MAG = 2.5;
const MAX_MAG = 6.5;
const MAG_GRIDLINES = [3, 4, 5, 6];
const TICK_MS = 60_000; // shift positions left once per minute

function magColorClass(mag: number): string {
  if (mag >= 5)   return styles.magHigh;
  if (mag >= 3.5) return styles.magMid;
  return styles.magLow;
}

function ageOpacityClass(ageMs: number): string {
  if (ageMs < 4 * 60 * 60 * 1000) return '';
  if (ageMs < 14 * 60 * 60 * 1000) return styles.agePartial;
  return styles.ageFaded;
}

function markerSizePx(mag: number): number {
  // r = magnitude^1.6, clamped 6–22px diameter
  return Math.max(6, Math.min(22, Math.round(Math.pow(mag, 1.6))));
}

export const SeismicTimeline = memo(function SeismicTimeline({ layout, panelHealth, getGridCols }: Props) {
  const quakes = useEarthquakes();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(iv);
  }, []);

  const plotted = useMemo(() => {
    return quakes
      .map(q => {
        const ageMs = now - q.time;
        if (ageMs < 0 || ageMs > WINDOW_MS) return null;
        // x: 0 = -24h (left), 100 = now (right)
        const x = 100 - (ageMs / WINDOW_MS) * 100;
        // y: bottom % from baseline, scaled by magnitude within [MIN, MAX]
        const magClamped = Math.min(MAX_MAG, Math.max(MIN_MAG, q.magnitude));
        const y = ((magClamped - MIN_MAG) / (MAX_MAG - MIN_MAG)) * 100;
        return { q, x, y, ageMs };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.q.magnitude - b.q.magnitude);
  }, [quakes, now]);

  const counts = useMemo(() => {
    const c = { total: 0, m5: 0, m4: 0 };
    for (const p of plotted) {
      c.total++;
      if (p.q.magnitude >= 5) c.m5++;
      else if (p.q.magnitude >= 4) c.m4++;
    }
    return c;
  }, [plotted]);

  const mostRecentTs = quakes.length > 0
    ? Math.max(...quakes.map(q => q.time))
    : null;

  // Seismograph scribble: 80-point rolling array. Baseline noise every 120ms,
  // plus an amplitude spike whenever a new quake id appears in the feed.
  const SEIS_LEN = 80;
  const [seis, setSeis] = useState<number[]>(() => Array.from({ length: SEIS_LEN }, () => 50));
  const seenIdsRef = useRef<Set<string>>(new Set(quakes.map(q => q.id)));
  const spikeAmpRef = useRef(0);

  useEffect(() => {
    const seen = seenIdsRef.current;
    let biggestNew = 0;
    for (const q of quakes) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        if (q.magnitude > biggestNew) biggestNew = q.magnitude;
      }
    }
    if (biggestNew > 0) {
      spikeAmpRef.current = Math.max(spikeAmpRef.current, Math.min(35, biggestNew * 7));
    }
  }, [quakes]);

  useEffect(() => {
    const iv = setInterval(() => {
      setSeis(prev => {
        const base = 50 + (Math.random() - 0.5) * 3;
        const spike = spikeAmpRef.current;
        // Bleed off spike amplitude after consuming it
        spikeAmpRef.current = Math.max(0, spike - 12);
        const value = spike > 0
          ? 50 + (Math.random() < 0.5 ? -spike : spike) * (0.7 + Math.random() * 0.3)
          : base;
        return [...prev.slice(1), value];
      });
    }, 120);
    return () => clearInterval(iv);
  }, []);

  const seisPoints = seis.map((v, i) => `${((i / (SEIS_LEN - 1)) * 100).toFixed(2)},${v.toFixed(2)}`).join(' ');

  const isStale = panelHealth.isStale('seismic-timeline');

  return (
    <>
      <PanelHead panelId="seismic-timeline" isStale={isStale} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Seismic</span>
          <span className="panelTag">24H TIMELINE</span>
        </div>
        <div className="panelLive" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <LatencyChip lastUpdateMs={mostRecentTs} label="QUAKE" />
        </div>
      </PanelHead>

      <div className={styles.header}>
        <span>USGS M{MIN_MAG}+</span>
        <div className={styles.headerStats}>
          <span>TOTAL <b>{counts.total}</b></span>
          {counts.m4 > 0 && <span>M4+ <b>{counts.m4}</b></span>}
          {counts.m5 > 0 && <span style={{ color: 'var(--red)' }}>M5+ <b>{counts.m5}</b></span>}
        </div>
      </div>

      <div className={styles.wrap}>
        <div className={styles.track}>
          {MAG_GRIDLINES.map(m => {
            const y = ((m - MIN_MAG) / (MAX_MAG - MIN_MAG)) * 100;
            return (
              <div key={m}>
                <div className={styles.gridLine} style={{ bottom: y + '%' }} />
                <span className={styles.magLabel} style={{ bottom: y + '%' }}>M{m}</span>
              </div>
            );
          })}

          {plotted.length === 0 ? (
            <div className={styles.empty}>no quakes in the last 24h</div>
          ) : (
            plotted.map(p => {
              const size = markerSizePx(p.q.magnitude);
              return (
                <div
                  key={p.q.id}
                  className={`${styles.marker} ${magColorClass(p.q.magnitude)} ${ageOpacityClass(p.ageMs)}`}
                  style={{
                    left: p.x + '%',
                    bottom: p.y + '%',
                    width: size + 'px',
                    height: size + 'px',
                  }}
                  title={`M${p.q.magnitude.toFixed(1)} · ${p.q.place} · ${new Date(p.q.time).toLocaleTimeString()}`}
                />
              );
            })
          )}
        </div>
        <div className={styles.axis}>
          <span>-24H</span>
          <span>-18H</span>
          <span>-12H</span>
          <span>-6H</span>
          <span>-1H</span>
          <span style={{ color: 'var(--green)' }}>NOW</span>
        </div>
      </div>

      <div className={styles.seismograph}>
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" className={styles.seismographSvg}>
          <polyline points={seisPoints} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </>
  );
});
