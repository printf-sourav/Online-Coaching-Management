import { useState, useEffect } from 'react';

export default function Countdown({ seconds, onZero }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => { setRemaining(seconds); }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) { onZero(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onZero]);

  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');

  return (
    <span style={{ fontFamily: 'monospace', color: remaining < 60 ? 'var(--color-rose)' : 'var(--color-accent)', fontWeight: 700 }}>
      {m}:{s}
    </span>
  );
}
