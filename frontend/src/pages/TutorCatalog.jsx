import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchTutors, apiRequestDemo, apiGetMyDemos, apiRequestEnrollment, fetchEnrollments } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import RippleButton from '../components/RippleButton';
import PlaceholderImage from '../components/PlaceholderImage';
import meritLogo from '../../public/images/logo.png';

const SUBJECTS = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'History & Civics', 'Economics'];
const TUTOR_PAGE_STATE_KEY = 'meritnook-tutor-page-state';

const TUTOR_ACCENTS = [
  { line: '#0A9396', avatarGrad: 'linear-gradient(135deg,#4EC1C3,#0A9396)', feeGrad: 'linear-gradient(135deg,#0A9396,#08777A)' },
  { line: '#E2711D', avatarGrad: 'linear-gradient(135deg,#F79953,#E2711D)', feeGrad: 'linear-gradient(135deg,#E2711D,#B55A17)' },
  { line: '#2A9D8F', avatarGrad: 'linear-gradient(135deg,#5EC8BA,#2A9D8F)', feeGrad: 'linear-gradient(135deg,#2A9D8F,#217E73)' },
  { line: '#E9C46A', avatarGrad: 'linear-gradient(135deg,#F4DB9B,#E9C46A)', feeGrad: 'linear-gradient(135deg,#E9C46A,#BA9D55)' },
  { line: '#E76F51', avatarGrad: 'linear-gradient(135deg,#F29983,#E76F51)', feeGrad: 'linear-gradient(135deg,#E76F51,#B95941)' },
  { line: '#94D2BD', avatarGrad: 'linear-gradient(135deg,#BCEADC,#94D2BD)', feeGrad: 'linear-gradient(135deg,#94D2BD,#76A897)' },
];

function pickTutorAccent(tutor) {
  const key = `${tutor?.subject || ''}-${tutor?.id || ''}`;
  const hash = [...key].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return TUTOR_ACCENTS[hash % TUTOR_ACCENTS.length];
}

/* ── Star display ───────────────────────────────────────── */
function Stars({ rating }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? 'var(--color-amber)' : 'var(--text-muted)', fontSize: '.75rem' }}>★</span>
      ))}
    </span>
  );
}

/* ── Plan card ──────────────────────────────────────────── */
function PlanCard({ plan, selected, onSelect, color }) {
  return (
    <div
      onClick={() => onSelect(plan._id)}
      style={{
        flex: 1, padding: '18px 14px', borderRadius: 14, cursor: 'pointer', position: 'relative',
        border: selected ? `2px solid var(--color-primary)` : '2px solid var(--color-border)',
        background: selected ? 'rgba(124,92,252,.08)' : 'var(--color-surface)',
        transition: 'all .2s', textAlign: 'center',
        transform: selected ? 'scale(1.03)' : 'scale(1)',
        boxShadow: selected ? '0 0 0 3px rgba(124,92,252,.18)' : 'none',
      }}
    >
      {plan.popular && (
        <div style={{
          position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--grad-primary)', color: '#fff', fontSize: '.65rem',
          fontWeight: 800, padding: '3px 12px', borderRadius: 100, letterSpacing: '.05em', whiteSpace: 'nowrap',
        }}>MOST POPULAR</div>
      )}
      <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 8 }}>{plan.name}</div>
      <div style={{ fontSize: '1.55rem', fontWeight: 800, background: color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 6 }}>
        ₹{plan.price.toLocaleString()}
      </div>
      <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>per month</div>
      <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{plan.desc}</div>
      <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{plan.sessions} sessions</div>
    </div>
  );
}

