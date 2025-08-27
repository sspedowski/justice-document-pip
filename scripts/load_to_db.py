#!/usr/bin/env python3
"""
Load contradictions from contradictions_scored.json into SQLite database.
Reads JSON data and bulk-inserts into the contradictions table.
"""

import json
import sqlite3
import sys
from pathlib import Path

def load_contradictions_from_json(json_path: str = "public/data/contradictions_scored.json"):
    """Load contradictions data from JSON file."""
    json_file = Path(json_path)
    if not json_file.exists():
        print(f"❌ Error: {json_path} not found. Run run_analysis.py and scoding.py first.")
        return []
    
    print(f"📖 Loading contradictions from: {json_path}")
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"✅ Loaded {len(data)} contradictions from JSON")
    return data

def insert_contradictions_to_db(contradictions, db_path: str = "sqlite.db"):
    """Insert contradictions data into SQLite database."""
    db_file = Path(db_path)
    if not db_file.exists():
        print(f"❌ Error: Database {db_path} not found. Run init_db.py first.")
        return False
    
    print(f"📊 Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Prepare insert statement
    insert_sql = """
        INSERT OR REPLACE INTO contradictions (
            contradiction_id, type, score, description, event, party, person, 
            case_name, location, date_a, date_b, amount_a, amount_b, 
            status_a, status_b, role_a, role_b, location_a, location_b, currency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    # Prepare data for bulk insert
    rows = []
    for item in contradictions:
        row = (
            item.get('contradiction_id'),
            item.get('type'),
            item.get('score'),
            item.get('description'),
            item.get('event'),
            item.get('party'),
            item.get('person'),
            item.get('case'),  # mapped to case_name
            item.get('location'),
            item.get('date_a'),
            item.get('date_b'),
            item.get('amount_a'),
            item.get('amount_b'),
            item.get('status_a'),
            item.get('status_b'),
            item.get('role_a'),
            item.get('role_b'),
            item.get('location_a'),
            item.get('location_b'),
            item.get('currency')
        )
        rows.append(row)
    
    # Execute bulk insert
    print(f"💾 Inserting {len(rows)} contradictions into database...")
    cursor.executemany(insert_sql, rows)
    
    # Commit changes
    conn.commit()
    
    # Verify insertion
    cursor.execute("SELECT COUNT(*) FROM contradictions")
    count = cursor.fetchone()[0]
    print(f"✅ Successfully inserted contradictions. Total in DB: {count}")
    
    # Show some sample data
    print("\n📋 Sample contradictions in database:")
    cursor.execute("""
        SELECT contradiction_id, type, score, description 
        FROM contradictions 
        ORDER BY score DESC 
        LIMIT 3
    """)
    
    for row in cursor.fetchall():
        print(f"  ID: {row[0]}, Type: {row[1]}, Score: {row[2]}")
        print(f"      Description: {row[3][:80]}{'...' if len(row[3]) > 80 else ''}")
    
    # Close connection
    conn.close()
    return True

def main():
    """Main function for loading data to database."""
    # Parse command line arguments
    json_path = sys.argv[1] if len(sys.argv) > 1 else "public/data/contradictions_scored.json"
    db_path = sys.argv[2] if len(sys.argv) > 2 else "sqlite.db"
    
    try:
        # Load contradictions from JSON
        contradictions = load_contradictions_from_json(json_path)
        if not contradictions:
            return 1
        
        # Insert into database
        success = insert_contradictions_to_db(contradictions, db_path)
        
        if success:
            print(f"\n🎉 Data loading completed successfully!")
            print(f"📊 Database: {db_path}")
            print(f"📈 Records: {len(contradictions)} contradictions loaded")
            return 0
        else:
            return 1
            
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())