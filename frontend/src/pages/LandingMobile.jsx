import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RippleButton from '../components/RippleButton';
import { fetchTutors } from '../api';
import PlaceholderImage from '../components/PlaceholderImage';

import { meritNookLogoUrl as meritLogo } from '../lib/publicAssets';

/* Same palette as desktop Landing */
const PURPLE = '#0A9396';
const ORANGE = '#E2711D';
const GREEN  = '#2A9D8F';
const BLUE   = '#E9C46A';
const CARD_BG = '#EEECE2';
const PAGE_BG = '#DDE1F0';
const STROKE  = '#1C2216';

const B = import.meta.env.BASE_URL || '/';

const effectivenessPoints = [
  { title: 'Personal Attention', desc: 'Every child gets the attention they need. Classes are adjusted to their pace and level.', img: `${B}images/merit-personal-attention.jpeg`, color: '#0A9396' },
  { title: 'Strong Concept Building', desc: 'We focus on clear understanding so students do not just memorize, but truly learn.', img: `${B}images/merit-strong-concepts.jpeg`, color: '#E2711D' },
  { title: 'Real-Time Feedback', desc: 'Instant correction and guidance during class to improve quickly.', img: `${B}images/merit-realtime-feedback.png`, color: '#2A9D8F' },
  { title: 'Regular Progress Updates', desc: 'Parents stay informed with consistent feedback and performance tracking.', img: `${B}images/merit-parent-progress.jpeg`, color: '#E9C46A' },
  { title: 'Guided by Experts', desc: 'Experienced teachers who support, motivate, and build confidence.', img: `${B}images/merit-guided-by-experts.png`, color: '#E76F51' },
  { title: 'Flexible Learning', desc: 'Easy scheduling with options for 1:1 and small group classes.', img: `${B}images/merit-flexible-learning.png`, color: '#F4A261' },
  { title: 'Encouraging Environment', desc: 'Students feel comfortable to ask questions and think independently.', img: `${B}images/merit-encouraging-environment.png`, color: '#94D2BD' },
  { title: 'Worldwide Curriculum Coverage', desc: 'Lessons adapted to US Common Core, British, Australian, CBSE and more.', img: `${B}images/merit-worldwide-curriculum.png`, color: '#005F73' },
];

const subjectColumns = [
  { icon: '🔢', name: 'Mathematics', desc: 'Arithmetic to advanced problem solving.' },
  { icon: '🔬', name: 'Science', desc: 'Physics, Chemistry and Biology with clarity.' },
  { icon: '📖', name: 'English', desc: 'Grammar, writing and communication skills.' },
  { icon: '💻', name: 'Coding', desc: 'Programming and computational thinking.' },
];

const languagePrograms = [
  { icon: '🇮🇳', name: 'Hindi' },
  { icon: '🇪🇸', name: 'Spanish' },
  { icon: '🇫🇷', name: 'French' },
];

const testimonials = [
  { name: 'Aryan Sharma', role: 'Student — Grade 10', flag: '🇮🇳', text: 'My Maths score jumped from 62% to 94% in just 3 months. The 1:1 attention made all the difference!', photo: 'https://i.pravatar.cc/160?img=12' },
  { name: 'Priya Mehta', role: 'Parent of Grade 8 student', flag: '🇮🇳', text: 'Merit Nook gives me peace of mind. I can see every class, every score, every teacher note. Truly transparent!', photo: 'https://i.pravatar.cc/160?img=32' },
  { name: 'Zara Ahmed', role: 'Student — Grade 12', flag: '🇦🇪', text: 'Got 98% in Science boards. My tutor pushed me beyond the syllabus and built real conceptual understanding.', photo: 'https://i.pravatar.cc/160?img=47' },
];

