// Wikipedia Recent Changes — SSE stream of live edits worldwide
// The heartbeat of human knowledge in real-time

import { useEffect, useState, useRef } from 'react';

export interface WikiEdit {
  title: string;
  user: string;
  type: string; // 'edit' | 'new'
  sizeDiff: number;
  timestamp: number;
  url: string;
}

const STREAM_URL = 'https://stream.wikimedia.org/v2/stream/recentchange';
const MAX_EDITS = 15;

export function useWikipediaLive(): { edits: WikiEdit[]; editsPerMin: number } {
  const [edits, setEdits] = useState<WikiEdit[]>([]);
  const [editsPerMin, setEditsPerMin] = useState(0);
  const countRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let source: EventSource | null = null;

    const connect = () => {
      if (!mountedRef.current) return;
      source = new EventSource(STREAM_URL);

      source.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);

          // Only English Wikipedia main articles, no bots
          if (
            data.server_name === 'en.wikipedia.org' &&
            data.namespace === 0 &&
            !data.bot &&
            data.title
          ) {
            countRef.current++;
            const edit: WikiEdit = {
              title: data.title,
              user: data.user || 'anonymous',
              type: data.type === 'new' ? 'new' : 'edit',
              sizeDiff: (data.length?.new || 0) - (data.length?.old || 0),
              timestamp: data.timestamp || Math.floor(Date.now() / 1000),
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
            };

            setEdits(prev => [edit, ...prev].slice(0, MAX_EDITS));
          }
        } catch {}
      };

      source.onerror = () => {
        source?.close();
        if (mountedRef.current) {
          setTimeout(connect, 5000);
        }
      };
    };

    connect();

    // Calculate edits per minute every 10 seconds
    const counterInterval = setInterval(() => {
      setEditsPerMin(countRef.current * 6); // extrapolate to per-minute
      countRef.current = 0;
    }, 10000);

    return () => {
      mountedRef.current = false;
      source?.close();
      clearInterval(counterInterval);
    };
  }, []);

  return { edits, editsPerMin };
}
