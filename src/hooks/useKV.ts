/**
 * Enhanced useKV hook with comprehensive error handling and type safety
 */

import { useEffect, useState, useCallback, useRef } from "react"
import { ApplicationError, ErrorHandler, safeAsync, ErrorFactory, ERROR_CODES } from "@/lib/errorHandler"
import type { Result } from "@/lib/errorHandler"

/**
 * State for the useKV hook
 */
interface KVState<T> {
  data: T
  loading: boolean
  error: ApplicationError | null
  hasLoadedInitial: boolean
}

/**
 * Options for the useKV hook
 */
interface UseKVOptions {
  // Disable automatic loading on mount
  lazy?: boolean
  // Custom error handler
  onError?: (error: ApplicationError) => void
  // Debounce delay for saves (ms)
  saveDelay?: number
  // Validate data before saving
  validator?: (data: any) => Result<any>
}

/**
 * Enhanced useKV hook that mimics @github/spark/hooks functionality
 * with comprehensive error handling and type safety
 */
export function useKV<T>(
  key: string, 
  initial: T,
  options: UseKVOptions = {}
): [
  T, 
  (value: T | ((prev: T) => T)) => Promise<void>,
  () => Promise<void>,
  {
    loading: boolean
    error: ApplicationError | null
    reload: () => Promise<void>
    clearError: () => void
  }
] {
  const {
    lazy = false,
    onError,
    saveDelay = 500,
    validator
  } = options

  const [state, setState] = useState<KVState<T>>({
    data: initial,
    loading: !lazy,
    error: null,
    hasLoadedInitial: false
  })

  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const isUnmountedRef = useRef(false)

  // Validate key
  const validateKey = useCallback((k: string): Result<string> => {
    if (!k || typeof k !== 'string') {
      return {
        success: false,
        error: ErrorFactory.validationError('key', k, 'Key must be a non-empty string')
      }
    }
    
    if (k.length > 250) {
      return {
        success: false,
        error: ErrorFactory.validationError('key', k, 'Key is too long (max 250 characters)')
      }
    }
    
    return { success: true, data: k }
  }, [])

  // Safe state updater that checks if component is mounted
  const safeSetState = useCallback((updater: (prev: KVState<T>) => KVState<T>) => {
    if (!isUnmountedRef.current) {
      setState(updater)
    }
  }, [])

  // Load data from storage
  const loadData = useCallback(async (): Promise<void> => {
    const keyValidation = validateKey(key)
    if (!keyValidation.success) {
      const error = keyValidation.error
      ErrorHandler.handle(error, 'useKV:loadData')
      safeSetState(prev => ({ ...prev, error, loading: false }))
      if (onError) onError(error)
      return
    }

    safeSetState(prev => ({ ...prev, loading: true, error: null }))

    const result = await safeAsync(async () => {
      // Try Spark KV first
      if (typeof window !== 'undefined' && window.spark?.kv) {
        try {
          const sparkValue = await window.spark.kv.get<T>(key)
          if (sparkValue !== undefined) {
            return sparkValue
          }
        } catch (sparkError) {
          console.warn('Spark KV failed, falling back to localStorage:', sparkError)
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem(`kv:${key}`)
      if (stored) {
        try {
          return JSON.parse(stored) as T
        } catch (parseError) {
          throw ErrorFactory.storageError(
            ERROR_CODES.STORAGE_OPERATION_FAILED,
            'parse localStorage data',
            parseError instanceof Error ? parseError : new Error('Parse failed')
          )
        }
      }
      
      return initial
    }, (error) => 
      ErrorFactory.storageError(
        ERROR_CODES.STORAGE_OPERATION_FAILED,
        'load data',
        error instanceof Error ? error : new Error('Unknown load error')
      )
    )

    if (result.success) {
      // Validate loaded data if validator provided
      if (validator) {
        const validationResult = validator(result.data)
        if (!validationResult.success) {
          const error = validationResult.error
          ErrorHandler.handle(error, 'useKV:validateLoadedData')
          safeSetState(prev => ({ 
            ...prev, 
            data: initial, 
            loading: false, 
            error, 
            hasLoadedInitial: true 
          }))
          if (onError) onError(error)
          return
        }
      }

      safeSetState(prev => ({ 
        ...prev, 
        data: result.data, 
        loading: false, 
        hasLoadedInitial: true 
      }))
    } else {
      ErrorHandler.handle(result.error, 'useKV:loadData')
      safeSetState(prev => ({ 
        ...prev, 
        error: result.error, 
        loading: false, 
        hasLoadedInitial: true 
      }))
      if (onError) onError(result.error)
    }
  }, [key, initial, validator, validateKey, onError, safeSetState])

  // Save data to storage with debouncing
  const saveData = useCallback(async (data: T): Promise<void> => {
    const keyValidation = validateKey(key)
    if (!keyValidation.success) {
      const error = keyValidation.error
      ErrorHandler.handle(error, 'useKV:saveData')
      if (onError) onError(error)
      throw error
    }

    // Validate data if validator provided
    if (validator) {
      const validationResult = validator(data)
      if (!validationResult.success) {
        const error = validationResult.error
        ErrorHandler.handle(error, 'useKV:validateSaveData')
        if (onError) onError(error)
        throw error
      }
    }

    const result = await safeAsync(async () => {
      const serializedData = JSON.stringify(data)
      
      // Save to Spark KV if available
      if (typeof window !== 'undefined' && window.spark?.kv) {
        try {
          await window.spark.kv.set(key, data)
        } catch (sparkError) {
          console.warn('Spark KV save failed, using localStorage only:', sparkError)
        }
      }
      
      // Always save to localStorage as fallback
      localStorage.setItem(`kv:${key}`, serializedData)
    }, (error) => 
      ErrorFactory.storageError(
        ERROR_CODES.STORAGE_OPERATION_FAILED,
        'save data',
        error instanceof Error ? error : new Error('Unknown save error')
      )
    )

    if (!result.success) {
      ErrorHandler.handle(result.error, 'useKV:saveData')
      safeSetState(prev => ({ ...prev, error: result.error }))
      if (onError) onError(result.error)
      throw result.error
    }
  }, [key, validator, validateKey, onError, safeSetState])

  // Update value with error handling
  const updateValue = useCallback(async (newValue: T | ((prev: T) => T)): Promise<void> => {
    try {
      safeSetState(prev => {
        const computed = typeof newValue === 'function' 
          ? (newValue as (prev: T) => T)(prev.data) 
          : newValue
        
        // Clear any existing save timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        
        // Debounce the save operation
        saveTimeoutRef.current = setTimeout(() => {
          saveData(computed).catch(error => {
            console.error('Delayed save failed:', error)
          })
        }, saveDelay)
        
        return { ...prev, data: computed, error: null }
      })
    } catch (error) {
      const appError = error instanceof ApplicationError 
        ? error 
        : ErrorFactory.storageError(
            ERROR_CODES.STORAGE_OPERATION_FAILED,
            'update value',
            error instanceof Error ? error : new Error('Unknown update error')
          )
      
      ErrorHandler.handle(appError, 'useKV:updateValue')
      safeSetState(prev => ({ ...prev, error: appError }))
      if (onError) onError(appError)
      throw appError
    }
  }, [saveData, saveDelay, onError, safeSetState])

  // Delete value with error handling
  const deleteValue = useCallback(async (): Promise<void> => {
    const keyValidation = validateKey(key)
    if (!keyValidation.success) {
      const error = keyValidation.error
      ErrorHandler.handle(error, 'useKV:deleteValue')
      if (onError) onError(error)
      throw error
    }

    const result = await safeAsync(async () => {
      // Delete from Spark KV if available
      if (typeof window !== 'undefined' && window.spark?.kv) {
        try {
          await window.spark.kv.delete(key)
        } catch (sparkError) {
          console.warn('Spark KV delete failed, using localStorage only:', sparkError)
        }
      }
      
      // Delete from localStorage
      localStorage.removeItem(`kv:${key}`)
    }, (error) => 
      ErrorFactory.storageError(
        ERROR_CODES.STORAGE_OPERATION_FAILED,
        'delete data',
        error instanceof Error ? error : new Error('Unknown delete error')
      )
    )

    if (result.success) {
      safeSetState(prev => ({ ...prev, data: initial, error: null }))
    } else {
      ErrorHandler.handle(result.error, 'useKV:deleteValue')
      safeSetState(prev => ({ ...prev, error: result.error }))
      if (onError) onError(result.error)
      throw result.error
    }
  }, [key, initial, validateKey, onError, safeSetState])

  // Clear error state
  const clearError = useCallback(() => {
    safeSetState(prev => ({ ...prev, error: null }))
  }, [safeSetState])

  // Reload data manually
  const reload = useCallback(async (): Promise<void> => {
    await loadData()
  }, [loadData])

  // Load initial data
  useEffect(() => {
    if (!lazy && !state.hasLoadedInitial) {
      loadData()
    }
  }, [lazy, state.hasLoadedInitial, loadData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return [
    state.data,
    updateValue,
    deleteValue,
    {
      loading: state.loading,
      error: state.error,
      reload,
      clearError
    }
  ]
}

/**
 * Hook for handling multiple KV operations
 */
export function useKVBatch<T extends Record<string, any>>(
  keys: (keyof T)[],
  defaults: T,
  options: UseKVOptions = {}
): [
  T,
  (updates: Partial<T>) => Promise<void>,
  () => Promise<void>,
  {
    loading: boolean
    errors: Record<keyof T, ApplicationError | null>
    reload: () => Promise<void>
    clearErrors: () => void
  }
] {
  const [state, setState] = useState<{
    data: T
    loading: boolean
    errors: Record<keyof T, ApplicationError | null>
  }>({
    data: defaults,
    loading: true,
    errors: {} as Record<keyof T, ApplicationError | null>
  })

  const loadBatch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    const results = await Promise.allSettled(
      keys.map(async (key) => {
        const result = await safeAsync(async () => {
          if (typeof window !== 'undefined' && window.spark?.kv) {
            try {
              const value = await window.spark.kv.get(String(key))
              return value !== undefined ? value : defaults[key]
            } catch {
              // Fall back to localStorage
            }
          }
          
          const stored = localStorage.getItem(`kv:${String(key)}`)
          return stored ? JSON.parse(stored) : defaults[key]
        })
        
        return { key, result }
      })
    )

    const newData = { ...defaults }
    const newErrors = {} as Record<keyof T, ApplicationError | null>

    results.forEach((settledResult, index) => {
      const key = keys[index]
      
      if (settledResult.status === 'fulfilled') {
        const { result } = settledResult.value
        if (result.success) {
          newData[key] = result.data
          newErrors[key] = null
        } else {
          newErrors[key] = result.error
        }
      } else {
        newErrors[key] = ErrorFactory.storageError(
          ERROR_CODES.STORAGE_OPERATION_FAILED,
          'batch load',
          new Error(settledResult.reason)
        )
      }
    })

    setState({ data: newData, loading: false, errors: newErrors })
  }, [keys, defaults])

  const updateBatch = useCallback(async (updates: Partial<T>) => {
    const savePromises = Object.entries(updates).map(async ([key, value]) => {
      const result = await safeAsync(async () => {
        if (typeof window !== 'undefined' && window.spark?.kv) {
          try {
            await window.spark.kv.set(key, value)
          } catch {
            // Fall back to localStorage
          }
        }
        localStorage.setItem(`kv:${key}`, JSON.stringify(value))
      })
      
      return { key: key as keyof T, result }
    })

    const results = await Promise.allSettled(savePromises)
    
    setState(prev => {
      const newData = { ...prev.data, ...updates }
      const newErrors = { ...prev.errors }
      
      results.forEach((settledResult, index) => {
        if (settledResult.status === 'fulfilled') {
          const { key, result } = settledResult.value
          if (!result.success) {
            newErrors[key] = result.error
          } else {
            newErrors[key] = null
          }
        }
      })
      
      return { ...prev, data: newData, errors: newErrors }
    })
  }, [])

  const deleteBatch = useCallback(async () => {
    const deletePromises = keys.map(async (key) => {
      const result = await safeAsync(async () => {
        if (typeof window !== 'undefined' && window.spark?.kv) {
          try {
            await window.spark.kv.delete(String(key))
          } catch {
            // Fall back to localStorage
          }
        }
        localStorage.removeItem(`kv:${String(key)}`)
      })
      
      return { key, result }
    })

    await Promise.allSettled(deletePromises)
    setState({ data: defaults, loading: false, errors: {} as Record<keyof T, ApplicationError | null> })
  }, [keys, defaults])

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} as Record<keyof T, ApplicationError | null> }))
  }, [])

  useEffect(() => {
    if (!options.lazy) {
      loadBatch()
    }
  }, [options.lazy, loadBatch])

  return [
    state.data,
    updateBatch,
    deleteBatch,
    {
      loading: state.loading,
      errors: state.errors,
      reload: loadBatch,
      clearErrors
    }
  ]
}