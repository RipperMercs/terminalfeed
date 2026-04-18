import { memo, useEffect, useRef, useState } from 'react';
import { useBtcPrice } from '../hooks/useBtcPrice';
import { useWikipediaLive } from '../hooks/useWikipediaLive';
import { useHackerNews } from '../hooks/useHackerNews';
import { useGithubEvents } from '../hooks/useGithubEvents';
import { useEarthquakes } from '../hooks/useEarthquakes';
import { PanelHead } from './PanelHead';
import { LatencyChip } from './LatencyChip';
import type { LayoutManager } from '../hooks/useLayoutManager';
import styles from './LiveNowPanel.module.css';

interface Props {
  layout: LayoutManager;
  panelHealth: { isStale: (id: string) => boolean };
  getGridCols: () => number;
}

type Source = 'BTC' | 'WIKI' | 'HN' | 'GH' | 'USGS';

interface LiveEvent {
  id: string;
  src: Source;
  time: number;
  body: string;
  url?: string;
  value?: string;
}

const MAX_EVENTS = 14;
const BTC_MIN_INTERVAL_MS = 5_000;
const BTC_MIN_PCT = 0.02; // 0.02% move required to emit an event

const TAG_CLASS: Record<Source, string> = {
  BTC: styles.tagBtc,
  WIKI: styles.tagWiki,
  HN: styles.tagHn,
  GH: styles.tagGh,
  USGS: styles.tagUsgs,
};

function timeAgoShort(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export const LiveNowPanel = memo(function LiveNowPanel({ layout, panelHealth, getGridCols }: Props) {
  const { data: btc } = useBtcPrice();
  const { edits } = useWikipediaLive();
  const hnStories = useHackerNews();
  const ghEvents = useGithubEvents();
  const quakes = useEarthquakes();

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const initRef = useRef({ wiki: false, hn: false, gh: false, usgs: false });
  const lastBtcRef = useRef<{ price: number; ts: number } | null>(null);

  // Helper: prepend new events (capped)
  const push = (items: LiveEvent[]) => {
    if (items.length === 0) return;
    setEvents(prev => {
      const merged = [...items, ...prev];
      return merged.slice(0, MAX_EVENTS);
    });
    setSessionCount(c => c + items.length);
    setLastTs(Date.now());
  };

  // Wikipedia edits — hook already throttles
  useEffect(() => {
    if (!Array.isArray(edits) || edits.length === 0) return;
    const newOnes: LiveEvent[] = [];
    for (const e of edits.slice(0, 10)) {
      const key = 'wiki:' + e.timestamp + ':' + e.title;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      if (!initRef.current.wiki) continue; // skip the first batch
      newOnes.push({
        id: key,
        src: 'WIKI',
        time: e.timestamp,
        body: e.title,
        url: e.url,
        value: e.sizeDiff !== 0 ? (e.sizeDiff > 0 ? `+${e.sizeDiff}` : `${e.sizeDiff}`) : undefined,
      });
    }
    initRef.current.wiki = true;
    push(newOnes);
  }, [edits]);

  // Hacker News
  useEffect(() => {
    if (!Array.isArray(hnStories) || hnStories.length === 0) return;
    const newOnes: LiveEvent[] = [];
    for (const s of hnStories.slice(0, 10)) {
      const key = 'hn:' + s.id;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      if (!initRef.current.hn) continue;
      newOnes.push({
        id: key,
        src: 'HN',
        time: s.time * 1000,
        body: s.title,
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        value: `${s.score}↑`,
      });
    }
    initRef.current.hn = true;
    push(newOnes);
  }, [hnStories]);

  // GitHub events
  useEffect(() => {
    if (!Array.isArray(ghEvents) || ghEvents.length === 0) return;
    const newOnes: LiveEvent[] = [];
    for (const e of ghEvents.slice(0, 10)) {
      const key = 'gh:' + e.id;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      if (!initRef.current.gh) continue;
      newOnes.push({
        id: key,
        src: 'GH',
        time: new Date(e.time).getTime(),
        body: `${e.actor} ${e.action} ${e.repo}`,
        url: `https://github.com/${e.repo}`,
      });
    }
    initRef.current.gh = true;
    push(newOnes);
  }, [ghEvents]);

  // Earthquakes
  useEffect(() => {
    if (!Array.isArray(quakes) || quakes.length === 0) return;
    const newOnes: LiveEvent[] = [];
    for (const q of quakes.slice(0, 10)) {
      const key = 'usgs:' + q.id;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      if (!initRef.current.usgs) continue;
      newOnes.push({
        id: key,
        src: 'USGS',
        time: q.time,
        body: q.place,
        url: q.url,
        value: `M${q.magnitude.toFixed(1)}`,
      });
    }
    initRef.current.usgs = true;
    push(newOnes);
  }, [quakes]);

  // BTC — throttle + min-move guard
  useEffect(() => {
    const price = btc?.price;
    if (typeof price !== 'number' || price <= 0) return;
    const now = Date.now();
    const last = lastBtcRef.current;
    if (!last) {
      lastBtcRef.current = { price, ts: now };
      return;
    }
    const dt = now - last.ts;
    if (dt < BTC_MIN_INTERVAL_MS) return;
    const pctMove = Math.abs((price - last.price) / last.price) * 100;
    if (pctMove < BTC_MIN_PCT) return;
    const dir = price > last.price ? '▲' : '▼';
    push([{
      id: 'btc:' + now,
      src: 'BTC',
      time: now,
      body: `BTC ${dir} $${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      value: `${pctMove.toFixed(2)}%`,
    }]);
    lastBtcRef.current = { price, ts: now };
  }, [btc?.price]);

  const isStale = panelHealth.isStale('live-now');

  return (
    <>
      <PanelHead panelId="live-now" isStale={isStale} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Live Now</span>
          <span className="panelTag">REAL-TIME</span>
        </div>
        <div className="panelLive" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <LatencyChip lastUpdateMs={lastTs} label="EVENT" />
          <span className="liveText">{events.length}/{MAX_EVENTS}</span>
        </div>
      </PanelHead>
      <div className={styles.counters}>
        <span>SESSION: <b>{sessionCount}</b></span>
        <span className={styles.countersSep}>·</span>
        <span>MAX: <b>{MAX_EVENTS}</b></span>
      </div>

      <div className={styles.wrap}>
        {events.length === 0 ? (
          <div className={styles.empty}>waiting for events...</div>
        ) : (
          events.map(ev => {
            const tagClass = `${styles.tag} ${TAG_CLASS[ev.src]}`;
            const content = (
              <>
                <span className={tagClass}>{ev.src}</span>
                <span className={styles.body}>{ev.body}</span>
                <span className={styles.value}>
                  {ev.value ? `${ev.value} · ` : ''}{timeAgoShort(ev.time)}
                </span>
              </>
            );
            return ev.url ? (
              <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer" className={styles.row}>
                {content}
              </a>
            ) : (
              <div key={ev.id} className={styles.row}>{content}</div>
            );
          })
        )}
      </div>
    </>
  );
});
