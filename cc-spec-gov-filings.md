# CC Spec: Gov Filings (SEC EDGAR + Federal Register) (Free + Premium) + Panel with Cascade Stream

**Date:** 2026-04-29
**Priority:** MEDIUM
**Owner:** Ripper
**Estimated commits:** 5

---

## Executive Summary

- Add `/api/sec-filings` (free, 60s cache, latest 25 SEC EDGAR filings with form-type badges) and `/api/pro/gov-filings` (2 credits, 60s cache, combined SEC EDGAR latest 100 + Federal Register latest 50 + per-form-type rollups + material-event flagging).
- Sources: SEC EDGAR full-text search (efts.sec.gov), Federal Register API (federalregister.gov/api/v1). Both free, both public, no API key. SEC requires a descriptive User-Agent.
- New `Gov Filings` panel using `Cascade` for an animated stream of filings with `StateChip` form-type badges and a `CountUp` for "filings today".
- Agent-bait: structured corporate disclosure + federal regulatory publication is exactly what finance, policy, and research AIs are scraping for. Pairs with existing `/api/predictions` (Polymarket on regulatory outcomes) and `/api/pro/macro`.

---

## Section 1: Worker shared fetchers

**File:** `worker-additions/worker.js`

```js
async function fetchSecEdgarLatest(forms) {
  // SEC requires a User-Agent identifying the requester. Use a TerminalFeed identifier.
  var headers = {
    'User-Agent': 'TerminalFeed.io contact-hello@terminalfeed.io',
    'Accept': 'application/json',
    'Host': 'efts.sec.gov',
  };
  var formsStr = (forms && forms.length) ? forms.join(',') : '';
  var url = 'https://efts.sec.gov/LATEST/search-index?q=&forms=' + encodeURIComponent(formsStr) + '&dateRange=custom&startdt=' + _isoDate(_daysAgo(2)) + '&enddt=' + _isoDate(new Date());
  var res = await fetchWithTimeout(url, { headers: headers }, 8000);
  if (!res.ok) throw new Error('sec-edgar ' + res.status);
  var json = await res.json();
  var hits = (json && json.hits && json.hits.hits) || [];
  return hits.map(function(h) {
    var s = (h && h._source) || {};
    var displayNames = Array.isArray(s.display_names) ? s.display_names : [];
    var primary = displayNames[0] || null;
    return {
      adsh: (h && h._id) || null,
      form: s.form || null,
      file_date: s.file_date || null,
      file_type: s.file_type || null,
      ciks: Array.isArray(s.ciks) ? s.ciks : [],
      display_names: displayNames,
      primary_filer: primary,
      ticker: _extractTicker(primary),
      url: _edgarFilingUrl(s.ciks && s.ciks[0], h && h._id),
    };
  });
}

function _isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function _daysAgo(n) {
  return new Date(Date.now() - n * 86400000);
}
function _extractTicker(displayName) {
  if (!displayName) return null;
  var m = displayName.match(/\(([A-Z0-9.\-]{1,8})\)$/);
  return m ? m[1] : null;
}
function _edgarFilingUrl(cik, adsh) {
  if (!cik || !adsh) return null;
  // adsh format: 0001234567-25-001234. Convert to no-dash form for the URL.
  var noDash = String(adsh).replace(/-/g, '');
  return 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=' + encodeURIComponent(cik) + '&type=' + '&dateb=&owner=include&count=40';
}

async function fetchFederalRegisterLatest(perPage) {
  perPage = perPage || 20;
  var url = 'https://www.federalregister.gov/api/v1/documents?per_page=' + perPage + '&order=newest';
  var res = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json' } }, 8000);
  if (!res.ok) throw new Error('fed-reg ' + res.status);
  var json = await res.json();
  var docs = (json && json.results) || [];
  return docs.map(function(d) {
    return {
      document_number: d.document_number || null,
      title: d.title || null,
      type: d.type || null,                  // Notice, Rule, Proposed Rule, Presidential Document
      agency_names: Array.isArray(d.agencies) ? d.agencies.map(function(a) { return a.name; }) : [],
      publication_date: d.publication_date || null,
      pdf_url: d.pdf_url || null,
      html_url: d.html_url || null,
      excerpts: d.excerpts || null,
    };
  });
}

function _formCategory(form) {
  // Map SEC forms to UI category buckets used for the StateChip color band.
  if (!form) return 'other';
  if (/^8-K/i.test(form)) return 'material';        // Material event
  if (/^10-K/i.test(form)) return 'annual';
  if (/^10-Q/i.test(form)) return 'quarterly';
  if (/^13F/i.test(form)) return 'holdings';
  if (/^S-1/i.test(form)) return 'ipo';
  if (/^S-3/i.test(form)) return 'shelf';
  if (/^DEF 14A/i.test(form)) return 'proxy';
  if (/^4|^3|^5/.test(form)) return 'insider';
  if (/^SC 13/i.test(form)) return 'large_holder';
  return 'other';
}
```

