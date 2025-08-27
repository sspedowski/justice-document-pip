#!/bin/bash
# Complete smoke test runner for Justice Document Manager

echo "🚀 Justice Document Manager - Complete Smoke Test Runner"
echo "========================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "analyzer" ]; then
    echo "❌ ERROR: Please run this script from the repository root directory"
    echo "Expected files: package.json, analyzer/ directory"
    exit 1
fi

echo "✅ Running from correct directory: $(pwd)"
echo ""

# Check Python availability
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ ERROR: Python not found. Please install Python 3.7+ and try again."
    exit 1
fi

echo "✅ Using Python: $PYTHON_CMD ($(${PYTHON_CMD} --version))"
echo ""

# Run the smoke test
echo "🧪 Starting complete smoke test..."
echo ""

$PYTHON_CMD run_smoke_test.py

# Capture the exit code
TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo "🎉 SMOKE TEST COMPLETED SUCCESSFULLY!"
    echo ""
    echo "🚀 Your Justice Document Manager is ready to use!"
    echo ""
    echo "Next steps:"
    echo "  • Upload PDFs via the web interface"
    echo "  • Run tampering detection analysis"
    echo "  • Generate oversight reports"
    echo "  • Start processing your real case files"
else
    echo "⚠️ SMOKE TEST FAILED!"
    echo ""
    echo "📋 Check the detailed output above for specific issues."
    echo "💡 Common solutions:"
    echo "  • pip install -r requirements.txt"
    echo "  • npm install && npm run build" 
    echo "  • Check file permissions"
    echo "  • Verify Python path configuration"
fi

echo ""
echo "📖 For more information, see:"
echo "  • README.md - General setup and usage"
echo "  • PIPELINE_VERIFICATION_COMPLETE.md - Detailed verification steps"
echo "  • TAMPERING_DETECTION_STATUS.md - Tampering detection features"

exit $TEST_RESULT