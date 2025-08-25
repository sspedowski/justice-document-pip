#!/usr/bin/env python3
"""
Auto-tagging system for children and document categories
Uses pattern matching and NLP techniques for classification
"""

import os
import re
import json
from typing import Dict, List, Tuple, Set
from pathlib import Path
import yaml

def load_config(config_path: str) -> dict:
    """Load configuration from YAML file"""
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def extract_child_names(text: str, known_children: List[str]) -> Tuple[List[str], float]:
    """Extract child names from text with confidence scoring"""
    found_children = []
    confidence_scores = []
    
    text_lower = text.lower()
    
    for child in known_children:
        child_lower = child.lower()
        
        # Count different types of mentions
        exact_matches = len(re.findall(rf'\b{re.escape(child)}\b', text, re.IGNORECASE))
        possessive_matches = len(re.findall(rf'\b{re.escape(child)}\'?s\b', text, re.IGNORECASE))
        
        total_matches = exact_matches + possessive_matches
        
        if total_matches > 0:
            found_children.append(child)
            
            # Calculate confidence based on:
            # - Number of mentions
            # - Context keywords
            # - Document length
            base_confidence = min(total_matches * 0.3, 1.0)
            
            # Boost confidence for context keywords
            context_patterns = [
                rf'\b{re.escape(child_lower)}\b.{{0,50}}(child|son|daughter|minor|juvenile)',
                rf'(child|son|daughter|minor|juvenile).{{0,50}}\b{re.escape(child_lower)}\b',
                rf'\b{re.escape(child_lower)}\b.{{0,30}}(year|age|old|born)',
                rf'(interview|statement|examination).{{0,100}}\b{re.escape(child_lower)}\b'
            ]
            
            context_boost = 0.0
            for pattern in context_patterns:
                if re.search(pattern, text_lower):
                    context_boost += 0.2
            
            final_confidence = min(base_confidence + context_boost, 1.0)
            confidence_scores.append(final_confidence)
    
    # Overall confidence is average of individual confidences
    overall_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
    
    return found_children, overall_confidence

def classify_document_category(text: str, filename: str) -> Tuple[str, float, str]:
    """Classify document category with confidence and reasoning"""
    text_lower = text.lower()
    filename_lower = filename.lower()
    
    # Define classification patterns with weights
    patterns = {
        'Primary': {
            'patterns': [
                (r'police report|incident report|investigation report', 0.9),
                (r'medical exam|forensic exam|nurse exam|physical exam', 0.9),
                (r'witness statement|sworn statement|affidavit', 0.8),
                (r'child protective services|cps report|abuse report', 0.9),
                (r'interview recording|recorded statement', 0.8),
                (r'photographic evidence|photo documentation', 0.7),
                (r'medical records|hospital records|doctor', 0.7),
                (r'investigative summary|detective notes', 0.8)
            ],
            'filename_patterns': [
                (r'police|report|incident|investigation', 0.8),
                (r'medical|exam|forensic|nurse', 0.8),
                (r'statement|witness|affidavit', 0.7),
                (r'cps|protective|abuse', 0.8)
            ]
        },
        'Supporting': {
            'patterns': [
                (r'court order|judicial order|court document', 0.7),
                (r'legal brief|motion|filing', 0.6),
                (r'correspondence|letter|email', 0.5),
                (r'school records|educational records', 0.6),
                (r'social services|family services', 0.6),
                (r'background check|criminal history', 0.6),
                (r'timeline|chronology|summary', 0.5)
            ],
            'filename_patterns': [
                (r'court|order|motion|filing', 0.6),
                (r'letter|email|correspondence', 0.5),
                (r'school|education|records', 0.6),
                (r'background|history|check', 0.5)
            ]
        },
        'External': {
            'patterns': [
                (r'news article|newspaper|media report', 0.8),
                (r'research paper|study|academic', 0.7),
                (r'policy document|guidelines|standards', 0.6),
                (r'training materials|educational', 0.5),
                (r'public records|foia|freedom of information', 0.7)
            ],
            'filename_patterns': [
                (r'news|article|media|press', 0.8),
                (r'research|study|academic', 0.7),
                (r'policy|guideline|standard', 0.6),
                (r'public|foia|freedom', 0.6)
            ]
        },
        'No': {
            'patterns': [
                (r'notice of hearing|hearing notice|scheduling', 0.9),
                (r'calendar notice|docket|case schedule', 0.8),
                (r'administrative notice|procedural notice', 0.8),
                (r'form.*blank|template|sample', 0.7),
                (r'duplicate|copy.*copy|redundant', 0.8)
            ],
            'filename_patterns': [
                (r'notice|hearing|schedule|calendar', 0.8),
                (r'form|template|blank|sample', 0.7),
                (r'duplicate|copy', 0.8)
            ]
        }
    }
    
    # Score each category
    category_scores = {}
    match_details = {}
    
    for category, rules in patterns.items():
        score = 0.0
        matches = []
        
        # Check text patterns
        for pattern, weight in rules['patterns']:
            if re.search(pattern, text_lower):
                score += weight
                matches.append(f"text: {pattern}")
        
        # Check filename patterns
        for pattern, weight in rules['filename_patterns']:
            if re.search(pattern, filename_lower):
                score += weight * 0.7  # Filename patterns get less weight
                matches.append(f"filename: {pattern}")
        
        category_scores[category] = score
        match_details[category] = matches
    
    # Determine best category
    best_category = max(category_scores, key=category_scores.get)
    best_score = category_scores[best_category]
    
    # Normalize confidence to 0-1 range
    confidence = min(best_score / 3.0, 1.0)  # Scale down since scores can be > 1
    
    # Generate reasoning
    if match_details[best_category]:
        reasoning = f"Matched patterns: {'; '.join(match_details[best_category])}"
    else:
        reasoning = "Default classification based on general content"
    
    # Apply minimum confidence threshold
    if confidence < 0.3:
        best_category = 'Supporting'  # Default fallback
        confidence = 0.3
        reasoning = "Low confidence, defaulted to Supporting"
    
    return best_category, confidence, reasoning