---

## Section 2: Free endpoint `/api/sec-filings`

### 2a. Cache TTL
```js
'sec-filings': 60000,
```

### 2b. Route case
```js
case 'sec-filings':
  return await handleSecFilings();
```

### 2c. Handler
```js
async function handleSecFilings() {
  var cached = getCached('sec-filings');
  if (cached) return jsonResponse(cached);

  var filings;
  try {
    // Mix of high-signal forms for the free tier
    filings = await fetchSecEdgarLatest(['8-K', '10-K', '10-Q', '13F', 'S-1']);
  } catch (e) {
    var stale = cache['sec-filings'];
    if (stale) return jsonResponse(stale.data);
    return jsonResponse({
      source: 'terminalfeed.io',
      endpoint: 'sec-filings',
      updated_at: new Date().toISOString(),
      data: { filings: [], error: 'upstream_unavailable' },
    });
  }

  var top = filings.slice(0, 25).map(function(f) {
    return {
      form: f.form,
      category: _formCategory(f.form),
      file_date: f.file_date,
      primary_filer: f.primary_filer,
      ticker: f.ticker,
      adsh: f.adsh,
    };
  });

  var result = {
    source: 'terminalfeed.io',
    endpoint: 'sec-filings',
    updated_at: new Date().toISOString(),
    data: {
      filings: top,
      total: filings.length,
      attribution: 'SEC EDGAR (efts.sec.gov)',
    },
  };
  if (filings.length > 0) setCache('sec-filings', result);
  return jsonResponse(result);
}
```

### 2d. handleIndex listing
```js
'/api/sec-filings': 'Latest SEC EDGAR filings (8-K, 10-K, 10-Q, 13F, S-1) with form badges',
```

---

## Section 3: Premium endpoint `/api/pro/gov-filings`

