/**
 * Enhanced duplicate detection system with comprehensive error handling and type safety
 */

import CryptoJS from 'crypto-js'
import { ApplicationError, ErrorFactory, safeAsync, Validator, ERROR_CODES } from './errorHandler'
import type { Result, AsyncResult } from './errorHandler'
import type { FileFingerprint, DuplicateResult, Document } from './types'

/**
 * Generate a comprehensive fingerprint for a PDF file with error handling
 */
export async function generateFileFingerprint(
  file: File, 
  extractedText?: string, 
  pageCount?: number
): AsyncResult<FileFingerprint> {
  // Validate inputs
  const fileValidation = Validator.isValidPDFFile(file)
  if (!fileValidation.success) {
    return fileValidation as AsyncResult<FileFingerprint>
  }

  return await safeAsync(async (): Promise<FileFingerprint> => {
    // Calculate file hash
    const fileHashResult = await calculateFileHash(file)
    if (!fileHashResult.success) {
      throw fileHashResult.error
    }
    
    // Get first page hash if we have extracted text
    let firstPageHash: string | undefined
    if (extractedText && extractedText.length > 0) {
      try {
        const textToHash = extractedText.substring(0, 2000).trim()
        if (textToHash) {
          firstPageHash = CryptoJS.SHA256(textToHash).toString()
        }
      } catch (hashError) {
        console.warn('Failed to generate first page hash:', hashError)
        // Continue without first page hash
      }
    }
      
    // Content preview for fuzzy matching
    let contentPreview: string | undefined
    if (extractedText && extractedText.length > 0) {
      try {
        contentPreview = extractedText
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 500)
      } catch (previewError) {
        console.warn('Failed to generate content preview:', previewError)
        // Continue without preview
      }
    }

    const fingerprint: FileFingerprint = {
      fileName: file.name,
      fileSize: file.size,
      fileHash: fileHashResult.data,
      pageCount: pageCount && pageCount > 0 ? pageCount : undefined,
      firstPageHash,
      lastModified: file.lastModified || Date.now(),
      contentPreview
    }

    return fingerprint
  }, (error) => 
    ErrorFactory.fileError(
      ERROR_CODES.PDF_EXTRACTION_FAILED,
      file.name,
      error instanceof Error ? error : new Error('Failed to generate file fingerprint')
    )
  )
}

/**
 * Calculate SHA-256 hash of a file with error handling
 */
export async function calculateFileHash(file: File): AsyncResult<string> {
  const fileValidation = Validator.isValidPDFFile(file)
  if (!fileValidation.success) {
    return fileValidation as AsyncResult<string>
  }

  return await safeAsync(async (): Promise<string> => {
    // Use a smaller chunk size for large files to prevent memory issues
    const chunkSize = 64 * 1024 // 64KB chunks
    const hasher = CryptoJS.algo.SHA256.create()
    
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size))
      const arrayBuffer = await chunk.arrayBuffer()
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
      hasher.update(wordArray)
    }
    
    return hasher.finalize().toString()
  }, (error) => 
    ErrorFactory.fileError(
      ERROR_CODES.FILE_CORRUPTED,
      file.name,
      error instanceof Error ? error : new Error('Failed to calculate file hash')
    )
  )
}

/**
 * Detect if a file is a duplicate with enhanced error handling and type safety
 */