/* ── Tutor detail modal ─────────────────────────────────── */
function TutorModal({ tutor, onClose, demosMap, refreshDemos, enrollmentsMap, refreshEnrollments }) {
  const [bookingDemo, setBookingDemo] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    grade: '', board: 'CBSE', school: '',
    subjectsEnrolled: [],
    parentName: '', parentPhone: '',
    mobileNumber: '',
    preferredDays: [],
    notes: '',
  });
  const backdropRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const demoInfo   = demosMap[String(tutor.id)];
  const demoBooked = !!demoInfo;
  const enrolled   = enrollmentsMap[String(tutor.id)];
  const accent = pickTutorAccent(tutor);

  const bookDemo = async () => {
    if (!user) {
      onClose();
      toast.error('Please log in as a student to book a demo class.');
      navigate('/login', { state: { role: 'student', returnTo: '/tutors', openTutorId: tutor.id } });
      return;
    }
    if (demoBooked) { toast.error('You have already booked a demo with this tutor.'); return; }
    setBookingDemo(true);
    try {
      await apiRequestDemo(tutor.id);
      await refreshDemos();
      toast.success(`✅ Demo class booked with ${tutor.name}! Awaiting tutor confirmation.`);
    } catch (err) {
      toast.error(err.message || 'Failed to book demo');
    } finally {
      setBookingDemo(false);
    }
  };

  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const tutorSubjects = tutor.subjects?.length ? tutor.subjects : (tutor.subject ? [tutor.subject] : []);

  const toggleDay     = (d) => setEnrollForm(f => ({ ...f, preferredDays: f.preferredDays.includes(d) ? f.preferredDays.filter(x => x !== d) : [...f.preferredDays, d] }));
  const toggleSubject = (s) => setEnrollForm(f => ({ ...f, subjectsEnrolled: f.subjectsEnrolled.includes(s) ? f.subjectsEnrolled.filter(x => x !== s) : [...f.subjectsEnrolled, s] }));

  const submitEnroll = async (e) => {
    e.preventDefault();
    if (!enrollForm.grade.trim())       { toast.error('Please enter your grade / class.');          return; }
    if (!enrollForm.parentName.trim())  { toast.error('Please enter parent / guardian name.');      return; }
    if (!enrollForm.parentPhone.trim()) { toast.error('Please enter parent / guardian phone.');     return; }
    setEnrolling(true);
    try {
      await apiRequestEnrollment(tutor.id, enrollForm);
      await refreshEnrollments();
      setShowEnrollForm(false);
      toast.success(`✅ Enrollment request sent to ${tutor.name}! You will be notified upon approval.`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Enrollment request failed');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        animation: 'fadeIn .2s ease',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--color-bg)', borderRadius: 24, padding: '0 0 32px',
          boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border-2)',
          animation: 'slideUp .25s ease',
        }}
      >
        {/* Hero strip */}
        <div style={{ height: 8, background: accent.line, borderRadius: '24px 24px 0 0' }} />

        <div style={{ padding: 'clamp(16px,4vw,28px) clamp(16px,4vw,32px) 0' }}>
          {/* Header */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 24 }}>
            <div
              className="avatar avatar-xl"
              style={{ background: accent.avatarGrad, color: '#1C2216', flexShrink: 0, fontSize: '1.4rem', fontWeight: 900, boxShadow: '0 4px 20px rgba(0,0,0,.2)', borderRadius: 18 }}
            >
              {tutor.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-.01em' }}>{tutor.name}</h2>
                <span className={`badge ${tutor.badgeCls}`}>{tutor.badge}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{tutor.subject} · {tutor.grades}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>{tutor.speciality}</div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: '.8rem' }}>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <Stars rating={tutor.rating} />
                  <strong>{tutor.rating}</strong>
                  <span style={{ color:'var(--text-muted)' }}>({tutor.reviews} reviews)</span>
                </span>
                <span style={{ color:'var(--text-secondary)' }}>👨‍🎓 {tutor.students} students</span>
                <span style={{ color:'var(--text-secondary)' }}>⏳ {tutor.experience}</span>
                <span style={{ color:'var(--text-secondary)' }}>🌐 {tutor.languages.join(', ')}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer', color:'var(--text-muted)', lineHeight:1, padding:4, flexShrink:0 }}>✕</button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <PlaceholderImage
              src={tutor.photo || tutor.image || tutor.profileImage || ''}
              alt={`${tutor.name} profile`}
              label={`${tutor.name} photo slot`}
              hint="Add tutor profile photo URL from backend or /public/images/tutors"
              icon="👩‍🏫"
              height={180}
              borderRadius={16}
            />
          </div>

          {/* Demo banner */}
          {!demoBooked ? (
            <div style={{
              background: 'rgba(0,212,170,.09)', border: '1px solid rgba(0,212,170,.22)',
              borderRadius: 14, padding: '14px 18px', marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 2 }}>🎁 Free Demo Class Available</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>Try a free 30-minute demo session with {tutor.name} — no payment required. <strong>Required before enrolling.</strong></div>
              </div>
              <RippleButton className="btn btn-accent btn-sm" onClick={bookDemo} disabled={bookingDemo}>
                {bookingDemo ? 'Booking…' : 'Book Free Demo'}
              </RippleButton>
            </div>
          ) : (
            <div style={{
              background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)',
              borderRadius: 14, padding: '14px 18px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.88rem' }}>Demo class booked</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                  Status: <strong style={{ textTransform: 'capitalize' }}>{demoInfo?.status || 'pending'}</strong> · {demoInfo?.scheduledAt ? `Scheduled: ${new Date(demoInfo.scheduledAt).toLocaleDateString('en-IN')}` : 'Awaiting tutor confirmation'}
                </div>
              </div>
            </div>
          )}

          {/* About */}
          <div style={{ marginBottom: 22 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>About</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', lineHeight: 1.75 }}>{tutor.about}</p>
          </div>

          {/* Topics & Availability */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 10 }}>Topics Covered</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tutor.topics.map(t => (
                  <span key={t} className="badge bd-primary" style={{ fontSize: '.72rem' }}>{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="section-title" style={{ marginBottom: 8 }}>Availability</div>
              {(!tutor.availability || tutor.availability.length === 0) ? (
                <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {tutor.availability.filter(a => a.slots?.length > 0).map(a => (
                    <div key={a.day} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 10px', borderRadius: 8,
                      background: 'rgba(124,92,252,.05)',
                      border: '1px solid rgba(124,92,252,.12)',
                    }}>
                      <span style={{
                        fontWeight: 700, fontSize: '.68rem', color: 'var(--color-primary-2)',
                        minWidth: 30, flexShrink: 0,
                      }}>{a.day}</span>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                        {a.slots.map((s, i) => (
                          <span key={i} style={{
                            padding: '2px 7px', borderRadius: 6,
                            background: 'rgba(124,92,252,.1)',
                            color: 'var(--text-secondary)', fontWeight: 600, fontSize: '.64rem',
                          }}>{s.start}–{s.end}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Plans */}


          {/* ── Enrollment Detail Form ───────────────────────────────── */}
          {showEnrollForm && (
            <form onSubmit={submitEnroll} style={{
              marginBottom: 20, padding: '22px 24px', borderRadius: 16,
              border: '1.5px solid var(--color-primary)', background: 'rgba(124,92,252,.04)',
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 18 }}>📋 Student Details for Enrollment</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, marginBottom:5, color:'var(--text-secondary)' }}>Grade / Class <span style={{color:'red'}}>*</span></label>
                  <input className="form-input" placeholder="e.g. Class 9, Grade 11" value={enrollForm.grade}
                    onChange={e => setEnrollForm(f => ({...f, grade: e.target.value}))} required />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, marginBottom:5, color:'var(--text-secondary)' }}>Board <span style={{color:'red'}}>*</span></label>
                  <select className="form-input form-select" value={enrollForm.board}
                    onChange={e => setEnrollForm(f => ({...f, board: e.target.value}))}>
                    {['CBSE','ICSE','State Board','IB','Other'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, marginBottom:5, color:'var(--text-secondary)' }}>School Name</label>
                  <input className="form-input" placeholder="Your school name" value={enrollForm.school}
                    onChange={e => setEnrollForm(f => ({...f, school: e.target.value}))} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:'.75rem', fontWeight:700, color:'var(--text-secondary)' }}>Parent / Guardian Name <span style={{color:'red'}}>*</span></label>
                  <input className="form-input" placeholder="Full name" value={enrollForm.parentName}
                    onChange={e => setEnrollForm(f => ({...f, parentName: e.target.value}))} required />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:'.75rem', fontWeight:700, color:'var(--text-secondary)' }}>Parent / Guardian Phone <span style={{color:'red'}}>*</span></label>
                  <input className="form-input" placeholder="+91 XXXXX XXXXX" value={enrollForm.parentPhone}
                    onChange={e => setEnrollForm(f => ({...f, parentPhone: e.target.value}))} required />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:'.75rem', fontWeight:700, color:'var(--text-secondary)' }}>Your Mobile Number <span style={{color:'red'}}>*</span></label>
                  <input className="form-input" placeholder="+91 XXXXX XXXXX" value={enrollForm.mobileNumber}
                    onChange={e => setEnrollForm(f => ({...f, mobileNumber: e.target.value}))} required />
                </div>
              </div>

              {tutorSubjects.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, marginBottom:8, color:'var(--text-secondary)' }}>Subjects to Enroll In</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {tutorSubjects.map(s => (
                      <label key={s} style={{
                        display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:'.82rem',
                        padding:'5px 12px', borderRadius:8,
                        background: enrollForm.subjectsEnrolled.includes(s) ? 'rgba(124,92,252,.12)' : 'var(--color-surface)',
                        border: `1px solid ${enrollForm.subjectsEnrolled.includes(s) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      }}>
                        <input type="checkbox" checked={enrollForm.subjectsEnrolled.includes(s)} onChange={() => toggleSubject(s)} style={{ accentColor:'var(--color-primary)' }} />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, marginBottom:8, color:'var(--text-secondary)' }}>Preferred Days</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {DAYS.map(d => (
                    <label key={d} style={{
                      display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:'.78rem',
                      padding:'4px 10px', borderRadius:8,
                      background: enrollForm.preferredDays.includes(d) ? 'rgba(124,92,252,.12)' : 'var(--color-surface)',
                      border: `1px solid ${enrollForm.preferredDays.includes(d) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    }}>
                      <input type="checkbox" checked={enrollForm.preferredDays.includes(d)} onChange={() => toggleDay(d)} style={{ accentColor:'var(--color-primary)' }} />
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display:'block', fontSize:'.75rem', fontWeight:700, marginBottom:5, color:'var(--text-secondary)' }}>Additional Notes</label>
                <textarea className="form-input" rows={3}
                  placeholder="Any specific requirements, learning goals, preferred timings…"
                  value={enrollForm.notes} onChange={e => setEnrollForm(f => ({...f, notes: e.target.value}))}
                  style={{ resize:'vertical', minHeight:70 }} />
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <RippleButton type="submit" className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} disabled={enrolling}>
                  {enrolling ? 'Sending Request…' : 'Send Enrollment Request'}
                </RippleButton>
                <RippleButton type="button" className="btn btn-ghost" onClick={() => setShowEnrollForm(false)}>
                  Cancel
                </RippleButton>
              </div>
            </form>
          )}

          {/* Enroll CTA */}
          {!showEnrollForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {enrolled ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge bd-success" style={{ fontSize: '.8rem', padding: '6px 14px' }}>✓ {enrolled.status}</span>
                    <span style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>since {enrolled.enrolledDate}</span>
                  </div>
                ) : !demoBooked ? (
                  <RippleButton
                    className="btn btn-accent"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '.95rem', padding: '13px 24px' }}
                    onClick={bookDemo}
                    disabled={bookingDemo}
                  >
                    {bookingDemo ? 'Booking…' : '🎁 Book Free Demo'}
                  </RippleButton>
                ) : (
                  <RippleButton
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '.95rem', padding: '13px 24px' }}
                    onClick={() => setShowEnrollForm(true)}
                  >
                    Request to Enroll
                  </RippleButton>
                )}
                <RippleButton className="btn btn-ghost" onClick={onClose}>
                  Maybe Later
                </RippleButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tutor card (grid) ──────────────────────────────────── */
