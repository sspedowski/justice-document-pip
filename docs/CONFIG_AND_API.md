# Configuration and API Documentation

This document describes the configuration system and API endpoints for the Justice Document Manager's analysis engine.

## Rule Weights Configuration

### Weights File Format

The analysis engine uses a JSON configuration file to define scoring weights for different types of contradictions and violations. The default location is `analyzer/rule_weights.json`.

#### Structure

```json
{
  "version": "1.0",
  "description": "Rule weights for contradiction and legal analysis scoring",
  "weights": {
    "legal_violations": {
      "brady_violation": 0.9,
      "due_process": 0.8,
      "evidence_tampering": 1.0,
      "perjury": 0.85,
      "capta_violation": 0.7
    },
    "document_integrity": {
      "name_alteration": 0.8,
      "content_modification": 0.75,
      "timeline_inconsistency": 0.7,
      "numeric_changes": 0.65
    },
    "pattern_analysis": {
      "systematic_suppression": 0.95,
      "cross_document_inconsistency": 0.8,
      "temporal_anomaly": 0.7,
      "content_length_changes": 0.6
    },
    "confidence_thresholds": {
      "critical": 0.85,
      "high": 0.7,
      "medium": 0.5,
      "low": 0.3
    }
  },
  "updated_at": "2024-08-27T07:25:00Z",
  "updated_by": "system"
}
```

#### Weight Categories

**Legal Violations** - Weights for detecting legal rule violations:
- `brady_violation`: Brady disclosure violations (0.0 - 1.0)
- `due_process`: Due process violations (0.0 - 1.0)  
- `evidence_tampering`: Evidence tampering detection (0.0 - 1.0)
- `perjury`: Perjury detection (0.0 - 1.0)
- `capta_violation`: CAPTA violations (0.0 - 1.0)

**Document Integrity** - Weights for document tampering detection:
- `name_alteration`: Name mention changes (0.0 - 1.0)
- `content_modification`: Content alterations (0.0 - 1.0)
- `timeline_inconsistency`: Timeline conflicts (0.0 - 1.0)
- `numeric_changes`: Numeric value changes (0.0 - 1.0)

**Pattern Analysis** - Weights for systematic pattern detection:
- `systematic_suppression`: Evidence suppression patterns (0.0 - 1.0)
- `cross_document_inconsistency`: Cross-document conflicts (0.0 - 1.0)
- `temporal_anomaly`: Time-based anomalies (0.0 - 1.0)
- `content_length_changes`: Document length changes (0.0 - 1.0)

**Confidence Thresholds** - Score thresholds for severity levels:
- `critical`: Threshold for critical issues (0.0 - 1.0)
- `high`: Threshold for high-priority issues (0.0 - 1.0)
- `medium`: Threshold for medium-priority issues (0.0 - 1.0)
- `low`: Threshold for low-priority issues (0.0 - 1.0)

## Scoring Engine (scoding.py)

### Command Line Usage

```bash
# Run analysis once with default weights
python scripts/scoding.py

# Use custom weights file
python scripts/scoding.py --weights path/to/custom_weights.json

# Enable hot-reload mode (monitors file changes)
python scripts/scoding.py --watch

# Hot-reload with custom weights file
python scripts/scoding.py --watch --weights custom_weights.json

# Specify custom output directory
python scripts/scoding.py --output-dir /path/to/output

# Enable verbose logging
python scripts/scoding.py --verbose
```

### Command Line Options

- `--weights PATH`: Path to rule weights JSON file (default: `analyzer/rule_weights.json`)
- `--watch`: Watch weights file for changes and re-run analysis automatically
- `--output-dir PATH`: Output directory for results (default: `public/data`)
- `--verbose, -v`: Enable verbose logging for debugging
- `--help`: Show help message and usage examples

### Hot-Reload Functionality

When `--watch` flag is used:

1. **File Monitoring**: Monitors the weights file for modifications using file system timestamps
2. **Automatic Reload**: When changes are detected, the new weights are loaded and validated
3. **Re-analysis**: Analysis is automatically re-run with the updated weights
4. **Error Handling**: Invalid or malformed files trigger warnings and fallback to default weights
5. **Periodic Updates**: Analysis runs periodically (every 5 minutes) even without weight changes

### Error Handling

- **Missing File**: Logs warning and uses default weights
- **Malformed JSON**: Logs error and falls back to default weights  
- **Invalid Structure**: Validates required keys and uses defaults for missing values
- **Permission Errors**: Graceful handling with informative error messages

## Analysis API

The API provides read-only access to analysis results and system status.

### Base URL

Local development: `http://localhost:8000`

### Authentication

No authentication required - read-only API for analysis results.

### CORS Support

CORS is enabled for localhost development on common ports:
- `http://localhost:3000` (React dev server)
- `http://localhost:5000` 
- `http://localhost:8000`

### Endpoints

#### GET /analysis/contradictions

Returns base contradictions analysis without scoring.

