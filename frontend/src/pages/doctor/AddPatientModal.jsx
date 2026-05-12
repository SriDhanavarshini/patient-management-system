import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
export default function AddPatientModal({
  isOpen,
  onClose,
  onSuccess,
  patients = []
}) {

  const [form, setForm] = useState({
    patient_id: '',
    diagnosis: '',
    prescription: '',
    notes: '',
  })
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setForm({
        patient_id: '',
        diagnosis: '',
        prescription: '',
        notes: '',
      })
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const set = (k, v) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {

    if (!form.patient_id) {
      setError('Please select patient')
      return
    }

    if (!form.diagnosis.trim()) {
      setError('Diagnosis is required')
      return
    }

    setSaving(true)
    setError('')

    try {

      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      // Get doctor id
      const { data: doctorData, error: doctorError } =
        await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', user.id)
          .single()

      if (doctorError || !doctorData) {
        throw new Error('Doctor profile not found')
      }

      // Insert into patient_history
      const { error: insertError } =
        await supabase
          .from('patient_history')
          .insert({
            patient_id: form.patient_id,
            doctor_id: doctorData.id,
            diagnosis: form.diagnosis,
            prescription: form.prescription || null,
            notes: form.notes || null,
          })

      if (insertError) {
        throw new Error(insertError.message)
      }

      onSuccess?.()
      onClose?.()

    } catch (e) {
      setError(e.message || 'Failed to save history')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={s.overlay}
      onClick={e =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.headerTitle}>
              Add Patient History
            </div>

            <div style={s.headerSub}>
              Create medical record entry
            </div>
          </div>

          <button
            style={s.closeBtn}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={s.body}>

          {/* Patient Select */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              Patient *
            </label>

            <select
              style={s.select}
              value={form.patient_id}
              onChange={e =>
                set('patient_id', e.target.value)
              }
            >
              <option value="">
                Select Patient
              </option>

              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Diagnosis */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              Diagnosis *
            </label>

            <textarea
              rows={3}
              style={s.textarea}
              value={form.diagnosis}
              onChange={e =>
                set('diagnosis', e.target.value)
              }
              placeholder="Enter diagnosis"
            />
          </div>

          {/* Prescription */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              Prescription
            </label>

            <textarea
              rows={3}
              style={s.textarea}
              value={form.prescription}
              onChange={e =>
                set('prescription', e.target.value)
              }
              placeholder="Medicines / treatment"
            />
          </div>

          {/* Notes */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              Notes
            </label>

            <textarea
              rows={3}
              style={s.textarea}
              value={form.notes}
              onChange={e =>
                set('notes', e.target.value)
              }
              placeholder="Additional notes"
            />
          </div>

          {error && (
            <div style={s.error}>
              {error}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={s.footer}>

          <button
          type="button"
            style={s.cancelBtn}
           onClick={() => navigate('/doctor/dashboard')}
          >
            Cancel
          </button>

          <button
          type="button"
            style={s.submitBtn}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Save History'}
          </button>

        </div>

      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },

  modal: {
    background: '#13151f',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    width: '100%',
    maxWidth: 620,
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '24px 28px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },

  headerTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#fff',
  },

  headerSub: {
    fontSize: '0.82rem',
    color: '#777',
    marginTop: 4,
  },

  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '1rem',
  },

  body: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },

  label: {
    fontSize: '0.78rem',
    color: '#818cf8',
    fontWeight: 700,
    textTransform: 'uppercase',
  },

  select: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#fff',
  },

  textarea: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#fff',
    resize: 'vertical',
  },

  error: {
    background: 'rgba(255,0,0,0.1)',
    color: '#ff6b6b',
    padding: 12,
    borderRadius: 10,
  },

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 24,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },

  cancelBtn: {
    background: '#2b2f3d',
    border: 'none',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: 10,
    cursor: 'pointer',
  },

  submitBtn: {
    background: '#6366f1',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
  },
}