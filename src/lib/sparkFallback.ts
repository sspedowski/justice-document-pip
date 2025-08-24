/**
 * Spark runtime fallback implementation
 * for development environments without the Spark runtime
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
    localStorage.setItem(`spark-kv:${key}`, JSON.stringify(value))
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
  llmPrompt: (strings: string[], ...values: any[]): string => {
    return strings.reduce((result, string, i) => {
      return result + string + (values[i] || '')
    }, '')
  },

  async llm(prompt: string, modelName?: string, jsonMode?: boolean): Promise<string> {
    console.log('Fallback LLM called with prompt:', prompt.substring(0, 100) + '...')

    if (jsonMode) {
      return JSON.stringify({
        fallback: true, 
        message: 'LLM functionality requires Spark runtime' 
      })
    }
    
    return 'This is a fallback response. LLM functionality requires the Spark runtime environment.'
  }
}

// Initialize fallback if Spark is not available
if (typeof window !== 'undefined' && !window.spark) {
  window.spark = {
    ...fallbackLLM,
    ...fallbackUser,
    kv: fallbackKV
  }
  
  console.log('Spark fallback initialized for development')
}

// Auto-detect and warn about fallback usage
if (typeof window !== 'undefined') {
  const originalConsoleLog = console.log
  console.log = (...args) => {
    if (args[0]?.includes?.('Fallback LLM called')) {
      originalConsoleLog('⚠️ Using fallback LLM - some features may be limited')
    }
    originalConsoleLog(...args)
  }
}