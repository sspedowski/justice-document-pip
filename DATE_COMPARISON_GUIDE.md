# Date-Based Document Comparison

This tool detects potential document tampering by comparing PDFs that share the same date and highlighting exact differences at the word level.

## How It Works

1. **Scans** all PDFs in the `input/` directory
2. **Extracts** text using pdfplumber (high-quality text extraction)
3. **Detects** document dates from:
   - Document content (various date formats)
   - Filenames (e.g., `report_2023-01-15.pdf`)
   - PDF metadata (creation date)
4. **Groups** documents by exact date (YYYY-MM-DD format)
5. **Compares** documents within each date group using word-level diffs
6. **Tracks** mentions of key individuals (Noel, Andy Maki, Banister, Russell, Verde)
7. **Identifies** numerical changes (ages, dates, case numbers, measurements)

## Usage

### Quick Start

```bash
# Install dependencies
pip install pdfplumber PyPDF2

# Run comparison
python scripts/compare_by_date.py --names "Noel,Andy Maki,Banister,Russell,Verde"

# Open results
open output/date_diffs/index.html
```

### Advanced Options

```bash
# Compare all pairs within each date (more comprehensive but slower)
python scripts/compare_by_date.py --pairwise

# Custom input/output directories
python scripts/compare_by_date.py --input /path/to/pdfs --out /path/to/results

# Custom names to track
python scripts/compare_by_date.py --names "Person1,Person2,Another Name"
```

## Output Files

### `output/date_diffs/index.html`
- Overview of all date groups with 2+ documents
- Quick links to detailed comparisons
- Summary statistics

### `output/date_diffs/changes_summary.csv`
- Structured data of all comparisons
- Columns: date, doc_a, doc_b, tokens_added, tokens_removed, name_counts, numbers_changed
- Import into Excel for further analysis

### `output/date_diffs/YYYY-MM-DD/diff_*.html`
- Detailed word-level comparisons
- Inline highlighting (green = added, red = removed)
- Name mention analysis
- Numerical change tracking
- Context around name mentions

## What to Look For

### Evidence of Tampering

1. **Changed Conclusions**
   - "No evidence of misconduct" → "Evidence of misconduct found"
   - "Child appeared calm" → "Child appeared distressed"

2. **Altered Details**
   - Different injury descriptions
   - Modified witness statements
   - Changed timeline elements

3. **Numerical Inconsistencies**
   - Different ages or dates
   - Changed case/file numbers
   - Modified measurements

4. **Name Mention Changes**
   - Added/removed references to key individuals
   - Different contexts for the same person
   - Contradictory statements about individuals

### HTML Report Features

- **Green highlighting**: Text added in the later version
- **Red highlighting**: Text removed from the earlier version
- **Name tables**: Show mention count changes for tracked individuals
- **Context sections**: Display lines containing tracked names
- **Number tracking**: Lists numerical values that changed

## Integration with Legal Process

### For Oversight Packets
1. Export HTML reports showing specific alterations
2. Include CSV data as structured evidence
3. Highlight name mention deltas in cover letters
4. Reference specific line changes in formal complaints

### For Media Releases
1. Sanitize HTML reports (remove personal info)
2. Focus on procedural inconsistencies
3. Use numerical change data for timeline verification

## Technical Details

### Date Detection Patterns
- `MM/DD/YYYY` or `M/D/YYYY`
- `Month DD, YYYY` (e.g., "January 15, 2023")
- `YYYY-MM-DD` (ISO format)
- Filename patterns: `12.10.20`, `2020-02-26`

### Text Processing
- Caches extracted text for performance
- Normalizes whitespace and line breaks
- Tokenizes on word boundaries and punctuation
- Uses difflib.SequenceMatcher for precise comparisons

### Performance
- Text extraction cached by file hash
- Processes 50+ page documents efficiently
- Generates reports in seconds for most document sets

## Troubleshooting

### Common Issues

**"ERROR: pdfplumber is required"**
```bash
pip install pdfplumber PyPDF2
```

**No dates detected**
- Check if PDFs contain readable text (not just scanned images)
- Verify date formats in document content
- Add OCR processing if needed

**Empty comparison groups**
- Ensure multiple documents share exact dates
- Check date extraction with `--verbose` flag
- Manually verify document dates

**Large file processing**
- Increase available memory for Python
- Process documents in smaller batches
- Use `--cache-only` to pre-extract text

### Advanced Configuration

Create `config.yaml` to customize:
```yaml
date_patterns:
  - "\\b(\\d{1,2})/(\\d{1,2})/(\\d{4})\\b"  # Custom date regex
names:
  - "Custom Name 1"
  - "Custom Name 2"
output_format: "detailed"  # or "summary"
```

## Example Output

### Date Group: 2023-01-15 (2 documents)

**Document A**: `input/investigation_report_v1.pdf`
**Document B**: `input/investigation_report_v2.pdf`

**Changes Detected**:
- 47 tokens added, 12 tokens removed
- Noel mentions: 3 → 5 (+2)
- Andy Maki mentions: 1 → 0 (-1)
- Numbers changed: "3 witnesses" → "5 witnesses"

**Key Alteration**:
```
- Initial findings indicate no misconduct
+ Revised findings indicate potential misconduct
+ Note: Andy Maki provided contradictory testimony
```

This type of precise change detection helps build strong cases for document tampering or procedural misconduct.