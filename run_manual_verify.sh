#!/bin/bash
# Manual verification runner script for Justice Document Manager
# Run this script from the repository root directory

echo "🚀 Justice Document Manager - Manual Verification Runner"
echo "=================================================="
echo "Time: $(date)"
echo "Repository: $(pwd)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "analyzer" ]; then
    echo "❌ ERROR: Please run this script from the repository root directory"
    echo "Expected files: package.json, analyzer/ directory"
    exit 1
fi

echo "✅ In correct repository directory"
echo ""

# Run the Python verification script
echo "🔍 Running Python verification script..."
if command -v python3 &> /dev/null; then
    python3 manual_verify.py
elif command -v python &> /dev/null; then
    python manual_verify.py
else
    echo "❌ ERROR: Python not found. Please install Python 3.7+ and try again."
    exit 1
fi

echo ""
echo "📋 Manual verification complete!"
echo "Check the output above for any failed tests or missing components."
echo ""
echo "💡 Quick fixes if issues found:"
echo "   • Missing Python deps: pip install -r requirements.txt"
echo "   • Missing node deps: npm install"
echo "   • Build frontend: npm run build"
echo "   • Run tests: python -m pytest tests/ -v"
echo ""
echo "🎯 To run individual components:"
echo "   • Analysis: python scripts/run_analysis.py --demo"
echo "   • Scoring: python scripts/scoding.py"
echo "   • Tests: python -m pytest -q"