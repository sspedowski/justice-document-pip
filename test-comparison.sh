#!/bin/bash

# Test script for the document comparison system
# Checks if dependencies are available and runs the comparison script

echo "=== Justice Document Tampering Detection Test ==="
echo

# Check if we're in the right directory
if [ ! -f "scripts/compare_by_date.py" ]; then
    echo "❌ Error: scripts/compare_by_date.py not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check Python availability
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.8+ to run the comparison script."
    exit 1
fi

echo "✅ Python3 found: $(python3 --version)"

# Check if dependencies are installed
echo "🔍 Checking Python dependencies..."

# Function to check if a Python package is available
check_package() {
    python3 -c "import $1" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ $1 is available"
        return 0
    else
        echo "❌ $1 is missing"
        return 1
    fi
}

# Check required packages
MISSING_PACKAGES=()

if ! check_package "pdfplumber"; then
    MISSING_PACKAGES+=("pdfplumber")
fi

if ! check_package "PyPDF2"; then
    MISSING_PACKAGES+=("PyPDF2")
fi

if ! check_package "yaml"; then
    MISSING_PACKAGES+=("PyYAML")
fi

# If packages are missing, show installation instructions
if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo
    echo "❌ Missing required packages: ${MISSING_PACKAGES[*]}"
    echo "📦 To install dependencies, run:"
    echo "   pip3 install -r requirements.txt"
    echo
    echo "💡 Or install individually:"
    for package in "${MISSING_PACKAGES[@]}"; do
        echo "   pip3 install $package"
    done
    echo
    echo "🚀 Then re-run this script to continue"
    exit 1
fi

echo "✅ All dependencies are available!"
echo

# Check for PDF files in input directory
PDF_COUNT=$(find input -name "*.pdf" 2>/dev/null | wc -l)
echo "📄 Found $PDF_COUNT PDF files in input/ directory"

if [ "$PDF_COUNT" -eq 0 ]; then
    echo
    echo "⚠️  No PDF files found in input/ directory"
    echo "💡 To test the comparison system:"
    echo "   1. Add PDF documents to the input/ directory"
    echo "   2. Make sure some documents share the same date"
    echo "   3. Re-run this script"
    echo
    echo "🔍 Alternatively, check the app's 'Upload & Process' tab to load sample tampering data"
    echo
else
    echo "🚀 Running document comparison analysis..."
    echo
    
    # Create output directory if it doesn't exist
    mkdir -p output/date_diffs
    
    # Run the comparison script
    python3 scripts/compare_by_date.py --names "Noel,Andy Maki,Banister,Russell,Verde"
    
    # Check if the script succeeded
    if [ $? -eq 0 ]; then
        echo
        echo "✅ Document comparison completed successfully!"
        echo
        echo "📊 Results available at:"
        echo "   📋 Summary CSV: output/date_diffs/changes_summary.csv"
        echo "   🌐 HTML Report: output/date_diffs/index.html"
        echo "   📁 Detailed Reports: output/date_diffs/[date]/diff_*.html"
        echo
        echo "🔍 Open output/date_diffs/index.html in your browser to view detailed tampering analysis"
        
        # Check if we found any dated groups with multiple documents
        if [ -f "output/date_diffs/changes_summary.csv" ]; then
            CHANGES=$(tail -n +2 "output/date_diffs/changes_summary.csv" | wc -l)
            if [ "$CHANGES" -gt 0 ]; then
                echo
                echo "🚨 DETECTED $CHANGES document comparison(s) with potential tampering indicators!"
                echo "🎯 Review the HTML reports for detailed analysis of:"
                echo "   • Word-level changes between document versions"
                echo "   • Name mention differences (Noel, Andy Maki, etc.)"
                echo "   • Number/date alterations"
                echo "   • Evidence text modifications"
            else
                echo
                echo "ℹ️  No document pairs with the same date found."
                echo "💡 Tampering detection works best with multiple versions of the same document."
            fi
        fi
    else
        echo
        echo "❌ Document comparison failed. Check the error messages above."
        exit 1
    fi
fi

echo
echo "=== Test Complete ==="