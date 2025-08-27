#!/usr/bin/env python3
"""
Test suite for the scoding module in the analyzer package.

This test suite provides comprehensive testing for the ContentScorer class
and its S-coding methodology.
"""

import unittest
import tempfile
import json
from pathlib import Path

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from analyzer.scoding import ContentScorer


class TestContentScorer(unittest.TestCase):
    """Test cases for ContentScorer class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.scorer = ContentScorer()
        
        # Test documents with different severity levels
        self.s1_text = """
        This document contains evidence of a Brady violation.
        The officer falsified the report and committed perjury.
        There was a clear obstruction of justice and civil rights violation.
        This constitutes a constitutional violation.
        """
        
        self.s2_text = """
        The officer engaged in excessive force during the arrest.
        This represents misconduct and unlawful behavior.
        There was a violation of department policy.
        The suspect suffered abuse during the incident.
        """
        
        self.s3_text = """
        A complaint was filed regarding the incident.
        The allegation concerns inappropriate behavior.
        An investigation is needed to review the matter.
        This is concerning and questionable conduct.
        """
        
        self.s4_text = """
        This is a routine report of standard procedures.
        The administrative process was followed normally.
        Regular documentation was completed.
        Standard operating procedures were used.
        """
        
        self.s5_text = """
        This is a policy manual template.
        Standard guidelines are provided in this form.
        Instructions for completing the memo are included.
        This document serves as a reference guide.
        """
    
    def test_scorer_initialization(self):
        """Test ContentScorer initialization."""
        self.assertIsInstance(self.scorer, ContentScorer)
        self.assertIsInstance(self.scorer.config, dict)
        self.assertIsInstance(self.scorer.scoring_rules, dict)
        
        # Check that all S-codes are present
        expected_codes = ['S1', 'S2', 'S3', 'S4', 'S5']
        for code in expected_codes:
            self.assertIn(code, self.scorer.scoring_rules)
    
    def test_default_config(self):
        """Test default configuration settings."""
        config = self.scorer._default_config()
        
        self.assertIn('scoring_method', config)
        self.assertIn('confidence_threshold', config)
        self.assertIn('priority_keywords', config)
        self.assertIn('legal_significance_factors', config)
        
        self.assertGreaterEqual(config['confidence_threshold'], 0.0)
        self.assertLessEqual(config['confidence_threshold'], 1.0)
    
    def test_scoring_rules_structure(self):
        """Test scoring rules structure."""
        rules = self.scorer._load_scoring_rules()
        
        for s_code, rule in rules.items():
            self.assertIn('score_range', rule)
            self.assertIn('description', rule)
            self.assertIn('keywords', rule)
            self.assertIn('patterns', rule)
            self.assertIn('weight', rule)
            
            # Check score range is valid
            self.assertEqual(len(rule['score_range']), 2)
            self.assertLessEqual(rule['score_range'][0], rule['score_range'][1])
            
            # Check weight is valid
            self.assertGreaterEqual(rule['weight'], 0.0)
            self.assertLessEqual(rule['weight'], 1.0)
    
    def test_s1_document_scoring(self):
        """Test scoring of S1 (critical) documents."""
        result = self.scorer.score_document(self.s1_text)
        
        self.assertIn('s_code', result)
        self.assertIn('numeric_score', result)
        self.assertIn('confidence', result)
        self.assertIn('description', result)
        
        # S1 documents should score high
        self.assertGreaterEqual(result['numeric_score'], 7.0)
        self.assertIn(result['s_code'], ['S1', 'S2'])  # Could be S1 or high S2
        
        # Should have high confidence for clear indicators
        self.assertGreaterEqual(result['confidence'], 0.6)
    
    def test_s2_document_scoring(self):
        """Test scoring of S2 (high-value) documents."""
        result = self.scorer.score_document(self.s2_text)
        
        self.assertIn('s_code', result)
        self.assertIn('numeric_score', result)
        
        # S2 documents should score in medium-high range
        self.assertGreaterEqual(result['numeric_score'], 5.0)
        self.assertIn(result['s_code'], ['S1', 'S2', 'S3'])
    
    def test_s3_document_scoring(self):
        """Test scoring of S3 (medium-value) documents."""
        result = self.scorer.score_document(self.s3_text)
        
        self.assertIn('s_code', result)
        self.assertIn('numeric_score', result)
        
        # S3 documents should score in medium range
        self.assertGreaterEqual(result['numeric_score'], 3.0)
        self.assertLessEqual(result['numeric_score'], 8.0)
    
    def test_s4_document_scoring(self):
        """Test scoring of S4 (low-value) documents."""
        result = self.scorer.score_document(self.s4_text)
        
        self.assertIn('s_code', result)
        self.assertIn('numeric_score', result)
        
        # S4 documents should score in lower range
        self.assertLessEqual(result['numeric_score'], 6.0)
        self.assertIn(result['s_code'], ['S3', 'S4', 'S5'])
    
    def test_s5_document_scoring(self):
        """Test scoring of S5 (administrative) documents."""
        result = self.scorer.score_document(self.s5_text)
        
        self.assertIn('s_code', result)
        self.assertIn('numeric_score', result)
        
        # S5 documents should score low
        self.assertLessEqual(result['numeric_score'], 4.0)
        self.assertIn(result['s_code'], ['S4', 'S5'])
    
    def test_empty_document_scoring(self):
        """Test scoring of empty documents."""
        result = self.scorer.score_document("")
        
        self.assertEqual(result['s_code'], 'S5')
        self.assertEqual(result['numeric_score'], 0.0)
        self.assertEqual(result['confidence'], 0.0)
        self.assertIn('error', result['analysis'])
    
    def test_calculate_keyword_score(self):
        """Test keyword scoring functionality."""
        # Test with high-value keywords
        high_value_text = "Brady violation perjury falsification"
        score = self.scorer._calculate_keyword_score(high_value_text)
        self.assertGreater(score, 5.0)
        
        # Test with low-value keywords
        low_value_text = "routine administrative standard"
        score = self.scorer._calculate_keyword_score(low_value_text)
        self.assertLess(score, 5.0)
        
        # Test with empty text
        score = self.scorer._calculate_keyword_score("")
        self.assertEqual(score, 0.0)
    
    def test_calculate_pattern_score(self):
        """Test pattern scoring functionality."""
        # Test with high-value patterns
        pattern_text = "Brady violation and excessive force occurred"
        score = self.scorer._calculate_pattern_score(pattern_text)
        self.assertGreater(score, 0.0)
        
        # Test with no patterns
        no_pattern_text = "normal everyday text"
        score = self.scorer._calculate_pattern_score(no_pattern_text)
        self.assertGreaterEqual(score, 0.0)  # Could be 0 or low
    
    def test_calculate_legal_significance(self):
        """Test legal significance calculation."""
        # Test constitutional violations
        const_text = "constitutional violation due process"
        score = self.scorer._calculate_legal_significance(const_text)
        self.assertGreater(score, 5.0)
        
        # Test criminal conduct
        criminal_text = "criminal perjury felony"
        score = self.scorer._calculate_legal_significance(criminal_text)
        self.assertGreater(score, 5.0)
        
        # Test administrative matters
        admin_text = "administrative procedure"
        score = self.scorer._calculate_legal_significance(admin_text)
        self.assertLess(score, 5.0)
    
    def test_calculate_urgency_score(self):
        """Test urgency scoring."""
        # Test urgent indicators
        urgent_text = "immediate critical urgent emergency"
        score = self.scorer._calculate_urgency_score(urgent_text, None)
        self.assertGreater(score, 5.0)
        
        # Test with metadata (recent document)
        from datetime import datetime
        recent_metadata = {
            "creation_time": datetime.now().isoformat()
        }
        score = self.scorer._calculate_urgency_score(urgent_text, recent_metadata)
        self.assertGreater(score, 5.0)
        
        # Test non-urgent text
        normal_text = "routine standard normal"
        score = self.scorer._calculate_urgency_score(normal_text, None)
        self.assertLessEqual(score, 5.0)
    
    def test_determine_s_code(self):
        """Test S-code determination logic."""
        # Test different score ranges
        self.assertEqual(self.scorer._determine_s_code(9.5), 'S1')
        self.assertEqual(self.scorer._determine_s_code(8.0), 'S2')
        self.assertEqual(self.scorer._determine_s_code(6.0), 'S3')
        self.assertEqual(self.scorer._determine_s_code(4.0), 'S4')
        self.assertEqual(self.scorer._determine_s_code(2.0), 'S5')
        
        # Test edge cases
        self.assertEqual(self.scorer._determine_s_code(0.0), 'S5')
        self.assertEqual(self.scorer._determine_s_code(10.0), 'S1')
    
    def test_calculate_confidence(self):
        """Test confidence calculation."""
        # Test with sufficient text
        long_text = " ".join(["word"] * 100)
        confidence = self.scorer._calculate_confidence(long_text, 8.0)
        self.assertGreaterEqual(confidence, 0.8)
        
        # Test with short text
        short_text = "short"
        confidence = self.scorer._calculate_confidence(short_text, 8.0)
        self.assertLessEqual(confidence, 0.6)
        
        # Test with extreme scores
        extreme_score_confidence = self.scorer._calculate_confidence(long_text, 9.5)
        moderate_score_confidence = self.scorer._calculate_confidence(long_text, 6.0)
        self.assertGreaterEqual(extreme_score_confidence, moderate_score_confidence)
    
    def test_generate_detailed_analysis(self):
        """Test detailed analysis generation."""
        analysis = self.scorer._generate_detailed_analysis(self.s1_text, 'S1')
        
        self.assertIn('s_code_justification', analysis)
        self.assertIn('key_indicators', analysis)
        self.assertIn('risk_factors', analysis)
        self.assertIn('legal_implications', analysis)
        self.assertIn('recommendations', analysis)
        
        # S1 documents should have risk factors and recommendations
        self.assertGreater(len(analysis['risk_factors']), 0)
        self.assertGreater(len(analysis['recommendations']), 0)
    
    def test_score_batch(self):
        """Test batch scoring functionality."""
        documents = [
            ("doc1", self.s1_text, None),
            ("doc2", self.s2_text, None),
            ("doc3", self.s5_text, None)
        ]
        
        results = self.scorer.score_batch(documents)
        
        self.assertEqual(len(results), 3)
        
        for result in results:
            self.assertIn('document_id', result)
            self.assertIn('s_code', result)
            self.assertIn('numeric_score', result)
            self.assertIn('confidence', result)
    
    def test_generate_scoring_report(self):
        """Test scoring report generation."""
        scored_documents = [
            {"s_code": "S1", "numeric_score": 9.0},
            {"s_code": "S2", "numeric_score": 8.0},
            {"s_code": "S3", "numeric_score": 6.0},
            {"s_code": "S4", "numeric_score": 4.0},
            {"s_code": "S5", "numeric_score": 2.0}
        ]
        
        report = self.scorer.generate_scoring_report(scored_documents)
        
        self.assertIn('total_documents', report)
        self.assertIn('s_code_distribution', report)
        self.assertIn('average_score', report)
        self.assertIn('high_priority_count', report)
        self.assertIn('scoring_statistics', report)
        
        self.assertEqual(report['total_documents'], 5)
        self.assertEqual(report['high_priority_count'], 2)  # S1 and S2
        self.assertAlmostEqual(report['average_score'], 5.8, places=1)
    
    def test_score_document_with_metadata(self):
        """Test scoring with metadata."""
        from datetime import datetime
        
        metadata = {
            "creation_time": datetime.now().isoformat(),
            "author": "Officer Smith",
            "document_type": "incident_report"
        }
        
        result = self.scorer.score_document(self.s2_text, metadata)
        
        # Should include urgency boost for recent document
        self.assertGreater(result['score_components']['urgency_score'], 0.0)
    
    def test_scoring_consistency(self):
        """Test scoring consistency across multiple runs."""
        # Same document should get same score
        result1 = self.scorer.score_document(self.s1_text)
        result2 = self.scorer.score_document(self.s1_text)
        
        self.assertEqual(result1['s_code'], result2['s_code'])
        self.assertEqual(result1['numeric_score'], result2['numeric_score'])
    
    def test_score_components_validity(self):
        """Test that all score components are valid."""
        result = self.scorer.score_document(self.s2_text)
        
        components = result['score_components']
        
        for component_name, score in components.items():
            self.assertGreaterEqual(score, 0.0, f"{component_name} score should be >= 0")
            self.assertLessEqual(score, 10.0, f"{component_name} score should be <= 10")
    
    def test_special_characters_handling(self):
        """Test handling of special characters in text."""
        special_text = """
        This document contains special characters: ñáéíóú
        And symbols: @#$%^&*()
        Unicode: 🔍📊💾
        And brady violation
        """
        
        result = self.scorer.score_document(special_text)
        
        # Should still work and detect "brady violation"
        self.assertIn('s_code', result)
        self.assertGreater(result['numeric_score'], 5.0)  # Should detect high-value content
    
    def test_very_long_document(self):
        """Test scoring of very long documents."""
        # Create a long document by repeating text
        long_text = (self.s1_text + " ") * 100
        
        result = self.scorer.score_document(long_text)
        
        # Should still work and have high confidence
        self.assertIn('s_code', result)
        self.assertGreaterEqual(result['confidence'], 0.8)
    
    def test_error_handling_in_batch(self):
        """Test error handling in batch processing."""
        documents = [
            ("valid_doc", self.s1_text, None),
            ("problematic_doc", None, None),  # This might cause issues
            ("empty_doc", "", None)
        ]
        
        # Should handle errors gracefully
        try:
            results = self.scorer.score_batch(documents)
            self.assertEqual(len(results), 3)
            
            # Check that valid document was processed
            valid_result = next(r for r in results if r['document_id'] == 'valid_doc')
            self.assertIn('s_code', valid_result)
            
        except Exception as e:
            self.fail(f"Batch scoring should handle errors gracefully: {e}")


class TestContentScorerEdgeCases(unittest.TestCase):
    """Test edge cases and error conditions for ContentScorer."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.scorer = ContentScorer()
    
    def test_whitespace_only_document(self):
        """Test scoring of documents with only whitespace."""
        whitespace_text = "   \n\t   \r\n   "
        result = self.scorer.score_document(whitespace_text)
        
        self.assertEqual(result['s_code'], 'S5')
        self.assertEqual(result['numeric_score'], 0.0)
    
    def test_single_word_document(self):
        """Test scoring of single-word documents."""
        single_word = "Brady"
        result = self.scorer.score_document(single_word)
        
        # Should still detect the keyword but have low confidence
        self.assertGreater(result['numeric_score'], 0.0)
        self.assertLessEqual(result['confidence'], 0.5)
    
    def test_custom_config(self):
        """Test scorer with custom configuration."""
        custom_config = {
            "scoring_method": "custom",
            "confidence_threshold": 0.8,
            "priority_keywords": {
                "critical": ["test_keyword"],
                "high": [],
                "medium": [],
                "low": []
            }
        }
        
        custom_scorer = ContentScorer(custom_config)
        self.assertEqual(custom_scorer.config['confidence_threshold'], 0.8)
        self.assertIn("test_keyword", custom_scorer.config['priority_keywords']['critical'])


if __name__ == '__main__':
    unittest.main()