#!/usr/bin/env python3
"""
Confidence scoring for contradictions.
Provides lightweight ML/heuristic-based confidence scores (0-1) for detected contradictions.
"""

def score_confidence(contradiction):
    """
    Assign confidence score to contradictions based on heuristic analysis.
    
    Heuristic formula:
    - base = severity_weight / 3
    - +0.2 if presence of party name
    - +0.3 if rationale length > 50
    - clamp 0-1
    
    Args:
        contradiction (dict): Contradiction object with type, severity, description, etc.
        
    Returns:
        float: Confidence score between 0.0 and 1.0
    """
    # Severity weight mapping
    severity_weights = {
        'critical': 3.0,
        'high': 2.5,
        'moderate': 2.0,
        'low': 1.5,
        'unknown': 1.0
    }
    
    # Get base score from severity
    severity = contradiction.get('severity', 'unknown')
    if isinstance(severity, str):
        severity = severity.lower()
    
    severity_weight = severity_weights.get(severity, 1.0)
    base = severity_weight / 3.0
    
    confidence = base
    
    # Check for party name presence
    description = contradiction.get('description', '')
    party_indicators = [
        'name', 'person', 'individual', 'party', 'plaintiff', 'defendant',
        'witness', 'victim', 'suspect', 'officer', 'agent', 'subject'
    ]
    
    has_party_name = any(indicator in description.lower() for indicator in party_indicators)
    if has_party_name:
        confidence += 0.2
    
    # Check rationale/description length
    rationale_length = len(description)
    if rationale_length > 50:
        confidence += 0.3
    
    # Clamp to 0-1 range
    confidence = max(0.0, min(1.0, confidence))
    
    return confidence

def batch_score_confidences(contradictions):
    """
    Score confidence for a batch of contradictions.
    
    Args:
        contradictions (list): List of contradiction objects
        
    Returns:
        list: List of contradiction objects with confidence scores added
    """
    scored_contradictions = []
    
    for contradiction in contradictions:
        # Create a copy to avoid modifying original
        scored_contradiction = contradiction.copy()
        scored_contradiction['confidence'] = score_confidence(contradiction)
        scored_contradictions.append(scored_contradiction)
    
    return scored_contradictions

if __name__ == "__main__":
    # Test the confidence scoring with sample data
    import json
    
    sample_contradictions = [
        {
            "type": "name_change",
            "severity": "critical",
            "description": "Child victim identity altered from Nicholas Williams to Owen Williams in CPS reports",
            "documents": ["initial_report.pdf", "amended_report.pdf"]
        },
        {
            "type": "status_change",
            "severity": "high", 
            "description": "Case status changed from ACTIVE to CLOSED without justification",
            "documents": ["police_report_v1.pdf", "police_report_v2.pdf"]
        },
        {
            "type": "content_alteration",
            "severity": "moderate",
            "description": "Text modified",
            "documents": ["doc1.pdf"]
        }
    ]
    
    print("Testing confidence scoring:")
    for i, contradiction in enumerate(sample_contradictions):
        confidence = score_confidence(contradiction)
        print(f"Contradiction {i+1}: {contradiction['type']} - Confidence: {confidence:.3f}")
        print(f"  Severity: {contradiction['severity']}")
        print(f"  Description length: {len(contradiction['description'])}")
        print()