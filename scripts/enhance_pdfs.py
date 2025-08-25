#!/usr/bin/env python3
"""
OCR Processing Pipeline for scanned PDFs
Adds OCR capability as fallback when text extraction fails
"""

import os
import sys
import json
import hashlib
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import yaml

def load_config(config_path: str) -> dict:
    """Load configuration from YAML file"""
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def calculate_file_hash(file_path: Path) -> str:
    """Calculate SHA256 hash of file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()

def check_duplicate_files(input_dir: Path, metadata_dir: Path) -> List[Dict]:
    """Check for duplicate files based on hash and size"""
    existing_files = {}
    duplicates = []
    
    # Load existing metadata to check for duplicates
    for meta_file in metadata_dir.glob("*.json"):
        try:
            with open(meta_file, 'r', encoding='utf-8') as f:
                meta = json.load(f)
                if 'file_hash' in meta:
                    existing_files[meta['file_hash']] = meta['file_name']
        except Exception as e:
            print(f"Warning: Could not read metadata {meta_file}: {e}")
    
    # Check new files for duplicates
    for pdf_file in input_dir.glob("*.pdf"):
        file_hash = calculate_file_hash(pdf_file)
        if file_hash in existing_files:
            duplicates.append({
                'new_file': pdf_file.name,
                'duplicate_of': existing_files[file_hash],
                'hash': file_hash,
                'action': 'skip'
            })
    
    return duplicates

def estimate_ocr_quality(text: str, page_count: int) -> Dict:
    """Estimate OCR quality based on text characteristics"""
    if not text or len(text.strip()) < 50:
        return {'confidence': 0.0, 'quality': 'poor', 'needs_review': True}
    
    # Basic heuristics for OCR quality
    char_count = len(text)
    word_count = len(text.split())
    avg_word_length = char_count / max(word_count, 1)
    
    # Look for OCR artifacts
    ocr_artifacts = text.count('|') + text.count('~') + text.count('^')
    artifact_ratio = ocr_artifacts / max(char_count, 1)
    
    # Estimate chars per page (normal documents: 1000-3000 chars/page)
    chars_per_page = char_count / max(page_count, 1)
    
    # Calculate confidence score (0-1)
    confidence = 1.0
    
    # Penalize if too few characters per page
    if chars_per_page < 100:
        confidence *= 0.3
    elif chars_per_page < 500:
        confidence *= 0.7
    
    # Penalize high artifact ratio
    if artifact_ratio > 0.01:
        confidence *= 0.5
    
    # Penalize unusual word lengths
    if avg_word_length < 3 or avg_word_length > 15:
        confidence *= 0.8
    
    # Determine quality level
    if confidence >= 0.8:
        quality = 'high'
        needs_review = False
    elif confidence >= 0.5:
        quality = 'medium'
        needs_review = False
    else:
        quality = 'poor'
        needs_review = True
    
    return {
        'confidence': round(confidence, 2),
        'quality': quality,
        'needs_review': needs_review,
        'chars_per_page': round(chars_per_page),
        'word_count': word_count,
        'artifact_ratio': round(artifact_ratio, 4)
    }

def run_ocr_fallback(pdf_path: Path, output_dir: Path) -> Optional[str]:
    """Run OCR on PDF using tesseract/poppler if available"""
    try:
        # Check if poppler-utils and tesseract are available
        subprocess.run(['pdftotext', '--version'], capture_output=True, check=True)
        subprocess.run(['tesseract', '--version'], capture_output=True, check=True)
        
        print(f"Running OCR on {pdf_path.name}...")
        
        # First try pdftotext (faster for text PDFs)
        text_output = output_dir / f"{pdf_path.stem}.txt"
        result = subprocess.run([
            'pdftotext', 
            '-layout', 
            str(pdf_path), 
            str(text_output)
        ], capture_output=True, text=True)
        
        if result.returncode == 0 and text_output.exists():
            with open(text_output, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read().strip()
            
            # If we got good text, return it
            if len(text) > 100:
                text_output.unlink()  # Clean up temp file
                return text
        
        # If pdftotext didn't work well, try OCR
        # Convert PDF to images first
        images_dir = output_dir / "temp_images"
        images_dir.mkdir(exist_ok=True)
        
        # Convert PDF to images
        subprocess.run([
            'pdftoppm', 
            '-png', 
            '-r', '300',  # 300 DPI for good OCR
            str(pdf_path), 
            str(images_dir / 'page')
        ], check=True)
        
        # Run OCR on each page
        ocr_texts = []
        for img_file in sorted(images_dir.glob("page-*.png")):
            result = subprocess.run([
                'tesseract', 
                str(img_file), 
                'stdout', 
                '-l', 'eng'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                ocr_texts.append(result.stdout)
        
        # Clean up temp images
        for img_file in images_dir.glob("page-*.png"):
            img_file.unlink()
        images_dir.rmdir()
        
        # Clean up text file if it exists
        if text_output.exists():
            text_output.unlink()
        
        combined_text = '\n\n'.join(ocr_texts)
        return combined_text if combined_text.strip() else None
        
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"OCR not available or failed for {pdf_path.name}: {e}")
        return None

def enhance_metadata_with_ocr(pdf_path: Path, metadata: Dict, config: dict) -> Dict:
    """Enhance existing metadata with OCR information"""
    output_dir = Path(config['paths']['output_dir'])
    
    # Add file hash for duplicate detection
    metadata['file_hash'] = calculate_file_hash(pdf_path)
    metadata['file_size'] = pdf_path.stat().st_size
    
    # Check if text extraction was poor and OCR might help
    current_text = metadata.get('description', '')
    text_quality = estimate_ocr_quality(current_text, metadata.get('page_count', 1))
    
    metadata['text_quality'] = text_quality
    
    # If quality is poor, try OCR
    if text_quality['needs_review'] and text_quality['confidence'] < 0.5:
        print(f"Text quality poor for {pdf_path.name}, attempting OCR...")
        ocr_text = run_ocr_fallback(pdf_path, output_dir)
        
        if ocr_text:
            # Assess OCR quality
            ocr_quality = estimate_ocr_quality(ocr_text, metadata.get('page_count', 1))
            
            # Use OCR text if it's better than original
            if ocr_quality['confidence'] > text_quality['confidence']:
                metadata['description'] = ocr_text[:500] + ('...' if len(ocr_text) > 500 else '')
                metadata['full_text'] = ocr_text
                metadata['text_source'] = 'ocr'
                metadata['ocr_quality'] = ocr_quality
                print(f"OCR improved text quality for {pdf_path.name}")
            else:
                metadata['ocr_attempted'] = True
                metadata['ocr_quality'] = ocr_quality
                print(f"OCR attempted but didn't improve quality for {pdf_path.name}")
        else:
            metadata['ocr_attempted'] = True
            metadata['ocr_failed'] = True
    
    return metadata

def assign_exhibit_numbers(metadata_files: List[Path], config: dict) -> Dict[str, str]:
    """Assign deterministic exhibit numbers based on category and chronology"""
    exhibits = {}
    
    # Category prefixes
    prefixes = {
        'Primary': 'PE',     # Primary Evidence
        'Supporting': 'SE',  # Supporting Evidence  
        'External': 'EE',    # External Evidence
        'No': 'NE'           # Not Evidence (admin)
    }
    
    # Load and sort all metadata
    docs_by_category = {cat: [] for cat in prefixes.keys()}
    
    for meta_file in metadata_files:
        try:
            with open(meta_file, 'r', encoding='utf-8') as f:
                meta = json.load(f)
                meta['meta_file'] = meta_file
                docs_by_category[meta.get('category', 'Supporting')].append(meta)
        except Exception as e:
            print(f"Warning: Could not read {meta_file}: {e}")
    
    # Sort each category by upload date/filename for consistency
    for category in docs_by_category:
        docs_by_category[category].sort(key=lambda x: x.get('uploadedAt', x.get('file_name', '')))
    
    # Assign exhibit numbers
    for category, docs in docs_by_category.items():
        if category == 'No':
            continue  # Don't assign exhibit numbers to non-evidence
            
        for i, doc in enumerate(docs, 1):
            exhibit_id = f"{prefixes[category]}-{i:04d}"
            exhibits[doc['file_name']] = exhibit_id
            
            # Update the metadata file with exhibit number
            doc['exhibit_number'] = exhibit_id
            with open(doc['meta_file'], 'w', encoding='utf-8') as f:
                del doc['meta_file']  # Remove temp field before saving
                json.dump(doc, f, ensure_ascii=False, indent=2)
    
    return exhibits

def main():
    """Main function for OCR and deduplication pipeline"""
    import argparse
    
    parser = argparse.ArgumentParser(description='OCR and deduplication pipeline')
    parser.add_argument('--config', default='config.ci.yaml', help='Configuration file')
    parser.add_argument('--check-duplicates', action='store_true', help='Check for duplicate files')
    parser.add_argument('--assign-exhibits', action='store_true', help='Assign exhibit numbers')
    parser.add_argument('--ocr-enhance', action='store_true', help='Enhance with OCR')
    parser.add_argument('--all', action='store_true', help='Run all enhancements')
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    input_dir = Path(config['paths']['input_dir'])
    metadata_dir = Path(config['paths']['metadata_dir'])
    
    if not input_dir.exists() or not metadata_dir.exists():
        print("Input or metadata directory not found")
        return 1
    
    if args.all:
        args.check_duplicates = True
        args.assign_exhibits = True
        args.ocr_enhance = True
    
    # Check for duplicates
    if args.check_duplicates:
        duplicates = check_duplicate_files(input_dir, metadata_dir)
        if duplicates:
            print(f"Found {len(duplicates)} duplicate files:")
            for dup in duplicates:
                print(f"  {dup['new_file']} is duplicate of {dup['duplicate_of']}")
            
            # Save duplicate report
            with open(metadata_dir / 'duplicates.json', 'w', encoding='utf-8') as f:
                json.dump(duplicates, f, ensure_ascii=False, indent=2)
    
    # OCR enhancement
    if args.ocr_enhance:
        for pdf_file in input_dir.glob("*.pdf"):
            meta_file = metadata_dir / f"{pdf_file.stem}.json"
            if meta_file.exists():
                with open(meta_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                
                enhanced_metadata = enhance_metadata_with_ocr(pdf_file, metadata, config)
                
                with open(meta_file, 'w', encoding='utf-8') as f:
                    json.dump(enhanced_metadata, f, ensure_ascii=False, indent=2)
    
    # Assign exhibit numbers
    if args.assign_exhibits:
        metadata_files = list(metadata_dir.glob("*.json"))
        metadata_files = [f for f in metadata_files if f.name != 'duplicates.json']
        exhibits = assign_exhibit_numbers(metadata_files, config)
        
        print(f"Assigned exhibit numbers to {len(exhibits)} documents")
        
        # Save exhibit mapping
        with open(metadata_dir / 'exhibit_mapping.json', 'w', encoding='utf-8') as f:
            json.dump(exhibits, f, ensure_ascii=False, indent=2)
    
    print("Enhancement pipeline completed")
    return 0

if __name__ == '__main__':
    sys.exit(main())