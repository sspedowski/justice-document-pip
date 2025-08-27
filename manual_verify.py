#!/usr/bin/env python3
"""
Manual verification script for Justice Document Manager pipeline
Tests all components end-to-end and reports status
"""

import os
import sys
import json
import subprocess
import importlib.util
from pathlib import Path
from datetime import datetime
import traceback

# Add the repo root to Python path
REPO_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(REPO_ROOT))

def print_header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_step(step, status="INFO"):
    status_colors = {
        "INFO": "\033[94m",  # Blue
        "SUCCESS": "\033[92m",  # Green
        "WARNING": "\033[93m",  # Yellow
        "ERROR": "\033[91m",  # Red
        "RESET": "\033[0m"
    }
    color = status_colors.get(status, status_colors["INFO"])
    reset = status_colors["RESET"]
    print(f"{color}[{status}]{reset} {step}")

def check_file_exists(filepath, description=""):
    if Path(filepath).exists():
        print_step(f"✅ {description or filepath} exists", "SUCCESS")
        return True
    else:
        print_step(f"❌ {description or filepath} missing", "ERROR")
        return False

def run_command(cmd, description="", check_output=False):
    """Run a command and return success status"""
    try:
        print_step(f"Running: {description or cmd}", "INFO")
        if check_output:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=REPO_ROOT)
            if result.returncode == 0:
                print_step(f"✅ Command succeeded", "SUCCESS")
                return True, result.stdout
            else:
                print_step(f"❌ Command failed: {result.stderr}", "ERROR")
                return False, result.stderr
        else:
            result = subprocess.run(cmd, shell=True, cwd=REPO_ROOT)
            if result.returncode == 0:
                print_step(f"✅ Command succeeded", "SUCCESS")
                return True, ""
            else:
                print_step(f"❌ Command failed", "ERROR")
                return False, ""
    except Exception as e:
        print_step(f"❌ Exception running command: {e}", "ERROR")
        return False, str(e)

def check_python_imports():
    """Check if key Python modules can be imported"""
    print_header("PYTHON IMPORT CHECKS")
    
    modules_to_check = [
        ('pdfplumber', 'PDF processing'),
        ('PyPDF2', 'PDF metadata'),
        ('reportlab', 'PDF generation'),
        ('pytest', 'Testing framework'),
        ('yaml', 'YAML parsing')
    ]
    
    all_imports_ok = True
    
    for module, description in modules_to_check:
        try:
            importlib.import_module(module)
            print_step(f"✅ {module} ({description}) imported successfully", "SUCCESS")
        except ImportError as e:
            print_step(f"❌ {module} ({description}) import failed: {e}", "ERROR")
            all_imports_ok = False
    
    return all_imports_ok

def check_analyzer_package():
    """Check if analyzer package is properly set up"""
    print_header("ANALYZER PACKAGE CHECKS")
    
    analyzer_files = [
        'analyzer/__init__.py',
        'analyzer/all_rules.py',
        'analyzer/rules_dates.py',
        'analyzer/rules_presence.py',
        'analyzer/rules_numeric.py'
    ]
    
    all_files_exist = True
    for file in analyzer_files:
        if not check_file_exists(file, f"Analyzer file: {file}"):
            all_files_exist = False
    
    # Try to import analyzer modules
    try:
        sys.path.insert(0, str(REPO_ROOT))
        import analyzer
        print_step("✅ Analyzer package imported successfully", "SUCCESS")
        
        try:
            import analyzer.all_rules
            print_step("✅ Analyzer all_rules imported successfully", "SUCCESS")
        except ImportError as e:
            print_step(f"❌ Analyzer all_rules import failed: {e}", "ERROR")
            all_files_exist = False
            
    except ImportError as e:
        print_step(f"❌ Analyzer package import failed: {e}", "ERROR")
        all_files_exist = False
    
    return all_files_exist

def check_scripts():
    """Check if main scripts exist and are executable"""
    print_header("SCRIPT EXISTENCE CHECKS")
    
    scripts = [
        'scripts/run_analysis.py',
        'scripts/scoding.py',
        'scripts/generate_packet.py',
        'scripts/export_master_to_csv.py'
    ]
    
    all_scripts_exist = True
    for script in scripts:
        if not check_file_exists(script, f"Script: {script}"):
            all_scripts_exist = False
    
    return all_scripts_exist

def test_run_analysis():
    """Test the main analysis script"""
    print_header("TESTING RUN_ANALYSIS.PY")
    
    if not Path('scripts/run_analysis.py').exists():
        print_step("❌ run_analysis.py not found", "ERROR")
        return False
    
    # Test with demo mode
    success, output = run_command(
        "python scripts/run_analysis.py --demo",
        "Running analysis with demo data",
        check_output=True
    )
    
    if success:
        # Check if output files were created
        expected_files = [
            'public/data/contradictions.json',
            'public/data/statements_debug.json',
            'public/data/run_meta.json'
        ]
        
        files_created = True
        for file in expected_files:
            if check_file_exists(file, f"Output file: {file}"):
                try:
                    with open(file, 'r') as f:
                        data = json.load(f)
                        print_step(f"✅ {file} is valid JSON with {len(data)} items", "SUCCESS")
                except Exception as e:
                    print_step(f"❌ {file} JSON parsing failed: {e}", "ERROR")
                    files_created = False
            else:
                files_created = False
        
        return files_created
    
    return False

