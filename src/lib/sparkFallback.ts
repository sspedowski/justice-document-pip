/**
 * Fallback implementation for Spark runtime features
 * Provides localStorage-based persistence and placeholder implementations
 * when the Spark runtime is not available
 */

declare global {
  interface Window {
    spark?: {
      llmPrompt: (strings: string[], ...values: any[]) => string
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
      const item = localStorage.getItem(`spark-kv:${key}`)
      return item ? JSON.parse(item) : undefined
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

// Fallback user info
const fallbackUser = {
  async user() {
    return {
      avatarUrl: '',
      email: 'local@user.dev',
      id: 'local-user',
      isOwner: true,
      login: 'local-user'
    }
  }
}

// Fallback LLM functions (return placeholder responses)
const fallbackLLM = {
  llmPrompt: (strings: string[], ...values: any[]): string => {
    return strings.reduce((result, string, i) => {
      return result + string + (values[i] || '')
    }, '')
  },

  async llm(prompt: string, modelName?: string, jsonMode?: boolean): Promise<string> {
    console.warn('LLM fallback: Spark runtime not available')
    
    if (jsonMode) {
      return JSON.stringify({ 
        message: 'Spark runtime not available in this environment',
        fallback: true
      })
    }
    
    return 'Spark runtime not available in this environment. This is a fallback response.'
  }
}

// Initialize fallback if spark is not available
export function initializeSparkFallback() {
  if (typeof window !== 'undefined' && !window.spark) {
    window.spark = {
      ...fallbackLLM,
      ...fallbackUser,
      kv: fallbackKV
    }
    console.log('Spark fallback initialized - using localStorage for persistence')
  }
}

// Auto-initialize with a small delay to allow Spark to load first if available
if (typeof window !== 'undefined') {
  // Small delay to allow Spark to load first if available
  setTimeout(initializeSparkFallback, 100)
}