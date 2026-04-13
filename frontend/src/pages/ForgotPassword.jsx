import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import OTPInput from '../components/shared/OTPInput';
import Countdown from '../components/shared/Countdown';
import Spinner from '../components/shared/Spinner';
import PasswordStrength from '../components/shared/PasswordStrength';
import toast from 'react-hot-toast';

const OTP_EXPIRY = 10 * 60;
const STEPS = [
  { id: 1, label: 'Email' },
  { id: 2, label: 'Verify OTP' },
  { id: 3, label: 'New Password' },
];

export default function ForgotPassword() {
  const [step, setStep]         = useState(1);
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState('');
  const [otpExpiry, setOtpExpiry] = useState(OTP_EXPIRY);
  const [expired, setExpired]   = useState(false);
  const [newPw, setNewPw]       = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]       = useState('');

  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setOtp('');
      setOtpExpiry(OTP_EXPIRY);
      setExpired(false);
      setStep(2);
      toast.success('Reset OTP sent to your email!');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check the email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setError('');
    if (otp.length < 6) { setError('Please enter the 6-digit OTP.'); return; }
    if (expired)        { setError('OTP has expired. Please resend.'); return; }
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPw || !confirmPw) { setError('Please fill in all fields.'); return; }
    if (newPw.length < 6)     { setError('Password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw)  { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim(), otp, newPw);
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Try again.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await forgotPassword(email.trim());
      setOtp('');
      setOtpExpiry(OTP_EXPIRY);
      setExpired(false);
      toast.success('New OTP sent!');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const stepIcons = ['📧', '🔐', '🔑'];

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

      <div className="auth-wrap auth-wrap--md">
        <Link to="/login" className="auth-back">← Back to Login</Link>

        <div className="glass-flat auth-card">
          <div className="auth-tint" style={{ background: 'var(--grad-rose)' }} />

          <div className="auth-header">
            <div className="auth-icon" style={{ background: 'var(--grad-primary)' }}>
              {stepIcons[step - 1]}
            </div>
            <h1 className="auth-title">
              {step === 1 && 'Forgot Password?'}
              {step === 2 && 'Verify OTP'}
              {step === 3 && 'New Password'}
            </h1>
            <p className="auth-subtitle">
              {step === 1 && "Enter your registered email to receive a reset OTP"}
              {step === 2 && `We sent a 6-digit OTP to ${email}`}
              {step === 3 && 'Choose a strong new password'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="step-indicator">
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <div className={`step-line${step > i ? ' step-line--active' : ' step-line--inactive'}`} style={{ width: 32 }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div className={`step-circle${step > s.id ? ' step-circle--done' : step >= s.id ? ' step-circle--active' : ' step-circle--pending'}`} style={{ width: 26, height: 26, fontSize: '.72rem' }}>
                    {step > s.id ? '✓' : s.id}
                  </div>
                  <span className={`step-label${step === s.id ? ' step-label--active' : ' step-label--inactive'}`} style={{ fontSize: '.75rem' }}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="auth-form">
              <div className="form-group">
                <label className="form-label">Registered Email Address</label>
                <input type="email" className="form-input" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? <Spinner /> : 'Send Reset OTP →'}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="auth-form">
              <div className="alert alert-success">
                📬 OTP sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Expires in{' '}
                {!expired
                  ? <Countdown seconds={otpExpiry} onZero={() => setExpired(true)} />
                  : <span style={{ color: 'var(--color-rose)', fontWeight: 700 }}>00:00 (expired)</span>
                }.
              </div>

              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Enter 6-digit OTP</label>
                <OTPInput value={otp} onChange={setOtp} />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={otp.length < 6 || expired}>
                Verify OTP →
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" className="auth-back" style={{ marginBottom: 0 }} onClick={() => { setStep(1); setError(''); }}>
                  ← Change Email
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleResend} disabled={resending} style={{ opacity: resending ? .6 : 1 }}>
                  {resending ? 'Sending…' : '🔄 Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="alert alert-info">
                ✅ OTP verified! Set your new password below.
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-pw-wrap">
                  <input
                    type={showPw ? 'text' : 'password'} className="form-input"
                    placeholder="Min 6 characters"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="input-pw-toggle">
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" placeholder="Re-enter new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                {confirmPw && newPw && confirmPw !== newPw && (
                  <span style={{ fontSize: '.75rem', color: 'var(--color-rose)', marginTop: 4, display: 'block' }}>Passwords don't match</span>
                )}
                {confirmPw && newPw && confirmPw === newPw && (
                  <span style={{ fontSize: '.75rem', color: 'var(--color-accent)', marginTop: 4, display: 'block' }}>✓ Passwords match</span>
                )}
              </div>

              {newPw && <PasswordStrength password={newPw} />}

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || newPw !== confirmPw || newPw.length < 6}>
                {loading ? <Spinner /> : '🔑 Reset Password'}
              </button>
            </form>
          )}

          <div className="auth-footer">
            Remembered your password?{' '}
            <Link to="/login">Back to Login →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
