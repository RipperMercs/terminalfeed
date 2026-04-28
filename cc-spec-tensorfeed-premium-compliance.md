# cc-spec-tensorfeed-premium-compliance.md

**For: TensorFeed.ai (sister site of TerminalFeed.io, same operating entity Pizza Robot Studios LLC)**

**Date:** April 28, 2026
**Priority:** HIGH
**Single-file spec.** Copy this entire file into a fresh CC session in the tensorfeed project root. Do not split. Do not abbreviate.

---

## Executive Summary

TerminalFeed.io shipped legal hardening + OFAC geo-block on April 28, 2026 for the Premium API tier (USDC on Base, $1 = 50 credits, /api/pro/* endpoints). Because credits and bearer tokens are jointly redeemable on terminalfeed.io and tensorfeed.ai (cross-site bundle, shared credit pool, TensorFeed is system of record), TensorFeed must mirror the legal text AND host the authoritative wallet-level OFAC screening.

This spec covers four numbered sections, executable independently as separate commits:

1. Mirror new Terms clauses (§15 governing law update, §17.9 through §17.15) into tensorfeed.ai/terms.
2. Mirror new Privacy clause (§4B Premium API Tier: Data Practices) into tensorfeed.ai/privacy.
3. Add Chainalysis OFAC sanctions screening to the TensorFeed payment Worker at /api/payment/confirm (the authoritative wallet-screening gate).
4. Add geo-IP block to TensorFeed's /api/payment/buy-credits handler (mirrors what TerminalFeed already has).

**Why now:** OFAC is strict liability. The §17.9 sanctions warranty in the new terms is a contractual defense; the screening in section 3 below is the actual prevention. Both layers are needed. TensorFeed is the credit-minting system of record, so the wallet-level gate MUST live here.

**Critical writing rule (Pizza Robot Studios global CLAUDE.md):** No em dashes. No double hyphens. Use commas, periods, semicolons, parens. This applies to every word added by this spec.

---

## Section 1. Terms of Service mirror (tensorfeed.ai/terms)

### 1.1 Update the "Last updated" date

Find on /terms:
```
Last updated: <existing date>
```
Replace with:
```
Last updated: April 28, 2026
```

### 1.2 Update Section 15 (Governing Law and Venue)

Find the existing Section 15 (likely titled "Governing Law" with vague "United States" wording) and replace with:

```html
<h3>15. Governing Law and Venue</h3>
<p>These Terms, and any non-contractual obligations arising out of or in connection with them, shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of laws principles. The United Nations Convention on Contracts for the International Sale of Goods does not apply.</p>
<p>You and Pizza Robot Studios LLC agree that any dispute, claim, or proceeding arising out of or related to these Terms or your use of the Service, including the Premium API Tier, shall be brought exclusively in the state or federal courts located in Los Angeles County, California, United States, and you irrevocably consent to the personal jurisdiction and venue of those courts. Either party may seek injunctive or other equitable relief in any court of competent jurisdiction to protect its intellectual property or confidential information.</p>
```

### 1.3 Insert Sections 17.9 through 17.15

These go AFTER the existing 17.8 (Cross-site applicability) and BEFORE 17A (Schema Stability), if both exist on tensorfeed.ai. If TensorFeed's Premium API Tier section is structured differently, place them at the end of the Premium API Tier section just before any schema-stability or operational annexes.

**Note on cross-references:** every "/terms#premium" or "Section 17.X" reference below is internal to the same Terms page, so it works on tensorfeed.ai unchanged. Wallet address, cross-site partner name, and "we accept USDC on Base mainnet" wording are all factually identical on both sites.

```html
<p><strong>17.9 User and operator representations.</strong> By purchasing premium credits, by deploying an autonomous agent that purchases or holds premium credits on your behalf, or by accepting custody of a bearer token, you represent and warrant on a continuing basis that: (a) you are at least 18 years old, or the age of legal majority in your jurisdiction, and have full legal capacity and authority to enter into this agreement, including, where applicable, authority to bind any corporate or other entity on whose behalf you act; (b) you are not a person or entity subject to sanctions administered or enforced by the United States Office of Foreign Assets Control (OFAC), the United States Department of State, the United Nations Security Council, the European Union, the United Kingdom HM Treasury, or any other applicable sanctions authority; (c) you are not located, established, ordinarily resident, or organized in any country or territory subject to comprehensive sanctions, currently including Cuba, Iran, North Korea, Syria, the Crimea region, the so-called Donetsk and Luhansk People's Republics, and any successor or analogous designation; (d) the funds used to acquire USDC and to pay for credits are derived from lawful sources and are not the proceeds of any criminal activity; (e) your use of the Premium API will comply with all applicable laws, including anti-money-laundering, counter-terrorism financing, export control, sanctions, securities, tax, and consumer-protection laws; and (f) you are not acting on behalf of, and will not transfer credits or bearer tokens to, any party with respect to whom any of the foregoing representations is or would become untrue. Breach of any representation in this Section is a material breach of these Terms and grounds for immediate token revocation under Section 17.11.</p>

<p><strong>17.10 Autonomous agent acknowledgment.</strong> The Premium API is designed to be consumed by autonomous AI agents and other automated systems. When you deploy or operate such an agent and configure it, directly or indirectly, to access the Premium API, you remain solely responsible for: (i) the actions and omissions of the agent, including all on-chain transactions it initiates and all calls it makes; (ii) the bearer tokens it holds and the credits it spends; (iii) any decisions, including financial, investment, trading, operational, safety, medical, or legal decisions, made by the agent or by downstream systems on the basis of Premium API responses; and (iv) any losses, costs, or damages that result from the agent's behavior. Premium API responses are provided for informational and inference purposes only. Aggregated upstream data may be stale, partial, inaccurate, or unavailable, and nothing returned by the Premium API constitutes financial, investment, trading, legal, medical, or other professional advice. We are not a fiduciary, broker-dealer, investment adviser, or counterparty to any trade, and we assume no responsibility for outcomes arising from autonomous use of the Service.</p>

<p><strong>17.11 Suspension and revocation for abuse.</strong> We reserve the right, in our sole and reasonable discretion and with or without prior notice, to throttle, rate-limit, suspend, or permanently revoke any bearer token, to refuse to confirm any pending credit purchase, and to refuse future purchases originating from the same wallet, email, operator, or related party, where we determine in good faith that the associated activity: (i) violates these Terms or applicable law; (ii) constitutes fraud, money laundering, sanctions evasion, market manipulation, or other illicit conduct; (iii) materially degrades the Service for other users, including denial-of-service patterns, runaway loops, or scraping at volumes inconsistent with normal agent behavior; (iv) attempts to circumvent billing, replay confirmed transactions, share or distribute bearer tokens beyond a single agent or operator in a manner not reasonably contemplated by the cross-site bundle in Section 17.8, or otherwise manipulate the credit-accounting system; or (v) presents a security, regulatory, or reputational risk to the Service or to its operating entity. Where we revoke a bearer token under this Section, any unspent credits associated with that token are forfeited and are not subject to refund, reissuance, or any other compensation. Section 17.5 (no refunds) governs the financial consequences of any action taken under this Section.</p>

<p><strong>17.12 Premium API acceptable use.</strong> In addition to Section 7 (Acceptable Use), users and operators of the Premium API agree not to: (a) resell, sublicense, or otherwise commercialize raw Premium API access, whether by reselling bearer tokens, by exposing a wrapper or proxy API that materially reproduces the Premium API surface for third parties, or by any other means; (b) use the Premium API to build, train, fine-tune, evaluate, or improve any product, model, or service that competes, directly or indirectly, with the Service or with the cross-site partner described in Section 17.8; (c) scrape, mirror, or systematically download Premium API responses for the purpose of building a competing data-aggregation product or dataset; (d) attempt to reverse-engineer rate limits, billing logic, credit accounting, or signature verification; (e) submit requests at a volume that, in our reasonable judgment, exceeds normal agent operation, including through coordinated multi-token campaigns designed to evade per-token limits; (f) use Premium API responses in any way that violates the inference-only license in Section 17.1; or (g) embed Premium API access in any product or service marketed to, or knowingly used by, persons subject to the sanctions or jurisdictional restrictions in Section 17.9. For clarity, building agent products and downstream applications that consume the Premium API on behalf of their own end users, where each call is properly billed against a credit balance held by the operator, is permitted and encouraged.</p>

<p><strong>17.13 Limitation of liability for the Premium API.</strong> Without limiting Sections 4 (No Warranties) and 5 (Limitation of Liability) above, and to the maximum extent permitted by applicable law, the aggregate liability of Pizza Robot Studios LLC and its members, managers, officers, employees, contractors, agents, and affiliates (collectively, the "Released Parties") to any user, operator, agent, or end user, arising out of or related to the Premium API, on any theory of liability whether in contract, tort (including negligence), statute, or otherwise, shall not exceed the greater of: (i) the total USDC-equivalent amount actually paid by that user or operator for Premium API credits in the twelve (12) months immediately preceding the event giving rise to the claim, or (ii) one hundred United States dollars (USD 100). In no event shall any of the Released Parties be liable for lost profits, lost revenue, lost trading opportunities, lost data, lost goodwill, business interruption, regulatory fines, or for any indirect, incidental, special, consequential, exemplary, or punitive damages, even if advised in advance of the possibility of such damages. Some jurisdictions do not allow the exclusion or limitation of certain damages; in such jurisdictions, the foregoing limitations apply to the maximum extent permitted by law and the remaining limitations remain in full force.</p>

<p><strong>17.14 Chargeback, reversal, and fraudulent purchase handling.</strong> USDC transfers on Base mainnet are technically irreversible, and once we have confirmed an inbound transaction and minted credits to a bearer token, we are not in a position to return the original USDC. Where, however, an underlying fiat-to-USDC purchase is later reversed, charged back, voided, or determined by us in good faith to have been funded fraudulently, by means of compromised credentials, or in violation of Section 17.9, we reserve the right, in addition to the remedies in Section 17.11, to: (i) freeze the bearer token associated with the affected purchase; (ii) reverse the corresponding credit grant in whole or in part; (iii) decline future purchases originating from the same wallet, email, device, or operator, and from any related party we reasonably identify; and (iv) report the matter to law enforcement, to regulators, and to the cross-site partner described in Section 17.8. The user or operator who submitted the original payment instruction shall indemnify the Released Parties against any losses, costs, fees, or liabilities we suffer as a result of such reversal, fraud, or compromise.</p>

<p><strong>17.15 No money services business; sale of own service.</strong> Pizza Robot Studios LLC is not, and does not hold itself out as, a money services business, money transmitter, virtual asset service provider, exchange, custodian, broker-dealer, investment adviser, or other financial institution. We accept USDC on Base mainnet as payment for our own data and information services, and we do not exchange currencies, custody assets for users, facilitate transfers of value between users, or hold customer funds beyond the period reasonably required to confirm a credit purchase. Nothing in these Terms creates any fiduciary, advisory, agency, or banking relationship between you and Pizza Robot Studios LLC.</p>
```

### 1.4 Verify Section 17.5 (No refunds)

If TensorFeed's existing Section 17.5 still says anything about a "24-hour refund window," replace it with the no-refunds version. The canonical text is:

```html
<p><strong>17.5 No refunds; credits do not expire.</strong> All credit purchases are final and non-refundable. Once a purchase is confirmed on-chain and credits are minted to a bearer token, the funds will not be returned in USDC, fiat, or any other form. Because credits never expire and remain spendable indefinitely on terminalfeed.io and tensorfeed.ai, users are encouraged to purchase in small increments (for example, $1 USDC for 50 credits) until call volume is calibrated, then top up as needed. The sole remedy for a purchase that turns out to be larger than required is to spend the unused balance over time, including on the cross-site partner described in Section 17.8.</p>
```

### 1.5 Commit

```
chore(legal): mirror TerminalFeed Premium API legal hardening (s17.9-17.15, s15 venue, no-refunds)
```

---

## Section 2. Privacy Policy mirror (tensorfeed.ai/privacy)

### 2.1 Update the "Last updated" date

To `Last updated: April 28, 2026`.

### 2.2 Insert new Section 4B (Premium API Tier: Data Practices)

Insert this AFTER any existing Section 4 (Third-Party Services) or 4A (existing tool-specific sections) and BEFORE Section 5 (Advertising or equivalent). If TensorFeed has no 4A, insert as 4B directly after Section 4.

```html
<h3 id="premium-api">4B. Premium API Tier: Data Practices</h3>
<p>The Premium API tier described in Section 17 of our <a href="/terms#premium">Terms of Service</a> involves collecting and processing additional data beyond the core dashboard. This Section explains what we collect, why, and how long we keep it.</p>

<p><strong>What we collect for the Premium API:</strong></p>
<ul>
  <li><strong>Sender wallet address.</strong> When you, or an autonomous agent acting on your behalf, send USDC to our published Base mainnet wallet to purchase credits, we record the sender wallet address as part of the payment confirmation flow. Wallet addresses are pseudonymous but, under EU GDPR, UK GDPR, the California Consumer Privacy Act, and similar laws, may constitute personal data because they uniquely identify a transacting party. We use this data to credit the correct bearer token, prevent replay of the same transaction hash, screen for sanctions and anti-money-laundering concerns where appropriate, and respond to lawful requests from regulators or law enforcement.</li>
  <li><strong>Transaction hash.</strong> The Base mainnet transaction hash is recorded server-side and used to enforce one-time credit issuance under the replay-protection rule in Section 17.4 of the Terms.</li>
  <li><strong>Bearer token (hashed).</strong> We do not store the raw bearer token. We store a one-way cryptographic hash of the token together with the associated credit balance, issuance timestamp, and, where applicable, revocation status.</li>
  <li><strong>Per-call telemetry.</strong> For each Premium API call, we record the bearer-token hash, the endpoint called, the response status, the credits decremented, and a timestamp. Request payloads and response bodies are not stored in plaintext beyond the short-lived in-memory cache used for performance.</li>
  <li><strong>Email correspondence.</strong> If you email support@tensorfeed.ai, hello@tensorfeed.ai, legal@tensorfeed.ai, or any other Service mailbox in connection with a payment, token, billing, or account matter, we receive your email address and the contents of your message and may retain them for support, audit, and anti-abuse purposes.</li>
</ul>

<p><strong>What we do not collect for the Premium API:</strong></p>
<ul>
  <li>We do not collect names, government IDs, KYC documents, postal addresses, phone numbers, dates of birth, or fiat payment-card details. The Premium API has no human registration flow.</li>
  <li>We do not collect, store, or sell the contents of Premium API responses on a per-user basis beyond the short-lived in-memory cache used to amortize upstream calls.</li>
  <li>We do not embed third-party analytics, advertising, or tracking pixels in Premium API responses.</li>
</ul>

<p><strong>Cross-site sharing with TerminalFeed.</strong> Premium credits and bearer tokens are jointly redeemable on tensorfeed.ai and terminalfeed.io under Section 17.8 of the Terms. The TensorFeed payment Worker, also operated by Pizza Robot Studios LLC, is the system of record for credit balances. Wallet addresses, transaction hashes, bearer-token hashes, and per-call telemetry generated on either site are processed by the same operating entity for the unified credit-accounting system. No third-party data processor outside Pizza Robot Studios LLC and our infrastructure providers (currently Cloudflare, Chainalysis sanctions screening, and the Base mainnet network itself) receives this data for the cross-site bundle.</p>

<p><strong>Blockchain analysis and sanctions screening.</strong> The Base mainnet ledger is a public blockchain, and any party, including us, can inspect on-chain transactions involving the published wallet. We screen every inbound credit-purchase transaction against the Chainalysis public sanctions API, which checks the sender wallet against the United States OFAC SDN list and other major sanctions regimes. Where such screening identifies a sanctioned address, an address with material exposure to known illicit activity, or another concern under Section 17.9 of the Terms, we may decline the credit grant and freeze any associated bearer token under Section 17.11 of the Terms. The Chainalysis service receives only the wallet address being screened; it does not receive any personal information that we do not already hold on-chain.</p>

<p><strong>Retention for Premium API data.</strong> Wallet addresses, transaction hashes, bearer-token hashes, per-call telemetry, and related billing records are retained for so long as the associated credit balance remains active and for a further period of seven (7) years thereafter, consistent with general United States tax and financial-record retention guidance and applicable state law. Email correspondence is retained for up to twenty-four (24) months unless a specific ongoing reason justifies longer retention (for example, an unresolved dispute, a pending support matter, or a law-enforcement preservation request). After the applicable retention period elapses, records are deleted or anonymized, except where applicable law requires longer retention.</p>

<p><strong>Your rights for Premium API data.</strong> Because the Premium API is wallet-authenticated rather than identity-authenticated, we cannot, in most cases, link a wallet address back to a specific natural person without information that you provide. To exercise GDPR, UK GDPR, CCPA, CPRA, or analogous rights with respect to Premium API data, you may need to demonstrate control of the wallet address in question, for example by signing a challenge message we provide. Verifiable requests should be sent to <a href="mailto:legal@tensorfeed.ai">legal@tensorfeed.ai</a> and will be handled within the timeframes required by applicable law.</p>
```

**Note on differences from the TerminalFeed version:** the cross-site sharing paragraph names TerminalFeed instead of TensorFeed, the email addresses use the @tensorfeed.ai domain, and the blockchain-analysis paragraph promotes Chainalysis from "may from time to time" to a definite "we screen every inbound credit-purchase transaction" because TensorFeed is the credit-minting system of record and will host the actual screening (see Section 3 below). On TerminalFeed (which proxies to TensorFeed for confirm), the softer "may from time to time" wording is appropriate. After Section 3 of this spec ships, TerminalFeed's privacy policy should be updated to also say "we screen every inbound credit-purchase transaction" because the cross-site bundle means screening is universal.

### 2.3 Commit

```
chore(legal): mirror TerminalFeed Premium API privacy practices (s4B Premium API data, Chainalysis screening disclosure)
```

---

## Section 3. Chainalysis OFAC sanctions screening on /api/payment/confirm

This is the authoritative wallet-level screening gate. It belongs on the TensorFeed payment Worker because TensorFeed is the system of record that decodes the on-chain transaction, identifies the sender wallet, and mints credits. TerminalFeed's worker is a proxy and cannot screen wallets at proxy time.

### 3.1 Sign up for the free Chainalysis sanctions API

1. Visit `https://www.chainalysis.com/free-cryptocurrency-sanctions-screening-tools/`
2. Fill out the form. Approval is typically same-day or next business day.
3. You will receive a free API key by email. The endpoint is `https://public.chainalysis.com/api/v1/address/{address}`. Auth is `X-API-Key: <your_key>`. The free tier covers OFAC SDN screening in perpetuity. There is no charge.

### 3.2 Add the API key as a Cloudflare Worker secret

Per the Pizza Robot Studios global API-key rule (no hardcoded fallbacks), store the key as a Worker secret:

```
cd <tensorfeed-payment-worker-directory>
npx wrangler secret put CHAINALYSIS_API_KEY
# paste the key when prompted
```

### 3.3 Add the screening helper

Add this near the top of the TensorFeed payment Worker, alongside other helper functions. Adapt to the existing module structure (TensorFeed may use ES module exports, named handlers, etc.):

```javascript
// Chainalysis public sanctions API. Free for OFAC SDN screening.
// Returns { sanctioned: boolean, identifications: [...] | null, error: string | null }.
// On API error we fail OPEN by default for availability, but log and alert.
// Switch FAIL_CLOSED = true if regulator pressure or audit finding ever
// requires it; the tradeoff is that a Chainalysis outage will block all
// confirms.
async function screenWalletOFAC(walletAddress, env) {
  if (!walletAddress || typeof walletAddress !== 'string') {
    return { sanctioned: false, identifications: null, error: 'invalid_address' };
  }
  if (!env || !env.CHAINALYSIS_API_KEY) {
    // Misconfiguration. Fail closed in this case: refuse to mint credits if
    // the screening service is not configured at all.
    return { sanctioned: true, identifications: null, error: 'screening_not_configured' };
  }
  var url = 'https://public.chainalysis.com/api/v1/address/' + encodeURIComponent(walletAddress);
  try {
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, 8000);
    var res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': env.CHAINALYSIS_API_KEY,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      // 404 from Chainalysis means address is not in their sanctions database,
      // i.e. clean. Treat as not sanctioned. Other non-2xx errors are real
      // upstream problems; fail open with logging.
      if (res.status === 404) {
        return { sanctioned: false, identifications: [], error: null };
      }
      return { sanctioned: false, identifications: null, error: 'chainalysis_status_' + res.status };
    }
    var data = await res.json();
    var ids = (data && Array.isArray(data.identifications)) ? data.identifications : [];
    return { sanctioned: ids.length > 0, identifications: ids, error: null };
  } catch (e) {
    return { sanctioned: false, identifications: null, error: 'chainalysis_unreachable' };
  }
}
```

### 3.4 Wire screening into /api/payment/confirm

Find the existing confirm handler. The flow today is roughly:

1. Parse `{tx_hash, nonce}` from request body
2. Verify the on-chain transaction (RPC call to Base)
3. Extract sender wallet address from the tx
4. Verify amount matches the quoted credit pack
5. Mint credits, issue bearer token, store in KV/D1

Insert the OFAC screening gate AFTER step 3 (sender wallet known) and BEFORE step 5 (credits minted). Do not skip steps 1 or 2 just because screening is added; replay protection and amount verification still matter.

```javascript
// AFTER on-chain tx verification, BEFORE credit minting:
var screen = await screenWalletOFAC(senderWalletAddress, env);

if (screen.sanctioned) {
  // Log for audit. Do not return identifications array to the client; just
  // refuse the confirm and reference the legal terms.
  console.log(JSON.stringify({
    event: 'ofac_block',
    wallet: senderWalletAddress,
    tx_hash: txHash,
    identifications: screen.identifications,
    timestamp: new Date().toISOString(),
  }));
  // Optional: persist to a KV namespace for long-term audit retention.
  if (env.OFAC_AUDIT_LOG) {
    var auditKey = 'ofac:' + new Date().toISOString().slice(0, 10) + ':' + senderWalletAddress.toLowerCase();
    try {
      await env.OFAC_AUDIT_LOG.put(auditKey, JSON.stringify({
        wallet: senderWalletAddress,
        tx_hash: txHash,
        identifications: screen.identifications,
        screened_at: new Date().toISOString(),
      }), { expirationTtl: 86400 * 365 * 7 }); // 7 years per privacy policy retention
    } catch (e) { /* non-fatal */ }
  }
  return jsonResponse({
    error: 'sanctions_block',
    message: 'This wallet address cannot be credited due to applicable sanctions law. No credits will be issued. The original USDC transfer is on-chain and irreversible. See https://tensorfeed.ai/terms#premium Section 17.9 and 17.11.',
    reference: 'https://tensorfeed.ai/terms#premium',
  }, 403);
}

