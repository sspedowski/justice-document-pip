# Manual Verification Guide - Justice Document Manager

This document provides step-by-step instructions for manually verifying that your Justice Document Manager is working correctly.

## Quick Start - Run the Manual Verification

From the repository root directory, run one of these commands:

```bash
# Option 1: Run complete smoke test
python run_smoke_test.py

# Option 2: Run diagnostics first, then smoke test  
python diagnose.py
python run_smoke_test.py

# Option 3: Use shell script (auto-detects Python)
bash run_test.sh
```

## What the Verification Tests

### 1. **Core System Components**
- ✅ Python version (3.7+ required)
- ✅ Required packages (pdfplumber, PyPDF2, reportlab, PyYAML, pytest)
- ✅ Directory structure (analyzer/, scripts/, tests/, public/data/)
- ✅ Analyzer package imports and rule functions
- ✅ Main analysis and scoring scripts

### 2. **Analysis Pipeline** 
- ✅ `python scripts/run_analysis.py --demo` runs successfully
- ✅ Generates `public/data/contradictions.json` with valid data
- ✅ Generates `public/data/run_meta.json` with metadata
- ✅ Generates `public/data/statements_debug.json` for debugging

### 3. **Scoring System**
- ✅ `python scripts/scoding.py` runs successfully  
- ✅ Generates `public/data/contradictions_scored.json`
- ✅ Generates `public/data/contradictions_scored.csv`
- ✅ De-duplicates contradictions by ID
- ✅ Applies scoring algorithms correctly

### 4. **Unit Tests**
- ✅ `python -m pytest tests/ -v` passes all tests
- ✅ Tests core rule functions (presence conflicts, date disagreements, numeric mismatches)
- ✅ Tests contradiction ID generation and symmetry
- ✅ Integration tests for the analyzer system

### 5. **File Outputs**
- ✅ All JSON files contain valid, parseable JSON
- ✅ CSV files are readable and properly formatted  
- ✅ Metadata includes timestamp, git SHA, and rule fingerprint
- ✅ No duplicate contradiction IDs in scored outputs

## Manual Steps (if automated verification fails)

### Step 1: Check Python and Dependencies
```bash
# Check Python version (should be 3.7+)
python --version

# Install required packages
pip install -r requirements.txt

# Verify analyzer imports
python -c "import analyzer; from analyzer import evaluate; print('✅ Analyzer imports work')"
```

### Step 2: Run Analysis Pipeline
```bash
# Run analysis with demo data
python scripts/run_analysis.py --demo

# Check outputs were created
ls -la public/data/
# Should see: contradictions.json, run_meta.json, statements_debug.json
```

### Step 3: Run Scoring
```bash
# Run contradiction scoring
python scripts/scoding.py

# Check scoring outputs
ls -la public/data/
# Should see: contradictions_scored.json, contradictions_scored.csv
```

### Step 4: Verify Data Quality
```bash
# Check JSON validity
python -c "import json; print('Contradictions:', len(json.load(open('public/data/contradictions.json'))))"
python -c "import json; print('Scored:', len(json.load(open('public/data/contradictions_scored.json'))))"

# Check CSV format
head -3 public/data/contradictions_scored.csv
```

### Step 5: Run Unit Tests
```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/analyzer/test_rules.py -v

# Run with verbose output
python -m pytest tests/ -v --tb=short
```

## Expected Outputs

When verification succeeds, you should see:

### Analysis Output (`contradictions.json`)
```json
[
  {
    "contradiction_id": "3a8c9f2b1d6e",
    "type": "presence_absence_conflict",
    "statement_a": {...},
    "statement_b": {...},
    "event": "meeting_2024_01_15",
    "party": "John Doe",
    "description": "Conflicting presence status..."
  }
]
```

### Metadata Output (`run_meta.json`)
```json
{
  "timestamp": "2024-08-27T13:54:00Z",
  "git_sha": null,
  "num_statements": 6,
  "num_contradictions": 4,
  "rules_fingerprint": "d7e8f9a1b2c3"
}
```

### Scored Output (`contradictions_scored.csv`)
```csv
contradiction_id,type,score,description,event,party
3a8c9f2b1d6e,presence_absence_conflict,85,Conflicting presence status...,meeting_2024_01_15,John Doe
```

## Troubleshooting Common Issues

### Import Errors
```bash
# If "ModuleNotFoundError: No module named 'analyzer'"
export PYTHONPATH=$PYTHONPATH:$(pwd)
python scripts/run_analysis.py --demo

# Or add the path explicitly
python -c "import sys; sys.path.insert(0, '.'); import analyzer"
```

### Missing Dependencies  
```bash
# Install individual packages
pip install pdfplumber PyPDF2 reportlab PyYAML pytest

# Or from requirements
pip install -r requirements.txt

# Check what's installed
pip list | grep -E "(pdfplumber|PyPDF2|reportlab|pytest)"
```

### File Permission Issues
```bash
# Ensure scripts are executable
chmod +x run_test.sh run_manual_verify.sh

# Ensure output directory exists and is writable
mkdir -p public/data
touch public/data/test.txt && rm public/data/test.txt
```

### Test Failures
```bash
# Run tests with more verbose output
python -m pytest tests/ -v -s --tb=long

# Run a specific test
python -m pytest tests/analyzer/test_rules.py::TestAnalyzerRules::test_presence_absence_conflict -v

# Check test coverage
python -m pytest tests/ --cov=analyzer
```

## Success Criteria

Your verification is successful when:

1. ✅ **All 5 smoke test steps pass**
2. ✅ **No ModuleNotFoundError or import failures**  
3. ✅ **All expected output files are generated**
4. ✅ **JSON files contain valid data structures**
5. ✅ **CSV files are properly formatted**
6. ✅ **Unit tests pass without errors**
7. ✅ **No duplicate contradiction IDs in outputs**

## Next Steps After Successful Verification

1. **Start the frontend**: `npm run dev` 
2. **Upload real PDFs** via the web interface
3. **Run tampering detection** on your documents
4. **Generate oversight reports** for agencies
5. **Use advanced pattern analysis** tools

## Getting Help

If verification fails:

1. **Check the detailed output** from the smoke test or diagnostics
2. **Review the specific error messages** and error codes
3. **Ensure all dependencies are installed** with correct versions
4. **Verify you're running from the repository root directory**
5. **Check file permissions** and directory structure

The verification tools are designed to provide specific guidance for each type of failure, so pay attention to the suggested fixes in the output.