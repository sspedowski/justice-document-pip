#!/usr/bin/env python3
"""
Simple test of analyzer functionality.
"""

import sys
import os
sys.path.insert(0, os.getcwd())

# Test analyzer imports
try:
    from analyzer import evaluate, get_rules_fingerprint
    from analyzer.id import contradiction_id
    print("✅ All imports successful")
except Exception as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

# Test with sample data  
statements = [
    {'id': 'stmt_1', 'event': 'meeting', 'party': 'John', 'present': True},
    {'id': 'stmt_2', 'event': 'meeting', 'party': 'John', 'present': False},
    {'id': 'stmt_3', 'event': 'incident', 'date': '2024-01-01'},
    {'id': 'stmt_4', 'event': 'incident', 'date': '2024-01-02'},
    {'id': 'stmt_5', 'event': 'payment', 'amount': 100, 'currency': 'USD'},
    {'id': 'stmt_6', 'event': 'payment', 'amount': 200, 'currency': 'USD'}
]

print(f"Testing with {len(statements)} statements...")

# Run evaluation
contradictions = evaluate(statements)
real_contradictions = [c for c in contradictions if c.get('type') != '__engine_error__']
engine_errors = [c for c in contradictions if c.get('type') == '__engine_error__']

print(f"✅ Found {len(real_contradictions)} contradictions")
if engine_errors:
    print(f"❌ {len(engine_errors)} engine errors:")
    for error in engine_errors:
        print(f"  - {error.get('rule', 'unknown')}: {error.get('error', 'unknown error')}")

# Test ID symmetry
id1 = contradiction_id(statements[0], statements[1])
id2 = contradiction_id(statements[1], statements[0])
if id1 == id2:
    print("✅ ID symmetry test passed")
else:
    print(f"❌ ID symmetry test failed: {id1} != {id2}")

# Test fingerprint
fingerprint = get_rules_fingerprint()
print(f"✅ Rules fingerprint: {fingerprint}")

print("\nContradiction details:")
for i, contradiction in enumerate(real_contradictions):
    print(f"{i+1}. {contradiction['type']}: {contradiction['description']}")

if len(real_contradictions) >= 3 and not engine_errors:
    print("\n🎉 Analyzer working correctly!")
else:
    print(f"\n⚠️  Expected at least 3 contradictions, got {len(real_contradictions)}")
    if engine_errors:
        print(f"Plus {len(engine_errors)} engine errors - check rule implementations")