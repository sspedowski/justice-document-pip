import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from pathlib import Path

def create_sample_pdfs():
    """Create sample PDF documents with intentional tampering for testing."""
    
    input_dir = Path("input")
    input_dir.mkdir(exist_ok=True)
    
    # Document 1: Original Police Report (12/15/2023)
    doc1_path = input_dir / "PoliceReport_12.15.2023_Original.pdf"
    c1 = canvas.Canvas(str(doc1_path), pagesize=letter)
    c1.setFont("Helvetica", 12)
    
    # Header
    c1.drawString(100, 750, "POLICE INCIDENT REPORT")
    c1.drawString(100, 730, "Date: December 15, 2023")
    c1.drawString(100, 710, "Incident #: 2023-456789")
    c1.drawString(100, 690, "Officer: Det. Andy Maki")
    
    # Report content with key names and details
    content1 = [
        "NARRATIVE:",
        "",
        "On December 15, 2023, at approximately 14:30 hours, I responded to a call",
        "regarding a domestic disturbance at 123 Main Street.",
        "",
        "Upon arrival, I interviewed the following individuals:",
        "- Noel Johnson (witness, age 34)",
        "- Josh Williams (complainant, age 28)",
        "- Russell Banister (responding EMT)",
        "",
        "EVIDENCE COLLECTED:",
        "- Photo evidence: 12 digital photographs",
        "- Witness statement from Noel Johnson",
        "- Medical report from Dr. Verde",
        "",
        "CONCLUSION:",
        "Based on the evidence collected and witness testimony from Noel,",
        "this incident appears to be substantiated. Josh Williams provided",
        "consistent details that corroborate the physical evidence.",
        "",
        "Case Status: ACTIVE - INVESTIGATION CONTINUING",
        "Evidence secured in locker #247",
        "",
        "Officer Badge #: 1023",
        "Supervisor: Sergeant Thompson",
        "",
        "END OF REPORT"
    ]
    
    y_pos = 650
    for line in content1:
        c1.drawString(100, y_pos, line)
        y_pos -= 20
    
    c1.save()
    
    # Document 2: Altered Police Report (Same date - 12/15/2023)
    doc2_path = input_dir / "PoliceReport_12.15.2023_Revised.pdf"
    c2 = canvas.Canvas(str(doc2_path), pagesize=letter)
    c2.setFont("Helvetica", 12)
    
    # Header (same)
    c2.drawString(100, 750, "POLICE INCIDENT REPORT")
    c2.drawString(100, 730, "Date: December 15, 2023")
    c2.drawString(100, 710, "Incident #: 2023-456789")
    c2.drawString(100, 690, "Officer: Det. Andy Maki")
    
    # Altered content - key changes highlighted in comments
    content2 = [
        "NARRATIVE:",
        "",
        "On December 15, 2023, at approximately 14:30 hours, I responded to a call",
        "regarding a domestic disturbance at 123 Main Street.",
        "",
        "Upon arrival, I interviewed the following individuals:",
        "- Neil Johnson (witness, age 34)",  # CHANGED: Noel -> Neil
        "- Josh Williams (complainant, age 28)",
        "- Russell Banister (responding EMT)",
        "",
        "EVIDENCE COLLECTED:",
        "- Photo evidence: 8 digital photographs",  # CHANGED: 12 -> 8 photos
        "- Witness statement from Neil Johnson",    # CHANGED: Noel -> Neil
        "- Medical report from Dr. Verde",
        "",
        "CONCLUSION:",
        "Based on the evidence collected and witness testimony from Neil,",  # CHANGED
        "this incident appears to be unsubstantiated. Josh Williams provided",  # CHANGED: substantiated -> unsubstantiated
        "inconsistent details that do not corroborate the physical evidence.",   # CHANGED: consistent -> inconsistent, corroborate -> do not corroborate
        "",
        "Case Status: CLOSED - INSUFFICIENT EVIDENCE",  # CHANGED: ACTIVE -> CLOSED
        "Evidence secured in locker #247",
        "",
        "Officer Badge #: 1023",
        "Supervisor: Sergeant Thompson",
        "",
        "END OF REPORT"
    ]
    
    y_pos = 650
    for line in content2:
        c2.drawString(100, y_pos, line)
        y_pos -= 20
    
    c2.save()
    
    # Document 3: CPS Report (01/08/2024)
    doc3_path = input_dir / "CPS_Report_01.08.2024_Initial.pdf"
    c3 = canvas.Canvas(str(doc3_path), pagesize=letter)
    c3.setFont("Helvetica", 12)
    
    # Header
    c3.drawString(100, 750, "CHILD PROTECTIVE SERVICES REPORT")
    c3.drawString(100, 730, "Date: January 8, 2024")
    c3.drawString(100, 710, "Case #: CPS-2024-001234")
    c3.drawString(100, 690, "Caseworker: Sarah Martinez")
    
    content3 = [
        "INITIAL ASSESSMENT REPORT:",
        "",
        "On January 8, 2024, CPS received a referral regarding potential",
        "neglect involving the following children:",
        "",
        "CHILDREN INVOLVED:",
        "- Jace Williams (age 8)",
        "- Nicholas Williams (age 6)",
        "- Peyton Williams (age 4)",
        "",
        "ALLEGATIONS:",
        "Educational neglect and inadequate supervision reported by",
        "school counselor and confirmed by neighbor Noel Johnson.",
        "",
        "INVESTIGATION FINDINGS:",
        "During home visit, observed the following:",
        "- Children appeared well-fed and clean",
        "- Home environment was safe and adequate",
        "- Educational materials present",
        "",
        "INTERVIEWS CONDUCTED:",
        "- Parent: Josh Williams (cooperative)",
        "- Neighbor: Noel Johnson (provided statement)",
        "- School: Principal Anderson",
        "",
        "RISK ASSESSMENT: LOW",
        "Services recommended: Voluntary family support",
        "",
        "Next review: February 15, 2024",
        "",
        "Caseworker Signature: S. Martinez"
    ]
    
    y_pos = 650
    for line in content3:
        c3.drawString(100, y_pos, line)
        y_pos -= 20
    
    c3.save()
    
    # Document 4: Altered CPS Report (Same date - 01/08/2024)
    doc4_path = input_dir / "CPS_Report_01.08.2024_Amended.pdf"
    c4 = canvas.Canvas(str(doc4_path), pagesize=letter)
    c4.setFont("Helvetica", 12)
    
    # Header (same)
    c4.drawString(100, 750, "CHILD PROTECTIVE SERVICES REPORT")
    c4.drawString(100, 730, "Date: January 8, 2024")
    c4.drawString(100, 710, "Case #: CPS-2024-001234")
    c4.drawString(100, 690, "Caseworker: Sarah Martinez")
    
    content4 = [
        "INITIAL ASSESSMENT REPORT:",
        "",
        "On January 8, 2024, CPS received a referral regarding potential",
        "neglect involving the following children:",
        "",
        "CHILDREN INVOLVED:",
        "- Jace Williams (age 8)",
        "- Owen Williams (age 6)",  # CHANGED: Nicholas -> Owen
        "- Peyton Williams (age 4)",
        "",
        "ALLEGATIONS:",
        "Educational neglect and inadequate supervision reported by",
        "school counselor. Neighbor report unsubstantiated.",  # CHANGED: removed Noel confirmation
        "",
        "INVESTIGATION FINDINGS:",
        "During home visit, observed the following:",
        "- Children appeared adequately cared for",  # CHANGED: well-fed -> adequately cared for
        "- Home environment was minimally adequate",  # CHANGED: safe and adequate -> minimally adequate
        "- Some educational materials present",  # CHANGED: Educational -> Some educational
        "",
        "INTERVIEWS CONDUCTED:",
        "- Parent: Josh Williams (partially cooperative)",  # CHANGED: cooperative -> partially cooperative
        "- School: Principal Anderson",  # REMOVED: Noel Johnson interview
        "",
        "RISK ASSESSMENT: MODERATE",  # CHANGED: LOW -> MODERATE
        "Services required: Mandatory parenting classes",  # CHANGED: Voluntary -> Mandatory
        "",
        "Next review: January 22, 2024",  # CHANGED: Feb 15 -> Jan 22 (sooner)
        "",
        "Caseworker Signature: S. Martinez"
    ]
    
    y_pos = 650
    for line in content4:
        c4.drawString(100, y_pos, line)
        y_pos -= 20
    
    c4.save()
    
    # Document 5: Medical Report (03/10/2024)
    doc5_path = input_dir / "Medical_Exam_03.10.2024.pdf"
    c5 = canvas.Canvas(str(doc5_path), pagesize=letter)
    c5.setFont("Helvetica", 12)
    
    # Header
    c5.drawString(100, 750, "PEDIATRIC MEDICAL EXAMINATION")
    c5.drawString(100, 730, "Date: March 10, 2024")
    c5.drawString(100, 710, "Patient: John Williams (age 10)")
    c5.drawString(100, 690, "Physician: Dr. Rebecca Verde")
    
    content5 = [
        "MEDICAL EXAMINATION REPORT:",
        "",
        "CHIEF COMPLAINT:",
        "Routine follow-up examination requested by CPS caseworker",
        "following previous concerns about child welfare.",
        "",
        "PHYSICAL EXAMINATION:",
        "- Height: 52 inches (75th percentile)",
        "- Weight: 68 pounds (50th percentile)",
        "- Overall appearance: Well-nourished, alert",
        "- No signs of physical abuse or neglect",
        "",
        "BEHAVIORAL OBSERVATIONS:",
        "Child was cooperative during examination.",
        "Appropriate interaction with caregiver (Josh Williams).",
        "No concerning behavioral indicators observed.",
        "",
        "MEDICAL HISTORY:",
        "No significant medical issues reported.",
        "Immunizations up to date.",
        "Last dental exam: 6 months ago",
        "",
        "ASSESSMENT:",
        "Normal pediatric examination.",
        "Child appears healthy and well-cared for.",
        "",
        "RECOMMENDATIONS:",
        "Continue routine pediatric care.",
        "No immediate medical concerns.",
        "",
        "Dr. Rebecca Verde, MD",
        "Pediatrics"
    ]
    
    y_pos = 650
    for line in content5:
        c5.drawString(100, y_pos, line)
        y_pos -= 20
    
    c5.save()
    
    print("Created 5 sample PDF documents:")
    print(f"- {doc1_path}")
    print(f"- {doc2_path}")
    print(f"- {doc3_path}")
    print(f"- {doc4_path}")
    print(f"- {doc5_path}")
    print()
    print("Documents with same dates for comparison:")
    print("- 12/15/2023: Police reports (Original vs Revised)")
    print("- 01/08/2024: CPS reports (Initial vs Amended)")
    print("- 03/10/2024: Medical report (single document)")

if __name__ == "__main__":
    create_sample_pdfs()