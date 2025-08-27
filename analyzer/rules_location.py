"""
Location contradiction detection rules.
"""

from .id import contradiction_id

def location_contradiction(statements):
    """
    Detect contradictions in location information.
    """
    contradictions = []
    
    # Group statements by event and person
    locations = {}
    for stmt in statements:
        event_key = stmt.get('event', 'unknown')
        person_key = stmt.get('person', stmt.get('party', 'unknown'))
        key = f"{event_key}|{person_key}"
        
        location = stmt.get('location')
        if location:
            if key not in locations:
                locations[key] = {}
            if location not in locations[key]:
                locations[key][location] = []
            locations[key][location].append(stmt)
    
    # Check for contradictions
    for key, location_groups in locations.items():
        if len(location_groups) > 1:
            location_list = list(location_groups.keys())
            for i in range(len(location_list)):
                for j in range(i + 1, len(location_list)):
                    location_a, location_b = location_list[i], location_list[j]
                    stmts_a = location_groups[location_a]
                    stmts_b = location_groups[location_b]
                    
                    for stmt_a in stmts_a:
                        for stmt_b in stmts_b:
                            contradictions.append({
                                'contradiction_id': contradiction_id(stmt_a, stmt_b),
                                'type': 'location_contradiction',
                                'statement_a': stmt_a,
                                'statement_b': stmt_b,
                                'event': stmt_a.get('event', 'unknown'),
                                'person': stmt_a.get('person', stmt_a.get('party', 'unknown')),
                                'location_a': location_a,
                                'location_b': location_b,
                                'description': f'Location contradiction for {stmt_a.get("person", "person")} at {stmt_a.get("event", "event")}: {location_a} vs {location_b}'
                            })
    
    return contradictions