#!/usr/bin/env python3
"""
Quick pipeline test - verify core functionality works
"""

import sys
import os
import json
from pathlib import Path

# Add repo root to Python path
repo_root = Path(__file__).resolve().parent
sys.path.insert(0, str(repo_root))

def test_analyzer_import():
    """Test that analyzer package imports correctly"""
    print("🔍 Testing analyzer imports...")
    try:
        import analyzer
        print("✅ analyzer package imported")
        
        from analyzer import evaluate, get_rules_fingerprint
        print("✅ analyzer functions imported")
        
        from analyzer.all_rules import get_all_rule_functions
        print("✅ all_rules module imported")
        
        # Test rule functions exist
        rule_functions = get_all_rule_functions()
        print(f"✅ Found {len(rule_functions)} rule functions")
        
        for func in rule_functions:
            print(f"   - {func.__name__}")
        
        return True
        
    except Exception as e:
        print(f"❌ Analyzer import failed: {e}")
        return False

def test_basic_evaluation():
    """Test basic contradiction detection"""
    print("\n🧪 Testing basic evaluation...")
    try:
        import analyzer
        
        # Simple test statements
        statements = [
            {
                'id': 'test_1',
                'event': 'test_meeting',
                'party': 'Test Person',
                'present': True
            },
            {
                'id': 'test_2',
                'event': 'test_meeting', 
                'party': 'Test Person',
                'present': False
            }
        ]
        
        contradictions = analyzer.evaluate(statements)
        print(f"✅ Evaluation completed, found {len(contradictions)} contradictions")
        
        # Check for presence conflict
        presence_conflicts = [c for c in contradictions if c.get('type') == 'presence_absence_conflict']
        if presence_conflicts:
            print("✅ Presence absence conflict detected correctly")
        else:
            print("⚠️ No presence absence conflict detected")
        
        return True
        
    except Exception as e:
        print(f"❌ Basic evaluation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_data_files():
    """Test that data files exist and are valid"""
    print("\n📁 Testing data files...")
    
    data_dir = repo_root / "public" / "data"
    
    required_files = [
        "contradictions.json",
        "run_meta.json", 
        "statements_debug.json"
    ]
    
    all_good = True
    
    for filename in required_files:
        filepath = data_dir / filename
        if filepath.exists():
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                print(f"✅ {filename} exists and is valid JSON")
            except json.JSONDecodeError:
                print(f"❌ {filename} exists but has invalid JSON")
                all_good = False
        else:
            print(f"❌ {filename} does not exist")
            all_good = False
    
    return all_good

def test_scoring_files():
    """Test that scoring output files exist"""
    print("\n📊 Testing scoring files...")
    
    data_dir = repo_root / "public" / "data"
    
    scoring_files = [
        "contradictions_scored.json",
        "contradictions_scored.csv"
    ]
    
    all_good = True
    
    for filename in scoring_files:
        filepath = data_dir / filename
        if filepath.exists():
            print(f"✅ {filename} exists")
            
            if filename.endswith('.json'):
                try:
                    with open(filepath, 'r') as f:
                        data = json.load(f)
                    print(f"   - Valid JSON with {len(data)} items")
                except json.JSONDecodeError:
                    print(f"   - ❌ Invalid JSON")
                    all_good = False
            elif filename.endswith('.csv'):
                try:
                    with open(filepath, 'r') as f:
                        lines = f.readlines()
                    print(f"   - CSV with {len(lines)} lines")
                except Exception as e:
                    print(f"   - ❌ Error reading CSV: {e}")
                    all_good = False
        else:
            print(f"❌ {filename} does not exist")
            all_good = False
    
    return all_good

def main():
    """Run quick pipeline test"""
    print("🚀 Justice Document Manager - Quick Pipeline Test")
    print("=" * 55)
    
    tests = [
        ("Analyzer Import", test_analyzer_import),
        ("Basic Evaluation", test_basic_evaluation), 
        ("Data Files", test_data_files),
        ("Scoring Files", test_scoring_files)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n🔬 {test_name}")
        results[test_name] = test_func()
    
    print("\n" + "=" * 55)
    print("📊 TEST SUMMARY")
    print("=" * 55)
    
    passed = 0
    total = len(tests)
    
    for test_name, result in results.items():
        status = "PASS" if result else "FAIL" 
        emoji = "✅" if result else "❌"
        print(f"{emoji} {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Pipeline appears to be working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Check the output above for details.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)