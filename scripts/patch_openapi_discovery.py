"""Section 1 of cc-spec-agent-discovery: restructure openapi.json.

- Rename BearerAuth security scheme to agentBearer (update all $refs)
- Flatten tags from "Premium: Composed" etc. to "free", "pro", "payment"
- Add x-pricing-credits, x-pricing-usd, x-composes-sources, x-license
  on every premium operation
- Add externalDocs at top level
- Verify info.contact and info.license
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec_path = ROOT / "public" / "openapi.json"

with spec_path.open() as f:
    spec = json.load(f)


# ----- Step 1: Rename security scheme BearerAuth -> agentBearer -----

if "components" in spec and "securitySchemes" in spec["components"]:
    schemes = spec["components"]["securitySchemes"]
    if "BearerAuth" in schemes:
        old = schemes.pop("BearerAuth")
        old["description"] = (
            "Bearer token from /api/payment/confirm. Same token works on "
            "tensorfeed.ai (shared credit pool). See "
            "https://terminalfeed.io/developers/agent-payments."
        )
        schemes["agentBearer"] = old


# Walk every operation and replace BearerAuth references in security arrays
def _rename_security(node):
    if isinstance(node, dict):
        if "security" in node and isinstance(node["security"], list):
            for entry in node["security"]:
                if isinstance(entry, dict) and "BearerAuth" in entry:
                    entry["agentBearer"] = entry.pop("BearerAuth")
        for v in node.values():
            _rename_security(v)
    elif isinstance(node, list):
        for v in node:
            _rename_security(v)


_rename_security(spec)


# ----- Step 2: Restructure tags -----

TAG_MAP = {
    "Discovery": "free",
    "Free: Markets": "free",
    "Free: Crypto": "free",
    "Free: World": "free",
    "Premium: Composed": "pro",
    "Premium: Billing": "payment",
}

spec["tags"] = [
    {
        "name": "free",
        "description": "Free real-time data endpoints. No auth required. Standard rate limits.",
    },
    {
        "name": "pro",
        "description": "Premium composed endpoints. Bearer auth required. Pay per call in USDC credits.",
    },
    {
        "name": "payment",
        "description": "Credit purchase, confirmation, and balance check. No auth except where indicated.",
    },
]

# Update x-tagGroups to match
spec["x-tagGroups"] = [
    {"name": "Free Tier", "tags": ["free"]},
    {"name": "Premium Tier", "tags": ["pro", "payment"]},
]

# Walk every operation's tags array and rewrite
def _rename_tags(node):
    if isinstance(node, dict):
        if "tags" in node and isinstance(node["tags"], list) and all(isinstance(t, str) for t in node["tags"]):
            new_tags = []
            for t in node["tags"]:
                mapped = TAG_MAP.get(t, t)
                if mapped not in new_tags:
                    new_tags.append(mapped)
            node["tags"] = new_tags
        for v in node.values():
            _rename_tags(v)
    elif isinstance(node, list):
        for v in node:
            _rename_tags(v)


_rename_tags(spec)


# ----- Step 3: Add pricing + composes-sources + license extensions -----

# Per cc-spec-agent-discovery Section 1c plus my own knowledge of each endpoint
PREMIUM_PRICING = {
    "/api/pro/briefing": {"credits": 1, "usd": 0.02, "composes": 6, "license": "inference-only"},
    "/api/pro/macro": {"credits": 2, "usd": 0.04, "composes": 14, "license": "inference-only"},
    "/api/pro/crypto-deep": {"credits": 2, "usd": 0.04, "composes": 7, "license": "inference-only"},
    "/api/pro/agent-context": {"credits": 2, "usd": 0.04, "composes": 13, "license": "inference-only"},
    "/api/pro/sentiment": {"credits": 2, "usd": 0.04, "composes": 7, "license": "inference-only"},
    "/api/pro/world-deltas": {"credits": 2, "usd": 0.04, "composes": 4, "license": "inference-only"},
    "/api/pro/correlation-matrix": {"credits": 2, "usd": 0.04, "composes": 10, "license": "inference-only"},
    "/api/pro/whales": {"credits": 2, "usd": 0.04, "composes": 4, "license": "inference-only"},
    "/api/pro/exchange-flows": {"credits": 2, "usd": 0.04, "composes": 3, "license": "inference-only"},
}

paths = spec.get("paths", {})
for path, pricing in PREMIUM_PRICING.items():
    if path not in paths:
        print(f"WARNING: {path} not found in openapi paths!")
        continue
    op = paths[path].get("get") or paths[path].get("post")
    if op is None:
        continue
    op["x-pricing-credits"] = pricing["credits"]
    op["x-pricing-usd"] = pricing["usd"]
    op["x-composes-sources"] = pricing["composes"]
    op["x-license"] = pricing["license"]

# Payment endpoints also get cost (typically 0)
for path in ["/api/payment/info", "/api/payment/buy-credits", "/api/payment/confirm", "/api/payment/balance"]:
    if path in paths:
        for method in ("get", "post"):
            op = paths[path].get(method)
            if op is not None:
                op["x-pricing-credits"] = 0
                op["x-pricing-usd"] = 0.0


# ----- Step 4: Add externalDocs at top level -----

spec["externalDocs"] = {
    "description": (
        "Premium API for AI agents — full developer guide, payment flow, "
        "and cross-site bundle with TensorFeed."
    ),
    "url": "https://terminalfeed.io/developers/agent-payments",
}


# ----- Step 5: Verify info.contact + info.license -----

info = spec.setdefault("info", {})
info.setdefault(
    "contact",
    {
        "name": "TerminalFeed Support",
        "email": "support@terminalfeed.io",
        "url": "https://terminalfeed.io/developers/agent-payments",
    },
)
info.setdefault(
    "license",
    {
        "name": "Free tier: permissive. Premium tier: inference-only. See /terms.",
        "url": "https://terminalfeed.io/terms",
    },
)
info["version"] = "1.9.0"


# ----- Write -----

with spec_path.open("w") as f:
    json.dump(spec, f, indent=2)
    f.write("\n")

# Validate
with spec_path.open() as f:
    json.load(f)

print("openapi.json restructured:")
print(f"  - Security scheme renamed BearerAuth -> agentBearer")
print(f"  - Tags flattened to free / pro / payment")
print(f"  - x-pricing extensions added to {len(PREMIUM_PRICING)} premium endpoints")
print(f"  - externalDocs added at top level")
print(f"  - info.version bumped to {info['version']}")
