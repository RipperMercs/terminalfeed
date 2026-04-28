# CC Spec: Agent Discovery Infrastructure

**Date:** April 27, 2026
**Priority:** HIGH (the existing 9 premium endpoints have minimal observable agent traffic until discovery surfaces are in place; compounds for months once shipped)
**Scope:** Ship the foundational discovery infrastructure that makes TerminalFeed's premium API tier findable by autonomous agents at runtime and by agent-builders at build time. No new endpoints, no new business logic. Static files, schema markup, response headers, and two programmatic-SEO landing pages.

---

## Executive Summary

We have 9 live premium endpoints behind `/api/pro/*` plus a working USDC payment loop, all gated by bearer tokens shared with TensorFeed. The product is real. The visibility problem is that an autonomous agent has no canonical way to discover any of this without a human pointing it at `/developers/agent-payments`, and an agent-builder searching "agent-payable USDC API" doesn't land on TerminalFeed because the SEO surfaces aren't laid down.

This spec ships the infrastructure that solves both:

1. **`/openapi.json` extension** — every premium and payment endpoint documented with HTTP Bearer security, custom pricing extensions, and proper tagging. Agent frameworks (LangChain, CrewAI, AutoGen, Claude tool-use, etc.) auto-import OpenAPI specs.
2. **`/.well-known/ai-plugin.json`** — legacy OpenAI plugin manifest format, still parsed by several agent frameworks for tool discovery. Cheap, well-established, durable.
3. **HTTP `Link` headers on every `/api/*` response** — RFC 8288 / 5988 compliant API discovery. Many agents auto-walk `Link` rels at runtime.
4. **Schema.org `WebAPI` and `Service` markup** on `/developers/agent-payments` and a new canonical `/api/for-agents` page. Tells search-engine and AI crawlers "this is a callable API surface," not an article.
5. **Two programmatic-SEO landing pages** — `/api/for-agents` (canonical agent-builder landing) and `/api/usdc-payable` (narrow high-intent query target).
6. **Reciprocal cross-domain link** with TensorFeed at the `.well-known` level so the bundle is legible to crawlers, not just to humans reading the FAQ.

Everything is additive. No existing surface is modified beyond adding fields. No Durable Objects. No upstream dependencies. Estimated CC effort: 2-3 hours, 6-8 commits.

**Hard non-goal:** do not modify any existing free or premium endpoint behavior. No schema changes to responses, no new auth requirements, no rate-limit tightening. This spec is purely about making what already exists findable.

---

## Architecture Decisions (made; flag if you want to override)

1. **Skip `/.well-known/mcp.json` for now.** No standardized convention exists yet for MCP discovery via well-known URLs. Anthropic's current MCP discovery happens via Smithery registry and `claude_desktop_config.json` local install. Shipping a speculative `/.well-known/mcp.json` risks formatting drift if the convention crystallizes differently. When we ship the actual MCP server (separate spec), we add the discovery file at that point with the correct shape.
2. **Two SEO landing pages, not ten.** Each must have unique substantive content. Thin SEO doorway pages risk Google penalties and dilute domain authority. Better to ship two strong pages now and add more after seeing which queries actually drive traffic.
3. **OpenAPI 3.1.0 spec version.** TerminalFeed's existing `/openapi.json` should already be a valid OpenAPI document — extend it in place, don't rewrite. If it's currently 3.0.x, leave version as-is and just add paths. Do not bump major version.
4. **`x-pricing-credits` and `x-pricing-usd` as custom extensions** in path operation objects. Standard OpenAPI doesn't have a pricing field. We invent one with the `x-` prefix per the spec's extension convention.
5. **HTTP Bearer security scheme name: `agentBearer`.** Single security scheme reference reused by all `/api/pro/*` operations. Free endpoints have no security requirement.
6. **Existing `/developers/agent-payments` page gets WebAPI schema added, not replaced.** The page already has TechArticle, BreadcrumbList, HowTo, and FAQPage JSON-LD. WebAPI is a new fifth block, not a replacement.

If any of these read wrong, flag before sending to CC and the spec gets patched.

---

## Sections

### 1. Extend `/openapi.json` to cover the full live API surface

