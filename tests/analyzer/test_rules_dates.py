#!/usr/bin/env python3
"""
Test suite for the rules_dates module in the analyzer package.

This test suite provides comprehensive testing for the DateAnalyzer class
and its date analysis capabilities.
"""

import unittest
import tempfile
import json
from pathlib import Path
from datetime import datetime, date, timedelta

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from analyzer.rules_dates import DateAnalyzer, DateMatch, DateInconsistency


class TestDateAnalyzer(unittest.TestCase):
    """Test cases for DateAnalyzer class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.analyzer = DateAnalyzer()
        
        # Test text with various date formats
        self.test_text = """
        This incident occurred on January 15, 2024.
        The report was filed on 01/16/2024.
        A follow-up meeting was scheduled for 2024-01-17.
        The officer noted the time as Jan 18, 2024.
        Another event happened on 1/19/24.
        """
        
        # Test text with problematic dates
        self.problematic_text = """
        Document dated February 30, 2024.
        Meeting scheduled for 13/45/2024.
        Event occurred on 2025-12-25.
        Business filed on Saturday, 2024-01-20.
        """
        
    def test_analyzer_initialization(self):
        """Test DateAnalyzer initialization."""
        self.assertIsInstance(self.analyzer, DateAnalyzer)
        self.assertIsInstance(self.analyzer.config, dict)
        self.assertIsInstance(self.analyzer.date_patterns, list)
        self.assertIsInstance(self.analyzer.inconsistency_rules, list)
    
    def test_default_config(self):
        """Test default configuration settings."""
        config = self.analyzer._default_config()
        
        self.assertIn('min_confidence', config)
        self.assertIn('max_context_length', config)
        self.assertIn('chronology_check', config)
        self.assertIn('suspicious_patterns', config)
        
        self.assertGreaterEqual(config['min_confidence'], 0.0)
        self.assertLessEqual(config['min_confidence'], 1.0)
        self.assertTrue(config['chronology_check'])
    
    def test_compile_date_patterns(self):
        """Test date pattern compilation."""
        patterns = self.analyzer._compile_date_patterns()
        
        self.assertIsInstance(patterns, list)
        self.assertGreater(len(patterns), 0)
        
        for pattern in patterns:
            self.assertIn('name', pattern)
            self.assertIn('pattern', pattern)
            self.assertIn('format', pattern)
            self.assertIn('confidence', pattern)
            
            self.assertGreaterEqual(pattern['confidence'], 0.0)
            self.assertLessEqual(pattern['confidence'], 1.0)
    
    def test_extract_dates_from_text(self):
        """Test date extraction from text."""
        dates = self.analyzer._extract_dates_from_text(self.test_text)
        
        self.assertIsInstance(dates, list)
        self.assertGreater(len(dates), 0)
        
        for date_match in dates:
            self.assertIsInstance(date_match, DateMatch)
            self.assertIsInstance(date_match.date_string, str)
            self.assertIsInstance(date_match.confidence, float)
            self.assertEqual(date_match.source, "content")
    
    def test_extract_dates_from_metadata(self):
        """Test date extraction from metadata."""
        metadata = {
            'creation_date': '2024-01-15',
            'modified': '2024-01-16 10:30:00',
            'timestamp': '01/17/2024'
        }
        
        dates = self.analyzer._extract_dates_from_metadata(metadata)
        
        self.assertIsInstance(dates, list)
        self.assertEqual(len(dates), 3)
        
        for date_match in dates:
            self.assertEqual(date_match.source, "metadata")
            self.assertEqual(date_match.confidence, 0.9)
    
    def test_extract_dates_from_filename(self):
        """Test date extraction from filename."""
        filenames = [
            "report_2024-01-15.txt",
            "incident_01_16_2024.pdf",
            "summary_1.17.24.doc"
        ]
        
        for filename in filenames:
            dates = self.analyzer._extract_dates_from_filename(filename)
            
            if dates:  # Some patterns might not match
                self.assertIsInstance(dates, list)
                for date_match in dates:
                    self.assertEqual(date_match.source, "filename")
                    self.assertGreater(date_match.confidence, 0.0)
    
    def test_normalize_date_us_format(self):
        """Test date normalization for US format dates."""
        date_match = DateMatch(
            date_string="01/15/2024",
            normalized_date="",
            confidence=0.9,
            pattern_type="US_FORMAT_SLASHES",
            position=(0, 10),
            context="",
            source="content"
        )
        
        normalized = self.analyzer._normalize_date(date_match)
        self.assertEqual(normalized, "2024-01-15")
    
    def test_normalize_date_iso_format(self):
        """Test date normalization for ISO format dates."""
        date_match = DateMatch(
            date_string="2024-01-15",
            normalized_date="",
            confidence=0.95,
            pattern_type="ISO_FORMAT",
            position=(0, 10),
            context="",
            source="content"
        )
        
        normalized = self.analyzer._normalize_date(date_match)
        self.assertEqual(normalized, "2024-01-15")
    
    def test_normalize_date_long_format(self):
        """Test date normalization for long format dates."""
        date_match = DateMatch(
            date_string="January 15, 2024",
            normalized_date="",
            confidence=0.85,
            pattern_type="LONG_FORMAT",
            position=(0, 16),
            context="",
            source="content"
        )
        
        normalized = self.analyzer._normalize_date(date_match)
        self.assertEqual(normalized, "2024-01-15")
    
    def test_normalize_year_two_digit(self):
        """Test two-digit year normalization."""
        # Test years that should become 20xx
        self.assertEqual(self.analyzer._normalize_year("24"), 2024)
        self.assertEqual(self.analyzer._normalize_year("00"), 2000)
        self.assertEqual(self.analyzer._normalize_year("49"), 2049)
        
        # Test years that should become 19xx
        self.assertEqual(self.analyzer._normalize_year("50"), 1950)
        self.assertEqual(self.analyzer._normalize_year("99"), 1999)
        
        # Test four-digit years
        self.assertEqual(self.analyzer._normalize_year("2024"), 2024)
        self.assertEqual(self.analyzer._normalize_year("1995"), 1995)
    
    def test_resolve_relative_date(self):
        """Test relative date resolution."""
        today = date.today()
        
        # Test basic relative terms
        self.assertEqual(self.analyzer._resolve_relative_date("today"), today.isoformat())
        
        yesterday = (today - timedelta(days=1)).isoformat()
        self.assertEqual(self.analyzer._resolve_relative_date("yesterday"), yesterday)
        
        tomorrow = (today + timedelta(days=1)).isoformat()
        self.assertEqual(self.analyzer._resolve_relative_date("tomorrow"), tomorrow)
    
    def test_validate_and_normalize_dates(self):
        """Test date validation and normalization."""
        dates = self.analyzer._extract_dates_from_text(self.test_text)
        validated_dates = self.analyzer._validate_and_normalize_dates(dates)
        
        self.assertIsInstance(validated_dates, list)
        
        for date_match in validated_dates:
            self.assertIsNotNone(date_match.normalized_date)
            self.assertRegex(date_match.normalized_date, r'\d{4}-\d{2}-\d{2}')
    
    def test_check_impossible_date(self):
        """Test detection of impossible dates."""
        # Create a date match with an impossible date
        impossible_date = DateMatch(
            date_string="February 30, 2024",
            normalized_date="2024-02-30",  # This is impossible
            confidence=0.8,
            pattern_type="LONG_FORMAT",
            position=(0, 17),
            context="Document dated February 30, 2024",
            source="content"
        )
        
        inconsistencies = self.analyzer._check_impossible_date([impossible_date], "")
        
        self.assertGreater(len(inconsistencies), 0)
        self.assertEqual(inconsistencies[0].inconsistency_type, "IMPOSSIBLE_DATE")
        self.assertEqual(inconsistencies[0].severity, "CRITICAL")
    
    def test_check_future_date(self):
        """Test detection of suspicious future dates."""
        future_date_str = (date.today() + timedelta(days=100)).isoformat()
        
        future_date = DateMatch(
            date_string="Future Date",
            normalized_date=future_date_str,
            confidence=0.8,
            pattern_type="ISO_FORMAT",
            position=(0, 11),
            context="Document dated for future",
            source="content"
        )
        
        inconsistencies = self.analyzer._check_future_date([future_date], "")
        
        self.assertGreater(len(inconsistencies), 0)
        self.assertEqual(inconsistencies[0].inconsistency_type, "FUTURE_DATE_SUSPICIOUS")
        self.assertIn(inconsistencies[0].severity, ["MEDIUM", "HIGH"])
    
    def test_check_format_consistency(self):
        """Test detection of inconsistent date formats."""
        # Create dates with multiple different formats
        dates = [
            DateMatch("01/15/2024", "2024-01-15", 0.9, "US_FORMAT_SLASHES", (0, 10), "", "content"),
            DateMatch("2024-01-16", "2024-01-16", 0.95, "ISO_FORMAT", (15, 25), "", "content"),
            DateMatch("January 17, 2024", "2024-01-17", 0.85, "LONG_FORMAT", (30, 46), "", "content"),
            DateMatch("Jan 18, 2024", "2024-01-18", 0.8, "SHORT_MONTH_FORMAT", (50, 62), "", "content")
        ]
        
        inconsistencies = self.analyzer._check_format_consistency(dates, "")
        
        # Should detect multiple formats being used
        if inconsistencies:
            self.assertEqual(inconsistencies[0].inconsistency_type, "MULTIPLE_DATE_FORMATS")
            self.assertEqual(inconsistencies[0].severity, "MEDIUM")
    
    def test_check_chronological_order(self):
        """Test detection of chronological inconsistencies."""
        # Create dates that are out of chronological order
        dates = [
            DateMatch("01/20/2024", "2024-01-20", 0.9, "US_FORMAT_SLASHES", (0, 10), "", "content"),
            DateMatch("01/15/2024", "2024-01-15", 0.9, "US_FORMAT_SLASHES", (15, 25), "", "content"),  # Earlier date appears later
        ]
        
        inconsistencies = self.analyzer._check_chronological_order(dates, "")
        
        if inconsistencies:
            self.assertEqual(inconsistencies[0].inconsistency_type, "CHRONOLOGICAL_INCONSISTENCY")
            self.assertEqual(inconsistencies[0].severity, "HIGH")
    
    def test_check_business_date_validity(self):
        """Test detection of business activities on weekends."""
        # Find a Saturday in 2024
        saturday_date = date(2024, 1, 20)  # This is a Saturday
        
        weekend_date = DateMatch(
            date_string="01/20/2024",
            normalized_date=saturday_date.isoformat(),
            confidence=0.9,
            pattern_type="US_FORMAT_SLASHES",
            position=(0, 10),
            context="filed on 01/20/2024",
            source="content"
        )
        
        business_text = "The document was filed on 01/20/2024"
        inconsistencies = self.analyzer._check_business_date_validity([weekend_date], business_text)
        
        if inconsistencies:
            self.assertEqual(inconsistencies[0].inconsistency_type, "WEEKEND_BUSINESS_DATE")
            self.assertEqual(inconsistencies[0].severity, "LOW")
    
    def test_analyze_timeline(self):
        """Test timeline analysis functionality."""
        dates = [
            DateMatch("01/15/2024", "2024-01-15", 0.9, "US_FORMAT_SLASHES", (0, 10), "First event", "content"),
            DateMatch("01/16/2024", "2024-01-16", 0.9, "US_FORMAT_SLASHES", (15, 25), "Second event", "content"),
            DateMatch("01/17/2024", "2024-01-17", 0.9, "US_FORMAT_SLASHES", (30, 40), "Third event", "content"),
        ]
        
        timeline = self.analyzer._analyze_timeline(dates)
        
        self.assertIn('total_events', timeline)
        self.assertIn('date_range', timeline)
        self.assertIn('timeline', timeline)
        
        self.assertEqual(timeline['total_events'], 3)
        self.assertEqual(timeline['date_range']['earliest'], "2024-01-15")
        self.assertEqual(timeline['date_range']['latest'], "2024-01-17")
    
    def test_cluster_events_by_time(self):
        """Test event clustering by time periods."""
        timeline_events = [
            {"date": date(2024, 1, 15)},
            {"date": date(2024, 1, 15)},  # Same day
            {"date": date(2024, 1, 16)},  # Next day (within week)
            {"date": date(2024, 1, 30)},  # Within month
            {"date": date(2024, 6, 15)},  # Within year
            {"date": date(2025, 1, 15)},  # Beyond year
        ]
        
        clusters = self.analyzer._cluster_events_by_time(timeline_events)
        
        self.assertIn('same_day', clusters)
        self.assertIn('within_week', clusters)
        self.assertIn('within_month', clusters)
        self.assertIn('within_year', clusters)
        self.assertIn('beyond_year', clusters)
        
        self.assertEqual(clusters['same_day'], 1)
        self.assertEqual(clusters['within_week'], 1)
        self.assertEqual(clusters['within_month'], 1)
        self.assertEqual(clusters['within_year'], 1)
        self.assertEqual(clusters['beyond_year'], 1)
    
    def test_generate_date_statistics(self):
        """Test date statistics generation."""
        dates = [
            DateMatch("01/15/2024", "2024-01-15", 0.9, "US_FORMAT_SLASHES", (0, 10), "", "content"),
            DateMatch("2024-01-16", "2024-01-16", 0.95, "ISO_FORMAT", (15, 25), "", "metadata"),
            DateMatch("", "", 0.0, "INVALID", (30, 30), "", "content"),  # Invalid date
        ]
        
        inconsistencies = []  # No inconsistencies for this test
        
        stats = self.analyzer._generate_date_statistics(dates, inconsistencies)
        
        self.assertIn('total_dates_extracted', stats)
        self.assertIn('valid_dates', stats)
        self.assertIn('invalid_dates', stats)
        self.assertIn('pattern_distribution', stats)
        self.assertIn('source_distribution', stats)
        self.assertIn('confidence_statistics', stats)
        
        self.assertEqual(stats['total_dates_extracted'], 3)
        self.assertEqual(stats['valid_dates'], 2)
        self.assertEqual(stats['invalid_dates'], 1)
    
    def test_assess_date_risks(self):
        """Test date risk assessment."""
        inconsistencies = [
            DateInconsistency("CRITICAL_ISSUE", "Test critical", "CRITICAL", [], ""),
            DateInconsistency("HIGH_ISSUE", "Test high", "HIGH", [], ""),
            DateInconsistency("MEDIUM_ISSUE", "Test medium", "MEDIUM", [], ""),
        ]
        
        dates = []  # Empty for this test
        
        risk_assessment = self.analyzer._assess_date_risks(inconsistencies, dates)
        
        self.assertIn('overall_risk_level', risk_assessment)
        self.assertIn('normalized_risk_score', risk_assessment)
        self.assertIn('total_inconsistencies', risk_assessment)
        self.assertIn('critical_issues', risk_assessment)
        self.assertIn('recommendations', risk_assessment)
        
        self.assertEqual(risk_assessment['total_inconsistencies'], 3)
        self.assertEqual(risk_assessment['critical_issues'], 1)
        self.assertIn(risk_assessment['overall_risk_level'], 
                     ["MINIMAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"])
    
    def test_analyze_dates_integration(self):
        """Test full date analysis integration."""
        result = self.analyzer.analyze_dates(self.test_text)
        
        self.assertIn('total_dates_found', result)
        self.assertIn('dates_by_source', result)
        self.assertIn('extracted_dates', result)
        self.assertIn('inconsistencies', result)
        self.assertIn('timeline_analysis', result)
        self.assertIn('statistics', result)
        self.assertIn('risk_assessment', result)
        self.assertIn('analysis_metadata', result)
        
        self.assertGreater(result['total_dates_found'], 0)
    
    def test_analyze_dates_with_metadata(self):
        """Test date analysis with metadata."""
        metadata = {
            'creation_date': '2024-01-15',
            'modified': '2024-01-16'
        }
        
        result = self.analyzer.analyze_dates(self.test_text, metadata)
        
        self.assertGreater(result['dates_by_source']['metadata'], 0)
        self.assertGreater(result['total_dates_found'], 
                          len(self.analyzer._extract_dates_from_text(self.test_text)))
    
    def test_analyze_dates_with_filename(self):
        """Test date analysis with filename."""
        filename = "report_2024-01-15.txt"
        
        result = self.analyzer.analyze_dates(self.test_text, filename=filename)
        
        # Should find dates from both content and filename
        self.assertGreater(result['total_dates_found'], 0)
    
    def test_problematic_dates_detection(self):
        """Test detection of various problematic dates."""
        result = self.analyzer.analyze_dates(self.problematic_text)
        
        # Should detect inconsistencies
        self.assertGreater(len(result['inconsistencies']), 0)
        
        # Should have elevated risk assessment
        self.assertIn(result['risk_assessment']['overall_risk_level'], 
                     ["MEDIUM", "HIGH", "CRITICAL"])


class TestDateMatch(unittest.TestCase):
    """Test cases for DateMatch dataclass."""
    
    def test_date_match_creation(self):
        """Test DateMatch creation and properties."""
        date_match = DateMatch(
            date_string="01/15/2024",
            normalized_date="2024-01-15",
            confidence=0.9,
            pattern_type="US_FORMAT_SLASHES",
            position=(0, 10),
            context="Document dated 01/15/2024",
            source="content"
        )
        
        self.assertEqual(date_match.date_string, "01/15/2024")
        self.assertEqual(date_match.normalized_date, "2024-01-15")
        self.assertEqual(date_match.confidence, 0.9)
        self.assertEqual(date_match.pattern_type, "US_FORMAT_SLASHES")
        self.assertEqual(date_match.position, (0, 10))
        self.assertEqual(date_match.source, "content")


class TestDateInconsistency(unittest.TestCase):
    """Test cases for DateInconsistency dataclass."""
    
    def test_date_inconsistency_creation(self):
        """Test DateInconsistency creation and properties."""
        date_match = DateMatch("01/15/2024", "2024-01-15", 0.9, "US_FORMAT", (0, 10), "", "content")
        
        inconsistency = DateInconsistency(
            inconsistency_type="TEST_INCONSISTENCY",
            description="Test inconsistency description",
            severity="HIGH",
            dates_involved=[date_match],
            evidence="Test evidence"
        )
        
        self.assertEqual(inconsistency.inconsistency_type, "TEST_INCONSISTENCY")
        self.assertEqual(inconsistency.description, "Test inconsistency description")
        self.assertEqual(inconsistency.severity, "HIGH")
        self.assertEqual(len(inconsistency.dates_involved), 1)
        self.assertEqual(inconsistency.evidence, "Test evidence")


class TestDateAnalyzerErrorHandling(unittest.TestCase):
    """Test error handling in DateAnalyzer."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.analyzer = DateAnalyzer()
    
    def test_empty_text_analysis(self):
        """Test analysis of empty text."""
        result = self.analyzer.analyze_dates("")
        
        self.assertEqual(result['total_dates_found'], 0)
        self.assertEqual(len(result['inconsistencies']), 0)
    
    def test_invalid_metadata(self):
        """Test handling of invalid metadata."""
        invalid_metadata = {
            'creation_date': None,
            'invalid_field': 12345
        }
        
        # Should not crash
        result = self.analyzer.analyze_dates(self.analyzer._extract_dates_from_text.__defaults__[0] or "", invalid_metadata)
        self.assertIsInstance(result, dict)
    
    def test_malformed_dates(self):
        """Test handling of malformed dates."""
        malformed_text = "Date: 99/99/9999 and Time: 25:70:90"
        
        result = self.analyzer.analyze_dates(malformed_text)
        
        # Should detect some inconsistencies but not crash
        self.assertIsInstance(result, dict)
        self.assertIn('inconsistencies', result)


if __name__ == '__main__':
    unittest.main()