if (screen.error === 'screening_not_configured') {
  // Misconfiguration on our side. Fail closed.
  return jsonResponse({
    error: 'screening_unavailable',
    message: 'Sanctions screening is currently unavailable. Please retry shortly.',
  }, 503);
}

// screen.error === 'chainalysis_unreachable' or non-404 status: we fail OPEN
// for availability, but the event is logged above. Continue to credit minting.
if (screen.error) {
  console.log(JSON.stringify({
    event: 'ofac_screen_degraded',
    wallet: senderWalletAddress,
    error: screen.error,
    decision: 'fail_open_continue',
    timestamp: new Date().toISOString(),
  }));
}

// ... continue to existing credit minting logic
```

### 3.5 Optional: create OFAC_AUDIT_LOG KV namespace

If TensorFeed wants persistent OFAC block records (recommended for compliance audit trail, retention 7 years per the new privacy policy):

```
npx wrangler kv:namespace create OFAC_AUDIT_LOG
# add the binding to wrangler.toml
```

If you choose not to, the `console.log` JSON line still produces a Cloudflare Workers log entry with default retention (typically 3 days). That is shorter than the 7-year statement in the privacy policy, so KV is recommended.

### 3.6 Test plan

1. **Clean wallet.** Send a buy-credits flow from a known clean wallet. Confirm should succeed and mint credits. Worker log should NOT contain `ofac_block`.
2. **Sanctioned wallet.** Use one of Chainalysis's test fixtures or a known SDN address (Tornado Cash addresses are public and sanctioned). The confirm handler should return 403 with `error: "sanctions_block"`. No credits minted. Bearer token NOT issued. Worker log contains `ofac_block` with the wallet and tx_hash.
3. **Chainalysis unreachable.** Temporarily set `CHAINALYSIS_API_KEY` to an invalid value. Confirm should still succeed (fail open) but worker log contains `ofac_screen_degraded`.
4. **Chainalysis not configured.** Unset the secret entirely. Confirm should return 503 (fail closed for misconfiguration).

### 3.7 Commit

```
feat(payment): OFAC sanctions screening at /api/payment/confirm via Chainalysis public API
```

---

## Section 4. Geo-IP block on /api/payment/buy-credits

This mirrors what TerminalFeed already shipped. It refuses to even quote a credit purchase to users in comprehensively sanctioned countries. Cloudflare Workers provides `request.cf.country` as ISO 3166-1 alpha-2 with no extra API call.

### 4.1 Add the helper

```javascript
// OFAC comprehensively-sanctioned country list (ISO 3166-1 alpha-2).
// Wallet-level screening on confirm catches the rest. Do not add Russia
// wholesale; only specific occupied regions are comprehensively sanctioned,
// and Cloudflare's country code is the country alone.
var OFAC_BLOCKED_COUNTRIES = ['CU', 'IR', 'KP', 'SY'];