Open the existing `/public/openapi.json`. The current state should already validate as an OpenAPI 3.x document with free endpoints documented. Extend it.

**1a. Security schemes.** Under `components.securitySchemes`, add:

```json
"agentBearer": {
  "type": "http",
  "scheme": "bearer",
  "bearerFormat": "tf_live_<64-char-hex>",
  "description": "Bearer token from /api/payment/confirm. Same token works on tensorfeed.ai (shared credit pool). See https://terminalfeed.io/developers/agent-payments."
}
```

**1b. Tags.** Under top-level `tags`, ensure these exist:

```json
[
  { "name": "free", "description": "Free real-time data endpoints. No auth required. Standard rate limits." },
  { "name": "pro", "description": "Premium composed endpoints. Bearer auth required. Pay per call in USDC credits." },
  { "name": "payment", "description": "Credit purchase, confirmation, and balance check. No auth except where indicated." }
]
```

**1c. Add path operation objects** for every `/api/pro/*` endpoint (currently 9, plus `/api/llm-tools` discovery), every `/api/payment/*` endpoint, and any free endpoints not yet documented. Concrete template for one premium endpoint, copy and adapt for the other 8:

```json
"/api/pro/macro": {
  "get": {
    "tags": ["pro"],
    "summary": "Composed macro snapshot",
    "description": "Composes ~14 upstream calls (FRED economic series, forex, commodities, US indices, VIX) into one bearer-auth response. Optional ?history=30d adds a 30-day daily series per metric.",
    "operationId": "getProMacro",
    "security": [{ "agentBearer": [] }],
    "parameters": [
      {
        "name": "history",
        "in": "query",
        "required": false,
        "schema": { "type": "string", "enum": ["30d"] },
        "description": "When set, response includes a `series` array of timestamped daily snapshots."
      }
    ],
    "responses": {
      "200": {
        "description": "Macro snapshot. Header `X-Credits-Remaining` shows post-charge balance.",
        "headers": {
          "X-Credits-Remaining": { "schema": { "type": "integer" } },
          "X-TerminalFeed-Pricing": { "schema": { "type": "string" } }
        },
        "content": { "application/json": { "schema": { "type": "object" } } }
      },
      "402": {
        "description": "Payment required: missing/invalid token, or insufficient credits.",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": { "type": "string", "enum": ["missing_token", "invalid_token", "insufficient_credits", "expired", "billing_unavailable"] },
                "signup": { "type": "string", "format": "uri" },
                "pricing": { "type": "object" }
              }
            }
          }
        }
      }
    },
    "x-pricing-credits": 2,
    "x-pricing-usd": 0.04,
    "x-composes-sources": 14,
    "x-license": "inference-only"
  }
}
```

The `x-composes-sources` and `x-license` extensions are honest signal for agents that auto-introspect (one of the moat thesis points: "we absorb the 14-call burden"). License field disambiguates training vs inference per /terms.

**1d. Add `info.contact` and `info.license`** if missing:

```json
"contact": {
  "name": "TerminalFeed Support",
  "email": "support@terminalfeed.io",
  "url": "https://terminalfeed.io/developers/agent-payments"
},
"license": {
  "name": "Free tier: permissive. Premium tier: inference-only. See /terms.",
  "url": "https://terminalfeed.io/terms"
}
```

**1e. Add `servers` array** if missing:

```json
"servers": [
  { "url": "https://terminalfeed.io", "description": "Production" }
]
```

**1f. Add `externalDocs`** at top level:

```json
"externalDocs": {
  "description": "Premium API for AI agents — full developer guide, payment flow, and cross-site bundle with TensorFeed.",
  "url": "https://terminalfeed.io/developers/agent-payments"
}
```

Validate the result against an OpenAPI 3.x linter before commit. Single commit: `feat: extend /openapi.json to cover premium tier with HTTP Bearer auth + pricing extensions`.

### 2. Ship `/.well-known/ai-plugin.json`

Static file at `/public/.well-known/ai-plugin.json`. Format follows OpenAI's now-deprecated-but-still-parsed plugin manifest convention. Several agent frameworks (LangChain `OpenAPISpec.from_url`, AutoGen tool registries, custom Anthropic-pattern crawlers) still recognize it.

