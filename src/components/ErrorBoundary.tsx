import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md text-center space-y-4">
            <h1 className="text-white text-xl font-bold">エラーが発生しました</h1>
            <p className="text-gray-400 text-sm">
              {this.state.error?.message || '不明なエラー'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded text-sm font-bold"
              >
                再試行
              </button>
              <button
                onClick={this.handleReload}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold"
              >
                リロード
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
