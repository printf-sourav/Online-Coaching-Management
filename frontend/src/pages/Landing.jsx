import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import RippleButton from '../components/RippleButton';
import { useCounter } from '../hooks/useCounter';
import { fetchTutors } from '../api';
import PlaceholderImage from '../components/PlaceholderImage';

/* ─────────────────────────────────────────────── constants ── */
const PURPLE   = '#7C5CFC';
const ORANGE   = '#FF6B35';
const GREEN    = '#22C55E';
const BLUE     = '#0EA5E9';

/* ── Spotlight card: tracks mouse to cast a radial glow ── */
function SpotlightCard({ children, className = '', style = {}, onClick }) {
  const ref = useRef(null);
  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top } = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - left}px`);
    el.style.setProperty('--my', `${e.clientY - top}px`);
  }, []);
  return (
    <div ref={ref} className={`spotlight ${className}`} style={style} onMouseMove={handleMove} onClick={onClick}>
      <div className="spotlight-layer" />
      {children}
    </div>
  );
}

/* ── Tilt card: 3-D perspective tilt on hover ─────────── */
function TiltCard({ children, className = '', style = {} }) {
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = ((e.clientX - left) / width  - 0.5) *  10;
    const y = ((e.clientY - top)  / height - 0.5) * -10;
    el.style.transform = `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) translateZ(6px)`;
  }, []);
  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateZ(0)';
  }, []);
  return (
    <div ref={ref} className={`tilt-card ${className}`} style={{ transition: 'transform .18s ease,box-shadow .18s ease', ...style }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}

/* ── Section label chip ───────────────────────────────── */
function Chip({ label, color = PURPLE }) {
  return (
    <div style={{
      display: 'inline-block',
      background: color + '18', color,
      borderRadius: 100, padding: '5px 16px',
      fontSize: '.73rem', fontWeight: 700,
      letterSpacing: '.06em', textTransform: 'uppercase',
      marginBottom: 14, border: `1px solid ${color}30`,
    }}>{label}</div>
  );
}

export default function Landing() {
  const navigate    = useNavigate();
  const { isDark, toggle } = useTheme();
  const [tutors, setTutors]   = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => { fetchTutors().then(setTutors); }, []);
  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const c1 = useCounter('50000+');
  const c2 = useCounter('120+');
  const c3 = useCounter('98%');
  const c4 = useCounter('4.8');

  /* ── Static data ──────────────────────────────────── */
  const subjects = [
    { icon: '📐', name: 'Mathematics',      desc: 'From arithmetic to calculus — concept mastery at every grade.',     color: PURPLE,  bg: PURPLE  + '12' },
    { icon: '🔬', name: 'Science',           desc: 'Physics, Chemistry & Biology through experiments & real examples.', color: BLUE,    bg: BLUE    + '12' },
    { icon: '📝', name: 'English',           desc: 'Grammar, literature, writing skills and confident communication.',   color: GREEN,   bg: GREEN   + '12' },
    { icon: '💻', name: 'Coding',            desc: 'Python, Web Dev & App Dev — from scratch to real projects.',        color: ORANGE,  bg: ORANGE  + '12' },
    { icon: '🌍', name: 'Social Studies',    desc: 'History, Geography, Civics and current-affairs expertise.',         color: '#EC4899', bg: '#EC489912' },
    { icon: '🎨', name: 'Arts & Creativity', desc: 'Visual arts, design thinking and creative expression for kids.',    color: '#EAB308', bg: '#EAB30812' },
  ];

  const steps = [
    { num: 1, icon: '📚', title: 'Choose Your Subject', color: PURPLE,
      desc: 'Browse expert tutors by subject, grade and teaching style to find a perfect match for your child.' },
    { num: 2, icon: '🎁', title: 'Book a FREE Demo',    color: ORANGE,
      desc: 'Try a live 1:1 session absolutely free — no payment needed. Experience the EduNova difference.' },
    { num: 3, icon: '🚀', title: 'Enroll & Excel',      color: GREEN,
      desc: 'Choose a flexible plan and start your child\'s personalised learning journey toward real results.' },
  ];

  const advantages = [
    { icon: '🎯', title: 'Dedicated 1:1 Attention',   color: PURPLE,  desc: 'Every class is a private session. Your tutor adapts lessons to your child\'s pace, style and learning gaps in real time.' },
    { icon: '📈', title: 'Mastery-Based Progress',     color: BLUE,    desc: 'Detailed reports after every class. Parents and students both see real-time progress across every subject and skill.' },
    { icon: '⚡', title: 'Real-Time Feedback',         color: ORANGE,  desc: 'Instant corrections and live guidance during class accelerate learning and build lasting confidence.' },
    { icon: '🏆', title: 'Top 5% Expert Mentors',      color: GREEN,   desc: 'Only the most qualified and passionate educators make the cut. Average tutor rating: 4.8 / 5.' },
    { icon: '👨‍👩‍👦', title: 'Parent Portal',              color: '#EC4899', desc: 'Complete visibility into attendance, grades, assignments and teacher notes — in one beautiful dashboard.' },
    { icon: '📅', title: 'Flexible Scheduling',        color: '#EAB308', desc: 'Book classes any day, any time. Our tutors fit around your child\'s school schedule and activities.' },
  ];

  const testimonials = [
    { name: 'Aryan Sharma',    role: 'Student — Grade 10',          flag: '🇮🇳',
      text: 'My Maths score jumped from 62% to 94% in just 3 months. The 1:1 attention made all the difference!',
      avatar: 'AS', photo: 'https://i.pravatar.cc/160?img=12', grad: `linear-gradient(135deg,${PURPLE},#A78BFA)` },
    { name: 'Priya Mehta',     role: 'Parent of Grade 8 student',   flag: '🇮🇳',
      text: 'EduNova gives me peace of mind. I can see every class, every score, every teacher note. Truly transparent!',
      avatar: 'PM', photo: 'https://i.pravatar.cc/160?img=32', grad: `linear-gradient(135deg,${BLUE},#38BDF8)` },
    { name: 'Zara Ahmed',      role: 'Student — Grade 12',          flag: '🇦🇪',
      text: 'Got 98% in Science boards. My tutor pushed me beyond the syllabus and built real conceptual understanding.',
      avatar: 'ZA', photo: 'https://i.pravatar.cc/160?img=47', grad: `linear-gradient(135deg,${GREEN},#4ADE80)` },
  ];

  const setApart = [
    { icon: '🎓', title: 'Curated Curriculum',         color: PURPLE,    desc: 'Research-backed, personalised curriculum focused on mastery through depth, not just rote learning.' },
    { icon: '📊', title: 'Detailed Progress Reports',  color: BLUE,      desc: 'Comprehensive reports after every class, weekly summaries and quarterly progress reviews.' },
    { icon: '⭐', title: 'Vetted Expert Mentors',       color: ORANGE,    desc: 'Less than 5% of applicants are accepted. Ongoing quality reviews based on student feedback.' },
    { icon: '🤖', title: 'AI-Aided Learning Path',     color: GREEN,     desc: 'Smart tools identify gaps, recommend topics and automatically adapt the learning path.' },
    { icon: '🌐', title: 'Engaging Live Sessions',     color: '#EC4899', desc: 'Interactive sessions, instant quizzes, virtual whiteboards and gamified challenges keep kids engaged.' },
    { icon: '📝', title: '1,000+ Practice Exercises',  color: '#EAB308', desc: 'Curated worksheets, exercises and projects ensure concept mastery far beyond the classroom.' },
  ];

  const faqs = [
    { q: 'How long are the classes and how often?',
      a: 'Classes run 55–60 minutes each. Most students attend 2–4 sessions per week. You choose any schedule that works — mornings, evenings or weekends.' },
    { q: 'Is the FREE demo really free? Any hidden charges?',
      a: 'Absolutely 100% free. No credit card, no payment details needed. Book, attend, and decide — completely zero strings attached.' },
    { q: 'What subjects and grades do you cover?',
      a: 'Mathematics, Science, English, Coding, Social Studies and Arts for Grades 1–12 (KG to Grade 12). Competitive exam prep (JEE, NEET, Boards) also available.' },
    { q: 'How are EduNova tutors selected?',
      a: 'Less than 5% of applicants are accepted. Each tutor undergoes academic verification, demo sessions and ongoing student-feedback quality reviews.' },
    { q: 'Can parents track their child\'s progress?',
      a: 'Yes! The Parent Portal shows real-time attendance, scores, teacher notes, assignment status and monthly progress reports — all on your phone.' },
    { q: 'What if my child doesn\'t like the assigned tutor?',
      a: 'No problem. Switch tutors anytime — we\'ll match you with a better fit at zero extra cost. Your child\'s comfort and confidence come first.' },
  ];

  /* ── Style helpers ────────────────────────────────── */
  const S = { // section padding
    padding: 'clamp(52px,6vw,92px) clamp(16px,5vw,80px)',
  };
  const card = (extra = {}) => ({
    background: 'var(--color-surface)',
    borderRadius: 20,
    border: '1px solid var(--color-border)',
    padding: '24px',
    ...extra,
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════ NAV ═══ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: isDark
          ? navScrolled ? 'rgba(14,14,22,.95)' : 'rgba(14,14,22,.7)'
          : navScrolled ? 'rgba(255,255,255,.97)' : 'rgba(255,255,255,.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: navScrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        transition: 'background .25s, border-color .25s, box-shadow .25s',
        boxShadow: navScrolled ? '0 1px 24px rgba(0,0,0,.08)' : 'none',
        padding: '0 clamp(16px,5vw,80px)',
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--grad-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.95rem', fontWeight: 900, color: '#fff',
            boxShadow: `0 4px 14px ${PURPLE}55`,
          }}>E</div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-.01em', color: 'var(--text-primary)' }}>EduNova</span>
        </div>

        {/* Links */}
        <div className="land-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[['#how-it-works','How It Works'],['#subjects','Subjects'],['#testimonials','Reviews'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href} className="land-nav-link">{label}</a>
          ))}
          <Link to="/tutors" className="land-nav-link">Tutors</Link>
          <button onClick={toggle} className="theme-toggle" title="Toggle theme" aria-label="Toggle theme" style={{ marginLeft: 4 }}>
            <div className={`toggle-track ${isDark ? 'toggle-track-dark' : 'toggle-track-light'}`}>
              <div className={`toggle-thumb ${isDark ? 'toggle-thumb-dark' : 'toggle-thumb-light'}`}>
                <span style={{ lineHeight: 1 }}>{isDark ? '🌙' : '☀️'}</span>
              </div>
            </div>
          </button>
          <RippleButton
            className="btn btn-sm"
            style={{ background: 'var(--color-surface)', color: 'var(--text-primary)', border: '1px solid var(--color-border)', fontWeight: 700, marginLeft: 8, whiteSpace: 'nowrap' }}
            onClick={() => navigate('/login')}
          >Login</RippleButton>
          <RippleButton
            className="btn btn-sm"
            style={{ background: `linear-gradient(135deg,${ORANGE},#FF9A00)`, color: '#fff', fontWeight: 700, border: 'none', boxShadow: `0 4px 14px ${ORANGE}55`, marginLeft: 8, whiteSpace: 'nowrap' }}
            onClick={() => navigate('/register')}
          >Book FREE Trial</RippleButton>
        </div>
      </nav>

      {/* ══════════════════════════════════════ HERO ═══ */}
      <section style={{ ...S, paddingTop: 'clamp(80px,10vw,120px)', paddingBottom: 'clamp(80px,10vw,120px)', position: 'relative', overflow: 'hidden', minHeight: '88vh', display: 'flex', alignItems: 'center' }}>

        {/* Dot-grid texture */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: isDark ? .04 : .028, backgroundImage: `radial-gradient(circle,${PURPLE} 1px,transparent 1px)`, backgroundSize: '36px 36px' }} />

        {/* ── Giant atom — absolute background ─────────────── */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '50%', left: '62%',
          transform: 'translate(-50%,-50%)',
          width: 720, height: 720,
          pointerEvents: 'none', zIndex: 0,
        }}>
          {/* Ambient glow */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 520, height: 520, borderRadius: '50%', background: `radial-gradient(circle,${PURPLE}20 0%,${BLUE}10 52%,transparent 72%)`, filter: 'blur(70px)' }} />

          {/* Nucleus */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 82, height: 82, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #e8d5ff 0%, ${PURPLE} 45%, #2A0EA8 100%)`,
            boxShadow: `0 0 0 10px ${PURPLE}18, 0 0 44px ${PURPLE}55, 0 0 100px ${PURPLE}22`,
            zIndex: 10,
            animation: 'nucl-pulse 2.8s ease-in-out infinite',
          }} />

          {/* 5 orbit ellipses — each carries an electron dot + a subject chip */}
          {[
            { rx: 320, ry: 90, dur: '6s',  color: PURPLE,    label: 'Physics',        icon: '⚛️',  startDeg: 0   },
            { rx: 320, ry: 90, dur: '8s',  color: BLUE,      label: 'Chemistry',      icon: '🧪',  startDeg: 72  },
            { rx: 320, ry: 90, dur: '10s', color: GREEN,     label: 'Mathematics',    icon: '📐',  startDeg: 144 },
            { rx: 320, ry: 90, dur: '7s',  color: ORANGE,    label: 'English',        icon: '📖',  startDeg: 216 },
            { rx: 320, ry: 90, dur: '9s',  color: '#EC4899',  label: 'Social Studies', icon: '🌍',  startDeg: 288 },
          ].map((o, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: o.rx * 2, height: o.ry * 2,
              marginTop: -o.ry, marginLeft: -o.rx,
              borderRadius: '50%',
              border: `1.5px solid ${o.color}38`,
              boxShadow: `0 0 18px ${o.color}10`,
              animation: `orbit-spin-${i} ${o.dur} linear infinite`,
            }}>
              {/* Electron dot at top of orbit */}
              <div style={{
                position: 'absolute', top: -7, left: '50%', marginLeft: -7,
                width: 14, height: 14, borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, #fff, ${o.color})`,
                boxShadow: `0 0 10px ${o.color}, 0 0 26px ${o.color}80`,
              }} />
              {/* Subject chip at bottom — counter-rotates to stay upright as orbit spins */}
              <div style={{
                position: 'absolute', bottom: -18, left: '50%',
                animation: `counter-spin-${i} ${o.dur} linear infinite`,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: isDark ? 'rgba(16,8,44,.9)' : 'rgba(255,255,255,.92)',
                  border: `1.5px solid ${o.color}55`,
                  borderRadius: 22, padding: '7px 13px',
                  backdropFilter: 'blur(12px)',
                  boxShadow: `0 4px 20px ${o.color}30, 0 1px 0 rgba(255,255,255,.6) inset`,
                  fontSize: '.74rem', fontWeight: 800, color: o.color,
                  whiteSpace: 'nowrap',
                  transform: 'translateX(-50%)',
                }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>{o.icon}</span>
                  {o.label}
                </div>
              </div>
            </div>
          ))}

          {/* Quantum pulse rings from nucleus */}
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: n * 150, height: n * 150,
              marginTop: -(n * 75), marginLeft: -(n * 75),
              borderRadius: '50%',
              border: `1px solid ${PURPLE}${['14', '0D', '08'][n - 1]}`,
              animation: `q-ring-expand 4.2s ease-out ${n * 1.3}s infinite`,
              pointerEvents: 'none',
            }} />
          ))}
        </div>

        {/* ── Hero text (z-index above atom) ───────────────── */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{ maxWidth: 600 }}>

            {/* Live pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${PURPLE}14`, border: `1px solid ${PURPLE}30`,
              borderRadius: 100, padding: '6px 16px', marginBottom: 26,
            }}>
              <span className="dot-live" />
              <span style={{ fontSize: '.78rem', fontWeight: 700, color: PURPLE, letterSpacing: '.03em' }}>50,000+ students learning live</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem,4.8vw,3.8rem)', fontWeight: 900,
              letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 22,
              color: 'var(--text-primary)',
            }}>
              1:1 Live Online Tutoring<br />
              for <span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Every Child</span> to<br />
              Reach Their{' '}
              <span style={{ background: `linear-gradient(135deg,${ORANGE},#FFAB00)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Full Potential</span>
            </h1>

            <p style={{ fontSize: 'clamp(.93rem,1.8vw,1.08rem)', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 36, maxWidth: 520 }}>
              One child. One expert mentor. Real attention and measurable growth.
              Personalised live classes, real-time feedback and a parent portal to keep you informed — all in one platform.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}>
              <RippleButton
                className="btn btn-lg"
                style={{ background: `linear-gradient(135deg,${ORANGE},#FF9A00)`, color: '#fff', fontWeight: 800, border: 'none', boxShadow: `0 10px 30px ${ORANGE}50`, borderRadius: 14 }}
                onClick={() => navigate('/register')}
              >Book a FREE Trial &nbsp;→</RippleButton>
              <RippleButton
                className="btn btn-ghost btn-lg"
                style={{ borderRadius: 14 }}
                onClick={() => navigate('/tutors')}
              >Browse Tutors</RippleButton>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4285F4 0%,#34A853 34%,#FBBC04 67%,#EA4335 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>G</div>
                <div>
                  <div style={{ display: 'flex', gap: 1 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: '#FBBC04', fontSize: '.75rem' }}>★</span>)}</div>
                  <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>4.8/5 · 1,200+ reviews</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                <span style={{ fontSize: '1.2rem' }}>🎓</span>
                <div>
                  <div style={{ fontSize: '.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>50,000+</div>
                  <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Students Taught</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Keyframes ────────────────────────────────────── */}
        <style>{`
          @keyframes orbit-spin-0 {
            from { transform: rotate(0deg);   }
            to   { transform: rotate(360deg); }
          }
          @keyframes orbit-spin-1 {
            from { transform: rotate(72deg);  }
            to   { transform: rotate(432deg); }
          }
          @keyframes orbit-spin-2 {
            from { transform: rotate(144deg); }
            to   { transform: rotate(504deg); }
          }
          @keyframes orbit-spin-3 {
            from { transform: rotate(216deg); }
            to   { transform: rotate(576deg); }
          }
          @keyframes orbit-spin-4 {
            from { transform: rotate(288deg); }
            to   { transform: rotate(648deg); }
          }
          @keyframes counter-spin-0 {
            from { transform: translateX(-50%) rotate(0deg);    }
            to   { transform: translateX(-50%) rotate(-360deg); }
          }
          @keyframes counter-spin-1 {
            from { transform: translateX(-50%) rotate(-72deg);  }
            to   { transform: translateX(-50%) rotate(-432deg); }
          }
          @keyframes counter-spin-2 {
            from { transform: translateX(-50%) rotate(-144deg); }
            to   { transform: translateX(-50%) rotate(-504deg); }
          }
          @keyframes counter-spin-3 {
            from { transform: translateX(-50%) rotate(-216deg); }
            to   { transform: translateX(-50%) rotate(-576deg); }
          }
          @keyframes counter-spin-4 {
            from { transform: translateX(-50%) rotate(-288deg); }
            to   { transform: translateX(-50%) rotate(-648deg); }
          }
          @keyframes nucl-pulse {
            0%,100% { box-shadow: 0 0 0 10px ${PURPLE}18, 0 0 44px ${PURPLE}55, 0 0 100px ${PURPLE}22; }
            50%      { box-shadow: 0 0 0 16px ${PURPLE}10, 0 0 70px ${PURPLE}70, 0 0 140px ${PURPLE}35; }
          }
          @keyframes q-ring-expand {
            0%   { opacity: .4; transform: translate(-50%,-50%) scale(.82); }
            100% { opacity: 0;  transform: translate(-50%,-50%) scale(1.55); }
          }
        `}</style>
      </section>

      {/* ═══════════════════════════════════ STATS BAND ═══ */}
      <section style={{ background: 'var(--grad-primary)', padding: 'clamp(36px,5vw,56px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.08) 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 28, position: 'relative' }}>
          {[
            { v: c1, l: 'Students Taught',  icon: '🎓' },
            { v: c2, l: 'Expert Tutors',    icon: '🏫' },
            { v: c3, l: 'Satisfaction Rate',icon: '⭐' },
            { v: c4 + '/5', l: 'Google Rating', icon: '🌟' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 'clamp(1.7rem,3vw,2.4rem)', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-.02em' }}>{s.v}</div>
              <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.7)', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════ WHY 1:1 LEARNING ════════ */}
      <section style={{ ...S, background: isDark ? 'var(--color-bg)' : '#F8F6FF', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{
            position: 'absolute',
            right: 'clamp(-80px, -5vw, -24px)',
            top: '50%',
            width: 'min(620px, 60vw)',
            height: 'min(430px, 78%)',
            transform: 'translateY(-50%) rotate(-6deg)',
            borderRadius: 28,
            backgroundImage: "url('/images/student-studying.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isDark ? 0.18 : 0.15,
            boxShadow: '0 26px 70px rgba(0,0,0,.18)',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? 'linear-gradient(90deg, var(--color-bg) 55%, rgba(0,0,0,0) 100%)'
              : 'linear-gradient(90deg, #F8F6FF 52%, rgba(248,246,255,0) 100%)',
          }} />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
            <Chip label="The Science Behind It" color={PURPLE} />
            <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 16 }}>
              The Proven Advantage of{' '}
              <span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>1:1 Learning</span>
            </h2>
            {/* Bloom callout */}
            <div style={{
              display: 'inline-block', maxWidth: 700,
              background: isDark ? `${PURPLE}14` : `${PURPLE}08`,
              border: `1px solid ${PURPLE}28`,
              borderRadius: 16, padding: '18px 28px', textAlign: 'left',
            }}>
              <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
                <strong style={{ color: PURPLE }}>Bloom's 2-Sigma Effect:</strong> Research by educational psychologist Benjamin Bloom showed that students who receive 1:1 tutoring perform <strong>2 standard deviations better</strong> than those in traditional classrooms — outperforming <strong>98% of their peers.</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}> At EduNova, we bring this proven principle to life every single day.</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
            {advantages.map((a, i) => (
              <TiltCard key={i} style={{ ...card(), borderLeft: `4px solid ${a.color}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0, background: a.color + '14', border: `1.5px solid ${a.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  {a.icon}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 6, color: 'var(--text-primary)' }}>{a.title}</h3>
                  <p style={{ fontSize: '.82rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{a.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" style={{ ...S }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
            <Chip label="Super Easy to Start" color={ORANGE} />
            <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 12 }}>
              Getting Started is{' '}
              <span style={{ background: `linear-gradient(135deg,${ORANGE},#FFAB00)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Incredibly Easy</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.95rem', maxWidth: 480, margin: '0 auto' }}>
              A working device and stable internet — that's all you need. Setup in under 5 minutes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 32 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                {/* Numbered icon circle */}
                <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 26px' }}>
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: s.color + '14', border: `3px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 66, height: 66, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', boxShadow: `0 10px 28px ${s.color}55` }}>
                      {s.icon}
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -4, right: -4,
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'var(--color-bg)', border: `2px solid ${s.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.72rem', fontWeight: 900, color: s.color,
                  }}>{s.num}</div>
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 10, color: 'var(--text-primary)' }}>{s.title}</h3>
                <p style={{ fontSize: '.84rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 auto', maxWidth: 280 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 52 }}>
            <RippleButton
              className="btn btn-lg"
              style={{ background: `linear-gradient(135deg,${ORANGE},#FF9A00)`, color: '#fff', fontWeight: 800, border: 'none', boxShadow: `0 10px 30px ${ORANGE}45`, borderRadius: 14 }}
              onClick={() => navigate('/register')}
            >Book a FREE Trial Class</RippleButton>
          </div>
        </div>
      </section>

      {/* ════════════════════════════ SUBJECTS ════════════ */}
      <section id="subjects" style={{ ...S, background: isDark ? `${PURPLE}06` : `${PURPLE}05` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
            <Chip label="All Age Groups · KG – Grade 12" color={PURPLE} />
            <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 12 }}>
              Online Courses for{' '}
              <span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Every Subject</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.95rem', maxWidth: 520, margin: '0 auto' }}>
              Well-researched, highly effective curriculum. Starting from just <strong>₹500 per class.</strong>
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 20 }}>
            {subjects.map((s, i) => (
              <SpotlightCard key={i} className="clay-glow" style={{
                ...card({ padding: '28px 24px', background: s.bg, border: `1.5px solid ${s.color}28`, cursor: 'pointer', borderRadius: 20, position: 'relative', overflow: 'hidden' }),
              }} onClick={() => navigate('/tutors')}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 16, boxShadow: `0 8px 22px ${s.color}45` }}>
                  {s.icon}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 8, color: 'var(--text-primary)' }}>{s.name}</h3>
                <p style={{ fontSize: '.82rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 16 }}>{s.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.8rem', color: s.color, fontWeight: 700 }}>
                  Explore classes <span>→</span>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ WHAT SETS US APART ════════ */}
      <section style={{ ...S }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
            <Chip label="Our Differentiators" color={GREEN} />
            <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 12 }}>
              What Really{' '}
              <span style={{ background: `linear-gradient(135deg,${GREEN},#4ADE80)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sets Us Apart</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
            {setApart.map((item, i) => (
              <TiltCard key={i} style={{ ...card({ borderRadius: 18 }) }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: item.color + '12', border: `1.5px solid ${item.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem' }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 6, color: 'var(--text-primary)' }}>{item.title}</h3>
                    <p style={{ fontSize: '.82rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ TESTIMONIALS ══════════ */}
      <section id="testimonials" style={{ ...S, background: isDark ? `${PURPLE}06` : '#F4F0FF' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
            <Chip label="Trusted by Parents · Loved by Students" color={PURPLE} />
            <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 6 }}>
              30,000+ Parents{' '}
              <span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Trust Us</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.95rem' }}>
              Consistently rated <span style={{ color: '#FBBC04' }}>⭐⭐⭐⭐⭐</span> <strong>4.8 / 5</strong> on Google Reviews
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {testimonials.map((t, i) => (
              <TiltCard key={i} style={{ ...card({ borderRadius: 20, padding: '28px 24px' }) }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#FBBC04', fontSize: '1.05rem' }}>★</span>)}
                </div>
                {/* Quote */}
                <p style={{ fontSize: '.9rem', color: 'var(--text-primary)', lineHeight: 1.78, marginBottom: 22, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                  <PlaceholderImage
                    src={t.photo || t.studentPhoto || t.image || ''}
                    alt={`${t.name} photo`}
                    label="Student photo"
                    hint="Add student image"
                    icon="🧑‍🎓"
                    width={44}
                    height={44}
                    borderRadius={999}
                    showMeta={false}
                    style={{ flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,.18)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-primary)' }}>{t.flag} {t.name}</div>
                    <div style={{ fontSize: '.74rem', color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURED TUTORS ══════════ */}
      {tutors.length > 0 && (
        <section id="tutors" style={{ ...S }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
              <Chip label="Expert Instructors" color={ORANGE} />
              <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 12 }}>
                Personalized Guidance from{' '}
                <span style={{ background: `linear-gradient(135deg,${ORANGE},#FFAB00)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Top Mentors</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '.95rem', maxWidth: 520, margin: '0 auto' }}>
                Each tutor is handpicked. Book a free demo before you commit — no payment needed.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(285px,1fr))', gap: 24, marginBottom: 40 }}>
              {tutors.slice(0, 4).map((t) => {
                return (
                  <TiltCard key={t.id} style={{ ...card({ padding: 0, borderRadius: 22, overflow: 'hidden', position: 'relative' }) }}>
                    {/* Colored top bar */}
                    <div style={{ height: 5, background: t.avatarGrad }} />

                    <div style={{ padding: '14px 14px 0' }}>
                      <PlaceholderImage
                        src={t.photo || t.image || t.profileImage || ''}
                        alt={`${t.name} profile`}
                        label="Tutor photo slot"
                        hint="Add featured tutor image"
                        icon="🧑‍🏫"
                        height={130}
                        borderRadius={12}
                      />
                    </div>

                    <div style={{ padding: '20px 22px 22px' }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ width: 54, height: 54, borderRadius: 14, flexShrink: 0, background: t.avatarGrad, color: '#fff', fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,.18)' }}>
                          {t.avatar}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 2 }}>{t.name}</div>
                          <div style={{ fontSize: '.78rem', color: PURPLE, fontWeight: 600, marginBottom: 6 }}>{t.speciality || t.subject}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className={`badge ${t.badgeCls}`} style={{ fontSize: '.6rem' }}>{t.badge}</span>
                            {t.experienceYears > 0 && (
                              <span style={{ fontSize: '.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.experienceYears}y exp</span>
                            )}
                            {t.grades && (
                              <span style={{ fontSize: '.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>· {t.grades}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {t.bio && (
                        <p style={{ fontSize: '.8rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {t.bio}
                        </p>
                      )}

                      {/* Rating row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ color: s <= Math.round(t.rating) ? '#FBBC04' : 'var(--color-border)', fontSize: '.82rem' }}>★</span>
                        ))}
                        <span style={{ fontSize: '.74rem', color: 'var(--text-muted)', marginLeft: 4 }}>{t.rating > 0 ? t.rating.toFixed(1) : '—'}</span>
                        <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>({t.totalReviews} reviews)</span>
                        {t.totalStudents > 0 && (
                          <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>🎓 {t.totalStudents} students</span>
                        )}
                      </div>

                      {/* Featured reviews */}
                      {t.featuredReviews?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                          {t.featuredReviews.slice(0, 2).map((r, ri) => (
                            <div key={ri} style={{
                              background: isDark ? `${PURPLE}0A` : `${PURPLE}07`,
                              border: `1px solid ${PURPLE}18`,
                              borderRadius: 10, padding: '9px 12px',
                            }}>
                              <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                                {[1,2,3,4,5].map(s => (
                                  <span key={s} style={{ color: s <= r.rating ? '#FBBC04' : 'var(--color-border)', fontSize: '.65rem' }}>★</span>
                                ))}
                              </div>
                              <p style={{ fontSize: '.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                "{r.text}"
                              </p>
                              <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>— {r.studentName}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      <RippleButton className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', borderRadius: 10 }} onClick={() => navigate('/tutors')}>
                        View Profile & Plans
                      </RippleButton>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
            <div style={{ textAlign: 'center' }}>
              <RippleButton className="btn btn-ghost btn-lg" style={{ borderRadius: 14 }} onClick={() => navigate('/tutors')}>
                Browse All Tutors &nbsp;→
              </RippleButton>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════ FAQ ════════════ */}
      <section id="faq" style={{ ...S, background: isDark ? `${PURPLE}05` : '#F8F6FF' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,52px)' }}>
            <Chip label="Frequently Asked Questions" color={PURPLE} />
            <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)' }}>
              Got{' '}
              <span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Questions?</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((faq, i) => (
              <div key={i}
                style={{ ...card({ padding: 0, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', borderColor: openFaq === i ? PURPLE : 'var(--color-border)', transition: 'border-color .2s' }) }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', gap: 16 }}>
                  <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-primary)' }}>{faq.q}</span>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: openFaq === i ? 'var(--grad-primary)' : 'var(--color-bg)',
                    border: `1.5px solid ${openFaq === i ? 'transparent' : 'var(--color-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.72rem', color: openFaq === i ? '#fff' : 'var(--text-muted)',
                    transition: 'all .2s', transform: openFaq === i ? 'rotate(180deg)' : 'none',
                  }}>▼</div>
                </div>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 18px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ paddingTop: 14, fontSize: '.875rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ FINAL CTA ══════════════ */}
      <section style={{ overflow: 'hidden' }}>
        <div style={{
          background: 'var(--grad-primary)',
          padding: 'clamp(64px,8vw,110px) clamp(16px,5vw,80px)',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -100, left: -100, width: 440, height: 440, borderRadius: '50%', background: 'rgba(255,255,255,.08)', filter: 'blur(42px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -120, right: -80, width: 520, height: 520, borderRadius: '50%', background: 'rgba(0,0,0,.14)', filter: 'blur(52px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .12, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.7) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 26, fontSize: '.77rem', fontWeight: 700, color: '#fff', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span className="dot-live" style={{ background: '#4ADE80' }} />
              Now Enrolling — 2025-26
            </div>

            <h2 style={{ fontSize: 'clamp(2rem,4.2vw,3.3rem)', fontWeight: 900, letterSpacing: '-.03em', lineHeight: 1.1, color: '#fff', marginBottom: 18, textShadow: '0 2px 20px rgba(0,0,0,.22)' }}>
              Join Thousands of Happy Parents<br />and Provide Quality Learning Today
            </h2>

            <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 'clamp(.9rem,1.5vw,1.05rem)', maxWidth: 520, margin: '0 auto 44px', lineHeight: 1.75 }}>
              Take a demo class for FREE and decide for yourself. A working device & stable internet is all you need!
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
              <RippleButton
                className="btn btn-lg"
                style={{ background: '#fff', color: PURPLE, fontWeight: 800, boxShadow: '0 10px 36px rgba(0,0,0,.26)', borderRadius: 14 }}
                onClick={() => navigate('/register')}
              >Book FREE Demo Class &nbsp;→</RippleButton>
              <RippleButton
                className="btn btn-lg"
                style={{ background: 'rgba(255,255,255,.16)', color: '#fff', border: '1.5px solid rgba(255,255,255,.4)', backdropFilter: 'blur(8px)', borderRadius: 14 }}
                onClick={() => navigate('/tutors')}
              >Browse Tutors</RippleButton>
            </div>

            <div style={{ display: 'flex', gap: 'clamp(20px,4vw,60px)', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[{v:'50,000+',l:'Students Taught'},{v:'120+',l:'Expert Tutors'},{v:'4.8/5',l:'Google Rating'},{v:'100%',l:'Free Demo'}].map((s,i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900, color: '#fff', letterSpacing: '-.02em' }}>{s.v}</div>
                  <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.7)', fontWeight: 500, marginTop: 3, letterSpacing: '.04em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ FOOTER ══════════════════ */}
      <footer style={{ background: isDark ? '#0D0F1C' : '#14103A', color: 'rgba(255,255,255,.6)', padding: 'clamp(48px,6vw,72px) clamp(16px,5vw,80px) clamp(24px,3vw,36px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 44, marginBottom: 52 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.88rem', fontWeight: 900, color: '#fff' }}>E</div>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>EduNova</span>
              </div>
              <p style={{ fontSize: '.82rem', lineHeight: 1.75, maxWidth: 240, marginBottom: 22 }}>
                1:1 live online tutoring for students in Grades 1–12. Real attention. Clear progress. Real results.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['📘','📸','🎥','💼','🐦'].map((ic,i) => (
                  <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', cursor: 'pointer', transition: 'background .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}
                  >{ic}</div>
                ))}
              </div>
            </div>

            {/* Online Classes */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '.8rem', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '.07em' }}>Online Classes</h4>
              {['Math Classes for Kids','Science Tutoring','English Online Classes','Coding for Kids','Social Studies','Arts & Creativity'].map(l => (
                <div key={l} style={{ marginBottom: 10, fontSize: '.81rem', cursor: 'pointer', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = ''}
                >{l}</div>
              ))}
            </div>

            {/* Platform */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '.8rem', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '.07em' }}>Platform</h4>
              {['Find a Tutor','How It Works','Pricing & Plans','For Schools','Become a Teacher','Parent Portal'].map(l => (
                <div key={l} style={{ marginBottom: 10, fontSize: '.81rem', cursor: 'pointer', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = ''}
                >{l}</div>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '.8rem', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '.07em' }}>Get In Touch</h4>
              <div style={{ marginBottom: 16, fontSize: '.82rem' }}>
                <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>📧 Email</div>
                <div>support@edunova.com</div>
              </div>
              <div style={{ marginBottom: 16, fontSize: '.82rem' }}>
                <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>💬 WhatsApp</div>
                <div>+91 98765 43210</div>
              </div>
              <div style={{ marginTop: 24 }}>
                <RippleButton
                  className="btn btn-sm"
                  style={{ background: `linear-gradient(135deg,${ORANGE},#FF9A00)`, color: '#fff', fontWeight: 700, border: 'none', borderRadius: 10 }}
                  onClick={() => navigate('/register')}
                >Book FREE Trial</RippleButton>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.10)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '.77rem' }}>© 2026 EduNova Technologies Pvt. Ltd. All rights reserved.</div>
            <div style={{ display: 'flex', gap: 20, fontSize: '.77rem', flexWrap: 'wrap' }}>
              {['Terms & Conditions','Privacy Policy','Refund Policy'].map(l => (
                <span key={l} style={{ cursor: 'pointer', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = ''}
                >{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
