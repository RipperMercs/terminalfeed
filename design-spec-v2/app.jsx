// Main app
const { useState: uS, useEffect: uE, useRef: uR } = React;
const C = window.TF_Components;

const DEFAULT_TILES = [
  'btc','markets','hn','status','sensors','quakes','logs','traffic','poll','globe','gauge'
];

function TopBar({ direction, live, latency }) {
  const items = window.TF_DATA.tickerSymbols;
  // duplicate for seamless marquee
  const track = [...items, ...items];
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo"></span>
        TERMINALFEED
        <span style={{ color: 'var(--muted)', fontWeight: 400, letterSpacing: '0.06em', marginLeft: 6 }}>.io</span>
      </div>
      <div className="top-ticker">
        <div className="top-ticker-track">
          {track.map((it, i) => (
            <span className="top-ticker-item" key={i}>
              <span className="sym">{it.sym}</span>
              <span className="val">{it.val}</span>
              <span className={"chg " + (it.up ? 'up' : 'down')}>{it.chg}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="status">
        <span className="chip live"><span className="live-dot"></span> LIVE</span>
        <span className="chip">
          <span className="packet-track">
            <span className="packet"></span>
            <span className="packet"></span>
          </span>
          {latency}ms
        </span>
        <span className="chip">
          <span className="latency-bars"><i></i><i></i><i></i><i></i></span>
          WS · OK
        </span>
        <span className="chip" style={{color:'var(--text-dim)'}}>
          {new Date().toLocaleTimeString('en-US', { hour12: false })} UTC
        </span>
      </div>
    </header>
  );
}

function HeadlineBar() {
  return (
    <div style={{
      padding: '10px 14px',
      borderBottom: '1px solid var(--border)',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 20,
      alignItems: 'center',
      background: 'linear-gradient(to bottom, color-mix(in oklch, var(--surface) 60%, var(--bg)), var(--bg))'
    }}>
      <C.TypingHeadline />
      <div style={{display:'flex', gap: 14, fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.08em', textTransform:'uppercase'}}>
        <span>FEEDS <span style={{color:'var(--accent)'}}>42</span></span>
        <span>/</span>
        <span>SOURCES <span style={{color:'var(--accent)'}}>118</span></span>
        <span>/</span>
        <span>UPDATES/SEC <span style={{color:'var(--accent)'}}>14.2</span></span>
      </div>
    </div>
  );
}

function FooterBar() {
  const [clock, setClock] = uS(new Date());
  uE(() => {
    const iv = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="footer-bar">
      <div className="l">
        <span>terminalfeed.io</span>
        <span>v2026.04</span>
        <span>region: <b style={{color:'var(--text-dim)'}}>us-east-1</b></span>
        <span>pid: <b style={{color:'var(--text-dim)'}}>0x{Math.floor(Math.random()*1e6).toString(16)}</b></span>
      </div>
      <div>
        <span style={{color:'var(--accent)'}}>●</span> streaming · {clock.toUTCString().slice(17, 25)} UTC
      </div>
    </div>
  );
}

// --- Tile registry ---
function renderTile(kind, paused, setPaused, dragProps) {
  switch(kind) {
    case 'btc':
      return (
        <C.Tile id="btc" title="BTC·USD" dotColor="" meta={<span>SPOT · COINBASE</span>} className="col-5" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.BTCHero paused={paused}/>
        </C.Tile>
      );
    case 'markets':
      return (
        <C.Tile id="markets" title="MARKETS" meta={<span>{new Date().toLocaleTimeString('en-US',{hour12:false}).slice(0,5)} ET</span>} className="col-4" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.MarketsTable paused={paused}/>
        </C.Tile>
      );
    case 'hn':
      return (
        <C.Tile id="hn" title="HACKER·NEWS" dotColor="info" meta={<span>TOP 30</span>} className="col-4" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.HNFeed paused={paused}/>
        </C.Tile>
      );
    case 'status':
      return (
        <C.Tile id="status" title="SERVICE·STATUS" dotColor="warn" meta={<span>10 SERVICES</span>} className="col-3" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.StatusList paused={paused}/>
        </C.Tile>
      );
    case 'sensors':
      return (
        <C.Tile id="sensors" title="SENSORS·IO" meta={<span>REALTIME · 1HZ</span>} className="col-5" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.Sensors paused={paused}/>
        </C.Tile>
      );
    case 'quakes':
      return (
        <C.Tile id="quakes" title="SEISMIC·USGS" dotColor="down" meta={<span>≥ M2.0 · 1H</span>} className="col-4" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.Earthquakes paused={paused}/>
        </C.Tile>
      );
    case 'logs':
      return (
        <C.Tile id="logs" title="TERMINAL·LOG" meta={<span style={{color:'var(--accent)'}}>● STREAMING</span>} className="col-8" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.LogStream paused={paused}/>
        </C.Tile>
      );
    case 'traffic':
      return (
        <C.Tile id="traffic" title="TRAFFIC·BY·COUNTRY" dotColor="info" meta={<span>LAST 5M</span>} className="col-4" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.Bars data={window.TF_DATA.traffic}/>
        </C.Tile>
      );
    case 'poll':
      return (
        <C.Tile id="poll" title="READER·POLL" meta={<span>FAV LANGUAGE · 4,212 VOTES</span>} className="col-4" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.Bars data={window.TF_DATA.poll} variant="info"/>
        </C.Tile>
      );
    case 'globe':
      return (
        <C.Tile id="globe" title="NETWORK·GLOBE" dotColor="" meta={<span>WORLDWIDE</span>} className="col-3" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.NetworkGlobe paused={paused}/>
        </C.Tile>
      );
    case 'gauge':
      return (
        <C.Tile id="gauge" title="HEALTH" meta={<span>100% ALL OK</span>} className="col-5" paused={paused} setPaused={setPaused} {...dragProps}>
          <C.Gauge value={98.6} label="HEALTH" sublabel="ALL SYSTEMS NORMAL"/>
        </C.Tile>
      );
    default: return null;
  }
}

function Grid({ tiles, setTiles }) {
  const [pausedMap, setPausedMap] = uS({});
  const dragId = uR(null);

  const makeSetPaused = (id) => (p) => setPausedMap(m => ({ ...m, [id]: p }));

  const onDragStart = (id) => (e) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', id); } catch(_){}
  };
  const onDragOver = (id) => (e) => { e.preventDefault(); };
  const onDrop = (id) => (e) => {
    e.preventDefault();
    const from = dragId.current;
    if (!from || from === id) return;
    setTiles(prev => {
      const arr = [...prev];
      const fi = arr.indexOf(from), ti = arr.indexOf(id);
      if (fi < 0 || ti < 0) return prev;
      arr.splice(fi, 1);
      arr.splice(ti, 0, from);
      return arr;
    });
    dragId.current = null;
  };

  return (
    <div className="grid">
      {tiles.map(t => (
        <React.Fragment key={t}>
          {renderTile(t, !!pausedMap[t], makeSetPaused(t), {
            onDragStart: onDragStart(t),
            onDragOver: onDragOver(t),
            onDrop: onDrop(t),
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

// --- Tweak panel ---
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "phosphor",
  "motion": 1.0,
  "scanlines": true,
  "tickerBar": true,
  "density": "dense"
}/*EDITMODE-END*/;

function Tweaks({ open, tweaks, setTweaks, onClose }) {
  if (!open) return null;
  const push = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*'); } catch(_){}
  };
  return (
    <div className="tweaks open">
      <div className="t-hd">
        <span>⌘ TWEAKS</span>
        <span style={{cursor:'pointer', color:'var(--muted)'}} onClick={onClose}>×</span>
      </div>
      <div className="t-body">
        <label>
          DIRECTION
          <div className="seg" style={{marginTop:4}}>
            {['phosphor','amber','bloomberg'].map(d => (
              <button key={d} className={tweaks.direction === d ? 'active' : ''} onClick={() => push('direction', d)}>{d}</button>
            ))}
          </div>
        </label>
        <label>
          MOTION INTENSITY <span style={{color:'var(--text)'}}>{tweaks.motion.toFixed(1)}x</span>
          <input type="range" min="0" max="2" step="0.1" value={tweaks.motion} onChange={e => push('motion', parseFloat(e.target.value))}/>
        </label>
        <div className="toggle">
          <span>SCANLINES</span>
          <button className={tweaks.scanlines ? 'on' : ''} onClick={() => push('scanlines', !tweaks.scanlines)}>{tweaks.scanlines ? 'ON' : 'OFF'}</button>
        </div>
        <div className="toggle">
          <span>TICKER BAR</span>
          <button className={tweaks.tickerBar ? 'on' : ''} onClick={() => push('tickerBar', !tweaks.tickerBar)}>{tweaks.tickerBar ? 'ON' : 'OFF'}</button>
        </div>
        <label>
          DENSITY
          <div className="seg" style={{marginTop:4}}>
            {['calm','balanced','dense'].map(d => (
              <button key={d} className={tweaks.density === d ? 'active' : ''} onClick={() => push('density', d)}>{d}</button>
            ))}
          </div>
        </label>
      </div>
    </div>
  );
}

function App() {
  const [tweaks, setTweaks] = uS(TWEAK_DEFAULTS);
  const [editMode, setEditMode] = uS(false);
  const [tiles, setTiles] = uS(() => {
    try {
      const saved = localStorage.getItem('tf.tiles');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length) {
          // ensure all keys present
          const set = new Set(arr);
          DEFAULT_TILES.forEach(t => { if (!set.has(t)) arr.push(t); });
          return arr.filter(t => DEFAULT_TILES.includes(t));
        }
      }
    } catch(_){}
    return DEFAULT_TILES;
  });

  uE(() => {
    try { localStorage.setItem('tf.tiles', JSON.stringify(tiles)); } catch(_){}
  }, [tiles]);

  uE(() => {
    const root = document.documentElement;
    root.dataset.direction = tweaks.direction;
    root.style.setProperty('--motion', String(tweaks.motion));
    root.style.setProperty('--scan', tweaks.scanlines ? '1' : '0');
  }, [tweaks]);

  // Tweaks host protocol
  uE(() => {
    const handler = (e) => {
      const d = e.data;
      if (!d || !d.type) return;
      if (d.type === '__activate_edit_mode') setEditMode(true);
      else if (d.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch(_){}
    return () => window.removeEventListener('message', handler);
  }, []);

  const [latency, setLatency] = uS(42);
  uE(() => {
    const iv = setInterval(() => setLatency(Math.floor(28 + Math.random() * 22)), 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      <div className="ambient glow"/>
      <div className="ambient noise"/>
      <div className="ambient scanlines"/>
      <div className="screen">
        <TopBar direction={tweaks.direction} latency={latency}/>
        {tweaks.tickerBar && <HeadlineBar/>}
        <Grid tiles={tiles} setTiles={setTiles}/>
        <FooterBar/>
      </div>
      <Tweaks open={editMode} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setEditMode(false)}/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
