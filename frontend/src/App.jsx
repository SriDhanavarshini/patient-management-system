import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminRegister from './pages/admin/AdminRegister'
import AdminDashboard from './pages/admin/AdminDashboard'
import DoctorDashboard from './pages/doctor/Dashboard'
import PatientPortal from './pages/admin/PatientPortal'   // ← fixed name
import './styles/global.css'
import PatientDetail from './pages/doctor/PatientDetail'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<AdminRegister />} />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute requiredRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
{<Route
  path="/doctor/patients/:id"
  element={
    <ProtectedRoute requiredRole="doctor">
      <PatientDetail />
    </ProtectedRoute>
  }
/>}
          {/* ── Patients Portal ── */}
          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute requiredRole="admin">
                <PatientPortal />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}