export function detectDuplicate(
  fingerprint: FileFingerprint, 
  existingDocuments: Document[]
): Result<DuplicateResult> {
  try {
    // Validate inputs
    if (!fingerprint || typeof fingerprint !== 'object') {
      return {
        success: false,
        error: ErrorFactory.validationError('fingerprint', fingerprint, 'Invalid fingerprint object')
      }
    }

    if (!Array.isArray(existingDocuments)) {
      return {
        success: false,
        error: ErrorFactory.validationError('existingDocuments', existingDocuments, 'Existing documents must be an array')
      }
    }

    // Filter out invalid documents
    const validDocuments = existingDocuments.filter(doc => {
      return doc && 
        typeof doc === 'object' && 
        typeof doc.id === 'string' && 
        typeof doc.fileName === 'string'
    })

    if (validDocuments.length === 0) {
      return {
        success: true,
        data: {
          isDuplicate: false,
          matchType: 'none',
          confidence: 0
        }
      }
    }

    // Check for exact file hash match (highest confidence)
    if (fingerprint.fileHash) {
      for (const doc of validDocuments) {
        if (doc.fileHash === fingerprint.fileHash) {
          return {
            success: true,
            data: {
              isDuplicate: true,
              matchType: 'exact',
              confidence: 100,
              existingDocument: doc,
              reason: 'Identical file hash detected'
            }
          }
        }
      }
    }

    // Check for same filename and size (high confidence)
    for (const doc of validDocuments) {
      if (doc.fileName === fingerprint.fileName && 
          doc.fileSize === fingerprint.fileSize) {
        return {
          success: true,
          data: {
            isDuplicate: true,
            matchType: 'rename',
            confidence: 95,
            existingDocument: doc,
            reason: 'Same filename and file size'
          }
        }
      }
    }

    // Check for first page content match (medium-high confidence)
    if (fingerprint.firstPageHash) {
      for (const doc of validDocuments) {
        if (doc.firstPageHash === fingerprint.firstPageHash && 
            doc.pageCount === fingerprint.pageCount) {
          return {
            success: true,
            data: {
              isDuplicate: true,
              matchType: 'content',
              confidence: 85,
              existingDocument: doc,
              reason: 'Same first page content and page count'
            }
          }
        }
      }
    }

    // Check for similar content preview (medium confidence)
    if (fingerprint.contentPreview && fingerprint.contentPreview.length > 100) {
      for (const doc of validDocuments) {
        if (doc.fingerprint?.contentPreview) {
          const similarity = calculateStringSimilarity(
            fingerprint.contentPreview, 
            doc.fingerprint.contentPreview
          )
          
          if (similarity > 0.8) {
            return {
              success: true,
              data: {
                isDuplicate: true,
                matchType: 'content',
                confidence: Math.round(similarity * 70), // Scale down for content similarity
                existingDocument: doc,
                reason: `Similar content detected (${Math.round(similarity * 100)}% similarity)`
              }
            }
          }
        }
      }
    }

    // Check for date-based patterns (lower confidence, requires user decision)
    const dateMatches = findDateBasedMatches(fingerprint, validDocuments)
    if (dateMatches.length > 0) {
      return {
        success: true,
        data: {
          isDuplicate: true,
          matchType: 'date-based',
          confidence: 60,
          existingDocument: dateMatches[0], // Primary match
          reason: 'Multiple documents from same date detected',
          dateMatch: {
            sharedDate: extractDateFromDocument(dateMatches[0]) || 'Unknown',
            otherDocuments: dateMatches,
            requiresComparison: true
          }
        }
      }
    }

    // No duplicates found
    return {
      success: true,
      data: {
        isDuplicate: false,
        matchType: 'none',
        confidence: 0
      }
    }
  } catch (error) {
    return {
      success: false,
      error: ErrorFactory.storageError(
        ERROR_CODES.STORAGE_OPERATION_FAILED,
        'duplicate detection',
        error instanceof Error ? error : new Error('Duplicate detection failed')
      )
    }
  }
}

/**
 * Calculate string similarity using Jaccard similarity
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  try {
    if (!str1 || !str2) return 0
    if (str1 === str2) return 1

    // Normalize strings
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
    const normalized1 = normalize(str1)
    const normalized2 = normalize(str2)

    if (normalized1 === normalized2) return 1

    // Create word sets
    const set1 = new Set(normalized1.split(/\s+/))
    const set2 = new Set(normalized2.split(/\s+/))

    // Calculate Jaccard similarity
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return union.size > 0 ? intersection.size / union.size : 0
  } catch (error) {
    console.warn('Error calculating string similarity:', error)
    return 0
  }
}

/**
 * Find documents that might be from the same date/event
 */
