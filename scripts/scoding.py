#!/usr/bin/env python3
"""
Scoring and analysis engine for justice document contradictions.
Supports hot-reload of rule weights and configurable analysis pipelines.
"""

import json
import logging
import os
import time
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import subprocess
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

THIS_DIR = Path(__file__).resolve().parent
ROOT_DIR = THIS_DIR.parent
DEFAULT_WEIGHTS_PATH = ROOT_DIR / "analyzer" / "rule_weights.json"
PUBLIC_DATA_DIR = ROOT_DIR / "public" / "data"

class RuleWeights:
    """Manages rule weights configuration with hot-reload support."""
    
    def __init__(self, weights_path: Path):
        self.weights_path = weights_path
        self.weights = {}
        self.last_modified = 0
        self.load_weights()
    
    def load_weights(self) -> bool:
        """Load weights from JSON file, return True if successful."""
        try:
            if not self.weights_path.exists():
                logger.warning(f"Weights file not found: {self.weights_path}")
                self._load_default_weights()
                return False
            
            with open(self.weights_path, 'r') as f:
                data = json.load(f)
            
            # Validate structure
            if 'weights' not in data:
                logger.error("Invalid weights file: missing 'weights' key")
                self._load_default_weights()
                return False
            
            self.weights = data['weights']
            self.last_modified = self.weights_path.stat().st_mtime
            logger.info(f"Loaded weights from {self.weights_path}")
            return True
            
        except json.JSONDecodeError as e:
            logger.error(f"Malformed JSON in weights file: {e}")
            self._load_default_weights()
            return False
        except Exception as e:
            logger.error(f"Error loading weights file: {e}")
            self._load_default_weights()
            return False
    
    def _load_default_weights(self):
        """Load default weights when file is missing or invalid."""
        logger.info("Loading default weights")
        self.weights = {
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
        }
    
    def has_changed(self) -> bool:
        """Check if weights file has been modified."""
        if not self.weights_path.exists():
            return False
        
        try:
            current_mtime = self.weights_path.stat().st_mtime
            return current_mtime > self.last_modified
        except Exception:
            return False
    
    def get_weight(self, category: str, rule: str, default: float = 0.5) -> float:
        """Get weight for a specific rule, with fallback to default."""
        return self.weights.get(category, {}).get(rule, default)

