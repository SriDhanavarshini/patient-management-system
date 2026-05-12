import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminRegister from './pages/admin/AdminRegister'
import AdminDashboard from './pages/admin/AdminDashboard'
import DoctorDashboard from './pages/doctor/Dashboard'
import PatientPortal from './pages/admin/PatientPortal'
import AdminPatientDetailPage from './pages/admin/AdminPatientDetailPage'
import DoctorPatientRecords from './pages/doctor/DoctorPatientDetails'
import MedicalRecords from './pages/doctor/MedicalRecords'
import PatientDetail from './pages/doctor/PatientDetail'
import './styles/global.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<AdminRegister />} />

          {/* ── Admin ── */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute requiredRole="admin"><PatientPortal /></ProtectedRoute>} />
          <Route path="/admin/patient/:id" element={<ProtectedRoute requiredRole="admin"><AdminPatientDetailPage /></ProtectedRoute>} />

          {/* ── Doctor ── */}
          <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/patients" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/patients/:id" element={<ProtectedRoute requiredRole="doctor"><DoctorPatientRecords /></ProtectedRoute>} />
          <Route path="/doctor/records" element={<ProtectedRoute requiredRole="doctor"><MedicalRecords /></ProtectedRoute>} />
          <Route path="/doctor/records/:id" element={<ProtectedRoute requiredRole="doctor"><DoctorPatientRecords /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