const setApart = [
  { title: 'One-to-One Learning', desc: 'Live personalized classes with expert tutors. Lessons tailored to your child\'s level, pace and learning style.' },
  { title: 'Small Group Learning', desc: 'Interactive small groups of 3–5 students. Share ideas and stay motivated, with individual attention from the tutor.' },
  { title: 'Self-Paced Learning', desc: 'Flexible learning at your own pace. Structured lessons and practice anytime, anywhere.' },
];

const faqs = [
  { q: 'How long are the classes and how often?', a: 'Classes run 55–60 minutes each. Most students attend 2–4 sessions per week. You choose any schedule that works.' },
  { q: 'Is the FREE demo really free? Any hidden charges?', a: 'Absolutely 100% free. No credit card, no payment details needed. Book, attend, and decide.' },
  { q: 'What subjects and grades do you cover?', a: 'Mathematics, Science, English, Coding for Grades 1–12 (KG to Grade 12). Competitive exam prep available too.' },
  { q: 'How are Merit Nook tutors selected?', a: 'Less than 5% of applicants are accepted. Each tutor undergoes academic verification, demo sessions and ongoing quality reviews.' },
  { q: 'Can parents track their child\'s progress?', a: 'Yes. The Parent Portal shows real-time attendance, scores, teacher notes, assignment status and monthly progress reports.' },
  { q: 'What if my child doesn\'t like the assigned tutor?', a: 'No problem. Switch tutors anytime — we\'ll match a better fit at zero extra cost.' },
];

/* tiny helpers */
const card = (extra = {}) => ({
  background: CARD_BG,
  border: `2.5px solid ${STROKE}`,
  borderRadius: 20,
  boxShadow: `5px 5px 0 ${STROKE}`,
  padding: 18,
  ...extra,
});