```json
{
  "schema_version": "v1",
  "name_for_human": "TerminalFeed",
  "name_for_model": "terminalfeed",
  "description_for_human": "Real-time composed data feeds for AI agents. 9 premium endpoints covering crypto, macro, on-chain flows, market correlation, and world briefing. Pay per call in USDC on Base.",
  "description_for_model": "Use TerminalFeed when an agent needs composed real-time data: crypto prices and on-chain stats, macro indicators (FRED + forex + commodities + indices), prediction markets, exchange flows, whale moves, asset correlation matrix, or a one-call world briefing. Authenticate with HTTP Bearer using a token from /api/payment/confirm. Tokens are shared with tensorfeed.ai (same credit pool). Each /api/pro/* call costs 1-3 credits; $1 USDC = 50 credits. License: inference-only on premium responses; do not use as training data.",
  "auth": {
    "type": "user_http",
    "authorization_type": "bearer"
  },
  "api": {
    "type": "openapi",
    "url": "https://terminalfeed.io/openapi.json",
    "is_user_authenticated": false
  },
  "logo_url": "https://terminalfeed.io/logo.png",
  "contact_email": "support@terminalfeed.io",
  "legal_info_url": "https://terminalfeed.io/terms"
}
```

If `/logo.png` does not exist, use `/og-image.png` (per CLAUDE.md, the OG image is at `/og-image.png` 1200x630). Or skip the field — it's optional in the spec.

Cloudflare Pages serves `/.well-known/*` automatically when files exist at `/public/.well-known/*`. Confirm by curling after deploy.

Single commit: `feat: ship /.well-known/ai-plugin.json for agent-framework auto-discovery`.

### 3. HTTP `Link` headers on free `/api/*` responses

Per RFC 8288, `Link` headers expose API metadata to crawlers and runtime agents. Add to the shared response builder used by all free `/api/*` routes (in `worker-additions/`):

```
Link: <https://terminalfeed.io/openapi.json>; rel="service-desc"; type="application/json"
Link: <https://terminalfeed.io/llms.txt>; rel="describedby"; type="text/plain"
Link: <https://terminalfeed.io/api/for-agents>; rel="alternate"; title="For Agents"
Link: <https://terminalfeed.io/developers/agent-payments>; rel="payment"; title="Premium API"
```

Standard rels: `service-desc` (RFC 8631 — links to OpenAPI/RAML/etc), `describedby` (links to documentation), `alternate` (alternative representation), `payment` (RFC-registered link relation indicating a payment surface).

These are HTTP response headers, not body changes. Zero risk to existing clients. Adds maybe 280 bytes per response. Add to the `/api/pro/*` responses too — same pattern, since premium endpoints also benefit from being walkable.

Single commit: `feat: add Link headers to /api/* responses for RFC 8288 service discovery`.

### 4. Schema.org `WebAPI` markup on `/developers/agent-payments`