def detect_legal_violations(text: str, laws_config: List[Dict]) -> List[Dict]:
    """Detect potential legal violations in text"""
    violations = []
    text_lower = text.lower()
    
    for law in laws_config:
        law_name = law['name']
        keywords = law.get('keywords', [])
        
        # Count keyword matches
        matches = 0
        matched_keywords = []
        
        for keyword in keywords:
            keyword_lower = keyword.lower()
            # Use word boundaries for more precise matching
            pattern = rf'\b{re.escape(keyword_lower)}\b'
            if re.search(pattern, text_lower):
                matches += 1
                matched_keywords.append(keyword)
        
        if matches > 0:
            # Calculate confidence based on number of keywords matched
            confidence = min(matches / len(keywords), 1.0)
            
            # Look for additional context that might indicate actual violation
            violation_indicators = [
                'violation', 'violated', 'breach', 'failed to', 'improper',
                'unlawful', 'illegal', 'misconduct', 'negligence'
            ]
            
            has_violation_context = any(
                indicator in text_lower for indicator in violation_indicators
            )
            
            if has_violation_context:
                confidence = min(confidence + 0.3, 1.0)
            
            violations.append({
                'law': law_name,
                'confidence': round(confidence, 2),
                'matched_keywords': matched_keywords,
                'keyword_count': matches,
                'has_violation_context': has_violation_context
            })
    
    # Sort by confidence
    violations.sort(key=lambda x: x['confidence'], reverse=True)
    
    return violations

def auto_tag_document(pdf_path: Path, metadata: Dict, config: dict) -> Dict:
    """Auto-tag a document with children, category, and legal violations"""
    
    # Get text content
    text = metadata.get('description', '') + ' ' + metadata.get('full_text', '')
    if not text.strip():
        # If no text, try to use filename for basic classification
        text = pdf_path.stem.replace('_', ' ').replace('-', ' ')
    
    # Extract children
    known_children = config.get('children', [])
    found_children, child_confidence = extract_child_names(text, known_children)
    
    # Classify category
    category, category_confidence, category_reasoning = classify_document_category(
        text, pdf_path.name
    )
    
    # Detect legal violations
    laws_config = config.get('laws', [])
    violations = detect_legal_violations(text, laws_config)
    
    # Update metadata
    metadata['auto_tagging'] = {
        'children': {
            'detected': found_children,
            'confidence': round(child_confidence, 2),
            'source': 'auto_pattern_matching'
        },
        'category': {
            'detected': category,
            'confidence': round(category_confidence, 2),
            'reasoning': category_reasoning,
            'source': 'auto_classification'
        },
        'legal_violations': violations,
        'needs_review': (
            child_confidence < 0.7 or 
            category_confidence < 0.6 or 
            len(violations) > 3
        )
    }
    
    # Override existing fields only if confidence is high enough
    if child_confidence >= 0.7 and found_children:
        metadata['children'] = found_children
    
    if category_confidence >= 0.6:
        metadata['category'] = category
    
    # Add detected laws
    if violations:
        high_confidence_laws = [
            v['law'] for v in violations 
            if v['confidence'] >= 0.5
        ]
        if high_confidence_laws:
            metadata['laws'] = list(set(metadata.get('laws', []) + high_confidence_laws))
    
    return metadata