function isOFACBlockedCountry(countryCode) {
  if (!countryCode || typeof countryCode !== 'string') return false;
  return OFAC_BLOCKED_COUNTRIES.indexOf(countryCode.toUpperCase()) !== -1;
}
```

### 4.2 Wire into the buy-credits handler

At the top of the existing /api/payment/buy-credits handler, before any business logic:

```javascript
var country = request.cf && request.cf.country;
if (isOFACBlockedCountry(country)) {
  return jsonResponse({
    error: 'jurisdiction_blocked',
    message: 'TensorFeed cannot accept Premium API credit purchases from this jurisdiction due to applicable sanctions law.',
    country: country,
    reference: 'https://tensorfeed.ai/terms#premium',
  }, 403);
}
```

### 4.3 Test plan

1. Use a VPN or curl with a Cloudflare-aware IP from a non-blocked country: `POST /api/payment/buy-credits` should succeed.
2. From a blocked country (test with Cloudflare's `cf-ipcountry` override in Workers Playground): should return 403 with `error: "jurisdiction_blocked"`.

### 4.4 Commit

```
feat(payment): geo-IP block on /api/payment/buy-credits for comprehensively sanctioned jurisdictions
```

---

## Execution Order

Execute each section as a separate commit, in order:

1. Section 1: Terms mirror.
2. Section 2: Privacy mirror.
3. Section 4: Geo-IP block (small, low-risk, ship before Section 3).
4. Section 3: Chainalysis screening (largest change, needs API key provisioned first).

Each section is independently revertable if anything regresses.

---

## Verification Checklist

After all four commits land:

- [ ] tensorfeed.ai/terms shows "Last updated: April 28, 2026" and contains §17.9 through §17.15.
- [ ] tensorfeed.ai/terms §15 says "Governing Law and Venue" with California / LA County wording.
- [ ] tensorfeed.ai/privacy shows "Last updated: April 28, 2026" and contains §4B Premium API Tier.
- [ ] `curl -X POST https://tensorfeed.ai/api/payment/buy-credits` from a clean country returns the existing quote response. Headers include CORS as before.
- [ ] Same call simulated from `cf-ipcountry: IR` returns 403 `jurisdiction_blocked`.
- [ ] A confirm with a clean wallet mints credits and returns a bearer token as before.
- [ ] A confirm with a known-sanctioned wallet (e.g., Tornado Cash address) returns 403 `sanctions_block` and produces an `ofac_block` log entry.
- [ ] `CHAINALYSIS_API_KEY` Worker secret is set; `OFAC_AUDIT_LOG` KV namespace is bound (if used).
- [ ] No em dashes (—) or double hyphens (--) anywhere in the new HTML or markdown copy. Per global rule.

