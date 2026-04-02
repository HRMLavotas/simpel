import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    logger.error('Uncaught error:', error);
    logger.error('Error info:', errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to error tracking service
    // Example:
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Oops! Terjadi Kesalahan
              </h1>
              <p className="text-muted-foreground">
                Aplikasi mengalami error yang tidak terduga. Silakan refresh halaman atau hubungi administrator jika masalah berlanjut.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={this.handleRefresh} 
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Halaman
              </Button>
              <Button 
                variant="outline" 
                onClick={this.handleGoBack}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            </div>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left text-xs bg-muted p-4 rounded-lg border">
                <summary className="cursor-pointer font-semibold text-sm mb-2 hover:text-primary transition-colors">
                  Detail Error (untuk developer)
                </summary>
                <div className="space-y-2 mt-2">
                  <div>
                    <p className="font-semibold text-destructive">Error:</p>
                    <pre className="mt-1 overflow-auto bg-background p-2 rounded border">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <p className="font-semibold text-destructive">Component Stack:</p>
                      <pre className="mt-1 overflow-auto bg-background p-2 rounded border max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Reset Button (Development Only) */}
            {import.meta.env.DEV && (
              <Button 
                variant="ghost" 
                onClick={this.handleReset}
                className="w-full text-xs"
              >
                Reset Error Boundary (Dev Only)
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
