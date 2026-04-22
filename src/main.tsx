import { createRoot } from 'react-dom/client'
import { Component, type ReactNode } from 'react'
import './index.css'
import App from './App.tsx'

// Error boundary: prevents white screen on crash
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TerminalFeed crash:', error);
    fetch('/api/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        url: window.location.href,
        component: errorInfo.componentStack?.substring(0, 500),
      }),
    }).catch(() => {});
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', color: '#F87171', gap: 12 }}>
          <div style={{ fontSize: 14 }}>&gt;_ terminal error</div>
          <div style={{ fontSize: 11, color: '#8A8880' }}>something broke. refreshing...</div>
          <button onClick={() => window.location.reload()} style={{ background: 'none', border: '1px solid #4ADE80', color: '#4ADE80', fontFamily: 'monospace', fontSize: 11, padding: '6px 16px', borderRadius: 4, cursor: 'pointer', marginTop: 8 }}>reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Remove static SEO content now that React is taking over
document.getElementById('seo-content')?.remove();

// No StrictMode: it double-mounts components which causes
// duplicate WebSocket connections and race conditions
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

// Console easter egg
console.log(
  '%c☎️ 2600 Hz%c\n\n' +
  '"My crime is that of curiosity."\n\n' +
  "You're inspecting the source. Good.\n" +
  "That's exactly the spirit this site was built in.\n\n" +
  'Found a bug? security@terminalfeed.io\n' +
  "Found a vulnerability? Same address. Coffee's on us.\n\n" +
  '>_ hack the planet. responsibly.\n',
  'font-size: 20px; color: #5DCAA5; font-weight: bold;',
  'font-size: 11px; color: #8A8880; font-family: monospace;'
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Global error reporters (visible in Cloudflare Workers logs)
window.addEventListener('unhandledrejection', (event) => {
  fetch('/api/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: `Unhandled rejection: ${event.reason}`,
      url: window.location.href,
    }),
  }).catch(() => {});
});

window.addEventListener('error', (event) => {
  fetch('/api/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: event.message,
      stack: `${event.filename}:${event.lineno}:${event.colno}`,
      url: window.location.href,
    }),
  }).catch(() => {});
});
