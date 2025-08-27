#!/usr/bin/env python3
"""
Document Evaluation Module

Provides comprehensive evaluation capabilities for legal documents including:
- Evidence quality assessment
- Legal precedence evaluation
- Admissibility analysis
- Chain of custody verification
- Evidentiary value scoring

Usage:
    from analyzer.evaluate import DocumentEvaluator
    
    evaluator = DocumentEvaluator()
    evaluation = evaluator.evaluate_document(text, metadata, context)
"""

import re
import json
from typing import Dict, List, Tuple, Optional, Any, Set
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class DocumentEvaluator:
    """
    Comprehensive document evaluation engine for legal proceedings.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the document evaluator.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or self._default_config()
        self.evaluation_criteria = self._load_evaluation_criteria()
        self.precedence_database = self._load_precedence_patterns()
        
    def _default_config(self) -> Dict:
        """Return default evaluation configuration."""
        return {
            "evaluation_framework": "comprehensive",
            "admissibility_rules": ["federal", "state", "civil", "criminal"],
            "chain_of_custody_required": True,
            "authenticity_verification": True,
            "prejudicial_value_assessment": True,
            "privilege_screening": True,
            "evidence_standards": {
                "relevance_threshold": 0.7,
                "reliability_threshold": 0.8,
                "authenticity_threshold": 0.9,
                "prejudicial_limit": 0.6
            },
            "document_types": {
                "primary_evidence": 1.0,
                "secondary_evidence": 0.8,
                "hearsay": 0.6,
                "expert_opinion": 0.9,
                "administrative": 0.4
            }
        }
    
    def _load_evaluation_criteria(self) -> Dict:
        """Load evaluation criteria for different document types."""
        return {
            "admissibility": {
                "relevance": {
                    "weight": 0.25,
                    "factors": [
                        "direct_relation_to_case",
                        "material_fact_tendency",
                        "probative_value",
                        "logical_connection"
                    ]
                },
                "reliability": {
                    "weight": 0.25,
                    "factors": [
                        "source_credibility",
                        "chain_of_custody",
                        "authentication_markers",
                        "corroborating_evidence"
                    ]
                },
                "authenticity": {
                    "weight": 0.25,
                    "factors": [
                        "document_integrity",
                        "author_verification",
                        "timestamp_accuracy",
                        "format_consistency"
                    ]
                },
                "prejudicial_impact": {
                    "weight": 0.25,
                    "factors": [
                        "unfair_prejudice_risk",
                        "misleading_potential",
                        "emotional_impact",
                        "confusion_likelihood"
                    ]
                }
            },
            "evidence_quality": {
                "primary_source": {
                    "score_multiplier": 1.0,
                    "indicators": [
                        "first_hand_account",
                        "original_document",
                        "direct_observation",
                        "contemporaneous_record"
                    ]
                },
                "secondary_source": {
                    "score_multiplier": 0.8,
                    "indicators": [
                        "summary_document",
                        "compiled_report",
                        "referenced_material",
                        "derived_analysis"
                    ]
                },
                "tertiary_source": {
                    "score_multiplier": 0.6,
                    "indicators": [
                        "interpretation",
                        "commentary",
                        "opinion_piece",
                        "speculative_analysis"
                    ]
                }
            }
        }
    
    def _load_precedence_patterns(self) -> Dict:
        """Load legal precedence and citation patterns."""
        return {
            "federal_cases": [
                r'\b\d+\s+U\.S\.\s+\d+\b',
                r'\b\d+\s+S\.\s?Ct\.\s+\d+\b',
                r'\b\d+\s+F\.\d+d?\s+\d+\b'
            ],
            "state_cases": [
                r'\b\d+\s+[A-Z][a-z]+\.?\s+\d+\b',
                r'\b\d+\s+[A-Z][a-z]+\.?\s+App\.?\s+\d+\b'
            ],
            "statutes": [
                r'\b\d+\s+U\.S\.C\.?\s+§?\s*\d+\b',
                r'\b[A-Z][a-z]+\.?\s+Code\s+§?\s*\d+\b',
                r'\b[A-Z][a-z]+\.?\s+Stat\.?\s+§?\s*\d+\b'
            ],
            "regulations": [
                r'\b\d+\s+C\.F\.R\.?\s+§?\s*\d+\b',
                r'\bFed\.?\s+Reg\.?\s+\d+\b'
            ],
            "constitutional": [
                r'\bU\.S\.\s+Const\.?\s+[Aa]rt\.?\s+[IVXLC]+\b',
                r'\bU\.S\.\s+Const\.?\s+[Aa]mend\.?\s+[IVXLC]+\b'
            ]
        }
    
    def evaluate_document(self, text: str, metadata: Optional[Dict] = None, 
                         context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Perform comprehensive evaluation of a legal document.
        
        Args:
            text: Document text content
            metadata: Document metadata (creation time, author, etc.)
            context: Case context and related documents
            
        Returns:
            Dictionary containing comprehensive evaluation results
        """
        if not text.strip():
            return self._empty_evaluation()
        
        # Core evaluation components
        admissibility = self._evaluate_admissibility(text, metadata, context)
        evidence_quality = self._assess_evidence_quality(text, metadata)
        legal_significance = self._analyze_legal_significance(text)
        authenticity = self._verify_authenticity(text, metadata)
        privilege_issues = self._screen_privilege(text)
        
        # Calculate overall evaluation score
        overall_score = self._calculate_overall_score(
            admissibility, evidence_quality, legal_significance, authenticity
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            admissibility, evidence_quality, legal_significance, privilege_issues
        )
        
        # Risk assessment
        risks = self._assess_risks(text, metadata, admissibility, privilege_issues)
        
        return {
            "overall_score": round(overall_score, 2),
            "overall_rating": self._score_to_rating(overall_score),
            "admissibility": admissibility,
            "evidence_quality": evidence_quality,
            "legal_significance": legal_significance,
            "authenticity": authenticity,
            "privilege_issues": privilege_issues,
            "recommendations": recommendations,
            "risks": risks,
            "evaluation_metadata": {
                "timestamp": datetime.utcnow().isoformat(),
                "evaluator_version": "1.0.0",
                "framework": self.config["evaluation_framework"]
            }
        }
    
    def _empty_evaluation(self) -> Dict[str, Any]:
        """Return empty evaluation for invalid documents."""
        return {
            "overall_score": 0.0,
            "overall_rating": "INVALID",
            "error": "Empty or invalid document content",
            "evaluation_metadata": {
                "timestamp": datetime.utcnow().isoformat(),
                "evaluator_version": "1.0.0",
                "framework": self.config["evaluation_framework"]
            }
        }
    
    def _evaluate_admissibility(self, text: str, metadata: Optional[Dict] = None,
                               context: Optional[Dict] = None) -> Dict[str, Any]:
        """Evaluate document admissibility under evidence rules."""
        criteria = self.evaluation_criteria["admissibility"]
        
        # Relevance assessment
        relevance_score = self._assess_relevance(text, context)
        
        # Reliability assessment
        reliability_score = self._assess_reliability(text, metadata)
        
        # Authenticity assessment
        authenticity_score = self._assess_authenticity_markers(text, metadata)
        
        # Prejudicial impact assessment
        prejudicial_score = self._assess_prejudicial_impact(text)
        
        # Weighted total
        total_score = (
            relevance_score * criteria["relevance"]["weight"] +
            reliability_score * criteria["reliability"]["weight"] +
            authenticity_score * criteria["authenticity"]["weight"] +
            (1.0 - prejudicial_score) * criteria["prejudicial_impact"]["weight"]
        )
        
        # Rule-specific assessments
        hearsay_issues = self._detect_hearsay_issues(text)
        best_evidence_rule = self._assess_best_evidence_rule(text, metadata)
        character_evidence = self._assess_character_evidence(text)
        
        return {
            "total_score": round(total_score, 2),
            "admissibility_rating": self._score_to_admissibility_rating(total_score),
            "component_scores": {
                "relevance": round(relevance_score, 2),
                "reliability": round(reliability_score, 2),
                "authenticity": round(authenticity_score, 2),
                "prejudicial_impact": round(prejudicial_score, 2)
            },
            "rule_assessments": {
                "hearsay_issues": hearsay_issues,
                "best_evidence_rule": best_evidence_rule,
                "character_evidence": character_evidence
            },
            "evidentiary_objections": self._predict_objections(
                relevance_score, reliability_score, prejudicial_score, hearsay_issues
            )
        }
    
    def _assess_relevance(self, text: str, context: Optional[Dict] = None) -> float:
        """Assess relevance to the case or legal matter."""
        text_lower = text.lower()
        
        # Base relevance indicators
        relevance_indicators = [
            r'\b(?:relevant|material|probative|tends to prove)\b',
            r'\b(?:incident|event|occurrence)\b',
            r'\b(?:witness|observed|saw|heard)\b',
            r'\b(?:evidence|proof|demonstrates)\b'
        ]
        
        indicator_count = sum(len(re.findall(pattern, text_lower)) 
                            for pattern in relevance_indicators)
        
        base_score = min(indicator_count * 0.15, 1.0)
        
        # Context-based adjustment
        if context:
            case_keywords = context.get("keywords", [])
            parties = context.get("parties", [])
            issues = context.get("legal_issues", [])
            
            context_matches = 0
            for keyword in case_keywords:
                if keyword.lower() in text_lower:
                    context_matches += 1
            
            for party in parties:
                if party.lower() in text_lower:
                    context_matches += 2  # Party mentions are highly relevant
            
            for issue in issues:
                if issue.lower() in text_lower:
                    context_matches += 1.5
            
            context_score = min(context_matches * 0.1, 0.5)
            base_score += context_score
        
        return min(base_score, 1.0)
    
    def _assess_reliability(self, text: str, metadata: Optional[Dict] = None) -> float:
        """Assess reliability of the document source."""
        reliability_factors = {
            "official_source": 0.3,
            "sworn_statement": 0.25,
            "contemporaneous": 0.2,
            "corroborated": 0.15,
            "chain_of_custody": 0.1
        }
        
        reliability_score = 0.0
        text_lower = text.lower()
        
        # Official source indicators
        official_patterns = [
            r'\b(?:official|government|agency|department)\b',
            r'\b(?:court|police|sheriff|federal)\b',
            r'\b(?:certified|notarized|sealed)\b'
        ]
        if any(re.search(pattern, text_lower) for pattern in official_patterns):
            reliability_score += reliability_factors["official_source"]
        
        # Sworn statement indicators
        sworn_patterns = [
            r'\b(?:sworn|affirmed|oath|under penalty)\b',
            r'\b(?:affidavit|declaration|deposition)\b'
        ]
        if any(re.search(pattern, text_lower) for pattern in sworn_patterns):
            reliability_score += reliability_factors["sworn_statement"]
        
        # Contemporaneous record indicators
        if self._is_contemporaneous_record(text, metadata):
            reliability_score += reliability_factors["contemporaneous"]
        
        # Corroboration indicators
        corroboration_patterns = [
            r'\b(?:confirmed|verified|corroborated)\b',
            r'\b(?:consistent with|matches|aligns with)\b'
        ]
        if any(re.search(pattern, text_lower) for pattern in corroboration_patterns):
            reliability_score += reliability_factors["corroborated"]
        
        # Chain of custody
        if self._has_chain_of_custody_indicators(text, metadata):
            reliability_score += reliability_factors["chain_of_custody"]
        
        return min(reliability_score, 1.0)
    
    def _assess_authenticity_markers(self, text: str, metadata: Optional[Dict] = None) -> float:
        """Assess document authenticity markers."""
        authenticity_score = 0.0
        
        # Digital signatures or certification
        if self._has_digital_signatures(text, metadata):
            authenticity_score += 0.3
        
        # Consistent formatting
        if self._has_consistent_formatting(text):
            authenticity_score += 0.2
        
        # Proper headers/footers
        if self._has_proper_document_structure(text):
            authenticity_score += 0.2
        
        # Author identification
        if self._has_author_identification(text):
            authenticity_score += 0.15
        
        # Timestamp consistency
        if self._has_consistent_timestamps(text, metadata):
            authenticity_score += 0.15
        
        return min(authenticity_score, 1.0)
    
    def _assess_prejudicial_impact(self, text: str) -> float:
        """Assess potential for unfair prejudice."""
        text_lower = text.lower()
        
        # High-prejudice indicators
        prejudicial_patterns = [
            r'\b(?:inflammatory|sensational|shocking)\b',
            r'\b(?:gruesome|horrific|disgusting)\b',
            r'\b(?:criminal|felon|convict)\b',
            r'\b(?:drugs|alcohol|addiction)\b',
            r'\b(?:violent|aggressive|dangerous)\b'
        ]
        
        prejudicial_count = sum(len(re.findall(pattern, text_lower)) 
                              for pattern in prejudicial_patterns)
        
        # Emotional language indicators
        emotional_patterns = [
            r'\b(?:terrible|awful|horrible|devastating)\b',
            r'\b(?:victim|suffer|pain|trauma)\b',
            r'\b(?:evil|wicked|malicious)\b'
        ]
        
        emotional_count = sum(len(re.findall(pattern, text_lower)) 
                            for pattern in emotional_patterns)
        
        # Character assassination indicators
        character_patterns = [
            r'\b(?:bad character|prior bad acts|criminal history)\b',
            r'\b(?:untrustworthy|dishonest|liar)\b'
        ]
        
        character_count = sum(len(re.findall(pattern, text_lower)) 
                            for pattern in character_patterns)
        
        # Calculate prejudicial score
        total_indicators = prejudicial_count + emotional_count * 0.8 + character_count * 1.2
        prejudicial_score = min(total_indicators * 0.1, 1.0)
        
        return prejudicial_score
    
    def _assess_evidence_quality(self, text: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Assess the quality of evidence presented in the document."""
        quality_criteria = self.evaluation_criteria["evidence_quality"]
        
        # Determine evidence type
        evidence_type = self._classify_evidence_type(text)
        source_quality = self._assess_source_quality(text, metadata)
        corroboration = self._assess_corroboration_potential(text)
        completeness = self._assess_evidence_completeness(text)
        
        # Apply multiplier based on evidence type
        type_multiplier = quality_criteria[evidence_type]["score_multiplier"]
        
        # Calculate weighted quality score
        quality_score = (
            source_quality * 0.4 +
            corroboration * 0.3 +
            completeness * 0.3
        ) * type_multiplier
        
        return {
            "overall_quality": round(quality_score, 2),
            "evidence_type": evidence_type,
            "source_quality": round(source_quality, 2),
            "corroboration_potential": round(corroboration, 2),
            "completeness": round(completeness, 2),
            "quality_rating": self._score_to_quality_rating(quality_score)
        }
    
    def _classify_evidence_type(self, text: str) -> str:
        """Classify the type of evidence based on content."""
        text_lower = text.lower()
        
        # Primary source indicators
        primary_indicators = [
            r'\b(?:witnessed|observed|saw|heard)\b',
            r'\b(?:original|first-hand|direct)\b',
            r'\b(?:contemporaneous|immediate|real-time)\b'
        ]
        
        if any(re.search(pattern, text_lower) for pattern in primary_indicators):
            return "primary_source"
        
        # Secondary source indicators
        secondary_indicators = [
            r'\b(?:report|summary|compilation)\b',
            r'\b(?:based on|derived from|according to)\b',
            r'\b(?:analysis|review|evaluation)\b'
        ]
        
        if any(re.search(pattern, text_lower) for pattern in secondary_indicators):
            return "secondary_source"
        
        # Default to tertiary
        return "tertiary_source"
    
    def _analyze_legal_significance(self, text: str) -> Dict[str, Any]:
        """Analyze the legal significance of the document."""
        text_lower = text.lower()
        
        # Legal precedence analysis
        precedence_citations = self._find_legal_citations(text)
        
        # Constitutional issues
        constitutional_issues = self._identify_constitutional_issues(text)
        
        # Statutory violations
        statutory_violations = self._identify_statutory_violations(text)
        
        # Procedural significance
        procedural_significance = self._assess_procedural_significance(text)
        
        # Calculate significance score
        significance_factors = {
            "constitutional": len(constitutional_issues) * 0.3,
            "statutory": len(statutory_violations) * 0.25,
            "precedential": len(precedence_citations) * 0.2,
            "procedural": procedural_significance * 0.25
        }
        
        total_significance = sum(significance_factors.values())
        normalized_significance = min(total_significance, 1.0)
        
        return {
            "overall_significance": round(normalized_significance, 2),
            "significance_rating": self._score_to_significance_rating(normalized_significance),
            "constitutional_issues": constitutional_issues,
            "statutory_violations": statutory_violations,
            "legal_citations": precedence_citations,
            "procedural_significance": round(procedural_significance, 2),
            "significance_factors": {k: round(v, 2) for k, v in significance_factors.items()}
        }
    
    def _find_legal_citations(self, text: str) -> Dict[str, List[str]]:
        """Find and categorize legal citations in the text."""
        citations = {}
        
        for category, patterns in self.precedence_database.items():
            citations[category] = []
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                citations[category].extend(matches)
        
        return citations
    
    def _identify_constitutional_issues(self, text: str) -> List[str]:
        """Identify constitutional law issues mentioned in the text."""
        text_lower = text.lower()
        
        constitutional_issues = []
        
        # Amendment-specific issues
        amendments = {
            "First Amendment": r"\b(?:first amendment|freedom of speech|religion|press|assembly)\b",
            "Fourth Amendment": r"\b(?:fourth amendment|search|seizure|warrant|probable cause)\b",
            "Fifth Amendment": r"\b(?:fifth amendment|due process|self-incrimination|miranda)\b",
            "Sixth Amendment": r"\b(?:sixth amendment|right to counsel|speedy trial|confrontation)\b",
            "Eighth Amendment": r"\b(?:eighth amendment|cruel|unusual punishment|excessive bail)\b",
            "Fourteenth Amendment": r"\b(?:fourteenth amendment|equal protection|due process)\b"
        }
        
        for amendment, pattern in amendments.items():
            if re.search(pattern, text_lower):
                constitutional_issues.append(amendment)
        
        # General constitutional concepts
        constitutional_concepts = [
            r"\b(?:constitutional violation|constitutional rights)\b",
            r"\b(?:civil rights|civil liberties)\b",
            r"\b(?:separation of powers|federalism)\b"
        ]
        
        for pattern in constitutional_concepts:
            if re.search(pattern, text_lower):
                constitutional_issues.append("General Constitutional Issue")
                break
        
        return list(set(constitutional_issues))
    
    def _identify_statutory_violations(self, text: str) -> List[str]:
        """Identify potential statutory violations mentioned in the text."""
        text_lower = text.lower()
        
        violations = []
        
        # Federal statutes
        federal_statutes = {
            "18 USC 1983": r"\b(?:section 1983|civil rights violation|color of law)\b",
            "18 USC 242": r"\b(?:section 242|civil rights|willful deprivation)\b",
            "Brady Rule": r"\b(?:brady|exculpatory evidence|material evidence)\b",
            "Giglio Rule": r"\b(?:giglio|impeachment|credibility)\b"
        }
        
        for statute, pattern in federal_statutes.items():
            if re.search(pattern, text_lower):
                violations.append(statute)
        
        # Criminal statutes
        criminal_patterns = [
            r"\b(?:perjury|false statement|obstruction)\b",
            r"\b(?:conspiracy|attempt|solicitation)\b",
            r"\b(?:fraud|embezzlement|theft)\b"
        ]
        
        for pattern in criminal_patterns:
            if re.search(pattern, text_lower):
                violations.append("Criminal Statute Violation")
                break
        
        return list(set(violations))
    
    def _assess_procedural_significance(self, text: str) -> float:
        """Assess procedural legal significance."""
        text_lower = text.lower()
        
        procedural_indicators = [
            r"\b(?:motion|hearing|trial|proceeding)\b",
            r"\b(?:discovery|deposition|interrogatory)\b",
            r"\b(?:appeal|review|remand)\b",
            r"\b(?:jurisdiction|venue|standing)\b",
            r"\b(?:statute of limitations|procedural bar)\b"
        ]
        
        indicator_count = sum(len(re.findall(pattern, text_lower)) 
                            for pattern in procedural_indicators)
        
        return min(indicator_count * 0.15, 1.0)
    
    def _verify_authenticity(self, text: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Perform comprehensive authenticity verification."""
        authenticity_checks = {
            "format_consistency": self._check_format_consistency(text),
            "metadata_integrity": self._check_metadata_integrity(metadata),
            "content_integrity": self._check_content_integrity(text),
            "source_verification": self._verify_source(text, metadata),
            "temporal_consistency": self._check_temporal_consistency(text, metadata)
        }
        
        # Calculate overall authenticity score
        scores = [score for score in authenticity_checks.values() if isinstance(score, (int, float))]
        overall_authenticity = sum(scores) / len(scores) if scores else 0.0
        
        # Risk assessment
        authenticity_risks = self._assess_authenticity_risks(authenticity_checks)
        
        return {
            "overall_authenticity": round(overall_authenticity, 2),
            "authenticity_rating": self._score_to_authenticity_rating(overall_authenticity),
            "check_results": authenticity_checks,
            "authenticity_risks": authenticity_risks,
            "verification_confidence": self._calculate_verification_confidence(authenticity_checks)
        }
    
    def _screen_privilege(self, text: str) -> Dict[str, Any]:
        """Screen for privileged communications and protected information."""
        text_lower = text.lower()
        
        privilege_issues = {
            "attorney_client": self._detect_attorney_client_privilege(text_lower),
            "work_product": self._detect_work_product_doctrine(text_lower),
            "medical": self._detect_medical_privilege(text_lower),
            "spousal": self._detect_spousal_privilege(text_lower),
            "executive": self._detect_executive_privilege(text_lower),
            "law_enforcement": self._detect_law_enforcement_privilege(text_lower)
        }
        
        # Calculate privilege risk score
        privilege_indicators = sum(1 for issue in privilege_issues.values() if issue["detected"])
        privilege_risk = min(privilege_indicators * 0.2, 1.0)
        
        return {
            "privilege_risk_score": round(privilege_risk, 2),
            "privilege_risk_level": self._score_to_risk_level(privilege_risk),
            "detected_privileges": privilege_issues,
            "recommendations": self._generate_privilege_recommendations(privilege_issues)
        }
    
    def _detect_attorney_client_privilege(self, text_lower: str) -> Dict[str, Any]:
        """Detect attorney-client privileged communications."""
        ac_patterns = [
            r"\b(?:attorney|lawyer|counsel)\b.*\b(?:client|confidential)\b",
            r"\b(?:legal advice|legal opinion|attorney consultation)\b",
            r"\b(?:privileged|confidential communication)\b"
        ]
        
        detected = any(re.search(pattern, text_lower) for pattern in ac_patterns)
        
        return {
            "detected": detected,
            "confidence": 0.8 if detected else 0.0,
            "indicators": [pattern for pattern in ac_patterns if re.search(pattern, text_lower)]
        }
    
    def _detect_work_product_doctrine(self, text_lower: str) -> Dict[str, Any]:
        """Detect work product doctrine protections."""
        wp_patterns = [
            r"\b(?:litigation strategy|trial preparation)\b",
            r"\b(?:attorney notes|legal research)\b",
            r"\b(?:case strategy|defense strategy)\b"
        ]
        
        detected = any(re.search(pattern, text_lower) for pattern in wp_patterns)
        
        return {
            "detected": detected,
            "confidence": 0.7 if detected else 0.0,
            "indicators": [pattern for pattern in wp_patterns if re.search(pattern, text_lower)]
        }
    
    def _detect_medical_privilege(self, text_lower: str) -> Dict[str, Any]:
        """Detect medical privilege issues."""
        medical_patterns = [
            r"\b(?:doctor|physician|medical)\b.*\b(?:patient|confidential)\b",
            r"\b(?:medical records|health information|hipaa)\b",
            r"\b(?:diagnosis|treatment|therapy)\b"
        ]
        
        detected = any(re.search(pattern, text_lower) for pattern in medical_patterns)
        
        return {
            "detected": detected,
            "confidence": 0.6 if detected else 0.0,
            "indicators": [pattern for pattern in medical_patterns if re.search(pattern, text_lower)]
        }
    
    def _detect_spousal_privilege(self, text_lower: str) -> Dict[str, Any]:
        """Detect spousal privilege issues."""
        spousal_patterns = [
            r"\b(?:husband|wife|spouse)\b.*\b(?:confidential|private)\b",
            r"\b(?:marital communication|spousal privilege)\b"
        ]
        
        detected = any(re.search(pattern, text_lower) for pattern in spousal_patterns)
        
        return {
            "detected": detected,
            "confidence": 0.5 if detected else 0.0,
            "indicators": [pattern for pattern in spousal_patterns if re.search(pattern, text_lower)]
        }
    
    def _detect_executive_privilege(self, text_lower: str) -> Dict[str, Any]:
        """Detect executive privilege issues."""
        exec_patterns = [
            r"\b(?:executive privilege|presidential)\b",
            r"\b(?:classified|national security)\b",
            r"\b(?:state secrets|government privilege)\b"
        ]
        
        detected = any(re.search(pattern, text_lower) for pattern in exec_patterns)
        
        return {
            "detected": detected,
            "confidence": 0.9 if detected else 0.0,
            "indicators": [pattern for pattern in exec_patterns if re.search(pattern, text_lower)]
        }
    
    def _detect_law_enforcement_privilege(self, text_lower: str) -> Dict[str, Any]:
        """Detect law enforcement privilege issues."""
        le_patterns = [
            r"\b(?:informant|confidential source)\b",
            r"\b(?:ongoing investigation|investigative technique)\b",
            r"\b(?:police privilege|law enforcement sensitive)\b"
        ]
        
        detected = any(re.search(pattern, text_lower) for pattern in le_patterns)
        
        return {
            "detected": detected,
            "confidence": 0.7 if detected else 0.0,
            "indicators": [pattern for pattern in le_patterns if re.search(pattern, text_lower)]
        }
    
    # Helper methods for various assessments
    def _is_contemporaneous_record(self, text: str, metadata: Optional[Dict] = None) -> bool:
        """Check if document appears to be a contemporaneous record."""
        # Implementation would check timestamps, creation dates, etc.
        return False  # Simplified for now
    
    def _has_chain_of_custody_indicators(self, text: str, metadata: Optional[Dict] = None) -> bool:
        """Check for chain of custody indicators."""
        custody_patterns = [
            r"\b(?:chain of custody|custody|evidence)\b",
            r"\b(?:collected|seized|received)\b",
            r"\b(?:stored|maintained|transferred)\b"
        ]
        return any(re.search(pattern, text, re.IGNORECASE) for pattern in custody_patterns)
    
    def _has_digital_signatures(self, text: str, metadata: Optional[Dict] = None) -> bool:
        """Check for digital signature indicators."""
        return "digital signature" in text.lower() or "electronically signed" in text.lower()
    
    def _has_consistent_formatting(self, text: str) -> bool:
        """Check for consistent document formatting."""
        # Simplified check for consistent spacing and structure
        lines = text.split('\n')
        if len(lines) < 5:
            return True
        
        # Check for consistent indentation patterns
        indentations = [len(line) - len(line.lstrip()) for line in lines if line.strip()]
        consistent_indent = len(set(indentations)) <= 3  # Allow up to 3 indent levels
        
        return consistent_indent
    
    def _has_proper_document_structure(self, text: str) -> bool:
        """Check for proper document structure (headers, footers, etc.)."""
        has_header = bool(re.search(r'^[A-Z\s]{10,}$', text[:200], re.MULTILINE))
        has_signature = bool(re.search(r'\b(?:signed|signature|s/)\b', text.lower()))
        return has_header or has_signature
    
    def _has_author_identification(self, text: str) -> bool:
        """Check for author identification."""
        author_patterns = [
            r'\b(?:by|author|prepared by|signed by)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b',
            r'\b[A-Z][a-z]+\s+[A-Z][a-z]+,\s+(?:MD|JD|PhD|Esq)\b'
        ]
        return any(re.search(pattern, text) for pattern in author_patterns)
    
    def _has_consistent_timestamps(self, text: str, metadata: Optional[Dict] = None) -> bool:
        """Check for consistent timestamps."""
        # Simplified check - would need more sophisticated implementation
        date_patterns = re.findall(r'\b\d{1,2}/\d{1,2}/\d{2,4}\b', text)
        return len(set(date_patterns)) <= 3  # Allow up to 3 different dates
    
    # Additional helper methods
    def _assess_source_quality(self, text: str, metadata: Optional[Dict] = None) -> float:
        """Assess the quality of the document source."""
        # Implementation would analyze source credibility indicators
        return 0.7  # Placeholder
    
    def _assess_corroboration_potential(self, text: str) -> float:
        """Assess potential for corroboration."""
        corroboration_indicators = [
            r'\b(?:witness|corroborate|confirm|verify)\b',
            r'\b(?:additional evidence|supporting document)\b'
        ]
        
        indicator_count = sum(len(re.findall(pattern, text, re.IGNORECASE)) 
                            for pattern in corroboration_indicators)
        
        return min(indicator_count * 0.2, 1.0)
    
    def _assess_evidence_completeness(self, text: str) -> float:
        """Assess completeness of evidence presented."""
        # Check for completeness indicators
        completeness_indicators = [
            r'\b(?:complete|comprehensive|thorough)\b',
            r'\b(?:all|entire|full)\b',
            r'\b(?:summary|conclusion|findings)\b'
        ]
        
        indicator_count = sum(len(re.findall(pattern, text, re.IGNORECASE)) 
                            for pattern in completeness_indicators)
        
        return min(indicator_count * 0.15, 1.0)
    
    # Scoring and rating methods
    def _score_to_rating(self, score: float) -> str:
        """Convert numeric score to letter rating."""
        if score >= 0.9:
            return "EXCELLENT"
        elif score >= 0.8:
            return "VERY_GOOD"
        elif score >= 0.7:
            return "GOOD"
        elif score >= 0.6:
            return "FAIR"
        elif score >= 0.4:
            return "POOR"
        else:
            return "VERY_POOR"
    
    def _score_to_admissibility_rating(self, score: float) -> str:
        """Convert admissibility score to rating."""
        if score >= 0.8:
            return "HIGHLY_ADMISSIBLE"
        elif score >= 0.6:
            return "LIKELY_ADMISSIBLE"
        elif score >= 0.4:
            return "QUESTIONABLE"
        else:
            return "LIKELY_INADMISSIBLE"
    
    def _score_to_quality_rating(self, score: float) -> str:
        """Convert quality score to rating."""
        if score >= 0.9:
            return "HIGH_QUALITY"
        elif score >= 0.7:
            return "GOOD_QUALITY"
        elif score >= 0.5:
            return "MEDIUM_QUALITY"
        else:
            return "LOW_QUALITY"
    
    def _score_to_significance_rating(self, score: float) -> str:
        """Convert significance score to rating."""
        if score >= 0.8:
            return "HIGHLY_SIGNIFICANT"
        elif score >= 0.6:
            return "SIGNIFICANT"
        elif score >= 0.4:
            return "MODERATELY_SIGNIFICANT"
        else:
            return "LOW_SIGNIFICANCE"
    
    def _score_to_authenticity_rating(self, score: float) -> str:
        """Convert authenticity score to rating."""
        if score >= 0.9:
            return "HIGHLY_AUTHENTIC"
        elif score >= 0.7:
            return "LIKELY_AUTHENTIC"
        elif score >= 0.5:
            return "QUESTIONABLE_AUTHENTICITY"
        else:
            return "LIKELY_INAUTHENTIC"
    
    def _score_to_risk_level(self, score: float) -> str:
        """Convert risk score to risk level."""
        if score >= 0.8:
            return "HIGH_RISK"
        elif score >= 0.6:
            return "MEDIUM_RISK"
        elif score >= 0.3:
            return "LOW_RISK"
        else:
            return "MINIMAL_RISK"
    
    # Complex assessment methods (simplified implementations)
    def _check_format_consistency(self, text: str) -> float:
        """Check document format consistency."""
        return 0.8  # Placeholder
    
    def _check_metadata_integrity(self, metadata: Optional[Dict] = None) -> float:
        """Check metadata integrity."""
        return 0.8 if metadata else 0.5  # Placeholder
    
    def _check_content_integrity(self, text: str) -> float:
        """Check content integrity."""
        return 0.8  # Placeholder
    
    def _verify_source(self, text: str, metadata: Optional[Dict] = None) -> float:
        """Verify document source."""
        return 0.7  # Placeholder
    
    def _check_temporal_consistency(self, text: str, metadata: Optional[Dict] = None) -> float:
        """Check temporal consistency."""
        return 0.8  # Placeholder
    
    def _assess_authenticity_risks(self, authenticity_checks: Dict) -> List[str]:
        """Assess authenticity risks."""
        risks = []
        for check, score in authenticity_checks.items():
            if isinstance(score, (int, float)) and score < 0.5:
                risks.append(f"Low {check.replace('_', ' ')} score")
        return risks
    
    def _calculate_verification_confidence(self, authenticity_checks: Dict) -> float:
        """Calculate verification confidence."""
        scores = [score for score in authenticity_checks.values() if isinstance(score, (int, float))]
        return sum(scores) / len(scores) if scores else 0.0
    
    def _calculate_overall_score(self, admissibility: Dict, evidence_quality: Dict, 
                               legal_significance: Dict, authenticity: Dict) -> float:
        """Calculate overall evaluation score."""
        return (
            admissibility["total_score"] * 0.35 +
            evidence_quality["overall_quality"] * 0.25 +
            legal_significance["overall_significance"] * 0.25 +
            authenticity["overall_authenticity"] * 0.15
        )
    
    def _generate_recommendations(self, admissibility: Dict, evidence_quality: Dict,
                                legal_significance: Dict, privilege_issues: Dict) -> List[str]:
        """Generate recommendations based on evaluation results."""
        recommendations = []
        
        if admissibility["total_score"] < 0.6:
            recommendations.append("Document may face admissibility challenges - strengthen authentication")
        
        if evidence_quality["overall_quality"] < 0.7:
            recommendations.append("Evidence quality is concerning - seek corroborating evidence")
        
        if legal_significance["overall_significance"] > 0.8:
            recommendations.append("Document has high legal significance - prioritize for review")
        
        if privilege_issues["privilege_risk_score"] > 0.5:
            recommendations.append("Privilege issues detected - conduct privilege review")
        
        return recommendations
    
    def _assess_risks(self, text: str, metadata: Optional[Dict], 
                     admissibility: Dict, privilege_issues: Dict) -> Dict[str, Any]:
        """Assess various risks associated with the document."""
        return {
            "admissibility_risk": 1.0 - admissibility["total_score"],
            "privilege_risk": privilege_issues["privilege_risk_score"],
            "authenticity_risk": "Medium",  # Placeholder
            "overall_risk_level": self._calculate_overall_risk(admissibility, privilege_issues)
        }
    
    def _calculate_overall_risk(self, admissibility: Dict, privilege_issues: Dict) -> str:
        """Calculate overall risk level."""
        risk_score = (
            (1.0 - admissibility["total_score"]) * 0.6 +
            privilege_issues["privilege_risk_score"] * 0.4
        )
        return self._score_to_risk_level(risk_score)
    
    def _detect_hearsay_issues(self, text: str) -> Dict[str, Any]:
        """Detect potential hearsay issues."""
        hearsay_indicators = [
            r'\b(?:told me|said that|informed that)\b',
            r'\b(?:according to|based on what)\b',
            r'\b(?:heard from|was told)\b'
        ]
        
        detected = any(re.search(pattern, text, re.IGNORECASE) 
                      for pattern in hearsay_indicators)
        
        return {
            "hearsay_detected": detected,
            "hearsay_risk": "HIGH" if detected else "LOW",
            "exceptions_applicable": self._identify_hearsay_exceptions(text) if detected else []
        }
    
    def _identify_hearsay_exceptions(self, text: str) -> List[str]:
        """Identify applicable hearsay exceptions."""
        exceptions = []
        text_lower = text.lower()
        
        exception_patterns = {
            "Present Sense Impression": r'\b(?:immediately|right after|as it happened)\b',
            "Excited Utterance": r'\b(?:excited|startled|shocked)\b',
            "Business Records": r'\b(?:business record|kept in course|regular practice)\b',
            "Public Records": r'\b(?:public record|official record|government)\b'
        }
        
        for exception, pattern in exception_patterns.items():
            if re.search(pattern, text_lower):
                exceptions.append(exception)
        
        return exceptions
    
    def _assess_best_evidence_rule(self, text: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Assess best evidence rule compliance."""
        # Simplified implementation
        is_original = "original" in text.lower() or (metadata and metadata.get("is_original", False))
        
        return {
            "original_document": is_original,
            "best_evidence_compliance": "COMPLIANT" if is_original else "NEEDS_JUSTIFICATION",
            "acceptable_copy": not is_original and "certified" in text.lower()
        }
    
    def _assess_character_evidence(self, text: str) -> Dict[str, Any]:
        """Assess character evidence issues."""
        character_patterns = [
            r'\b(?:character|reputation|prior acts)\b',
            r'\b(?:criminal history|past behavior)\b',
            r'\b(?:honest|dishonest|trustworthy)\b'
        ]
        
        detected = any(re.search(pattern, text, re.IGNORECASE) 
                      for pattern in character_patterns)
        
        return {
            "character_evidence_detected": detected,
            "admissibility_risk": "HIGH" if detected else "LOW",
            "rule_404_concerns": detected
        }
    
    def _predict_objections(self, relevance: float, reliability: float, 
                          prejudicial: float, hearsay: Dict) -> List[str]:
        """Predict likely evidentiary objections."""
        objections = []
        
        if relevance < 0.6:
            objections.append("Relevance objection likely")
        
        if reliability < 0.5:
            objections.append("Foundation/authenticity objection likely")
        
        if prejudicial > 0.7:
            objections.append("Unfair prejudice objection likely (Rule 403)")
        
        if hearsay["hearsay_detected"]:
            objections.append("Hearsay objection likely")
        
        return objections
    
    def _generate_privilege_recommendations(self, privilege_issues: Dict) -> List[str]:
        """Generate privilege-related recommendations."""
        recommendations = []
        
        for privilege_type, issue in privilege_issues.items():
            if issue["detected"]:
                recommendations.append(f"Review for {privilege_type.replace('_', ' ')} privilege")
        
        if recommendations:
            recommendations.append("Consider privilege log preparation")
            recommendations.append("Seek judicial guidance on privilege claims")
        
        return recommendations


def main():
    """Command-line interface for document evaluation."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Evaluate legal documents for admissibility and quality")
    parser.add_argument("--input", required=True, help="Input file or directory")
    parser.add_argument("--output", default="output/evaluation", help="Output directory")
    parser.add_argument("--context", help="Case context JSON file")
    
    args = parser.parse_args()
    
    evaluator = DocumentEvaluator()
    
    from pathlib import Path
    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Load context if provided
    context = None
    if args.context:
        with open(args.context, 'r') as f:
            context = json.load(f)
    
    if input_path.is_file():
        # Evaluate single file
        text = input_path.read_text(encoding='utf-8', errors='ignore')
        result = evaluator.evaluate_document(text, context=context)
        
        output_file = output_path / f"evaluation_{input_path.stem}.json"
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"Evaluated document: {input_path.name}")
        print(f"Overall Score: {result['overall_score']}")
        print(f"Rating: {result['overall_rating']}")
        print(f"Results saved to: {output_file}")
    
    else:
        # Evaluate directory
        results = []
        for file_path in input_path.glob("*.txt"):
            text = file_path.read_text(encoding='utf-8', errors='ignore')
            result = evaluator.evaluate_document(text, context=context)
            result["document"] = file_path.name
            results.append(result)
        
        # Save batch results
        results_file = output_path / "evaluation_results.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Generate summary
        avg_score = sum(r["overall_score"] for r in results) / len(results)
        high_quality = len([r for r in results if r["overall_score"] >= 0.8])
        
        print(f"Evaluated {len(results)} documents")
        print(f"Average Score: {avg_score:.2f}")
        print(f"High Quality Documents: {high_quality}")
        print(f"Results saved to: {results_file}")


if __name__ == "__main__":
    main()