"""
Role/responsibility contradiction detection rules.
"""

from .id import contradiction_id

def role_responsibility_conflict(statements):
    """
    Detect conflicts in role assignments or responsibilities.
    """
    contradictions = []
    
    # Group statements by person and context
    roles = {}
    for stmt in statements:
        person_key = stmt.get('person', stmt.get('party', 'unknown'))
        context_key = stmt.get('context', stmt.get('event', 'unknown'))
        key = f"{person_key}|{context_key}"
        
        role = stmt.get('role')
        if role:
            if key not in roles:
                roles[key] = {}
            if role not in roles[key]:
                roles[key][role] = []
            roles[key][role].append(stmt)
    
    # Check for contradictory roles
    for key, role_groups in roles.items():
        if len(role_groups) > 1:
            role_list = list(role_groups.keys())
            for i in range(len(role_list)):
                for j in range(i + 1, len(role_list)):
                    role_a, role_b = role_list[i], role_list[j]
                    
                    # Check if roles are contradictory
                    if _roles_contradict(role_a, role_b):
                        stmts_a = role_groups[role_a]
                        stmts_b = role_groups[role_b]
                        
                        for stmt_a in stmts_a:
                            for stmt_b in stmts_b:
                                contradictions.append({
                                    'contradiction_id': contradiction_id(stmt_a, stmt_b),
                                    'type': 'role_responsibility_conflict',
                                    'statement_a': stmt_a,
                                    'statement_b': stmt_b,
                                    'person': stmt_a.get('person', stmt_a.get('party', 'unknown')),
                                    'context': stmt_a.get('context', stmt_a.get('event', 'unknown')),
                                    'role_a': role_a,
                                    'role_b': role_b,
                                    'description': f'Role conflict for {stmt_a.get("person", "person")}: {role_a} vs {role_b}'
                                })
    
    return contradictions

def _roles_contradict(role_a, role_b):
    """Check if two roles are contradictory."""
    contradictory_pairs = [
        ('victim', 'perpetrator'),
        ('witness', 'suspect'),
        ('compliant', 'non-compliant'),
        ('cooperative', 'uncooperative'),
        ('present', 'absent')
    ]
    
    role_a_lower = role_a.lower()
    role_b_lower = role_b.lower()
    
    for pair in contradictory_pairs:
        if (role_a_lower in pair[0] and role_b_lower in pair[1]) or \
           (role_a_lower in pair[1] and role_b_lower in pair[0]):
            return True
    
    return False