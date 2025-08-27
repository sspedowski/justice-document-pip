#!/usr/bin/env python3
"""
Test script for bundle_exhibits.py functionality.
"""

import os
import sys
import tempfile
import json
import zipfile
import shutil
from pathlib import Path

# Add scripts directory to path
sys.path.append('scripts')


def test_bundle_exhibits():
    """Test the bundle exhibits functionality."""
    print("🧪 Testing bundle_exhibits.py functionality...")
    
    # Create temporary directory for testing
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Create test contradictions file
        test_contradictions = [
            {
                "contradiction_id": "test_001",
                "type": "test_rule",
                "rule": "test_rule",
                "score": 90,
                "description": "Test contradiction",
                "file_path": "test_file.txt"
            }
        ]
        
        contradictions_file = temp_path / "contradictions.json"
        with open(contradictions_file, 'w') as f:
            json.dump(test_contradictions, f)
        
        # Create test document (using relative path as expected by bundle_exhibits)
        test_doc = temp_path / "test_file.txt"
        with open(test_doc, 'w') as f:
            f.write("Test document content")
        
        # Update the contradiction to use relative path
        test_contradictions[0]["file_path"] = str(test_doc)
        
        # Test the bundling
        from bundle_exhibits import bundle_exhibits
        
        zip_files = bundle_exhibits(
            contradictions_file=str(contradictions_file),
            output_dir=str(temp_path),
            specific_rule="test_rule"
        )
        
        # Verify results
        assert len(zip_files) == 1, f"Expected 1 ZIP file, got {len(zip_files)}"
        
        zip_path = Path(zip_files[0])
        assert zip_path.exists(), f"ZIP file not created: {zip_path}"
        
        # Check ZIP contents
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            files = zipf.namelist()
            expected_files = [
                'test_rule/contradictions.json',
                'test_rule/contradictions.csv'
            ]
            
            for expected_file in expected_files:
                assert expected_file in files, f"Expected file {expected_file} not found in ZIP. Found: {files}"
        
        print("✅ All tests passed!")
        return True


if __name__ == "__main__":
    # Change to project directory
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent
    os.chdir(project_dir)
    
    try:
        test_bundle_exhibits()
        print("🎉 Test completed successfully!")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)