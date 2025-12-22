"use client";

import React, { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches unhandled errors in the component tree
 * and displays a recovery UI instead of crashing the entire app.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development, could be sent to error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#87944d] p-4">
          <div className="max-w-md w-full bg-[#fffbe6] border-4 border-[#a86b2d] rounded-2xl p-8 text-center shadow-lg">
            <h1 className="text-2xl font-bold text-[#5a4a1a] mb-4">
              Something went wrong
            </h1>
            <p className="text-[#5a4a1a] mb-6">
              An unexpected error occurred. Please try again.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-left text-xs bg-red-50 text-red-700 p-3 rounded mb-6 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-[#a86b2d] text-white rounded-lg hover:bg-[#8b5a2b] transition-colors font-semibold"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-[#5a4a1a] text-white rounded-lg hover:bg-[#3a2a0a] transition-colors font-semibold"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


