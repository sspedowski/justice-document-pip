"""
Numeric amount contradiction rules.
"""

import re
from typing import List, Dict, Any

def numeric_amount_mismatch(statements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect contradictions where numeric amounts don't match for similar items.
    """
    contradictions = []
    
    # Pattern to find monetary amounts, ages, counts, etc.
    number_patterns = [
        r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)',  # Money amounts
        r'\b(\d+)\s*years?\s*old\b',         # Ages
        r'\b(\d+)\s*items?\b',               # Item counts
        r'\b(\d+)\s*people\b',               # People counts
        r'\b(\d+)\s*hours?\b',               # Time amounts
    ]
    
    # Group statements by context
    contexts = ['damage', 'cost', 'age', 'count', 'time', 'amount']
    
    for context in contexts:
        context_statements = []
        for stmt in statements:
            content = stmt.get('content', '').lower()
            if context in content:
                context_statements.append(stmt)
        
        if len(context_statements) < 2:
            continue
            
        # Extract numbers from statements in this context
        number_groups = {}
        for stmt in context_statements:
            content = stmt.get('content', '')
            for pattern in number_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                for match in matches:
                    # Normalize the number (remove commas, convert to float)
                    try:
                        if ',' in match:
                            num_val = float(match.replace(',', ''))
                        else:
                            num_val = float(match)
                        
                        if num_val not in number_groups:
                            number_groups[num_val] = []
                        number_groups[num_val].append(stmt)
                    except ValueError:
                        continue
        
        # Check for conflicting numbers
        if len(number_groups) > 1:
            numbers = list(number_groups.keys())
            for i, num1 in enumerate(numbers):
                for num2 in numbers[i+1:]:
                    # Consider it a mismatch if numbers differ significantly
                    if abs(num1 - num2) / max(num1, num2, 1) > 0.1:  # 10% difference threshold
                        contradictions.append({
                            'type': 'numeric_amount_mismatch',
                            'description': f'Numeric amounts disagree in {context}: {num1} vs {num2}',
                            'statements': number_groups[num1] + number_groups[num2],
                            'confidence': 0.8
                        })
    
    return contradictions

def financial_discrepancy(statements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect financial amount discrepancies.
    """
    contradictions = []
    
    money_pattern = r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)'
    financial_keywords = ['cost', 'price', 'fine', 'fee', 'payment', 'compensation']
    
    for keyword in financial_keywords:
        amounts = {}
        for stmt in statements:
            content = stmt.get('content', '')
            if keyword in content.lower():
                matches = re.findall(money_pattern, content)
                for match in matches:
                    amount = float(match.replace(',', ''))
                    if amount not in amounts:
                        amounts[amount] = []
                    amounts[amount].append(stmt)
        
        # Check for conflicting amounts
        if len(amounts) > 1:
            amount_list = list(amounts.keys())
            for i, amt1 in enumerate(amount_list):
                for amt2 in amount_list[i+1:]:
                    contradictions.append({
                        'type': 'financial_discrepancy',
                        'description': f'Financial amounts disagree for {keyword}: ${amt1} vs ${amt2}',
                        'statements': amounts[amt1] + amounts[amt2],
                        'confidence': 0.85
                    })
    
    return contradictions