**Response Example:**
```json
{
  "analysis_id": "contradictions_001",
  "generated_at": "2024-08-27T07:25:00Z",
  "total_contradictions": 15,
  "categories": {
    "timeline_inconsistencies": 6,
    "name_alterations": 4,
    "content_modifications": 3,
    "cross_document_conflicts": 2
  },
  "contradictions": [
    {
      "id": "c001",
      "type": "timeline_inconsistency",
      "severity": "high",
      "description": "Document modified after newer document creation",
      "documents": ["doc_123", "doc_456"],
      "confidence": 0.85
    }
  ],
  "metadata": {
    "documents_analyzed": 45,
    "processing_time_ms": 2340,
    "algorithm_version": "1.2.0"
  }
}
```

#### GET /analysis/contradictions_scored

Returns contradictions with applied rule weight scoring.

**Response Example:**
```json
{
  "analysis_id": "contradictions_scored_001",
  "generated_at": "2024-08-27T07:25:00Z",
  "rule_weights_version": "1.0",
  "total_score": 78.5,
  "max_possible_score": 100,
  "risk_level": "HIGH",
  "scored_contradictions": [
    {
      "id": "c001",
      "type": "timeline_inconsistency",
      "base_confidence": 0.85,
      "rule_weight": 0.7,
      "weighted_score": 59.5,
      "severity": "high",
      "score_breakdown": {
        "confidence_factor": 0.85,
        "pattern_weight": 0.7,
        "severity_multiplier": 1.0
      }
    }
  ],
  "category_scores": {
    "timeline_inconsistencies": 42.3,
    "name_alterations": 58.9
  },
  "recommendations": [
    "Immediate review of high-scoring contradictions required",
    "Preserve all document versions and metadata"
  ]
}
```

#### GET /analysis/run_meta

Returns metadata about the analysis run.

**Response Example:**
```json
{
  "run_id": "analysis_run_20240827_072500",
  "started_at": "2024-08-27T07:20:00Z",
  "completed_at": "2024-08-27T07:25:00Z",
  "duration_seconds": 300,
  "status": "completed",
  "git_info": {
    "commit_sha": "9c4455f123",
    "branch": "main",
    "repository": "sspedowski/justice-document-pip"
  },
  "input_data": {
    "documents_processed": 45,
    "total_file_size_mb": 123.4
  },
  "configuration": {
    "rule_weights_file": "analyzer/rule_weights.json",
    "confidence_threshold": 0.5,
    "algorithm_version": "1.2.0"
  }
}
```

#### GET /analysis/status

Returns system health and status information.

**Response Example:**
```json
{
  "ok": true,
  "status": "healthy",
  "updated_at": "2024-08-27T07:25:00Z",
  "counts": {
    "input_documents": 42,
    "processed_documents": 45,
    "analysis_files": 4
  },
  "git_sha": "9c4455f123",
  "git_branch": "main",
  "files": {
    "contradictions": true,
    "contradictions_scored": true,
    "run_meta": true,
    "rule_weights": true
  },
  "timestamps": {
    "contradictions.json": "2024-08-27T07:24:00Z",
    "contradictions_scored.json": "2024-08-27T07:25:00Z",
    "run_meta.json": "2024-08-27T07:25:00Z"
  },
  "weights_updated_at": "2024-08-27T07:20:00Z",
  "system_info": {
    "data_directory": "/path/to/public/data",
    "weights_directory": "/path/to/analyzer",
    "api_version": "1.0.0"
  }
}
```

#### GET /

API root with basic information and endpoint list.

#### GET /health

Simple health check endpoint.

### Error Responses

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `404 Not Found`: Requested file/data not available
- `500 Internal Server Error`: Server-side error

Error response format:
```json
{
  "detail": "Error description"
}
```

## Usage Examples

### Basic Analysis

```bash
# Run analysis with default weights
python scripts/scoding.py

# Check API results
curl http://localhost:8000/analysis/status
curl http://localhost:8000/analysis/contradictions_scored
```

### Hot-Reload Development

```bash
# Terminal 1: Start hot-reload scoring
python scripts/scoding.py --watch --verbose

# Terminal 2: Start API server  
python backend/api.py --reload

# Terminal 3: Edit weights and see live updates
vim analyzer/rule_weights.json
```

### Custom Configuration

```bash
# Create custom weights
cp analyzer/rule_weights.json custom_weights.json
# Edit custom_weights.json...

# Use custom weights
python scripts/scoding.py --weights custom_weights.json

# Hot-reload with custom weights
python scripts/scoding.py --watch --weights custom_weights.json
```

## Deployment Notes

- API server can be run with `uvicorn backend.api:app` for production
- Use `--watch` mode only in development environments
- Ensure proper file permissions for weights file modifications
- Monitor logs for weight loading errors and warnings
- Consider using process managers (systemd, supervisor) for production deployments

## Troubleshooting

### Common Issues

**Weights file not loading:**
- Check file permissions and path
- Validate JSON syntax
- Review error logs for specific issues

**API endpoints returning 404:**
- Ensure data files exist in `public/data/`
- Run scoring analysis to generate required files
- Check file permissions

**Hot-reload not working:**
- Verify file system supports mtime updates
- Check if file is being modified correctly
- Enable verbose logging to see change detection

### Log Locations

- Scoring engine: stdout/stderr with timestamps
- API server: uvicorn logging to stdout/stderr
- Enable verbose mode with `--verbose` flag for debugging