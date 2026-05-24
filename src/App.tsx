import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import ControlPage from './pages/ControlPage'
import DisplayPage from './pages/DisplayPage'
import { useAuthStore } from './store/useAuthStore'
import { initAnalytics, trackPageView } from './lib/analytics'

export default function App() {
  const init = useAuthStore((s) => s.init)
  const location = useLocation()

  useEffect(() => {
    init()
    initAnalytics()
  }, [init])

  // SPAルート変更ごとに page_view を送信（HashRouter 対応）
  useEffect(() => {
    trackPageView(location.pathname, document.title)
  }, [location.pathname])

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/control" element={<ControlPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
