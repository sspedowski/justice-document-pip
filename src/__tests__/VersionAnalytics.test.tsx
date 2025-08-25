import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { VersionAnalytics } from '../components/VersionAnalytics'

const mockDocumentVersions = [
  {
    id: '1-v1',
    documentId: '1',
    version: 1,
    title: 'Document 1',
    description: 'Test document 1',
    category: 'Primary' as const,
    children: ['Jace'],
    laws: ['Brady v. Maryland'],
    misconduct: [],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    changedBy: 'User A',
    changedAt: '2024-01-01T00:00:00Z',
    changeType: 'created' as const
  },
  {
    id: '1-v2',
    documentId: '1',
    version: 2,
    title: 'Document 1 Updated',
    description: 'Updated test document 1',
    category: 'Primary' as const,
    children: ['Jace', 'Josh'],
    laws: ['Brady v. Maryland', 'Due Process'],
    misconduct: [
      { law: 'Brady v. Maryland', page: '1', paragraph: '1', notes: 'Test' }
    ],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    changedBy: 'User B',
    changedAt: '2024-01-02T00:00:00Z',
    changeType: 'edited' as const
  },
  {
    id: '2-v1',
    documentId: '2',
    version: 1,
    title: 'Document 2',
    description: 'Test document 2',
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
    changedBy: 'User A',
    changedAt: '2024-01-03T00:00:00Z',
    changeType: 'imported' as const
  }
]

const mockDocuments = [
  {
    id: '1',
    fileName: 'document1.pdf',
    title: 'Document 1 Updated',
    description: 'Updated test document 1',
    category: 'Primary' as const,
    children: ['Jace', 'Josh'],
    laws: ['Brady v. Maryland', 'Due Process'],
    misconduct: [
      { law: 'Brady v. Maryland', page: '1', paragraph: '1', notes: 'Test' }
    ],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-01-01T00:00:00Z',
    currentVersion: 2,
    lastModified: '2024-01-02T00:00:00Z',
    lastModifiedBy: 'User B'
  },
  {
    id: '2',
    fileName: 'document2.pdf',
    title: 'Document 2',
    description: 'Test document 2',
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
    uploadedAt: '2024-01-03T00:00:00Z',
    currentVersion: 1,
    lastModified: '2024-01-03T00:00:00Z',
    lastModifiedBy: 'User A'
  }
]

describe('VersionAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <VersionAnalytics
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
      />
    )

    expect(screen.getByText('Version Tracking Analytics')).toBeInTheDocument()
  })

  it('displays version summary statistics', () => {
    render(
      <VersionAnalytics
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
      />
    )

    expect(screen.getByText('Total Versions')).toBeInTheDocument()
    expect(screen.getByText('Active Documents')).toBeInTheDocument()
    expect(screen.getByText('Contributors')).toBeInTheDocument()
  })

  it('shows correct version counts', () => {
    render(
      <VersionAnalytics
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
      />
    )

    // Should show total versions (3)
    expect(screen.getByText('3')).toBeInTheDocument()
    
    // Should show unique contributors (2: User A, User B)
    expect(screen.getByText('2')).toBeInTheDocument()
    
    // Should show documents with versions > 1 (1 document)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('displays recent activity when available', () => {
    // Mock recent versions (last 7 days)
    const recentVersions = mockDocumentVersions.map(v => ({
      ...v,
      changedAt: new Date().toISOString() // Make them recent
    }))

    render(
      <VersionAnalytics
        documents={mockDocuments}
        documentVersions={recentVersions}
      />
    )

    expect(screen.getByText(/changes in the last 7 days/)).toBeInTheDocument()
  })

  it('shows change type breakdown', () => {
    render(
      <VersionAnalytics
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
      />
    )

    // Should show different change types
    expect(screen.getByText('Change Types')).toBeInTheDocument()
  })

  it('handles empty data gracefully', () => {
    render(
      <VersionAnalytics
        documents={[]}
        documentVersions={[]}
      />
    )

    expect(screen.getByText('Version Tracking Analytics')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument() // Should show 0 for all metrics
  })

  it('displays contributor activity', () => {
    render(
      <VersionAnalytics
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
      />
    )

    expect(screen.getByText('Contributor Activity')).toBeInTheDocument()
    expect(screen.getByText('User A')).toBeInTheDocument()
    expect(screen.getByText('User B')).toBeInTheDocument()
  })

  it('shows document version distribution', () => {
    render(
      <VersionAnalytics
        documents={mockDocuments}
        documentVersions={mockDocumentVersions}
      />
    )

    expect(screen.getByText('Version Distribution')).toBeInTheDocument()
  })
})