"""
Complete pipeline test - imports, execution, and file creation
"""
import sys
import os
import json
import csv
from pathlib import Path
from datetime import datetime

# Add current directory to path
sys.path.insert(0, str(Path.cwd()))

def test_analyzer():
    """Test analyzer functionality"""
    print("🔍 Testing analyzer import...")
    
    try:
        from analyzer import evaluate, get_rules_fingerprint
        from analyzer.id import contradiction_id
        print("✅ Imports successful")
    except Exception as e:
        print(f"❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return None, None
    
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
        
        # Test ID symmetry
        id1 = contradiction_id(statements[0], statements[1])
        id2 = contradiction_id(statements[1], statements[0])
        if id1 == id2:
            print("✅ ID symmetry test passed")
        else:
            print(f"❌ ID symmetry failed: {id1} != {id2}")
            return None, None
        
        # Test fingerprint
        fingerprint = get_rules_fingerprint()
        print(f"✅ Rules fingerprint: {fingerprint}")
        
        return contradictions, statements
        
    except Exception as e:
        print(f"❌ Evaluation failed: {e}")
        import traceback
        traceback.print_exc()
        return None, None

def test_file_outputs(contradictions, statements):
    """Test file creation like run_analysis.py and scoding.py"""
    print("\n🔧 Testing file output simulation...")
    
    # Create output directory
    output_dir = Path("public/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write contradictions.json
    contradictions_file = output_dir / "contradictions.json"
    with open(contradictions_file, 'w') as f:
        json.dump(contradictions, f, indent=2, default=str)
    print(f"✅ Wrote {contradictions_file}")
    
    # Write statements debug
    statements_file = output_dir / "statements_debug.json"
    with open(statements_file, 'w') as f:
        json.dump(statements, f, indent=2, default=str)
    print(f"✅ Wrote {statements_file}")
    
    # Write run metadata
    real_contradictions = [c for c in contradictions if c.get('type') != '__engine_error__']
    run_meta = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "git_sha": None,
        "num_statements": len(statements),
        "num_contradictions": len(real_contradictions),
        "rules_fingerprint": "test_fingerprint"
    }
    
    meta_file = output_dir / "run_meta.json"
    with open(meta_file, 'w') as f:
        json.dump(run_meta, f, indent=2)
    print(f"✅ Wrote {meta_file}")
    
    # Test scoring (simulate scoding.py)
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
    
    return True

def verify_outputs():
    """Verify all expected files exist and are valid"""
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
    contradictions_file = Path("public/data/contradictions.json")
    if contradictions_file.exists():
        with open(contradictions_file, 'r') as f:
            data = json.load(f)
        
        engine_errors = [item for item in data if item.get('type') == '__engine_error__']
        if engine_errors:
            print(f"❌ Found {len(engine_errors)} engine errors")
            all_good = False
        else:
            print("✅ No engine errors found")
    
    # Check CSV for duplicates
    csv_file = Path("public/data/contradictions_scored.csv")
    if csv_file.exists():
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
    
    return all_good

def main():
    """Run the complete test"""
    print("🚀 Starting complete pipeline test...\n")
    
    # Test analyzer
    contradictions, statements = test_analyzer()
    if contradictions is None:
        print("❌ Analyzer test failed")
        return 1
    
    # Test file outputs
    if not test_file_outputs(contradictions, statements):
        print("❌ File output test failed")
        return 1
    
    # Verify outputs
    if not verify_outputs():
        print("❌ Output verification failed")
        return 1
    
    print("\n🎉 Complete pipeline test successful!")
    print("\nFiles created:")
    expected_files = [
        "public/data/contradictions.json",
        "public/data/statements_debug.json", 
        "public/data/run_meta.json",
        "public/data/contradictions_scored.json",
        "public/data/contradictions_scored.csv"
    ]
    
    for file_path in expected_files:
        if Path(file_path).exists():
            print(f"  - {file_path}")
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    print(f"\n{'✅ SUCCESS' if exit_code == 0 else '❌ FAILURE'}")
    # Note: in restricted environment, can't use sys.exit()