import { useState, useCallback } from 'react'

/**
 * React hook for persistent key-value storage using localStorage as fallback for development
 * This would use the Spark KV API in production
 */
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(`kv:${key}`)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue
      setValue(valueToStore)
      localStorage.setItem(`kv:${key}`, JSON.stringify(valueToStore))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [key, value])

  const deleteValue = useCallback(() => {
    try {
      setValue(defaultValue)
      localStorage.removeItem(`kv:${key}`)
    } catch (error) {
      console.error('Error deleting from localStorage:', error)
    }
  }, [key, defaultValue])

  return [value, setStoredValue, deleteValue]
}