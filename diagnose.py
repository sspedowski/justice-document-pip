#!/usr/bin/env python3
"""
Quick diagnostic script for Justice Document Manager
Checks for common issues and provides solutions
"""

import sys
import os
import importlib
from pathlib import Path

# Configuration
REPO_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(REPO_ROOT))

def check_python_version():
    """Check if Python version is adequate"""
    print("🐍 Checking Python version...")
    
    version = sys.version_info
    print(f"   Python {version.major}.{version.minor}.{version.micro}")
    
    if version.major >= 3 and version.minor >= 7:
        print("✅ Python version is adequate")
        return True
    else:
        print("❌ Python 3.7+ required")
        return False

def check_required_packages():
    """Check if required Python packages are installed"""
    print("\n📦 Checking required packages...")
    
    required = [
        ('pdfplumber', 'PDF text extraction'),
        ('PyPDF2', 'PDF metadata and manipulation'),
        ('reportlab', 'PDF generation'), 
        ('yaml', 'YAML configuration parsing'),
        ('pytest', 'Unit testing framework')
    ]
    
    missing = []
    
    for package, description in required:
        try:
            importlib.import_module(package)
            print(f"✅ {package} - {description}")
        except ImportError:
            print(f"❌ {package} - {description} (MISSING)")
            missing.append(package)
    
    if missing:
        print(f"\n💡 Install missing packages with:")
        print(f"   pip install {' '.join(missing)}")
        return False
    
    return True

def check_directory_structure():
    """Check if required directories exist"""
    print("\n📁 Checking directory structure...")
    
    required_dirs = [
        ('analyzer', 'Core analysis engine'),
        ('scripts', 'Analysis and processing scripts'), 
        ('tests', 'Unit tests'),
        ('public/data', 'Output data directory'),
        ('src', 'Frontend source code')
    ]
    
    missing = []
    
    for dir_path, description in required_dirs:
        full_path = REPO_ROOT / dir_path
        if full_path.exists():
            print(f"✅ {dir_path}/ - {description}")
        else:
            print(f"❌ {dir_path}/ - {description} (MISSING)")
            missing.append(dir_path)
    
    if missing:
        print(f"\n💡 Create missing directories:")
        for dir_path in missing:
            print(f"   mkdir -p {dir_path}")
        return False
    
    return True

def check_analyzer_package():
    """Check analyzer package specifically"""
    print("\n🔬 Checking analyzer package...")
    
    required_files = [
        'analyzer/__init__.py',
        'analyzer/all_rules.py',
        'analyzer/id.py',
        'analyzer/rules_dates.py',
        'analyzer/rules_presence.py',
        'analyzer/rules_numeric.py'
    ]
    
    missing = []
    
    for file_path in required_files:
        full_path = REPO_ROOT / file_path
        if full_path.exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} (MISSING)")
            missing.append(file_path)
    
    # Try to import analyzer
    try:
        import analyzer
        from analyzer import evaluate
        from analyzer.all_rules import get_all_rule_functions
        print("✅ Analyzer package imports successfully")
        
        # Test rule functions
        rules = get_all_rule_functions()
        print(f"✅ Found {len(rules)} rule functions")
        
    except ImportError as e:
        print(f"❌ Analyzer import failed: {e}")
        missing.append("analyzer imports")
    
    return len(missing) == 0

def check_scripts():
    """Check if main scripts exist"""
    print("\n📋 Checking main scripts...")
    
    required_scripts = [
        ('scripts/run_analysis.py', 'Main contradiction analysis'),
        ('scripts/scoding.py', 'Contradiction scoring'),
        ('run_smoke_test.py', 'Complete smoke test'),
        ('manual_verify.py', 'Manual verification')
    ]
    
    missing = []
    
    for script_path, description in required_scripts:
        full_path = REPO_ROOT / script_path
        if full_path.exists():
            print(f"✅ {script_path} - {description}")
        else:
            print(f"❌ {script_path} - {description} (MISSING)")
            missing.append(script_path)
    
    return len(missing) == 0

def check_data_files():
    """Check if expected data files exist"""
    print("\n📊 Checking data files...")
    
    data_dir = REPO_ROOT / "public" / "data"
    expected_files = [
        'contradictions.json',
        'run_meta.json',
        'statements_debug.json'
    ]
    
    if not data_dir.exists():
        print(f"❌ Data directory {data_dir} does not exist")
        print("💡 Run: python scripts/run_analysis.py --demo")
        return False
    
    missing = []
    
    for filename in expected_files:
        filepath = data_dir / filename
        if filepath.exists():
            print(f"✅ {filename}")
        else:
            print(f"❌ {filename} (MISSING)")
            missing.append(filename)
    
    if missing:
        print("💡 Generate missing files with: python scripts/run_analysis.py --demo")
        return False
    
    return True

def provide_solutions():
    """Provide common solutions for setup issues"""
    print("\n🛠️ COMMON SOLUTIONS")
    print("=" * 50)
    
    print("\n1. Install Python dependencies:")
    print("   pip install -r requirements.txt")
    print("   # OR individually:")
    print("   pip install pdfplumber PyPDF2 reportlab PyYAML pytest")
    
    print("\n2. Generate initial data files:")
    print("   python scripts/run_analysis.py --demo")
    print("   python scripts/scoding.py")
    
    print("\n3. Run tests to verify setup:")
    print("   python -m pytest tests/ -v")
    print("   # OR run smoke test:")
    print("   python run_smoke_test.py")
    
    print("\n4. Setup frontend (if needed):")
    print("   npm install")
    print("   npm run build")
    
    print("\n5. Manual verification:")
    print("   python manual_verify.py")
    print("   bash run_manual_verify.sh")

def main():
    """Run diagnostic checks"""
    print("🔍 Justice Document Manager - Quick Diagnostics")
    print("=" * 55)
    print(f"Repository: {REPO_ROOT}")
    print("")
    
    checks = [
        ("Python Version", check_python_version),
        ("Required Packages", check_required_packages),
        ("Directory Structure", check_directory_structure), 
        ("Analyzer Package", check_analyzer_package),
        ("Main Scripts", check_scripts),
        ("Data Files", check_data_files)
    ]
    
    results = {}
    
    for check_name, check_func in checks:
        results[check_name] = check_func()
    
    print("\n" + "=" * 55)
    print("🎯 DIAGNOSTIC SUMMARY")
    print("=" * 55)
    
    passed = sum(1 for result in results.values() if result)
    total = len(checks)
    
    for check_name, result in results.items():
        status = "OK" if result else "NEEDS ATTENTION"
        emoji = "✅" if result else "⚠️"
        print(f"{emoji} {check_name}: {status}")
    
    print(f"\n📊 Overall: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 All diagnostics passed! System appears ready to use.")
        print("\n🚀 Next steps:")
        print("   • Run smoke test: python run_smoke_test.py")
        print("   • Start web interface: npm run dev")
        print("   • Upload documents and analyze for tampering")
    else:
        print(f"\n⚠️ {total - passed} issues found that need attention.")
        provide_solutions()
    
    return passed == total

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Diagnostics failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)