---

## What this spec does NOT cover

- **Russia, Belarus, or other sectoral-sanctions countries.** Comprehensive sanctions are limited to Cuba, Iran, North Korea, Syria, and specific occupied Ukrainian regions. Russia as a whole is sectorally sanctioned, not comprehensively. Adding Russia to the geo-block list is a business decision (many US firms do post-2022) but not strictly OFAC-required. Out of scope here.
- **Paid Chainalysis tiers (KYT, Reactor) or TRM Labs.** Those add transaction-flow risk scoring (mixers, hacks, ransomware exposure) rather than just direct SDN hits. Worth revisiting if Premium API ever clears a meaningful volume threshold (e.g., $50K USDC/month inbound).
- **AML transaction reporting (SAR, CTR).** Pizza Robot Studios LLC is not a financial institution under FinCEN guidance and is not required to file SARs for selling its own SaaS. If volume or user base ever changes that posture, get a real lawyer.
- **KYC.** Out of scope by design. The Premium API is wallet-authenticated and intentionally identity-free. Adding KYC would change the product. Do not add KYC absent specific regulator pressure or counsel advice.
- **Updating cross-site references on TerminalFeed.** TerminalFeed's privacy policy currently says we "may from time to time" perform sanctions screening. Once Section 3 of this spec ships and screening is universal across the cross-site bundle, file a follow-up issue on TerminalFeed to bump that wording to match.
- **Webhooks, alerts, or human notification on OFAC blocks.** Just `console.log` and KV for audit. Add Slack/email alerts later if/when there's real alerting infrastructure.

