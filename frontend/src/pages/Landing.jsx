import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RippleButton from '../components/RippleButton';
import { fetchTutors } from '../api';
import PlaceholderImage from '../components/PlaceholderImage';

import meritLogo from '../../public/images/logo.png';

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
function Chip({ label, color = '#7C5CFC' }) {
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
  const isDark = false;
  const [tutors, setTutors]   = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [selectedStudyTab, setSelectedStudyTab] = useState(0);
  
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

  /* ── Dynamic Light/Dark variables ── */
  const PURPLE = '#0A9396'; // Deep Teal / Dark Cyan
  const ORANGE = '#E2711D'; // Terracotta / Rust Orange
  const GREEN  = '#2A9D8F'; // Complementary Green
  const BLUE   = '#E9C46A'; // Complementary Yellowish-Sand
  const ORBIT_BG = '#DDE1F0';
  const ORBIT_DOT = 'rgba(96, 116, 176, 0.32)';
  const ORBIT_CARD_BG = '#EEECE2';
  const ORBIT_BADGE_BG = 'rgba(236, 233, 221, 0.96)';

  /* ── Static data ──────────────────────────────────── */
  const effectivenessPoints = [
    { title: 'Personal Attention', desc: 'Every child gets the attention they need. Classes are adjusted to their pace and level.', color: isDark ? '#ff2d78' : '#0A9396' },
    { title: 'Strong Concept Building', desc: 'We focus on clear understanding so students do not just memorize, but truly learn.', color: isDark ? '#00ffcc' : '#E2711D' },
    { title: 'Real-Time Feedback', desc: 'Instant correction and guidance during class to improve quickly.', color: isDark ? '#ffe04a' : '#2A9D8F' },
    { title: 'Regular Progress Updates', desc: 'Parents stay informed with consistent feedback and performance tracking.', color: isDark ? '#ff7b54' : '#E9C46A' },
    { title: 'Guided by Experts', desc: 'Experienced teachers who support, motivate, and build confidence.', color: isDark ? '#4ade80' : '#E76F51' },
    { title: 'Flexible Learning', desc: 'Easy scheduling with options for 1:1 and small group classes.', color: isDark ? '#60a5fa' : '#F4A261' },
    { title: 'Encouraging Environment', desc: 'Students feel comfortable to ask questions and think independently.', color: isDark ? '#f472b6' : '#94D2BD' },
    { title: 'Worldwide Curriculum Coverage', desc: 'We support students following different curriculums like US Common Core, British, Australian, and CBSE, adapting lessons to match their school requirements.', color: isDark ? '#f59e0b' : '#005F73' },
  ];

  const orbitAmbientBadges = [
    { title: 'Learners', value: '50K+', tint: '#E9C46A', pos: { top: '15%', right: '5%' } },
    { title: 'Avg Rating', value: '4.8/5', tint: '#F4A261', pos: { top: '72%', right: '8%' } },
    { title: 'Live 1:1', value: 'Daily', tint: '#2A9D8F', pos: { top: '18%', left: '6%' } },
    { title: 'Reports', value: 'Weekly', tint: '#94D2BD', pos: { top: '76%', left: '10%' } },
  ];

  const orbitFloatingNotes = [
    { label: 'Demo classes', value: 'Live', icon: '📹', tint: '#E2711D', pos: { top: '8%', left: '20%' } },
    { label: 'Assignments', value: 'Checked', icon: '📝', tint: '#94D2BD', pos: { top: '14%', right: '18%' } },
    { label: 'Attendance', value: 'Tracked', icon: '✅', tint: '#2A9D8F', pos: { bottom: '10%', left: '30%' } },
    { label: 'Parent updates', value: 'Weekly', icon: '📣', tint: '#E76F51', pos: { bottom: '12%', right: '28%' } },
    { label: 'Fee status', value: 'On time', icon: '💳', tint: '#E9C46A', pos: { top: '50%', left: '8%' } },
    { label: 'Tutor match', value: 'Fast', icon: '🎯', tint: '#0A9396', pos: { top: '46%', right: '10%' } },
  ];

  const orbitInsightCards = [
    { title: '1:1 Concept Coaching', img: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=900&auto=format&fit=crop&q=80' },
    { title: 'Small Group Collaboration', img: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&auto=format&fit=crop&q=80' },
    { title: 'Live Doubt Solving', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&auto=format&fit=crop&q=80' },
    { title: 'Coding Practice Session', img: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=900&auto=format&fit=crop&q=80' },
    { title: 'Science Learning Lab', img: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=900&auto=format&fit=crop&q=80' },
    { title: 'Language & Communication Class', img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&auto=format&fit=crop&q=80' },
    { title: 'Progress Review with Mentor', img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&auto=format&fit=crop&q=80' },
    { title: 'Exam Strategy Workshop', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&auto=format&fit=crop&q=80' },
  ];

  const subjectColumns = [
    { name: 'Mathematics', desc: 'Arithmetic to advanced problem solving.' },
    { name: 'Science', desc: 'Physics, Chemistry and Biology with clarity.' },
    { name: 'English', desc: 'Grammar, writing and communication skills.' },
    { name: 'Coding', desc: 'Programming and computational thinking.' },
    { name: 'Social Studies', desc: 'History, Geography and Civics concepts.' },
  ];

  const testimonials = [
    { name: 'Aryan Sharma',    role: 'Student — Grade 10',          flag: '🇮🇳',
      text: 'My Maths score jumped from 62% to 94% in just 3 months. The 1:1 attention made all the difference!',
      avatar: 'AS', photo: 'https://i.pravatar.cc/160?img=12', grad: `linear-gradient(135deg,${PURPLE},#A78BFA)` },
    { name: 'Priya Mehta',     role: 'Parent of Grade 8 student',   flag: '🇮🇳',
      text: 'Merit Nook gives me peace of mind. I can see every class, every score, every teacher note. Truly transparent!',
      avatar: 'PM', photo: 'https://i.pravatar.cc/160?img=32', grad: `linear-gradient(135deg,${BLUE},#38BDF8)` },
    { name: 'Zara Ahmed',      role: 'Student — Grade 12',          flag: '🇦🇪',
      text: 'Got 98% in Science boards. My tutor pushed me beyond the syllabus and built real conceptual understanding.',
      avatar: 'ZA', photo: 'https://i.pravatar.cc/160?img=47', grad: `linear-gradient(135deg,${GREEN},#4ADE80)` },
  ];

  const setApart = [
    { title: 'One-to-One Learning', vid: import.meta.env.BASE_URL + 'videos/Generating_a_Moving_Video_From_Picture.mp4', img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80', color: PURPLE, desc: 'Live personalized classes with expert tutors. Your child receives complete attention with lessons tailored to their level, pace, and learning style. This ensures better understanding, faster improvement, and strong confidence in every concept.' },
    { title: 'Small Group Learning', vid: import.meta.env.BASE_URL + 'videos/PixVerse_V5-fast_Image_Text_720P_create_a_3_se.mp4?v=2', img: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80', color: BLUE, desc: 'Interactive learning in small groups of 3–5 students. Students learn together in a focused and engaging environment, where they can share ideas, ask questions, and stay motivated — while still receiving individual attention from the tutor.' },
    { title: 'Self-Paced Learning', vid: import.meta.env.BASE_URL + 'videos/PixVerse_V5-fast_Image_Text_720P_create_a_3_se(1).mp4', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80', color: ORANGE, desc: 'Flexible, interactive learning at your own pace. Perfect for independent learners, this mode offers structured lessons and practice material that students can access anytime, anywhere, allowing them to learn comfortably at their own speed.' },
  ];

  const faqs = [
    { q: 'How long are the classes and how often?',
      a: 'Classes run 55–60 minutes each. Most students attend 2–4 sessions per week. You choose any schedule that works — mornings, evenings or weekends.' },
    { q: 'Is the FREE demo really free? Any hidden charges?',
      a: 'Absolutely 100% free. No credit card, no payment details needed. Book, attend, and decide — completely zero strings attached.' },
    { q: 'What subjects and grades do you cover?',
      a: 'Mathematics, Science, English, Coding, Social Studies and Arts for Grades 1–12 (KG to Grade 12). Competitive exam prep (JEE, NEET, Boards) also available.' },
    { q: 'How are Merit Nook tutors selected?',
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
    <div data-theme="light" style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--text-primary)', overflowX: 'clip' }}>

      {/* ═══════════════════════════════════════ NAV ═══ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: navScrolled ? 'rgba(244, 248, 244, 1)' : '#F4F8F4',
        borderBottom: '3px solid #1C2216',
        transition: 'background .25s, border-color .25s, box-shadow .25s',
        boxShadow: navScrolled ? '0 1px 24px rgba(0,0,0,.08)' : 'none',
        padding: '0 clamp(16px,5vw,80px)',
        height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>

        {/* Logo */}
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

        {/* Links */}
        <div className="land-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[['#how-it-works','How It Works'],['#subjects','Subjects'],['#testimonials','Reviews'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href} className="land-nav-link" style={{color: 'var(--text-primary)', fontWeight: 800}}>{label}</a>
          ))}
          <Link to="/tutors" className="land-nav-link" style={{color: 'var(--text-primary)', fontWeight: 800}}>Tutors</Link>
          
          <RippleButton
            className="btn btn-sm"
            style={{ background: 'var(--color-surface)', color: 'var(--text-primary)', border: '1px solid var(--color-border)', fontWeight: 700, marginLeft: 8, whiteSpace: 'nowrap' }}
            onClick={() => navigate('/login')}
          >Login</RippleButton>
          <RippleButton
            className="btn btn-sm"
            style={{ background: `linear-gradient(135deg,${ORANGE},#FF9A00)`, color: '#1C2216', fontWeight: 700, border: 'none', boxShadow: `0 4px 14px ${ORANGE}55`, marginLeft: 8, whiteSpace: 'nowrap' }}
            onClick={() => navigate('/register')}
          >Book FREE Trial</RippleButton>
        </div>
      </nav>

      {/* ══════════════════════════════════════ HERO & SCROLL ORBIT ═══ */}
      <section ref={orbitRef} style={{ ...S, padding: 0, height: '400vh', position: 'relative', background: ORBIT_BG, borderBottom: '3px solid #1C2216' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          
          {/* Dot-grid texture */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.22, backgroundImage: `radial-gradient(circle,${ORBIT_DOT} 1px,transparent 1px)`, backgroundSize: '36px 36px' }} />

          {/* Ambient fill badges so the hero stays visually populated while scrolling */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
            {orbitAmbientBadges.map((badge, i) => (
              <div
                key={badge.title}
                style={{
                  position: 'absolute',
                  ...badge.pos,
                  background: ORBIT_BADGE_BG,
                  border: '2px solid #1C2216',
                  boxShadow: '4px 4px 0 #1C2216',
                  borderRadius: 14,
                  minWidth: 'clamp(120px, 12vw, 170px)',
                  padding: '10px 12px',
                  opacity: scrollProgress < 0.2 ? 0.96 : 0.72,
                  transform: `translateY(${Math.sin((scrollProgress * 8) + i) * 8}px)`,
                  transition: 'opacity .35s ease',
                }}
              >
                <div style={{ fontSize: '.7rem', fontWeight: 800, letterSpacing: '.05em', color: 'rgba(28,34,22,.75)', textTransform: 'uppercase' }}>{badge.title}</div>
                <div style={{ marginTop: 2, fontSize: '1.02rem', fontWeight: 900, color: '#1C2216' }}>
                  <span style={{ background: badge.tint, borderRadius: 8, padding: '1px 7px' }}>{badge.value}</span>
                </div>
              </div>
            ))}
            {orbitFloatingNotes.map((item, i) => (
              <div
                key={item.label}
                style={{
                  position: 'absolute',
                  ...item.pos,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: ORBIT_CARD_BG,
                  border: '2px solid #1C2216',
                  boxShadow: '4px 4px 0 #1C2216',
                  borderRadius: 16,
                  padding: '9px 12px',
                  minWidth: 'clamp(132px, 12vw, 182px)',
                  opacity: scrollProgress < 0.15 ? 0.96 : 0.78,
                  transform: `translateY(${Math.cos((scrollProgress * 7) + i) * 10}px) rotate(${Math.sin((scrollProgress * 5) + i) * 1.5}deg)`,
                  transition: 'opacity .35s ease',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 12, background: item.tint, border: '2px solid #1C2216', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '.66rem', fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(28,34,22,.72)' }}>{item.label}</div>
                  <div style={{ marginTop: 4, fontSize: '.95rem', fontWeight: 900, color: '#1C2216' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Overlay content: intro at left, then centered question + points */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            {scrollProgress < 0.1 ? (
              <div className="ani-up" style={{
                position: 'absolute',
                left: 'clamp(16px,6vw,96px)',
                top: 'clamp(18px, 4vh, 56px)',
                width: 'min(1100px, calc(100vw - 32px))',
                background: ORBIT_CARD_BG,
                border: '3px solid #1C2216',
                boxShadow: '8px 8px 0 #1C2216',
                padding: 'clamp(26px,4vw,46px)',
                borderRadius: 32,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 40,
                textAlign: 'left',
                pointerEvents: 'auto',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Math, English & Coding</span>
                    <span style={{ background: '#EAB308', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 800, border: '2px solid #1C2216' }}>Pre-K</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>to</span>
                    <span style={{ background: '#EAB308', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 800, border: '2px solid #1C2216' }}>Grade 12</span>
                  </div>
                  
                  <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 900, letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 22, color: 'var(--text-primary)' }}>
                    Personalized Online Tutoring for Every Child to Reach Their{' '}
                    <span style={{ background: 'var(--color-accent)', border: '2px solid #1C2216', padding: '2px 10px', borderRadius: 6, display: 'inline-block', transform: 'rotate(-1.5deg)', color: '#1C2216', marginTop: 4 }}>Full Potential</span>
                  </h1>
                  <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32, maxWidth: 640 }}>
                    Personalized live classes designed to build strong concepts, improve logical thinking, and track real progress — with regular feedback for parents. Our expert educators tailor each interactive session to your child's unique learning pace, ensuring academic excellence, boosted confidence, and a lifelong love for learning.
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                      className="hover-lift"
                      style={{
                        padding: '14px 32px',
                        borderRadius: 30,
                        border: 'none',
                        background: 'var(--color-primary)',
                        color: '#1C2216',
                        fontWeight: 800,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => navigate('/register')}
                    >
                      Parents, Start FREE Trial
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
                      <div style={{ display: 'flex' }}>
                        <img src="https://i.pravatar.cc/100?img=12" alt="Student" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #1C2216', objectFit: 'cover', zIndex: 3 }} />
                        <img src="https://i.pravatar.cc/100?img=32" alt="Student" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #1C2216', objectFit: 'cover', marginLeft: -12, zIndex: 2 }} />
                        <img src="https://i.pravatar.cc/100?img=47" alt="Student" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #1C2216', objectFit: 'cover', marginLeft: -12, zIndex: 1 }} />
                      </div>
                      <div style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        Joined by<br/><span style={{ color: '#EAB308', WebkitTextStroke: '1px #1C2216' }}>50K+</span> Learners
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right side image placeholder similar to the reference */}
                <div style={{ flex: '0 0 35%', display: 'none', '@media (min-width: 900px)': { display: 'block' } }}>
                  <img src="https://images.unsplash.com/photo-1555519391-44ab06ecdc91?w=600&auto=format&fit=crop&q=80" alt="Happy student" style={{ width: '100%', height: 'auto', borderRadius: 24, border: '3px solid #1C2216', transform: 'rotate(2deg)', boxShadow: '6px 6px 0px 0px #1C2216' }} />
                </div>
              </div>
            ) : scrollProgress < 0.2 ? (
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 'min(760px, calc(100vw - 32px))',
                background: ORBIT_CARD_BG,
                border: '3px solid #1C2216',
                boxShadow: '8px 8px 0 #1C2216',
                padding: 'clamp(26px,4vw,46px)',
                borderRadius: 24,
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', pointerEvents: 'auto',
                zIndex: 10
              }}>
                <h2 style={{ fontSize: 'clamp(1.8rem,3.6vw,3rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 8 }}>
                  What Makes Our Classes Effective
                </h2>
                <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, maxWidth: 620 }}>
                  We combine clear concepts, regular practice, and personal guidance for better results.
                </p>
              </div>
            ) : (
              (() => {
                const totalSubjects = effectivenessPoints.length;
                const segment = 0.8 / totalSubjects;
                const rawIdx = (scrollProgress - 0.2) / segment;
                let activeIdx = Math.floor(rawIdx);
                let isCapped = false;
                if (activeIdx >= totalSubjects) { activeIdx = totalSubjects - 1; isCapped = true; }
                if (activeIdx < 0) activeIdx = 0;
                
                const s = effectivenessPoints[activeIdx];
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

                return [
                  <div key={`text-${activeIdx}`} style={{
                    position: 'absolute',
                    top: '50%',
                    left: '25%', // Left position for text
                    transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scale})`,
                    width: 'min(450px, calc(100vw - 32px))',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    background: ORBIT_CARD_BG,
                    border: '3px solid #1C2216',
                    boxShadow: '8px 8px 0 #1C2216',
                    padding: 'clamp(24px,4vw,44px)', borderRadius: '24px',
                    pointerEvents: 'auto',
                    opacity, 
                    filter: `blur(${blur}px)`,
                    willChange: 'transform, opacity, filter',
                    zIndex: 20
                  }}>
                     <h3 style={{ fontSize: 'clamp(1.5rem,2.8vw,2.2rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 14 }}>
                       {s.title}
                     </h3>
                     <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>{s.desc}</p>
                  </div>,
                  <div key={`img-${activeIdx}`} style={{
                    position: 'absolute',
                    top: '50%',
                    left: '75%', // Equidistant from 50% as the left card (25%)
                    transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scale})`,
                    width: 'clamp(240px, 28vw, 430px)',
                    height: 'clamp(220px, 34vh, 340px)',
                    background: ORBIT_CARD_BG,
                    border: '3px solid #1C2216',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'stretch',
                    justifyContent: 'stretch',
                    color: '#1C2216',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    zIndex: 20,
                    opacity,
                    filter: `blur(${blur}px)`,
                    willChange: 'transform, opacity, filter',
                    boxShadow: '8px 8px 0 #1C2216',
                    overflow: 'hidden',
                  }}>
                    <img
                      src={orbitInsightCards[activeIdx % orbitInsightCards.length].img}
                      alt={orbitInsightCards[activeIdx % orbitInsightCards.length].title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', left: 12, bottom: 12, right: 12, background: 'rgba(255,255,255,.92)', border: '2px solid #1C2216', borderRadius: 12, padding: '8px 10px', textAlign: 'left' }}>
                      <div style={{ fontSize: '.68rem', letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(28,34,22,.7)' }}>Classroom Insight</div>
                      <div style={{ marginTop: 2, fontSize: '.9rem', fontWeight: 900, lineHeight: 1.3, color: '#1C2216' }}>{orbitInsightCards[activeIdx % orbitInsightCards.length].title}</div>
                    </div>
                  </div>
                ];
              })()
            )}
          </div>

          {/* Giant Rotating Atom: middle on scroll */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: scrollProgress < 0.1 ? '44%' : '50%',
              left: scrollProgress < 0.1
                ? 'clamp(70%, 75%, 82%)'
                : `calc(50% + ${(0.18 - Math.min(scrollProgress, 0.18)) * 0}%)`, // Kept in center during scroll
              transform: 'translate(-50%, -50%)',
              width: 700,
              height: 700,
              pointerEvents: 'none',
              zIndex: 0,
              transition: 'left .45s ease',
            }}
          >
            {/* Ambient glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: isDark ? `radial-gradient(circle,rgba(255,45,120,0.15) 0%,rgba(0,255,204,0.05) 50%,transparent 70%)` : `radial-gradient(circle,rgba(169,216,211,0.3) 0%,rgba(245,190,200,0.2) 52%,transparent 72%)`, filter: 'blur(80px)' }} />

            {/* Nucleus */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 90, height: 90, borderRadius: '50%', background: '#FCF6C8', border: '3px solid #1C2216', boxShadow: `4px 4px 0 rgba(28,34,22,1)`, zIndex: 10 }} />

            {/* Rotating Orbits Frame */}
            <div style={{
              width: '100%', height: '100%',
              transform: `rotate(${((scrollProgress >= 0.2 ? scrollProgress - 0.2 : 0) / 0.8) * 360}deg)`,
              willChange: 'transform'
            }}>
                {effectivenessPoints.map((o, i) => {
                 const rx = 320; const ry = 100;
                  const baseAngle = (i / effectivenessPoints.length) * 360;
                 // Determine which subject is currently "active" mathematically
                  const totalSubjects = effectivenessPoints.length;
                 const segment = 0.8 / totalSubjects;
                 const rawIdx = (scrollProgress - 0.2) / segment;
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
                    border: `3px solid ${o.color}`, boxShadow: 'none',
                    transform: `rotate(${baseAngle}deg)` 
                  }}>
                    {/* Electron dot (Glows hugely when its subject is active) */}
                    <div style={{
                      position: 'absolute', top: -10, left: '50%', marginLeft: -10,
                      width: 20, height: 20, borderRadius: '50%',
                      background: o.color,
                      boxShadow: isChipActive ? `0 0 0 4px #FFFFFF40` : 'none',
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

      {/* ═══════════════════════ SUBJECTS ═══════════════ */}
      <section id="subjects" style={{ ...S, borderBottom: '3px solid #1C2216' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(32px,4vw,48px)' }}>
            <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 10 }}>
              Subjects We Cover
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.95rem', maxWidth: 620, margin: '0 auto' }}>
              Structured subject-wise support with personalized teaching for each learner.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {subjectColumns.map((item, i) => (
              <SpotlightCard key={i} className="neon-box" style={{ ...card({ borderRadius: 16, padding: '18px 18px', border: 'none' }) }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  
                  <div>
                    <h3 style={{ fontSize: '.95rem', margin: '0 0 5px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h3>
                    <p style={{ margin: 0, fontSize: '.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ WHAT SETS US APART ════════ */}
      <section style={{ ...S, background: '#D8ED92', borderBottom: '3px solid #1C2216' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
            <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 16 }}>
              Find the Right{' '}
              <span style={{ background: 'var(--color-primary)', border: '2px solid #1C2216', padding: '2px 10px', borderRadius: 6, display: 'inline-block', transform: 'rotate(-2deg)', color: '#1C2216', marginLeft: 8 }}>Learning Style</span>
              {' '}for Your Child
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 740, margin: '0 auto', lineHeight: 1.6 }}>
              Whether your child needs personal attention, enjoys learning in small groups, or prefers to learn at their own pace, we offer flexible options to support every learning style.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
            {setApart.map((tab, idx) => {
              const isActive = selectedStudyTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedStudyTab(idx)}
                  className="hover-lift"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 30,
                    border: '2px solid #1C2216',
                    background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: isActive ? '#1C2216' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '3px 3px 0px 0px #1C2216' : 'none'
                  }}
                >
                  {tab.title}
                </button>
              );
            })}
          </div>

          <div className="neon-box-accent" style={{ ...card({ borderRadius: 24, border: 'none', padding: 0 }), overflow: 'hidden' }}>
            {setApart.map((item, i) => (
              <div
                key={i}
                style={{
                  display: selectedStudyTab === i ? 'flex' : 'none',
                  flexDirection: 'row',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: '1 1 300px', padding: 'clamp(24px, 5vw, 48px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 style={{ fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', marginBottom: 16, color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                </div>
                {item.vid ? (
                  <div style={{ flex: '1 1 300px', minHeight: 450, position: 'relative', overflow: 'hidden' }}>
                    <video
                      src={item.vid}
                      autoPlay
                      muted
                      loop
                      playsInline
                      onTimeUpdate={(e) => { if (e.target.currentTime >= 3) e.target.currentTime = 0; }}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.2)' }}
                      onLoadedData={(e) => { e.target.play().catch(() => {}); }}
                    />
                  </div>
                ) : item.img ? (
                  <div style={{ flex: '1 1 300px', minHeight: 450, position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ TESTIMONIALS ══════════ */}
      <section id="testimonials" style={{ ...S, background: '#FCF6C8', borderBottom: '3px solid #1C2216' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
            <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 6 }}>
              30,000+ Parents{' '}
              <span style={{ background: 'var(--color-primary-2)', border: '2px solid #1C2216', padding: '2px 10px', borderRadius: 6, display: 'inline-block', transform: 'rotate(-1deg)', color: '#1C2216', marginLeft: 8 }}>Trust Us</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.95rem' }}>
              Consistently rated <span style={{ color: '#FBBC04' }}>⭐⭐⭐⭐⭐</span> <strong>4.8 / 5</strong> on Google Reviews
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {testimonials.map((t, i) => (
              <TiltCard key={i} className="neon-box-accent" style={{ ...card({ borderRadius: 20, padding: '28px 24px', border: 'none' }) }}>
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
        <section id="tutors" style={{ ...S, borderBottom: '3px solid #1C2216' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,60px)' }}>
              <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)', marginBottom: 12 }}>
                Personalized Guidance from{' '}
                <span style={{ background: 'var(--color-accent)', border: '2px solid #1C2216', padding: '2px 10px', borderRadius: 6, display: 'inline-block', transform: 'rotate(1deg)', color: '#1C2216', marginLeft: 8 }}>Top Mentors</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '.95rem', maxWidth: 520, margin: '0 auto' }}>
                Each tutor is handpicked. Book a free demo before you commit — no payment needed.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(285px,1fr))', gap: 24, marginBottom: 40 }}>
              {tutors.slice(0, 4).map((t) => {
                return (
                  <TiltCard key={t.id} className="neon-box" style={{ ...card({ padding: 0, borderRadius: 22, overflow: 'hidden', position: 'relative', border: 'none' }) }}>
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
                        <div style={{ width: 54, height: 54, borderRadius: 14, flexShrink: 0, background: t.avatarGrad, color: '#1C2216', fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,.18)' }}>
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
            <h2 style={{ fontSize: 'clamp(1.7rem,3.5vw,2.8rem)', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-primary)' }}>
              Got{' '}
              <span style={{ background: 'var(--color-accent-2)', border: '2px solid #1C2216', padding: '2px 10px', borderRadius: 6, display: 'inline-block', transform: 'rotate(2deg)', color: '#1C2216', marginLeft: 8 }}>Questions?</span>
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
          background: ORANGE, borderTop: '3px solid #1C2216', borderBottom: '3px solid #1C2216',
          padding: 'clamp(64px,8vw,110px) clamp(16px,5vw,80px)',
          textAlign: 'left',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -100, left: -100, width: 440, height: 440, borderRadius: '50%', background: 'rgba(255,255,255,.08)', filter: 'blur(42px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -120, right: -80, width: 520, height: 520, borderRadius: '50%', background: 'rgba(0,0,0,.14)', filter: 'blur(52px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .12, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.7) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', justifyContent: 'center', gap: 60, textAlign: 'left' }}>
            <div style={{ flex: '1 1 440px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '3px solid #1C2216', borderRadius: 100, padding: '6px 18px', marginBottom: 26, fontSize: '.77rem', fontWeight: 700, color: '#1C2216', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span className="dot-live" style={{ background: '#4ADE80' }} />
              Now Enrolling — 2025-26
            </div>

            <h2 style={{ fontSize: 'clamp(2rem,4.2vw,3.3rem)', fontWeight: 900, letterSpacing: '-.03em', lineHeight: 1.1, color: '#1C2216', marginBottom: 18, textShadow: '0 2px 20px rgba(0,0,0,.22)' }}>
              Join Thousands of Happy Parents<br />and Provide Quality Learning Today
            </h2>

            <p style={{ color: 'rgba(28,34,22,.85)', fontSize: 'clamp(.9rem,1.5vw,1.05rem)', maxWidth: 520, margin: '0 0 44px', lineHeight: 1.75 }}>
              Take a demo class for FREE and decide for yourself. A working device & stable internet is all you need!
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-start', flexWrap: 'wrap', marginBottom: 52 }}>
              <RippleButton
                className="btn btn-lg"
                style={{ background: '#1C2216', color: '#FFFFFF', fontWeight: 800, boxShadow: '6px 6px 0 #1C2216', border: '2px solid #1C2216', borderRadius: 14 }}
                onClick={() => navigate('/register')}
              >Book FREE Demo Class &nbsp;→</RippleButton>
              <RippleButton
                className="btn btn-lg"
                style={{ background: '#FFFFFF', color: '#1C2216', border: '3px solid #1C2216', boxShadow: '6px 6px 0 #1C2216', borderRadius: 14 }}
                onClick={() => navigate('/tutors')}
              >Browse Tutors</RippleButton>
            </div>

            <div style={{ display: 'flex', gap: 'clamp(20px,4vw,60px)', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
              {[{v:'50,000+',l:'Students Taught'},{v:'120+',l:'Expert Tutors'},{v:'4.8/5',l:'Google Rating'},{v:'100%',l:'Free Demo'}].map((s,i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900, color: '#1C2216', letterSpacing: '-.02em' }}>{s.v}</div>
                  <div style={{ fontSize: '.7rem', color: 'rgba(28,34,22,.75)', fontWeight: 500, marginTop: 3, letterSpacing: '.04em' }}>{s.l}</div>
                </div>
              ))}
            </div>
            </div>
            
            <div style={{ flex: '0 0 auto', position: 'relative' }}>
               <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&auto=format&fit=crop&q=80" alt="Students with tutor" style={{ width: 'min(100vw - 32px, 420px)', height: '420px', objectFit: 'cover', borderRadius: '24px', border: '3px solid #1C2216', boxShadow: '14px 14px 0 #1C2216', transform: 'rotate(2deg)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ FOOTER ══════════════════ */}
      <footer style={{ background: BLUE, color: 'rgba(28,34,22,.85)', borderTop: '3px solid #1C2216', padding: 'clamp(48px,6vw,72px) clamp(16px,5vw,80px) clamp(24px,3vw,36px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 44, marginBottom: 52 }}>
            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 0, width: '100%' }}>
                <img
                  src={meritLogo}
                  alt="Merit Nook logo"
                  style={{ width: '100%', maxWidth: 320, height: 120, objectFit: 'contain', objectPosition: 'center', transform: 'translateY(10px)' }}
                />
              </div>
              <p style={{ fontSize: '.82rem', lineHeight: 1.75, maxWidth: 260, margin: '0 0 22px 0' }}>
                1:1 live online tutoring for students in Grades 1–12. Real attention. Clear progress. Real results.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
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
              <h4 style={{ color: '#1C2216', fontWeight: 700, fontSize: '.8rem', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '.07em' }}>Online Classes</h4>
              {['Math Classes for Kids','Science Tutoring','English Online Classes','Coding for Kids','Social Studies','Arts & Creativity'].map(l => (
                <div key={l} style={{ marginBottom: 10, fontSize: '.81rem', cursor: 'pointer', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = ''}
                >{l}</div>
              ))}
            </div>

            {/* Platform */}
            <div>
              <h4 style={{ color: '#1C2216', fontWeight: 700, fontSize: '.8rem', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '.07em' }}>Platform</h4>
              {['Find a Tutor','How It Works','Pricing & Plans','For Schools','Become a Teacher','Parent Portal'].map(l => (
                <div key={l} style={{ marginBottom: 10, fontSize: '.81rem', cursor: 'pointer', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = ''}
                >{l}</div>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ color: '#1C2216', fontWeight: 700, fontSize: '.8rem', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '.07em' }}>Get In Touch</h4>
              <div style={{ marginBottom: 16, fontSize: '.82rem' }}>
                <div style={{ color: '#1C2216', fontWeight: 600, marginBottom: 4 }}>📧 Email</div>
                <div>support@meritnook.com</div>
              </div>
              <div style={{ marginBottom: 16, fontSize: '.82rem' }}>
                <div style={{ color: '#1C2216', fontWeight: 600, marginBottom: 4 }}>💬 WhatsApp</div>
                <div>+91 98765 43210</div>
              </div>
              <div style={{ marginTop: 24 }}>
                <RippleButton
                  className="btn btn-sm"
                  style={{ background: `linear-gradient(135deg,${ORANGE},#FF9A00)`, color: '#1C2216', fontWeight: 700, border: 'none', borderRadius: 10 }}
                  onClick={() => navigate('/register')}
                >Book FREE Trial</RippleButton>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.10)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '.77rem' }}>© 2026 Merit Nook Technologies Pvt. Ltd. All rights reserved.</div>
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
