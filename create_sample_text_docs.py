from pathlib import Path
import json

def create_sample_text_documents():
    """Create sample text documents for testing the comparison script."""
    
    input_dir = Path("input")
    input_dir.mkdir(exist_ok=True)
    
    # Document 1: Original Police Report (12/15/2023)
    doc1_text = """POLICE INCIDENT REPORT
Date: December 15, 2023
Incident #: 2023-456789
Officer: Det. Andy Maki

NARRATIVE:

On December 15, 2023, at approximately 14:30 hours, I responded to a call
regarding a domestic disturbance at 123 Main Street.

Upon arrival, I interviewed the following individuals:
- Noel Johnson (witness, age 34)
- Josh Williams (complainant, age 28)
- Russell Banister (responding EMT)

EVIDENCE COLLECTED:
- Photo evidence: 12 digital photographs
- Witness statement from Noel Johnson
- Medical report from Dr. Verde

CONCLUSION:
Based on the evidence collected and witness testimony from Noel,
this incident appears to be substantiated. Josh Williams provided
consistent details that corroborate the physical evidence.

Case Status: ACTIVE - INVESTIGATION CONTINUING
Evidence secured in locker #247

Officer Badge #: 1023
Supervisor: Sergeant Thompson

END OF REPORT"""
    
    # Document 2: Altered Police Report (Same date - 12/15/2023)
    doc2_text = """POLICE INCIDENT REPORT
Date: December 15, 2023
Incident #: 2023-456789
Officer: Det. Andy Maki

NARRATIVE:

On December 15, 2023, at approximately 14:30 hours, I responded to a call
regarding a domestic disturbance at 123 Main Street.

Upon arrival, I interviewed the following individuals:
- Neil Johnson (witness, age 34)
- Josh Williams (complainant, age 28)
- Russell Banister (responding EMT)

EVIDENCE COLLECTED:
- Photo evidence: 8 digital photographs
- Witness statement from Neil Johnson
- Medical report from Dr. Verde

CONCLUSION:
Based on the evidence collected and witness testimony from Neil,
this incident appears to be unsubstantiated. Josh Williams provided
inconsistent details that do not corroborate the physical evidence.

Case Status: CLOSED - INSUFFICIENT EVIDENCE
Evidence secured in locker #247

Officer Badge #: 1023
Supervisor: Sergeant Thompson

END OF REPORT"""
    
    # Document 3: CPS Report (01/08/2024)
    doc3_text = """CHILD PROTECTIVE SERVICES REPORT
Date: January 8, 2024
Case #: CPS-2024-001234
Caseworker: Sarah Martinez

INITIAL ASSESSMENT REPORT:

On January 8, 2024, CPS received a referral regarding potential
neglect involving the following children:

CHILDREN INVOLVED:
- Jace Williams (age 8)
- Nicholas Williams (age 6)
- Peyton Williams (age 4)

ALLEGATIONS:
Educational neglect and inadequate supervision reported by
school counselor and confirmed by neighbor Noel Johnson.

INVESTIGATION FINDINGS:
During home visit, observed the following:
- Children appeared well-fed and clean
- Home environment was safe and adequate
- Educational materials present

INTERVIEWS CONDUCTED:
- Parent: Josh Williams (cooperative)
- Neighbor: Noel Johnson (provided statement)
- School: Principal Anderson

RISK ASSESSMENT: LOW
Services recommended: Voluntary family support

Next review: February 15, 2024

Caseworker Signature: S. Martinez"""
    
    # Document 4: Altered CPS Report (Same date - 01/08/2024)
    doc4_text = """CHILD PROTECTIVE SERVICES REPORT
Date: January 8, 2024
Case #: CPS-2024-001234
Caseworker: Sarah Martinez

INITIAL ASSESSMENT REPORT:

On January 8, 2024, CPS received a referral regarding potential
neglect involving the following children:

CHILDREN INVOLVED:
- Jace Williams (age 8)
- Owen Williams (age 6)
- Peyton Williams (age 4)

ALLEGATIONS:
Educational neglect and inadequate supervision reported by
school counselor. Neighbor report unsubstantiated.

INVESTIGATION FINDINGS:
During home visit, observed the following:
- Children appeared adequately cared for
- Home environment was minimally adequate
- Some educational materials present

INTERVIEWS CONDUCTED:
- Parent: Josh Williams (partially cooperative)
- School: Principal Anderson

RISK ASSESSMENT: MODERATE
Services required: Mandatory parenting classes

Next review: January 22, 2024

Caseworker Signature: S. Martinez"""
    
    # Document 5: Medical Report (03/10/2024)
    doc5_text = """PEDIATRIC MEDICAL EXAMINATION
Date: March 10, 2024
Patient: John Williams (age 10)
Physician: Dr. Rebecca Verde

MEDICAL EXAMINATION REPORT:

CHIEF COMPLAINT:
Routine follow-up examination requested by CPS caseworker
following previous concerns about child welfare.

PHYSICAL EXAMINATION:
- Height: 52 inches (75th percentile)
- Weight: 68 pounds (50th percentile)
- Overall appearance: Well-nourished, alert
- No signs of physical abuse or neglect

BEHAVIORAL OBSERVATIONS:
Child was cooperative during examination.
Appropriate interaction with caregiver (Josh Williams).
No concerning behavioral indicators observed.

MEDICAL HISTORY:
No significant medical issues reported.
Immunizations up to date.
Last dental exam: 6 months ago

ASSESSMENT:
Normal pediatric examination.
Child appears healthy and well-cared for.

RECOMMENDATIONS:
Continue routine pediatric care.
No immediate medical concerns.

Dr. Rebecca Verde, MD
Pediatrics"""
    
    # Write text files (we'll convert them to simple mock PDFs for testing)
    files = [
        ("PoliceReport_12.15.2023_Original.txt", doc1_text),
        ("PoliceReport_12.15.2023_Revised.txt", doc2_text),
        ("CPS_Report_01.08.2024_Initial.txt", doc3_text),
        ("CPS_Report_01.08.2024_Amended.txt", doc4_text),
        ("Medical_Exam_03.10.2024.txt", doc5_text)
    ]
    
    for filename, content in files:
        file_path = input_dir / filename
        file_path.write_text(content, encoding='utf-8')
        print(f"Created: {file_path}")
    
    # Create a JSON manifest describing the expected tampering
    tampering_manifest = {
        "description": "Sample documents with intentional tampering for testing date-based comparison",
        "document_groups": [
            {
                "date": "2023-12-15",
                "description": "Police Report - Original vs Revised",
                "documents": [
                    "PoliceReport_12.15.2023_Original.txt",
                    "PoliceReport_12.15.2023_Revised.txt"
                ],
                "key_changes": [
                    "Witness name: Noel Johnson → Neil Johnson",
                    "Photo count: 12 → 8 photographs",
                    "Conclusion: substantiated → unsubstantiated",
                    "Details: consistent → inconsistent",
                    "Case status: ACTIVE → CLOSED"
                ]
            },
            {
                "date": "2024-01-08",
                "description": "CPS Report - Initial vs Amended",
                "documents": [
                    "CPS_Report_01.08.2024_Initial.txt",
                    "CPS_Report_01.08.2024_Amended.txt"
                ],
                "key_changes": [
                    "Child name: Nicholas Williams → Owen Williams",
                    "Noel Johnson statement removed",
                    "Risk assessment: LOW → MODERATE",
                    "Services: Voluntary → Mandatory",
                    "Review date: Feb 15 → Jan 22"
                ]
            },
            {
                "date": "2024-03-10",
                "description": "Medical Report - Single document",
                "documents": [
                    "Medical_Exam_03.10.2024.txt"
                ],
                "key_changes": []
            }
        ],
        "target_names": ["Noel", "Andy Maki", "Banister", "Russell", "Verde", "Josh", "Jace", "Nicholas", "Owen", "Peyton", "John"]
    }
    
    manifest_path = input_dir / "tampering_manifest.json"
    manifest_path.write_text(json.dumps(tampering_manifest, indent=2), encoding='utf-8')
    print(f"Created manifest: {manifest_path}")
    
    print("\nSample documents created for testing:")
    print("- Documents with same dates will be compared")
    print("- Key tampering includes name changes, number alterations, and status modifications")
    print("- Run the comparison script to detect these changes")

if __name__ == "__main__":
    create_sample_text_documents()