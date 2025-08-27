"""
Tests for analyzer rules and functionality.
"""

import pytest
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Set up working directory for imports
import os
os.chdir(PROJECT_ROOT)

from analyzer.evaluate import analyze_documents, evaluate
from analyzer.id import contradiction_id
from analyzer.rules_presence import presence_absence_conflict
from analyzer.rules_dates import event_date_disagreement
from analyzer.rules_numeric import numeric_amount_mismatch

class TestAnalyzerRules:
    """Test cases for analyzer rules."""
    
    def test_analyzer_evaluate_function(self):
        """Test that analyzer.evaluate function exists and works."""
        # Test with simple documents
        documents = [
            {
                'id': 'test1',
                'textContent': 'Test document content',
                'fileName': 'test.txt'
            }
        ]
        
        result = evaluate(documents)
        
        assert isinstance(result, dict)
        assert 'num_statements' in result
        assert 'num_contradictions' in result
        assert 'contradictions' in result
        assert 'rules_fingerprint' in result
        
    def test_presence_absence_conflict(self):
        """Test presence_absence_conflict rule."""
        statements = [
            {
                'id': 'stmt1',
                'content': 'The evidence was present at the scene',
                'source': 'report1.txt'
            },
            {
                'id': 'stmt2', 
                'content': 'The evidence was not found at the location',
                'source': 'report2.txt'
            }
        ]
        
        contradictions = presence_absence_conflict(statements)
        
        assert len(contradictions) > 0
        contradiction = contradictions[0]
        assert contradiction['type'] == 'presence_absence_conflict'
        assert len(contradiction['statements']) == 2
        assert contradiction['confidence'] > 0
        
    def test_event_date_disagreement(self):
        """Test event_date_disagreement rule."""
        statements = [
            {
                'id': 'stmt1',
                'content': 'The incident occurred on 12/25/2022',
                'source': 'report1.txt'
            },
            {
                'id': 'stmt2',
                'content': 'The incident happened on 12/26/2022', 
                'source': 'report2.txt'
            }
        ]
        
        contradictions = event_date_disagreement(statements)
        
        assert len(contradictions) > 0
        contradiction = contradictions[0]
        assert contradiction['type'] == 'event_date_disagreement'
        assert len(contradiction['statements']) >= 2
        assert contradiction['confidence'] > 0
        
    def test_numeric_amount_mismatch(self):
        """Test numeric_amount_mismatch rule."""
        statements = [
            {
                'id': 'stmt1',
                'content': 'The damage cost was $1,000',
                'source': 'report1.txt'
            },
            {
                'id': 'stmt2',
                'content': 'The damage cost was $2,000',
                'source': 'report2.txt'
            }
        ]
        
        contradictions = numeric_amount_mismatch(statements)
        
        assert len(contradictions) > 0
        contradiction = contradictions[0]
        assert contradiction['type'] == 'numeric_amount_mismatch'
        assert len(contradiction['statements']) >= 2
        assert contradiction['confidence'] > 0
        
    def test_contradiction_id_symmetry(self):
        """Test that contradiction_id(a, b) == contradiction_id(b, a)."""
        statement_a = {
            'id': 'stmt_a',
            'content': 'Statement A content'
        }
        statement_b = {
            'id': 'stmt_b', 
            'content': 'Statement B content'
        }
        
        id_ab = contradiction_id(statement_a, statement_b)
        id_ba = contradiction_id(statement_b, statement_a)
        
        assert id_ab == id_ba
        assert len(id_ab) == 16  # Should be 16 character hash
        assert isinstance(id_ab, str)
        
    def test_contradiction_id_deterministic(self):
        """Test that contradiction_id is deterministic."""
        statement_a = {
            'id': 'test1',
            'content': 'Test content A'
        }
        statement_b = {
            'id': 'test2',
            'content': 'Test content B'
        }
        
        # Should get same ID multiple times
        id1 = contradiction_id(statement_a, statement_b)
        id2 = contradiction_id(statement_a, statement_b)
        id3 = contradiction_id(statement_b, statement_a)
        
        assert id1 == id2 == id3
        
    def test_full_analysis_pipeline(self):
        """Test the complete analysis pipeline."""
        documents = [
            {
                'id': 'doc1',
                'fileName': 'report1.txt',
                'title': 'Initial Report',
                'textContent': 'The incident occurred on 12/25/2022. The evidence was present. Cost was $1,500.',
                'uploadedAt': '2023-01-01T00:00:00Z'
            },
            {
                'id': 'doc2',
                'fileName': 'report2.txt', 
                'title': 'Revised Report',
                'textContent': 'The incident happened on 12/26/2022. The evidence was missing. Cost was $2,000.',
                'uploadedAt': '2023-01-02T00:00:00Z'
            }
        ]
        
        result = analyze_documents(documents)
        
        # Check structure
        assert 'num_statements' in result
        assert 'num_contradictions' in result
        assert 'contradictions' in result
        assert 'statements' in result
        assert 'rules_fingerprint' in result
        
        # Should have detected contradictions
        assert result['num_contradictions'] > 0
        
        # Each contradiction should have an ID
        for contradiction in result['contradictions']:
            if contradiction['type'] != '__engine_error__':
                assert 'contradiction_id' in contradiction
                assert contradiction['contradiction_id'] is not None
                assert len(contradiction['contradiction_id']) > 0
                
    def test_no_engine_errors(self):
        """Test that analysis doesn't produce engine errors with valid input."""
        documents = [
            {
                'id': 'simple',
                'textContent': 'Simple test document',
                'fileName': 'test.txt'
            }
        ]
        
        result = analyze_documents(documents)
        
        # Should not have engine errors
        engine_errors = [c for c in result['contradictions'] if c['type'] == '__engine_error__']
        assert len(engine_errors) == 0