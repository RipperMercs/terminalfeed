"""OpenAPI 3.1.0 compliance fixes.

- Convert `nullable: true` to type unions (3.1.0 deprecated nullable)
- Add `security: []` to free operations so the linter accepts them
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec_path = ROOT / "public" / "openapi.json"

with spec_path.open() as f:
    spec = json.load(f)

# ----- Step 1: Convert nullable: true to type union -----

def _fix_nullable(node):
    if isinstance(node, dict):
        if node.get("nullable") is True:
            del node["nullable"]
            t = node.get("type")
            if isinstance(t, str):
                node["type"] = [t, "null"]
            elif isinstance(t, list) and "null" not in t:
                node["type"] = list(t) + ["null"]
            elif t is None:
                # Schema with no type but nullable - default to object|null
                node["type"] = ["object", "null"]
        for v in node.values():
            _fix_nullable(v)
    elif isinstance(node, list):
        for v in node:
            _fix_nullable(v)


_fix_nullable(spec)

# ----- Step 2: Add explicit security:[] to free operations -----

# Identify which paths are premium (already have security set) vs free (need empty)
paths = spec.get("paths", {})
fixed_security_count = 0
for path, ops in paths.items():
    if not isinstance(ops, dict):
        continue
    for method in ("get", "post", "put", "delete", "patch"):
        op = ops.get(method)
        if op is None:
            continue
        if "security" not in op:
            # No security declared. Free endpoint by default.
            op["security"] = []
            fixed_security_count += 1


with spec_path.open("w") as f:
    json.dump(spec, f, indent=2)
    f.write("\n")

print(f"Added security:[] to {fixed_security_count} free operations")
print("Converted nullable:true to type unions throughout")
