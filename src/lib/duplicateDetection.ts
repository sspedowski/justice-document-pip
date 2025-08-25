/**
 * Duplicate Detection System
 * Detects duplicate PDFs based on multiple factors to prevent redundant processing
 */

import CryptoJS from 'crypto-js'

export interface FileFingerprint {
  fileName: string
  fileSize: number
  fileHash: string
  pageCount?: number
  firstPageHash?: string
  lastModified?: number
  contentPreview?: string // First 500 chars of extracted text
}

export interface DuplicateResult {
  isDuplicate: boolean
  matchType: 'exact' | 'rename' | 'partial' | 'content' | 'none'
  confidence: number // 0-100
  existingDocument?: any
  reason?: string
}

/**
 * Generate a comprehensive fingerprint for a PDF file
 */
export async function generateFileFingerprint(
  file: File, 
  extractedText?: string, 
  pageCount?: number
): Promise<FileFingerprint> {
  // Calculate file hash
  const fileHash = await calculateFileHash(file)
  
  // Get first page hash if we have extracted text
  const firstPageHash = extractedText 
    ? CryptoJS.SHA256(extractedText.substring(0, 2000)).toString() 
    : undefined
    
  // Content preview for fuzzy matching
  const contentPreview = extractedText 
    ? extractedText.replace(/\s+/g, ' ').trim().substring(0, 500)
    : undefined

  return {
    fileName: file.name,
    fileSize: file.size,
    fileHash,
    pageCount,
    firstPageHash,
    lastModified: file.lastModified,
    contentPreview
  }
}

/**
 * Calculate SHA-256 hash of file contents
 */
async function calculateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
        const hash = CryptoJS.SHA256(wordArray).toString()
        resolve(hash)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file for hashing'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Check if a file is a duplicate of existing documents
 */
export function detectDuplicate(
  newFingerprint: FileFingerprint,
  existingDocuments: any[]
): DuplicateResult {
  if (!existingDocuments || existingDocuments.length === 0) {
    return { isDuplicate: false, matchType: 'none', confidence: 0 }
  }

  for (const doc of existingDocuments) {
    const result = compareFingerprints(newFingerprint, doc)
    if (result.isDuplicate) {
      return result
    }
  }

  return { isDuplicate: false, matchType: 'none', confidence: 0 }
}

/**
 * Compare two file fingerprints to determine if they're duplicates
 */
function compareFingerprints(
  newFingerprint: FileFingerprint,
  existingDoc: any
): DuplicateResult {
  const existing = existingDoc.fingerprint || extractDocumentFingerprint(existingDoc)
  
  // 1. Exact file hash match (100% confidence)
  if (existing.fileHash && newFingerprint.fileHash === existing.fileHash) {
    return {
      isDuplicate: true,
      matchType: 'exact',
      confidence: 100,
      existingDocument: existingDoc,
      reason: 'Identical file hash - exact same file'
    }
  }
  
  // 2. Same filename and size (95% confidence)
  if (newFingerprint.fileName === existing.fileName && 
      newFingerprint.fileSize === existing.fileSize) {
    return {
      isDuplicate: true,
      matchType: 'rename',
      confidence: 95,
      existingDocument: existingDoc,
      reason: 'Same filename and file size'
    }
  }
  
  // 3. First page content match (90% confidence)
  if (existing.firstPageHash && newFingerprint.firstPageHash &&
      newFingerprint.firstPageHash === existing.firstPageHash) {
    return {
      isDuplicate: true,
      matchType: 'content',
      confidence: 90,
      existingDocument: existingDoc,
      reason: 'Identical first page content'
    }
  }
  
  // 4. Similar content preview (70% confidence)
  if (existing.contentPreview && newFingerprint.contentPreview) {
    const similarity = calculateTextSimilarity(
      newFingerprint.contentPreview, 
      existing.contentPreview
    )
    
    if (similarity > 0.85) {
      return {
        isDuplicate: true,
        matchType: 'partial',
        confidence: Math.round(similarity * 100),
        existingDocument: existingDoc,
        reason: `${Math.round(similarity * 100)}% content similarity`
      }
    }
  }
  
  // 5. Same file size and page count (60% confidence - possible scan/resave)
  if (newFingerprint.fileSize === existing.fileSize &&
      newFingerprint.pageCount && existing.pageCount &&
      newFingerprint.pageCount === existing.pageCount) {
    return {
      isDuplicate: true,
      matchType: 'partial',
      confidence: 60,
      existingDocument: existingDoc,
      reason: 'Same file size and page count - possible rescan'
    }
  }
  
  return { isDuplicate: false, matchType: 'none', confidence: 0 }
}

/**
 * Extract fingerprint data from existing document
 */
function extractDocumentFingerprint(doc: any): Partial<FileFingerprint> {
  return {
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    fileHash: doc.fileHash,
    pageCount: doc.pageCount,
    firstPageHash: doc.firstPageHash,
    lastModified: doc.lastModified ? new Date(doc.lastModified).getTime() : undefined,
    contentPreview: doc.textContent ? doc.textContent.substring(0, 500) : undefined
  }
}

/**
 * Calculate text similarity using Jaccard index
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0
  
  // Normalize texts
  const normalize = (text: string) => 
    text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(word => word.length > 2)
  
  const words1 = new Set(normalize(text1))
  const words2 = new Set(normalize(text2))
  
  if (words1.size === 0 && words2.size === 0) return 1
  if (words1.size === 0 || words2.size === 0) return 0
  
  // Jaccard similarity: intersection / union
  const intersection = new Set([...words1].filter(word => words2.has(word)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

/**
 * Generate duplicate prevention rules for UI display
 */
export function getDuplicatePreventionRules(): Array<{
  type: string
  description: string
  confidence: number
}> {
  return [
    {
      type: 'Exact Hash',
      description: 'Identical file contents (byte-for-byte match)',
      confidence: 100
    },
    {
      type: 'Name + Size',
      description: 'Same filename and file size',
      confidence: 95
    },
    {
      type: 'Content Match',
      description: 'Identical first page or document content',
      confidence: 90
    },
    {
      type: 'Similar Content',
      description: '85%+ text similarity in document preview',
      confidence: 85
    },
    {
      type: 'Size + Pages',
      description: 'Same file size and page count (possible rescan)',
      confidence: 60
    }
  ]
}

/**
 * Handle duplicate detection during upload
 */
export function handleDuplicateAction(
  action: 'skip' | 'replace' | 'keep-both',
  newDocument: any,
  existingDocument: any,
  onReplace?: (oldDoc: any, newDoc: any) => void,
  onKeepBoth?: (newDoc: any) => void,
  onSkip?: (existingDoc: any) => void
) {
  switch (action) {
    case 'replace':
      if (onReplace) {
        onReplace(existingDocument, {
          ...newDocument,
          id: existingDocument.id, // Keep same ID
          uploadedAt: new Date().toISOString()
        })
      }
      break
      
    case 'keep-both':
      if (onKeepBoth) {
        // Modify filename to indicate duplicate
        const timestamp = new Date().getTime()
        const newFileName = newDocument.fileName.replace(
          /(\.[^.]+)$/, 
          `_${timestamp}$1`
        )
        onKeepBoth({
          ...newDocument,
          fileName: newFileName,
          title: `${newDocument.title} (Copy ${timestamp})`
        })
      }
      break
      
    case 'skip':
    default:
      if (onSkip) {
        onSkip(existingDocument)
      }
      break
  }
}