### 3a. Pro fetcher
```js
async function fetchProGovFilings(env, url) {
  var sourceMeta = [
    { name: 'sec.edgar.full_text', start: Date.now() },
    { name: 'federal_register.api', start: Date.now() },
  ];
  var settled = await Promise.allSettled([
    fetchSecEdgarLatest(['8-K', '10-K', '10-Q', '13F', 'S-1', 'S-3', 'DEF 14A', '4', 'SC 13D', 'SC 13G']),
    fetchFederalRegisterLatest(50),
  ]);
  var sec = settled[0].status === 'fulfilled' ? settled[0].value : [];
  var fr = settled[1].status === 'fulfilled' ? settled[1].value : [];

  // Categorize and roll up
  var byCategory = {};
  sec.forEach(function(f) {
    var c = _formCategory(f.form);
    byCategory[c] = (byCategory[c] || 0) + 1;
  });

  var byForm = {};
  sec.forEach(function(f) {
    var key = f.form || 'unknown';
    byForm[key] = (byForm[key] || 0) + 1;
  });

  // Material events (8-K) get extracted separately for downstream analysts
  var materialEvents = sec.filter(function(f) { return _formCategory(f.form) === 'material'; })
                          .slice(0, 25);

  // Federal Register: split by document type
  var byFrType = {};
  fr.forEach(function(d) {
    var t = d.type || 'unknown';
    byFrType[t] = (byFrType[t] || 0) + 1;
  });
  var topAgencies = {};
  fr.forEach(function(d) {
    (d.agency_names || []).forEach(function(a) {
      topAgencies[a] = (topAgencies[a] || 0) + 1;
    });
  });

  return {
    source: 'terminalfeed-pro',
    endpoint: '/api/pro/gov-filings',
    generated_at: new Date().toISOString(),
    sec_edgar: {
      filings: sec.slice(0, 100),
      total: sec.length,
      by_category: byCategory,
      by_form: byForm,
      material_events: materialEvents,
    },
    federal_register: {
      documents: fr,
      total: fr.length,
      by_type: byFrType,
      by_agency: topAgencies,
    },
    notes: {
      source_attribution: 'SEC EDGAR full-text search (efts.sec.gov) and Federal Register API (federalregister.gov). Both free public endpoints; SEC requires User-Agent.',
      cache_ttl: '1 minute. SEC and Federal Register both publish continuously during business hours.',
      use_case: 'Materiality monitoring (8-Ks), regulatory pulse (Federal Register), insider activity (Form 4), large-holder disclosure (13D/13G), policy AI agents.',
      caveat: 'EDGAR full-text search is best-effort and may slightly lag the canonical EDGAR submission firehose. For sub-second freshness, consume the EDGAR RSS directly.',
    },
    _meta: _premiumMeta('/api/pro/gov-filings', _buildSourcesMeta(settled, sourceMeta)),
  };
}
```

### 3b. Pro handler
```js
async function handleProGovFilings(request, env, url) {
  return handlePremium(request, env, url, '/api/pro/gov-filings', 2, async function(env2, url2) {
    var KEY = 'pro:gov-filings';
    return await cacheLookupOrFetch(KEY, 60000, function() { return fetchProGovFilings(env2, url2); });
  });
}
```

### 3c. Pro router case
```js
case 'pro/gov-filings':   return await handleProGovFilings(request, env, url);
```

### 3d. Pricing manifest
```js
{ path: '/api/pro/gov-filings', cost_credits: 2 },
```

### 3e. MCP tool registration
Path mapper:
```js
case 'tf_premium_gov_filings':       path = '/api/pro/gov-filings'; break;
```
Dispatcher:
```js
case 'tf_premium_gov_filings':       return await handleProGovFilings(req, env, url);
```

### 3f. MCP tool definition
```js
{
  name: 'tf_premium_gov_filings',
  description: 'Combined SEC EDGAR latest filings (with material-event extraction) plus Federal Register documents, with per-form/per-type/per-agency rollups. Costs 2 credits.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  url: 'https://terminalfeed.io/api/pro/gov-filings',
}
```

---

## Section 4: Frontend hook + panel (with Cascade stream)

**File (new):** `src/hooks/useSecFilings.ts`

Polls `/api/sec-filings` every 60s desktop / 120s mobile. Visibility-aware. 8s timeout.

```ts
export type SecFormCategory = 'material' | 'annual' | 'quarterly' | 'holdings' | 'ipo' | 'shelf' | 'proxy' | 'insider' | 'large_holder' | 'other';

export interface SecFiling {
  form: string;
  category: SecFormCategory;
  fileDate: string;
  primaryFiler: string | null;
  ticker: string | null;
  adsh: string;
}

export interface SecFilingsData {
  filings: SecFiling[];
  total: number;
}
```

**File (new):** `src/panels/SecFilingsPanel.tsx`

Visual layout:

1. **Header**: title `SEC Filings`, tag `EDGAR`, stale indicator, `1m` refresh hint.

2. **Headline stat row**:
   - `CountUp` from `0` to `total`, label `latest filings`.
   - To the right: a small badge showing the count of `category === 'material'` filings (8-Ks) with `var(--red)` background 0.15 alpha, label `<n> material events`.

