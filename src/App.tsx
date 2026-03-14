import { useState, useEffect, useCallback } from 'react';
import { useBtcPrice } from './hooks/useBtcPrice';
import { useBlockStream } from './hooks/useBlockStream';
import { useFearGreed } from './hooks/useFearGreed';
import { useHackerNews } from './hooks/useHackerNews';
import { useTime } from './hooks/useTime';
import { useSimStocks } from './hooks/useSimStocks';
import { useSimCrypto } from './hooks/useSimCrypto';
import { useMetals } from './hooks/useMetals';
import { useSportsScores } from './hooks/useSportsScores';
import { LegalModal } from './components/LegalModal';
import { TradingViewChart } from './components/TradingViewChart';
import { BootSequence, shouldShowBoot } from './components/BootSequence';
import { useGithubTrending } from './hooks/useGithubTrending';
import { useRedditTech } from './hooks/useRedditTech';
import { useMarketHours } from './hooks/useMarketHours';
import { useDevStatus } from './hooks/useDevStatus';
import { useCryptoGlobal } from './hooks/useCryptoGlobal';
import { useEarthquakes } from './hooks/useEarthquakes';
import { useWeather, weatherDescription } from './hooks/useWeather';
import { useSpaceLaunches } from './hooks/useSpaceLaunches';
import { useSteamGames } from './hooks/useSteamGames';
import { useRecipe } from './hooks/useRecipe';
import { useDevJoke } from './hooks/useDevJoke';
import { useStackOverflow } from './hooks/useStackOverflow';
import { useNasaApod } from './hooks/useNasaApod';
import { useBtcNetwork } from './hooks/useBtcNetwork';
import { useLayoutManager, ALL_PANELS } from './hooks/useLayoutManager';
import { PanelManager } from './components/PanelManager';
import { PanelHead } from './components/PanelHead';
import { WeatherScene } from './components/WeatherScene';
import { AIImageLab } from './components/AIImageLab';
import { DiceRoll } from './components/DiceRoll';
import { useInternetPulse } from './hooks/useInternetPulse';
import { useBluesky } from './hooks/useBluesky';
import { aiLeaderboard } from './data/aiLeaderboard';
import { getTodayInTech } from './data/techHistory';
import { getTodayTerm } from './data/techTerms';
import './App.css';

