#!/usr/bin/env python3
"""
Timeline visualization script for contradictions.
Reads contradictions.json and creates timeline data for frontend visualization.
"""

import json
import os
from pathlib import Path
from collections import defaultdict
from datetime import datetime
import sys

def load_contradictions():
    """Load contradictions from public/data/contradictions.json"""
    contradictions_file = Path("public/data/contradictions.json")
    if not contradictions_file.exists():
        print("Error: contradictions.json not found. Expected at public/data/contradictions.json")
        return []
    
    try:
        with open(contradictions_file, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error parsing contradictions.json: {e}")
        return []
    except Exception as e:
        print(f"Error reading contradictions.json: {e}")
        return []

def extract_dates_from_contradiction(contradiction):
    """Extract all relevant dates from a contradiction record"""
    dates = set()
    
    # Extract from date_a and date_b fields
    if contradiction.get('date_a'):
        dates.add(contradiction['date_a'])
    if contradiction.get('date_b'):
        dates.add(contradiction['date_b'])
    
    # Extract from statement_a and statement_b date fields
    if contradiction.get('statement_a', {}).get('date'):
        dates.add(contradiction['statement_a']['date'])
    if contradiction.get('statement_b', {}).get('date'):
        dates.add(contradiction['statement_b']['date'])
    
    return list(dates)

def create_timeline_data(contradictions):
    """Create timeline data structure grouped by date"""
    timeline_data = defaultdict(lambda: {
        'ids': [],
        'contradictions': [],
        'rule_names': set()
    })
    
    for contradiction in contradictions:
        dates = extract_dates_from_contradiction(contradiction)
        contradiction_id = contradiction.get('contradiction_id', 'unknown')
        rule_name = contradiction.get('rule_name', contradiction.get('type', 'Unknown Rule'))
        
        # Add this contradiction to each date it's associated with
        for date in dates:
            if date:  # Skip empty/null dates
                timeline_data[date]['ids'].append(contradiction_id)
                timeline_data[date]['contradictions'].append(contradiction)
                timeline_data[date]['rule_names'].add(rule_name)
    
    # Convert to the required format
    result = []
    for date, data in sorted(timeline_data.items()):
        result.append({
            'date': date,
            'ids': data['ids'],
            'count': len(data['ids']),
            'rule_names': list(data['rule_names']),
            'contradictions': data['contradictions']
        })
    
    return result

def validate_date_format(date_str):
    """Validate that date string is in YYYY-MM-DD format"""
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def main():
    """Main timeline generation execution"""
    print("Loading contradictions...")
    contradictions = load_contradictions()
    
    if not contradictions:
        print("No contradictions found or failed to load.")
        return 1
    
    print(f"Loaded {len(contradictions)} contradictions")
    
    # Create timeline data
    timeline_data = create_timeline_data(contradictions)
    
    if not timeline_data:
        print("No timeline data generated. Check that contradictions have valid dates.")
        return 1
    
    print(f"Generated timeline data for {len(timeline_data)} dates")
    
    # Ensure output directory exists
    output_dir = Path("public/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write timeline data
    output_file = output_dir / "contradictions_timeline.json"
    try:
        with open(output_file, 'w') as f:
            json.dump(timeline_data, f, indent=2, default=str)
        print(f"Timeline data written to {output_file}")
        
        # Print summary
        total_contradictions = sum(item['count'] for item in timeline_data)
        print(f"\nSummary:")
        print(f"- Total dates with contradictions: {len(timeline_data)}")
        print(f"- Total contradiction instances: {total_contradictions}")
        print(f"- Date range: {timeline_data[0]['date']} to {timeline_data[-1]['date']}")
        
        return 0
        
    except Exception as e:
        print(f"Error writing timeline data: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())