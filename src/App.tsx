import { useState, useEffect, useCallback, useRef } from 'react';
import { useBtcPrice } from './hooks/useBtcPrice';
import { useBlockStream } from './hooks/useBlockStream';
import { useFearGreed } from './hooks/useFearGreed';
import { useHackerNews } from './hooks/useHackerNews';
import { useTime } from './hooks/useTime';
import { useSimStocks, INDICES } from './hooks/useSimStocks';
import { useSimCrypto } from './hooks/useSimCrypto';
import { useMetals } from './hooks/useMetals';
import { useSportsScores } from './hooks/useSportsScores';
import { LegalModal } from './components/LegalModal';
import { TradingViewChart } from './components/TradingViewChart';
import { useGithubTrending } from './hooks/useGithubTrending';
import { useRedditTech } from './hooks/useRedditTech';
import { useMarketHours } from './hooks/useMarketHours';
import { useDevStatus } from './hooks/useDevStatus';
import { useCryptoGlobal } from './hooks/useCryptoGlobal';
import { useEarthquakes } from './hooks/useEarthquakes';
import { useWeather, weatherDescription } from './hooks/useWeather';
import { useSpaceLaunches } from './hooks/useSpaceLaunches';
import { useRecipe } from './hooks/useRecipe';
import { useDevJoke } from './hooks/useDevJoke';
import { useStackOverflow } from './hooks/useStackOverflow';
import { useBtcNetwork } from './hooks/useBtcNetwork';
import { useLayoutManager, ALL_PANELS } from './hooks/useLayoutManager';
import { PanelManager } from './components/PanelManager';
import { PanelHead } from './components/PanelHead';
import { WeatherScene } from './components/WeatherScene';
import { useInternetPulse } from './hooks/useInternetPulse';
import { usePanelHealth } from './hooks/usePanelHealth';
import { useTerminalsOnline } from './hooks/useTerminalsOnline';
import { usePodcasts } from './hooks/usePodcasts';
import { uapSightings, getShapeStats } from './data/uapSightings';
import { useBluesky } from './hooks/useBluesky';
import { usePanelHeat } from './hooks/usePanelHeat';
import { useHNShowAsk } from './hooks/useHackerNewsTop';
import { useForexHeatmap } from './hooks/useForexHeatmap';
import { useWikipedia } from './hooks/useWikipedia';
import { useSolarWeather } from './hooks/useSolarWeather';
import { useProductHunt } from './hooks/useProductHunt';
import { useFunFact } from './hooks/useFunFact';
import { useWikipediaLive } from './hooks/useWikipediaLive';
import { useGDACS } from './hooks/useGDACS';
import { useGithubEvents } from './hooks/useGithubEvents';
import { useTrendingBooks } from './hooks/useTrendingBooks';
import { useWhaleWatch } from './hooks/useWhaleWatch';
import { useDonations } from './hooks/useDonations';
import { useWorldClock } from './hooks/useWorldClock';
import { aiLeaderboard } from './data/aiLeaderboard';
import { getTodayInTech } from './data/techHistory';
import { getTodayTerm } from './data/techTerms';
import { getRandomWireQuote } from './data/wireQuotes';
import './App.css';

