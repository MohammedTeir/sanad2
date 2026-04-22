import React, { Component, ErrorInfo, ReactNode, FC } from 'react';

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  fallback?: FC<{ error?: Error, resetError?: () => void }>;
}

class NetworkErrorBoundary extends Component<NetworkErrorBoundaryProps, NetworkErrorBoundaryState> {
  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): NetworkErrorBoundaryState {
    if (error.message.includes('Unable to connect to the backend server') ||
        error.message.includes('Could not connect to backend')) {
      return { hasError: true, error };
    }
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Network error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || NetworkFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const NetworkFallback: FC<{ error?: Error, resetError?: () => void }> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-yellow-200">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">مشكلة في الاتصال</h3>
          <p className="mt-2 text-sm text-gray-500">
            {error?.message || 'لا يمكن الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت وتشغيل الخادم.'}
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              إعادة تحميل الصفحة
            </button>
            <p className="text-xs text-gray-400 mt-3">
              تأكد من أن الخادم يعمل على المنفذ 3001 وأنك تستخدم عنوان IP الصحيح
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkErrorBoundary;