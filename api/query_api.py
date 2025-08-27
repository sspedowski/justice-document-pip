#!/usr/bin/env python3
"""
Simple Flask API for querying contradictions database.
Provides REST endpoint: GET /api/query?q=searchterm
Returns JSON of matching contradictions.
"""

import sqlite3
import json
import sys
from pathlib import Path

try:
    from flask import Flask, request, jsonify
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

app = Flask(__name__)

# Database configuration
DB_PATH = "sqlite.db"

def get_db_connection():
    """Get database connection."""
    if not Path(DB_PATH).exists():
        raise FileNotFoundError(f"Database {DB_PATH} not found. Run init_db.py and load_to_db.py first.")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

@app.route('/api/query', methods=['GET'])
def query_contradictions():
    """Query contradictions by search term."""
    try:
        search_term = request.args.get('q', '').strip()
        
        if not search_term:
            return jsonify({
                "error": "Missing query parameter 'q'",
                "usage": "/api/query?q=searchterm"
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Search across multiple fields
        search_sql = """
            SELECT * FROM contradictions 
            WHERE description LIKE ? 
               OR person LIKE ? 
               OR event LIKE ?
               OR party LIKE ?
               OR type LIKE ?
            ORDER BY score DESC
        """
        
        search_pattern = f"%{search_term}%"
        cursor.execute(search_sql, [search_pattern] * 5)
        
        # Convert rows to dictionaries
        results = []
        for row in cursor.fetchall():
            result = dict(row)
            results.append(result)
        
        conn.close()
        
        return jsonify({
            "query": search_term,
            "count": len(results),
            "results": results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) as total FROM contradictions")
        total = cursor.fetchone()['total']
        
        # Get counts by type
        cursor.execute("""
            SELECT type, COUNT(*) as count 
            FROM contradictions 
            GROUP BY type 
            ORDER BY count DESC
        """)
        
        by_type = [dict(row) for row in cursor.fetchall()]
        
        # Get average score
        cursor.execute("SELECT AVG(score) as avg_score FROM contradictions")
        avg_score = cursor.fetchone()['avg_score']
        
        conn.close()
        
        return jsonify({
            "total_contradictions": total,
            "average_score": round(avg_score, 2) if avg_score else 0,
            "by_type": by_type
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM contradictions")
        count = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "contradictions_count": count
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

def main():
    """Main function to run the Flask API."""
    if not FLASK_AVAILABLE:
        print("❌ Flask not installed. Install with: pip install flask")
        return 1
    
    if not Path(DB_PATH).exists():
        print(f"❌ Database {DB_PATH} not found. Run init_db.py and load_to_db.py first.")
        return 1
    
    print("🚀 Starting Flask API server...")
    print(f"📊 Database: {DB_PATH}")
    print("🌐 Endpoints:")
    print("  GET /api/query?q=searchterm - Query contradictions")
    print("  GET /api/stats - Get database statistics")
    print("  GET /api/health - Health check")
    print("\n💡 Example: http://localhost:5000/api/query?q=Noel")
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
        return 0
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())