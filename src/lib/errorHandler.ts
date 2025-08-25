/**
 * Comprehensive error handling utilities and classes
 * Provides structured error management with recovery strategies
 */

import { toast } from 'sonner'
import { AppError, ErrorCode, ErrorSeverity, ERROR_CODES } from './types'

/**
 * Custom application error class with enhanced context
 */
export class ApplicationError extends Error {
  public readonly code: ErrorCode
  public readonly severity: ErrorSeverity
  public readonly details?: any
  public readonly timestamp: Date
  public readonly action?: string
  public readonly recoverable: boolean
  public readonly userMessage: string

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      severity?: ErrorSeverity
      details?: any
      action?: string
      recoverable?: boolean
      userMessage?: string
      cause?: Error
    } = {}
  ) {
    super(message)
    
    this.name = 'ApplicationError'
    this.code = code
    this.severity = options.severity || 'medium'
    this.details = options.details
    this.timestamp = new Date()
    this.action = options.action
    this.recoverable = options.recoverable ?? true
    this.userMessage = options.userMessage || this.getDefaultUserMessage()
    
    if (options.cause) {
      this.cause = options.cause
    }
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError)
    }
  }

  private getDefaultUserMessage(): string {
    switch (this.code) {
      case ERROR_CODES.FILE_TOO_LARGE:
        return 'The file you selected is too large. Please choose a smaller file.'
      case ERROR_CODES.INVALID_FILE_TYPE:
        return 'Please select a valid PDF file.'
      case ERROR_CODES.FILE_CORRUPTED:
        return 'The file appears to be corrupted. Please try a different file.'
      case ERROR_CODES.PDF_EXTRACTION_FAILED:
        return 'Unable to extract text from this PDF. The file may be password-protected or corrupted.'
      case ERROR_CODES.STORAGE_QUOTA_EXCEEDED:
        return 'Storage space is full. Please free up space and try again.'
      case ERROR_CODES.NETWORK_ERROR:
        return 'Network connection issue. Please check your connection and try again.'
      case ERROR_CODES.UNAUTHORIZED_ACCESS:
        return 'You do not have permission to perform this action.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  /**
   * Convert to plain AppError object for serialization
   */
  toAppError(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      action: this.action,
      recoverable: this.recoverable
    }
  }
}

/**
 * Error factory for creating specific error types
 */
export class ErrorFactory {
  static fileError(code: ErrorCode, fileName: string, originalError?: Error): ApplicationError {
    return new ApplicationError(code, `File error: ${fileName}`, {
      severity: 'medium',
      details: { fileName },
      action: 'file_processing',
      recoverable: true,
      cause: originalError
    })
  }

  static storageError(code: ErrorCode, operation: string, originalError?: Error): ApplicationError {
    return new ApplicationError(code, `Storage error during ${operation}`, {
      severity: 'high',
      details: { operation },
      action: 'storage_operation',
      recoverable: true,
      cause: originalError
    })
  }

  static validationError(field: string, value: any, message: string): ApplicationError {
    return new ApplicationError(ERROR_CODES.INVALID_FORMAT, `Validation error: ${message}`, {
      severity: 'low',
      details: { field, value },
      action: 'validation',
      recoverable: true,
      userMessage: message
    })
  }

  static networkError(operation: string, originalError?: Error): ApplicationError {
    return new ApplicationError(ERROR_CODES.NETWORK_ERROR, `Network error during ${operation}`, {
      severity: 'high',
      details: { operation },
      action: 'network_request',
      recoverable: true,
      cause: originalError
    })
  }

  static securityError(code: ErrorCode, action: string): ApplicationError {
    return new ApplicationError(code, `Security error: ${action}`, {
      severity: 'critical',
      details: { action },
      action: 'security_check',
      recoverable: false
    })
  }
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = ApplicationError> = {
  success: true
  data: T
} | {
  success: false
  error: E
}

/**
 * Async result type
 */
export type AsyncResult<T, E = ApplicationError> = Promise<Result<T, E>>

/**
 * Safe wrapper for operations that might throw
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorFactory?: (error: unknown) => ApplicationError
): AsyncResult<T> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    const appError = errorFactory 
      ? errorFactory(error)
      : error instanceof ApplicationError 
        ? error 
        : new ApplicationError(
            ERROR_CODES.UNKNOWN_ERROR,
            error instanceof Error ? error.message : 'Unknown error occurred',
            { 
              cause: error instanceof Error ? error : undefined,
              details: error 
            }
          )
    
    return { success: false, error: appError }
  }
}

/**
 * Safe wrapper for synchronous operations
 */
export function safe<T>(
  operation: () => T,
  errorFactory?: (error: unknown) => ApplicationError
): Result<T> {
  try {
    const data = operation()
    return { success: true, data }
  } catch (error) {
    const appError = errorFactory 
      ? errorFactory(error)
      : error instanceof ApplicationError 
        ? error 
        : new ApplicationError(
            ERROR_CODES.UNKNOWN_ERROR,
            error instanceof Error ? error.message : 'Unknown error occurred',
            { 
              cause: error instanceof Error ? error : undefined,
              details: error 
            }
          )
    
    return { success: false, error: appError }
  }
}

/**
 * Error handler that provides user feedback and logging
 */
export class ErrorHandler {
  private static readonly MAX_ERROR_LOG = 100
  private static errorLog: AppError[] = []

