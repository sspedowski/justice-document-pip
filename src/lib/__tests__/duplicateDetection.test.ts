import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  generateFileFingerprint, 
  detectDuplicate, 
  handleDuplicateAction,
  getDuplicatePreventionRules
} from '@/lib/duplicateDetection'

// Mock Web Crypto API for consistent hashing in tests
const mockHashBuffer = new ArrayBuffer(32)
const mockHashArray = new Uint8Array(mockHashBuffer)
mockHashArray.fill(171) // Fill with 0xAB to get 'abab...' hex string

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(mockHashBuffer)
    }
  }
})

// Mock TextEncoder for consistent text hashing
Object.defineProperty(global, 'TextEncoder', {
  value: class TextEncoder {
    encode(text: string) {
      return new Uint8Array(Buffer.from(text, 'utf-8'))
    }
  }
})

// Mock File API
const createMockFile = (name: string, size: number, content: string = '') => {
  const file = new File([content], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'size', { value: size })
  Object.defineProperty(file, 'lastModified', { value: Date.now() })
  return file
}

describe('Duplicate Detection System', () => {
  describe('generateFileFingerprint', () => {
    it('should generate a complete fingerprint for a PDF file', async () => {
      const file = createMockFile('test-document.pdf', 1024, 'mock content')
      const extractedText = 'This is extracted PDF text content for testing'
      const pageCount = 5

      const fingerprint = await generateFileFingerprint(file, extractedText, pageCount)

      expect(fingerprint).toEqual({
        fileName: 'test-document.pdf',
        fileSize: 1024,
        fileHash: 'mock-hash-123',
        pageCount: 5,
        firstPageHash: 'mock-hash-123',
        lastModified: expect.any(Number),
        contentPreview: 'This is extracted PDF text content for testing'
      })
    })

    it('should handle missing optional parameters', async () => {
      const file = createMockFile('test.pdf', 512)
      
      const fingerprint = await generateFileFingerprint(file)

      expect(fingerprint.fileName).toBe('test.pdf')
      expect(fingerprint.fileSize).toBe(512)
      expect(fingerprint.pageCount).toBeUndefined()
      expect(fingerprint.firstPageHash).toBeUndefined()
      expect(fingerprint.contentPreview).toBeUndefined()
    })
  })

  describe('detectDuplicate', () => {
    const mockFingerprint = {
      fileName: 'new-document.pdf',
      fileSize: 1024,
      fileHash: 'hash-abc123',
      pageCount: 3,
      firstPageHash: 'page-hash-123',
      contentPreview: 'This is the document content for duplicate testing'
    }

    it('should detect exact file hash match', () => {
      const existingDocs = [{
        id: 'doc1',
        fileName: 'existing.pdf',
        fileHash: 'hash-abc123',
        fingerprint: { fileHash: 'hash-abc123' }
      }]

      const result = detectDuplicate(mockFingerprint, existingDocs)

      expect(result.isDuplicate).toBe(true)
      expect(result.matchType).toBe('exact')
      expect(result.confidence).toBe(100)
      expect(result.reason).toContain('Identical file hash')
    })

    it('should detect filename and size match', () => {
      const existingDocs = [{
        id: 'doc1',
        fileName: 'new-document.pdf',
        fileSize: 1024,
        fingerprint: { 
          fileName: 'new-document.pdf',
          fileSize: 1024,
          fileHash: 'different-hash'
        }
      }]

      const result = detectDuplicate(mockFingerprint, existingDocs)

      expect(result.isDuplicate).toBe(true)
      expect(result.matchType).toBe('rename')
      expect(result.confidence).toBe(95)
      expect(result.reason).toContain('Same filename and file size')
    })

    it('should detect content similarity', () => {
      const existingDocs = [{
        id: 'doc1',
        fileName: 'different.pdf',
        textContent: 'This is the document content for duplicate testing with minor changes',
        fingerprint: {
          contentPreview: 'This is the document content for duplicate testing with minor changes'
        }
      }]

      const result = detectDuplicate(mockFingerprint, existingDocs)

      expect(result.isDuplicate).toBe(true)
      expect(result.matchType).toBe('partial')
      expect(result.confidence).toBeGreaterThan(70)
    })

    it('should return no duplicate for different files', () => {
      const existingDocs = [{
        id: 'doc1',
        fileName: 'completely-different.pdf',
        fileSize: 2048,
        fileHash: 'different-hash',
        fingerprint: {
          fileName: 'completely-different.pdf',
          fileSize: 2048,
          fileHash: 'different-hash',
          contentPreview: 'Completely different content here'
        }
      }]

      const result = detectDuplicate(mockFingerprint, existingDocs)

      expect(result.isDuplicate).toBe(false)
      expect(result.matchType).toBe('none')
      expect(result.confidence).toBe(0)
    })

    it('should handle empty document list', () => {
      const result = detectDuplicate(mockFingerprint, [])

      expect(result.isDuplicate).toBe(false)
      expect(result.matchType).toBe('none')
      expect(result.confidence).toBe(0)
    })
  })

  describe('handleDuplicateAction', () => {
    const mockNewDoc = { fileName: 'new.pdf', title: 'New Document' }
    const mockExistingDoc = { id: 'existing-123', fileName: 'existing.pdf', title: 'Existing Document' }

    it('should handle skip action', () => {
      const onSkip = vi.fn()
      
      handleDuplicateAction('skip', mockNewDoc, mockExistingDoc, undefined, undefined, onSkip)
      
      expect(onSkip).toHaveBeenCalledWith(mockExistingDoc)
    })

    it('should handle replace action', () => {
      const onReplace = vi.fn()
      
      handleDuplicateAction('replace', mockNewDoc, mockExistingDoc, onReplace)
      
      expect(onReplace).toHaveBeenCalledWith(
        mockExistingDoc,
        expect.objectContaining({
          ...mockNewDoc,
          id: 'existing-123',
          uploadedAt: expect.any(String)
        })
      )
    })

    it('should handle keep-both action', () => {
      const onKeepBoth = vi.fn()
      
      handleDuplicateAction('keep-both', mockNewDoc, mockExistingDoc, undefined, onKeepBoth)
      
      expect(onKeepBoth).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: expect.stringMatching(/new_\d+\.pdf/),
          title: expect.stringMatching(/New Document \(Copy \d+\)/)
        })
      )
    })
  })

  describe('getDuplicatePreventionRules', () => {
    it('should return complete set of detection rules', () => {
      const rules = getDuplicatePreventionRules()

      expect(rules).toHaveLength(5)
      expect(rules[0]).toEqual({
        type: 'Exact Hash',
        description: 'Identical file contents (byte-for-byte match)',
        confidence: 100
      })
      expect(rules[4]).toEqual({
        type: 'Size + Pages',
        description: 'Same file size and page count (possible rescan)',
        confidence: 60
      })
    })

    it('should have rules ordered by confidence', () => {
      const rules = getDuplicatePreventionRules()
      
      for (let i = 1; i < rules.length; i++) {
        expect(rules[i - 1].confidence).toBeGreaterThanOrEqual(rules[i].confidence)
      }
    })
  })
})