def test_scoring():
    """Test the scoring script"""
    print_header("TESTING SCODING.PY")
    
    if not Path('scripts/scoding.py').exists():
        print_step("❌ scoding.py not found", "ERROR")
        return False
    
    # Run scoring script
    success, output = run_command(
        "python scripts/scoding.py",
        "Running contradiction scoring",
        check_output=True
    )
    
    if success:
        # Check if output files were created
        expected_files = [
            'public/data/contradictions_scored.json',
            'public/data/contradictions_scored.csv'
        ]
        
        files_created = True
        for file in expected_files:
            if check_file_exists(file, f"Scoring output: {file}"):
                if file.endswith('.json'):
                    try:
                        with open(file, 'r') as f:
                            data = json.load(f)
                            print_step(f"✅ {file} is valid JSON with {len(data)} items", "SUCCESS")
                    except Exception as e:
                        print_step(f"❌ {file} JSON parsing failed: {e}", "ERROR")
                        files_created = False
                elif file.endswith('.csv'):
                    try:
                        with open(file, 'r') as f:
                            lines = f.readlines()
                            print_step(f"✅ {file} has {len(lines)} lines", "SUCCESS")
                    except Exception as e:
                        print_step(f"❌ {file} reading failed: {e}", "ERROR")
                        files_created = False
            else:
                files_created = False
        
        return files_created
    
    return False

def test_pytest():
    """Test pytest execution"""
    print_header("TESTING PYTEST")
    
    # Check if tests directory exists
    if not Path('tests').exists():
        print_step("❌ tests/ directory not found", "ERROR")
        return False
    
    # Run pytest
    success, output = run_command(
        "python -m pytest tests/ -v",
        "Running pytest on tests/",
        check_output=True
    )
    
    return success

def check_frontend():
    """Check frontend dependencies and build"""
    print_header("FRONTEND CHECKS")
    
    # Check if package.json exists
    if not check_file_exists('package.json', 'Frontend package.json'):
        return False
    
    # Check if node_modules exists
    if not Path('node_modules').exists():
        print_step("⚠️ node_modules not found - run 'npm install'", "WARNING")
        return False
    
    # Try to run build
    success, output = run_command(
        "npm run build",
        "Building frontend",
        check_output=True
    )
    
    if success:
        if check_file_exists('dist/index.html', 'Built frontend dist/index.html'):
            print_step("✅ Frontend builds successfully", "SUCCESS")
            return True
    
    return False

def check_data_directories():
    """Ensure required directories exist"""
    print_header("DATA DIRECTORY CHECKS")
    
    directories = [
        'public/data',
        'input',
        'output',
        'cache',
        'tests'
    ]
    
    all_dirs_ok = True
    for directory in directories:
        dir_path = Path(directory)
        if dir_path.exists():
            print_step(f"✅ Directory {directory} exists", "SUCCESS")
        else:
            print_step(f"⚠️ Creating directory {directory}", "WARNING")
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
                print_step(f"✅ Created directory {directory}", "SUCCESS")
            except Exception as e:
                print_step(f"❌ Failed to create directory {directory}: {e}", "ERROR")
                all_dirs_ok = False
    
    return all_dirs_ok

def main():
    """Run all verification checks"""
    print_header("JUSTICE DOCUMENT MANAGER - MANUAL VERIFICATION")
    print(f"Repository: {REPO_ROOT}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Run all checks
    results['directories'] = check_data_directories()
    results['python_imports'] = check_python_imports()
    results['analyzer_package'] = check_analyzer_package()
    results['scripts_exist'] = check_scripts()
    results['run_analysis'] = test_run_analysis()
    results['scoring'] = test_scoring()
    results['pytest'] = test_pytest()
    results['frontend'] = check_frontend()
    
    # Summary
    print_header("VERIFICATION SUMMARY")
    
    total_checks = len(results)
    passed_checks = sum(1 for v in results.values() if v)
    
    for check, result in results.items():
        status = "PASS" if result else "FAIL"
        color = "SUCCESS" if result else "ERROR"
        print_step(f"{check.replace('_', ' ').title()}: {status}", color)
    
    print_step(f"\nOverall: {passed_checks}/{total_checks} checks passed", 
               "SUCCESS" if passed_checks == total_checks else "WARNING")
    
    if passed_checks == total_checks:
        print_step("🎉 All systems operational!", "SUCCESS")
    else:
        print_step("⚠️ Some issues found - check logs above for details", "WARNING")
        
        # Provide quick fix suggestions
        print_header("QUICK FIX SUGGESTIONS")
        
        if not results['python_imports']:
            print_step("Run: pip install -r requirements.txt", "INFO")
        
        if not results['analyzer_package']:
            print_step("Check analyzer/__init__.py and analyzer/all_rules.py exist", "INFO")
        
        if not results['frontend']:
            print_step("Run: npm install && npm run build", "INFO")
        
        if not results['pytest']:
            print_step("Check tests/ directory and fix any import errors", "INFO")
    
    return passed_checks == total_checks

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print_step("\n⚠️ Verification interrupted by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        print_step(f"\n❌ Verification failed with exception: {e}", "ERROR")
        traceback.print_exc()
        sys.exit(1)