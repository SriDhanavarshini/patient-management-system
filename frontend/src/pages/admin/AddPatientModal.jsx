import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  gender: '',
  age: '',
  blood_group: '',
  medical_history: '',
  doctor_id: '',
  status: 'pending',
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
}

export default function AddPatientModal({ isOpen, onClose, onSuccess }) {
  const { admin } = useAuth()

  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState({})

  const doctorOptions = useMemo(() => {
    return (doctors || []).map((d) => ({
      value: d.id,
      label: `${d.name} - ${d.specialization || 'General'}`,
    }))
  }, [doctors])

  useEffect(() => {
    if (!isOpen) return

    let active = true
    ;(async () => {
      setLoadingDoctors(true)
      const { data, error } = await supabase
        .from('doctors')
        .select('id,name,specialization')
        .order('name')

      if (!active) return

      if (error) {
        setFormError(error.message || 'Failed to load doctors.')
        setDoctors([])
      } else {
        setDoctors(data || [])
      }
      setLoadingDoctors(false)
    })()

    return () => {
      active = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setForm(EMPTY_FORM)
    setFormError('')
    setTouched({})
  }, [isOpen])

  const errors = useMemo(() => {
    const e = {}

    if (!form.name.trim()) e.name = 'Patient name is required.'
    if (!form.phone.trim()) e.phone = 'Phone is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address.'

    if (!form.gender) e.gender = 'Gender is required.'

    const ageNum = Number(form.age)
    if (form.age === '' || form.age === null || form.age === undefined) e.age = 'Age is required.'
    else if (!Number.isFinite(ageNum) || ageNum <= 0) e.age = 'Age must be a positive number.'

    if (!form.blood_group.trim()) e.blood_group = 'Blood group is required.'
    if (!form.doctor_id) e.doctor_id = 'Doctor is required.'
    if (!form.status) e.status = 'Status is required.'

    return e
  }, [form])

  const hasValidationErrors = Object.keys(errors).length > 0

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setTouched({
      name: true,
      phone: true,
      email: true,
      gender: true,
      age: true,
      blood_group: true,
      doctor_id: true,
      status: true,
    })

    if (hasValidationErrors) return

    try {
      if (!admin?.id) {
        setFormError('Admin session not found. Please log in again.')
        return
      }

      setSubmitting(true)

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        gender: form.gender,
        age: Number(form.age),
        blood_group: form.blood_group.trim(),
        medical_history: form.medical_history?.trim() || null,
        doctor_id: form.doctor_id,
        status: form.status,
        created_by: admin.id,
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('patients').insert(payload)

      if (error) {
        setFormError(error.message || 'Failed to add patient.')
        return
      }

      setForm(EMPTY_FORM)
      setTouched({})
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setFormError(err?.message || 'Unexpected error while adding patient.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-5 md:p-7">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Add Patient
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Fill out patient details and assign a doctor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Name<span className="text-red-500"> *</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
                required
              />
              {touched.name && errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Phone<span className="text-red-500"> *</span>
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+91 99999 00000"
                required
              />
              {touched.phone && errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Email<span className="text-red-500"> *</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="john@example.com"
                required
              />
              {touched.email && errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Gender<span className="text-red-500"> *</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) => setField('gender', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, gender: true }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {touched.gender && errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Age<span className="text-red-500"> *</span>
              </label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setField('age', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, age: true }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
                required
              />
              {touched.age && errors.age && <p className="mt-1 text-xs text-red-600">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Blood Group<span className="text-red-500"> *</span>
              </label>
              <input
                type="text"
                value={form.blood_group}
                onChange={(e) => setField('blood_group', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, blood_group: true }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="A+, O-, etc"
                required
              />
              {touched.blood_group && errors.blood_group && (
                <p className="mt-1 text-xs text-red-600">{errors.blood_group}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Medical History
            </label>
            <textarea
              value={form.medical_history}
              onChange={(e) => setField('medical_history', e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Chronic conditions, allergies, surgeries, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Doctor<span className="text-red-500"> *</span>
              </label>
              <select
                value={form.doctor_id}
                onChange={(e) => setField('doctor_id', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, doctor_id: true }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                required
                disabled={loadingDoctors}
              >
                <option value="">{loadingDoctors ? 'Loading doctors…' : 'Select doctor'}</option>
                {doctorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {touched.doctor_id && errors.doctor_id && (
                <p className="mt-1 text-xs text-red-600">{errors.doctor_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Status<span className="text-red-500"> *</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, status: true }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="discharged">discharged</option>
              </select>
              {touched.status && errors.status && <p className="mt-1 text-xs text-red-600">{errors.status}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  Adding…
                </>
              ) : (
                'Add Patient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

