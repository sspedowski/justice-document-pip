import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock @phosphor-icons/react
vi.mock('@phosphor-icons/react', () => {
  const MockIcon = ({ children, ...props }: any) => <span data-testid="icon" {...props}>{children}</span>
  return {
    AlertTriangle: MockIcon,
    RefreshCw: MockIcon
  }
})

import { ErrorBoundary } from '../components/ErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalError
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldError={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument()
  })

  it('displays error details when available', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details:')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('provides a reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByRole('button', { name: /reload application/i })
    expect(reloadButton).toBeInTheDocument()
  })

  it('shows contact information for support', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/If this problem persists/)).toBeInTheDocument()
  })

  it('resets error state when children change', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    rerender(
      <ErrorBoundary>
        <ThrowError shouldError={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('logs errors to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError shouldError={true} />
      </ErrorBoundary>
    )

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})