#!/usr/bin/env python3
"""
Main analysis script for contradiction detection.
Processes statements and outputs contradictions with metadata.
"""

import json
import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path

# Import analyzer early to register all rules
import analyzer
from analyzer import evaluate, get_rules_fingerprint

def get_git_sha():
    """Get current git SHA, or None if not available."""
    try:
        result = subprocess.run(['git', 'rev-parse', 'HEAD'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    return None

def load_demo_statements():
    """Generate demo statements for testing."""
    return [
        {
            'id': 'stmt_1',
            'event': 'meeting_2024_01_15',
            'party': 'John Doe',
            'present': True,
            'date': '2024-01-15',
            'location': 'Office A'
        },
        {
            'id': 'stmt_2', 
            'event': 'meeting_2024_01_15',
            'party': 'John Doe',
            'present': False,
            'date': '2024-01-15',
            'location': 'Office B'
        },
        {
            'id': 'stmt_3',
            'event': 'incident_2024_02_01',
            'date': '2024-02-01',
            'amount': 1000,
            'currency': 'USD'
        },
        {
            'id': 'stmt_4',
            'event': 'incident_2024_02_01', 
            'date': '2024-02-02',
            'amount': 1500,
            'currency': 'USD'
        },
        {
            'id': 'stmt_5',
            'case': 'case_001',
            'status': 'ACTIVE'
        },
        {
            'id': 'stmt_6',
            'case': 'case_001', 
            'status': 'CLOSED'
        }
    ]

def main():
    """Main analysis execution."""
    # Parse arguments
    demo_mode = '--demo' in sys.argv
    
    if demo_mode:
        print("Running in demo mode...")
        statements = load_demo_statements()
    else:
        # In production, load statements from appropriate source
        print("Production mode not implemented - using demo data")
        statements = load_demo_statements()
    
    print(f"Loaded {len(statements)} statements for analysis")
    
    # Run contradiction detection
    print("Running contradiction detection...")
    contradictions = evaluate(statements)
    
    # Filter out engine errors for counting
    real_contradictions = [c for c in contradictions if c.get('type') != '__engine_error__']
    engine_errors = [c for c in contradictions if c.get('type') == '__engine_error__']
    
    print(f"Found {len(real_contradictions)} contradictions")
    if engine_errors:
        print(f"Warning: {len(engine_errors)} rule engine errors occurred")
    
    # Prepare output directory
    output_dir = Path("public/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write contradictions.json
    contradictions_file = output_dir / "contradictions.json"
    with open(contradictions_file, 'w') as f:
        json.dump(contradictions, f, indent=2, default=str)
    print(f"Wrote contradictions to {contradictions_file}")
    
    # Write statements debug file
    statements_file = output_dir / "statements_debug.json" 
    with open(statements_file, 'w') as f:
        json.dump(statements, f, indent=2, default=str)
    print(f"Wrote debug statements to {statements_file}")
    
    # Write run metadata
    run_meta = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "git_sha": get_git_sha(),
        "num_statements": len(statements),
        "num_contradictions": len(real_contradictions),
        "rules_fingerprint": get_rules_fingerprint()
    }
    
    meta_file = output_dir / "run_meta.json"
    with open(meta_file, 'w') as f:
        json.dump(run_meta, f, indent=2)
    print(f"Wrote run metadata to {meta_file}")
    
    # Final status
    if engine_errors:
        print("⚠️  Analysis completed with warnings")
        return 1
    else:
        print("✅ Analysis completed successfully")
        return 0

if __name__ == "__main__":
    sys.exit(main())