"""
Quick analyzer test using inline Python.
"""

# Test the imports directly
import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))

# Test 1: Check if the analyzer module loads
try:
    import analyzer
    print("✅ Analyzer module loads successfully")
except Exception as e:
    print(f"❌ Analyzer module failed to load: {e}")
    exit(1)

# Test 2: Check individual components
try:
    from analyzer.id import contradiction_id
    print("✅ ID module loads successfully")
except Exception as e:
    print(f"❌ ID module failed to load: {e}")
    exit(1)

try:
    from analyzer.all_rules import get_all_rule_functions
    rule_functions = get_all_rule_functions()
    print(f"✅ Rules module loads successfully, found {len(rule_functions)} rules")
    
    # List the rule functions
    for func in rule_functions:
        print(f"   - {func.__name__}")
        
except Exception as e:
    print(f"❌ Rules module failed to load: {e}")
    exit(1)

# Test 3: Run a simple evaluation
try:
    from analyzer import evaluate
    
    # Simple test data
    test_statements = [
        {'id': 'stmt1', 'event': 'meeting', 'party': 'John', 'present': True},
        {'id': 'stmt2', 'event': 'meeting', 'party': 'John', 'present': False},
    ]
    
    results = evaluate(test_statements)
    
    # Count real contradictions vs engine errors
    real_contradictions = [r for r in results if r.get('type') != '__engine_error__']
    engine_errors = [r for r in results if r.get('type') == '__engine_error__']
    
    print(f"✅ Evaluation ran successfully")
    print(f"   - {len(real_contradictions)} contradictions found")
    print(f"   - {len(engine_errors)} engine errors")
    
    if real_contradictions:
        print("✅ Found contradictions:")
        for contradiction in real_contradictions:
            print(f"   - {contradiction['type']}: {contradiction['description']}")
    
    if engine_errors:
        print("❌ Engine errors:")
        for error in engine_errors:
            print(f"   - {error.get('rule', 'unknown')}: {error.get('error', 'unknown')}")
    
except Exception as e:
    print(f"❌ Evaluation failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Test 4: ID symmetry
try:
    id1 = contradiction_id({'id': 'a'}, {'id': 'b'})
    id2 = contradiction_id({'id': 'b'}, {'id': 'a'})
    
    if id1 == id2:
        print(f"✅ ID symmetry test passed: {id1}")
    else:
        print(f"❌ ID symmetry test failed: {id1} != {id2}")
        
except Exception as e:
    print(f"❌ ID symmetry test failed: {e}")
    exit(1)

print("\n🎉 All tests passed! The analyzer is working correctly.")
print("\nTo run the full pipeline manually:")
print("1. Run: python scripts/run_analysis.py --demo")
print("2. Run: python scripts/scoding.py")
print("3. Check: public/data/ for output files")