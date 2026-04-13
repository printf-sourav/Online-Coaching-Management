import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Spinner from '../components/shared/Spinner';
import toast from 'react-hot-toast';

export default function Login() {
  const { state } = useLocation();
  const [creds, setCreds]   = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();
  const { isDark, toggle } = useTheme();

  const fromRegister = state?.registered;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!creds.email || !creds.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const user = await login(creds.email, creds.password);
      toast.success(`Welcome back, ${user?.name?.split(' ')[0] || 'there'}! 👋`);
      if (state?.returnTo) {
        navigate(state.returnTo, { state: { openTutorId: state.openTutorId } });
      } else {
        navigate(`/${user?.role || 'student'}`);
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="mesh-bg" />

      <button onClick={toggle} className="theme-toggle auth-theme-btn" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">
        <div className={`toggle-track ${isDark ? 'toggle-track-dark' : 'toggle-track-light'}`}>
          <div className={`toggle-thumb ${isDark ? 'toggle-thumb-dark' : 'toggle-thumb-light'}`}>
            <span style={{ lineHeight: 1 }}>{isDark ? '🌙' : '☀️'}</span>
          </div>
        </div>
      </button>

      <div className="auth-wrap auth-wrap--sm">
        <Link to="/" className="auth-back">← Back to Home</Link>

        <div className="glass-flat auth-card">
          <div className="auth-tint" style={{ background: 'var(--grad-primary)' }} />

          <div className="auth-header">
            <div className="auth-icon" style={{ background: 'var(--grad-primary)' }}>🎓</div>
            <h1 className="auth-title">
              Welcome to <span className="tg-primary">EduNova</span>
            </h1>
            <p className="auth-subtitle">Sign in to access your dashboard</p>
          </div>

          {fromRegister && (
            <div className="alert alert-success" style={{ marginBottom: 20 }}>
              <span>🎉</span>
              <span>Account created! Sign in to get started.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email" className="form-input"
                placeholder="Enter your email"
                value={creds.email}
                onChange={e => setCreds(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '.78rem', color: 'var(--color-primary-2)', fontWeight: 600 }}>
                  Forgot Password?
                </Link>
              </div>
              <div className="input-pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'} className="form-input"
                  placeholder="Enter your password"
                  value={creds.password}
                  onChange={e => setCreds(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} className="input-pw-toggle" aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
              {loading ? <Spinner /> : 'Sign In  →'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register">Register as Student →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
