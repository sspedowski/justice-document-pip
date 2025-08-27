#!/usr/bin/env python3
"""
Complete smoke test for Justice Document Manager
Runs the full pipeline: analysis -> scoring -> tests
"""

import sys
import os
import subprocess
import json
from pathlib import Path
from datetime import datetime

# Configuration
REPO_ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = REPO_ROOT / "public" / "data"

def run_command(cmd, description="", timeout=60):
    """Run a command and return (success, output, error)"""
    print(f"🔧 {description or cmd}")
    
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            cwd=REPO_ROOT,
            capture_output=True, 
            text=True, 
            timeout=timeout
        )
        
        success = result.returncode == 0
        if success:
            print(f"✅ Command succeeded")
        else:
            print(f"❌ Command failed (exit code {result.returncode})")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
        
        return success, result.stdout, result.stderr
        
    except subprocess.TimeoutExpired:
        print(f"❌ Command timed out after {timeout} seconds")
        return False, "", "Timeout"
    except Exception as e:
        print(f"❌ Command failed with exception: {e}")
        return False, "", str(e)

def check_file_valid_json(filepath, description=""):
    """Check if file exists and contains valid JSON"""
    desc = description or str(filepath)
    
    if not filepath.exists():
        print(f"❌ {desc} does not exist")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        item_count = len(data) if isinstance(data, (list, dict)) else "unknown"
        print(f"✅ {desc} is valid JSON ({item_count} items)")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ {desc} contains invalid JSON: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading {desc}: {e}")
        return False

def check_csv_file(filepath, description=""):
    """Check if CSV file exists and is readable"""
    desc = description or str(filepath)
    
    if not filepath.exists():
        print(f"❌ {desc} does not exist")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"✅ {desc} is readable CSV ({len(lines)} lines)")
        return True
        
    except Exception as e:
        print(f"❌ Error reading {desc}: {e}")
        return False

def verify_output_files():
    """Verify all expected output files exist and are valid"""
    print("\n📋 Verifying output files...")
    
    files_to_check = [
        (OUTPUT_DIR / "contradictions.json", "contradictions.json", "json"),
        (OUTPUT_DIR / "statements_debug.json", "statements_debug.json", "json"),
        (OUTPUT_DIR / "run_meta.json", "run_meta.json", "json"),
        (OUTPUT_DIR / "contradictions_scored.json", "contradictions_scored.json", "json"),
        (OUTPUT_DIR / "contradictions_scored.csv", "contradictions_scored.csv", "csv")
    ]
    
    all_valid = True
    
    for filepath, description, file_type in files_to_check:
        if file_type == "json":
            if not check_file_valid_json(filepath, description):
                all_valid = False
        elif file_type == "csv":
            if not check_csv_file(filepath, description):
                all_valid = False
    
    return all_valid

def run_analysis():
    """Run the main analysis script"""
    print("\n🧠 Running contradiction analysis...")
    
    success, stdout, stderr = run_command(
        f"python scripts/run_analysis.py --demo",
        "Running analysis with demo data",
        timeout=30
    )
    
    if success:
        # Check for specific outputs in stdout
        if "contradictions" in stdout.lower():
            print("✅ Analysis completed and found contradictions")
        else:
            print("⚠️ Analysis completed but output unclear")
    
    return success

def run_scoring():
    """Run the scoring script"""
    print("\n📊 Running contradiction scoring...")
    
    success, stdout, stderr = run_command(
        f"python scripts/scoding.py",
        "Running contradiction scoring",
        timeout=30
    )
    
    return success

def run_tests():
    """Run pytest tests"""
    print("\n🧪 Running unit tests...")
    
    success, stdout, stderr = run_command(
        f"python -m pytest tests/ -v --tb=short",
        "Running pytest on tests/",
        timeout=60
    )
    
    return success

def check_imports():
    """Test critical imports"""
    print("\n🔍 Testing critical imports...")
    
    critical_imports = [
        "analyzer",
        "analyzer.all_rules", 
        "analyzer.evaluate",
        "pdfplumber",
        "PyPDF2",
        "reportlab"
    ]
    
    import_script = f'''
import sys
sys.path.insert(0, "{REPO_ROOT}")

try:
    import analyzer
    from analyzer import evaluate
    from analyzer.all_rules import get_all_rule_functions
    import pdfplumber
    import PyPDF2
    import reportlab
    print("✅ All critical imports successful")
except ImportError as e:
    print(f"❌ Import error: {{e}}")
    sys.exit(1)
'''
    
    success, stdout, stderr = run_command(
        f'python -c "{import_script}"',
        "Testing critical imports",
        timeout=15
    )
    
    if success and "All critical imports successful" in stdout:
        print("✅ All critical imports working")
        return True
    else:
        print("❌ Some imports failed")
        if stderr:
            print(f"   Error details: {stderr}")
        return False

def main():
    """Run complete smoke test"""
    print("🚀 Justice Document Manager - Complete Smoke Test")
    print("=" * 60)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Repository: {REPO_ROOT}")
    print("")
    
    # Create output directory if it doesn't exist
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Test steps
    steps = [
        ("Import Check", check_imports),
        ("Analysis", run_analysis), 
        ("Scoring", run_scoring),
        ("Output Verification", verify_output_files),
        ("Unit Tests", run_tests)
    ]
    
    results = {}
    
    for step_name, step_func in steps:
        print(f"\n{'='*60}")
        print(f"🔬 STEP: {step_name}")
        print(f"{'='*60}")
        
        try:
            results[step_name] = step_func()
        except Exception as e:
            print(f"❌ Step failed with exception: {e}")
            results[step_name] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SMOKE TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(steps)
    
    for step_name, result in results.items():
        status = "PASS" if result else "FAIL"
        emoji = "✅" if result else "❌"
        print(f"{emoji} {step_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall Result: {passed}/{total} steps passed")
    
    if passed == total:
        print("\n🎉 SMOKE TEST PASSED!")
        print("All systems are operational and ready for use.")
        print("")
        print("💡 Quick usage:")
        print("   • Run analysis: python scripts/run_analysis.py --demo")
        print("   • Run scoring: python scripts/scoding.py") 
        print("   • Run tests: python -m pytest tests/ -v")
        print("   • Manual verification: bash run_manual_verify.sh")
        return True
    else:
        print("\n⚠️ SMOKE TEST FAILED!")
        print("Some components are not working correctly.")
        print("Check the detailed output above for specific issues.")
        print("")
        print("💡 Common fixes:")
        print("   • Install dependencies: pip install -r requirements.txt")
        print("   • Check Python path and imports")
        print("   • Verify file permissions")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Smoke test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Smoke test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)