# TerminalFeed.io

Free real-time data dashboard, developer tools, and editorial publication. 30+ live feeds, dark terminal aesthetic. Built by Ripper. Deployed on Cloudflare Pages, with a single Worker handling all `/api/*` routes plus an X bot.

- Site: https://terminalfeed.io
- Free API: https://terminalfeed.io/developers
- Premium API: https://terminalfeed.io/developers/agent-payments

## Agent Fair-Trade Agreement (AFTA)

TerminalFeed is the second adopter of the [Agent Fair-Trade Agreement](https://terminalfeed.io/agent-fair-trade), an open standard for API publishers that are fair to AI agents. Three pillars:

1. **Code-enforced no-charge guarantees**: 5xx, billing breaker, schema validation failure, and stale data never charge a credit. The deferred-debit logic lives in `worker-additions/worker.js` (`aftaPremiumResponse`); events are logged to a public ledger at `/api/payment/no-charge-stats`.
2. **Ed25519-signed receipts** on every premium response. The public key is at [/.well-known/terminalfeed-receipt-key.json](https://terminalfeed.io/.well-known/terminalfeed-receipt-key.json). Verify offline against canonical JSON, or POST a receipt to `/api/receipt/verify`.
3. **Public on-chain payment rail** (USDC on Base mainnet). Wallet `0x549c82e6bfc54bdae9a2073744cbc2af5d1fc6d1`. Pizza Robot Studios LLC is the legal entity behind the wallet.

**Reciprocal access**: TerminalFeed and TensorFeed share a single bearer-token plus credit ledger. A token minted on either site works on both. Each site signs its own receipts with its own keypair; private keys are never shared. The cross-Worker AFTA rail is `/api/internal/validate` + `/api/internal/commit` on the host of the credit ledger (TensorFeed).

Standard at [/.well-known/agent-fair-trade.json](https://terminalfeed.io/.well-known/agent-fair-trade.json). Schema at [tensorfeed.ai/.well-known/agent-fair-trade-schema.json](https://tensorfeed.ai/.well-known/agent-fair-trade-schema.json).

> **x402 + Stripe Link.** TerminalFeed has been x402-compliant since adopting AFTA. We accept the `exact` scheme with USDC on Base mainnet through the federation with TensorFeed. [Stripe Link](https://link.com/agents) (released April 2026) uses x402 with `method=stripe` for Shared Payment Tokens; supporting that as a parallel path is under evaluation at the federation host (TensorFeed), and when shipped, TerminalFeed will inherit SPT acceptance without needing its own Stripe merchant account. The protocol is the same; we already speak it. Discovery directives are at [/agents.txt](https://terminalfeed.io/agents.txt) per the convention Stripe Link's skill reads.

## Built with Claude

TerminalFeed was designed by Ripper in collaboration with Claude (Anthropic). Specific systems Claude designed: the premium `/api/pro/*` endpoints, the cross-Worker AFTA rail to TensorFeed, the Ed25519 receipt signing pipeline, the per-endpoint freshness SLA registry, the in-memory cache plus stale-cache fallback pattern across 30+ free endpoints, the X bot, and the live world-briefing composer. The git log on this repo shows the build trail.


## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