function TutorCard({ tutor, onOpen, demosMap, enrollmentsMap }) {
  const ref = useRef(null);
  const demoBooked = !!demosMap[String(tutor.id)];
  const enrolled = enrollmentsMap[String(tutor.id)];
  const accent = pickTutorAccent(tutor);

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = ((e.clientX - left) / width  - 0.5) *  10;
    const y = ((e.clientY - top)  / height - 0.5) * -10;
    el.style.transform = `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) translateZ(6px)`;
    el.style.setProperty('--mx', `${e.clientX - left}px`);
    el.style.setProperty('--my', `${e.clientY - top}px`);
  }, []);
  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateZ(0)';
  }, []);

  return (
    <div
      ref={ref}
      className="spotlight"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      data-aos="fade-up"
      style={{
        padding: 22,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform .18s ease, box-shadow .18s ease',
        cursor: 'default',
        borderRadius: 18,
        background: '#FFFFFF',
        border: '3px solid #1C2216',
        boxShadow: '7px 7px 0 #1C2216',
      }}
    >
      <div className="spotlight-layer" />

      {/* color top strip */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: accent.line, borderRadius: '18px 18px 0 0' }} />

      {enrolled && (
        <div style={{ position: 'absolute', top: 14, right: 14 }}>
          <span className="badge bd-success" style={{ fontSize: '.65rem', border: '2px solid #1C2216', boxShadow: '2px 2px 0 #1C2216', background: '#94D2BD', color: '#1C2216' }}>✓ {enrolled.status}</span>
        </div>
      )}

      <div style={{ marginBottom: 12, marginTop: 8 }}>
        <PlaceholderImage
          src={tutor.photo || tutor.image || tutor.profileImage || ''}
          alt={`${tutor.name} profile`}
          label="Tutor card photo slot"
          hint="Add tutor image"
          icon="📸"
          height={120}
          borderRadius={12}
        />
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
        <div className="avatar avatar-lg" style={{ background: accent.avatarGrad, color: '#1C2216', fontWeight: 900, fontSize: '1rem', borderRadius: 14, boxShadow: '0 4px 14px rgba(0,0,0,.15)', flexShrink: 0 }}>
          {tutor.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tutor.name}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{tutor.subject}</div>
          <span className={`badge ${tutor.badgeCls}`} style={{ fontSize: '.62rem', border: '2px solid #1C2216', boxShadow: '2px 2px 0 #1C2216' }}>{tutor.badge}</span>
        </div>
      </div>

      <div style={{ fontSize: '.75rem', color: '#5E6D5D', marginBottom: 12, lineHeight: 1.5 }}>{tutor.speciality}</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.78rem' }}>
          <Stars rating={tutor.rating} />
          <strong>{tutor.rating}</strong>
          <span style={{ color: 'var(--text-muted)' }}>({tutor.reviews})</span>
        </span>
        <span style={{ fontSize: '.75rem', color: '#324030' }}>⏳ {tutor.experience}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly fee</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, background: accent.feeGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>Contact for details</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>STUDENTS</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tutor.students}</div>
        </div>
      </div>

      {demoBooked ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span style={{ flex: 1, padding: '7px 12px', borderRadius: 10, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', fontSize: '.75rem', fontWeight: 600, color: '#16a34a', textAlign: 'center' }}>
            ✅ Demo Booked
          </span>
        </div>
      ) : (
        <div style={{ fontSize: '.72rem', color: '#C77D2A', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          🎁 Free 30-min demo available
        </div>
      )}

      <RippleButton
        className="btn btn-primary btn-sm"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => onOpen(tutor)}
      >
        {enrolled ? 'View Status' : 'View & Request'}
      </RippleButton>
    </div>
  );
}

