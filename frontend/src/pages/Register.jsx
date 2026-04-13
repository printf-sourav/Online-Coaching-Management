import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import OTPInput from '../components/shared/OTPInput';
import Countdown from '../components/shared/Countdown';
import Spinner from '../components/shared/Spinner';
import toast from 'react-hot-toast';

const OTP_EXPIRY = 10 * 60;

export default function Register() {
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirmPassword: '', mobileNumber: '' });
  const [otp, setOtp]       = useState('');
  const [otpExpiry, setOtpExpiry] = useState(OTP_EXPIRY);
  const [expired, setExpired]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState('');

  const { register, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword || !form.mobileNumber) {
      setError('Please fill in all fields.'); return;
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password, form.mobileNumber);
      setOtp('');
      setOtpExpiry(OTP_EXPIRY);
      setExpired(false);
      setStep(2);
      toast.success('OTP sent to your email!');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length < 6) { setError('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      await verifyOTP(form.email.trim(), otp);
      toast.success(`Welcome to EduNova, ${form.name.split(' ')[0]}! 🎉`);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await resendOTP(form.email.trim());
      setOtp('');
      setOtpExpiry(OTP_EXPIRY);
      setExpired(false);
      toast.success('New OTP sent to your email!');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
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

      <div className="auth-wrap auth-wrap--md">
        <Link to="/" className="auth-back">← Back to Home</Link>

        <div className="glass-flat auth-card">
          <div className="auth-tint" style={{ background: 'var(--grad-primary)' }} />

          <div className="auth-header">
            <div className="auth-icon" style={{ background: 'var(--grad-primary)' }}>
              {step === 1 ? '🎓' : '✉️'}
            </div>
            <h1 className="auth-title">
              {step === 1 ? <>Join <span className="tg-primary">EduNova</span></> : 'Verify your Email'}
            </h1>
            <p className="auth-subtitle">
              {step === 1
                ? 'Create your student account to get started'
                : `We sent a 6-digit OTP to ${form.email}`}
            </p>
          </div>

          {/* Step indicator */}
          <div className="step-indicator">
            {[1, 2].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <div className={`step-line${step >= s ? ' step-line--active' : ' step-line--inactive'}`} style={{ width: 40 }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className={`step-circle${step > s ? ' step-circle--done' : step >= s ? ' step-circle--active' : ' step-circle--pending'}`}>
                    {step > s ? '✓' : s}
                  </div>
                  <span className={`step-label${step === s ? ' step-label--active' : ' step-label--inactive'}`}>
                    {s === 1 ? 'Your Info' : 'Verify OTP'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="auth-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="e.g. Aryan Sharma" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input type="tel" className="form-input" placeholder="e.g. 9876543210" value={form.mobileNumber} onChange={e => set('mobileNumber', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? <Spinner /> : 'Send OTP →'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerify} className="auth-form">
              <div className="alert alert-info">
                📬 Check your inbox at <strong>{form.email}</strong>. The OTP expires in{' '}
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

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || otp.length < 6 || expired}>
                {loading ? <Spinner /> : '🎓 Verify & Create Account'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" className="auth-back" style={{ marginBottom: 0 }} onClick={() => { setStep(1); setError(''); }}>
                  ← Change Email
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleResend} disabled={resending} style={{ opacity: resending ? .6 : 1 }}>
                  {resending ? 'Sending…' : '🔄 Resend OTP'}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
