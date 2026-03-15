import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
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
