import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import AddPatientModal from '../admin/AddPatientModal'
import '../Dashboard.css'
import PatientDetail  from './PatientDetail'

const MOCK_PATIENTS = [
  { id: 1, name: 'Eleanor Whitmore', age: 54, condition: 'Hypertension', status: 'stable', lastVisit: '2 days ago', avatar: 'EW' },
  { id: 2, name: 'Marcus Chen', age: 38, condition: 'Type 2 Diabetes', status: 'monitoring', lastVisit: '1 week ago', avatar: 'MC' },
  { id: 3, name: 'Sophia Alvarez', age: 29, condition: 'Asthma', status: 'stable', lastVisit: 'Today', avatar: 'SA' },
  { id: 4, name: 'James Thornton', age: 67, condition: 'Coronary Artery Disease', status: 'critical', lastVisit: 'Yesterday', avatar: 'JT' },
  { id: 5, name: 'Priya Nair', age: 45, condition: 'Hypothyroidism', status: 'stable', lastVisit: '3 days ago', avatar: 'PN' },
  { id: 6, name: 'Robert Fischer', age: 72, condition: 'COPD', status: 'monitoring', lastVisit: '5 days ago', avatar: 'RF' },
]

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',      icon: <GridIcon />,     path: '/doctor/Dashboard' },
  { id: 'patients',     label: 'Patients',        icon: <UsersIcon />,    path: '/doctor/PatientDetail' },
]

const MOCK_APPOINTMENTS = [
  { id: 1, patient: 'Sophia Alvarez', time: '9:00 AM', type: 'Follow-up', duration: '30 min' },
  { id: 2, patient: 'New Patient', time: '10:30 AM', type: 'Initial Consultation', duration: '60 min' },
  { id: 3, patient: 'Marcus Chen', time: '1:00 PM', type: 'Lab Review', duration: '20 min' },
  { id: 4, patient: 'Eleanor Whitmore', time: '3:00 PM', type: 'Check-up', duration: '30 min' },
]

const STATUS_CONFIG = {
  stable:     { color: '#3dffc0', bg: 'rgba(61,255,192,0.1)',  label: 'Stable' },
  monitoring: { color: '#ffb547', bg: 'rgba(255,181,71,0.1)',  label: 'Monitoring' },
  critical:   { color: '#ff5b7f', bg: 'rgba(255,91,127,0.1)', label: 'Critical' },
}

export default function DoctorDashboard() {
  const { doctor, admin, logout } = useAuth()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [activeNav, setActiveNav] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [showAddPatient, setShowAddPatient] = useState(false)

  const displayName = doctor?.name || doctor?.email?.split('@')[0] || admin?.name || admin?.email?.split('@')?.[0] || 'Doctor'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const filteredPatients = (patients || []).filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.medical_history || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.status || '').toLowerCase().includes(search.toLowerCase())
  )

