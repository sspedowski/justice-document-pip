#!/usr/bin/env python3
"""Simple test to debug import issues"""

import sys
import os
from pathlib import Path

# Make sure we're in the right directory
print(f"Working directory: {Path.cwd()}")
print(f"Python path: {sys.path[:3]}")

# Add current directory to path  
sys.path.insert(0, str(Path.cwd()))

print("\n--- Testing imports step by step ---")

try:
    print("1. Testing analyzer.id import...")
    from analyzer.id import contradiction_id
    print("   ✅ analyzer.id imported successfully")
    
    # Test the function
    result = contradiction_id({'id': 'a'}, {'id': 'b'})
    print(f"   ✅ contradiction_id works: {result}")
    
except Exception as e:
    print(f"   ❌ analyzer.id failed: {e}")
    import traceback
    traceback.print_exc()

try:
    print("\n2. Testing analyzer.rules_dates import...")
    from analyzer.rules_dates import event_date_disagreement
    print("   ✅ analyzer.rules_dates imported successfully")
    
    # Test the function
    test_statements = [
        {'id': '1', 'event': 'test', 'date': '2024-01-01'},
        {'id': '2', 'event': 'test', 'date': '2024-01-02'}
    ]
    result = event_date_disagreement(test_statements)
    print(f"   ✅ event_date_disagreement works: found {len(result)} contradictions")
    
except Exception as e:
    print(f"   ❌ analyzer.rules_dates failed: {e}")
    import traceback
    traceback.print_exc()

try:
    print("\n3. Testing analyzer.all_rules import...")
    from analyzer.all_rules import get_all_rule_functions
    print("   ✅ analyzer.all_rules imported successfully")
    
    # Test the function
    functions = get_all_rule_functions()
    print(f"   ✅ get_all_rule_functions works: found {len(functions)} functions")
    for func in functions:
        print(f"      - {func.__name__}")
    
except Exception as e:
    print(f"   ❌ analyzer.all_rules failed: {e}")
    import traceback
    traceback.print_exc()

try:
    print("\n4. Testing analyzer main module import...")
    from analyzer import evaluate, get_rules_fingerprint
    print("   ✅ analyzer main module imported successfully")
    
    # Test evaluate function
    test_statements = [
        {'id': '1', 'event': 'test', 'party': 'John', 'present': True},
        {'id': '2', 'event': 'test', 'party': 'John', 'present': False}
    ]
    result = evaluate(test_statements)
    print(f"   ✅ evaluate works: found {len(result)} contradictions")
    
    # Test fingerprint
    fingerprint = get_rules_fingerprint()
    print(f"   ✅ get_rules_fingerprint works: {fingerprint}")
    
except Exception as e:
    print(f"   ❌ analyzer main module failed: {e}")
    import traceback
    traceback.print_exc()

print("\n--- Import testing complete ---")