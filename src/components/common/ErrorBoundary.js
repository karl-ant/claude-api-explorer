import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return html`
        <div class="p-6 bg-red-900/20 border border-red-700/50 rounded-lg">
          <h3 class="text-red-400 font-mono font-medium">Something went wrong</h3>
          <p class="text-red-300 text-sm font-mono mt-2">${this.state.error?.message}</p>
          <button
            onClick=${() => this.setState({ hasError: false, error: null })}
            class="mt-3 px-4 py-2 bg-slate-800 text-slate-100 text-sm font-mono rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
          >
            Retry
          </button>
        </div>
      `;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
