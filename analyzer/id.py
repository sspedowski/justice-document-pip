"""
ID generation for contradictions with deterministic symmetry.
"""
import hashlib

def contradiction_id(statement_a, statement_b):
    """
    Generate a deterministic contradiction ID that is symmetric.
    contradiction_id(a, b) == contradiction_id(b, a)
    """
    # Extract statement IDs or use string representation
    id_a = statement_a.get('id', str(statement_a)) if isinstance(statement_a, dict) else str(statement_a)
    id_b = statement_b.get('id', str(statement_b)) if isinstance(statement_b, dict) else str(statement_b)
    
    # Sort to ensure symmetry
    sorted_ids = sorted([id_a, id_b])
    combined = "|".join(sorted_ids)
    
    # Generate hash for deterministic ID
    return hashlib.sha1(combined.encode()).hexdigest()[:12]