  /**
   * Handle an error with appropriate user feedback
   */
  static handle(error: ApplicationError | Error, context?: string): void {
    let appError: ApplicationError

    if (error instanceof ApplicationError) {
      appError = error
    } else {
      appError = new ApplicationError(
        ERROR_CODES.UNKNOWN_ERROR,
        error.message,
        { 
          cause: error,
          action: context 
        }
      )
    }

    // Log the error
    this.logError(appError)

    // Show user notification based on severity
    this.showUserNotification(appError)

    // Report critical errors
    if (appError.severity === 'critical') {
      this.reportCriticalError(appError)
    }
  }

  /**
   * Log error to internal storage
   */
  private static logError(error: ApplicationError): void {
    const errorData = error.toAppError()
    
    // Add to internal log
    this.errorLog.unshift(errorData)
    
    // Keep only recent errors
    if (this.errorLog.length > this.MAX_ERROR_LOG) {
      this.errorLog = this.errorLog.slice(0, this.MAX_ERROR_LOG)
    }

    // Console logging for development
    console.error('Application Error:', {
      code: error.code,
      message: error.message,
      severity: error.severity,
      details: error.details,
      stack: error.stack,
      timestamp: error.timestamp
    })
  }

  /**
   * Show appropriate user notification
   */
  private static showUserNotification(error: ApplicationError): void {
    const message = error.userMessage || error.message

    switch (error.severity) {
      case 'critical':
        toast.error('Critical Error', {
          description: message,
          duration: 8000
        })
        break
      case 'high':
        toast.error('Error', {
          description: message,
          duration: 6000
        })
        break
      case 'medium':
        toast.warning('Warning', {
          description: message,
          duration: 4000
        })
        break
      case 'low':
        toast.info('Notice', {
          description: message,
          duration: 3000
        })
        break
    }
  }

  /**
   * Report critical errors for monitoring
   */
  private static reportCriticalError(error: ApplicationError): void {
    // In a real application, this would send to monitoring service
    console.error('CRITICAL ERROR REPORTED:', error.toAppError())
    
    // Could integrate with services like Sentry, LogRocket, etc.
    // if (window.Sentry) {
    //   window.Sentry.captureException(error)
    // }
  }

  /**
   * Get recent error history
   */
  static getErrorHistory(): AppError[] {
    return [...this.errorLog]
  }

  /**
   * Clear error history
   */
  static clearErrorHistory(): void {
    this.errorLog = []
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    total: number
    bySeverity: Record<ErrorSeverity, number>
    byCode: Record<string, number>
    recent: number
  } {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const stats = {
      total: this.errorLog.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      } as Record<ErrorSeverity, number>,
      byCode: {} as Record<string, number>,
      recent: 0
    }

    this.errorLog.forEach(error => {
      // Count by severity
      stats.bySeverity[error.details?.severity || 'medium']++
      
      // Count by code
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1
      
      // Count recent errors
      if (error.timestamp > oneHourAgo) {
        stats.recent++
      }
    })

    return stats
  }
}

/**
 * Validation utilities with proper error handling
 */
export class Validator {
  static isValidEmail(email: string): Result<string> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: ErrorFactory.validationError('email', email, 'Please enter a valid email address')
      }
    }
    return { success: true, data: email }
  }

  static isValidFileName(fileName: string): Result<string> {
    if (!fileName || fileName.trim().length === 0) {
      return {
        success: false,
        error: ErrorFactory.validationError('fileName', fileName, 'File name cannot be empty')
      }
    }
    
    if (fileName.length > 255) {
      return {
        success: false,
        error: ErrorFactory.validationError('fileName', fileName, 'File name is too long')
      }
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(fileName)) {
      return {
        success: false,
        error: ErrorFactory.validationError('fileName', fileName, 'File name contains invalid characters')
      }
    }
    
    return { success: true, data: fileName.trim() }
  }

  static isValidFileSize(size: number, maxSize: number = 50 * 1024 * 1024): Result<number> {
    if (size <= 0) {
      return {
        success: false,
        error: ErrorFactory.validationError('fileSize', size, 'File size must be greater than 0')
      }
    }
    
    if (size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return {
        success: false,
        error: ErrorFactory.validationError('fileSize', size, `File size must be less than ${maxSizeMB}MB`)
      }
    }
    
    return { success: true, data: size }
  }

  static isValidPDFFile(file: File): Result<File> {
    // Check file type
    if (file.type !== 'application/pdf') {
      return {
        success: false,
        error: ErrorFactory.fileError(ERROR_CODES.INVALID_FILE_TYPE, file.name)
      }
    }
    
    // Check file size
    const sizeResult = this.isValidFileSize(file.size)
    if (!sizeResult.success) {
      return sizeResult as Result<File>
    }
    
    // Check file name
    const nameResult = this.isValidFileName(file.name)
    if (!nameResult.success) {
      return nameResult as Result<File>
    }
    
    return { success: true, data: file }
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number
    delay?: number
    backoffFactor?: number
    shouldRetry?: (error: unknown) => boolean
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoffFactor = 2,
    shouldRetry = () => true
  } = options

  let lastError: unknown
  let currentDelay = delay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, currentDelay))
      currentDelay *= backoffFactor
    }
  }
  
  throw lastError
}

/**
 * Circuit breaker pattern for unreliable operations
 */
export class CircuitBreaker {
  private failures = 0
  private nextAttempt = Date.now()
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new ApplicationError(
          ERROR_CODES.OPERATION_NOT_PERMITTED,
          'Circuit breaker is open',
          { severity: 'high', recoverable: false }
        )
      }
      this.state = 'half-open'
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure(): void {
    this.failures++
    if (this.failures >= this.threshold) {
      this.state = 'open'
      this.nextAttempt = Date.now() + this.timeout
    }
  }
}

export default ErrorHandler