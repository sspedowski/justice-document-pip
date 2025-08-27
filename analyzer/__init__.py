"""
Justice Document Analysis Package

This package provides comprehensive analysis capabilities for legal document processing,
including tampering detection, pattern recognition, and content evaluation.
"""

__version__ = "1.0.0"
__author__ = "Justice Document Pipeline Team"

from .run_analysis import DocumentAnalyzer
from .scoding import ContentScorer
from .evaluate import DocumentEvaluator

__all__ = [
    "DocumentAnalyzer",
    "ContentScorer", 
    "DocumentEvaluator"
]