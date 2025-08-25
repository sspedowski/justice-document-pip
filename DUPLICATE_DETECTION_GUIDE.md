# Date-Based Duplicate Detection

This feature enhances your Justice Document Manager with sophisticated duplicate detection that catches documents sharing the same date but with subtle wording changes - perfect for identifying different versions of the same report.

## 🎯 What It Catches

### High-Priority Duplicates (80-100% confidence)
- **Same date + high content similarity**: Documents from the same date with 70%+ text overlap
- **Multiple document versions**: Reports that were revised but kept the same date

### Review-Required Items (40-79% confidence)  
- **Same date + moderate similarity**: Documents needing manual review
- **Multiple docs per date**: When 2+ documents share a date, even with different content

### Key People Tracking
- Automatically tracks mentions of: **Noel, Andy Maki, Banister, Russell, Verde**
- Shows how references to these people change between document versions
- Highlights when numbers (ages, dates, page refs) are altered

## 🔧 How to Use

### 1. Automatic Detection (During Upload)
The UI automatically checks for date-based duplicates when you upload PDFs:

```
📅 Same date (2023-01-15) with 3 other docs
🔍 85% content similarity - requires review
```

### 2. Batch Analysis (Python Script)
Run comprehensive analysis on your input directory:

```bash
# Basic usage
python scripts/compare_by_date.py

# Custom names to track
python scripts/compare_by_date.py --names "Name1,Name2,Name3"

# Compare all pairs (detailed analysis)
python scripts/compare_by_date.py --pairwise
```

### 3. Pipeline Integration
Add to your GitHub Actions or automated pipeline:

```bash
python scripts/run_duplicate_detection.py --integration
```

## 📊 Output Reports

### Interactive HTML Report
- **`output/date_diffs/index.html`**: Main overview of all date groups
- **`output/date_diffs/YYYY-MM-DD/diff_*.html`**: Detailed comparison pages
- **Word-level diff highlighting**: See exactly what changed between versions

### CSV Summary  
- **`output/date_diffs/changes_summary.csv`**: Machine-readable results
- Includes: tokens added/removed, name mention deltas, number changes

## 🔍 Date Detection Patterns

The system recognizes dates in multiple formats:

**In Document Text:**
- `01/15/2023`, `1/15/23` 
- `January 15, 2023`
- `2023-01-15`

**In Filenames:**
- `report_12.25.2022.pdf`
- `doc_2023-03-15.pdf` 
- `file_1.5.23.pdf`
- `investigation_2022_12_31.pdf`

**From PDF Metadata:**
- Creation date timestamps

## 🎛️ Configuration

### Similarity Thresholds
- **70%+ similarity**: Flagged as likely duplicate
- **40-69% similarity**: Flagged for manual review
- **<40% similarity**: Only flagged if multiple docs share the date

### Names to Track
Edit the default list in `scripts/compare_by_date.py`:
```python
--names "Noel,Andy Maki,Banister,Russell,Verde,Your,Custom,Names"
```

## 🚀 Integration with Your Workflow

### 1. GitHub Actions Pipeline
Add this step to `.github/workflows/pipeline.yml`:

```yaml
- name: Run duplicate detection
  run: python scripts/run_duplicate_detection.py --integration

- name: Upload duplicate reports
  uses: actions/upload-artifact@v4
  with:
    name: duplicate-detection-reports
    path: output/duplicates/
```

### 2. Local Development
```bash
# 1. Drop PDFs into input/
# 2. Run detection
python scripts/run_duplicate_detection.py

# 3. Review results
open output/duplicates/index.html
```

### 3. UI Integration
The duplicate detection is automatically integrated into your upload workflow. When duplicates are detected:

1. Upload pauses with a dialog showing the conflict
2. Options: Skip, Replace, or Keep Both
3. Date-based matches show the shared date and other documents
4. Special handling for documents with the same date

## 📈 Example Detection Scenarios

### Scenario 1: Report Revisions
```
Files:
- police_report_01_15_2023.pdf (original)
- police_report_revised_1-15-23.pdf (updated version)

Detection:
✅ Same date: 2023-01-15
✅ 89% content similarity  
📝 Changes: 23 words added, 15 removed
👥 Name changes: Noel mentions +2, Russell mentions -1
```

### Scenario 2: Multiple Document Types
```
Files:
- medical_exam_03_10_2023.pdf
- police_report_03_10_2023.pdf  
- witness_statement_3-10-23.pdf

Detection:
⚠️ Same date: 2023-03-10
⚠️ 3 documents, different content types
📋 Requires manual review to confirm no duplicates
```

## 🔧 Troubleshooting

### "No dates detected"
- Check date formats in document text and filenames
- Ensure PDFs have readable text (not scanned images)
- Consider adding OCR preprocessing for scanned documents

### "No duplicates found" 
- Verify documents actually share dates
- Check content similarity threshold (default 40%)
- Review the generated CSV for low-confidence matches

### Performance issues
- Large PDFs: The script processes first 50 pages by default
- Many documents: Use `--pairwise` sparingly for detailed analysis
- Cache: Text extraction is cached in `cache/text/` for speed

## 📋 Dependencies

Required Python packages (install via `pip install -r requirements.txt`):
- `pdfplumber` - PDF text extraction
- `PyPDF2` - PDF metadata reading  
- Built-in packages: `difflib`, `hashlib`, `pathlib`, `re`

## 🎯 Perfect For

- **Legal document management**: Catch subtle changes in legal filings
- **Investigation tracking**: Identify revised reports and statements  
- **Compliance monitoring**: Ensure document version control
- **Evidence management**: Track changes in witness statements or expert reports

The date-based detection works alongside your existing duplicate prevention to create a comprehensive system that catches both obvious duplicates and subtle document variations.