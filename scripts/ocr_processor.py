#!/usr/bin/env python3
"""
OCR Processing and Duplicate Detection for Justice Document Manager

This script provides:
1. OCR fallback for scanned PDFs using Tesseract
2. Text quality assessment and confidence scoring
3. File hash-based duplicate detection
4. Enhanced metadata generation with OCR metrics

Usage:
    python scripts/ocr_processor.py --input input/ --output output/metadata/
"""

import os
import sys
import json
import hashlib
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import tempfile
import subprocess

# OCR dependencies (install with: pip install pytesseract Pillow pdf2image)
try:
    import pytesseract
    from PIL import Image
    from pdf2image import convert_from_path
    OCR_AVAILABLE = True
except ImportError:
    print("⚠️  OCR dependencies not available. Install with:")
    print("   pip install pytesseract Pillow pdf2image")
    print("   Also install tesseract-ocr system package")
    OCR_AVAILABLE = False

# PDF processing
try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    print("❌ pdfplumber not available. Install with: pip install pdfplumber")
    PDF_AVAILABLE = False

def calculate_file_hash(file_path: Path) -> str:
    """Calculate SHA256 hash of file for duplicate detection."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()

def get_pdf_basic_info(file_path: Path) -> Dict:
    """Extract basic PDF information without OCR."""
    try:
        with pdfplumber.open(file_path) as pdf:
            return {
                'page_count': len(pdf.pages),
                'file_size': file_path.stat().st_size,
                'has_text': any(page.extract_text() for page in pdf.pages[:3])  # Check first 3 pages
            }
    except Exception as e:
        return {
            'page_count': 0,
            'file_size': file_path.stat().st_size,
            'has_text': False,
            'error': str(e)
        }

def extract_text_with_confidence(file_path: Path, max_pages: int = 10) -> Dict:
    """
    Extract text using direct PDF extraction first, then OCR if needed.
    Returns text content with confidence metrics.
    """
    if not PDF_AVAILABLE:
        return {'text': '', 'method': 'error', 'confidence': 0, 'error': 'PDF processing not available'}
    
    result = {
        'text': '',
        'method': 'direct',
        'confidence': 0.0,
        'page_count': 0,
        'pages_with_text': 0,
        'ocr_pages': 0,
        'processing_time': 0
    }
    
    import time
    start_time = time.time()
    
    try:
        # First, try direct text extraction
        with pdfplumber.open(file_path) as pdf:
            result['page_count'] = len(pdf.pages)
            pages_to_process = min(max_pages, len(pdf.pages))
            
            direct_text_pages = []
            low_text_pages = []
            
            for i, page in enumerate(pdf.pages[:pages_to_process]):
                page_text = page.extract_text() or ''
                
                # Determine if page has sufficient text
                word_count = len(page_text.split())
                char_count = len(page_text.strip())
                
                if word_count >= 10 and char_count >= 50:
                    # Good text extraction
                    direct_text_pages.append(page_text)
                    result['pages_with_text'] += 1
                elif word_count >= 3:
                    # Some text but might benefit from OCR
                    direct_text_pages.append(page_text)
                    low_text_pages.append(i)
                    result['pages_with_text'] += 1
                else:
                    # Likely scanned page, needs OCR
                    low_text_pages.append(i)
            
            # Combine direct text
            result['text'] = '\n\n'.join(direct_text_pages)
            
            # Calculate initial confidence
            if result['pages_with_text'] > 0:
                result['confidence'] = min(0.9, result['pages_with_text'] / pages_to_process)
                result['method'] = 'direct'
            
            # OCR fallback for low-text pages
            if low_text_pages and OCR_AVAILABLE and len(result['text'].split()) < 100:
                print(f"📄 Running OCR on {len(low_text_pages)} pages with low text extraction...")
                ocr_text = perform_ocr_on_pages(file_path, low_text_pages[:5])  # Limit OCR pages
                
                if ocr_text:
                    result['text'] += '\n\n--- OCR EXTRACTED TEXT ---\n\n' + ocr_text
                    result['method'] = 'hybrid'
                    result['ocr_pages'] = len(low_text_pages)
                    result['confidence'] = min(0.8, result['confidence'] + 0.3)
            
            # Final confidence adjustment
            word_count = len(result['text'].split())
            if word_count > 500:
                result['confidence'] = min(1.0, result['confidence'] + 0.1)
            elif word_count < 50:
                result['confidence'] = max(0.1, result['confidence'] - 0.2)
    
    except Exception as e:
        result['error'] = str(e)
        result['method'] = 'error'
        result['confidence'] = 0.0
    
    result['processing_time'] = time.time() - start_time
    return result

def perform_ocr_on_pages(file_path: Path, page_indices: List[int]) -> str:
    """Perform OCR on specific pages of a PDF."""
    if not OCR_AVAILABLE:
        return ""
    
    try:
        # Convert specific pages to images
        images = convert_from_path(
            file_path,
            first_page=min(page_indices) + 1,
            last_page=max(page_indices) + 1,
            dpi=200,
            fmt='JPEG'
        )
        
        ocr_text_parts = []
        for i, image in enumerate(images):
            if min(page_indices) + i in page_indices:
                # Configure OCR for better accuracy
                custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()[]{}"-\'/\n '
                
                try:
                    page_text = pytesseract.image_to_string(image, config=custom_config)
                    if page_text.strip():
                        ocr_text_parts.append(f"--- Page {min(page_indices) + i + 1} ---\n{page_text}")
                except Exception as e:
                    print(f"OCR failed for page {min(page_indices) + i + 1}: {e}")
        
        return '\n\n'.join(ocr_text_parts)
    
    except Exception as e:
        print(f"OCR processing failed: {e}")
        return ""

def detect_duplicates(file_hashes: Dict[str, str]) -> Dict[str, List[str]]:
    """Detect duplicate files based on hash values."""
    hash_to_files = {}
    for filename, file_hash in file_hashes.items():
        if file_hash not in hash_to_files:
            hash_to_files[file_hash] = []
        hash_to_files[file_hash].append(filename)
    
    # Return only groups with duplicates
    return {h: files for h, files in hash_to_files.items() if len(files) > 1}

def assign_exhibit_id(filename: str, category: str, existing_ids: set) -> str:
    """Assign deterministic exhibit IDs based on content category."""
    prefixes = {
        'Primary': 'PE',     # Primary Evidence
        'Supporting': 'SE',  # Supporting Evidence
        'External': 'EX',    # External
        'CPS': 'CPS',       # Child Protective Services
        'Police': 'LE',     # Law Enforcement
        'Medical': 'MED',   # Medical Records
        'Court': 'CT',      # Court Documents
        'Communication': 'COM'  # Communications
    }
    
    # Determine prefix
    prefix = prefixes.get(category, 'DOC')
    
    # Generate base number from filename hash (deterministic)
    name_hash = hashlib.md5(filename.encode()).hexdigest()
    base_number = int(name_hash[:6], 16) % 9000 + 1000  # 4-digit number
    
    # Ensure uniqueness
    exhibit_id = f"{prefix}-{base_number:04d}"
    counter = 1
    while exhibit_id in existing_ids:
        exhibit_id = f"{prefix}-{base_number:04d}-{counter}"
        counter += 1
    
    return exhibit_id

def enhance_metadata_with_ocr(input_dir: Path, output_dir: Path, force_ocr: bool = False):
    """Process PDFs with OCR and duplicate detection, enhance metadata."""
    
    if not PDF_AVAILABLE:
        print("❌ PDF processing not available")
        return
    
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    pdf_files = list(input_path.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {input_path}")
        return
    
    print(f"🔍 Processing {len(pdf_files)} PDF files...")
    
    # Step 1: Calculate hashes and detect duplicates
    print("📊 Calculating file hashes...")
    file_hashes = {}
    for pdf_file in pdf_files:
        file_hashes[pdf_file.name] = calculate_file_hash(pdf_file)
    
    duplicates = detect_duplicates(file_hashes)
    if duplicates:
        print(f"⚠️  Found {len(duplicates)} groups of duplicate files:")
        for file_hash, files in duplicates.items():
            print(f"   Hash {file_hash[:12]}...: {', '.join(files)}")
    
    # Step 2: Process each PDF
    existing_exhibit_ids = set()
    processing_results = []
    
    for i, pdf_file in enumerate(pdf_files, 1):
        print(f"📄 Processing {pdf_file.name} ({i}/{len(pdf_files)})...")
        
        # Basic PDF info
        basic_info = get_pdf_basic_info(pdf_file)
        
        # Text extraction with OCR fallback
        if force_ocr or not basic_info.get('has_text', False):
            print(f"   🔤 Extracting text (OCR mode)...")
            text_result = extract_text_with_confidence(pdf_file, max_pages=15)
        else:
            print(f"   📝 Extracting text (direct mode)...")
            text_result = extract_text_with_confidence(pdf_file, max_pages=10)
        
        # Determine category based on content
        category = guess_enhanced_category(text_result['text'], pdf_file.name)
        
        # Assign exhibit ID
        exhibit_id = assign_exhibit_id(pdf_file.name, category, existing_exhibit_ids)
        existing_exhibit_ids.add(exhibit_id)
        
        # Check for duplicates
        file_hash = file_hashes[pdf_file.name]
        is_duplicate = file_hash in duplicates and len(duplicates[file_hash]) > 1
        duplicate_group = duplicates.get(file_hash, []) if is_duplicate else []
        
        # Enhanced metadata
        metadata = {
            'file_name': pdf_file.name,
            'exhibit_id': exhibit_id,
            'file_hash': file_hash,
            'file_size': basic_info['file_size'],
            'page_count': basic_info['page_count'],
            'category': category,
            'text_extraction': {
                'method': text_result['method'],
                'confidence': text_result['confidence'],
                'word_count': len(text_result['text'].split()),
                'char_count': len(text_result['text']),
                'pages_with_text': text_result.get('pages_with_text', 0),
                'ocr_pages': text_result.get('ocr_pages', 0),
                'processing_time': text_result.get('processing_time', 0)
            },
            'quality_flags': generate_quality_flags(text_result, basic_info),
            'duplicate_info': {
                'is_duplicate': is_duplicate,
                'duplicate_group': duplicate_group,
                'is_primary_copy': pdf_file.name == min(duplicate_group) if duplicate_group else True
            },
            'extracted_text': text_result['text'][:50000],  # Limit size
            'generated_at': __import__('datetime').datetime.utcnow().isoformat() + 'Z'
        }
        
        # Save enhanced metadata
        output_file = output_path / f"{pdf_file.stem}.enhanced.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        processing_results.append(metadata)
        
        print(f"   ✅ {exhibit_id} | {category} | Confidence: {text_result['confidence']:.2f} | Words: {len(text_result['text'].split())}")
    
    # Step 3: Generate summary report
    generate_processing_summary(processing_results, output_path)
    
    print(f"\n🎉 Processing complete! Enhanced metadata saved to {output_path}")

def guess_enhanced_category(text: str, filename: str) -> str:
    """Enhanced category detection with better patterns."""
    text_lower = text.lower()
    filename_lower = filename.lower()
    
    # Medical/forensic evidence
    medical_indicators = [
        'nurse exam', 'forensic exam', 'medical exam', 'sexual assault exam',
        'body diagram', 'injury assessment', 'medical history', 'physician',
        'hospital', 'emergency room', 'patient', 'diagnosis'
    ]
    
    # Law enforcement
    police_indicators = [
        'police report', 'incident report', 'arrest report', 'investigation',
        'detective', 'officer', 'badge', 'case number', 'miranda',
        'probable cause', 'warrant', 'booking'
    ]
    
    # CPS/Child services
    cps_indicators = [
        'child protective', 'family services', 'social worker', 'cps',
        'child welfare', 'foster care', 'removal', 'safety plan',
        'case plan', 'family court', 'custody'
    ]
    
    # Court documents
    court_indicators = [
        'court order', 'hearing', 'motion', 'petition', 'judgment',
        'docket', 'subpoena', 'summons', 'transcript', 'pleading',
        'honorable', 'clerk of court'
    ]
    
    # Communications
    comm_indicators = [
        'email', 'text message', 'phone call', 'voicemail', 'letter',
        'correspondence', 'memo', 'notification', 'communication'
    ]
    
    # Check patterns
    if any(indicator in text_lower or indicator in filename_lower for indicator in medical_indicators):
        return 'Medical'
    elif any(indicator in text_lower or indicator in filename_lower for indicator in police_indicators):
        return 'Police'
    elif any(indicator in text_lower or indicator in filename_lower for indicator in cps_indicators):
        return 'CPS'
    elif any(indicator in text_lower or indicator in filename_lower for indicator in court_indicators):
        return 'Court'
    elif any(indicator in text_lower or indicator in filename_lower for indicator in comm_indicators):
        return 'Communication'
    
    # Fallback classification
    word_count = len(text.split())
    if word_count > 1000:
        return 'Primary'
    elif word_count > 100:
        return 'Supporting'
    else:
        return 'External'

def generate_quality_flags(text_result: Dict, basic_info: Dict) -> List[str]:
    """Generate quality assessment flags."""
    flags = []
    
    confidence = text_result.get('confidence', 0)
    word_count = len(text_result.get('text', '').split())
    method = text_result.get('method', '')
    
    if confidence < 0.3:
        flags.append('low_confidence')
    if word_count < 50:
        flags.append('minimal_text')
    if method == 'error':
        flags.append('extraction_failed')
    if text_result.get('ocr_pages', 0) > 0:
        flags.append('ocr_used')
    if basic_info.get('page_count', 0) > 50:
        flags.append('large_document')
    if basic_info.get('file_size', 0) > 50 * 1024 * 1024:  # 50MB
        flags.append('large_file')
    
    return flags

def generate_processing_summary(results: List[Dict], output_dir: Path):
    """Generate a summary report of processing results."""
    summary = {
        'total_files': len(results),
        'categories': {},
        'quality_metrics': {
            'high_confidence': 0,
            'medium_confidence': 0,
            'low_confidence': 0,
            'ocr_used': 0,
            'extraction_failed': 0
        },
        'duplicates_found': sum(1 for r in results if r['duplicate_info']['is_duplicate']),
        'exhibit_ids_assigned': len(set(r['exhibit_id'] for r in results)),
        'total_words_extracted': sum(r['text_extraction']['word_count'] for r in results),
        'generated_at': __import__('datetime').datetime.utcnow().isoformat() + 'Z'
    }
    
    # Category breakdown
    for result in results:
        category = result['category']
        summary['categories'][category] = summary['categories'].get(category, 0) + 1
        
        # Quality metrics
        confidence = result['text_extraction']['confidence']
        if confidence >= 0.7:
            summary['quality_metrics']['high_confidence'] += 1
        elif confidence >= 0.4:
            summary['quality_metrics']['medium_confidence'] += 1
        else:
            summary['quality_metrics']['low_confidence'] += 1
        
        if result['text_extraction']['ocr_pages'] > 0:
            summary['quality_metrics']['ocr_used'] += 1
        
        if result['text_extraction']['method'] == 'error':
            summary['quality_metrics']['extraction_failed'] += 1
    
    # Save summary
    summary_file = output_dir / 'processing_summary.json'
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 Processing Summary:")
    print(f"   Total files: {summary['total_files']}")
    print(f"   Categories: {dict(summary['categories'])}")
    print(f"   High confidence: {summary['quality_metrics']['high_confidence']}")
    print(f"   OCR used: {summary['quality_metrics']['ocr_used']}")
    print(f"   Duplicates: {summary['duplicates_found']}")

def main():
    parser = argparse.ArgumentParser(description='OCR Processing and Duplicate Detection')
    parser.add_argument('--input', type=Path, default='input/', help='Input directory with PDFs')
    parser.add_argument('--output', type=Path, default='output/metadata/', help='Output directory for metadata')
    parser.add_argument('--force-ocr', action='store_true', help='Force OCR even for text-based PDFs')
    parser.add_argument('--check-deps', action='store_true', help='Check if dependencies are installed')
    
    args = parser.parse_args()
    
    if args.check_deps:
        print("🔍 Checking dependencies...")
        print(f"   pdfplumber: {'✅ Available' if PDF_AVAILABLE else '❌ Not available'}")
        print(f"   OCR (Tesseract): {'✅ Available' if OCR_AVAILABLE else '❌ Not available'}")
        
        if OCR_AVAILABLE:
            try:
                version = pytesseract.get_tesseract_version()
                print(f"   Tesseract version: {version}")
            except Exception as e:
                print(f"   Tesseract error: {e}")
        
        return
    
    if not args.input.exists():
        print(f"❌ Input directory {args.input} does not exist")
        return
    
    enhance_metadata_with_ocr(args.input, args.output, args.force_ocr)

if __name__ == '__main__':
    main()