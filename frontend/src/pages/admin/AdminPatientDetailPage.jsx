import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'
import '../Dashboard.css'

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '3px solid rgba(99,140,255,0.25)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function AdminPatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPatient = async () => {
    const { data: p, error: pe } = await supabase
      .from('patients')
      .select(
        'id,name,age,gender,blood_group,address,phone,disease,department,doctor_id,status,visit_date,created_at,doctors!doctor_id (id,name,specialization)'
      )
      .eq('id', id)
      .maybeSingle()

    if (pe) throw pe
    setPatient(p)
  }

  const fetchHistory = async () => {
    const { data: h, error: he } = await supabase
      .from('patient_history')
      .select(
        'id,patient_id,doctor_id,diagnosis,prescription,notes,created_at,doctors!fk_history_doctor (name,specialization)'
      )
      .eq('patient_id', id)
      .order('created_at', { ascending: false })

    if (he) throw he
    setHistory(h || [])
  }

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        setPatient(null)
        setHistory([])
        await fetchPatient()
        await fetchHistory()
        if (!alive) return
      } catch (e) {
        if (!alive) return
        setError(e?.message || 'Failed to load patient details')
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [id])

  const computed = useMemo(() => {
    const hasAnyHistory = (history?.length || 0) > 0
    const visitStatus = hasAnyHistory ? 'Attended' : 'Waiting'

    const assignedDoctorName =
      patient?.doctors?.name
        ? `Dr. ${patient.doctors.name}`
        : patient?.doctor_id
          ? `Doctor #${patient.doctor_id}`
          : '—'

    const department = patient?.department || patient?.doctors?.specialization || '—'

    const queueStatus = visitStatus === 'Waiting' ? 'Waiting for Doctor' : 'In Consultation'

    const visitDateTime = patient?.visit_date
      ? formatDateTime(patient.visit_date)
      : patient?.created_at
        ? formatDateTime(patient.created_at)
        : '—'

    return { visitStatus, assignedDoctorName, department, queueStatus, visitDateTime }
  }, [history, patient])

  const statusPill = (
    <span
      className="status-pill"
      style={{
        color: computed.visitStatus === 'Waiting' ? '#f5a623' : '#3dffc0',
        background: computed.visitStatus === 'Waiting' ? 'rgba(245,166,35,0.1)' : 'rgba(61,255,192,0.1)',
      }}
    >
      <span
        className="status-dot"
        style={{ background: computed.visitStatus === 'Waiting' ? '#f5a623' : '#3dffc0' }}
      />
      {computed.visitStatus}
    </span>
  )

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(s => !s)}>
              <MenuIcon />
            </button>
            <div>
              <h2 className="page-title">Patient Details</h2>
              <p className="page-date">OP Patient Sheet</p>
            </div>
          </div>

          <div className="topbar-right">
            <button className="btn-ghost" onClick={() => navigate(-1)} style={{ padding: '10px 18px' }}>
              ← Back
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {loading ? (
            <div style={{ minHeight: 420 }}>
              <Spinner />
            </div>
          ) : error ? (
            <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>
          ) : !patient ? (
            <div style={{ color: '#ff5b7f' }}>Patient not found.</div>
          ) : (
            <div className="patient-sheet-page">
              <div className="patient-sheet-grid">
                <div className="patient-sheet-left">
                  <div className="sheet-card">
                    <div className="sheet-row">
                      <span className="sheet-label">Name</span>
                      <span className="sheet-value">{patient?.name || '—'}</span>
                    </div>
                    <div className="sheet-row">
                      <span className="sheet-label">Age / Gender</span>
                      <span className="sheet-value">{patient?.age ? `${patient.age} yrs` : '—'} · {patient?.gender || '—'}</span>
                    </div>
                    <div className="sheet-row">
                      <span className="sheet-label">Blood Group</span>
                      <span className="sheet-value">{patient?.blood_group || '—'}</span>
                    </div>
                    <div className="sheet-row">
                      <span className="sheet-label">Address</span>
                      <span className="sheet-value">{patient?.address || '—'}</span>
                    </div>
                    <div className="sheet-row">
                      <span className="sheet-label">Phone</span>
                      <span className="sheet-value">{patient?.phone || '—'}</span>
                    </div>
                    <div className="sheet-row">
                      <span className="sheet-label">Disease</span>
                      <span className="sheet-value">{patient?.disease || '—'}</span>
                    </div>
                    <div className="sheet-row">
                      <span className="sheet-label">Status</span>
                      <span className="sheet-value">{patient?.status || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="patient-sheet-right">
                  <div className="sheet-card">
                    <div className="sheet-row">
                      <span className="sheet-label">Department</span>
                      <span className="sheet-value">{computed.department}</span>
                    </div>
                    <div className="sheet-row">
                      <span className="sheet-label">Assigned Doctor</span>
                      <span className="sheet-value">{computed.assignedDoctorName}</span>
                    </div>
                    <div className="sheet-row">
                      <span className="sheet-label">Visit Date & Time</span>
                      <span className="sheet-value">{computed.visitDateTime}</span>
                    </div>
                    <div className="sheet-row">
                      <span className="sheet-label">Current Status</span>
                      <span className="sheet-value">{statusPill}</span>
                    </div>
                    <div className="sheet-row">
                      <span className="sheet-label">Queue Status</span>
                      <span className="sheet-value">{computed.queueStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sheet-divider" />

              <div className="sheet-bottom">
                <div className="sheet-bottom-actions">
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      const el = document.getElementById('patient-history-list')
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  >
                    History
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => navigate(-1)}
                    style={{ width: 'auto', padding: '10px 18px' }}
                  >
                    ← Back
                  </button>
                </div>
              </div>

              <div id="patient-history-list" className="history-timeline">
                {(history || []).length === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: 32 }}>🩺</div>
                    <div style={{ fontWeight: 700, marginTop: 6 }}>No consultation history yet</div>
                    <div style={{ color: 'var(--text-2)', marginTop: 4, fontSize: '0.9rem' }}>Patient is currently waiting.</div>
                  </div>
                ) : (
                  (history || []).map(h => (
                    <div key={h.id} className="history-card">
                      <div className="history-card-top">
                        <div className="history-date">{formatDateTime(h.created_at)}</div>
                        <div className="history-doctor">
                          {h?.doctors?.name ? `Dr. ${h.doctors.name}` : h?.doctor_id ? `Doctor #${h.doctor_id}` : '—'}
                        </div>
                      </div>
                      <div className="history-grid">
                        <div>
                          <div className="history-label">Diagnosis</div>
                          <div className="history-value">{h?.diagnosis || '—'}</div>
                        </div>
                        <div>
                          <div className="history-label">Prescription</div>
                          <div className="history-value">{h?.prescription || '—'}</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div className="history-label">Notes</div>
                          <div className="history-value">{h?.notes || '—'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .patient-sheet-page { animation: fadeUp 0.35s ease both; }
        .patient-sheet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .patient-sheet-left, .patient-sheet-right { min-width: 0; }
        .sheet-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 18px; }
        .sheet-row { display: flex; flex-direction: column; gap: 6px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sheet-row:last-child { border-bottom: none; }
        .sheet-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--primary); }
        .sheet-value { font-size: 0.95rem; color: var(--text-1); }
        .sheet-divider { height: 1px; background: var(--border); margin: 18px 0; }
        .sheet-bottom { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .sheet-bottom-actions { display: flex; gap: 10px; align-items: center; }
        .section-title-sm { font-weight: 800; color: var(--text-2); font-size: 0.9rem; }
        .history-timeline { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
        .history-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; overflow: hidden; }
        .history-card-top { display: flex; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .history-date { font-size: 0.82rem; color: var(--text-3); font-weight: 700; }
        .history-doctor { font-size: 0.82rem; color: var(--text-2); font-weight: 700; }
        .history-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 14px 16px; }
        .history-label { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--primary); margin-bottom: 4px; }
        .history-value { font-size: 0.92rem; color: var(--text-1); }
        .empty-state { text-align: center; padding: 40px 24px; color: var(--text-3); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) { .patient-sheet-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}

function MenuIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
}