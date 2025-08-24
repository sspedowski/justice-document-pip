/**
 * for development environments without 

  i

      user: () =
        email: strin
        isOwn
      }>
        keys: () => Promise<string[]>
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
      i
    }
   
}

// Fallback KV storage using localStorage
      const item = l
  async keys(): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('spark-kv:')) {
        keys.push(key.replace('spark-kv:', ''))
      }
    l
    return keys


  async user() {
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
const fallbackUser = {
  }
    return {
// Initialize fallback if Spark is not available
      email: 'local-user@example.com',
    ...fallbackLLM,
      isOwner: true,
  }
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

































