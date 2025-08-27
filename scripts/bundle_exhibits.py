#!/usr/bin/env python3
"""
Bundle contradictions into exhibit folders with CSV + JSON + original docs, then zip them.

This script reads contradictions_scored.json, groups by rule, and creates exhibit bundles
for each rule containing the contradictions data and related documents.
"""

import json
import csv
import os
import shutil
import zipfile
import argparse
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict


def load_contradictions(file_path: str) -> List[Dict[str, Any]]:
    """Load contradictions from JSON file."""
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found. Run analysis pipeline first.")
        return []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def group_by_rule(contradictions: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Group contradictions by rule type."""
    grouped = defaultdict(list)
    
    for contradiction in contradictions:
        rule = contradiction.get('rule') or contradiction.get('type', 'unknown')
        grouped[rule].append(contradiction)
    
    return dict(grouped)


def create_exhibit_folder(rule: str, contradictions: List[Dict[str, Any]], output_dir: str) -> str:
    """Create exhibit folder for a rule with JSON, CSV, and related documents."""
    rule_dir = Path(output_dir) / "exhibits" / rule
    rule_dir.mkdir(parents=True, exist_ok=True)
    
    # Write contradictions.json
    json_file = rule_dir / "contradictions.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(contradictions, f, indent=2, ensure_ascii=False)
    
    # Write contradictions.csv
    csv_file = rule_dir / "contradictions.csv"
    if contradictions:
        fieldnames = [
            'contradiction_id', 'type', 'rule', 'score', 'description',
            'event', 'party', 'person', 'case', 'location',
            'date_a', 'date_b', 'amount_a', 'amount_b',
            'status_a', 'status_b', 'role_a', 'role_b', 'file_path'
        ]
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            
            for contradiction in contradictions:
                # Create a clean row with only the fields we want
                row = {}
                for field in fieldnames:
                    row[field] = contradiction.get(field, '')
                writer.writerow(row)
    
    # Copy/symlink related documents
    documents_copied = 0
    for contradiction in contradictions:
        file_path = contradiction.get('file_path')
        if file_path and os.path.exists(file_path):
            # Convert to relative path from project root
            if file_path.startswith('/'):
                # Absolute path - convert to relative from project root
                file_path = file_path.lstrip('/')
            
            source_path = Path(file_path)
            if source_path.exists():
                dest_path = rule_dir / source_path.name
                try:
                    if not dest_path.exists():
                        shutil.copy2(source_path, dest_path)
                        documents_copied += 1
                except Exception as e:
                    print(f"Warning: Could not copy {source_path} to {dest_path}: {e}")
    
    print(f"Created exhibit folder for {rule}: {len(contradictions)} contradictions, {documents_copied} documents")
    return str(rule_dir)


def create_zip(folder_path: str) -> str:
    """Create a ZIP file for the exhibit folder."""
    zip_path = f"{folder_path}.zip"
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        folder_path = Path(folder_path)
        for file_path in folder_path.rglob('*'):
            if file_path.is_file():
                # Create archive path relative to the folder
                archive_path = file_path.relative_to(folder_path.parent)
                zipf.write(file_path, archive_path)
    
    print(f"Created ZIP: {zip_path}")
    return zip_path


def bundle_exhibits(contradictions_file: str, output_dir: str, specific_rule: str = None) -> List[str]:
    """Bundle contradictions into exhibit folders and ZIP files."""
    # Load contradictions
    contradictions = load_contradictions(contradictions_file)
    if not contradictions:
        print("No contradictions found.")
        return []
    
    # Group by rule
    grouped = group_by_rule(contradictions)
    
    # Filter to specific rule if requested
    if specific_rule:
        if specific_rule not in grouped:
            print(f"Error: Rule '{specific_rule}' not found in contradictions.")
            print(f"Available rules: {', '.join(grouped.keys())}")
            return []
        grouped = {specific_rule: grouped[specific_rule]}
    
    # Create exhibits for each rule
    zip_files = []
    for rule, rule_contradictions in grouped.items():
        folder_path = create_exhibit_folder(rule, rule_contradictions, output_dir)
        zip_path = create_zip(folder_path)
        zip_files.append(zip_path)
    
    return zip_files


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description="Bundle contradictions into exhibit folders with CSV + JSON + original docs, then zip them."
    )
    parser.add_argument(
        '--rule', 
        type=str, 
        help='Bundle only one specific rule (e.g., rules_dates, rules_presence)'
    )
    parser.add_argument(
        '--all', 
        action='store_true', 
        default=True,
        help='Bundle all rules (default behavior)'
    )
    parser.add_argument(
        '--contradictions-file',
        type=str,
        default='public/data/contradictions_scored.json',
        help='Path to contradictions_scored.json file'
    )
    parser.add_argument(
        '--output-dir',
        type=str, 
        default='output',
        help='Output directory for exhibits'
    )
    
    args = parser.parse_args()
    
    # Determine operation mode
    if args.rule:
        specific_rule = args.rule
    else:
        specific_rule = None
    
    print("🗂️  Bundle Exhibits - Contradiction Evidence Packaging")
    print("=" * 60)
    
    if specific_rule:
        print(f"Bundling rule: {specific_rule}")
    else:
        print("Bundling all rules")
    
    # Create exhibit bundles
    zip_files = bundle_exhibits(
        contradictions_file=args.contradictions_file,
        output_dir=args.output_dir,
        specific_rule=specific_rule
    )
    
    if zip_files:
        print(f"\n✅ Successfully created {len(zip_files)} exhibit bundle(s):")
        for zip_file in zip_files:
            print(f"  📦 {zip_file}")
    else:
        print("\n❌ No exhibit bundles created.")
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())