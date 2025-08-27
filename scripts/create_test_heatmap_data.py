#!/usr/bin/env python3
"""
Test data generator for heatmap demonstration.
Creates sample contradictions with clustering patterns to show heatmap effectiveness.
"""

import json
from pathlib import Path


def create_test_contradictions():
    """Create sample contradictions that show meaningful clustering patterns."""
    test_contradictions = [
        # Noel has multiple status-related issues
        {
            "contradiction_id": "test_001",
            "type": "status_flip_without_transition",
            "party": "Noel",
            "description": "Status changed without proper transition process",
            "score": 85
        },
        {
            "contradiction_id": "test_002", 
            "type": "status_change_inconsistency",
            "party": "Noel",
            "description": "Contradictory status assignments",
            "score": 90
        },
        {
            "contradiction_id": "test_003",
            "type": "status_flip_without_transition", 
            "party": "Noel",
            "description": "Another status transition issue",
            "score": 85
        },
        # Noel also has location issues
        {
            "contradiction_id": "test_004",
            "type": "location_contradiction",
            "party": "Noel", 
            "description": "Location inconsistencies",
            "score": 75
        },
        {
            "contradiction_id": "test_005",
            "type": "location_contradiction",
            "party": "Noel",
            "description": "Additional location contradictions", 
            "score": 70
        },
        # John Doe has mostly presence issues
        {
            "contradiction_id": "test_006",
            "type": "presence_absence_conflict",
            "party": "John Doe",
            "description": "Presence status conflicts",
            "score": 80
        },
        {
            "contradiction_id": "test_007", 
            "type": "presence_absence_conflict",
            "party": "John Doe",
            "description": "Additional presence conflicts",
            "score": 85
        },
        {
            "contradiction_id": "test_008",
            "type": "location_contradiction",
            "party": "John Doe",
            "description": "Location-related issue for John",
            "score": 75
        },
        # Sarah Williams has numeric and role issues
        {
            "contradiction_id": "test_009",
            "type": "numeric_amount_mismatch", 
            "party": "Sarah Williams",
            "description": "Amount discrepancies",
            "score": 80
        },
        {
            "contradiction_id": "test_010",
            "type": "role_responsibility_conflict",
            "party": "Sarah Williams", 
            "description": "Role assignment conflicts",
            "score": 65
        },
        {
            "contradiction_id": "test_011",
            "type": "numeric_amount_mismatch",
            "party": "Sarah Williams",
            "description": "More numeric discrepancies",
            "score": 80
        },
        # Mike Johnson has date-related clustering
        {
            "contradiction_id": "test_012",
            "type": "event_date_disagreement",
            "party": "Mike Johnson",
            "description": "Date inconsistencies", 
            "score": 75
        },
        {
            "contradiction_id": "test_013",
            "type": "date_range_overlap_conflict",
            "party": "Mike Johnson",
            "description": "Date range conflicts",
            "score": 60
        },
        {
            "contradiction_id": "test_014",
            "type": "event_date_disagreement", 
            "party": "Mike Johnson",
            "description": "Additional date issues",
            "score": 75
        },
        # Lisa Anderson has single issues in multiple areas
        {
            "contradiction_id": "test_015",
            "type": "role_responsibility_conflict",
            "party": "Lisa Anderson",
            "description": "Role conflict",
            "score": 65
        },
        {
            "contradiction_id": "test_016",
            "type": "presence_absence_conflict", 
            "party": "Lisa Anderson",
            "description": "Presence conflict",
            "score": 80
        },
        {
            "contradiction_id": "test_017",
            "type": "status_change_inconsistency",
            "party": "Lisa Anderson", 
            "description": "Status issue",
            "score": 90
        }
    ]
    
    return test_contradictions


def write_test_data():
    """Write test contradictions to the scored contradictions file."""
    output_dir = Path("public/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    test_contradictions = create_test_contradictions()
    
    # Write test data
    contradictions_file = output_dir / "contradictions_scored.json"
    with open(contradictions_file, 'w') as f:
        json.dump(test_contradictions, f, indent=2)
    
    print(f"Wrote {len(test_contradictions)} test contradictions to {contradictions_file}")
    return contradictions_file


def main():
    """Main test data generation."""
    print("Generating test contradiction data for heatmap demo...")
    
    file_written = write_test_data()
    
    print("✅ Test data generation completed successfully")
    print(f"Run 'python scripts/heatmap_data.py' to generate heatmap from test data")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())