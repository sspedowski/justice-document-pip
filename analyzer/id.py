"""
Deterministic IDs for contradictions.

We hash:
  - rule
  - key
  - order-independent fingerprints of the two statements (a,b)

Fingerprints include only a stable subset of statement fields so that
irrelevant metadata changes don't alter the contradiction id.
"""

import hashlib, json

FP_KEYS = [
    "id","doc_id","event_id","party","date","value",
    "status","location","currency","type"
]

def _fingerprint(stmt: dict) -> str:
    if not isinstance(stmt, dict):
        return "none"
    mini = {k: stmt.get(k) for k in FP_KEYS if k in stmt}
    s = json.dumps(mini, sort_keys=True, separators=(",",":"))
    return hashlib.sha1(s.encode("utf-8")).hexdigest()

def contradiction_id(rule: str, key: str, a: dict, b: dict) -> str:
    fa, fb = _fingerprint(a), _fingerprint(b)
    pair = "||".join(sorted([fa, fb]))
    base = f"{rule}|{key}|{pair}"
    return hashlib.sha1(base.encode("utf-8")).hexdigest()[:16]