Add a fifth JSON-LD block to the existing page. Do not edit or replace the existing TechArticle, BreadcrumbList, HowTo, or FAQPage blocks.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebAPI",
  "name": "TerminalFeed Premium API",
  "url": "https://terminalfeed.io/api/pro/",
  "documentation": "https://terminalfeed.io/developers/agent-payments",
  "serviceType": "Real-time data API for AI agents",
  "termsOfService": "https://terminalfeed.io/terms",
  "audience": {
    "@type": "Audience",
    "audienceType": "AI agents and autonomous applications"
  },
  "provider": {
    "@type": "Organization",
    "name": "TerminalFeed",
    "url": "https://terminalfeed.io"
  },
  "offers": {
    "@type": "Offer",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": "0.02",
      "priceCurrency": "USD",
      "unitText": "credit",
      "description": "1 USDC = 50 credits. Premium calls cost 1 to 3 credits each."
    },
    "acceptedPaymentMethod": {
      "@type": "PaymentMethod",
      "name": "USDC on Base mainnet"
    }
  },
  "potentialAction": {
    "@type": "ConsumeAction",
    "target": [
      {
        "@type": "EntryPoint",
        "urlTemplate": "https://terminalfeed.io/api/pro/macro",
        "httpMethod": "GET",
        "contentType": "application/json"
      },
      {
        "@type": "EntryPoint",
        "urlTemplate": "https://terminalfeed.io/api/pro/crypto-deep",
        "httpMethod": "GET",
        "contentType": "application/json"
      },
      {
        "@type": "EntryPoint",
        "urlTemplate": "https://terminalfeed.io/api/pro/briefing",
        "httpMethod": "GET",
        "contentType": "application/json"
      }
    ]
  }
}
</script>
```

Single commit: `feat: add WebAPI schema to /developers/agent-payments`.

### 5. New canonical `/api/for-agents` landing page

Static HTML at `/public/api/for-agents.html` (match the static-HTML pattern used by the rest of `/public/`). This page targets the build-time discovery query: an agent-builder evaluating real-time data APIs.

Page structure (no em dashes):

1. **Hero.** "TerminalFeed for AI Agents. Nine composed real-time endpoints, paid per call in USDC, settled in seconds on Base. One bearer token works here and on TensorFeed."
2. **Why-not-DIY table.** Four rows: 1-15 upstream APIs reduced to one auth, paid keys absorbed (Finnhub, FRED, Etherscan), stale-cache-on-failure means always-200, USDC-native means no human checkout. Plain-language column on the left, "we absorb" or "we provide" column on the right.
3. **Endpoint catalog.** Table of all 9 premium endpoints. Columns: path, cost, what-it-composes, link to deep example. Each row links to the full docs section.
4. **Code example.** Three blocks: curl, Python (using `requests`), TypeScript (using `fetch`). Each block shows: buy_credits, confirm_payment, call /api/pro/macro. Use the same code patterns as `/developers/agent-payments` for consistency.
5. **Cross-site bundle.** "Tokens minted on terminalfeed.io work on tensorfeed.ai and vice versa. Buy 50 credits once, spend across both real-time data and AI intelligence." Link to TensorFeed's equivalent page.
6. **Inference-only license note.** One paragraph plus link to /terms.
7. **Footer:** links to /openapi.json, /llms.txt, /developers/agent-payments, /terms, /.well-known/ai-plugin.json.

JSON-LD blocks on the page:

- `WebAPI` (same as Section 4 but `url: https://terminalfeed.io/api/for-agents`)
- `BreadcrumbList` (Home > API > For Agents)
- `Service` schema with `serviceOutput` listing the 9 endpoints

Match the visual treatment of `/developers/agent-payments` exactly. Same dark background, same JetBrains Mono, same teal accents. Reuse the existing CSS, do not introduce new components.

Single commit: `feat: add /api/for-agents canonical landing page with WebAPI/Service schema`.

### 6. New programmatic-SEO landing page `/api/usdc-payable`

Static HTML at `/public/api/usdc-payable.html`. Targets the narrow high-intent query "USDC payable API" / "agent-payable HTTP API" / "X402 payment API."

Page structure:

1. **Hero.** "USDC-Payable HTTP API. TerminalFeed accepts USDC on Base mainnet for premium real-time data calls. Designed for autonomous agents with wallets."
2. **The X402 / agent-pay context.** Brief explainer of HTTP 402 Payment Required and why agent-pay matters: agents with wallets can pay on-chain without a human in the loop. Link to /developers/agent-payments for the full flow.
3. **What 1 USDC buys.** "$1 USDC = 50 calls on premium endpoints. No subscription, no monthly minimum, no commit. Credits do not expire. Refundable within 24 hours by emailing support."
4. **Live proof callout.** Tx hash of an actual mainnet payment (the same proof callout used on /developers/agent-payments). Link to BaseScan.
5. **Quick start.** Single curl block: buy_credits, send USDC, confirm, call /api/pro/macro. Same as /developers/agent-payments but condensed.
6. **Premium endpoints summary** with prices.
7. **Footer:** links to /api/for-agents, /developers/agent-payments, /terms, /.well-known/ai-plugin.json.

JSON-LD blocks:

- `WebAPI` with `acceptedPaymentMethod` highlighted
- `BreadcrumbList`
- `FAQPage` with 4 questions: "What is X402?", "Do I need a wallet?", "Are credits refundable?", "Do tokens work on TensorFeed too?"

