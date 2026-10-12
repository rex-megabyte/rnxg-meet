import { useEffect, useState } from 'react'
import {
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  QrCode,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'

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
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'meetings' | 'attendance' | 'profile'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [registrationSuccessUser, setRegistrationSuccessUser] = useState(null)

  // Genuine dashboard data from backend
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [attendanceSummary, setAttendanceSummary] = useState({
    total_meetings: 0,
    attended_count: 0,
    attendance_rate: 0,
    streak: 0,
  })
  const [attendanceHistory, setAttendanceHistory] = useState([])

  // Check initial authentication
  useEffect(() => {
    api('/api/auth/me')
      .then((userData) => {
        setUser(userData)
      })
      .catch(() => {
        setUser(null)
      })
  }, [])

  // Load backend dashboard data when authenticated
  useEffect(() => {
    if (user) {
      api('/api/meetings/upcoming')
        .then(setUpcomingMeetings)
        .catch(() => setUpcomingMeetings([]))

      api('/api/attendance/summary')
        .then(setAttendanceSummary)
        .catch(() =>
          setAttendanceSummary({
            total_meetings: 0,
            attended_count: 0,
            attendance_rate: 0,
            streak: 0,
          })
        )

      api('/api/attendance/history')
        .then(setAttendanceHistory)
        .catch(() => setAttendanceHistory([]))
    }
  }, [user])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')
    setLoading(true)

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
      setLoading(false)
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

    setLoading(true)

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
      // Server generates Attendance ID and assigns MEMBER role
      setRegistrationSuccessUser(data)
      setUser(data)
      // Reset form
      setRegName('')
      setRegEmail('')
      setRegPassword('')
      setRegConfirmPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
    setActiveTab('dashboard')
    setLoginPassword('')
    setError('')
    setInfoMessage('')
  }

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2200)
    }
  }

  // 1. Success Registration Screen: Present Assigned Unique RNXG Attendance ID
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

          <p style={{ margin: '16px 0', fontSize: '13px', color: '#5A5A5A' }}>
            This Attendance ID is permanently associated with your club profile and will be used for roll-calls and QR verification.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setRegistrationSuccessUser(null)}
          >
            Continue to Dashboard
          </button>
        </section>
      </main>
    )
  }

  // 2. Unauthenticated State: Sign In or Sign Up Page
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
                    placeholder="member@rnxg.org"
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

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing In…' : 'Sign In'}
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

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating Account…' : 'Register & Assign Attendance ID'}
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

  // 3. Authenticated State: Dashboard & Navigation Structure
  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <div className="app-container">
      <div className="dashboard-shell">
        {/* Responsive Header / App Bar */}
        <header className="app-header">
          <div className="header-inner">
            <div
              className="header-brand"
              onClick={() => setActiveTab('dashboard')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveTab('dashboard')}
            >
              <div className="header-logo-icon">R</div>
              <div className="header-title-wrap">
                <h2>RNXG Meet</h2>
                <span>Attendance System</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="desktop-nav" aria-label="Desktop Navigation">
              <button
                type="button"
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`nav-link ${activeTab === 'meetings' ? 'active' : ''}`}
                onClick={() => setActiveTab('meetings')}
              >
                <Calendar size={16} />
                <span>Meetings</span>
              </button>

              <button
                type="button"
                className={`nav-link ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                <Clock size={16} />
                <span>Attendance</span>
              </button>

              <button
                type="button"
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={16} />
                <span>Profile</span>
              </button>
            </nav>

            {/* Header User Actions */}
            <div className="header-actions">
              <div className="user-badge" title={user.email}>
                <div className="user-avatar">{userInitials}</div>
                <span className="user-name-text">{user.name.split(' ')[0]}</span>
              </div>

              <button
                type="button"
                className="btn-signout"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content Area */}
        <main className="dashboard-content">
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome Banner */}
              <section className="welcome-banner" aria-label="Welcome User">
                <div className="welcome-info">
                  <h1>Welcome back, {user.name}</h1>
                  <p>
                    {user.year ? `${user.year} • ` : ''}
                    {user.branch || 'Club Member'}
                  </p>
                  <div className="user-role-pill">
                    <ShieldCheck size={14} />
                    <span>Role: {user.role === 'ADMIN' ? 'Admin / TY Senior' : user.role}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#EF9D00', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                    Club Membership
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                    Robotics For Next Generation
                  </div>
                </div>
              </section>

              {/* Prominent Scanner Action Banner */}
              <section className="scanner-banner-card" aria-label="Attendance QR Scanner">
                <div className="scanner-banner-info">
                  <div className="scanner-icon-bubble">
                    <QrCode size={28} />
                  </div>
                  <div className="scanner-banner-text">
                    <h3>Scan Attendance QR</h3>
                    <p>Quick-access scanner to mark attendance during active meetings</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-scan-trigger"
                  onClick={() => setShowScanner(true)}
                >
                  <QrCode size={18} />
                  <span>Open Scanner</span>
                </button>
              </section>

              {/* Two Column Grid */}
              <div className="dashboard-grid">
                {/* Left Column: Stats, Upcoming Meetings, Recent Attendance */}
                <div className="dashboard-column">
                  {/* Attendance Summary Cards */}
                  <section className="dashboard-section" aria-labelledby="summary-heading">
                    <div className="section-header">
                      <h3 id="summary-heading" className="section-title">Attendance Overview</h3>
                    </div>

                    <div className="summary-grid">
                      <div className="stat-card">
                        <div className="stat-card-title">Meetings Attended</div>
                        <div className="stat-card-value">{attendanceSummary.attended_count}</div>
                        <div className="stat-card-meta">Total verified check-ins</div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-card-title">Attendance Rate</div>
                        <div className="stat-card-value">{attendanceSummary.attendance_rate}%</div>
                        <div className="stat-card-meta">Eligible sessions</div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-card-title">Active Streak</div>
                        <div className="stat-card-value">{attendanceSummary.streak}</div>
                        <div className="stat-card-meta">Consecutive meetings</div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-card-title">Standing</div>
                        <div className="stat-card-value" style={{ color: '#EF9D00', fontSize: '18px' }}>
                          Good
                        </div>
                        <div className="stat-card-meta">Club member in good standing</div>
                      </div>
                    </div>
                  </section>

                  {/* Upcoming Meetings */}
                  <section className="dashboard-section" aria-labelledby="upcoming-meetings-heading">
                    <div className="section-header">
                      <h3 id="upcoming-meetings-heading" className="section-title">Upcoming Meetings</h3>
                    </div>

                    {upcomingMeetings.length === 0 ? (
                      <div className="empty-state">
                        <Calendar className="empty-state-icon" />
                        <div className="empty-state-title">No upcoming meetings</div>
                        <p className="empty-state-desc">
                          Official club meetings and technical sessions will appear here once scheduled by coordinators.
                        </p>
                      </div>
                    ) : (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {upcomingMeetings.map((meeting) => (
                          <li
                            key={meeting.id}
                            style={{
                              padding: '12px 16px',
                              border: '1px solid #DEDEDE',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '15px' }}>{meeting.title}</strong>
                              <p style={{ fontSize: '12px', color: '#5A5A5A', marginTop: 4 }}>
                                {meeting.date} • {meeting.start_time} - {meeting.end_time} • {meeting.location_name}
                              </p>
                            </div>
                            <span
                              style={{
                                background: '#EBF3FF',
                                color: '#3670FF',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {meeting.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  {/* Recent Attendance / History */}
                  <section className="dashboard-section" aria-labelledby="attendance-history-heading">
                    <div className="section-header">
                      <h3 id="attendance-history-heading" className="section-title">Recent Attendance History</h3>
                    </div>

                    {attendanceHistory.length === 0 ? (
                      <div className="empty-state">
                        <Clock className="empty-state-icon" />
                        <div className="empty-state-title">No attendance records yet</div>
                        <p className="empty-state-desc">
                          Your attendance check-ins and timestamps will be logged here once meetings commence.
                        </p>
                      </div>
                    ) : (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {attendanceHistory.map((rec) => (
                          <li
                            key={rec.id}
                            style={{
                              padding: '12px 16px',
                              border: '1px solid #DEDEDE',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <strong>Meeting #{rec.meeting_id}</strong>
                              <p style={{ fontSize: '12px', color: '#5A5A5A', marginTop: 4 }}>
                                Marked at: {new Date(rec.marked_at).toLocaleString()}
                              </p>
                            </div>
                            <span
                              style={{
                                background: '#E8F5E9',
                                color: '#1B5E20',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {rec.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>

                {/* Right Column: Member Attendance ID Card & Club Quick Info */}
                <div className="dashboard-column">
                  <aside className="member-id-card" aria-label="Member Attendance ID Card">
                    <div className="card-header-bar">
                      <h3 className="card-title">RNXG Attendance Card</h3>
                      <Fingerprint size={20} color="#3670FF" />
                    </div>

                    <div className="id-badge-box">
                      <div>
                        <div style={{ fontSize: '11px', color: '#5A5A5A', fontWeight: 600 }}>
                          UNIQUE ATTENDANCE ID
                        </div>
                        <div className="id-badge-code">{user.attendance_id || 'Not Assigned'}</div>
                      </div>

                      {user.attendance_id && (
                        <button
                          type="button"
                          className="btn-copy-id"
                          onClick={() => copyToClipboard(user.attendance_id)}
                          title="Copy Attendance ID"
                        >
                          {copyFeedback ? (
                            <>
                              <CheckCheck size={14} color="#1B5E20" />
                              <span style={{ color: '#1B5E20' }}>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="member-detail-list">
                      <div className="member-detail-row">
                        <span className="detail-label">Member Name</span>
                        <span className="detail-value">{user.name}</span>
                      </div>
                      <div className="member-detail-row">
                        <span className="detail-label">Registered Email</span>
                        <span className="detail-value">{user.email}</span>
                      </div>
                      <div className="member-detail-row">
                        <span className="detail-label">Academic Year</span>
                        <span className="detail-value">{user.year || 'N/A'}</span>
                      </div>
                      <div className="member-detail-row">
                        <span className="detail-label">Branch</span>
                        <span className="detail-value">{user.branch || 'N/A'}</span>
                      </div>
                      <div className="member-detail-row">
                        <span className="detail-label">System Role</span>
                        <span className="detail-value">
                          {user.role === 'ADMIN' ? 'Admin / TY Senior' : user.role}
                        </span>
                      </div>
                      <div className="member-detail-row" style={{ borderBottom: 'none' }}>
                        <span className="detail-label">Status</span>
                        <span className="detail-value" style={{ color: '#1B5E20' }}>
                          ● Active
                        </span>
                      </div>
                    </div>
                  </aside>

                  {/* Club Guidelines Card */}
                  <aside className="dashboard-section" aria-label="Club Guidelines">
                    <h3 className="section-title" style={{ marginBottom: 12 }}>
                      Attendance Policy
                    </h3>
                    <p style={{ fontSize: '13px', color: '#5A5A5A', lineHeight: '1.6' }}>
                      Members must mark attendance during designated check-in windows using their unique Attendance ID or by scanning the session QR code. Unexcused consecutive absences will trigger review by TY seniors.
                    </p>
                  </aside>
                </div>
              </div>
            </>
          )}

          {/* Dedicated Meetings View */}
          {activeTab === 'meetings' && (
            <section className="dashboard-section" aria-labelledby="all-meetings-heading">
              <div className="section-header">
                <h2 id="all-meetings-heading" className="section-title">Club Meetings</h2>
              </div>
              <div className="empty-state">
                <Calendar className="empty-state-icon" />
                <div className="empty-state-title">No meetings available</div>
                <p className="empty-state-desc">
                  You are up to date. New meeting announcements and agendas will be published here.
                </p>
              </div>
            </section>
          )}

          {/* Dedicated Attendance View */}
          {activeTab === 'attendance' && (
            <section className="dashboard-section" aria-labelledby="all-attendance-heading">
              <div className="section-header">
                <h2 id="all-attendance-heading" className="section-title">Attendance History</h2>
              </div>
              <div className="empty-state">
                <Clock className="empty-state-icon" />
                <div className="empty-state-title">No attendance history</div>
                <p className="empty-state-desc">
                  Once you attend official or technical club meetings, your attendance history and verification stamps will be recorded here.
                </p>
              </div>
            </section>
          )}

          {/* Dedicated Profile View */}
          {activeTab === 'profile' && (
            <section className="profile-card" aria-labelledby="profile-heading">
              <div className="profile-avatar-large">{userInitials}</div>
              <h2 id="profile-heading" style={{ fontSize: '24px', fontWeight: 600, marginBottom: 4 }}>
                {user.name}
              </h2>
              <p style={{ color: '#5A5A5A', marginBottom: 20 }}>
                {user.email} • {user.role === 'ADMIN' ? 'Admin / TY Senior' : user.role}
              </p>

              <div className="member-detail-list" style={{ marginBottom: 24 }}>
                <div className="member-detail-row">
                  <span className="detail-label">RNXG Attendance ID</span>
                  <span className="detail-value" style={{ color: '#3670FF', fontWeight: 700 }}>
                    {user.attendance_id || 'Not Assigned'}
                  </span>
                </div>
                <div className="member-detail-row">
                  <span className="detail-label">Academic Year</span>
                  <span className="detail-value">{user.year || 'N/A'}</span>
                </div>
                <div className="member-detail-row">
                  <span className="detail-label">Branch</span>
                  <span className="detail-value">{user.branch || 'N/A'}</span>
                </div>
                <div className="member-detail-row">
                  <span className="detail-label">Account Status</span>
                  <span className="detail-value" style={{ color: '#1B5E20' }}>
                    Active
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={handleSignOut}
                style={{ backgroundColor: '#171717' }}
              >
                <LogOut size={16} />
                <span>Sign Out from RNXG Meet</span>
              </button>
            </section>
          )}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <button
            type="button"
            className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-btn ${activeTab === 'meetings' ? 'active' : ''}`}
            onClick={() => setActiveTab('meetings')}
          >
            <Calendar size={20} />
            <span>Meetings</span>
          </button>

          {/* Central Prominent Scanner Action */}
          <button
            type="button"
            className="mobile-nav-scan"
            onClick={() => setShowScanner(true)}
            aria-label="Scan QR Code"
          >
            <QrCode size={24} />
          </button>

          <button
            type="button"
            className={`mobile-nav-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Clock size={20} />
            <span>Attendance</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            <span>Profile</span>
          </button>
        </nav>
      </div>

      {/* Scanner Visual Entry Point Modal */}
      {showScanner && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="scanner-modal-title">
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="scanner-modal-title">QR Attendance Scanner</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowScanner(false)}
                aria-label="Close scanner"
              >
                <X size={20} />
              </button>
            </div>

            <div className="scanner-viewfinder">
              <div className="scanner-reticle">
                <QrCode size={64} color="#3670FF" />
              </div>
            </div>

            <p className="scanner-status-text">
              Point your camera at the meeting attendance QR code. The scanner entry point is ready and will automatically verify codes during active meeting check-in windows.
            </p>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowScanner(false)}
            >
              Close Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