class ContradictionScorer:
    """Scores contradictions based on rule weights."""
    
    def __init__(self, rule_weights: RuleWeights):
        self.rule_weights = rule_weights
    
    def score_contradictions(self, contradictions_data: Dict[str, Any]) -> Dict[str, Any]:
        """Score contradictions using current rule weights."""
        logger.info("Scoring contradictions with current weights")
        
        scored_contradictions = []
        total_score = 0
        category_scores = {}
        
        for contradiction in contradictions_data.get('contradictions', []):
            scored = self._score_single_contradiction(contradiction)
            scored_contradictions.append(scored)
            total_score += scored['weighted_score']
            
            # Aggregate category scores
            category = contradiction.get('type', 'unknown')
            if category not in category_scores:
                category_scores[category] = 0
            category_scores[category] += scored['weighted_score']
        
        # Determine risk level
        risk_level = self._determine_risk_level(total_score, len(scored_contradictions))
        
        return {
            "analysis_id": f"contradictions_scored_{int(time.time())}",
            "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "rule_weights_version": getattr(self.rule_weights, 'version', '1.0'),
            "total_score": round(total_score, 1),
            "max_possible_score": len(scored_contradictions) * 100,
            "risk_level": risk_level,
            "scored_contradictions": scored_contradictions,
            "category_scores": {k: round(v, 1) for k, v in category_scores.items()},
            "recommendations": self._generate_recommendations(risk_level, total_score),
            "metadata": {
                "weights_file": str(self.rule_weights.weights_path),
                "scoring_algorithm": "weighted_confidence_v1.0",
                "processed_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            }
        }
    
    def _score_single_contradiction(self, contradiction: Dict[str, Any]) -> Dict[str, Any]:
        """Score a single contradiction."""
        contradiction_type = contradiction.get('type', 'unknown')
        confidence = contradiction.get('confidence', 0.5)
        severity = contradiction.get('severity', 'medium')
        
        # Get appropriate weight based on type
        if contradiction_type in ['timeline_inconsistency', 'temporal_anomaly']:
            weight = self.rule_weights.get_weight('document_integrity', 'timeline_inconsistency', 0.7)
        elif contradiction_type in ['name_alteration']:
            weight = self.rule_weights.get_weight('document_integrity', 'name_alteration', 0.8)
        elif contradiction_type in ['content_modification']:
            weight = self.rule_weights.get_weight('document_integrity', 'content_modification', 0.75)
        else:
            weight = self.rule_weights.get_weight('pattern_analysis', 'cross_document_inconsistency', 0.8)
        
        # Apply severity multiplier
        severity_multipliers = {'low': 0.8, 'medium': 1.0, 'high': 1.2, 'critical': 1.5}
        severity_multiplier = severity_multipliers.get(severity, 1.0)
        
        # Calculate weighted score
        weighted_score = confidence * weight * severity_multiplier * 100
        
        result = contradiction.copy()
        result.update({
            'base_confidence': confidence,
            'rule_weight': weight,
            'weighted_score': round(weighted_score, 1),
            'score_breakdown': {
                'confidence_factor': confidence,
                'pattern_weight': weight,
                'severity_multiplier': severity_multiplier
            }
        })
        
        return result
    
    def _determine_risk_level(self, total_score: float, num_contradictions: int) -> str:
        """Determine overall risk level based on score."""
        if num_contradictions == 0:
            return "LOW"
        
        avg_score = total_score / num_contradictions
        
        if avg_score >= 75:
            return "CRITICAL"
        elif avg_score >= 60:
            return "HIGH"
        elif avg_score >= 40:
            return "MODERATE"
        else:
            return "LOW"
    
    def _generate_recommendations(self, risk_level: str, total_score: float) -> List[str]:
        """Generate recommendations based on risk level."""
        recommendations = []
        
        if risk_level == "CRITICAL":
            recommendations.extend([
                "IMMEDIATE ACTION REQUIRED: Critical contradictions detected",
                "Preserve all document versions and metadata",
                "Conduct forensic analysis for critical violations",
                "Review access logs and modification history"
            ])
        elif risk_level == "HIGH":
            recommendations.extend([
                "High-priority review of contradictions required",
                "Verify document authenticity through alternative sources",
                "Document review process and findings"
            ])
        elif risk_level == "MODERATE":
            recommendations.extend([
                "Review flagged contradictions for potential issues",
                "Monitor for additional changes or inconsistencies"
            ])
        else:
            recommendations.extend([
                "Continue monitoring for changes",
                "Maintain version control and audit trails"
            ])
        
        return recommendations

def run_analysis(weights_path: Path, output_dir: Path = PUBLIC_DATA_DIR) -> bool:
    """Run the complete contradiction analysis and scoring."""
    logger.info("Starting contradiction analysis and scoring")
    
    # Initialize rule weights
    rule_weights = RuleWeights(weights_path)
    
    # Load base contradictions data
    contradictions_file = output_dir / "contradictions.json"
    if not contradictions_file.exists():
        logger.error(f"Base contradictions file not found: {contradictions_file}")
        return False
    
    try:
        with open(contradictions_file, 'r') as f:
            contradictions_data = json.load(f)
    except Exception as e:
        logger.error(f"Error loading contradictions data: {e}")
        return False
    
    # Score contradictions
    scorer = ContradictionScorer(rule_weights)
    scored_data = scorer.score_contradictions(contradictions_data)
    
    # Save scored results
    scored_file = output_dir / "contradictions_scored.json"
    try:
        with open(scored_file, 'w') as f:
            json.dump(scored_data, f, indent=2)
        logger.info(f"Saved scored contradictions to {scored_file}")
        return True
    except Exception as e:
        logger.error(f"Error saving scored contradictions: {e}")
        return False

def watch_and_reload(weights_path: Path, check_interval: int = 2):
    """Watch weights file for changes and re-run analysis."""
    logger.info(f"Starting watch mode, checking every {check_interval} seconds")
    logger.info(f"Watching: {weights_path}")
    
    rule_weights = RuleWeights(weights_path)
    last_run = 0
    
    while True:
        try:
            if rule_weights.has_changed():
                logger.info("Weights file changed, reloading...")
                if rule_weights.load_weights():
                    logger.info("Running analysis with updated weights...")
                    if run_analysis(weights_path):
                        logger.info("Analysis completed successfully")
                    else:
                        logger.error("Analysis failed")
                else:
                    logger.error("Failed to reload weights")
            
            # Run analysis periodically even if weights haven't changed
            current_time = time.time()
            if current_time - last_run > 300:  # Every 5 minutes
                logger.info("Running periodic analysis...")
                run_analysis(weights_path)
                last_run = current_time
            
            time.sleep(check_interval)
            
        except KeyboardInterrupt:
            logger.info("Watch mode stopped by user")
            break
        except Exception as e:
            logger.error(f"Error in watch loop: {e}")
            time.sleep(check_interval)

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Justice Document Scoring and Analysis Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                                    # Run analysis once with default weights
  %(prog)s --weights custom_weights.json     # Use custom weights file  
  %(prog)s --watch                           # Monitor weights file for changes
  %(prog)s --watch --weights custom.json     # Watch custom weights file
        """
    )
    
    parser.add_argument(
        '--weights',
        type=Path,
        default=DEFAULT_WEIGHTS_PATH,
        help=f'Path to rule weights JSON file (default: {DEFAULT_WEIGHTS_PATH})'
    )
    
    parser.add_argument(
        '--watch',
        action='store_true',
        help='Watch weights file for changes and re-run analysis'
    )
    
    parser.add_argument(
        '--output-dir',
        type=Path,
        default=PUBLIC_DATA_DIR,
        help=f'Output directory for results (default: {PUBLIC_DATA_DIR})'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Ensure output directory exists
    args.output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Justice Document Scoring Engine")
    logger.info(f"Weights file: {args.weights}")
    logger.info(f"Output directory: {args.output_dir}")
    
    if args.watch:
        watch_and_reload(args.weights)
    else:
        success = run_analysis(args.weights, args.output_dir)
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()