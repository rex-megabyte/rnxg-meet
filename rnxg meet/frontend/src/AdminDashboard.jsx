import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react'

export default function AdminDashboard({ user, onSignOut, api }) {
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'members' | 'meetings' | 'approvals' | 'attendance' | 'warnings' | 'reports' | 'profile'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Data states
  const [overview, setOverview] = useState({
    total_members: 0,
    total_meetings: 0,
    pending_approvals: 0,
    upcoming_meetings: 0,
    total_attendance_records: 0,
    warning_count: 0,
  })
  const [members, setMembers] = useState([])
  const [meetings, setMeetings] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)

  // Filter & Search states
  const [memberSearch, setMemberSearch] = useState('')
  const [memberYearFilter, setMemberYearFilter] = useState('ALL')
  const [meetingFilter, setMeetingFilter] = useState('ALL')

  const [loading, setLoading] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api('/api/admin/overview').then(setOverview).catch(() => {}),
      api('/api/admin/members').then(setMembers).catch(() => setMembers([])),
      api('/api/admin/meetings').then(setMeetings).catch(() => setMeetings([])),
      api('/api/admin/attendance').then(setAttendanceRecords).catch(() => setAttendanceRecords([])),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.attendance_id?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.branch?.toLowerCase().includes(memberSearch.toLowerCase())
    const matchesYear = memberYearFilter === 'ALL' || m.year === memberYearFilter
    return matchesSearch && matchesYear
  })

  // Filtered meetings
  const filteredMeetings = meetings.filter((m) => {
    if (meetingFilter === 'ALL') return true
    return m.status?.toUpperCase() === meetingFilter.toUpperCase()
  })

  // Pending meeting approval requests
  const pendingMeetings = meetings.filter(
    (m) => m.status === 'PENDING_APPROVAL' || m.status === 'DRAFT'
  )

  const handleNavClick = (tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'A'

  return (
    <div className="admin-shell">
      {/* Top Navbar on Mobile & Tablet */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <button
            type="button"
            className="btn-icon-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="header-logo-icon">R</div>
          <div className="admin-topbar-brand">
            <h2>RNXG Meet</h2>
            <span className="admin-badge-gold">ADMIN</span>
          </div>
        </div>

        <div className="admin-topbar-right">
          <div className="user-badge" title={user.email}>
            <div className="user-avatar" style={{ background: 'var(--golden)' }}>
              {userInitials}
            </div>
            <span className="user-name-text">{user.name.split(' ')[0]}</span>
          </div>
          <button
            type="button"
            className="btn-signout"
            onClick={onSignOut}
            aria-label="Sign out"
          >
            <LogOut size={14} />
            <span className="hide-on-mobile">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* Responsive Sidebar */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`} aria-label="Admin Navigation">
          <div className="sidebar-brand-box">
            <div className="header-logo-icon">R</div>
            <div>
              <h3>RNXG Meet</h3>
              <span>Control Panel</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => handleNavClick('overview')}
            >
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => handleNavClick('members')}
            >
              <Users size={18} />
              <span>Members ({members.length})</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
              onClick={() => handleNavClick('meetings')}
            >
              <Calendar size={18} />
              <span>Meetings ({meetings.length})</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'approvals' ? 'active' : ''}`}
              onClick={() => handleNavClick('approvals')}
            >
              <CheckCircle2 size={18} />
              <span>Approvals ({pendingMeetings.length})</span>
              {pendingMeetings.length > 0 && (
                <span className="badge-count">{pendingMeetings.length}</span>
              )}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => handleNavClick('attendance')}
            >
              <Clock size={18} />
              <span>Attendance Logs ({attendanceRecords.length})</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'warnings' ? 'active' : ''}`}
              onClick={() => handleNavClick('warnings')}
            >
              <AlertTriangle size={18} />
              <span>Absence Warnings</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => handleNavClick('reports')}
            >
              <FileText size={18} />
              <span>Reports</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleNavClick('profile')}
            >
              <User size={18} />
              <span>My Profile</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-admin-info">
              <Shield size={14} color="var(--golden)" />
              <span>Authenticated as Administrator</span>
            </div>
            <button
              type="button"
              className="btn-sidebar-signout"
              onClick={onSignOut}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile backdrop for drawer */}
        {mobileMenuOpen && (
          <div
            className="mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content Viewport */}
        <main className="admin-content" tabIndex={-1}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h1 className="pane-title">Administrative Overview</h1>
                  <p className="pane-subtitle">
                    System operations, member count, scheduled meetings, and attendance audit metrics.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={loadData}
                  disabled={loading}
                >
                  {loading ? 'Refreshing…' : 'Refresh Data'}
                </button>
              </div>

              {/* Status Alert Banner */}
              <div className="admin-status-banner">
                <div className="status-banner-content">
                  <Shield size={22} color="var(--golden)" />
                  <div>
                    <strong>Administrative Operational Authority Active</strong>
                    <p>
                      Full authority to inspect club rosters, review meeting schedules, oversee attendance verification records, and monitor member absences.
                    </p>
                  </div>
                </div>
              </div>

              {/* Metric KPI Cards */}
              <div className="admin-kpi-grid">
                <div className="kpi-card" onClick={() => setActiveTab('members')} role="button" tabIndex={0}>
                  <div className="kpi-icon-box" style={{ background: '#EBF3FF', color: 'var(--ultramarine)' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div className="kpi-value">{overview.total_members}</div>
                    <div className="kpi-title">Total Registered Members</div>
                  </div>
                </div>

                <div className="kpi-card" onClick={() => setActiveTab('meetings')} role="button" tabIndex={0}>
                  <div className="kpi-icon-box" style={{ background: '#FFF7E6', color: 'var(--golden)' }}>
                    <Calendar size={22} />
                  </div>
                  <div>
                    <div className="kpi-value">{overview.total_meetings}</div>
                    <div className="kpi-title">Total Club Meetings</div>
                  </div>
                </div>

                <div className="kpi-card" onClick={() => setActiveTab('approvals')} role="button" tabIndex={0}>
                  <div className="kpi-icon-box" style={{ background: '#FDEDED', color: 'var(--color-danger-text)' }}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <div className="kpi-value">{overview.pending_approvals}</div>
                    <div className="kpi-title">Pending Approvals</div>
                  </div>
                </div>

                <div className="kpi-card" onClick={() => setActiveTab('attendance')} role="button" tabIndex={0}>
                  <div className="kpi-icon-box" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <div className="kpi-value">{overview.total_attendance_records}</div>
                    <div className="kpi-title">Total Attendance Check-ins</div>
                  </div>
                </div>
              </div>

              {/* Quick Split View: Pending Approvals & Upcoming Meetings */}
              <div className="dashboard-grid" style={{ marginTop: 24 }}>
                <section className="dashboard-section">
                  <div className="section-header">
                    <h3 className="section-title">Meetings Awaiting Approval</h3>
                    <button
                      type="button"
                      className="text-link-btn"
                      onClick={() => setActiveTab('approvals')}
                    >
                      View All
                    </button>
                  </div>

                  {pendingMeetings.length === 0 ? (
                    <div className="empty-state">
                      <CheckCircle2 className="empty-state-icon" style={{ color: 'var(--color-success-text)' }} />
                      <div className="empty-state-title">No pending requests</div>
                      <p className="empty-state-desc">
                        All submitted coordinator meeting requests have been reviewed and approved.
                      </p>
                    </div>
                  ) : (
                    <ul className="meeting-list">
                      {pendingMeetings.slice(0, 3).map((m) => (
                        <li key={m.id} className="meeting-item">
                          <div>
                            <strong>{m.title}</strong>
                            <p className="meeting-meta">
                              {m.date} • {m.start_time} - {m.end_time} • {m.location_name}
                            </p>
                          </div>
                          <span className="badge badge-yellow">{m.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="dashboard-section">
                  <div className="section-header">
                    <h3 className="section-title">Upcoming Club Sessions</h3>
                    <button
                      type="button"
                      className="text-link-btn"
                      onClick={() => setActiveTab('meetings')}
                    >
                      Manage Meetings
                    </button>
                  </div>

                  {meetings.filter((m) => m.status === 'UPCOMING' || m.status === 'APPROVED').length === 0 ? (
                    <div className="empty-state">
                      <Calendar className="empty-state-icon" />
                      <div className="empty-state-title">No upcoming meetings</div>
                      <p className="empty-state-desc">
                        No upcoming sessions currently on schedule.
                      </p>
                    </div>
                  ) : (
                    <ul className="meeting-list">
                      {meetings
                        .filter((m) => m.status === 'UPCOMING' || m.status === 'APPROVED')
                        .slice(0, 3)
                        .map((m) => (
                          <li key={m.id} className="meeting-item">
                            <div>
                              <strong>{m.title}</strong>
                              <p className="meeting-meta">
                                {m.date} • {m.start_time} - {m.end_time} • {m.location_name}
                              </p>
                            </div>
                            <span className="badge badge-blue">{m.status}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBER MANAGEMENT */}
          {activeTab === 'members' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h1 className="pane-title">Member Management</h1>
                  <p className="pane-subtitle">
                    Registered technical club members, assigned Attendance IDs, and academic affiliations.
                  </p>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="admin-toolbar">
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, email, attendance ID, or branch…"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="toolbar-input"
                  />
                  {memberSearch && (
                    <button
                      type="button"
                      className="btn-clear-search"
                      onClick={() => setMemberSearch('')}
                      aria-label="Clear Search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="filter-dropdown-box">
                  <Filter size={16} color="var(--color-text-muted)" />
                  <select
                    value={memberYearFilter}
                    onChange={(e) => setMemberYearFilter(e.target.value)}
                    className="toolbar-select"
                  >
                    <option value="ALL">All Academic Years</option>
                    <option value="FY">FY (1st Year)</option>
                    <option value="SY">SY (2nd Year)</option>
                    <option value="TY">TY (3rd Year)</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>
              </div>

              {/* Responsive Members Table with Horizontal Scroll Wrap */}
              <div className="table-responsive-wrapper">
                <table className="admin-data-table" aria-label="Club Members Table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Attendance ID</th>
                      <th>Email Address</th>
                      <th>Year / Branch</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                          <div className="empty-state" style={{ background: 'transparent', border: 'none' }}>
                            <Users className="empty-state-icon" />
                            <div className="empty-state-title">No members found</div>
                            <p className="empty-state-desc">
                              No members match your search or filter criteria.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <strong>{m.name}</strong>
                          </td>
                          <td>
                            <span className="code-pill">{m.attendance_id || 'Unassigned'}</span>
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>{m.email}</td>
                          <td>
                            {m.year || 'N/A'} • {m.branch || 'General'}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                m.role === 'ADMIN'
                                  ? 'badge-gold'
                                  : m.role === 'COORDINATOR'
                                  ? 'badge-blue'
                                  : 'badge-gray'
                              }`}
                            >
                              {m.role}
                            </span>
                          </td>
                          <td>
                            <span className="status-dot-active">● Active</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-table-action"
                              onClick={() => setSelectedMember(m)}
                              title="View Member Details"
                            >
                              <Eye size={14} />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MEETING MANAGEMENT */}
          {activeTab === 'meetings' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h1 className="pane-title">Meeting Management</h1>
                  <p className="pane-subtitle">
                    Oversee official club meetings, agendas, schedules, and attendance session states.
                  </p>
                </div>
              </div>

              {/* Status Filter */}
              <div className="admin-toolbar">
                <div className="tab-pill-group">
                  {['ALL', 'UPCOMING', 'APPROVED', 'ATTENDANCE_OPEN', 'COMPLETED', 'CLOSED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`tab-pill ${meetingFilter === st ? 'active' : ''}`}
                      onClick={() => setMeetingFilter(st)}
                    >
                      {st === 'ALL' ? 'All Meetings' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMeetings.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 20 }}>
                  <Calendar className="empty-state-icon" />
                  <div className="empty-state-title">No meetings found</div>
                  <p className="empty-state-desc">
                    There are no meetings matching the "{meetingFilter}" filter.
                  </p>
                </div>
              ) : (
                <div className="table-responsive-wrapper" style={{ marginTop: 20 }}>
                  <table className="admin-data-table" aria-label="Meeting Management Table">
                    <thead>
                      <tr>
                        <th>Meeting Title</th>
                        <th>Type</th>
                        <th>Target Audience</th>
                        <th>Date & Time</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMeetings.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <strong>{m.title}</strong>
                            {m.agenda && (
                              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                {m.agenda}
                              </p>
                            )}
                          </td>
                          <td>{m.type}</td>
                          <td>
                            <span className="badge badge-gray">{m.target_audience}</span>
                          </td>
                          <td>
                            {m.date} ({m.start_time} - {m.end_time})
                          </td>
                          <td>{m.location_name}</td>
                          <td>
                            <span
                              className={`badge ${
                                m.status === 'UPCOMING' || m.status === 'APPROVED'
                                  ? 'badge-blue'
                                  : m.status === 'ATTENDANCE_OPEN'
                                  ? 'badge-green'
                                  : m.status === 'COMPLETED'
                                  ? 'badge-gray'
                                  : 'badge-yellow'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MEETING APPROVALS */}
          {activeTab === 'approvals' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h1 className="pane-title">Meeting Requests & Approvals</h1>
                  <p className="pane-subtitle">
                    Review and authorize meeting requests created by club coordinators before attendance sessions open.
                  </p>
                </div>
              </div>

              {pendingMeetings.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 20 }}>
                  <CheckCircle2 className="empty-state-icon" style={{ color: 'var(--color-success-text)' }} />
                  <div className="empty-state-title">No pending meeting requests</div>
                  <p className="empty-state-desc">
                    All meeting requests have been reviewed and approved. When coordinators submit new sessions, they will be queued here for authorization.
                  </p>
                </div>
              ) : (
                <div className="table-responsive-wrapper" style={{ marginTop: 20 }}>
                  <table className="admin-data-table" aria-label="Meeting Requests Table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Audience</th>
                        <th>Date & Time</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMeetings.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <strong>{m.title}</strong>
                          </td>
                          <td>{m.type}</td>
                          <td>{m.target_audience}</td>
                          <td>
                            {m.date} ({m.start_time} - {m.end_time})
                          </td>
                          <td>{m.location_name}</td>
                          <td>
                            <span className="badge badge-yellow">{m.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ATTENDANCE RECORDS */}
          {activeTab === 'attendance' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h1 className="pane-title">Attendance Records & Logs</h1>
                  <p className="pane-subtitle">
                    Centralized audit trail of all attendance check-ins, member timestamps, and verification states.
                  </p>
                </div>
              </div>

              {attendanceRecords.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 20 }}>
                  <Clock className="empty-state-icon" />
                  <div className="empty-state-title">No attendance records recorded yet</div>
                  <p className="empty-state-desc">
                    Attendance records will be compiled in this audit log as members check in during active meetings.
                  </p>
                </div>
              ) : (
                <div className="table-responsive-wrapper" style={{ marginTop: 20 }}>
                  <table className="admin-data-table" aria-label="Attendance Records Table">
                    <thead>
                      <tr>
                        <th>Record ID</th>
                        <th>Meeting Title</th>
                        <th>Member Name</th>
                        <th>Attendance ID</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((r) => (
                        <tr key={r.id}>
                          <td>#{r.id}</td>
                          <td>
                            <strong>{r.meeting_title}</strong>
                          </td>
                          <td>{r.user_name}</td>
                          <td>
                            <span className="code-pill">{r.user_attendance_id || 'N/A'}</span>
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>
                            {new Date(r.marked_at).toLocaleString()}
                          </td>
                          <td>
                            <span className="badge badge-green">{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ABSENCE & WARNINGS */}
          {activeTab === 'warnings' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h1 className="pane-title">Absence & Streak Warnings</h1>
                  <p className="pane-subtitle">
                    Consecutive absence detection monitoring per club policy (2 absences: Warning, 3 absences: Critical review).
                  </p>
                </div>
              </div>

              <div className="empty-state" style={{ marginTop: 20 }}>
                <CheckCircle2 className="empty-state-icon" style={{ color: 'var(--color-success-text)' }} />
                <div className="empty-state-title">All members are currently in good standing</div>
                <p className="empty-state-desc">
                  No consecutive absence warnings or critical flags are active at this time. When members miss consecutive mandatory meetings, alerts will be flagged here for TY senior review.
                </p>
              </div>
            </div>
          )}

          {/* TAB 7: REPORTS */}
          {activeTab === 'reports' && (
            <div className="tab-pane">
              <div className="pane-header">
                <div>
                  <h1 className="pane-title">Club Compliance & Reports</h1>
                  <p className="pane-subtitle">
                    Generate official club attendance sheets and member activity records.
                  </p>
                </div>
              </div>

              <section className="dashboard-section" style={{ marginTop: 20, textAlign: 'center', padding: '48px 24px' }}>
                <FileText size={48} color="var(--ultramarine)" style={{ margin: '0 auto 16px' }} />
                <h3 className="section-title">Reporting Module</h3>
                <p style={{ maxWidth: '460px', margin: '12px auto 24px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  Attendance reporting, CSV/PDF exports, and member compliance tracking are planned for the upcoming V2 milestone. Current audit data remains accessible via the Attendance Logs view.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ maxWidth: '220px', margin: '0 auto' }}
                  onClick={() => setActiveTab('attendance')}
                >
                  View Attendance Logs
                </button>
              </section>
            </div>
          )}

          {/* TAB 8: PROFILE */}
          {activeTab === 'profile' && (
            <div className="tab-pane">
              <section className="profile-card" aria-labelledby="admin-profile-heading">
                <div className="profile-avatar-large">{userInitials}</div>
                <h2 id="admin-profile-heading" style={{ fontSize: '24px', fontWeight: 600, marginBottom: 4 }}>
                  {user.name}
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                  {user.email} • Admin / TY Senior
                </p>

                <div className="member-detail-list" style={{ marginBottom: 24 }}>
                  <div className="member-detail-row">
                    <span className="detail-label">RNXG Attendance ID</span>
                    <span className="detail-value" style={{ color: 'var(--ultramarine)', fontWeight: 700 }}>
                      {user.attendance_id || 'RNXG-ADMIN01'}
                    </span>
                  </div>
                  <div className="member-detail-row">
                    <span className="detail-label">Designation / Role</span>
                    <span className="detail-value" style={{ color: 'var(--golden)', fontWeight: 600 }}>
                      Admin / TY Senior (Operational Authority)
                    </span>
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
            </div>
          )}
        </main>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="member-modal-title">
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="member-modal-title">Member Details</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedMember(null)}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="member-detail-list" style={{ margin: '16px 0 24px' }}>
              <div className="member-detail-row">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{selectedMember.name}</span>
              </div>
              <div className="member-detail-row">
                <span className="detail-label">Attendance ID</span>
                <span className="detail-value" style={{ color: 'var(--ultramarine)', fontWeight: 700 }}>
                  {selectedMember.attendance_id || 'Unassigned'}
                </span>
              </div>
              <div className="member-detail-row">
                <span className="detail-label">Email Address</span>
                <span className="detail-value">{selectedMember.email}</span>
              </div>
              <div className="member-detail-row">
                <span className="detail-label">Academic Year</span>
                <span className="detail-value">{selectedMember.year || 'N/A'}</span>
              </div>
              <div className="member-detail-row">
                <span className="detail-label">Branch</span>
                <span className="detail-value">{selectedMember.branch || 'N/A'}</span>
              </div>
              <div className="member-detail-row">
                <span className="detail-label">System Role</span>
                <span className="detail-value">{selectedMember.role}</span>
              </div>
              <div className="member-detail-row" style={{ borderBottom: 'none' }}>
                <span className="detail-label">Account Status</span>
                <span className="detail-value" style={{ color: 'var(--color-success-text)' }}>
                  Active
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setSelectedMember(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
