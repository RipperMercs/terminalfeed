// Cloudflare Radar composite: device mix, bot mix, top attacked locations,
// top traffic origins. The Worker proxies the Radar API so the token never
// leaves the server. If the token isn't configured yet, the Worker returns
// { needs_token: true } and we surface that as a distinct state.

import { useEffect, useRef, useState } from 'react';

export interface RadarBucket {
  name?: string;
  value?: string | number;
  [k: string]: unknown;
}

export interface RadarTopItem {
  // CF Radar's top endpoints commonly use clientCountryAlpha2 / value, or
  // originCountryAlpha2 / value. We pass through everything and let the
  // consumer pick.
  clientCountryAlpha2?: string;
  clientCountryName?: string;
  originCountryAlpha2?: string;
  originCountryName?: string;
  value?: string;
  [k: string]: unknown;
}

export interface RadarData {
  window: string;
  device_mix: Record<string, string> | null;
  bot_mix: Record<string, string> | null;
  ip_version_mix: Record<string, string> | null;
  top_attacked_locations: RadarTopItem[];
  top_traffic_locations: RadarTopItem[];
}

export type RadarState =
  | { kind: 'loading' }
  | { kind: 'needs_token'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: RadarData; updatedAt: string };

const ENDPOINT = '/api/radar';
const POLL_MS = 30 * 60_000; // 30 min poll cadence; Radar dataRange is 1d

export function useCfRadar(): RadarState {
  const [state, setState] = useState<RadarState>({ kind: 'loading' });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const load = async () => {
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error('http ' + res.status);
        const json = await res.json();
        if (!mountedRef.current) return;

        const d = json?.data;
        if (d?.needs_token) {
          setState({ kind: 'needs_token', message: d.message || 'CF_API_TOKEN not configured' });
          return;
        }
        if (json?.error || !d) {
          setState({ kind: 'error', message: json?.error || 'no data' });
          return;
        }
        setState({ kind: 'ready', data: d as RadarData, updatedAt: json.updated_at });
      } catch (e) {
        if (!mountedRef.current) return;
        const msg = e instanceof Error ? e.message : 'fetch failed';
        setState(prev => (prev.kind === 'ready' ? prev : { kind: 'error', message: msg }));
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return state;
}
