#!/usr/bin/env python3
"""
Date-based Analysis Rules for Justice Document Processing

This module provides rules and patterns for extracting, validating, and analyzing
dates in legal documents to detect inconsistencies and potential tampering.

Usage:
    from analyzer.rules_dates import DateAnalyzer
    
    analyzer = DateAnalyzer()
    date_analysis = analyzer.analyze_dates(document_text)
"""

import re
import datetime as dt
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class DateMatch:
    """Represents a found date with context and metadata."""
    date_string: str
    normalized_date: str  # ISO format YYYY-MM-DD
    confidence: float
    pattern_type: str
    position: Tuple[int, int]  # Start and end position in text
    context: str  # Surrounding text
    source: str  # 'content', 'metadata', or 'filename'

@dataclass
class DateInconsistency:
    """Represents a date inconsistency found during analysis."""
    inconsistency_type: str
    description: str
    severity: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    dates_involved: List[DateMatch]
    evidence: str

class DateAnalyzer:
    """
    Comprehensive date analysis engine for legal documents.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the date analyzer.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or self._default_config()
        self.date_patterns = self._compile_date_patterns()
        self.inconsistency_rules = self._load_inconsistency_rules()
        
    def _default_config(self) -> Dict:
        """Return default configuration for date analysis."""
        return {
            "min_confidence": 0.6,
            "max_context_length": 100,
            "timeline_tolerance_days": 1,
            "chronology_check": True,
            "cross_reference_check": True,
            "metadata_validation": True,
            "format_consistency_check": True,
            "suspicious_patterns": {
                "enable": True,
                "multiple_formats": True,
                "impossible_dates": True,
                "future_dates": True,
                "weekend_business": True
            }
        }
    
    def _compile_date_patterns(self) -> List[Dict]:
        """Compile comprehensive date pattern matching rules."""
        return [
            {
                "name": "US_FORMAT_SLASHES",
                "pattern": r'\b(0?[1-9]|1[0-2])[/](0?[1-9]|[12][0-9]|3[01])[/](20\d{2}|19\d{2}|\d{2})\b',
                "format": "MM/DD/YYYY",
                "confidence": 0.9,
                "groups": ["month", "day", "year"]
            },
            {
                "name": "US_FORMAT_DASHES", 
                "pattern": r'\b(0?[1-9]|1[0-2])[-](0?[1-9]|[12][0-9]|3[01])[-](20\d{2}|19\d{2}|\d{2})\b',
                "format": "MM-DD-YYYY",
                "confidence": 0.9,
                "groups": ["month", "day", "year"]
            },
            {
                "name": "ISO_FORMAT",
                "pattern": r'\b(20\d{2}|19\d{2})[-](0?[1-9]|1[0-2])[-](0?[1-9]|[12][0-9]|3[01])\b',
                "format": "YYYY-MM-DD",
                "confidence": 0.95,
                "groups": ["year", "month", "day"]
            },
            {
                "name": "LONG_FORMAT",
                "pattern": r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+([12]?\d|3[01]),?\s*(20\d{2}|19\d{2})\b',
                "format": "Month DD, YYYY",
                "confidence": 0.85,
                "groups": ["month_name", "day", "year"]
            },
            {
                "name": "SHORT_MONTH_FORMAT",
                "pattern": r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+([12]?\d|3[01]),?\s*(20\d{2}|19\d{2})\b',
                "format": "Mon DD, YYYY", 
                "confidence": 0.8,
                "groups": ["month_abbrev", "day", "year"]
            },
            {
                "name": "EUROPEAN_FORMAT",
                "pattern": r'\b(0?[1-9]|[12][0-9]|3[01])[./](0?[1-9]|1[0-2])[./](20\d{2}|19\d{2})\b',
                "format": "DD/MM/YYYY",
                "confidence": 0.7,  # Lower confidence due to ambiguity
                "groups": ["day", "month", "year"]
            },
            {
                "name": "TIMESTAMP_FORMAT",
                "pattern": r'\b(20\d{2}|19\d{2})[-](0?[1-9]|1[0-2])[-](0?[1-9]|[12][0-9]|3[01])\s+([01]?\d|2[0-3]):([0-5]?\d)(?::([0-5]?\d))?\b',
                "format": "YYYY-MM-DD HH:MM:SS",
                "confidence": 0.95,
                "groups": ["year", "month", "day", "hour", "minute", "second"]
            },
            {
                "name": "RELATIVE_DATE",
                "pattern": r'\b(?:yesterday|today|tomorrow|last\s+(?:week|month|year)|next\s+(?:week|month|year))\b',
                "format": "Relative",
                "confidence": 0.6,
                "groups": ["relative_term"]
            },
            {
                "name": "INFORMAL_DATE",
                "pattern": r'\b(?:early|mid|late)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2}|19\d{2})\b',
                "format": "Informal Month Year",
                "confidence": 0.6,
                "groups": ["qualifier", "month_name", "year"]
            }
        ]
    
    def _load_inconsistency_rules(self) -> List[Dict]:
        """Load rules for detecting date inconsistencies."""
        return [
            {
                "name": "IMPOSSIBLE_DATE",
                "description": "Date that cannot exist (e.g., February 30th)",
                "severity": "CRITICAL",
                "check_function": self._check_impossible_date
            },
            {
                "name": "FUTURE_DATE_SUSPICIOUS", 
                "description": "Document dated in the future",
                "severity": "HIGH",
                "check_function": self._check_future_date
            },
            {
                "name": "MULTIPLE_DATE_FORMATS",
                "description": "Multiple date formats used inconsistently",
                "severity": "MEDIUM",
                "check_function": self._check_format_consistency
            },
            {
                "name": "CHRONOLOGICAL_INCONSISTENCY",
                "description": "Events out of chronological order",
                "severity": "HIGH",
                "check_function": self._check_chronological_order
            },
            {
                "name": "METADATA_CONTENT_MISMATCH",
                "description": "Document content date doesn't match metadata",
                "severity": "HIGH", 
                "check_function": self._check_metadata_consistency
            },
            {
                "name": "WEEKEND_BUSINESS_DATE",
                "description": "Business activity on weekend/holiday",
                "severity": "LOW",
                "check_function": self._check_business_date_validity
            },
            {
                "name": "EXTREME_DATE_RANGE",
                "description": "Dates spanning unreasonable time period",
                "severity": "MEDIUM",
                "check_function": self._check_date_range_validity
            },
            {
                "name": "SUSPICIOUS_DATE_PATTERN",
                "description": "Pattern suggesting date manipulation",
                "severity": "HIGH",
                "check_function": self._check_suspicious_patterns
            }
        ]
    
    def analyze_dates(self, text: str, metadata: Optional[Dict] = None, 
                     filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform comprehensive date analysis on document text.
        
        Args:
            text: Document text content
            metadata: Optional document metadata with dates
            filename: Optional filename that may contain dates
            
        Returns:
            Dictionary containing complete date analysis results
        """
        # Extract all dates from text
        extracted_dates = self._extract_dates_from_text(text)
        
        # Extract dates from metadata if available
        metadata_dates = self._extract_dates_from_metadata(metadata) if metadata else []
        
        # Extract dates from filename if available
        filename_dates = self._extract_dates_from_filename(filename) if filename else []
        
        # Combine all date sources
        all_dates = extracted_dates + metadata_dates + filename_dates
        
        # Normalize and validate dates
        validated_dates = self._validate_and_normalize_dates(all_dates)
        
        # Detect inconsistencies
        inconsistencies = self._detect_inconsistencies(validated_dates, text)
        
        # Analyze timeline
        timeline_analysis = self._analyze_timeline(validated_dates)
        
        # Generate summary statistics
        statistics = self._generate_date_statistics(validated_dates, inconsistencies)
        
        # Calculate risk assessment
        risk_assessment = self._assess_date_risks(inconsistencies, validated_dates)
        
        return {
            "total_dates_found": len(validated_dates),
            "dates_by_source": {
                "content": len([d for d in validated_dates if d.source == "content"]),
                "metadata": len([d for d in validated_dates if d.source == "metadata"]),
                "filename": len([d for d in validated_dates if d.source == "filename"])
            },
            "extracted_dates": [self._date_match_to_dict(d) for d in validated_dates],
            "inconsistencies": [self._inconsistency_to_dict(i) for i in inconsistencies],
            "timeline_analysis": timeline_analysis,
            "statistics": statistics,
            "risk_assessment": risk_assessment,
            "analysis_metadata": {
                "timestamp": dt.datetime.utcnow().isoformat(),
                "analyzer_version": "1.0.0",
                "config": self.config
            }
        }
    
    def _extract_dates_from_text(self, text: str) -> List[DateMatch]:
        """Extract dates from document text using pattern matching."""
        dates = []
        
        for pattern_info in self.date_patterns:
            pattern = pattern_info["pattern"]
            matches = re.finditer(pattern, text, re.IGNORECASE)
            
            for match in matches:
                try:
                    # Extract context around the match
                    start, end = match.span()
                    context_start = max(0, start - self.config["max_context_length"] // 2)
                    context_end = min(len(text), end + self.config["max_context_length"] // 2)
                    context = text[context_start:context_end].strip()
                    
                    # Create DateMatch object
                    date_match = DateMatch(
                        date_string=match.group(0),
                        normalized_date="",  # Will be filled in validation step
                        confidence=pattern_info["confidence"],
                        pattern_type=pattern_info["name"],
                        position=(start, end),
                        context=context,
                        source="content"
                    )
                    
                    dates.append(date_match)
                    
                except Exception as e:
                    logger.warning(f"Error processing date match '{match.group(0)}': {e}")
        
        return dates
    
    def _extract_dates_from_metadata(self, metadata: Dict) -> List[DateMatch]:
        """Extract dates from document metadata."""
        dates = []
        
        # Common metadata date fields
        date_fields = [
            "creation_date", "created", "creation_time",
            "modification_date", "modified", "last_modified",
            "document_date", "date", "timestamp"
        ]
        
        for field in date_fields:
            if field in metadata:
                date_value = metadata[field]
                if isinstance(date_value, str) and date_value.strip():
                    date_match = DateMatch(
                        date_string=date_value,
                        normalized_date="",
                        confidence=0.9,  # High confidence for metadata
                        pattern_type="METADATA",
                        position=(0, 0),
                        context=f"Metadata field: {field}",
                        source="metadata"
                    )
                    dates.append(date_match)
        
        return dates
    
    def _extract_dates_from_filename(self, filename: str) -> List[DateMatch]:
        """Extract dates from filename."""
        if not filename:
            return []
        
        dates = []
        
        # Filename-specific patterns
        filename_patterns = [
            {
                "pattern": r'(\d{4})[-_](\d{1,2})[-_](\d{1,2})',
                "format": "YYYY-MM-DD",
                "confidence": 0.8
            },
            {
                "pattern": r'(\d{1,2})[-_](\d{1,2})[-_](\d{4})', 
                "format": "MM-DD-YYYY",
                "confidence": 0.7
            },
            {
                "pattern": r'(\d{1,2})\.(\d{1,2})\.(\d{2,4})',
                "format": "MM.DD.YYYY",
                "confidence": 0.7
            }
        ]
        
        for pattern_info in filename_patterns:
            matches = re.finditer(pattern_info["pattern"], filename)
            
            for match in matches:
                date_match = DateMatch(
                    date_string=match.group(0),
                    normalized_date="",
                    confidence=pattern_info["confidence"],
                    pattern_type="FILENAME",
                    position=match.span(),
                    context=f"Filename: {filename}",
                    source="filename"
                )
                dates.append(date_match)
        
        return dates
    
    def _validate_and_normalize_dates(self, dates: List[DateMatch]) -> List[DateMatch]:
        """Validate and normalize extracted dates."""
        validated_dates = []
        
        for date_match in dates:
            try:
                normalized_date = self._normalize_date(date_match)
                if normalized_date:
                    date_match.normalized_date = normalized_date
                    validated_dates.append(date_match)
            except Exception as e:
                logger.warning(f"Failed to normalize date '{date_match.date_string}': {e}")
        
        return validated_dates
    
    def _normalize_date(self, date_match: DateMatch) -> Optional[str]:
        """Normalize a date string to ISO format (YYYY-MM-DD)."""
        date_str = date_match.date_string.strip()
        
        # Handle relative dates
        if date_match.pattern_type == "RELATIVE_DATE":
            return self._resolve_relative_date(date_str)
        
        # Month name mappings
        month_names = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12,
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
        }
        
        # Try different parsing strategies based on pattern type
        try:
            if date_match.pattern_type in ["US_FORMAT_SLASHES", "US_FORMAT_DASHES"]:
                # MM/DD/YYYY or MM-DD-YYYY
                match = re.match(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', date_str)
                if match:
                    month, day, year = match.groups()
                    year = self._normalize_year(year)
                    return f"{year:04d}-{int(month):02d}-{int(day):02d}"
            
            elif date_match.pattern_type == "ISO_FORMAT":
                # YYYY-MM-DD
                match = re.match(r'(\d{4})-(\d{1,2})-(\d{1,2})', date_str)
                if match:
                    year, month, day = match.groups()
                    return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
            
            elif date_match.pattern_type == "LONG_FORMAT":
                # Month DD, YYYY
                match = re.match(r'(\w+)\s+(\d{1,2}),?\s*(\d{4})', date_str, re.IGNORECASE)
                if match:
                    month_name, day, year = match.groups()
                    month_num = month_names.get(month_name.lower())
                    if month_num:
                        return f"{int(year):04d}-{month_num:02d}-{int(day):02d}"
            
            elif date_match.pattern_type == "SHORT_MONTH_FORMAT":
                # Mon DD, YYYY
                match = re.match(r'(\w+)\.?\s+(\d{1,2}),?\s*(\d{4})', date_str, re.IGNORECASE)
                if match:
                    month_abbrev, day, year = match.groups()
                    month_num = month_names.get(month_abbrev.lower())
                    if month_num:
                        return f"{int(year):04d}-{month_num:02d}-{int(day):02d}"
            
            elif date_match.pattern_type == "EUROPEAN_FORMAT":
                # DD/MM/YYYY
                match = re.match(r'(\d{1,2})[./](\d{1,2})[./](\d{4})', date_str)
                if match:
                    day, month, year = match.groups()
                    return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
            
            elif date_match.pattern_type == "TIMESTAMP_FORMAT":
                # YYYY-MM-DD HH:MM:SS - just take the date part
                match = re.match(r'(\d{4})-(\d{1,2})-(\d{1,2})', date_str)
                if match:
                    year, month, day = match.groups()
                    return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
            
            # Fallback: try to parse with datetime
            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y", "%d/%m/%Y", "%B %d, %Y", "%b %d, %Y"]:
                try:
                    parsed_date = dt.datetime.strptime(date_str, fmt)
                    return parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    continue
        
        except Exception as e:
            logger.warning(f"Error normalizing date '{date_str}': {e}")
        
        return None
    
    def _normalize_year(self, year_str: str) -> int:
        """Normalize year string to 4-digit year."""
        year = int(year_str)
        if year < 100:
            # Handle 2-digit years
            if year < 50:
                year += 2000
            else:
                year += 1900
        return year
    
    def _resolve_relative_date(self, relative_term: str) -> Optional[str]:
        """Resolve relative date terms to actual dates."""
        today = dt.date.today()
        relative_term = relative_term.lower().strip()
        
        if relative_term == "today":
            return today.isoformat()
        elif relative_term == "yesterday":
            return (today - dt.timedelta(days=1)).isoformat()
        elif relative_term == "tomorrow":
            return (today + dt.timedelta(days=1)).isoformat()
        elif "last week" in relative_term:
            return (today - dt.timedelta(weeks=1)).isoformat()
        elif "next week" in relative_term:
            return (today + dt.timedelta(weeks=1)).isoformat()
        elif "last month" in relative_term:
            return (today - dt.timedelta(days=30)).isoformat()
        elif "next month" in relative_term:
            return (today + dt.timedelta(days=30)).isoformat()
        elif "last year" in relative_term:
            return (today - dt.timedelta(days=365)).isoformat()
        elif "next year" in relative_term:
            return (today + dt.timedelta(days=365)).isoformat()
        
        return None
    
    def _detect_inconsistencies(self, dates: List[DateMatch], text: str) -> List[DateInconsistency]:
        """Detect date inconsistencies using loaded rules."""
        inconsistencies = []
        
        for rule in self.inconsistency_rules:
            try:
                found_inconsistencies = rule["check_function"](dates, text)
                if found_inconsistencies:
                    if isinstance(found_inconsistencies, list):
                        inconsistencies.extend(found_inconsistencies)
                    else:
                        inconsistencies.append(found_inconsistencies)
            except Exception as e:
                logger.error(f"Error checking rule {rule['name']}: {e}")
        
        return inconsistencies
    
    def _check_impossible_date(self, dates: List[DateMatch], text: str) -> List[DateInconsistency]:
        """Check for impossible dates (e.g., February 30th)."""
        inconsistencies = []
        
        for date_match in dates:
            if date_match.normalized_date:
                try:
                    # Try to create a datetime object to validate the date
                    year, month, day = map(int, date_match.normalized_date.split('-'))
                    dt.date(year, month, day)
                except ValueError as e:
                    inconsistency = DateInconsistency(
                        inconsistency_type="IMPOSSIBLE_DATE",
                        description=f"Impossible date: {date_match.date_string}",
                        severity="CRITICAL",
                        dates_involved=[date_match],
                        evidence=f"Date validation failed: {str(e)}"
                    )
                    inconsistencies.append(inconsistency)
        
        return inconsistencies
    
    def _check_future_date(self, dates: List[DateMatch], text: str) -> List[DateInconsistency]:
        """Check for suspicious future dates."""
        inconsistencies = []
        today = dt.date.today()
        
        for date_match in dates:
            if date_match.normalized_date:
                try:
                    date_obj = dt.datetime.strptime(date_match.normalized_date, "%Y-%m-%d").date()
                    if date_obj > today:
                        days_future = (date_obj - today).days
                        if days_future > 1:  # Allow for one day tolerance
                            inconsistency = DateInconsistency(
                                inconsistency_type="FUTURE_DATE_SUSPICIOUS",
                                description=f"Document dated {days_future} days in the future",
                                severity="HIGH" if days_future > 30 else "MEDIUM",
                                dates_involved=[date_match],
                                evidence=f"Date {date_match.date_string} is {days_future} days future"
                            )
                            inconsistencies.append(inconsistency)
                except ValueError:
                    continue
        
        return inconsistencies
    
    def _check_format_consistency(self, dates: List[DateMatch], text: str) -> List[DateInconsistency]:
        """Check for inconsistent date formats within the document."""
        inconsistencies = []
        
        # Group dates by format
        format_groups = {}
        for date_match in dates:
            format_type = date_match.pattern_type
            if format_type not in format_groups:
                format_groups[format_type] = []
            format_groups[format_type].append(date_match)
        
        # Check if multiple formats are used extensively
        significant_formats = [fmt for fmt, dates_list in format_groups.items() 
                             if len(dates_list) > 1]
        
        if len(significant_formats) > 2:
            all_dates = [date for dates_list in format_groups.values() for date in dates_list]
            inconsistency = DateInconsistency(
                inconsistency_type="MULTIPLE_DATE_FORMATS",
                description=f"Document uses {len(significant_formats)} different date formats",
                severity="MEDIUM",
                dates_involved=all_dates[:5],  # Limit to first 5 for brevity
                evidence=f"Formats used: {', '.join(significant_formats)}"
            )
            inconsistencies.append(inconsistency)
        
        return inconsistencies
    
    def _check_chronological_order(self, dates: List[DateMatch], text: str) -> List[DateInconsistency]:
        """Check for chronological inconsistencies."""
        inconsistencies = []
        
        # Sort dates by their position in the document
        content_dates = [d for d in dates if d.source == "content" and d.normalized_date]
        content_dates.sort(key=lambda x: x.position[0])
        
        if len(content_dates) < 2:
            return inconsistencies
        
        # Check if dates appear in chronological order
        for i in range(len(content_dates) - 1):
            current_date = dt.datetime.strptime(content_dates[i].normalized_date, "%Y-%m-%d").date()
            next_date = dt.datetime.strptime(content_dates[i + 1].normalized_date, "%Y-%m-%d").date()
            
            # Allow some tolerance for non-chronological order
            if current_date > next_date and (current_date - next_date).days > self.config["timeline_tolerance_days"]:
                inconsistency = DateInconsistency(
                    inconsistency_type="CHRONOLOGICAL_INCONSISTENCY",
                    description="Dates appear out of chronological order",
                    severity="HIGH",
                    dates_involved=[content_dates[i], content_dates[i + 1]],
                    evidence=f"Date {current_date} appears before {next_date} in document"
                )
                inconsistencies.append(inconsistency)
        
        return inconsistencies
    
    def _check_metadata_consistency(self, dates: List[DateMatch], text: str) -> List[DateInconsistency]:
        """Check consistency between metadata dates and content dates."""
        inconsistencies = []
        
        metadata_dates = [d for d in dates if d.source == "metadata" and d.normalized_date]
        content_dates = [d for d in dates if d.source == "content" and d.normalized_date]
        
        if not metadata_dates or not content_dates:
            return inconsistencies
        
        # Compare metadata dates with content dates
        for meta_date in metadata_dates:
            meta_date_obj = dt.datetime.strptime(meta_date.normalized_date, "%Y-%m-%d").date()
            
            # Find closest content date
            closest_content_date = None
            min_difference = float('inf')
            
            for content_date in content_dates:
                content_date_obj = dt.datetime.strptime(content_date.normalized_date, "%Y-%m-%d").date()
                difference = abs((meta_date_obj - content_date_obj).days)
                
                if difference < min_difference:
                    min_difference = difference
                    closest_content_date = content_date
            
            # Check if the difference is significant
            if min_difference > 30:  # More than 30 days difference
                inconsistency = DateInconsistency(
                    inconsistency_type="METADATA_CONTENT_MISMATCH",
                    description=f"Metadata date differs from content dates by {min_difference} days",
                    severity="HIGH",
                    dates_involved=[meta_date, closest_content_date] if closest_content_date else [meta_date],
                    evidence=f"Metadata: {meta_date.date_string}, Closest content: {closest_content_date.date_string if closest_content_date else 'None'}"
                )
                inconsistencies.append(inconsistency)
        
        return inconsistencies
    
    def _check_business_date_validity(self, dates: List[DateMatch], text: str) -> List[DateInconsistency]:
        """Check for business activities on weekends/holidays."""
        inconsistencies = []
        
        # Look for business-related keywords in the context
        business_keywords = [
            "filed", "submitted", "processed", "approved", "signed",
            "business", "office", "court", "hearing", "meeting"
        ]
        
        text_lower = text.lower()
        has_business_context = any(keyword in text_lower for keyword in business_keywords)
        
        if not has_business_context:
            return inconsistencies
        
        for date_match in dates:
            if date_match.normalized_date:
                try:
                    date_obj = dt.datetime.strptime(date_match.normalized_date, "%Y-%m-%d").date()
                    
                    # Check if it's a weekend
                    if date_obj.weekday() >= 5:  # Saturday = 5, Sunday = 6
                        # Check if business activity is mentioned near this date
                        context_lower = date_match.context.lower()
                        if any(keyword in context_lower for keyword in business_keywords):
                            inconsistency = DateInconsistency(
                                inconsistency_type="WEEKEND_BUSINESS_DATE",
                                description=f"Business activity on weekend: {date_obj.strftime('%A')}, {date_match.date_string}",
                                severity="LOW",
                                dates_involved=[date_match],
                                evidence=f"Weekend business activity context: {date_match.context[:100]}..."
                            )
                            inconsistencies.append(inconsistency)
                
                except ValueError:
                    continue
        
        return inconsistencies
    
    def _check_date_range_validity(self, dates: List[DateMatch], text: str) -> List[DateInconsistency]:
        """Check for unreasonable date ranges."""
        inconsistencies = []
        
        valid_dates = [d for d in dates if d.normalized_date]
        if len(valid_dates) < 2:
            return inconsistencies
        
        # Convert to date objects
        date_objects = []
        for date_match in valid_dates:
            try:
                date_obj = dt.datetime.strptime(date_match.normalized_date, "%Y-%m-%d").date()
                date_objects.append((date_obj, date_match))
            except ValueError:
                continue
        
        if len(date_objects) < 2:
            return inconsistencies
        
        # Find date range
        date_objects.sort(key=lambda x: x[0])
        earliest_date, earliest_match = date_objects[0]
        latest_date, latest_match = date_objects[-1]
        
        date_range_days = (latest_date - earliest_date).days
        
        # Flag extremely large date ranges (e.g., more than 50 years)
        if date_range_days > 18250:  # 50 years
            inconsistency = DateInconsistency(
                inconsistency_type="EXTREME_DATE_RANGE",
                description=f"Document spans {date_range_days // 365} years",
                severity="MEDIUM",
                dates_involved=[earliest_match, latest_match],
                evidence=f"Date range: {earliest_date} to {latest_date}"
            )
            inconsistencies.append(inconsistency)
        
        return inconsistencies
    
    def _check_suspicious_patterns(self, dates: List[DateMatch], text: str) -> List[DateInconsistency]:
        """Check for suspicious date patterns that might indicate tampering."""
        inconsistencies = []
        
        if not self.config["suspicious_patterns"]["enable"]:
            return inconsistencies
        
        # Check for dates with suspicious corrections or overstrikes
        correction_patterns = [
            r'\[\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s*\]',  # [MM/DD/YYYY]
            r'\(\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s*\)',  # (MM/DD/YYYY)
            r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\s*\^\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'  # Date^Date
        ]
        
        for pattern in correction_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                # Find associated date matches
                associated_dates = [d for d in dates 
                                  if abs(d.position[0] - match.start()) < 50]
                
                if associated_dates:
                    inconsistency = DateInconsistency(
                        inconsistency_type="SUSPICIOUS_DATE_PATTERN", 
                        description="Date appears to have corrections or alterations",
                        severity="HIGH",
                        dates_involved=associated_dates,
                        evidence=f"Suspicious pattern found: {match.group(0)}"
                    )
                    inconsistencies.append(inconsistency)
        
        return inconsistencies
    
    def _analyze_timeline(self, dates: List[DateMatch]) -> Dict[str, Any]:
        """Analyze the timeline of events based on extracted dates."""
        valid_dates = [d for d in dates if d.normalized_date]
        
        if not valid_dates:
            return {"error": "No valid dates found for timeline analysis"}
        
        # Convert to date objects and sort
        timeline_events = []
        for date_match in valid_dates:
            try:
                date_obj = dt.datetime.strptime(date_match.normalized_date, "%Y-%m-%d").date()
                timeline_events.append({
                    "date": date_obj,
                    "date_string": date_match.date_string,
                    "context": date_match.context[:100] + "..." if len(date_match.context) > 100 else date_match.context,
                    "source": date_match.source,
                    "confidence": date_match.confidence
                })
            except ValueError:
                continue
        
        timeline_events.sort(key=lambda x: x["date"])
        
        # Calculate timeline statistics
        if timeline_events:
            earliest = timeline_events[0]["date"]
            latest = timeline_events[-1]["date"]
            span_days = (latest - earliest).days
            
            # Group events by time periods
            event_clusters = self._cluster_events_by_time(timeline_events)
            
            return {
                "total_events": len(timeline_events),
                "date_range": {
                    "earliest": earliest.isoformat(),
                    "latest": latest.isoformat(),
                    "span_days": span_days,
                    "span_years": round(span_days / 365.25, 2)
                },
                "event_clusters": event_clusters,
                "timeline": [
                    {
                        "date": event["date"].isoformat(),
                        "date_string": event["date_string"],
                        "context": event["context"],
                        "source": event["source"],
                        "confidence": event["confidence"]
                    }
                    for event in timeline_events
                ]
            }
        
        return {"error": "No valid timeline events found"}
    
    def _cluster_events_by_time(self, timeline_events: List[Dict]) -> Dict[str, int]:
        """Cluster timeline events by time periods."""
        clusters = {
            "same_day": 0,
            "within_week": 0,
            "within_month": 0,
            "within_year": 0,
            "beyond_year": 0
        }
        
        for i in range(len(timeline_events) - 1):
            current_date = timeline_events[i]["date"]
            next_date = timeline_events[i + 1]["date"]
            diff_days = (next_date - current_date).days
            
            if diff_days == 0:
                clusters["same_day"] += 1
            elif diff_days <= 7:
                clusters["within_week"] += 1
            elif diff_days <= 30:
                clusters["within_month"] += 1
            elif diff_days <= 365:
                clusters["within_year"] += 1
            else:
                clusters["beyond_year"] += 1
        
        return clusters
    
    def _generate_date_statistics(self, dates: List[DateMatch], 
                                 inconsistencies: List[DateInconsistency]) -> Dict[str, Any]:
        """Generate statistical summary of date analysis."""
        valid_dates = [d for d in dates if d.normalized_date]
        
        # Count by pattern type
        pattern_counts = {}
        for date_match in dates:
            pattern_type = date_match.pattern_type
            pattern_counts[pattern_type] = pattern_counts.get(pattern_type, 0) + 1
        
        # Count by source
        source_counts = {}
        for date_match in dates:
            source = date_match.source
            source_counts[source] = source_counts.get(source, 0) + 1
        
        # Count inconsistencies by severity
        severity_counts = {}
        for inconsistency in inconsistencies:
            severity = inconsistency.severity
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Calculate confidence statistics
        if valid_dates:
            confidences = [d.confidence for d in valid_dates]
            avg_confidence = sum(confidences) / len(confidences)
            min_confidence = min(confidences)
            max_confidence = max(confidences)
        else:
            avg_confidence = min_confidence = max_confidence = 0.0
        
        return {
            "total_dates_extracted": len(dates),
            "valid_dates": len(valid_dates),
            "invalid_dates": len(dates) - len(valid_dates),
            "pattern_distribution": pattern_counts,
            "source_distribution": source_counts,
            "inconsistencies_by_severity": severity_counts,
            "confidence_statistics": {
                "average": round(avg_confidence, 2),
                "minimum": round(min_confidence, 2),
                "maximum": round(max_confidence, 2)
            }
        }
    
    def _assess_date_risks(self, inconsistencies: List[DateInconsistency], 
                          dates: List[DateMatch]) -> Dict[str, Any]:
        """Assess risks based on date analysis results."""
        # Calculate risk scores
        risk_factors = {
            "CRITICAL": 1.0,
            "HIGH": 0.8,
            "MEDIUM": 0.5, 
            "LOW": 0.2
        }
        
        total_risk_score = sum(risk_factors.get(inc.severity, 0) for inc in inconsistencies)
        
        # Normalize risk score (0-1 scale)
        max_possible_risk = len(inconsistencies) * 1.0
        normalized_risk = min(total_risk_score / max_possible_risk, 1.0) if max_possible_risk > 0 else 0.0
        
        # Determine overall risk level
        if normalized_risk >= 0.8:
            overall_risk = "CRITICAL"
        elif normalized_risk >= 0.6:
            overall_risk = "HIGH"
        elif normalized_risk >= 0.4:
            overall_risk = "MEDIUM"
        elif normalized_risk >= 0.2:
            overall_risk = "LOW"
        else:
            overall_risk = "MINIMAL"
        
        # Generate risk summary
        critical_issues = [inc for inc in inconsistencies if inc.severity == "CRITICAL"]
        high_issues = [inc for inc in inconsistencies if inc.severity == "HIGH"]
        
        risk_summary = []
        if critical_issues:
            risk_summary.append(f"{len(critical_issues)} critical date issues found")
        if high_issues:
            risk_summary.append(f"{len(high_issues)} high-severity date issues found")
        
        # Tampering indicators
        tampering_indicators = [
            inc for inc in inconsistencies 
            if inc.inconsistency_type in ["SUSPICIOUS_DATE_PATTERN", "CHRONOLOGICAL_INCONSISTENCY", "METADATA_CONTENT_MISMATCH"]
        ]
        
        return {
            "overall_risk_level": overall_risk,
            "normalized_risk_score": round(normalized_risk, 2),
            "total_inconsistencies": len(inconsistencies),
            "critical_issues": len(critical_issues),
            "high_issues": len(high_issues),
            "tampering_indicators": len(tampering_indicators),
            "risk_summary": risk_summary,
            "recommendations": self._generate_risk_recommendations(overall_risk, inconsistencies)
        }
    
    def _generate_risk_recommendations(self, risk_level: str, 
                                     inconsistencies: List[DateInconsistency]) -> List[str]:
        """Generate recommendations based on risk assessment."""
        recommendations = []
        
        if risk_level in ["CRITICAL", "HIGH"]:
            recommendations.append("Immediate forensic examination recommended")
            recommendations.append("Preserve original document metadata")
            recommendations.append("Conduct independent verification of dates")
        
        if any(inc.inconsistency_type == "SUSPICIOUS_DATE_PATTERN" for inc in inconsistencies):
            recommendations.append("Examine document for signs of alteration")
        
        if any(inc.inconsistency_type == "METADATA_CONTENT_MISMATCH" for inc in inconsistencies):
            recommendations.append("Verify document creation and modification history")
        
        if any(inc.inconsistency_type == "CHRONOLOGICAL_INCONSISTENCY" for inc in inconsistencies):
            recommendations.append("Review event sequence for logical consistency")
        
        if risk_level in ["MEDIUM", "LOW"]:
            recommendations.append("Standard document validation procedures sufficient")
        
        return recommendations
    
    # Utility methods for converting objects to dictionaries
    def _date_match_to_dict(self, date_match: DateMatch) -> Dict[str, Any]:
        """Convert DateMatch object to dictionary."""
        return {
            "date_string": date_match.date_string,
            "normalized_date": date_match.normalized_date,
            "confidence": date_match.confidence,
            "pattern_type": date_match.pattern_type,
            "position": date_match.position,
            "context": date_match.context,
            "source": date_match.source
        }
    
    def _inconsistency_to_dict(self, inconsistency: DateInconsistency) -> Dict[str, Any]:
        """Convert DateInconsistency object to dictionary."""
        return {
            "inconsistency_type": inconsistency.inconsistency_type,
            "description": inconsistency.description,
            "severity": inconsistency.severity,
            "dates_involved": [self._date_match_to_dict(d) for d in inconsistency.dates_involved],
            "evidence": inconsistency.evidence
        }


def main():
    """Command-line interface for date analysis."""
    import argparse
    import json
    from pathlib import Path
    
    parser = argparse.ArgumentParser(description="Analyze dates in legal documents")
    parser.add_argument("--input", required=True, help="Input file or directory")
    parser.add_argument("--output", default="output/date_analysis", help="Output directory")
    parser.add_argument("--metadata", help="Metadata JSON file")
    
    args = parser.parse_args()
    
    analyzer = DateAnalyzer()
    
    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Load metadata if provided
    metadata = None
    if args.metadata:
        with open(args.metadata, 'r') as f:
            metadata = json.load(f)
    
    if input_path.is_file():
        # Analyze single file
        text = input_path.read_text(encoding='utf-8', errors='ignore')
        result = analyzer.analyze_dates(text, metadata, input_path.name)
        
        output_file = output_path / f"date_analysis_{input_path.stem}.json"
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"Date analysis completed for: {input_path.name}")
        print(f"Dates found: {result['total_dates_found']}")
        print(f"Inconsistencies: {len(result['inconsistencies'])}")
        print(f"Risk level: {result['risk_assessment']['overall_risk_level']}")
        print(f"Results saved to: {output_file}")
    
    else:
        # Analyze directory
        results = {}
        for file_path in input_path.glob("*.txt"):
            text = file_path.read_text(encoding='utf-8', errors='ignore')
            result = analyzer.analyze_dates(text, metadata, file_path.name)
            results[file_path.name] = result
        
        # Save batch results
        results_file = output_path / "date_analysis_batch.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Generate summary
        total_files = len(results)
        total_dates = sum(r['total_dates_found'] for r in results.values())
        total_inconsistencies = sum(len(r['inconsistencies']) for r in results.values())
        high_risk_files = len([r for r in results.values() 
                              if r['risk_assessment']['overall_risk_level'] in ['HIGH', 'CRITICAL']])
        
        print(f"Date analysis completed for {total_files} files")
        print(f"Total dates found: {total_dates}")
        print(f"Total inconsistencies: {total_inconsistencies}")
        print(f"High-risk files: {high_risk_files}")
        print(f"Results saved to: {results_file}")


if __name__ == "__main__":
    main()