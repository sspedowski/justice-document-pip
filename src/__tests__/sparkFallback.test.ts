import { describe, it, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'

describe('Spark Fallback', () => {
  beforeEach(() => {
    // Clear any existing window.spark
    delete (window as any).spark
    vi.clearAllMocks()
  })

  it('creates fallback spark object when not available', async () => {
    // Import the fallback (this should create window.spark)
    await import('../lib/sparkFallback')

    expect(window.spark).toBeDefined()
    expect(window.spark.kv).toBeDefined()
    expect(window.spark.user).toBeDefined()
    expect(window.spark.llm).toBeDefined()
    expect(window.spark.llmPrompt).toBeDefined()
  })

  it('provides working kv storage', async () => {
    await import('../lib/sparkFallback')

    // Test set and get
    await window.spark.kv.set('test-key', 'test-value')
    const result = await window.spark.kv.get('test-key')
    expect(result).toBe('test-value')

    // Test keys
    const keys = await window.spark.kv.keys()
    expect(keys).toContain('test-key')

    // Test delete
    await window.spark.kv.delete('test-key')
    const deletedResult = await window.spark.kv.get('test-key')
    expect(deletedResult).toBeUndefined()
  })

  it('provides working user function', async () => {
    await import('../lib/sparkFallback')

    const user = await window.spark.user()
    expect(user).toEqual({
      avatarUrl: 'https://github.com/github.png',
      email: 'demo@example.com',
      id: 'demo-user',
      isOwner: true,
      login: 'demo-user'
    })
  })

  it('provides working llm function', async () => {
    await import('../lib/sparkFallback')

    const response = await window.spark.llm('test prompt')
    expect(response).toContain('This is a demo response')
    expect(response).toContain('test prompt')
  })

  it('provides working llmPrompt function', async () => {
    await import('../lib/sparkFallback')

    const prompt = window.spark.llmPrompt`Hello ${'world'} from ${'test'}`
    expect(prompt).toBe('Hello world from test')
  })

  it('handles complex data types in kv storage', async () => {
    await import('../lib/sparkFallback')

    const testObject = {
      array: [1, 2, 3],
      nested: { key: 'value' },
      boolean: true,
      number: 42
    }

    await window.spark.kv.set('complex-data', testObject)
    const result = await window.spark.kv.get('complex-data')
    expect(result).toEqual(testObject)
  })

  it('persists data across multiple operations', async () => {
    await import('../lib/sparkFallback')

    // Set multiple values
    await window.spark.kv.set('key1', 'value1')
    await window.spark.kv.set('key2', 'value2')
    await window.spark.kv.set('key3', 'value3')

    // Check all keys exist
    const keys = await window.spark.kv.keys()
    expect(keys).toContain('key1')
    expect(keys).toContain('key2')
    expect(keys).toContain('key3')

    // Delete one key
    await window.spark.kv.delete('key2')

    // Check remaining keys
    const remainingKeys = await window.spark.kv.keys()
    expect(remainingKeys).toContain('key1')
    expect(remainingKeys).toContain('key3')
    expect(remainingKeys).not.toContain('key2')
  })

  it('does not override existing spark object', async () => {
    const existingSpark = {
      kv: { test: 'existing' },
      user: () => Promise.resolve({ test: 'existing' }),
      llm: () => Promise.resolve('existing'),
      llmPrompt: () => 'existing'
    }

    ;(window as any).spark = existingSpark

    await import('../lib/sparkFallback')

    expect(window.spark).toBe(existingSpark)
  })
})