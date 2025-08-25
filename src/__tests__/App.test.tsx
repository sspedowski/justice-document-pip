import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock dependencies that might not be available in test environment
vi.mock('@github/spark/hooks', () => ({
  useKV: (key: string, initial: any) => {
    const [state, setState] = useState(initial)
    return [state, setState, () => setState(initial)]
  }
}))

vi.mock('@/lib/pdfProcessor', () => ({
  validatePDF: vi.fn().mockResolvedValue(true),
  extractTextFromPDF: vi.fn().mockResolvedValue({
    text: 'Sample PDF text content',
    pageCount: 1,
    metadata: { title: 'Test Document' }
  }),
  getPDFInfo: vi.fn().mockResolvedValue({ pageCount: 1, size: 1024 })
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

import { useState } from 'react'
import { vi } from 'vitest'
import App from '../src/App'

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    vi.stubGlobal('localStorage', localStorageMock)
    
    // Mock window.spark for Spark runtime fallback
    vi.stubGlobal('spark', {
      kv: {
        get: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        keys: vi.fn().mockResolvedValue([])
      },
      user: vi.fn().mockResolvedValue({
        avatarUrl: 'https://github.com/github.png',
        email: 'test@example.com',
        id: 'test-user',
        isOwner: true,
        login: 'test-user'
      }),
      llm: vi.fn().mockResolvedValue('Mock LLM response'),
      llmPrompt: vi.fn().mockImplementation((strings, ...values) => 
        strings.reduce((result, string, i) => result + string + (values[i] || ''), '')
      )
    })
  })

  it('renders without crashing', () => {
    render(<App />)
    
    expect(screen.getByText('Justice Document Manager')).toBeInTheDocument()
    expect(screen.getByText(/Contact & Action Book/)).toBeInTheDocument()
  })

  it('displays the main navigation tabs', () => {
    render(<App />)
    
    expect(screen.getByText('Document Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument()
    expect(screen.getByText('Upload & Process')).toBeInTheDocument()
  })

  it('shows empty state when no documents are present', () => {
    render(<App />)
    
    // Should show empty state or loading state initially
    expect(
      screen.getByText(/No documents found/) || 
      screen.getByText(/Loading/)
    ).toBeInTheDocument()
  })

  it('displays the search interface', () => {
    render(<App />)
    
    expect(screen.getByPlaceholderText(/Search documents/)).toBeInTheDocument()
    expect(screen.getByText('Content Search')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<App />)
    
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
    expect(screen.getByText('Generate Packets')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })
})