function findDateBasedMatches(fingerprint: FileFingerprint, documents: Document[]): Document[] {
  try {
    const matches: Document[] = []
    
    // Look for similar file modification times (within 24 hours)
    if (fingerprint.lastModified) {
      const targetDate = new Date(fingerprint.lastModified)
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      for (const doc of documents) {
        if (doc.fingerprint?.lastModified) {
          const docDate = new Date(doc.fingerprint.lastModified)
          if (docDate >= dayStart && docDate < dayEnd) {
            matches.push(doc)
          }
        }
      }
    }

    return matches
  } catch (error) {
    console.warn('Error finding date-based matches:', error)
    return []
  }
}

/**
 * Extract date information from a document
 */
function extractDateFromDocument(document: Document): string | null {
  try {
    if (document.fingerprint?.lastModified) {
      return new Date(document.fingerprint.lastModified).toDateString()
    }
    
    if (document.uploadedAt) {
      return new Date(document.uploadedAt).toDateString()
    }
    
    return null
  } catch (error) {
    console.warn('Error extracting date from document:', error)
    return null
  }
}

/**
 * Handle duplicate action with type safety
 */
export function handleDuplicateAction(
  action: 'skip' | 'replace' | 'keep-both',
  newDocument: Partial<Document>,
  existingDocument: Document,
  onReplace?: (oldDoc: Document, newDoc: Document) => void,
  onKeepBoth?: (newDoc: Document) => void,
  onSkip?: (existingDoc: Document) => void
): Result<void> {
  try {
    // Validate inputs
    if (!action || !['skip', 'replace', 'keep-both'].includes(action)) {
      return {
        success: false,
        error: ErrorFactory.validationError('action', action, 'Invalid duplicate action')
      }
    }

    if (!existingDocument || typeof existingDocument.id !== 'string') {
      return {
        success: false,
        error: ErrorFactory.validationError('existingDocument', existingDocument, 'Invalid existing document')
      }
    }

    switch (action) {
      case 'skip':
        if (onSkip) {
          onSkip(existingDocument)
        }
        break

      case 'replace':
        if (onReplace && newDocument) {
          const replacementDoc = { ...existingDocument, ...newDocument } as Document
          onReplace(existingDocument, replacementDoc)
        }
        break

      case 'keep-both':
        if (onKeepBoth && newDocument) {
          // Generate unique filename for new document
          const timestamp = Date.now()
          const modifiedDoc = {
            ...newDocument,
            fileName: newDocument.fileName 
              ? newDocument.fileName.replace(/(\.pdf)$/, `_${timestamp}$1`)
              : `document_${timestamp}.pdf`,
            id: `${timestamp}`
          } as Document
          onKeepBoth(modifiedDoc)
        }
        break

      default:
        return {
          success: false,
          error: ErrorFactory.validationError('action', action, 'Unhandled duplicate action')
        }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: ErrorFactory.storageError(
        ERROR_CODES.OPERATION_NOT_PERMITTED,
        'handle duplicate action',
        error instanceof Error ? error : new Error('Duplicate action handling failed')
      )
    }
  }
}

/**
 * Get duplicate prevention rules for UI display
 */
export function getDuplicatePreventionRules(): Array<{
  description: string
  confidence: number
  enabled: boolean
}> {
  return [
    {
      description: 'Identical file hash (exact match)',
      confidence: 100,
      enabled: true
    },
    {
      description: 'Same filename and file size',
      confidence: 95,
      enabled: true
    },
    {
      description: 'Identical first page content',
      confidence: 85,
      enabled: true
    },
    {
      description: 'Similar content (80%+ match)',
      confidence: 70,
      enabled: true
    },
    {
      description: 'Same date grouping',
      confidence: 60,
      enabled: true
    }
  ]
}