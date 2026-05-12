import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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
  active: {
    color: '#3dffc0',
    bg: 'rgba(61,255,192,0.1)',
    label: 'Active'
  },
  pending: {
    color: '#ffb547',
    bg: 'rgba(255,181,71,0.1)',
    label: 'Pending'
  },
}

export default function PatientDetail() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] =
    useState(false)

  const [editRecord, setEditRecord] =
    useState(null)

  // ─────────────────────────────────────
  // FETCH PATIENT
  // ─────────────────────────────────────

  const fetchPatient = async () => {

    try {

      const { data, error } =
        await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single()

      if (error) {
        console.error(error)
        return null
      }

      setPatient(data)

      return data

    } catch (err) {

      console.error(err)

      return null
    }
  }

  // ─────────────────────────────────────
  // FETCH HISTORY
  // ─────────────────────────────────────

  const fetchHistory = async () => {

    try {

      const {
        data: { session }
      } = await supabase.auth.getSession()

      const token = session?.access_token

      if (!token) return

      const res = await fetch(
        `${API}/patients/${id}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await res.json()

     

      if (Array.isArray(data.history)) {

        setHistory(data.history)

      } else {

        setHistory([])
      }

    } catch (err) {

      console.error(
        'History fetch failed:',
        err
      )

      setHistory([])
    }
  }

  // ─────────────────────────────────────
  // LOAD PAGE
  // ─────────────────────────────────────

  useEffect(() => {

    const load = async () => {

      setLoading(true)

      await fetchPatient()

      await fetchHistory()

      setLoading(false)
    }

    load()

  }, [id])

  // ─────────────────────────────────────
  // DELETE HISTORY
  // ─────────────────────────────────────

  const handleDelete = async (histId) => {

    if (
      !window.confirm(
        'Delete this history record?'
      )
    ) return

    try {

      const {
        data: { session }
      } = await supabase.auth.getSession()

      const token = session?.access_token

      await fetch(
        `${API}/patients/history/${histId}`,
        {
          method: 'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      )

      await fetchHistory()

    } catch (err) {

      console.error(err)
    }
  }

  // ─────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────

  if (loading) {

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f1117',
        color: '#8b92a5'
      }}>
        Loading patient...
      </div>
    )
  }

  // ─────────────────────────────────────
  // NOT FOUND
  // ─────────────────────────────────────

  if (!patient) {

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f1117',
        color: '#ff5b7f'
      }}>
        Patient not found
      </div>
    )
  }

  const cfg =
    STATUS_CONFIG[patient.status]
    || STATUS_CONFIG.pending

  const initials =
    patient.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  return (

    <div style={styles.page}>

      {/* TOPBAR */}

      <div style={styles.topbar}>

        <button
          style={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon />
          Back
        </button>

        <span style={styles.breadcrumb}>
          Patients /
          <strong>
            {' '}
            {patient.name}
          </strong>
        </span>

      </div>

      {/* PROFILE */}

      <div style={styles.profileCard}>

        <div style={styles.avatarLg}>
          {initials}
        </div>

        <div style={styles.profileInfo}>

          <h1 style={styles.patientName}>
            {patient.name}
          </h1>

          <div style={styles.metaRow}>

            {patient.age && (
              <MetaChip
                icon="🎂"
                label={`${patient.age} yrs`}
              />
            )}

            {patient.gender && (
              <MetaChip
                icon="⚧"
                label={patient.gender}
              />
            )}

            {patient.blood_group && (
              <MetaChip
                icon="🩸"
                label={patient.blood_group}
              />
            )}

            {patient.phone && (
              <MetaChip
                icon="📞"
                label={patient.phone}
              />
            )}

            {patient.email && (
              <MetaChip
                icon="✉️"
                label={patient.email}
              />
            )}

          </div>

          {patient.medical_history && (
            <p style={styles.medHistory}>
              <span style={{
                opacity: 0.5
              }}>
                History:
              </span>

              {' '}
              {patient.medical_history}
            </p>
          )}

        </div>

        <div style={styles.profileRight}>

          <span style={{
            ...styles.statusPill,
            color: cfg.color,
            background: cfg.bg
          }}>

            <span style={{
              ...styles.statusDot,
              background: cfg.color
            }} />

            {cfg.label}

          </span>

        </div>

      </div>

      {/* HISTORY */}

      <div style={styles.section}>

        <div style={styles.sectionHeader}>

          <h2 style={styles.sectionTitle}>
            Patient History
          </h2>

          <button
            style={styles.addBtn}
            onClick={() => {
              setEditRecord(null)
              setShowModal(true)
            }}
          >
            <PlusIcon />
            Add History
          </button>

        </div>

        {history.length === 0 && (

          <div style={styles.emptyState}>
            No patient history found.
          </div>

        )}

        {history.length > 0 && (

          <div style={styles.historyList}>

            {history.map((h) => (

              <div
                key={h.id}
                style={styles.historyCard}
              >

                <div style={styles.historyCardHeader}>

                  <div style={styles.historyDate}>
                    {new Date(
                      h.created_at
                    ).toLocaleDateString()}
                  </div>

                  <div style={styles.historyActions}>

                    {/* EDIT */}

                    <button
                      style={styles.iconBtnSm}
                      onClick={() => {
                        setEditRecord(h)
                        setShowModal(true)
                      }}
                    >
                      <EditIcon />
                    </button>

                    {/* DELETE */}

                    <button
                      style={{
                        ...styles.iconBtnSm,
                        color: '#ff5b7f'
                      }}
                      onClick={() =>
                        handleDelete(h.id)
                      }
                    >
                      <TrashIcon />
                    </button>

                  </div>

                </div>

                <div style={styles.historyBody}>

                  {h.diagnosis && (
                    <div style={styles.historyField}>

                      <span style={styles.fieldLabel}>
                        Diagnosis
                      </span>

                      <span style={styles.fieldValue}>
                        {h.diagnosis}
                      </span>

                    </div>
                  )}

                  {h.prescription && (
                    <div style={styles.historyField}>

                      <span style={styles.fieldLabel}>
                        Prescription
                      </span>

                      <span style={styles.fieldValue}>
                        {h.prescription}
                      </span>

                    </div>
                  )}

                  {h.notes && (
                    <div style={styles.historyField}>

                      <span style={styles.fieldLabel}>
                        Notes
                      </span>

                      <span style={styles.fieldValue}>
                        {h.notes}
                      </span>

                    </div>
                  )}

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* MODAL */}

      {showModal && (

        <HistoryModal
          patientId={id}
          record={editRecord}
          onClose={() => {
            setShowModal(false)
            setEditRecord(null)
          }}
          onSuccess={async () => {

            setShowModal(false)

            setEditRecord(null)

            await fetchHistory()
          }}
        />

      )}

    </div>
  )
}

// ─────────────────────────────────────
// HISTORY MODAL
// ─────────────────────────────────────

function HistoryModal({
  patientId,
  record,
  onClose,
  onSuccess
}) {

  const isEdit = !!record

  const [form, setForm] = useState({
    diagnosis:
      record?.diagnosis || '',

    prescription:
      record?.prescription || '',

    notes:
      record?.notes || '',
  })

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const handleSubmit = async () => {

    if (!form.diagnosis.trim()) {

      setError(
        'Diagnosis is required'
      )

      return
    }

    try {

      setSaving(true)

      setError('')

      const {
        data: { session }
      } = await supabase.auth.getSession()

      const token =
        session?.access_token

      if (!token) {

        setError(
          'User not logged in'
        )

        return
      }

      const {
        data: { user }
      } = await supabase.auth.getUser()

      const {
        data: doctorData,
        error: doctorError
      } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (
        doctorError ||
        !doctorData
      ) {

        console.error(
          doctorError
        )

        setError(
          'Doctor profile not found'
        )

        return
      }

      // ─────────────────────────
      // UPDATE
      // ─────────────────────────

      if (isEdit) {

        const res = await fetch(
          `${API}/patients/history/${record.id}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              diagnosis:
                form.diagnosis,

              prescription:
                form.prescription,

              notes:
                form.notes,
            })
          }
        )

        const data =
          await res.json()

        if (!res.ok) {

          setError(
            data.detail ||
            'Failed to update'
          )

          return
        }
      }

      // ─────────────────────────
      // CREATE
      // ─────────────────────────

      else {

        const res = await fetch(
          `${API}/patients/history`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({

              patient_id:
                patientId,

              doctor_id:
                doctorData.id,

              diagnosis:
                form.diagnosis,

              prescription:
                form.prescription,

              notes:
                form.notes,
            })
          }
        )

        const data =
          await res.json()

       

        if (!res.ok) {

          setError(
            data.detail ||
            'Failed to save'
          )

          return
        }
      }

      onSuccess()

    } catch (err) {

      console.error(err)

      setError(
        'Something went wrong'
      )

    } finally {

      setSaving(false)
    }
  }

  return (

    <div
      style={styles.overlay}
      onClick={(e) => {

        if (
          e.target === e.currentTarget
        ) {
          onClose()
        }
      }}
    >

      <div style={styles.modal}>

        <div style={styles.modalHeader}>

          <h3 style={styles.modalTitle}>
            {isEdit
              ? 'Edit History'
              : 'Add History'}
          </h3>

          <button
            style={styles.closeBtn}
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        <div style={styles.modalBody}>

          <Field
            label="Diagnosis *"
            value={form.diagnosis}
            onChange={(v) =>
              setForm(f => ({
                ...f,
                diagnosis: v
              }))
            }
            placeholder="Diagnosis"
          />

          <Field
            label="Prescription"
            multiline
            value={form.prescription}
            onChange={(v) =>
              setForm(f => ({
                ...f,
                prescription: v
              }))
            }
            placeholder="Prescription"
          />

          <Field
            label="Notes"
            multiline
            value={form.notes}
            onChange={(v) =>
              setForm(f => ({
                ...f,
                notes: v
              }))
            }
            placeholder="Notes"
          />

          {error && (
            <p style={styles.errorMsg}>
              {error}
            </p>
          )}

        </div>

        <div style={styles.modalFooter}>

          <button
            style={styles.cancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            style={styles.saveBtn}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : isEdit
                ? 'Update'
                : 'Save'}
          </button>

        </div>

      </div>

    </div>
  )
}

