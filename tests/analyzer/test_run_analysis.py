#!/usr/bin/env python3
"""
Test suite for the run_analysis module in the analyzer package.

This test suite provides comprehensive testing for the DocumentAnalyzer class
and its analysis capabilities.
"""

import unittest
import tempfile
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from analyzer.run_analysis import DocumentAnalyzer


class TestDocumentAnalyzer(unittest.TestCase):
    """Test cases for DocumentAnalyzer class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.analyzer = DocumentAnalyzer()
        self.temp_dir = tempfile.mkdtemp()
        self.test_text = """
        This is a test document dated January 15, 2024.
        The incident occurred at 123 Main Street, Anytown, State.
        Officer John Smith witnessed the event.
        Case number: 2024-CR-001
        Phone: (555) 123-4567
        """
        
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_analyzer_initialization(self):
        """Test DocumentAnalyzer initialization."""
        self.assertIsInstance(self.analyzer, DocumentAnalyzer)
        self.assertIsInstance(self.analyzer.config, dict)
        self.assertIn('extract_entities', self.analyzer.config)
        self.assertIn('detect_tampering', self.analyzer.config)
    
    def test_default_config(self):
        """Test default configuration settings."""
        config = self.analyzer._default_config()
        
        self.assertTrue(config['extract_entities'])
        self.assertTrue(config['detect_tampering'])
        self.assertTrue(config['build_timeline'])
        self.assertGreaterEqual(config['confidence_threshold'], 0.0)
        self.assertLessEqual(config['confidence_threshold'], 1.0)
    
    def test_find_documents(self):
        """Test document discovery functionality."""
        # Create test files
        test_files = ['test1.pdf', 'test2.txt', 'test3.docx', 'ignore.log']
        
        for filename in test_files:
            Path(self.temp_dir, filename).touch()
        
        input_path = Path(self.temp_dir)
        found_docs = self.analyzer._find_documents(input_path)
        
        # Should find PDF, TXT, and DOCX but not LOG
        self.assertEqual(len(found_docs), 3)
        found_extensions = {doc.suffix for doc in found_docs}
        self.assertEqual(found_extensions, {'.pdf', '.txt', '.docx'})
    
    def test_extract_metadata(self):
        """Test metadata extraction."""
        test_file = Path(self.temp_dir, 'test.txt')
        test_file.write_text(self.test_text)
        
        metadata = self.analyzer._extract_metadata(test_file)
        
        self.assertIn('filename', metadata)
        self.assertIn('file_size', metadata)
        self.assertIn('creation_time', metadata)
        self.assertIn('modification_time', metadata)
        self.assertIn('file_extension', metadata)
        self.assertIn('file_hash', metadata)
        
        self.assertEqual(metadata['filename'], 'test.txt')
        self.assertEqual(metadata['file_extension'], '.txt')
    
    def test_extract_text_from_txt(self):
        """Test text extraction from TXT files."""
        test_file = Path(self.temp_dir, 'test.txt')
        test_file.write_text(self.test_text)
        
        extracted_text = self.analyzer._extract_text(test_file)
        
        self.assertEqual(extracted_text.strip(), self.test_text.strip())
    
    def test_analyze_content(self):
        """Test content analysis functionality."""
        content_analysis = self.analyzer._analyze_content(self.test_text)
        
        self.assertIn('word_count', content_analysis)
        self.assertIn('sentence_count', content_analysis)
        self.assertIn('character_count', content_analysis)
        self.assertIn('complexity_score', content_analysis)
        
        self.assertGreater(content_analysis['word_count'], 0)
        self.assertGreater(content_analysis['sentence_count'], 0)
        self.assertGreaterEqual(content_analysis['complexity_score'], 0.0)
        self.assertLessEqual(content_analysis['complexity_score'], 1.0)
    
    def test_recognize_patterns(self):
        """Test pattern recognition in text."""
        patterns = self.analyzer._recognize_patterns(self.test_text)
        
        self.assertIn('dates', patterns)
        self.assertIn('phone_numbers', patterns)
        self.assertIn('case_numbers', patterns)
        self.assertIn('names', patterns)
        
        # Should find the date in test text
        self.assertGreater(len(patterns['dates']), 0)
        
        # Should find the phone number
        self.assertGreater(len(patterns['phone_numbers']), 0)
        
        # Should find the case number
        self.assertGreater(len(patterns['case_numbers']), 0)
    
    def test_detect_tampering(self):
        """Test tampering detection functionality."""
        test_file = Path(self.temp_dir, 'test.txt')
        test_file.write_text(self.test_text)
        
        tampering_indicators = self.analyzer._detect_tampering(test_file, self.test_text)
        
        self.assertIn('inconsistent_formatting', tampering_indicators)
        self.assertIn('unusual_patterns', tampering_indicators)
        self.assertIn('metadata_anomalies', tampering_indicators)
        self.assertIn('text_inconsistencies', tampering_indicators)
        self.assertIn('overall_risk_score', tampering_indicators)
        self.assertIn('risk_level', tampering_indicators)
        
        self.assertGreaterEqual(tampering_indicators['overall_risk_score'], 0.0)
        self.assertLessEqual(tampering_indicators['overall_risk_score'], 1.0)
        self.assertIn(tampering_indicators['risk_level'], ['LOW', 'MEDIUM', 'HIGH'])
    
    def test_extract_entities(self):
        """Test entity extraction."""
        entities = self.analyzer._extract_entities(self.test_text)
        
        self.assertIn('persons', entities)
        self.assertIn('organizations', entities)
        self.assertIn('locations', entities)
        self.assertIn('dates', entities)
        
        # Should find "John Smith" as a person
        self.assertGreater(len(entities['persons']), 0)
        
        # Should find dates
        self.assertGreater(len(entities['dates']), 0)
    
    def test_find_dates(self):
        """Test date pattern recognition."""
        dates = self.analyzer._find_dates(self.test_text)
        
        self.assertGreater(len(dates), 0)
        # Should find "January 15, 2024"
        self.assertTrue(any('January' in date for date in dates))
    
    def test_find_phone_numbers(self):
        """Test phone number recognition."""
        phone_numbers = self.analyzer._find_phone_numbers(self.test_text)
        
        self.assertGreater(len(phone_numbers), 0)
        # Should find (555) 123-4567
        self.assertEqual(len(phone_numbers[0]), 3)  # Area code, exchange, number
    
    def test_find_case_numbers(self):
        """Test case number recognition."""
        case_numbers = self.analyzer._find_case_numbers(self.test_text)
        
        self.assertGreater(len(case_numbers), 0)
        # Should find "2024-CR-001"
        self.assertTrue(any('2024' in case for case in case_numbers))
    
    def test_analyze_single_document(self):
        """Test single document analysis."""
        test_file = Path(self.temp_dir, 'test.txt')
        test_file.write_text(self.test_text)
        
        result = self.analyzer._analyze_single_document(test_file)
        
        self.assertIn('metadata', result)
        self.assertIn('content_length', result)
        self.assertIn('content_analysis', result)
        self.assertIn('patterns', result)
        self.assertIn('tampering_indicators', result)
        self.assertIn('entities', result)
        self.assertIn('analysis_timestamp', result)
        
        self.assertEqual(result['content_length'], len(self.test_text))
    
    def test_cross_reference_analysis(self):
        """Test cross-reference analysis between documents."""
        # Create mock analysis results
        doc1_data = {
            'entities': {
                'persons': ['John Smith', 'Jane Doe'],
                'organizations': ['Police Department'],
                'locations': ['Main Street'],
                'dates': ['January 15, 2024']
            }
        }
        
        doc2_data = {
            'entities': {
                'persons': ['John Smith', 'Bob Wilson'],
                'organizations': ['Police Department'],
                'locations': ['Oak Avenue'],
                'dates': ['January 16, 2024']
            }
        }
        
        analysis_results = {
            'doc1.txt': doc1_data,
            'doc2.txt': doc2_data
        }
        
        cross_refs = self.analyzer._perform_cross_reference_analysis(analysis_results)
        
        self.assertIsInstance(cross_refs, list)
        if cross_refs:  # If similarity threshold is met
            self.assertIn('document1', cross_refs[0])
            self.assertIn('document2', cross_refs[0])
            self.assertIn('similarities', cross_refs[0])
    
    def test_calculate_document_similarity(self):
        """Test document similarity calculation."""
        doc1 = {
            'entities': {
                'persons': ['John Smith'],
                'organizations': ['Police'],
                'locations': ['Main Street'],
                'dates': ['2024-01-15']
            }
        }
        
        doc2 = {
            'entities': {
                'persons': ['John Smith'],
                'organizations': ['Police'],
                'locations': ['Oak Avenue'],
                'dates': ['2024-01-16']
            }
        }
        
        similarities = self.analyzer._calculate_document_similarity(doc1, doc2)
        
        self.assertIn('persons_similarity', similarities)
        self.assertIn('organizations_similarity', similarities)
        self.assertIn('locations_similarity', similarities)
        self.assertIn('dates_similarity', similarities)
        self.assertIn('overall_similarity', similarities)
        
        # Should have high person and organization similarity
        self.assertGreater(similarities['persons_similarity'], 0.0)
        self.assertGreater(similarities['organizations_similarity'], 0.0)
    
    def test_build_timeline(self):
        """Test timeline building from documents."""
        analysis_results = {
            'doc1.txt': {
                'entities': {'dates': ['January 15, 2024']},
                'metadata': {'filename': 'doc1.txt'}
            },
            'doc2.txt': {
                'entities': {'dates': ['January 16, 2024']},
                'metadata': {'filename': 'doc2.txt'}
            }
        }
        
        timeline = self.analyzer._build_timeline(analysis_results)
        
        self.assertIsInstance(timeline, list)
        if timeline:
            self.assertIn('date', timeline[0])
            self.assertIn('document', timeline[0])
            self.assertIn('event_type', timeline[0])
    
    def test_generate_summary(self):
        """Test summary generation."""
        analysis_results = {
            'doc1.txt': {
                'metadata': {'filename': 'doc1.txt'},
                'content_analysis': {'word_count': 100},
                'tampering_indicators': {'risk_level': 'LOW'}
            },
            'doc2.txt': {
                'metadata': {'filename': 'doc2.txt'},
                'content_analysis': {'word_count': 150},
                'tampering_indicators': {'risk_level': 'HIGH'}
            },
            'cross_references': []
        }
        
        summary = self.analyzer._generate_summary(analysis_results)
        
        self.assertIn('total_documents', summary)
        self.assertIn('total_words', summary)
        self.assertIn('high_risk_documents', summary)
        self.assertIn('analysis_date', summary)
        
        self.assertEqual(summary['total_documents'], 2)
        self.assertEqual(summary['total_words'], 250)
        self.assertEqual(summary['high_risk_documents'], 1)
    
    @patch('analyzer.run_analysis.Path')
    def test_analyze_documents_integration(self, mock_path):
        """Test full document analysis integration."""
        # Mock file system interactions
        mock_input_path = MagicMock()
        mock_output_path = MagicMock()
        mock_path.return_value = mock_output_path
        
        # Create a test file in memory
        test_file = Path(self.temp_dir, 'test.txt')
        test_file.write_text(self.test_text)
        
        # Mock the glob method to return our test file
        mock_input_path.glob.return_value = [test_file]
        
        with patch.object(self.analyzer, '_find_documents', return_value=[test_file]):
            result = self.analyzer.analyze_documents(str(test_file.parent), self.temp_dir)
        
        self.assertIn('summary', result)
        self.assertIn('cross_references', result)
        self.assertIn('timeline', result)
        
        # Should have analyzed our test file
        self.assertGreater(result['summary']['total_documents'], 0)


class TestDocumentAnalyzerErrorHandling(unittest.TestCase):
    """Test error handling in DocumentAnalyzer."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.analyzer = DocumentAnalyzer()
    
    def test_analyze_empty_text(self):
        """Test analysis of empty text."""
        content_analysis = self.analyzer._analyze_content("")
        
        self.assertEqual(content_analysis['word_count'], 0)
        self.assertEqual(content_analysis['sentence_count'], 0)
        self.assertEqual(content_analysis['complexity_score'], 0.0)
    
    def test_analyze_invalid_file(self):
        """Test handling of invalid file paths."""
        invalid_path = Path("/nonexistent/file.txt")
        
        # Should not raise exception
        try:
            text = self.analyzer._extract_text(invalid_path)
            self.assertEqual(text, "")  # Should return empty string for missing files
        except FileNotFoundError:
            pass  # This is also acceptable behavior
    
    def test_pattern_recognition_empty_text(self):
        """Test pattern recognition with empty text."""
        patterns = self.analyzer._recognize_patterns("")
        
        for pattern_type, matches in patterns.items():
            self.assertEqual(len(matches), 0)


if __name__ == '__main__':
    unittest.main()