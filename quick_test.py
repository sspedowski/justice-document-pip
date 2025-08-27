import sys
from pathlib import Path

# Print current path setup
print("Current working directory:", Path.cwd())
print("Python path:")
for p in sys.path:
    print(f"  {p}")

# Try import
try:
    print("\nTesting import...")
    sys.path.insert(0, str(Path.cwd()))
    from analyzer import evaluate, get_rules_fingerprint
    from analyzer.id import contradiction_id
    print("✅ SUCCESS: All imports successful!")
    
    # Quick test
    statements = [
        {'id': 'test1', 'event': 'meeting', 'party': 'John', 'present': True},
        {'id': 'test2', 'event': 'meeting', 'party': 'John', 'present': False}
    ]
    
    result = evaluate(statements)
    print(f"✅ SUCCESS: Evaluation returned {len(result)} results")
    
    # Show actual results
    for i, r in enumerate(result):
        print(f"  Result {i+1}: {r.get('type', 'unknown')} - {r.get('description', 'no description')}")
    
    # Test ID
    test_id = contradiction_id(statements[0], statements[1])
    print(f"✅ SUCCESS: Generated ID: {test_id}")
    
    fingerprint = get_rules_fingerprint()
    print(f"✅ SUCCESS: Rules fingerprint: {fingerprint}")
    
except Exception as e:
    print(f"❌ FAILED: {e}")
    import traceback
    traceback.print_exc()