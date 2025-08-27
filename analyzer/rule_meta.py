RULE_META = {
    "event_date_disagreement": {
        "title": "Event Date Disagreement",
        "description": "Multiple statements assert different dates for the same event.",
        "base_weight": 7,
        "suggested_action": "Verify the correct event date in original documents."
    },
    "presence_absence_conflict": {
        "title": "Presence vs Absence",
        "description": "A party is recorded both present and absent for the same event.",
        "base_weight": 5,
        "suggested_action": "Confirm attendance or clarify witness statements."
    },
    "numeric_amount_mismatch": {
        "title": "Numeric Amount Mismatch",
        "description": "Different monetary amounts are reported for the same event or context.",
        "base_weight": 6,
        "suggested_action": "Check transactional or financial records for the authoritative value."
    },
    "status_flip_without_transition": {
        "title": "Status Flip",
        "description": "Same target recorded with opposite terminal statuses (e.g., granted vs denied).",
        "base_weight": 8,
        "suggested_action": "Check docket or authoritative system of record."
    },
    "location_mismatch": {
        "title": "Location Mismatch",
        "description": "Same event described in different locations.",
        "base_weight": 5,
        "suggested_action": "Verify venue/logistics details."
    }
}

SEVERITY_BASE = {
    "low": 1,
    "medium": 2,
    "high": 3
}