import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ReportGenerator } from '@/components/ReportGenerator'

// Mock recharts components
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

const mockDocuments = [
  {
    id: '1',
    fileName: 'test1.pdf',
    title: 'Test Document 1',
    description: 'First test document',
    category: 'Primary' as const,
    children: ['Jace', 'Josh'],
    laws: ['Brady v. Maryland'],
    misconduct: [
      { law: 'Brady v. Maryland', page: '1', paragraph: '2', notes: 'Test note' }
    ],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-01-01T00:00:00Z',
    textContent: 'Sample text content',
    currentVersion: 1,
    lastModified: '2024-01-01T00:00:00Z',
    lastModifiedBy: 'Test User'
  },
  {
    id: '2',
    fileName: 'test2.pdf',
    title: 'Test Document 2',
    description: 'Second test document',
    category: 'Supporting' as const,
    children: ['Nicholas'],
    laws: ['CAPTA'],
    misconduct: [],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: false,
      oversightPacket: false
    },
    uploadedAt: '2024-01-02T00:00:00Z',
    textContent: 'Another sample text',
    currentVersion: 1,
    lastModified: '2024-01-02T00:00:00Z',
    lastModifiedBy: 'Test User'
  }
]

const mockDocumentVersions = [
  {
    id: 'v1',
    documentId: '1',
    version: 1,
    title: 'Test Document 1',
    description: 'First test document',
    category: 'Primary' as const,
    children: ['Jace', 'Josh'],
    laws: ['Brady v. Maryland'],
    misconduct: [],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    changedBy: 'Test User',
    changedAt: '2024-01-01T00:00:00Z',
    changeType: 'created' as const
  }
]

describe('ReportGenerator Component', () => {
  const mockOnExportReport = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <ReportGenerator
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
        onExportReport={mockOnExportReport}
      />
    )
    
    expect(screen.getByText('Justice Document Analytics')).toBeInTheDocument()
  })

  it('displays summary statistics', () => {
    render(
      <ReportGenerator
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
        onExportReport={mockOnExportReport}
      />
    )
    
    expect(screen.getByText('2')).toBeInTheDocument() // Total documents
    expect(screen.getByText('1')).toBeInTheDocument() // Primary evidence
  })

  it('shows charts when documents are present', () => {
    render(
      <ReportGenerator
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
        onExportReport={mockOnExportReport}
      />
    )
    
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('handles export functionality', async () => {
    render(
      <ReportGenerator
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
        onExportReport={mockOnExportReport}
      />
    )
    
    const exportButton = screen.getByText('Export Full Report')
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(mockOnExportReport).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            totalDocuments: 2,
            primaryEvidence: 1
          })
        })
      )
    })
  })

  it('renders empty state when no documents', () => {
    render(
      <ReportGenerator
        documents={[]}
        documentVersions={[]}
        onExportReport={mockOnExportReport}
      />
    )
    
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})