function App() {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
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
  const recipes = useRecipe();
  const devJoke = useDevJoke();
  const soQuestions = useStackOverflow();
  const btcNet = useBtcNetwork();
  const internetPulse = useInternetPulse();
  const terminalsOnline = useTerminalsOnline();
  const panelHealth = usePanelHealth();
  const hnCommunity = useHNShowAsk();
  const worldClocks = useWorldClock();
  const forexRates = useForexHeatmap();
  const wikiArticle = useWikipedia();
  const solarWeather = useSolarWeather();
  const phProducts = useProductHunt();
  const funFact = useFunFact();
  const { edits: wikiEdits, editsPerMin: wikiEPM } = useWikipediaLive();
  const disasterAlerts = useGDACS();
  const ghEvents = useGithubEvents();
  const trendingBooks = useTrendingBooks();
  const donationStats = useDonations();
  const whaleTxs = useWhaleWatch();
  const podcastEpisodes = usePodcasts();
  const uapShapeStats = getShapeStats();
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
  const adminBuffer = useRef('');
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

      // Admin: type "admin-save-layout" to export current layout as default
      adminBuffer.current += e.key.toLowerCase();
      if (adminBuffer.current.includes('admin-save-layout')) {
        const exportData = {
          panelOrder: layout.panelOrder,
          hiddenPanels: Array.from(layout.hiddenPanels),
          collapsedPanels: Array.from(layout.collapsedPanels),
        };
        const json = JSON.stringify(exportData, null, 2);
        navigator.clipboard.writeText(json).catch(() => {});
        console.log('DEFAULT LAYOUT:', json);
        adminBuffer.current = '';
      }
      clearTimeout(window.setTimeout(() => { adminBuffer.current = ''; }, 3000));
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

  const liveCount = games.filter((g) => g.status === 'in').length;

  // Report panel health — auto-hide panels with failed APIs
  useEffect(() => {
    if (btcPrice > 0) panelHealth.reportData('bitcoin');
    if (stocks.length > 0) panelHealth.reportData('markets');
    if (crypto.length > 0) panelHealth.reportData('crypto');
    if (stories.length > 0) panelHealth.reportData('news');
    if (redditPosts.length > 0) panelHealth.reportData('reddit');
    if (trendingRepos.length > 0) panelHealth.reportData('github');
    if (soQuestions.length > 0) panelHealth.reportData('stackoverflow');
    if (earthquakes.length > 0) panelHealth.reportData('seismic');
    if (weather) panelHealth.reportData('weather');
    if (spaceLaunches.length > 0) panelHealth.reportData('launches');
    if (devStatuses.length > 0) panelHealth.reportData('dev-status');
    if (cryptoGlobal) panelHealth.reportData('crypto-global');
    if (btcNet.blockHeight > 0) panelHealth.reportData('btc-network');
    if (marketHours.length > 0) panelHealth.reportData('market-hours');
    if (podcastEpisodes.length > 0) panelHealth.reportData('podcasts');
    if (bskyPosts.length > 0) panelHealth.reportData('bluesky');
    if (internetPulse.length > 0) panelHealth.reportData('internet-pulse');
    if (recipes.length > 0) panelHealth.reportData('recipe');
  });

  // Smart auto-curation: calculate panel heat scores for new visitors
  const panelHeat = usePanelHeat({
    btcChangeAbs: Math.abs(btcChange),
    liveGamesCount: liveCount,
    devStatusIssues: devStatuses.filter(s => s.indicator !== 'none' && s.indicator !== 'unknown').length,
    earthquakeMag5: earthquakes.some(q => q.magnitude >= 5),
    fearGreedValue: fearGreed?.value ?? 50,
  });

  // Apply heat ordering for new visitors (won't touch saved layouts)
  useEffect(() => {
    if (panelHeat.length > 0) layout.applyHeatOrder(panelHeat);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelHeat.length > 0]);

  // Scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

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
          <span className="liveDot" style={{ background: btcPrice > 0 ? 'var(--green)' : 'var(--red)' }} />
          <span className="liveText">{btcPrice > 0 ? 'LIVE' : 'LOADING'}</span>
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
    'crypto': (() => {
      const btcEth = crypto.filter(c => ['BTC', 'ETH'].includes(c.symbol));
      const others = crypto.filter(c => !['BTC', 'ETH'].includes(c.symbol) && c.price > 0);
      const cryptoGainers = [...others].filter(c => c.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
      const cryptoLosers = [...others].filter(c => c.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
      return (<>
        <PanelHead panelId="crypto" layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Crypto</span></div>
          <div className="panelLive"><span className="liveDot" /><span className="liveText">LIVE</span></div>
        </PanelHead>
        <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Top Movers</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {cryptoGainers.map(c => (<div key={c.symbol} className="listRow"><div><span style={{ color: 'var(--green)', marginRight: 4, fontSize: 9 }}>▲</span><span className="listRowSymbol">{c.symbol}</span></div><div><span className="listRowPrice">${c.price < 1 ? c.price.toFixed(4) : c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className="listRowChange tickerUp" style={{ fontWeight: 600 }}>+{c.change.toFixed(2)}%</span>{c.change > 5 && <span style={{ marginLeft: 3, fontSize: 10 }}>🔥</span>}</div></div>))}
          {cryptoLosers.map(c => (<div key={c.symbol} className="listRow"><div><span style={{ color: 'var(--red)', marginRight: 4, fontSize: 9 }}>▼</span><span className="listRowSymbol">{c.symbol}</span></div><div><span className="listRowPrice">${c.price < 1 ? c.price.toFixed(4) : c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className="listRowChange tickerDown" style={{ fontWeight: 600 }}>{c.change.toFixed(2)}%</span>{c.change < -5 && <span style={{ marginLeft: 3, fontSize: 10 }}>💀</span>}</div></div>))}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0', paddingTop: 6 }}>
          <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Market</div>
          {btcEth.map(c => (<div key={c.symbol} className="listRow"><div><span className="listRowSymbol">{c.symbol}</span></div><div><span className="listRowPrice">${c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className={`listRowChange ${c.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>{c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%</span></div></div>))}
          {cryptoGlobal && <div className="listRow"><div><span className="listRowSymbol" style={{ fontSize: 9 }}>Total Cap</span></div><span style={{ fontSize: 10, color: 'var(--text-mid)' }}>${formatCompact(cryptoGlobal.totalMarketCap)}</span></div>}
        </div>
      </>);
    })(),
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
    'markets': (() => {
      const indicesData = stocks.filter(s => INDICES.includes(s.symbol));
      const movers = stocks.filter(s => !INDICES.includes(s.symbol) && s.price > 0 && s.change !== 0);
      const gainers = [...movers].filter(s => s.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
      const losers = [...movers].filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
      return (<>
        <PanelHead panelId="markets" layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Markets</span><span className="panelTag">US</span></div>
          <div className="panelLive"><span className="liveDot" /><span className="liveText">LIVE</span></div>
        </PanelHead>
        <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Top Movers</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {gainers.map(s => (<div key={s.symbol} className="listRow"><div><span style={{ color: 'var(--green)', marginRight: 4, fontSize: 9 }}>▲</span><span className="listRowSymbol">{s.symbol}</span><span className="listRowName">{s.name}</span></div><div><span className="listRowPrice">${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className="listRowChange tickerUp" style={{ fontWeight: 600 }}>+{s.change.toFixed(2)}%</span>{s.change > 3 && <span style={{ marginLeft: 3, fontSize: 10 }}>🔥</span>}</div></div>))}
          {losers.map(s => (<div key={s.symbol} className="listRow"><div><span style={{ color: 'var(--red)', marginRight: 4, fontSize: 9 }}>▼</span><span className="listRowSymbol">{s.symbol}</span><span className="listRowName">{s.name}</span></div><div><span className="listRowPrice">${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className="listRowChange tickerDown" style={{ fontWeight: 600 }}>{s.change.toFixed(2)}%</span>{s.change < -3 && <span style={{ marginLeft: 3, fontSize: 10 }}>💀</span>}</div></div>))}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0', paddingTop: 6 }}>
          <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Indices</div>
          {indicesData.map(s => (<div key={s.symbol} className="listRow"><div><span className="listRowSymbol">{s.symbol}</span><span className="listRowName">{s.name}</span></div><div><span className="listRowPrice">${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className={`listRowChange ${s.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>{s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%</span></div></div>))}
          {metals.filter(m => m.price > 0).map(m => (<div key={m.symbol} className="listRow"><div><span className="listRowSymbol" style={{ color: 'var(--gold)' }}>{m.symbol}</span><span className="listRowName">{m.name}</span></div><div><span className="listRowPrice" style={{ color: 'var(--gold)' }}>${m.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span><span className={`listRowChange ${m.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>{m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%</span></div></div>))}
        </div>
      </>);
    })(),
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
    'stackoverflow': (<>
      <PanelHead panelId="stackoverflow" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Stack Overflow</span><span className="panelTag">HOT</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {soQuestions.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading questions...</div>}
        {soQuestions.map((q) => (<a key={q.id} href={q.link} target="_blank" rel="noopener noreferrer" className="newsRow"><span className="soScore">{q.score}</span><div style={{ flex: 1, minWidth: 0 }}><div className="newsTitle">{q.title}</div><div className="soTags">{q.tags.join(' · ')}</div></div><span className="soAnswers">{q.answerCount}A</span></a>))}
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
    'podcasts': (<>
      <PanelHead panelId="podcasts" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Podcasts</span><span className="panelTag">LATEST</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {podcastEpisodes.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading episodes...</div>}
        {podcastEpisodes.map((ep, i) => (
          <a key={i} href={ep.link} target="_blank" rel="noopener noreferrer" className="newsRow">
            <span className="podShow">{ep.show}</span>
            <span className="newsTitle">{ep.title}</span>
            <span className="newsMeta">{ep.pubDate ? timeAgo(Math.floor(new Date(ep.pubDate).getTime() / 1000)) : ''}</span>
          </a>
        ))}
      </div>
    </>),
    'uap': (<>
      <PanelHead panelId="uap" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">UAP Sightings</span><span className="panelTag">NUFORC</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {uapSightings.slice(0, 6).map((s, i) => (
          <div key={i} className="uapRow">
            <div className="uapTop">
              <span className="uapShape">{s.shape}</span>
              <span className="uapLoc">{s.city}, {s.state}</span>
              <span className="newsMeta">{timeAgo(Math.floor(new Date(s.date).getTime() / 1000))}</span>
            </div>
            <div className="uapDesc">{s.summary}</div>
          </div>
        ))}
        <div className="uapStats">
          {uapShapeStats.map(s => (
            <span key={s.shape} className="uapStatItem">{s.shape} {s.pct}%</span>
          ))}
        </div>
        <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>source: NUFORC · nuforc.org</div>
      </div>
    </>),
    'whale-watch': (<>
      <PanelHead panelId="whale-watch" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Whale Watch</span><span className="panelTag">MEMPOOL</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {whaleTxs.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>scanning mempool...</div>}
        {whaleTxs.map((tx) => {
          const isHuge = tx.btc >= 10;
          const usdValue = tx.btc * btcPrice;
          return (
            <a key={tx.txid} href={`https://mempool.space/tx/${tx.txid}`} target="_blank" rel="noopener noreferrer" className="newsRow">
              <span style={{ fontSize: 12, flexShrink: 0 }}>🐋</span>
              <span style={{ fontSize: 11, color: isHuge ? 'var(--gold)' : 'var(--amber)', fontWeight: 700, minWidth: 75 }}>{tx.btc.toFixed(4)} BTC</span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', flex: 1 }}>${usdValue >= 1e6 ? (usdValue / 1e6).toFixed(1) + 'M' : usdValue >= 1e3 ? (usdValue / 1e3).toFixed(0) + 'K' : usdValue.toFixed(0)}</span>
              <span className="newsMeta">{timeAgo(Math.floor(tx.time / 1000))}</span>
            </a>
          );
        })}
      </div>
    </>),
    'wiki-live': (<>
      <PanelHead panelId="wiki-live" layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Wikipedia</span><span className="panelTag">LIVE EDITS</span></div>
        <span style={{ fontSize: 9, color: 'var(--cyan)' }}>{wikiEPM > 0 ? `${wikiEPM}/min` : ''}</span>
      </PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {wikiEdits.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>connecting to stream...</div>}
        {wikiEdits.map((e, i) => (
          <a key={`${e.title}-${i}`} href={e.url} target="_blank" rel="noopener noreferrer" className="newsRow" style={{ animationDelay: `${i * 0.05}s` }}>
            <span style={{ fontSize: 8, color: e.type === 'new' ? 'var(--cyan)' : 'var(--text-dim)', fontWeight: 600, minWidth: 28, flexShrink: 0 }}>{e.type === 'new' ? 'NEW' : 'EDIT'}</span>
            <span className="newsTitle">{e.title}</span>
            <span style={{ fontSize: 9, color: e.sizeDiff >= 0 ? 'var(--green)' : 'var(--red)', flexShrink: 0, fontWeight: 500 }}>{e.sizeDiff >= 0 ? '+' : ''}{e.sizeDiff}B</span>
          </a>
        ))}
      </div>
    </>),
    'disasters': (<>
      <PanelHead panelId="disasters" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Global Alerts</span><span className="panelTag">GDACS</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {disasterAlerts.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--green)' }}>No active alerts</div>}
        {disasterAlerts.map((a, i) => {
          const color = a.alertLevel === 'Red' ? 'var(--red)' : a.alertLevel === 'Orange' ? 'var(--amber)' : 'var(--text-dim)';
          return (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="newsRow">
              <span style={{ fontSize: 8, color, fontWeight: 700, background: `${color}15`, padding: '1px 4px', borderRadius: 2, flexShrink: 0 }}>{a.alertLevel.toUpperCase()}</span>
              <span className="newsTitle">{a.title}</span>
              <span className="newsMeta">{a.date ? timeAgo(Math.floor(new Date(a.date).getTime() / 1000)) : ''}</span>
            </a>
          );
        })}
      </div>
    </>),
    'gh-events': (<>
      <PanelHead panelId="gh-events" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">GitHub</span><span className="panelTag">LIVE</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ghEvents.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading...</div>}
        {ghEvents.map((e) => (
          <div key={e.id} className="newsRow" style={{ cursor: 'default' }}>
            <span style={{ fontSize: 9, color: 'var(--text-dim)', minWidth: 55, flexShrink: 0 }}>{e.action}</span>
            <span className="newsTitle" style={{ color: 'var(--blue)' }}>{e.repo}</span>
            <span className="newsMeta">{e.time ? timeAgo(Math.floor(new Date(e.time).getTime() / 1000)) : ''}</span>
          </div>
        ))}
      </div>
    </>),
    'books': (<>
      <PanelHead panelId="books" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Books</span><span className="panelTag">TRENDING</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {trendingBooks.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading...</div>}
        {trendingBooks.map((b, i) => (
          <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className="newsRow">
            <span style={{ fontSize: 10, color: 'var(--text-dim)', minWidth: 14, flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="newsTitle">{b.title}</div>
              <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>{b.author}</div>
            </div>
          </a>
        ))}
      </div>
    </>),
    'forex': (<>
      <PanelHead panelId="forex" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Forex</span><span className="panelTag">HEATMAP</span></div></PanelHead>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
        {forexRates.length === 0 && <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading rates...</div>}
        {forexRates.map((r) => (
          <div key={r.currency} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 10 }}>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{r.currency}</span>
            <span style={{ color: r.change >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </>),
    'wikipedia': (<>
      <PanelHead panelId="wikipedia" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Wikipedia</span><span className="panelTag">FEATURED</span></div></PanelHead>
      {wikiArticle ? (
        <a href={wikiArticle.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {wikiArticle.thumbnail && <img src={wikiArticle.thumbnail} alt="" style={{ width: 60, height: 60, borderRadius: 3, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} loading="lazy" />}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{wikiArticle.title}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', lineHeight: 1.4 }}>{wikiArticle.extract}...</div>
            </div>
          </div>
        </a>
      ) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading...</div>}
    </>),
    'solar': (<>
      <PanelHead panelId="solar" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Space Weather</span><span className="panelTag">NASA</span></div></PanelHead>
      {solarWeather ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {solarWeather.events.length === 0 && <div style={{ fontSize: 10, color: 'var(--green)', padding: '8px 0' }}>All quiet — no significant solar activity</div>}
          {solarWeather.events.map((e, i) => {
            const color = e.severity === 'extreme' ? 'var(--red)' : e.severity === 'high' ? 'var(--amber)' : e.severity === 'moderate' ? 'var(--gold)' : 'var(--text-dim)';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid rgba(26,26,34,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 8, color, fontWeight: 700, background: `${color}15`, padding: '1px 4px', borderRadius: 2 }}>{e.type}</span>
                  <span style={{ fontSize: 11, color, fontWeight: 600 }}>{e.classType}</span>
                </div>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{e.time ? timeAgo(Math.floor(new Date(e.time).getTime() / 1000)) : ''}</span>
              </div>
            );
          })}
        </div>
      ) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading...</div>}
    </>),
    'producthunt': (<>
      <PanelHead panelId="producthunt" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Product Hunt</span><span className="panelTag">TODAY</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {phProducts.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading products...</div>}
        {phProducts.map((p, i) => (
          <a key={i} href={p.link} target="_blank" rel="noopener noreferrer" className="newsRow">
            <span style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700, flexShrink: 0, minWidth: 16 }}>{i + 1}</span>
            <span className="newsTitle">{p.title}</span>
            <span className="newsMeta">{p.pubDate ? timeAgo(Math.floor(new Date(p.pubDate).getTime() / 1000)) : ''}</span>
          </a>
        ))}
      </div>
    </>),
    'hn-community': (<>
      <PanelHead panelId="hn-community" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Show / Ask HN</span><span className="panelTag">COMMUNITY</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {hnCommunity.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading...</div>}
        {hnCommunity.map((item) => (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="newsRow">
            <span className="newsTag" style={{ color: item.type === 'show' ? 'var(--cyan)' : 'var(--purple)', background: item.type === 'show' ? 'rgba(79,209,197,0.1)' : 'rgba(167,139,250,0.1)' }}>{item.type === 'show' ? 'SHOW' : 'ASK'}</span>
            <span className="newsTitle">{item.title}</span>
            <span className="newsMeta">{item.score}pt</span>
          </a>
        ))}
      </div>
    </>),
    'world-clocks': (<>
      <PanelHead panelId="world-clocks" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">World Clocks</span><span className="panelTag">LIVE</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {worldClocks.map((c) => (
          <div key={c.city} className="listRow">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.isBusinessHours ? 'var(--green)' : 'var(--text-dim)', opacity: c.isBusinessHours ? 1 : 0.4, flexShrink: 0 }} />
              <span className="listRowSymbol">{c.city}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.isBusinessHours ? 'var(--text)' : 'var(--text-mid)' }}>{c.time}</span>
              <span style={{ fontSize: 8, color: 'var(--text-dim)' }}>{c.date}</span>
            </div>
          </div>
        ))}
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
    'support': (<>
      <PanelHead panelId="support" layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Support the Terminal</span></div></PanelHead>
      <div className="donateSection">
        <div className="donateAddrRow">
          <div className="donateAddr">3GLimw2rSrne3hfrsanjoVxrM2Dwsbmkdy</div>
          <button className="donateCopy" onClick={() => { navigator.clipboard.writeText('3GLimw2rSrne3hfrsanjoVxrM2Dwsbmkdy'); }} title="Copy address">copy</button>
        </div>
        <div className="donateNote">on-chain accepted · fuel the terminal</div>
      </div>
      {donationStats.donations.length > 0 && (
        <div className="donorBoard">
          <div className="donorTitle">TOP SUPPORTERS</div>
          {donationStats.donations.slice(0, 5).map((d, i) => (
            <div key={d.txid} className="donorRow">
              <span className="donorRank">#{i + 1}</span>
              <span className="donorAmount">{d.amount.toFixed(4)}</span>
              <span className="donorAddr">{d.address}</span>
              <span className="donorDate">{d.date}</span>
            </div>
          ))}
          <div className="donorTotal">
            total: {donationStats.totalBtc.toFixed(4)} BTC from {donationStats.totalCount} supporter{donationStats.totalCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </>),
  };


  return (
    <div className="app">
      {/* ── Top Bar ── */}
      <div className="topBar">
        <div className="topBarLeft">
          <span className="logoIcon">{'>'}_</span>
          <span className="logoText">TERMINALFEED</span>
          <span className="logoDot">.io</span>
          <span className="logoCursor" />
          <span className="topTerminals">{terminalsOnline} online</span>
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

      {/* ── Price Ticker (scrolls LEFT) ── */}
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

      {/* ── Sports Ticker (scrolls RIGHT) ── */}
      {games.length > 0 && (
        <div className="sportsTicker">
          <div className="sportsTickerTrack">
            {[...games, ...games].map((game, i) => (
              <span key={i} className={`sportsTickerItem ${game.status === 'in' ? 'sportsLive' : game.status === 'post' ? '' : 'sportsUpcoming'}`}>
                {game.status === 'in' && <span className="sportsLiveDot" />}
                <span className="sportsTeam">{game.awayAbbr}</span>
                <span className="sportsScore">{game.awayScore}</span>
                <span className="sportsTeam">{game.homeAbbr}</span>
                <span className="sportsScore">{game.homeScore}</span>
                <span className={`sportsStatus ${game.status === 'in' ? 'sportsStatusLive' : ''}`}>
                  {game.statusDetail}
                </span>
                <span className="sportsLeague">{game.league}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Grid — rendered dynamically from panelOrder ── */}
      <div className={`grid ${layout.isOrganizing ? 'gridOrganizing' : ''}`}>
        {/* Top row — pinned: Weather, Bitcoin (wide), Tech News, Markets, Wiki Live, Dev Status */}
        {panelRegistry['weather'] && (
          <div className="panel">{panelRegistry['weather']}</div>
        )}
        {panelRegistry['bitcoin'] && (
          <div className="panel spanCol2">{panelRegistry['bitcoin']}</div>
        )}
        {panelRegistry['news'] && (
          <div className="panel">{panelRegistry['news']}</div>
        )}
        {panelRegistry['markets'] && (
          <div className="panel">{panelRegistry['markets']}</div>
        )}
        {panelRegistry['wiki-live'] && (
          <div className="panel">{panelRegistry['wiki-live']}</div>
        )}
        {panelRegistry['dev-status'] && (
          <div className="panel">{panelRegistry['dev-status']}</div>
        )}
        {/* Remaining panels in order (skip pinned + support + unhealthy) */}
        {layout.panelOrder.filter(id => layout.isVisible(id) && !['support', 'bitcoin', 'weather', 'news', 'markets', 'wiki-live', 'dev-status'].includes(id) && panelHealth.isHealthy(id)).map(id => {
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
        {/* Support panel always last */}
        {layout.isVisible('support') && panelRegistry['support'] && (
          <div className="panel">
            {panelRegistry['support']}
          </div>
        )}
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

      {/* ── Activity Log Ticker ── */}
      <div className="activityBar">
        <div className="activityTrack">
          {[...(btcPrice > 0 ? [`btc $${btcPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}`] : []),
            ...(stories.length > 0 ? [`${stories.length} headlines loaded`] : []),
            ...(redditPosts.length > 0 ? [`${redditPosts.length} reddit posts`] : []),
            ...(earthquakes.length > 0 ? [`${earthquakes.length} quakes today`] : []),
            ...(trendingRepos.length > 0 ? [`${trendingRepos.length} trending repos`] : []),
            ...(devStatuses.filter(s => s.indicator !== 'none' && s.indicator !== 'unknown').length > 0
              ? [`${devStatuses.filter(s => s.indicator !== 'none' && s.indicator !== 'unknown').length} service alerts`] : ['all services operational']),
            ...(weather ? [`${weather.city} ${weather.temperature}°F`] : []),
            ...(btcNet.blockHeight > 0 ? [`block ${btcNet.blockHeight.toLocaleString()}`] : []),
            ...(btcNet.feeFastest > 0 ? [`fees ${btcNet.feeFastest} sat/vB`] : []),
            ...(liveCount > 0 ? [`${liveCount} live games`] : []),
            ...(cryptoGlobal ? [`crypto cap $${formatCompact(cryptoGlobal.totalMarketCap)}`] : []),
            'terminalfeed.io',
          ].flatMap(item => [item, item]).map((item, i) => (
            <span key={i} className="activityItem"><span className="activityDot" />{item}</span>
          ))}
        </div>
      </div>

      {/* ── Culture Strip — rotates fun facts, dev jokes, 2600 quotes ── */}
      <div className="jokeStrip">
        <span className="jokePrefix">&gt;</span>
        <span className="jokeText">{funFact || devJoke || getRandomWireQuote()}</span>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="bottomBar">
        <div className="bottomBarLeft">
          <img src="/images/Ripper.jpg" alt="Ripper" className="ripperLogo" />
          <span className="ripperCredit">built by Ripper</span>
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
          <span className="bottomBarDivider">&middot;</span>
          <a href="https://x.com/terminalfeed" target="_blank" rel="noopener noreferrer" className="footerLink">@terminalfeed</a>
        </div>
        <div className="bottomBarStatus">
          <span className="terminalsOnline">&gt;_ {terminalsOnline} terminal{terminalsOnline !== 1 ? 's' : ''} online</span>
          <span className="bottomBarDivider">&middot;</span>
          <span className="bottomBarDot" style={{
            background: (priceConnected || blockConnected) ? 'var(--green)' : 'var(--red)',
          }} />
          <span>{(priceConnected || blockConnected) ? 'All systems operational' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Scroll to Top */}
      <button
        className={`scrollTop ${showScrollTop ? 'scrollTopVisible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Scroll to top"
      >
        &uarr;
      </button>

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


export default App;
