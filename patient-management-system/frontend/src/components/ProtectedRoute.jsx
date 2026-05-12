import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, admin, doctor } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader" />
          <p style={{ color: 'var(--text-3)', marginTop: 16, fontSize: '0.85rem' }}>
            Checking credentials…
          </p>
        </div>
      </div>
    )
  }

  // Not logged in at all
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Logged in but wrong role — redirect to their correct dashboard
  if (requiredRole === 'admin' && !admin) {
    return <Navigate to="/doctor/dashboard" replace />
  }
  if (requiredRole === 'doctor' && !doctor) {
    return <Navigate to="/admin" replace />
  }

  return children
}