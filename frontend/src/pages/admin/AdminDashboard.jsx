import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'   // ← shared sidebar
import '../Dashboard.css'
import '../Auth.css'

const EMPTY_FORM = {
  name: '', email: '', phone: '', specialization: '', gender: '',
  date_of_birth: '', qualification: '', experience_years: '',
  license_number: '', address: '', city: '', state: '', pincode: '',
  shift_start: '', shift_end: '', password: '',
}

export default function AdminDashboard() {
  const { admin, createDoctor } = useAuth()
  const navigate = useNavigate()

  const [doctors, setDoctors]           = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [search, setSearch]             = useState('')
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [formError, setFormError]       = useState('')
  const [formLoading, setFormLoading]   = useState(false)
  const [formSuccess, setFormSuccess]   = useState(false)

  useEffect(() => { fetchDoctors() }, [])

  const fetchDoctors = async () => {
    setLoadingDoctors(true)
    const { data, error } = await supabase.from('doctors').select('*').order('name')
    if (!error) setDoctors(data || [])
    setLoadingDoctors(false)
  }

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleCreateDoctor = async e => {
    e.preventDefault()
    setFormError('')
    if (form.password.length < 8) { setFormError('Password must be at least 8 characters.'); return }
    setFormLoading(true)
    const { password, ...doctorData } = form
    const { error } = await createDoctor(doctorData, password)
    setFormLoading(false)
    if (error) {
      setFormError(error.message || 'Failed to create doctor account.')
    } else {
      setFormSuccess(true)
      await fetchDoctors()
      setTimeout(() => {
        setShowModal(false); setFormSuccess(false); setForm(EMPTY_FORM)
        navigate('/admin', { replace: true })
      }, 1800)
    }
  }

  const filteredDoctors = doctors.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: 'Total Doctors',    value: doctors.length, icon: '👨‍⚕️', color: 'var(--primary)' },
    { label: 'Specializations',  value: [...new Set(doctors.map(d => d.specialization).filter(Boolean))].length, icon: '🏥', color: 'var(--accent)' },
  ]

  return (
    <div className="dashboard-layout">

      {/* ── Shared Sidebar ── */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(s => !s)}><MenuIcon /></button>
            <div>
              <h2 className="page-title">Doctor Management</h2>
              <p className="page-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn-add" onClick={() => setShowModal(true)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <PlusIcon /> Create Doctor
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Stats */}
          <section className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-card anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
                <div className="stat-body">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </section>

          {/* Doctors list */}
          <section className="panel anim-fade-up anim-delay-2" style={{ marginTop: 0 }}>
            <div className="panel-header">
              <h3 className="panel-title">All Doctors</h3>
              <div className="panel-actions">
                <div className="search-wrap">
                  <SearchIcon />
                  <input className="search-input" placeholder="Search doctors…"
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="patient-list">
              {loadingDoctors ? (
                <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '24px', fontSize: '0.9rem' }}>Loading…</p>
              ) : filteredDoctors.length === 0 ? (
                <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '24px', fontSize: '0.9rem' }}>No doctors found.</p>
              ) : filteredDoctors.map(doc => (
                <div key={doc.id} className="patient-row">
                  <div className="patient-avatar" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)' }}>
                    {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="patient-info">
                    <div className="patient-name">{doc.name}</div>
                    <div className="patient-meta">
                      {doc.specialization || 'General'} · {doc.email}
                      {doc.phone ? ` · ${doc.phone}` : ''}
                    </div>
                  </div>
                  <div className="patient-right">
                    {doc.license_number && (
                      <span className="status-pill" style={{ color: '#3dffc0', background: 'rgba(61,255,192,0.1)' }}>
                        <span className="status-dot" style={{ background: '#3dffc0' }} />
                        Licensed
                      </span>
                    )}
                    {doc.city && <span className="last-visit">{doc.city}{doc.state ? `, ${doc.state}` : ''}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* ── Create Doctor Modal ── */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '16px', overflowY: 'auto',
          }}
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setFormError('') } }}
        >
          <div className="auth-card" style={{ width: '100%', maxWidth: 560, margin: '24px auto', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            {formSuccess ? (
              <div className="success-state">
                <div className="success-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: 8 }}>Doctor created!</h2>
                <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Account saved to Supabase.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: 0 }}>Create Doctor Account</h2>
                  <button onClick={() => { setShowModal(false); setFormError('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
                </div>

                {formError && (
                  <div className="error-msg" style={{ marginBottom: 16 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {formError}
                  </div>
                )}

                <form onSubmit={handleCreateDoctor} className="auth-form">
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Basic Info</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Full Name *</label>
                      <input name="name" type="text" className="input-field" placeholder="Dr. Jane Smith" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Email *</label>
                      <input name="email" type="email" className="input-field" placeholder="dr.smith@hospital.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Phone</label>
                      <input name="phone" type="tel" className="input-field" placeholder="+91 99999 00000" value={form.phone} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Gender</label>
                      <select name="gender" className="input-field" value={form.gender} onChange={handleChange} style={{ appearance: 'none' }}>
                        <option value="">Select</option>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Date of Birth</label>
                      <input name="date_of_birth" type="date" className="input-field" value={form.date_of_birth} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Specialization</label>
                      <input name="specialization" type="text" className="input-field" placeholder="Cardiology" value={form.specialization} onChange={handleChange} />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 8px' }}>Professional</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Qualification</label>
                      <input name="qualification" type="text" className="input-field" placeholder="MBBS, MD" value={form.qualification} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Experience (years)</label>
                      <input name="experience_years" type="number" min="0" className="input-field" placeholder="5" value={form.experience_years} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>License Number</label>
                      <input name="license_number" type="text" className="input-field" placeholder="MCI-123456" value={form.license_number} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Shift Start</label>
                      <input name="shift_start" type="time" className="input-field" value={form.shift_start} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Shift End</label>
                      <input name="shift_end" type="time" className="input-field" value={form.shift_end} onChange={handleChange} />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 8px' }}>Address</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                      <label>Address</label>
                      <input name="address" type="text" className="input-field" placeholder="Street address" value={form.address} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>City</label>
                      <input name="city" type="text" className="input-field" placeholder="Chennai" value={form.city} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>State</label>
                      <input name="state" type="text" className="input-field" placeholder="Tamil Nadu" value={form.state} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Pincode</label>
                      <input name="pincode" type="text" className="input-field" placeholder="600001" value={form.pincode} onChange={handleChange} />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 8px' }}>Login Credentials</p>
                  <div className="input-group">
                    <label>Temporary Password *</label>
                    <input name="password" type="password" className="input-field" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required />
                  </div>

                  <button type="submit" className="btn-primary" disabled={formLoading} style={{ marginTop: 8 }}>
                    {formLoading ? <><span className="spin-ring" />Creating…</> : 'Create Doctor Account'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
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