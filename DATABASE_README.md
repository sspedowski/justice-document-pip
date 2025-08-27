# SQLite Database for Contradictions and Exhibits

This implementation adds SQLite database storage for contradictions and exhibits data, providing structured querying capabilities for the justice document system.

## Files Added

### Core Scripts
- `scripts/init_db.py` - Initialize SQLite database with tables
- `scripts/load_to_db.py` - Load contradictions from JSON into database
- `api/query_api.py` - Optional Flask API for querying (requires Flask)

### Database Schema

#### Contradictions Table
Mirrors the structure of `contradictions_scored.json`:
- `contradiction_id` (TEXT) - Unique identifier
- `type` (TEXT) - Type of contradiction
- `score` (INTEGER) - Contradiction score
- `description` (TEXT) - Human-readable description
- `event`, `party`, `person`, `case_name`, `location` - Context fields
- `date_a`, `date_b` - Dates involved in contradiction
- `amount_a`, `amount_b`, `currency` - Numeric values
- `status_a`, `status_b` - Status values
- `role_a`, `role_b` - Role information
- `location_a`, `location_b` - Location details

#### Exhibits Table
For document exhibits (extensible):
- `exhibit_id` (TEXT) - Unique exhibit identifier
- `file_name` (TEXT) - Original file name
- `category` (TEXT) - Document category
- `title`, `description` - Metadata
- `file_hash`, `file_size`, `page_count` - File information
- `text_content` - Extracted text content

## Usage

### 1. Initialize Database
```bash
python scripts/init_db.py [database_name]
```
Creates `sqlite.db` (or specified name) with tables and indexes.

### 2. Load Contradictions Data
```bash
python scripts/load_to_db.py [json_path] [database_name]
```
Loads data from `public/data/contradictions_scored.json` into database.

### 3. Query Database
```bash
# Direct SQLite queries
sqlite3 sqlite.db "SELECT count(*) FROM contradictions;"
sqlite3 sqlite.db "SELECT * FROM contradictions WHERE person LIKE '%Noel%';"

# Or use the API (requires Flask)
python api/query_api.py
# Then visit: http://localhost:5000/api/query?q=Noel
```

## Acceptance Criteria ✅

- [x] `python scripts/load_to_db.py` populates sqlite.db
- [x] `sqlite3 sqlite.db "select count(*) from contradictions;"` returns >0 rows
- [x] API returns JSON when run locally (Flask implementation provided)

## API Endpoints (Optional)

When Flask is available:

- `GET /api/query?q=searchterm` - Search contradictions
- `GET /api/stats` - Database statistics
- `GET /api/health` - Health check

### Example API Response
```json
{
  "query": "Noel",
  "count": 1,
  "results": [
    {
      "contradiction_id": "test_noel_001",
      "type": "witness_tampering", 
      "score": 95,
      "description": "Witness Noel Johnson statement removed from report",
      "person": "Noel Johnson"
    }
  ]
}
```

## Dependencies

- Python 3.6+ (built-in `sqlite3` module)
- Flask (optional, for API endpoints)

## Database Features

- Indexed for fast queries on common fields
- UPSERT support (INSERT OR REPLACE)
- Full-text search across multiple fields
- Statistics and aggregation queries
- JSON-compatible output for API responses