// Bazaar pilot registry. Single source of truth for which premium paths route
// through the CDP facilitator (and so get cataloged by CDP Bazaar) and what
// their `extensions.bazaar` payload looks like in the canonical x402 V2
// PaymentRequired object.
//
// CDP validates `info` against `schema` using AJV draft 2020-12. A
// schema/info mismatch silently fails cataloging — the smoke-test in
// scripts/test-bazaar-pilots.mjs compiles each schema with AJV draft 2020-12
// and validates its corresponding info block. That test is load-bearing.
//
// Each pilot must:
//  - Live in STRICT_PREMIUM_PATHS in worker.js (CDP probes anonymously, must
//    see a 402 not the free-trial 200).
//  - Provide a description that says exactly what one paid call returns. CDP
//    ranks endpoints with concrete examples + semantic descriptions higher.
//  - Pick "decision-ready" endpoints, not "feed/list" endpoints.

// Wave 0: TerminalFeed's morning brief. The agent-on-boot call. Highest leverage.
const PILOT_BRIEFING = {
  description: 'Agent morning brief. One paid call composes Bitcoin spot + 24h volume, the Crypto Fear & Greed Index, the latest USGS earthquake summary, top-story counts from Hacker News, current ISS crew, and the highest-volume Polymarket prediction markets. The endpoint an agent calls on boot to get the day\'s context in one network round trip.',
  extension: {
    bazaar: {
      info: {
        input: {
          type: 'http',
          method: 'GET',
          queryParams: {
            include: 'btc,fear-greed,earthquakes,hackernews,humans-in-space,predictions',
            history: '24h',
          },
        },
        output: {
          type: 'json',
          example: {
            source: 'terminalfeed-pro',
            endpoint: '/api/pro/briefing',
            generated_at: '2026-05-14T12:00:00.000Z',
            sections: {
              btc: {
                price_usd: 77407.12,
                change_24h_percent: 1.83,
                volume_24h: 38215000000,
                high_24h: 78240.5,
                low_24h: 76012.4,
              },
              fear_greed: { value: 62, label: 'Greed' },
              earthquakes: {
                count: 14,
                latest: { magnitude: 4.7, place: '65 km SE of some-locality', time: 1747224000000 },
              },
              hackernews: { top_story_count: 500 },
              humans_in_space: { count: 7, names: ['Astronaut A', 'Astronaut B'] },
              predictions: {
                count: 10,
                top: [
                  { question: 'Will event X happen by date Y?', volume_24hr: 412300.5 },
                ],
              },
            },
            series: {
              btc_24h: [
                { ts: 1747137600000, price: 76800.1 },
                { ts: 1747141200000, price: 76950.4 },
              ],
            },
            _meta: {
              generated_at: '2026-05-14T12:00:00.000Z',
              endpoint: '/api/pro/briefing',
              tier: 'premium',
            },
          },
        },
      },
      schema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        required: ['input', 'output'],
        properties: {
          input: {
            type: 'object',
            required: ['type', 'method'],
            properties: {
              type: { const: 'http' },
              method: { const: 'GET' },
              queryParams: { type: 'object' },
            },
          },
          output: {
            type: 'object',
            required: ['type', 'example'],
            properties: {
              type: { const: 'json' },
              example: { type: 'object' },
            },
          },
        },
      },
    },
  },
};

const PILOTS = Object.freeze({
  '/api/pro/briefing': PILOT_BRIEFING,
  // Wave 1 candidates (uncomment when ready):
  // '/api/pro/agent-context': PILOT_AGENT_CONTEXT,
  // '/api/pro/macro': PILOT_MACRO,
  // '/api/pro/correlation-matrix': PILOT_CORRELATION_MATRIX,
});

export function isBazaarPilotPath(path) {
  if (typeof path !== 'string') return false;
  return Object.prototype.hasOwnProperty.call(PILOTS, path);
}

export function getBazaarPilotConfig(path) {
  if (!isBazaarPilotPath(path)) return null;
  return PILOTS[path];
}

export function bazaarExtensionsFor(path) {
  const cfg = getBazaarPilotConfig(path);
  return cfg ? cfg.extension : {};
}

export function bazaarDescriptionFor(path, fallback) {
  const cfg = getBazaarPilotConfig(path);
  return cfg ? cfg.description : fallback;
}

// Exported for the AJV draft 2020-12 validation test.
export function listPilots() {
  return Object.keys(PILOTS).map(function (p) {
    return { path: p, config: PILOTS[p] };
  });
}
