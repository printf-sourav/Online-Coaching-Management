import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import RippleButton from '../components/RippleButton';
import PlaceholderImage from '../components/PlaceholderImage';
import { apiFeaturedReviews, apiFeaturedPlatformReviews } from '../api';
import { Container, Row, Col, Navbar, Nav, Carousel } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Homepage.css';

/* ── Animated counter (intersection-triggered) ────────────── */
function useAnimatedCounter(end, duration = 2000) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(String(end).replace(/[^0-9]/g, ''), 10);
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(eased * num));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  const suffix = String(end).replace(/[0-9]/g, '');
  return { ref, display: `${val.toLocaleString()}${suffix}` };
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function Homepage() {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [activeProgram, setActiveProgram] = useState(0);
  const [testimonialPage, setTestimonialPage] = useState(0);
  const [testimonials, setTestimonials] = useState([]);

  const defaultTestimonials = [
    { name: 'Aryan Sharma', role: 'Student – Grade 10', text: 'The 1-on-1 classes completely transformed my understanding of mathematics. My scores went from 65% to 94% in just three months!', avatar: 'AS', grad: 'var(--grad-primary)', rating: 5 },
    { name: 'Dr. Priya Nair', role: 'Parent', text: "My daughter's confidence has skyrocketed since joining. The personalized attention and regular progress updates give me complete peace of mind.", avatar: 'PN', grad: 'var(--grad-accent)', rating: 5 },
    { name: 'Rahul Verma', role: 'Student – Grade 12', text: 'The small group classes are amazing — peer learning combined with expert guidance. The competitive environment pushes you to do better every day.', avatar: 'RV', grad: 'var(--grad-rose)', rating: 5 },
    { name: 'Mrs. Sunita Reddy', role: 'Parent', text: 'Finding a coaching center that focuses on concept clarity rather than exam shortcuts was a game-changer for my son.', avatar: 'SR', grad: 'var(--grad-sky)', rating: 5 },
    { name: 'Kavya Iyer', role: 'Student – Grade 9', text: 'I love how the tutors make science so interesting with experiments and real-life examples. The interactive quizzes keep me engaged!', avatar: 'KI', grad: 'var(--grad-amber)', rating: 5 },
    { name: 'Mr. Deepak Joshi', role: 'Parent', text: 'Three of my children study here and each has shown remarkable improvement. The flexible scheduling and transparent fees make it easy.', avatar: 'DJ', grad: 'var(--grad-primary)', rating: 5 },
  ];

  useEffect(() => {
    const mapReview = (t) => ({
      name: t.name,
      role: t.role,
      text: t.text,
      rating: t.rating || 5,
      avatar: t.avatar || t.name.split(' ').map(n => n[0]).join('').slice(0, 2),
      photo: t.photo || t.studentPhoto || t.image || t.profileImage || '',
      grad: t.grad || 'var(--grad-primary)',
    });
    Promise.all([apiFeaturedReviews(), apiFeaturedPlatformReviews()]).then(([tutorList, platformList]) => {
      const combined = [
        ...(Array.isArray(tutorList) ? tutorList : []).map(mapReview),
        ...(Array.isArray(platformList) ? platformList : []).map(mapReview),
      ];
      setTestimonials(combined.length > 0 ? combined : defaultTestimonials);
    });
  }, []);

  useEffect(() => { setTestimonialPage(0); }, [testimonials]);

  // Counters
  const c1 = useAnimatedCounter('2000+');
  const c2 = useAnimatedCounter('120+');
  const c3 = useAnimatedCounter('87%');
  const c4 = useAnimatedCounter('50000+');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setShowTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  /* ── DATA ─────────────────────────────────────────────── */
  const programs = [
    {
      tab: '1-on-1 Live Classes',
      icon: '🎯',
      title: 'Live 1-on-1 Classes: Personalized instruction with expert tutors.',
      desc: 'Get the best of both worlds with live, personalized instruction from expert tutors. Our 1-on-1 classes ensure that your child receives focused attention, tailored to their unique learning needs.',
      features: ['Dedicated personal tutor for every student', 'Flexible scheduling — learn at your convenience', 'Real-time doubt clearing & concept reinforcement', 'Regular progress reports shared with parents'],
      grad: 'var(--grad-primary)',
      color: '#7c5cfc',
      cta: 'Start Your FREE Trial',
      link: '/login',
      external: false,
      emoji: '👩‍🏫',
      image: '/images/program-1on1.jpg',
    },
    {
      tab: 'Small Group Classes',
      icon: '👥',
      title: 'Small Group Classes: Collaborative learning with focused guidance.',
      desc: 'Learn alongside 4–8 peers in a collaborative environment that combines the best of group learning with individual attention. Our small batches ensure every student gets heard.',
      features: ['Batch size limited to 4–8 students only', 'Peer-to-peer learning & healthy competition', 'Structured curriculum with milestone tracking', 'More affordable than 1-on-1 sessions'],
      grad: 'var(--grad-accent)',
      color: '#00d4aa',
      cta: 'Join a Batch',
      link: '/login',
      external: false,
      emoji: '👨‍👩‍👧‍👦',
      image: '/images/program-group.jpg',
    },
    {
      tab: 'Self-Paced Learning',
      icon: '📚',
      title: 'Self-Paced Learning: Learn anytime, anywhere on our LMS platform.',
      desc: 'Access our comprehensive library of recorded lectures, interactive quizzes, and downloadable resources on our dedicated LMS platform. Perfect for self-motivated learners who prefer flexibility.',
      features: ['500+ hours of recorded video lessons', 'Interactive quizzes & practice worksheets', 'Downloadable study materials & notes', 'Track your own progress at your pace'],
      grad: 'var(--grad-rose)',
      color: '#ff6b9d',
      cta: 'Go to LMS Platform →',
      link: 'https://lms.example.com',
      external: true,
      emoji: '💻',
      image: '/images/program-selfpaced.jpg',
    },
  ];

  const subjects = [
    {
      icon: '📐', name: 'Mathematics', desc: 'Build strong foundations from arithmetic to advanced calculus',
      topics: ['Algebra', 'Geometry', 'Calculus', 'Statistics'],
      grad: 'var(--grad-primary)', color: '#7c5cfc',
    },
    {
      icon: '📖', name: 'English', desc: 'Master grammar, comprehension, and creative expression',
      topics: ['Grammar', 'Literature', 'Writing', 'Vocabulary'],
      grad: 'var(--grad-accent)', color: '#00d4aa',
    },
    {
      icon: '🔬', name: 'Science', desc: 'Explore physics, chemistry, and biology with hands-on approach',
      topics: ['Physics', 'Chemistry', 'Biology', 'Experiments'],
      grad: 'var(--grad-rose)', color: '#ff6b9d',
    },
    {
      icon: '🌐', name: 'Languages', desc: 'Develop fluency in multiple languages with native speakers',
      topics: ['Hindi', 'French', 'Spanish', 'German'],
      grad: 'var(--grad-sky)', color: '#38bdf8',
    },
  ];

  const whyChoose = [
    { icon: '🧠', title: 'Concept Clarity', desc: 'We go beyond rote memorization — every lesson builds deep understanding through visuals, real-world examples, and Socratic questioning.', grad: 'var(--grad-primary)' },
    { icon: '💡', title: 'Logical Thinking', desc: 'Our methodology nurtures analytical skills. Students learn to approach problems systematically and develop independent reasoning.', grad: 'var(--grad-accent)' },
    { icon: '🤝', title: 'Personalized Attention', desc: 'Small class sizes and dedicated mentors mean every student gets individualized feedback and customized study plans.', grad: 'var(--grad-rose)' },
    { icon: '📊', title: 'Parent Involvement', desc: "Features like progress dashboards and regular reports let you discreetly monitor your child's academic growth.", grad: 'var(--grad-amber)' },
    { icon: '🎓', title: 'Certified Educators', desc: 'Our tutors are highly trained professionals with years of experience, continuously upskilled to stay ahead in education.', grad: 'var(--grad-sky)' },
    { icon: '🌍', title: 'Comprehensive Coverage', desc: 'From school Math to competitive exams, our curriculum is aligned with CBSE, ICSE, and international standards.', grad: 'var(--grad-primary)' },
  ];

  const totalTestimonialPages = Math.max(1, Math.ceil(testimonials.length / 3));

  const stats = [
    { counter: c1, label: 'Active Students', sub: 'enrolled worldwide' },
    { counter: c2, label: 'Expert Tutors', sub: 'certified educators' },
    { counter: c3, label: 'of students', sub: 'show improved grades within 3 months' },
    { counter: c4, label: 'Classes Delivered', sub: 'hours of learning' },
  ];

  const ap = programs[activeProgram]; // active program

  return (
    <div className="hp-wrap">
      <div className="hp-mesh" />

      {/* ══════════════ NAVBAR ══════════════ */}
      <Navbar expand="lg" className={`hp-nav ${scrolled ? 'scrolled' : ''}`} sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <div className="hp-logo-mark">E</div>
            Merit Nook Academy
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="hp-navbar" />
          <Navbar.Collapse id="hp-navbar">
            <Nav className="ms-auto align-items-lg-center" style={{ gap: 4 }}>
              <Nav.Link href="#why-us" className="hp-nav-link">Why Us</Nav.Link>
              <Nav.Link href="#programs" className="hp-nav-link">Programs</Nav.Link>
              <Nav.Link href="#subjects" className="hp-nav-link">Subjects</Nav.Link>
              <Nav.Link href="#testimonials" className="hp-nav-link">Testimonials</Nav.Link>
              <Nav.Link as={Link} to="/tutors" className="hp-nav-link">Find a Tutor</Nav.Link>
              <div className="d-flex align-items-center gap-2 ms-lg-3">
                <button onClick={toggle} className="theme-toggle" title={isDark ? 'Light mode' : 'Dark mode'} aria-label="Toggle theme">
                  <div className={`toggle-track ${isDark ? 'toggle-track-dark' : 'toggle-track-light'}`}>
                    <div className={`toggle-thumb ${isDark ? 'toggle-thumb-dark' : 'toggle-thumb-light'}`}>
                      <span style={{ lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isDark ? '🌙' : '☀️'}</span>
                    </div>
                  </div>
                </button>
                <RippleButton className="btn btn-sm" style={{ background: 'var(--color-surface)', color: 'var(--text-primary)', border: '1px solid var(--color-border)', fontWeight: 600 }} onClick={() => navigate('/login')}>
                  Login
                </RippleButton>
                <RippleButton className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
                  Book a Demo
                </RippleButton>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* ══════════════ HERO ══════════════ */}
      <section className="hp-hero">
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={6} className="hp-hero-content" style={{ position: 'relative', zIndex: 2 }}>
              <div className="hp-hero-badges" data-aos="fade-right">
                <span className="hp-hero-pill hp-hero-pill--primary">Math, English & Science</span>
                <span className="hp-hero-pill hp-hero-pill--accent">Grade 1 → Grade 12</span>
              </div>

              <h1 data-aos="fade-right" data-aos-delay="80">
                Empower Your Child's Future with{' '}
                <span className="highlight">Personalized</span>{' '}
                Learning!
              </h1>

              <p className="hp-hero-desc" data-aos="fade-right" data-aos-delay="160">
                Merit Nook offers live 1-to-1 online classes, small group sessions, and self-paced learning.
                Whether your child thrives with personal guidance or prefers to learn independently,
                our platform adapts to their needs, helping them excel at their own pace.
              </p>

              <div className="d-flex gap-3 flex-wrap" data-aos="fade-right" data-aos-delay="240">
                <RippleButton className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
                  Enroll Now &nbsp;→
                </RippleButton>
                <RippleButton className="btn btn-ghost btn-lg" onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}>
                  Explore Programs
                </RippleButton>
              </div>
            </Col>

            <Col lg={6} className="d-flex justify-content-center" data-aos="fade-left" data-aos-delay="200">
              <div className="hp-hero-visual">
                {/* ← Replace src with your hero image */}
                <div className="hp-hero-img-wrap">
                  <img
                    src="/images/hero-student.jpg"
                    alt="Student learning online"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div className="hp-img-placeholder" style={{ display: 'none' }}>
                    <div className="placeholder-icon">🎓</div>
                    <div className="placeholder-label">Add hero image at<br/><code>/public/images/hero-student.jpg</code></div>
                  </div>
                  <div className="hp-img-overlay" />
                </div>

                {/* Floating cards */}
                <div className="hp-float-card hp-float-card--1">
                  <span>⭐</span> 4.8/5 Rating
                </div>
                <div className="hp-float-card hp-float-card--2">
                  <span>🎯</span> 1-on-1 Live
                </div>
                <div className="hp-float-card hp-float-card--3">
                  <span>📈</span> 87% Improvement
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ══════════════ STATS BAR ══════════════ */}
      <section className="hp-stats-bar" ref={c1.ref}>
        <Container>
          <Row>
            {stats.map((s, i) => (
              <Col key={i} xs={6} md={3}>
                <div className="hp-stat-item" data-aos="fade-up" data-aos-delay={`${i * 80}`}>
                  <div className="hp-stat-value">{s.counter.display}</div>
                  <div className="hp-stat-label">{s.sub}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ══════════════ WHY CHOOSE US ══════════════ */}
      <section className="hp-section hp-section--warm" id="why-us">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={5} data-aos="fade-right">
              {/* ← Replace src with your "why choose us" image */}
              <div className="hp-why-img-wrap">
                <img
                  src="/images/why-choose-us.jpg"
                  alt="Tutor teaching a student"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="hp-img-placeholder" style={{ display: 'none' }}>
                  <div className="placeholder-icon">🧑‍🎓</div>
                  <div className="placeholder-label">Add image at<br/><code>/public/images/why-choose-us.jpg</code></div>
                </div>
                <div className="hp-img-overlay" />
              </div>
              <div className="d-flex gap-3 flex-wrap mt-4 justify-content-center" data-aos="fade-up" data-aos-delay="200">
                <div className="hp-trust-badge"><span>🏆</span> Award-Winning</div>
                <div className="hp-trust-badge"><span>🔒</span> 100% Safe</div>
              </div>
            </Col>

            <Col lg={7}>
              <div className="mb-4" data-aos="fade-left">
                <div className="hp-section-tag" style={{ color: 'var(--color-accent)' }}>Why Choose Merit Nook?</div>
                <h2 className="hp-section-title">
                  0% Worries About Your<br />Child's <span className="tg-accent">Learning</span>
                </h2>
                <p className="hp-section-sub">
                  Unlock your child's potential with personalized learning, expert tutors, and engaging tools for mastery.
                </p>
              </div>

              <Row className="g-0">
                {whyChoose.map((w, i) => (
                  <Col key={i} sm={6} data-aos="fade-up" data-aos-delay={`${i * 60}`}>
                    <div className="hp-why-feature">
                      <div className="hp-why-icon" style={{ background: w.grad }}>
                        {w.icon}
                      </div>
                      <div>
                        <h5>{w.title}</h5>
                        <p>{w.desc}</p>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ══════════════ PROGRAMS (Tabbed) ══════════════ */}
      <section className="hp-section hp-section--soft" id="programs">
        <Container>
          <div className="text-center mb-4" data-aos="fade-up">
            <div className="hp-section-tag" style={{ color: 'var(--color-primary)' }}>Explore Our Programs</div>
            <h2 className="hp-section-title">
              Explore How Merit Nook Fits<br />Your Child's <span className="tg-primary">Learning Style</span>
            </h2>
            <p className="hp-section-sub centered">
              Whether your child thrives with direct guidance or prefers the freedom to explore concepts independently, Merit Nook offers the perfect learning experience.
            </p>
          </div>

          {/* Tabs */}
          <div className="hp-program-tabs" data-aos="fade-up" data-aos-delay="100">
            {programs.map((p, i) => (
              <button
                key={i}
                className={`hp-program-tab ${activeProgram === i ? 'active' : ''}`}
                onClick={() => setActiveProgram(i)}
              >
                {p.tab}
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="hp-program-detail" key={activeProgram} data-aos="fade-up">
            <Row className="g-0">
              <Col md={5}>
                {/* ← Replace src with your program image */}
                <div className="hp-program-img-wrap">
                  <img
                    src={ap.image}
                    alt={ap.tab}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div className="hp-img-placeholder" style={{ display: 'none', background: ap.grad }}>
                    <span style={{ fontSize: '5rem', position: 'relative', zIndex: 1 }}>{ap.emoji}</span>
                    <div className="placeholder-label" style={{ color: '#fff' }}>Add image at<br/><code style={{ color: 'rgba(255,255,255,.7)' }}>/public{ap.image}</code></div>
                  </div>
                  <div className="hp-img-overlay" style={{ background: `linear-gradient(135deg, transparent 50%, ${ap.color}33 100%)` }} />
                </div>
              </Col>
              <Col md={7}>
                <div className="hp-program-body">
                  {ap.external && (
                    <div className="hp-ext-badge">🔗 Redirects to External LMS Platform</div>
                  )}
                  <h3>{ap.title}</h3>
                  <p>{ap.desc}</p>
                  <ul className="hp-program-features">
                    {ap.features.map((f, j) => (
                      <li key={j}>
                        <span className="num" style={{ background: ap.grad }}>{j + 1}</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div>
                    <RippleButton
                      className="btn btn-primary btn-lg"
                      style={ap.external ? { background: ap.grad } : {}}
                      onClick={() => {
                        if (ap.external) {
                          window.open(ap.link, '_blank', 'noopener,noreferrer');
                        } else {
                          navigate(ap.link);
                        }
                      }}
                    >
                      {ap.cta}
                    </RippleButton>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* ══════════════ SUBJECTS ══════════════ */}
      <section className="hp-section" id="subjects">
        <Container>
          <div className="text-center mb-5" data-aos="fade-up">
            <div className="hp-section-tag" style={{ color: 'var(--color-rose)' }}>What We Teach</div>
            <h2 className="hp-section-title">
              Explore Our <span className="tg-rose">Subject Areas</span>
            </h2>
            <p className="hp-section-sub centered">
              Comprehensive coverage across core academic subjects, designed to build essential skills for the future.
            </p>
          </div>

          <Row className="g-4 justify-content-center">
            {subjects.map((s, i) => (
              <Col key={i} xs={6} lg={3}>
                <div className="hp-subject-card" data-aos="fade-up" data-aos-delay={`${i * 80}`}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: s.grad }} />
                  <div className="hp-subject-icon" style={{ background: s.grad, boxShadow: `0 8px 24px ${s.color}30` }}>
                    {s.icon}
                  </div>
                  <h4>{s.name}</h4>
                  <p>{s.desc}</p>
                  <div className="hp-subject-topics">
                    {s.topics.map((t, j) => (
                      <span key={j}>{t}</span>
                    ))}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ══════════════ RESULTS / RESEARCH-BACKED ══════════════ */}
      <section className="hp-section hp-section--mint">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={5} data-aos="fade-right">
              <div className="hp-section-tag" style={{ color: 'var(--color-accent)' }}>The science behind our approach</div>
              <h2 className="hp-section-title">
                Research-Backed Learning for <span className="tg-accent">Proven Results</span>
              </h2>
              <p className="hp-section-sub">
                Our method is grounded in evidence. Students who engage in personalized, self-paced learning with 1-on-1 tutoring show substantial improvements in academic performance.
              </p>
              <div className="hp-result-highlights">
                {[
                  { icon: '🅰️', text: 'Higher grades', bg: 'rgba(124,92,252,.12)', bgDark: 'rgba(124,92,252,.2)' },
                  { icon: '🧠', text: 'Better retention', bg: 'rgba(0,212,170,.12)', bgDark: 'rgba(0,232,184,.2)' },
                  { icon: '📚', text: 'Strong conceptual knowledge', bg: 'rgba(255,107,157,.12)', bgDark: 'rgba(255,125,170,.2)' },
                  { icon: '💪', text: 'Increased confidence', bg: 'rgba(56,189,248,.12)', bgDark: 'rgba(77,200,248,.2)' },
                ].map((r, i) => (
                  <div key={i} className="hp-result-highlight" data-aos="fade-up" data-aos-delay={`${i * 60}`}>
                    <div className="r-icon" style={{ background: isDark ? r.bgDark : r.bg }}>{r.icon}</div>
                    <span>{r.text}</span>
                  </div>
                ))}
              </div>
            </Col>

            <Col lg={7}>
              <Row className="g-4">
                {[
                  { num: '87%', desc: 'of students show improved grades within 3 months of enrollment', grad: 'var(--grad-primary)' },
                  { num: '20X', desc: '20 times more effective than traditional classroom-only learning', grad: 'var(--grad-accent)' },
                  { num: '2.5X', desc: '2.5 times more likely to achieve grade-level proficiency', grad: 'var(--grad-rose)' },
                  { num: '95%', desc: 'of parents report increased engagement and motivation in their child', grad: 'var(--grad-sky)' },
                ].map((r, i) => (
                  <Col key={i} sm={6} data-aos="fade-up" data-aos-delay={`${i * 80}`}>
                    <div className="hp-result-card">
                      <div className="big-num" style={{ background: r.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        {r.num}
                      </div>
                      <p>{r.desc}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className="hp-section" id="testimonials">
        <Container>
          <div className="text-center mb-5" data-aos="fade-up">
            <div className="hp-section-tag" style={{ color: 'var(--color-primary)' }}>Hear from Our Community</div>
            <h2 className="hp-section-title">
              Hear from Our Happy<br />Learners <span className="tg-primary">& Parents</span>
            </h2>
          </div>

          {/* Desktop: 3-column paginated grid */}
          <div className="d-none d-md-block" data-aos="fade-up">
            <Row className="g-4">
              {testimonials.slice(testimonialPage * 3, testimonialPage * 3 + 3).map((t, i) => (
                <Col key={`${testimonialPage}-${i}`} md={4}>
                  <div className="hp-testimonial-card">
                    <div className="hp-testimonial-card__quote">"</div>
                    <div className="d-flex align-items-center gap-3">
                      <PlaceholderImage
                        src={t.photo || ''}
                        alt={`${t.name} photo`}
                        label="Student photo"
                        hint="Add student image"
                        icon="🧑‍🎓"
                        width={46}
                        height={46}
                        borderRadius={999}
                        showMeta={false}
                        style={{ flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,.18)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{t.name}</div>
                        <div style={{ fontSize: '.76rem', color: 'var(--text-muted)' }}>{t.role}</div>
                      </div>
                    </div>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= (t.rating || 5) ? 'var(--color-amber)' : 'var(--text-muted)' }}>★</span>)}
                    </div>
                    <p className="hp-testimonial-text">"{t.text}"</p>
                  </div>
                </Col>
              ))}
            </Row>
            <div className="hp-testimonial-indicators">
              {Array.from({ length: totalTestimonialPages }, (_, idx) => (
                <button
                  key={idx}
                  className={testimonialPage === idx ? 'active' : ''}
                  onClick={() => setTestimonialPage(idx)}
                  aria-label={`Page ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Mobile: Carousel */}
          <div className="d-md-none" data-aos="fade-up">
            <Carousel indicators={false} controls={false} interval={4000}>
              {testimonials.map((t, i) => (
                <Carousel.Item key={i}>
                  <div className="hp-testimonial-card mx-2 mb-3">
                    <div className="hp-testimonial-card__quote">"</div>
                    <div className="d-flex align-items-center gap-3">
                      <PlaceholderImage
                        src={t.photo || ''}
                        alt={`${t.name} photo`}
                        label="Student photo"
                        hint="Add student image"
                        icon="🧑‍🎓"
                        width={46}
                        height={46}
                        borderRadius={999}
                        showMeta={false}
                        style={{ flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,.18)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{t.name}</div>
                        <div style={{ fontSize: '.76rem', color: 'var(--text-muted)' }}>{t.role}</div>
                      </div>
                    </div>
                    <div className="stars">{[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= (t.rating || 5) ? 'var(--color-amber)' : 'var(--text-muted)' }}>★</span>)}</div>
                    <p className="hp-testimonial-text">"{t.text}"</p>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </div>
        </Container>
      </section>

      {/* ══════════════ PHOTO GALLERY STRIP ══════════════ */}
      <section className="hp-section">
        <Container>
          <div className="text-center mb-4" data-aos="fade-up">
            <div className="hp-section-tag" style={{ color: 'var(--color-sky)' }}>Life at Merit Nook</div>
            <h2 className="hp-section-title">
              A Glimpse Into Our <span className="tg-primary">Academy</span>
            </h2>
            <p className="hp-section-sub centered">
              From interactive classrooms to happy students — see what makes Merit Nook special.
            </p>
          </div>

          <div className="hp-gallery-strip" data-aos="fade-up" data-aos-delay="100">
            {[
              { src: '/images/gallery-1.jpg', label: 'Interactive Classrooms', fallback: '📖' },
              { src: '/images/gallery-2.jpg', label: 'Happy Students', fallback: '😊' },
              { src: '/images/gallery-3.jpg', label: 'Expert Mentors', fallback: '👨‍🏫' },
              { src: '/images/gallery-4.jpg', label: 'Awards & Events', fallback: '🏆' },
            ].map((g, i) => (
              <div key={i} className="hp-gallery-item">
                <img
                  src={g.src}
                  alt={g.label}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="hp-img-placeholder" style={{ display: 'none', borderRadius: 'var(--radius-lg)' }}>
                  <div className="placeholder-icon">{g.fallback}</div>
                  <div className="placeholder-label">Add image at<br/><code>/public{g.src}</code></div>
                </div>
                <div className="hp-gallery-label">{g.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="hp-cta">
        <div className="hp-cta-inner">
          <div className="hp-cta-blob hp-cta-blob--1" />
          <div className="hp-cta-blob hp-cta-blob--2" />

          <div style={{ position: 'relative', zIndex: 1 }} data-aos="zoom-in">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--color-surface)',
              border: '1px solid rgba(255,255,255,.3)', borderRadius: 100,
              padding: '6px 18px', marginBottom: 24,
              fontSize: '.78rem', fontWeight: 700, color: '#fff', letterSpacing: '.06em', textTransform: 'uppercase',
            }}>
              <span className="dot-live" style={{ background: '#fff', boxShadow: '0 0 8px #fff' }} />
              Limited Seats — Enroll Today
            </div>

            <h2>Ready to Start<br />Your Learning Journey?</h2>
            <p>Book a free demo class and experience the Merit Nook difference firsthand. No commitments — just great learning.</p>

            <div className="d-flex gap-3 justify-content-center flex-wrap mb-5">
              <RippleButton className="btn btn-lg hp-cta-btn-primary" onClick={() => navigate('/register')}>
                Book a Demo &nbsp;📅
              </RippleButton>
              <RippleButton className="btn btn-lg hp-cta-btn-primary" onClick={() => navigate('/register')}>
                Enroll Now &nbsp;→
              </RippleButton>
            </div>

            {/* Social proof */}
            <div className="d-flex justify-content-center flex-wrap" style={{ gap: 'clamp(28px, 4vw, 64px)' }}>
              {[
                { v: '2,000+', l: 'Active Students' },
                { v: '120+', l: 'Expert Tutors' },
                { v: '87%', l: 'Grade Improvement' },
                { v: 'Free', l: 'Demo Available' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 900, color: '#fff', letterSpacing: '-.02em' }}>{s.v}</div>
                  <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.68)', fontWeight: 500, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="hp-footer">
        <Container>
          <Row className="g-4">
            <Col lg={4} md={6}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="hp-logo-mark" style={{ width: 36, height: 36, fontSize: '.95rem' }}>E</div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Merit Nook Academy</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', lineHeight: 1.75, maxWidth: 320 }}>
                Empowering students with concept clarity, logical thinking, and personalized attention since 2018. Building the next generation of thinkers and achievers.
              </p>
              <div className="hp-footer-social">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </Col>

            <Col lg={2} md={6}>
              <h5>Quick Links</h5>
              <a href="#why-us" className="hp-footer-link">Why Choose Us</a>
              <a href="#programs" className="hp-footer-link">Programs</a>
              <a href="#subjects" className="hp-footer-link">Subjects</a>
              <a href="#testimonials" className="hp-footer-link">Testimonials</a>
              <Link to="/tutors" className="hp-footer-link">Find a Tutor</Link>
            </Col>

            <Col lg={3} md={6}>
              <h5>Programs</h5>
              <Link to="/login" className="hp-footer-link">1-on-1 Live Classes</Link>
              <Link to="/login" className="hp-footer-link">Small Group Classes</Link>
              <a href="https://lms.example.com" target="_blank" rel="noopener noreferrer" className="hp-footer-link">Self-Paced Learning ↗</a>
              <Link to="/register" className="hp-footer-link">Book a Free Demo</Link>
            </Col>

            <Col lg={3} md={6}>
              <h5>Contact Us</h5>
              <div style={{ color: 'var(--text-secondary)', fontSize: '.85rem', lineHeight: 2.1 }}>
                <div>📧 hello@meritnook.academy</div>
                <div>📞 +91 98765 43210</div>
                <div>📍 Sector 15, Gurugram, India</div>
                <div>🕐 Mon – Sat, 9 AM – 8 PM</div>
              </div>
            </Col>
          </Row>

          <div className="hp-footer-bottom d-flex flex-wrap justify-content-between align-items-center">
            <p>© {new Date().getFullYear()} Merit Nook Academy. All rights reserved.</p>
            <div className="d-flex gap-3">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Refund Policy</a>
              <Link to="/admin/login" style={{ color: 'var(--text-muted)', opacity: .45, fontSize: '.75rem', textDecoration: 'none', transition: 'opacity .2s' }} onMouseOver={e => e.currentTarget.style.opacity = '.85'} onMouseOut={e => e.currentTarget.style.opacity = '.45'}>🛡️ Admin</Link>
            </div>
          </div>
        </Container>
      </footer>

      {/* ══════════════ SCROLL TO TOP ══════════════ */}
      <button className={`hp-scroll-top ${showTop ? 'visible' : ''}`} onClick={scrollToTop} aria-label="Scroll to top">↑</button>
    </div>
  );
}
