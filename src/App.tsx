import { useState, useEffect, useCallback, useRef } from 'react';
import { useBtcPrice } from './hooks/useBtcPrice';
import { useFearGreed } from './hooks/useFearGreed';
import { useHackerNews } from './hooks/useHackerNews';
import { useTime } from './hooks/useTime';
import { useSimStocks, INDICES } from './hooks/useSimStocks';
import { useSimCrypto } from './hooks/useSimCrypto';
import { useMetals } from './hooks/useMetals';
import { useSportsScores } from './hooks/useSportsScores';
import { LegalModal } from './components/LegalModal';
import { PanelErrorBoundary } from './components/PanelErrorBoundary';
import { BtcMiniChart } from './components/BtcMiniChart';
import { useGithubTrending } from './hooks/useGithubTrending';
import { useRedditTech } from './hooks/useRedditTech';
import { useMarketHours } from './hooks/useMarketHours';
import { useDevStatus } from './hooks/useDevStatus';
import { useClaudeStatus } from './hooks/useClaudeStatus';
import { useCryptoGlobal } from './hooks/useCryptoGlobal';
import { useEarthquakes } from './hooks/useEarthquakes';
import { useWeather, weatherDescription } from './hooks/useWeather';
import { useSpaceLaunches } from './hooks/useSpaceLaunches';
import { useRecipe } from './hooks/useRecipe';
import { useStackOverflow } from './hooks/useStackOverflow';
import { useBtcNetwork } from './hooks/useBtcNetwork';
import { useLayoutManager, ALL_PANELS } from './hooks/useLayoutManager';
import { PanelManager } from './components/PanelManager';
import { PanelHead } from './components/PanelHead';
import { LazyPanel } from './components/LazyPanel';
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

import { useProductHunt } from './hooks/useProductHunt';
import { useWikipediaLive } from './hooks/useWikipediaLive';
import { useGDACS } from './hooks/useGDACS';
import { useGithubEvents } from './hooks/useGithubEvents';
import { useTrendingBooks } from './hooks/useTrendingBooks';
import { useWhaleWatch } from './hooks/useWhaleWatch';
import { useWorldClock } from './hooks/useWorldClock';
import { aiLeaderboard } from './data/aiLeaderboard';
import { getTodayInTech } from './data/techHistory';
import { getTodayTerm } from './data/techTerms';
import { useWire } from './hooks/useWire';
import { useRSSNews } from './hooks/useRSSNews';
import { useNpmTrends } from './hooks/useNpmTrends';
import { useAIHub } from './hooks/useAIHub';
import { usePredictionMarkets } from './hooks/usePredictionMarkets';
import { useSteamGames } from './hooks/useSteamGames';
import { useDailyPaws } from './hooks/useDailyPaws';
import { useMuseumArt } from './hooks/useMuseumArt';
import { useNasaApod } from './hooks/useNasaApod';
import { useGoodNews } from './hooks/useGoodNews';
import { useTrendingMovies } from './hooks/useTrendingMovies';
import { AdminTerminal } from './components/AdminTerminal';
import { useHumansInSpace } from './hooks/useHumansInSpace';
import { useThisDay } from './hooks/useThisDay';
import { useFooterQuote } from './hooks/useFooterQuote';
import { useFlightRadar } from './hooks/useFlightRadar';
import { useTCGMarket } from './hooks/useTCGMarket';
import { useCloudStatus } from './hooks/useCloudStatus';
import { OriginalsPanel } from './components/OriginalsPanel';
import { LoadingOrHide } from './components/LoadingOrHide';
import { useGasTracker } from './hooks/useGasTracker';
import { useMemecoinRadar } from './hooks/useMemecoinRadar';
import { GasPanel } from './panels/GasPanel';
import { MemeRadarPanel } from './panels/MemeRadarPanel';
import './App.css';

