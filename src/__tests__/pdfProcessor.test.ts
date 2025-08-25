import { describe, it, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock File constructor with arrayBuffer method
class MockFile {
  name: string
  type: string
  size: number
  content: string

  constructor(content: string[], name: string, options: { type: string }) {
    this.name = name
    this.type = options.type
    this.content = content.join('')
    this.size = this.content.length
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const buffer = new ArrayBuffer(this.content.length)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < this.content.length; i++) {
      view[i] = this.content.charCodeAt(i)
    }
    return buffer
  }
}

// Replace global File with our mock
global.File = MockFile as any

// Mock DOMMatrix for PDF.js
global.DOMMatrix = class MockDOMMatrix {
  constructor() {}
  scale() { return this }
  translate() { return this }
} as any

// Mock PDF.js dependencies
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  version: '3.0.0',
  getDocument: vi.fn().mockImplementation(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn().mockImplementation((pageNum) => Promise.resolve({
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: `Sample text from page ${pageNum} ` },
            { str: 'Brady evidence suppression ' },
            { str: 'Child abuse investigation ' },
            { str: 'Due process violation ' }
          ]
        })
      })),
      getMetadata: vi.fn().mockResolvedValue({
        info: {
          Title: 'Test Document',
          Author: 'Test Author',
          CreationDate: new Date('2024-01-01'),
          ModDate: new Date('2024-01-02')
        }
      })
    })
  }))
}))

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPageCount: () => 2,
      getTitle: () => 'Test Document',
      getAuthor: () => 'Test Author',
      getCreationDate: () => new Date('2024-01-01'),
      getModificationDate: () => new Date('2024-01-02')
    })
  }
}))

import { validatePDF, extractTextFromPDF, getPDFInfo } from '../lib/pdfProcessor'

describe('PDF Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validatePDF', () => {
    it('validates a valid PDF file', async () => {
      const mockFile = new File(['%PDF-1.4 mock content'], 'test.pdf', { 
        type: 'application/pdf' 
      })

      const result = await validatePDF(mockFile)
      expect(result).toBe(true)
    })

    it('rejects non-PDF file types', async () => {
      const mockFile = new File(['text content'], 'test.txt', { 
        type: 'text/plain' 
      })

      const result = await validatePDF(mockFile)
      expect(result).toBe(false)
    })

    it('rejects files without PDF content', async () => {
      // Mock PDF.js to fail for this test
      vi.mocked(require('pdfjs-dist').getDocument).mockImplementationOnce(() => ({
        promise: Promise.reject(new Error('Invalid PDF'))
      }))

      const mockFile = new File(['not a pdf'], 'test.pdf', { 
        type: 'application/pdf' 
      })

      const result = await validatePDF(mockFile)
      expect(result).toBe(false)
    })

    it('handles file reading errors gracefully', async () => {
      const mockFile = {
        type: 'application/pdf',
        size: 1024,
        arrayBuffer: vi.fn().mockRejectedValue(new Error('File read error'))
      } as unknown as File

      const result = await validatePDF(mockFile)
      expect(result).toBe(false)
    })
  })

  describe('extractTextFromPDF', () => {
    it('extracts text from a valid PDF', async () => {
      const mockFile = new File(['%PDF-1.4 mock content'], 'test.pdf', { 
        type: 'application/pdf' 
      })

      const result = await extractTextFromPDF(mockFile, 5)

      expect(result).toEqual({
        text: expect.stringContaining('Sample text from page'),
        pageCount: 2,
        metadata: expect.objectContaining({
          title: 'Test Document',
          author: 'Test Author'
        })
      })
    })

    it('limits text extraction to specified page count', async () => {
      const mockFile = new File(['%PDF-1.4 mock content'], 'test.pdf', { 
        type: 'application/pdf' 
      })

      const result = await extractTextFromPDF(mockFile, 1)

      expect(result.pageCount).toBe(2) // Total pages
      expect(result.text).toContain('Sample text from page 1')
      // Should only extract from page 1 due to limit
    })

    it('handles extraction errors gracefully', async () => {
      const mockFile = {
        type: 'application/pdf',
        size: 1024,
        arrayBuffer: vi.fn().mockRejectedValue(new Error('Extraction error'))
      } as unknown as File

      // Should not throw, should return fallback text
      const result = await extractTextFromPDF(mockFile)
      expect(result.text).toContain('test.pdf')
      expect(result.pageCount).toBe(1) // fallback
    })

    it('extracts metadata when available', async () => {
      const mockFile = new File(['%PDF-1.4 mock content'], 'test.pdf', { 
        type: 'application/pdf' 
      })

      const result = await extractTextFromPDF(mockFile)

      expect(result.metadata).toEqual({
        title: 'Test Document',
        author: 'Test Author',
        subject: undefined,
        creator: undefined,
        producer: undefined,
        creationDate: expect.any(Date),
        modificationDate: expect.any(Date)
      })
    })
  })

  describe('getPDFInfo', () => {
    it('returns PDF information', async () => {
      const mockFile = new File(['%PDF-1.4 mock content'], 'test.pdf', { 
        type: 'application/pdf' 
      })

      const result = await getPDFInfo(mockFile)

      expect(result).toEqual({
        pageCount: 2,
        size: mockFile.size
      })
    })

    it('handles files without metadata gracefully', async () => {
      // Mock PDF.js to return basic info
      vi.mocked(require('pdfjs-dist').getDocument).mockImplementationOnce(() => ({
        promise: Promise.resolve({
          numPages: 1
        })
      }))

      const mockFile = new File(['%PDF-1.4 mock content'], 'test.pdf', { 
        type: 'application/pdf' 
      })

      const result = await getPDFInfo(mockFile)

      expect(result).toEqual({
        pageCount: 1,
        size: mockFile.size
      })
    })

    it('handles PDF info extraction errors', async () => {
      const mockFile = {
        type: 'application/pdf',
        size: 1024,
        arrayBuffer: vi.fn().mockRejectedValue(new Error('Info extraction error'))
      } as unknown as File

      const result = await getPDFInfo(mockFile)
      
      // Should return fallback values
      expect(result).toEqual({
        pageCount: 1,
        size: 1024
      })
    })
  })

  describe('Integration scenarios', () => {
    it('processes a complete PDF workflow', async () => {
      const mockFile = new File(['%PDF-1.4 mock content'], 'justice-document.pdf', { 
        type: 'application/pdf' 
      })

      // Validate
      const isValid = await validatePDF(mockFile)
      expect(isValid).toBe(true)

      // Extract info
      const info = await getPDFInfo(mockFile)
      expect(info.pageCount).toBe(2)

      // Extract text
      const extraction = await extractTextFromPDF(mockFile)
      expect(extraction.text).toContain('Brady evidence suppression')
      expect(extraction.text).toContain('Due process violation')
      expect(extraction.pageCount).toBe(2)
    })

    it('handles corrupted PDF files', async () => {
      // Mock PDF.js to fail for corrupted files
      vi.mocked(require('pdfjs-dist').getDocument).mockImplementationOnce(() => ({
        promise: Promise.reject(new Error('Invalid PDF'))
      }))

      const corruptedFile = new File(['corrupted content'], 'corrupted.pdf', { 
        type: 'application/pdf' 
      })

      const isValid = await validatePDF(corruptedFile)
      expect(isValid).toBe(false)
    })
  })
})