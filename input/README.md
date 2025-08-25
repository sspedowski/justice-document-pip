# Sample Documents for Date-Based Comparison Testing

This directory contains sample documents with intentional tampering to test the date-based comparison feature.

## Document Groups

### December 15, 2023 - Police Reports
- **PoliceReport_12.15.2023_Original.txt** - Original police incident report
- **PoliceReport_12.15.2023_Revised.txt** - Altered version with key tampering

**Key Changes Detected:**
- Witness name: "Noel Johnson" → "Neil Johnson"
- Evidence count: "12 digital photographs" → "8 digital photographs"
- Conclusion: "substantiated" → "unsubstantiated"
- Case status: "ACTIVE - INVESTIGATION CONTINUING" → "CLOSED - INSUFFICIENT EVIDENCE"

### January 8, 2024 - CPS Reports
- **CPS_Report_01.08.2024_Initial.txt** - Initial CPS assessment
- **CPS_Report_01.08.2024_Amended.txt** - Amended version with alterations

**Key Changes Detected:**
- Child name: "Nicholas Williams" → "Owen Williams"
- Witness statement: "Noel Johnson (provided statement)" → (removed)
- Risk assessment: "LOW" → "MODERATE"
- Services: "Voluntary family support" → "Mandatory parenting classes"

### March 10, 2024 - Medical Report
- **Medical_Exam_03.10.2024.txt** - Single medical examination report

## Testing Instructions

1. **Run the Date-Based Comparison Test**: Click the "Test Date Comparison" button in the main interface
2. **Analyze Results**: The system will detect and highlight all intentional alterations
3. **Review Suspicion Scores**: Documents with tampering will receive high suspicion scores
4. **Examine Change Details**: View specific before/after changes and affected name mentions

## Expected Results

- **2 document pairs** should be detected (same dates)
- **Critical changes** should be flagged with high severity
- **Name mention analysis** should show altered frequencies
- **Suspicion scores** should be elevated for tampered documents

## Real Usage

For actual document analysis:
1. Place PDF documents in the `input/` directory
2. Use the "Detect Tampering" feature for comprehensive analysis
3. The system will automatically group documents by date and detect alterations