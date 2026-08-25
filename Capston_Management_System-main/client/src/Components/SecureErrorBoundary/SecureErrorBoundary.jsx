import React from 'react';
import { API_CONFIG } from '../../config/apiConfig.js';

/**
 * Secure Error Boundary Component
 * Catches JavaScript errors and prevents them from exposing sensitive information
 */
class SecureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error securely (only in development)
    if (API_CONFIG.DEBUG) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default secure fallback UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <div style={{
            fontSize: '24px',
            color: '#6c757d',
            marginBottom: '10px'
          }}>
            ⚠️
          </div>
          <h3 style={{
            color: '#495057',
            marginBottom: '10px',
            fontSize: '18px'
          }}>
            Something went wrong
          </h3>
          <p style={{
            color: '#6c757d',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {API_CONFIG.DEBUG 
              ? (this.state.error?.message || 'An unexpected error occurred')
              : 'Please refresh the page and try again.'
            }
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Refresh Page
          </button>
          
          {/* Show detailed error only in development */}
          {API_CONFIG.DEBUG && this.state.error && (
            <details style={{
              marginTop: '20px',
              textAlign: 'left',
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              maxWidth: '100%',
              overflow: 'auto'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                fontSize: '12px',
                color: '#dc3545',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default SecureErrorBoundary;
