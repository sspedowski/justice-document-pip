"""
Unit tests for analyzer rules and core functionality.
"""

import pytest
import sys
from pathlib import Path

# Add the project root to Python path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from analyzer import evaluate
from analyzer.id import contradiction_id

class TestAnalyzerRules:
    """Test cases for individual analyzer rules."""
    
    def test_presence_absence_conflict(self):
        """Test that presence_absence_conflict triggers with True/False for same event/party."""
        statements = [
            {
                'id': 'stmt_1',
                'event': 'meeting_A',
                'party': 'John Doe',
                'present': True
            },
            {
                'id': 'stmt_2',
                'event': 'meeting_A', 
                'party': 'John Doe',
                'present': False
            }
        ]
        
        contradictions = evaluate(statements)
        
        # Should find exactly one contradiction
        presence_conflicts = [c for c in contradictions if c.get('type') == 'presence_absence_conflict']
        assert len(presence_conflicts) == 1
        
        conflict = presence_conflicts[0]
        assert conflict['event'] == 'meeting_A'
        assert conflict['party'] == 'John Doe'
        assert 'Conflicting presence status' in conflict['description']
    
    def test_event_date_disagreement(self):
        """Test that event_date_disagreement triggers with different dates for same event."""
        statements = [
            {
                'id': 'stmt_1',
                'event': 'incident_X',
                'date': '2024-01-15'
            },
            {
                'id': 'stmt_2',
                'event': 'incident_X',
                'date': '2024-01-16'
            }
        ]
        
        contradictions = evaluate(statements)
        
        # Should find exactly one contradiction
        date_conflicts = [c for c in contradictions if c.get('type') == 'event_date_disagreement']
        assert len(date_conflicts) == 1
        
        conflict = date_conflicts[0]
        assert conflict['event'] == 'incident_X'
        assert conflict['date_a'] in ['2024-01-15', '2024-01-16']
        assert conflict['date_b'] in ['2024-01-15', '2024-01-16']
        assert conflict['date_a'] != conflict['date_b']
    
    def test_numeric_amount_mismatch(self):
        """Test that numeric_amount_mismatch triggers with different values for same event/currency."""
        statements = [
            {
                'id': 'stmt_1',
                'event': 'transaction_Y',
                'amount': 1000,
                'currency': 'USD'
            },
            {
                'id': 'stmt_2', 
                'event': 'transaction_Y',
                'amount': 1500,
                'currency': 'USD'
            }
        ]
        
        contradictions = evaluate(statements)
        
        # Should find exactly one contradiction
        amount_conflicts = [c for c in contradictions if c.get('type') == 'numeric_amount_mismatch']
        assert len(amount_conflicts) == 1
        
        conflict = amount_conflicts[0]
        assert conflict['event'] == 'transaction_Y'
        assert conflict['currency'] == 'USD'
        assert conflict['amount_a'] in [1000, 1500]
        assert conflict['amount_b'] in [1000, 1500]
        assert conflict['amount_a'] != conflict['amount_b']

class TestContradictionId:
    """Test cases for contradiction ID generation."""
    
    def test_id_symmetry(self):
        """Test that contradiction_id(a,b) == contradiction_id(b,a)."""
        stmt_a = {'id': 'statement_1', 'content': 'test'}
        stmt_b = {'id': 'statement_2', 'content': 'test'}
        
        id_ab = contradiction_id(stmt_a, stmt_b)
        id_ba = contradiction_id(stmt_b, stmt_a)
        
        assert id_ab == id_ba, f"ID symmetry failed: {id_ab} != {id_ba}"
    
    def test_id_deterministic(self):
        """Test that contradiction_id produces consistent results."""
        stmt_a = {'id': 'statement_1'}
        stmt_b = {'id': 'statement_2'}
        
        id_1 = contradiction_id(stmt_a, stmt_b)
        id_2 = contradiction_id(stmt_a, stmt_b)
        
        assert id_1 == id_2, f"ID not deterministic: {id_1} != {id_2}"
    
    def test_id_different_for_different_statements(self):
        """Test that different statement pairs produce different IDs."""
        stmt_a = {'id': 'statement_1'}
        stmt_b = {'id': 'statement_2'} 
        stmt_c = {'id': 'statement_3'}
        
        id_ab = contradiction_id(stmt_a, stmt_b)
        id_ac = contradiction_id(stmt_a, stmt_c)
        
        assert id_ab != id_ac, f"Different pairs should have different IDs: {id_ab} == {id_ac}"

class TestAnalyzerIntegration:
    """Integration tests for the analyzer system."""
    
    def test_evaluate_no_statements(self):
        """Test evaluate with empty statement list."""
        contradictions = evaluate([])
        assert contradictions == []
    
    def test_evaluate_no_contradictions(self):
        """Test evaluate with statements that have no contradictions."""
        statements = [
            {
                'id': 'stmt_1',
                'event': 'meeting_A',
                'party': 'John',
                'present': True
            },
            {
                'id': 'stmt_2',
                'event': 'meeting_B', 
                'party': 'Jane',
                'present': False
            }
        ]
        
        contradictions = evaluate(statements)
        
        # Filter out any engine errors
        real_contradictions = [c for c in contradictions if c.get('type') != '__engine_error__']
        assert len(real_contradictions) == 0
    
    def test_evaluate_multiple_contradiction_types(self):
        """Test evaluate can detect multiple types of contradictions."""
        statements = [
            # Presence conflict
            {'id': '1', 'event': 'mtg', 'party': 'John', 'present': True},
            {'id': '2', 'event': 'mtg', 'party': 'John', 'present': False},
            # Date conflict  
            {'id': '3', 'event': 'incident', 'date': '2024-01-01'},
            {'id': '4', 'event': 'incident', 'date': '2024-01-02'},
            # Amount conflict
            {'id': '5', 'event': 'payment', 'amount': 100, 'currency': 'USD'},
            {'id': '6', 'event': 'payment', 'amount': 200, 'currency': 'USD'}
        ]
        
        contradictions = evaluate(statements)
        real_contradictions = [c for c in contradictions if c.get('type') != '__engine_error__']
        
        # Should detect all three types
        types_found = set(c['type'] for c in real_contradictions)
        expected_types = {'presence_absence_conflict', 'event_date_disagreement', 'numeric_amount_mismatch'}
        
        assert expected_types.issubset(types_found), f"Missing contradiction types. Found: {types_found}, Expected: {expected_types}"