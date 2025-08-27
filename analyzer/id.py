"""
Contradiction ID generation and management.
"""

import hashlib
from typing import Dict, Any, Tuple

def contradiction_id(statement_a: Dict[str, Any], statement_b: Dict[str, Any]) -> str:
    """
    Generate a deterministic contradiction ID for two statements.
    The ID should be symmetric: contradiction_id(a, b) == contradiction_id(b, a)
    """
    # Extract identifying information from statements
    id_a = statement_a.get('id', str(statement_a.get('content', '')))
    id_b = statement_b.get('id', str(statement_b.get('content', '')))
    
    # Sort the IDs to ensure symmetry
    sorted_ids = tuple(sorted([str(id_a), str(id_b)]))
    
    # Create hash of sorted IDs
    hash_input = f"{sorted_ids[0]}::{sorted_ids[1]}"
    return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()[:16]

def generate_contradiction_id(contradiction: Dict[str, Any]) -> str:
    """
    Generate a unique ID for a contradiction based on involved statements.
    """
    statements = contradiction.get('statements', [])
    if len(statements) < 2:
        # Single statement contradiction
        if statements:
            stmt = statements[0]
            stmt_id = stmt.get('id', str(stmt.get('content', '')))
            return hashlib.sha256(f"single::{stmt_id}".encode('utf-8')).hexdigest()[:16]
        else:
            # No statements, use contradiction type and description
            content = f"{contradiction.get('type', '')}::{contradiction.get('description', '')}"
            return hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]
    
    # Multiple statements - use pairwise approach for deterministic result
    stmt_ids = []
    for stmt in statements:
        stmt_id = stmt.get('id', str(stmt.get('content', '')))
        stmt_ids.append(str(stmt_id))
    
    # Sort to ensure deterministic order
    stmt_ids.sort()
    
    # Create hash of all statement IDs
    hash_input = "::".join(stmt_ids)
    return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()[:16]