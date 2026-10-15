import { useEffect, useState } from 'react'
import {
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Mail,
  User,
} from 'lucide-react'
import MemberDashboard from './MemberDashboard'
import AdminDashboard from './AdminDashboard'

async function api(path, options = {}) {
  const { method = 'GET', body } = options
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    let msg = data.detail
    if (Array.isArray(msg)) {
      msg = msg.map((item) => item.msg || JSON.stringify(item)).join(' ')
    }
    throw new Error(msg || 'An unexpected error occurred. Please try again.')
  }
  return data
}

export default function App() {
  const [user, setUser] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [mode, setMode] = useState('login') // 'login' | 'register'

  // Form values
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regYear, setRegYear] = useState('SY')
  const [regBranch, setRegBranch] = useState('Computer Science & Engineering')

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [registrationSuccessUser, setRegistrationSuccessUser] = useState(null)

  // Verify active session on mount
  useEffect(() => {
    api('/api/auth/me')
      .then((userData) => {
        setUser(userData)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setInitialLoading(false)
      })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')
    setFormLoading(true)

    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: {
          email: loginEmail,
          password: loginPassword,
        },
      })
      setUser(data)
      setLoginPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter.')
      return
    }

    if (regPassword.length < 10) {
      setError('Password must be at least 10 characters in length.')
      return
    }

    setFormLoading(true)

    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: {
          name: regName,
          email: regEmail,
          password: regPassword,
          year: regYear,
          branch: regBranch,
        },
      })
      // Server generates unique Attendance ID and assigns default MEMBER role
      setRegistrationSuccessUser(data)
      setUser(data)
      // Reset form fields
      setRegName('')
      setRegEmail('')
      setRegPassword('')
      setRegConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore network errors on logout
    }
    setUser(null)
    setRegistrationSuccessUser(null)
    setLoginPassword('')
    setError('')
    setInfoMessage('')
  }

  // 1. Initial Authentication Check State
  if (initialLoading) {
    return (
      <div className="auth-page">
        <div className="auth-header-brand">
          <div className="auth-logo-badge">R</div>
          <div className="auth-brand-text">
            <h1>RNXG Meet</h1>
            <span>Verifying session…</span>
          </div>
        </div>
      </div>
    )
  }

  // 2. Post-Registration Screen: Assigned Unique Attendance ID Confirmation
  if (registrationSuccessUser) {
    return (
      <main className="auth-page">
        <div className="auth-header-brand">
          <div className="auth-logo-badge">R</div>
          <div className="auth-brand-text">
            <h1>RNXG Meet</h1>
            <span>Attendance Portal</span>
          </div>
        </div>

        <section className="auth-card registration-success-panel" aria-labelledby="reg-success-title">
          <div className="success-badge-icon">
            <Check size={32} />
          </div>
          <h2 id="reg-success-title" className="auth-card-title">Registration Complete!</h2>
          <p className="auth-card-subtitle">
            Welcome, <strong>{registrationSuccessUser.name}</strong>. Your account has been assigned a unique RNXG Attendance ID by the server.
          </p>

          <div className="id-display-card">
            <div className="id-display-label">
              <span>RNXG Attendance ID</span>
              <Fingerprint size={16} />
            </div>
            <div className="id-display-value">{registrationSuccessUser.attendance_id}</div>
            <div className="id-display-holder">
              Role: {registrationSuccessUser.role} • {registrationSuccessUser.branch || 'Club Member'}
            </div>
          </div>

          <p style={{ margin: '16px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            This Attendance ID is permanently associated with your club profile and will be used for roll-calls and QR verification.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setRegistrationSuccessUser(null)}
          >
            Continue to {registrationSuccessUser.role === 'ADMIN' ? 'Admin Dashboard' : 'Dashboard'}
          </button>
        </section>
      </main>
    )
  }

  // 3. Unauthenticated State: Shared Sign In & Sign Up Views
  if (!user) {
    return (
      <main className="auth-page">
        <header className="auth-header-brand">
          <div className="auth-logo-badge">R</div>
          <div className="auth-brand-text">
            <h1>RNXG Meet</h1>
            <span>Technical Club Portal</span>
          </div>
        </header>

        <section className="auth-card" aria-labelledby="auth-card-heading">
          <h2 id="auth-card-heading" className="auth-card-title">
            {mode === 'login' ? 'Sign In to RNXG Meet' : 'Create Member Account'}
          </h2>
          <p className="auth-card-subtitle">
            {mode === 'login'
              ? 'Enter your credentials to access your attendance and meetings.'
              : 'Register your membership to receive your unique RNXG Attendance ID.'}
          </p>

          {error && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: 16 }}>
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="alert alert-info" role="status" style={{ marginBottom: 16 }}>
              <span>{infoMessage}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Email Address
                </label>
                <div className="input-container">
                  <Mail className="input-icon" size={18} />
                  <input
                    id="login-email"
                    type="email"
                    className="form-input"
                    placeholder="member@rnxg.org or admin@rnxg.org"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-label">
                  <label htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() =>
                      setInfoMessage(
                        'Password reset is managed by club administrators. Please contact your coordinator or tech lead.'
                      )
                    }
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-container">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={formLoading}>
                {formLoading ? 'Signing In…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">
                  Full Name
                </label>
                <div className="input-container">
                  <User className="input-icon" size={18} />
                  <input
                    id="reg-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Priyanshu Satone"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  Email Address
                </label>
                <div className="input-container">
                  <Mail className="input-icon" size={18} />
                  <input
                    id="reg-email"
                    type="email"
                    className="form-input"
                    placeholder="you@rnxg.org"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-year">
                    Year
                  </label>
                  <select
                    id="reg-year"
                    className="form-select"
                    value={regYear}
                    onChange={(e) => setRegYear(e.target.value)}
                  >
                    <option value="FY">FY (1st Year)</option>
                    <option value="SY">SY (2nd Year)</option>
                    <option value="TY">TY (3rd Year)</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-branch">
                    Branch
                  </label>
                  <select
                    id="reg-branch"
                    className="form-select"
                    value={regBranch}
                    onChange={(e) => setRegBranch(e.target.value)}
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Telecommunication">EXTC</option>
                    <option value="Electrical Engineering">Electrical</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                    <option value="Chemical Engineering">Chemical</option>
                    <option value="Production Engineering">Production</option>
                    <option value="Instrumentation Engineering">Instrumentation</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  Password (min 10 characters)
                </label>
                <div className="input-container">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm-password">
                  Confirm Password
                </label>
                <div className="input-container">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={formLoading}>
                {formLoading ? 'Creating Account…' : 'Register & Assign Attendance ID'}
              </button>
            </form>
          )}

          <div className="auth-switch">
            {mode === 'login' ? (
              <>
                Don’t have an RNXG account?
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => {
                    setMode('register')
                    setError('')
                    setInfoMessage('')
                  }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already registered?
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => {
                    setMode('login')
                    setError('')
                    setInfoMessage('')
                  }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    )
  }

  // 4. Authenticated State: Role-Based Routing
  // Admin -> AdminDashboard, Members -> MemberDashboard
  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} onSignOut={handleSignOut} api={api} />
  }

  return <MemberDashboard user={user} onSignOut={handleSignOut} api={api} />
}
