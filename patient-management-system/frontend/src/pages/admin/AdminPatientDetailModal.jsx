import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

function Spinner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
      }}
    >
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
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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

export default function AdminPatientDetailModal({
  patientId,
  isOpen,
  onClose,
}) {
  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !patientId) return

    let alive = true

    ;(async () => {
      setLoading(true)
      setError('')
      setPatient(null)
      setHistory([])

      try {
        // ─────────────────────────────────────────────
        // FETCH PATIENT
        // ─────────────────────────────────────────────
        const { data: p, error: pe } = await supabase
          .from('patients')
          .select(`
            id,
            name,
            age,
            gender,
            blood_group,
            address,
            phone,
            disease,
            department,
            doctor_id,
            status,
            visit_date,
            created_at,
            doctors!fk_doctor (
              id,
              name,
              specialization
            )
          `)
          .eq('id', patientId)
          .maybeSingle()

        if (pe) throw pe

        if (!alive) return

        setPatient(p)

        // ─────────────────────────────────────────────
        // FETCH HISTORY
        // ─────────────────────────────────────────────
        const { data: h, error: he } = await supabase
          .from('patient_history')
          .select(`
            id,
            patient_id,
            doctor_id,
            diagnosis,
            prescription,
            notes,
            created_at,
            doctors!fk_history_doctor (
              name,
              specialization
            )
          `)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })

        if (he) throw he

        if (!alive) return

        setHistory(h || [])
      } catch (e) {
        if (!alive) return

        setError(e?.message || 'Failed to load patient details')
      } finally {
        if (!alive) return

        setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [isOpen, patientId])

  // ─────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────
  const computed = useMemo(() => {
    const hasAnyHistory = (history?.length || 0) > 0

    // Patient status logic
    const visitStatus = hasAnyHistory ? 'Attended' : 'Waiting'

    // Doctor name logic
    const assignedDoctorName =
      patient?.doctors?.name
        ? `Dr. ${patient.doctors.name}`
        : patient?.doctor_id
          ? `Doctor #${patient.doctor_id}`
          : '—'

    // Department
    const department =
      patient?.department ||
      patient?.doctors?.specialization ||
      '—'

    // Queue status
    const queueStatus =
      visitStatus === 'Waiting'
        ? 'Waiting for Doctor'
        : 'In Consultation'

    // Visit datetime
    const visitDateTime =
      patient?.visit_date
        ? formatDateTime(patient.visit_date)
        : patient?.created_at
          ? formatDateTime(patient.created_at)
          : '—'

    return {
      visitStatus,
      assignedDoctorName,
      department,
      queueStatus,
      visitDateTime,
    }
  }, [history, patient])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.()
        }
      }}
    >
      <div
        className="modal-panel modal-anim"
        role="dialog"
        aria-modal="true"
        aria-label="Patient details"
      >
        {/* HEADER */}
        <div className="modal-header">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div className="modal-title">
              {patient?.name || 'Patient'}
            </div>

            <div className="modal-subtitle">
              {computed.visitStatus}
            </div>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* LOADING */}
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="modal-body">
            <div
              className="error-msg"
              style={{ margin: 0 }}
            >
              {error}
            </div>
          </div>
        ) : !patient ? (
          <div className="modal-body">
            No patient data found.
          </div>
        ) : (
          <div className="modal-body">

            {/* PATIENT DETAILS */}
            <div className="patient-sheet-grid">

              {/* LEFT SIDE */}
              <div className="patient-sheet-left">
                <div className="sheet-card">

                  <div className="sheet-row">
                    <span className="sheet-label">Name</span>
                    <span className="sheet-value">
                      {patient?.name || '—'}
                    </span>
                  </div>

                  <div className="sheet-row">
                    <span className="sheet-label">
                      Age / Gender
                    </span>

                    <span className="sheet-value">
                      {patient?.age
                        ? `${patient.age} yrs`
                        : '—'}{' '}
                      · {patient?.gender || '—'}
                    </span>
                  </div>

                  <div className="sheet-row">
                    <span className="sheet-label">
                      Blood Group
                    </span>

                    <span className="sheet-value">
                      {patient?.blood_group || '—'}
                    </span>
                  </div>

                  <div className="sheet-row">
                    <span className="sheet-label">
                      Address
                    </span>

                    <span className="sheet-value">
                      {patient?.address || '—'}
                    </span>
                  </div>

                  <div className="sheet-row">
                    <span className="sheet-label">
                      Phone
                    </span>

                    <span className="sheet-value">
                      {patient?.phone || '—'}
                    </span>
                  </div>

                  <div className="sheet-row">
                    <span className="sheet-label">
                      Disease
                    </span>

                    <span className="sheet-value">
                      {patient?.disease || patient?.status || '—'}
                    </span>
                  </div>

                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="patient-sheet-right">
                <div className="sheet-card">

                  <div className="sheet-row">
                    <span className="sheet-label">
                      Department
                    </span>

                    <span className="sheet-value">
                      {computed.department}
                    </span>
                  </div>

                  <div className="sheet-row">
                    <span className="sheet-label">
                      Assigned Doctor
                    </span>

                    <span className="sheet-value">
                      {computed.assignedDoctorName}
                    </span>
                  </div>

                  <div className="sheet-row">
                    <span className="sheet-label">
                      Date & Time
                    </span>

                    <span className="sheet-value">
                      {computed.visitDateTime}
                    </span>
                  </div>

                  <div className="sheet-row">
                    <span className="sheet-label">
                      Current Status
                    </span>

                    <span className="sheet-value">
                      <span
                        className="status-pill"
                        style={{
                          color:
                            computed.visitStatus === 'Waiting'
                              ? '#f5a623'
                              : '#3dffc0',

                          background:
                            computed.visitStatus === 'Waiting'
                              ? 'rgba(245,166,35,0.1)'
                              : 'rgba(61,255,192,0.1)',
                        }}
                      >
                        <span
                          className="status-dot"
                          style={{
                            background:
                              computed.visitStatus === 'Waiting'
                                ? '#f5a623'
                                : '#3dffc0',
                          }}
                        />

                        {computed.visitStatus}
                      </span>
                    </span>
                  </div>

                  <div className="sheet-row">
                    <span className="sheet-label">
                      Queue Status
                    </span>

                    <span className="sheet-value">
                      {computed.queueStatus}
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* BOTTOM ACTIONS */}
            <div className="sheet-divider" />

            <div className="sheet-bottom">

              <div className="sheet-bottom-left">
                <div className="section-title-sm">
                  History
                </div>
              </div>

              <div className="sheet-bottom-actions">

                <button
                  className="btn-ghost"
                  onClick={() => {
                    const el = document.getElementById(
                      'patient-history-list'
                    )

                    el?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }}
                >
                  View History
                </button>

                <button
                  className="btn-primary"
                  onClick={onClose}
                  style={{
                    width: 'auto',
                    padding: '10px 18px',
                  }}
                >
                  Close
                </button>

              </div>
            </div>

            {/* HISTORY */}
            <div
              id="patient-history-list"
              className="history-timeline"
            >
              {(history || []).length === 0 ? (
                <div className="empty-state">

                  <div style={{ fontSize: 32 }}>
                    🩺
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      marginTop: 6,
                    }}
                  >
                    No consultation history yet
                  </div>

                  <div
                    style={{
                      color: 'var(--text-2)',
                      marginTop: 4,
                      fontSize: '0.9rem',
                    }}
                  >
                    Patient is currently waiting.
                  </div>
                </div>
              ) : (
                (history || []).map((h) => (
                  <div
                    key={h.id}
                    className="history-card"
                  >

                    <div className="history-card-top">

                      <div className="history-date">
                        {formatDateTime(h.created_at)}
                      </div>

                      <div className="history-doctor">
                        {h?.doctors?.name
                          ? `Dr. ${h.doctors.name}`
                          : h?.doctor_id
                            ? `Doctor #${h.doctor_id}`
                            : '—'}
                      </div>

                    </div>

                    <div className="history-grid">

                      <div>
                        <div className="history-label">
                          Diagnosis
                        </div>

                        <div className="history-value">
                          {h?.diagnosis || '—'}
                        </div>
                      </div>

                      <div>
                        <div className="history-label">
                          Prescription
                        </div>

                        <div className="history-value">
                          {h?.prescription || '—'}
                        </div>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <div className="history-label">
                          Notes
                        </div>

                        <div className="history-value">
                          {h?.notes || '—'}
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}