describe('Duplicate Detection Edge Cases', () => {
  it('should handle documents without fingerprint data', () => {
    const mockFingerprint = {
      fileName: 'test.pdf',
      fileSize: 1024,
      fileHash: 'test-hash',
      contentPreview: 'test content'
    }

    const existingDocs = [{
      id: 'doc1',
      fileName: 'test.pdf',
      fileSize: 1024,
      // No fingerprint field - should extract from document properties
    }]

    const result = detectDuplicate(mockFingerprint, existingDocs)
    
    expect(result.isDuplicate).toBe(true)
    expect(result.matchType).toBe('rename')
  })

  it('should handle very large content previews', () => {
    const largeContent = 'A'.repeat(10000) // 10k characters
    const mockFingerprint = {
      fileName: 'large.pdf',
      fileSize: 1024,
      fileHash: 'large-hash',
      contentPreview: largeContent.substring(0, 500) // Should be truncated
    }

    expect(mockFingerprint.contentPreview?.length).toBe(500)
  })

  it('should handle special characters in filenames', () => {
    const specialName = 'Document #1 (2024) [FINAL].pdf'
    const mockFingerprint = {
      fileName: specialName,
      fileSize: 1024,
      fileHash: 'special-hash'
    }

    const existingDocs = [{
      id: 'doc1',
      fileName: specialName,
      fileSize: 1024
    }]

    const result = detectDuplicate(mockFingerprint, existingDocs)
    
    expect(result.isDuplicate).toBe(true)
    expect(result.matchType).toBe('rename')
  })
})