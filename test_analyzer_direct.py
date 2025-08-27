#!/usr/bin/env python3
"""
Analyzer tests that can be run directly or via pytest -q
"""

import sys
import os
from pathlib import Path

# Ensure we can import from the project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
os.chdir(PROJECT_ROOT)

def test_analyzer_import():
    """Test that analyzer modules can be imported."""
    try:
        from analyzer.evaluate import analyze_documents, evaluate
        from analyzer.id import contradiction_id
        from analyzer.rules_presence import presence_absence_conflict
        from analyzer.rules_dates import event_date_disagreement
        from analyzer.rules_numeric import numeric_amount_mismatch
        print("✓ All analyzer modules imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Import failed: {e}")
        return False

def test_presence_absence_conflict():
    """Test presence_absence_conflict rule."""
    from analyzer.rules_presence import presence_absence_conflict
    
    statements = [
        {
            'id': 'stmt1',
            'content': 'The evidence was present at the scene',
            'source': 'report1.txt'
        },
        {
            'id': 'stmt2', 
            'content': 'The evidence was not found at the location',
            'source': 'report2.txt'
        }
    ]
    
    contradictions = presence_absence_conflict(statements)
    
    if len(contradictions) > 0:
        contradiction = contradictions[0]
        if (contradiction['type'] == 'presence_absence_conflict' and
            len(contradiction['statements']) == 2 and
            contradiction['confidence'] > 0):
            print("✓ presence_absence_conflict test passed")
            return True
    
    print("✗ presence_absence_conflict test failed")
    return False

def test_event_date_disagreement():
    """Test event_date_disagreement rule."""
    from analyzer.rules_dates import event_date_disagreement
    
    statements = [
        {
            'id': 'stmt1',
            'content': 'The incident occurred on 12/25/2022',
            'source': 'report1.txt'
        },
        {
            'id': 'stmt2',
            'content': 'The incident happened on 12/26/2022', 
            'source': 'report2.txt'
        }
    ]
    
    contradictions = event_date_disagreement(statements)
    
    if len(contradictions) > 0:
        contradiction = contradictions[0]
        if (contradiction['type'] == 'event_date_disagreement' and
            len(contradiction['statements']) >= 2 and
            contradiction['confidence'] > 0):
            print("✓ event_date_disagreement test passed")
            return True
    
    print("✗ event_date_disagreement test failed")
    return False

def test_numeric_amount_mismatch():
    """Test numeric_amount_mismatch rule."""
    from analyzer.rules_numeric import numeric_amount_mismatch
    
    statements = [
        {
            'id': 'stmt1',
            'content': 'The damage cost was $1,000',
            'source': 'report1.txt'
        },
        {
            'id': 'stmt2',
            'content': 'The damage cost was $2,000',
            'source': 'report2.txt'
        }
    ]
    
    contradictions = numeric_amount_mismatch(statements)
    
    if len(contradictions) > 0:
        contradiction = contradictions[0]
        if (contradiction['type'] == 'numeric_amount_mismatch' and
            len(contradiction['statements']) >= 2 and
            contradiction['confidence'] > 0):
            print("✓ numeric_amount_mismatch test passed")
            return True
    
    print("✗ numeric_amount_mismatch test failed")
    return False

def test_contradiction_id_symmetry():
    """Test that contradiction_id(a, b) == contradiction_id(b, a)."""
    from analyzer.id import contradiction_id
    
    statement_a = {
        'id': 'stmt_a',
        'content': 'Statement A content'
    }
    statement_b = {
        'id': 'stmt_b', 
        'content': 'Statement B content'
    }
    
    id_ab = contradiction_id(statement_a, statement_b)
    id_ba = contradiction_id(statement_b, statement_a)
    
    if (id_ab == id_ba and 
        len(id_ab) == 16 and
        isinstance(id_ab, str)):
        print("✓ contradiction_id symmetry test passed")
        return True
    
    print("✗ contradiction_id symmetry test failed")
    return False

def test_analyzer_evaluate():
    """Test that analyzer.evaluate function works."""
    from analyzer.evaluate import evaluate
    
    documents = [
        {
            'id': 'test1',
            'textContent': 'Test document content',
            'fileName': 'test.txt'
        }
    ]
    
    result = evaluate(documents)
    
    if (isinstance(result, dict) and
        'num_statements' in result and
        'num_contradictions' in result and
        'contradictions' in result and
        'rules_fingerprint' in result):
        print("✓ analyzer.evaluate test passed")
        return True
    
    print("✗ analyzer.evaluate test failed")
    return False

def test_no_engine_errors():
    """Test that analysis doesn't produce engine errors."""
    from analyzer.evaluate import analyze_documents
    
    documents = [
        {
            'id': 'simple',
            'textContent': 'Simple test document',
            'fileName': 'test.txt'
        }
    ]
    
    result = analyze_documents(documents)
    
    engine_errors = [c for c in result['contradictions'] if c['type'] == '__engine_error__']
    
    if len(engine_errors) == 0:
        print("✓ no engine errors test passed")
        return True
    
    print(f"✗ no engine errors test failed: {len(engine_errors)} errors found")
    return False

def main():
    """Run all tests."""
    print("Running analyzer tests...")
    
    tests = [
        test_analyzer_import,
        test_presence_absence_conflict,
        test_event_date_disagreement,
        test_numeric_amount_mismatch,
        test_contradiction_id_symmetry,
        test_analyzer_evaluate,
        test_no_engine_errors
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} failed with exception: {e}")
            failed += 1
    
    print(f"\nTest Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("All tests passed!")
        return 0
    else:
        print("Some tests failed!")
        return 1

if __name__ == '__main__':
    sys.exit(main())