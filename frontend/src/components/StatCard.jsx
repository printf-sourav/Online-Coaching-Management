import { useRef } from 'react';
import { useCounter } from '../hooks/useCounter';

export default function StatCard({ icon, label, value, sub, grad, delay = 0 }) {
  const cardRef = useRef(null);
  const displayValue = useCounter(value);

  /* ── 3-D tilt on mouse-move ───────────────────────────── */
  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = ((e.clientX - left) / width  - 0.5) * 14;
    const y = ((e.clientY - top)  / height - 0.5) * -14;
    el.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateZ(6px)`;
  };
  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (el) el.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateZ(0)';
  };

  return (
    <div
      ref={cardRef}
      className="glass card tilt-card glow-primary"
      data-aos="fade-up"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        animationDelay: `${delay}ms`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform .18s ease, box-shadow .18s ease',
      }}
    >
      {/* gradient tint */}
      <div style={{
        position: 'absolute', inset: 0, background: grad, opacity: .07,
        pointerEvents: 'none', borderRadius: 'inherit',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, position: 'relative' }}>
        <div>
          <div style={{
            fontSize: '.75rem', fontWeight: 700, color: 'var(--text-muted)',
            letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '2rem', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1,
            background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {displayValue}
          </div>
          {sub && (
            <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>
          )}
        </div>

        {/* icon box — bounces on card hover */}
        <div style={{
          width: 46, height: 46, borderRadius: 14, background: grad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', flexShrink: 0, position: 'relative',
          boxShadow: '0 4px 16px rgba(0,0,0,.12)',
        }} className="icon-bounce">
          {icon}
        </div>
      </div>
    </div>
  );
}
