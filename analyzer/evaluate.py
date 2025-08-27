"""
Core evaluation logic for the analyzer.
"""

import json
import hashlib
from typing import List, Dict, Any
from .id import generate_contradiction_id
from .rules_dates import event_date_disagreement
from .rules_presence import presence_absence_conflict, witness_statement_suppression
from .rules_numeric import numeric_amount_mismatch, financial_discrepancy

# Rule function registry
RULE_FUNCTIONS = [
    event_date_disagreement,
    presence_absence_conflict,
    witness_statement_suppression,
    numeric_amount_mismatch,
    financial_discrepancy,
]

def get_rules_fingerprint() -> str:
    """
    Generate a SHA1 fingerprint of all rule function names.
    """
    rule_names = [func.__name__ for func in RULE_FUNCTIONS]
    rule_names.sort()  # Ensure deterministic order
    rules_string = "::".join(rule_names)
    return hashlib.sha1(rules_string.encode('utf-8')).hexdigest()

def analyze_documents(documents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze documents for contradictions using all available rules.
    
    Args:
        documents: List of document dictionaries
        
    Returns:
        Dictionary containing analysis results
    """
    # Extract statements from documents
    statements = []
    for doc in documents:
        # Create statement objects from document content
        statement = {
            'id': doc.get('id', f"doc_{len(statements)}"),
            'document_id': doc.get('id'),
            'content': doc.get('textContent', doc.get('content', '')),
            'source': doc.get('fileName', 'unknown'),
            'metadata': {
                'title': doc.get('title', ''),
                'category': doc.get('category', ''),
                'uploadedAt': doc.get('uploadedAt', '')
            }
        }
        statements.append(statement)
    
    # Run all rule functions
    all_contradictions = []
    for rule_func in RULE_FUNCTIONS:
        try:
            contradictions = rule_func(statements)
            for contradiction in contradictions:
                # Add contradiction ID
                contradiction['contradiction_id'] = generate_contradiction_id(contradiction)
                # Add rule source
                contradiction['rule'] = rule_func.__name__
                all_contradictions.append(contradiction)
        except Exception as e:
            # Add error contradiction for debugging
            all_contradictions.append({
                'type': '__engine_error__',
                'description': f'Rule {rule_func.__name__} failed: {str(e)}',
                'rule': rule_func.__name__,
                'contradiction_id': f'error_{rule_func.__name__}',
                'statements': [],
                'confidence': 0.0
            })
    
    # Prepare results
    results = {
        'num_statements': len(statements),
        'num_contradictions': len([c for c in all_contradictions if c['type'] != '__engine_error__']),
        'contradictions': all_contradictions,
        'statements': statements,
        'rules_fingerprint': get_rules_fingerprint(),
        'analysis_metadata': {
            'rules_executed': len(RULE_FUNCTIONS),
            'errors': len([c for c in all_contradictions if c['type'] == '__engine_error__'])
        }
    }
    
    return results

def evaluate(documents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Alias for analyze_documents to match test expectations.
    """
    return analyze_documents(documents)