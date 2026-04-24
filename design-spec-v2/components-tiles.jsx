// More tile components
const { useState: useS2, useEffect: useE2, useRef: useR2, useMemo: useM2 } = React;

// ========== Markets table ==========
function MarketsTable({ paused }) {
  const [rows, setRows] = useS2(() => window.TF_DATA.markets.map(m => ({...m})));
  const [flashes, setFlashes] = useS2({});

  useE2(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setRows(prev => {
        // pick random row to tick
        const idx = Math.floor(Math.random() * prev.length);
        const next = prev.map((r, i) => {
          if (i !== idx) return r;
          const delta = r.px * window.TF_DATA.rng(-0.004, 0.004);
          const px = Math.max(0.01, r.px + delta);
          const chg = r.chg + (delta / r.px) * 100;
          const newSpark = [...r.spark.slice(1), px];
          return { ...r, px, chg, spark: newSpark };
        });
        const dir = next[idx].px > prev[idx].px ? 'up' : 'down';
        setFlashes(f => ({ ...f, [next[idx].sym]: dir }));
        setTimeout(() => setFlashes(f => { const n = {...f}; delete n[next[idx].sym]; return n; }), 900);
        return next;
      });
    }, 650);
    return () => clearInterval(iv);
  }, [paused]);

  return (
    <table className="mkt">
      <thead>
        <tr>
          <th>SYM</th>
          <th className="r">LAST</th>
          <th className="r">CHG%</th>
          <th className="r">24H</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const up = r.chg >= 0;
          const cls = flashes[r.sym] === 'up' ? 'up-flash' : flashes[r.sym] === 'down' ? 'down-flash' : '';
          return (
            <tr key={r.sym} className={cls}>
              <td className="sym">{r.sym}</td>
              <td className="r" style={{fontVariantNumeric:'tabular-nums'}}>{r.px.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className={"r " + (up ? 'up' : 'down')}>{up?'+':''}{r.chg.toFixed(2)}%</td>
              <td className="r"><div style={{display:'flex',justifyContent:'flex-end'}}><window.TF_Components.Sparkline values={r.spark} color={up ? 'var(--up)' : 'var(--down)'} width={60} height={16} fill /></div></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ========== HN feed ==========
function HNFeed({ paused }) {
  const [items, setItems] = useS2(() => window.TF_DATA.hnTitles.slice(0, 12).map(t => ({...t, isNew: false})));
  const [expanded, setExpanded] = useS2(new Set());
  const pool = useR2(window.TF_DATA.hnTitles.slice(12));
  const nextId = useR2(window.TF_DATA.hnTitles.length + 1);

  useE2(() => {
    if (paused) return;
    const iv = setInterval(() => {
      if (pool.current.length === 0) return;
      const next = pool.current[0];
      pool.current = pool.current.slice(1);
      setItems(prev => [{...next, id: nextId.current++, isNew: true}, ...prev.slice(0, 11)]);
      setTimeout(() => setItems(prev => prev.map(x => ({...x, isNew: false}))), 1400);
      // push the removed one back to the pool so it can cycle
      setItems(prev => {
        if (!prev || prev.length === 0) return prev;
        return prev;
      });
    }, 4500);
    return () => clearInterval(iv);
  }, [paused]);

  const toggle = (id) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <ul className="feed">
      {items.map((it, i) => (
        <li
          key={it.id}
          className={(it.isNew ? 'new ' : '') + (expanded.has(it.id) ? 'expanded' : '')}
          onClick={() => toggle(it.id)}
        >
          <span className="num">{String(i+1).padStart(2,'0')}</span>
          <span className="ttl">{it.t}</span>
          <span className="aux">{it.pts}▲ · {it.hrs}</span>
          {expanded.has(it.id) && (
            <div className="detail">
              {it.pts} points · posted {it.hrs} ago · <span style={{color:'var(--accent)'}}>news.ycombinator.com/item?id={it.id}</span><br/>
              Discussion picking up momentum — top comment thread has {Math.floor(Math.random()*80)+20} replies.
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// ========== Earthquakes ==========
function Earthquakes({ paused }) {
  const [items, setItems] = useS2(() => window.TF_DATA.quakes);

  useE2(() => {
    if (paused) return;
    const iv = setInterval(() => {
      const locs = ["Off the coast of Oregon", "15km SE of Guerrero, Mexico", "Central Turkey", "Banda Sea, Indonesia", "43km W of Adak, Alaska", "South Sandwich Islands region", "Kermadec Islands, New Zealand", "Near Catania, Sicily"];
      const mag = Number((Math.random() * 3.5 + 1.8).toFixed(1));
      const newQ = { mag, loc: locs[Math.floor(Math.random()*locs.length)], depth: Math.floor(Math.random()*80)+2, age: "just now", isNew: true };
      setItems(prev => [newQ, ...prev.slice(0, 9)]);
      setTimeout(() => setItems(prev => prev.map(q => ({...q, isNew: false}))), 1500);
    }, 9000);
    return () => clearInterval(iv);
  }, [paused]);

  return (
    <ul className="feed quake-list">
      {items.map((q, i) => {
        const cls = q.mag >= 5 ? 'm5' : q.mag >= 4 ? 'm4' : q.mag >= 3 ? 'm3' : 'm2';
        return (
          <li key={i} className={q.isNew ? 'new' : ''}>
            <span className={"mag " + cls}>{q.mag.toFixed(1)}</span>
            <span className="ttl">{q.loc}</span>
            <span className="aux">{q.depth}km · {q.age}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ========== Status list ==========
function StatusList({ paused }) {
  const [rows, setRows] = useS2(window.TF_DATA.statuses);

  useE2(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setRows(prev => prev.map(r => {
        const drift = (Math.random() - 0.5) * 0.02;
        const uptime = Math.max(90, Math.min(100, r.uptime + drift));
        return { ...r, uptime };
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, [paused]);

  return (
    <div className="status-list">
      {rows.map(r => (
        <div className="status-row" key={r.name}>
          <span className="name">{r.name}</span>
          <span className="uptime">{r.uptime.toFixed(3)}%</span>
          <span className={"status-pill " + r.status}>{r.status === 'ok' ? '● OK' : r.status === 'degraded' ? '◐ DEGR' : '○ DOWN'}</span>
        </div>
      ))}
    </div>
  );
}

// ========== Bars (traffic) ==========
function Bars({ data, variant = '' }) {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div className="bar-list">
      {data.map(d => (
        <div className="bar-row" key={d.lbl}>
          <span className="lbl">{d.lbl}</span>
          <div className="bar-track">
            <div className={"bar-fill " + variant} style={{ width: (d.v / max * 100) + '%' }}></div>
          </div>
          <span className="val">{d.v.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ========== Log stream ==========
function LogStream({ paused }) {
  const [lines, setLines] = useS2(() => Array.from({length: 14}, () => window.TF_DATA.nextLog()));
  useE2(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setLines(prev => [window.TF_DATA.nextLog(), ...prev.slice(0, 13)]);
    }, 900);
    return () => clearInterval(iv);
  }, [paused]);

  return (
    <div className="logs">
      <div className="logs-inner">
        {lines.map((l, i) => (
          <div className="log-line" key={i+'-'+l.ts+'-'+l.msg.slice(0,10)} style={{ opacity: Math.max(0.2, 1 - i*0.05) }}>
            <span className="ts">{l.ts}</span>
            <span className={"lvl " + l.lvl}>{l.lvl}</span>
            <span className="msg" dangerouslySetInnerHTML={{__html: l.msg}}></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== Sensors / IoT ==========
function Sensors({ paused }) {
  const [sensors, setSensors] = useS2(() => window.TF_DATA.sensors.map(s => ({...s, history: [...s.history]})));
  useE2(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setSensors(prev => prev.map(s => {
        const jitter = (s.max - s.min) * 0.02;
        let next = s.val + (Math.random() - 0.5) * jitter * 2;
        next = Math.max(s.min, Math.min(s.max, next));
        return { ...s, val: next, history: [...s.history.slice(1), next] };
      }));
    }, 700);
    return () => clearInterval(iv);
  }, [paused]);

  return (
    <div className="sensor-grid">
      {sensors.map(s => {
        const pct = (s.val - s.min) / (s.max - s.min);
        const col = s.name === 'TEMP' && s.val > 70 ? 'var(--down)' :
                    (s.name === 'CPU' || s.name === 'MEM') && s.val > 80 ? 'var(--warn)' :
                    'var(--accent)';
        return (
          <div className="sensor" key={s.name}>
            <div className="s-name">{s.name}</div>
            <div className="s-val" style={{color: col}}>
              {s.val.toFixed(s.unit === '' ? 2 : 1)}
              <span className="unit">{s.unit}</span>
            </div>
            <window.TF_Components.Sparkline values={s.history} color={col} width={100} height={16} fill />
          </div>
        );
      })}
    </div>
  );
}

// ========== Typing headline ==========
function TypingHeadline() {
  const lines = window.TF_DATA.headlines;
  const [idx, setIdx] = useS2(0);
  const [shown, setShown] = useS2("");
  const [deleting, setDeleting] = useS2(false);
  useE2(() => {
    const current = lines[idx];
    if (!deleting && shown.length < current.length) {
      const t = setTimeout(() => setShown(current.slice(0, shown.length + 1)), 28);
      return () => clearTimeout(t);
    } else if (!deleting && shown.length === current.length) {
      const t = setTimeout(() => setDeleting(true), 3200);
      return () => clearTimeout(t);
    } else if (deleting && shown.length > 0) {
      const t = setTimeout(() => setShown(shown.slice(0, -1)), 12);
      return () => clearTimeout(t);
    } else if (deleting && shown.length === 0) {
      setDeleting(false);
      setIdx((idx + 1) % lines.length);
    }
  }, [shown, deleting, idx]);

  return (
    <div style={{ fontSize: 14, letterSpacing: '0.01em', color: 'var(--text)' }}>
      <span style={{ color: 'var(--accent)', marginRight: 8 }}>λ</span>
      {shown}<span className="caret"></span>
    </div>
  );
}

// ========== Network globe (ascii) ==========
function NetworkGlobe({ paused }) {
  const [hits, setHits] = useS2([]);
  useE2(() => {
    if (paused) return;
    const iv = setInterval(() => {
      const id = Math.random().toString(36).slice(2);
      const x = Math.random() * 80 + 10;
      const y = Math.random() * 70 + 15;
      setHits(prev => [...prev, { id, x, y }]);
      setTimeout(() => setHits(prev => prev.filter(h => h.id !== id)), 1600);
    }, 420);
    return () => clearInterval(iv);
  }, [paused]);

  const globeArt = `       . - - - - - - .
    /                 \\
   /    . - . - . .    \\
  |   / o   .   . |     |
  |  |  . o   .  |  .   |
  |  |   .  .  . | o    |
  |   \\  .  o  . /      |
   \\   \` - . - \`       /
    \\                 /
     \` - - - - - - \`  `;

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 160 }}>
      <pre className="globe">{globeArt}</pre>
      {hits.map(h => (
        <span key={h.id} className="hit" style={{ left: h.x + '%', top: h.y + '%' }}></span>
      ))}
      <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, color: 'var(--muted)' }}>
        REQ/s <span style={{color:'var(--accent)'}}>{(Math.random()*200+400).toFixed(0)}</span>
        <span className="sep"> · </span>
        RTT <span style={{color:'var(--accent)'}}>{(Math.random()*40+20).toFixed(0)}ms</span>
      </div>
    </div>
  );
}

// ========== Gauge ==========
function Gauge({ value, max = 100, label, sublabel }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const angle = -135 + pct * 270;
  const r = 40;
  const cx = 55, cy = 55;
  const arc = (from, to) => {
    const fr = (from * Math.PI) / 180;
    const tr = (to * Math.PI) / 180;
    const x1 = cx + r * Math.cos(fr), y1 = cy + r * Math.sin(fr);
    const x2 = cx + r * Math.cos(tr), y2 = cy + r * Math.sin(tr);
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`;
  };
  return (
    <div className="gauge-wrap">
      <svg className="gauge" viewBox="0 0 110 110">
        <path d={arc(-180+45, -45)} fill="none" stroke="var(--border-strong)" strokeWidth="4"/>
        <path d={arc(-180+45, angle)} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 4px var(--accent))'}}/>
        <text x="55" y="58" textAnchor="middle" fill="var(--text)" fontSize="18" fontFamily="var(--mono)" style={{fontVariantNumeric:'tabular-nums'}}>{value.toFixed(0)}</text>
        <text x="55" y="72" textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="var(--mono)" letterSpacing="1.5">{label}</text>
      </svg>
      <div className="gauge-info">
        <b>{sublabel || 'ALL SYSTEMS'}</b>
        <span>checks passing</span>
        <span style={{color:'var(--accent)'}}>● monitoring {Math.floor(Math.random()*20)+40} endpoints</span>
        <span>last change <b style={{color:'var(--text)'}}>4m ago</b></span>
      </div>
    </div>
  );
}

Object.assign(window.TF_Components, {
  MarketsTable, HNFeed, Earthquakes, StatusList, Bars, LogStream, Sensors, TypingHeadline, NetworkGlobe, Gauge
});
