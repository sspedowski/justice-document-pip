#!/usr/bin/env python3
"""
Date-based duplicate detection integration for the Justice Document Pipeline.

This script runs as part of the main pipeline to catch duplicate documents
that share the same date but may have subtle wording changes.

Usage:
  python scripts/run_duplicate_detection.py --input input/ --output output/duplicates/
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description='Run date-based duplicate detection')
    parser.add_argument('--input', default='input', help='Input directory with PDFs')
    parser.add_argument('--output', default='output/duplicates', help='Output directory for duplicate reports')
    parser.add_argument('--names', default='Noel,Andy Maki,Banister,Russell,Verde', help='Names to track in changes')
    parser.add_argument('--integration', action='store_true', help='Generate integration report for main pipeline')
    args = parser.parse_args()

    script_dir = Path(__file__).parent
    compare_script = script_dir / 'compare_by_date.py'
    
    if not compare_script.exists():
        print(f"ERROR: compare_by_date.py not found at {compare_script}", file=sys.stderr)
        return 1

    # Run the date comparison script
    cmd = [
        sys.executable, str(compare_script),
        '--input', args.input,
        '--out', args.output,
        '--names', args.names
    ]
    
    print(f"Running duplicate detection: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"ERROR running duplicate detection: {result.stderr}", file=sys.stderr)
        return result.returncode
    
    print(result.stdout)
    
    # If integration mode, generate summary for main pipeline
    if args.integration:
        generate_integration_summary(args.output)
    
    return 0

def generate_integration_summary(output_dir: str):
    """Generate a summary file for the main pipeline to consume"""
    output_path = Path(output_dir)
    csv_path = output_path / 'changes_summary.csv'
    
    summary = {
        'duplicate_detection_completed': True,
        'reports_available': False,
        'duplicate_pairs_found': 0,
        'index_url': str(output_path / 'index.html'),
        'csv_report': str(csv_path) if csv_path.exists() else None
    }
    
    if csv_path.exists():
        summary['reports_available'] = True
        # Count duplicate pairs from CSV
        try:
            import csv
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                summary['duplicate_pairs_found'] = sum(1 for row in reader)
        except Exception as e:
            print(f"Warning: Could not count CSV rows: {e}", file=sys.stderr)
    
    # Write summary for pipeline integration
    summary_path = output_path / 'detection_summary.json'
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    
    print(f"Integration summary written to: {summary_path}")
    
    if summary['duplicate_pairs_found'] > 0:
        print(f"🚨 FOUND {summary['duplicate_pairs_found']} potential duplicate pairs!")
        print(f"📊 View report: {summary['index_url']}")
    else:
        print("✅ No date-based duplicates found")

if __name__ == '__main__':
    sys.exit(main())