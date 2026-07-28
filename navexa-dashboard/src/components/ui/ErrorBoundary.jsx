import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Application-level Error Boundary
 * Catches React render failures and displays a friendly recovery UI
 * instead of a blank white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[Navexa ErrorBoundary] Caught render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-bg text-ink p-6">
          <div className="max-w-md w-full text-center space-y-5">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-bg">
                <AlertTriangle size={32} className="text-danger" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink mb-1">Something went wrong</h1>
              <p className="text-sm text-ink-soft">
                Navexa encountered an unexpected error. Please refresh the page to continue.
              </p>
              {this.state.error && (
                <p className="mt-2 text-[11px] font-mono text-ink-soft bg-slate-100 rounded-lg px-3 py-2 text-left overflow-auto max-h-24">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-colors cursor-pointer"
            >
              <RefreshCw size={15} />
              Reload Navexa
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
