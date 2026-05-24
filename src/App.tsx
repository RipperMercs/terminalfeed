import { useState, useEffect, useCallback, useRef } from 'react';
import { useBtcPrice } from './hooks/useBtcPrice';
import { useFearGreed } from './hooks/useFearGreed';
import { useHackerNews } from './hooks/useHackerNews';
import { useSisterOriginals } from './hooks/useSisterOriginals';
import { useTime } from './hooks/useTime';
import { useSimStocks, INDICES } from './hooks/useSimStocks';
import { useSimCrypto } from './hooks/useSimCrypto';
import { useRowFlashes } from './hooks/useRowFlashes';
import { useMetals } from './hooks/useMetals';
import { useSportsScores } from './hooks/useSportsScores';
import { LegalModal } from './components/LegalModal';
import { PanelErrorBoundary } from './components/PanelErrorBoundary';
import { BtcHero } from './components/BtcHero';
import { StatusWall } from './components/StatusWall';
import { LiveNowPanel } from './components/LiveNowPanel';
import { SeismicTimeline } from './components/SeismicTimeline';
import { InternetScope } from './components/InternetScope';
import { StateChip, Sparkline, Cascade, Typewriter } from './primitives';
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
import { WeatherForecastStrip } from './components/WeatherForecastStrip';
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
import { useHuggingFace } from './hooks/useHuggingFace';
import { useSolanaNetwork } from './hooks/useSolanaNetwork';
import { useHarnesses } from './hooks/useHarnesses';
import { useSpaceWeather } from './hooks/useSpaceWeather';
import { useWildfires } from './hooks/useWildfires';
import { useSevereWeather } from './hooks/useSevereWeather';
import { useFundingRates } from './hooks/useFundingRates';
import { useSecFilings } from './hooks/useSecFilings';
import { useTreasuryYields } from './hooks/useTreasuryYields';
import { useEonet } from './hooks/useEonet';
import { useAirQuality } from './hooks/useAirQuality';
import { useShodan } from './hooks/useShodan';
import { useVolcanoes } from './hooks/useVolcanoes';
import { useCfRadar } from './hooks/useCfRadar';
import { useFederalRegister } from './hooks/useFederalRegister';
import { useOpenFdaRecalls } from './hooks/useOpenFdaRecalls';
import { useGhReleases } from './hooks/useGhReleases';
import { usePypiTrends } from './hooks/usePypiTrends';
import { useCve } from './hooks/useCve';
import { useArxiv } from './hooks/useArxiv';
import { useLiquidations } from './hooks/useLiquidations';
import { useWikiFeatured } from './hooks/useWikiFeatured';
import { useNhcStorms } from './hooks/useNhcStorms';
import { useCertStream } from './hooks/useCertStream';
import { useBtcDifficulty } from './hooks/useBtcDifficulty';
import { useCongress } from './hooks/useCongress';
import { useLightning } from './hooks/useLightning';
import { useBlueskyFirehose } from './hooks/useBlueskyFirehose';
import { useLoadingTimeout } from './hooks/useLoadingTimeout';
import { GasPanel } from './panels/GasPanel';
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

  // Pause animations when tab is hidden: saves CPU in background
  useEffect(() => {
    const handler = () => {
      document.documentElement.style.setProperty('--anim-state', document.hidden ? 'paused' : 'running');
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
  const layout = useLayoutManager();
  const { data: priceData } = useBtcPrice();
  const fearGreed = useFearGreed();
  const stories = useHackerNews();
  const sisterOriginals = useSisterOriginals();
  const now = useTime();
  const stocks = useSimStocks();
  const crypto = useSimCrypto();
  const cryptoFlashes = useRowFlashes(crypto, c => c.symbol, c => c.price);
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
  const { gas: gasData, trend: gasTrend } = useGasTracker();
  const hfModels = useHuggingFace();
  const solanaNet = useSolanaNetwork();
  const harnesses = useHarnesses();
  const spaceWeather = useSpaceWeather();
  const wildfires = useWildfires();
  const severeWeather = useSevereWeather();
  const fundingRates = useFundingRates();
  const airQuality = useAirQuality();
  const shodan = useShodan();
  const volcanoes = useVolcanoes();
  const cfRadar = useCfRadar();
  const federalRegister = useFederalRegister();
  const fdaRecalls = useOpenFdaRecalls();
  const ghReleases = useGhReleases();
  const pypiTrends = usePypiTrends();
  const cve = useCve();
  const arxiv = useArxiv();
  const liquidations = useLiquidations();
  const wikiFeatured = useWikiFeatured();
  const nhcStorms = useNhcStorms();
  const certStream = useCertStream();
  const btcDifficulty = useBtcDifficulty();
  const congress = useCongress();
  const lightning = useLightning();
  const blueskyFirehose = useBlueskyFirehose();
  const secFilings = useSecFilings();
  const treasuryYields = useTreasuryYields();
  const eonet = useEonet();

  // Safety nets: if these panels never get data within their window, hide
  // them rather than wedge the viewer on a placeholder. Resets if data
  // eventually arrives.
  const hideLaunches = useLoadingTimeout(spaceLaunches.length > 0, 15000);
  const hideRecipes = useLoadingTimeout(recipes.length > 0, 12000);
  const hidePodcasts = useLoadingTimeout(podcastEpisodes.length > 0, 12000);
  const hideTcgMarket = useLoadingTimeout(!!(tcgMarket && tcgMarket.cards && tcgMarket.cards.length > 0), 12000);

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
      if (e.key === '+') {
        try {
          window.localStorage.setItem('tf_btc_roller', 'on');
          window.dispatchEvent(new Event('tf:btcroller-toggle'));
          window.dispatchEvent(new Event('tf:btcroller-test'));
        } catch { /* ignore */ }
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

  // Report panel health: auto-hide panels with failed APIs
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
    if (airQuality?.snapshot?.usAqi != null) panelHealth.reportData('air-quality');
    if (shodan && shodan.targets.length > 0) panelHealth.reportData('shodan');
    if (volcanoes && volcanoes.items.length > 0) panelHealth.reportData('volcanoes');
    if (cfRadar.kind === 'ready') panelHealth.reportData('cf-radar');
    if (federalRegister.length > 0) panelHealth.reportData('federal-register');
    if (fdaRecalls && fdaRecalls.recent.length > 0) panelHealth.reportData('openfda-recalls');
    if (ghReleases && ghReleases.recent.length > 0) panelHealth.reportData('gh-releases');
    if (pypiTrends.length > 0) panelHealth.reportData('pypi-trends');
    if (cve && (cve.kev_count > 0 || cve.nvd_count > 0)) panelHealth.reportData('cve');
    if (arxiv.length > 0) panelHealth.reportData('arxiv');
    if (liquidations && liquidations.totals.count > 0) panelHealth.reportData('liquidations');
    if (wikiFeatured) panelHealth.reportData('wiki-featured');
    if (nhcStorms) panelHealth.reportData('nhc-storms');
    if (certStream.length > 0) panelHealth.reportData('cert-stream');
    if (btcDifficulty) panelHealth.reportData('btc-difficulty');
    if (congress && (congress.presented_to_president.length > 0 || congress.most_viewed_bills.length > 0)) panelHealth.reportData('congress');
    if (lightning) panelHealth.reportData('lightning');
    if (blueskyFirehose.length > 0) panelHealth.reportData('bsky-firehose');
    if (spaceWeather && (spaceWeather.kpIndex != null || spaceWeather.solarWindSpeedKms != null)) panelHealth.reportData('space-weather');
    if (wildfires && !wildfires.error && wildfires.total24h > 0) panelHealth.reportData('wildfires');
    if (severeWeather && severeWeather.top.length > 0) panelHealth.reportData('severe-weather');
    if (fundingRates && fundingRates.top.length > 0) panelHealth.reportData('funding-rates');
    if (secFilings && secFilings.length > 0) panelHealth.reportData('sec-filings');
    if (treasuryYields && treasuryYields.curve.y10 != null) panelHealth.reportData('treasury-yields');
    if (eonet && eonet.totalOpen > 0) panelHealth.reportData('eonet');
  });

  // Bump a key whenever a new block lands so the mempool queue replays its entry animation
  const prevBtcHeightRef = useRef(0);
  const [mempoolFlashKey, setMempoolFlashKey] = useState(0);
  useEffect(() => {
    if (btcNet.blockHeight > 0 && prevBtcHeightRef.current > 0 && btcNet.blockHeight !== prevBtcHeightRef.current) {
      setMempoolFlashKey(k => k + 1);
    }
    prevBtcHeightRef.current = btcNet.blockHeight;
  }, [btcNet.blockHeight]);

  // Rolling history of Wikipedia edits-per-minute for the header sparkline.
  // useWikipediaLive recalculates the rate every 10s, so we get a new sample each time.
  const [wikiEpmHistory, setWikiEpmHistory] = useState<number[]>([]);
  useEffect(() => {
    if (wikiEPM <= 0) return;
    setWikiEpmHistory(h => [...h, wikiEPM].slice(-20));
  }, [wikiEPM]);

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

  // Panel registry: maps panel IDs to their JSX content
  // This enables dynamic rendering from panelOrder array
  const panelRegistry: Record<string, React.ReactNode> = {
    'bitcoin': <BtcHero layout={layout} panelHealth={panelHealth} getGridCols={getGridCols} />,
    'crypto': (() => {
      const btcEth = crypto.filter(c => ['BTC', 'ETH'].includes(c.symbol));
      const others = crypto.filter(c => !['BTC', 'ETH'].includes(c.symbol) && c.price > 0);
      const cryptoGainers = [...others].filter(c => c.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
      const cryptoLosers = [...others].filter(c => c.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
      const movers = [...cryptoGainers, ...cryptoLosers];
      const topMoverSymbol = movers.length > 0
        ? movers.reduce((max, c) => Math.abs(c.change) > Math.abs(max.change) ? c : max).symbol
        : '';
      const rowClass = (sym: string) => {
        const f = cryptoFlashes[sym];
        return 'listRow'
          + (f === 'up' ? ' rowFlashUp' : f === 'dn' ? ' rowFlashDn' : '')
          + (sym && sym === topMoverSymbol ? ' cryptoTopMover' : '');
      };
      return (<>
        <PanelHead panelId="crypto" isStale={panelHealth.isStale('crypto')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft">
            <span className="panelTitle">Crypto</span>
            <a href="/bitcoin-ticker" style={{ fontSize: 9, color: 'var(--text-dim)', marginLeft: 8, textDecoration: 'none', letterSpacing: '0.5px' }} title="Bitcoin Ticker landing page">BITCOIN TICKER &rarr;</a>
          </div>
          <div className="panelLive"><span className="liveDot" /><span className="liveText">LIVE</span></div>
        </PanelHead>
        <div className="cryptoPanel">
          <div className="cryptoSectionLabel">Top Movers</div>
          <div className="cryptoBody">
            {cryptoGainers.map(c => (<div key={c.symbol} className={rowClass(c.symbol)}><div><span style={{ color: 'var(--green)', marginRight: 4, fontSize: 9 }}>▲</span><span className="listRowSymbol">{c.symbol}</span></div><div><span className="listRowPrice">${c.price < 1 ? c.price.toFixed(4) : c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className="listRowChange tickerUp" style={{ fontWeight: 600 }}>+{c.change.toFixed(2)}%</span>{c.change > 5 && <span style={{ marginLeft: 3, fontSize: 10 }}>🔥</span>}</div></div>))}
            {cryptoLosers.map(c => (<div key={c.symbol} className={rowClass(c.symbol)}><div><span style={{ color: 'var(--red)', marginRight: 4, fontSize: 9 }}>▼</span><span className="listRowSymbol">{c.symbol}</span></div><div><span className="listRowPrice">${c.price < 1 ? c.price.toFixed(4) : c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className="listRowChange tickerDown" style={{ fontWeight: 600 }}>{c.change.toFixed(2)}%</span>{c.change < -5 && <span style={{ marginLeft: 3, fontSize: 10 }}>💀</span>}</div></div>))}
          </div>
          <div className="cryptoMarketWrap">
            <div className="cryptoSectionLabel">Market</div>
            {btcEth.map(c => (<div key={c.symbol} className={rowClass(c.symbol)}><div><span className="listRowSymbol">{c.symbol}</span></div><div><span className="listRowPrice">${c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className={`listRowChange ${c.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>{c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%</span></div></div>))}
            {cryptoGlobal && (<>
              <div className="listRow"><div><span className="listRowSymbol" style={{ fontSize: 9 }}>Total Cap</span></div><div><span style={{ fontSize: 10, color: 'var(--text-mid)' }}>${formatCompact(cryptoGlobal.totalMarketCap)}</span><span className={`listRowChange ${cryptoGlobal.marketCapChange24h >= 0 ? 'tickerUp' : 'tickerDown'}`} style={{ fontSize: 9 }}>{cryptoGlobal.marketCapChange24h >= 0 ? '+' : ''}{cryptoGlobal.marketCapChange24h.toFixed(1)}%</span></div></div>
              <div className="listRow"><div><span className="listRowSymbol" style={{ fontSize: 9 }}>BTC Dom</span></div><span style={{ fontSize: 10, color: 'var(--text-mid)' }}>{cryptoGlobal.btcDominance.toFixed(1)}%</span></div>
              <div className="listRow"><div><span className="listRowSymbol" style={{ fontSize: 9 }}>24h Vol</span></div><span style={{ fontSize: 10, color: 'var(--text-mid)' }}>${formatCompact(cryptoGlobal.totalVolume24h)}</span></div>
            </>)}
          </div>
        </div>
      </>);
    })(),
    'gas': <GasPanel gas={gasData} trend={gasTrend} layout={layout} panelHealth={panelHealth} getGridCols={getGridCols} />,
    'solana-network': (<>
      <PanelHead panelId="solana-network" isStale={panelHealth.isStale('solana-network')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Solana Network</span><span className="panelTag" style={{ color: 'var(--green)', background: 'rgba(74,222,128,0.1)' }}>TPS</span></div>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>30s</span>
      </PanelHead>
      {!solanaNet ? <LoadingOrHide label="loading network..." /> : (<>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 600, color: 'var(--green)', letterSpacing: -1 }}>{(solanaNet.tps ?? 0).toLocaleString()}</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>tx / sec</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10 }}>
          <div className="listRow">
            <span style={{ color: 'var(--text-dim)', minWidth: 80 }}>3-MIN AVG</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{(solanaNet.tpsAvg ?? 0).toLocaleString()} tps</span>
          </div>
          <div className="listRow">
            <span style={{ color: 'var(--text-dim)', minWidth: 80 }}>SLOT TIME</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{solanaNet.slotMs ? `${solanaNet.slotMs} ms` : 'n/a'}</span>
          </div>
          <div className="listRow">
            <span style={{ color: 'var(--text-dim)', minWidth: 80 }}>SLOT</span>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono, monospace)' }}>{(solanaNet.slot ?? 0).toLocaleString()}</span>
          </div>
          <div className="listRow">
            <span style={{ color: 'var(--text-dim)', minWidth: 80 }}>EPOCH</span>
            <span style={{ color: 'var(--text)' }}>{solanaNet.epoch ?? 0} <span style={{ color: 'var(--text-dim)' }}>({(solanaNet.epochProgress ?? 0).toFixed(1)}%)</span></span>
          </div>
        </div>
      </>)}
    </>),
    'btc-network': (<>
      <PanelHead panelId="btc-network" isStale={panelHealth.isStale('btc-network')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">BTC Network</span>
          <span className="panelTag">MEMPOOL</span>
          <a href="/bitcoin-ticker" style={{ fontSize: 9, color: 'var(--text-dim)', marginLeft: 8, textDecoration: 'none', letterSpacing: '0.5px' }} title="Bitcoin Ticker landing page">BITCOIN TICKER &rarr;</a>
        </div>
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
      {(btcNet.mempoolBlocks?.length ?? 0) > 0 && (
        <div className="mempoolQueue">
          <div className="mempoolQueueHeader">
            <span>Mempool Queue</span>
            <span>{btcNet.mempoolCount > 0 ? `${formatCompact(btcNet.mempoolCount)} pending` : ''}</span>
          </div>
          {(btcNet.mempoolBlocks ?? []).slice(0, 5).map((mb, i) => {
            const fee = Math.max(0, Math.round(mb.medianFee ?? 0));
            const tone = fee >= 50 ? 'high' : fee >= 20 ? 'mid' : fee >= 5 ? 'low' : 'min';
            const sizeMB = ((mb.blockVSize ?? 0) / 1e6).toFixed(2);
            return (
              <div
                key={`mq-${mempoolFlashKey}-${i}`}
                className={`mempoolBlock mempoolBlock-${tone}${i === 0 ? ' mempoolBlockTop' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="mempoolBlockLabel">{i === 0 ? 'NEXT' : `+${i}`}</span>
                <span className="mempoolBlockFee">~{fee}<span className="mempoolBlockUnit"> sat/vB</span></span>
                <span className="mempoolBlockTx">{(mb.nTx ?? 0).toLocaleString()} tx</span>
                <span className="mempoolBlockSize">{sizeMB} MvB</span>
              </div>
            );
          })}
        </div>
      )}
      {btcNet.diffProgress > 0 && (<div className="diffBarWrap"><div className="diffBarLabel"><span>Epoch Progress</span><span>{btcNet.diffRemainingBlocks} blocks remain</span></div><div className="diffBar"><div className="diffBarFill" style={{ width: `${btcNet.diffProgress}%` }} /></div></div>)}
      {btcNet.recentBlocks.length > 0 && (<div className="recentBlocksWrap"><div className="recentBlocksTitle">Recent Blocks</div><div className="recentBlocksList">{btcNet.recentBlocks.map((b) => (<div key={b.height} className="recentBlockRow"><span className="rbHeight">{b.height.toLocaleString()}</span><span className="rbPool">{b.pool}</span><span className="rbTxCount">{b.txCount} tx</span><span className="rbSize">{(b.size / 1e6).toFixed(2)} MB</span><span className="rbTime">{timeAgo(b.timestamp)}</span></div>))}</div></div>)}
      {whaleTxs.length > 0 && (<div className="recentBlocksWrap"><div className="recentBlocksTitle">Whale Watch</div><div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{whaleTxs.map((tx) => { const isHuge = tx.btc >= 10; const usdValue = tx.btc * btcPrice; return (<a key={tx.txid} href={`https://mempool.space/tx/${tx.txid}`} target="_blank" rel="noopener noreferrer" className="newsRow"><span style={{ fontSize: 12, flexShrink: 0 }}>🐋</span><span style={{ fontSize: 11, color: isHuge ? 'var(--gold)' : 'var(--amber)', fontWeight: 700, minWidth: 75 }}>{tx.btc.toFixed(4)} BTC</span><span style={{ fontSize: 10, color: 'var(--text-dim)', flex: 1 }}>${usdValue >= 1e6 ? (usdValue / 1e6).toFixed(1) + 'M' : usdValue >= 1e3 ? (usdValue / 1e3).toFixed(0) + 'K' : usdValue.toFixed(0)}</span><span className="newsMeta">{timeAgo(Math.floor(tx.time / 1000))}</span></a>); })}</div></div>)}
    </>),
    'news': (<>
      <PanelHead panelId="news" isStale={panelHealth.isStale('news')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Tech / AI Feed</span><span className="panelTag">HN</span></div>
        <div className="panelLive"><span className="liveDot" /><span className="liveText">LIVE</span></div>
      </PanelHead>
      {stories.length > 0 && (
        <div className="newsMarquee" aria-hidden="true">
          <div className="newsMarqueeTrack">
            {[...stories.slice(0, 6), ...stories.slice(0, 6)].map((s, i) => (
              <span key={`${s.id}-${i}`} className="newsMarqueeItem">
                <span className="newsMarqueeTag">{getTag(s.title)}</span>
                {s.title}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="newsFilters">
        {['ALL', 'AI', 'BTC', 'Markets', 'Tech', 'Dev'].map((f) => (
          <button key={f} className={`newsPill ${(f === 'ALL' && !newsFilter) || newsFilter === f ? 'newsPillActive' : ''}`} onClick={() => setNewsFilter(f === 'ALL' ? null : f)}>{f}</button>
        ))}
      </div>
      <div>
        {!newsFilter && sisterOriginals.map((s, i) => { const sc = s.source === 'VR.ORG' ? 'var(--cyan)' : 'var(--purple)'; return (
          <a key={`sis-${i}`} href={s.link} target="_blank" rel="noopener noreferrer" className="newsRow" title={`${s.source === 'VR.ORG' ? 'VR.org' : 'TensorFeed'} original`}>
            <span className="newsTag" style={{ color: sc, background: `${sc}15`, minWidth: 30 }}>{s.source === 'VR.ORG' ? 'VR.ORG' : 'TF'}</span>
            <span className="newsTitle">{s.title}</span>
            <span className="newsMeta">{timeAgo(s.time)}</span>
          </a>); })}
        {stories.length === 0 && <StateChip kind="waiting" label="HN" block />}
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
        {rssNews.length === 0 && <StateChip kind="waiting" label="RSS" block />}
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
        {trendingRepos.length === 0 && <StateChip kind="waiting" label="GITHUB" block />}
        {trendingRepos.map((repo) => (<a key={repo.fullName} href={repo.url} target="_blank" rel="noopener noreferrer" className="newsRow"><span className="ghStars">{formatStars(repo.stars)}</span><div style={{ flex: 1, minWidth: 0 }}><div className="ghRepoName">{repo.fullName}</div><div className="ghRepoDesc">{repo.description}</div></div>{repo.language && <span className="ghLang">{repo.language}</span>}</a>))}
      </div>
    </>),
    'huggingface': (<>
      <PanelHead panelId="huggingface" isStale={panelHealth.isStale('huggingface')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">HuggingFace</span><span className="panelTag" style={{ color: 'var(--purple)', background: 'rgba(167,139,250,0.1)' }}>TRENDING</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {hfModels.length === 0 && <StateChip kind="waiting" label="HF" block />}
        {hfModels.map((m) => (<a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="newsRow"><span className="ghStars">{formatStars(m.likes ?? 0)}</span><div style={{ flex: 1, minWidth: 0 }}><div className="ghRepoName">{m.id}</div><div className="ghRepoDesc">{(m.downloads ?? 0).toLocaleString()} downloads</div></div>{m.pipeline && <span className="ghLang">{m.pipeline}</span>}</a>))}
      </div>
    </>),
    'market-hours': (() => {
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
      const handAngleDeg = (utcHours / 24) * 360 - 90;
      const sessions = [
        { start: 13.5, end: 20, color: '#60A5FA', label: 'NYSE' },
        { start: 8,    end: 16.5, color: '#A78BFA', label: 'LSE' },
        { start: 0,    end: 6,  color: '#F59E0B', label: 'TSE' },
        { start: 1.5,  end: 8,  color: '#22D3EE', label: 'HKG' },
      ];
      const arcPath = (startH: number, endH: number) => {
        const rad = Math.PI / 180;
        const a1 = (startH / 24) * 360 - 90;
        const a2 = (endH / 24) * 360 - 90;
        const x1 = 100 + 70 * Math.cos(a1 * rad);
        const y1 = 85 + 70 * Math.sin(a1 * rad);
        const x2 = 100 + 70 * Math.cos(a2 * rad);
        const y2 = 85 + 70 * Math.sin(a2 * rad);
        const large = (a2 - a1 + 360) % 360 > 180 ? 1 : 0;
        return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A 70 70 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
      };
      const isSessionOpen = (s: typeof sessions[number]) => {
        return s.start < s.end
          ? (utcHours >= s.start && utcHours < s.end)
          : (utcHours >= s.start || utcHours < s.end);
      };
      const handRad = handAngleDeg * Math.PI / 180;
      return (<>
      <PanelHead panelId="market-hours" isStale={panelHealth.isStale('market-hours')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Market Hours</span><span className="panelTag">GLOBAL</span></div>
        {fearGreed && <span style={{ fontSize: 9, color: fgColor(fearGreed.value) }}>F&G {fearGreed.value}</span>}
      </PanelHead>
      <div className="marketClock" aria-hidden="true">
        <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMid meet">
          <circle cx="100" cy="85" r="78" fill="none" stroke="#1f1f24" strokeWidth="1" />
          {sessions.map(s => {
            const open = isSessionOpen(s);
            return (
              <path key={s.label} d={arcPath(s.start, s.end)} fill="none" stroke={s.color} strokeWidth={open ? 3.5 : 2.2} opacity={open ? 0.92 : 0.22} style={open ? { filter: `drop-shadow(0 0 4px ${s.color})` } : undefined} />
            );
          })}
          <line x1="100" y1="85" x2={(100 + 62 * Math.cos(handRad)).toFixed(2)} y2={(85 + 62 * Math.sin(handRad)).toFixed(2)} stroke="var(--green)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 3px var(--green))' }} />
          <circle cx="100" cy="85" r="3" fill="var(--green)" />
          <text x="100" y="12" textAnchor="middle" fill="#7a7a7a" fontSize="8" fontFamily="monospace">00 UTC</text>
          <text x="192" y="88" textAnchor="end" fill="#7a7a7a" fontSize="8" fontFamily="monospace">06</text>
          <text x="100" y="166" textAnchor="middle" fill="#7a7a7a" fontSize="8" fontFamily="monospace">12</text>
          <text x="8" y="88" fill="#7a7a7a" fontSize="8" fontFamily="monospace">18</text>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {marketHours.map((mkt) => {
          const dotClass = mkt.isOpen ? mkt.isExtended ? 'marketExtended' : 'marketOpen' : 'marketClosed';
          const eventClass = mkt.isOpen ? mkt.isExtended ? 'marketEventExtended' : 'marketEventOpen' : 'marketEventClosed';
          const label = mkt.isOpen ? mkt.isExtended ? 'EXT' : 'OPEN' : mkt.abbr === 'BTC' ? '24/7' : 'CLOSED';
          return (<div key={mkt.abbr} className="marketHoursRow"><div className="marketHoursLeft"><span className={`marketDot ${dotClass}`} /><span className="marketAbbr">{mkt.abbr}</span></div><div className="marketHoursRight">{mkt.localTime && <span className="marketTime">{mkt.localTime}</span>}<span className={`marketEvent ${eventClass}`}>{label}</span><span className="marketCountdown">{mkt.nextEvent}</span></div></div>);
        })}
      </div>
      </>);
    })(),
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
        {(() => {
          const nyse = marketHours.find(m => m.abbr === 'NYSE');
          const pre = marketHours.find(m => m.abbr === 'PRE');
          const ah = marketHours.find(m => m.abbr === 'AH');
          const sessionState = nyse?.isOpen ? 'open' : (pre?.isOpen || ah?.isOpen) ? 'extended' : 'closed';
          const label = sessionState === 'open' ? 'NYSE OPEN' : sessionState === 'extended' ? (pre?.isOpen ? 'PRE-MARKET' : 'AFTER-HOURS') : 'NYSE CLOSED';
          return (
            <div className={`marketSessionStrip marketSession-${sessionState}`} title={label}>
              <span className="marketSessionLabel">{label}</span>
            </div>
          );
        })()}
        <div className="marketsPanel">
          <div className="marketsSectionLabel">Top Movers</div>
          <div className="marketsBody">
            {gainers.map(s => (<div key={s.symbol} className="listRow"><div><span style={{ color: 'var(--green)', marginRight: 4, fontSize: 9 }}>▲</span><span className="listRowSymbol">{s.symbol}</span><span className="listRowName">{s.name}</span></div><div><span className="listRowPrice">${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className="listRowChange tickerUp" style={{ fontWeight: 600 }}>+{s.change.toFixed(2)}%</span>{s.change > 3 && <span style={{ marginLeft: 3, fontSize: 10 }}>🔥</span>}</div></div>))}
            {losers.map(s => (<div key={s.symbol} className="listRow"><div><span style={{ color: 'var(--red)', marginRight: 4, fontSize: 9 }}>▼</span><span className="listRowSymbol">{s.symbol}</span><span className="listRowName">{s.name}</span></div><div><span className="listRowPrice">${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className="listRowChange tickerDown" style={{ fontWeight: 600 }}>{s.change.toFixed(2)}%</span>{s.change < -3 && <span style={{ marginLeft: 3, fontSize: 10 }}>💀</span>}</div></div>))}
          </div>
          <div className="marketsIndicesWrap">
            <div className="marketsSectionLabel">Indices</div>
            {indicesData.map(s => (<div key={s.symbol} className="listRow"><div><span className="listRowSymbol">{s.symbol}</span><span className="listRowName">{s.name}</span></div><div><span className="listRowPrice">${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span className={`listRowChange ${s.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>{s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%</span></div></div>))}
            {metals.filter(m => m.price > 0).map(m => (<div key={m.symbol} className="listRow"><div><span className="listRowSymbol" style={{ color: 'var(--gold)' }}>{m.symbol}</span><span className="listRowName">{m.name}</span></div><div><span className="listRowPrice" style={{ color: 'var(--gold)' }}>${m.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span><span className={`listRowChange ${m.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>{m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%</span></div></div>))}
          </div>
        </div>
      </>);
    })(),
    'status-wall': <StatusWall layout={layout} panelHealth={panelHealth} getGridCols={getGridCols} />,
    'live-now': <LiveNowPanel layout={layout} panelHealth={panelHealth} getGridCols={getGridCols} />,
    'seismic-timeline': <SeismicTimeline layout={layout} panelHealth={panelHealth} getGridCols={getGridCols} />,
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
        {weather.forecast && <WeatherForecastStrip forecast={weather.forecast} />}
      </div>) : <StateChip kind="waiting" label="GEO" block />}
    </>),
    'seismic': (<>
      <PanelHead panelId="seismic" isStale={panelHealth.isStale('seismic')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Seismic</span><span className="panelTag">24H</span></div><span style={{ fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.5px' }}>USGS M2.5+</span></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {earthquakes.length === 0 && <StateChip kind="waiting" label="USGS" block />}
        {earthquakes.map((q) => { const mc = q.magnitude >= 5 ? 'var(--red)' : q.magnitude >= 4 ? 'var(--amber)' : 'var(--text-mid)'; return (<a key={q.id} href={q.url} target="_blank" rel="noopener noreferrer" className="quakeRow"><span className="quakeMag" style={{ color: mc }}>{q.magnitude.toFixed(1)}</span><span className="quakePlace">{q.place}</span><span className="quakeTime">{timeAgo(Math.floor(q.time / 1000))}</span></a>); })}
      </div>
    </>),
    'launches': hideLaunches ? null : (() => {
      const upcoming = spaceLaunches.filter(l => l.dateTs > 0 && l.dateTs > now.getTime());
      const nextLaunch = upcoming[0];
      const rest = upcoming.slice(1);
      const diff = nextLaunch ? Math.max(0, nextLaunch.dateTs - now.getTime()) : 0;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      return (<>
        <PanelHead panelId="launches" isStale={panelHealth.isStale('launches')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Launches</span><span className="panelTag">SPACE</span></div></PanelHead>
        {spaceLaunches.length === 0 && <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading launches...</div>}
        {nextLaunch && (
          <div className="tminus">
            <div className="tminusLabel">T&minus;MINUS</div>
            <div className="tminusBig">{h < 100 ? pad(h) : h}:{pad(m)}:{pad(s)}</div>
            <div className="tminusMission">{nextLaunch.provider} &middot; {nextLaunch.name}</div>
            {nextLaunch.location && <div className="tminusPad">{nextLaunch.location}</div>}
            {rest.length > 0 && (
              <div className="tminusUp">
                {rest.slice(0, 4).map(l => {
                  const d = Math.max(0, l.dateTs - now.getTime());
                  const totalHours = Math.round(d / 3600000);
                  const offset = totalHours < 72 ? `+${totalHours}h` : `+${Math.round(totalHours / 24)}d`;
                  return (
                    <div key={l.id} className="tminusUpRow"><span>{l.name}</span><span>{offset}</span></div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {!nextLaunch && spaceLaunches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {spaceLaunches.map((l) => { const isToday = l.dateTs > 0 && l.dateTs - Date.now() < 86400000 && l.dateTs > Date.now(); const isSoon = l.dateTs > 0 && l.dateTs - Date.now() < 86400000 * 3 && l.dateTs > Date.now(); const dc = isToday ? 'var(--green)' : isSoon ? 'var(--amber)' : 'var(--text-dim)'; return (<div key={l.id} className="launchRow"><div className="launchInfo"><span className="launchProvider">{l.provider}</span><span className="launchName">{l.name}</span></div><div className="launchMeta"><span className="launchDate" style={{ color: dc }}>{l.date}</span><span className="launchLoc">{l.location}</span></div></div>); })}
          </div>
        )}
      </>);
    })(),
    'stackoverflow': (<>
      <PanelHead panelId="stackoverflow" isStale={panelHealth.isStale('stackoverflow')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Stack Overflow</span><span className="panelTag">HOT</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {soQuestions.length === 0 && <StateChip kind="waiting" label="STACK" block />}
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
      ) : <StateChip kind="waiting" label="MUSEUM" block />}
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
    'recipe': hideRecipes ? null : (<>
      <PanelHead panelId="recipe" isStale={panelHealth.isStale('recipe')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Tonight</span><span className="panelTag">HANGRYHQ</span></div></PanelHead>
      {recipes.length > 0 ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{recipes.map((r, i) => (<a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="recipeContent">{r.thumbnail ? <img src={r.thumbnail} alt={r.name} className="recipeThumbnail" loading="lazy" /> : null}<div className="recipeInfo"><div className="recipeName">{r.name}</div><div className="recipeMeta">{[r.area, r.category, r.timeMinutes ? `${r.timeMinutes}m` : ''].filter(Boolean).join(' · ')}</div></div></a>))}<a href="https://hangryhq.com/recipes" target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: 'var(--cyan)', textAlign: 'right', textDecoration: 'none', paddingTop: 2 }}>more recipes at HangryHQ &rarr;</a></div>) : <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>loading recipes...</div>}
    </>),
    'daily-learn': (<>
      <PanelHead panelId="daily-learn" isStale={panelHealth.isStale('daily-learn')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Daily</span><span className="panelTag">LEARN</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div><div className="dailySectionTitle">On This Day</div>{todayInTech.map((evt, i) => <div key={i} className="historyRow"><span className="historyYear">{evt.year}</span><span className="historyEvent">{evt.event}</span></div>)}</div>
        <div><div className="dailySectionTitle">Term of the Day</div><div className="termWord">{todayTerm.term}</div><div className="termDef">{todayTerm.definition}</div></div>
      </div>
    </>),
    'podcasts': hidePodcasts ? null : (<>
      <PanelHead panelId="podcasts" isStale={panelHealth.isStale('podcasts')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Podcasts</span><span className="panelTag">LATEST</span></div></PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {podcastEpisodes.length === 0 && <StateChip kind="waiting" label="PODCASTS" block />}
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
        {predictionMarkets.length === 0 && <StateChip kind="waiting" label="POLYMARKET" block />}
        {predictionMarkets.map((m) => (
          <div key={m.id} className="predRibbon">
            <div className="predRibbonTitle">
              <span>{m.title}</span>
              <span className="predRibbonPct">{m.probability}%</span>
            </div>
            <div className="predRibbonBar">
              <div className="predRibbonFill" style={{ width: `${m.probability}%` }} />
            </div>
            {m.volume > 0 && <div className="predRibbonVol">Vol: ${m.volume >= 1e6 ? (m.volume / 1e6).toFixed(1) + 'M' : m.volume >= 1e3 ? (m.volume / 1e3).toFixed(0) + 'K' : m.volume.toFixed(0)}</div>}
          </div>
        ))}
        <div style={{ fontSize: 8, color: 'var(--text-dim)', textAlign: 'center', paddingTop: 4 }}>data from polymarket.com</div>
      </div>
    </>),
    'tcg-market': hideTcgMarket ? null : (<>
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
        {steamGames.length === 0 && <StateChip kind="waiting" label="STEAM" block />}
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
      <div style={{ padding: '4px 0' }}>
        <div style={{
          fontSize: wire.item.type === 'quote' ? 12 : 11,
          color: wire.item.type === 'meta' ? 'var(--cyan)' : wire.item.type === 'quote' ? 'var(--text)' : wire.item.type === 'history' ? 'var(--amber)' : 'var(--text-mid)',
          fontStyle: wire.item.type === 'quote' ? 'italic' : 'normal',
          lineHeight: 1.6,
        }}>
          {wire.item.type === 'history' && <span style={{ color: 'var(--cyan)' }}>+ </span>}
          {wire.item.type === 'fact' && <span style={{ color: 'var(--purple)' }}>+ </span>}
          <Typewriter text={wire.item.text ?? ''} />
        </div>
      </div>
    </>),
    'wiki-live': (<>
      <PanelHead panelId="wiki-live" isStale={panelHealth.isStale('wiki-live')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Wikipedia</span><span className="panelTag">LIVE EDITS</span></div>
        <span style={{ fontSize: 9, color: 'var(--cyan)' }}>{wikiEPM > 0 ? `${wikiEPM}/min` : ''}</span>
      </PanelHead>
      {wikiEpmHistory.length >= 2 && (
        <div className="wikiHead">
          <div className="wikiRate">{wikiEPM}<span className="wikiRateUnit">/min</span></div>
          <div className="wikiSparkWrap">
            <Sparkline points={wikiEpmHistory} color="var(--green)" ariaLabel="Wikipedia edits per minute" />
          </div>
        </div>
      )}
      <div className="wikiLiveStream" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {wikiEdits.length === 0 && <StateChip kind="waiting" label="WIKIMEDIA SSE" block />}
        {wikiEdits.map((e, i) => (
          <a key={`${e.timestamp}-${e.title}-${e.user}`} href={e.url} target="_blank" rel="noopener noreferrer" className="newsRow" style={{ animationDelay: `${i * 0.05}s` }}>
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
      {ghEvents.length === 0 ? <StateChip kind="waiting" label="GITHUB EVENTS" block /> : (
        <Cascade
          events={ghEvents.map(e => ({ id: e.id, action: e.action, repo: e.repo, time: e.time }))}
          ariaLabel="GitHub events stream"
          renderLine={(e) => (<>
            <span className="ghCascadeAction">{e.action}</span>
            <span className="ghCascadeRepo">{e.repo}</span>
            <span className="ghCascadeTime">{e.time ? timeAgo(Math.floor(new Date(e.time).getTime() / 1000)) : ''}</span>
          </>)}
        />
      )}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {phProducts.length === 0 && <LoadingOrHide label="loading products..." />}
        {phProducts.map((p, i) => (
          <a key={i} href={p.link} target="_blank" rel="noopener noreferrer" className="newsRow" style={{ alignItems: 'flex-start' }}>
            <span style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700, flexShrink: 0, minWidth: 16, paddingTop: 1 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="newsTitle" style={{ fontWeight: 600 }}>{p.title}</div>
              {p.tagline && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.tagline}</div>}
            </div>
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
    'harnesses': (<>
      <PanelHead panelId="harnesses" isStale={panelHealth.isStale('harnesses')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">AI Coding Harnesses</span>
          <span className="panelTag" style={{ color: 'var(--purple)', background: 'rgba(167,139,250,0.1)' }}>BENCH</span>
        </div>
        <a href="/harnesses" style={{ fontSize: 9, color: 'var(--text-dim)', textDecoration: 'none' }}>view &rarr;</a>
      </PanelHead>
      {!harnesses && <LoadingOrHide label="loading benchmarks..." />}
      {harnesses && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {harnesses.topCombined.slice(0, 6).map((row, i) => (
            <div key={row.harness + row.model} className="listRow">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 10, color: i < 3 ? 'var(--gold)' : 'var(--text-dim)', fontWeight: 700, minWidth: 16 }}>#{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <span className="listRowSymbol">{row.harness}</span>
                  <span className="listRowName" style={{ display: 'block', fontSize: 9, color: 'var(--purple)' }}>{row.model}</span>
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{(row.combinedScore ?? 0).toFixed(1)}</span>
            </div>
          ))}
          {harnesses.biggestHarnessGaps.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>biggest harness gap</div>
              <div style={{ fontSize: 10, color: 'var(--text)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--text)' }}>{harnesses.biggestHarnessGaps[0].model}</span>:{' '}
                <span style={{ color: 'var(--green)' }}>{harnesses.biggestHarnessGaps[0].best.harness}</span> vs{' '}
                <span style={{ color: 'var(--red)' }}>{harnesses.biggestHarnessGaps[0].worst.harness}</span>{' '}
                <span style={{ color: 'var(--amber)', fontWeight: 600 }}>+{(harnesses.biggestHarnessGaps[0].delta ?? 0).toFixed(1)}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 9 }}> on {harnesses.biggestHarnessGaps[0].benchmark}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>),
    'space-weather': (() => {
      const kp = spaceWeather?.kpIndex ?? null;
      const kpColor = kp == null ? 'var(--text-dim)' : kp < 5 ? 'var(--green)' : kp < 7 ? 'var(--amber)' : 'var(--red)';
      const flare = spaceWeather?.flareClass24h ?? null;
      const flareColor = flare === 'A' || flare === 'B' ? 'var(--green)' : flare === 'C' ? 'var(--amber)' : flare === 'M' || flare === 'X' ? 'var(--red)' : 'var(--text-dim)';
      const stormPretty = (spaceWeather?.kpStormLevel ?? '').replace(/_/g, ' ');
      const auroraVis = spaceWeather?.auroraVisibility ?? null;
      const auroraText = auroraVis && auroraVis !== 'high_latitude_only' ? auroraVis.replace(/_/g, ' ') : null;
      return (<>
        <PanelHead panelId="space-weather" isStale={panelHealth.isStale('space-weather')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Space Weather</span><span className="panelTag">NOAA</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>5m</span>
        </PanelHead>
        {!spaceWeather && <LoadingOrHide label="loading swpc..." />}
        {spaceWeather && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ minWidth: 60 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: kpColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{kp != null ? kp.toFixed(1) : '–'}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>Kp index</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text)', textTransform: 'capitalize' }}>{stormPretty || '-'}</div>
                {auroraText && <div style={{ fontSize: 9, color: 'var(--cyan)', marginTop: 2 }}>aurora visible: {auroraText}</div>}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 10, color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
              <span>solar wind: <span style={{ color: 'var(--text)' }}>{spaceWeather.solarWindSpeedKms ?? '–'} km/s</span></span>
              <span>flare 24h: <span style={{ color: flareColor, fontWeight: 600 }}>{flare ?? '–'}</span></span>
            </div>
            {spaceWeather.activeAlerts.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 9, color: 'var(--text-dim)' }}>
                <div style={{ letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>active alerts</div>
                {spaceWeather.activeAlerts.slice(0, 2).map((a, i) => (
                  <div key={i} style={{ color: 'var(--text)', fontSize: 10, lineHeight: 1.4, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.message}>{a.product_id}: {(a.message ?? '').slice(0, 60)}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </>);
    })(),
    'wildfires': (() => {
      const total = wildfires?.total24h ?? 0;
      const top = wildfires?.top ?? [];
      const stateRollup: Record<string, number> = {};
      top.forEach(d => { stateRollup[d.approxState] = (stateRollup[d.approxState] ?? 0) + 1; });
      const topStates = Object.entries(stateRollup).sort((a, b) => b[1] - a[1]).slice(0, 5);
      return (<>
        <PanelHead panelId="wildfires" isStale={panelHealth.isStale('wildfires')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Wildfires</span><span className="panelTag" style={{ color: 'var(--red)', background: 'rgba(248,113,113,0.1)' }}>FIRMS</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>10m</span>
        </PanelHead>
        {!wildfires && <LoadingOrHide label="loading firms..." />}
        {wildfires && wildfires.error === 'firms_key_unconfigured' && (
          <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '4px 0' }}>FIRMS key not configured. Set NASA_FIRMS_MAP_KEY in worker.</div>
        )}
        {wildfires && !wildfires.error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: total > 500 ? 'var(--red)' : total > 100 ? 'var(--amber)' : 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString()}</span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>detections 24h · north america</span>
            </div>
            {topStates.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {topStates.map(([st, n]) => (
                  <span key={st} style={{ fontSize: 9, color: 'var(--text)', background: '#15151a', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 3 }}>{st} <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{n}</span></span>
                ))}
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 9, color: 'var(--text-dim)' }}>
              <div style={{ letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>most intense</div>
              {top.slice(0, 4).map((d, i) => (
                <div key={i} className="listRow" style={{ paddingTop: 2, paddingBottom: 2 }}>
                  <span style={{ fontSize: 10, color: 'var(--text)' }}>{d.approxState} <span style={{ color: 'var(--text-dim)', fontSize: 9 }}>{d.lat.toFixed(2)},{d.lon.toFixed(2)}</span></span>
                  <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{(d.frpMw ?? 0).toFixed(1)} MW</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>);
    })(),
    'severe-weather': (() => {
      const top = severeWeather?.top ?? [];
      const counts = severeWeather?.countsBySeverity ?? {};
      const sevColor = (sev: string) => sev === 'Extreme' ? 'var(--red)' : sev === 'Severe' ? 'var(--red)' : sev === 'Moderate' ? 'var(--amber)' : 'var(--text-dim)';
      const catGlyph = (cat: string) => cat === 'tornado' ? '🌪' : cat === 'tropical' ? '🌀' : cat === 'flood' ? '🌊' : cat === 'thunderstorm' ? '⛈' : cat === 'winter' ? '❄' : cat === 'fire' ? '🔥' : cat === 'heat' ? '🔆' : cat === 'wind' ? '💨' : '⚠';
      return (<>
        <PanelHead panelId="severe-weather" isStale={panelHealth.isStale('severe-weather')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Severe Weather</span><span className="panelTag" style={{ color: 'var(--amber)', background: 'rgba(239,159,39,0.1)' }}>NWS</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>1m</span>
        </PanelHead>
        {!severeWeather && <LoadingOrHide label="loading nws..." />}
        {severeWeather && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: severeWeather.totalActive > 50 ? 'var(--red)' : severeWeather.totalActive > 10 ? 'var(--amber)' : 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{severeWeather.totalActive}</span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>active alerts · us</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(counts).filter(([, n]) => (n ?? 0) > 0).slice(0, 4).map(([sev, n]) => (
                <span key={sev} style={{ fontSize: 9, color: sevColor(sev), background: '#15151a', border: `1px solid ${sevColor(sev)}30`, padding: '2px 6px', borderRadius: 3 }}>{sev} <span style={{ fontWeight: 600 }}>{n}</span></span>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2, fontSize: 9, color: 'var(--text-dim)' }}>
              <div style={{ letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>top events</div>
              {top.slice(0, 5).map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'baseline', padding: '2px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 11 }}>{catGlyph(a.category)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.event}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.areaDesc}</div>
                  </div>
                  <span style={{ fontSize: 9, color: sevColor(a.severity), fontWeight: 600 }}>{a.severity}</span>
                </div>
              ))}
              {top.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '4px 0' }}>no active alerts</div>}
            </div>
          </div>
        )}
      </>);
    })(),
    'funding-rates': (() => {
      const top = fundingRates?.top ?? [];
      const venueColor = (v: string) => v === 'binance' ? 'var(--gold)' : v === 'bybit' ? 'var(--amber)' : v === 'dydx' ? 'var(--purple)' : v === 'hyperliquid' ? 'var(--cyan)' : 'var(--text-dim)';
      return (<>
        <PanelHead panelId="funding-rates" isStale={panelHealth.isStale('funding-rates')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Funding Rates</span><span className="panelTag" style={{ color: 'var(--gold)', background: 'rgba(249,203,66,0.1)' }}>PERPS</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>1m</span>
        </PanelHead>
        {!fundingRates && <LoadingOrHide label="loading venues..." />}
        {fundingRates && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {top.slice(0, 8).map((r, i) => {
              const ann = r.annualizedPct ?? 0;
              const annColor = ann >= 0 ? 'var(--green)' : 'var(--red)';
              const annSign = ann >= 0 ? '+' : '';
              return (
                <div key={r.venue + r.symbol + i} className="listRow">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 9, color: venueColor(r.venue), minWidth: 38, fontWeight: 600 }}>{r.venue.slice(0, 4)}</span>
                    <span className="listRowSymbol" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(r.symbol ?? '').replace(/USDT$/, '').replace(/-PERP$/, '')}</span>
                  </div>
                  <span style={{ fontSize: 11, color: annColor, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{annSign}{ann.toFixed(1)}%</span>
                </div>
              );
            })}
            {top.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '4px 0' }}>loading venues...</div>}
            {fundingRates.failedVenues.length > 0 && (
              <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>fail: {fundingRates.failedVenues.join(', ')}</div>
            )}
          </div>
        )}
      </>);
    })(),
    'air-quality': (() => {
      const snap = airQuality?.snapshot;
      const cat = airQuality?.category;
      const aqi = snap?.usAqi ?? null;
      const colorMap: Record<string, string> = {
        green: 'var(--green)',
        yellow: 'var(--amber)',
        orange: '#f59e0b',
        red: 'var(--red)',
        purple: 'var(--purple)',
        maroon: '#7f1d1d',
      };
      const aqiColor = cat ? (colorMap[cat.color] ?? 'var(--text-dim)') : 'var(--text-dim)';
      const labelText = cat ? cat.label.replace(/_/g, ' ').toUpperCase() : '';
      return (<>
        <PanelHead panelId="air-quality" isStale={panelHealth.isStale('air-quality')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Air Quality</span><span className="panelTag" style={{ color: aqiColor, background: `${aqiColor}1a` }}>AQI</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>30m</span>
        </PanelHead>
        {!airQuality && <LoadingOrHide label="loading aqi..." />}
        {airQuality && aqi == null && <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '4px 0' }}>no data for location</div>}
        {airQuality && aqi != null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: aqiColor, fontVariantNumeric: 'tabular-nums' }}>{Math.round(aqi)}</span>
              <span style={{ fontSize: 9, color: aqiColor, letterSpacing: 1, fontWeight: 600 }}>{labelText}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 9, color: 'var(--text-dim)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>PM2.5</span><span style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{snap?.pm25 != null ? `${snap.pm25.toFixed(1)} µg/m³` : 'n/a'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>PM10</span><span style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{snap?.pm10 != null ? `${snap.pm10.toFixed(1)} µg/m³` : 'n/a'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>Ozone</span><span style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{snap?.ozone != null ? `${snap.ozone.toFixed(0)} µg/m³` : 'n/a'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>NO2</span><span style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{snap?.no2 != null ? `${snap.no2.toFixed(0)} µg/m³` : 'n/a'}</span>
              </div>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic' }}>open-meteo · LA</div>
          </div>
        )}
      </>);
    })(),
    'shodan': (() => {
      const targets = shodan?.targets ?? [];
      const totalCves = targets.reduce((s, t) => s + (t.vulns?.length ?? 0), 0);
      return (<>
        <PanelHead panelId="shodan" isStale={panelHealth.isStale('shodan')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Internet Exposure</span><span className="panelTag" style={{ color: 'var(--purple)', background: 'rgba(167,139,250,0.1)' }}>SHODAN</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>1h</span>
        </PanelHead>
        {!shodan && <LoadingOrHide label="loading shodan..." />}
        {shodan && targets.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '4px 0' }}>no targets returned</div>}
        {shodan && targets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: totalCves > 0 ? 'var(--red)' : 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{totalCves}</span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>known cves across {targets.length} targets</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 9, color: 'var(--text-dim)' }}>
              {targets.slice(0, 6).map((t, i) => (
                <div key={t.ip + i} className="listRow" style={{ paddingTop: 3, paddingBottom: 3, alignItems: 'baseline' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name || t.ip}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{t.ip} · {(t.ports?.length ?? 0)} ports</div>
                  </div>
                  <span style={{ fontSize: 10, color: (t.vulns?.length ?? 0) > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {(t.vulns?.length ?? 0) > 0 ? `${t.vulns.length} CVE` : 'clean'}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic' }}>internetdb.shodan.io · public IPs</div>
          </div>
        )}
      </>);
    })(),
    'cf-radar': (() => {
      // Pulls /api/radar (Cloudflare Radar composite). When the worker
      // doesn't yet have CF_API_TOKEN, surfaces a clean "config needed"
      // state instead of a loading spinner that never resolves.
      const dim = { fontSize: 10, color: 'var(--text-dim)' } as const;
      const head = (
        <PanelHead panelId="cf-radar" isStale={panelHealth.isStale('cf-radar')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Cloudflare Radar</span><span className="panelTag" style={{ color: 'var(--accent)', background: 'rgba(93,202,165,0.1)' }}>GLOBAL 24H</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>30m</span>
        </PanelHead>
      );

      if (cfRadar.kind === 'loading') {
        return (<>{head}<div style={{ ...dim, padding: '4px 0' }}>loading radar...</div></>);
      }
      if (cfRadar.kind === 'needs_token') {
        return (<>
          {head}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10 }}>
            <span style={{ color: 'var(--amber)', letterSpacing: 0.5, fontWeight: 600 }}>CONFIG NEEDED</span>
            <span style={{ color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Set <code style={{ color: 'var(--text)' }}>CF_API_TOKEN</code> as a Worker secret with{' '}
              <span style={{ color: 'var(--text)' }}>Account → Cloudflare Radar → Read</span> permission.
            </span>
            <code style={{ fontSize: 9, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              wrangler secret put CF_API_TOKEN
            </code>
          </div>
        </>);
      }
      if (cfRadar.kind === 'error') {
        return (<>{head}<div style={{ ...dim, padding: '4px 0', color: 'var(--amber)' }}>radar unavailable</div></>);
      }

      // kind === 'ready'
      const d = cfRadar.data;
      type Mix = Record<string, string> | null;
      const renderMix = (mix: Mix, formatLabel?: (k: string) => string) => {
        if (!mix) return <span style={dim}>no data</span>;
        // Coerce to [label, percent] pairs, sort desc, take top 3.
        const pairs = Object.entries(mix)
          .map(([k, v]) => [formatLabel ? formatLabel(k) : k, parseFloat(v)] as [string, number])
          .filter(([, n]) => Number.isFinite(n))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        if (pairs.length === 0) return <span style={dim}>no data</span>;
        return (
          <div style={{ display: 'flex', gap: 10, fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
            {pairs.map(([k, n]) => (
              <span key={k}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{n.toFixed(1)}%</span>
                <span style={{ color: 'var(--text-dim)' }}> {k.toLowerCase()}</span>
              </span>
            ))}
          </div>
        );
      };

      type TopRow = {
        clientCountryAlpha2?: string; clientCountryName?: string;
        originCountryAlpha2?: string; originCountryName?: string;
        targetCountryAlpha2?: string; targetCountryName?: string;
        value?: string;
      };
      const renderTopLocations = (rows: TopRow[]) => {
        if (!rows || rows.length === 0) return <span style={dim}>no data</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rows.slice(0, 4).map((r, i) => {
              const code = r.clientCountryAlpha2 ?? r.originCountryAlpha2 ?? r.targetCountryAlpha2 ?? '??';
              const name = r.clientCountryName ?? r.originCountryName ?? r.targetCountryName ?? code;
              const pct = parseFloat(r.value ?? '');
              return (
                <div key={code + i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                  <span style={{ color: 'var(--text)' }}>{code} <span style={{ color: 'var(--text-dim)' }}>{name}</span></span>
                  <span style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{Number.isFinite(pct) ? `${pct.toFixed(1)}%` : 'n/a'}</span>
                </div>
              );
            })}
          </div>
        );
      };

      return (<>
        {head}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Device</div>
            {renderMix(d.device_mix)}
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Bot mix</div>
            {renderMix(d.bot_mix)}
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>IP version</div>
            {renderMix(d.ip_version_mix)}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Top L7 DDoS targets</div>
            {renderTopLocations(d.top_attacked_locations as TopRow[])}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic' }}>radar.cloudflare.com · last 24h</div>
        </div>
      </>);
    })(),
    'federal-register': (() => {
      const typeColor: Record<string, string> = {
        'Rule': 'var(--red)',
        'Proposed Rule': 'var(--amber)',
        'Notice': 'var(--text-dim)',
        'Presidential Document': 'var(--purple)',
      };
      return (<>
        <PanelHead panelId="federal-register" isStale={panelHealth.isStale('federal-register')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Federal Register</span><span className="panelTag" style={{ color: 'var(--accent)', background: 'rgba(93,202,165,0.1)' }}>7D</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>30m</span>
        </PanelHead>
        {federalRegister.length === 0 && <LoadingOrHide label="loading rules..." />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {federalRegister.slice(0, 8).map((d) => {
            const c = typeColor[d.type] ?? 'var(--text-dim)';
            const short = (d.type || '').replace('Presidential Document', 'PRES').replace('Proposed Rule', 'PROP').toUpperCase();
            const agency = d.agencies?.[0] ?? '';
            return (
              <a key={d.document_number} href={d.url} target="_blank" rel="noopener noreferrer" className="newsRow" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontSize: 9, color: c, fontWeight: 700, minWidth: 36, flexShrink: 0, paddingTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>{short}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="newsTitle" style={{ fontWeight: 500 }}>{d.title}</div>
                  {agency && <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agency}</div>}
                </div>
                <span className="newsMeta" style={{ fontSize: 9 }}>{d.publication_date?.slice(5) ?? ''}</span>
              </a>
            );
          })}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>federalregister.gov · public domain</div>
      </>);
    })(),
    'openfda-recalls': (() => {
      const classColor: Record<string, string> = {
        'Class I': 'var(--red)',
        'Class II': 'var(--amber)',
        'Class III': 'var(--text-dim)',
      };
      const categoryTag: Record<string, string> = { food: 'FOOD', drug: 'DRUG', device: 'DEV' };
      const recent = fdaRecalls?.recent ?? [];
      const byClass = fdaRecalls?.by_class ?? {};
      return (<>
        <PanelHead panelId="openfda-recalls" isStale={panelHealth.isStale('openfda-recalls')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">FDA Recalls</span><span className="panelTag" style={{ color: 'var(--red)', background: 'rgba(248,113,113,0.1)' }}>30D</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>6h</span>
        </PanelHead>
        {!fdaRecalls && <LoadingOrHide label="loading recalls..." />}
        {fdaRecalls && (<>
          <div style={{ display: 'flex', gap: 10, fontSize: 9, color: 'var(--text-dim)', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
            <span><b style={{ color: 'var(--red)' }}>{byClass['Class I'] ?? 0}</b> CLASS I</span>
            <span><b style={{ color: 'var(--amber)' }}>{byClass['Class II'] ?? 0}</b> II</span>
            <span><b style={{ color: 'var(--text)' }}>{byClass['Class III'] ?? 0}</b> III</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recent.slice(0, 7).map((r, i) => {
              const c = classColor[r.classification] ?? 'var(--text-dim)';
              return (
                <div key={r.report_date + i} className="listRow" style={{ alignItems: 'flex-start', paddingTop: 2, paddingBottom: 2 }}>
                  <span style={{ fontSize: 9, color: c, fontWeight: 700, minWidth: 32, flexShrink: 0, paddingTop: 1, letterSpacing: 0.5 }}>{categoryTag[r.category] ?? 'OTH'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product || r.reason}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.firm}</div>
                  </div>
                  <span style={{ fontSize: 9, color: c, flexShrink: 0, fontWeight: 600 }}>{(r.classification || '').replace('Class ', 'C')}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>openfda · last 30 days</div>
        </>)}
      </>);
    })(),
    'gh-releases': (() => {
      const recent = ghReleases?.recent ?? [];
      const freshCount = ghReleases?.fresh_count ?? 0;
      return (<>
        <PanelHead panelId="gh-releases" isStale={panelHealth.isStale('gh-releases')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">GitHub Releases</span><span className="panelTag" style={{ color: freshCount > 0 ? 'var(--green)' : 'var(--text-dim)', background: freshCount > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(138,136,128,0.1)' }}>{freshCount > 0 ? `${freshCount} TODAY` : 'TRACKED'}</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>1h</span>
        </PanelHead>
        {!ghReleases && <LoadingOrHide label="loading releases..." />}
        {ghReleases && recent.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>no recent releases</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recent.slice(0, 8).map((r) => {
            const repoShort = r.repo.split('/')[1] ?? r.repo;
            return (
              <a key={r.repo + r.tag} href={r.url} target="_blank" rel="noopener noreferrer" className="newsRow">
                <span style={{ fontSize: 10, color: r.prerelease ? 'var(--amber)' : 'var(--green)', fontWeight: 600, minWidth: 56, flexShrink: 0, fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repoShort}</span>
                <span className="newsTitle" style={{ fontSize: 10 }}>{r.tag}{r.prerelease ? ' ·pre' : ''}</span>
                <span className="newsMeta" style={{ fontSize: 9 }}>{r.published_at ? timeAgo(Math.floor(new Date(r.published_at).getTime() / 1000)) : ''}</span>
              </a>
            );
          })}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>{ghReleases?.repos_tracked ?? 0} repos · last 1h</div>
      </>);
    })(),
    'pypi-trends': (() => {
      function fmt(n: number | null): string {
        if (n == null) return 'n/a';
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
        return String(n);
      }
      return (<>
        <PanelHead panelId="pypi-trends" isStale={panelHealth.isStale('pypi-trends')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">PyPI Trends</span><span className="panelTag" style={{ color: 'var(--accent)', background: 'rgba(93,202,165,0.1)' }}>PYTHON</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>6h</span>
        </PanelHead>
        {pypiTrends.length === 0 && <LoadingOrHide label="loading downloads..." />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
          {pypiTrends.slice(0, 10).map((p, i) => (
            <a key={p.package} href={`https://pypi.org/project/${p.package}/`} target="_blank" rel="noopener noreferrer" className="listRow" style={{ paddingTop: 2, paddingBottom: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', minWidth: 16, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.package}</span>
              <span style={{ fontSize: 10, color: 'var(--green)', minWidth: 50, textAlign: 'right' }}>{fmt(p.downloads_last_day)}/d</span>
            </a>
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>pypistats.org · daily downloads</div>
      </>);
    })(),
    'cve': (() => {
      const sevColor: Record<string, string> = {
        CRITICAL: 'var(--red)',
        HIGH: '#f59e0b',
        MEDIUM: 'var(--amber)',
        LOW: 'var(--text-dim)',
      };
      const kev = cve?.kev_exploited ?? [];
      const nvd = cve?.nvd_recent ?? [];
      return (<>
        <PanelHead panelId="cve" isStale={panelHealth.isStale('cve')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">CVE / KEV</span><span className="panelTag" style={{ color: 'var(--red)', background: 'rgba(248,113,113,0.1)' }}>EXPLOITED</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>5m</span>
        </PanelHead>
        {!cve && <LoadingOrHide label="loading vulns..." />}
        {cve && (<>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>CISA KEV · in-the-wild</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
            {kev.slice(0, 5).map((v) => (
              <a key={v.cve} href={v.url} target="_blank" rel="noopener noreferrer" className="newsRow" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontSize: 9, color: v.known_ransomware ? 'var(--red)' : 'var(--amber)', fontWeight: 700, minWidth: 86, flexShrink: 0, fontFamily: 'inherit', paddingTop: 1 }}>{v.cve}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.vendor} {v.product}</div>
                </div>
                {v.known_ransomware && <span style={{ fontSize: 9, color: 'var(--red)', fontWeight: 700 }}>RANS</span>}
              </a>
            ))}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>NVD · last 7 days</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {nvd.slice(0, 4).map((v) => {
              const c = v.severity ? (sevColor[v.severity] ?? 'var(--text-dim)') : 'var(--text-dim)';
              return (
                <a key={v.cve} href={v.url} target="_blank" rel="noopener noreferrer" className="newsRow" style={{ alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 9, color: c, fontWeight: 700, minWidth: 86, flexShrink: 0, paddingTop: 1 }}>{v.cve}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.description}</span>
                  {v.score != null && <span style={{ fontSize: 9, color: c, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v.score.toFixed(1)}</span>}
                </a>
              );
            })}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>cisa.gov · nvd.nist.gov</div>
        </>)}
      </>);
    })(),
    'arxiv': (() => {
      return (<>
        <PanelHead panelId="arxiv" isStale={panelHealth.isStale('arxiv')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">arXiv AI Papers</span><span className="panelTag" style={{ color: 'var(--purple)', background: 'rgba(167,139,250,0.1)' }}>AI/ML</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>1h</span>
        </PanelHead>
        {arxiv.length === 0 && <LoadingOrHide label="loading papers..." />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {arxiv.slice(0, 7).map((p) => {
            const authors = (p.authors ?? []).slice(0, 2).join(', ') + ((p.authors?.length ?? 0) > 2 ? ' et al.' : '');
            return (
              <a key={p.arxiv_id} href={p.url} target="_blank" rel="noopener noreferrer" className="newsRow" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontSize: 9, color: 'var(--purple)', fontWeight: 600, minWidth: 60, flexShrink: 0, paddingTop: 1, letterSpacing: 0.3 }}>{p.primary_category || 'cs.AI'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{p.title}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authors}</div>
                </div>
              </a>
            );
          })}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>arxiv.org · cs.AI/cs.LG/cs.CL</div>
      </>);
    })(),
    'liquidations': (() => {
      function fmtUsd(n: number): string {
        if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
        if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
        return '$' + n;
      }
      const t = liquidations?.totals;
      const big = liquidations?.biggest;
      const bySym = liquidations?.by_symbol ?? {};
      return (<>
        <PanelHead panelId="liquidations" isStale={panelHealth.isStale('liquidations')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Liquidations</span><span className="panelTag" style={{ color: 'var(--red)', background: 'rgba(248,113,113,0.1)' }}>OKX PERPS</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>60s</span>
        </PanelHead>
        {!liquidations && <LoadingOrHide label="loading liqs..." />}
        {liquidations && t && (<>
          <div style={{ display: 'flex', gap: 12, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Long</div>
              <div style={{ fontSize: 16, color: 'var(--red)', fontWeight: 700 }}>{fmtUsd(t.long_notional_usd)}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{t.long_count} fills</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Short</div>
              <div style={{ fontSize: 16, color: 'var(--green)', fontWeight: 700 }}>{fmtUsd(t.short_notional_usd)}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{t.short_count} fills</div>
            </div>
          </div>
          {big && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, marginBottom: 4 }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Biggest single</div>
              <div style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ color: big.side === 'long' ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>{big.symbol} {big.side}</span>
                <span style={{ color: 'var(--text)', marginLeft: 6 }}>{fmtUsd(big.notional_usd)}</span>
                <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>@ ${big.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, fontSize: 9, fontVariantNumeric: 'tabular-nums', color: 'var(--text-dim)' }}>
            {Object.entries(bySym).map(([sym, s]) => (
              <div key={sym} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                <span style={{ color: 'var(--text)' }}>{sym}</span>
                <span><span style={{ color: 'var(--red)' }}>{fmtUsd(s.long_notional_usd)}</span> / <span style={{ color: 'var(--green)' }}>{fmtUsd(s.short_notional_usd)}</span></span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>okx perp swaps · long fills / short fills</div>
        </>)}
      </>);
    })(),
    'wiki-featured': (() => {
      const tfa = wikiFeatured?.featured_article;
      const news = wikiFeatured?.news ?? [];
      return (<>
        <PanelHead panelId="wiki-featured" isStale={panelHealth.isStale('wiki-featured')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Wikipedia Today</span><span className="panelTag" style={{ color: 'var(--accent)', background: 'rgba(93,202,165,0.1)' }}>FEATURED</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>6h</span>
        </PanelHead>
        {!wikiFeatured && <LoadingOrHide label="loading wikipedia..." />}
        {wikiFeatured && tfa && (<>
          <a href={tfa.url ?? '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: 6 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {tfa.thumbnail && (
                <img src={tfa.thumbnail} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600, lineHeight: 1.3 }}>{tfa.title}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tfa.extract}</div>
              </div>
            </div>
          </a>
          {news.length > 0 && (<>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, borderTop: '1px solid var(--border)', paddingTop: 4 }}>In the news</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {news.slice(0, 3).map((n, i) => (
                <div key={i} style={{ fontSize: 9, color: 'var(--text-dim)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} dangerouslySetInnerHTML={{ __html: n.story }} />
              ))}
            </div>
          </>)}
          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>en.wikipedia.org · CC BY-SA</div>
        </>)}
      </>);
    })(),
    'nhc-storms': (() => {
      const classLabel: Record<string, string> = {
        HU: 'Hurricane', MH: 'Major Hurricane', TS: 'Tropical Storm', STS: 'Subtropical Storm',
        TD: 'Tropical Depression', STD: 'Subtropical Depression', PTC: 'Potential Tropical Cyclone',
      };
      const classColor: Record<string, string> = {
        MH: 'var(--red)', HU: 'var(--red)', TS: 'var(--amber)', STS: 'var(--amber)',
        TD: 'var(--text-dim)', STD: 'var(--text-dim)', PTC: 'var(--text-dim)',
      };
      const active = nhcStorms?.active ?? [];
      const note = nhcStorms?.season_note;
      return (<>
        <PanelHead panelId="nhc-storms" isStale={panelHealth.isStale('nhc-storms')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Hurricane Center</span><span className="panelTag" style={{ color: active.length > 0 ? 'var(--red)' : 'var(--text-dim)', background: active.length > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(138,136,128,0.1)' }}>{active.length > 0 ? `${active.length} ACTIVE` : 'CALM'}</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>15m</span>
        </PanelHead>
        {!nhcStorms && <LoadingOrHide label="loading nhc..." />}
        {nhcStorms && active.length === 0 && (
          <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5, padding: '4px 0' }}>
            <div style={{ color: 'var(--green)', fontWeight: 600, marginBottom: 2 }}>No active storms</div>
            <div>{note}</div>
          </div>
        )}
        {nhcStorms && active.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {active.map((s) => {
              const c = classColor[s.classification] ?? 'var(--text-dim)';
              const label = classLabel[s.classification] ?? s.classification;
              return (
                <a key={s.id ?? s.name} href={s.public_advisory_url ?? '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{s.name}</span>
                    <span style={{ fontSize: 9, color: c, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', display: 'flex', gap: 10, fontVariantNumeric: 'tabular-nums' }}>
                    {s.intensity_mph != null && <span><b style={{ color: 'var(--text)' }}>{s.intensity_mph}</b> mph</span>}
                    {s.pressure_mb != null && <span><b style={{ color: 'var(--text)' }}>{s.pressure_mb}</b> mb</span>}
                  </div>
                  {s.movement && <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 1 }}>{s.movement}</div>}
                </a>
              );
            })}
          </div>
        )}
        <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>nhc.noaa.gov · atlantic + east pacific</div>
      </>);
    })(),
    'cert-stream': (() => {
      const latest = certStream[0];
      const live = !!latest && (Date.now() - latest.time < 60_000);
      return (<>
        <PanelHead panelId="cert-stream" isStale={panelHealth.isStale('cert-stream')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Cert Stream</span><span className="panelTag" style={{ color: live ? 'var(--green)' : 'var(--amber)', background: live ? 'rgba(74,222,128,0.1)' : 'rgba(239,159,39,0.1)' }}>LIVE CT</span></div>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="liveDot" style={{ background: live ? 'var(--green)' : 'var(--amber)' }} />
            <span className="liveText" style={{ color: live ? undefined : 'var(--amber)' }}>{live ? 'REALTIME' : 'WAITING'}</span>
          </span>
        </PanelHead>
        {certStream.length === 0 && (
          <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '6px 0', lineHeight: 1.5 }}>
            Waiting for upstream feed. calidog.io CertStream is occasionally quiet.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
          {certStream.map((c, i) => (
            <div key={c.time + i} className="listRow" style={{ paddingTop: 2, paddingBottom: 2, alignItems: 'baseline' }}>
              <span style={{ fontSize: 10, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.domain}</span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)', flexShrink: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.issuer}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>certstream.calidog.io · global ct log firehose</div>
      </>);
    })(),
    'btc-difficulty': (() => {
      function fmtDuration(ms: number | null): string {
        if (ms == null || ms <= 0) return 'n/a';
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
      }
      const d = btcDifficulty;
      const pct = d?.progress_percent ?? 0;
      const change = d?.difficulty_change_percent ?? 0;
      const changeColor = change >= 0 ? 'var(--red)' : 'var(--green)';   // higher difficulty = harder for miners
      const changeArrow = change >= 0 ? '▲' : '▼';
      return (<>
        <PanelHead panelId="btc-difficulty" isStale={panelHealth.isStale('btc-difficulty')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">BTC Difficulty</span><span className="panelTag" style={{ color: 'var(--gold)', background: 'rgba(249,203,66,0.1)' }}>EPOCH</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>5m</span>
        </PanelHead>
        {!btcDifficulty && <LoadingOrHide label="loading difficulty..." />}
        {btcDifficulty && (<>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(1)}%</span>
            <span style={{ fontSize: 13, color: changeColor, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{changeArrow} {Math.abs(change).toFixed(2)}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold), #f59e0b)' }} />
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Blocks until retarget</span>
              <span style={{ color: 'var(--text)' }}>{d?.remaining_blocks?.toLocaleString() ?? 'n/a'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Time until retarget</span>
              <span style={{ color: 'var(--text)' }}>{fmtDuration(d?.remaining_time_ms ?? null)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Avg block time</span>
              <span style={{ color: 'var(--text)' }}>{d?.avg_block_time_seconds ? (d.avg_block_time_seconds / 60).toFixed(1) + 'm' : 'n/a'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Previous retarget</span>
              <span style={{ color: (d?.previous_retarget_percent ?? 0) >= 0 ? 'var(--red)' : 'var(--green)' }}>
                {d?.previous_retarget_percent != null ? `${d.previous_retarget_percent >= 0 ? '+' : ''}${d.previous_retarget_percent.toFixed(2)}%` : 'n/a'}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>mempool.space · 2016-block epoch</div>
        </>)}
      </>);
    })(),
    'congress': (() => {
      const presented = congress?.presented_to_president ?? [];
      const popular = congress?.most_viewed_bills ?? [];
      return (<>
        <PanelHead panelId="congress" isStale={panelHealth.isStale('congress')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">US Congress</span><span className="panelTag" style={{ color: 'var(--accent)', background: 'rgba(93,202,165,0.1)' }}>BILLS</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>30m</span>
        </PanelHead>
        {!congress && <LoadingOrHide label="loading bills..." />}
        {congress && (<>
          {presented.length > 0 && (<>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>At President's Desk</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
              {presented.slice(0, 4).map((b) => (
                <a key={b.title + (b.link ?? '')} href={b.link ?? '#'} target="_blank" rel="noopener noreferrer" className="newsRow" style={{ alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 9, color: 'var(--amber)', fontWeight: 700, minWidth: 56, flexShrink: 0, paddingTop: 1 }}>{b.title}</span>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.description}</div>
                </a>
              ))}
            </div>
          </>)}
          {popular.length > 0 && (<>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Most Viewed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {popular.slice(0, 5).map((b, i) => (
                <a key={b.bill_id + i} href={b.url} target="_blank" rel="noopener noreferrer" className="newsRow">
                  <span style={{ fontSize: 9, color: 'var(--text-dim)', minWidth: 14, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, minWidth: 52, flexShrink: 0 }}>{b.bill_id}</span>
                  <span style={{ flex: 1, fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</span>
                </a>
              ))}
            </div>
          </>)}
          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>congress.gov · public domain</div>
        </>)}
      </>);
    })(),
    'lightning': (() => {
      function fmtBtc(n: number | null): string { return n == null ? 'n/a' : n.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' BTC'; }
      function fmtCount(n: number | null): string { return n == null ? 'n/a' : n.toLocaleString(); }
      const d = lightning;
      const delta = d?.delta_since_previous;
      return (<>
        <PanelHead panelId="lightning" isStale={panelHealth.isStale('lightning')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Lightning Network</span><span className="panelTag" style={{ color: 'var(--gold)', background: 'rgba(249,203,66,0.1)' }}>BTC L2</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>1h</span>
        </PanelHead>
        {!lightning && <LoadingOrHide label="loading ln..." />}
        {lightning && (<>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Capacity</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>{fmtBtc(d?.capacity_btc ?? null)}</span>
              {delta?.capacity_btc != null && (
                <span style={{ fontSize: 11, color: delta.capacity_btc >= 0 ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                  {delta.capacity_btc >= 0 ? '+' : ''}{delta.capacity_btc.toFixed(0)}
                </span>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, fontSize: 10, fontVariantNumeric: 'tabular-nums', display: 'flex', flexDirection: 'column', gap: 1, color: 'var(--text-dim)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Channels</span>
              <span><b style={{ color: 'var(--text)' }}>{fmtCount(d?.channel_count ?? null)}</b>
                {delta?.channel_count != null && <span style={{ color: delta.channel_count >= 0 ? 'var(--green)' : 'var(--red)', marginLeft: 6, fontSize: 9 }}>{delta.channel_count >= 0 ? '+' : ''}{delta.channel_count}</span>}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Nodes</span>
              <span><b style={{ color: 'var(--text)' }}>{fmtCount(d?.node_count ?? null)}</b>
                {delta?.node_count != null && <span style={{ color: delta.node_count >= 0 ? 'var(--green)' : 'var(--red)', marginLeft: 6, fontSize: 9 }}>{delta.node_count >= 0 ? '+' : ''}{delta.node_count}</span>}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tor / Clearnet</span>
              <span style={{ color: 'var(--text)' }}>{fmtCount(d?.tor_nodes ?? null)} / {fmtCount(d?.clearnet_nodes ?? null)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Median fee</span>
              <span style={{ color: 'var(--text)' }}>{d?.median_fee_rate_ppm ?? 'n/a'} ppm</span>
            </div>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>mempool.space · public channels only</div>
        </>)}
      </>);
    })(),
    'bsky-firehose': (<>
      <PanelHead panelId="bsky-firehose" isStale={panelHealth.isStale('bsky-firehose')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Bluesky Firehose</span><span className="panelTag" style={{ color: 'var(--cyan)', background: 'rgba(96,165,250,0.1)' }}>JETSTREAM</span></div>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span className="liveDot" style={{ background: 'var(--green)' }} /><span className="liveText">REALTIME</span></span>
      </PanelHead>
      {blueskyFirehose.length === 0 && <LoadingOrHide label="waiting for posts..." />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {blueskyFirehose.map((p) => (
          <div key={p.did + p.createdAt} style={{ fontSize: 10, color: 'var(--text)', lineHeight: 1.4, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
            {p.text}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>jetstream2.us-east.bsky.network · at-proto firehose</div>
    </>),
    'sponsor-slot': (<>
      <PanelHead panelId="sponsor-slot" isStale={false} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Sponsor</span><span className="panelTag" style={{ color: 'var(--amber)', background: 'rgba(239,159,39,0.1)' }}>AVAILABLE</span></div>
      </PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: 0.5, lineHeight: 1.3 }}>Your panel here</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)', fontVariantNumeric: 'tabular-nums' }}>$200</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>/ month</span>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          30+ live panels. Dev, trader, and AI-agent audience on a dark, terminal-aesthetic dashboard. Native panel placement, no popups, no tracking.
        </div>
        <a href="mailto:advertise@terminalfeed.io" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, marginTop: 4 }}>advertise@terminalfeed.io &rarr;</a>
      </div>
    </>),
    'premium-api': (<>
      <PanelHead panelId="premium-api" isStale={false} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft"><span className="panelTitle">Premium API</span><span className="panelTag" style={{ color: 'var(--gold)', background: 'rgba(249,203,66,0.1)' }}>USDC</span></div>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>/api/pro</span>
      </PanelHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>Composed agent data, pay per call</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>1&cent;</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>per credit · 1-2 credits / call</span>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}><span>Multi-source briefing</span><span style={{ color: 'var(--text)' }}>1 cr</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}><span>Macro rollup (FRED + FX)</span><span style={{ color: 'var(--text)' }}>2 cr</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}><span>Whale tx feed</span><span style={{ color: 'var(--text)' }}>2 cr</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}><span>Exchange flow labels</span><span style={{ color: 'var(--text)' }}>2 cr</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}><span>Correlation matrix</span><span style={{ color: 'var(--text)' }}>2 cr</span></div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>+ 7 more endpoints. USDC on Base. Cross-redeemable on TensorFeed.</div>
        </div>
        <a href="/developers/agent-payments" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, marginTop: 2 }}>Get started &rarr;</a>
      </div>
    </>),
    'volcanoes': (() => {
      const items = volcanoes?.items ?? [];
      return (<>
        <PanelHead panelId="volcanoes" isStale={panelHealth.isStale('volcanoes')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Volcanoes</span><span className="panelTag" style={{ color: 'var(--red)', background: 'rgba(248,113,113,0.1)' }}>SI/GVP</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>1h</span>
        </PanelHead>
        {!volcanoes && <LoadingOrHide label="loading gvp..." />}
        {volcanoes && items.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '4px 0' }}>no current activity reports</div>}
        {volcanoes && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: items.length > 5 ? 'var(--red)' : 'var(--amber)', fontVariantNumeric: 'tabular-nums' }}>{items.length}</span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>active reports · weekly</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 9, color: 'var(--text-dim)' }}>
              {items.slice(0, 6).map((v, i) => (
                <div key={v.name + i} style={{ padding: '3px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name || 'unknown'}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', flexShrink: 0 }}>{v.country}</span>
                  </div>
                  {v.summary && (
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }} title={v.summary}>{v.summary}</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic' }}>smithsonian gvp · weekly</div>
          </div>
        )}
      </>);
    })(),
    'sec-filings': (() => {
      const filings = secFilings ?? [];
      return (<>
        <PanelHead panelId="sec-filings" isStale={panelHealth.isStale('sec-filings')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">SEC Filings</span><span className="panelTag" style={{ color: 'var(--gold)', background: 'rgba(249,203,66,0.1)' }}>EDGAR 8-K</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>90s</span>
        </PanelHead>
        {!secFilings && <LoadingOrHide label="loading edgar..." />}
        {secFilings && filings.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '4px 0' }}>no recent filings</div>}
        {secFilings && filings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filings.slice(0, 12).map((f, i) => (
              <a key={`${f.cik}-${f.accession ?? i}`} href={f.url} target="_blank" rel="noopener noreferrer" className="newsRow">
                <span style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 700, minWidth: 28, flexShrink: 0 }}>{f.formType}</span>
                <span className="newsTitle">{f.company}</span>
                <span className="newsMeta">{f.filedAt ? timeAgo(Math.floor(new Date(f.filedAt).getTime() / 1000)) : ''}</span>
              </a>
            ))}
            <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>sec edgar · public domain</div>
          </div>
        )}
      </>);
    })(),
    'treasury-yields': (() => {
      const c = treasuryYields?.curve;
      const d = treasuryYields?.deltasBps ?? {};
      const inverted = treasuryYields?.inverted2_10;
      const spread = treasuryYields?.spread2_10Bps;
      const fmtPct = (v: number | null | undefined) => v == null ? '–' : `${v.toFixed(2)}%`;
      const fmtBps = (v: number | null | undefined) => {
        if (v == null) return '';
        const bps = Math.round(v * 100);
        if (bps === 0) return '·';
        const color = bps > 0 ? 'var(--green)' : 'var(--red)';
        return <span style={{ color, fontSize: 9 }}>{bps > 0 ? '+' : ''}{bps}bp</span>;
      };
      const tenor = (label: string, val: number | null | undefined, deltaVal: number | null | undefined) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>{label}</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtPct(val)}</span>
            <span style={{ minWidth: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtBps(deltaVal)}</span>
          </span>
        </div>
      );
      return (<>
        <PanelHead panelId="treasury-yields" isStale={panelHealth.isStale('treasury-yields')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Treasury Yields</span><span className="panelTag" style={{ color: 'var(--green)', background: 'rgba(74,222,128,0.1)' }}>USD CURVE</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{treasuryYields?.recordDate || 'daily'}</span>
        </PanelHead>
        {!treasuryYields && <LoadingOrHide label="loading treasury..." />}
        {treasuryYields && c && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {tenor('3M',  c.m3,  d.m3)}
            {tenor('2Y',  c.y2,  d.y2)}
            {tenor('5Y',  c.y5,  d.y5)}
            {tenor('10Y', c.y10, d.y10)}
            {tenor('30Y', c.y30, d.y30)}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6, padding: '4px 6px', background: inverted ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.06)', border: `1px solid ${inverted ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.2)'}`, borderRadius: 3 }}>
              <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>2-10 spread</span>
              <span style={{ fontSize: 11, color: inverted ? 'var(--red)' : 'var(--green)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {spread != null ? `${spread > 0 ? '+' : ''}${spread}bp` : '–'}
                {inverted && <span style={{ marginLeft: 6, fontSize: 9 }}>INVERTED</span>}
              </span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4 }}>treasury direct · public domain</div>
          </div>
        )}
      </>);
    })(),
    'eonet': (() => {
      const total = eonet?.totalOpen ?? 0;
      const cats = eonet?.categories ?? [];
      const events = eonet?.recent ?? [];
      return (<>
        <PanelHead panelId="eonet" isStale={panelHealth.isStale('eonet')} layout={layout} getGridCols={getGridCols}>
          <div className="panelHeaderLeft"><span className="panelTitle">Earth Events</span><span className="panelTag" style={{ color: 'var(--purple)', background: 'rgba(167,139,250,0.1)' }}>NASA EONET</span></div>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>5m</span>
        </PanelHead>
        {!eonet && <LoadingOrHide label="loading eonet..." />}
        {eonet && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: total > 100 ? 'var(--red)' : total > 30 ? 'var(--amber)' : 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{total}</span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>active events · 30d</span>
            </div>
            {cats.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {cats.slice(0, 6).map(c => (
                  <span key={c.id} style={{ fontSize: 10, color: 'var(--text)', background: '#15151a', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 3 }}>
                    <span style={{ marginRight: 4 }}>{c.glyph}</span>
                    {c.title} <span style={{ color: 'var(--purple)', fontWeight: 600, marginLeft: 2 }}>{c.count}</span>
                  </span>
                ))}
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 9, color: 'var(--text-dim)' }}>
              <div style={{ letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>most recent</div>
              {events.slice(0, 5).map((e) => (
                <a key={e.id} href={e.link ?? '#'} target="_blank" rel="noopener noreferrer" className="newsRow" style={{ paddingTop: 3, paddingBottom: 3 }}>
                  <span style={{ fontSize: 12, minWidth: 16, flexShrink: 0 }}>{e.glyph}</span>
                  <span className="newsTitle">{e.title}</span>
                  <span className="newsMeta">{e.date ? timeAgo(Math.floor(new Date(e.date).getTime() / 1000)) : ''}</span>
                </a>
              ))}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic' }}>nasa eonet · open data</div>
          </div>
        )}
      </>);
    })(),
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
    'internet-pulse': (() => {
      const valid = internetPulse.filter(p => p.latency >= 0);
      const avg = valid.length > 0 ? valid.reduce((s, p) => s + p.latency, 0) / valid.length : null;
      return (<>
      <PanelHead panelId="internet-pulse" isStale={panelHealth.isStale('internet-pulse')} layout={layout} getGridCols={getGridCols}><div className="panelHeaderLeft"><span className="panelTitle">Internet Pulse</span></div></PanelHead>
      <InternetScope avgLatencyMs={avg} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {internetPulse.length === 0 && <StateChip kind="collecting" label="PING" block />}
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
      </>);
    })(),
    'nasa-apod': (<>
      <PanelHead panelId="nasa-apod" isStale={panelHealth.isStale('nasa-apod')} layout={layout} getGridCols={getGridCols}>
        <div className="panelHeaderLeft">
          <span className="panelTitle">Space</span>
          <span className="panelTag">NASA APOD</span>
        </div>
      </PanelHead>
      {nasaApod ? (
        <div>
          <a href={nasaApod.hdurl || nasaApod.url} target="_blank" rel="noopener noreferrer" className="nasaApodFrame">
            <div className="nasaStarfield" aria-hidden="true">
              <div className="nasaStarLayer nasaStarLayer1" />
              <div className="nasaStarLayer nasaStarLayer2" />
              <div className="nasaStarLayer nasaStarLayer3" />
            </div>
            <img src={nasaApod.url} alt={nasaApod.title} className="nasaApodImage" loading="lazy" />
          </a>
          <div style={{ padding: '6px 0 0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{nasaApod.title}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', lineHeight: 1.5, marginTop: 4, maxHeight: 54, overflow: 'hidden' }}>{nasaApod.explanation.slice(0, 200)}{nasaApod.explanation.length > 200 ? '...' : ''}</div>
            <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 4 }}>{nasaApod.date}{nasaApod.copyright ? ` · © ${nasaApod.copyright}` : ''}</div>
          </div>
        </div>
      ) : <StateChip kind="waiting" label="APOD" block />}
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
        {trendingMovies.length === 0 && <StateChip kind="waiting" label="MOVIES" block />}
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
          <div className="issOrbit" aria-hidden="true">
            <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="earthGlyph">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#1e3a5f" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#0a1020" stopOpacity="0.85" />
                </radialGradient>
              </defs>
              <ellipse cx="100" cy="75" rx="75" ry="40" fill="none" stroke="#1f1f24" strokeWidth="0.6" strokeDasharray="1 2" />
              <ellipse cx="100" cy="75" rx="55" ry="60" fill="none" stroke="#1f1f24" strokeWidth="0.6" strokeDasharray="1 2" transform="rotate(30 100 75)" />
              <circle cx="100" cy="75" r="18" fill="url(#earthGlyph)" stroke="#22D3EE" strokeWidth="0.5" />
              <text x="100" y="78" textAnchor="middle" fill="#22D3EE" fontSize="7" fontFamily="monospace">EARTH</text>
              <g className="issOrbitIss">
                <circle cx="175" cy="75" r="3" fill="var(--green)" style={{ filter: 'drop-shadow(0 0 4px var(--green))' }} />
                <text x="175" y="68" textAnchor="middle" fill="var(--green)" fontSize="6" fontFamily="monospace">ISS</text>
              </g>
              <g className="issOrbitTgs">
                <circle cx="155" cy="75" r="3" fill="var(--amber)" style={{ filter: 'drop-shadow(0 0 4px var(--amber))' }} />
                <text x="155" y="68" textAnchor="middle" fill="var(--amber)" fontSize="6" fontFamily="monospace">TGS</text>
              </g>
            </svg>
          </div>
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
          <a href="/tools/" target="_blank" rel="noopener noreferrer" className="liveBriefingLink toolsLink">TOOLS</a>
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

      {/* ── Ticker Bar: flips between prices and sports ── */}
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

      {/* ── Main Grid: rendered dynamically from panelOrder ── */}
      <div id="main-content" className={`grid ${layout.isOrganizing ? 'gridOrganizing' : ''}`}>
        {(() => {
          const userPanels = layout.panelOrder.filter(id =>
            layout.isVisible(id) && id !== 'support'
          );

          return userPanels.map((id, idx) => {
            const panelDef = ALL_PANELS.find(p => p.id === id);
            if (!panelDef) return null;
            const span = panelDef.defaultSpan > 1 ? 'hero2' : '';
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
          <a href="/tools/" className="footerLink">Dev Tools</a>
          <a href="/agent" className="footerLink">Agents</a>
          <a href="/harnesses" className="footerLink">Harnesses</a>
          <a href="/cleaner" className="footerLink">Disk Cleaner</a>
          <a href="/radio" className="footerLink">Radio</a>
          <a href="/blog" className="footerLink">Blog</a>
          {/* WiFi link: uncomment after AdSense approval */}
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