function App() {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [newsFilter, setNewsFilter] = useState<string | null>(() => {
    try { return localStorage.getItem('tf_news_filter') || null; } catch { return null; }
  });
  const [showPanelManager, setShowPanelManager] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showLockTip, setShowLockTip] = useState(() => !sessionStorage.getItem('tipDismissed'));


  // Full screen mode
  const [isFullScreen, setIsFullScreen] = useState(false);
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);
  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Pause animations when tab is hidden — saves CPU in background
  useEffect(() => {
    const handler = () => {
      document.documentElement.style.setProperty('--anim-state', document.hidden ? 'paused' : 'running');
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
  const layout = useLayoutManager();
  const { data: priceData, priceHistory } = useBtcPrice();
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
  const claudeStatus = useClaudeStatus();
  const cryptoGlobal = useCryptoGlobal();
  const earthquakes = useEarthquakes();
  const weather = useWeather();
  const spaceLaunches = useSpaceLaunches();
  const recipes = useRecipe();
  const soQuestions = useStackOverflow();
  const btcNet = useBtcNetwork();
  const internetPulse = useInternetPulse();
  const terminalsOnline = useTerminalsOnline();
  const panelHealth = usePanelHealth();
  const hnCommunity = useHNShowAsk();
  const worldClocks = useWorldClock();
  const forexRates = useForexHeatmap();
  const wikiArticle = useWikipedia();

  const phProducts = useProductHunt();
  const { edits: wikiEdits, editsPerMin: wikiEPM } = useWikipediaLive();
  const disasterAlerts = useGDACS();
  const ghEvents = useGithubEvents();
  const trendingBooks = useTrendingBooks();
  const wire = useWire();
  const rssNews = useRSSNews();
  const npmPackages = useNpmTrends();
  const aiHub = useAIHub();
  const { markets: predictionMarkets, status: predictionsStatus } = usePredictionMarkets();
  const steamGames = useSteamGames();
  const { paw, fading: pawFading, fetchNew: fetchNewPaw } = useDailyPaws();
  const museumArt = useMuseumArt();
  const nasaApod = useNasaApod();
  const goodNews = useGoodNews();
  const trendingMovies = useTrendingMovies();
  const whaleTxs = useWhaleWatch();
  const podcastEpisodes = usePodcasts();
  const uapShapeStats = getShapeStats();
  const bskyPosts = useBluesky();
  const todayInTech = getTodayInTech();
  const todayTerm = getTodayTerm();
  const humansInSpace = useHumansInSpace();
  const thisDayEvents = useThisDay();
  const footerQuote = useFooterQuote();
  const { stats: flightStats, status: flightStatus } = useFlightRadar();
  const cloudStatus = useCloudStatus();
  const tcgMarket = useTCGMarket();
  const gasData = useGasTracker();
  const memeTokens = useMemecoinRadar();

  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const btcPrice = priceData?.price ?? 0;
  const btcChange = priceData?.changePercent24h ?? 0;
  const isUp = btcChange >= 0;
  // Detect stale data: source is static fallback, or lastUpdate is over 10 minutes old
  const btcIsStale = priceData?.source === 'static' || (priceData?.lastUpdate && Date.now() - priceData.lastUpdate > 10 * 60_000);

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
      if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
      }
      if (e.key === 'e' || e.key === 'E') {
        layout.setIsOrganizing(!layout.isOrganizing);
      }
      if (e.key === 'c' || e.key === 'C') {
        setShowPanelManager(prev => !prev);
      }
      if (e.key === '`') {
        e.preventDefault();
        setShowTerminal(prev => !prev);
        return;
      }
      if (e.key === 'Escape') {
        if (showTerminal) setShowTerminal(false);
        else if (layout.isOrganizing) layout.setIsOrganizing(false);
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
  }, [layout, showTerminal]);

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

  // Flip between price ticker and sports ticker every 15 seconds
  const [tickerShowSports, setTickerShowSports] = useState(false);
  useEffect(() => {
    if (games.length === 0) return; // no sports = always show prices
    const id = setInterval(() => setTickerShowSports(prev => !prev), 15000);
    return () => clearInterval(id);
  }, [games.length]);

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
    if (claudeStatus) panelHealth.reportData('claude-status');
    if (cloudStatus) panelHealth.reportData('cloud-status');
    if (flightStats) panelHealth.reportData('flight-radar');
    if (tcgMarket) panelHealth.reportData('tcg-market');
    if (cryptoGlobal) panelHealth.reportData('crypto-global');
    if (btcNet.blockHeight > 0) panelHealth.reportData('btc-network');
    if (marketHours.length > 0) panelHealth.reportData('market-hours');
    if (podcastEpisodes.length > 0) panelHealth.reportData('podcasts');
    if (bskyPosts.length > 0) panelHealth.reportData('bluesky');
    if (internetPulse.length > 0) panelHealth.reportData('internet-pulse');
    if (recipes.length > 0) panelHealth.reportData('recipe');
    if (humansInSpace) panelHealth.reportData('humans-in-space');
    if (thisDayEvents.length > 0) panelHealth.reportData('this-day');
    if (gasData) panelHealth.reportData('gas');
    if (memeTokens.length > 0) panelHealth.reportData('meme-radar');
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
      <PanelHead panelId="bitcoin" isStale={panelHealth.isStale('bitcoin')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Bitcoin</span>
          <span className="panelTag">BTC/USD</span>
          {priceData?.source && <span className="panelTagDim">{priceData.source}</span>}
        </div>
        <div className="panelLive">
          {btcIsStale ? (<>
            <span className="liveDot" style={{ background: 'var(--amber)' }} />
            <span className="liveText" style={{ color: 'var(--amber)' }}>STALE</span>
          </>) : (<>
            <span className="liveDot" style={{ background: btcPrice > 0 ? 'var(--green)' : 'var(--red)' }} />
            <span className="liveText">{btcPrice > 0 ? 'LIVE' : 'LOADING'}</span>
          </>)}
        </div>
      </PanelHead>
      {btcIsStale && (
        <div className="staleBanner">
          {priceData?.source === 'static'
            ? 'Unable to connect to live feeds. Showing approximate data. Check your network or ad blocker.'
            : 'Price data may be outdated. Reconnecting...'}
        </div>
      )}
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
              ${priceData.low24h.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${priceData.high24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>
      <BtcMiniChart ticks={priceHistory} height={120} />
    </>),
    'crypto': (() => {
      const btcEth = crypto.filter(c => ['BTC', 'ETH'].includes(c.symbol));
      const others = crypto.filter(c => !['BTC', 'ETH'].includes(c.symbol) && c.price > 0);
      const cryptoGainers = [...others].filter(c => c.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
      const cryptoLosers = [...others].filter(c => c.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
      return (<>
        <PanelHead panelId="crypto" isStale={panelHealth.isStale('crypto')} layout={layout} getGridCols={getGridCols}>
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
          {cryptoGlobal && (<>
            <div className="listRow"><div><span className="listRowSymbol" style={{ fontSize: 9 }}>Total Cap</span></div><div><span style={{ fontSize: 10, color: 'var(--text-mid)' }}>${formatCompact(cryptoGlobal.totalMarketCap)}</span><span className={`listRowChange ${cryptoGlobal.marketCapChange24h >= 0 ? 'tickerUp' : 'tickerDown'}`} style={{ fontSize: 9 }}>{cryptoGlobal.marketCapChange24h >= 0 ? '+' : ''}{cryptoGlobal.marketCapChange24h.toFixed(1)}%</span></div></div>
            <div className="listRow"><div><span className="listRowSymbol" style={{ fontSize: 9 }}>BTC Dom</span></div><span style={{ fontSize: 10, color: 'var(--text-mid)' }}>{cryptoGlobal.btcDominance.toFixed(1)}%</span></div>
            <div className="listRow"><div><span className="listRowSymbol" style={{ fontSize: 9 }}>24h Vol</span></div><span style={{ fontSize: 10, color: 'var(--text-mid)' }}>${formatCompact(cryptoGlobal.totalVolume24h)}</span></div>
          </>)}
        </div>
      </>);
    })(),
    'gas': <GasPanel gas={gasData} layout={layout} panelHealth={panelHealth} getGridCols={getGridCols} />,
    'meme-radar': <MemeRadarPanel tokens={memeTokens} layout={layout} panelHealth={panelHealth} getGridCols={getGridCols} />,
    'btc-network': (<>
      <PanelHead panelId="btc-network" isStale={panelHealth.isStale('btc-network')} layout={layout} getGridCols={getGridCols}>
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
      {whaleTxs.length > 0 && (<div className="recentBlocksWrap"><div className="recentBlocksTitle">Whale Watch</div><div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{whaleTxs.map((tx) => { const isHuge = tx.btc >= 10; const usdValue = tx.btc * btcPrice; return (<a key={tx.txid} href={`https://mempool.space/tx/${tx.txid}`} target="_blank" rel="noopener noreferrer" className="newsRow"><span style={{ fontSize: 12, flexShrink: 0 }}>🐋</span><span style={{ fontSize: 11, color: isHuge ? 'var(--gold)' : 'var(--amber)', fontWeight: 700, minWidth: 75 }}>{tx.btc.toFixed(4)} BTC</span><span style={{ fontSize: 10, color: 'var(--text-dim)', flex: 1 }}>${usdValue >= 1e6 ? (usdValue / 1e6).toFixed(1) + 'M' : usdValue >= 1e3 ? (usdValue / 1e3).toFixed(0) + 'K' : usdValue.toFixed(0)}</span><span className="newsMeta">{timeAgo(Math.floor(tx.time / 1000))}</span></a>); })}</div></div>)}
    </>),
    'news': (<>
      <PanelHead panelId="news" isStale={panelHealth.isStale('news')} layout={layout} getGridCols={getGridCols}>
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
    'tech-news': (<>
      <PanelHead panelId="tech-news" isStale={panelHealth.isStale('tech-news')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Tech News</span><span className="panelTag">RSS</span></div>
      </PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rssNews.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading feeds...</div>}
        {rssNews.map((item, i) => (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="newsRow">
            <span className="newsTag" style={{ color: 'var(--blue)', background: 'rgba(96,165,250,0.1)', minWidth: 30 }}>{item.source}</span>
            <span className="newsTitle">{item.title}</span>
            <span className="newsMeta">{timeAgo(item.time)}</span>
          </a>
        ))}
      </div>
    </>),
    'reddit': (<>
      <PanelHead panelId="reddit" isStale={panelHealth.isStale('reddit')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Reddit</span><span className="panelTag">TECH</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {redditPosts.length === 0 && <LoadingOrHide label="loading posts..." />}
        {redditPosts.map((post) => (<a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className="newsRow"><span className="redditScore">{formatStars(post.score)}</span><div style={{ flex: 1, minWidth: 0 }}><span className="newsTitle">{post.title}</span></div><span className="redditSub">r/{post.subreddit}</span></a>))}
      </div>
    </>),
    'github': (<>
      <PanelHead panelId="github" isStale={panelHealth.isStale('github')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">GitHub Trending</span><span className="panelTag">7D</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {trendingRepos.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading repos...</div>}
        {trendingRepos.map((repo) => (<a key={repo.fullName} href={repo.url} target="_blank" rel="noopener noreferrer" className="newsRow"><span className="ghStars">{formatStars(repo.stars)}</span><div style={{ flex: 1, minWidth: 0 }}><div className="ghRepoName">{repo.fullName}</div><div className="ghRepoDesc">{repo.description}</div></div>{repo.language && <span className="ghLang">{repo.language}</span>}</a>))}
      </div>
    </>),
    'market-hours': (<>
      <PanelHead panelId="market-hours" isStale={panelHealth.isStale('market-hours')} layout={layout} getGridCols={getGridCols}>
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
      const gainers = [...movers].filter(s => s.change > 0).sort((a, b) => b.change - a.change).slice(0, 10);
      const losers = [...movers].filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 10);
      return (<>
        <PanelHead panelId="markets" isStale={panelHealth.isStale('markets')} layout={layout} getGridCols={getGridCols}>
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
    'claude-status': (<>
      <PanelHead panelId="claude-status" isStale={panelHealth.isStale('claude-status')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Claude</span><span className="panelTag">STATUS</span></div>
        <div className="panelLive">
          <span className="liveDot" style={{ background: claudeStatus ? (claudeStatus.overall.indicator === 'none' ? 'var(--green)' : claudeStatus.overall.indicator === 'critical' ? 'var(--red)' : 'var(--amber)') : 'var(--text-dim)' }} />
          <span className="liveText">{claudeStatus ? (claudeStatus.overall.indicator === 'none' ? 'ALL OK' : claudeStatus.overall.description) : 'LOADING'}</span>
        </div>
      </PanelHead>
      {claudeStatus ? (<>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {claudeStatus.components.map((c) => {
            const color = c.status === 'operational' ? 'var(--green)' : c.status === 'under_maintenance' ? 'var(--cyan)' : c.status === 'degraded_performance' ? 'var(--amber)' : c.status === 'partial_outage' ? 'var(--amber)' : 'var(--red)';
            const label = c.status === 'operational' ? 'Operational' : c.status === 'under_maintenance' ? 'Maintenance' : c.status === 'degraded_performance' ? 'Degraded' : c.status === 'partial_outage' ? 'Partial Outage' : 'Major Outage';
            return (
              <div key={c.id} className="statusRow">
                <div className="statusLeft"><span className="statusDot" style={{ background: color, boxShadow: `0 0 4px ${color}` }} /><span className="statusName">{c.name}</span></div>
                <span className="statusDesc" style={{ color }}>{label}</span>
              </div>
            );
          })}
        </div>
        {claudeStatus.incidents.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 6 }}>
            <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Active Incidents</div>
            {claudeStatus.incidents.map((inc) => {
              const impactColor = inc.impact === 'critical' ? 'var(--red)' : inc.impact === 'major' ? 'var(--amber)' : 'var(--text-mid)';
              return (
                <div key={inc.id} style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 10, color: impactColor, fontWeight: 600 }}>{inc.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', display: 'flex', gap: 6 }}>
                    <span style={{ textTransform: 'uppercase' }}>{inc.status}</span>
                    <span>{new Date(inc.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>) : (
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Connecting to status.claude.com...</div>
      )}
    </>),
    'cloud-status': (<>
      <PanelHead panelId="cloud-status" isStale={panelHealth.isStale('cloud-status')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Cloud Status</span><span className="panelTag">AWS/GCP/AZURE</span></div>
      </PanelHead>
      {cloudStatus ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {cloudStatus.providers.map((p) => {
            const color = p.status === 'operational' ? 'var(--green)' : p.status === 'incident' ? 'var(--amber)' : 'var(--text-dim)';
            return (
              <div key={p.name}>
                <div className="statusRow">
                  <div className="statusLeft"><span className="statusDot" style={{ background: color, boxShadow: `0 0 4px ${color}` }} /><span className="statusName">{p.name}</span></div>
                  <span className="statusDesc" style={{ color }}>{p.status === 'operational' ? 'Operational' : p.status === 'incident' ? `${p.incidents.length} incident${p.incidents.length > 1 ? 's' : ''}` : 'Checking...'}</span>
                </div>
                {p.incidents.length > 0 && p.incidents.map((inc, i) => (
                  <div key={i} style={{ fontSize: 9, color: 'var(--text-dim)', paddingLeft: 16, marginTop: 2, lineHeight: 1.3 }}>{inc.title.length > 80 ? inc.title.slice(0, 80) + '...' : inc.title}</div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Checking cloud providers...</div>
      )}
    </>),
    'flight-radar': flightStatus === 'failed' ? null : (<>
      <PanelHead panelId="flight-radar" isStale={panelHealth.isStale('flight-radar')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Flight Radar</span><span className="panelTag">OPENSKY</span></div>
        <div className="panelLive">
          <span className="liveDot" style={{ background: flightStats ? 'var(--green)' : 'var(--text-dim)' }} />
          <span className="liveText">{flightStats ? 'LIVE' : 'LOADING'}</span>
        </div>
      </PanelHead>
      {flightStats ? (<>
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{flightStats.totalAirborne.toLocaleString()}</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>Aircraft Airborne</div>
        </div>
        <div className="btcNetStats" style={{ marginTop: 4 }}>
          <div className="btcNetStat"><span className="btcNetLabel">On Ground</span><span className="btcNetValue">{flightStats.totalOnGround.toLocaleString()}</span></div>
          <div className="btcNetStat"><span className="btcNetLabel">Avg Altitude</span><span className="btcNetValue">{Math.round(flightStats.avgAltitude * 3.281).toLocaleString()} ft</span></div>
          <div className="btcNetStat"><span className="btcNetLabel">Avg Speed</span><span className="btcNetValue">{Math.round(flightStats.avgSpeed * 1.944)} kts</span></div>
        </div>
        {flightStats.topCountries.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 6 }}>
            <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Top Countries</div>
            {flightStats.topCountries.map((c) => {
              const pct = (c.count / flightStats.totalAirborne) * 100;
              return (
                <div key={c.country} className="pulseRow">
                  <span className="pulseName" style={{ minWidth: 80 }}>{c.country}</span>
                  <div className="pulseBar"><div className="pulseFill" style={{ width: `${Math.min(100, pct * 3)}%`, background: 'var(--cyan)' }} /></div>
                  <span className="pulseMs" style={{ color: 'var(--text-mid)', minWidth: 40, textAlign: 'right' }}>{c.count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </>) : (
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Contacting OpenSky Network...</div>
      )}
    </>),
    'dev-status': (<>
      <PanelHead panelId="dev-status" isStale={panelHealth.isStale('dev-status')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Status</span><span className="panelTag">DEV/OPS</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {devStatuses.map((svc) => { const color = svc.indicator === 'none' ? 'var(--green)' : svc.indicator === 'minor' ? 'var(--amber)' : svc.indicator === 'major' ? 'var(--amber)' : svc.indicator === 'critical' ? 'var(--red)' : 'var(--text-dim)'; return (<div key={svc.name} className="statusRow"><div className="statusLeft"><span className="statusDot" style={{ background: color, boxShadow: `0 0 4px ${color}` }} /><span className="statusName">{svc.name}</span></div><span className="statusDesc" style={{ color }}>{svc.indicator === 'none' ? 'Operational' : svc.indicator === 'unknown' ? 'Checking...' : svc.description}</span></div>); })}
      </div>
    </>),
    'weather': (<>
      <PanelHead panelId="weather" isStale={panelHealth.isStale('weather')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Weather</span>{weather && <span className="panelTag">{weather.city.toUpperCase()}</span>}</div></PanelHead>
      {weather ? (<div className="weatherContent">
        <WeatherScene weatherCode={weather.weatherCode} isDaytime={weather.isDaytime} />
        <div className="weatherOverlay">
          <div className="weatherTemp">{weather.temperature}°F</div>
          <div className="weatherDesc">{weatherDescription(weather.weatherCode).desc}</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Feels like {weather.feelsLike}°F</div>
          <div className="weatherDetails">
            <span>Wind: {weather.windSpeed} mph</span>
            <span>Humidity: {weather.humidity}%</span>
          </div>
          <div className="weatherDetails" style={{ marginTop: 2 }}>
            <span>H: {weather.high}°F  L: {weather.low}°F</span>
          </div>
          {weather.sunrise && <div className="weatherDetails" style={{ marginTop: 2 }}>
            <span>Rise: {weather.sunrise}</span>
            <span>Set: {weather.sunset}</span>
          </div>}
        </div>
      </div>) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>detecting location...</div>}
    </>),
    'seismic': (<>
      <PanelHead panelId="seismic" isStale={panelHealth.isStale('seismic')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Seismic</span><span className="panelTag">24H</span></div><span style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.5px' }}>USGS M2.5+</span></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {earthquakes.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading quakes...</div>}
        {earthquakes.map((q) => { const mc = q.magnitude >= 5 ? 'var(--red)' : q.magnitude >= 4 ? 'var(--amber)' : 'var(--text-mid)'; return (<a key={q.id} href={q.url} target="_blank" rel="noopener noreferrer" className="quakeRow"><span className="quakeMag" style={{ color: mc }}>{q.magnitude.toFixed(1)}</span><span className="quakePlace">{q.place}</span><span className="quakeTime">{timeAgo(Math.floor(q.time / 1000))}</span></a>); })}
      </div>
    </>),
    'launches': (<>
      <PanelHead panelId="launches" isStale={panelHealth.isStale('launches')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Launches</span><span className="panelTag">SPACE</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {spaceLaunches.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading launches...</div>}
        {spaceLaunches.map((l) => { const isToday = l.dateTs > 0 && l.dateTs - Date.now() < 86400000 && l.dateTs > Date.now(); const isSoon = l.dateTs > 0 && l.dateTs - Date.now() < 86400000 * 3 && l.dateTs > Date.now(); const dc = isToday ? 'var(--green)' : isSoon ? 'var(--amber)' : 'var(--text-dim)'; return (<div key={l.id} className="launchRow"><div className="launchInfo"><span className="launchProvider">{l.provider}</span><span className="launchName">{l.name}</span></div><div className="launchMeta"><span className="launchDate" style={{ color: dc }}>{l.date}</span><span className="launchLoc">{l.location}</span></div></div>); })}
      </div>
    </>),
    'stackoverflow': (<>
      <PanelHead panelId="stackoverflow" isStale={panelHealth.isStale('stackoverflow')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Stack Overflow</span><span className="panelTag">HOT</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {soQuestions.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading questions...</div>}
        {soQuestions.map((q) => (<a key={q.id} href={q.link} target="_blank" rel="noopener noreferrer" className="newsRow"><span className="soScore">{q.score}</span><div style={{ flex: 1, minWidth: 0 }}><div className="newsTitle">{q.title}</div><div className="soTags">{q.tags.join(' · ')}</div></div><span className="soAnswers">{q.answerCount}A</span></a>))}
      </div>
    </>),
    'npm-trends': (<>
      <PanelHead panelId="npm-trends" isStale={panelHealth.isStale('npm-trends')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">NPM</span><span className="panelTag">DOWNLOADS</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {npmPackages.length === 0 && <LoadingOrHide />}
        {npmPackages.map((p) => (
          <div key={p.name} className="listRow">
            <span className="listRowSymbol" style={{ color: 'var(--cyan)' }}>{p.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-mid)', fontWeight: 500 }}>{p.downloads >= 1e6 ? (p.downloads / 1e6).toFixed(1) + 'M' : p.downloads >= 1e3 ? (p.downloads / 1e3).toFixed(0) + 'K' : p.downloads}/day</span>
          </div>
        ))}
      </div>
    </>),
    'museum-art': (<>
      <PanelHead panelId="museum-art" isStale={panelHealth.isStale('museum-art')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Art</span><span className="panelTag">MUSEUM</span></div></PanelHead>
      {museumArt ? (
        <div>
          <img src={museumArt.imageUrl} alt={museumArt.title} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 3, display: 'block' }} loading="lazy" />
          <div style={{ padding: '6px 0 0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{museumArt.title}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{museumArt.artist}{museumArt.date ? ` · ${museumArt.date}` : ''}</div>
          </div>
        </div>
      ) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading art...</div>}
    </>),
    'daily-paws': (<>
      <PanelHead panelId="daily-paws" isStale={panelHealth.isStale('daily-paws')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Daily Paws</span>
          <span className="panelTag">{paw?.type === 'cat' ? 'CAT' : paw?.type === 'dog' ? 'DOG' : 'PAWS'}</span>
        </div>
        <button className="pawNextBtn" onClick={fetchNewPaw} title="New friend">next</button>
      </PanelHead>
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', background: 'var(--bg)' }}>
        {!paw && <div style={{ padding: 20, textAlign: 'center', fontSize: 10, color: 'var(--text-dim)' }}>finding a friend...</div>}
        {paw?.url && (
          <img
            src={paw.url}
            alt={paw.type === 'cat' ? 'Random cat' : 'Random dog'}
            style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block', borderRadius: 3, opacity: pawFading ? 0 : 1, transition: 'opacity 0.4s ease' }}
            loading="lazy"
          />
        )}
      </div>
      {paw && (
        <div style={{ padding: '6px 0 0', fontSize: 9, color: 'var(--text-dim)', textTransform: 'capitalize' }}>
          {paw.breed || (paw.type === 'cat' ? 'a very good cat' : 'a very good dog')}
        </div>
      )}
    </>),
    'recipe': (<>
      <PanelHead panelId="recipe" isStale={panelHealth.isStale('recipe')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Tonight</span><span className="panelTag">RECIPES OF THE DAY</span></div></PanelHead>
      {recipes.length > 0 ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{recipes.map((r, i) => (<a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="recipeContent"><img src={r.thumbnail} alt={r.name} className="recipeThumbnail" loading="lazy" /><div className="recipeInfo"><div className="recipeName">{r.name}</div><div className="recipeMeta">{r.area} · {r.category}</div></div></a>))}</div>) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading recipes...</div>}
    </>),
    'daily-learn': (<>
      <PanelHead panelId="daily-learn" isStale={panelHealth.isStale('daily-learn')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Daily</span><span className="panelTag">LEARN</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div><div className="dailySectionTitle">On This Day</div>{todayInTech.map((evt, i) => <div key={i} className="historyRow"><span className="historyYear">{evt.year}</span><span className="historyEvent">{evt.event}</span></div>)}</div>
        <div><div className="dailySectionTitle">Term of the Day</div><div className="termWord">{todayTerm.term}</div><div className="termDef">{todayTerm.definition}</div></div>
      </div>
    </>),
    'podcasts': (<>
      <PanelHead panelId="podcasts" isStale={panelHealth.isStale('podcasts')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Podcasts</span><span className="panelTag">LATEST</span></div></PanelHead>
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
      <PanelHead panelId="uap" isStale={panelHealth.isStale('uap')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">UAP Sightings</span><span className="panelTag">NUFORC</span></div></PanelHead>
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
    'predictions': predictionsStatus === 'failed' ? null : (<>
      <PanelHead panelId="predictions" isStale={panelHealth.isStale('predictions')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Predictions</span><span className="panelTag">POLYMARKET</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {predictionMarkets.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading markets...</div>}
        {predictionMarkets.map((m) => (
          <div key={m.id} style={{ padding: '4px 0', borderBottom: '1px solid rgba(26,26,34,0.5)' }}>
            <div style={{ fontSize: 10, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>{m.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600, minWidth: 32 }}>{m.probability}%</span>
              <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${m.probability}%`, height: '100%', background: m.probability >= 50 ? 'var(--green)' : 'var(--red)', borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600, minWidth: 32, textAlign: 'right' }}>{100 - m.probability}%</span>
            </div>
            {m.volume > 0 && <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>Vol: ${m.volume >= 1e6 ? (m.volume / 1e6).toFixed(1) + 'M' : m.volume >= 1e3 ? (m.volume / 1e3).toFixed(0) + 'K' : m.volume.toFixed(0)}</div>}
          </div>
        ))}
        <div style={{ fontSize: 8, color: 'var(--text-dim)', textAlign: 'center', paddingTop: 4 }}>data from polymarket.com</div>
      </div>
    </>),
    'tcg-market': (<>
      <PanelHead panelId="tcg-market" isStale={panelHealth.isStale('tcg-market')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">TCG Market</span><span className="panelTag">WATCH</span></div>
      </PanelHead>
      {tcgMarket && tcgMarket.cards.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tcgMarket.cards.map((card, i) => {
            const gameColor = card.game === 'Pokemon' ? 'var(--amber)' : card.game === 'MTG' ? 'var(--cyan)' : 'var(--purple, #a78bfa)';
            const gameTag = card.game === 'Pokemon' ? 'PKM' : card.game === 'MTG' ? 'MTG' : 'YGO';
            return (
              <a key={`${card.game}-${card.name}-${i}`} href={card.url} target="_blank" rel="noopener noreferrer" className="newsRow" style={{ alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                {card.image && <img src={card.image} alt={card.name} style={{ width: 28, height: 40, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} loading="lazy" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
                  <div style={{ fontSize: 8, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.set}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>${card.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 7, color: gameColor, letterSpacing: 1, fontWeight: 600 }}>{gameTag}</div>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Loading card market data...</div>
      )}
    </>),
    'steam': (<>
      <PanelHead panelId="steam" isStale={panelHealth.isStale('steam')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Steam</span><span className="panelTag">LIVE</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {steamGames.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading games...</div>}
        {steamGames.map((g) => (
          <div key={g.appId} className="listRow">
            <span className="listRowSymbol">{g.name}</span>
            <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>{g.playerCount >= 1e6 ? (g.playerCount / 1e6).toFixed(1) + 'M' : g.playerCount >= 1e3 ? (g.playerCount / 1e3).toFixed(0) + 'K' : g.playerCount} playing</span>
          </div>
        ))}
      </div>
    </>),
    'ai-hub': (<>
      <PanelHead panelId="ai-hub" isStale={panelHealth.isStale('ai-hub')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">AI Hub</span><span className="panelTag" style={{ color: 'var(--purple)', background: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.2)' }}>AGENTS</span></div>
        <div className="panelLive"><span className="liveDot" style={{ background: 'var(--purple)' }} /><span className="liveText">LIVE</span></div>
      </PanelHead>
      {/* Stats bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginBottom: 6, borderBottom: '1px solid var(--border)' }}>
        <div><span style={{ color: 'var(--purple)', fontSize: 15, fontWeight: 700 }}>{aiHub.totalHits.toLocaleString()}</span><span style={{ color: 'var(--text-dim)', fontSize: 9, marginLeft: 4 }}>API calls today</span></div>
        <div><span style={{ color: 'var(--cyan)', fontSize: 15, fontWeight: 700 }}>{aiHub.agentCount}</span><span style={{ color: 'var(--text-dim)', fontSize: 9, marginLeft: 4 }}>agents</span></div>
      </div>
      {/* Briefing */}
      <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>World Briefing</div>
      <div style={{ fontSize: 10, color: 'var(--text)', lineHeight: 1.5, background: 'var(--bg)', padding: 8, borderRadius: 4, border: '1px solid var(--border)', marginBottom: 8 }}>
        {(() => {
          const parts: string[] = [];
          if (btcPrice > 0) parts.push(`BTC $${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(1)}%)`);
          if (fearGreed) parts.push(`F&G: ${fearGreed.value} ${fearGreed.label}`);
          if (earthquakes.length > 0) parts.push(`${earthquakes.length} quakes`);
          const down = devStatuses.filter(s => s.indicator !== 'none' && s.indicator !== 'unknown');
          parts.push(down.length > 0 ? `${down.map(s => s.name).join(', ')} issues` : 'All services OK');
          return parts.join(' · ');
        })()}
      </div>
      {/* Endpoints */}
      <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Endpoints</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
        {['briefing', 'btc-price', 'stocks', 'crypto', 'earthquake', 'fear-greed', 'hackernews', 'dev-status', 'weather', 'forex', 'disasters'].map(ep => (
          <span key={ep} style={{ fontSize: 8, color: 'var(--cyan)', background: 'rgba(79,209,197,0.06)', padding: '1px 5px', borderRadius: 2, border: '1px solid rgba(79,209,197,0.1)' }}>/{ep}</span>
        ))}
      </div>
      {/* Agent activity feed */}
      <div style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Recent Calls</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {aiHub.calls.map((c, i) => (
          <div key={c.timestamp + i} className="newsRow" style={{ cursor: 'default', padding: '3px 2px' }}>
            <span style={{ color: 'var(--purple)', fontSize: 10, flexShrink: 0 }}>⚡</span>
            <span style={{ color: 'var(--text-mid)', fontSize: 9, minWidth: 70 }}>{c.agent}</span>
            <span style={{ color: 'var(--cyan)', fontSize: 9 }}>→</span>
            <span style={{ color: 'var(--text)', fontSize: 9, flex: 1 }}>/api/{c.endpoint}</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 8 }}>{c.timeAgo}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 8, color: 'var(--text-dim)', padding: '6px 0 0', textAlign: 'center' }}>
        agents: <span style={{ color: 'var(--cyan)' }}>terminalfeed.io/llms.txt</span>
      </div>
    </>),
    'the-wire': (<>
      <PanelHead panelId="the-wire" isStale={panelHealth.isStale('the-wire')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">The Wire</span></div>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{wire.index + 1}/{wire.total}</span>
      </PanelHead>
      <div style={{ padding: '4px 0', opacity: wire.fading ? 0 : 1, transition: 'opacity 0.5s ease' }}>
        <div style={{
          fontSize: wire.item.type === 'quote' ? 12 : 11,
          color: wire.item.type === 'meta' ? 'var(--cyan)' : wire.item.type === 'quote' ? 'var(--text)' : wire.item.type === 'history' ? 'var(--amber)' : 'var(--text-mid)',
          fontStyle: wire.item.type === 'quote' ? 'italic' : 'normal',
          lineHeight: 1.6,
        }}>
          {wire.item.type === 'history' && <span style={{ color: 'var(--cyan)' }}>+ </span>}
          {wire.item.type === 'fact' && <span style={{ color: 'var(--purple)' }}>+ </span>}
          {wire.item.text}
        </div>
      </div>
    </>),
    'wiki-live': (<>
      <PanelHead panelId="wiki-live" isStale={panelHealth.isStale('wiki-live')} layout={layout} getGridCols={getGridCols}>
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
      <PanelHead panelId="disasters" isStale={panelHealth.isStale('disasters')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Global Alerts</span><span className="panelTag">GDACS</span></div></PanelHead>
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
      <PanelHead panelId="gh-events" isStale={panelHealth.isStale('gh-events')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">GitHub</span><span className="panelTag">LIVE</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ghEvents.length === 0 && <LoadingOrHide />}
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
      <PanelHead panelId="books" isStale={panelHealth.isStale('books')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Books</span><span className="panelTag">TRENDING</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {trendingBooks.length === 0 && <LoadingOrHide />}
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
      <PanelHead panelId="forex" isStale={panelHealth.isStale('forex')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Forex</span><span className="panelTag">HEATMAP</span></div></PanelHead>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
        {forexRates.length === 0 && <LoadingOrHide label="loading rates..." style={{ gridColumn: 'span 2' }} />}
        {forexRates.map((r) => (
          <div key={r.currency} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 10 }}>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{r.currency}</span>
            <span style={{ color: r.change >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </>),
    'wikipedia': (<>
      <PanelHead panelId="wikipedia" isStale={panelHealth.isStale('wikipedia')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Wikipedia</span><span className="panelTag">FEATURED</span></div></PanelHead>
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
      ) : <LoadingOrHide />}
    </>),
    'producthunt': (<>
      <PanelHead panelId="producthunt" isStale={panelHealth.isStale('producthunt')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Product Hunt</span><span className="panelTag">TODAY</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {phProducts.length === 0 && <LoadingOrHide label="loading products..." />}
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
      <PanelHead panelId="hn-community" isStale={panelHealth.isStale('hn-community')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Show / Ask HN</span><span className="panelTag">COMMUNITY</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {hnCommunity.length === 0 && <LoadingOrHide />}
        {hnCommunity.map((item) => (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="newsRow">
            <span className="newsTag" style={{ color: item.type === 'show' ? 'var(--cyan)' : 'var(--purple)', background: item.type === 'show' ? 'rgba(79,209,197,0.1)' : 'rgba(167,139,250,0.1)' }}>{item.type === 'show' ? 'SHOW' : 'ASK'}</span>
            <span className="newsTitle">{item.title}</span>
            <span className="newsMeta">{item.score}pt</span>
          </a>
        ))}
      </div>
    </>),
    'ai-leaderboard': (<>
      <PanelHead panelId="ai-leaderboard" isStale={panelHealth.isStale('ai-leaderboard')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">AI Leaderboard</span><span className="panelTag">ELO</span></div></PanelHead>
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
      <PanelHead panelId="bluesky" isStale={panelHealth.isStale('bluesky')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Bluesky</span><span className="panelTag">LIVE</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {bskyPosts.length === 0 && <LoadingOrHide label="loading posts..." />}
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
      <PanelHead panelId="internet-pulse" isStale={panelHealth.isStale('internet-pulse')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Internet Pulse</span></div></PanelHead>
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
    'nasa-apod': (<>
      <PanelHead panelId="nasa-apod" isStale={panelHealth.isStale('nasa-apod')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Space</span>
          <span className="panelTag">NASA APOD</span>
        </div>
      </PanelHead>
      {nasaApod ? (
        <div>
          <a href={nasaApod.hdurl || nasaApod.url} target="_blank" rel="noopener noreferrer">
            <img src={nasaApod.url} alt={nasaApod.title} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 3, display: 'block' }} loading="lazy" />
          </a>
          <div style={{ padding: '6px 0 0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{nasaApod.title}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', lineHeight: 1.5, marginTop: 4, maxHeight: 54, overflow: 'hidden' }}>{nasaApod.explanation.slice(0, 200)}{nasaApod.explanation.length > 200 ? '...' : ''}</div>
            <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 4 }}>{nasaApod.date}{nasaApod.copyright ? ` · © ${nasaApod.copyright}` : ''}</div>
          </div>
        </div>
      ) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading photo...</div>}
    </>),
    'good-news': (<>
      <PanelHead panelId="good-news" isStale={panelHealth.isStale('good-news')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Good News</span>
          <span className="panelTag">UPLIFTING</span>
        </div>
      </PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {goodNews.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading good news...</div>}
        {goodNews.map((post) => (
          <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className="newsRow">
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="newsTitle">{post.title}</span>
            </div>
            <span className="redditSub">r/{post.subreddit}</span>
          </a>
        ))}
      </div>
    </>),
    'trending-movies': (<>
      <PanelHead panelId="trending-movies" isStale={panelHealth.isStale('trending-movies')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Trending</span>
          <span className="panelTag">MOVIES & TV</span>
        </div>
      </PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {trendingMovies.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading movies...</div>}
        {trendingMovies.map((m) => (
          <div key={m.id} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(26,26,34,0.5)' }}>
            {m.poster && <img src={m.poster} alt={m.title} style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} loading="lazy" />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, lineHeight: 1.3 }}>{m.title}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                <span style={{ color: m.rating >= 7 ? 'var(--green)' : m.rating >= 5 ? 'var(--amber)' : 'var(--red)' }}>{m.rating}/10</span>
                <span> · {m.mediaType === 'tv' ? 'TV' : 'Movie'}</span>
                {m.releaseDate && <span> · {m.releaseDate.slice(0, 4)}</span>}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.4, maxHeight: 28, overflow: 'hidden' }}>{m.overview.slice(0, 120)}{m.overview.length > 120 ? '...' : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </>),
    'humans-in-space': (<>
      <PanelHead panelId="humans-in-space" isStale={panelHealth.isStale('humans-in-space')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Humans In Space</span><span className="panelTag" style={{ color: 'var(--purple)' }}>LIVE</span></div></PanelHead>
      {humansInSpace ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--green)', fontFamily: 'monospace' }}>{humansInSpace.count}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>humans in orbit right now</div>
          </div>
          {humansInSpace.people.map((person, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: i < humansInSpace.people.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 11, fontFamily: 'monospace' }}>
              <span style={{ color: 'var(--text)' }}>{person.name}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: 9 }}>{person.craft}</span>
            </div>
          ))}
        </>
      ) : <LoadingOrHide />}
    </>),
    'this-day': (<>
      <PanelHead panelId="this-day" isStale={panelHealth.isStale('this-day')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">This Day In History</span><span className="panelTag" style={{ color: 'var(--amber)' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</span></div></PanelHead>
      {thisDayEvents.length === 0 && <LoadingOrHide />}
      {thisDayEvents.map((event, i) => (
        <div key={i} style={{ padding: '5px 0', borderBottom: i < thisDayEvents.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.4 }}>
          <span style={{ color: 'var(--green)', fontWeight: 600, marginRight: 8 }}>{event.year}</span>
          <span style={{ color: 'var(--text)' }}>{event.text.length > 100 ? event.text.slice(0, 100) + '...' : event.text}</span>
        </div>
      ))}
    </>),
    'originals': (<>
      <PanelHead panelId="originals" isStale={false} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">TF Originals</span>
          <span className="panelTag" style={{ color: 'var(--amber)' }}>BLOG</span>
        </div>
      </PanelHead>
      <OriginalsPanel />
    </>),
  };


  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to dashboard</a>
      {/* ── Top Bar ── */}
      <div className="topBar">
        <div className="topBarLeft">
          <span className="logoIcon">{'>'}_</span>
          <span className="logoText">TERMINALFEED</span>
          <span className="logoDot">.io</span>
          <span className="logoCursor" />
          <span className="topTerminals">{terminalsOnline} online</span>
          <a href="/live" target="_blank" rel="noopener noreferrer" className="liveBriefingLink"><span className="liveDot" />LIVE BRIEFING</a>
          <span className="topNavDivider">|</span>
          <a href="/tools" target="_blank" rel="noopener noreferrer" className="liveBriefingLink toolsLink">TOOLS</a>
          <span className="topNavDivider">|</span>
          <a href="/agent" target="_blank" rel="noopener noreferrer" className="liveBriefingLink agentLink">AGENTS</a>
          <span className="topNavDivider">|</span>
          <a href="/radio" target="_blank" rel="noopener noreferrer" className="liveBriefingLink radioLink">RADIO</a>
          <span className="topNavDivider">|</span>
          <a href="/wifi" target="_blank" rel="noopener noreferrer" className="liveBriefingLink wifiLink">WIFI</a>
          <span className="topNavDivider">|</span>
          <a href="/blog" target="_blank" rel="noopener noreferrer" className="liveBriefingLink blogLink">BLOG</a>
        </div>
        <div className="topBarRight">
          {!layout.isOrganizing && showLockTip && (
            <span className="lockTip">CLICK TO UNLOCK TABS →</span>
          )}
          <button
            className={`lockBtn ${layout.isOrganizing ? 'lockBtnActive' : ''}`}
            onClick={() => { layout.setIsOrganizing(!layout.isOrganizing); if (showLockTip) { setShowLockTip(false); sessionStorage.setItem('tipDismissed', '1'); } }}
            title={layout.isOrganizing ? 'Lock layout (E)' : 'Organize panels (E)'}
          >
            {layout.isOrganizing ? 'Organize' : 'Locked'}
          </button>
          <button
            className={`quietBtn ${isFullScreen ? 'quietBtnActive' : ''}`}
            onClick={toggleFullScreen}
            title="Toggle full screen (F)"
          >
            {isFullScreen ? 'Exit' : 'Full'}
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

      {/* ── Ticker Bar — flips between prices and sports ── */}
      <div className="tickerBar">
        <div className={`tickerLayer ${tickerShowSports ? 'tickerHidden' : ''}`}>
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
        {games.length > 0 && (
          <div className={`tickerLayer ${!tickerShowSports ? 'tickerHidden' : ''}`}>
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
      </div>

      {/* ── What's Happening + World Clocks (combined) ── */}
      <div className="nowSummary">
        <div className="nowLeft">
          <span className="nowPrefix">&gt;_</span>
          <span className="nowText">{(() => {
            const parts: string[] = [];
            if (btcPrice > 0) {
              const dir = btcChange >= 0 ? 'up' : 'down';
              parts.push(`BTC ${dir} ${Math.abs(btcChange).toFixed(1)}% at $${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
            }
            if (fearGreed) {
              parts.push(`Fear & Greed: ${fearGreed.value} (${fearGreed.label})`);
            }
            if (liveCount > 0) {
              parts.push(`${liveCount} live game${liveCount > 1 ? 's' : ''}`);
            }
            const bigQuake = earthquakes.find(q => q.magnitude >= 4.5);
            if (bigQuake) {
              parts.push(`M${bigQuake.magnitude.toFixed(1)} quake near ${bigQuake.place}`);
            }
            if (cryptoGlobal) {
              const capDir = cryptoGlobal.marketCapChange24h >= 0 ? 'up' : 'down';
              parts.push(`Crypto ${capDir} ${Math.abs(cryptoGlobal.marketCapChange24h).toFixed(1)}%`);
            }
            return parts.slice(0, 3).join(' · ') || 'Loading feeds...';
          })()}</span>
        </div>
        <div className="nowClocks">
          {worldClocks.slice(0, 6).map(c => (
            <span key={c.city} className="nowClock">
              <span style={{ fontSize: 11, color: c.isBusinessHours ? 'var(--gold)' : 'var(--blue)' }}>{c.isBusinessHours ? '●' : '◗'}</span>
              <span style={{ color: c.isBusinessHours ? 'var(--text)' : 'var(--text-dim)' }}>{c.city}</span>
              <span style={{ color: c.isBusinessHours ? 'var(--text)' : 'var(--text-mid)' }}>{c.time.toLowerCase().replace(' ', '')}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main Grid — rendered dynamically from panelOrder ── */}
      <div id="main-content" className={`grid ${layout.isOrganizing ? 'gridOrganizing' : ''}`}>
        {(() => {
          const userPanels = layout.panelOrder.filter(id =>
            layout.isVisible(id) && id !== 'support'
          );

          return userPanels.map((id, idx) => {
            const panelDef = ALL_PANELS.find(p => p.id === id);
            if (!panelDef) return null;
            const span = panelDef.defaultSpan > 1 ? 'spanCol2' : '';
            const content = panelRegistry[id as keyof typeof panelRegistry];
            if (!content) return null;

            const dragProps = layout.isOrganizing ? {
              draggable: true,
              onDragStart: (e: React.DragEvent) => {
                e.dataTransfer.setData('text/plain', id);
                e.dataTransfer.effectAllowed = 'move';
                (e.currentTarget as HTMLElement).classList.add('panelDragging');
              },
              onDragEnd: (e: React.DragEvent) => {
                (e.currentTarget as HTMLElement).classList.remove('panelDragging');
                document.querySelectorAll('.panelDragOver').forEach(el => el.classList.remove('panelDragOver'));
              },
              onDragOver: (e: React.DragEvent) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                (e.currentTarget as HTMLElement).classList.add('panelDragOver');
              },
              onDragLeave: (e: React.DragEvent) => {
                (e.currentTarget as HTMLElement).classList.remove('panelDragOver');
              },
              onDrop: (e: React.DragEvent) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.remove('panelDragOver');
                const fromId = e.dataTransfer.getData('text/plain');
                if (!fromId || fromId === id) return;
                const order = [...layout.panelOrder];
                const fromIdx = order.indexOf(fromId);
                const toIdx = order.indexOf(id);
                if (fromIdx === -1 || toIdx === -1) return;
                order.splice(fromIdx, 1);
                order.splice(toIdx, 0, fromId);
                layout.setPanelOrder(order);
              },
            } : {};

            // First 6 panels load immediately, rest are lazy
            if (idx < 6) {
              return (
                <div key={id} className={`panel ${span}`} data-panel-id={id} role="region" aria-label={`${panelDef.label} panel`} {...dragProps}>
                  <PanelErrorBoundary panelId={id}>{content}</PanelErrorBoundary>
                </div>
              );
            }
            return (
              <LazyPanel key={id} className={`panel ${span}`} data-panel-id={id} role="region" aria-label={`${panelDef.label} panel`} {...dragProps}>
                <PanelErrorBoundary panelId={id}>{content}</PanelErrorBoundary>
              </LazyPanel>
            );
          });
        })()}
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


      {/* ── Bottom Bar ── */}
      <div className="bottomBar">
        <div className="bottomBarLeft">
          <img src="/images/terminalfeed_logo.png" alt="TerminalFeed" className="ripperLogo" />
          <span className="ripperCredit">built by ripper</span>
          <span className="bottomBarDivider">&middot;</span>
          <span>terminalfeed.io</span>
          <span className="bottomBarDivider">&middot;</span>
          <span>Not financial advice</span>
          <span className="bottomBarDivider">&middot;</span>
          <a href="/about" className="footerLink">About</a>
          <a href="/features" className="footerLink">Features</a>
          <a href="/developers" className="footerLink">API</a>
          <a href="/changelog" className="footerLink">Changelog</a>
          <a href="/tools" className="footerLink">Dev Tools</a>
          <a href="/agent" className="footerLink">Agents</a>
          <a href="/cleaner" className="footerLink">Disk Cleaner</a>
          <a href="/radio" className="footerLink">Radio</a>
          <a href="/blog" className="footerLink">Blog</a>
          {/* WiFi link — uncomment after AdSense approval */}
          {/* <a href="/wifi" className="footerLink">WiFi</a> */}
          <a href="/privacy" className="footerLink">Privacy</a>
          <a href="/terms" className="footerLink">Terms</a>
          <span className="bottomBarDivider">&middot;</span>
          <a href="mailto:hello@terminalfeed.io" className="footerLink">Contact</a>
          <a href="mailto:feedback@terminalfeed.io" className="footerLink">Feedback</a>
          <a href="mailto:advertise@terminalfeed.io" className="footerLink">Advertise</a>
          <span className="bottomBarDivider">&middot;</span>
          <a href="https://x.com/terminalfeed" target="_blank" rel="noopener noreferrer" className="footerLink">@terminalfeed</a>
          <span className="bottomBarDivider">&middot;</span>
          <a href="https://tensorfeed.ai" target="_blank" rel="noopener noreferrer" className="footerLink">TensorFeed.ai</a>
          <a href="https://phreak.fm" target="_blank" rel="noopener noreferrer" className="footerLink">Phreak.fm</a>
        </div>
        <div className="bottomBarStatus">
          <span className="footerBtc" title="Support the terminal">3GLimw2rSrne3hfrsanjoVxrM2Dwsbmkdy</span>
          <button className="footerCopy" onClick={() => { navigator.clipboard.writeText('3GLimw2rSrne3hfrsanjoVxrM2Dwsbmkdy'); }}>copy</button>
          <span className="bottomBarDivider">&middot;</span>
          <span className="terminalsOnline">&gt;_ {terminalsOnline} terminal{terminalsOnline !== 1 ? 's' : ''} online</span>
          <span className="bottomBarDivider">&middot;</span>
          <span className="bottomBarDot" style={{
            background: (btcPrice > 0) ? 'var(--green)' : 'var(--red)',
          }} />
          <span>{(btcPrice > 0) ? 'All systems operational' : 'Connecting...'}</span>
        </div>
      </div>

      {/* ── Footer Quote ── */}
      {footerQuote && (
        <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-dim)', fontStyle: 'italic', padding: '4px 16px', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          &ldquo;{footerQuote.text}&rdquo; &mdash; {footerQuote.author}
        </div>
      )}

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

      {/* Admin Terminal */}
      {showTerminal && (
        <AdminTerminal layout={layout} onClose={() => setShowTerminal(false)} />
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
