import { useEffect } from 'react';
import './LegalModal.css';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="legalOverlay" onClick={onClose}>
      <div className="legalModal" onClick={(e) => e.stopPropagation()}>
        <div className="legalHeader">
          <span className="legalTitle">
            {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
          </span>
          <button className="legalClose" onClick={onClose}>✕</button>
        </div>
        <div className="legalBody">
          {type === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <>
      <p className="legalDate">Last updated: March 21, 2026</p>

      <h3>1. Introduction</h3>
      <p>
        TerminalFeed.io ("we", "our", "us") operates the terminalfeed.io website (the "Service").
        This Privacy Policy explains how we collect, use, and protect information when you use our Service.
      </p>

      <h3>2. Information We Collect</h3>
      <p>
        <strong>Automatically Collected Information:</strong> When you visit our Service, our servers and
        third-party services may automatically collect certain information including your IP address,
        browser type, operating system, referring URLs, pages viewed, and access times. This data is
        collected via server logs and cookies.
      </p>
      <p>
        <strong>Cookies and Tracking:</strong> We use cookies and similar technologies for analytics
        and advertising purposes. Third-party advertising partners, including Google AdSense, may use
        cookies to serve ads based on your prior visits to our website or other websites.
      </p>
      <p>
        <strong>Personal Information:</strong> We do not require account creation or collect personal
        information such as names, email addresses, or payment details directly. Any information entered
        into the dashboard (such as Bitcoin addresses) is stored locally in your browser and is never
        transmitted to our servers.
      </p>

      <h3>3. How We Use Information</h3>
      <p>We use collected information to:</p>
      <ul>
        <li>Operate and maintain the Service</li>
        <li>Analyze usage patterns to improve the Service</li>
        <li>Display relevant advertisements</li>
        <li>Detect and prevent abuse or security issues</li>
      </ul>

      <h3>4. Third-Party Services</h3>
      <p>Our Service uses the following third-party services that may collect data:</p>
      <ul>
        <li><strong>Google AdSense:</strong> Serves advertisements and may use cookies for ad personalization.
          You can opt out of personalized advertising at <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</li>
        <li><strong>Cloudflare:</strong> Provides hosting, CDN, and security services. See <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare's Privacy Policy</a>.</li>
        <li><strong>CoinGecko, CoinCap, Mempool.space, HackerNews:</strong> We fetch publicly available data from these APIs. No personal information is shared with them.</li>
        <li><strong>Cloudflare Speed Test (speed.cloudflare.com):</strong> Provides download and upload speed measurement for the WiFi Health Monitor tool via Cloudflare's public speed test endpoints.</li>
        <li><strong>Cloudflare DNS (1.1.1.1):</strong> Provides DNS resolution speed testing for the WiFi Health Monitor tool via DNS-over-HTTPS. Receives DNS queries when a WiFi test is run.</li>
      </ul>

      <h3>4A. WiFi Health Monitor Tool: Data Practices</h3>
      <p>
        The WiFi Health Monitor tool at terminalfeed.io/wifi computes all measurements and diagnostics
        client-side in your browser. No WiFi Tool data is sent to TerminalFeed.io servers.
      </p>
      <p>
        <strong>What the WiFi Tool collects:</strong> Your public IP address is processed by our own
        Cloudflare server function for geolocation (never sent to a third-party IP lookup service).
        Speed tests use Cloudflare's public speed test endpoints. DNS queries are sent to Cloudflare's
        DoH resolver. HTTP requests are made to Google's connectivity endpoints for latency measurements.
      </p>
      <p>
        <strong>What it does NOT collect:</strong> We do not store test results, access your local network
        or router, scan for nearby WiFi networks, or persist any test data between visits. Test history
        exists only in browser session memory.
      </p>

      <h3>5. Google AdSense & Cookies</h3>
      <p>
        Google uses cookies to serve ads based on your visit to our site and/or other sites on the Internet.
        Google's use of advertising cookies enables it and its partners to serve ads based on your visit to
        our site and/or other sites on the Internet. You may opt out of personalized advertising by visiting
        {' '}<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
      </p>
      <p>
        For more information about how Google uses data, visit{' '}
        <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
          How Google uses data when you use our partners' sites
        </a>.
      </p>

      <h3>6. Data Retention</h3>
      <p>
        Server logs and analytics data are retained for up to 12 months. You can clear locally stored
        data at any time through your browser settings.
      </p>

      <h3>7. Children's Privacy</h3>
      <p>
        Our Service is not directed to individuals under the age of 13. We do not knowingly collect
        personal information from children under 13.
      </p>

      <h3>8. Your Rights</h3>
      <p>
        Depending on your jurisdiction, you may have the right to access, correct, delete, or port
        your personal data. Since we collect minimal data, most information can be managed through
        your browser settings and ad preference controls.
      </p>

      <h3>9. Changes to This Policy</h3>
      <p>
        We may update this Privacy Policy from time to time. Changes will be posted on this page
        with an updated revision date.
      </p>

      <h3>10. Contact</h3>
      <p>
        If you have questions about this Privacy Policy, please contact us at privacy@terminalfeed.io.
      </p>
    </>
  );
}

