import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useEarthquakes } from '../hooks/useEarthquakes';
import { useFlightRadar } from '../hooks/useFlightRadar';
import { useSpaceLaunches } from '../hooks/useSpaceLaunches';
import { PanelHead } from './PanelHead';
import type { LayoutManager } from '../hooks/useLayoutManager';
import styles from './WorldMap.module.css';

interface Props {
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

type PingKind = 'quake' | 'flight' | 'launch';

interface Ping {
  id: string;
  kind: PingKind;
  x: number; // 0..100
  y: number; // 0..100
}

const PING_LIFE_MS = 2_600;
const MAX_PINGS = 24;

// Very rough land mask — reads as "the world" without a geojson dep.
// Each cell (x,y) is considered land if it falls inside one of these regions.
function isOnLand(lng: number, lat: number): boolean {
  return (
    (lng > -170 && lng < -50 && lat > 15  && lat < 75)  || // N. America
    (lng > -90  && lng < -30 && lat > -55 && lat < 15)  || // S. America
    (lng > -20  && lng < 55  && lat > -35 && lat < 72)  || // Europe + Africa
    (lng > 55   && lng < 150 && lat > 0   && lat < 72)  || // Asia
    (lng > 110  && lng < 155 && lat > -45 && lat < -10)    // Australia
  );
}

interface GridDot { x: number; y: number }
function buildGridDots(): GridDot[] {
  const dots: GridDot[] = [];
  const cols = 48;
  const rows = 22;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const lng = (i / cols) * 360 - 180;
      const lat = 90 - (j / rows) * 180;
      if (!isOnLand(lng, lat)) continue;
      // stochastic thinning for a stippled feel
      if (((i * 17 + j * 31) % 7) < 3) continue;
      dots.push({ x: (i / cols) * 100, y: (j / rows) * 100 });
    }
  }
  return dots;
}

function lngLatToXY(lng: number, lat: number): [number, number] {
  return [(lng + 180) / 360 * 100, (90 - lat) / 180 * 100];
}

export const WorldMap = memo(function WorldMap({ layout, panelHealth, getGridCols }: Props) {
  const quakes = useEarthquakes();
  const flightRadar = useFlightRadar();
  const launches = useSpaceLaunches();

  const [pings, setPings] = useState<Ping[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const initRef = useRef({ quake: false, launch: false });
  const lastAirborneRef = useRef<number | null>(null);

  const dots = useMemo(() => buildGridDots(), []);

  const addPing = (kind: PingKind, x: number, y: number, key: string) => {
    const ping: Ping = { id: key, kind, x, y };
    setPings(prev => {
      const next = [...prev, ping];
      return next.length > MAX_PINGS ? next.slice(-MAX_PINGS) : next;
    });
    setTimeout(() => {
      setPings(prev => prev.filter(p => p.id !== key));
    }, PING_LIFE_MS);
  };

  // Earthquakes — real coords if available
  useEffect(() => {
    if (!Array.isArray(quakes) || quakes.length === 0) return;
    for (const q of quakes) {
      const key = 'quake:' + q.id;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      if (!initRef.current.quake) continue; // skip initial snapshot
      if (q.coordinates) {
        const [lng, lat] = q.coordinates;
        const [x, y] = lngLatToXY(lng, lat);
        addPing('quake', x, y, key + ':' + Date.now());
      } else {
        // fallback: random landish position
        addPing('quake', 20 + Math.random() * 60, 20 + Math.random() * 50, key + ':' + Date.now());
      }
    }
    initRef.current.quake = true;
  }, [quakes]);

  // Launches — decorative (no real coords from the hook)
  useEffect(() => {
    if (!Array.isArray(launches) || launches.length === 0) return;
    for (const l of launches) {
      const key = 'launch:' + l.id;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      if (!initRef.current.launch) continue;
      addPing('launch', 10 + Math.random() * 80, 25 + Math.random() * 45, key + ':' + Date.now());
    }
    initRef.current.launch = true;
  }, [launches]);

  // Flights — no per-aircraft coords available; ping on meaningful airborne-count changes
  useEffect(() => {
    const total = flightRadar.stats?.totalAirborne;
    if (typeof total !== 'number' || total <= 0) return;
    const last = lastAirborneRef.current;
    if (last === null) {
      lastAirborneRef.current = total;
      return;
    }
    if (Math.abs(total - last) < 50) return; // ignore minor deltas
    lastAirborneRef.current = total;
    addPing(
      'flight',
      10 + Math.random() * 80,
      20 + Math.random() * 50,
      'flight:' + total + ':' + Date.now(),
    );
  }, [flightRadar.stats?.totalAirborne]);

  const isStale = panelHealth.isStale('world-map');
  const quakeCount = quakes.length;
  const flightTotal = flightRadar.stats?.totalAirborne ?? 0;
  const launchCount = launches.length;

  return (
    <>
      <PanelHead panelId="world-map" isStale={isStale} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">World Map</span>
          <span className="panelTag">LIVE</span>
        </div>
        <div className="panelLive">
          <span className="liveDot" />
          <span className="liveText">{pings.length} ACTIVE</span>
        </div>
      </PanelHead>

      <div className={styles.wrap}>
        <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="0.35" fill="var(--border-glow)" />
          ))}
        </svg>

        {pings.map(p => {
          const cls =
            p.kind === 'quake'  ? styles.pingQuake  :
            p.kind === 'flight' ? styles.pingFlight :
                                  styles.pingLaunch;
          return <span key={p.id} className={`${styles.ping} ${cls}`} style={{ left: p.x + '%', top: p.y + '%' }} />;
        })}

        <div className={styles.legend}>
          <span><i className={`${styles.d} ${styles.q}`} /> QUAKE</span>
          <span><i className={`${styles.d} ${styles.f}`} /> FLIGHT</span>
          <span><i className={`${styles.d} ${styles.l}`} /> LAUNCH</span>
        </div>

        <div className={styles.counts}>
          Q <b>{quakeCount}</b> · F <b>{flightTotal.toLocaleString()}</b> · L <b>{launchCount}</b>
        </div>
      </div>
    </>
  );
});
