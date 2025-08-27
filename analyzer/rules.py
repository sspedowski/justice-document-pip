"""
Base rule system for contradiction detection.
"""

from typing import List, Dict, Any, Callable
from dataclasses import dataclass

@dataclass
class Contradiction:
    rule: str
    severity: str
    key: str
    rationale: str
    a: Dict[str, Any]
    b: Dict[str, Any]

@dataclass 
class RuleContext:
    doc_id: str
    statements: List[Dict[str, Any]]

# Global registry for rules
_rules: List[Callable[[RuleContext], List[Contradiction]]] = []

def rule(func: Callable[[RuleContext], List[Contradiction]]) -> Callable[[RuleContext], List[Contradiction]]:
    """Decorator to register a rule function."""
    _rules.append(func)
    return func

def iter_rules():
    """Iterate over all registered rules."""
    return _rules

def clear_rules():
    """Clear all registered rules (useful for testing)."""
    global _rules
    _rules = []