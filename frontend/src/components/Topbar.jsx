import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { apiGetNotifications, apiMarkNotificationRead, apiUpdateProfile } from '../api';

const NOTIF_ICONS = { info: 'ℹ️', success: '✅', warning: '⚠️', assignment: '📝', payment: '💳', class: '📹', default: '🔔' };

const AVATAR_GRADS = [
  'linear-gradient(135deg,#7c5cfc,#c084fc)',
  'linear-gradient(135deg,#00d4aa,#38bdf8)',
  'linear-gradient(135deg,#f97316,#facc15)',
  'linear-gradient(135deg,#ff6b9d,#f43f5e)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
];

export default function Topbar({ title, subtitle, onMenuClick }) {
  const { user, updateUser } = useAuth();
  const { isDark, toggle } = useTheme();
  const [scrollPct, setScrollPct] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', dob: '', gender: '', bio: '', avatar: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const fileRef = useRef(null);

  /* ── scroll progress bar ─────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100 || 0;
      setScrollPct(Math.min(pct, 100));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── close dropdowns on outside click ───────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── sync form when modal opens ─────────────────────── */
  useEffect(() => {
    if (profileModal && user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        dob: user.dob ? user.dob.slice(0, 10) : '',
        gender: user.gender || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
    }
  }, [profileModal]);

  /* ── lock body scroll & reset file state when modal closes ── */
  useEffect(() => {
    document.body.style.overflow = profileModal ? 'hidden' : '';
    if (!profileModal) {
      setAvatarFile(null);
      if (avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); }
    }
    return () => { document.body.style.overflow = ''; };
  }, [profileModal]);

  /* ── fetch notifications when opened ─────────────────── */
  const handleNotifToggle = () => {
    if (notifOpen) { setNotifOpen(false); return; }
    setNotifOpen(true);
    setNotifLoading(true);
    apiGetNotifications()
      .then(res => setNotifications(Array.isArray(res) ? res : (res?.data ?? [])))
      .catch(() => setNotifications([]))
      .finally(() => setNotifLoading(false));
  };

  const markRead = (id) => {
    apiMarkNotificationRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    notifications.filter(n => !n.read).forEach(n => apiMarkNotificationRead(n._id).catch(() => {}));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  /* ── save profile ────────────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload;
      if (avatarFile) {
        payload = new FormData();
        payload.append('name',   form.name);
        payload.append('phone',  form.phone);
        payload.append('dob',    form.dob);
        payload.append('gender', form.gender);
        payload.append('bio',    form.bio);
        payload.append('avatar', avatarFile);
      } else {
        payload = form;
      }
      const res = await apiUpdateProfile(payload);
      const updated = res.data || res;
      if (updateUser) updateUser(updated);
      toast.success('Profile updated!');
      setProfileModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = () => {
    toggle();
    toast(isDark ? '☀️  Switched to Light mode' : '🌙  Switched to Dark mode', { icon: null, style: { fontWeight: 600 } });
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const initials = (name) => (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarGrad = user?.avatarGrad || AVATAR_GRADS[0];

  return (
    <>
      {/* Scroll progress line */}
      <div id="scroll-progress" style={{ width: `${scrollPct}%` }} />

      <div className="topbar">
        <div className="topbar-left">
          <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open navigation menu">
            <span /><span /><span />
          </button>
          <div className="topbar-info">
            <div className="topbar-title" style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-.01em' }}>{title}</div>
            {subtitle && (
              <div className="topbar-subtitle" style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="topbar-right">
          <div className="topbar-date" style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>

          {/* ─── Theme Toggle ─── */}
          <button
            className="theme-toggle"
            onClick={handleToggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            data-tip={isDark ? 'Light mode' : 'Dark mode'}
          >
            <div className={`toggle-track ${isDark ? 'toggle-track-dark' : 'toggle-track-light'}`}>
              <div className={`toggle-thumb ${isDark ? 'toggle-thumb-dark' : 'toggle-thumb-light'}`}>
                <span style={{ fontSize: '.85rem', lineHeight: 1 }}>{isDark ? '🌙' : '☀️'}</span>
              </div>
            </div>
          </button>

          {/* ─── Notifications ─── */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className={`notif-btn${notifOpen ? ' notif-btn-active' : ''}`}
              onClick={handleNotifToggle}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="notif-badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
                  )}
                </div>
                <div className="notif-dropdown-body">
                  {notifLoading ? (
                    <div className="notif-empty"><span style={{ fontSize: '1.5rem' }}>⏳</span><span>Loading…</span></div>
                  ) : notifications.length === 0 ? (
                    <div className="notif-empty"><span style={{ fontSize: '1.8rem' }}>🔕</span><span>No notifications yet</span></div>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id} className={`notif-item${n.read ? '' : ' notif-item-unread'}`} onClick={() => markRead(n._id)}>
                        <div className="notif-item-icon">{NOTIF_ICONS[n.type] || NOTIF_ICONS.default}</div>
                        <div className="notif-item-body">
                          <div className="notif-item-title">{n.title || n.message}</div>
                          {n.title && n.message && <div className="notif-item-msg">{n.message}</div>}
                          <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                        </div>
                        {!n.read && <div className="notif-dot" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── Profile ─── */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button className={`profile-pill${profileOpen ? ' profile-pill-active' : ''}`} onClick={() => setProfileOpen(o => !o)}>
              <div className="profile-pill-avatar" style={{ background: avatarGrad }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : initials(user?.name)}
              </div>
              <div className="profile-pill-info">
                <div className="profile-pill-name">{user?.name || 'User'}</div>
                <div className="profile-pill-email">{user?.email || ''}</div>
              </div>
              <span className="profile-pill-caret">{profileOpen ? '▲' : '▼'}</span>
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                {/* User summary */}
                <div className="profile-dropdown-top">
                  <div className="profile-dropdown-avatar" style={{ background: avatarGrad }}>
                    {user?.avatar
                      ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : initials(user?.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{user?.name || 'User'}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email || ''}</div>
                    <span className="badge bd-primary" style={{ marginTop: 6, fontSize: '.65rem' }}>{user?.role || 'student'}</span>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); setProfileModal(true); }}>
                  <span>✏️</span> Edit Profile
                </button>
                <button className="profile-dropdown-item" style={{ color: 'var(--color-rose)' }} onClick={() => { setProfileOpen(false); /* handled by sidebar logout */ }}>
                  <span>🚪</span> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Profile Edit Modal ─── */}
      {profileModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setProfileModal(false); }}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>Edit Profile</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>Update your personal details</div>
              </div>
              <button className="btn-ghost" onClick={() => setProfileModal(false)} style={{ fontSize: '1.2rem', lineHeight: 1, padding: '4px 10px' }}>✕</button>
            </div>

            {/* Avatar picker */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
              {/* Clickable avatar circle */}
              <div
                style={{ position: 'relative', width: 76, height: 76, flexShrink: 0, cursor: 'pointer' }}
                onClick={() => fileRef.current?.click()}
                title="Click to upload photo"
              >
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#fff', overflow: 'hidden', border: '3px solid var(--color-border-2)' }}>
                  {(avatarPreview || form.avatar)
                    ? <img src={avatarPreview || form.avatar} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                    : initials(form.name || user?.name)}
                </div>
                {/* Camera hover overlay */}
                <div className="avatar-cam-overlay">
                  <span style={{ fontSize: '1.3rem' }}>📷</span>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
                  if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                  setForm(f => ({ ...f, avatar: '' }));
                  e.target.value = '';
                }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Profile Photo</div>
                <button type="button" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => fileRef.current?.click()}>
                  📁 Choose Image
                </button>
                {avatarFile && (
                  <div style={{ fontSize: '.72rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    ✓ {avatarFile.name}
                  </div>
                )}
                {/* Gradient swatches */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  {AVATAR_GRADS.map((g, i) => (
                    <div
                      key={i}
                      title="Use gradient avatar"
                      onClick={() => {
                        if (avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); }
                        setAvatarFile(null);
                        setForm(f => ({ ...f, avatar: '' }));
                      }}
                      style={{ width: 22, height: 22, borderRadius: '50%', background: g, cursor: 'pointer', border: avatarGrad === g ? '2px solid var(--color-primary)' : '2px solid transparent', boxShadow: '0 0 0 1px rgba(0,0,0,.25)', transition: 'transform .15s' }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>JPG, PNG, WebP · max 5 MB</div>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="form-label">Bio <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({form.bio.length}/300)</span></label>
                <textarea className="form-input" rows={3} placeholder="A short intro about yourself…" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 300) }))} style={{ resize: 'vertical', minHeight: 80 }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setProfileModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
