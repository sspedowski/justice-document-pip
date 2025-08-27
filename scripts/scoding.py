#!/usr/bin/env python3
"""
Scoring and output generation with de-duplication.
"""

import json
import csv
import argparse
from pathlib import Path
from typing import List, Dict, Any

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent

def load_contradictions():
    """Load contradictions from analysis output."""
    contradictions_file = PROJECT_ROOT / 'public' / 'data' / 'contradictions.json'
    
    if not contradictions_file.exists():
        print(f"No contradictions file found at {contradictions_file}")
        return []
    
    try:
        with open(contradictions_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('contradictions', [])
    except Exception as e:
        print(f"Error loading contradictions: {e}")
        return []

def deduplicate_contradictions(contradictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    De-duplicate contradictions by contradiction_id before sorting/writing.
    """
    seen_ids = set()
    deduplicated = []
    
    for contradiction in contradictions:
        contradiction_id = contradiction.get('contradiction_id')
        if contradiction_id and contradiction_id not in seen_ids:
            seen_ids.add(contradiction_id)
            deduplicated.append(contradiction)
        elif not contradiction_id:
            # Keep contradictions without IDs (shouldn't happen but handle gracefully)
            deduplicated.append(contradiction)
    
    return deduplicated

def sort_contradictions(contradictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sort contradictions by confidence (descending) then by type."""
    return sorted(contradictions, key=lambda x: (
        -x.get('confidence', 0.0),  # Higher confidence first
        x.get('type', ''),          # Then by type alphabetically
        x.get('contradiction_id', '')  # Then by ID for consistency
    ))

def write_outputs(contradictions: List[Dict[str, Any]], output_dir: Path):
    """Write deduplicated and sorted contradictions to various output formats."""
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # De-duplicate by contradiction_id
    deduplicated = deduplicate_contradictions(contradictions)
    print(f"De-duplicated {len(contradictions)} -> {len(deduplicated)} contradictions")
    
    # Sort contradictions
    sorted_contradictions = sort_contradictions(deduplicated)
    
    # Write JSON output
    json_file = output_dir / 'contradictions_scored.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({
            'contradictions': sorted_contradictions,
            'metadata': {
                'total_contradictions': len(sorted_contradictions),
                'original_count': len(contradictions),
                'duplicates_removed': len(contradictions) - len(deduplicated)
            }
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {json_file}")
    
    # Write CSV output with unique contradiction_id rows
    csv_file = output_dir / 'contradictions.csv'
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        if sorted_contradictions:
            fieldnames = ['contradiction_id', 'type', 'description', 'confidence', 'rule', 'num_statements']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for contradiction in sorted_contradictions:
                writer.writerow({
                    'contradiction_id': contradiction.get('contradiction_id', ''),
                    'type': contradiction.get('type', ''),
                    'description': contradiction.get('description', ''),
                    'confidence': contradiction.get('confidence', 0.0),
                    'rule': contradiction.get('rule', ''),
                    'num_statements': len(contradiction.get('statements', []))
                })
    print(f"Wrote {csv_file}")
    
    # Write detailed report
    report_file = output_dir / 'contradictions_report.txt'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("JUSTICE DOCUMENT ANALYSIS - CONTRADICTIONS REPORT\\n")
        f.write("=" * 50 + "\\n\\n")
        f.write(f"Total contradictions found: {len(sorted_contradictions)}\\n")
        f.write(f"Original count before de-duplication: {len(contradictions)}\\n")
        f.write(f"Duplicates removed: {len(contradictions) - len(deduplicated)}\\n\\n")
        
        for i, contradiction in enumerate(sorted_contradictions, 1):
            f.write(f"{i}. {contradiction.get('type', 'Unknown Type')}\\n")
            f.write(f"   ID: {contradiction.get('contradiction_id', 'N/A')}\\n")
            f.write(f"   Description: {contradiction.get('description', 'No description')}\\n")
            f.write(f"   Confidence: {contradiction.get('confidence', 0.0):.2f}\\n")
            f.write(f"   Rule: {contradiction.get('rule', 'Unknown')}\\n")
            f.write(f"   Statements: {len(contradiction.get('statements', []))}\\n")
            f.write("\\n")
    print(f"Wrote {report_file}")

def main():
    parser = argparse.ArgumentParser(description='Score and output contradictions')
    parser.add_argument('--output-dir', default='public/data',
                       help='Output directory for scored results')
    parser.add_argument('--input-file', 
                       help='Input contradictions JSON file (default: auto-detect)')
    
    args = parser.parse_args()
    
    # Load contradictions
    if args.input_file:
        input_path = Path(args.input_file)
        if not input_path.exists():
            print(f"Input file not found: {input_path}")
            return 1
        
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            contradictions = data.get('contradictions', [])
    else:
        contradictions = load_contradictions()
    
    if not contradictions:
        print("No contradictions to process")
        return 0
    
    # Process and write outputs
    output_dir = PROJECT_ROOT / args.output_dir
    write_outputs(contradictions, output_dir)
    
    print(f"\\nScoring complete. Processed {len(contradictions)} contradictions.")
    
    return 0

if __name__ == '__main__':
    exit(main())