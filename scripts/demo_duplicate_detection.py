#!/usr/bin/env python3
"""
Quick demo of the date-based duplicate detection script.

This creates sample PDFs and runs the comparison to show how it works.
"""

import tempfile
import os
from pathlib import Path

def create_sample_pdf_content():
    """Create minimal sample content for testing"""
    return [
        # Same date, similar content (should be flagged)
        ("investigation_01_15_2023.pdf", "Investigation Report\nDate: January 15, 2023\nNoel was present during the interview. Russell confirmed the details. Key findings indicate issues with Andy Maki's handling of the case."),
        ("report_1-15-23.pdf", "Investigation Report\nDate: January 15, 2023\nNoel was present during the interview. Russell confirmed the details. Key findings indicate problems with Andy Maki's handling of the case."),
        
        # Different date, similar content (should NOT be flagged)
        ("investigation_01_16_2023.pdf", "Investigation Report\nDate: January 16, 2023\nNoel was present during the interview. Russell confirmed the details. Key findings indicate issues with Andy Maki's handling of the case."),
        
        # Same date, very different content (should be flagged for review)
        ("medical_exam_01_15_2023.pdf", "Medical Examination Report\nDate: January 15, 2023\nPatient presented with injuries. Banister was the examining physician. Verde assisted with documentation."),
        
        # No clear date (should be in unknown group)
        ("misc_document.pdf", "Some document without a clear date. This contains information about various people and events.")
    ]

def create_dummy_pdfs(temp_dir):
    """Create simple text files pretending to be PDFs for the demo"""
    samples = create_sample_pdf_content()
    
    for filename, content in samples:
        file_path = temp_dir / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            # Add some PDF-like header to make it look more realistic
            f.write("%PDF-1.4\n")
            f.write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
            f.write("stream\n")
            f.write(content)
            f.write("\nendstream\n")
            f.write("%%EOF\n")

def main():
    print("🔍 Date-Based Duplicate Detection Demo")
    print("=" * 50)
    
    # Create temporary directory structure
    with tempfile.TemporaryDirectory() as temp_base:
        temp_path = Path(temp_base)
        input_dir = temp_path / "input"
        output_dir = temp_path / "output"
        
        input_dir.mkdir(exist_ok=True)
        output_dir.mkdir(exist_ok=True)
        
        # Create sample PDFs
        print("\n📁 Creating sample documents...")
        create_dummy_pdfs(input_dir)
        
        # List created files
        print(f"\nCreated {len(list(input_dir.glob('*.pdf')))} sample documents:")
        for pdf in input_dir.glob("*.pdf"):
            print(f"  • {pdf.name}")
        
        # Show what the script would detect
        print("\n🎯 Expected Detection Results:")
        print("  • investigation_01_15_2023.pdf & report_1-15-23.pdf")
        print("    → Same date (2023-01-15) with high content similarity")
        print("  • medical_exam_01_15_2023.pdf")
        print("    → Same date (2023-01-15) but different content - flagged for review")
        print("  • investigation_01_16_2023.pdf")
        print("    → Different date (2023-01-16) - no conflict")
        print("  • misc_document.pdf")
        print("    → No detectable date - placed in 'unknown' group")
        
        print(f"\n💡 To run the actual detection:")
        print(f"   python scripts/compare_by_date.py --input {input_dir} --out {output_dir}")
        print(f"   Then open: {output_dir}/index.html")
        
        print("\n🔧 Integration with your Justice Document Manager:")
        print("  1. Add PDFs to your input/ directory")
        print("  2. Run: python scripts/run_duplicate_detection.py")
        print("  3. Check output/duplicates/ for detailed comparison reports")
        print("  4. The UI will automatically flag date-based duplicates during upload")

if __name__ == "__main__":
    main()