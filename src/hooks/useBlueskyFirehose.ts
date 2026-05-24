// Bluesky Jetstream firehose: real-time public post stream from the AT
// Protocol relay. Free, no key, no auth. Throttled because the raw stream
// can deliver dozens of posts per second during peak hours.

import { useEffect, useRef, useState } from 'react';

export interface BlueskyPost {
  did: string;             // user did
  handle: string | null;   // resolved from did when available, otherwise null
  text: string;
  createdAt: number;       // local arrival timestamp (ms)
}

const WS_URL = 'wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post';
const MAX_POSTS = 10;
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;
const THROTTLE_MS = IS_MOBILE ? 4000 : 1500;
const MIN_TEXT_LENGTH = 30;
const MAX_TEXT_LENGTH = 220;

export function useBlueskyFirehose(): BlueskyPost[] {
  const [posts, setPosts] = useState<BlueskyPost[]>([]);
  const mountedRef = useRef(true);
  const lastAddRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (!mountedRef.current) return;
      try {
        ws = new WebSocket(WS_URL);

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
          const now = Date.now();
          if (now - lastAddRef.current < THROTTLE_MS) return;

          try {
            const msg = JSON.parse(event.data);
            // Jetstream commit envelope: { kind: 'commit', did, commit: { collection, record: { text, ... } } }
            if (msg.kind !== 'commit') return;
            const op = msg.commit;
            if (!op || op.operation !== 'create') return;
            const record = op.record;
            if (!record || typeof record.text !== 'string') return;

            const text = record.text.replace(/\s+/g, ' ').trim();
            if (text.length < MIN_TEXT_LENGTH || text.length > MAX_TEXT_LENGTH) return;
            // Skip obvious bot / link-only posts.
            if (text.startsWith('http')) return;

            lastAddRef.current = now;
            setPosts(prev => [{
              did: msg.did,
              handle: null,
              text,
              createdAt: now,
            }, ...prev].slice(0, MAX_POSTS));
          } catch (e) {
            if (import.meta.env.DEV) console.warn('[BskyFirehose]', e);
          }
        };

        ws.onerror = () => ws?.close();
        ws.onclose = () => {
          if (mountedRef.current) reconnectTimer = window.setTimeout(connect, 5000);
        };
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[BskyFirehose]', e);
      }
    };

    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer != null) window.clearTimeout(reconnectTimer);
      try { ws?.close(); } catch { /* noop */ }
    };
  }, []);

  return posts;
}
