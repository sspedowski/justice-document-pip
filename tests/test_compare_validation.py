#!/usr/bin/env python3
"""
Simple validation test for compare_by_date.py

Validates that the script imports correctly and has the expected functions.
"""
import sys
from pathlib import Path

# Add the scripts directory to the path
project_root = Path(__file__).parent.parent
scripts_dir = project_root / "scripts"
sys.path.insert(0, str(scripts_dir))

def test_script_validation():
    """Test that the script can be imported and has expected functions"""
    print("Testing compare_by_date.py script validation...")
    
    try:
        # Test import
        import compare_by_date
        print("✓ Script imports successfully")
        
        # Test required functions exist
        required_functions = [
            'safe_read_pdf',
            'extract_date', 
            'tokenize',
            'inline_diff_html',
            'name_counts',
            'extract_lines_with_names',
            'main'
        ]
        
        for func_name in required_functions:
            if hasattr(compare_by_date, func_name):
                print(f"✓ Function {func_name} exists")
            else:
                print(f"✗ Function {func_name} missing")
                return False
        
        # Test basic functionality without external dependencies
        print("✓ Basic function validation passed")
        
        # Test date pattern compilation
        import re
        for i, pattern in enumerate(compare_by_date.DATE_PATTERNS):
            try:
                re.compile(pattern)
                print(f"✓ Date pattern {i+1} compiles correctly")
            except re.error as e:
                print(f"✗ Date pattern {i+1} failed: {e}")
                return False
        
        # Test tokenization
        sample_text = "This is a test document with Noel and 123 numbers."
        tokens = compare_by_date.tokenize(sample_text)
        if len(tokens) > 0 and 'Noel' in tokens and '123' in tokens:
            print("✓ Tokenization works correctly")
        else:
            print("✗ Tokenization failed")
            return False
        
        # Test name counting
        names = ["Noel", "Andy Maki", "Russell"]
        counts = compare_by_date.name_counts(sample_text, names)
        if counts['Noel'] == 1 and counts['Andy Maki'] == 0:
            print("✓ Name counting works correctly")
        else:
            print("✗ Name counting failed")
            return False
        
        print("✓ All validation tests passed!")
        return True
        
    except ImportError as e:
        print(f"✗ Import failed: {e}")
        return False
    except Exception as e:
        print(f"✗ Validation failed: {e}")
        return False

def test_output_structure():
    """Test that the expected output directory structure is valid"""
    print("Testing output structure...")
    
    try:
        # Test that output directories can be created
        test_output = Path("test_output_structure")
        test_output.mkdir(exist_ok=True)
        
        # Test date directory creation
        date_dir = test_output / "2023-01-15"
        date_dir.mkdir(exist_ok=True)
        print("✓ Date directory creation works")
        
        # Test file path generation
        compare_by_date = sys.modules.get('compare_by_date')
        if compare_by_date:
            # Test write_file function
            test_file = test_output / "test.html"
            compare_by_date.write_file(test_file, "<html><body>Test</body></html>")
            
            if test_file.exists() and test_file.read_text().strip():
                print("✓ File writing works correctly")
            else:
                print("✗ File writing failed")
                return False
        
        # Cleanup
        import shutil
        shutil.rmtree(test_output, ignore_errors=True)
        
        print("✓ Output structure validation passed!")
        return True
        
    except Exception as e:
        print(f"✗ Output structure validation failed: {e}")
        return False

if __name__ == "__main__":
    success = test_script_validation() and test_output_structure()
    
    if success:
        print("\n🎉 All tests passed! The date comparison script is ready to use.")
        print("\nTo run the full comparison:")
        print("1. Install dependencies: pip install pdfplumber PyPDF2")
        print("2. Add PDFs to input/ directory")  
        print("3. Run: python scripts/compare_by_date.py")
        print("4. View results in output/date_diffs/index.html")
    else:
        print("\n❌ Some tests failed. Please check the script implementation.")
    
    sys.exit(0 if success else 1)