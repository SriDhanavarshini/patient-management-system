import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'
import '../Dashboard.css'

const API = 'http://localhost:8000'

const STATUS_CONFIG = {
  stable: {
    color: '#3dffc0',
    bg: 'rgba(61,255,192,0.1)',
    label: 'Stable'
  },

  monitoring: {
    color: '#ffb547',
    bg: 'rgba(255,181,71,0.1)',
    label: 'Monitoring'
  },

  critical: {
    color: '#ff5b7f',
    bg: 'rgba(255,91,127,0.1)',
    label: 'Critical'
  },
}

const MOCK_APPOINTMENTS = [
  {
    id: 1,
    patient: 'Sophia Alvarez',
    time: '9:00 AM',
    type: 'Follow-up',
    duration: '30 min'
  },

  {
    id: 2,
    patient: 'New Patient',
    time: '10:30 AM',
    type: 'Initial Consultation',
    duration: '60 min'
  },

  {
    id: 3,
    patient: 'Marcus Chen',
    time: '1:00 PM',
    type: 'Lab Review',
    duration: '20 min'
  },

  {
    id: 4,
    patient: 'Eleanor Whitmore',
    time: '3:00 PM',
    type: 'Check-up',
    duration: '30 min'
  },
]

export default function DoctorDashboard() {

  const { doctor, admin } = useAuth()

  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)

  const displayName =
    doctor?.name ||
    doctor?.email?.split('@')[0] ||
    admin?.name ||
    admin?.email?.split('@')?.[0] ||
    'Doctor'

  // Only search by patient name
  const filteredPatients = patients.filter(p =>
    (p.name || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const fetchPatients = async () => {

    setLoadingPatients(true)

    try {

      const {
        data: { session }
      } = await supabase.auth.getSession()

      const token = session?.access_token

      if (!token) return

      const res = await fetch(
        `${API}/doctor/me/patients/no-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const json = await res.json()

    

      setPatients(json.patients || [])

    } catch (e) {

      console.error('Failed to fetch patients', e)

    } finally {

      setLoadingPatients(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const stats = [
    {
      label: 'Total Patients',
      value: patients.length,
      delta: 'Your patients',
      icon: '👥',
      color: 'var(--primary)'
    },

    {
      label: "Today's Appointments",
      value: '8',
      delta: '4 completed',
      icon: '📅',
      color: 'var(--accent)'
    },

    {
      label: 'Critical Cases',
      value: patients.filter(
        p => p.status === 'critical'
      ).length,
      delta: 'Needs attention',
      icon: '⚠️',
      color: 'var(--danger)'
    },

    {
      label: 'Lab Results Pending',
      value: '11',
      delta: '2 urgent',
      icon: '🧪',
      color: 'var(--warning)'
    },
  ]

  return (
    <div className="dashboard-layout">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="dashboard-main">

        {/* Topbar */}
        <header className="topbar">

          <div className="topbar-left">

            <button
              className="menu-btn"
              onClick={() =>
                setSidebarOpen(s => !s)
              }
            >
              <MenuIcon />
            </button>

            <div>

              <h2 className="page-title">
                Good morning, Dr. {
                  displayName
                    .split(' ')
                    .slice(-1)[0]
                }
              </h2>

              <p className="page-date">
                {
                  new Date().toLocaleDateString(
                    'en-US',
                    {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    }
                  )
                }
              </p>

            </div>

          </div>

          <div className="topbar-right">

            <button
              className="icon-btn"
              title="Notifications"
            >
              <BellIcon />
              <span className="notif-dot" />
            </button>

          </div>

        </header>

        {/* Content */}
        <div className="dashboard-content">

          {/* Stats */}
          <section className="stats-grid">

            {stats.map((s, i) => (

              <div
                key={i}
                className="stat-card anim-fade-up"
                style={{
                  animationDelay: `${i * 0.07}s`
                }}
              >

                <div
                  className="stat-icon"
                  style={{
                    background: `${s.color}18`,
                    color: s.color
                  }}
                >
                  {s.icon}
                </div>

                <div className="stat-body">

                  <div className="stat-value">
                    {s.value}
                  </div>

                  <div className="stat-label">
                    {s.label}
                  </div>

                  <div className="stat-delta">
                    {s.delta}
                  </div>

                </div>

              </div>

            ))}

          </section>

          <div className="content-grid">

            {/* Patients Panel */}
            <section className="panel patients-panel anim-fade-up anim-delay-2">

              <div className="panel-header">

                <h3 className="panel-title">
                  Patients
                </h3>

                <div className="panel-actions">

                  <div className="search-wrap">

                    <SearchIcon />

                    <input
                      className="search-input"
                      placeholder="Search patients…"
                      value={search}
                      onChange={e =>
                        setSearch(e.target.value)
                      }
                    />

                  </div>

                </div>

              </div>

              {/* Patient List */}
              <div className="patient-list">

                {loadingPatients ? (

                  <p
                    style={{
                      color: 'var(--text-3)',
                      textAlign: 'center',
                      padding: '24px',
                      fontSize: '0.9rem'
                    }}
                  >
                    Loading...
                  </p>

                ) : filteredPatients.length === 0 ? (

                  <p
                    style={{
                      color: 'var(--text-3)',
                      textAlign: 'center',
                      padding: '24px',
                      fontSize: '0.9rem'
                    }}
                  >
                    No patients found.
                  </p>

                ) : (

                  filteredPatients.map(p => {

                    const cfg =
                      STATUS_CONFIG[p.status] || {
                        color: '#6366f1',
                        bg: 'rgba(99,102,241,0.1)',
                        label: 'Patient'
                      }

                    return (

                      <div
                        key={p.id}
                        className="patient-row"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          navigate(
                            `/doctor/patients/${p.id}`
                          )
                        }
                      >

                        <div className="patient-avatar">

                          {
                            (p.name || '')
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          }

                        </div>

                        <div className="patient-info">

                          <div className="patient-name">
                            {p.name}
                          </div>

                          <div className="patient-meta">
                            {p.age || 'N/A'} yrs
                            {' · '}
                            {p.blood_group || 'N/A'}
                          </div>

                        </div>

                        <div className="patient-right">

                          <span
                            className="status-pill"
                            style={{
                              color: cfg.color,
                              background: cfg.bg
                            }}
                          >

                            <span
                              className="status-dot"
                              style={{
                                background: cfg.color
                              }}
                            />

                            {cfg.label}

                          </span>

                        </div>

                      </div>
                    )
                  })
                )}
              </div>
            </section>

            {/* Side Panels */}
            <div className="side-panels">

              {/* Schedule */}
              <section className="panel anim-fade-up anim-delay-3">

                <div className="panel-header">

                  <h3 className="panel-title">
                    Today's Schedule
                  </h3>

                  <button className="btn-text">
                    View all
                  </button>

                </div>

                <div className="appointment-list">

                  {MOCK_APPOINTMENTS.map(a => (

                    <div
                      key={a.id}
                      className="appt-row"
                    >

                      <div className="appt-time">
                        {a.time}
                      </div>

                      <div className="appt-bar" />

                      <div className="appt-info">

                        <div className="appt-patient">
                          {a.patient}
                        </div>

                        <div className="appt-type">
                          {a.type} · {a.duration}
                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              </section>

              {/* Quick Actions */}
              <section className="panel anim-fade-up anim-delay-4">

                <h3
                  className="panel-title"
                  style={{ marginBottom: 14 }}
                >
                  Quick Actions
                </h3>

                <div className="quick-actions">

                  {[
                    {
                      label: 'Write Prescription',
                      icon: '📝'
                    },

                    {
                      label: 'Order Lab Test',
                      icon: '🧪'
                    },

                    {
                      label: 'Send Referral',
                      icon: '📤'
                    },
                  ].map(a => (

                    <button
                      key={a.label}
                      className="quick-btn"
                    >

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

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}