3. **Filings stream** (the visual centerpiece):
   - Use the `Cascade` primitive with `CascadeEvent` entries derived from filings.
   - Each event:
     - Leading `StateChip` for the form badge. Map category to chip kind/color:
       - `material` → red (8-K)
       - `annual` → amber (10-K)
       - `quarterly` → blue (10-Q)
       - `holdings` → green (13F)
       - `ipo` → purple (S-1)
       - `insider` → teal (Form 4)
       - `large_holder` → amber (SC 13D/G)
       - `other` → dim
     - Body line: `<form> · <primaryFiler with ticker if present>`.
     - Truncate filer name to 50 chars; show ticker in `var(--text)` after, e.g. `Apple Inc. (AAPL)`.
   - Cap at 12 visible rows. Cascade handles enter animation when new filings arrive.

4. **Footer**: `Source: SEC EDGAR (filings as published)` in `var(--text-dim)` 9px.

**Critical rules:**
- `React.memo` wrapped.
- Returns `null` if `filings.length === 0`.
- Every field accessed in render uses `?? fallback` defaults.
- The `Cascade` event keys MUST be the unique `adsh` (filing accession number). If two filings happen to share the same accession number (shouldn't happen but defensive), append the index.

---

## Section 5: Register panel + bump layout version

**File:** `src/hooks/useLayoutManager.ts`

Add near `markets` and `crypto` (this is a finance-adjacent feed):
```ts
{ id: 'sec-filings', label: 'SEC Filings', defaultSpan: 1 },
```
Bump `CURRENT_VERSION` by 1 from current.

**File:** `src/App.tsx`

1. Import hook + panel.
2. Call hook.
3. `panelHealth.reportData('sec-filings')` when `secFilings && secFilings.filings.length > 0`.
4. Add `'sec-filings': <SecFilingsPanel data={secFilings} ... />` to render map.
5. Wrap in per-panel ErrorBoundary.

**Files:** `public/llms.txt`, `public/openapi.json`, `CLAUDE.md` — add lines for both endpoints.

---

## Execution Order

1. Section 1 (fetchers + helpers).
2. Section 2 (free endpoint, deploy, verify with `curl https://terminalfeed.io/api/sec-filings | jq '.data.filings[0]'`).
3. Section 3 (pro endpoint + MCP, redeploy, verify with bearer).
4. Section 4 (hook + panel with Cascade + StateChip + CountUp).
5. Section 5 (register, version bump, docs).

---

## Verification Checklist

- [ ] `curl https://terminalfeed.io/api/sec-filings` returns 200 with `data.filings` length > 0 during US business hours.
- [ ] Cloudflare Workers logs show 200 from `efts.sec.gov` (not 403). If 403, verify the `User-Agent` header is set.
- [ ] Pro endpoint returns both `sec_edgar` and `federal_register` blocks populated.
- [ ] `material_events` includes only 8-K-prefixed filings.
- [ ] StateChip badges render with correct color per category.
- [ ] Cascade animation runs on first load and subsequent polls without flickering or remounting unrelated rows (check that the unique key is `adsh`).
- [ ] Panel hides cleanly outside US business hours when EDGAR is quiet (filings still trickle but may be near-zero on weekends).
- [ ] No direct browser fetch to efts.sec.gov or federalregister.gov.

---

## Out of Scope

- Per-company filing history.
- Filing content extraction (XBRL parsing, financial statement structuring).
- Sentiment scoring of filing text.
- Push notifications for specific tickers' 8-Ks.
- A separate `/api/federal-register` free endpoint (Federal Register data is bundled into the pro endpoint only).

---

## Note to CC

- Edit ONLY `worker-additions/worker.js`. Orphan subfolder is off-limits.
- SEC EDGAR REQUIRES a descriptive User-Agent. The fetcher in Section 1 sets one; do not remove or shorten it.
- Pro endpoint via `handlePremium(...)` only. Register MCP tool in BOTH switches.
- Null-safe defaults on every field consumed in the panel.
- Use the existing `Cascade` and `StateChip` primitives. Don't invent new ones.
- No em dashes anywhere.
- Worker first, frontend second.

End of spec.
