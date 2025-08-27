#!/usr/bin/env python3
"""
Initialize SQLite database with contradictions and exhibits tables.
Creates sqlite.db with tables that mirror contradictions_scored.json structure.
"""

import sqlite3
import sys
from pathlib import Path

def create_database(db_path: str = "sqlite.db"):
    """Create SQLite database with contradictions and exhibits tables."""
    
    # Remove existing database if it exists
    db_file = Path(db_path)
    if db_file.exists():
        print(f"Removing existing database: {db_path}")
        db_file.unlink()
    
    # Create new database
    print(f"Creating database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create contradictions table - mirrors contradictions_scored.json structure
    cursor.execute("""
        CREATE TABLE contradictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contradiction_id TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL,
            score INTEGER,
            description TEXT,
            event TEXT,
            party TEXT,
            person TEXT,
            case_name TEXT,
            location TEXT,
            date_a TEXT,
            date_b TEXT,
            amount_a REAL,
            amount_b REAL,
            status_a TEXT,
            status_b TEXT,
            role_a TEXT,
            role_b TEXT,
            location_a TEXT,
            location_b TEXT,
            currency TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create exhibits table - for document exhibits
    cursor.execute("""
        CREATE TABLE exhibits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exhibit_id TEXT UNIQUE NOT NULL,
            file_name TEXT NOT NULL,
            category TEXT,
            title TEXT,
            description TEXT,
            file_hash TEXT,
            file_size INTEGER,
            page_count INTEGER,
            upload_date TEXT,
            text_content TEXT,
            exhibit_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create indexes for common queries
    cursor.execute("CREATE INDEX idx_contradictions_type ON contradictions(type)")
    cursor.execute("CREATE INDEX idx_contradictions_score ON contradictions(score DESC)")
    cursor.execute("CREATE INDEX idx_contradictions_person ON contradictions(person)")
    cursor.execute("CREATE INDEX idx_contradictions_event ON contradictions(event)")
    cursor.execute("CREATE INDEX idx_exhibits_category ON exhibits(category)")
    cursor.execute("CREATE INDEX idx_exhibits_exhibit_id ON exhibits(exhibit_id)")
    
    # Commit changes
    conn.commit()
    
    # Print table info
    print("\n✅ Database created successfully!")
    print("\nContradictions table schema:")
    cursor.execute("PRAGMA table_info(contradictions)")
    for row in cursor.fetchall():
        print(f"  {row[1]} ({row[2]})")
    
    print("\nExhibits table schema:")
    cursor.execute("PRAGMA table_info(exhibits)")
    for row in cursor.fetchall():
        print(f"  {row[1]} ({row[2]})")
    
    # Close connection
    conn.close()
    
    return db_path

def main():
    """Main function for database initialization."""
    db_path = sys.argv[1] if len(sys.argv) > 1 else "sqlite.db"
    
    try:
        created_db = create_database(db_path)
        print(f"\n🎉 Database initialization completed: {created_db}")
        return 0
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())