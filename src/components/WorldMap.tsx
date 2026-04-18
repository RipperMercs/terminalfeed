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

// Hand-tuned land mask — big continent silhouettes with ocean carve-outs.
// Not geographically precise, but reads as "the world" without a geojson dep.
function isOnLand(lng: number, lat: number): boolean {
  // North America
  if (lng >= -168 && lng <= -52 && lat >= 15 && lat <= 72) {
    if (lng < -130 && lat < 50) return false; // trim Pacific off the west coast
    if (lng > -95 && lat < 25) return false; // Gulf of Mexico
    if (lng > -60 && lat < 47) return false; // Atlantic off the east coast
    if (lng < -140 && lat > 65) return false; // Bering Sea
    return true;
  }
  // Central America + Caribbean
  if (lng >= -110 && lng <= -60 && lat >= 8 && lat <= 20) return true;
  // South America
  if (lng >= -82 && lng <= -34 && lat >= -56 && lat <= 13) {
    if (lng > -50 && lat > 5) return false;   // Atlantic notch
    if (lng < -74 && lat < -20) return false; // Pacific
    if (lng > -42 && lat < -30) return false; // trim east coast below Brazil
    return true;
  }
  // Europe
  if (lng >= -11 && lng <= 42 && lat >= 36 && lat <= 71) {
    if (lng < 10 && lat < 44) return false;  // Mediterranean / Iberia below
    return true;
  }
  // UK / Ireland
  if (lng >= -11 && lng <= 2 && lat >= 50 && lat <= 60) return true;
  // Scandinavia
  if (lng >= 4 && lng <= 32 && lat >= 56 && lat <= 71) return true;
  // Africa
  if (lng >= -18 && lng <= 52 && lat >= -35 && lat <= 36) {
    if (lng > 42 && lat > 10) return false; // Red Sea / Arabian Sea
    if (lng < -8 && lat > 15) return false;  // Atlantic off NW Africa
    if (lng < 10 && lat > 32) return false;  // Mediterranean
    return true;
  }
  // Middle East
  if (lng >= 32 && lng <= 60 && lat >= 12 && lat <= 42) return true;
  // Russia / N. Asia
  if (lng >= 25 && lng <= 180 && lat >= 42 && lat <= 72) return true;
  // China / SE Asia
  if (lng >= 70 && lng <= 140 && lat >= 8 && lat <= 42) {
    if (lng > 120 && lat < 25) return false; // South China Sea
    return true;
  }
  // India
  if (lng >= 68 && lng <= 92 && lat >= 8 && lat <= 36) return true;
  // Indonesia / Philippines (approx archipelago band)
  if (lng >= 95 && lng <= 141 && lat >= -10 && lat <= 7) return true;
  // Australia
  if (lng >= 113 && lng <= 154 && lat >= -40 && lat <= -10) return true;
  // New Zealand
  if (lng >= 166 && lng <= 179 && lat >= -47 && lat <= -34) return true;
  // Japan
  if (lng >= 130 && lng <= 146 && lat >= 30 && lat <= 46) return true;
  // Greenland
  if (lng >= -55 && lng <= -20 && lat >= 60 && lat <= 83) return true;
  return false;
}

interface GridDot { x: number; y: number }
function buildGridDots(): GridDot[] {
  const dots: GridDot[] = [];
  const cols = 60;
  const rows = 26;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const lng = (i / cols) * 360 - 180;
      const lat = 90 - (j / rows) * 180;
      if (!isOnLand(lng, lat)) continue;
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

  // Persistent earthquake markers at real coordinates — sized by magnitude
  const quakeMarkers = useMemo(() => {
    return quakes
      .filter(q => q.coordinates)
      .map(q => {
        const [lng, lat] = q.coordinates!;
        const [x, y] = lngLatToXY(lng, lat);
        // r scales 0.6 at M2.5 up to ~1.8 at M6+
        const r = Math.min(1.8, Math.max(0.6, 0.4 + q.magnitude * 0.25));
        return { id: q.id, x, y, r, magnitude: q.magnitude, place: q.place };
      });
  }, [quakes]);

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
          {quakeMarkers.map(m => (
            <circle
              key={m.id}
              cx={m.x}
              cy={m.y}
              r={m.r}
              fill="var(--red)"
              opacity={m.magnitude >= 5 ? 0.9 : 0.55}
            >
              <title>M{m.magnitude.toFixed(1)} — {m.place}</title>
            </circle>
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
