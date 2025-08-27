"""
Status change contradiction detection rules.
"""

from .id import contradiction_id

def status_change_inconsistency(statements):
    """
    Detect inconsistent status changes.
    """
    contradictions = []
    
    # Group statements by case/event
    cases = {}
    for stmt in statements:
        case_key = stmt.get('case', stmt.get('event', 'unknown'))
        status = stmt.get('status')
        
        if status and case_key not in cases:
            cases[case_key] = {}
        if status:
            if status not in cases[case_key]:
                cases[case_key][status] = []
            cases[case_key][status].append(stmt)
    
    # Check for contradictory statuses
    for case_key, status_groups in cases.items():
        contradictory_pairs = [
            ('ACTIVE', 'CLOSED'),
            ('OPEN', 'CLOSED'),
            ('SUBSTANTIATED', 'UNSUBSTANTIATED'),
            ('FOUNDED', 'UNFOUNDED')
        ]
        
        for status_a, status_b in contradictory_pairs:
            if status_a in status_groups and status_b in status_groups:
                stmts_a = status_groups[status_a]
                stmts_b = status_groups[status_b]
                
                for stmt_a in stmts_a:
                    for stmt_b in stmts_b:
                        contradictions.append({
                            'contradiction_id': contradiction_id(stmt_a, stmt_b),
                            'type': 'status_change_inconsistency',
                            'statement_a': stmt_a,
                            'statement_b': stmt_b,
                            'case': case_key,
                            'status_a': status_a,
                            'status_b': status_b,
                            'description': f'Case {case_key} has contradictory statuses: {status_a} vs {status_b}'
                        })
    
    return contradictions