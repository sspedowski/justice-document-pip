"""
Analyzer package for justice document contradiction detection.
"""

from .evaluate import analyze_documents
from .id import contradiction_id

__all__ = ['analyze_documents', 'contradiction_id']