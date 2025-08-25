/**
 * React Error Boundary component with comprehensive error handling
 */

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw, Home, Bug, Copy } from '@phosphor-icons/react'
import { ApplicationError, ErrorHandler, ERROR_CODES } from '@/lib/errorHandler'
import type { ErrorBoundaryState } from '@/lib/types'

interface Props {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'feature'
}

export class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
  private retryCount = 0
  private readonly maxRetries = 3

  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Create application error for proper handling
    const appError = new ApplicationError(
      ERROR_CODES.UNKNOWN_ERROR,
      error.message,
      {
        severity: this.props.level === 'page' ? 'critical' : 'high',
        details: {
          componentStack: errorInfo.componentStack,
          errorBoundaryLevel: this.props.level || 'component',
          retryCount: this.retryCount
        },
        action: 'component_render',
        recoverable: this.retryCount < this.maxRetries,
        cause: error
      }
    )

    // Handle the error through our error system
    ErrorHandler.handle(appError, 'ErrorBoundary')

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log additional context for debugging
    console.group('🚨 React Error Boundary Caught Error')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Props:', this.props)
    console.groupEnd()
  }

  retry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined
      })
    }
  }

  reset = () => {
    this.retryCount = 0
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    })
  }

  goHome = () => {
    window.location.href = '/'
  }

  copyErrorDetails = () => {
    if (this.state.error && this.state.errorInfo) {
      const errorDetails = {
        message: this.state.error.message,
        stack: this.state.error.stack,
        componentStack: this.state.errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      const errorText = JSON.stringify(errorDetails, null, 2)
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(errorText).catch(console.error)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = errorText
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error!,
          this.state.errorInfo!,
          this.retry
        )
      }

      return this.renderDefaultError()
    }

    return this.props.children
  }

  private renderDefaultError() {
    const { error, errorInfo } = this.state
    const { level = 'component' } = this.props
    const canRetry = this.retryCount < this.maxRetries
    const isPageLevel = level === 'page'

    return (
      <div className={`flex items-center justify-center ${isPageLevel ? 'min-h-screen bg-background' : 'p-4'}`}>
        <Card className={`w-full ${isPageLevel ? 'max-w-2xl' : 'max-w-lg'} shadow-lg border-destructive/20`}>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <CardTitle className="text-xl text-destructive">
              {isPageLevel ? 'Application Error' : 'Component Error'}
            </CardTitle>
            
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Level: {level}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Retry: {this.retryCount}/{this.maxRetries}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground">
              {isPageLevel 
                ? 'Something went wrong with the application. We apologize for the inconvenience.'
                : 'This component encountered an error and cannot be displayed.'
              }
            </div>

            {error && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium text-destructive mb-1">Error Details:</div>
                <div className="text-xs font-mono text-muted-foreground break-all">
                  {error.message}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {canRetry && (
                <Button 
                  onClick={this.retry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again {this.retryCount > 0 && `(${this.maxRetries - this.retryCount} attempts left)`}
                </Button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button 
                  onClick={this.reset}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>

                {isPageLevel && (
                  <Button 
                    onClick={this.goHome}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                )}
              </div>

              <Button 
                onClick={this.copyErrorDetails}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                <Copy className="h-3 w-3 mr-2" />
                Copy Error Details for Support
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && errorInfo && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  <Bug className="h-4 w-4 inline mr-2" />
                  Developer Information
                </summary>
                <div className="mt-2 p-3 bg-muted/30 rounded text-xs font-mono overflow-auto max-h-48">
                  <div className="mb-2">
                    <strong>Component Stack:</strong>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs">
                    {errorInfo.componentStack}
                  </pre>
                  {error?.stack && (
                    <>
                      <div className="mb-2 mt-4">
                        <strong>Error Stack:</strong>
                      </div>
                      <pre className="whitespace-pre-wrap text-xs">
                        {error.stack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              If this problem persists, please contact support with the error details above.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}

/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  const handleError = (error: Error | ApplicationError, context?: string) => {
    if (error instanceof ApplicationError) {
      ErrorHandler.handle(error, context)
    } else {
      const appError = new ApplicationError(
        ERROR_CODES.UNKNOWN_ERROR,
        error.message,
        {
          severity: 'medium',
          action: context,
          cause: error,
          recoverable: true
        }
      )
      ErrorHandler.handle(appError, context)
    }
  }

  return { handleError }
}

export default ErrorBoundary