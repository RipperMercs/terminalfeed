// Tile components — all share the styles system, render pure data passed in.
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ========== Animated number (flash on change) ==========
function Digits({ value, decimals = 2, className = "" }) {
  const str = Number(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const prevRef = useRef(str);
  const [flashState, setFlashState] = useState(null);

  useEffect(() => {
    if (prevRef.current !== str) {
      const prevNum = parseFloat(prevRef.current.replace(/,/g, ''));
      const curNum = parseFloat(str.replace(/,/g, ''));
      setFlashState(curNum >= prevNum ? 'up' : 'down');
      const t = setTimeout(() => setFlashState(null), 500);
      prevRef.current = str;
      return () => clearTimeout(t);
    }
  }, [str]);

  return (
    <span
      className={"digits " + className + (flashState ? ' digit-' + flashState : '')}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >{str}</span>
  );
}

// ========== Sparkline ==========
function Sparkline({ values, color = "var(--accent)", width = 60, height = 18, fill = false }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / range) * height]);
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const dFill = d + ` L${width},${height} L0,${height} Z`;
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {fill && <path d={dFill} fill={color} opacity="0.15" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="1.5" fill={color} />
    </svg>
  );
}

// ========== Tile wrapper with hover-pause + drag ==========
function Tile({ id, title, dotColor, meta, children, className = "", onDragStart, onDragOver, onDrop, paused, setPaused }) {
  return (
    <div
      className={"tile " + className + (paused ? " paused" : "")}
      data-tile-id={id}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="t-head">
        <div className="t-title">
          <span className={"dot " + (dotColor || "")}></span>
          {title}
        </div>
        <div className="t-meta">
          {meta}
          <span className="t-drag" draggable onDragStart={onDragStart} title="Drag to rearrange">⋮⋮</span>
        </div>
      </div>
      {children}
    </div>
  );
}

// ========== BTC Hero tile ==========
function BTCHero({ paused }) {
  const [series, setSeries] = useState(() => window.TF_DATA.btc.history.slice());
  const [flash, setFlash] = useState(null);
  const prevPx = useRef(series[series.length - 1].v);

  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setSeries(prev => {
        const last = prev[prev.length - 1].v;
        const next = Math.max(80000, last + window.TF_DATA.rng(-120, 140));
        const newArr = [...prev.slice(1), { t: Date.now(), v: next }];
        if (next > prevPx.current) setFlash('up');
        else if (next < prevPx.current) setFlash('down');
        prevPx.current = next;
        setTimeout(() => setFlash(null), 700);
        return newArr;
      });
    }, 1400);
    return () => clearInterval(iv);
  }, [paused]);

  const cur = series[series.length - 1].v;
  const open = series[0].v;
  const chg = cur - open;
  const chgPct = (chg / open) * 100;
  const up = chg >= 0;

  // Path
  const width = 600, height = 120;
  const values = series.map(s => s.v);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / range) * (height - 10) - 5]);
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const dFill = d + ` L${width},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];
  const color = up ? 'var(--up)' : 'var(--down)';

  return (
    <>
      <div className="price-hero">
        <span className={"price-num " + (flash ? 'flash-' + flash : '')} style={{ padding: '0 2px' }}>
          $<Digits value={cur} decimals={2} />
        </span>
        <span className={"price-chg " + (up ? '' : 'down')}>
          {up ? '▲' : '▼'} {Math.abs(chgPct).toFixed(2)}%
        </span>
      </div>
      <div className="price-sub">
        <span>24h HIGH <span style={{color:'var(--text)'}}>{max.toLocaleString(undefined,{maximumFractionDigits:0})}</span></span>
        <span>24h LOW <span style={{color:'var(--text)'}}>{min.toLocaleString(undefined,{maximumFractionDigits:0})}</span></span>
        <span>VOL <span style={{color:'var(--text)'}}>28.4B</span></span>
      </div>
      <div className="chart">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="btc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* grid lines */}
          {[0.25, 0.5, 0.75].map(p => (
            <line key={p} x1="0" x2={width} y1={height*p} y2={height*p} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 3"/>
          ))}
          <path d={dFill} fill="url(#btc-fill)"/>
          <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
          <circle cx={last[0]} cy={last[1]} r="3" className="last-dot" />
          <circle cx={last[0]} cy={last[1]} r="6" fill={color} opacity="0.3">
            <animate attributeName="r" values="3;10;3" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
    </>
  );
}

window.TF_Components = { Digits, Sparkline, Tile, BTCHero };
