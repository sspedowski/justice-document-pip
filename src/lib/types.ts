/**
 * Comprehensive type definitions for the Justice Document Manager
 * Provides strict typing and error handling interfaces
 */

// Base types for documents and versions
export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  title: string
  description: string
  category: DocumentCategory
  children: string[]
  laws: string[]
  misconduct: MisconductEntry[]
  include: IncludeStatus
  placement: PlacementRules
  changedBy: string
  changedAt: string
  changeNotes?: string
  changeType: ChangeType
}

export interface Document {
  id: string
  fileName: string
  title: string
  description: string
  category: DocumentCategory
  children: string[]
  laws: string[]
  misconduct: MisconductEntry[]
  include: IncludeStatus
  placement: PlacementRules
  uploadedAt: string
  textContent?: string
  currentVersion: number
  lastModified: string
  lastModifiedBy: string
  // Duplicate detection fields
  fingerprint?: FileFingerprint
  fileHash?: string
  fileSize?: number
  pageCount?: number
  firstPageHash?: string
}

// Enum-like types for better type safety
export type DocumentCategory = 'Primary' | 'Supporting' | 'External' | 'No'
export type IncludeStatus = 'YES' | 'NO'
export type ChangeType = 'created' | 'edited' | 'imported'
export type ProcessingStatus = 'validating' | 'uploading' | 'extracting' | 'analyzing' | 'checking-duplicates' | 'complete' | 'error' | 'duplicate-found'

export interface MisconductEntry {
  law: string
  page: string
  paragraph: string
  notes: string
}

export interface PlacementRules {
  masterFile: boolean
  exhibitBundle: boolean
  oversightPacket: boolean
}

export interface ProcessingDocument {
  fileName: string
  progress: number
  status: ProcessingStatus
  error?: string
  duplicateResult?: DuplicateResult
}

export interface SearchResult {
  docId: string
  matches: Array<{
    text: string
    context: string
    position: number
  }>
}

export interface FileFingerprint {
  fileName: string
  fileSize: number
  fileHash: string
  pageCount?: number
  firstPageHash?: string
  lastModified?: number
  contentPreview?: string
}

export interface DuplicateResult {
  isDuplicate: boolean
  matchType: 'exact' | 'rename' | 'partial' | 'content' | 'date-based' | 'none'
  confidence: number
  existingDocument?: Document
  reason?: string
  dateMatch?: {
    sharedDate: string
    otherDocuments: Document[]
    requiresComparison: boolean
  }
}

// Error handling types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
  action?: string
  recoverable: boolean
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: AppError
  metadata?: {
    timestamp: Date
    version: string
    requestId?: string
  }
}

// Validation types
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
  value?: any
}

// PDF processing types
export interface PDFProcessingResult {
  text: string
  pageCount: number
  metadata?: PDFMetadata
}

export interface PDFMetadata {
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
  creationDate?: string
  modificationDate?: string
}

// Analysis types
export interface TamperingAnalysisResult {
  overallRiskAssessment: RiskAssessment
  dateGroupAnalyses: DateGroupAnalysis[]
  timelineFlags: TimelineFlag[]
  documentComparisons: DocumentComparison[]
  suspiciousPatterns: SuspiciousPattern[]
}

export interface RiskAssessment {
  totalFlags: number
  criticalFlags: number
  highRiskDocuments: string[]
  confidence: number
  summary: string
}

export interface DateGroupAnalysis {
  date: string
  documents: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  tamperingIndicators: TamperingIndicator[]
  confidence: number
}

export interface TamperingIndicator {
  type: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  evidence: any
}

export interface TimelineFlag {
  type: string
  description: string
  documentsAffected: string[]
  severity: ErrorSeverity
}

export interface DocumentComparison {
  documentA: string
  documentB: string
  changes: ContentChange[]
  similarity: number
  suspicionScore: number
}

export interface ContentChange {
  type: 'addition' | 'deletion' | 'modification'
  field: string
  oldValue?: string
  newValue?: string
  context: string
  confidence: number
}

export interface SuspiciousPattern {
  type: string
  description: string
  documentsAffected: string[]
  evidence: any[]
  confidence: number
}

// Form state types
export interface FormState<T> {
  data: T
  errors: Record<keyof T, string[]>
  touched: Record<keyof T, boolean>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

// Component prop types
export interface ComponentError {
  message: string
  code?: string
  retry?: () => void
}

// Utility types
export type Partial<T> = {
  [P in keyof T]?: T[P]
}

export type Required<T> = {
  [P in keyof T]-?: T[P]
}

export type NonNullable<T> = T extends null | undefined ? never : T

// Type guards
export function isDocument(obj: any): obj is Document {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.fileName === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.category === 'string' &&
    Array.isArray(obj.children) &&
    Array.isArray(obj.laws) &&
    Array.isArray(obj.misconduct)
}

export function isDocumentVersion(obj: any): obj is DocumentVersion {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.documentId === 'string' &&
    typeof obj.version === 'number' &&
    typeof obj.changeType === 'string'
}

export function isAppError(obj: any): obj is AppError {
  return obj &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.recoverable === 'boolean'
}

// Constants
export const DOCUMENT_CATEGORIES: DocumentCategory[] = ['Primary', 'Supporting', 'External', 'No']
export const INCLUDE_STATUSES: IncludeStatus[] = ['YES', 'NO']
export const CHANGE_TYPES: ChangeType[] = ['created', 'edited', 'imported']
export const PROCESSING_STATUSES: ProcessingStatus[] = [
  'validating', 'uploading', 'extracting', 'analyzing', 
  'checking-duplicates', 'complete', 'error', 'duplicate-found'
]

// Error codes
export const ERROR_CODES = {
  // File processing errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
  PDF_EXTRACTION_FAILED: 'PDF_EXTRACTION_FAILED',
  
  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
  STORAGE_OPERATION_FAILED: 'STORAGE_OPERATION_FAILED',
  
  // Validation errors
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT: 'INVALID_FORMAT',
  VALUE_OUT_OF_RANGE: 'VALUE_OUT_OF_RANGE',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Application errors
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  OPERATION_NOT_PERMITTED: 'OPERATION_NOT_PERMITTED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Security errors
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Unknown error
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// Contradiction suppression and annotation types
export interface SuppressionData {
  contradiction_id: string
}

export interface AnnotationData {
  contradiction_id: string
  note: string
  updated_at: string
}

export interface SuppressionState {
  suppressions: string[]
  annotations: AnnotationData[]
}