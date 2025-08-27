#!/usr/bin/env python3
"""
Contradiction Management Script

Provides CLI tools to manage suppressions and annotations for contradictions.
Data is stored in public/data/suppressions.json and public/data/annotations.json

Usage:
    python scripts/manage_contradictions.py --suppress <id>
    python scripts/manage_contradictions.py --unsuppress <id>
    python scripts/manage_contradictions.py --annotate <id> --note "Your note here"
    python scripts/manage_contradictions.py --list
"""

import json
import argparse
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

# Default paths relative to project root
SUPPRESSIONS_FILE = "public/data/suppressions.json"
ANNOTATIONS_FILE = "public/data/annotations.json"

def get_project_root() -> Path:
    """Get the project root directory."""
    # Assume script is in scripts/ directory of project
    script_dir = Path(__file__).parent
    return script_dir.parent

def load_json_file(file_path: Path, default: Any = None) -> Any:
    """Load JSON data from file, create with default if missing."""
    if not file_path.exists():
        if default is not None:
            # Create parent directories if they don't exist
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, 'w') as f:
                json.dump(default, f, indent=2)
            print(f"Created {file_path} with default data")
            return default
        else:
            raise FileNotFoundError(f"File {file_path} not found")
    
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON in {file_path}: {e}")
        sys.exit(1)

def save_json_file(file_path: Path, data: Any) -> None:
    """Save JSON data to file."""
    try:
        # Ensure parent directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Saved data to {file_path}")
    except Exception as e:
        print(f"Error saving to {file_path}: {e}")
        sys.exit(1)

def suppress_contradiction(contradiction_id: str) -> None:
    """Add a contradiction ID to the suppressions list."""
    project_root = get_project_root()
    suppressions_path = project_root / SUPPRESSIONS_FILE
    
    # Load existing suppressions or create empty list
    suppressions = load_json_file(suppressions_path, [])
    
    if not isinstance(suppressions, list):
        print(f"Error: {suppressions_path} should contain an array")
        sys.exit(1)
    
    # Add ID if not already present
    if contradiction_id not in suppressions:
        suppressions.append(contradiction_id)
        save_json_file(suppressions_path, suppressions)
        print(f"✓ Suppressed contradiction: {contradiction_id}")
    else:
        print(f"Contradiction {contradiction_id} is already suppressed")

def unsuppress_contradiction(contradiction_id: str) -> None:
    """Remove a contradiction ID from the suppressions list."""
    project_root = get_project_root()
    suppressions_path = project_root / SUPPRESSIONS_FILE
    
    # Load existing suppressions
    suppressions = load_json_file(suppressions_path, [])
    
    if not isinstance(suppressions, list):
        print(f"Error: {suppressions_path} should contain an array")
        sys.exit(1)
    
    # Remove ID if present
    if contradiction_id in suppressions:
        suppressions.remove(contradiction_id)
        save_json_file(suppressions_path, suppressions)
        print(f"✓ Unsuppressed contradiction: {contradiction_id}")
    else:
        print(f"Contradiction {contradiction_id} was not suppressed")

def annotate_contradiction(contradiction_id: str, note: str) -> None:
    """Add or update an annotation for a contradiction."""
    project_root = get_project_root()
    annotations_path = project_root / ANNOTATIONS_FILE
    
    # Load existing annotations or create empty list
    annotations = load_json_file(annotations_path, [])
    
    if not isinstance(annotations, list):
        print(f"Error: {annotations_path} should contain an array")
        sys.exit(1)
    
    # Find existing annotation or create new one
    annotation_data = {
        "contradiction_id": contradiction_id,
        "note": note,
        "updated_at": datetime.now().isoformat()
    }
    
    # Update existing annotation or add new one
    updated = False
    for i, annotation in enumerate(annotations):
        if annotation.get("contradiction_id") == contradiction_id:
            annotations[i] = annotation_data
            updated = True
            break
    
    if not updated:
        annotations.append(annotation_data)
    
    save_json_file(annotations_path, annotations)
    
    action = "Updated" if updated else "Added"
    print(f"✓ {action} annotation for contradiction: {contradiction_id}")
    print(f"  Note: {note}")

def list_data() -> None:
    """List all current suppressions and annotations."""
    project_root = get_project_root()
    suppressions_path = project_root / SUPPRESSIONS_FILE
    annotations_path = project_root / ANNOTATIONS_FILE
    
    print("=== CURRENT CONTRADICTION DATA ===\n")
    
    # Show suppressions
    try:
        suppressions = load_json_file(suppressions_path, [])
        print(f"Suppressed Contradictions ({len(suppressions)}):")
        if suppressions:
            for i, suppression_id in enumerate(suppressions, 1):
                print(f"  {i}. {suppression_id}")
        else:
            print("  (None)")
        print()
    except Exception as e:
        print(f"Error loading suppressions: {e}\n")
    
    # Show annotations
    try:
        annotations = load_json_file(annotations_path, [])
        print(f"Annotations ({len(annotations)}):")
        if annotations:
            for i, annotation in enumerate(annotations, 1):
                contradiction_id = annotation.get("contradiction_id", "Unknown")
                note = annotation.get("note", "")
                updated_at = annotation.get("updated_at", "")
                print(f"  {i}. {contradiction_id}")
                print(f"     Note: {note}")
                print(f"     Updated: {updated_at}")
                print()
        else:
            print("  (None)")
        print()
    except Exception as e:
        print(f"Error loading annotations: {e}\n")

def main():
    parser = argparse.ArgumentParser(
        description="Manage contradiction suppressions and annotations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Suppress a contradiction
  python scripts/manage_contradictions.py --suppress "name_change_child_name_alteration_critical"
  
  # Unsuppress a contradiction
  python scripts/manage_contradictions.py --unsuppress "name_change_child_name_alteration_critical"
  
  # Add an annotation
  python scripts/manage_contradictions.py --annotate "name_change_child_name_alteration_critical" --note "This change was authorized by court order"
  
  # List all data
  python scripts/manage_contradictions.py --list
        """
    )
    
    parser.add_argument("--suppress", metavar="ID", help="Suppress a contradiction by ID")
    parser.add_argument("--unsuppress", metavar="ID", help="Unsuppress a contradiction by ID")
    parser.add_argument("--annotate", metavar="ID", help="Add/update annotation for contradiction ID")
    parser.add_argument("--note", metavar="TEXT", help="Note text (required with --annotate)")
    parser.add_argument("--list", action="store_true", help="List all current suppressions and annotations")
    
    args = parser.parse_args()
    
    # Check if no arguments provided
    if not any([args.suppress, args.unsuppress, args.annotate, args.list]):
        parser.print_help()
        sys.exit(0)
    
    try:
        if args.suppress:
            suppress_contradiction(args.suppress)
        
        if args.unsuppress:
            unsuppress_contradiction(args.unsuppress)
        
        if args.annotate:
            if not args.note:
                print("Error: --note is required when using --annotate")
                sys.exit(1)
            annotate_contradiction(args.annotate, args.note)
        
        if args.list:
            list_data()
            
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()