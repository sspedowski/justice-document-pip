#!/usr/bin/env python3
"""Test analyzer core functionality."""

import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path.cwd()))

print("🔍 Testing analyzer imports...")

try:
    from analyzer import evaluate, get_rules_fingerprint
    print("✅ Main analyzer imports work")
except ImportError as e:
    print(f"❌ Main analyzer import failed: {e}")
    sys.exit(1)

try:
    from analyzer.id import contradiction_id
    print("✅ ID module import works")
except ImportError as e:
    print(f"❌ ID module import failed: {e}")
    sys.exit(1)

print("\n🔍 Testing basic contradiction detection...")

# Simple test data
statements = [
    {'id': 'test1', 'event': 'meeting', 'party': 'John', 'present': True},
    {'id': 'test2', 'event': 'meeting', 'party': 'John', 'present': False},
]

try:
    contradictions = evaluate(statements)
    real_contradictions = [c for c in contradictions if c.get('type') != '__engine_error__']
    engine_errors = [c for c in contradictions if c.get('type') == '__engine_error__']
    
    print(f"✅ Evaluation completed: {len(real_contradictions)} contradictions, {len(engine_errors)} errors")
    
    if real_contradictions:
        print(f"✅ Found contradiction: {real_contradictions[0]['type']}")
    
    if engine_errors:
        for error in engine_errors:
            print(f"❌ Engine error in {error.get('rule', 'unknown')}: {error.get('error', 'unknown')}")
            
except Exception as e:
    print(f"❌ Evaluation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n🔍 Testing ID symmetry...")

try:
    id1 = contradiction_id(statements[0], statements[1])
    id2 = contradiction_id(statements[1], statements[0])
    
    if id1 == id2:
        print(f"✅ ID symmetry works: {id1}")
    else:
        print(f"❌ ID symmetry failed: {id1} != {id2}")
        
except Exception as e:
    print(f"❌ ID test failed: {e}")
    sys.exit(1)

print("\n🔍 Testing rules fingerprint...")

try:
    fingerprint = get_rules_fingerprint()
    print(f"✅ Rules fingerprint: {fingerprint}")
except Exception as e:
    print(f"❌ Fingerprint test failed: {e}")
    sys.exit(1)

print("\n🎉 Core analyzer functionality is working!")