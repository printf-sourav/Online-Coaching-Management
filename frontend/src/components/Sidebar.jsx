import { useAuth } from '../context/AuthContext';

/* ── Lucide-style inline SVG icons (no dependency needed) ─── */
const I = {
  dashboard: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  video:     <svg viewBox="0 0 24 24"><rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l5-3v10l-5-3z"/></svg>,
  calendar:  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  check:     <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>,
  book:      <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  edit:      <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  chat:      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  star:      <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  grad:      <svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  school:    <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  credit:    <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>,
  circle:    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>,
  gift:      <svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z"/></svg>,
  users:     <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  chart:     <svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  money:     <svg viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  plus:      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  mega:      <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  settings:  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout:    <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
};

const navItems = {
  student: [
    { icon: I.dashboard, label: 'Dashboard',        id: 'dashboard' },
    { icon: I.calendar,  label: 'Schedule',          id: 'schedule' },
    { icon: I.check,     label: 'Attendance',        id: 'attendance' },
    { icon: I.book,      label: 'Topics',            id: 'topics' },
    { icon: I.edit,      label: 'Assignments',       id: 'assignments' },
    { icon: I.star,      label: 'Feedback',          id: 'feedback' },
    { icon: I.school,    label: 'Rate Platform',      id: 'rate-platform' },
    { icon: I.grad,      label: 'My Tutors',         id: 'tutors' },
    { icon: I.school,    label: 'Teacher Updates',   id: 'updates' },
    { icon: I.credit,    label: 'Fee Payment',       id: 'fees' },
  ],
  teacher: [
    { icon: I.dashboard, label: 'Dashboard',        id: 'dashboard' },
    { icon: I.gift,      label: 'Demo Classes',      id: 'demos' },
    { icon: I.users,     label: 'Students',          id: 'students' },
    { icon: I.calendar,  label: 'Student Schedule',  id: 'studentSchedules' },
    { icon: I.check,     label: 'Attendance',        id: 'attendance' },
    { icon: I.book,      label: 'Topics',            id: 'topics' },
    { icon: I.edit,      label: 'Assignments',       id: 'assignments' },
    { icon: I.chart,     label: 'Performance',       id: 'performance' },
    { icon: I.star,      label: 'Feedback',          id: 'feedback' },
  ],
  admin: [
    { icon: I.dashboard, label: 'Dashboard',       id: 'dashboard' },
    { icon: I.school,    label: 'Teachers',         id: 'teachers' },
    { icon: I.plus,      label: 'Add Teacher',      id: 'add-teacher' },
    { icon: I.grad,      label: 'Students',         id: 'students' },
    { icon: I.credit,    label: 'Fee Management',   id: 'fee-management' },
    { icon: I.money,     label: 'Revenue',          id: 'revenue' },
    { icon: I.mega,      label: 'Announcements',    id: 'announcements' },
    { icon: I.chart,     label: 'Reports',          id: 'reports' },
    { icon: I.star,      label: 'Reviews',          id: 'reviews' },
    { icon: I.settings,  label: 'Settings',         id: 'settings' },
  ],
};

const roleLabels = { student: 'Student Portal', teacher: 'Teacher Portal', parent: 'Parent Portal', admin: 'Admin Panel' };
const rolePills   = { student: 'bd-primary', teacher: 'bd-accent', parent: 'bd-rose', admin: 'bd-rose' };

export default function Sidebar({ active, onNav, open, onClose }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const items = navItems[user.role] || [];

  return (
    <>
      {/* ── Mobile backdrop overlay ── */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">E</div>
        <div>
          <div className="sidebar-logo-text">EduNova</div>
          <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
            {roleLabels[user.role]}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 10px' }}>
        <span className={`badge ${rolePills[user.role]}`} style={{ fontSize: '.65rem' }}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">Navigation</div>
        {items.map(item => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => { onNav(item.id); if (onClose) onClose(); }}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="avatar" style={{ background: user.avatarGrad, color: '#fff' }}>
            {user.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
          </div>
          <button onClick={logout} title="Logout" className="logout-btn">
            {I.logout}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
