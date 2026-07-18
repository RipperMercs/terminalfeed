// US national debt to the penny with 30d/1y deltas and a per-second accrual
// rate for the ticking display. Worker-first (/api/debt-clock, KV), BUT both
// Treasury sources block Cloudflare Workers egress (FiscalData tarpits
// datacenter IPs, TreasuryDirect 525s, observed July 18 2026), so when the
// Worker record is still warming the browser fetches FiscalData directly:
// it is CORS-open, keyless, daily-cadence data, and residential IPs are fine.
// Cached 12h in localStorage so most sessions never make the direct call.

import { useEffect, useRef, useState } from 'react';
import { getCache, setCache } from '../services/cache';

export interface DebtClockData {
  as_of_date: string;
  as_of_ms: number;
  total: number;
  held_by_public: number | null;
  intragovernmental: number | null;
  delta_30d: number | null;
  delta_1y: number | null;
  per_second: number;
}

const ENDPOINT = '/api/debt-clock';
const CACHE_KEY = 'debt_clock';
const POLL_MS = 60 * 60_000;
const DIRECT_URL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=280&fields=record_date,tot_pub_debt_out_amt,debt_held_public_amt,intragov_hold_amt';

interface FiscalRow { record_date: string; tot_pub_debt_out_amt: string; debt_held_public_amt: string; intragov_hold_amt: string; }

function computeFromRows(rows: FiscalRow[]): DebtClockData | null {
  const parsed = rows
    .map((r) => ({
      ms: Date.parse(`${r.record_date}T16:00:00Z`),
      total: parseFloat(r.tot_pub_debt_out_amt),
      pub: parseFloat(r.debt_held_public_amt),
      gov: parseFloat(r.intragov_hold_amt),
    }))
    .filter((r) => Number.isFinite(r.ms) && Number.isFinite(r.total));
  if (!parsed.length) return null;
  const latest = parsed[0];
  const atLeast = (daysBack: number) => {
    const cutoff = latest.ms - daysBack * 86400000;
    return parsed.find((r, i) => i > 0 && r.ms <= cutoff) ?? null;
  };
  const d30 = atLeast(30);
  const d365 = atLeast(365);
  const perSecond = d30 ? (latest.total - d30.total) / ((latest.ms - d30.ms) / 1000) : 0;
  return {
    as_of_date: new Date(latest.ms).toISOString().split('T')[0],
    as_of_ms: latest.ms,
    total: latest.total,
    held_by_public: Number.isFinite(latest.pub) ? latest.pub : null,
    intragovernmental: Number.isFinite(latest.gov) ? latest.gov : null,
    delta_30d: d30 ? Math.round(latest.total - d30.total) : null,
    delta_1y: d365 ? Math.round(latest.total - d365.total) : null,
    per_second: Math.round(perSecond),
  };
}

export function useDebtClock(): DebtClockData | null {
  const [data, setData] = useState<DebtClockData | null>(() => getCache<DebtClockData>(CACHE_KEY)?.data ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetch_ = async () => {
      // Worker first: if a cron fetch ever lands, everyone shares it via KV.
      try {
        const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(8000) });
        if (res.ok && mountedRef.current) {
          const json = await res.json();
          const d: DebtClockData | undefined = json?.data;
          if (d && d.total > 0) {
            setData(d);
            setCache(CACHE_KEY, d, 'treasury-worker');
            return;
          }
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[DebtClock]', e); }

      // Fresh-enough localStorage copy: skip the direct call (daily data).
      const cached = getCache<DebtClockData>(CACHE_KEY);
      if (cached && cached.age < 12 * 3600_000) return;

      try {
        const res = await fetch(DIRECT_URL, { signal: AbortSignal.timeout(10000) }); // direct-fetch-exempt: Treasury blocks CF Workers egress; CORS-open keyless daily data, browser IPs work
        if (!res.ok || !mountedRef.current) return;
        const json = await res.json();
        const d = computeFromRows(Array.isArray(json?.data) ? json.data : []);
        if (d) {
          setData(d);
          setCache(CACHE_KEY, d, 'treasury-direct');
        }
      } catch (e) { if (import.meta.env.DEV) console.warn('[DebtClock]', e); }
    };
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, []);

  return data;
}
