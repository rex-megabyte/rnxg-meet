import { useEffect, useState } from 'react'
import {
  Calendar,
  CheckCheck,
  Clock,
  Copy,
  Fingerprint,
  LayoutDashboard,
  LogOut,
  QrCode,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'

export default function MemberDashboard({ user, onSignOut, api }) {
  const [activeTab, setActiveTab] = useState('home') // 'home' | 'meetings' | 'attendance' | 'profile'
  const [meetingsSubTab, setMeetingsSubTab] = useState('upcoming') // 'upcoming' | 'past'
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  // Genuine data from backend
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [pastMeetings, setPastMeetings] = useState([])
  const [attendanceSummary, setAttendanceSummary] = useState({
    total_meetings: 0,
    attended_count: 0,
    attendance_rate: 0,
    streak: 0,
  })
  const [attendanceHistory, setAttendanceHistory] = useState([])

  useEffect(() => {
    api('/api/meetings/upcoming')
      .then(setUpcomingMeetings)
      .catch(() => setUpcomingMeetings([]))

    api('/api/meetings/past')
      .then(setPastMeetings)
      .catch(() => setPastMeetings([]))

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
  }, [api])

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2200)
    }
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <div className="dashboard-shell">
      {/* Responsive Header / App Bar */}
      <header className="app-header">
        <div className="header-inner">
          <div
            className="header-brand"
            onClick={() => setActiveTab('home')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActiveTab('home')}
            aria-label="RNXG Meet Home"
          >
            <div className="header-logo-icon">R</div>
            <div className="header-title-wrap">
              <h2>RNXG Meet</h2>
              <span>Member Portal</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Desktop Navigation">
            <button
              type="button"
              className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
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
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {activeTab === 'home' && (
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
                  <span>Role: {user.role}</span>
                </div>
              </div>

              <div className="banner-club-tag">
                <div className="tag-eyebrow">Technical Club</div>
                <div className="tag-name">Robotics For Next Generation</div>
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
                  <p>Fast-access scanner to mark your attendance during active meetings</p>
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
              {/* Left Column: Stats & Upcoming Meetings */}
              <div className="dashboard-column">
                {/* Attendance Summary */}
                <section className="dashboard-section" aria-labelledby="summary-heading">
                  <div className="section-header">
                    <h3 id="summary-heading" className="section-title">Attendance Overview</h3>
                  </div>

                  <div className="summary-grid">
                    <div className="stat-card">
                      <div className="stat-card-title">Meetings Attended</div>
                      <div className="stat-card-value">{attendanceSummary.attended_count}</div>
                      <div className="stat-card-meta">Verified check-ins</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-title">Attendance Rate</div>
                      <div className="stat-card-value">{attendanceSummary.attendance_rate}%</div>
                      <div className="stat-card-meta">Conducted sessions</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-title">Active Streak</div>
                      <div className="stat-card-value">{attendanceSummary.streak}</div>
                      <div className="stat-card-meta">Consecutive meetings</div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-card-title">Standing</div>
                      <div className="stat-card-value" style={{ color: 'var(--golden)', fontSize: '18px' }}>
                        Good
                      </div>
                      <div className="stat-card-meta">In good standing</div>
                    </div>
                  </div>
                </section>

                {/* Upcoming Meetings Preview */}
                <section className="dashboard-section" aria-labelledby="upcoming-preview-heading">
                  <div className="section-header">
                    <h3 id="upcoming-preview-heading" className="section-title">Upcoming Meetings</h3>
                    <button
                      type="button"
                      className="text-link-btn"
                      onClick={() => {
                        setActiveTab('meetings')
                        setMeetingsSubTab('upcoming')
                      }}
                    >
                      View All
                    </button>
                  </div>

                  {upcomingMeetings.length === 0 ? (
                    <div className="empty-state">
                      <Calendar className="empty-state-icon" />
                      <div className="empty-state-title">No upcoming meetings</div>
                      <p className="empty-state-desc">
                        Official club meetings and technical sessions will appear here once scheduled.
                      </p>
                    </div>
                  ) : (
                    <ul className="meeting-list">
                      {upcomingMeetings.slice(0, 3).map((meeting) => (
                        <li key={meeting.id} className="meeting-item">
                          <div>
                            <strong>{meeting.title}</strong>
                            <p className="meeting-meta">
                              {meeting.date} • {meeting.start_time} - {meeting.end_time} • {meeting.location_name}
                            </p>
                          </div>
                          <span className="badge badge-blue">{meeting.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Recent Attendance Preview */}
                <section className="dashboard-section" aria-labelledby="recent-attendance-heading">
                  <div className="section-header">
                    <h3 id="recent-attendance-heading" className="section-title">Recent Attendance</h3>
                    <button
                      type="button"
                      className="text-link-btn"
                      onClick={() => setActiveTab('attendance')}
                    >
                      View All
                    </button>
                  </div>

                  {attendanceHistory.length === 0 ? (
                    <div className="empty-state">
                      <Clock className="empty-state-icon" />
                      <div className="empty-state-title">No attendance records yet</div>
                      <p className="empty-state-desc">
                        Your attendance timestamps will be recorded here when sessions begin.
                      </p>
                    </div>
                  ) : (
                    <ul className="meeting-list">
                      {attendanceHistory.slice(0, 3).map((rec) => (
                        <li key={rec.id} className="meeting-item">
                          <div>
                            <strong>Meeting #{rec.meeting_id}</strong>
                            <p className="meeting-meta">
                              Marked at: {new Date(rec.marked_at).toLocaleString()}
                            </p>
                          </div>
                          <span className="badge badge-green">{rec.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              {/* Right Column: Attendance ID Card & Club Policy */}
              <div className="dashboard-column">
                <aside className="member-id-card" aria-label="Member Attendance ID Card">
                  <div className="card-header-bar">
                    <h3 className="card-title">RNXG Attendance Card</h3>
                    <Fingerprint size={20} color="var(--ultramarine)" />
                  </div>

                  <div className="id-badge-box">
                    <div>
                      <div className="id-badge-subtitle">UNIQUE ATTENDANCE ID</div>
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
                            <CheckCheck size={14} color="var(--color-success-text)" />
                            <span style={{ color: 'var(--color-success-text)' }}>Copied</span>
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
                      <span className="detail-label">Email</span>
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
                      <span className="detail-label">Club Role</span>
                      <span className="detail-value">{user.role}</span>
                    </div>
                    <div className="member-detail-row" style={{ borderBottom: 'none' }}>
                      <span className="detail-label">Account Status</span>
                      <span className="detail-value" style={{ color: 'var(--color-success-text)' }}>
                        ● Active
                      </span>
                    </div>
                  </div>
                </aside>

                <aside className="dashboard-section" aria-label="Club Guidelines">
                  <h3 className="section-title" style={{ marginBottom: 12 }}>
                    Attendance Guidelines
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                    Always ensure your Attendance ID is kept private. Check into official meetings promptly during designated attendance windows using your phone browser.
                  </p>
                </aside>
              </div>
            </div>
          </>
        )}

        {/* Dedicated Meetings View (Upcoming & Past) */}
        {activeTab === 'meetings' && (
          <section className="dashboard-section" aria-labelledby="all-meetings-heading">
            <div className="section-header">
              <h2 id="all-meetings-heading" className="section-title">Club Meetings</h2>
              <div className="tab-pill-group">
                <button
                  type="button"
                  className={`tab-pill ${meetingsSubTab === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setMeetingsSubTab('upcoming')}
                >
                  Upcoming ({upcomingMeetings.length})
                </button>
                <button
                  type="button"
                  className={`tab-pill ${meetingsSubTab === 'past' ? 'active' : ''}`}
                  onClick={() => setMeetingsSubTab('past')}
                >
                  Past ({pastMeetings.length})
                </button>
              </div>
            </div>

            {meetingsSubTab === 'upcoming' ? (
              upcomingMeetings.length === 0 ? (
                <div className="empty-state">
                  <Calendar className="empty-state-icon" />
                  <div className="empty-state-title">No upcoming meetings</div>
                  <p className="empty-state-desc">
                    There are no scheduled meetings right now. New club sessions will appear here once planned by coordinators.
                  </p>
                </div>
              ) : (
                <ul className="meeting-list">
                  {upcomingMeetings.map((meeting) => (
                    <li key={meeting.id} className="meeting-item">
                      <div>
                        <strong>{meeting.title}</strong>
                        <p className="meeting-meta">
                          {meeting.date} • {meeting.start_time} - {meeting.end_time} • {meeting.location_name}
                        </p>
                        {meeting.agenda && (
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                            Agenda: {meeting.agenda}
                          </p>
                        )}
                      </div>
                      <span className="badge badge-blue">{meeting.status}</span>
                    </li>
                  ))}
                </ul>
              )
            ) : pastMeetings.length === 0 ? (
              <div className="empty-state">
                <Calendar className="empty-state-icon" />
                <div className="empty-state-title">No past meetings</div>
                <p className="empty-state-desc">
                  Completed meetings will be logged and archived here after sessions conclude.
                </p>
              </div>
            ) : (
              <ul className="meeting-list">
                {pastMeetings.map((meeting) => (
                  <li key={meeting.id} className="meeting-item">
                    <div>
                      <strong>{meeting.title}</strong>
                      <p className="meeting-meta">
                        {meeting.date} • {meeting.start_time} - {meeting.end_time} • {meeting.location_name}
                      </p>
                    </div>
                    <span className="badge badge-gray">{meeting.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Dedicated Attendance View */}
        {activeTab === 'attendance' && (
          <section className="dashboard-section" aria-labelledby="all-attendance-heading">
            <div className="section-header">
              <h2 id="all-attendance-heading" className="section-title">Attendance Records & History</h2>
            </div>

            <div className="summary-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-card-title">Attended Meetings</div>
                <div className="stat-card-value">{attendanceSummary.attended_count}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-title">Overall Percentage</div>
                <div className="stat-card-value">{attendanceSummary.attendance_rate}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-title">Streak</div>
                <div className="stat-card-value">{attendanceSummary.streak}</div>
              </div>
            </div>

            {attendanceHistory.length === 0 ? (
              <div className="empty-state">
                <Clock className="empty-state-icon" />
                <div className="empty-state-title">No attendance history</div>
                <p className="empty-state-desc">
                  Once meetings take place and attendance is marked, your complete verification log will be stored here.
                </p>
              </div>
            ) : (
              <ul className="meeting-list">
                {attendanceHistory.map((rec) => (
                  <li key={rec.id} className="meeting-item">
                    <div>
                      <strong>Meeting #{rec.meeting_id}</strong>
                      <p className="meeting-meta">
                        Marked at: {new Date(rec.marked_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="badge badge-green">{rec.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Dedicated Profile View */}
        {activeTab === 'profile' && (
          <section className="profile-card" aria-labelledby="profile-heading">
            <div className="profile-avatar-large">{userInitials}</div>
            <h2 id="profile-heading" style={{ fontSize: '24px', fontWeight: 600, marginBottom: 4 }}>
              {user.name}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              {user.email} • {user.role}
            </p>

            <div className="member-detail-list" style={{ marginBottom: 24 }}>
              <div className="member-detail-row">
                <span className="detail-label">RNXG Attendance ID</span>
                <span className="detail-value" style={{ color: 'var(--ultramarine)', fontWeight: 700 }}>
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
                <span className="detail-value" style={{ color: 'var(--color-success-text)' }}>
                  Active
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={onSignOut}
              style={{ backgroundColor: 'var(--chinese-black)' }}
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
          className={`mobile-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
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

        {/* Central Prominent Floating Scanner Action */}
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
                <QrCode size={64} color="var(--ultramarine)" />
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
