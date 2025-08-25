import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from '@phosphor-icons/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h1>
            
            <p className="text-muted-foreground mb-6">
              We encountered an unexpected error. This might be a temporary issue.
            </p>

            {this.state.error && (
              <details className="text-left mb-6">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground mb-2">
                  Error Details:
                </summary>
                <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <div className="mt-2 pt-2 border-t border-border">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/80 flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Reload Application
              </button>
            </div>
            
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>If this problem persists:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Try refreshing the page</li>
                <li>Clear your browser cache</li>
                <li>Check your internet connection</li>
                <li>Contact support if the issue continues</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}