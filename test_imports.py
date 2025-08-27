#!/usr/bin/env python3
"""
Test script to verify analyzer imports work correctly.
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path.cwd()))

try:
    print("Testing analyzer imports...")
    
    # Test basic imports
    import analyzer
    print("✅ analyzer module imported")
    
    from analyzer import evaluate, get_rules_fingerprint
    print("✅ evaluate and get_rules_fingerprint imported")
    
    from analyzer.id import contradiction_id
    print("✅ contradiction_id imported")
    
    from analyzer.all_rules import get_all_rule_functions
    print("✅ get_all_rule_functions imported")
    
    # Test rule functions are available
    rule_functions = get_all_rule_functions()
    print(f"✅ Found {len(rule_functions)} rule functions")
    
    for func in rule_functions:
        print(f"  - {func.__name__}")
    
    # Test basic evaluation
    test_statements = [
        {'id': '1', 'event': 'test', 'party': 'A', 'present': True},
        {'id': '2', 'event': 'test', 'party': 'A', 'present': False}
    ]
    
    contradictions = evaluate(test_statements)
    print(f"✅ Evaluation worked: found {len(contradictions)} contradictions")
    
    # Test fingerprint
    fingerprint = get_rules_fingerprint()
    print(f"✅ Rules fingerprint: {fingerprint}")
    
    # Test ID symmetry
    id1 = contradiction_id(test_statements[0], test_statements[1])
    id2 = contradiction_id(test_statements[1], test_statements[0])
    assert id1 == id2, f"ID symmetry failed: {id1} != {id2}"
    print(f"✅ ID symmetry test passed: {id1}")
    
    print("\n🎉 All imports and basic functionality tests passed!")
    
except Exception as e:
    print(f"❌ Import test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)