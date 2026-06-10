"""Back-compat shim. The TerminalFeed client now lives in terminalfeed.py
(same folder) and is published on PyPI as the `terminalfeed` package:

    pip install terminalfeed
    from terminalfeed import TerminalFeed

If you previously copied this file into your codebase, that copy keeps
working unchanged; nothing about the API moved. For new integrations,
install from PyPI or vendor terminalfeed.py instead of this shim.

This shim re-exports everything so `from terminalfeed_client import
TerminalFeed` still works when both files sit side by side.
"""

from terminalfeed import (  # noqa: F401
    PaymentRequiredError,
    TerminalFeed,
    TerminalFeedError,
    __version__,
)

__all__ = ["TerminalFeed", "TerminalFeedError", "PaymentRequiredError"]
