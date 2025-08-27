#!/usr/bin/env python3
"""
Scoring and output generation for contradictions.
Loads contradictions.json and produces scored outputs with deduplication.
"""

import json
import csv
from pathlib import Path
from confidence import score_confidence

def load_contradictions():
    """Load contradictions from analysis output."""
    contradictions_file = Path("public/data/contradictions.json")
    if not contradictions_file.exists():
        print("Error: contradictions.json not found. Run run_analysis.py first.")
        return []
    
    with open(contradictions_file, 'r') as f:
        return json.load(f)

def score_contradiction(contradiction):
    """Assign scores to contradictions based on type and severity."""
    base_scores = {
        'presence_absence_conflict': 85,
        'event_date_disagreement': 75, 
        'numeric_amount_mismatch': 80,
        'status_change_inconsistency': 90,
        'location_contradiction': 70,
        'role_responsibility_conflict': 65,
        'date_range_overlap_conflict': 60,
        'name_change': 95,
        'content_alteration': 85,
        'evidence_suppression': 90,
        'status_change': 88,
        'assessment_manipulation': 82,
        'witness_removal': 92,
        '__engine_error__': 0
    }
    
    contradiction_type = contradiction.get('type', 'unknown')
    base_score = base_scores.get(contradiction_type, 50)
    
    # Apply adjustments based on content
    adjustments = 0
    
    # Status rule adjustments
    if contradiction_type == 'status_change_inconsistency':
        status_a = contradiction.get('status_a', '').upper()
        status_b = contradiction.get('status_b', '').upper()
        
        if ('ACTIVE' in [status_a, status_b] and 'CLOSED' in [status_a, status_b]) or \
           ('SUBSTANTIATED' in [status_a, status_b] and 'UNSUBSTANTIATED' in [status_a, status_b]):
            adjustments += 10  # High-impact status changes
    
    # Location rule adjustments
    elif contradiction_type == 'location_contradiction':
        location_a = contradiction.get('location_a', '').lower()
        location_b = contradiction.get('location_b', '').lower()
        
        if any(word in location_a or word in location_b for word in ['court', 'hospital', 'police', 'office']):
            adjustments += 15  # Important institutional locations
    
    # Role rule adjustments 
    elif contradiction_type == 'role_responsibility_conflict':
        role_a = contradiction.get('role_a', '').lower()
        role_b = contradiction.get('role_b', '').lower()
        
        if any(word in role_a or word in role_b for word in ['victim', 'perpetrator', 'witness', 'suspect']):
            adjustments += 20  # Critical role contradictions
    
    # Date range rule adjustments
    elif contradiction_type == 'date_range_overlap_conflict':
        range_a = contradiction.get('range_a', '')
        range_b = contradiction.get('range_b', '')
        
        if range_a and range_b:
            adjustments += 5  # Minor boost for valid date ranges
    
    final_score = min(100, max(0, base_score + adjustments))
    return final_score

def enrich(contradictions):
    """Enrich contradictions with scores and confidence values."""
    enriched = []
    
    for contradiction in contradictions:
        # Create enriched copy
        enriched_contradiction = contradiction.copy()
        
        # Add traditional score
        enriched_contradiction['score'] = score_contradiction(contradiction)
        
        # Add confidence score using the new confidence module
        enriched_contradiction['confidence'] = score_confidence(contradiction)
        
        enriched.append(enriched_contradiction)
    
    return enriched

