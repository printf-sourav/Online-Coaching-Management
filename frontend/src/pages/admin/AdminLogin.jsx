import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const performLogin = async (loginCreds) => {
    setError('');
    if (!loginCreds.email || !loginCreds.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const user = await login(loginCreds.email, loginCreds.password);
      if (user?.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        return;
      }
      toast.success('Welcome, Admin!');
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(creds);
  };

  return (
    <div className="bg-animated" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      <div className="mesh-bg" />

      {/* Floating theme toggle */}
      <button
        onClick={toggle}
        className="theme-toggle"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle theme"
        style={{ position: 'fixed', top: 20, right: 24, zIndex: 200 }}
      >
        <div className={`toggle-track ${isDark ? 'toggle-track-dark' : 'toggle-track-light'}`}>
          <div className={`toggle-thumb ${isDark ? 'toggle-thumb-dark' : 'toggle-thumb-light'}`}>
            <span style={{ lineHeight: 1 }}>{isDark ? '🌙' : '☀️'}</span>
          </div>
        </div>
      </button>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '.85rem', fontWeight: 500, marginBottom: 28 }}>
          ← Back to Home
        </Link>

        <div className="glass-flat" style={{ padding: '40px 36px', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden' }}>
          {/* Background accent */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#f43f5e,#7c5cfc)', opacity: .06, pointerEvents: 'none' }} />

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: 'linear-gradient(135deg,#f43f5e,#7c5cfc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(244,63,94,.3)',
            }}>
              🛡️
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: 6 }}>
              <span className="tg-primary">EduNova</span> Admin
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem', lineHeight: 1.5 }}>
              Restricted access — authorized personnel only
            </p>
          </div>

          {/* Security badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', marginBottom: 24,
            background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.15)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <span style={{ fontSize: '1.1rem' }}>🔒</span>
            <span style={{ fontSize: '.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              This login is for platform administrators only. Students & teachers should use the{' '}
              <Link to="/login" style={{ color: 'var(--color-primary-2)', fontWeight: 600 }}>main login</Link>.
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                type="email" className="form-input"
                placeholder="admin@edunova.in"
                value={creds.email}
                onChange={e => setCreds(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password" className="form-input"
                placeholder="Enter admin password"
                value={creds.password}
                onChange={e => setCreds(p => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(255,107,157,.1)', border: '1px solid rgba(255,107,157,.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--color-rose)', fontSize: '.85rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit" className="btn btn-lg"
              style={{
                width: '100%', justifyContent: 'center', marginTop: 4,
                background: 'linear-gradient(135deg,#f43f5e,#7c5cfc)',
                color: '#fff', border: 'none', fontWeight: 700,
              }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
              ) : '🛡️  Sign in as Admin  →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 22, color: 'var(--text-muted)', fontSize: '.78rem' }}>
            Not an admin?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary-2)', fontWeight: 600 }}>
              Go to Student / Teacher login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