function App() {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [booting, setBooting] = useState(() => shouldShowBoot());
  const [newsFilter, setNewsFilter] = useState<string | null>(() => {
    try { return localStorage.getItem('tf_news_filter') || null; } catch { return null; }
  });
  const [showPanelManager, setShowPanelManager] = useState(false);
  const layout = useLayoutManager();
  const { data: priceData, connected: priceConnected } = useBtcPrice();
  const { connected: blockConnected } = useBlockStream();
  const fearGreed = useFearGreed();
  const stories = useHackerNews();
  const now = useTime();
  const stocks = useSimStocks();
  const crypto = useSimCrypto();
  const metals = useMetals();
  const marketHours = useMarketHours();
  const games = useSportsScores();
  const trendingRepos = useGithubTrending();
  const redditPosts = useRedditTech();
  const devStatuses = useDevStatus();
  const cryptoGlobal = useCryptoGlobal();
  const earthquakes = useEarthquakes();
  const weather = useWeather();
  const spaceLaunches = useSpaceLaunches();
  const steamGames = useSteamGames();
  const recipes = useRecipe();
  const devJoke = useDevJoke();
  const soQuestions = useStackOverflow();
  const nasaApod = useNasaApod();
  const btcNet = useBtcNetwork();
  const internetPulse = useInternetPulse();
  const bskyPosts = useBluesky();
  const todayInTech = getTodayInTech();
  const todayTerm = getTodayTerm();

  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const btcPrice = priceData?.price ?? 0;
  const btcChange = priceData?.changePercent24h ?? 0;
  const isUp = btcChange >= 0;

  // Dynamic tab title with live BTC price
  useEffect(() => {
    if (btcPrice > 0) {
      const arrow = isUp ? '\u25B2' : '\u25BC';
      document.title = `$${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${arrow} | TerminalFeed`;
    }
  }, [btcPrice, isUp]);

  // Persist news filter
  useEffect(() => {
    try {
      if (newsFilter) localStorage.setItem('tf_news_filter', newsFilter);
      else localStorage.removeItem('tf_news_filter');
    } catch {}
  }, [newsFilter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'e' || e.key === 'E') {
        layout.setIsOrganizing(!layout.isOrganizing);
      }
      if (e.key === 'c' || e.key === 'C') {
        setShowPanelManager(prev => !prev);
      }
      if (e.key === 'Escape') {
        if (layout.isOrganizing) layout.setIsOrganizing(false);
        else {
          setShowPanelManager(false);
          setLegalModal(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [layout]);

  // Ticker items: BTC + metals + stocks + crypto
  const tickerItems = [
    { symbol: 'BTC', price: btcPrice, change: btcChange },
    ...metals.filter((m) => m.price > 0).map((m) => ({ symbol: m.symbol, price: m.price, change: m.change })),
    ...stocks,
    ...crypto.filter((c) => c.price > 0),
  ];

  // Tag colors for news
  const tagColors: Record<string, string> = {
    AI: 'var(--purple)',
    BTC: 'var(--amber)',
    Markets: 'var(--blue)',
    Tech: 'var(--cyan)',
    Dev: 'var(--green)',
    Sports: 'var(--red)',
  };

  // Live and recent games (limit to 8)
  const displayGames = games.slice(0, 8);
  const liveCount = games.filter((g) => g.status === 'in').length;

  // Get current column count from window width
  const getGridCols = useCallback(() => {
    const w = window.innerWidth;
    if (w <= 700) return 1;
    if (w <= 1100) return 2;
    return Math.max(1, Math.floor(w / 320));
  }, []);

  // Panel registry — maps panel IDs to their JSX content
  // This enables dynamic rendering from panelOrder array
  const panelRegistry: Record<string, React.ReactNode> = {
    'bitcoin': (<>
      <PanelHead panelId="bitcoin" layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Bitcoin</span>
          <span className="panelTag">BTC/USD</span>
          {priceData?.source && <span className="panelTagDim">{priceData.source}</span>}
        </div>
        <div className="panelLive">
          <span className="liveDot" style={{ background: priceConnected ? 'var(--green)' : 'var(--red)' }} />
          <span className="liveText">{priceConnected ? 'LIVE' : 'CONNECTING'}</span>
        </div>
      </PanelHead>
      <div className="priceMain">
        <div>
          <div className="priceValue">${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="priceChange" style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
            {isUp ? '\u25B2' : '\u25BC'} {Math.abs(btcChange).toFixed(2)}% today
          </div>
        </div>
        {priceData && (
          <div className="priceRange">
            <span className="priceRangeLabel">24h range</span>
            <span className="priceRangeValue">
              ${priceData.low24h.toLocaleString(undefined, { maximumFractionDigits: 0 })} — ${priceData.high24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>
      <TradingViewChart symbol="BITSTAMP:BTCUSD" height={220} />
    </>),
    'crypto': (<>
      <PanelHead panelId="crypto" layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Crypto</span></div>
        <div className="panelLive"><span className="liveDot" /><span className="liveText">LIVE</span></div>
      </PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {crypto.map((c) => (
          <div key={c.symbol} className="listRow">
            <span className="listRowSymbol">{c.symbol}</span>
            <div>
              <span className="listRowPrice">${c.price < 1 ? c.price.toFixed(4) : c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`listRowChange ${c.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>{c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%</span>
            </div>
          </div>
        ))}
      </div>
    </>),
    'btc-network': (<>
      <PanelHead panelId="btc-network" layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">BTC Network</span><span className="panelTag">MEMPOOL</span></div>
        <div className="panelLive">
          <span className="liveDot" style={{ background: btcNet.connected ? 'var(--green)' : 'var(--red)' }} />
          <span className="liveText">{btcNet.connected ? 'LIVE' : 'CONNECTING'}</span>
        </div>
      </PanelHead>
      <div className="btcNetStats">
        <div className="btcNetStat"><span className="btcNetLabel">Block Height</span><span className="btcNetValue" style={{ color: 'var(--amber)' }}>{btcNet.blockHeight > 0 ? btcNet.blockHeight.toLocaleString() : '...'}</span></div>
        <div className="btcNetStat"><span className="btcNetLabel">Mempool</span><span className="btcNetValue">{btcNet.mempoolCount > 0 ? formatCompact(btcNet.mempoolCount) + ' tx' : '...'}</span></div>
        <div className="btcNetStat"><span className="btcNetLabel">Hashrate</span><span className="btcNetValue">{btcNet.hashrate > 0 ? formatHashrate(btcNet.hashrate) : '...'}</span></div>
        <div className="btcNetStat"><span className="btcNetLabel">Difficulty Adj</span><span className="btcNetValue" style={{ color: btcNet.diffChange >= 0 ? 'var(--green)' : 'var(--red)' }}>{btcNet.diffProgress > 0 ? `${btcNet.diffProgress.toFixed(1)}%` : '...'}{btcNet.diffChange !== 0 && <span style={{ fontSize: 9, marginLeft: 4 }}>({btcNet.diffChange >= 0 ? '+' : ''}{btcNet.diffChange.toFixed(1)}%)</span>}</span></div>
      </div>
      <div className="feeBar">
        <div className="feeItem"><span className="feeLabel">High</span><span className="feeValue" style={{ color: 'var(--red)' }}>{btcNet.feeFastest || '...'}</span><span className="feeSuffix">sat/vB</span></div>
        <div className="feeItem"><span className="feeLabel">Med</span><span className="feeValue" style={{ color: 'var(--amber)' }}>{btcNet.feeHalfHour || '...'}</span><span className="feeSuffix">sat/vB</span></div>
        <div className="feeItem"><span className="feeLabel">Low</span><span className="feeValue" style={{ color: 'var(--green)' }}>{btcNet.feeHour || '...'}</span><span className="feeSuffix">sat/vB</span></div>
        <div className="feeItem"><span className="feeLabel">Econ</span><span className="feeValue" style={{ color: 'var(--text-dim)' }}>{btcNet.feeEconomy || '...'}</span><span className="feeSuffix">sat/vB</span></div>
      </div>
      {btcNet.diffProgress > 0 && (<div className="diffBarWrap"><div className="diffBarLabel"><span>Epoch Progress</span><span>{btcNet.diffRemainingBlocks} blocks remain</span></div><div className="diffBar"><div className="diffBarFill" style={{ width: `${btcNet.diffProgress}%` }} /></div></div>)}
      {btcNet.recentBlocks.length > 0 && (<div className="recentBlocksWrap"><div className="recentBlocksTitle">Recent Blocks</div><div className="recentBlocksList">{btcNet.recentBlocks.map((b) => (<div key={b.height} className="recentBlockRow"><span className="rbHeight">{b.height.toLocaleString()}</span><span className="rbPool">{b.pool}</span><span className="rbTxCount">{b.txCount} tx</span><span className="rbSize">{(b.size / 1e6).toFixed(2)} MB</span><span className="rbTime">{timeAgo(b.timestamp)}</span></div>))}</div></div>)}
    </>),
    'news': (<>
      <PanelHead panelId="news" layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Tech / AI Feed</span><span className="panelTag">HN</span></div>
        <div className="panelLive"><span className="liveDot" /><span className="liveText">LIVE</span></div>
      </PanelHead>
      <div className="newsFilters">
        {['ALL', 'AI', 'BTC', 'Markets', 'Tech', 'Dev'].map((f) => (
          <button key={f} className={`newsPill ${(f === 'ALL' && !newsFilter) || newsFilter === f ? 'newsPillActive' : ''}`} onClick={() => setNewsFilter(f === 'ALL' ? null : f)}>{f}</button>
        ))}
      </div>
      <div>
        {stories.length === 0 && <div style={{ textAlign: 'center', padding: 20, fontSize: 10, color: 'var(--text-dim)' }}>loading headlines...</div>}
        {stories.filter((s) => !newsFilter || getTag(s.title) === newsFilter).map((story) => { const tag = getTag(story.title); const tc = tagColors[tag] || 'var(--text-mid)'; return (
          <a key={story.id} href={story.url || `https://news.ycombinator.com/item?id=${story.id}`} target="_blank" rel="noopener noreferrer" className="newsRow">
            <span className="newsTag" style={{ color: tc, background: `${tc}15` }}>{tag}</span>
            <span className="newsTitle">{story.title}</span>
            <span className="newsMeta">{timeAgo(story.time)}</span>
          </a>); })}
      </div>
    </>),
    'reddit': (<>
      <PanelHead panelId="reddit" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Reddit</span><span className="panelTag">TECH</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {redditPosts.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading posts...</div>}
        {redditPosts.map((post) => (<a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className="newsRow"><span className="redditScore">{formatStars(post.score)}</span><div style={{ flex: 1, minWidth: 0 }}><span className="newsTitle">{post.title}</span></div><span className="redditSub">r/{post.subreddit}</span></a>))}
      </div>
    </>),
    'github': (<>
      <PanelHead panelId="github" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">GitHub Trending</span><span className="panelTag">7D</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {trendingRepos.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading repos...</div>}
        {trendingRepos.map((repo) => (<a key={repo.fullName} href={repo.url} target="_blank" rel="noopener noreferrer" className="newsRow"><span className="ghStars">{formatStars(repo.stars)}</span><div style={{ flex: 1, minWidth: 0 }}><div className="ghRepoName">{repo.fullName}</div><div className="ghRepoDesc">{repo.description}</div></div>{repo.language && <span className="ghLang">{repo.language}</span>}</a>))}
      </div>
    </>),
    'market-hours': (<>
      <PanelHead panelId="market-hours" layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Market Hours</span><span className="panelTag">GLOBAL</span></div>
        {fearGreed && <span style={{ fontSize: 9, color: fgColor(fearGreed.value) }}>F&G {fearGreed.value}</span>}
      </PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {marketHours.map((mkt) => {
          const dotClass = mkt.isOpen ? mkt.isExtended ? 'marketExtended' : 'marketOpen' : 'marketClosed';
          const eventClass = mkt.isOpen ? mkt.isExtended ? 'marketEventExtended' : 'marketEventOpen' : 'marketEventClosed';
          const label = mkt.isOpen ? mkt.isExtended ? 'EXT' : 'OPEN' : mkt.abbr === 'BTC' ? '24/7' : 'CLOSED';
          return (<div key={mkt.abbr} className="marketHoursRow"><div className="marketHoursLeft"><span className={`marketDot ${dotClass}`} /><span className="marketAbbr">{mkt.abbr}</span></div><div className="marketHoursRight">{mkt.localTime && <span className="marketTime">{mkt.localTime}</span>}<span className={`marketEvent ${eventClass}`}>{label}</span><span className="marketCountdown">{mkt.nextEvent}</span></div></div>);
        })}
      </div>
    </>),
    'markets': (<>
      <PanelHead panelId="markets" layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Markets</span><span className="panelTag">US</span></div>
        <div className="panelLive"><span className="liveDot" /><span className="liveText">LIVE</span></div>
      </PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {metals.filter((m) => m.price > 0).map((m) => (<div key={m.symbol} className="listRow" style={{ paddingBottom: 6, marginBottom: 4, borderBottom: '1px solid var(--border)' }}><div><span className="listRowSymbol" style={{ color: 'var(--gold)' }}>{m.symbol}</span><span className="listRowName">{m.name}</span></div><div><span className="listRowPrice" style={{ color: 'var(--gold)' }}>${m.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span><span className={`listRowChange ${m.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>{m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%</span></div></div>))}
        {stocks.map((s) => (<div key={s.symbol} className="listRow"><div><span className="listRowSymbol">{s.symbol}</span><span className="listRowName">{s.name}</span></div><div><span className="listRowPrice">${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className={`listRowChange ${s.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>{s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%</span></div></div>))}
      </div>
    </>),
    'scores': (<>
      <PanelHead panelId="scores" layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Scores</span><span className="panelTag">ESPN</span></div>
        {liveCount > 0 && <div className="panelLive"><span className="liveDot" style={{ background: 'var(--red)' }} /><span className="liveText">{liveCount} LIVE</span></div>}
      </PanelHead>
      <div>
        {displayGames.length === 0 && <div style={{ textAlign: 'center', padding: 20, fontSize: 10, color: 'var(--text-dim)' }}>loading scores...</div>}
        {displayGames.map((game) => (<div key={game.id} className={`scoreRow ${game.status === 'in' ? 'scoreRowLive' : ''}`}>
          <span className="scoreLeague">{game.league}</span>
          <div className="scoreTeams"><span className="scoreTeam"><span className="scoreAbbr">{game.awayAbbr}</span><span className={`scoreVal ${game.status === 'in' ? 'scoreLive' : ''}`}>{game.awayScore}</span></span><span className="scoreAt">@</span><span className="scoreTeam"><span className="scoreAbbr">{game.homeAbbr}</span><span className={`scoreVal ${game.status === 'in' ? 'scoreLive' : ''}`}>{game.homeScore}</span></span></div>
          <div className="scoreRight">
            <span className={`scoreStatus ${game.status === 'in' ? 'scoreStatusLive' : ''}`}>{game.statusDetail}</span>
            {game.status === 'in' && game.situation && <div className="scoreSituation">{game.situation}</div>}
            {game.status === 'in' && game.lastPlay && <div className="scoreLastPlay">{game.lastPlay}</div>}
          </div>
        </div>))}
      </div>
    </>),
    'dev-status': (<>
      <PanelHead panelId="dev-status" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Status</span><span className="panelTag">DEV/OPS</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {devStatuses.map((svc) => { const color = svc.indicator === 'none' ? 'var(--green)' : svc.indicator === 'minor' ? 'var(--amber)' : svc.indicator === 'major' ? 'var(--amber)' : svc.indicator === 'critical' ? 'var(--red)' : 'var(--text-dim)'; return (<div key={svc.name} className="statusRow"><div className="statusLeft"><span className="statusDot" style={{ background: color, boxShadow: `0 0 4px ${color}` }} /><span className="statusName">{svc.name}</span></div><span className="statusDesc" style={{ color }}>{svc.indicator === 'none' ? 'Operational' : svc.indicator === 'unknown' ? 'Checking...' : svc.description}</span></div>); })}
      </div>
    </>),
    'crypto-global': (<>
      <PanelHead panelId="crypto-global" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Crypto Market</span><span className="panelTag">GLOBAL</span></div></PanelHead>
      {cryptoGlobal ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="cryptoGlobalRow"><span className="cryptoGlobalLabel">Total Cap</span><div><span className="cryptoGlobalValue">${formatCompact(cryptoGlobal.totalMarketCap)}</span><span className={`listRowChange ${cryptoGlobal.marketCapChange24h >= 0 ? 'tickerUp' : 'tickerDown'}`}>{cryptoGlobal.marketCapChange24h >= 0 ? '+' : ''}{cryptoGlobal.marketCapChange24h.toFixed(1)}%</span></div></div>
        <div className="cryptoGlobalRow"><span className="cryptoGlobalLabel">BTC Dom</span><span className="cryptoGlobalValue">{cryptoGlobal.btcDominance.toFixed(1)}%</span></div>
        <div className="cryptoGlobalRow"><span className="cryptoGlobalLabel">ETH Dom</span><span className="cryptoGlobalValue">{cryptoGlobal.ethDominance.toFixed(1)}%</span></div>
        <div className="cryptoGlobalRow"><span className="cryptoGlobalLabel">24h Vol</span><span className="cryptoGlobalValue">${formatCompact(cryptoGlobal.totalVolume24h)}</span></div>
        <div className="cryptoGlobalRow"><span className="cryptoGlobalLabel">Active Coins</span><span className="cryptoGlobalValue">{cryptoGlobal.activeCryptos.toLocaleString()}</span></div>
        <div className="domBar"><div className="domSegment domBtc" style={{ width: `${cryptoGlobal.btcDominance}%` }}>BTC</div><div className="domSegment domEth" style={{ width: `${cryptoGlobal.ethDominance}%` }}>ETH</div><div className="domSegment domOther" style={{ width: `${Math.max(0, 100 - cryptoGlobal.btcDominance - cryptoGlobal.ethDominance)}%` }}>Other</div></div>
      </div>) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading...</div>}
    </>),
    'weather': (<>
      <PanelHead panelId="weather" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Weather</span>{weather && <span className="panelTag">{weather.city.toUpperCase()}</span>}</div></PanelHead>
      {weather ? (<div className="weatherContent"><WeatherScene weatherCode={weather.weatherCode} /><div className="weatherOverlay"><div className="weatherTemp">{weather.temperature}°F</div><div className="weatherDesc">{weatherDescription(weather.weatherCode).desc}</div><div className="weatherDetails"><span>Wind: {weather.windSpeed} mph</span><span>Humidity: {weather.humidity}%</span></div></div></div>) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>detecting location...</div>}
    </>),
    'seismic': (<>
      <PanelHead panelId="seismic" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Seismic</span><span className="panelTag">24H</span></div><span style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.5px' }}>USGS M2.5+</span></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {earthquakes.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading quakes...</div>}
        {earthquakes.map((q) => { const mc = q.magnitude >= 5 ? 'var(--red)' : q.magnitude >= 4 ? 'var(--amber)' : 'var(--text-mid)'; return (<a key={q.id} href={q.url} target="_blank" rel="noopener noreferrer" className="quakeRow"><span className="quakeMag" style={{ color: mc }}>{q.magnitude.toFixed(1)}</span><span className="quakePlace">{q.place}</span><span className="quakeTime">{timeAgo(Math.floor(q.time / 1000))}</span></a>); })}
      </div>
    </>),
    'launches': (<>
      <PanelHead panelId="launches" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Launches</span><span className="panelTag">SPACE</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {spaceLaunches.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading launches...</div>}
        {spaceLaunches.map((l) => { const isToday = l.dateTs > 0 && l.dateTs - Date.now() < 86400000 && l.dateTs > Date.now(); const isSoon = l.dateTs > 0 && l.dateTs - Date.now() < 86400000 * 3 && l.dateTs > Date.now(); const dc = isToday ? 'var(--green)' : isSoon ? 'var(--amber)' : 'var(--text-dim)'; return (<div key={l.id} className="launchRow"><div className="launchInfo"><span className="launchProvider">{l.provider}</span><span className="launchName">{l.name}</span></div><div className="launchMeta"><span className="launchDate" style={{ color: dc }}>{l.date}</span><span className="launchLoc">{l.location}</span></div></div>); })}
      </div>
    </>),
    'steam': (<>
      <PanelHead panelId="steam" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Steam</span><span className="panelTag">LIVE</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {steamGames.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading games...</div>}
        {steamGames.map((g) => (<div key={g.appId} className="steamRow"><span className="steamName">{g.name}</span><span className="steamPlayers">{formatPlayerCount(g.playerCount)} playing</span></div>))}
      </div>
    </>),
    'stackoverflow': (<>
      <PanelHead panelId="stackoverflow" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Stack Overflow</span><span className="panelTag">HOT</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {soQuestions.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading questions...</div>}
        {soQuestions.map((q) => (<a key={q.id} href={q.link} target="_blank" rel="noopener noreferrer" className="newsRow"><span className="soScore">{q.score}</span><div style={{ flex: 1, minWidth: 0 }}><div className="newsTitle">{q.title}</div><div className="soTags">{q.tags.join(' · ')}</div></div><span className="soAnswers">{q.answerCount}A</span></a>))}
      </div>
    </>),
    'nasa': (<>
      <PanelHead panelId="nasa" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">NASA</span><span className="panelTag">APOD</span></div></PanelHead>
      {nasaApod ? (<div className="apodContent">{nasaApod.mediaType === 'image' && <a href={nasaApod.hdurl || nasaApod.url} target="_blank" rel="noopener noreferrer"><img src={nasaApod.url} alt={nasaApod.title} className="apodImage" loading="lazy" /></a>}<div className="apodTitle">{nasaApod.title}</div>{nasaApod.copyright && <div className="apodCopy">{nasaApod.copyright}</div>}<div className="apodDesc">{nasaApod.explanation.slice(0, 120)}...</div></div>) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading...</div>}
    </>),
    'quick-stats': (<>
      <PanelHead panelId="quick-stats" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Quick Stats</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {fearGreed && <div className="qsRow"><span className="qsLabel">Fear & Greed</span><span className="qsValue" style={{ color: fgColor(fearGreed.value) }}>{fearGreed.value} {fearGreed.label}</span></div>}
        {cryptoGlobal && <><div className="qsRow"><span className="qsLabel">BTC Dominance</span><span className="qsValue">{cryptoGlobal.btcDominance.toFixed(1)}%</span></div><div className="qsRow"><span className="qsLabel">Crypto Cap</span><span className="qsValue">${formatCompact(cryptoGlobal.totalMarketCap)}</span></div></>}
        {metals.filter(m => m.price > 0).map(m => <div key={m.symbol} className="qsRow"><span className="qsLabel" style={{ color: 'var(--gold)' }}>{m.symbol}</span><span className="qsValue" style={{ color: 'var(--gold)' }}>${m.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>)}
        {weather && <div className="qsRow"><span className="qsLabel">Weather</span><span className="qsValue">{weather.temperature}°F {weatherDescription(weather.weatherCode).icon} {weather.city}</span></div>}
      </div>
    </>),
    'recipe': (<>
      <PanelHead panelId="recipe" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Tonight</span><span className="panelTag">RECIPES OF THE DAY</span></div></PanelHead>
      {recipes.length > 0 ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{recipes.map((r, i) => (<a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="recipeContent"><img src={r.thumbnail} alt={r.name} className="recipeThumbnail" loading="lazy" /><div className="recipeInfo"><div className="recipeName">{r.name}</div><div className="recipeMeta">{r.area} · {r.category}</div></div></a>))}</div>) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading recipes...</div>}
    </>),
    'daily-learn': (<>
      <PanelHead panelId="daily-learn" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Daily</span><span className="panelTag">LEARN</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div><div className="dailySectionTitle">On This Day</div>{todayInTech.map((evt, i) => <div key={i} className="historyRow"><span className="historyYear">{evt.year}</span><span className="historyEvent">{evt.event}</span></div>)}</div>
        <div><div className="dailySectionTitle">Term of the Day</div><div className="termWord">{todayTerm.term}</div><div className="termDef">{todayTerm.definition}</div></div>
      </div>
    </>),
    'ai-leaderboard': (<>
      <PanelHead panelId="ai-leaderboard" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">AI Leaderboard</span><span className="panelTag">ELO</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {aiLeaderboard.map((m) => (
          <div key={m.rank} className="listRow">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: m.rank <= 3 ? 'var(--gold)' : 'var(--text-dim)', fontWeight: 700, minWidth: 16 }}>#{m.rank}</span>
              <div>
                <span className="listRowSymbol">{m.name}</span>
                <span className="listRowName">{m.company}</span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 600 }}>{m.elo}</span>
          </div>
        ))}
      </div>
    </>),
    'bluesky': (<>
      <PanelHead panelId="bluesky" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Bluesky</span><span className="panelTag">LIVE</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {bskyPosts.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading posts...</div>}
        {bskyPosts.map((p, i) => (
          <div key={i} className="newsRow" style={{ cursor: 'default' }}>
            <span className="bskyAuthor">@{p.handle.split('.')[0]}</span>
            <span className="newsTitle">{p.text}</span>
            <span className="newsMeta">{p.createdAt ? timeAgo(Math.floor(new Date(p.createdAt).getTime() / 1000)) : ''}</span>
          </div>
        ))}
      </div>
    </>),
    'internet-pulse': (<>
      <PanelHead panelId="internet-pulse" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Internet Pulse</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {internetPulse.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>pinging...</div>}
        {internetPulse.map((p) => {
          const color = p.latency < 0 ? 'var(--red)' : p.latency < 50 ? 'var(--green)' : p.latency < 150 ? 'var(--amber)' : 'var(--red)';
          const pct = p.latency < 0 ? 0 : Math.min(100, (p.latency / 200) * 100);
          return (
            <div key={p.name} className="pulseRow">
              <span className="pulseName">{p.name}</span>
              <div className="pulseBar"><div className="pulseFill" style={{ width: `${pct}%`, background: color }} /></div>
              <span className="pulseMs" style={{ color }}>{p.latency < 0 ? 'FAIL' : `${p.latency}ms`}</span>
            </div>
          );
        })}
      </div>
    </>),
    'ai-image': (<><PanelHead panelId="ai-image" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">AI Image Lab</span><span className="panelTag">FLUX</span></div></PanelHead><AIImageLab /></>),
    'dice': (<><PanelHead panelId="dice" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Dice Roll</span></div></PanelHead><DiceRoll /></>),
    'support': (<>
      <PanelHead panelId="support" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Support</span></div></PanelHead>
      <div className="adPlaceholder"><div className="adLabel">Ad space</div><div className="adSize">300x250</div></div>
      <div className="donateLabel">Donate BTC</div><div className="donateAddr">3GLimw2rSrne3hfrsanjoVxrM2Dwsbmkdy</div><div className="donateNote">Lightning / on-chain accepted</div>
    </>),
  };

  if (booting) {
    return <BootSequence onComplete={() => setBooting(false)} />;
  }

  return (
    <div className="app">
      {/* ── Top Bar ── */}
      <div className="topBar">
        <div className="topBarLeft">
          <span className="logoIcon">{'>'}_</span>
          <span className="logoText">TERMINALFEED</span>
          <span className="logoDot">.io</span>
          <span className="logoCursor" />
        </div>
        <div className="topBarRight">
          <button
            className={`lockBtn ${layout.isOrganizing ? 'lockBtnActive' : ''}`}
            onClick={() => layout.setIsOrganizing(!layout.isOrganizing)}
            title={layout.isOrganizing ? 'Lock layout (E)' : 'Organize panels (E)'}
          >
            {layout.isOrganizing ? 'Organize' : 'Locked'}
          </button>
          <button className="customizeBtn" onClick={() => setShowPanelManager(true)}>Settings</button>
          {layout.isOrganizing && (
            <span className="organizeHint">arrows to rearrange · E to lock</span>
          )}
          {fearGreed && (
            <span className={`moodIndicator ${fearGreed.value >= 55 ? 'moodBull' : fearGreed.value <= 35 ? 'moodBear' : 'moodNeutral'}`}>
              {fearGreed.value >= 55 ? 'Bullish' : fearGreed.value <= 35 ? 'Bearish' : 'Neutral'}
            </span>
          )}
          <span className="topBarDate">{dateStr}</span>
          <span className="topBarTime">{timeStr}</span>
        </div>
      </div>

      {/* ── Ticker Bar ── */}
      <div className="tickerBar">
        <div className="tickerTrack">
          {[...tickerItems, ...tickerItems].map((s, i) => (
            <span key={i} className="tickerItem">
              <span className="tickerSymbol">{s.symbol}</span>
              <span className="tickerPrice">
                ${s.price < 1
                  ? s.price.toFixed(4)
                  : s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`tickerChange ${s.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>
                {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main Grid — rendered dynamically from panelOrder ── */}
      <div className={`grid ${layout.isOrganizing ? 'gridOrganizing' : ''}`}>
        {layout.panelOrder.filter(id => layout.isVisible(id)).map(id => {
          const panelDef = ALL_PANELS.find(p => p.id === id);
          if (!panelDef) return null;
          const span = panelDef.defaultSpan > 1 ? 'spanCol2' : '';
          const content = panelRegistry[id as keyof typeof panelRegistry];
          if (!content) return null;
          return (
            <div key={id} className={`panel ${span}`}>
              {content}
            </div>
          );
        })}
      </div>

      {/* ── Hidden Panels Shelf (Organize Mode Only) ── */}
      {layout.isOrganizing && layout.hiddenPanels.size > 0 && (
        <div className="hiddenShelf">
          <span className="hiddenShelfLabel">HIDDEN PANELS</span>
          <div className="hiddenShelfItems">
            {Array.from(layout.hiddenPanels).map(id => {
              const panel = ALL_PANELS.find(p => p.id === id);
              if (!panel) return null;
              return (
                <button
                  key={id}
                  className="hiddenShelfItem"
                  onClick={() => layout.toggleHidden(id)}
                >
                  + {panel.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dev Joke Strip ── */}
      {devJoke && (
        <div className="jokeStrip">
          <span className="jokePrefix">&gt;</span>
          <span className="jokeText">{devJoke}</span>
        </div>
      )}

      {/* ── Bottom Bar ── */}
      <div className="bottomBar">
        <div className="bottomBarLeft">
          <img src="/images/Ripper.jpg" alt="Ripper" className="ripperLogo" />
          <span className="ripperCredit">built by RipperMercs</span>
          <span className="bottomBarDivider">&middot;</span>
          <span>terminalfeed.io</span>
          <span className="bottomBarDivider">&middot;</span>
          <span>Not financial advice</span>
          <span className="bottomBarDivider">&middot;</span>
          <button className="footerLink" onClick={() => setLegalModal('privacy')}>Privacy</button>
          <button className="footerLink" onClick={() => setLegalModal('terms')}>Terms</button>
          <span className="bottomBarDivider">&middot;</span>
          <a href="mailto:hello@terminalfeed.io" className="footerLink">Contact</a>
          <a href="mailto:feedback@terminalfeed.io" className="footerLink">Feedback</a>
          <a href="mailto:advertise@terminalfeed.io" className="footerLink">Advertise</a>
        </div>
        <div className="bottomBarStatus">
          <span className="bottomBarDot" style={{
            background: (priceConnected || blockConnected) ? 'var(--green)' : 'var(--red)',
          }} />
          <span>{(priceConnected || blockConnected) ? 'All systems operational' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Layout Toast */}
      {layout.toastMessage && (
        <div className="layoutToast">{layout.toastMessage}</div>
      )}

      {/* Panel Manager */}
      {showPanelManager && (
        <PanelManager layout={layout} onClose={() => setShowPanelManager(false)} />
      )}

      {/* Legal Modals */}
      {legalModal && (
        <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
      )}
    </div>
  );
}

/* ── Inline helpers ── */

function fgColor(value: number): string {
  if (value <= 25) return 'var(--red)';
  if (value <= 45) return 'var(--amber)';
  if (value <= 55) return 'var(--gold)';
  if (value <= 75) return 'var(--green)';
  return 'var(--cyan)';
}

function getTag(title: string): string {
  if (/\b(ai|gpt|llm|claude|openai|anthropic|gemini|mistral|transformer|neural|agi|deep.?learn|machine.?learn)\b/i.test(title)) return 'AI';
  if (/\b(bitcoin|btc|crypto|blockchain|mining|satoshi|lightning)\b/i.test(title)) return 'BTC';
  if (/\b(stock|market|fed|rate|earnings|s&p|nasdaq|dow|etf)\b/i.test(title)) return 'Markets';
  if (/\b(gpu|nvidia|amd|chip|hardware|cpu)\b/i.test(title)) return 'Tech';
  return 'Dev';
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatCompact(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return n.toLocaleString();
}

function formatHashrate(h: number): string {
  if (h >= 1e18) return `${(h / 1e18).toFixed(1)} EH/s`;
  if (h >= 1e15) return `${(h / 1e15).toFixed(1)} PH/s`;
  if (h >= 1e12) return `${(h / 1e12).toFixed(1)} TH/s`;
  return `${(h / 1e9).toFixed(1)} GH/s`;
}

function formatPlayerCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

export default App;
