import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'

import { useKV } from '@github/spark/hooks'

describe('useKV Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initializes with default value when localStorage is empty', () => {
    const { result } = renderHook(() => useKV('test-key', 'default-value'))
    
    expect(result.current[0]).toBe('default-value')
  })

  it('loads existing value from localStorage', () => {
    localStorage.setItem('kv:test-key', JSON.stringify('stored-value'))
    
    const { result } = renderHook(() => useKV('test-key', 'default-value'))
    
    expect(result.current[0]).toBe('stored-value')
  })

  it('updates localStorage when value changes', async () => {
    const { result } = renderHook(() => useKV('test-key', 'initial'))
    
    act(() => {
      result.current[1]('updated-value')
    })
    
    expect(result.current[0]).toBe('updated-value')
    
    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(localStorage.getItem('kv:test-key')).toBe(JSON.stringify('updated-value'))
  })

  it('handles complex objects', async () => {
    const complexObject = {
      array: [1, 2, 3],
      nested: { key: 'value' },
      boolean: true,
      number: 42
    }
    
    const { result } = renderHook(() => useKV('complex-key', {}))
    
    act(() => {
      result.current[1](complexObject)
    })
    
    expect(result.current[0]).toEqual(complexObject)
    
    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(JSON.parse(localStorage.getItem('kv:complex-key') || '{}')).toEqual(complexObject)
  })

  it('handles arrays correctly', async () => {
    const testArray = ['item1', 'item2', 'item3']
    
    const { result } = renderHook(() => useKV('array-key', []))
    
    act(() => {
      result.current[1](testArray)
    })
    
    expect(result.current[0]).toEqual(testArray)
    
    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(JSON.parse(localStorage.getItem('kv:array-key') || '[]')).toEqual(testArray)
  })

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalSetItem = localStorage.setItem
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('localStorage is full')
    })
    
    const { result } = renderHook(() => useKV('error-key', 'default'))
    
    // Should not throw error when setting value
    act(() => {
      expect(() => result.current[1]('new-value')).not.toThrow()
    })
    
    // Value should still be updated in state
    expect(result.current[0]).toBe('new-value')
    
    // Restore original localStorage
    localStorage.setItem = originalSetItem
  })

  it('handles corrupted localStorage data', () => {
    // Set invalid JSON in localStorage
    const originalGetItem = localStorage.getItem
    localStorage.getItem = vi.fn().mockReturnValue('invalid json{')
    
    const { result } = renderHook(() => useKV('corrupted-key', 'default'))
    
    // Should fall back to default value when JSON parsing fails
    expect(result.current[0]).toBe('default')
    
    // Restore original localStorage
    localStorage.getItem = originalGetItem
  })

  it('updates localStorage reactively', async () => {
    const { result } = renderHook(() => useKV('reactive-key', 0))
    
    // Multiple updates
    act(() => {
      result.current[1](1)
    })
    
    expect(result.current[0]).toBe(1)
    
    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(localStorage.getItem('kv:reactive-key')).toBe('1')
    
    act(() => {
      result.current[1](2)
    })
    
    expect(result.current[0]).toBe(2)
    
    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    expect(localStorage.getItem('kv:reactive-key')).toBe('2')
  })

  it('handles different data types', () => {
    // Test with boolean
    const { result: boolResult } = renderHook(() => useKV('bool-key', false))
    act(() => boolResult.current[1](true))
    expect(boolResult.current[0]).toBe(true)
    
    // Test with number
    const { result: numResult } = renderHook(() => useKV('num-key', 0))
    act(() => numResult.current[1](42))
    expect(numResult.current[0]).toBe(42)
    
    // Test with null
    const { result: nullResult } = renderHook(() => useKV('null-key', 'default'))
    act(() => nullResult.current[1](null))
    expect(nullResult.current[0]).toBe(null)
  })

  it('maintains independence between different keys', () => {
    const { result: result1 } = renderHook(() => useKV('key1', 'value1'))
    const { result: result2 } = renderHook(() => useKV('key2', 'value2'))
    
    act(() => {
      result1.current[1]('updated1')
    })
    
    expect(result1.current[0]).toBe('updated1')
    expect(result2.current[0]).toBe('value2') // Should not be affected
  })

  it('persists data across hook re-renders', () => {
    const { result, rerender } = renderHook(() => useKV('persist-key', 'initial'))
    
    act(() => {
      result.current[1]('updated')
    })
    
    // Re-render the hook
    rerender()
    
    expect(result.current[0]).toBe('updated')
  })
})