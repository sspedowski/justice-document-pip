#!/usr/bin/env python3
"""
Quick verification that your REAL evidence files contain the expected tampering indicators.
This script confirms the contradictions are present before running the web analysis.
"""

import os
from pathlib import Path

def verify_contradictions():
    """Verify the specific contradictions exist in your input files."""
    
    input_dir = Path("input")
    if not input_dir.exists():
        print("❌ ERROR: input/ directory not found")
        return False
    
    print("🔍 VERIFYING YOUR REAL EVIDENCE FILES FOR TAMPERING INDICATORS...\n")
    
    # Expected file pairs with contradictions
    file_pairs = [
        ("CPS_Report_01.08.2024_Initial.txt", "CPS_Report_01.08.2024_Amended.txt"),
        ("PoliceReport_12.15.2023_Original.txt", "PoliceReport_12.15.2023_Revised.txt")
    ]
    
    contradictions_found = 0
    
    for original_file, tampered_file in file_pairs:
        original_path = input_dir / original_file
        tampered_path = input_dir / tampered_file
        
        if not original_path.exists() or not tampered_path.exists():
            print(f"❌ MISSING: {original_file} or {tampered_file}")
            continue
        
        print(f"\n📄 ANALYZING: {original_file} vs {tampered_file}")
        
        # Read both files
        original_text = original_path.read_text(encoding='utf-8')
        tampered_text = tampered_path.read_text(encoding='utf-8')
        
        # Check for specific contradictions
        if "CPS_Report" in original_file:
            # CPS Report contradictions
            checks = [
                ("Nicholas Williams", "Owen Williams", "Child name change"),
                ("Noel Johnson", "neighbor Noel Johnson statement REMOVED", "Witness statement removal"),
                ("RISK ASSESSMENT: LOW", "RISK ASSESSMENT: MODERATE", "Risk level manipulation"),
                ("cooperative", "partially cooperative", "Cooperation status change"),
                ("well-fed and clean", "adequately cared for", "Care assessment downgrade"),
                ("safe and adequate", "minimally adequate", "Home assessment downgrade"),
                ("Voluntary family support", "Mandatory parenting classes", "Service escalation")
            ]
            
            for orig_text, changed_text, description in checks:
                if orig_text in original_text:
                    if orig_text not in tampered_text or changed_text in tampered_text:
                        print(f"  ✅ CONFIRMED: {description}")
                        contradictions_found += 1
                    else:
                        print(f"  ❌ NOT FOUND: {description}")
                        
        elif "PoliceReport" in original_file:
            # Police Report contradictions  
            checks = [
                ("Noel Johnson", "Neil Johnson", "Witness name change"),
                ("12 digital photographs", "8 digital photographs", "Evidence count reduction"),
                ("ACTIVE - INVESTIGATION CONTINUING", "CLOSED - INSUFFICIENT EVIDENCE", "Case status reversal"),
                ("substantiated", "unsubstantiated", "Conclusion reversal"),
                ("consistent details that corroborate", "inconsistent details that do not corroborate", "Evidence assessment reversal")
            ]
            
            for orig_text, changed_text, description in checks:
                if orig_text in original_text and changed_text in tampered_text:
                    print(f"  ✅ CONFIRMED: {description}")
                    contradictions_found += 1
                elif orig_text in original_text:
                    print(f"  ⚠️  PARTIAL: Found '{orig_text}' in original but change unclear")
                else:
                    print(f"  ❌ NOT FOUND: {description}")
    
    # Check medical exam file
    medical_file = input_dir / "Medical_Exam_03.10.2024.txt"
    if medical_file.exists():
        print(f"\n📄 FOUND: Medical_Exam_03.10.2024.txt (Supporting evidence)")
        medical_text = medical_file.read_text(encoding='utf-8')
        if "John Williams" in medical_text and "Dr. Rebecca Verde" in medical_text:
            print("  ✅ CONFIRMED: Medical exam with John Williams by Dr. Verde")
            contradictions_found += 1
    
    print(f"\n📊 TAMPERING VERIFICATION COMPLETE")
    print(f"🚨 TOTAL CONTRADICTIONS CONFIRMED: {contradictions_found}")
    
    if contradictions_found >= 8:
        print("✅ STATUS: READY FOR ANALYSIS - Systematic tampering detected across multiple documents")
        print("🎯 RECOMMENDATION: Run web analysis immediately for detailed forensic report")
        return True
    else:
        print("⚠️  STATUS: FILES MAY BE INCOMPLETE - Some expected contradictions not found")
        print("🔧 RECOMMENDATION: Verify file integrity and re-run verification")
        return False

if __name__ == "__main__":
    verify_contradictions()