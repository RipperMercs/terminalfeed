"""
Reference Python client for the TerminalFeed Premium API.

Phase 1 has no published SDK. This file is a single-file, dependency-light
reference implementation that agents can copy into their codebase and use as is.
It will eventually become the seed for a `terminalfeed` PyPI package or a
sub-module of the existing `tensorfeed` package (credits and bearer tokens are
cross-redeemable, so both options work).

Usage:

    from terminalfeed_client import TerminalFeed

    tf = TerminalFeed()  # no token needed yet

    # 1) Buy credits ($1 USDC = 50 credits)
    quote = tf.buy_credits(amount_usd=1.00)
    print("Send USDC to:", quote["wallet"], "memo:", quote["memo"])

    # 2) After sending USDC on Base mainnet, confirm with the tx hash + memo
    confirmed = tf.confirm_payment(tx_hash="0x...", nonce=quote["memo"])
    tf = TerminalFeed(token=confirmed["token"])

    # 3) Call any premium endpoint
    macro = tf.macro(history="30d")
    crypto = tf.crypto_deep(coins=["btc", "eth", "sol"])
    briefing = tf.briefing(include=["btc", "predictions"], history="24h")
    print("credits remaining:", tf.balance()["credits"])

The client only depends on `requests` (which is already installed in
virtually every agent runtime). For pure-stdlib environments, swap the
two `_get`/`_post` methods for `urllib.request` calls.
"""

from __future__ import annotations

import json
from typing import Any, Iterable

import requests


class TerminalFeedError(Exception):
    """Raised when the API returns a non-2xx status that is not a 402."""


class PaymentRequiredError(TerminalFeedError):
    """Raised when the API returns 402 Payment Required.

    The `reason` attribute carries the disambiguating string from the
    response body: missing_token, invalid_token, insufficient_credits,
    expired, billing_unavailable.
    """

    def __init__(self, reason: str, signup_url: str, body: dict):
        super().__init__(f"402 Payment Required: {reason}. See {signup_url}")
        self.reason = reason
        self.signup_url = signup_url
        self.body = body


class TerminalFeed:
    """Thin wrapper over the TerminalFeed HTTP API.

    Args:
        token: a `tf_live_<64-char-hex>` bearer token. May be None if the
            client is only used for the buy/confirm flow.
        base_url: override for testing. Defaults to https://terminalfeed.io.
        timeout: request timeout in seconds.
    """

    DEFAULT_BASE_URL = "https://terminalfeed.io"

    def __init__(
        self,
        token: str | None = None,
        base_url: str | None = None,
        timeout: float = 15.0,
    ) -> None:
        self.token = token
        self.base_url = base_url or self.DEFAULT_BASE_URL
        self.timeout = timeout
        self._credits_remaining: int | None = None

    # ------------------------------ Billing ------------------------------

    def payment_info(self) -> dict[str, Any]:
        """GET /api/payment/info. Returns wallet address, pricing tiers, supported flows."""
        return self._get("/api/payment/info", auth=False)

    def buy_credits(self, amount_usd: float) -> dict[str, Any]:
        """POST /api/payment/buy-credits. Returns wallet, memo, quote, expires_at."""
        return self._post("/api/payment/buy-credits", {"amount_usd": amount_usd})

    def confirm_payment(self, tx_hash: str, nonce: str) -> dict[str, Any]:
        """POST /api/payment/confirm. Returns token + credits."""
        body = self._post("/api/payment/confirm", {"tx_hash": tx_hash, "nonce": nonce})
        if "token" in body:
            self.token = body["token"]
        return body

    def balance(self) -> dict[str, Any]:
        """GET /api/payment/balance. Returns credits remaining."""
        return self._get("/api/payment/balance", auth=True)

    # --------------------------- Premium data ----------------------------

    def briefing(
        self,
        include: Iterable[str] | None = None,
        history: str | None = None,
    ) -> dict[str, Any]:
        """GET /api/pro/briefing (1 credit)."""
        params: dict[str, str] = {}
        if include:
            params["include"] = ",".join(include)
        if history:
            params["history"] = history
        return self._get("/api/pro/briefing", auth=True, params=params)

    def macro(self, history: str | None = None) -> dict[str, Any]:
        """GET /api/pro/macro (2 credits)."""
        params: dict[str, str] = {}
        if history:
            params["history"] = history
        return self._get("/api/pro/macro", auth=True, params=params)

    def crypto_deep(
        self,
        coins: Iterable[str] | None = None,
        history: str | None = None,
    ) -> dict[str, Any]:
        """GET /api/pro/crypto-deep (2 credits)."""
        params: dict[str, str] = {}
        if coins:
            params["coins"] = ",".join(coins)
        if history:
            params["history"] = history
        return self._get("/api/pro/crypto-deep", auth=True, params=params)

    # ---------------------------- Free tier ------------------------------
    # The free tier requires no auth. These convenience wrappers are here
    # so an agent can exercise its HTTP plumbing before spending USDC.

    def free_briefing(self) -> dict[str, Any]:
        """GET /api/briefing (free, no auth)."""
        return self._get("/api/briefing", auth=False)

    def free_btc_price(self) -> dict[str, Any]:
        return self._get("/api/btc-price", auth=False)

    @property
    def credits_remaining(self) -> int | None:
        """Last-seen X-Credits-Remaining value. None until first premium call."""
        return self._credits_remaining

    # ----------------------------- HTTP core -----------------------------

    def _headers(self, auth: bool) -> dict[str, str]:
        h = {"Accept": "application/json", "User-Agent": "terminalfeed-py/0.1"}
        if auth:
            if not self.token:
                raise TerminalFeedError(
                    "This call requires a bearer token. Call buy_credits + "
                    "confirm_payment first, or pass token=... to the constructor."
                )
            h["Authorization"] = f"Bearer {self.token}"
        return h

    def _handle(self, res: requests.Response) -> dict[str, Any]:
        remaining = res.headers.get("X-Credits-Remaining")
        if remaining is not None:
            try:
                self._credits_remaining = int(remaining)
            except ValueError:
                pass
        if res.status_code == 402:
            try:
                body = res.json()
            except json.JSONDecodeError:
                body = {"error": "payment_required"}
            raise PaymentRequiredError(
                reason=body.get("error", "payment_required"),
                signup_url=body.get("signup", f"{self.base_url}/developers/agent-payments"),
                body=body,
            )
        if res.status_code >= 400:
            raise TerminalFeedError(f"HTTP {res.status_code}: {res.text[:200]}")
        return res.json()

    def _get(self, path: str, auth: bool, params: dict[str, str] | None = None) -> dict[str, Any]:
        res = requests.get(
            self.base_url + path,
            headers=self._headers(auth),
            params=params,
            timeout=self.timeout,
        )
        return self._handle(res)

    def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        res = requests.post(
            self.base_url + path,
            headers={**self._headers(auth=False), "Content-Type": "application/json"},
            data=json.dumps(body),
            timeout=self.timeout,
        )
        return self._handle(res)


__all__ = ["TerminalFeed", "TerminalFeedError", "PaymentRequiredError"]
