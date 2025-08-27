"""
Presence/absence contradiction rules.
"""

from typing import List, Dict, Any

def presence_absence_conflict(statements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect contradictions where something is described as both present and absent.
    """
    contradictions = []
    
    # Keywords that indicate presence/absence - order matters for negatives
    absence_keywords = ['was not found', 'not found', 'not observed', 'not visible', 'not there', 'absent', 'missing']
    presence_keywords = ['was present', 'present', 'was there', 'existed', 'found', 'observed', 'visible']
    
    # Group statements by subject
    subjects = ['evidence', 'witness', 'document', 'person', 'item', 'weapon', 'vehicle']
    
    for subject in subjects:
        present_statements = []
        absent_statements = []
        
        for stmt in statements:
            content = stmt.get('content', '').lower()
            if subject in content:
                # Check absence keywords first (they're more specific)
                # Use word boundaries and be more careful about negations
                is_absent = False
                is_present = False
                
                # Check for negative patterns first
                if any(keyword in content for keyword in absence_keywords):
                    is_absent = True
                
                # Check for positive patterns, but only if no negative pattern found
                if not is_absent and any(keyword in content for keyword in presence_keywords):
                    is_present = True
                
                if is_absent:
                    absent_statements.append(stmt)
                elif is_present:
                    present_statements.append(stmt)
        
        # If we have both presence and absence statements for the same subject
        if present_statements and absent_statements:
            contradictions.append({
                'type': 'presence_absence_conflict',
                'description': f'Conflicting reports about presence/absence of {subject}',
                'statements': present_statements + absent_statements,
                'confidence': 0.9
            })
    
    return contradictions

def witness_statement_suppression(statements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect when witness statements are suppressed or removed.
    """
    contradictions = []
    
    # Look for statements about witness statements being removed or suppressed
    suppression_keywords = ['removed', 'suppressed', 'deleted', 'omitted', 'excluded']
    witness_keywords = ['witness', 'statement', 'testimony', 'account']
    
    for stmt in statements:
        content = stmt.get('content', '').lower()
        if any(w_key in content for w_key in witness_keywords) and \
           any(s_key in content for s_key in suppression_keywords):
            contradictions.append({
                'type': 'witness_statement_suppression',
                'description': 'Witness statement suppression detected',
                'statements': [stmt],
                'confidence': 0.85
            })
    
    return contradictions