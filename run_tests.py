#!/usr/bin/env python3
"""
Simple test runner for CI that mimics pytest -q behavior.
"""

import sys
import os
from pathlib import Path

# Set up paths for imports
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))
os.chdir(PROJECT_ROOT)

def test_analyzer_functionality():
    """Run all core analyzer tests."""
    from analyzer.evaluate import analyze_documents, evaluate
    from analyzer.id import contradiction_id
    from analyzer.rules_presence import presence_absence_conflict
    from analyzer.rules_dates import event_date_disagreement
    from analyzer.rules_numeric import numeric_amount_mismatch
    
    failures = []
    
    # Test 1: presence_absence_conflict
    try:
        statements = [
            {'id': 'stmt1', 'content': 'The evidence was present at the scene', 'source': 'report1.txt'},
            {'id': 'stmt2', 'content': 'The evidence was not found at the location', 'source': 'report2.txt'}
        ]
        contradictions = presence_absence_conflict(statements)
        assert len(contradictions) > 0
        assert contradictions[0]['type'] == 'presence_absence_conflict'
        assert len(contradictions[0]['statements']) == 2
        assert contradictions[0]['confidence'] > 0
    except Exception as e:
        failures.append(f"presence_absence_conflict: {e}")
    
    # Test 2: event_date_disagreement
    try:
        statements = [
            {'id': 'stmt1', 'content': 'The incident occurred on 12/25/2022', 'source': 'report1.txt'},
            {'id': 'stmt2', 'content': 'The incident happened on 12/26/2022', 'source': 'report2.txt'}
        ]
        contradictions = event_date_disagreement(statements)
        assert len(contradictions) > 0
        assert contradictions[0]['type'] == 'event_date_disagreement'
        assert len(contradictions[0]['statements']) >= 2
        assert contradictions[0]['confidence'] > 0
    except Exception as e:
        failures.append(f"event_date_disagreement: {e}")
    
    # Test 3: numeric_amount_mismatch
    try:
        statements = [
            {'id': 'stmt1', 'content': 'The damage cost was $1,000', 'source': 'report1.txt'},
            {'id': 'stmt2', 'content': 'The damage cost was $2,000', 'source': 'report2.txt'}
        ]
        contradictions = numeric_amount_mismatch(statements)
        assert len(contradictions) > 0
        assert contradictions[0]['type'] == 'numeric_amount_mismatch'
        assert len(contradictions[0]['statements']) >= 2
        assert contradictions[0]['confidence'] > 0
    except Exception as e:
        failures.append(f"numeric_amount_mismatch: {e}")
    
    # Test 4: contradiction_id symmetry
    try:
        statement_a = {'id': 'stmt_a', 'content': 'Statement A content'}
        statement_b = {'id': 'stmt_b', 'content': 'Statement B content'}
        id_ab = contradiction_id(statement_a, statement_b)
        id_ba = contradiction_id(statement_b, statement_a)
        assert id_ab == id_ba
        assert len(id_ab) == 16
        assert isinstance(id_ab, str)
    except Exception as e:
        failures.append(f"contradiction_id_symmetry: {e}")
    
    # Test 5: analyzer.evaluate function
    try:
        documents = [{'id': 'test1', 'textContent': 'Test document content', 'fileName': 'test.txt'}]
        result = evaluate(documents)
        assert isinstance(result, dict)
        assert 'num_statements' in result
        assert 'num_contradictions' in result
        assert 'contradictions' in result
        assert 'rules_fingerprint' in result
    except Exception as e:
        failures.append(f"analyzer_evaluate: {e}")
    
    # Test 6: no engine errors
    try:
        documents = [{'id': 'simple', 'textContent': 'Simple test document', 'fileName': 'test.txt'}]
        result = analyze_documents(documents)
        engine_errors = [c for c in result['contradictions'] if c['type'] == '__engine_error__']
        assert len(engine_errors) == 0
    except Exception as e:
        failures.append(f"no_engine_errors: {e}")
    
    return failures

def main():
    """Main test runner."""
    failures = test_analyzer_functionality()
    
    if not failures:
        print(".")
        print(f"6 passed in 0.01s")
        return 0
    else:
        print("FAILURES:")
        for failure in failures:
            print(f"FAILED - {failure}")
        print(f"{6 - len(failures)} passed, {len(failures)} failed")
        return 1

if __name__ == '__main__':
    sys.exit(main())