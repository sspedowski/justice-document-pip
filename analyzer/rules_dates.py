"""
Date-based contradiction detection rules.
"""

from .id import contradiction_id

def event_date_disagreement(statements):
    """
    Detect disagreements about event dates.
    """
    contradictions = []
    
    # Group statements by event
    events = {}
    for stmt in statements:
        event_key = stmt.get('event', 'unknown')
        if event_key not in events:
            events[event_key] = []
        events[event_key].append(stmt)
    
    # Check for date disagreements within each event
    for event, event_statements in events.items():
        dates_seen = {}
        for stmt in event_statements:
            date = stmt.get('date')
            if date:
                if date not in dates_seen:
                    dates_seen[date] = []
                dates_seen[date].append(stmt)
        
        # If multiple dates for same event, that's a contradiction
        if len(dates_seen) > 1:
            date_list = list(dates_seen.keys())
            for i in range(len(date_list)):
                for j in range(i + 1, len(date_list)):
                    date_a, date_b = date_list[i], date_list[j]
                    stmts_a = dates_seen[date_a]
                    stmts_b = dates_seen[date_b]
                    
                    for stmt_a in stmts_a:
                        for stmt_b in stmts_b:
                            contradictions.append({
                                'contradiction_id': contradiction_id(stmt_a, stmt_b),
                                'type': 'event_date_disagreement',
                                'statement_a': stmt_a,
                                'statement_b': stmt_b,
                                'event': event,
                                'date_a': date_a,
                                'date_b': date_b,
                                'description': f'Event "{event}" has conflicting dates: {date_a} vs {date_b}'
                            })
    
    return contradictions