def write_outputs(contradictions):
    """Write scored contradictions to JSON and CSV files with deduplication."""
    # De-duplicate by contradiction_id
    uniq = {}
    for c in contradictions:
        cid = c.get("contradiction_id") or id(c)
        uniq[cid] = c
    items = list(uniq.values())
    
    # Enrich each contradiction with scores and confidence
    items = enrich(items)
    
    # Sort by score (highest first)
    items.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    output_dir = Path("public/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write scored JSON
    json_file = output_dir / "contradictions_scored.json"
    with open(json_file, 'w') as f:
        json.dump(items, f, indent=2, default=str)
    print(f"Wrote scored contradictions to {json_file}")
    
    # Write CSV
    csv_file = output_dir / "contradictions_scored.csv"
    if items:
        fieldnames = [
            'contradiction_id', 'type', 'score', 'confidence', 'description',
            'event', 'party', 'person', 'case', 'location',
            'date_a', 'date_b', 'amount_a', 'amount_b',
            'status_a', 'status_b', 'role_a', 'role_b'
        ]
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            
            for item in items:
                # Create a clean row with only the fields we want
                row = {}
                for field in fieldnames:
                    row[field] = item.get(field, '')
                writer.writerow(row)
    
    print(f"Wrote CSV to {csv_file} with {len(items)} unique contradictions")

def create_sample_data():
    """Create sample contradiction data for testing."""
    sample_contradictions = [
        {
            "contradiction_id": "contradition_001",
            "type": "name_change",
            "severity": "critical",
            "title": "Child Victim Identity Alteration",
            "description": "Child's name systematically changed between CPS report versions from Nicholas Williams to Owen Williams",
            "before": "Nicholas Williams (age 6)",
            "after": "Owen Williams (age 6)",
            "documents": ["Initial_CPS_Report.pdf", "Amended_CPS_Report.pdf"],
            "impact": "Child victim identity tampering - potential child endangerment",
            "legalImplications": [
                "Due process violation - falsified CPS records",
                "Child protection failure - altered victim identity",
                "Potential CAPTA violation"
            ],
            "evidenceLocation": "CPS Report children identification section"
        },
        {
            "contradiction_id": "contradition_002",
            "type": "witness_removal",
            "severity": "critical",
            "title": "Key Witness Statement Suppression",
            "description": "Critical witness statement completely removed from amended report - Noel Johnson provided statement was deleted",
            "before": "Neighbor: Noel Johnson (provided statement)",
            "after": "Witness statement section deleted",
            "documents": ["Initial_CPS_Report.pdf", "Amended_CPS_Report.pdf"],
            "impact": "Critical witness testimony suppression",
            "legalImplications": [
                "Brady v. Maryland violation - suppression of witness testimony",
                "Witness intimidation implications",
                "Due process violation"
            ],
            "evidenceLocation": "CPS Report interviews section"
        },
        {
            "contradiction_id": "contradition_003",
            "type": "assessment_manipulation",
            "severity": "high",
            "title": "Risk Assessment Artificial Escalation",
            "description": "CPS risk level artificially elevated from LOW to MODERATE to justify increased intervention without factual basis",
            "before": "RISK ASSESSMENT: LOW, Services recommended: Voluntary family support",
            "after": "RISK ASSESSMENT: MODERATE, Services required: Mandatory parenting classes",
            "documents": ["Initial_CPS_Report.pdf", "Amended_CPS_Report.pdf"],
            "impact": "Artificial escalation of family intervention level",
            "legalImplications": [
                "Due process violation",
                "False documentation in official records",
                "Child welfare system abuse"
            ],
            "evidenceLocation": "CPS Report risk assessment section"
        },
        {
            "contradiction_id": "contradition_004",
            "type": "status_change",
            "severity": "critical",
            "title": "Case Status Manipulation",
            "description": "Investigation status changed from active to closed without justification in police reports",
            "before": "Case Status: ACTIVE - INVESTIGATION CONTINUING",
            "after": "Case Status: CLOSED - INSUFFICIENT EVIDENCE",
            "documents": ["Original_Police_Report.pdf", "Revised_Police_Report.pdf"],
            "impact": "Investigation termination through document manipulation",
            "legalImplications": [
                "Obstruction of justice",
                "Due process violation",
                "Denial of equal protection"
            ],
            "evidenceLocation": "Police Report conclusion section"
        },
        {
            "contradiction_id": "contradition_005",
            "type": "content_alteration",
            "severity": "moderate",
            "title": "Minor Text Change",
            "description": "Small text modification",
            "before": "Original text",
            "after": "Modified text",
            "documents": ["doc1.pdf"],
            "impact": "Minimal impact",
            "legalImplications": ["Minor inconsistency"],
            "evidenceLocation": "Page 1"
        }
    ]
    
    return sample_contradictions

def main():
    """Main scoring execution."""
    print("Loading contradictions for scoring...")
    
    # Try to load existing contradictions, if not found create sample data
    contradictions = load_contradictions()
    
    if not contradictions:
        print("No contradictions found, creating sample data for testing...")
        contradictions = create_sample_data()
        
        # Write sample contradictions to input file
        output_dir = Path("public/data")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        input_file = output_dir / "contradictions.json"
        with open(input_file, 'w') as f:
            json.dump(contradictions, f, indent=2, default=str)
        print(f"Created sample contradictions file: {input_file}")
    
    if not contradictions:
        print("No contradictions to score.")
        return 1
    
    print(f"Scoring {len(contradictions)} contradictions...")
    write_outputs(contradictions)
    
    print("✅ Scoring completed successfully")
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())