import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Tiệm Hoa Xinh ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'linear-gradient(135deg, #fff1f2 0%, #fffdfb 100%)',
          }}
        >
          <div
            className="panel"
            style={{
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
              padding: '36px 28px',
              borderRadius: 24,
              border: '1px solid #fecdd3',
              boxShadow: '0 20px 45px rgba(190, 18, 60, 0.08)',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: '#ffe4e6',
                color: '#be123c',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={28} />
            </div>
            <h2
              className="serif-title"
              style={{ fontSize: '1.5rem', color: '#111827', marginBottom: 8 }}
            >
              Đã xảy ra sự cố hiển thị
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.92rem', marginBottom: 22 }}>
              Rất xin lỗi vì sự bất tiện này. Bạn có thể tải lại trang hoặc quay về trang chủ để tiếp tục mua sắm.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={16} />
                <span>Tải lại trang</span>
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
              >
                <Home size={16} />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
