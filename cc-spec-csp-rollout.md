# CC Spec: CSP Rollout (Phases B and C)

**Date:** April 28, 2026
**Priority:** MEDIUM
**Author:** CC (followup to `cc-spec-security-hardening.md` Section 7)
**Scope:** Add `Content-Security-Policy` to TerminalFeed.io. Phase A (origin inventory) is done — see results below. Phase B ships Report-Only and gathers data. Phase C enforces.

---

## Phase A Results — Inventory of External Origins (April 28, 2026)

A code grep against the live repo yielded the following non-self origins. Anything not on this list will be blocked once Phase C ships.

### WebSocket / EventSource (`connect-src wss:` / SSE)

```
wss://stream.binance.com:9443        BTC price ticker
wss://mempool.space                  block stream + BTC network panel
wss://ws.coincap.io                  sim crypto prices
wss://certstream.calidog.io          CT log stream
https://stream.wikimedia.org         Wikipedia live edits SSE (via api/briefing path is HTTP; live-edits panel is direct SSE)
```

### Direct browser fetches (`connect-src https:`)

These violate CLAUDE.md rule #6 (every API route through the Worker). They MUST be migrated to Worker proxies BEFORE CSP enforcement, otherwise CSP will break the panels:

```
https://api.thecatapi.com            DailyPaws panel
https://dog.ceo                      DailyPaws panel
https://zenquotes.io                 FooterQuote
https://api.themoviedb.org           TrendingMovies panel
```

### Static asset hosts (`script-src` / `style-src` / `font-src`)

```
https://fonts.googleapis.com         Google Fonts CSS
https://fonts.gstatic.com            Google Fonts files
https://pagead2.googlesyndication.com  AdSense (when re-approved)
```

### Sister-site links (visible only as `<a href>`, not loaded — does not need CSP entry)

```
https://tensorfeed.ai
```

### Inline scripts

`index.html` includes inline JS for:
- SEO content block visibility toggle
- Easter eggs (matrix rain, warp speed, 2600 tone)
- i18n init via `/i18n.js`
- Service worker registration

These force `'unsafe-inline'` in `script-src` until a hashing pass replaces them. That's documented as a follow-up.

---

## Phase B — Report-Only (proposed week of May 4, 2026)

### Step 1: Worker endpoint to receive violations

Add to `worker-additions/worker.js`:

```javascript
async function handleCspReport(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);
  // Browsers send Content-Type: application/csp-report (legacy) or
  // application/reports+json (Reporting API v1). Accept either.
  var ct = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!ct.startsWith('application/csp-report') && !ct.startsWith('application/reports+json') && !ct.startsWith('application/json')) {
    return jsonResponse({ error: 'unsupported_media_type' }, 415);
  }
  var declared = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (declared > 16 * 1024) return jsonResponse({ error: 'payload_too_large' }, 413);
  var text;
  try { text = await request.text(); } catch (e) { return jsonResponse({ error: 'bad_body' }, 400); }
  if (text.length > 16 * 1024) return jsonResponse({ error: 'payload_too_large' }, 413);

  // Log to console (visible in Cloudflare Workers tail) + Analytics Engine
  console.log('[CSP_VIOLATION]', text.slice(0, 2000));
  if (env && env.AGENT_ANALYTICS) {
    try {
      env.AGENT_ANALYTICS.writeDataPoint({
        blobs: ['csp', request.headers.get('User-Agent') || '', text.slice(0, 1500)],
        doubles: [1],
        indexes: ['csp'],
      });
    } catch (e) {}
  }
  return new Response(null, { status: 204, headers: SECURITY_HEADERS });
}
```

Add route entry in `dispatchRoute()`:
```javascript
case 'csp-report': return await handleCspReport(request, env);
```

### Step 2: Add `Content-Security-Policy-Report-Only` to `public/_headers`

Append to the `/*` block:

```
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://api.terminalfeed.io https://terminalfeed.io https://api.thecatapi.com https://dog.ceo https://zenquotes.io https://api.themoviedb.org wss://stream.binance.com:9443 wss://mempool.space wss://ws.coincap.io wss://certstream.calidog.io https://stream.wikimedia.org; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; report-uri /api/csp-report
```

### Step 3: Soak for 7 days

Tail Workers logs (`npx wrangler tail terminalfeed-api`) and watch for `[CSP_VIOLATION]` lines. Expect noise from:
- Browser extensions injecting scripts (these are user-side, not our concern)
- Edge cases in panels we missed in inventory
- Inline event handlers (`onclick="..."`) we forgot to convert to `addEventListener`

Update the policy as legitimate origins surface. Goal: zero non-extension violations for 7 consecutive days.

---

## Phase C — Enforce (proposed week of May 11, 2026)

### Prerequisite

`cc-spec-backend-hardening.md` Section 1 must be done — direct browser fetches to `api.thecatapi.com`, `dog.ceo`, `zenquotes.io`, `api.themoviedb.org` migrated to Worker proxies. Without that, the strict policy below would break four panels.

### Step 1: Update `public/_headers`

Replace the Report-Only header with the enforcing version, dropping the orphan-fetch origins:

```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://api.terminalfeed.io https://terminalfeed.io wss://stream.binance.com:9443 wss://mempool.space wss://ws.coincap.io wss://certstream.calidog.io https://stream.wikimedia.org; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; report-uri /api/csp-report
```

Notes:
- `'unsafe-inline'` for `script-src` stays until inline scripts are hashed. Track that separately.
- `frame-ancestors 'self'` blocks framing site-wide. The `/widgets/*` carve-out in `_headers` already overrides with `frame-ancestors *` so embeds still work.
- `upgrade-insecure-requests` auto-rewrites any stray `http://` URL to `https://`.

### Step 2: Verify

```
curl -I https://terminalfeed.io | grep -i content-security-policy
```
should return the enforcing header.

Browse the dashboard, every tool page, every blog article. Open DevTools console — zero `Refused to load` messages.

### Step 3: Long-tail follow-ups

- Hash inline scripts (`script-src 'self' 'sha256-...'`) and remove `'unsafe-inline'`. Requires build-step integration.
- Subresource Integrity (SRI) on the AdSense script tag once approved.
- Trusted Types policy (`Trusted-Types tt-policy; require-trusted-types-for 'script'`). Optional, requires audit of all DOM string assignments.

---

## What This Spec Does NOT Cover

- Migrating orphan direct fetches off browser code (`cc-spec-backend-hardening.md` Section 1).
- Changing inline scripts in `index.html` to external files or hashed forms.
- TensorFeed-side CSP. Sister-site has its own headers config.

---

## Note to CC

Re-read CLAUDE.md before executing. Critical:
- Rule #1: NEVER CRASH THE SITE. CSP enforcement is the highest-risk single change in this whole hardening pass. Phase B (Report-Only) is mandatory before Phase C.
- Rule #5: one change at a time. Phase B is one commit. Phase C is one commit, separated by 7+ days of soak.
- Phases A done in `cc-spec-security-hardening.md` Section 7 / this file.
