"""
Date-related contradiction rules.
"""

import re
from datetime import datetime
from typing import List, Dict, Any, Tuple

def event_date_disagreement(statements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect contradictions where the same event has different dates reported.
    """
    contradictions = []
    date_pattern = r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b'
    
    # Group statements by similar content/events
    event_groups = {}
    for stmt in statements:
        content = stmt.get('content', '').lower()
        # Simple grouping by keywords
        key_words = ['incident', 'event', 'occurred', 'happened', 'reported']
        for word in key_words:
            if word in content:
                if word not in event_groups:
                    event_groups[word] = []
                event_groups[word].append(stmt)
                break
    
    # Check for date disagreements within groups
    for event_type, group in event_groups.items():
        if len(group) < 2:
            continue
            
        dates_found = {}
        for stmt in group:
            content = stmt.get('content', '')
            dates = re.findall(date_pattern, content)
            if dates:
                date_str = f"{dates[0][0]}/{dates[0][1]}/{dates[0][2]}"
                if date_str not in dates_found:
                    dates_found[date_str] = []
                dates_found[date_str].append(stmt)
        
        # If multiple different dates found for same event type
        if len(dates_found) > 1:
            date_list = list(dates_found.keys())
            for i, date1 in enumerate(date_list):
                for date2 in date_list[i+1:]:
                    contradictions.append({
                        'type': 'event_date_disagreement',
                        'description': f'Event dates disagree: {date1} vs {date2}',
                        'statements': dates_found[date1] + dates_found[date2],
                        'confidence': 0.8
                    })
    
    return contradictions