# Justice Document Manager - GitHub Copilot Instructions

**ALWAYS follow these instructions first and fallback to additional search and context gathering ONLY if the information here is incomplete or found to be in error.**

## Project Overview
Justice Document Manager is a **dual-stack application** that combines:
- **React/TypeScript frontend** with Vite build system
- **Python backend** for document analysis and tampering detection
- Processes legal documents (PDFs, text) to detect evidence tampering and contradictions

## Critical Setup Commands - NEVER CANCEL ANY BUILD

### 1. 🚀 **Initial Setup (Required for ALL operations)**
```bash
# Install dependencies - NEVER CANCEL: Takes up to 60 seconds
npm install

# Install Python packages - NEVER CANCEL: Takes up to 45 seconds  
pip3 install -r requirements.txt
```

### 2. 🏗️ **Build Commands - NEVER CANCEL: Set 300+ second timeouts**
```bash
# Development build - NEVER CANCEL: Takes 8-15 seconds
npm run build

# Production build - NEVER CANCEL: Takes 8-15 seconds  
npm run build:prod

# TypeScript check (will show errors but is non-blocking)
npm run type-check
```

### 3. 🧪 **Testing Commands**
```bash
# Python tests - NEVER CANCEL: Takes 3-10 seconds
PYTHONPATH=. python3 -m pytest tests/test_compare_by_date.py tests/test_compare_validation.py -v

# TypeScript tests (placeholder - not fully configured)
npm run test:run
```

### 4. 🚀 **Running the Application**
```bash
# Development server (frontend only)
npm run dev
# Access at: http://localhost:5000/

# Production preview server
npm run preview  
# Access at: http://localhost:4173/

# Python analysis (backend) - NEVER CANCEL: Takes 0.1-2 seconds
PYTHONPATH=. python3 scripts/run_analysis.py --demo

# Python scoring - NEVER CANCEL: Takes 0.1-2 seconds
PYTHONPATH=. python3 scripts/scoding.py
```

## 🔧 Working Effectively

### Bootstrap and Build Sequence
```bash
# 1. Install all dependencies first (REQUIRED)
npm install                           # 37-60 seconds
pip3 install -r requirements.txt     # 10-45 seconds

# 2. Build the application
npm run build:prod                   # 8-15 seconds  

# 3. Test the application
npm run dev                          # Starts immediately
```

### Python Analysis Pipeline 
```bash
# CRITICAL: Always use PYTHONPATH=. prefix for Python scripts
export PYTHONPATH=.

# Run analysis on demo data
python3 scripts/run_analysis.py --demo     # 0.04 seconds

# Run scoring on analysis results  
python3 scripts/scoding.py                 # 0.03 seconds

# Check analysis results
python3 diagnose.py                        # 1-3 seconds
```

## ⚠️ **Critical Warnings**

### NEVER CANCEL Build Operations
- **npm install**: Takes 37-60 seconds - NEVER CANCEL, set 90+ second timeout
- **pip3 install**: Takes 10-45 seconds - NEVER CANCEL, set 60+ second timeout  
- **npm run build**: Takes 8-15 seconds - NEVER CANCEL, set 60+ second timeout
- **npm run build:prod**: Takes 8-15 seconds - NEVER CANCEL, set 60+ second timeout

### TypeScript Issues (Known - Non-blocking)
- TypeScript type checking shows 175+ errors but **builds successfully** with `--noCheck` flag
- Development and production builds work despite TypeScript errors
- Do NOT attempt to fix TypeScript errors unless specifically working on type safety

### Python Path Requirements  
- **ALWAYS** use `PYTHONPATH=.` prefix for Python scripts
- Scripts fail with `ModuleNotFoundError` without proper Python path
- Example: `PYTHONPATH=. python3 scripts/run_analysis.py --demo`

## 📋 Validation Steps

### After Making Frontend Changes
```bash
# 1. Build and test
npm run build:prod                    # Should complete in 8-15 seconds
npm run preview                       # Should start on http://localhost:4173/

# 2. Verify build output
ls dist/                              # Should contain index.html, assets/, etc.
curl -f http://localhost:4173/ || echo "Preview server test"
```

### After Making Python Changes
```bash
# 1. Run diagnostics
python3 diagnose.py                   # Should show "6/6 checks passed"

# 2. Test analysis pipeline  
PYTHONPATH=. python3 scripts/run_analysis.py --demo    # Should process 6 statements
PYTHONPATH=. python3 scripts/scoding.py               # Should score contradictions

# 3. Run working tests
PYTHONPATH=. python3 -m pytest tests/test_compare_by_date.py tests/test_compare_validation.py -v
```

