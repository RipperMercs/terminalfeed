# terminalfeed-py (reference client)

This is a **single-file Python reference client** for the TerminalFeed
Premium API. It is **not yet on PyPI**. Phase 1 of the premium tier is
HTTP-only; this file exists so agents can copy a working client into
their own codebase without waiting for a published SDK.

## Why no PyPI release yet

Bearer tokens minted by TensorFeed already work on TerminalFeed (shared
credit pool). Any agent that has `pip install tensorfeed` and a
`tf_live_<64-char-hex>` token can hit `/api/pro/*` with a plain
`requests.get(..., headers={"Authorization": f"Bearer {token}"})`. Until
real traffic justifies a separate dependency, this reference client is
enough.

When traffic justifies it, the path forward is one of:

1. Extend the existing `tensorfeed` PyPI package with `tf.briefing_pro()`,
   `tf.macro()`, `tf.crypto_deep()` methods that wrap these endpoints.
   Agents already importing `tensorfeed` get TerminalFeed for free.
2. Publish this file as `terminalfeed` on PyPI with a dependency on
   `tensorfeed` for the shared auth primitives.

## Quickstart

```python
from terminalfeed_client import TerminalFeed

tf = TerminalFeed()                                    # no token yet
quote = tf.buy_credits(amount_usd=1.00)                # $1 = 50 credits
# Send USDC on Base mainnet to quote["wallet"] with memo quote["memo"]
tf.confirm_payment(tx_hash="0x...", nonce=quote["memo"])
print("balance:", tf.balance())

print(tf.macro(history="30d"))                         # 2 credits
print(tf.crypto_deep(coins=["btc", "eth"]))            # 2 credits
print(tf.briefing(include=["btc", "predictions"]))     # 1 credit
```

Full docs: <https://terminalfeed.io/developers/agent-payments>.
