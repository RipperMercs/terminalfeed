// CDP x402 facilitator client. Wraps Coinbase Developer Platform's hosted
// x402 facilitator endpoints so we can route Bazaar pilot settlements through
// the indexable rail.
//
// Status: INERT. This module ships in the repo, has tests, but is not imported
// by worker.js yet. Wiring happens in Section 4 of the parity spec, once the
// CDP_API_KEY_ID + CDP_API_KEY_SECRET secrets are set and the pilot registry
// (Section 3) is in place.
//
// Why a separate module: the CDP key is the most-sensitive secret in the stack
// (read-only-x402 scope, but still tied to a personal Coinbase account). We
// want exactly one surface that can sign a JWT for CDP. The path-constraint
// guard refuses to sign for anything outside /platform/v2/x402, so even if a
// caller passes a mistyped URL we cannot accidentally hit Trading / Wallet /
// Onramp.
//
// First successful settle on a pilot path is what gets it cataloged by Bazaar.
// EXTENSION-RESPONSES: bazaar: processing on the settle response is the signal
// that CDP indexed it; bazaar: rejected means the bazaar extension in our 402
// failed schema validation (AJV draft 2020-12).

import { importJWK, SignJWT } from 'jose';

const CDP_BASE_URL = 'https://api.cdp.coinbase.com/platform/v2/x402';
const ALLOWED_PATH_PREFIX = '/platform/v2/x402';

// Convert the 64-byte CDP Ed25519 secret (32-byte seed + 32-byte public key,
// base64-encoded) into a JWK suitable for jose's importJWK. The CDP key format
// is documented at docs.cdp.coinbase.com/get-started/cdp-api-keys.
async function _cdpSecretToJwk(secretB64) {
  if (typeof secretB64 !== 'string' || secretB64.length === 0) {
    throw new Error('cdp_facilitator: missing api key secret');
  }
  // atob -> Uint8Array (works in Workers without Buffer)
  let bin;
  try {
    bin = atob(secretB64);
  } catch (e) {
    throw new Error('cdp_facilitator: secret is not valid base64');
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (bytes.length !== 64) {
    throw new Error('cdp_facilitator: secret must decode to 64 bytes (32 seed + 32 pub), got ' + bytes.length);
  }
  const seed = bytes.slice(0, 32);
  const pub = bytes.slice(32);
  const jwk = {
    kty: 'OKP',
    crv: 'Ed25519',
    d: _b64url(seed),
    x: _b64url(pub),
  };
  return importJWK(jwk, 'EdDSA');
}

function _b64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function _randomNonce(byteLen) {
  byteLen = byteLen || 16;
  const buf = new Uint8Array(byteLen);
  crypto.getRandomValues(buf);
  let s = '';
  for (let i = 0; i < buf.length; i++) s += buf[i].toString(16).padStart(2, '0');
  return s;
}

// Path-constraint guard. The CDP key MUST be read-only-x402 scope, but defense
// in depth: even if a caller asks us to sign a JWT for /v2/wallets or
// /platform/v2/onramp/..., we refuse. Single chokepoint, easy to test.
export function _assertCdpPathAllowed(pathname) {
  if (typeof pathname !== 'string' || pathname.indexOf(ALLOWED_PATH_PREFIX) !== 0) {
    throw new Error('cdp_facilitator: refusing to sign JWT for path outside ' + ALLOWED_PATH_PREFIX + ' (got: ' + String(pathname) + ')');
  }
}

// Build a CDP-compatible bearer JWT for the specific request. Payload binds
// the JWT to the exact method + host + path via `uris`, so a leaked token
// can only be replayed against the same endpoint within the 120s window.
export async function buildCdpJwt(env, method, fullUrl) {
  const keyId = env && env.CDP_API_KEY_ID;
  const keySecret = env && env.CDP_API_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('cdp_facilitator: CDP_API_KEY_ID and CDP_API_KEY_SECRET must be set');
  }
  const parsed = new URL(fullUrl);
  _assertCdpPathAllowed(parsed.pathname);

  const privateKey = await _cdpSecretToJwk(keySecret);
  const iat = Math.floor(Date.now() / 1000);
  const uri = method.toUpperCase() + ' ' + parsed.host + parsed.pathname;

  return new SignJWT({ sub: keyId, iss: 'cdp', uris: [uri] })
    .setProtectedHeader({ alg: 'EdDSA', kid: keyId, typ: 'JWT', nonce: _randomNonce() })
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .setExpirationTime(iat + 120)
    .sign(privateKey);
}

// POST to the verify endpoint. Mirrors the self-broadcast facilitator's
// interface so the caller can swap on a path-by-path basis.
export async function cdpVerify(env, body, fetchImpl) {
  return _cdpPost(env, 'verify', body, fetchImpl);
}

// POST to the settle endpoint. Captures EXTENSION-RESPONSES header so the
// caller can surface bazaar: processing vs bazaar: rejected to logs.
export async function cdpSettle(env, body, fetchImpl) {
  return _cdpPost(env, 'settle', body, fetchImpl);
}

async function _cdpPost(env, slug, body, fetchImpl) {
  const fetcher = fetchImpl || fetch;
  const url = CDP_BASE_URL + '/' + slug;
  let jwt;
  try {
    jwt = await buildCdpJwt(env, 'POST', url);
  } catch (e) {
    return { ok: false, status: 0, reason: 'jwt_sign_failed', message: e && e.message };
  }

  let res;
  try {
    res = await fetcher(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + jwt,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body || {}),
    });
  } catch (e) {
    return { ok: false, status: 0, reason: 'network_error', message: e && e.message };
  }

  const extensionResponses = res.headers.get('extension-responses') || res.headers.get('EXTENSION-RESPONSES') || '';
  const bazaarState = _parseBazaarState(extensionResponses);
  const bazaarDetail = _parseBazaarDetail(extensionResponses);

  let parsed = null;
  try {
    parsed = await res.json();
  } catch (e) {
    parsed = null;
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      reason: 'cdp_error',
      bazaar: bazaarState,
      bazaar_detail: bazaarDetail,
      extension_responses: extensionResponses,
      body: parsed,
    };
  }
  return {
    ok: true,
    status: res.status,
    bazaar: bazaarState,
    bazaar_detail: bazaarDetail,
    extension_responses: extensionResponses,
    body: parsed,
  };
}

// Pulls the bazaar status out of EXTENSION-RESPONSES. CDP's actual format
// (confirmed 2026-05-14) is base64-encoded JSON:
//   atob(header) -> '{"bazaar":{"status":"rejected","rejectedReason":"..."}}'
// Older / hand-rolled facilitators may emit a plain-text `bazaar: processing`
// form; we try base64-JSON first and fall back to the regex. Returns the
// bazaar status string ('processing' | 'rejected' | ...) or null. The full
// bazaar object (with rejectedReason) is surfaced separately via
// _parseBazaarDetail so callers can log the reason.
function _parseBazaarState(header) {
  const parsed = _parseBazaarDetail(header);
  if (parsed && typeof parsed.status === 'string') return parsed.status.toLowerCase();
  if (!header) return null;
  const m = /bazaar\s*:\s*([a-zA-Z_]+)/i.exec(header);
  if (!m) return null;
  return m[1].toLowerCase();
}

function _parseBazaarDetail(header) {
  if (!header) return null;
  try {
    const decoded = atob(header);
    const parsed = JSON.parse(decoded);
    if (parsed && parsed.bazaar && typeof parsed.bazaar === 'object') return parsed.bazaar;
  } catch (e) { /* not base64-JSON; caller falls back to regex form */ }
  return null;
}
