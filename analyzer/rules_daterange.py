"""
Date range contradiction detection rules.
"""

from .id import contradiction_id
from datetime import datetime

def date_range_overlap_conflict(statements):
    """
    Detect conflicts in overlapping date ranges.
    """
    contradictions = []
    
    # Group statements by event and person
    ranges = {}
    for stmt in statements:
        event_key = stmt.get('event', 'unknown')
        person_key = stmt.get('person', stmt.get('party', 'unknown'))
        key = f"{event_key}|{person_key}"
        
        start_date = stmt.get('start_date')
        end_date = stmt.get('end_date')
        
        if start_date and end_date:
            if key not in ranges:
                ranges[key] = []
            ranges[key].append({
                'statement': stmt,
                'start': _parse_date(start_date),
                'end': _parse_date(end_date),
                'start_str': start_date,
                'end_str': end_date
            })
    
    # Check for conflicting overlaps
    for key, range_list in ranges.items():
        for i in range(len(range_list)):
            for j in range(i + 1, len(range_list)):
                range_a = range_list[i]
                range_b = range_list[j]
                
                # Check if ranges should not overlap but do
                if _ranges_conflict(range_a, range_b):
                    contradictions.append({
                        'contradiction_id': contradiction_id(range_a['statement'], range_b['statement']),
                        'type': 'date_range_overlap_conflict',
                        'statement_a': range_a['statement'],
                        'statement_b': range_b['statement'],
                        'event': range_a['statement'].get('event', 'unknown'),
                        'person': range_a['statement'].get('person', range_a['statement'].get('party', 'unknown')),
                        'range_a': f"{range_a['start_str']} to {range_a['end_str']}",
                        'range_b': f"{range_b['start_str']} to {range_b['end_str']}",
                        'description': f'Conflicting date ranges for {range_a["statement"].get("person", "person")}: {range_a["start_str"]}-{range_a["end_str"]} vs {range_b["start_str"]}-{range_b["end_str"]}'
                    })
    
    return contradictions

def _parse_date(date_str):
    """Parse date string to datetime object."""
    try:
        # Try common date formats
        for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d']:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        return None
    except:
        return None

def _ranges_conflict(range_a, range_b):
    """Check if two date ranges conflict."""
    if not all([range_a['start'], range_a['end'], range_b['start'], range_b['end']]):
        return False
    
    # Check for overlap when ranges should be mutually exclusive
    # (This is a simple implementation - could be enhanced based on specific domain logic)
    overlap = (range_a['start'] <= range_b['end'] and range_b['start'] <= range_a['end'])
    
    # For now, consider any overlap as potential conflict
    # In practice, you'd add domain-specific logic here
    return overlap and (range_a['start'] != range_b['start'] or range_a['end'] != range_b['end'])