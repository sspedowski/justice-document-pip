import { useEffect, useState } from "react";

/**
 * Fallback useKV hook that mimics @github/spark/hooks functionality
 * Uses localStorage for persistence when Spark runtime is not available
 */
export function useKV<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      // Try to get from Spark KV first
      if (typeof window !== 'undefined' && window.spark?.kv) {
        // Spark KV is async, but we need sync for initial state
        // Fall back to localStorage for initial render
      }
      
      // Use localStorage as fallback
      const stored = localStorage.getItem(`kv:${key}`);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch (error) {
      console.warn('Failed to load from storage:', error);
      return initial;
    }
  });

  // Effect to sync with Spark KV when available
  useEffect(() => {
    const loadFromSparkKV = async () => {
      try {
        if (typeof window !== 'undefined' && window.spark?.kv) {
          const sparkValue = await window.spark.kv.get<T>(key);
          if (sparkValue !== undefined) {
            setValue(sparkValue);
          }
        }
      } catch (error) {
        console.warn('Failed to load from Spark KV:', error);
      }
    };

    loadFromSparkKV();
  }, [key]);

  // Effect to persist changes
  useEffect(() => {
    const saveValue = async () => {
      try {
        // Save to Spark KV if available
        if (typeof window !== 'undefined' && window.spark?.kv) {
          await window.spark.kv.set(key, value);
        }
        
        // Always save to localStorage as fallback
        localStorage.setItem(`kv:${key}`, JSON.stringify(value));
      } catch (error) {
        console.warn('Failed to save to storage:', error);
        // Try localStorage only
        try {
          localStorage.setItem(`kv:${key}`, JSON.stringify(value));
        } catch (localError) {
          console.error('Failed to save to localStorage:', localError);
        }
      }
    };

    saveValue();
  }, [key, value]);

  const updateValue = (newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const computed = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      return computed;
    });
  };

  const deleteValue = async () => {
    try {
      // Delete from Spark KV if available
      if (typeof window !== 'undefined' && window.spark?.kv) {
        await window.spark.kv.delete(key);
      }
      
      // Delete from localStorage
      localStorage.removeItem(`kv:${key}`);
      
      // Reset to initial value
      setValue(initial);
    } catch (error) {
      console.warn('Failed to delete from storage:', error);
      // Try localStorage only
      try {
        localStorage.removeItem(`kv:${key}`);
        setValue(initial);
      } catch (localError) {
        console.error('Failed to delete from localStorage:', localError);
      }
    }
  };

  return [value, updateValue, deleteValue];
}