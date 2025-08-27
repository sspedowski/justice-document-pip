#!/usr/bin/env python3
"""
AI-powered summary note generation for contradictions.
Generates concise one-liner summaries for each contradiction.
"""

import json
from pathlib import Path


def generate_ai_note(contradiction):
    """Generate a one-liner AI summary note for a contradiction."""
    contradiction_type = contradiction.get('type', 'unknown')
    
    # Rule-specific summary generation
    if contradiction_type == 'presence_absence_conflict':
        party = contradiction.get('party', 'party')
        event = contradiction.get('event', 'event')
        return f"[Presence] conflict on {party} → simultaneous present/absent at {event}"
    
    elif contradiction_type == 'event_date_disagreement':
        event = contradiction.get('event', 'event')
        date_a = contradiction.get('date_a', 'date1')
        date_b = contradiction.get('date_b', 'date2')
        return f"[Date] conflict on {event} → disputed dates {date_a} vs {date_b}"
    
    elif contradiction_type == 'numeric_amount_mismatch':
        event = contradiction.get('event', 'event')
        amount_a = contradiction.get('amount_a', 'amount1')
        amount_b = contradiction.get('amount_b', 'amount2')
        currency = contradiction.get('currency', '')
        return f"[Amount] conflict on {event} → {amount_a}{currency} vs {amount_b}{currency}"
    
    elif contradiction_type == 'status_change_inconsistency':
        case = contradiction.get('case', 'case')
        status_a = contradiction.get('status_a', 'status1')
        status_b = contradiction.get('status_b', 'status2')
        return f"[Status] conflict on {case} → {status_a} vs {status_b}"
    
    elif contradiction_type == 'location_contradiction':
        event = contradiction.get('event', 'event')
        location_a = contradiction.get('location_a', 'location1')
        location_b = contradiction.get('location_b', 'location2')
        person = contradiction.get('person', contradiction.get('party', 'person'))
        return f"[Location] conflict on {person} → {location_a} vs {location_b} at {event}"
    
    elif contradiction_type == 'role_responsibility_conflict':
        event = contradiction.get('event', 'event')
        role_a = contradiction.get('role_a', 'role1')
        role_b = contradiction.get('role_b', 'role2')
        person = contradiction.get('person', contradiction.get('party', 'person'))
        return f"[Role] conflict on {person} → {role_a} vs {role_b} in {event}"
    
    elif contradiction_type == 'date_range_overlap_conflict':
        event = contradiction.get('event', 'event')
        return f"[DateRange] conflict on {event} → overlapping time periods"
    
    elif contradiction_type == '__engine_error__':
        rule = contradiction.get('rule', 'unknown')
        return f"[Engine] error in {rule} → analysis failure"
    
    else:
        # Generic fallback
        key = contradiction.get('event', contradiction.get('case', contradiction.get('party', 'unknown')))
        return f"[{contradiction_type.title()}] conflict on {key} → inconsistent data"


def generate_notes_for_contradictions(contradictions):
    """Generate AI notes for a list of contradictions."""
    updated_contradictions = []
    
    for contradiction in contradictions:
        # Create a copy to avoid modifying the original
        updated_contradiction = contradiction.copy()
        
        # Only generate note if missing
        if 'ai_note' not in updated_contradiction:
            updated_contradiction['ai_note'] = generate_ai_note(contradiction)
        
        updated_contradictions.append(updated_contradiction)
    
    return updated_contradictions


def generate(input_file=None, output_file=None):
    """
    Main function to generate AI notes for contradictions.
    
    Args:
        input_file: Path to contradictions JSON file (default: public/data/contradictions_scored.json)
        output_file: Path to output file (default: overwrites input file)
    """
    if input_file is None:
        input_file = Path("public/data/contradictions_scored.json")
    else:
        input_file = Path(input_file)
    
    if not input_file.exists():
        print(f"Error: Input file {input_file} not found.")
        return False
    
    # Load contradictions
    with open(input_file, 'r') as f:
        contradictions = json.load(f)
    
    if not contradictions:
        print("No contradictions found to process.")
        return True
    
    # Generate AI notes
    updated_contradictions = generate_notes_for_contradictions(contradictions)
    
    # Write back to file
    output_path = output_file if output_file else input_file
    with open(output_path, 'w') as f:
        json.dump(updated_contradictions, f, indent=2, default=str)
    
    notes_count = sum(1 for c in updated_contradictions if 'ai_note' in c)
    print(f"Generated AI notes for {notes_count} contradictions in {output_path}")
    
    return True


def main():
    """CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate AI summary notes for contradictions')
    parser.add_argument('--input', help='Input contradictions JSON file')
    parser.add_argument('--output', help='Output file (default: overwrites input)')
    
    args = parser.parse_args()
    
    success = generate(args.input, args.output)
    return 0 if success else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())