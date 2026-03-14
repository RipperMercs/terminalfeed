import { useEffect, useState, useRef } from 'react';

// Lightweight presence counter using BroadcastChannel + unique session ID
// No external service needed — counts approximate concurrent visitors
// via a simple heartbeat to localStorage with cleanup of stale sessions

const CHANNEL_KEY = 'tf_presence';
const HEARTBEAT_MS = 15_000; // 15s heartbeat
const STALE_MS = 45_000; // consider stale after 45s no heartbeat

interface PresenceEntry {
  id: string;
  ts: number;
}

function getSessionId(): string {
  let id = sessionStorage.getItem('tf_session_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('tf_session_id', id);
  }
  return id;
}

function getPresenceList(): PresenceEntry[] {
  try {
    const raw = localStorage.getItem(CHANNEL_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePresenceList(list: PresenceEntry[]): void {
  try {
    localStorage.setItem(CHANNEL_KEY, JSON.stringify(list));
  } catch {}
}

export function useTerminalsOnline(): number {
  const [count, setCount] = useState(1);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    const heartbeat = () => {
      const now = Date.now();
      let list = getPresenceList();

      // Remove stale entries
      list = list.filter(e => now - e.ts < STALE_MS);

      // Update or add our entry
      const idx = list.findIndex(e => e.id === sessionId.current);
      if (idx >= 0) {
        list[idx].ts = now;
      } else {
        list.push({ id: sessionId.current, ts: now });
      }

      savePresenceList(list);
      setCount(Math.max(1, list.length));
    };

    // Initial heartbeat
    heartbeat();

    // Regular heartbeats
    const id = setInterval(heartbeat, HEARTBEAT_MS);

    // Clean up on leave
    const cleanup = () => {
      const list = getPresenceList().filter(e => e.id !== sessionId.current);
      savePresenceList(list);
    };

    window.addEventListener('beforeunload', cleanup);

    return () => {
      clearInterval(id);
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  return count;
}
