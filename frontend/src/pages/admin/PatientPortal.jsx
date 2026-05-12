import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'
import '../Dashboard.css'
import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', phone: '', email: '', gender: '', age: '',
  blood_group: '', medical_history: '', doctor_id: '', status: 'pending',
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim())
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    active:     { color: '#3dffc0', bg: 'rgba(61,255,192,0.1)' },
    pending:    { color: '#f5a623', bg: 'rgba(245,166,35,0.1)'  },
    discharged: { color: '#8899aa', bg: 'rgba(136,153,170,0.1)' },
  }
  const s = map[status] ?? map.pending
  return (
    <span className="status-pill" style={{ color: s.color, background: s.bg }}>
      <span className="status-dot" style={{ background: s.color }} />
      {status ?? 'pending'}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD PATIENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AddPatientModal({ isOpen, onClose, onSuccess }) {
  const { admin } = useAuth()
  const [form, setForm]             = useState(EMPTY_FORM)
  const [touched, setTouched]       = useState({})
  const [formError, setFormError]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [doctors, setDoctors]       = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setForm(EMPTY_FORM); setTouched({}); setFormError(''); setSuccess(false)
    let alive = true
    ;(async () => {
      setLoadingDocs(true)
      const { data, error } = await supabase.from('doctors').select('id,name,specialization').order('name')
      if (alive && !error) setDoctors(data || [])
      if (alive) setLoadingDocs(false)
    })()
    return () => { alive = false }
  }, [isOpen])

  const errors = useMemo(() => {
    const e = {}
    if (!form.name.trim())        e.name        = 'Required'
    if (!form.phone.trim())       e.phone       = 'Required'
    if (!form.email.trim())       e.email       = 'Required'
    else if (!isValidEmail(form.email)) e.email = 'Invalid email'
    if (!form.gender)             e.gender      = 'Required'
    const a = Number(form.age)
    if (form.age === '')          e.age         = 'Required'
    else if (!Number.isFinite(a) || a <= 0) e.age = 'Must be positive'
    if (!form.blood_group)        e.blood_group = 'Required'
    if (!form.doctor_id)          e.doctor_id   = 'Required'
    return e
  }, [form])

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const blur = (k)    => setTouched(t => ({ ...t, [k]: true }))

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched(Object.fromEntries(Object.keys(EMPTY_FORM).map(k => [k, true])))
    if (Object.keys(errors).length) return
    setSubmitting(true); setFormError('')
    try {
      if (!admin?.id) {
        setFormError('Session not found. Please log in again.')
        return
      }
      const { error } = await supabase.from('patients').insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        gender: form.gender,
        age: Number(form.age),
        blood_group: form.blood_group,
        medical_history: form.medical_history?.trim() || null,
        doctor_id: form.doctor_id,
        status: form.status,
        created_by: admin.id,
        created_at: new Date().toISOString(),
      })
      if (error) { setFormError(error.message || 'Failed to add patient.'); return }
      setSuccess(true)
      onSuccess?.()
      setTimeout(() => { onClose?.(); setSuccess(false) }, 1600)
    } catch (err) {
      setFormError(err?.message || 'Unexpected error.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: '16px', overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) { onClose?.(); setFormError('') } }}
    >
      <div className="auth-card" style={{ width: '100%', maxWidth: 580, margin: '24px auto', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
        {success ? (
          <div className="success-state">
            <div className="success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: 8 }}>Patient added!</h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Record saved successfully.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: 0 }}>Add New Patient</h2>
              <button onClick={() => { onClose?.(); setFormError('') }}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>
                ×
              </button>
            </div>

            {formError && (
              <div className="error-msg" style={{ marginBottom: 16 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Basic Info</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Full Name *</label>
                  <input name="name" type="text" className="input-field" placeholder="John Doe"
                    value={form.name} onChange={e => set('name', e.target.value)} onBlur={() => blur('name')} />
                  {touched.name && errors.name && <span style={{ color: 'var(--danger, #ff5c7c)', fontSize: '0.72rem' }}>{errors.name}</span>}
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Phone *</label>
                  <input name="phone" type="text" className="input-field" placeholder="+91 99999 00000"
                    value={form.phone} onChange={e => set('phone', e.target.value)} onBlur={() => blur('phone')} />
                  {touched.phone && errors.phone && <span style={{ color: 'var(--danger, #ff5c7c)', fontSize: '0.72rem' }}>{errors.phone}</span>}
                </div>
                <div className="input-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label>Email *</label>
                  <input name="email" type="email" className="input-field" placeholder="john@example.com"
                    value={form.email} onChange={e => set('email', e.target.value)} onBlur={() => blur('email')} />
                  {touched.email && errors.email && <span style={{ color: 'var(--danger, #ff5c7c)', fontSize: '0.72rem' }}>{errors.email}</span>}
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Gender *</label>
                  <select name="gender" className="input-field" style={{ appearance: 'none' }}
                    value={form.gender} onChange={e => set('gender', e.target.value)} onBlur={() => blur('gender')}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                  {touched.gender && errors.gender && <span style={{ color: 'var(--danger, #ff5c7c)', fontSize: '0.72rem' }}>{errors.gender}</span>}
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Age *</label>
                  <input name="age" type="number" min="1" className="input-field" placeholder="35"
                    value={form.age} onChange={e => set('age', e.target.value)} onBlur={() => blur('age')} />
                  {touched.age && errors.age && <span style={{ color: 'var(--danger, #ff5c7c)', fontSize: '0.72rem' }}>{errors.age}</span>}
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Blood Group *</label>
                  <select name="blood_group" className="input-field" style={{ appearance: 'none' }}
                    value={form.blood_group} onChange={e => set('blood_group', e.target.value)} onBlur={() => blur('blood_group')}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                  </select>
                  {touched.blood_group && errors.blood_group && <span style={{ color: 'var(--danger, #ff5c7c)', fontSize: '0.72rem' }}>{errors.blood_group}</span>}
                </div>
              </div>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 8px' }}>Assignment</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Assigned Doctor *</label>
                  <select name="doctor_id" className="input-field" style={{ appearance: 'none' }}
                    value={form.doctor_id} onChange={e => set('doctor_id', e.target.value)}
                    onBlur={() => blur('doctor_id')} disabled={loadingDocs}>
                    <option value="">{loadingDocs ? 'Loading…' : 'Select doctor'}</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.specialization || 'General'}</option>
                    ))}
                  </select>
                  {touched.doctor_id && errors.doctor_id && <span style={{ color: 'var(--danger, #ff5c7c)', fontSize: '0.72rem' }}>{errors.doctor_id}</span>}
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Status</label>
                  <select name="status" className="input-field" style={{ appearance: 'none' }}
                    value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="discharged">Discharged</option>
                  </select>
                </div>
              </div>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 8px' }}>Medical History</p>
              <div className="input-group">
                <label>Notes <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                <textarea name="medical_history" className="input-field" rows={3}
                  placeholder="Chronic conditions, allergies, surgeries, medications…"
                  value={form.medical_history} onChange={e => set('medical_history', e.target.value)}
                  style={{ resize: 'vertical', minHeight: 80 }} />
              </div>

              <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 8 }}>
                {submitting
                  ? <><span className="spin-ring" />Adding Patient…</>
                  : <><PlusIcon /> Add Patient</>
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function PatientPortal() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [patients, setPatients]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [fetchError, setFetchError]     = useState('')
  const [modalOpen, setModalOpen]       = useState(false)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [attendFilter, setAttendFilter] = useState('all') // 'all' | 'attended' | 'yet_to_attend'
  const [toast, setToast]               = useState(null)

  // ── fetch — includes patient_history for attended/yet-to-attend KPI ────────
  const fetchPatients = useCallback(async () => {
    setLoading(true); setFetchError('')
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id,name,phone,email,gender,age,blood_group,status,created_at,doctors(name,specialization),patient_history(id)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setPatients(data || [])
    } catch (err) {
      setFetchError(err?.message || 'Failed to load patients.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  // ── toast auto-dismiss ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // ── filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => patients.filter(p => {
    // status filter (active / pending / discharged)
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    // attend filter (attended / yet_to_attend)
    if (attendFilter === 'attended'     && (p.patient_history?.length || 0) === 0) return false
    if (attendFilter === 'yet_to_attend' && (p.patient_history?.length || 0) >  0) return false
    // search
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.doctors?.name?.toLowerCase().includes(q)
    )
  }), [patients, statusFilter, attendFilter, search])

  // ── stats / KPI cards ─────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Patients', value: patients.length,                                                      icon: '🧑‍⚕️', color: 'var(--primary)', filter: 'all',           isAttendFilter: false },
    { label: 'Active',         value: patients.filter(p => p.status === 'active').length,                   icon: '✅',   color: '#3dffc0',        filter: 'active',        isAttendFilter: false },
    { label: 'Pending',        value: patients.filter(p => p.status === 'pending').length,                  icon: '⏳',   color: '#f5a623',        filter: 'pending',       isAttendFilter: false },
    { label: 'Discharged',     value: patients.filter(p => p.status === 'discharged').length,               icon: '🏠',   color: '#8899aa',        filter: 'discharged',    isAttendFilter: false },
    { label: 'Attended',       value: patients.filter(p => (p.patient_history?.length || 0) > 0).length,   icon: '✔️',   color: '#3dffc0',        filter: 'attended',      isAttendFilter: true  },
    { label: 'Yet to Attend',  value: patients.filter(p => (p.patient_history?.length || 0) === 0).length, icon: '🕐',   color: '#ff5c7c',        filter: 'yet_to_attend', isAttendFilter: true  },
  ]

  const activeFilter = (s) => {
    if (s.isAttendFilter) return attendFilter === s.filter
    return statusFilter === s.filter
  }

  const handleStatClick = (s) => {
    if (s.isAttendFilter) {
      setAttendFilter(prev => prev === s.filter ? 'all' : s.filter)
      setStatusFilter('all') // reset status filter when attend filter clicked
    } else {
      setStatusFilter(prev => prev === s.filter ? 'all' : s.filter)
      setAttendFilter('all') // reset attend filter when status filter clicked
    }
  }

  return (
    <div className="dashboard-layout patient-portal">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(s => !s)}><MenuIcon /></button>
            <div>
                 <h2 className="page-title">Admin Portal</h2>
              <h2 className="page-title">Patient Management</h2>
              <p className="page-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn-add" onClick={() => setModalOpen(true)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <PlusIcon /> Add Patient
            </button>
          </div>
        </header>

        <div className="dashboard-content">

          {/* ── Stats / KPI ── */}
          <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {stats.map((s, i) => (
              <div
                key={i}
                className="stat-card anim-fade-up"
                style={{
                  animationDelay: `${i * 0.07}s`,
                  cursor: 'pointer',
                  outline: activeFilter(s) ? `2px solid ${s.color}` : 'none',
                  transition: 'outline 0.15s',
                }}
                onClick={() => handleStatClick(s)}
              >
                <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
                <div className="stat-body">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </section>

          {/* ── Active filter badge ── */}
          {(statusFilter !== 'all' || attendFilter !== 'all') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Filtering by:</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '2px 10px', borderRadius: 20 }}>
                {attendFilter !== 'all' ? (attendFilter === 'attended' ? 'Attended' : 'Yet to Attend') : statusFilter}
              </span>
              <button
                onClick={() => { setStatusFilter('all'); setAttendFilter('all') }}
                style={{ fontSize: '0.75rem', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear
              </button>
            </div>
          )}

          {/* ── Fetch error ── */}
          {fetchError && (
            <div className="error-msg" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{fetchError}</span>
              <button onClick={fetchPatients}
                style={{ background: 'none', border: '1px solid currentColor', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', color: 'inherit', fontSize: '0.78rem' }}>
                Retry
              </button>
            </div>
          )}

          {/* ── Patient List Panel ── */}
          <section className="panel anim-fade-up anim-delay-2" style={{ marginTop: 0 }}>
            <div className="panel-header">
              <h3 className="panel-title">All Patients</h3>
              <div className="panel-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setAttendFilter('all') }}
                  className="input-field"
                  style={{ appearance: 'none', padding: '6px 12px', fontSize: '0.82rem', width: 'auto', minWidth: 130 }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="discharged">Discharged</option>
                </select>

                <div className="search-wrap">
                  <SearchIcon />
                  <input className="search-input" placeholder="Search patients…"
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="patient-list">
              {loading ? (
                <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '32px', fontSize: '0.9rem' }}>Loading…</p>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <p style={{ fontSize: '2rem', marginBottom: 8 }}>🏥</p>
                  <p style={{ color: 'var(--text-2)', fontWeight: 600, marginBottom: 4 }}>No patients found</p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
                    {search || statusFilter !== 'all' || attendFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first patient to get started.'}
                  </p>
                </div>
              ) : (
                filtered.map(p => (
                  <div
                    key={p.id}
                    className="patient-row"
                    onClick={() => navigate(`/admin/patient/${p.id}`)}
                  >
                    <div className="patient-avatar" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)' }}>
                      {p.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div className="patient-info">
                      <div className="patient-name">{p.name}</div>
                      <div className="patient-meta">
                        {p.gender} · {p.age} yrs · {p.blood_group || '—'}
                        {p.email ? ` · ${p.email}` : ''}
                        {p.phone ? ` · ${p.phone}` : ''}
                      </div>
                    </div>
                    <div className="patient-right">
                      <StatusPill status={p.status} />
                      {p.doctors && (
                        <span className="last-visit">
                          {p.doctors.name}{p.doctors.specialization ? ` · ${p.doctors.specialization}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {!loading && filtered.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>
                  Showing <strong style={{ color: 'var(--text-2)' }}>{filtered.length}</strong>
                  {filtered.length !== patients.length ? ` of ${patients.length}` : ''} records
                </span>
                <button onClick={fetchPatients}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '0.78rem' }}>
                  ↻ Refresh
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <AddPatientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setToast('Patient added successfully!'); fetchPatients() }}
      />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface-2, #1e2235)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeUp 0.3s ease both',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: '#3dffc0', color: '#0a0f1e', fontWeight: 700, fontSize: '0.8rem' }}>✓</span>
          <span style={{ color: 'var(--text-1)', fontSize: '0.88rem', fontWeight: 500 }}>{toast}</span>
        </div>
      )}

      <style>{`
        .patient-portal .search-wrap { color: rgba(255,255,255,0.9); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function MenuIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
}
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
