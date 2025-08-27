#!/usr/bin/env python3
"""
Test script to validate AI notes functionality.
"""

import json
import sys
from pathlib import Path
import subprocess

def test_ai_notes_generation():
    """Test that AI notes are generated correctly."""
    print("Testing AI notes generation...")
    
    # Run the complete workflow
    print("1. Running analysis...")
    result = subprocess.run([
        sys.executable, 'scripts/run_analysis.py', '--demo'
    ], cwd=Path.cwd(), capture_output=True, text=True, env={'PYTHONPATH': str(Path.cwd())})
    
    if result.returncode != 0:
        print(f"❌ Analysis failed: {result.stderr}")
        return False
    
    print("2. Running scoring with AI notes...")
    result = subprocess.run([
        sys.executable, 'scripts/scoding.py'
    ], cwd=Path.cwd(), capture_output=True, text=True, env={'PYTHONPATH': str(Path.cwd())})
    
    if result.returncode != 0:
        print(f"❌ Scoring failed: {result.stderr}")
        return False
    
    # Check that AI notes were generated
    print("3. Verifying AI notes in output...")
    scored_file = Path("public/data/contradictions_scored.json")
    if not scored_file.exists():
        print("❌ contradictions_scored.json not found")
        return False
    
    with open(scored_file, 'r') as f:
        contradictions = json.load(f)
    
    if not contradictions:
        print("❌ No contradictions found")
        return False
    
    # Verify all contradictions have AI notes
    missing_notes = 0
    for i, contradiction in enumerate(contradictions):
        if 'ai_note' not in contradiction:
            print(f"❌ Contradiction {i} missing ai_note: {contradiction.get('type', 'unknown')}")
            missing_notes += 1
        else:
            ai_note = contradiction['ai_note']
            print(f"✅ {contradiction['type']}: {ai_note}")
            
            # Check format [Rule] conflict on {key} → {rationale}
            if not (ai_note.startswith('[') and '] conflict on ' in ai_note and ' → ' in ai_note):
                print(f"❌ AI note format invalid: {ai_note}")
                return False
    
    if missing_notes > 0:
        print(f"❌ {missing_notes} contradictions missing AI notes")
        return False
    
    print(f"✅ All {len(contradictions)} contradictions have properly formatted AI notes")
    return True

def test_csv_export():
    """Test that CSV export includes AI notes."""
    print("\nTesting CSV export...")
    
    csv_file = Path("public/data/contradictions_scored.csv")
    if not csv_file.exists():
        print("❌ contradictions_scored.csv not found")
        return False
    
    with open(csv_file, 'r') as f:
        lines = f.readlines()
    
    if len(lines) < 2:
        print("❌ CSV file too short")
        return False
    
    # Check header includes ai_note
    header = lines[0].strip()
    if 'ai_note' not in header:
        print("❌ CSV header missing ai_note column")
        return False
    
    # Check first data row has AI note
    if len(lines) > 1:
        first_row = lines[1].strip()
        if '[' not in first_row or '] conflict on ' not in first_row:
            print("❌ CSV data missing AI note content")
            return False
    
    print("✅ CSV export includes AI notes")
    return True

def main():
    """Run all tests."""
    print("🧪 Testing AI Notes Implementation")
    print("=" * 50)
    
    tests_passed = 0
    total_tests = 2
    
    if test_ai_notes_generation():
        tests_passed += 1
    
    if test_csv_export():
        tests_passed += 1
    
    print("\n" + "=" * 50)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! AI notes implementation is working correctly.")
        return 0
    else:
        print("❌ Some tests failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())