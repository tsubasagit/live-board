import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import ControlPage from './pages/ControlPage'
import DisplayPage from './pages/DisplayPage'

export default function App() {
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
