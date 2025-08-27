#!/usr/bin/env python3
"""
Heatmap data generation for contradictions.
Reads contradictions_scored.json and aggregates counts by rule vs. party.
Outputs public/data/heatmap.json with format:
{ "rule": "status_flip_without_transition", "party": "Noel", "count": 3 }
"""

import json
from pathlib import Path
from collections import defaultdict


def load_contradictions():
    """Load scored contradictions from JSON file."""
    contradictions_file = Path("public/data/contradictions_scored.json")
    if not contradictions_file.exists():
        print("Error: contradictions_scored.json not found. Run scoding.py first.")
        return []
    
    with open(contradictions_file, 'r') as f:
        return json.load(f)


def extract_party_from_contradiction(contradiction):
    """Extract party/person information from contradiction data."""
    # Try different fields where party information might be stored
    party_fields = ['party', 'person']
    
    for field in party_fields:
        if field in contradiction and contradiction[field]:
            return contradiction[field]
    
    # If no direct party field, try to extract from statement data
    for stmt_field in ['statement_a', 'statement_b']:
        if stmt_field in contradiction:
            stmt = contradiction[stmt_field]
            if isinstance(stmt, dict):
                for field in party_fields:
                    if field in stmt and stmt[field]:
                        return stmt[field]
    
    # Default to 'Unknown' if no party information found
    return 'Unknown'


def aggregate_heatmap_data(contradictions):
    """Aggregate contradictions by rule type and party."""
    # Use defaultdict for easy counting
    heatmap_counts = defaultdict(int)
    
    for contradiction in contradictions:
        rule = contradiction.get('type', 'unknown_rule')
        party = extract_party_from_contradiction(contradiction)
        
        # Create key for this rule-party combination
        key = (rule, party)
        heatmap_counts[key] += 1
    
    # Convert to list of dictionaries for JSON output
    heatmap_data = []
    for (rule, party), count in heatmap_counts.items():
        heatmap_data.append({
            'rule': rule,
            'party': party,
            'count': count
        })
    
    # Sort by count (descending) for better visualization
    heatmap_data.sort(key=lambda x: x['count'], reverse=True)
    
    return heatmap_data


def write_heatmap_json(heatmap_data):
    """Write heatmap data to JSON file."""
    output_dir = Path("public/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    heatmap_file = output_dir / "heatmap.json"
    with open(heatmap_file, 'w') as f:
        json.dump(heatmap_data, f, indent=2)
    
    print(f"Wrote heatmap data to {heatmap_file}")
    return heatmap_file


def main():
    """Main heatmap data generation execution."""
    print("Loading contradictions for heatmap generation...")
    contradictions = load_contradictions()
    
    if not contradictions:
        print("No contradictions found.")
        return 1
    
    print(f"Processing {len(contradictions)} contradictions...")
    heatmap_data = aggregate_heatmap_data(contradictions)
    
    print(f"Generated {len(heatmap_data)} rule-party combinations")
    
    # Show summary of what was found
    total_count = sum(item['count'] for item in heatmap_data)
    print(f"Total contradiction instances: {total_count}")
    
    if heatmap_data:
        print("\nTop combinations:")
        for item in heatmap_data[:5]:  # Show top 5
            print(f"  {item['rule']} + {item['party']}: {item['count']}")
    
    heatmap_file = write_heatmap_json(heatmap_data)
    
    print("✅ Heatmap data generation completed successfully")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())