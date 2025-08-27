#!/usr/bin/env python3
"""
Document Analysis Core Module

Provides comprehensive document analysis capabilities including:
- Content extraction and preprocessing
- Pattern recognition and classification
- Tampering detection algorithms
- Cross-reference analysis
- Timeline reconstruction

Usage:
    from analyzer.run_analysis import DocumentAnalyzer
    
    analyzer = DocumentAnalyzer()
    results = analyzer.analyze_documents("input/", "output/analysis/")
"""

import os
import re
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentAnalyzer:
    """
    Main document analysis engine that coordinates various analysis modules.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the document analyzer.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or self._default_config()
        self.analyzed_documents = {}
        self.cross_references = []
        self.timeline_events = []
        
    def _default_config(self) -> Dict:
        """Return default configuration settings."""
        return {
            "extract_entities": True,
            "detect_tampering": True,
            "build_timeline": True,
            "cross_reference": True,
            "output_formats": ["json", "html", "csv"],
            "confidence_threshold": 0.7,
            "supported_formats": [".pdf", ".txt", ".docx"],
            "analysis_modules": [
                "content_analysis",
                "pattern_recognition", 
                "tampering_detection",
                "timeline_analysis"
            ]
        }
    
    def analyze_documents(self, input_dir: str, output_dir: str) -> Dict[str, Any]:
        """
        Analyze all documents in the input directory.
        
        Args:
            input_dir: Path to directory containing documents to analyze
            output_dir: Path to directory for analysis outputs
            
        Returns:
            Dictionary containing analysis results and statistics
        """
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Starting document analysis: {input_path} -> {output_path}")
        
        # Find all supported documents
        documents = self._find_documents(input_path)
        logger.info(f"Found {len(documents)} documents to analyze")
        
        # Analyze each document
        analysis_results = {}
        for doc_path in documents:
            try:
                result = self._analyze_single_document(doc_path)
                analysis_results[str(doc_path)] = result
                logger.info(f"Analyzed: {doc_path.name}")
            except Exception as e:
                logger.error(f"Error analyzing {doc_path}: {e}")
                analysis_results[str(doc_path)] = {"error": str(e)}
        
        # Cross-reference analysis
        if self.config["cross_reference"]:
            cross_refs = self._perform_cross_reference_analysis(analysis_results)
            analysis_results["cross_references"] = cross_refs
        
        # Timeline analysis
        if self.config["build_timeline"]:
            timeline = self._build_timeline(analysis_results)
            analysis_results["timeline"] = timeline
        
        # Generate summary statistics
        summary = self._generate_summary(analysis_results)
        analysis_results["summary"] = summary
        
        # Save results
        self._save_results(analysis_results, output_path)
        
        logger.info("Document analysis completed")
        return analysis_results
    
    def _find_documents(self, input_dir: Path) -> List[Path]:
        """Find all supported document files in the input directory."""
        documents = []
        for ext in self.config["supported_formats"]:
            documents.extend(input_dir.glob(f"*{ext}"))
        return sorted(documents)
    
    def _analyze_single_document(self, doc_path: Path) -> Dict[str, Any]:
        """
        Analyze a single document file.
        
        Args:
            doc_path: Path to the document file
            
        Returns:
            Dictionary containing analysis results for the document
        """
        # Extract basic metadata
        metadata = self._extract_metadata(doc_path)
        
        # Extract text content
        text_content = self._extract_text(doc_path)
        
        # Perform content analysis
        content_analysis = self._analyze_content(text_content)
        
        # Pattern recognition
        patterns = self._recognize_patterns(text_content)
        
        # Tampering detection
        tampering_indicators = self._detect_tampering(doc_path, text_content)
        
        # Entity extraction
        entities = self._extract_entities(text_content)
        
        return {
            "metadata": metadata,
            "content_length": len(text_content),
            "content_analysis": content_analysis,
            "patterns": patterns,
            "tampering_indicators": tampering_indicators,
            "entities": entities,
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "analyzer_version": "1.0.0"
        }
    
    def _extract_metadata(self, doc_path: Path) -> Dict[str, Any]:
        """Extract basic metadata from a document."""
        stat = doc_path.stat()
        return {
            "filename": doc_path.name,
            "file_size": stat.st_size,
            "creation_time": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modification_time": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "file_extension": doc_path.suffix,
            "file_hash": self._calculate_file_hash(doc_path)
        }
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of file."""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def _extract_text(self, doc_path: Path) -> str:
        """Extract text content from document."""
        if doc_path.suffix.lower() == '.txt':
            return doc_path.read_text(encoding='utf-8', errors='ignore')
        elif doc_path.suffix.lower() == '.pdf':
            return self._extract_pdf_text(doc_path)
        else:
            logger.warning(f"Unsupported file format: {doc_path}")
            return ""
    
    def _extract_pdf_text(self, pdf_path: Path) -> str:
        """Extract text from PDF file."""
        try:
            # Try pdfplumber first
            import pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
                return text
        except ImportError:
            try:
                # Fallback to PyPDF2
                import PyPDF2
                text = ""
                with open(pdf_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    for page in reader.pages:
                        text += page.extract_text()
                return text
            except ImportError:
                logger.error("No PDF processing library available. Install pdfplumber or PyPDF2")
                return ""
    
    def _analyze_content(self, text: str) -> Dict[str, Any]:
        """Perform basic content analysis."""
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        
        return {
            "word_count": len(words),
            "sentence_count": len([s for s in sentences if s.strip()]),
            "character_count": len(text),
            "average_words_per_sentence": len(words) / max(len(sentences), 1),
            "complexity_score": self._calculate_complexity_score(text)
        }
    
    def _calculate_complexity_score(self, text: str) -> float:
        """Calculate a simple complexity score based on vocabulary and structure."""
        words = text.split()
        unique_words = set(word.lower().strip('.,!?":;') for word in words)
        
        if len(words) == 0:
            return 0.0
            
        vocabulary_diversity = len(unique_words) / len(words)
        avg_word_length = sum(len(word) for word in words) / len(words)
        
        # Simple complexity score (0-1)
        complexity = (vocabulary_diversity + avg_word_length / 10) / 2
        return min(complexity, 1.0)
    
    def _recognize_patterns(self, text: str) -> Dict[str, List[str]]:
        """Recognize common patterns in legal documents."""
        patterns = {
            "dates": self._find_dates(text),
            "phone_numbers": self._find_phone_numbers(text),
            "case_numbers": self._find_case_numbers(text),
            "legal_citations": self._find_legal_citations(text),
            "names": self._find_potential_names(text)
        }
        return patterns
    
    def _find_dates(self, text: str) -> List[str]:
        """Find date patterns in text."""
        date_patterns = [
            r'\b\d{1,2}/\d{1,2}/\d{2,4}\b',
            r'\b\d{1,2}-\d{1,2}-\d{2,4}\b',
            r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b'
        ]
        
        dates = []
        for pattern in date_patterns:
            dates.extend(re.findall(pattern, text, re.IGNORECASE))
        return list(set(dates))
    
    def _find_phone_numbers(self, text: str) -> List[str]:
        """Find phone number patterns."""
        phone_pattern = r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b'
        return re.findall(phone_pattern, text)
    
    def _find_case_numbers(self, text: str) -> List[str]:
        """Find case number patterns."""
        case_patterns = [
            r'\bCase\s+No\.?\s*([A-Z0-9-]+)\b',
            r'\bDocket\s+No\.?\s*([A-Z0-9-]+)\b',
            r'\b([0-9]{2}-[A-Z]{2}-[0-9]+)\b'
        ]
        
        cases = []
        for pattern in case_patterns:
            cases.extend(re.findall(pattern, text, re.IGNORECASE))
        return list(set(cases))
    
    def _find_legal_citations(self, text: str) -> List[str]:
        """Find legal citation patterns."""
        citation_pattern = r'\b\d+\s+[A-Z][a-z]+\.?\s+\d+\b'
        return re.findall(citation_pattern, text)
    
    def _find_potential_names(self, text: str) -> List[str]:
        """Find potential person names."""
        # Simple name pattern: Title + First + Last
        name_pattern = r'\b(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Judge|Officer|Detective)?\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)\b'
        matches = re.findall(name_pattern, text)
        return [f"{first} {last}" for first, last in matches]
    
    def _detect_tampering(self, doc_path: Path, text: str) -> Dict[str, Any]:
        """Detect potential document tampering indicators."""
        indicators = {
            "inconsistent_formatting": self._check_formatting_consistency(text),
            "unusual_patterns": self._check_unusual_patterns(text),
            "metadata_anomalies": self._check_metadata_anomalies(doc_path),
            "text_inconsistencies": self._check_text_inconsistencies(text)
        }
        
        # Calculate overall tampering risk score
        risk_factors = sum(1 for indicator in indicators.values() if indicator)
        risk_score = min(risk_factors / len(indicators), 1.0)
        
        indicators["overall_risk_score"] = risk_score
        indicators["risk_level"] = "HIGH" if risk_score > 0.7 else "MEDIUM" if risk_score > 0.3 else "LOW"
        
        return indicators
    
    def _check_formatting_consistency(self, text: str) -> bool:
        """Check for inconsistent formatting that might indicate tampering."""
        # Look for unusual spacing patterns
        unusual_spacing = len(re.findall(r'\s{3,}', text)) > 5
        
        # Look for mixed line endings
        mixed_endings = '\r\n' in text and '\n' in text.replace('\r\n', '')
        
        return unusual_spacing or mixed_endings
    
    def _check_unusual_patterns(self, text: str) -> bool:
        """Check for unusual patterns that might indicate editing."""
        # Look for repeated corrections or overstrikes
        corrections = len(re.findall(r'\[.*?\]', text)) > 3
        
        # Look for unusual character sequences
        unusual_chars = len(re.findall(r'[^\w\s.,!?;:()"-]', text)) > 10
        
        return corrections or unusual_chars
    
    def _check_metadata_anomalies(self, doc_path: Path) -> bool:
        """Check for metadata anomalies."""
        stat = doc_path.stat()
        
        # Check if modification time is very recent compared to creation time
        time_diff = stat.st_mtime - stat.st_ctime
        recent_modification = time_diff < 3600  # Modified within an hour of creation
        
        return recent_modification and stat.st_size > 1024  # Only flag for non-trivial files
    
    def _check_text_inconsistencies(self, text: str) -> bool:
        """Check for text inconsistencies."""
        # Look for inconsistent date formats
        date_formats = [
            len(re.findall(r'\d{1,2}/\d{1,2}/\d{4}', text)),
            len(re.findall(r'\d{1,2}-\d{1,2}-\d{4}', text)),
            len(re.findall(r'\d{4}-\d{1,2}-\d{1,2}', text))
        ]
        
        # Flag if multiple date formats are used extensively
        format_count = sum(1 for count in date_formats if count > 2)
        
        return format_count > 1
    
    def _extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract named entities from text."""
        entities = {
            "persons": self._find_potential_names(text),
            "organizations": self._find_organizations(text),
            "locations": self._find_locations(text),
            "dates": self._find_dates(text)
        }
        return entities
    
    def _find_organizations(self, text: str) -> List[str]:
        """Find organization names."""
        org_patterns = [
            r'\b([A-Z][a-z]+\s+(?:Police|Department|Agency|Office|Bureau|Commission))\b',
            r'\b([A-Z][a-z]+\s+(?:County|City|State))\b',
            r'\b(FBI|DOJ|ATF|DEA|ICE|CBP)\b'
        ]
        
        orgs = []
        for pattern in org_patterns:
            orgs.extend(re.findall(pattern, text, re.IGNORECASE))
        return list(set(orgs))
    
    def _find_locations(self, text: str) -> List[str]:
        """Find location names."""
        location_patterns = [
            r'\b([A-Z][a-z]+,\s+[A-Z]{2})\b',  # City, State
            r'\b(\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd))\b'
        ]
        
        locations = []
        for pattern in location_patterns:
            locations.extend(re.findall(pattern, text))
        return list(set(locations))
    
    def _perform_cross_reference_analysis(self, analysis_results: Dict) -> List[Dict]:
        """Perform cross-reference analysis between documents."""
        cross_refs = []
        
        # Compare entities across documents
        documents = [(path, data) for path, data in analysis_results.items() 
                    if isinstance(data, dict) and "entities" in data]
        
        for i, (doc1_path, doc1_data) in enumerate(documents):
            for j, (doc2_path, doc2_data) in enumerate(documents[i+1:], i+1):
                similarities = self._calculate_document_similarity(doc1_data, doc2_data)
                if similarities["overall_similarity"] > 0.3:
                    cross_refs.append({
                        "document1": doc1_path,
                        "document2": doc2_path,
                        "similarities": similarities
                    })
        
        return cross_refs
    
    def _calculate_document_similarity(self, doc1: Dict, doc2: Dict) -> Dict:
        """Calculate similarity metrics between two documents."""
        # Entity overlap
        entities1 = doc1.get("entities", {})
        entities2 = doc2.get("entities", {})
        
        similarities = {}
        for entity_type in ["persons", "organizations", "locations", "dates"]:
            set1 = set(entities1.get(entity_type, []))
            set2 = set(entities2.get(entity_type, []))
            
            if set1 or set2:
                overlap = len(set1.intersection(set2))
                total = len(set1.union(set2))
                similarities[f"{entity_type}_similarity"] = overlap / total if total > 0 else 0
            else:
                similarities[f"{entity_type}_similarity"] = 0
        
        # Overall similarity
        sim_values = [v for v in similarities.values() if v > 0]
        similarities["overall_similarity"] = sum(sim_values) / len(sim_values) if sim_values else 0
        
        return similarities
    
    def _build_timeline(self, analysis_results: Dict) -> List[Dict]:
        """Build a timeline from extracted dates and events."""
        timeline_events = []
        
        for doc_path, data in analysis_results.items():
            if isinstance(data, dict) and "entities" in data:
                dates = data["entities"].get("dates", [])
                metadata = data.get("metadata", {})
                
                for date_str in dates:
                    timeline_events.append({
                        "date": date_str,
                        "document": doc_path,
                        "event_type": "document_date_reference",
                        "metadata": metadata
                    })
        
        # Sort by date (this is simplified - would need better date parsing)
        timeline_events.sort(key=lambda x: x["date"])
        
        return timeline_events
    
    def _generate_summary(self, analysis_results: Dict) -> Dict[str, Any]:
        """Generate summary statistics for the analysis."""
        documents = [data for data in analysis_results.values() 
                    if isinstance(data, dict) and "metadata" in data]
        
        total_docs = len(documents)
        total_words = sum(data.get("content_analysis", {}).get("word_count", 0) 
                         for data in documents)
        
        # Count tampering indicators
        high_risk_docs = sum(1 for data in documents 
                           if data.get("tampering_indicators", {}).get("risk_level") == "HIGH")
        
        # Count cross-references
        cross_refs = analysis_results.get("cross_references", [])
        
        return {
            "total_documents": total_docs,
            "total_words": total_words,
            "high_risk_documents": high_risk_docs,
            "cross_references_found": len(cross_refs),
            "analysis_date": datetime.utcnow().isoformat(),
            "average_document_size": total_words / total_docs if total_docs > 0 else 0
        }
    
    def _save_results(self, results: Dict, output_dir: Path) -> None:
        """Save analysis results to output directory."""
        # Save as JSON
        json_file = output_dir / "analysis_results.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Save summary as text
        summary_file = output_dir / "analysis_summary.txt"
        with open(summary_file, 'w', encoding='utf-8') as f:
            summary = results.get("summary", {})
            f.write("Justice Document Analysis Summary\n")
            f.write("=" * 40 + "\n\n")
            f.write(f"Total Documents: {summary.get('total_documents', 0)}\n")
            f.write(f"Total Words: {summary.get('total_words', 0)}\n")
            f.write(f"High Risk Documents: {summary.get('high_risk_documents', 0)}\n")
            f.write(f"Cross References: {summary.get('cross_references_found', 0)}\n")
            f.write(f"Analysis Date: {summary.get('analysis_date', 'Unknown')}\n")
        
        logger.info(f"Analysis results saved to {output_dir}")


def main():
    """Command-line interface for document analysis."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Analyze legal documents for patterns and tampering")
    parser.add_argument("--input", default="input", help="Input directory containing documents")
    parser.add_argument("--output", default="output/analysis", help="Output directory for results")
    parser.add_argument("--config", help="Configuration file path")
    
    args = parser.parse_args()
    
    config = None
    if args.config:
        import yaml
        with open(args.config, 'r') as f:
            config = yaml.safe_load(f)
    
    analyzer = DocumentAnalyzer(config)
    results = analyzer.analyze_documents(args.input, args.output)
    
    print(f"Analysis completed. Results saved to: {args.output}")
    print(f"Analyzed {results['summary']['total_documents']} documents")
    print(f"Found {results['summary']['high_risk_documents']} high-risk documents")


if __name__ == "__main__":
    main()