## 🎯 Manual Validation Scenarios

### Frontend Application Testing
1. **Start Development Server**: `npm run dev`
2. **Load Sample Data**: Click "Load Input Documents" button  
3. **Test Tampering Analysis**: Click "🚨 SHOW REAL CONTRADICTIONS 🚨" button
4. **Upload Documents**: Test drag-and-drop functionality in "Upload & Process" tab
5. **Generate Reports**: Test "Export Reports" functionality

### Python Backend Testing  
1. **Run Demo Analysis**: `PYTHONPATH=. python3 scripts/run_analysis.py --demo`
2. **Verify Output Files**: Check `public/data/contradictions.json` contains 4-5 items
3. **Test Scoring**: `PYTHONPATH=. python3 scripts/scoding.py`
4. **Check CSV Output**: Verify `public/data/contradictions_scored.csv` is created

## 📁 Key Project Structure

```
├── src/                    # React/TypeScript frontend
│   ├── components/         # React components  
│   ├── lib/               # TypeScript utilities
│   └── App.tsx            # Main application
├── analyzer/              # Python analysis engine
├── scripts/               # Python processing scripts
├── tests/                 # Test files  
├── public/data/           # Analysis output files
├── package.json           # Node.js dependencies
├── requirements.txt       # Python dependencies
└── .github/workflows/     # CI/CD pipelines
```

## 🛠️ Common Tasks

### Add New Analysis Rules
1. Edit `analyzer/all_rules.py` for new contradiction detection rules
2. Test with: `PYTHONPATH=. python3 scripts/run_analysis.py --demo`
3. Verify output in `public/data/contradictions.json`

### Frontend Component Changes
1. Edit files in `src/components/`
2. Test with: `npm run dev` 
3. Build with: `npm run build:prod`

### Deployment Preparation
1. Run full build: `npm run build:prod`
2. Check `dist/` directory contains all required files
3. Test preview: `npm run preview`

## 🚫 What NOT to Do

- **Do not** attempt to fix TypeScript errors unless specifically requested
- **Do not** cancel long-running builds (they may appear hung but are processing)
- **Do not** run Python scripts without `PYTHONPATH=.` prefix
- **Do not** modify `validate-build.sh` (it has intentional type check failures)
- **Do not** add new linting tools or test frameworks without explicit requirement

## 📊 Expected Command Times

| Command | Expected Time | Max Timeout |
|---------|---------------|-------------|
| `npm install` | 37-60 seconds | 90 seconds |
| `pip3 install -r requirements.txt` | 10-45 seconds | 60 seconds |
| `npm run build:prod` | 8-15 seconds | 60 seconds |
| `npm run dev` (startup) | 2-5 seconds | 30 seconds |
| `PYTHONPATH=. python3 scripts/run_analysis.py --demo` | 0.04 seconds | 10 seconds |
| `PYTHONPATH=. python3 scripts/scoding.py` | 0.03 seconds | 10 seconds |
| Python tests | 0.3 seconds | 30 seconds |

## ✅ Success Indicators

### Build Success
- `npm run build:prod` completes with "✓ built in X.XXs" message
- `dist/` directory contains `index.html`, `assets/`, and required files
- Build size warnings are normal and expected

### Analysis Success  
- `python3 diagnose.py` shows "6/6 checks passed"
- Demo analysis processes 6 statements and finds 4-5 contradictions
- Output files created in `public/data/` directory

### Application Success
- Development server starts on http://localhost:5000/
- Sample documents can be loaded via UI
- Tampering detection analysis runs and shows results
- Export functionality generates forensic reports

## 🆘 Troubleshooting

### "ModuleNotFoundError: No module named 'analyzer'"
- **Solution**: Use `PYTHONPATH=. python3 script.py` instead of `python3 script.py`

### TypeScript errors during build  
- **Expected**: 175+ TypeScript errors are normal
- **Solution**: Build uses `--noCheck` flag and succeeds despite errors

### Build appears hung
- **Expected**: Builds can take 8-60 seconds depending on command
- **Solution**: Wait for completion, do not cancel

### "EADDRINUSE" port errors
- **Solution**: Use `npm run kill` to free port 5000, or use different port