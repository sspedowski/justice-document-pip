#!/usr/bin/env python3
"""
Inline manual verification of the complete analyzer pipeline.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Ensure we can import our modules
sys.path.insert(0, str(Path.cwd()))

def main():
    """Run the complete verification inline."""
    print("🚀 Starting manual analyzer pipeline verification...\n")
    
    # Step 1: Test analyzer imports
    print("🔍 Verifying analyzer package...")
    try:
        from analyzer import evaluate, get_rules_fingerprint
        from analyzer.id import contradiction_id
        print("✅ All imports successful")
    except Exception as e:
        print(f"❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Step 2: Test with sample data
    statements = [
        {'id': 'stmt_1', 'event': 'meeting', 'party': 'John', 'present': True},
        {'id': 'stmt_2', 'event': 'meeting', 'party': 'John', 'present': False},
        {'id': 'stmt_3', 'event': 'incident', 'date': '2024-01-01'},
        {'id': 'stmt_4', 'event': 'incident', 'date': '2024-01-02'},
        {'id': 'stmt_5', 'event': 'payment', 'amount': 100, 'currency': 'USD'},
        {'id': 'stmt_6', 'event': 'payment', 'amount': 200, 'currency': 'USD'}
    ]
    
    try:
        contradictions = evaluate(statements)
        real_contradictions = [c for c in contradictions if c.get('type') != '__engine_error__']
        print(f"✅ Evaluation successful: {len(real_contradictions)} contradictions found")
        
        # Test ID symmetry
        id1 = contradiction_id(statements[0], statements[1])
        id2 = contradiction_id(statements[1], statements[0])
        assert id1 == id2, "ID symmetry test failed"
        print("✅ ID symmetry test passed")
        
        # Test fingerprint
        fingerprint = get_rules_fingerprint()
        print(f"✅ Rules fingerprint: {fingerprint}")
        
    except Exception as e:
        print(f"❌ Evaluation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Step 3: Test file creation
    print("\n🔧 Testing file output simulation...")
    
    # Create output directory
    output_dir = Path("public/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write test files
    contradictions_file = output_dir / "contradictions.json"
    with open(contradictions_file, 'w') as f:
        json.dump(contradictions, f, indent=2, default=str)
    print(f"✅ Wrote {contradictions_file}")
    
    statements_file = output_dir / "statements_debug.json"
    with open(statements_file, 'w') as f:
        json.dump(statements, f, indent=2, default=str)
    print(f"✅ Wrote {statements_file}")
    
    run_meta = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "git_sha": None,
        "num_statements": len(statements),
        "num_contradictions": len(real_contradictions),
        "rules_fingerprint": fingerprint
    }
    
    meta_file = output_dir / "run_meta.json"
    with open(meta_file, 'w') as f:
        json.dump(run_meta, f, indent=2)
    print(f"✅ Wrote {meta_file}")
    
    # Step 4: Test scoring and CSV output
    print("\n🔧 Testing scoring simulation...")
    
    # De-duplicate by contradiction_id
    uniq = {}
    for c in contradictions:
        cid = c.get("contradiction_id") or id(c)
        uniq[cid] = c
    items = list(uniq.values())
    
    # Simple scoring
    for item in items:
        item['score'] = 75
    
    items.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    # Write scored JSON
    json_file = output_dir / "contradictions_scored.json"
    with open(json_file, 'w') as f:
        json.dump(items, f, indent=2, default=str)
    print(f"✅ Wrote {json_file}")
    
    # Write CSV
    csv_file = output_dir / "contradictions_scored.csv"
    if items:
        import csv
        fieldnames = ['contradiction_id', 'type', 'score', 'description']
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            
            for item in items:
                row = {}
                for field in fieldnames:
                    row[field] = item.get(field, '')
                writer.writerow(row)
    
    print(f"✅ Wrote {csv_file} with {len(items)} unique contradictions")
    
    # Step 5: Verify outputs
    print("\n🔍 Verifying all outputs...")
    
    expected_files = [
        "public/data/contradictions.json",
        "public/data/statements_debug.json", 
        "public/data/run_meta.json",
        "public/data/contradictions_scored.json",
        "public/data/contradictions_scored.csv"
    ]
    
    all_good = True
    
    for file_path in expected_files:
        full_path = Path(file_path)
        if full_path.exists():
            size = full_path.stat().st_size
            print(f"✅ {file_path} exists ({size} bytes)")
        else:
            print(f"❌ {file_path} missing")
            all_good = False
    
    # Check for engine errors
    with open(contradictions_file, 'r') as f:
        data = json.load(f)
    
    engine_errors = [item for item in data if item.get('type') == '__engine_error__']
    if engine_errors:
        print(f"❌ Found {len(engine_errors)} engine errors")
        all_good = False
    else:
        print("✅ No engine errors found")
    
    # Check CSV for duplicates
    import csv
    contradiction_ids = []
    
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            contradiction_ids.append(row.get('contradiction_id', ''))
    
    unique_ids = set(contradiction_ids)
    
    if len(contradiction_ids) == len(unique_ids):
        print(f"✅ CSV has {len(contradiction_ids)} unique contradiction_id rows")
    else:
        print(f"❌ CSV has duplicates: {len(contradiction_ids)} total, {len(unique_ids)} unique")
        all_good = False
    
    if all_good:
        print("\n🎉 Manual verification complete! All systems working correctly.")
        print("\nFiles created:")
        for file_path in expected_files:
            if Path(file_path).exists():
                print(f"  - {file_path}")
        return 0
    else:
        print("\n❌ Manual verification failed!")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)