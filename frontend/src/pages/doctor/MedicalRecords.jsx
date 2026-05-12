import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'
import '../Dashboard.css'

const API = 'http://localhost:8000'

const STATUS_CONFIG = {
  stable: { color: '#3dffc0', bg: 'rgba(61,255,192,0.1)', label: 'Stable' },
  monitoring: { color: '#ffb547', bg: 'rgba(255,181,71,0.1)', label: 'Monitoring' },
  critical: { color: '#ff5b7f', bg: 'rgba(255,91,127,0.1)', label: 'Critical' },
  active: { color: '#3dffc0', bg: 'rgba(61,255,192,0.1)', label: 'Active' },
  pending: { color: '#ffb547', bg: 'rgba(255,181,71,0.1)', label: 'Pending' },
}

function getInitials(name = '') {
  const parts = String(name).trim().split(' ').filter(Boolean)
  const initials = parts.map((p) => p[0]).join('')
  return (initials || 'U').slice(0, 2).toUpperCase()
}

export default function MedicalRecords() {
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return records
    return (records || []).filter((r) => {
      const name = String(r.patientName || '').toLowerCase()
      const dx = String(r.diagnosis || '').toLowerCase()
      return name.includes(q) || dx.includes(q)
    })
  }, [records, search])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(`${API}/doctor/me/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.detail || 'Failed to load medical history')

      const list = (json.records || []).map((r) => ({
        ...r,
        patientInitials: getInitials(r.patientName || ''),
      }))

      setRecords(list)
    } catch (e) {
      setRecords([])
      setError(e?.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen((s) => !s)} title="Menu">
              <MenuIcon />
            </button>
            <div>
              <h2 className="page-title">Medical History</h2>
              <p className="page-date">Shows entries from patient history.</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-wrap" style={{ width: 340, maxWidth: '60vw' }}>
              <SearchIcon />
              <input
                className="search-input"
                placeholder="Search patient or diagnosis…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="panel anim-fade-up">
            <div className="panel-header">
              <h3 className="panel-title">Timeline</h3>
              <button className="btn-text" onClick={fetchRecords} disabled={loading}>
                Refresh
              </button>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '24px', fontSize: '0.9rem' }}>
                Loading…
              </p>
            ) : error ? (
              <p style={{ color: 'var(--danger)', textAlign: 'center', padding: '24px', fontSize: '0.9rem' }}>
                {error}
              </p>
            ) : filteredRecords.length === 0 ? (
              <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '24px', fontSize: '0.9rem' }}>
                No medical history found.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredRecords.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
                  const dateLabel = r.created_at
                    ? new Date(r.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'

                  return (
                    <div
                      key={r.id}
                      className="patient-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/doctor/records/${r.patientId}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') navigate(`/doctor/records/${r.patientId}`)
                      }}
                    >
                      <div className="patient-avatar">{r.patientInitials}</div>

                      <div className="patient-info">
                        <div className="patient-name">{r.patientName || 'Patient'}</div>
                        <div className="patient-meta">
                          {dateLabel}
                          {' · '}
                          {r.diagnosis || '—'}
                        </div>
                      </div>

                      <div className="patient-right">
                        <span className="status-pill" style={{ color: cfg.color, background: cfg.bg }}>
                          <span className="status-dot" style={{ background: cfg.color }} />
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