// ─────────────────────────────────────
// FIELD
// ─────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline
}) {

  const props = {
    value,
    placeholder,

    onChange: (e) =>
      onChange(e.target.value),

    style: multiline
      ? styles.textarea
      : styles.input
  }

  return (

    <div style={styles.fieldGroup}>

      <label style={styles.label}>
        {label}
      </label>

      {multiline
        ? <textarea {...props} rows={4} />
        : <input {...props} />
      }

    </div>
  )
}

function MetaChip({
  icon,
  label
}) {

  return (
    <span style={styles.metaChip}>
      {icon} {label}
    </span>
  )
}

// ─────────────────────────────────────
// ICONS
// ─────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 12H5"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

// KEEP YOUR EXISTING styles OBJECT HERE

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
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
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--primary, #6366f1)', border: 'none',
    color: '#fff', padding: '8px 16px', borderRadius: 8,
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
    transition: 'opacity 0.2s',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, padding: '48px 0',
    color: 'var(--text-3, #555d73)', fontSize: '0.9rem',
  },
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
  historyActions: { display: 'flex', gap: 8 },
  iconBtnSm: {
    background: 'rgba(255,255,255,0.05)', border: 'none',
    color: 'var(--text-2, #8b92a5)', padding: '5px 8px',
    borderRadius: 6, cursor: 'pointer', display: 'flex',
    alignItems: 'center', transition: 'all 0.2s',
  },
  historyBody: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  historyField: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary, #6366f1)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  fieldValue: { fontSize: '0.9rem', color: 'var(--text-1, #e8eaf0)', lineHeight: 1.6 },

  historyFormCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 20,
  },

  // Modal
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  },
  modal: {
    background: 'var(--surface, #161b27)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, width: '100%', maxWidth: 520,
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    animation: 'fadeUp 0.25s ease',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  modalTitle: { margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-1, #e8eaf0)' },
  closeBtn: {
    background: 'rgba(255,255,255,0.06)', border: 'none',
    color: 'var(--text-2, #8b92a5)', width: 30, height: 30,
    borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem',
  },
  modalBody: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  modalFooter: {
    display: 'flex', gap: 10, justifyContent: 'flex-end',
    padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)',
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2, #8b92a5)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--text-1, #e8eaf0)',
    fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  textarea: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--text-1, #e8eaf0)',
    fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box',
    resize: 'vertical', fontFamily: 'inherit',
  },
  cancelBtn: {
    background: 'rgba(255,255,255,0.06)', border: 'none',
    color: 'var(--text-2, #8b92a5)', padding: '9px 18px',
    borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem',
  },
  saveBtn: {
    background: 'var(--primary, #6366f1)', border: 'none',
    color: '#fff', padding: '9px 20px', borderRadius: 8,
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
    opacity: 1, transition: 'opacity 0.2s',
  },
  errorMsg: { color: '#ff5b7f', fontSize: '0.82rem', margin: 0 },
}