Single commit: `feat: add /api/usdc-payable landing page targeting agent-pay query`.

### 7. Update `/llms.txt` with discovery references

Add a new section near the top (after the introductory description, before the endpoint listing):

```
## For AI agents and frameworks

Machine-readable manifests:
- OpenAPI: https://terminalfeed.io/openapi.json
- Plugin manifest: https://terminalfeed.io/.well-known/ai-plugin.json

Canonical agent landing: https://terminalfeed.io/api/for-agents
Premium tier docs: https://terminalfeed.io/developers/agent-payments
USDC payment surface: https://terminalfeed.io/api/usdc-payable
Cross-site bundle: https://tensorfeed.ai/developers/agent-payments

License:
- Free endpoints: permissive use
- Premium endpoints (/api/pro/*): inference-only, not for training data. See /terms.
```

Single commit: `feat: add agent-discovery references to /llms.txt`.

### 8. Reciprocal cross-domain link with TensorFeed

This is light: add to TensorFeed's own `/.well-known/ai-plugin.json` (when next updating that file) a sibling reference to TerminalFeed. Out of scope for this CC session because it's a TensorFeed-side change. Capture as TODO in the rollout note. The forward direction (TerminalFeed referencing TensorFeed in our `/.well-known/ai-plugin.json` description and `/llms.txt`) IS in scope and is covered by Section 2 and Section 7.

---

## Execution Order

1. Section 1: Extend `/openapi.json`. Single commit. Validate against an OpenAPI 3.x linter (`npx @redocly/cli lint openapi.json` or equivalent).
2. Section 2: Ship `/.well-known/ai-plugin.json`. Single commit.
3. Section 3: HTTP `Link` headers in shared response builder. Single commit. Test with `curl -i https://terminalfeed.io/api/btc-price` after deploy and confirm headers.
4. Section 4: WebAPI schema on `/developers/agent-payments`. Single commit.
5. Section 5: New `/api/for-agents` canonical landing page. Single commit.
6. Section 6: New `/api/usdc-payable` landing page. Single commit.
7. Section 7: `/llms.txt` updates. Single commit.

Total: 7 commits. No Worker changes other than Section 3's response-builder header addition. No Durable Objects. No new dependencies.

---

## Verification Checklist