const fetchPatients = async () => {
  setLoadingPatients(true)

  const { data: { user } } = await supabase.auth.getUser()


  const { data: doctorData, error: doctorError } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', user?.id)
    .single()


  if (doctorError || !doctorData) {
    console.log('STOPPING - no doctor record found')
    setLoadingPatients(false)
    return
  }

  const { data, error } = await supabase
    .from('patients')
    .select('id,name,age,gender,phone,email,blood_group,medical_history,doctor_id,status,created_at')
    .eq('doctor_id', doctorData.id)
    .order('created_at', { ascending: false })



  if (!error) setPatients(data || [])
  setLoadingPatients(false)
}
  useEffect(() => {
    fetchPatients()
  }, [])

  const handlePatientCreated = async () => {
    await fetchPatients()
  }


  const handleSignOut = async () => {

    await logout()
    navigate('/login')
  }

  const stats = [
    { label: 'Total Patients', value: '148', delta: '+12 this month', icon: '👥', color: 'var(--primary)' },
    { label: "Today's Appointments", value: '8', delta: '4 completed', icon: '📅', color: 'var(--accent)' },
    { label: 'Critical Cases', value: '3', delta: 'Needs attention', icon: '⚠️', color: 'var(--danger)' },
    { label: 'Lab Results Pending', value: '11', delta: '2 urgent', icon: '🧪', color: 'var(--warning)' },
  ]

 const navItems = [
  { id: 'dashboard',    label: 'Dashboard',      icon: <GridIcon />,     path: '/doctor' },
  { id: 'patients',     label: 'Patients',        icon: <UsersIcon />,    path: '/doctor' }, // ← same as dashboard
  { id: 'appointments', label: 'Appointments',    icon: <CalendarIcon />, path: '/doctor/appointments' },
  { id: 'records',      label: 'Medical Records', icon: <FileIcon />,     path: '/doctor/records' },
  { id: 'lab',          label: 'Lab Results',     icon: <FlaskIcon />,    path: '/doctor/lab' },
  { id: 'messages',     label: 'Messages',        icon: <MessageIcon />,  path: '/doctor/messages', badge: 3 },
]

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span className="brand-name-sm">MediCore</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
     onClick={() => { navigate(item.path); setSidebarOpen(false) }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">{doctor?.specialization || 'Physician'}</span>
            </div>
          </div>
          <button className="signout-btn" onClick={handleSignOut} title="Sign out">
            <SignOutIcon />
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(s => !s)}>
              <MenuIcon />
            </button>
            <div>
              <h2 className="page-title">Good morning, Dr. {displayName.split(' ').slice(-1)[0]}</h2>
              <p className="page-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" title="Notifications">
              <BellIcon />
              <span className="notif-dot" />
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-card anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="stat-body">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-delta">{s.delta}</div>
                </div>
              </div>
            ))}
          </section>

          <div className="content-grid">
            <AddPatientModal
              isOpen={showAddPatient}
              onClose={() => setShowAddPatient(false)}
              onSuccess={handlePatientCreated}
            />
            <section className="panel patients-panel anim-fade-up anim-delay-2">

              <div className="panel-header">
                <h3 className="panel-title">Patients</h3>
                <div className="panel-actions">
                  <div className="search-wrap">
                    <SearchIcon />
                    <input
                      className="search-input"
                      placeholder="Search patients…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <button className="btn-add" onClick={() => setShowAddPatient(true)}>
                    <PlusIcon /> Add Patient
                  </button>
                </div>
              </div>

              <div className="patient-list">
                {loadingPatients ? (
                  <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '24px', fontSize: '0.9rem' }}>Loading…</p>
                ) : filteredPatients.length === 0 ? (
                  <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '24px', fontSize: '0.9rem' }}>
                    No patients match your search.
                  </p>
                ) : (
                  filteredPatients.map(p => {
                    const cfg = STATUS_CONFIG[p.status] || { color: 'var(--primary)', bg: 'rgba(99,102,241,0.1)', label: p.status || 'pending' }
                    return (
            <div
  key={p.id}
  className="patient-row"
  style={{ cursor: 'pointer' }}
  onClick={() => navigate(`/doctor/patients/${p.id}`)}
>
                        <div className="patient-avatar">{(p.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                        <div className="patient-info">
                          <div className="patient-name">{p.name}</div>
                          <div className="patient-meta">{p.age ?? ''} yrs · {p.blood_group ? p.blood_group : (p.medical_history || '').slice(0, 28)}</div>
                        </div>
                        <div className="patient-right">
                          <span className="status-pill" style={{ color: cfg.color, background: cfg.bg }}>
                            <span className="status-dot" style={{ background: cfg.color }} />
                            {cfg.label}
                          </span>
                          <span className="last-visit">{p.doctor_id ? `Doctor #${p.doctor_id}` : 'Unassigned'}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

            </section>

            <div className="side-panels">
              <section className="panel anim-fade-up anim-delay-3">
                <div className="panel-header">
                  <h3 className="panel-title">Today's Schedule</h3>
                  <button className="btn-text">View all</button>
                </div>
                <div className="appointment-list">
                  {MOCK_APPOINTMENTS.map(a => (
                    <div key={a.id} className="appt-row">
                      <div className="appt-time">{a.time}</div>
                      <div className="appt-bar" />
                      <div className="appt-info">
                        <div className="appt-patient">{a.patient}</div>
                        <div className="appt-type">{a.type} · {a.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel anim-fade-up anim-delay-4">
                <h3 className="panel-title" style={{ marginBottom: 14 }}>Quick Actions</h3>
                <div className="quick-actions">
                  {[
                    { label: 'New Patient', icon: '➕' },
                    { label: 'Write Prescription', icon: '📝' },
                    { label: 'Order Lab Test', icon: '🧪' },
                    { label: 'Send Referral', icon: '📤' },
                  ].map(a => (
                    <button key={a.label} className="quick-btn">
                      <span>{a.icon}</span>
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function GridIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
}
function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function CalendarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function FileIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}
function FlaskIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3h6v10l3.18 5.18A2 2 0 0 1 16.46 21H7.54a2 2 0 0 1-1.72-3.01L9 13V3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg>
}
function MessageIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function BellIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
function SignOutIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function MenuIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}