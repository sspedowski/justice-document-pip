import { useState, useCallback, useEffect } from 'react'

/**
 * React hook for persistent key-value storage using Spark KV API with localStorage fallback
 * Automatically syncs with the Spark runtime when available
 */
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(defaultValue)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize value from storage
  useEffect(() => {
    const initializeValue = async () => {
      try {
        if (typeof window !== 'undefined' && window.spark?.kv) {
          // Use Spark KV when available
          const storedValue = await window.spark.kv.get<T>(key)
          setValue(storedValue !== undefined ? storedValue : defaultValue)
        } else {
          // Fallback to localStorage
          const item = localStorage.getItem(`spark-kv:${key}`)
          setValue(item ? JSON.parse(item) : defaultValue)
        }
      } catch (error) {
        console.error('Error loading from storage:', error)
        setValue(defaultValue)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeValue()
  }, [key, defaultValue])

  const setStoredValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue
      setValue(valueToStore)
      
      if (typeof window !== 'undefined' && window.spark?.kv) {
        // Use Spark KV when available
        await window.spark.kv.set(key, valueToStore)
      } else {
        // Fallback to localStorage
        localStorage.setItem(`spark-kv:${key}`, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error('Error saving to storage:', error)
    }
  }, [key, value])

  const deleteValue = useCallback(async () => {
    try {
      setValue(defaultValue)
      
      if (typeof window !== 'undefined' && window.spark?.kv) {
        // Use Spark KV when available
        await window.spark.kv.delete(key)
      } else {
        // Fallback to localStorage
        localStorage.removeItem(`spark-kv:${key}`)
      }
    } catch (error) {
      console.error('Error deleting from storage:', error)
    }
  }, [key, defaultValue])

  // Return default value until initialized to prevent hydration mismatches
  return [isInitialized ? value : defaultValue, setStoredValue, deleteValue]
}