/* ══ Main TutorCatalog page ══════════════════════════════ */
export default function TutorCatalog() {
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const [subject, setSubject] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [selected, setSelected] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  // demosMap: { [tutorId]: { status, scheduledAt } }
  const [demosMap, setDemosMap] = useState({});
  // enrollmentsMap: { [tutorId]: enrollment }
  const [enrollmentsMap, setEnrollmentsMap] = useState({});

  // Restore persisted tutors page state on first load
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TUTOR_PAGE_STATE_KEY) || '{}');
      if (saved.subject && SUBJECTS.includes(saved.subject)) setSubject(saved.subject);
      if (typeof saved.search === 'string') setSearch(saved.search);
      if (saved.sortBy === 'rating' || saved.sortBy === 'students') setSortBy(saved.sortBy);
      if (typeof saved.scrollY === 'number' && saved.scrollY > 0) {
        requestAnimationFrame(() => window.scrollTo({ top: saved.scrollY, behavior: 'auto' }));
      }
    } catch {
      // ignore broken persisted state
    }
  }, []);

  // Persist key UI state for reload continuity
  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem(TUTOR_PAGE_STATE_KEY) || '{}');
      localStorage.setItem(TUTOR_PAGE_STATE_KEY, JSON.stringify({
        ...prev,
        subject,
        search,
        sortBy,
        selectedTutorId: selected?.id ?? null,
      }));
    } catch {
      // ignore storage errors
    }
  }, [subject, search, sortBy, selected]);

  // Persist scroll position while browsing tutors
  useEffect(() => {
    const saveScroll = () => {
      try {
        const prev = JSON.parse(localStorage.getItem(TUTOR_PAGE_STATE_KEY) || '{}');
        localStorage.setItem(TUTOR_PAGE_STATE_KEY, JSON.stringify({ ...prev, scrollY: window.scrollY }));
      } catch {
        // ignore storage errors
      }
    };
    window.addEventListener('scroll', saveScroll, { passive: true });
    return () => window.removeEventListener('scroll', saveScroll);
  }, []);

  const refreshDemos = useCallback(async () => {
    if (!user) return;
    const list = await apiGetMyDemos();
    const map = {};
    (Array.isArray(list) ? list : []).forEach(d => {
      if (d.tutorId) map[String(d.tutorId)] = d;
    });
    setDemosMap(map);
  }, [user]);

  const refreshEnrollments = useCallback(async () => {
    if (!user) return;
    const list = await fetchEnrollments();
    const map = {};
    (Array.isArray(list) ? list : []).forEach(e => {
      if (e.tutorId) map[String(e.tutorId)] = e;
    });
    setEnrollmentsMap(map);
  }, [user]);

  // Load tutors from API
  useEffect(() => {
    fetchTutors()
      .then(data => setTutors(data))
      .finally(() => setLoadingTutors(false));
  }, []);

  useEffect(() => { refreshDemos(); }, [refreshDemos]);
  useEffect(() => { refreshEnrollments(); }, [refreshEnrollments]);

  // Auto-open a tutor modal if redirected back from login
  useEffect(() => {
    if (loadingTutors) return;
    const openId = location.state?.openTutorId;
    const saved = (() => {
      try { return JSON.parse(localStorage.getItem(TUTOR_PAGE_STATE_KEY) || '{}'); }
      catch { return {}; }
    })();
    const targetId = openId ?? saved.selectedTutorId;
    if (targetId != null) {
      const tutor = tutors.find(t => String(t.id) === String(targetId));
      if (tutor) setSelected(tutor);
    }
    if (openId) window.history.replaceState({}, '');
  }, [loadingTutors, tutors, location.state]);

  const filtered = tutors
    .filter(t => subject === 'All' || t.subject === subject)
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()) || t.speciality.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'students') return b.students - a.students;
      return 0;
    });

  return (
    <div data-theme="light" style={{ minHeight: '100vh', position: 'relative', background: '#F4F8F4', color: '#1C2216', overflowX: 'clip' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.16, backgroundImage: `radial-gradient(circle,rgba(146, 169, 255, 0.32) 1px,transparent 1px)`, backgroundSize: '36px 36px' }} />

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 120,
        background: '#F4F8F4',
        borderBottom: '3px solid #1C2216',
        padding: '0 clamp(16px,5vw,80px)', height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0, width: 'clamp(378px, 34vw, 504px)' }} onClick={() => navigate('/')}>
          <img
            src={meritLogo}
            alt="Merit Nook logo"
            style={{
              width: '100%',
              height: 162,
              objectFit: 'contain',
              objectPosition: 'left center',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.08))',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login"><RippleButton className="btn btn-sm" style={{ background: '#FFFFFF', color: '#1C2216', border: '2px solid #1C2216', boxShadow: '3px 3px 0 #1C2216' }}>Login</RippleButton></Link>
          <Link to="/register"><RippleButton className="btn btn-sm" style={{ background: 'linear-gradient(135deg,#E9C46A,#E2711D)', color: '#1C2216', border: '2px solid #1C2216', boxShadow: '3px 3px 0 #1C2216' }}>Book FREE Trial</RippleButton></Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(30px,4vw,48px) clamp(16px,4vw,32px)', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div data-aos="fade-up" style={{ marginBottom: 30, textAlign: 'center', background: '#FFFFFF', border: '3px solid #1C2216', boxShadow: '6px 6px 0 #1C2216', borderRadius: 22, padding: 'clamp(18px,3vw,28px)' }}>
          <div style={{ fontSize: '.78rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#0A9396', marginBottom: 10 }}>Expert Instructors</div>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-.03em', marginBottom: 10, color: '#1C2216' }}>
            Find Your Perfect <span style={{ color: '#E2711D' }}>Tutor</span>
          </h1>
          <p style={{ color: '#324030', fontSize: '.975rem', maxWidth: 620, margin: '0 auto' }}>
            Browse expert tutors, compare plans, and book a free demo class with personalized guidance.
          </p>
        </div>

        {/* Search + sort */}
        <div data-aos="fade-up" data-aos-delay="80" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#5E6D5D', fontSize: '1rem' }}>🔍</span>
            <input
              className="form-input"
              placeholder="Search by name, subject or topic…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 40, borderRadius: 12, border: '3px solid #1C2216', boxShadow: '4px 4px 0 #1C2216', background: '#FFFFFF' }}
            />
          </div>
          <select
            className="form-input form-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ width: 220, borderRadius: 12, border: '3px solid #1C2216', boxShadow: '4px 4px 0 #1C2216', background: '#FFFFFF' }}
          >
            <option value="rating">Sort: Top Rated</option>
            <option value="students">Sort: Most Students</option>
          </select>
        </div>

        {/* Subject tabs */}
        <div data-aos="fade-up" data-aos-delay="120" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          {SUBJECTS.map(s => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className="btn btn-sm"
              style={{
                background: subject === s ? '#0A9396' : '#FFFFFF',
                color: subject === s ? '#FFF' : '#1C2216',
                border: '3px solid #1C2216',
                boxShadow: subject === s ? '0px 0px 0 #1C2216' : '3px 3px 0 #1C2216',
                transform: subject === s ? 'translate(3px, 3px)' : 'none',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600 }}>
          {filtered.length} tutor{filtered.length !== 1 ? 's' : ''} found
          {search && <span> for "<strong style={{ color: 'var(--text-primary)' }}>{search}</strong>"</span>}
          {subject !== 'All' && <span> in <strong style={{ color: 'var(--text-primary)' }}>{subject}</strong></span>}
        </div>

        {/* Grid */}
        {loadingTutors ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: 14, opacity: .6 }}>⏳</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading tutors…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>🔍</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>No tutors found</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '.875rem' }}>Try adjusting your search or subject filter.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(285px,1fr))', gap: 20 }}>
            {filtered.map(t => (
              <TutorCard key={t.id} tutor={t} onOpen={setSelected} demosMap={demosMap} enrollmentsMap={enrollmentsMap} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && <TutorModal tutor={selected} onClose={() => setSelected(null)} demosMap={demosMap} refreshDemos={refreshDemos} enrollmentsMap={enrollmentsMap} refreshEnrollments={refreshEnrollments} />}

      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>
    </div>
  );
}
