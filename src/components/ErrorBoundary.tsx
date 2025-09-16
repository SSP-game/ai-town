import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#1a1a1a',
          color: 'white',
          fontFamily: 'monospace',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#ff6b6b', marginBottom: '20px' }}>
            Application Error
          </h1>
          <div style={{
            backgroundColor: '#2d2d2d',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            marginBottom: '20px'
          }}>
            <h2>Error Details:</h2>
            <pre style={{ textAlign: 'left', overflow: 'auto' }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
            {this.state.error?.stack && (
              <details style={{ marginTop: '10px' }}>
                <summary>Stack trace</summary>
                <pre style={{ textAlign: 'left', fontSize: '12px', overflow: 'auto' }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h3>Possible causes:</h3>
            <ul style={{ textAlign: 'left' }}>
              <li>Missing environment variables (VITE_CONVEX_URL)</li>
              <li>Network connectivity issues</li>
              <li>Invalid configuration</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;