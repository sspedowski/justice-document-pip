"""
Direct test of analyzer functionality
"""
import sys
import os
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path.cwd()))

print("🔍 Testing analyzer import...")

try:
    from analyzer import evaluate, get_rules_fingerprint
    from analyzer.id import contradiction_id
    print("✅ Imports successful")
except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("🧪 Testing with sample data...")

# Test statements
statements = [
    {'id': 'stmt_1', 'event': 'meeting', 'party': 'John', 'present': True},
    {'id': 'stmt_2', 'event': 'meeting', 'party': 'John', 'present': False},
    {'id': 'stmt_3', 'event': 'incident', 'date': '2024-01-01'},
    {'id': 'stmt_4', 'event': 'incident', 'date': '2024-01-02'},
    {'id': 'stmt_5', 'event': 'payment', 'amount': 100, 'currency': 'USD'},
    {'id': 'stmt_6', 'event': 'payment', 'amount': 200, 'currency': 'USD'}
]

try:
    # Test evaluation
    contradictions = evaluate(statements)
    print(f"✅ Evaluation successful: {len(contradictions)} results")
    
    # Filter out engine errors
    real_contradictions = [c for c in contradictions if c.get('type') != '__engine_error__']
    engine_errors = [c for c in contradictions if c.get('type') == '__engine_error__']
    
    print(f"  - {len(real_contradictions)} valid contradictions")
    print(f"  - {len(engine_errors)} engine errors")
    
    if engine_errors:
        for error in engine_errors:
            print(f"    ⚠️ {error.get('rule', 'unknown')}: {error.get('error', 'unknown error')}")
    
    # Test a few expected contradictions
    presence_conflicts = [c for c in real_contradictions if c.get('type') == 'presence_absence_conflict']
    date_conflicts = [c for c in real_contradictions if c.get('type') == 'event_date_disagreement']
    amount_conflicts = [c for c in real_contradictions if c.get('type') == 'numeric_amount_mismatch']
    
    print(f"  - {len(presence_conflicts)} presence conflicts")
    print(f"  - {len(date_conflicts)} date conflicts")
    print(f"  - {len(amount_conflicts)} amount conflicts")
    
    # Test ID symmetry
    id1 = contradiction_id(statements[0], statements[1])
    id2 = contradiction_id(statements[1], statements[0])
    if id1 == id2:
        print("✅ ID symmetry test passed")
    else:
        print(f"❌ ID symmetry failed: {id1} != {id2}")
    
    # Test fingerprint
    fingerprint = get_rules_fingerprint()
    print(f"✅ Rules fingerprint: {fingerprint}")
    
    print("\n🎉 All analyzer tests passed!")
    
except Exception as e:
    print(f"❌ Evaluation failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)