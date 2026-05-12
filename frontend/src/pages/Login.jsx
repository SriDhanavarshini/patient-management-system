import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const { error, role } = await login({ email, password })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    // Route based on role
    if (role === 'admin') {
      navigate('/admin')
    } else if (role === 'doctor') {
      navigate('/doctor/dashboard')
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
          <div className="auth-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>

          {errorMsg && (
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
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group anim-fade-up anim-delay-1">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="you@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group anim-fade-up anim-delay-2">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary anim-fade-up anim-delay-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spin-ring" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">
              Create one
            </Link>
          </p>
        </div>

        <p className="auth-legal">MediCore Internal</p>
      </div>
    </div>
  )
}