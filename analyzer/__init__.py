"""
Main evaluation engine for contradiction detection.
"""

import hashlib
from .all_rules import get_all_rule_functions

def evaluate(statements):
    """
    Main evaluation function that runs all rule functions against statements.
    Returns list of contradictions found.
    """
    contradictions = []
    
    # Get all available rule functions
    rule_functions = get_all_rule_functions()
    
    # Run each rule function against the statements
    for rule_func in rule_functions:
        try:
            rule_contradictions = rule_func(statements)
            if rule_contradictions:
                contradictions.extend(rule_contradictions)
        except Exception as e:
            # Log error but continue with other rules
            print(f"Warning: Rule {rule_func.__name__} failed: {e}")
            # Add engine error marker for CI detection
            contradictions.append({
                'contradiction_id': f'error_{rule_func.__name__}',
                'type': '__engine_error__',
                'error': str(e),
                'rule': rule_func.__name__,
                'description': f'Rule engine error in {rule_func.__name__}: {e}'
            })
    
    return contradictions

def get_rules_fingerprint():
    """
    Generate a fingerprint of all available rules for metadata.
    """
    rule_functions = get_all_rule_functions()
    rule_names = sorted([func.__name__ for func in rule_functions])
    combined = "|".join(rule_names)
    return hashlib.sha1(combined.encode()).hexdigest()[:12]