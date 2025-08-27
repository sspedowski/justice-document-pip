#!/usr/bin/env python
"""
Analysis runner script that generates demo data and runs contradiction detection.
"""

import sys
import pathlib
from typing import List, Dict, Any

# Add project root to path for imports
PROJECT_ROOT = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from analyzer.all_rules import *  # Load all rules
from analyzer.evaluate import pipeline

def generate_demo_statements() -> List[Dict[str, Any]]:
    """Generate sample statements for demonstration."""
    return [
        # Presence/absence conflict
        {"type":"PRESENCE","event_id":"evt1","party":"Noel","present":True,"id":"s1"},
        {"type":"PRESENCE","event_id":"evt1","party":"Noel","present":False,"id":"s2"},
        
        # Event date disagreement
        {"type":"EVENT_DATE","event_id":"evtX","date":"2025-01-01","id":"d1"},
        {"type":"EVENT_DATE","event_id":"evtX","date":"2025-01-05","id":"d2"},
        
        # Numeric amount mismatch
        {"type":"AMOUNT","event_id":"evt$","value":5000,"currency":"USD","id":"a1"},
        {"type":"AMOUNT","event_id":"evt$","value":12000,"currency":"USD","id":"a2"},
        
        # Status flip without transition
        {"type":"STATUS","target":"motion1","status":"granted","id":"t1"},
        {"type":"STATUS","target":"motion1","status":"denied","id":"t2"},
        
        # Location mismatch
        {"type":"LOCATION","event_id":"evtL","location":"Los Angeles","id":"l1"},
        {"type":"LOCATION","event_id":"evtL","location":"San Diego","id":"l2"},
        
        # Additional test cases
        {"type":"PRESENCE","event_id":"evt2","party":"Andy Maki","present":True,"id":"s3"},
        {"type":"STATUS","case_id":"case42","status":"open","id":"t3"},
        {"type":"STATUS","case_id":"case42","status":"closed","id":"t4"},
    ]

def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Run document contradiction analysis")
    parser.add_argument("--demo", action="store_true", help="Run with demo data")
    parser.add_argument("--input", help="Input statements JSON file")
    parser.add_argument("--output", default="public/data", help="Output directory")
    
    args = parser.parse_args()
    
    if args.demo:
        print("Running analysis with demo data...")
        statements = generate_demo_statements()
    elif args.input:
        import json
        with open(args.input, 'r') as f:
            statements = json.load(f)
    else:
        print("Error: Either --demo or --input must be specified")
        return 1
    
    print(f"Processing {len(statements)} statements...")
    contradictions = pipeline(statements, args.output)
    print(f"Found {len(contradictions)} contradictions")
    
    # Report any engine errors
    engine_errors = [c for c in contradictions if c.rule == "__engine_error__"]
    if engine_errors:
        print(f"WARNING: {len(engine_errors)} engine errors occurred:")
        for err in engine_errors:
            print(f"  - {err.rationale}")
        return 1
    
    print(f"Analysis complete. Results written to {args.output}/")
    return 0

if __name__ == "__main__":
    sys.exit(main())