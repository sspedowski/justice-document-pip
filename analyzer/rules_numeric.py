"""
Numeric amount mismatch detection rules.
"""

from .id import contradiction_id

def numeric_amount_mismatch(statements):
    """
    Detect mismatches in numeric amounts for same event/currency.
    """
    contradictions = []
    
    # Group statements by event and currency
    amounts = {}
    for stmt in statements:
        event_key = stmt.get('event', 'unknown')
        currency_key = stmt.get('currency', stmt.get('unit', 'unknown'))
        key = f"{event_key}|{currency_key}"
        
        amount = stmt.get('amount')
        if amount is not None:
            if key not in amounts:
                amounts[key] = {}
            if amount not in amounts[key]:
                amounts[key][amount] = []
            amounts[key][amount].append(stmt)
    
    # Check for contradictions
    for key, amount_groups in amounts.items():
        if len(amount_groups) > 1:
            amount_list = list(amount_groups.keys())
            for i in range(len(amount_list)):
                for j in range(i + 1, len(amount_list)):
                    amount_a, amount_b = amount_list[i], amount_list[j]
                    stmts_a = amount_groups[amount_a]
                    stmts_b = amount_groups[amount_b]
                    
                    for stmt_a in stmts_a:
                        for stmt_b in stmts_b:
                            contradictions.append({
                                'contradiction_id': contradiction_id(stmt_a, stmt_b),
                                'type': 'numeric_amount_mismatch',
                                'statement_a': stmt_a,
                                'statement_b': stmt_b,
                                'event': stmt_a.get('event', 'unknown'),
                                'currency': stmt_a.get('currency', stmt_a.get('unit', 'unknown')),
                                'amount_a': amount_a,
                                'amount_b': amount_b,
                                'description': f'Amount mismatch for {stmt_a.get("event", "event")}: {amount_a} vs {amount_b}'
                            })
    
    return contradictions