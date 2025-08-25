/**
 * Validation schemas and utilities with comprehensive type safety
 */

import { z } from 'zod'
import type { 
  Document, 
  DocumentVersion, 
  ProcessingDocument,
  DocumentCategory,
  IncludeStatus,
  ChangeType,
  MisconductEntry,
  PlacementRules
} from './types'
import { ApplicationError, ErrorFactory, ERROR_CODES } from './errorHandler'
import type { Result } from './errorHandler'

// Zod schemas for runtime validation
export const DocumentCategorySchema = z.enum(['Primary', 'Supporting', 'External', 'No'])
export const IncludeStatusSchema = z.enum(['YES', 'NO'])
export const ChangeTypeSchema = z.enum(['created', 'edited', 'imported'])

export const MisconductEntrySchema = z.object({
  law: z.string(),
  page: z.string(),
  paragraph: z.string(),
  notes: z.string()
})

export const PlacementRulesSchema = z.object({
  masterFile: z.boolean(),
  exhibitBundle: z.boolean(),
  oversightPacket: z.boolean()
})

export const DocumentSchema = z.object({
  id: z.string().min(1, 'Document ID is required'),
  fileName: z.string().min(1, 'File name is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  category: DocumentCategorySchema,
  children: z.array(z.string()),
  laws: z.array(z.string()),
  misconduct: z.array(MisconductEntrySchema),
  include: IncludeStatusSchema,
  placement: PlacementRulesSchema,
  uploadedAt: z.string().datetime(),
  textContent: z.string().optional(),
  currentVersion: z.number().min(1),
  lastModified: z.string().datetime(),
  lastModifiedBy: z.string().min(1),
  fingerprint: z.any().optional(),
  fileHash: z.string().optional(),
  fileSize: z.number().optional(),
  pageCount: z.number().optional(),
  firstPageHash: z.string().optional()
})

export const DocumentVersionSchema = z.object({
  id: z.string().min(1),
  documentId: z.string().min(1),
  version: z.number().min(1),
  title: z.string().min(1),
  description: z.string(),
  category: DocumentCategorySchema,
  children: z.array(z.string()),
  laws: z.array(z.string()),
  misconduct: z.array(MisconductEntrySchema),
  include: IncludeStatusSchema,
  placement: PlacementRulesSchema,
  changedBy: z.string().min(1),
  changedAt: z.string().datetime(),
  changeNotes: z.string().optional(),
  changeType: ChangeTypeSchema
})

/**
 * Validation utilities with proper error handling
 */
export class ValidationService {
  
  /**
   * Validate a document object
   */
  static validateDocument(data: unknown): Result<Document> {
    try {
      const validated = DocumentSchema.parse(data)
      return { success: true, data: validated as Document }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        return {
          success: false,
          error: ErrorFactory.validationError(
            firstError.path.join('.'),
            firstError.received,
            firstError.message
          )
        }
      }
      
      return {
        success: false,
        error: new ApplicationError(
          ERROR_CODES.INVALID_FORMAT,
          'Document validation failed',
          { 
            cause: error instanceof Error ? error : new Error('Unknown validation error'),
            details: { data }
          }
        )
      }
    }
  }

  /**
   * Validate a document version object
   */
  static validateDocumentVersion(data: unknown): Result<DocumentVersion> {
    try {
      const validated = DocumentVersionSchema.parse(data)
      return { success: true, data: validated as DocumentVersion }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        return {
          success: false,
          error: ErrorFactory.validationError(
            firstError.path.join('.'),
            firstError.received,
            firstError.message
          )
        }
      }
      
      return {
        success: false,
        error: new ApplicationError(
          ERROR_CODES.INVALID_FORMAT,
          'Document version validation failed',
          { 
            cause: error instanceof Error ? error : new Error('Unknown validation error'),
            details: { data }
          }
        )
      }
    }
  }

  /**
   * Validate an array of documents
   */
  static validateDocuments(data: unknown): Result<Document[]> {
    if (!Array.isArray(data)) {
      return {
        success: false,
        error: ErrorFactory.validationError('documents', data, 'Expected an array of documents')
      }
    }

    const validatedDocs: Document[] = []
    const errors: string[] = []

    for (let i = 0; i < data.length; i++) {
      const result = this.validateDocument(data[i])
      if (result.success) {
        validatedDocs.push(result.data)
      } else {
        errors.push(`Document ${i}: ${result.error.message}`)
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: new ApplicationError(
          ERROR_CODES.INVALID_FORMAT,
          'Multiple document validation errors',
          { details: { errors, validCount: validatedDocs.length, totalCount: data.length } }
        )
      }
    }

    return { success: true, data: validatedDocs }
  }

  /**
   * Validate document edit form data
   */
  static validateDocumentEdit(data: Partial<Document>): Result<Partial<Document>> {
    const schema = DocumentSchema.partial()
    
    try {
      const validated = schema.parse(data)
      return { success: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        return {
          success: false,
          error: ErrorFactory.validationError(
            firstError.path.join('.'),
            firstError.received,
            firstError.message
          )
        }
      }
      
      return {
        success: false,
        error: new ApplicationError(
          ERROR_CODES.INVALID_FORMAT,
          'Document edit validation failed',
          { 
            cause: error instanceof Error ? error : new Error('Unknown validation error'),
            details: { data }
          }
        )
      }
    }
  }

  /**
   * Validate search parameters
   */
  static validateSearchParams(params: {
    searchTerm?: string
    categoryFilter?: string
    contentSearchTerm?: string
  }): Result<typeof params> {
    try {
      const schema = z.object({
        searchTerm: z.string().max(1000).optional(),
        categoryFilter: z.union([
          z.literal('all'),
          DocumentCategorySchema
        ]).optional(),
        contentSearchTerm: z.string().max(1000).optional()
      })

      const validated = schema.parse(params)
      return { success: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        return {
          success: false,
          error: ErrorFactory.validationError(
            firstError.path.join('.'),
            firstError.received,
            firstError.message
          )
        }
      }
      
      return {
        success: false,
        error: new ApplicationError(
          ERROR_CODES.INVALID_FORMAT,
          'Search parameter validation failed',
          { 
            cause: error instanceof Error ? error : new Error('Unknown validation error'),
            details: { params }
          }
        )
      }
    }
  }

  /**
   * Sanitize text input to prevent XSS
   */
  static sanitizeText(text: string): string {
    if (typeof text !== 'string') {
      return ''
    }

    return text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 10000) // Limit length
  }

  /**
   * Validate and sanitize user input
   */
  static sanitizeUserInput(input: {
    title?: string
    description?: string
    changeNotes?: string
    searchTerm?: string
  }): Result<typeof input> {
    try {
      const sanitized = {
        title: input.title ? this.sanitizeText(input.title) : undefined,
        description: input.description ? this.sanitizeText(input.description) : undefined,
        changeNotes: input.changeNotes ? this.sanitizeText(input.changeNotes) : undefined,
        searchTerm: input.searchTerm ? this.sanitizeText(input.searchTerm) : undefined
      }

      // Validate lengths
      if (sanitized.title && sanitized.title.length > 500) {
        return {
          success: false,
          error: ErrorFactory.validationError('title', sanitized.title, 'Title is too long (max 500 characters)')
        }
      }

      if (sanitized.description && sanitized.description.length > 5000) {
        return {
          success: false,
          error: ErrorFactory.validationError('description', sanitized.description, 'Description is too long (max 5000 characters)')
        }
      }

      return { success: true, data: sanitized }
    } catch (error) {
      return {
        success: false,
        error: new ApplicationError(
          ERROR_CODES.INVALID_FORMAT,
          'Input sanitization failed',
          { 
            cause: error instanceof Error ? error : new Error('Unknown sanitization error'),
            details: { input }
          }
        )
      }
    }
  }

  /**
   * Validate file upload constraints
   */
  static validateFileUpload(files: FileList): Result<File[]> {
    if (!files || files.length === 0) {
      return {
        success: false,
        error: ErrorFactory.validationError('files', files, 'No files selected')
      }
    }

    const maxFiles = 10
    if (files.length > maxFiles) {
      return {
        success: false,
        error: ErrorFactory.validationError('files', files.length, `Too many files (max ${maxFiles})`)
      }
    }

    const validFiles: File[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Basic file validation
      if (!file.name) {
        errors.push(`File ${i + 1}: Missing filename`)
        continue
      }

      if (!file.type || file.type !== 'application/pdf') {
        errors.push(`File ${i + 1}: Must be a PDF file`)
        continue
      }

      if (file.size === 0) {
        errors.push(`File ${i + 1}: File is empty`)
        continue
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB
        errors.push(`File ${i + 1}: File is too large (max 50MB)`)
        continue
      }

      validFiles.push(file)
    }

    if (errors.length > 0 && validFiles.length === 0) {
      return {
        success: false,
        error: new ApplicationError(
          ERROR_CODES.INVALID_FILE_TYPE,
          'File validation failed',
          { details: { errors, fileCount: files.length } }
        )
      }
    }

    // Return valid files even if some failed (with warnings)
    if (errors.length > 0) {
      console.warn('Some files failed validation:', errors)
    }

    return { success: true, data: validFiles }
  }
}

export default ValidationService