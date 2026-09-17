import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI error in component tree:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          fontFamily: 'var(--font-play, system-ui, sans-serif)'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#fff',
            border: '2px solid #FED7AA',
            borderRadius: '24px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐾⚠️</div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--play-charcoal, #2D3142)', marginBottom: '8px' }}>
              Something went wrong loading this view
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.5, marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                🔄 Reload Page
              </button>
              <a
                href="/"
                className="btn btn-outline"
                style={{
                  padding: '10px 20px',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                🏠 Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
