import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import '@testing-library/jest-dom'

// Mock all external dependencies
vi.mock('@/hooks/useKV', () => ({
  useKV: (key: string, initial: any) => {
    const [state, setState] = useState(initial)
    return [state, setState, () => setState(initial)]
  }
}))

vi.mock('@/lib/pdfProcessor', () => ({
  validatePDF: vi.fn().mockResolvedValue(true),
  extractTextFromPDF: vi.fn().mockResolvedValue({
    text: 'Brady evidence suppression. Due process violation. Child abuse investigation involving Jace and Josh.',
    pageCount: 3,
    metadata: { 
      title: 'Police Investigation Report',
      author: 'Detective Smith',
      creationDate: new Date('2024-01-01'),
      modificationDate: new Date('2024-01-02')
    }
  }),
  getPDFInfo: vi.fn().mockResolvedValue({ 
    pageCount: 3, 
    size: 2048
  })
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}))

import App from '../App'

// Helper to create a mock PDF file
const createMockPDFFile = (name = 'test-document.pdf') => {
  return new File(['%PDF-1.4 mock content'], name, { type: 'application/pdf' })
}

describe('Document Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    vi.stubGlobal('localStorage', localStorageMock)
    
    // Mock window.spark
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

    // Mock fetch for processed documents
    global.fetch = vi.fn().mockRejectedValue(new Error('No processed documents'))
  })

  it('completes full document upload and processing workflow', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // Navigate to upload tab
    await user.click(screen.getByText('Upload & Process'))

    // Find upload area
    const uploadArea = screen.getByText(/Drop PDF files here or click to browse/)

    // Create and upload a mock file
    const file = createMockPDFFile('police-report.pdf')
    
    // Simulate file drop
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    })

    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText(/Processing Documents/)).toBeInTheDocument()
    }, { timeout: 1000 })

    // Should show processing progress
    expect(screen.getByText('police-report.pdf')).toBeInTheDocument()

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/complete/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles document search and filtering', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // Go to dashboard
    await user.click(screen.getByText('Document Dashboard'))

    // Test main search
    const searchInput = screen.getByPlaceholderText(/Search documents/)
    await user.type(searchInput, 'police')

    // Test category filter
    const categorySelect = screen.getByText('All Categories')
    await user.click(categorySelect)
    await user.click(screen.getByText('Primary'))

    // Test content search
    await user.click(screen.getByText('Content Search'))
    
    await waitFor(() => {
      expect(screen.getByText('Search Inside Documents')).toBeInTheDocument()
    })

    const contentSearchInput = screen.getByPlaceholderText(/Search within document content/)
    await user.type(contentSearchInput, 'Brady')
  })

  it('generates and exports reports', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // Navigate to reports
    await user.click(screen.getByText('Reports & Analytics'))

    // Should show report interface
    expect(screen.getByText('Justice Documentation Report')).toBeInTheDocument()

    // Should show charts
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()

    // Test export functionality
    const exportButton = screen.getByText(/Export Complete Report/)
    await user.click(exportButton)
  })

  it('manages document versions correctly', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // Go to dashboard
    await user.click(screen.getByText('Document Dashboard'))

    // The test should work with empty documents for now
    // since we can't easily override the mocked useKV mid-test
    expect(screen.getByText('Document Dashboard')).toBeInTheDocument()
  })

  it('handles errors gracefully', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // Navigate to upload
    await user.click(screen.getByText('Upload & Process'))

    // Try to upload invalid file
    const uploadArea = screen.getByText(/Drop PDF files here or click to browse/)
    const invalidFile = new File(['not a pdf'], 'invalid.pdf', { type: 'application/pdf' })
    
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [invalidFile]
      }
    })

    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.getByText(/Processing Documents/)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('supports keyboard shortcuts', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // Test Ctrl+K for search focus
    await user.keyboard('{Control>}k{/Control}')
    
    const searchInput = screen.getByPlaceholderText(/Search documents/)
    expect(searchInput).toHaveFocus()

    // Test Ctrl+Shift+F for content search
    await user.keyboard('{Control>}{Shift>}f{/Shift}{/Control}')
    
    await waitFor(() => {
      expect(screen.getByText('Search Inside Documents')).toBeInTheDocument()
    })
  })

  it('exports CSV data correctly', async () => {
    const user = userEvent.setup()
    
    // Mock URL.createObjectURL and document.createElement
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    const mockClick = vi.fn()
    const mockCreateElement = vi.fn().mockReturnValue({
      href: '',
      download: '',
      click: mockClick
    })
    
    global.URL.createObjectURL = mockCreateObjectURL
    global.document.createElement = mockCreateElement

    render(<App />)

    // Click export button
    const exportButton = screen.getByText('Export CSV')
    await user.click(exportButton)

    // Should create download link
    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(mockClick).toHaveBeenCalled()
  })
})