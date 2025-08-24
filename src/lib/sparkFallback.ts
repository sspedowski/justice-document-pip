/**
 * Spark Runtime Fallback Implementation
 * Provides fallback functionality when Spark runtime is not available
 */

// Type definitions for Spark runtime
declare global {
  interface Window {
    spark?: {
      llmPrompt: (strings: TemplateStringsArray, ...values: any[]) => string
      llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>
      user: () => Promise<{
        avatarUrl: string
        email: string
        id: string
        isOwner: boolean
        login: string
      }>
      kv: {
        keys: () => Promise<string[]>
        get: <T>(key: string) => Promise<T | undefined>
        set: <T>(key: string, value: T) => Promise<void>
        delete: (key: string) => Promise<void>
      }
    }
  }
}

// Fallback KV storage using localStorage
const fallbackKV = {
  async keys(): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('spark-kv:')) {
        keys.push(key.replace('spark-kv:', ''))
      }
    }
    return keys
  },

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = localStorage.getItem(`spark-kv:${key}`)
      return value ? JSON.parse(value) : undefined
    } catch {
      return undefined
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(`spark-kv:${key}`, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },

  async delete(key: string): Promise<void> {
    localStorage.removeItem(`spark-kv:${key}`)
  }
}

// Fallback user implementation
const fallbackUser = {
  async user() {
    return {
      avatarUrl: 'https://github.com/github.png',
      email: 'local-user@example.com',
      id: 'local-user',
      isOwner: true,
      login: 'local-user'
    }
  }
}

// Fallback LLM implementation
const fallbackLLM = {
  llmPrompt(strings: TemplateStringsArray, ...values: any[]): string {
    return strings.reduce((result, string, i) => {
      return result + string + (values[i] || '')
    }, '')
  },

  async llm(prompt: string, modelName?: string, jsonMode?: boolean): Promise<string> {
    // Return a placeholder response for development
    return jsonMode 
      ? '{"placeholder": true, "message": "LLM not available in development mode"}'
      : 'LLM functionality not available in development mode. This is a placeholder response.'
  }
}

// Initialize fallback if Spark is not available
if (typeof window !== 'undefined' && !window.spark) {
  window.spark = {
    ...fallbackLLM,
    ...fallbackUser,
    kv: fallbackKV
  }
}