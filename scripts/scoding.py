#!/usr/bin/env python3
"""
Scoring and output generation for contradictions.
Loads contradictions.json and produces scored outputs with deduplication.
"""

import json
import csv
from pathlib import Path

# Import ai_notes module for summary generation
try:
    from . import ai_notes
except ImportError:
    import ai_notes

def load_contradictions():
    """Load contradictions from analysis output."""
    contradictions_file = Path("public/data/contradictions.json")
    if not contradictions_file.exists():
        print("Error: contradictions.json not found. Run run_analysis.py first.")
        return []
    
    with open(contradictions_file, 'r') as f:
        return json.load(f)

def score_contradiction(contradiction):
    """Assign scores to contradictions based on type and severity."""
    base_scores = {
        'presence_absence_conflict': 85,
        'event_date_disagreement': 75, 
        'numeric_amount_mismatch': 80,
        'status_change_inconsistency': 90,
        'location_contradiction': 70,
        'role_responsibility_conflict': 65,
        'date_range_overlap_conflict': 60,
        '__engine_error__': 0
    }
    
    contradiction_type = contradiction.get('type', 'unknown')
    base_score = base_scores.get(contradiction_type, 50)
    
    # Apply adjustments based on content
    adjustments = 0
    
    # Status rule adjustments
    if contradiction_type == 'status_change_inconsistency':
        status_a = contradiction.get('status_a', '').upper()
        status_b = contradiction.get('status_b', '').upper()
        
        if ('ACTIVE' in [status_a, status_b] and 'CLOSED' in [status_a, status_b]) or \
           ('SUBSTANTIATED' in [status_a, status_b] and 'UNSUBSTANTIATED' in [status_a, status_b]):
            adjustments += 10  # High-impact status changes
    
    # Location rule adjustments
    elif contradiction_type == 'location_contradiction':
        location_a = contradiction.get('location_a', '').lower()
        location_b = contradiction.get('location_b', '').lower()
        
        if any(word in location_a or word in location_b for word in ['court', 'hospital', 'police', 'office']):
            adjustments += 15  # Important institutional locations
    
    # Role rule adjustments 
    elif contradiction_type == 'role_responsibility_conflict':
        role_a = contradiction.get('role_a', '').lower()
        role_b = contradiction.get('role_b', '').lower()
        
        if any(word in role_a or word in role_b for word in ['victim', 'perpetrator', 'witness', 'suspect']):
            adjustments += 20  # Critical role contradictions
    
    # Date range rule adjustments
    elif contradiction_type == 'date_range_overlap_conflict':
        range_a = contradiction.get('range_a', '')
        range_b = contradiction.get('range_b', '')
        
        if range_a and range_b:
            adjustments += 5  # Minor boost for valid date ranges
    
    final_score = min(100, max(0, base_score + adjustments))
    return final_score

def enrich_contradictions(items):
    """Enrich contradictions with AI notes if missing."""
    needs_ai_notes = any('ai_note' not in item for item in items)
    
    if needs_ai_notes:
        print("Generating missing AI summary notes...")
        items = ai_notes.generate_notes_for_contradictions(items)
    
    return items

def write_outputs(contradictions):
    """Write scored contradictions to JSON and CSV files with deduplication."""
    # De-duplicate by contradiction_id
    uniq = {}
    for c in contradictions:
        cid = c.get("contradiction_id") or id(c)
        uniq[cid] = c
    items = list(uniq.values())
    
    # Score each contradiction
    for item in items:
        item['score'] = score_contradiction(item)
    
    # Sort by score (highest first)
    items.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    # Enrich with AI notes
    items = enrich_contradictions(items)
    
    output_dir = Path("public/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write scored JSON
    json_file = output_dir / "contradictions_scored.json"
    with open(json_file, 'w') as f:
        json.dump(items, f, indent=2, default=str)
    print(f"Wrote scored contradictions to {json_file}")
    
    # Write CSV
    csv_file = output_dir / "contradictions_scored.csv"
    if items:
        fieldnames = [
            'contradiction_id', 'type', 'score', 'description', 'ai_note',
            'event', 'party', 'person', 'case', 'location',
            'date_a', 'date_b', 'amount_a', 'amount_b',
            'status_a', 'status_b', 'role_a', 'role_b'
        ]
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            
            for item in items:
                # Create a clean row with only the fields we want
                row = {}
                for field in fieldnames:
                    row[field] = item.get(field, '')
                writer.writerow(row)
    
    print(f"Wrote CSV to {csv_file} with {len(items)} unique contradictions")

def main():
    """Main scoring execution."""
    print("Loading contradictions for scoring...")
    contradictions = load_contradictions()
    
    if not contradictions:
        print("No contradictions to score.")
        return 1
    
    print(f"Scoring {len(contradictions)} contradictions...")
    write_outputs(contradictions)
    
    print("✅ Scoring completed successfully")
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())