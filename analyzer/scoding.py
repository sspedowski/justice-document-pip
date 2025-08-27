#!/usr/bin/env python3
"""
Content Scoring Module (S-coding)

Provides scoring and classification capabilities for legal document content
based on severity, priority, and legal significance.

S-coding methodology:
- S1: Critical evidence (smoking gun documents)
- S2: High-value evidence (strong supporting material)
- S3: Medium-value evidence (contextual support)
- S4: Low-value evidence (background information)
- S5: Administrative/procedural documents

Usage:
    from analyzer.scoding import ContentScorer
    
    scorer = ContentScorer()
    score = scorer.score_document(text_content, metadata)
"""

import re
import json
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ContentScorer:
    """
    Content scoring engine for legal documents using S-coding methodology.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the content scorer.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or self._default_config()
        self.scoring_rules = self._load_scoring_rules()
        
    def _default_config(self) -> Dict:
        """Return default scoring configuration."""
        return {
            "scoring_method": "weighted_keywords",
            "confidence_threshold": 0.6,
            "priority_keywords": {
                "critical": ["Brady", "perjury", "falsification", "tampering", "obstruction"],
                "high": ["misconduct", "violation", "excessive force", "civil rights"],
                "medium": ["complaint", "incident", "report", "investigation"],
                "low": ["administrative", "procedural", "routine", "standard"]
            },
            "legal_significance_factors": {
                "constitutional_violations": 5.0,
                "criminal_conduct": 4.5,
                "civil_rights_violations": 4.0,
                "policy_violations": 3.0,
                "procedural_issues": 2.0,
                "administrative_matters": 1.0
            }
        }
    
    def _load_scoring_rules(self) -> Dict:
        """Load S-coding scoring rules."""
        return {
            "S1": {
                "score_range": (9.0, 10.0),
                "description": "Critical evidence - smoking gun documents",
                "keywords": [
                    "Brady violation", "falsified", "perjury", "cover-up",
                    "obstruction of justice", "planted evidence", "false testimony",
                    "constitutional violation", "civil rights violation"
                ],
                "patterns": [
                    r"\b(?:Brady|brady)\s+violation\b",
                    r"\bfalsi(?:fied|fication)\b",
                    r"\bperjur[y|ious]\b",
                    r"\bcover[- ]?up\b",
                    r"\bobstruction\s+of\s+justice\b"
                ],
                "weight": 1.0
            },
            "S2": {
                "score_range": (7.0, 8.9),
                "description": "High-value evidence - strong supporting material",
                "keywords": [
                    "excessive force", "misconduct", "unlawful", "improper",
                    "violation", "abuse", "negligence", "failure to report"
                ],
                "patterns": [
                    r"\bexcessive\s+force\b",
                    r"\bmisconduct\b",
                    r"\bunlawful\b",
                    r"\bviolation\b",
                    r"\bfailure\s+to\s+report\b"
                ],
                "weight": 0.8
            },
            "S3": {
                "score_range": (5.0, 6.9),
                "description": "Medium-value evidence - contextual support",
                "keywords": [
                    "complaint", "allegation", "incident", "concerning",
                    "inappropriate", "questionable", "investigation"
                ],
                "patterns": [
                    r"\bcomplaint\b",
                    r"\ballegation\b",
                    r"\bincident\b",
                    r"\binappropriate\b",
                    r"\binvestigation\b"
                ],
                "weight": 0.6
            },
            "S4": {
                "score_range": (3.0, 4.9),
                "description": "Low-value evidence - background information",
                "keywords": [
                    "routine", "standard", "normal", "regular",
                    "administrative", "procedural", "schedule"
                ],
                "patterns": [
                    r"\broutine\b",
                    r"\bstandard\b",
                    r"\badministrative\b",
                    r"\bprocedural\b"
                ],
                "weight": 0.4
            },
            "S5": {
                "score_range": (1.0, 2.9),
                "description": "Administrative/procedural documents",
                "keywords": [
                    "form", "template", "policy", "manual",
                    "guidelines", "instructions", "memo"
                ],
                "patterns": [
                    r"\bform\b",
                    r"\btemplate\b",
                    r"\bpolicy\b",
                    r"\bmanual\b",
                    r"\bguidelines\b"
                ],
                "weight": 0.2
            }
        }
    
    def score_document(self, text: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Score a document using S-coding methodology.
        
        Args:
            text: Document text content
            metadata: Optional document metadata
            
        Returns:
            Dictionary containing scoring results
        """
        if not text.strip():
            return self._empty_score()
        
        # Calculate individual scoring components
        keyword_score = self._calculate_keyword_score(text)
        pattern_score = self._calculate_pattern_score(text)
        legal_significance = self._calculate_legal_significance(text)
        urgency_score = self._calculate_urgency_score(text, metadata)
        
        # Combine scores with weights
        weighted_score = (
            keyword_score * 0.4 +
            pattern_score * 0.3 +
            legal_significance * 0.2 +
            urgency_score * 0.1
        )
        
        # Determine S-code classification
        s_code = self._determine_s_code(weighted_score)
        
        # Calculate confidence
        confidence = self._calculate_confidence(text, weighted_score)
        
        # Generate detailed analysis
        analysis = self._generate_detailed_analysis(text, s_code)
        
        return {
            "s_code": s_code,
            "numeric_score": round(weighted_score, 2),
            "confidence": round(confidence, 2),
            "description": self.scoring_rules[s_code]["description"],
            "score_components": {
                "keyword_score": round(keyword_score, 2),
                "pattern_score": round(pattern_score, 2),
                "legal_significance": round(legal_significance, 2),
                "urgency_score": round(urgency_score, 2)
            },
            "analysis": analysis,
            "scoring_timestamp": datetime.utcnow().isoformat(),
            "scorer_version": "1.0.0"
        }
    
    def _empty_score(self) -> Dict[str, Any]:
        """Return empty/default score for empty documents."""
        return {
            "s_code": "S5",
            "numeric_score": 0.0,
            "confidence": 0.0,
            "description": "Empty or invalid document",
            "score_components": {
                "keyword_score": 0.0,
                "pattern_score": 0.0,
                "legal_significance": 0.0,
                "urgency_score": 0.0
            },
            "analysis": {"error": "Empty document content"},
            "scoring_timestamp": datetime.utcnow().isoformat(),
            "scorer_version": "1.0.0"
        }
    
    def _calculate_keyword_score(self, text: str) -> float:
        """Calculate score based on keyword presence and frequency."""
        text_lower = text.lower()
        total_score = 0.0
        total_weight = 0.0
        
        for s_code, rules in self.scoring_rules.items():
            keywords = rules["keywords"]
            weight = rules["weight"]
            score_range = rules["score_range"]
            
            # Count keyword matches
            matches = 0
            for keyword in keywords:
                matches += len(re.findall(rf'\b{re.escape(keyword.lower())}\b', text_lower))
            
            if matches > 0:
                # Calculate score based on frequency and position in score range
                frequency_factor = min(matches / 10.0, 1.0)  # Cap at 10 mentions
                keyword_score = score_range[0] + (score_range[1] - score_range[0]) * frequency_factor
                
                total_score += keyword_score * weight
                total_weight += weight
        
        return total_score / total_weight if total_weight > 0 else 0.0
    
    def _calculate_pattern_score(self, text: str) -> float:
        """Calculate score based on pattern matching."""
        total_score = 0.0
        total_weight = 0.0
        
        for s_code, rules in self.scoring_rules.items():
            patterns = rules["patterns"]
            weight = rules["weight"]
            score_range = rules["score_range"]
            
            # Count pattern matches
            matches = 0
            for pattern in patterns:
                matches += len(re.findall(pattern, text, re.IGNORECASE))
            
            if matches > 0:
                frequency_factor = min(matches / 5.0, 1.0)  # Cap at 5 pattern matches
                pattern_score = score_range[0] + (score_range[1] - score_range[0]) * frequency_factor
                
                total_score += pattern_score * weight
                total_weight += weight
        
        return total_score / total_weight if total_weight > 0 else 0.0
    
    def _calculate_legal_significance(self, text: str) -> float:
        """Calculate legal significance score."""
        text_lower = text.lower()
        significance_factors = self.config["legal_significance_factors"]
        
        total_score = 0.0
        factor_count = 0
        
        # Constitutional violations
        const_patterns = [
            r'\bconstitutional\s+violation\b',
            r'\bfourth\s+amendment\b',
            r'\bfifth\s+amendment\b',
            r'\bdue\s+process\b'
        ]
        if any(re.search(pattern, text_lower) for pattern in const_patterns):
            total_score += significance_factors["constitutional_violations"]
            factor_count += 1
        
        # Criminal conduct
        criminal_patterns = [
            r'\bcriminal\b',
            r'\bfelony\b',
            r'\bmisdemeanor\b',
            r'\bperjury\b',
            r'\bobstruction\b'
        ]
        if any(re.search(pattern, text_lower) for pattern in criminal_patterns):
            total_score += significance_factors["criminal_conduct"]
            factor_count += 1
        
        # Civil rights violations
        civil_patterns = [
            r'\bcivil\s+rights\b',
            r'\bdiscrimination\b',
            r'\bequal\s+protection\b'
        ]
        if any(re.search(pattern, text_lower) for pattern in civil_patterns):
            total_score += significance_factors["civil_rights_violations"]
            factor_count += 1
        
        # Policy violations
        policy_patterns = [
            r'\bpolicy\s+violation\b',
            r'\bprocedural\s+violation\b',
            r'\bmisconduct\b'
        ]
        if any(re.search(pattern, text_lower) for pattern in policy_patterns):
            total_score += significance_factors["policy_violations"]
            factor_count += 1
        
        # Default to administrative if no other factors found
        if factor_count == 0:
            total_score = significance_factors["administrative_matters"]
            factor_count = 1
        
        # Normalize to 0-10 scale
        average_significance = total_score / factor_count
        return min(average_significance * 2, 10.0)  # Scale up and cap at 10
    
    def _calculate_urgency_score(self, text: str, metadata: Optional[Dict] = None) -> float:
        """Calculate urgency score based on temporal factors and severity indicators."""
        urgency_indicators = [
            r'\bimmediate\b',
            r'\burgent\b',
            r'\bemergency\b',
            r'\bcritical\b',
            r'\bhigh\s+priority\b',
            r'\btime[- ]?sensitive\b'
        ]
        
        urgency_count = sum(len(re.findall(pattern, text, re.IGNORECASE)) 
                          for pattern in urgency_indicators)
        
        # Base urgency score
        base_score = min(urgency_count * 2.0, 10.0)
        
        # Adjust based on metadata if available
        if metadata:
            # Recent documents might be more urgent
            creation_time = metadata.get("creation_time")
            if creation_time:
                try:
                    from datetime import datetime
                    created = datetime.fromisoformat(creation_time.replace('Z', '+00:00'))
                    days_old = (datetime.now().replace(tzinfo=created.tzinfo) - created).days
                    
                    if days_old < 7:
                        base_score += 2.0  # Recent documents get urgency boost
                    elif days_old < 30:
                        base_score += 1.0
                except:
                    pass  # Skip if date parsing fails
        
        return min(base_score, 10.0)
    
    def _determine_s_code(self, score: float) -> str:
        """Determine S-code classification based on numeric score."""
        for s_code, rules in self.scoring_rules.items():
            score_range = rules["score_range"]
            if score_range[0] <= score <= score_range[1]:
                return s_code
        
        # Default fallback
        return "S5"
    
    def _calculate_confidence(self, text: str, score: float) -> float:
        """Calculate confidence in the scoring result."""
        # Base confidence on text length and keyword density
        word_count = len(text.split())
        
        if word_count < 10:
            base_confidence = 0.3
        elif word_count < 50:
            base_confidence = 0.6
        elif word_count < 200:
            base_confidence = 0.8
        else:
            base_confidence = 0.9
        
        # Adjust based on score extremes (very high or very low scores are more confident)
        if score >= 9.0 or score <= 2.0:
            confidence_adjustment = 0.2
        elif score >= 7.0 or score <= 4.0:
            confidence_adjustment = 0.1
        else:
            confidence_adjustment = 0.0
        
        return min(base_confidence + confidence_adjustment, 1.0)
    
    def _generate_detailed_analysis(self, text: str, s_code: str) -> Dict[str, Any]:
        """Generate detailed analysis of the scoring decision."""
        analysis = {
            "s_code_justification": self.scoring_rules[s_code]["description"],
            "key_indicators": [],
            "risk_factors": [],
            "legal_implications": [],
            "recommendations": []
        }
        
        # Find key indicators that contributed to the score
        rules = self.scoring_rules[s_code]
        text_lower = text.lower()
        
        for keyword in rules["keywords"]:
            if keyword.lower() in text_lower:
                analysis["key_indicators"].append(f"Keyword: {keyword}")
        
        for pattern in rules["patterns"]:
            if re.search(pattern, text, re.IGNORECASE):
                analysis["key_indicators"].append(f"Pattern: {pattern}")
        
        # Add risk factors for high-scoring documents
        if s_code in ["S1", "S2"]:
            analysis["risk_factors"] = [
                "High evidentiary value",
                "Potential legal liability",
                "Public interest concern",
                "Oversight requirement"
            ]
            
            analysis["legal_implications"] = [
                "May require immediate legal review",
                "Potential constitutional implications",
                "Evidence preservation required",
                "Disclosure obligations may apply"
            ]
            
            analysis["recommendations"] = [
                "Immediate attorney review recommended",
                "Preserve all related evidence",
                "Consider disclosure requirements",
                "Flag for oversight committee"
            ]
        
        return analysis
    
    def score_batch(self, documents: List[Tuple[str, str, Optional[Dict]]]) -> List[Dict[str, Any]]:
        """
        Score a batch of documents.
        
        Args:
            documents: List of tuples (doc_id, text, metadata)
            
        Returns:
            List of scoring results
        """
        results = []
        
        for doc_id, text, metadata in documents:
            try:
                score_result = self.score_document(text, metadata)
                score_result["document_id"] = doc_id
                results.append(score_result)
            except Exception as e:
                logger.error(f"Error scoring document {doc_id}: {e}")
                results.append({
                    "document_id": doc_id,
                    "error": str(e),
                    "s_code": "S5",
                    "numeric_score": 0.0,
                    "confidence": 0.0
                })
        
        return results
    
    def generate_scoring_report(self, scored_documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a comprehensive scoring report."""
        total_docs = len(scored_documents)
        
        # Count by S-code
        s_code_counts = {}
        for doc in scored_documents:
            s_code = doc.get("s_code", "S5")
            s_code_counts[s_code] = s_code_counts.get(s_code, 0) + 1
        
        # Calculate statistics
        scores = [doc.get("numeric_score", 0) for doc in scored_documents]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        # High-priority documents (S1, S2)
        high_priority = [doc for doc in scored_documents 
                        if doc.get("s_code") in ["S1", "S2"]]
        
        return {
            "total_documents": total_docs,
            "s_code_distribution": s_code_counts,
            "average_score": round(avg_score, 2),
            "high_priority_count": len(high_priority),
            "high_priority_percentage": round(len(high_priority) / total_docs * 100, 1) if total_docs > 0 else 0,
            "scoring_statistics": {
                "min_score": min(scores) if scores else 0,
                "max_score": max(scores) if scores else 0,
                "median_score": sorted(scores)[len(scores)//2] if scores else 0
            },
            "report_generated": datetime.utcnow().isoformat()
        }


def main():
    """Command-line interface for content scoring."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Score legal document content using S-coding")
    parser.add_argument("--input", required=True, help="Input file or directory")
    parser.add_argument("--output", default="output/scoring", help="Output directory")
    parser.add_argument("--format", choices=["json", "csv", "txt"], default="json", 
                       help="Output format")
    
    args = parser.parse_args()
    
    scorer = ContentScorer()
    
    from pathlib import Path
    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)
    
    if input_path.is_file():
        # Score single file
        text = input_path.read_text(encoding='utf-8', errors='ignore')
        result = scorer.score_document(text)
        
        output_file = output_path / f"score_{input_path.stem}.{args.format}"
        
        if args.format == "json":
            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)
        else:
            with open(output_file, 'w') as f:
                f.write(f"Document: {input_path.name}\n")
                f.write(f"S-Code: {result['s_code']}\n")
                f.write(f"Score: {result['numeric_score']}\n")
                f.write(f"Confidence: {result['confidence']}\n")
                f.write(f"Description: {result['description']}\n")
        
        print(f"Scored document: {input_path.name}")
        print(f"S-Code: {result['s_code']}")
        print(f"Score: {result['numeric_score']}")
        print(f"Results saved to: {output_file}")
    
    else:
        # Score directory
        documents = []
        for file_path in input_path.glob("*.txt"):
            text = file_path.read_text(encoding='utf-8', errors='ignore')
            documents.append((file_path.name, text, None))
        
        results = scorer.score_batch(documents)
        report = scorer.generate_scoring_report(results)
        
        # Save results
        results_file = output_path / f"scoring_results.{args.format}"
        report_file = output_path / "scoring_report.json"
        
        if args.format == "json":
            with open(results_file, 'w') as f:
                json.dump(results, f, indent=2)
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"Scored {len(documents)} documents")
        print(f"High priority documents: {report['high_priority_count']}")
        print(f"Results saved to: {results_file}")
        print(f"Report saved to: {report_file}")


if __name__ == "__main__":
    main()