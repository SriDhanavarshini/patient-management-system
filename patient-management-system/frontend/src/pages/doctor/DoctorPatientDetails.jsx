import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'
import '../Dashboard.css'

const API = 'http://localhost:8000'

const STATUS_CONFIG = {
  stable:     { color: '#3dffc0', bg: 'rgba(61,255,192,0.1)',  label: 'Stable' },
  monitoring: { color: '#ffb547', bg: 'rgba(255,181,71,0.1)',  label: 'Monitoring' },
  critical:   { color: '#ff5b7f', bg: 'rgba(255,91,127,0.1)', label: 'Critical' },
  active:     { color: '#3dffc0', bg: 'rgba(61,255,192,0.1)',  label: 'Active' },
  pending:    { color: '#ffb547', bg: 'rgba(255,181,71,0.1)',  label: 'Pending' },
}

export default function DoctorPatientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createForm, setCreateForm] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
  })

  useEffect(() => {
    if (!id) return

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) throw new Error('Not authenticated')

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }

        const [patientRes, historyRes] = await Promise.all([
          fetch(`${API}/patients/${id}`, { headers }),
          fetch(`${API}/patients/${id}/history`, { headers }),
        ])

        if (!patientRes.ok) {
          const err = await patientRes.json().catch(() => ({}))
          throw new Error(err.detail || 'Patient not found or access denied')
        }
        if (!historyRes.ok) {
          const err = await historyRes.json().catch(() => ({}))
          throw new Error(err.detail || 'Failed to load history')
        }

        const patientJson = await patientRes.json()
        const historyJson = await historyRes.json()

   
        setPatient(patientJson.patient)
        setHistory(historyJson.history || [])
      } catch (e) {
        setError(e?.message || 'Unexpected error')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const refreshHistory = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    const token = session?.access_token
    if (!token) return

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }

    const historyRes = await fetch(`${API}/patients/${id}/history`, { headers })
    if (!historyRes.ok) {
      const err = await historyRes.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to load history')
    }

    const historyJson = await historyRes.json().catch(() => ({}))
    setHistory(historyJson.history || [])
  }

  const handleCreateHistory = async (e) => {
    e.preventDefault()
    setCreateError('')

    const diagnosis = String(createForm.diagnosis || '').trim()
    if (!diagnosis) {
      setCreateError('Diagnosis is required.')
      return
    }

    setCreating(true)
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(`${API}/patients/${id}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          diagnosis,
          prescription: String(createForm.prescription || '').trim() || null,
          notes: String(createForm.notes || '').trim() || null,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.detail || 'Failed to save history')

      setCreateForm({ diagnosis: '', prescription: '', notes: '' })
      await refreshHistory()
    } catch (err) {
      setCreateError(err?.message || 'Failed to save history')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (record) => {
    setEditError('')
    setEditingId(record?.id || null)
    setEditForm({
      diagnosis: record?.diagnosis || '',
      prescription: record?.prescription || '',
      notes: record?.notes || '',
    })
  }

  const cancelEdit = () => {
    setEditError('')
    setEditingId(null)
    setEditForm({ diagnosis: '', prescription: '', notes: '' })
  }

  const handleUpdateHistory = async (e) => {
    e.preventDefault()
    setEditError('')

    const diagnosis = String(editForm.diagnosis || '').trim()
    if (!diagnosis) {
      setEditError('Diagnosis is required.')
      return
    }

    if (!editingId) return

    setEditSaving(true)
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(`${API}/patients/history/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          diagnosis,
          prescription: String(editForm.prescription || '').trim() || null,
          notes: String(editForm.notes || '').trim() || null,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.detail || 'Failed to update history')

      await refreshHistory()
      cancelEdit()
    } catch (err) {
      setEditError(err?.message || 'Failed to update history')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteHistory = async (histId) => {
    if (!histId) return
    if (!window.confirm('Delete this history record?')) return

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(`${API}/patients/history/${histId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.detail || 'Failed to delete history')

      await refreshHistory()
      if (editingId === histId) cancelEdit()
    } catch (err) {
      window.alert(err?.message || 'Failed to delete history')
    }
  }

  const cfg = useMemo(() => {
    return patient ? (STATUS_CONFIG[patient.status] || STATUS_CONFIG.pending) : STATUS_CONFIG.pending
  }, [patient])

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="dashboard-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-2, #8b92a5)' }}>
            Loading patient…
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="dashboard-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#ff5b7f', padding: 20 }}>
            <div style={{ maxWidth: 520 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Could not load patient</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>{error}</div>
              <div style={{ marginTop: 16 }}>
                <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="dashboard-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#ff5b7f' }}>
            Patient not found.
          </div>
        </main>
      </div>
    )
  }

  const initials = (patient.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="dashboard-main">
        <div style={styles.page}>

          <div style={styles.topbar}>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>
              <ArrowLeftIcon /> Back
            </button>
            <span style={styles.breadcrumb}>
              Patients / <strong>{patient.name}</strong>
            </span>
            <div style={{ flex: 1 }} />
          </div>

          <div style={styles.profileCard}>
            <div style={styles.avatarLg}>{initials}</div>
            <div style={styles.profileInfo}>
              <h1 style={styles.patientName}>{patient.name}</h1>
              <div style={styles.metaRow}>
                {patient.age && <MetaChip icon="🎂" label={`${patient.age} yrs`} />}
                {patient.gender && <MetaChip icon="⚧" label={patient.gender} />}
                {patient.blood_group && <MetaChip icon="🩸" label={patient.blood_group} />}
                {patient.phone && <MetaChip icon="📞" label={patient.phone} />}
                {patient.email && <MetaChip icon="✉️" label={patient.email} />}
              </div>
              {patient.medical_history && (
                <p style={styles.medHistory}><span style={{ opacity: 0.5 }}>History: </span>{patient.medical_history}</p>
              )}
            </div>
            <div style={styles.profileRight}>
              <span style={{ ...styles.statusPill, color: cfg.color, background: cfg.bg }}>
                <span style={{ ...styles.statusDot, background: cfg.color }} />
                {cfg.label}
              </span>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Patient History</h2>
              <div style={{ color: 'var(--text-3)', fontSize: 13 }}>{history.length} record(s)</div>
            </div>

            {/* Add-history form removed: edit existing records only */}
            {history.length === 0 ? (
              <>
                <form onSubmit={handleCreateHistory} style={styles.createWrap}>
                  <div style={{ fontWeight: 800, marginBottom: 10 }}>Add history</div>

                  {createError && <div style={styles.formError}>{createError}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={styles.fieldGroup}>
                      <div style={styles.label}>Diagnosis *</div>
                      <input
                        style={styles.input}
                        value={createForm.diagnosis}
                        onChange={(e) => setCreateForm((f) => ({ ...f, diagnosis: e.target.value }))}
                        placeholder="e.g., Viral fever"
                      />
                    </div>

                    <div style={styles.fieldGroup}>
                      <div style={styles.label}>Prescription</div>
                      <input
                        style={styles.input}
                        value={createForm.prescription}
                        onChange={(e) => setCreateForm((f) => ({ ...f, prescription: e.target.value }))}
                        placeholder="e.g., Paracetamol 500mg"
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 12, ...styles.fieldGroup }}>
                    <div style={styles.label}>Notes</div>
                    <textarea
                      style={styles.textarea}
                      rows={3}
                      value={createForm.notes}
                      onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Add notes..."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button type="submit" style={{ ...styles.saveBtn, opacity: creating ? 0.7 : 1 }} disabled={creating}>
                      {creating ? 'Saving...' : 'Add history'}
                    </button>
                  </div>
                </form>

                <div style={styles.emptyState}>
                  <span style={{ fontSize: 32 }}>🗂️</span>
                  <p>No history records yet.</p>
                </div>
              </>
            ) : (
              <div style={styles.historyList}>
                {history.map((h, i) => (
                  <div key={h.id} style={{ ...styles.historyCard, animationDelay: `${i * 0.06}s` }}>
                    <div style={styles.historyCardHeader}>
                      <div style={styles.historyDate}>
{new Date(h.created_at + 'Z').toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
})}
                      </div>
                      <div style={styles.historyActions}>
                        {editingId === h.id ? (
                          <button style={styles.actionBtn} onClick={cancelEdit} type="button" disabled={editSaving}>
                            Cancel
                          </button>
                        ) : (
                          <button style={styles.actionBtn} onClick={() => startEdit(h)} type="button">
                            Edit
                          </button>
                        )}
                        <button
                          style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
                          onClick={() => handleDeleteHistory(h.id)}
                          type="button"
                          disabled={editSaving}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={styles.historyBody}>
                      {editingId === h.id ? (
                        <form onSubmit={handleUpdateHistory} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {editError && <div style={styles.formError}>{editError}</div>}

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div style={styles.fieldGroup}>
                              <div style={styles.label}>Diagnosis *</div>
                              <input
                                style={styles.input}
                                value={editForm.diagnosis}
                                onChange={(e) => setEditForm((f) => ({ ...f, diagnosis: e.target.value }))}
                              />
                            </div>

                            <div style={styles.fieldGroup}>
                              <div style={styles.label}>Prescription</div>
                              <input
                                style={styles.input}
                                value={editForm.prescription}
                                onChange={(e) => setEditForm((f) => ({ ...f, prescription: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div style={styles.fieldGroup}>
                            <div style={styles.label}>Notes</div>
                            <textarea
                              style={styles.textarea}
                              rows={3}
                              value={editForm.notes}
                              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button type="submit" style={{ ...styles.saveBtn, opacity: editSaving ? 0.7 : 1 }} disabled={editSaving}>
                              {editSaving ? 'Saving...' : 'Save changes'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {h.diagnosis && (
                            <div style={styles.historyField}>
                              <span style={styles.fieldLabel}>Diagnosis</span>
                              <span style={styles.fieldValue}>{h.diagnosis}</span>
                            </div>
                          )}
                          {h.prescription && (
                            <div style={styles.historyField}>
                              <span style={styles.fieldLabel}>Prescription</span>
                              <span style={styles.fieldValue}>{h.prescription}</span>
                            </div>
                          )}
                          {h.notes && (
                            <div style={styles.historyField}>
                              <span style={styles.fieldLabel}>Notes</span>
                              <span style={styles.fieldValue}>{h.notes}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

function ArrowLeftIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
}

function MetaChip({ icon, label }) {
  return <span style={styles.metaChip}>{icon} {label}</span>
}

const styles = {
  page: {
    flex: 1,
    overflowY: 'auto',
    background: 'var(--bg, #0f1117)',
    color: 'var(--text-1, #e8eaf0)',
    fontFamily: 'inherit',
    padding: '0 0 60px',
  },
  topbar: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '20px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.06)', border: 'none',
    color: 'var(--text-2, #8b92a5)', padding: '8px 14px',
    borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem',
    transition: 'all 0.2s',
  },
  addPatientBtn: {
    background: 'var(--primary, #6366f1)',
    border: 'none',
    color: '#fff',
    padding: '9px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  breadcrumb: { color: 'var(--text-3, #555d73)', fontSize: '0.85rem' },
  profileCard: {
    display: 'flex', alignItems: 'flex-start', gap: 24,
    margin: '28px 32px', padding: '28px 32px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
  },
  avatarLg: {
    width: 72, height: 72, borderRadius: 20,
    background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(61,255,192,0.2))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.5rem', fontWeight: 700, color: '#fff',
    flexShrink: 0, border: '2px solid rgba(99,102,241,0.3)',
  },
  profileInfo: { flex: 1 },
  patientName: { margin: '0 0 10px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1, #e8eaf0)' },
  metaRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  metaChip: {
    fontSize: '0.8rem', padding: '4px 10px', borderRadius: 20,
    background: 'rgba(255,255,255,0.06)', color: 'var(--text-2, #8b92a5)',
  },
  medHistory: { margin: 0, fontSize: '0.85rem', color: 'var(--text-2, #8b92a5)', lineHeight: 1.6 },
  profileRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  statusPill: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
  },
  statusDot: { width: 6, height: 6, borderRadius: '50%' },
  section: { margin: '0 32px' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-1, #e8eaf0)' },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, padding: '48px 0',
    color: 'var(--text-3, #555d73)', fontSize: '0.9rem',
  },
  createWrap: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    color: 'var(--text-1, #e8eaf0)',
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3, #555d73)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 0,
    padding: '10px 2px',
    color: 'var(--text-1, #e8eaf0)',
    fontSize: '0.9rem',
    outline: 'none',
  },
  textarea: {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 0,
    padding: '10px 2px',
    color: 'var(--text-1, #e8eaf0)',
    fontSize: '0.9rem',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  saveBtn: {
    background: 'var(--primary, #6366f1)',
    border: 'none',
    color: '#fff',
    padding: '9px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 800,
  },
  formError: { color: '#ff5b7f', fontSize: '0.85rem', marginBottom: 10, fontWeight: 700 },
  historyList: { display: 'flex', flexDirection: 'column', gap: 12 },
  historyCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, overflow: 'hidden',
    animation: 'fadeUp 0.3s ease both',
  },
  historyCardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
  },
  historyDate: { fontSize: '0.8rem', color: 'var(--text-3, #555d73)', fontWeight: 500 },
  historyActions: { display: 'flex', gap: 8, alignItems: 'center' },
  actionBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--text-2, #8b92a5)',
    padding: '6px 10px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: '0.78rem',
    fontWeight: 800,
  },
  actionBtnDanger: {
    color: '#ff5b7f',
    borderColor: 'rgba(255,91,127,0.25)',
    background: 'rgba(255,91,127,0.08)',
  },
  historyBody: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  historyField: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary, #6366f1)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  fieldValue: { fontSize: '0.9rem', color: 'var(--text-1, #e8eaf0)', lineHeight: 1.6 },
}
