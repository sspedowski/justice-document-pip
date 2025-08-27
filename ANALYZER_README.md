# Analyzer Pipeline

This directory contains the contradiction detection analyzer pipeline.

## Structure

```
analyzer/                   # Python package for contradiction detection
├── __init__.py            # Main evaluation engine with evaluate() function
├── all_rules.py           # Consolidated rule imports and discovery
├── id.py                  # Deterministic ID generation with symmetry
├── rules_dates.py         # Date disagreement detection
├── rules_presence.py      # Presence/absence conflict detection
├── rules_numeric.py       # Numeric amount mismatch detection
├── rules_status.py        # Status change inconsistencies  
├── rules_location.py      # Location contradictions
├── rules_role.py          # Role/responsibility conflicts
└── rules_daterange.py     # Date range overlap conflicts

scripts/
├── run_analysis.py        # Main analysis script (--demo mode available)
└── scoding.py            # Scoring and output generation

tests/analyzer/
├── __init__.py
└── test_rules.py         # Unit tests for rules and core functionality

public/data/              # Output directory (created automatically)
├── contradictions.json        # Raw contradictions from analysis
├── statements_debug.json      # Input statements for debugging
├── run_meta.json             # Run metadata with git SHA and fingerprint
├── contradictions_scored.json # Scored contradictions
└── contradictions_scored.csv  # CSV export with deduplication
```

## Usage

### Run Analysis
```bash
python scripts/run_analysis.py --demo
```

### Score Results  
```bash
python scripts/scoding.py
```

### Run Tests
```bash
pytest tests/analyzer/
```

### Verify Everything Works
```bash
python manual_verify.py
```

## Features

- **Contradiction Detection**: Multiple rule types for detecting inconsistencies
- **Deduplication**: Automatic deduplication by contradiction_id in outputs  
- **Symmetric IDs**: `contradiction_id(a,b) == contradiction_id(b,a)`
- **Error Handling**: Engine errors marked with `__engine_error__` type
- **Metadata Tracking**: Git SHA, rules fingerprint, counts in run_meta.json
- **Scoring System**: Configurable scoring with rule-specific adjustments
- **CI Integration**: GitHub Actions workflow for automated testing

## CI/CD

The `.github/workflows/analyzer.yml` workflow runs:

1. `python scripts/run_analysis.py --demo`
2. `python scripts/scoding.py` 
3. `pytest tests/analyzer/`
4. Check for `__engine_error__` in output
5. Upload artifacts

## Adding New Rules

1. Create `analyzer/rules_yourname.py` with rule functions
2. Add `try: from .rules_yourname import *; except: pass` to `analyzer/all_rules.py`
3. Add tests to `tests/analyzer/test_rules.py`
4. Rule functions should accept `statements` list and return contradictions list

## Rule Function Format

```python
def your_rule_name(statements):
    """Detect your specific contradiction type."""
    contradictions = []
    
    # Your detection logic here
    for statement in statements:
        # Check for contradictions
        pass
    
    # Return list of contradiction dicts with:
    # - contradiction_id (use analyzer.id.contradiction_id)
    # - type (your rule name)
    # - statement_a, statement_b
    # - description
    # - any rule-specific fields
    
    return contradictions
```