---

## Note to CC executing this spec on tensorfeed

You are operating in a different repo from TerminalFeed but for the same operating entity (Pizza Robot Studios LLC). This spec was generated in the TerminalFeed repo as part of the April 28, 2026 legal hardening pass.

Before executing, re-read the **infrastructure protection rules** from your own project's CLAUDE.md if present. Critical reminders that apply across both sites:

- NEVER add `@cloudflare/vite-plugin` to a Pages project, NEVER let a wrangler config at the root hijack the Pages domain, and NEVER let a non-CC tool edit critical config files. (See terminalfeed CLAUDE.md "Infrastructure Protection Rules" for the underlying incident, April 15, 2026.)
- Worker first, frontend second. If you are adding the OFAC screening to TensorFeed's payment Worker, deploy the Worker change BEFORE updating any frontend that depends on the new error codes.
- One change at a time. Each numbered section in this spec is its own commit.
- Test with REAL data before deploying. Use a Tornado Cash address (publicly known, on the SDN list) as your sanctioned-wallet test fixture, not a synthetic mock.
- No em dashes or double hyphens in any text you write. Pizza Robot Studios global rule.
- API keys never hardcoded. `CHAINALYSIS_API_KEY` goes through `wrangler secret put`, not into source.

Ship Section 4 first (smallest, lowest-risk), then Section 1 and Section 2 (legal text, no behavior change), then Section 3 (the substantive Worker change). Run the verification checklist before declaring done.

When this spec is fully shipped, move it to `cc-specs-archive/` per the standard lifecycle. Do not delete.
