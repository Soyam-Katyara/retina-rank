import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface State {
  hasError: boolean;
  error?: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Log the error for debugging
    console.error('ErrorBoundary caught error:', error);
    console.error('Error stack:', error.stack);
    // Show a toast so the user knows something went wrong
    toast.error('Something went wrong. Please try again or reload the page.');
    // In production we could log to a monitoring service here (e.g. Sentry)
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
          <div className="max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-2">An unexpected error occurred while loading this page.</p>
            <p className="text-sm text-destructive mb-6 break-words bg-destructive/5 p-3 rounded border border-destructive/20">
              {errorMessage}
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => window.location.reload()}>Reload</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
