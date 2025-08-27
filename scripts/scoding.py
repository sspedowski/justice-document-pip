#!/usr/bin/env python
"""
Scoring ('scoding') script with deterministic ID preservation.
Outputs:
  public/data/contradictions_scored.json
  public/data/contradictions_scored.csv
"""
import json
import pathlib
import csv
import math
import sys
from typing import Dict, Any, List

# Add project root to path
PROJECT_ROOT = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

DATA_DIR = pathlib.Path("public/data")
INPUT_FILE = DATA_DIR / "contradictions.json"
OUTPUT_JSON = DATA_DIR / "contradictions_scored.json"
OUTPUT_CSV = DATA_DIR / "contradictions_scored.csv"

from analyzer.rule_meta import RULE_META, SEVERITY_BASE  # existing meta

def load_contradictions() -> List[Dict[str, Any]]:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Missing contradictions file: {INPUT_FILE}")
    return json.loads(INPUT_FILE.read_text())

# --- Scoring utilities ---

def date_delta_days(a: Dict[str, Any], b: Dict[str, Any]) -> int:
    from datetime import datetime
    formats = ["%Y-%m-%d", "%Y/%m/%d", "%d-%b-%Y"]
    def parse(d):
        for f in formats:
            try:
                return datetime.strptime(d, f)
            except Exception:
                continue
        return None
    da = parse(a.get("date",""))
    db = parse(b.get("date",""))
    if not da or not db:
        return 0
    return abs((da - db).days)

def numeric_diff(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    try:
        return abs(float(a.get("value")) - float(b.get("value")))
    except Exception:
        return 0.0

def presence_party_signal(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    party = a.get("party") or b.get("party") or ""
    upper = party.upper()
    if upper in {"NOEL","ANDY","MAKI"}:
        return 2.0
    return 0.5 if party else 0.0

def adjust_event_date_disagreement(base: float, c: Dict[str, Any]) -> float:
    delta = date_delta_days(c["a"], c["b"])
    return base + min(delta, 30) * 0.5

def adjust_numeric_amount_mismatch(base: float, c: Dict[str, Any]) -> float:
    diff = numeric_diff(c["a"], c["b"])
    if diff == 0:
        return base
    return base + math.log10(diff + 1) * 2.5

def adjust_presence_absence_conflict(base: float, c: Dict[str, Any]) -> float:
    return base + presence_party_signal(c["a"], c["b"])

RULE_ADJUSTERS = {
    "event_date_disagreement": adjust_event_date_disagreement,
    "numeric_amount_mismatch": adjust_numeric_amount_mismatch,
    "presence_absence_conflict": adjust_presence_absence_conflict,
}

def score_contradiction(c: Dict[str, Any]) -> float:
    rule = c.get("rule")
    if rule == "__engine_error__":
        return 0.0
    severity = c.get("severity", "low")
    severity_weight = SEVERITY_BASE.get(severity, 1)
    base_weight = RULE_META.get(rule, {}).get("base_weight", 4)
    base = severity_weight * 10 + base_weight
    adjuster = RULE_ADJUSTERS.get(rule)
    if adjuster:
        return round(adjuster(base, c), 3)
    return round(base, 3)

def enrich(c: Dict[str, Any]) -> Dict[str, Any]:
    meta = RULE_META.get(c.get("rule"), {})
    e = dict(c)   # keep contradiction_id
    e["title"] = meta.get("title")
    e["description"] = meta.get("description")
    e["suggested_action"] = meta.get("suggested_action")
    e["score"] = score_contradiction(c)
    return e

def write_outputs(items: List[Dict[str, Any]]):
    sorted_items = sorted(items, key=lambda x: x["score"], reverse=True)
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(json.dumps(sorted_items, indent=2))
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["contradiction_id","rule","title","severity","key","score","rationale"])
        for c in sorted_items:
            writer.writerow([
                c.get("contradiction_id"),
                c.get("rule"),
                c.get("title"),
                c.get("severity"),
                c.get("key"),
                c.get("score"),
                c.get("rationale")
            ])
    print(f"Wrote {len(sorted_items)} scored contradictions -> {OUTPUT_JSON} & {OUTPUT_CSV}")

def main():
    contradictions = load_contradictions()
    enriched = [enrich(c) for c in contradictions]
    write_outputs(enriched)

if __name__ == "__main__":
    main()