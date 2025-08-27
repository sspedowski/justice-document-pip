"""
Consolidated import of all analyzer rules with auto-discovery.
"""

# Import all rule modules and their functions
from .rules_dates import *
from .rules_presence import *
from .rules_numeric import *

# Try to import optional rule modules
try:
    from .rules_status import *
except Exception:
    pass

try:
    from .rules_location import *
except Exception:
    pass

try:
    from .rules_role import *
except Exception:
    pass

try:
    from .rules_daterange import *
except Exception:
    pass

# Export all non-private symbols
__all__ = [k for k in globals().keys() if not k.startswith("_")]

# Get all rule functions for evaluation
def get_all_rule_functions():
    """Return all rule functions that can be called for contradiction detection."""
    rule_functions = []
    
    # Core rules (always available)
    core_rules = [
        'event_date_disagreement',
        'presence_absence_conflict', 
        'numeric_amount_mismatch'
    ]
    
    # Optional rules (may not be available)
    optional_rules = [
        'status_change_inconsistency',
        'location_contradiction',
        'role_responsibility_conflict',
        'date_range_overlap_conflict'
    ]
    
    # Add core rules
    for rule_name in core_rules:
        if rule_name in globals():
            rule_functions.append(globals()[rule_name])
    
    # Add optional rules if available
    for rule_name in optional_rules:
        if rule_name in globals():
            rule_functions.append(globals()[rule_name])
    
    return rule_functions