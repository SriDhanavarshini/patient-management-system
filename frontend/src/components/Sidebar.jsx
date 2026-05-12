import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/SidebarPanelLabel.css'


// ── Icons ─────────────────────────────────────────────────────────────────────
function GridIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
}
function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function PatientsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
}
function CalendarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function FileIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}
function SettingsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}
function SignOutIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}

// ── Nav items per role ────────────────────────────────────────────────────────
const ADMIN_NAV = [
  { id: 'doctors',  label: 'Doctors',         icon: <UsersIcon />,    path: '/admin' },
  { id: 'patients', label: 'Patient Management',  icon: <PatientsIcon />, path: '/admin/patients' },
  { id: 'settings', label: 'Settings',         icon: <SettingsIcon />, path: '/admin/settings' },
]

const DOCTOR_NAV = [
  { id: 'dashboard',    label: 'Dashboard',      icon: <GridIcon />,    path: '/doctor/dashboard' },
  { id: 'patients',     label: 'Patients',        icon: <PatientsIcon />,path: '/doctor/patients' },
{ id: 'records', label: 'Medical Records', icon: <FileIcon />, path: '/doctor/records' },
  { id: 'appointments', label: 'Appointments',    icon: <CalendarIcon />,path: '/doctor/appointments' },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ isOpen, onClose }) {
  const getToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) return session.access_token
  const { data } = await supabase.auth.refreshSession()
  return data?.session?.access_token
}
  const { admin, doctor, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isDoctor = !!doctor
  const navItems = isDoctor ? DOCTOR_NAV : ADMIN_NAV
  const panelLabel = isDoctor ? 'Doctor Portal' : 'Admin Portal'

  const displayName = doctor?.name || doctor?.email?.split('@')[0]
    || admin?.name  || admin?.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const roleLabel = isDoctor ? (doctor?.specialization || 'Physician') : (admin?.role || 'Administrator')

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
  }

  const handleNav = (path) => {
    navigate(path)
    onClose?.()
  }

  const activeId = navItems.slice().reverse().find(item => location.pathname.startsWith(item.path))?.id

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span className="brand-name-sm">MediCore</span>
        </div>

        <div className="sidebar-panel-label">
          {panelLabel}
        </div>


        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeId === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar" style={{ background: isDoctor ? undefined : 'var(--primary)' }}>
              {initials}
            </div>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">{roleLabel}</span>
            </div>
          </div>
          <button className="signout-btn" onClick={handleSignOut} title="Sign out">
            <SignOutIcon />
          </button>
        </div>
      </aside>

      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  )
}