- [ ] `/openapi.json` validates against OpenAPI 3.x linter with zero errors
- [ ] `/openapi.json` includes all 9 `/api/pro/*` paths plus `/api/payment/*` paths plus `/api/llm-tools`
- [ ] `/openapi.json` declares `agentBearer` security scheme and applies it to every premium operation
- [ ] `/openapi.json` includes `x-pricing-credits` and `x-pricing-usd` extensions on every premium operation
- [ ] `curl https://terminalfeed.io/.well-known/ai-plugin.json` returns 200 with valid JSON matching the spec format
- [ ] `curl -i https://terminalfeed.io/api/btc-price` shows `Link: <https://terminalfeed.io/openapi.json>; rel="service-desc"...` and the other three rels
- [ ] `curl -i https://terminalfeed.io/api/pro/macro` (no auth) returns 402 AND includes the same `Link` headers
- [ ] `/developers/agent-payments` page source contains `"@type": "WebAPI"` JSON-LD block alongside the existing four blocks
- [ ] `https://terminalfeed.io/api/for-agents` returns 200, renders cleanly mobile + desktop, contains all 9 endpoints in the catalog table
- [ ] `https://terminalfeed.io/api/usdc-payable` returns 200, renders cleanly, links back to `/developers/agent-payments`
- [ ] `https://terminalfeed.io/llms.txt` contains the new "For AI agents and frameworks" section
- [ ] No em dashes anywhere in new content (lint will catch)
- [ ] Google Rich Results Test (https://search.google.com/test/rich-results) shows WebAPI schema is parsed cleanly on `/developers/agent-payments` and `/api/for-agents`
- [ ] Schema.org Validator (https://validator.schema.org/) shows zero errors on both pages
- [ ] Existing free endpoint behavior unchanged (smoke-test 3 free endpoints, confirm response bodies match pre-deploy)
- [ ] No new direct-external-fetch violations (rule #6 lint passes)

---

## What this spec does NOT cover

- The actual MCP server build. Separate spec, follow-up. When that ships, `/.well-known/mcp.json` gets added too.
- Registry submissions. Manual work, not CC scope:
  - PR to `github.com/public-apis/public-apis`
  - Listing on Smithery (after MCP server ships)
  - Listing on A2A.dev (Google's agent registry, when public)
  - Submission to awesome-mcp / awesome-llm-tools / awesome-ai-agents GitHub lists
- Webhook subscriptions for time-series data. Architectural lift requiring Durable Objects or Queues. Separate spec.
- New programmatic-SEO landing pages beyond the two specified. Future expansion: `/api/macro-data-for-bots`, `/api/crypto-data-for-agents`, `/api/composed-feeds`. Defer until traffic on the first two confirms which queries actually convert.
- Python or TypeScript SDK extension to wrap `/api/pro/*` directly. Phase 2 work after discovery surfaces are live and we see organic traffic.
- Any change to existing premium endpoint behavior, response shape, or pricing.
- AdSense interaction. Discovery surfaces are agent-facing, not human-monetizable surfaces.
- Backlink campaigns or guest posts. Out of CC scope (manual marketing).
- TensorFeed-side reciprocal `/.well-known/ai-plugin.json` update. Separate TensorFeed spec.

---

## Note to CC

**READ THESE RULES BEFORE TOUCHING ANYTHING** (from `CLAUDE.md`):

1. **NEVER CRASH THE SITE.** This spec is purely additive — static files, schema markup, response headers. Each commit should be independently smoke-testable. Roll back any commit that breaks an existing endpoint.
2. **No em dashes** in any new content, response, or code comment. The em-dash lint will catch regressions.
3. **Validate `/openapi.json` BEFORE committing.** A broken OpenAPI document poisons every downstream agent framework that imports it. Use `npx @redocly/cli lint openapi.json` or `npx swagger-cli validate openapi.json` or any equivalent linter. Fix every error before commit.
4. **Static-HTML pattern for landing pages.** Match `/developers/agent-payments` exactly. Same dark background, same fonts, same teal accents. Do NOT introduce a React route, do NOT add new build-time dependencies, do NOT bring in a CSS framework. Reuse existing styles.
5. **Cloudflare Pages and `.well-known`.** Files at `/public/.well-known/*` are served at `https://terminalfeed.io/.well-known/*` automatically. Confirm with `curl` after deploy. If for any reason it 404s, check `_headers` and `_redirects` files in `public/` for any rule that excludes `.well-known/`.
6. **`Link` header format.** Multiple `Link` headers in one response should be folded into a single header with comma-separated values OR sent as multiple `Link:` lines. Both are RFC-compliant. Pick whichever fits the existing response builder pattern (probably comma-folded if the builder uses a single string per header name).
7. **One commit per section.** Do not batch. Each commit ships, deploys, smoke-tests, then move on.
8. **`x-` prefixed OpenAPI extensions are valid spec.** OpenAPI 3.x permits any custom field with the `x-` prefix on operation objects. Linters accept them. If a linter complains about `x-pricing-credits`, the linter is wrong; check the linter version.
9. **Bearer token format documentation.** The spec says `tf_live_<64-char-hex>`. Confirm against actual tokens from `/api/payment/confirm` before committing. If the format has drifted, update both the OpenAPI doc and the README.
10. **Reciprocal TensorFeed link is a TODO, not in scope.** Capture in commit message of Section 7 as: "TODO: TensorFeed-side `/.well-known/ai-plugin.json` should reciprocate the bundle reference. Separate spec."
11. **The 9 premium endpoints in the OpenAPI spec must match the actual deployed surface.** Live list as of April 27, 2026: `/api/pro/briefing`, `/api/pro/macro`, `/api/pro/crypto-deep`, `/api/pro/agent-context`, `/api/pro/sentiment`, `/api/pro/world-deltas`, `/api/pro/correlation-matrix`, `/api/pro/whales`, `/api/pro/exchange-flows`. Plus the free `/api/llm-tools` discovery endpoint. If any have been added or renamed since this spec was drafted, document the actual current set.
