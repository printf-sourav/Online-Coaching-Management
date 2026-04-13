const CHECKS = [
  { label: 'At least 6 chars', test: pw => pw.length >= 6 },
  { label: 'Contains number',  test: pw => /\d/.test(pw) },
  { label: 'Contains uppercase', test: pw => /[A-Z]/.test(pw) },
  { label: 'Contains symbol',  test: pw => /[^a-zA-Z0-9]/.test(pw) },
];

const LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

export default function PasswordStrength({ password }) {
  const results = CHECKS.map(c => ({ ...c, ok: c.test(password) }));
  const score = results.filter(c => c.ok).length;

  return (
    <div className="pw-strength">
      <div className="pw-bars">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`pw-bar${score >= i ? ` pw-bar--active-${Math.min(score, 4)}` : ''}`} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.72rem', fontWeight: 600 }} className={`pw-bar--active-${Math.min(score, 4)}`}>
          {LABELS[score]}
        </span>
        <div className="pw-checks">
          {results.map((c, i) => (
            <span key={i} className={`pw-check${c.ok ? ' pw-check--ok' : ''}`}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
