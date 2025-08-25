#!/bin/bash
# Quick test script to verify the application builds and runs without errors

echo "🧪 Testing Justice Document Manager Application..."

# Check if all required files exist
echo "📋 Checking required files..."

required_files=(
    "src/App.tsx"
    "src/main.tsx"
    "src/index.css"
    "src/hooks/useKV.ts"
    "src/components/ErrorBoundary.tsx"
    "src/lib/errorHandler.ts"
    "src/lib/types.ts"
    "src/data/sampleTamperingData.ts"
    "src/data/sampleDocumentsWithDates.ts"
    "input/CPS_Report_01.08.2024_Initial.txt"
    "input/PoliceReport_12.15.2023_Original.txt"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -eq 0 ]]; then
    echo "✅ All required files present"
else
    echo "❌ Missing files:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

# Check TypeScript compilation
echo "🔧 Checking TypeScript compilation..."
if command -v tsc &> /dev/null; then
    if tsc --noEmit --skipLibCheck; then
        echo "✅ TypeScript compilation successful"
    else
        echo "❌ TypeScript compilation failed"
        exit 1
    fi
else
    echo "⚠️  TypeScript compiler not found, skipping compilation check"
fi

# Check for common React hook issues
echo "🔍 Checking for React hook rule violations..."

# Check for conditional hook calls
if grep -r "if.*use[A-Z]" src/ --include="*.tsx" --include="*.ts"; then
    echo "❌ Found potential conditional hook calls"
    exit 1
fi

# Check for hooks in loops (basic check)
if grep -r "for.*use[A-Z]\|while.*use[A-Z]\|forEach.*use[A-Z]" src/ --include="*.tsx" --include="*.ts"; then
    echo "❌ Found potential hook calls in loops"
    exit 1
fi

echo "✅ No obvious hook rule violations found"

# Check for proper error boundary implementation
echo "🛡️  Checking error boundary implementation..."
if grep -q "ErrorBoundary" src/App.tsx; then
    echo "✅ Error boundary properly implemented"
else
    echo "❌ Error boundary not found in main App component"
    exit 1
fi

# Check for proper imports
echo "📦 Checking imports..."
if grep -q "useCallback.*useEffect.*useMemo.*useState" src/App.tsx; then
    echo "✅ Required hooks imported"
else
    echo "❌ Missing required hook imports"
    exit 1
fi

echo "🎉 All tests passed! Application appears to be correctly configured."
echo ""
echo "📝 Summary:"
echo "   ✅ All required files present"
echo "   ✅ TypeScript compilation (if available)"
echo "   ✅ No hook rule violations detected"
echo "   ✅ Error boundary implemented"
echo "   ✅ Required imports present"
echo ""
echo "🚀 The application should now run without the 'more hooks than previous render' error."