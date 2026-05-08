import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../Auth.css'

export default function AdminRegister() {
  const { registerAdmin } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirm: '',
    admin: 'admin',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const { error } = await registerAdmin({
  email: form.email,
  password: form.password,
  name: form.fullName,
  phone: '',
  role: form.admin,
})

    setLoading(false)

    if (error) {
      console.log('REGISTER ERROR:', error)
      setError(error.message || 'Something went wrong.')
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="auth-page noise-bg">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="auth-container anim-fade-up">
        <div className="auth-brand anim-fade-up">
          <div className="brand-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>

          <span className="brand-name">MediCore</span>
        </div>

        <div className="auth-card anim-fade-up anim-delay-1">
          {success ? (
            <div className="success-state">
              <div className="success-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  marginBottom: 8,
                }}
              >
                Admin account created!
              </h2>

              <p
                style={{
                  color: 'var(--text-2)',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  lineHeight: 1.7,
                }}
              >
                Check your email to verify your account,
                <br />
                then sign in to access the admin panel.
              </p>

              <Link
                to="/login"
                className="btn-primary"
                style={{ marginTop: 24, textDecoration: 'none' }}
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h1 className="auth-title">Create Admin Account</h1>

                <p className="auth-subtitle">
                  Set up administrator access for MediCore
                </p>
              </div>

              {error && (
                <div className="error-msg anim-fade-up">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>

                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group anim-fade-up anim-delay-1">
                  <label htmlFor="fullName">Full name</label>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    className="input-field"
                    placeholder="Admin Name"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group anim-fade-up anim-delay-2">
                  <label htmlFor="email">Email address</label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="input-field"
                    placeholder="admin@hospital.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group anim-fade-up anim-delay-2">
                  <label htmlFor="admin">Admin Type</label>

                  <select
                    id="admin"
                    name="admin"
                    className="input-field"
                    value={form.admin}
                    onChange={handleChange}
                    style={{ appearance: 'none' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div className="input-group anim-fade-up anim-delay-3">
                  <label htmlFor="password">Password</label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="input-field"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group anim-fade-up anim-delay-4">
                  <label htmlFor="confirm">Confirm password</label>

                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary anim-fade-up anim-delay-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spin-ring" />
                      Creating...
                    </>
                  ) : (
                    'Create Admin Account'
                  )}
                </button>
              </form>

              <p className="auth-footer-text">
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="auth-legal">
          Admin access only · MediCore Internal
        </p>
      </div>
    </div>
  )
}