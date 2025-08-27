"""
Evaluation pipeline: runs registered rules, writes outputs with deterministic IDs.
"""

import json
import pathlib
from typing import List, Dict, Any
from .rules import RuleContext, iter_rules, Contradiction
from .id import contradiction_id

def evaluate(statements: List[Dict[str, Any]], doc_id="batch") -> List[Contradiction]:
    ctx = RuleContext(doc_id=doc_id, statements=statements)
    contradictions: List[Contradiction] = []
    for r in iter_rules():
        try:
            contradictions.extend(list(r(ctx)))
        except Exception as e:
            contradictions.append(Contradiction(
                rule="__engine_error__",
                severity="low",
                key="engine",
                rationale=f"Rule {r.__name__} failed: {e}",
                a={}, b={}
            ))
    return contradictions

def write_json(obj, path: pathlib.Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2))

def _enrich_with_ids(contradictions: List[Contradiction]) -> List[Dict[str, Any]]:
    enriched = []
    for c in contradictions:
        item = {
            "rule": c.rule,
            "severity": c.severity,
            "key": c.key,
            "rationale": c.rationale,
            "a": c.a,
            "b": c.b,
        }
        item["contradiction_id"] = contradiction_id(c.rule, c.key, c.a, c.b)
        enriched.append(item)
    return enriched

def pipeline(statements: List[Dict[str, Any]], out_dir: str = "public/data"):
    out_path = pathlib.Path(out_dir)
    contradictions = evaluate(statements)
    enriched = _enrich_with_ids(contradictions)
    write_json(statements, out_path / "statements_debug.json")
    write_json(enriched,   out_path / "contradictions.json")
    return contradictions