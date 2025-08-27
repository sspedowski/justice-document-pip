#!/usr/bin/env python3
"""
FastAPI backend for Justice Document Analysis API.
Provides read-only endpoints for analysis results and system status.
"""

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Configuration
ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DATA_DIR = ROOT_DIR / "public" / "data"
ANALYZER_DIR = ROOT_DIR / "analyzer"

# Initialize FastAPI app
app = FastAPI(
    title="Justice Document Analysis API",
    description="Read-only API for accessing document analysis results and system status",
    version="1.0.0",
)

# Enable CORS for localhost development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5000", 
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

def load_json_file(file_path: Path) -> Optional[Dict[str, Any]]:
    """Safely load JSON file with error handling."""
    try:
        if not file_path.exists():
            return None
        
        with open(file_path, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return None
    except Exception:
        return None

def get_git_info() -> Dict[str, Any]:
    """Get git information for the current repository."""
    git_info = {
        "commit_sha": None,
        "branch": None,
        "repository": "sspedowski/justice-document-pip"
    }
    
    try:
        # Get current commit SHA
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            git_info["commit_sha"] = result.stdout.strip()[:12]  # Short SHA
    except Exception:
        pass
    
    try:
        # Get current branch
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            git_info["branch"] = result.stdout.strip()
    except Exception:
        pass
    
    return git_info

def count_documents() -> Dict[str, int]:
    """Count documents in various directories."""
    counts = {
        "input_documents": 0,
        "processed_documents": 0,
        "analysis_files": 0
    }
    
    # Count input documents
    input_dir = ROOT_DIR / "input"
    if input_dir.exists():
        counts["input_documents"] = len([f for f in input_dir.iterdir() 
                                       if f.is_file() and f.suffix.lower() in ['.pdf', '.txt']])
    
    # Count processed documents from justice-documents.json
    justice_docs_file = PUBLIC_DATA_DIR / "justice-documents.json"
    if justice_docs_file.exists():
        justice_data = load_json_file(justice_docs_file)
        if justice_data and isinstance(justice_data, list):
            counts["processed_documents"] = len(justice_data)
    
    # Count analysis files
    if PUBLIC_DATA_DIR.exists():
        analysis_files = [f for f in PUBLIC_DATA_DIR.iterdir() 
                         if f.is_file() and f.suffix == '.json']
        counts["analysis_files"] = len(analysis_files)
    
    return counts

@app.get("/analysis/contradictions")
async def get_contradictions():
    """Get base contradictions analysis results."""
    file_path = PUBLIC_DATA_DIR / "contradictions.json"
    data = load_json_file(file_path)
    
    if data is None:
        raise HTTPException(
            status_code=404, 
            detail="Contradictions data not found or invalid"
        )
    
    return JSONResponse(content=data)

@app.get("/analysis/contradictions_scored")
async def get_contradictions_scored():
    """Get scored contradictions analysis results."""
    file_path = PUBLIC_DATA_DIR / "contradictions_scored.json"
    data = load_json_file(file_path)
    
    if data is None:
        raise HTTPException(
            status_code=404,
            detail="Scored contradictions data not found or invalid"
        )
    
    return JSONResponse(content=data)

@app.get("/analysis/run_meta")
async def get_run_meta():
    """Get analysis run metadata."""
    file_path = PUBLIC_DATA_DIR / "run_meta.json"
    data = load_json_file(file_path)
    
    if data is None:
        raise HTTPException(
            status_code=404,
            detail="Run metadata not found or invalid"
        )
    
    return JSONResponse(content=data)

@app.get("/analysis/status")
async def get_analysis_status():
    """Get system status and health information."""
    
    # Get file timestamps
    timestamps = {}
    status_files = [
        "contradictions.json",
        "contradictions_scored.json", 
        "run_meta.json"
    ]
    
    for filename in status_files:
        file_path = PUBLIC_DATA_DIR / filename
        if file_path.exists():
            mtime = file_path.stat().st_mtime
            timestamps[filename] = datetime.fromtimestamp(mtime).isoformat() + "Z"
        else:
            timestamps[filename] = None
    
    # Check if weights file exists
    weights_file = ANALYZER_DIR / "rule_weights.json"
    weights_updated = None
    if weights_file.exists():
        mtime = weights_file.stat().st_mtime
        weights_updated = datetime.fromtimestamp(mtime).isoformat() + "Z"
    
    # Get document counts
    counts = count_documents()
    
    # Get git information
    git_info = get_git_info()
    
    # Determine overall health
    required_files = [PUBLIC_DATA_DIR / f for f in status_files]
    files_exist = [f.exists() for f in required_files]
    ok = all(files_exist) and weights_file.exists()
    
    status = {
        "ok": ok,
        "status": "healthy" if ok else "degraded",
        "updated_at": datetime.utcnow().isoformat() + "Z",
        "counts": counts,
        "git_sha": git_info.get("commit_sha"),
        "git_branch": git_info.get("branch"),
        "files": {
            "contradictions": timestamps["contradictions.json"] is not None,
            "contradictions_scored": timestamps["contradictions_scored.json"] is not None,
            "run_meta": timestamps["run_meta.json"] is not None,
            "rule_weights": weights_file.exists()
        },
        "timestamps": timestamps,
        "weights_updated_at": weights_updated,
        "system_info": {
            "data_directory": str(PUBLIC_DATA_DIR),
            "weights_directory": str(ANALYZER_DIR),
            "api_version": "1.0.0"
        }
    }
    
    return JSONResponse(content=status)

@app.get("/")
async def root():
    """API root endpoint with basic information."""
    return {
        "name": "Justice Document Analysis API",
        "version": "1.0.0",
        "description": "Read-only API for document analysis results",
        "endpoints": [
            "/analysis/contradictions",
            "/analysis/contradictions_scored", 
            "/analysis/run_meta",
            "/analysis/status"
        ],
        "repository": "sspedowski/justice-document-pip"
    }

@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Justice Document Analysis API Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    
    args = parser.parse_args()
    
    print(f"Starting Justice Document Analysis API on {args.host}:{args.port}")
    print(f"Data directory: {PUBLIC_DATA_DIR}")
    print(f"Weights directory: {ANALYZER_DIR}")
    
    uvicorn.run(
        "api:app" if args.reload else app,
        host=args.host,
        port=args.port,
        reload=args.reload
    )