function TermsOfService() {
  return (
    <>
      <p className="legalDate">Last updated: March 21, 2026</p>

      <h3>1. Acceptance of Terms</h3>
      <p>
        By accessing and using TerminalFeed.io (the "Service"), you agree to be bound by these
        Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
      </p>

      <h3>2. Description of Service</h3>
      <p>
        TerminalFeed.io is a real-time information dashboard that aggregates publicly available
        data including cryptocurrency prices, market data, network statistics, news feeds,
        browser-based WiFi and network diagnostics, and other data streams.
        The Service is provided for informational and entertainment purposes only.
      </p>

      <h3>3. Not Financial Advice</h3>
      <p>
        <strong>The information displayed on TerminalFeed.io does not constitute financial advice,
        investment advice, trading advice, or any other form of professional advice.</strong> All
        data is provided "as is" from third-party sources and may be delayed, inaccurate, or
        incomplete. You should not make any financial decisions based solely on information
        displayed on this Service. Always consult a qualified financial advisor before making
        investment decisions.
      </p>

      <h3>3A. WiFi Health Monitor Tool: Disclaimer</h3>
      <p>
        The WiFi Health Monitor tool at terminalfeed.io/wifi provides browser-based network
        diagnostics including approximate speed measurements, latency tests, DNS resolution timing,
        and connection quality estimates. The WiFi Tool provides estimates and approximations only
        and should not be used as the sole basis for network purchasing decisions, ISP service
        disputes, or contractual claims. It does NOT access your router, scan your local network,
        or interact with any network hardware. All tests use standard HTTP/HTTPS requests to
        publicly available endpoints (Cloudflare Speed Test, Cloudflare DoH, Google connectivity checks).
        Use at your own risk.
      </p>

      <h3>4. No Warranties</h3>
      <p>
        The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any
        kind, either express or implied, including but not limited to warranties of merchantability,
        fitness for a particular purpose, accuracy, or non-infringement.
      </p>
      <p>We do not warrant that:</p>
      <ul>
        <li>The Service will be uninterrupted, timely, secure, or error-free</li>
        <li>Data displayed will be accurate, complete, or current</li>
        <li>Any errors in the Service will be corrected</li>
      </ul>

      <h3>5. Limitation of Liability</h3>
      <p>
        In no event shall TerminalFeed.io, its owners, operators, or affiliates be liable for any
        direct, indirect, incidental, special, consequential, or punitive damages arising out of or
        related to your use of or inability to use the Service, including but not limited to any
        losses or damages resulting from financial decisions made based on information displayed
        on the Service.
      </p>

      <h3>6. Third-Party Data</h3>
      <p>
        The Service aggregates data from third-party APIs and sources including but not limited to
        CoinGecko, CoinCap, Mempool.space, Finnhub, Hacker News, Cloudflare DNS (1.1.1.1), Cloudflare Speed Test,
        and others. We are not responsible for the accuracy, reliability, or availability of third-party
        data. Third-party services are subject to their own terms of service and privacy policies.
      </p>

      <h3>7. Acceptable Use</h3>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose</li>
        <li>Attempt to gain unauthorized access to any part of the Service</li>
        <li>Interfere with or disrupt the Service or servers</li>
        <li>Scrape, crawl, or use automated means to access the Service beyond normal browsing</li>
        <li>Reproduce, distribute, or create derivative works from the Service without permission</li>
      </ul>

      <h3>8. Intellectual Property</h3>
      <p>
        The Service's design, layout, code, and original content are owned by TerminalFeed.io.
        Third-party data, trademarks, and content remain the property of their respective owners.
      </p>

      <h3>9. Modifications</h3>
      <p>
        We reserve the right to modify, suspend, or discontinue the Service at any time without
        notice. We may also update these Terms from time to time. Continued use of the Service
        after changes constitutes acceptance of the modified Terms.
      </p>

      <h3>10. Governing Law</h3>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the
        United States, without regard to conflict of law principles.
      </p>

      <h3>11. Contact</h3>
      <p>
        If you have questions about these Terms, please contact us at legal@terminalfeed.io.
      </p>
    </>
  );
}
