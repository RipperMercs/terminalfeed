import { useState } from 'react';
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
import { LiveChart } from './components/LiveChart';
import { useGithubTrending } from './hooks/useGithubTrending';
import { useRedditTech } from './hooks/useRedditTech';
import './App.css';

function App() {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const { data: priceData, connected: priceConnected, priceHistory } = useBtcPrice();
  const { latestBlock, mempoolSize, feeRate, connected: blockConnected } = useBlockStream();
  const fearGreed = useFearGreed();
  const stories = useHackerNews();
  const now = useTime();
  const stocks = useSimStocks();
  const crypto = useSimCrypto();
  const metals = useMetals();
  const games = useSportsScores();
  const trendingRepos = useGithubTrending();
  const redditPosts = useRedditTech();

  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const btcPrice = priceData?.price ?? 0;
  const btcChange = priceData?.changePercent24h ?? 0;
  const isUp = btcChange >= 0;

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

      {/* ── Main Grid ── */}
      <div className="grid">

        {/* BTC Price — large */}
        <div className="panel spanCol2">
          <div className="panelHeader">
            <div className="panelHeaderLeft">
              <span className="panelTitle">Bitcoin</span>
              <span className="panelTag">BTC/USD</span>
              {priceData?.source && (
                <span className="panelTagDim">{priceData.source}</span>
              )}
            </div>
            <div className="panelLive">
              <span className="liveDot" style={{ background: priceConnected ? 'var(--green)' : 'var(--red)' }} />
              <span className="liveText">{priceConnected ? 'LIVE' : 'CONNECTING'}</span>
            </div>
          </div>
          <div className="priceMain">
            <div>
              <div className="priceValue">
                ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
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
          <LiveChart
            ticks={priceHistory}
            color={isUp ? '#4ADE80' : '#F87171'}
            height={160}
          />
        </div>

        {/* Fear & Greed */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelHeaderLeft">
              <span className="panelTitle">Fear & Greed</span>
              <span className="panelTag">INDEX</span>
            </div>
            <div className="panelLive">
              <span className="liveDot" />
              <span className="liveText">LIVE</span>
            </div>
          </div>
          {fearGreed ? (
            <div style={{ padding: '8px 0' }}>
              <div className="fgValue" style={{ color: fgColor(fearGreed.value) }}>{fearGreed.value}</div>
              <div className="fgLabel" style={{ color: fgColor(fearGreed.value) }}>{fearGreed.label}</div>
              <div className="fgBar">
                <div className="fgIndicator" style={{ left: `${fearGreed.value}%` }} />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 20, fontSize: 10, color: 'var(--text-dim)' }}>
              loading...
            </div>
          )}
        </div>

        {/* Crypto */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelHeaderLeft">
              <span className="panelTitle">Crypto</span>
            </div>
            <div className="panelLive">
              <span className="liveDot" />
              <span className="liveText">LIVE</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {crypto.map((c) => (
              <div key={c.symbol} className="listRow">
                <span className="listRowSymbol">{c.symbol}</span>
                <div>
                  <span className="listRowPrice">
                    ${c.price < 1
                      ? c.price.toFixed(4)
                      : c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`listRowChange ${c.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>
                    {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Markets + Gold */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelHeaderLeft">
              <span className="panelTitle">Markets</span>
              <span className="panelTag">US</span>
            </div>
            <div className="panelLive">
              <span className="liveDot" />
              <span className="liveText">LIVE</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Gold at top */}
            {metals.filter((m) => m.price > 0).map((m) => (
              <div key={m.symbol} className="listRow" style={{ paddingBottom: 6, marginBottom: 4, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span className="listRowSymbol" style={{ color: 'var(--gold)' }}>{m.symbol}</span>
                  <span className="listRowName">{m.name}</span>
                </div>
                <div>
                  <span className="listRowPrice" style={{ color: 'var(--gold)' }}>
                    ${m.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className={`listRowChange ${m.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>
                    {m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
            {/* Stocks */}
            {stocks.map((s) => (
              <div key={s.symbol} className="listRow">
                <div>
                  <span className="listRowSymbol">{s.symbol}</span>
                  <span className="listRowName">{s.name}</span>
                </div>
                <div>
                  <span className="listRowPrice">
                    ${s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`listRowChange ${s.change >= 0 ? 'tickerUp' : 'tickerDown'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* News Feed — full width */}
        <div className="panel spanCol3">
          <div className="panelHeader">
            <div className="panelHeaderLeft">
              <span className="panelTitle">Tech / AI Feed</span>
              <span className="panelTag">HN</span>
            </div>
            <div className="panelLive">
              <span className="liveDot" />
              <span className="liveText">LIVE</span>
            </div>
          </div>
          <div>
            {stories.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, fontSize: 10, color: 'var(--text-dim)' }}>
                loading headlines...
              </div>
            )}
            {stories.map((story) => {
              const tag = getTag(story.title);
              const tagColor = tagColors[tag] || 'var(--text-mid)';
              return (
                <a
                  key={story.id}
                  href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="newsRow"
                >
                  <span
                    className="newsTag"
                    style={{ color: tagColor, background: `${tagColor}15` }}
                  >
                    {tag}
                  </span>
                  <span className="newsTitle">{story.title}</span>
                  <span className="newsMeta">{story.by}</span>
                  <span className="newsMeta">{timeAgo(story.time)}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* GitHub Trending */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelHeaderLeft">
              <span className="panelTitle">GitHub Trending</span>
              <span className="panelTag">7D</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {trendingRepos.length === 0 && (
              <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>
                loading repos...
              </div>
            )}
            {trendingRepos.map((repo) => (
              <a
                key={repo.fullName}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="newsRow"
              >
                <span className="ghStars">{formatStars(repo.stars)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ghRepoName">{repo.fullName}</div>
                  <div className="ghRepoDesc">{repo.description}</div>
                </div>
                {repo.language && (
                  <span className="ghLang">{repo.language}</span>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Reddit Tech */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelHeaderLeft">
              <span className="panelTitle">Reddit</span>
              <span className="panelTag">TECH</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {redditPosts.length === 0 && (
              <div style={{ textAlign: 'center', padding: 16, fontSize: 10, color: 'var(--text-dim)' }}>
                loading posts...
              </div>
            )}
            {redditPosts.map((post) => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="newsRow"
              >
                <span className="redditScore">{formatStars(post.score)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="newsTitle">{post.title}</span>
                </div>
                <span className="redditSub">r/{post.subreddit}</span>
              </a>
            ))}
          </div>
        </div>

        {/* BTC Network */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelHeaderLeft">
              <span className="panelTitle">BTC Network</span>
            </div>
            {blockConnected && (
              <div className="panelLive">
                <span className="liveDot" />
                <span className="liveText">LIVE</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="netRow">
              <span className="netLabel">Block height</span>
              <span className="netValue">{latestBlock ? `#${latestBlock.height.toLocaleString()}` : '--'}</span>
            </div>
            <div className="netRow">
              <span className="netLabel">Fee rate</span>
              <span className="netValue">{feeRate ? `${feeRate} sat/vB` : '--'}</span>
            </div>
            <div className="netRow">
              <span className="netLabel">Mempool</span>
              <span className="netValue">{mempoolSize !== null ? `${formatCount(mempoolSize)} txs` : '--'}</span>
            </div>
            {latestBlock?.pool && (
              <div className="netRow">
                <span className="netLabel">Last mined by</span>
                <span className="netValue">{latestBlock.pool}</span>
              </div>
            )}
            {latestBlock && (
              <div className="netRow">
                <span className="netLabel">Block size</span>
                <span className="netValue">{(latestBlock.size / 1e6).toFixed(2)} MB</span>
              </div>
            )}
            {latestBlock && (
              <div className="netRow">
                <span className="netLabel">Transactions</span>
                <span className="netValue">{latestBlock.txCount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sports Scores */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelHeaderLeft">
              <span className="panelTitle">Scores</span>
              <span className="panelTag">ESPN</span>
            </div>
            {liveCount > 0 && (
              <div className="panelLive">
                <span className="liveDot" style={{ background: 'var(--red)' }} />
                <span className="liveText">{liveCount} LIVE</span>
              </div>
            )}
          </div>
          <div>
            {displayGames.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, fontSize: 10, color: 'var(--text-dim)' }}>
                loading scores...
              </div>
            )}
            {displayGames.map((game) => (
              <div key={game.id} className="scoreRow">
                <span className="scoreLeague">{game.league}</span>
                <div className="scoreTeams">
                  <span className="scoreTeam">
                    <span className="scoreAbbr">{game.awayAbbr}</span>
                    <span className={`scoreVal ${game.status === 'in' ? 'scoreLive' : ''}`}>{game.awayScore}</span>
                  </span>
                  <span className="scoreAt">@</span>
                  <span className="scoreTeam">
                    <span className="scoreAbbr">{game.homeAbbr}</span>
                    <span className={`scoreVal ${game.status === 'in' ? 'scoreLive' : ''}`}>{game.homeScore}</span>
                  </span>
                </div>
                <span className={`scoreStatus ${game.status === 'in' ? 'scoreStatusLive' : ''}`}>
                  {game.statusDetail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Support / Ad */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelHeaderLeft">
              <span className="panelTitle">Support</span>
            </div>
          </div>
          <div className="adPlaceholder">
            <div className="adLabel">Ad space</div>
            <div className="adSize">300x250</div>
          </div>
          <div className="donateLabel">Donate BTC</div>
          <div className="donateAddr">3GLimw2rSrne3hfrsanjoVxrM2Dwsbmkdy</div>
          <div className="donateNote">Lightning / on-chain accepted</div>
        </div>

      </div>

      {/* ── Bottom Bar ── */}
      <div className="bottomBar">
        <div className="bottomBarLeft">
          <span>terminalfeed.io</span>
          <span className="bottomBarDivider">&middot;</span>
          <span>Not financial advice</span>
          <span className="bottomBarDivider">&middot;</span>
          <button className="footerLink" onClick={() => setLegalModal('privacy')}>Privacy</button>
          <button className="footerLink" onClick={() => setLegalModal('terms')}>Terms</button>
        </div>
        <div className="bottomBarStatus">
          <span className="bottomBarDot" style={{
            background: (priceConnected || blockConnected) ? 'var(--green)' : 'var(--red)',
          }} />
          <span>{(priceConnected || blockConnected) ? 'All systems operational' : 'Connecting...'}</span>
        </div>
      </div>

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

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

export default App;
