// All tile components — one file, shared globals
const { useState, useEffect, useRef, useMemo } = React;
const D = window.TF_DATA;

// ---------- Sparkline ----------
function Sparkline({ values, color = "var(--green)", width = 60, height = 18, fill = false, strokeWidth = 1 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / range) * height]);
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const dF = d + ` L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{display:'block'}}>
      {fill && <path d={dF} fill={color} opacity="0.12"/>}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth}/>
    </svg>
  );
}

// ---------- Panel shell ----------
function Panel({ id, title, dot = 'green', meta, stale, hero, paused, setPaused, children }) {
  return (
    <div
      className={"panel" + (hero ? " hero-2col" : "") + (paused ? " paused" : "")}
      onMouseEnter={() => setPaused && setPaused(true)}
      onMouseLeave={() => setPaused && setPaused(false)}
    >
      <div className="panel-head">
        <div className="panel-title">
          <span className={"live-dot " + dot}></span>
          {title}
          {stale && <span className="stale">STALE</span>}
        </div>
        <div className="panel-meta">
          {meta}
          <span className="drag" title="Drag to rearrange">⋮⋮</span>
        </div>
      </div>
      {children}
    </div>
  );
}

// ---------- BTC Hero (spec: 2-col wide, pulsing dot, big sparkline, range bar) ----------
function BtcHero({ paused }) {
  const [series, setSeries] = useState(D.btcHistory.slice());
  const [flash, setFlash] = useState(null);
  const prev = useRef(series[series.length-1][1]);

  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setSeries(s => {
        const last = s[s.length-1][1];
        const next = Math.max(70000, last + D.rng(-140, 160));
        if (next > prev.current) setFlash('up'); else if (next < prev.current) setFlash('dn');
        prev.current = next;
        setTimeout(() => setFlash(null), 700);
        return [...s.slice(1), [Date.now(), next]];
      });
    }, 1300);
    return () => clearInterval(iv);
  }, [paused]);

  const cur = series[series.length-1][1];
  const open = series[0][1];
  const chg = cur - open;
  const chgPct = (chg / open) * 100;
  const up = chg >= 0;
  const vals = series.map(s => s[1]);
  const hi = Math.max(...vals), lo = Math.min(...vals);
  const W = 600, H = 180;
  const range = hi - lo || 1;
  const step = W / (vals.length - 1);
  const pts = vals.map((v, i) => [i*step, H - ((v-lo)/range)*(H-14) - 7]);
  const d = pts.map((p,i) => (i===0?'M':'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const dF = d + ` L${W},${H} L0,${H} Z`;
  const last = pts[pts.length-1];

  const markerPct = ((cur - lo) / range) * 100;

  return (
    <Panel id="bitcoin" title="BITCOIN" dot="gold" meta={<><span>COINBASE · WS</span></>} hero paused={paused} setPaused={()=>{}}>
      <div className="btc-hero">
        <div className="btc-hero-left">
          <span className={"btc-price" + (flash === 'up' ? ' flash-up' : flash === 'dn' ? ' flash-dn' : '')}>
            ${cur.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
          </span>
          <span className={"btc-change " + (up ? 'up' : 'dn')}>
            {up?'▲':'▼'} {Math.abs(chgPct).toFixed(2)}% · {up?'+':''}${Math.abs(chg).toFixed(2)}
          </span>
          <div className="btc-sub">
            <span>24H HIGH <b>${hi.toLocaleString(undefined,{maximumFractionDigits:0})}</b></span>
            <span>24H LOW <b>${lo.toLocaleString(undefined,{maximumFractionDigits:0})}</b></span>
            <span>VOL <b>$28.4B</b></span>
          </div>
          <div className="btc-range">
            <div className="btc-range-label">
              <span>${lo.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
              <span style={{color:'var(--gold)'}}>● LIVE</span>
              <span>${hi.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
            </div>
            <div className="btc-range-track">
              <div className="btc-range-fill" style={{ width: '100%' }}/>
              <div className="btc-range-marker" style={{ left: markerPct + '%' }}/>
            </div>
          </div>
        </div>
        <div className="btc-chart">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="btcg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[0.25,0.5,0.75].map(p => (
              <line key={p} x1="0" x2={W} y1={H*p} y2={H*p} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 3"/>
            ))}
            <path d={dF} fill="url(#btcg)"/>
            <path d={d} fill="none" stroke="var(--gold)" strokeWidth="1.4"/>
            <circle cx={last[0]} cy={last[1]} r="2.5" className="btc-pulse-dot"/>
            <circle cx={last[0]} cy={last[1]} r="5" fill="var(--gold)" opacity="0.3">
              <animate attributeName="r" values="2.5;10;2.5" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
      </div>
    </Panel>
  );
}

// ---------- Markets table ----------
function MarketsPanel({ paused }) {
  const [rows, setRows] = useState(D.stocks.map(s => ({...s})));
  const [flashes, setFlashes] = useState({});
  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setRows(prev => {
        const i = Math.floor(Math.random() * prev.length);
        const next = prev.map((r, j) => {
          if (j !== i) return r;
          const dp = r.price * D.rng(-0.003, 0.003);
          const price = Math.max(0.01, r.price + dp);
          const change_percent = r.change_percent + (dp / r.price) * 100;
          return { ...r, price, change_percent, spark: [...r.spark.slice(1), price] };
        });
        const dir = next[i].price > prev[i].price ? 'up' : 'dn';
        setFlashes(f => ({...f, [next[i].symbol]: dir}));
        setTimeout(() => setFlashes(f => { const n = {...f}; delete n[next[i].symbol]; return n; }), 900);
        return next;
      });
    }, 700);
    return () => clearInterval(iv);
  }, [paused]);
  return (
    <Panel id="markets" title="MARKETS · US" dot="green" meta={<span>15 SYMBOLS</span>} paused={paused} setPaused={()=>{}}>
      <table className="markets-table">
        <thead><tr><th>SYM</th><th className="r">LAST</th><th className="r">CHG%</th><th className="r">24H</th></tr></thead>
        <tbody>
        {rows.map(r => {
          const up = r.change_percent >= 0;
          const cls = flashes[r.symbol] === 'up' ? 'flash-up' : flashes[r.symbol] === 'dn' ? 'flash-dn' : '';
          return (
            <tr key={r.symbol} className={cls}>
              <td className="sym">{r.symbol}</td>
              <td className="r">{r.price.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
              <td className={"r " + (up?'up':'dn')}>{up?'+':''}{r.change_percent.toFixed(2)}%</td>
              <td className="r"><div style={{display:'flex',justifyContent:'flex-end'}}><Sparkline values={r.spark} color={up?'var(--green)':'var(--red)'} width={56} height={16} fill/></div></td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </Panel>
  );
}

// ---------- Crypto ----------
function CryptoPanel({ paused }) {
  const [rows, setRows] = useState(D.crypto.map(c => ({...c})));
  const [flashes, setFlashes] = useState({});
  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setRows(prev => {
        const i = Math.floor(Math.random() * prev.length);
        const next = prev.map((r, j) => j !== i ? r : { ...r, current_price: r.current_price * (1 + D.rng(-0.003, 0.003)) });
        const dir = next[i].current_price > prev[i].current_price ? 'up' : 'dn';
        setFlashes(f => ({...f, [next[i].symbol]: dir}));
        setTimeout(() => setFlashes(f => { const n = {...f}; delete n[next[i].symbol]; return n; }), 800);
        return next;
      });
    }, 900);
    return () => clearInterval(iv);
  }, [paused]);
  return (
    <Panel id="crypto" title="CRYPTO" dot="gold" meta={<span>COINCAP · WS</span>} paused={paused} setPaused={()=>{}}>
      <div className="crypto-rows">
        {rows.map(r => {
          const up = r.price_change_percentage_24h >= 0;
          const cls = flashes[r.symbol] === 'up' ? 'flash-up' : flashes[r.symbol] === 'dn' ? 'flash-dn' : '';
          return (
            <div key={r.symbol} className={"crypto-row " + cls}>
              <span className="c-sym">{r.symbol}</span>
              <span className="c-name">{r.name}</span>
              <span className="c-price">${r.current_price < 1 ? r.current_price.toFixed(4) : r.current_price.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</span>
              <span className={"c-chg " + (up?'up':'dn')}>{up?'+':''}{r.price_change_percentage_24h.toFixed(2)}%</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------- Status supercard ----------
function StatusWall({ paused }) {
  const rows = D.services;
  const okCount = rows.filter(r => r.indicator === 'none').length;
  const warnCount = rows.filter(r => r.indicator === 'minor').length;
  const badCount = rows.filter(r => r.indicator === 'major' || r.indicator === 'critical').length;
  return (
    <Panel id="status" title="STATUS · GLOBAL" dot={badCount ? 'red' : warnCount ? 'amber' : 'green'} meta={<span>13 SERVICES</span>} paused={paused} setPaused={()=>{}}>
      <div className="status-wall">
        {rows.map(r => (
          <div className={"status-cell " + r.indicator} key={r.name} title={r.description}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span className="sc-name">{r.name}</span>
              <span className="sc-lamp"></span>
            </div>
            <span className="sc-badge">{r.indicator === 'none' ? 'OK' : r.indicator === 'minor' ? 'DEGR' : 'DOWN'}</span>
          </div>
        ))}
      </div>
      <div className="status-summary">
        <span className="s-ok">OK <b>{okCount}</b></span>
        <span className="s-warn">DEGRADED <b>{warnCount}</b></span>
        <span className="s-bad">INCIDENTS <b>{badCount}</b></span>
      </div>
    </Panel>
  );
}

// ---------- Live right now ----------
function LiveNowPanel({ paused }) {
  const [events, setEvents] = useState(() => [
    { src: 'btc', time: '00:00', body: <><span className="lv-src btc">BTC</span> tick → <span className="lv-val">$77,452.18</span></> },
    { src: 'wiki', time: '00:01', body: <><span className="lv-src wiki">WIKI</span> edit · Apollo 11 <span className="lv-val">+128</span></> },
    { src: 'hn',   time: '00:03', body: <><span className="lv-src hn">HN</span> new story <span className="lv-val">+1</span></> },
    { src: 'quake',time: '00:04', body: <><span className="lv-src quake">USGS</span> M3.2 · Chico, CA</> },
    { src: 'gh',   time: '00:05', body: <><span className="lv-src gh">GH</span> vercel/next.js push</> },
  ]);
  useEffect(() => {
    if (paused) return;
    const templates = [
      () => ({ src:'btc', body: <><span className="lv-src btc">BTC</span> tick → <span className="lv-val">${(77000 + Math.random()*800).toFixed(2)}</span></> }),
      () => ({ src:'wiki', body: <><span className="lv-src wiki">WIKI</span> edit · {D.pick(D.wikiTitles)} <span className="lv-val">{Math.random()>0.5?'+':'−'}{Math.floor(Math.random()*200)}</span></> }),
      () => ({ src:'hn', body: <><span className="lv-src hn">HN</span> +{Math.floor(Math.random()*15)+1} points · story #{47800000 + Math.floor(Math.random()*1000)}</> }),
      () => ({ src:'gh', body: <><span className="lv-src gh">GH</span> {D.pick(["push","star","fork","PR"])} · {D.pick(["vercel/next.js","facebook/react","torvalds/linux","rust-lang/rust"])}</> }),
      () => ({ src:'quake', body: <><span className="lv-src quake">USGS</span> M{(Math.random()*2+2).toFixed(1)} · {D.pick(["Chico, CA","Anchorage, AK","Hokkaido","Iceland"])}</> }),
    ];
    const iv = setInterval(() => {
      const ts = new Date();
      const t = String(ts.getMinutes()).padStart(2,'0') + ':' + String(ts.getSeconds()).padStart(2,'0');
      const ev = { ...D.pick(templates)(), time: t };
      setEvents(prev => [ev, ...prev.slice(0, 13)]);
    }, 900);
    return () => clearInterval(iv);
  }, [paused]);
  return (
    <Panel id="live-now" title="LIVE · RIGHT NOW" dot="green" meta={<span>UNIFIED STREAM</span>} paused={paused} setPaused={()=>{}}>
      <div className="live-stream">
        {events.map((e,i) => (
          <div className="live-event" key={e.time + '-' + i}>
            <span className="lv-time">{e.time}</span>
            <span className="lv-body">{e.body}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------- Wikipedia live SSE ----------
function WikiLive({ paused }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setItems(prev => [{
        lang: D.pick(D.wikiLangs),
        title: D.pick(D.wikiTitles),
        user: D.pick(D.wikiUsers),
        delta: Math.floor((Math.random()-0.5) * 600),
        id: Math.random()
      }, ...prev.slice(0, 18)]);
    }, 500);
    return () => clearInterval(iv);
  }, [paused]);
  return (
    <Panel id="wiki-live" title="WIKIPEDIA · LIVE" dot="blue" meta={<span>SSE · 500MS</span>} paused={paused} setPaused={()=>{}}>
      <div className="wiki-stream">
        {items.map(it => (
          <div className="wiki-item" key={it.id}>
            <span className="w-lang">{it.lang}</span>
            <span className="w-title">{it.title} <span className="w-user">· {it.user}</span></span>
            <span className={"w-delta " + (it.delta >= 0 ? 'pos' : 'neg')}>{it.delta >= 0 ? '+' : ''}{it.delta}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------- News ----------
function NewsPanel({ paused }) {
  return (
    <Panel id="news" title="TECH · AI FEED" dot="amber" meta={<span>~5 MIN</span>} paused={paused} setPaused={()=>{}}>
      <div className="news-feed">
        {D.news.map((n,i) => (
          <div key={i} className="news-item">
            <span className="n">{String(i+1).padStart(2,'0')}</span>
            <span className="t">{n.title}</span>
            <span className="m">{n.src} · {n.t}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------- Earthquakes ----------
function QuakesPanel({ paused }) {
  return (
    <Panel id="seismic" title="SEISMIC · USGS" dot="red" meta={<span>≥ M2.0 · 1H</span>} paused={paused} setPaused={()=>{}}>
      <div className="quake-list">
        {D.quakes.map((q,i) => {
          const cls = q.magnitude >= 5 ? 'm5' : q.magnitude >= 4 ? 'm4' : q.magnitude >= 3 ? 'm3' : 'm2';
          const mins = Math.floor((Date.now() - q.time) / 60000);
          return (
            <div className="quake-row" key={i}>
              <span className={"mag " + cls}>{q.magnitude.toFixed(1)}</span>
              <span className="q-loc">{q.place}</span>
              <span className="q-time">{mins < 60 ? mins + 'm' : Math.floor(mins/60) + 'h'} · {q.coordinates[2].toFixed(0)}km</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------- Weather ----------
function WeatherPanel() {
  return (
    <Panel id="weather" title="WEATHER · LA" dot="gold" meta={<span>10M</span>} paused={false} setPaused={()=>{}}>
      <div className="weather-scene">
        <div className="sun"></div>
        <div className="palm l">🌴</div>
        <div className="palm r">🌴</div>
        <div className="weather-info">
          <span className="temp">{D.weather.temp}°F</span>
          <span className="cond">{D.weather.cond}</span>
        </div>
      </div>
      <div className="weather-forecast">
        {D.weather.forecast.map(f => (
          <div className="weather-day" key={f.d}>
            <div className="d">{f.d}</div>
            <div className="h">{f.h}°</div>
            <div className="l">{f.l}°</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------- Gas ----------
function GasPanel() {
  return (
    <Panel id="gas" title="ETH · GAS" dot="blue" meta={<span>15S</span>} paused={false} setPaused={()=>{}}>
      <div className="gas-card">
        <div className="gas-cell low"><div className="gc-label">LOW</div><div className="gc-val">{D.gas.low}<span className="unit">GWEI</span></div></div>
        <div className="gas-cell"><div className="gc-label">STD</div><div className="gc-val">{D.gas.standard}<span className="unit">GWEI</span></div></div>
        <div className="gas-cell fast"><div className="gc-label">FAST</div><div className="gc-val">{D.gas.fast}<span className="unit">GWEI</span></div></div>
      </div>
    </Panel>
  );
}

// ---------- Fear/Greed ----------
function FearGreed() {
  const v = D.fearGreed.value;
  const pct = v / 100;
  const angle = -90 + pct * 180;
  const r = 40, cx = 55, cy = 70;
  const arc = (from, to) => {
    const fr = (from * Math.PI) / 180;
    const tr = (to * Math.PI) / 180;
    const x1 = cx + r * Math.cos(fr), y1 = cy + r * Math.sin(fr);
    const x2 = cx + r * Math.cos(tr), y2 = cy + r * Math.sin(tr);
    return `M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`;
  };
  return (
    <Panel id="fg" title="FEAR · GREED" dot="amber" meta={<span>DAILY</span>} paused={false} setPaused={()=>{}}>
      <div className="fg-gauge">
        <svg viewBox="0 0 110 90">
          <path d={arc(-180, 0)} fill="none" stroke="var(--border-glow)" strokeWidth="5"/>
          <path d={arc(-180, angle)} fill="none" stroke="var(--amber)" strokeWidth="5" strokeLinecap="round" style={{filter:'drop-shadow(0 0 4px var(--amber))'}}/>
          <text x="55" y="68" textAnchor="middle" fill="var(--text)" fontSize="18" fontFamily="var(--mono)" style={{fontVariantNumeric:'tabular-nums'}}>{v}</text>
        </svg>
        <div className="fg-info">
          <div className="fg-val">{v}</div>
          <div className="fg-lbl">{D.fearGreed.label}</div>
          <div style={{marginTop:6, fontSize:10}}>24H: <b style={{color:'var(--red)'}}>−4</b> · 7D: <b style={{color:'var(--green)'}}>+9</b></div>
        </div>
      </div>
    </Panel>
  );
}

// ---------- Humans in space ----------
function HumansInSpace() {
  return (
    <Panel id="hs" title="HUMANS · IN SPACE" dot="purple" meta={<span>DAILY</span>} paused={false} setPaused={()=>{}}>
      <div className="hs-card">
        <div className="hs-count">{D.crew.length}</div>
        <div className="hs-label">currently in orbit</div>
        <div className="hs-list">
          {D.crew.map(p => (
            <div className="hs-person" key={p.name}>
              <span>{p.name}</span>
              <span className="craft">{p.craft}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ---------- World map (seismic + flights + launches) ----------
function WorldMap({ paused }) {
  const [pings, setPings] = useState([]);
  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      const types = [
        { color: 'var(--red)', cls: 'q' },
        { color: 'var(--cyan)', cls: 'f' },
        { color: 'var(--gold)', cls: 'l' },
      ];
      const t = D.pick(types);
      const id = Math.random();
      setPings(prev => [...prev, { id, x: Math.random()*90+5, y: Math.random()*70+15, color: t.color, cls: t.cls }]);
      setTimeout(() => setPings(prev => prev.filter(p => p.id !== id)), 2400);
    }, 600);
    return () => clearInterval(iv);
  }, [paused]);

  // Simplified continent silhouettes — dotted grid that reads as "world"
  const grid = [];
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 40; x++) {
      const lat = 90 - y * 9;
      const lng = x * 9 - 180;
      // very rough land mask
      const onLand =
        (lng > -170 && lng < -50 && lat > 15 && lat < 75) || // N. America
        (lng > -90 && lng < -30 && lat > -55 && lat < 15) ||  // S. America
        (lng > -20 && lng < 55 && lat > -35 && lat < 72) ||   // Europe/Africa
        (lng > 55 && lng < 150 && lat > 0 && lat < 72) ||     // Asia
        (lng > 110 && lng < 155 && lat > -45 && lat < -10);   // Australia
      if (onLand && Math.random() > 0.35) grid.push({ x: (x/40)*100, y: (y/20)*100 });
    }
  }
  return (
    <Panel id="worldmap" title="WORLD · LIVE MAP" dot="green" meta={<span>QUAKES · FLIGHTS · LAUNCHES</span>} paused={paused} setPaused={()=>{}}>
      <div className="worldmap">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {grid.map((g, i) => (
            <circle key={i} cx={g.x} cy={g.y} r="0.35" fill="var(--border-glow)"/>
          ))}
        </svg>
        {pings.map(p => (
          <span key={p.id} className="wm-ping" style={{ left: p.x+'%', top: p.y+'%', background: p.color, color: p.color }}></span>
        ))}
        <div className="wm-legend">
          <span><i className="d q"></i> QUAKE</span>
          <span><i className="d f"></i> FLIGHT</span>
          <span><i className="d l"></i> LAUNCH</span>
        </div>
      </div>
    </Panel>
  );
}

Object.assign(window, {
  Sparkline, Panel, BtcHero, MarketsPanel, CryptoPanel, StatusWall, LiveNowPanel,
  WikiLive, NewsPanel, QuakesPanel, WeatherPanel, GasPanel, FearGreed, HumansInSpace, WorldMap
});
