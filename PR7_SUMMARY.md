# PR-7 Analyzer Pipeline Fixes - Commit Summary

## Changes Made

### 1. fix(analyzer): add package init + all_rules aggregator; import rules early

- Created `analyzer/__init__.py` with main `evaluate()` function and `get_rules_fingerprint()`
- Created `analyzer/all_rules.py` that safely imports all rule modules with try/except
- Created `analyzer/id.py` with symmetric `contradiction_id()` function
- Created complete rule modules:
  - `analyzer/rules_dates.py` - event_date_disagreement
  - `analyzer/rules_presence.py` - presence_absence_conflict  
  - `analyzer/rules_numeric.py` - numeric_amount_mismatch
  - `analyzer/rules_status.py` - status_change_inconsistency
  - `analyzer/rules_location.py` - location_contradiction
  - `analyzer/rules_role.py` - role_responsibility_conflict
  - `analyzer/rules_daterange.py` - date_range_overlap_conflict

### 2. feat(analyzer): write run_meta.json with git sha + rules fingerprint

- Created `scripts/run_analysis.py` with:
  - Early analyzer import to register all rules
  - Demo mode with `--demo` flag
  - Writes 3 required output files:
    - `public/data/contradictions.json`
    - `public/data/statements_debug.json`
    - `public/data/run_meta.json` (with timestamp, git_sha, counts, rules_fingerprint)
  - Error handling with `__engine_error__` markers for CI detection

### 3. polish(scoring): de-dupe by contradiction_id before CSV/JSON write

- Created `scripts/scoding.py` with:
  - De-duplication logic: `uniq = {}; for c in items: uniq[c.get("contradiction_id")] = c`
  - Rule-specific scoring adjustments for status/location/role/daterange
  - CSV and JSON output with unique contradiction_id rows
  - Proper field handling and sorting by score

### 4. test(analyzer): minimal rule + id symmetry tests

- Created `tests/analyzer/test_rules.py` with:
  - Unit tests for presence_absence_conflict, event_date_disagreement, numeric_amount_mismatch
  - ID symmetry tests: `contradiction_id(a,b) == contradiction_id(b,a)`
  - Integration tests for evaluate() function
  - Multiple contradiction type detection tests
- Created `tests/analyzer/__init__.py`
- Created `pytest.ini` for test configuration

### 5. Additional Infrastructure

- Created `.github/workflows/analyzer.yml` CI workflow
- Created verification scripts: `manual_verify.py`, `debug_imports.py`
- Updated `requirements.txt` to include pytest and remove built-in modules
- Created `ANALYZER_README.md` with complete documentation

## Files Created/Modified

### Core Package
- `analyzer/__init__.py` (evaluate, get_rules_fingerprint)
- `analyzer/all_rules.py` (rule aggregation)
- `analyzer/id.py` (symmetric ID generation)
- `analyzer/rules_*.py` (7 rule modules)

### Scripts
- `scripts/run_analysis.py` (main analysis with --demo)
- `scripts/scoding.py` (scoring with deduplication)

### Tests
- `tests/analyzer/__init__.py`
- `tests/analyzer/test_rules.py` (comprehensive test suite)
- `pytest.ini` (test configuration)

### CI/Documentation
- `.github/workflows/analyzer.yml` (CI pipeline)
- `ANALYZER_README.md` (complete documentation)
- `requirements.txt` (updated dependencies)

### Verification Tools
- `manual_verify.py` (end-to-end verification)
- `debug_imports.py` (import debugging)

## Verification Commands

```bash
# Manual smoke test
python manual_verify.py

# Individual components
python scripts/run_analysis.py --demo
python scripts/scoding.py
pytest tests/analyzer/ -v

# Check outputs exist
ls -la public/data/
```

## Expected Output Files

After successful run:
- `public/data/contradictions.json` (raw contradictions)
- `public/data/statements_debug.json` (input statements)
- `public/data/run_meta.json` (metadata with git SHA)
- `public/data/contradictions_scored.json` (scored results)
- `public/data/contradictions_scored.csv` (unique rows only)

## Acceptance Criteria Met

✅ `python scripts/run_analysis.py --demo` prints counts and writes 3 files including run_meta.json
✅ `python scripts/scoding.py` completes and CSV has only unique contradiction_id rows  
✅ `pytest -q` passes with no ModuleNotFoundError
✅ CI workflow validates no `__engine_error__` in output
✅ No regressions to existing scripts (new scripts only)
✅ Deterministic ID symmetry: `contradiction_id(a,b) == contradiction_id(b,a)`
✅ Package structure with proper imports and error handling
✅ De-duplication by contradiction_id in scoring outputs
✅ Rule-specific scoring adjustments for all rule types