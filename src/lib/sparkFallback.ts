/**
 * Fallback implementation for development environments without Spark runtime
dec

      llm: (prom
        avatarUrl: s
        id: 
        login: string
      kv: {
      user: () => Promise<{
        avatarUrl: string
        email: string
        id: string
        isOwner: boolean
        login: string
      }>
      kv: {
        keys: () => Promise<string[]>
    return keys

    try {
      }
     
  }
 

  async delete(key: string): Promise<void
const fallbackKV = {

const fallbackUser = {
    return {
      email: 'local-user@example.com'
      isOwner: true,
    }
}
    }
  llmPrompt: (s
  },

  async get<T>(key: string): Promise<T | undefined> {
    
      return JSON.stringify({
        placeholder: true
    }
    return 'Spark LLM 
    }
// I

    ...fallbackUser,
  }




  }
}

// Fallback user implementation

  async user() {

      avatarUrl: 'https://github.com/github.png',

      id: 'local-dev-user',

      login: 'local-dev'

  }











    console.warn('Spark LLM not available in development. Returning placeholder response.')
    
    if (jsonMode) {
      return JSON.stringify({
        message: 'Spark LLM not available in development environment',
        placeholder: true
      })
    }
    
    return 'Spark LLM not available in development environment. This is a placeholder response.'
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