def create_review_queue(metadata_dir: Path) -> Dict:
    """Create a review queue of documents that need manual verification"""
    review_queue = {
        'high_priority': [],
        'medium_priority': [],
        'low_priority': []
    }
    
    for meta_file in metadata_dir.glob("*.json"):
        if meta_file.name in ['duplicates.json', 'exhibit_mapping.json']:
            continue
            
        try:
            with open(meta_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            auto_tagging = metadata.get('auto_tagging', {})
            if not auto_tagging:
                continue
            
            needs_review = auto_tagging.get('needs_review', False)
            child_conf = auto_tagging.get('children', {}).get('confidence', 1.0)
            category_conf = auto_tagging.get('category', {}).get('confidence', 1.0)
            violation_count = len(auto_tagging.get('legal_violations', []))
            
            if needs_review or child_conf < 0.5 or category_conf < 0.4:
                priority = 'high_priority'
            elif child_conf < 0.7 or category_conf < 0.6 or violation_count > 2:
                priority = 'medium_priority'
            else:
                priority = 'low_priority'
            
            review_item = {
                'file_name': metadata['file_name'],
                'detected_children': auto_tagging.get('children', {}).get('detected', []),
                'child_confidence': child_conf,
                'detected_category': auto_tagging.get('category', {}).get('detected', ''),
                'category_confidence': category_conf,
                'violation_count': violation_count,
                'reasoning': auto_tagging.get('category', {}).get('reasoning', ''),
                'needs_review_reasons': []
            }
            
            # Add specific reasons for review
            if child_conf < 0.5:
                review_item['needs_review_reasons'].append('Low child detection confidence')
            if category_conf < 0.6:
                review_item['needs_review_reasons'].append('Low category confidence')
            if violation_count > 3:
                review_item['needs_review_reasons'].append('Many legal violations detected')
            
            review_queue[priority].append(review_item)
            
        except Exception as e:
            print(f"Warning: Could not process {meta_file}: {e}")
    
    # Sort by confidence (lowest first for review)
    for priority in review_queue:
        review_queue[priority].sort(key=lambda x: x['child_confidence'] + x['category_confidence'])
    
    return review_queue

def main():
    """Main function for auto-tagging pipeline"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Auto-tagging pipeline for documents')
    parser.add_argument('--config', default='config.ci.yaml', help='Configuration file')
    parser.add_argument('--create-review-queue', action='store_true', help='Create review queue')
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    input_dir = Path(config['paths']['input_dir'])
    metadata_dir = Path(config['paths']['metadata_dir'])
    
    if not input_dir.exists() or not metadata_dir.exists():
        print("Input or metadata directory not found")
        return 1
    
    # Process each PDF
    processed_count = 0
    for pdf_file in input_dir.glob("*.pdf"):
        meta_file = metadata_dir / f"{pdf_file.stem}.json"
        if meta_file.exists():
            with open(meta_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # Auto-tag the document
            enhanced_metadata = auto_tag_document(pdf_file, metadata, config)
            
            # Save enhanced metadata
            with open(meta_file, 'w', encoding='utf-8') as f:
                json.dump(enhanced_metadata, f, ensure_ascii=False, indent=2)
            
            processed_count += 1
            print(f"Auto-tagged: {pdf_file.name}")
    
    print(f"Auto-tagged {processed_count} documents")
    
    # Create review queue if requested
    if args.create_review_queue:
        review_queue = create_review_queue(metadata_dir)
        
        with open(metadata_dir / 'review_queue.json', 'w', encoding='utf-8') as f:
            json.dump(review_queue, f, ensure_ascii=False, indent=2)
        
        total_for_review = sum(len(queue) for queue in review_queue.values())
        print(f"Created review queue with {total_for_review} documents:")
        print(f"  High priority: {len(review_queue['high_priority'])}")
        print(f"  Medium priority: {len(review_queue['medium_priority'])}")
        print(f"  Low priority: {len(review_queue['low_priority'])}")
    
    return 0

if __name__ == '__main__':
    import sys
    sys.exit(main())