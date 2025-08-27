"""
Presence/absence contradiction detection rules.
"""

from .id import contradiction_id

def presence_absence_conflict(statements):
    """
    Detect conflicts where same event/party is both present and absent.
    """
    contradictions = []
    
    # Group statements by event and party
    events = {}
    for stmt in statements:
        event_key = stmt.get('event', 'unknown')
        party_key = stmt.get('party', stmt.get('person', 'unknown'))
        key = f"{event_key}|{party_key}"
        
        if key not in events:
            events[key] = {'present': [], 'absent': []}
        
        # Check presence status
        present = stmt.get('present')
        if present is True:
            events[key]['present'].append(stmt)
        elif present is False:
            events[key]['absent'].append(stmt)
    
    # Check for contradictions
    for key, event_data in events.items():
        present_stmts = event_data['present']
        absent_stmts = event_data['absent']
        
        # If both present and absent statements exist, that's a contradiction
        if present_stmts and absent_stmts:
            for present_stmt in present_stmts:
                for absent_stmt in absent_stmts:
                    contradictions.append({
                        'contradiction_id': contradiction_id(present_stmt, absent_stmt),
                        'type': 'presence_absence_conflict',
                        'statement_a': present_stmt,
                        'statement_b': absent_stmt,
                        'event': present_stmt.get('event', 'unknown'),
                        'party': present_stmt.get('party', present_stmt.get('person', 'unknown')),
                        'description': f'Conflicting presence status for {present_stmt.get("party", "party")} at {present_stmt.get("event", "event")}'
                    })
    
    return contradictions