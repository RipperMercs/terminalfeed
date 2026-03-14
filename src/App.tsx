import { useBtcPrice } from './hooks/useBtcPrice';
import { useBlockStream } from './hooks/useBlockStream';
import { useFearGreed } from './hooks/useFearGreed';
import { useHackerNews } from './hooks/useHackerNews';
import { useTime } from './hooks/useTime';
import { PricePanel } from './components/PricePanel';
import { BlockPanel } from './components/BlockPanel';
import { FearGreedPanel } from './components/FearGreedPanel';
import { NewsPanel } from './components/NewsPanel';
import { ClockPanel } from './components/ClockPanel';
import './App.css';

function App() {
  const { data: priceData, connected: priceConnected, priceHistory } = useBtcPrice();
  const { latestBlock, mempoolSize, feeRate, connected: blockConnected } = useBlockStream();
  const fearGreed = useFearGreed();
  const stories = useHackerNews();
  const now = useTime();

  const uptime = now.toLocaleTimeString('en-US', { hour12: false });

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="headerLeft">
          <span className="logo">
            terminal<span className="logoAccent">feed</span>
            <span className="cursor" />
          </span>
          <span className="tagline">live command center</span>
        </div>
        <div className="headerRight">
          {priceData && (
            <span className="headerStat">
              BTC{' '}
              <span className="headerStatValue">
                ${priceData.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </span>
          )}
          {latestBlock && (
            <span className="headerStat">
              BLK{' '}
              <span className="headerStatValue">
                #{latestBlock.height.toLocaleString()}
              </span>
            </span>
          )}
          <span className="headerStat">
            <span className="headerStatValue">{uptime}</span>
          </span>
        </div>
      </header>

      {/* ── Grid ── */}
      <div className="grid">
        {/* BTC Price — big panel */}
        <div className="spanCol2 spanRow2" style={{ background: 'var(--bg)' }}>
          {priceData ? (
            <PricePanel
              price={priceData.price}
              prevPrice={priceData.prevPrice}
              change24h={priceData.change24h}
              changePercent24h={priceData.changePercent24h}
              high24h={priceData.high24h}
              low24h={priceData.low24h}
              volume24h={priceData.volume24h}
              marketCap={priceData.marketCap}
              connected={priceConnected}
              priceHistory={priceHistory}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '10px', letterSpacing: '2px' }}>
                CONNECTING...
              </span>
            </div>
          )}
        </div>

        {/* Clock + Market Hours */}
        <div style={{ background: 'var(--bg)' }}>
          <ClockPanel />
        </div>

        {/* Fear & Greed */}
        <div style={{ background: 'var(--bg)' }}>
          <FearGreedPanel data={fearGreed} />
        </div>

        {/* Bitcoin Network */}
        <div style={{ background: 'var(--bg)' }}>
          <BlockPanel
            latestBlock={latestBlock}
            mempoolSize={mempoolSize}
            feeRate={feeRate}
            connected={blockConnected}
          />
        </div>

        {/* HN / Tech Feed — fills remaining space */}
        <div className="spanCol3" style={{ background: 'var(--bg)' }}>
          <NewsPanel stories={stories} />
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="footer">
        <span className="footerText">terminalfeed.io</span>
        <span className="footerText footerLive">
          {priceConnected || blockConnected ? '● live' : '○ connecting'}
        </span>
        <span className="footerText">all data refreshes automatically</span>
      </footer>
    </div>
  );
}

export default App;
