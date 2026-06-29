import React from "react";
import { Link } from "react-router-dom";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">

          {/* Background */}
          <div className="absolute inset-0 bg-page"></div>

          {/* Glow */}
          <div className="absolute w-96 h-96 bg-red-500/10 blur-3xl rounded-full"></div>

          {/* Card */}
          <div className="relative glass-card max-w-lg w-full p-10 rounded-[32px] text-center">

            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/10 flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation text-red-500 text-4xl"></i>
            </div>

            <h1 className="text-3xl font-black mb-3">
              Something went wrong
            </h1>

            <p className="text-muted-custom mb-8">
              An unexpected error occurred.
              Our AI engineers have definitely been notified*
            </p>

            <div className="flex flex-col sm:flex-row gap-4">

              <button
                onClick={this.handleRefresh}
                className="btn-primary"
              >
                <i className="fa-solid fa-rotate-right"></i>
                Refresh Page
              </button>

              <Link
                to="/"
                className="btn-secondary"
              >
                <i className="fa-solid fa-house"></i>
                Home
              </Link>

            </div>

            {process.env.NODE_ENV === "development" && (
              <pre className="mt-8 text-left text-xs overflow-auto p-4 rounded-xl bg-black/5 dark:bg-white/5">
                {this.state.error?.toString()}
              </pre>
            )}

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;