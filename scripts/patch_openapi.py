"""One-shot patch: add x-codeSamples + llm-tools path + x-tagGroups to openapi.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec_path = ROOT / "public" / "openapi.json"

with spec_path.open() as f:
    spec = json.load(f)

T = "tf_live_<64-char-hex>"

samples = {
    "/api/pro/briefing": {
        "method": "get",
        "samples": [
            {
                "lang": "curl",
                "label": "curl",
                "source": (
                    "curl https://terminalfeed.io/api/pro/briefing \\\n"
                    f"  -H \"Authorization: Bearer {T}\""
                ),
            },
            {
                "lang": "Python",
                "label": "Python (requests)",
                "source": (
                    "import requests\n"
                    "res = requests.get(\n"
                    "    \"https://terminalfeed.io/api/pro/briefing\",\n"
                    f"    headers={{\"Authorization\": \"Bearer {T}\"}},\n"
                    "    timeout=10,\n"
                    ")\n"
                    "print(res.json())\n"
                    "print(\"credits left:\", res.headers.get(\"X-Credits-Remaining\"))"
                ),
            },
            {
                "lang": "JavaScript",
                "label": "JavaScript (fetch)",
                "source": (
                    "const res = await fetch(\"https://terminalfeed.io/api/pro/briefing\", {\n"
                    f"  headers: {{ Authorization: \"Bearer {T}\" }},\n"
                    "});\n"
                    "const data = await res.json();\n"
                    "console.log(data);\n"
                    "console.log(\"credits left:\", res.headers.get(\"X-Credits-Remaining\"));"
                ),
            },
        ],
    },
    "/api/pro/macro": {
        "method": "get",
        "samples": [
            {
                "lang": "curl",
                "label": "curl",
                "source": (
                    "curl \"https://terminalfeed.io/api/pro/macro?history=30d\" \\\n"
                    f"  -H \"Authorization: Bearer {T}\""
                ),
            },
            {
                "lang": "Python",
                "label": "Python (requests)",
                "source": (
                    "import requests\n"
                    "res = requests.get(\n"
                    "    \"https://terminalfeed.io/api/pro/macro\",\n"
                    "    params={\"history\": \"30d\"},\n"
                    f"    headers={{\"Authorization\": \"Bearer {T}\"}},\n"
                    "    timeout=15,\n"
                    ")\n"
                    "macro = res.json()\n"
                    "print(\"Fed rate:\", macro[\"economic\"][\"fed_rate\"][\"value\"])\n"
                    "print(\"VIX:\", macro[\"markets\"][\"vix\"][\"price\"])"
                ),
            },
            {
                "lang": "JavaScript",
                "label": "JavaScript (fetch)",
                "source": (
                    "const url = new URL(\"https://terminalfeed.io/api/pro/macro\");\n"
                    "url.searchParams.set(\"history\", \"30d\");\n"
                    "const res = await fetch(url, {\n"
                    f"  headers: {{ Authorization: \"Bearer {T}\" }},\n"
                    "});\n"
                    "const macro = await res.json();\n"
                    "console.log(\"Fed rate:\", macro.economic.fed_rate.value);"
                ),
            },
        ],
    },
    "/api/pro/crypto-deep": {
        "method": "get",
        "samples": [
            {
                "lang": "curl",
                "label": "curl",
                "source": (
                    "curl \"https://terminalfeed.io/api/pro/crypto-deep?coins=btc,eth,sol\" \\\n"
                    f"  -H \"Authorization: Bearer {T}\""
                ),
            },
            {
                "lang": "Python",
                "label": "Python (requests)",
                "source": (
                    "import requests\n"
                    "res = requests.get(\n"
                    "    \"https://terminalfeed.io/api/pro/crypto-deep\",\n"
                    "    params={\"coins\": \"btc,eth,sol\"},\n"
                    f"    headers={{\"Authorization\": \"Bearer {T}\"}},\n"
                    "    timeout=15,\n"
                    ")\n"
                    "d = res.json()\n"
                    "for coin in d[\"coins_top50\"]:\n"
                    "    print(coin[\"symbol\"], coin[\"price_usd\"], coin[\"change_24h_percent\"])\n"
                    "print(\"BTC block height:\", d[\"network_btc\"][\"block_height\"])"
                ),
            },
            {
                "lang": "JavaScript",
                "label": "JavaScript (fetch)",
                "source": (
                    "const url = new URL(\"https://terminalfeed.io/api/pro/crypto-deep\");\n"
                    "url.searchParams.set(\"coins\", \"btc,eth,sol\");\n"
                    f"const res = await fetch(url, {{ headers: {{ Authorization: \"Bearer {T}\" }} }});\n"
                    "const d = await res.json();\n"
                    "for (const c of d.coins_top50) console.log(c.symbol, c.price_usd);"
                ),
            },
        ],
    },
    "/api/payment/buy-credits": {
        "method": "post",
        "samples": [
            {
                "lang": "curl",
                "label": "curl",
                "source": (
                    "curl -X POST https://terminalfeed.io/api/payment/buy-credits \\\n"
                    "  -H \"Content-Type: application/json\" \\\n"
                    "  -d '{\"amount_usd\": 1.00}'"
                ),
            },
            {
                "lang": "Python",
                "label": "Python (requests)",
                "source": (
                    "import requests\n"
                    "quote = requests.post(\n"
                    "    \"https://terminalfeed.io/api/payment/buy-credits\",\n"
                    "    json={\"amount_usd\": 1.00},\n"
                    "    timeout=10,\n"
                    ").json()\n"
                    "print(\"Send\", quote[\"amount_usd\"], \"USDC to\", quote[\"wallet\"])\n"
                    "print(\"Memo:\", quote[\"memo\"])"
                ),
            },
            {
                "lang": "JavaScript",
                "label": "JavaScript (fetch)",
                "source": (
                    "const res = await fetch(\"https://terminalfeed.io/api/payment/buy-credits\", {\n"
                    "  method: \"POST\",\n"
                    "  headers: { \"Content-Type\": \"application/json\" },\n"
                    "  body: JSON.stringify({ amount_usd: 1.00 }),\n"
                    "});\n"
                    "const quote = await res.json();\n"
                    "console.log(\"Send\", quote.amount_usd, \"USDC to\", quote.wallet);"
                ),
            },
        ],
    },
    "/api/payment/confirm": {
        "method": "post",
        "samples": [
            {
                "lang": "curl",
                "label": "curl",
                "source": (
                    "curl -X POST https://terminalfeed.io/api/payment/confirm \\\n"
                    "  -H \"Content-Type: application/json\" \\\n"
                    "  -d '{\"tx_hash\": \"0xabc...\", \"nonce\": \"tf-...\"}'"
                ),
            },
            {
                "lang": "Python",
                "label": "Python (requests)",
                "source": (
                    "import requests\n"
                    "resp = requests.post(\n"
                    "    \"https://terminalfeed.io/api/payment/confirm\",\n"
                    "    json={\"tx_hash\": \"0xabc...\", \"nonce\": \"tf-...\"},\n"
                    "    timeout=15,\n"
                    ").json()\n"
                    "token = resp[\"token\"]\n"
                    "print(\"Bearer token:\", token, \"Credits:\", resp[\"credits\"])"
                ),
            },
            {
                "lang": "JavaScript",
                "label": "JavaScript (fetch)",
                "source": (
                    "const res = await fetch(\"https://terminalfeed.io/api/payment/confirm\", {\n"
                    "  method: \"POST\",\n"
                    "  headers: { \"Content-Type\": \"application/json\" },\n"
                    "  body: JSON.stringify({ tx_hash: \"0xabc...\", nonce: \"tf-...\" }),\n"
                    "});\n"
                    "const { token, credits } = await res.json();"
                ),
            },
        ],
    },
    "/api/payment/balance": {
        "method": "get",
        "samples": [
            {
                "lang": "curl",
                "label": "curl",
                "source": (
                    "curl https://terminalfeed.io/api/payment/balance \\\n"
                    f"  -H \"Authorization: Bearer {T}\""
                ),
            },
            {
                "lang": "Python",
                "label": "Python (requests)",
                "source": (
                    "import requests\n"
                    "balance = requests.get(\n"
                    "    \"https://terminalfeed.io/api/payment/balance\",\n"
                    f"    headers={{\"Authorization\": \"Bearer {T}\"}},\n"
                    "    timeout=10,\n"
                    ").json()\n"
                    "print(\"Credits remaining:\", balance[\"credits\"])"
                ),
            },
            {
                "lang": "JavaScript",
                "label": "JavaScript (fetch)",
                "source": (
                    "const res = await fetch(\"https://terminalfeed.io/api/payment/balance\", {\n"
                    f"  headers: {{ Authorization: \"Bearer {T}\" }},\n"
                    "});\n"
                    "const balance = await res.json();\n"
                    "console.log(\"Credits remaining:\", balance.credits);"
                ),
            },
        ],
    },
}

applied = 0
for path, info in samples.items():
    if path in spec["paths"] and info["method"] in spec["paths"][path]:
        spec["paths"][path][info["method"]]["x-codeSamples"] = info["samples"]
        applied += 1

spec["paths"]["/api/llm-tools"] = {
    "get": {
        "tags": ["Discovery"],
        "summary": "Pre-baked function-calling tool definitions for OpenAI and Anthropic",
        "description": (
            "Returns ready-to-paste tool definitions for every TerminalFeed endpoint in OpenAI "
            "function-calling format and Anthropic tool-use format. Free endpoint by design (no "
            "credits). Agent devs paste the openai or anthropic block directly into their LLM "
            "tool-use scaffold."
        ),
        "parameters": [
            {
                "name": "format",
                "in": "query",
                "schema": {"type": "string", "enum": ["both", "openai", "anthropic", "raw"]},
                "description": "Output format. Default both.",
            },
            {
                "name": "tier",
                "in": "query",
                "schema": {"type": "string", "enum": ["all", "free", "premium"]},
                "description": "Filter by tier. Default all.",
            },
        ],
        "responses": {
            "200": {
                "description": "Tool definitions in requested format(s).",
                "content": {"application/json": {"schema": {"type": "object"}}},
            }
        },
        "x-codeSamples": [
            {
                "lang": "curl",
                "label": "curl",
                "source": "curl \"https://terminalfeed.io/api/llm-tools?format=anthropic\"",
            },
            {
                "lang": "Python",
                "label": "Python (Anthropic SDK)",
                "source": (
                    "import requests, anthropic\n"
                    "tools = requests.get(\"https://terminalfeed.io/api/llm-tools?format=anthropic\").json()[\"anthropic\"]\n"
                    "client = anthropic.Anthropic()\n"
                    "resp = client.messages.create(\n"
                    "    model=\"claude-opus-4-7\",\n"
                    "    tools=tools,\n"
                    "    messages=[{\"role\": \"user\", \"content\": \"What is the current Fed funds rate?\"}],\n"
                    "    max_tokens=1024,\n"
                    ")"
                ),
            },
            {
                "lang": "JavaScript",
                "label": "JavaScript (OpenAI SDK)",
                "source": (
                    "import OpenAI from \"openai\";\n"
                    "const tools = (await fetch(\"https://terminalfeed.io/api/llm-tools?format=openai\").then(r => r.json())).openai;\n"
                    "const openai = new OpenAI();\n"
                    "const resp = await openai.chat.completions.create({\n"
                    "  model: \"gpt-4o\",\n"
                    "  tools,\n"
                    "  messages: [{ role: \"user\", content: \"Get the latest BTC price.\" }],\n"
                    "});"
                ),
            },
        ],
    }
}

spec["x-tagGroups"] = [
    {"name": "Free Tier", "tags": ["Discovery", "Free: Markets", "Free: Crypto", "Free: World"]},
    {"name": "Premium Tier", "tags": ["Premium: Composed", "Premium: Billing"]},
]

spec["info"]["version"] = "1.2.0"

with spec_path.open("w") as f:
    json.dump(spec, f, indent=2)
    f.write("\n")

print(f"Applied x-codeSamples to {applied} endpoints")
print("Added /api/llm-tools path")
print("Added x-tagGroups for tier-based rendering")
print(f"Spec version bumped to {spec['info']['version']}")

with spec_path.open() as f:
    json.load(f)
print("VALID_JSON")
