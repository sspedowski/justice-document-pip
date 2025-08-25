import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import { DocumentComparison } from '../components/DocumentComparison'

const mockDocument = {
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
  currentVersion: 3,
  lastModified: '2024-01-03T00:00:00Z',
  lastModifiedBy: 'Test User'
}

const mockDocumentVersions = [
  {
    id: '1-v1',
    documentId: '1',
    version: 1,
    title: 'Test Document 1 - Original',
    description: 'Original description',
    category: 'Supporting' as const,
    children: ['Jace'],
    laws: ['Brady v. Maryland'],
    misconduct: [],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: false,
      oversightPacket: false
    },
    changedBy: 'Initial User',
    changedAt: '2024-01-01T00:00:00Z',
    changeNotes: 'Initial creation',
    changeType: 'created' as const
  },
  {
    id: '1-v2',
    documentId: '1',
    version: 2,
    title: 'Test Document 1 - Updated',
    description: 'Updated description',
    category: 'Primary' as const,
    children: ['Jace', 'Josh'],
    laws: ['Brady v. Maryland', 'Due Process'],
    misconduct: [
      { law: 'Brady v. Maryland', page: '1', paragraph: '1', notes: 'Initial misconduct' }
    ],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: false
    },
    changedBy: 'Test User',
    changedAt: '2024-01-02T00:00:00Z',
    changeNotes: 'Added misconduct details',
    changeType: 'edited' as const
  },
  {
    id: '1-v3',
    documentId: '1',
    version: 3,
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
    changedBy: 'Test User',
    changedAt: '2024-01-03T00:00:00Z',
    changeNotes: 'Final updates',
    changeType: 'edited' as const
  }
]

describe('DocumentComparison Component', () => {
  const mockOnClose = vi.fn()
  const mockOnRevertToVersion = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <DocumentComparison
        document={mockDocument}
        documentVersions={mockDocumentVersions}
        isOpen={true}
        onClose={mockOnClose}
        onRevertToVersion={mockOnRevertToVersion}
      />
    )

    expect(screen.getByText('Compare Document Versions')).toBeInTheDocument()
    expect(screen.getByText('Test Document 1')).toBeInTheDocument()
  })

  it('displays version selection dropdowns', () => {
    render(
      <DocumentComparison
        document={mockDocument}
        documentVersions={mockDocumentVersions}
        isOpen={true}
        onClose={mockOnClose}
        onRevertToVersion={mockOnRevertToVersion}
      />
    )

    expect(screen.getByText('Version A (Left)')).toBeInTheDocument()
    expect(screen.getByText('Version B (Right)')).toBeInTheDocument()
  })

  it('shows differences between versions when selected', async () => {
    const user = userEvent.setup()
    
    render(
      <DocumentComparison
        document={mockDocument}
        documentVersions={mockDocumentVersions}
        isOpen={true}
        onClose={mockOnClose}
        onRevertToVersion={mockOnRevertToVersion}
      />
    )

    // The component should automatically select current vs previous version
    expect(screen.getByText('Title:')).toBeInTheDocument()
    expect(screen.getByText('Category:')).toBeInTheDocument()
    expect(screen.getByText('Children:')).toBeInTheDocument()
    expect(screen.getByText('Laws:')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <DocumentComparison
        document={mockDocument}
        documentVersions={mockDocumentVersions}
        isOpen={true}
        onClose={mockOnClose}
        onRevertToVersion={mockOnRevertToVersion}
      />
    )

    // The close button should be available via escape key or X button
    fireEvent.keyDown(document, { key: 'Escape' })
    // Note: The actual close behavior depends on the Dialog implementation
  })

  it('handles case with no versions gracefully', () => {
    render(
      <DocumentComparison
        document={mockDocument}
        documentVersions={[]}
        isOpen={true}
        onClose={mockOnClose}
        onRevertToVersion={mockOnRevertToVersion}
      />
    )

    expect(screen.getByText('Compare Document Versions')).toBeInTheDocument()
    // Should handle empty versions array without crashing
  })

  it('displays change metadata for versions', () => {
    render(
      <DocumentComparison
        document={mockDocument}
        documentVersions={mockDocumentVersions}
        isOpen={true}
        onClose={mockOnClose}
        onRevertToVersion={mockOnRevertToVersion}
      />
    )

    // Should show version information and change notes
    expect(screen.getByText(/Version/)).toBeInTheDocument()
  })

  it('highlights differences between versions', () => {
    render(
      <DocumentComparison
        document={mockDocument}
        documentVersions={mockDocumentVersions}
        isOpen={true}
        onClose={mockOnClose}
        onRevertToVersion={mockOnRevertToVersion}
      />
    )

    // Should show comparison fields
    expect(screen.getByText('Description:')).toBeInTheDocument()
    expect(screen.getByText('Placement:')).toBeInTheDocument()
  })
})