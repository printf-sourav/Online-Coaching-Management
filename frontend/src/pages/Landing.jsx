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
  
  // Ref and state for scroll-linked orbit
  const orbitRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => { fetchTutors().then(setTutors); }, []);
  
  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!orbitRef.current) return;
      const rect = orbitRef.current.getBoundingClientRect();
      // Orbit section is 400vh tall. Sticky content is 100vh.
      // Maximum scroll distance inside section is 300vh.
      const scrollDistance = rect.height - window.innerHeight;
      let progress = -rect.top / scrollDistance;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const c1 = useCounter('50000+');
  const c2 = useCounter('120+');
  const c3 = useCounter('98%');
  const c4 = useCounter('4.8');

  /* ── Static data ──────────────────────────────────── */
  const subjects = [
    { icon: '📐', name: 'Mathematics', desc: 'From arithmetic to calculus — concept mastery at every grade.', color: '#ff2d78', bg: 'transparent' },
    { icon: '🔬', name: 'Science', desc: 'Physics, Chemistry & Biology through experiments & real examples.', color: '#00ffcc', bg: 'transparent' },
    { icon: '📝', name: 'English', desc: 'Grammar, literature, writing skills and confident communication.', color: '#ffe04a', bg: 'transparent' },
    { icon: '💻', name: 'Coding', desc: 'Python, Web Dev & App Dev — from scratch to real projects.', color: '#ff2d78', bg: 'transparent' },
    { icon: '🌍', name: 'Social Studies', desc: 'History, Geography, Civics and current-affairs expertise.', color: '#00ffcc', bg: 'transparent' },
    { icon: '🎨', name: 'Arts & Creativity', desc: 'Visual arts, design thinking and creative expression for kids.', color: '#ffe04a', bg: 'transparent' },
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
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', overflowX: 'clip' }}>

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

      {/* ══════════════════════════════════════ HERO & SCROLL ORBIT ═══ */}
      <section ref={orbitRef} style={{ ...S, padding: 0, height: '400vh', position: 'relative', background: 'var(--color-bg)' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          
          {/* Dot-grid texture */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.15, backgroundImage: `radial-gradient(circle,rgba(255,45,120,0.4) 1px,transparent 1px)`, backgroundSize: '36px 36px' }} />

          {/* Centered Text Details overlaying the orbit */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            {scrollProgress < 0.1 ? (
              <div className="ani-up" style={{ 
                background: 'radial-gradient(circle, rgba(14,14,22,0.95) 0%, rgba(14,14,22,0.6) 50%, transparent 100%)', 
                padding: '50px', borderRadius: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                pointerEvents: 'auto' 
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `rgba(255,45,120,0.1)`, border: `1px solid rgba(255,45,120,0.3)`, borderRadius: 100, padding: '6px 16px', marginBottom: 26 }} className="neon-box">
                  <span className="dot-live" />
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#ff2d78', letterSpacing: '.03em' }} className="neon-text">Scroll to explore subjects</span>
                </div>
                <h1 style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)', fontWeight: 900, letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 22, color: 'var(--text-primary)' }} className="neon-text">
                  Neon Tokyo<br />
                  <span style={{ color: '#00ffcc' }} className="neon-text">Interactive</span> Learning
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 36, maxWidth: 500 }}>
                  Experience the future of education with immersive 1:1 sessions, real-time feedback, and a premium learning environment.
                </p>
              </div>
            ) : (
              (() => {
                const totalSubjects = subjects.length;
                const segment = 0.9 / totalSubjects;
                const rawIdx = (scrollProgress - 0.1) / segment;
                let activeIdx = Math.floor(rawIdx);
                let isCapped = false;
                if (activeIdx >= totalSubjects) { activeIdx = totalSubjects - 1; isCapped = true; }
                if (activeIdx < 0) activeIdx = 0;
                
                const s = subjects[activeIdx];
                let localProgress = isCapped ? 0.5 : (rawIdx - activeIdx);
                
                let opacity = 1;
                let translateX = 0;
                let translateY = 0;
                let scale = 1;
                let blur = 0;
                
                if (localProgress < 0.25) {
                  const p = localProgress / 0.25; // 0 to 1
                  opacity = Math.pow(p, 2);
                  translateX = (1 - p) * 120; // Starts slightly right, holographic shift
                  translateY = (1 - p) * 20;
                  scale = 0.85 + (p * 0.15); // scales smoothly from 85% to 100%
                  blur = (1 - p) * 15; // blurs out of focus at the start
                } else if (localProgress > 0.75) {
                  const p = (localProgress - 0.75) / 0.25; // 0 to 1
                  opacity = 1 - p;
                  translateX = -(p * 120); // moves left
                  translateY = -(p * 20);
                  scale = 1 - (p * 0.1);
                  blur = p * 15;
                }

                return (
                  <div key={activeIdx} style={{ 
                    maxWidth: 600, 
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    background: 'radial-gradient(circle, rgba(14,14,22,0.95) 0%, rgba(14,14,22,0.6) 50%, transparent 100%)',
                    padding: '50px', borderRadius: '40px',
                    pointerEvents: 'auto',
                    opacity, 
                    transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                    filter: `blur(${blur}px)`,
                    willChange: 'transform, opacity, filter'
                  }}>
                     <div style={{ width: 80, height: 80, borderRadius: 20, background: `${s.color}15`, border: `2px solid ${s.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: 24, boxShadow: `0 0 30px ${s.color}40`, color: s.color }}>
                       {s.icon}
                     </div>
                     <h2 style={{ fontSize: 'clamp(2.5rem,4vw,3.5rem)', fontWeight: 900, letterSpacing: '-.02em', color: s.color, marginBottom: 16, textShadow: `0 0 20px ${s.color}60` }}>
                       {s.name}
                     </h2>
                     <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 450 }}>{s.desc}</p>
                     
                     <RippleButton
                        className="btn btn-lg neon-box"
                        style={{ marginTop: 30, background: `linear-gradient(135deg,${s.color},transparent)`, color: '#fff', border: `1px solid ${s.color}`, fontWeight: 800 }}
                        onClick={() => navigate('/tutors')}
                      >Explore classes →</RippleButton>
                  </div>
                );
              })()
            )}
          </div>

          {/* Centered Giant Rotating Atom */}
          <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 700, height: 700, pointerEvents: 'none', zIndex: 0 }}>
            {/* Ambient glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle,rgba(255,45,120,0.15) 0%,rgba(0,255,204,0.05) 50%,transparent 70%)`, filter: 'blur(80px)' }} />

            {/* Nucleus */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, #fff 0%, #ff2d78 45%, #b3004e 100%)`, boxShadow: `0 0 0 12px rgba(255,45,120,0.15), 0 0 60px rgba(255,45,120,0.6), 0 0 120px rgba(255,45,120,0.3)`, zIndex: 10 }} />

            {/* Rotating Orbits Frame */}
            <div style={{
              width: '100%', height: '100%',
              transform: `rotate(${((scrollProgress >= 0.1 ? scrollProgress - 0.1 : 0) / 0.9) * 360}deg)`,
              willChange: 'transform'
            }}>
              {subjects.map((o, i) => {
                 const rx = 320; const ry = 100;
                 const baseAngle = (i / subjects.length) * 360;
                 const frameRotation = ((scrollProgress >= 0.1 ? scrollProgress - 0.1 : 0) / 0.9) * 360;
                 // Determine which subject is currently "active" mathematically
                 const totalSubjects = subjects.length;
                 const segment = 0.9 / totalSubjects;
                 const rawIdx = (scrollProgress - 0.1) / segment;
                 let activeIdx = Math.floor(rawIdx);
                 if (activeIdx >= totalSubjects) activeIdx = totalSubjects - 1;
                 if (activeIdx < 0) activeIdx = 0;
                 
                 // If this is the active subject, fade its orbit chip out.
                 const isChipActive = i === activeIdx;

                 return (
                  <div key={i} style={{ 
                    position: 'absolute', top: '50%', left: '50%', 
                    width: rx * 2, height: ry * 2, 
                    marginTop: -ry, marginLeft: -rx, borderRadius: '50%', 
                    border: `1.5px solid ${o.color}40`, boxShadow: `0 0 20px ${o.color}15, inset 0 0 20px ${o.color}15`,
                    transform: `rotate(${baseAngle}deg)` 
                  }}>
                    {/* Electron dot (Glows hugely when its subject is active) */}
                    <div style={{
                      position: 'absolute', top: -10, left: '50%', marginLeft: -10,
                      width: 20, height: 20, borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 35%, #fff, ${o.color})`,
                      boxShadow: isChipActive ? `0 0 30px ${o.color}, 0 0 60px ${o.color}` : `0 0 10px ${o.color}`,
                      transform: isChipActive ? `scale(1.8)` : `scale(1)`,
                      transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s'
                    }} />
                  </div>
                 );
              })}
            </div>
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
              <RippleButton className="btn btn-ghost neon-box btn-lg" style={{ borderRadius: 14 }} onClick={() => navigate('/tutors')}>
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