export default function LandingMobile() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [tab, setTab] = useState(0);
  const videoRef = useRef(null);
  const [vidPlaying, setVidPlaying] = useState(true);

  useEffect(() => { fetchTutors().then(setTutors).catch(() => {}); }, []);

  const sectionPad = 'clamp(36px, 8vw, 56px) 16px';

  return (
    <div
      data-theme="light"
      data-page="landing"
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--text-primary)',
        overflowX: 'clip',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ── NAV ───────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 80,
        background: '#F4F8F4',
        borderBottom: `2px solid ${STROKE}`,
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <img
          src={meritLogo}
          alt="Merit Nook"
          style={{ height: 56, width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
          onClick={() => navigate('/')}
          loading="eager"
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <RippleButton
            className="btn btn-sm"
            style={{ background: '#FFFFFF', color: STROKE, border: `2px solid ${STROKE}`, fontWeight: 700, padding: '7px 12px', borderRadius: 10, boxShadow: `2px 2px 0 ${STROKE}` }}
            onClick={() => navigate('/login')}
          >Login</RippleButton>
          <RippleButton
            className="btn btn-sm"
            style={{ background: ORANGE, color: STROKE, fontWeight: 800, border: `2px solid ${STROKE}`, padding: '7px 12px', borderRadius: 10, boxShadow: `2px 2px 0 ${STROKE}` }}
            onClick={() => navigate('/register')}
          >FREE Trial</RippleButton>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{ background: PAGE_BG, padding: sectionPad, borderBottom: `2px solid ${STROKE}` }}>
        <div style={card({ padding: 22 })}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ background: '#EAB308', padding: '3px 10px', borderRadius: 20, fontSize: '.8rem', fontWeight: 800, border: `2px solid ${STROKE}` }}>Pre-K</span>
            <span style={{ fontWeight: 800 }}>to</span>
            <span style={{ background: '#EAB308', padding: '3px 10px', borderRadius: 20, fontSize: '.8rem', fontWeight: 800, border: `2px solid ${STROKE}` }}>Grade 12</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 6vw, 2rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: 14, letterSpacing: '-.02em' }}>
            Personalized Online Tutoring for Every Child to Reach Their{' '}
            <span style={{ background: '#FCF6C8', border: `2px solid ${STROKE}`, padding: '1px 8px', borderRadius: 6, display: 'inline-block', transform: 'rotate(-1deg)' }}>Full Potential</span>
          </h1>
          <p style={{ fontSize: '.95rem', lineHeight: 1.6, color: '#324030', marginBottom: 18 }}>
            Live, expert-led classes — Math, English, Coding, Science. Build strong concepts, improve thinking, and track real progress.
          </p>
          <RippleButton
            className="btn"
            style={{ width: '100%', justifyContent: 'center', background: ORANGE, color: STROKE, fontWeight: 800, border: `2px solid ${STROKE}`, padding: '14px 18px', borderRadius: 14, boxShadow: `4px 4px 0 ${STROKE}` }}
            onClick={() => navigate('/register')}
          >
            Start FREE Trial →
          </RippleButton>

          {/* avatars + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, justifyContent: 'center' }}>
            <div style={{ display: 'flex' }}>
              {[12, 32, 47].map((n, i) => (
                <img
                  key={n}
                  src={`https://i.pravatar.cc/100?img=${n}`}
                  alt=""
                  style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${STROKE}`, marginLeft: i === 0 ? 0 : -10, objectFit: 'cover' }}
                  loading="lazy"
                />
              ))}
            </div>
            <span style={{ fontSize: '.8rem', fontWeight: 700 }}>
              <span style={{ color: '#EAB308', WebkitTextStroke: `1px ${STROKE}` }}>50K+</span> Learners
            </span>
          </div>
        </div>
      </section>

      {/* ── EFFECTIVENESS POINTS (simple stack — no orbit) ── */}
      <section style={{ padding: sectionPad, borderBottom: `2px solid ${STROKE}`, background: '#FCF6C8' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-.02em', textAlign: 'center', marginBottom: 6 }}>
          What Makes Our Classes Effective
        </h2>
        <p style={{ textAlign: 'center', fontSize: '.88rem', color: '#324030', marginBottom: 22 }}>
          Clear concepts, regular practice, personal guidance — for real results.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {effectivenessPoints.map((p, i) => (
            <div key={i} style={card({ padding: 0, overflow: 'hidden' })}>
              <img
                src={p.img}
                alt={p.title}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', borderBottom: `2px solid ${STROKE}` }}
              />
              <div style={{ padding: 16 }}>
                <div style={{ display: 'inline-block', background: p.color, color: '#fff', padding: '3px 10px', borderRadius: 100, fontSize: '.66rem', fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8, border: `2px solid ${STROKE}` }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, marginBottom: 6 }}>{p.title}</h3>
                <p style={{ fontSize: '.88rem', lineHeight: 1.6, color: '#324030', margin: 0 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SUBJECTS ──────────────────────────────────────── */}
      <section id="subjects" style={{ padding: sectionPad, borderBottom: `2px solid ${STROKE}` }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textAlign: 'center', marginBottom: 4 }}>Subjects We Cover</h2>
        <p style={{ textAlign: 'center', fontSize: '.85rem', color: '#324030', marginBottom: 18 }}>
          Structured subject-wise support with personalized teaching.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {subjectColumns.map((s, i) => (
            <div key={i} style={card({ padding: 14, boxShadow: `3px 3px 0 ${STROKE}` })}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '.92rem' }}>{s.name}</div>
              <div style={{ fontSize: '.76rem', color: '#324030', lineHeight: 1.5, marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card({ padding: 18, marginTop: 18 }) }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, marginBottom: 6 }}>Explore Our Language Programs</h3>
          <p style={{ fontSize: '.84rem', color: '#324030', marginBottom: 12, lineHeight: 1.55 }}>
            Fun and interactive language learning programs designed for all levels.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {languagePrograms.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: `2px solid ${STROKE}`, borderRadius: 10, padding: '8px 12px', fontSize: '.86rem', fontWeight: 700, boxShadow: `2px 2px 0 ${STROKE}` }}>
                <span>{l.icon}</span><span>{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT SETS US APART (tabs) ─────────────────────── */}
      <section style={{ padding: sectionPad, background: '#D8ED92', borderBottom: `2px solid ${STROKE}` }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textAlign: 'center', marginBottom: 4 }}>
          Find the Right{' '}
          <span style={{ background: '#FCF6C8', border: `2px solid ${STROKE}`, padding: '1px 8px', borderRadius: 6, display: 'inline-block', transform: 'rotate(-1deg)' }}>Learning Style</span>
        </h2>
        <p style={{ textAlign: 'center', fontSize: '.85rem', color: '#324030', marginBottom: 16 }}>
          Personal, group, or self-paced — pick what fits your child.
        </p>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, WebkitOverflowScrolling: 'touch' }}>
          {setApart.map((s, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              style={{
                whiteSpace: 'nowrap',
                padding: '9px 14px',
                borderRadius: 100,
                border: `2px solid ${STROKE}`,
                background: tab === i ? '#FCF6C8' : '#FFFFFF',
                color: STROKE,
                fontWeight: 800, fontSize: '.82rem', cursor: 'pointer',
                boxShadow: tab === i ? `3px 3px 0 ${STROKE}` : 'none',
              }}
            >
              {s.title}
            </button>
          ))}
        </div>
        <div style={card({ padding: 18 })}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 8 }}>{setApart[tab].title}</h3>
          <p style={{ fontSize: '.9rem', lineHeight: 1.6, color: '#324030', margin: 0 }}>{setApart[tab].desc}</p>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section style={{ padding: sectionPad, background: '#FCF6C8', borderBottom: `2px solid ${STROKE}` }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textAlign: 'center', marginBottom: 4 }}>
          30,000+ Parents <span style={{ background: '#D8ED92', border: `2px solid ${STROKE}`, padding: '1px 8px', borderRadius: 6, display: 'inline-block', transform: 'rotate(-1deg)' }}>Trust Us</span>
        </h2>
        <p style={{ textAlign: 'center', fontSize: '.82rem', color: '#324030', marginBottom: 18 }}>
          ⭐⭐⭐⭐⭐ <strong>4.8 / 5</strong> on Google Reviews
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {testimonials.map((t, i) => (
            <div key={i} style={card({ padding: 16 })}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#FBBC04', fontSize: '.95rem' }}>★</span>)}
              </div>
              <p style={{ fontSize: '.86rem', lineHeight: 1.65, marginBottom: 12, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: `1px solid rgba(28,34,22,.12)` }}>
                <img src={t.photo} alt={t.name} style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${STROKE}`, objectFit: 'cover' }} loading="lazy" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '.86rem' }}>{t.flag} {t.name}</div>
                  <div style={{ fontSize: '.72rem', color: '#5E6D5D' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TUTORS (preview) ──────────────────────────────── */}
      {tutors.length > 0 && (
        <section style={{ padding: sectionPad, borderBottom: `2px solid ${STROKE}` }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textAlign: 'center', marginBottom: 4 }}>
            Top <span style={{ background: '#FCF6C8', border: `2px solid ${STROKE}`, padding: '1px 8px', borderRadius: 6, display: 'inline-block', transform: 'rotate(1deg)' }}>Mentors</span>
          </h2>
          <p style={{ textAlign: 'center', fontSize: '.82rem', color: '#324030', marginBottom: 16 }}>Each tutor is handpicked. Free demo, no payment needed.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tutors.slice(0, 3).map(t => (
              <div key={t.id} style={card({ padding: 0, overflow: 'hidden' })}>
                <div style={{ height: 4, background: t.avatarGrad || ORANGE }} />
                <div style={{ padding: 14 }}>
                  <PlaceholderImage
                    src={t.photo || t.image || t.profileImage || ''}
                    alt={`${t.name} profile`}
                    label="Tutor photo"
                    icon="🧑‍🏫"
                    height={120}
                    borderRadius={10}
                  />
                  <div style={{ marginTop: 10, fontWeight: 800, fontSize: '.95rem' }}>{t.name}</div>
                  <div style={{ fontSize: '.76rem', color: PURPLE, fontWeight: 700, marginBottom: 6 }}>{t.speciality || t.subject}</div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ color: s <= Math.round(t.rating || 0) ? '#FBBC04' : '#ddd', fontSize: '.78rem' }}>★</span>
                    ))}
                    <span style={{ fontSize: '.7rem', color: '#5E6D5D', marginLeft: 4 }}>{(t.rating || 0).toFixed?.(1) || '—'}</span>
                  </div>
                  <RippleButton className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: '#FFF', color: STROKE, border: `2px solid ${STROKE}`, fontWeight: 700, borderRadius: 10, boxShadow: `2px 2px 0 ${STROKE}` }} onClick={() => navigate('/tutors')}>
                    View Profile →
                  </RippleButton>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <RippleButton className="btn" style={{ background: '#FCF6C8', color: STROKE, border: `2px solid ${STROKE}`, fontWeight: 800, borderRadius: 12, boxShadow: `3px 3px 0 ${STROKE}`, padding: '10px 18px' }} onClick={() => navigate('/tutors')}>
              Browse All Tutors →
            </RippleButton>
          </div>
        </section>
      )}

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section id="faq" style={{ padding: sectionPad, background: '#F8F6FF', borderBottom: `2px solid ${STROKE}` }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textAlign: 'center', marginBottom: 16 }}>
          Got <span style={{ background: '#FFB87A', border: `2px solid ${STROKE}`, padding: '1px 8px', borderRadius: 6, display: 'inline-block', transform: 'rotate(2deg)' }}>Questions?</span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} style={card({ padding: 0, boxShadow: open ? `3px 3px 0 ${STROKE}` : `2px 2px 0 ${STROKE}` })}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: 800, fontSize: '.9rem', color: STROKE }}
                >
                  <span style={{ paddingRight: 10 }}>{f.q}</span>
                  <span style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                </button>
                {open && (
                  <div style={{ padding: '0 16px 14px', fontSize: '.84rem', lineHeight: 1.7, color: '#324030', borderTop: `1px solid rgba(28,34,22,.12)`, paddingTop: 12 }}>
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FINAL CTA (with video) ────────────────────────── */}
      <section style={{ background: ORANGE, borderTop: `2px solid ${STROKE}`, borderBottom: `2px solid ${STROKE}`, padding: `clamp(40px, 10vw, 60px) 16px` }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: `2px solid ${STROKE}`, borderRadius: 100, padding: '5px 14px', marginBottom: 14, fontSize: '.7rem', fontWeight: 800, color: STROKE, letterSpacing: '.06em', textTransform: 'uppercase' }}>
          <span className="dot-live" style={{ background: '#4ADE80' }} />
          Now Enrolling — 2025-26
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, lineHeight: 1.15, color: STROKE, marginBottom: 10 }}>
          Join Thousands of Happy Parents and Provide Quality Learning Today
        </h2>
        <p style={{ color: 'rgba(28,34,22,.85)', fontSize: '.92rem', marginBottom: 18, lineHeight: 1.6 }}>
          Take a demo class for FREE and decide for yourself. A working device & stable internet is all you need!
        </p>

        {/* Video block */}
        <div style={{ width: '100%', borderRadius: 18, border: `2.5px solid ${STROKE}`, boxShadow: `5px 5px 0 ${STROKE}`, overflow: 'hidden', background: STROKE, aspectRatio: '4/5', maxHeight: '70vh' }}>
          <video
            ref={videoRef}
            src={`${B}videos/merit-join-parents-cta.mp4`}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onPlay={() => setVidPlaying(true)}
            onPause={() => setVidPlaying(false)}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <button
            type="button"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              if (v.paused) v.play().catch(() => {});
              else v.pause();
            }}
            style={{ background: '#FFFFFF', color: STROKE, border: `2px solid ${STROKE}`, borderRadius: 10, padding: '7px 14px', fontWeight: 800, fontSize: '.84rem', boxShadow: `3px 3px 0 ${STROKE}`, cursor: 'pointer' }}
          >
            {vidPlaying ? 'Pause Video' : 'Play Video'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', marginTop: 22 }}>
          <RippleButton className="btn" style={{ background: STROKE, color: '#FFFFFF', fontWeight: 800, border: `2px solid ${STROKE}`, borderRadius: 12, boxShadow: `4px 4px 0 ${STROKE}`, justifyContent: 'center', padding: '12px 16px' }} onClick={() => navigate('/register')}>Book FREE Demo Class →</RippleButton>
          <RippleButton className="btn" style={{ background: '#FFFFFF', color: STROKE, fontWeight: 800, border: `2px solid ${STROKE}`, borderRadius: 12, boxShadow: `4px 4px 0 ${STROKE}`, justifyContent: 'center', padding: '12px 16px' }} onClick={() => navigate('/tutors')}>Browse Tutors</RippleButton>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 22 }}>
          {[{ v: '50K+', l: 'Students' }, { v: '120+', l: 'Tutors' }, { v: '4.8/5', l: 'Rating' }, { v: '100%', l: 'Free Demo' }].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', background: '#FFFFFF', border: `2px solid ${STROKE}`, borderRadius: 12, padding: '10px 8px', boxShadow: `3px 3px 0 ${STROKE}` }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: STROKE }}>{s.v}</div>
              <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'rgba(28,34,22,.7)', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ background: BLUE, color: 'rgba(28,34,22,.85)', borderTop: `2px solid ${STROKE}`, padding: '32px 16px 22px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <img src={meritLogo} alt="Merit Nook" style={{ width: '70%', maxWidth: 240, height: 'auto', objectFit: 'contain', margin: '0 auto', display: 'block' }} loading="lazy" />
          <p style={{ fontSize: '.8rem', lineHeight: 1.6, marginTop: 6 }}>
            1:1 live online tutoring for Grades 1–12. Real attention. Clear progress.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <h4 style={{ color: STROKE, fontSize: '.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Classes</h4>
            {['Math','Science','English','Coding'].map(l => <div key={l} style={{ fontSize: '.78rem', marginBottom: 5 }}>{l}</div>)}
          </div>
          <div>
            <h4 style={{ color: STROKE, fontSize: '.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Platform</h4>
            <Link to="/tutors" style={{ display: 'block', fontSize: '.78rem', marginBottom: 5, color: 'inherit' }}>Find a Tutor</Link>
            <div style={{ fontSize: '.78rem', marginBottom: 5 }}>How It Works</div>
            <div style={{ fontSize: '.78rem', marginBottom: 5 }}>Pricing</div>
            <div style={{ fontSize: '.78rem', marginBottom: 5 }}>Parent Portal</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: `2px solid ${STROKE}`, borderRadius: 12, padding: 12, marginBottom: 14, boxShadow: `3px 3px 0 ${STROKE}` }}>
          <div style={{ fontWeight: 800, fontSize: '.78rem', color: STROKE, marginBottom: 4 }}>📧 support@meritnook.com</div>
          <div style={{ fontWeight: 800, fontSize: '.78rem', color: STROKE }}>💬 +91 98765 43210</div>
        </div>

        <RippleButton
          className="btn"
          style={{ width: '100%', justifyContent: 'center', background: ORANGE, color: STROKE, fontWeight: 800, border: `2px solid ${STROKE}`, borderRadius: 12, boxShadow: `4px 4px 0 ${STROKE}`, padding: '12px 16px' }}
          onClick={() => navigate('/register')}
        >
          Book FREE Trial
        </RippleButton>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: '.7rem', opacity: .8 }}>
          © 2026 Merit Nook Technologies Pvt. Ltd.
        </div>
      </footer>
    </div>
  );
}
