#!/bin/bash

# Deployment validation script for Justice Document Manager
# Validates that the application is ready for GitHub Pages deployment

set -e

echo "🚀 Validating Justice Document Manager deployment readiness..."

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

# Build the application for GitHub Pages
echo "🔨 Building application for GitHub Pages..."
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

# Check that index.html has the correct base path for GitHub Pages
if ! grep -q "/justice-document-pip/" "dist/index.html"; then
    echo "❌ index.html does not contain the correct GitHub Pages base path"
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

echo "✅ All build output validation checks passed"

# Summary
echo ""
echo "🎉 DEPLOYMENT VALIDATION SUCCESSFUL!"
echo ""
echo "   - Build: ✅"
echo "   - Output validation: ✅"
echo "   - GitHub Pages configuration: ✅"
echo ""
echo "🚀 The application is ready for GitHub Pages deployment!"
echo ""
echo "📁 Build output is in 'dist/' directory"
echo "🌐 Ready for GitHub Pages deployment via GitHub Actions"
echo "📋 GitHub Actions workflow: .github/workflows/deploy.yml"