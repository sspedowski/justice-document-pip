#!/usr/bin/env python3
"""
Test script for compare_by_date.py

Creates sample PDFs with different dates and content to verify the comparison functionality.
"""
import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
import tempfile
import subprocess

# Add the scripts directory to the path so we can import our script
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "scripts"))

def create_test_pdf(filename: str, content: str, date_str: str):
    """Create a simple PDF with the given content and date"""
    doc = canvas.Canvas(filename, pagesize=LETTER)
    
    # Add date at the top
    doc.setFont("Helvetica", 12)
    doc.drawString(72, 750, f"Document Date: {date_str}")
    
    # Add content
    y = 720
    lines = content.split('\n')
    for line in lines:
        doc.drawString(72, y, line)
        y -= 20
        if y < 100:  # Start new page if needed
            doc.showPage()
            y = 750
    
    doc.save()

def test_compare_by_date():
    """Test the date-based comparison functionality"""
    print("Testing compare_by_date.py...")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        input_dir = Path(temp_dir) / "input"
        output_dir = Path(temp_dir) / "output"
        input_dir.mkdir()
        
        # Create test documents with same dates but different content
        # Document set 1: Same date (2023-01-15)
        create_test_pdf(
            str(input_dir / "doc1_v1.pdf"),
            "Investigation Report\nOfficer: John Smith\nSubject: Noel Anderson\nDate: January 15, 2023\n\nInitial findings indicate no misconduct.\nWitness statements collected: 3\nEvidence reviewed: Case file #12345",
            "January 15, 2023"
        )
        
        create_test_pdf(
            str(input_dir / "doc1_v2.pdf"),
            "Investigation Report\nOfficer: John Smith\nSubject: Noel Anderson\nDate: January 15, 2023\n\nRevised findings indicate potential misconduct.\nWitness statements collected: 5\nEvidence reviewed: Case file #12345, Additional documents\nNote: Andy Maki provided contradictory testimony.",
            "January 15, 2023"
        )
        
        # Document set 2: Same date (2023-02-10)
        create_test_pdf(
            str(input_dir / "medical_v1.pdf"),
            "Medical Examination Report\nPatient: Confidential\nExaminer: Dr. Russell\nDate: February 10, 2023\n\nNo visible injuries observed.\nChild appeared calm and cooperative.",
            "February 10, 2023"
        )
        
        create_test_pdf(
            str(input_dir / "medical_v2.pdf"),
            "Medical Examination Report\nPatient: Confidential\nExaminer: Dr. Russell\nDate: February 10, 2023\n\nMultiple contusions observed on arms and legs.\nChild appeared distressed and withdrawn.\nRecommend immediate protective measures.",
            "February 10, 2023"
        )
        
        # Document set 3: Different date (should not be compared)
        create_test_pdf(
            str(input_dir / "single_doc.pdf"),
            "Standalone Report\nDate: March 5, 2023\nThis document should not be compared as it has a unique date.",
            "March 5, 2023"
        )
        
        # Run the comparison script
        script_path = project_root / "scripts" / "compare_by_date.py"
        cmd = [
            sys.executable, str(script_path),
            "--input", str(input_dir),
            "--out", str(output_dir),
            "--names", "Noel,Andy Maki,Banister,Russell,Verde"
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print("✓ Script executed successfully")
            print(f"Output: {result.stdout}")
            
            # Check if expected output files were created
            expected_files = [
                output_dir / "index.html",
                output_dir / "changes_summary.csv"
            ]
            
            for file_path in expected_files:
                if file_path.exists():
                    print(f"✓ {file_path.name} created successfully")
                else:
                    print(f"✗ {file_path.name} not found")
                    return False
            
            # Check if date-specific directories were created
            date_dirs = list(output_dir.glob("20*"))  # Look for YYYY-MM-DD directories
            if len(date_dirs) >= 2:
                print(f"✓ Found {len(date_dirs)} date-specific directories")
                
                # Check for HTML diff files
                html_files = list(output_dir.glob("*/diff_*.html"))
                if html_files:
                    print(f"✓ Found {len(html_files)} diff HTML files")
                else:
                    print("✗ No diff HTML files found")
                    return False
            else:
                print(f"✗ Expected at least 2 date directories, found {len(date_dirs)}")
                return False
            
            # Verify CSV content has expected structure
            csv_path = output_dir / "changes_summary.csv"
            with open(csv_path, 'r') as f:
                csv_content = f.read()
                if "date,doc_a,doc_b,tokens_added,tokens_removed" in csv_content:
                    print("✓ CSV has correct header structure")
                else:
                    print("✗ CSV header is incorrect")
                    return False
                
                # Should have at least 2 comparison rows (one for each date group)
                lines = csv_content.strip().split('\n')
                if len(lines) >= 3:  # header + at least 2 data rows
                    print(f"✓ CSV contains {len(lines) - 1} comparison rows")
                else:
                    print(f"✗ Expected at least 2 comparison rows, found {len(lines) - 1}")
                    return False
            
            print("✓ All tests passed!")
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"✗ Script execution failed: {e}")
            print(f"stderr: {e.stderr}")
            return False

if __name__ == "__main__":
    success = test_compare_by_date()
    sys.exit(0 if success else 1)