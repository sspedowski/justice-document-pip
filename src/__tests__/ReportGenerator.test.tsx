import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock chart dependencies
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

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

import { ReportGenerator } from '../components/ReportGenerator'

const mockDocuments = [
  {
    id: '1',
    fileName: 'document1.pdf',
    title: 'Test Document 1',
    description: 'First test document',
    category: 'Primary' as const,
    children: ['Jace', 'Josh'],
    laws: ['Brady v. Maryland', 'Due Process'],
    misconduct: [
      { law: 'Brady v. Maryland', page: '1', paragraph: '2', notes: 'Test misconduct' }
    ],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-01-01T00:00:00Z',
    currentVersion: 1,
    lastModified: '2024-01-01T00:00:00Z',
    lastModifiedBy: 'Test User'
  },
  {
    id: '2',
    fileName: 'document2.pdf',
    title: 'Test Document 2',
    description: 'Second test document',
    category: 'Supporting' as const,
    children: ['Nicholas'],
    laws: ['CAPTA'],
    misconduct: [],
    include: 'NO' as const,
    placement: {
      masterFile: false,
      exhibitBundle: false,
      oversightPacket: false
    },
    uploadedAt: '2024-01-02T00:00:00Z',
    currentVersion: 2,
    lastModified: '2024-01-02T00:00:00Z',
    lastModifiedBy: 'Test User'
  }
]

const mockDocumentVersions = [
  {
    id: '1-v1',
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

    expect(screen.getByText('Justice Documentation Report')).toBeInTheDocument()
  })

  it('displays document summary statistics', () => {
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

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('calls export function when export button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <ReportGenerator
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
        onExportReport={mockOnExportReport}
      />
    )

    const exportButton = screen.getByRole('button', { name: /export complete report/i })
    await user.click(exportButton)

    expect(mockOnExportReport).toHaveBeenCalledTimes(1)
    expect(mockOnExportReport).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.objectContaining({
          totalDocuments: 2,
          primaryEvidence: 1
        })
      })
    )
  })

  it('displays children involvement data', () => {
    render(
      <ReportGenerator
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
        onExportReport={mockOnExportReport}
      />
    )

    expect(screen.getByText('Children Involved')).toBeInTheDocument()
    // Should show unique children count (3: Jace, Josh, Nicholas)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('displays law violations data', () => {
    render(
      <ReportGenerator
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
        onExportReport={mockOnExportReport}
      />
    )

    expect(screen.getByText('Laws Violated')).toBeInTheDocument()
    // Should show unique laws count (3: Brady, Due Process, CAPTA)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('handles empty document list gracefully', () => {
    render(
      <ReportGenerator
        documents={[]}
        documentVersions={[]}
        onExportReport={mockOnExportReport}
      />
    )

    expect(screen.getByText('Justice Documentation Report')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument() // Should show 0 for all metrics
  })
})