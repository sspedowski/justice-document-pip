#!/bin/bash

# Build validation script for Justice Document Manager
# Tests that the application builds correctly for production deployment

set -e

echo "🏗️  Starting build validation for Justice Document Manager..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
else
    echo "✅ Dependencies already installed"
fi

# Type check
echo "🔍 Running type check..."
npx tsc --noEmit
echo "✅ Type checking passed"

# Run tests
echo "🧪 Running tests..."
npm run test:run
echo "✅ Tests passed"

# Build the application
echo "🔨 Building application..."
NODE_ENV=production GITHUB_PAGES=true npm run build:prod
echo "✅ Build completed"

# Validate build output
echo "🔍 Validating build output..."

if [ ! -d "dist" ]; then
    echo "❌ Build output directory 'dist' not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ index.html not found in build output"
    exit 1
fi

if [ ! -d "dist/assets" ]; then
    echo "❌ Assets directory not found in build output"
    exit 1
fi

# Check for required static files
if [ ! -f "dist/app/data/justice-documents.json" ]; then
    echo "❌ justice-documents.json not found in build output"
    exit 1
fi

if [ ! -f "dist/favicon.svg" ]; then
    echo "❌ favicon.svg not found in build output"
    exit 1
fi

echo "✅ All required files present in build output"

# Check index.html content
if ! grep -q "Justice Document Manager" dist/index.html; then
    echo "❌ index.html does not contain expected title"
    exit 1
fi

echo "✅ index.html contains expected content"

# Test local serve
echo "🚀 Testing local serve..."
timeout 10s npm run preview &
PREVIEW_PID=$!

# Give the server time to start
sleep 3

# Check if server is responding
if curl -f http://localhost:4173 > /dev/null 2>&1; then
    echo "✅ Local server is responding"
else
    echo "❌ Local server is not responding"
    kill $PREVIEW_PID 2>/dev/null || true
    exit 1
fi

# Clean up
kill $PREVIEW_PID 2>/dev/null || true

echo ""
echo "🎉 Build validation completed successfully!"
echo ""
echo "📋 Build Summary:"
echo "   - Type checking: ✅"
echo "   - Tests: ✅"
echo "   - Build: ✅"
echo "   - Output validation: ✅"
echo "   - Local serve test: ✅"
echo ""
echo "🚀 The application is ready for deployment!"
echo ""
echo "📁 Build output is in 'dist/' directory"
echo "🌐 Ready for static hosting (GitHub Pages, Netlify, Vercel, etc.)"