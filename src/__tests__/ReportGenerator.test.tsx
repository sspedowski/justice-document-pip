import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import '@testing-library/jest-dom'

  YAxis: () => <div data-t
  Tooltip: () => <div data-t
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-contai
  Pie: () => <div data-testid="pie" />,
}))
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}))

      { law: 'Brady v. Mar
    includ
      masterFile: tru
      oversightPack
    uploadedAt: '
   
  }

    title: 'Test Document 2',

    laws: ['CAPTA'],
   
      master
      oversightPacket: false
    title: 'Test Document 1',
    description: 'First test document',
    category: 'Primary' as const,
    children: ['Jace', 'Josh'],
  {
    documentId: '
    title: 'Test Document 1',
    ca
    laws: ['Brady v. Marylan
    include: 'YE
      masterFile: true,
      oversightPacket: tru
    changedBy: 'Test User',
    ch
]
describe('ReportGenera

    vi.clearAllMocks()

   
        docu
        onExportReport={mockOn
    )
    expect(screen.getByText('Justice Doc

    render(
        documents={m
        onExportRep
    )
    expect(scree
  })
  it('shows charts when doc
      <ReportGenerator
      
      />

    expect(screen.getByTestId('pie-chart'

   
 

        onExportReport={mockOn
   
    const expor

    expect(mock
        summary: expect.objec
          primaryEvidence: 1
      })
  })
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




































































































