#!/usr/bin/env python3
"""
Manual smoke test runner to verify the analyzer pipeline works end-to-end.
This simulates the commands we need to test.
"""

import subprocess
import sys
import json
from pathlib import Path

def run_command(cmd, description):
    """Run a command and report results."""
    print(f"\n🔄 {description}")
    print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd="/workspaces/spark-template")
        
        if result.returncode == 0:
            print(f"✅ {description} - SUCCESS")
            if result.stdout.strip():
                print("STDOUT:", result.stdout.strip())
        else:
            print(f"❌ {description} - FAILED (exit code: {result.returncode})")
            if result.stderr.strip():
                print("STDERR:", result.stderr.strip())
            if result.stdout.strip():
                print("STDOUT:", result.stdout.strip())
            return False
            
    except Exception as e:
        print(f"❌ {description} - EXCEPTION: {e}")
        return False
    
    return True

def check_files_exist():
    """Check that expected output files exist."""
    print("\n🔍 Checking output files exist...")
    
    expected_files = [
        "public/data/contradictions.json",
        "public/data/statements_debug.json", 
        "public/data/run_meta.json",
        "public/data/contradictions_scored.json",
        "public/data/contradictions_scored.csv"
    ]
    
    base_path = Path("/workspaces/spark-template")
    all_exist = True
    
    for file_path in expected_files:
        full_path = base_path / file_path
        if full_path.exists():
            print(f"✅ {file_path} exists ({full_path.stat().st_size} bytes)")
        else:
            print(f"❌ {file_path} missing")
            all_exist = False
    
    return all_exist

def check_csv_duplicates():
    """Check that CSV has no duplicate contradiction_id rows."""
    print("\n🔍 Checking CSV for duplicates...")
    
    csv_path = Path("/workspaces/spark-template/public/data/contradictions_scored.csv")
    if not csv_path.exists():
        print("❌ CSV file not found")
        return False
    
    import csv
    contradiction_ids = []
    
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            contradiction_ids.append(row.get('contradiction_id', ''))
    
    unique_ids = set(contradiction_ids)
    
    if len(contradiction_ids) == len(unique_ids):
        print(f"✅ CSV has {len(contradiction_ids)} unique contradiction_id rows")
        return True
    else:
        print(f"❌ CSV has duplicates: {len(contradiction_ids)} total, {len(unique_ids)} unique")
        return False

def check_engine_errors():
    """Check for engine errors in contradictions.json."""
    print("\n🔍 Checking for engine errors...")
    
    json_path = Path("/workspaces/spark-template/public/data/contradictions.json")
    if not json_path.exists():
        print("❌ contradictions.json not found")
        return False
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    engine_errors = [item for item in data if item.get('type') == '__engine_error__']
    
    if engine_errors:
        print(f"❌ Found {len(engine_errors)} engine errors:")
        for error in engine_errors:
            print(f"  - {error.get('rule', 'unknown')}: {error.get('error', 'unknown error')}")
        return False
    else:
        print("✅ No engine errors found")
        return True

def main():
    """Run the complete smoke test."""
    print("🚀 Starting analyzer pipeline smoke test...")
    
    # Test 1: Import test
    if not run_command([sys.executable, "test_imports.py"], "Import test"):
        return 1
    
    # Test 2: Run analysis demo
    if not run_command([sys.executable, "scripts/run_analysis.py", "--demo"], "Run analysis demo"):
        return 1
    
    # Test 3: Run scoring
    if not run_command([sys.executable, "scripts/scoding.py"], "Run scoring"):
        return 1
    
    # Test 4: Run pytest
    if not run_command([sys.executable, "-m", "pytest", "-q", "tests/analyzer/"], "Run pytest"):
        return 1
    
    # Test 5: Check files exist
    if not check_files_exist():
        return 1
    
    # Test 6: Check CSV duplicates
    if not check_csv_duplicates():
        return 1
    
    # Test 7: Check engine errors
    if not check_engine_errors():
        return 1
    
    print("\n🎉 All smoke tests passed! Pipeline is working correctly.")
    return 0

if __name__ == "__main__":
    sys.exit(main())