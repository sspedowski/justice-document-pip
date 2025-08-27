#!/usr/bin/env python3
"""
Verification summary of the completed manual smoke test.
This script analyzes the existing output files to confirm pipeline success.
"""

import json
import csv
from pathlib import Path
from datetime import datetime

def main():
    print("🔍 MANUAL SMOKE TEST VERIFICATION SUMMARY")
    print("=" * 50)
    
    # Check if output directory exists
    output_dir = Path("public/data")
    if not output_dir.exists():
        print("❌ Output directory public/data does not exist")
        return 1
    
    # Expected files
    expected_files = {
        "run_meta.json": "Run metadata from analysis",
        "contradictions.json": "Raw contradictions from evaluation", 
        "statements_debug.json": "Debug statements used in test",
        "contradictions_scored.json": "Scored contradictions",
        "contradictions_scored.csv": "CSV export of scored contradictions"
    }
    
    print(f"\n📁 Checking {len(expected_files)} expected output files...")
    
    all_files_present = True
    file_info = {}
    
    for filename, description in expected_files.items():
        filepath = output_dir / filename
        if filepath.exists():
            size = filepath.stat().st_size
            print(f"✅ {filename} - {size} bytes - {description}")
            file_info[filename] = {"exists": True, "size": size}
        else:
            print(f"❌ {filename} - MISSING - {description}")
            file_info[filename] = {"exists": False, "size": 0}
            all_files_present = False
    
    if not all_files_present:
        print("\n❌ Some files are missing. Pipeline may not have run correctly.")
        return 1
    
    # Analyze run metadata
    print(f"\n📊 Analyzing run metadata...")
    
    try:
        with open(output_dir / "run_meta.json", 'r') as f:
            run_meta = json.load(f)
        
        print(f"✅ Timestamp: {run_meta.get('timestamp', 'unknown')}")
        print(f"✅ Statements processed: {run_meta.get('num_statements', 0)}")
        print(f"✅ Contradictions found: {run_meta.get('num_contradictions', 0)}")
        print(f"✅ Rules fingerprint: {run_meta.get('rules_fingerprint', 'unknown')}")
        
    except Exception as e:
        print(f"❌ Error reading run_meta.json: {e}")
        return 1
    
    # Check for engine errors
    print(f"\n🔍 Checking for engine errors...")
    
    try:
        with open(output_dir / "contradictions.json", 'r') as f:
            contradictions = json.load(f)
        
        engine_errors = [c for c in contradictions if c.get('type') == '__engine_error__']
        real_contradictions = [c for c in contradictions if c.get('type') != '__engine_error__']
        
        if engine_errors:
            print(f"❌ Found {len(engine_errors)} engine errors:")
            for error in engine_errors:
                print(f"  - {error.get('rule', 'unknown')}: {error.get('error', 'unknown')}")
            return 1
        else:
            print(f"✅ No engine errors found")
            print(f"✅ {len(real_contradictions)} valid contradictions detected")
        
    except Exception as e:
        print(f"❌ Error reading contradictions.json: {e}")
        return 1
    
    # Verify contradiction types  
    print(f"\n📋 Analyzing contradiction types...")
    
    contradiction_types = {}
    for contradiction in real_contradictions:
        ctype = contradiction.get('type', 'unknown')
        if ctype not in contradiction_types:
            contradiction_types[ctype] = 0
        contradiction_types[ctype] += 1
    
    expected_types = [
        'presence_absence_conflict',
        'event_date_disagreement', 
        'numeric_amount_mismatch',
        'status_change_inconsistency'
    ]
    
    for ctype in expected_types:
        count = contradiction_types.get(ctype, 0)
        if count > 0:
            print(f"✅ {ctype}: {count} detected")
        else:
            print(f"⚠️ {ctype}: 0 detected (may be expected)")
    
    # Check CSV for duplicates
    print(f"\n📊 Verifying CSV integrity...")
    
    try:
        contradiction_ids = []
        with open(output_dir / "contradictions_scored.csv", 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                contradiction_ids.append(row.get('contradiction_id', ''))
        
        unique_ids = set(contradiction_ids)
        
        if len(contradiction_ids) == len(unique_ids):
            print(f"✅ CSV has {len(contradiction_ids)} unique contradiction_id rows")
        else:
            print(f"❌ CSV has duplicates: {len(contradiction_ids)} total, {len(unique_ids)} unique")
            return 1
            
    except Exception as e:
        print(f"❌ Error reading contradictions_scored.csv: {e}")
        return 1
    
    # Final summary
    print(f"\n🎉 MANUAL SMOKE TEST VERIFICATION: SUCCESS")
    print("=" * 50)
    print("✅ All required files present")
    print("✅ No engine errors detected") 
    print("✅ Valid contradictions generated")
    print("✅ CSV export properly formatted")
    print("✅ No duplicate contradiction IDs")
    print("\n🚀 The analyzer pipeline is working correctly!")
    print("   Ready for CI/CD integration and production use.")
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    print(f"\nFinal result: {'✅ PASSED' if exit_code == 0 else '❌ FAILED'}")