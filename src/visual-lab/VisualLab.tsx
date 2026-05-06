import { useState, useEffect } from 'react';
import { LabPanel } from './LabPanel';
import { LabBtcTicker } from './LabBtcTicker';
import type { Variant } from './LabPanel';
import {
  cryptoMovers,
  newsItems,
  securityAlerts,
  aiActivity,
  devEvents,
  earthquakes,
  weather,
  stocks,
  launches,
  predictions,
} from './labData';
import panelStyles from './LabPanel.module.css';
import styles from './VisualLab.module.css';

const VARIANTS: { id: Variant; label: string; blurb: string }[] = [
  { id: 'default',      label: 'DEFAULT',      blurb: 'current site look, flat border, small header' },
  { id: 'bloomberg',    label: 'BLOOMBERG',    blurb: '4px category-colored left bar, [TAG] in header' },
  { id: 'brackets',     label: 'BRACKETS',     blurb: 'no border, terminal L-shapes at corners' },
  { id: 'header-strip', label: 'HEADER STRIP', blurb: '3px colored top stripe, larger header' },
  { id: 'glow',         label: 'GLOW',         blurb: 'subtle outer glow in category color' },
];

export function VisualLab() {
  const [variant, setVariant] = useState<Variant>(() => {
    try {
      const saved = localStorage.getItem('tf_lab_variant');
      if (saved && VARIANTS.some(v => v.id === saved)) return saved as Variant;
    } catch {/* ignore */}
    return 'default';
  });

  useEffect(() => {
    try { localStorage.setItem('tf_lab_variant', variant); } catch {/* ignore */}
  }, [variant]);

  const active = VARIANTS.find(v => v.id === variant)!;

  return (
    <div className={styles.lab} data-variant={variant}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>&gt;_</span>
          <span className={styles.brandName}>terminalfeed</span>
          <span className={styles.brandDot}>·</span>
          <span className={styles.labTag}>VISUAL LAB</span>
        </div>
        <a href="/" className={styles.backLink}>← back to dashboard</a>
      </header>

      <div className={styles.intro}>
        <div className={styles.introTitle}>panel chrome experiments</div>
        <div className={styles.introBody}>
          flip between visual treatments. data is mocked so the chrome is what changes.
          pick something that hits, refine it, then we roll it across the live dashboard.
        </div>
      </div>

      <nav className={styles.switcher} aria-label="Visual variant switcher">
        {VARIANTS.map(v => (
          <button
            key={v.id}
            className={`${styles.pill} ${variant === v.id ? styles.pillActive : ''}`}
            onClick={() => setVariant(v.id)}
            aria-pressed={variant === v.id}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <div className={styles.activeBlurb}>
        <span className={styles.activeKey}>{active.label}</span>
        <span className={styles.activeSep}>·</span>
        <span className={styles.activeText}>{active.blurb}</span>
      </div>

      <main className={styles.main}>
        <LabBtcTicker />

        <div className={styles.grid}>
          <LabPanel title="Crypto Movers" category="crypto" status="live">
            {cryptoMovers.map(c => (
              <div key={c.sym} className={panelStyles.row}>
                <span className={panelStyles.symbol}>
                  {c.sym} <span className={panelStyles.muted}>{c.name}</span>
                </span>
                <span className={c.change >= 0 ? panelStyles.priceUp : panelStyles.priceDown}>
                  ${c.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span style={{ marginLeft: 8, fontSize: 10 }}>
                    {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%
                  </span>
                </span>
              </div>
            ))}
          </LabPanel>

          <LabPanel title="Tech & AI News" category="news" status="live">
            {newsItems.map((n, i) => (
              <div key={i} className={panelStyles.feedItem}>
                <span className={panelStyles.feedSrc}>{n.source}</span>
                <span className={panelStyles.feedTitle}>{n.title}</span>
                <span className={panelStyles.feedAge}>{n.age} ago</span>
              </div>
            ))}
          </LabPanel>

          <LabPanel title="Cyber Threats" category="security" status="polling">
            {securityAlerts.map((a, i) => (
              <div key={i} className={panelStyles.feedItem}>
                <span className={a.sev === 'HIGH' ? panelStyles.sevHigh : a.sev === 'MED' ? panelStyles.sevMed : panelStyles.sevLow}>
                  [{a.sev}]
                </span>
                {' '}
                <span className={panelStyles.feedSrc}>{a.cve}</span>
                <span className={panelStyles.feedTitle}>{a.title}</span>
                <span className={panelStyles.feedAge}>{a.age} ago</span>
              </div>
            ))}
          </LabPanel>

          <LabPanel title="AI Hub · Live Agents" category="ai" status="live">
            {aiActivity.map((a, i) => (
              <div key={i} className={panelStyles.row}>
                <span className={panelStyles.symbol} style={{ fontSize: 10 }}>{a.agent}</span>
                <span className={panelStyles.muted}>{a.action}</span>
                <span className={panelStyles.priceFlat}>{a.ms}ms</span>
              </div>
            ))}
          </LabPanel>

          <LabPanel title="Github Trending" category="dev" status="live">
            {devEvents.map((e, i) => (
              <div key={i} className={panelStyles.feedItem}>
                <span className={panelStyles.feedSrc}>[{e.event.toUpperCase()}]</span>
                <span className={panelStyles.feedTitle}>
                  {e.repo} <span className={panelStyles.muted}>{e.detail}</span>
                </span>
                <span className={panelStyles.feedAge}>{e.age} ago</span>
              </div>
            ))}
          </LabPanel>

          <LabPanel title="Earthquakes" category="geo" status="live">
            {earthquakes.map((q, i) => (
              <div key={i} className={panelStyles.row}>
                <span className={panelStyles.symbol} style={{ color: q.mag >= 5 ? '#F87171' : q.mag >= 4 ? '#EF9F27' : '#7A7A72' }}>
                  M{q.mag.toFixed(1)}
                </span>
                <span className={panelStyles.muted} style={{ flex: 1, textAlign: 'left', marginLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.place}
                </span>
                <span className={panelStyles.muted}>{q.age}</span>
              </div>
            ))}
          </LabPanel>

          <LabPanel title="Weather · Los Angeles" category="weather" status="polling">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 36, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>{weather.temp}°</span>
              <span style={{ fontSize: 10, color: 'var(--text-mid)', letterSpacing: 1 }}>{weather.desc.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-mid)' }}>
              {weather.forecast.map(f => (
                <div key={f.d} style={{ textAlign: 'center' }}>
                  <div style={{ letterSpacing: 1, marginBottom: 4 }}>{f.d}</div>
                  <div style={{ color: 'var(--text)' }}>{f.hi}°</div>
                  <div style={{ color: 'var(--text-dim)' }}>{f.lo}°</div>
                </div>
              ))}
            </div>
          </LabPanel>

          <LabPanel title="US Markets" category="markets" status="live">
            {stocks.map(s => (
              <div key={s.sym} className={panelStyles.row}>
                <span className={panelStyles.symbol}>{s.sym}</span>
                <span className={s.change >= 0 ? panelStyles.priceUp : panelStyles.priceDown}>
                  ${s.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span style={{ marginLeft: 8, fontSize: 10 }}>
                    {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                  </span>
                </span>
              </div>
            ))}
          </LabPanel>

          <LabPanel title="Space Launches" category="space" status="polling">
            {launches.map((l, i) => (
              <div key={i} className={panelStyles.feedItem}>
                <span className={panelStyles.feedSrc}>{l.vehicle}</span>
                <span className={panelStyles.feedTitle}>{l.payload}</span>
                <span className={panelStyles.feedAge}>{l.when} · {l.site}</span>
              </div>
            ))}
          </LabPanel>

          <LabPanel title="Prediction Markets" category="prediction" status="live">
            {predictions.map((p, i) => (
              <div key={i} className={panelStyles.feedItem}>
                <span className={panelStyles.feedTitle}>{p.question}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>YES {p.yes}%</span>
                  <span className={panelStyles.feedAge}>vol {p.vol}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.yes}%`, background: 'var(--green)', opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </LabPanel>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>visual lab · staging surface for chrome experiments</span>
        <span>not indexed · safe to break</span>
      </footer>
    </div>
  );
}
