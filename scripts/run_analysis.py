#!/usr/bin/env python3
"""
Run analysis pipeline and generate run metadata.
"""

import json
import argparse
import subprocess
import os
from datetime import datetime
from pathlib import Path
import sys

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from analyzer.evaluate import analyze_documents

def get_git_sha():
    """Get current git SHA or return null if not available."""
    try:
        result = subprocess.run(['git', 'rev-parse', 'HEAD'], 
                              capture_output=True, text=True, cwd=PROJECT_ROOT)
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None

def load_demo_documents():
    """Load demo documents for testing."""
    return [
        {
            'id': 'demo_1',
            'fileName': 'demo_report_1.txt',
            'title': 'Initial Police Report',
            'textContent': 'The incident occurred on 12/25/2022. Witness John Smith was present and provided a statement. The damage cost was estimated at $1,500.',
            'uploadedAt': '2023-01-01T00:00:00Z'
        },
        {
            'id': 'demo_2', 
            'fileName': 'demo_report_2.txt',
            'title': 'Revised Police Report',
            'textContent': 'The incident occurred on 12/26/2022. Witness John Smith was not present at the scene. The damage cost was $2,000.',
            'uploadedAt': '2023-01-02T00:00:00Z'
        },
        {
            'id': 'demo_3',
            'fileName': 'demo_witness.txt', 
            'title': 'Witness Statement',
            'textContent': 'I was there during the incident on December 25th, 2022. The evidence was clearly visible.',
            'uploadedAt': '2023-01-01T12:00:00Z'
        }
    ]

def load_real_documents():
    """Load real documents from justice-documents.json."""
    justice_docs_path = PROJECT_ROOT / 'public' / 'app' / 'data' / 'justice-documents.json'
    
    if justice_docs_path.exists():
        try:
            with open(justice_docs_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load justice-documents.json: {e}")
    
    # Fallback to demo documents
    print("Using demo documents as fallback")
    return load_demo_documents()

def main():
    parser = argparse.ArgumentParser(description='Run justice document analysis')
    parser.add_argument('--demo', action='store_true', 
                       help='Use demo documents instead of real ones')
    parser.add_argument('--output-dir', default='public/data',
                       help='Output directory for results')
    
    args = parser.parse_args()
    
    # Ensure output directory exists
    output_dir = PROJECT_ROOT / args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load documents
    if args.demo:
        documents = load_demo_documents()
        print("Running analysis with demo documents")
    else:
        documents = load_real_documents()
        print(f"Running analysis with {len(documents)} documents")
    
    # Run analysis
    print("Analyzing documents for contradictions...")
    results = analyze_documents(documents)
    
    # Check for engine errors
    engine_errors = [c for c in results['contradictions'] if c['type'] == '__engine_error__']
    if engine_errors:
        print(f"WARNING: {len(engine_errors)} engine errors detected:")
        for error in engine_errors:
            print(f"  - {error['description']}")
    
    # Write contradictions.json
    contradictions_file = output_dir / 'contradictions.json'
    with open(contradictions_file, 'w', encoding='utf-8') as f:
        json.dump({
            'contradictions': results['contradictions'],
            'metadata': results['analysis_metadata']
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {contradictions_file}")
    
    # Write statements_debug.json  
    statements_file = output_dir / 'statements_debug.json'
    with open(statements_file, 'w', encoding='utf-8') as f:
        json.dump({
            'statements': results['statements'],
            'metadata': {
                'total_statements': len(results['statements']),
                'analysis_timestamp': datetime.utcnow().isoformat() + 'Z'
            }
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {statements_file}")
    
    # Write run_meta.json
    run_meta = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'git_sha': get_git_sha(),
        'num_statements': results['num_statements'],
        'num_contradictions': results['num_contradictions'],
        'rules_fingerprint': results['rules_fingerprint'],
        'demo_mode': args.demo,
        'engine_errors': len(engine_errors)
    }
    
    run_meta_file = output_dir / 'run_meta.json'
    with open(run_meta_file, 'w', encoding='utf-8') as f:
        json.dump(run_meta, f, indent=2, ensure_ascii=False)
    print(f"Wrote {run_meta_file}")
    
    # Summary
    print(f"\nAnalysis complete:")
    print(f"  Statements: {results['num_statements']}")
    print(f"  Contradictions: {results['num_contradictions']}")
    print(f"  Engine errors: {len(engine_errors)}")
    print(f"  Rules fingerprint: {results['rules_fingerprint']}")
    
    # Exit with error code if engine errors found
    if engine_errors:
        sys.exit(1)

if __name__ == '__main__':
    main()