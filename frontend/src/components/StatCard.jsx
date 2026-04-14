import { useCounter } from '../hooks/useCounter';

export default function StatCard({ icon, label, value, sub, grad, delay = 0 }) {
  const displayValue = useCounter(value);

  return (
    <div
      className="glass card"
      data-aos="fade-up"
      style={{
        animationDelay: `${delay}ms`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow .18s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0 auto auto 0',
          width: '100%',
          height: 4,
          background: grad || 'var(--grad-primary)',
          opacity: .9,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -18,
          top: -18,
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: grad || 'var(--grad-primary)',
          opacity: .08,
          pointerEvents: 'none',
        }}
      />
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
            color: 'var(--text-primary)',
          }}>
            {displayValue}
          </div>
          {sub && (
            <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>
          )}
        </div>

        {/* icon box — bounces on card hover */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, background: grad || 'var(--grad-primary)',
          border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', flexShrink: 0, position: 'relative',
          boxShadow: 'none',
          color: '#fff',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
