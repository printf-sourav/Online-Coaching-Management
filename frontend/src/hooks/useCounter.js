import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Handles suffixes like "2000+" → animates 2000 then appends "+".
 * Returns a display string.
 */
export function useCounter(value, duration = 1400, startOnMount = true) {
  const [display, setDisplay] = useState('—');
  const rafRef = useRef(null);

  useEffect(() => {
    if (!startOnMount) return;
    // Cancel any in-progress animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (value === undefined || value === null) { setDisplay('—'); return; }

    // Extract numeric part and suffix
    const match = String(value).match(/^([\d,_.]+)(.*)$/);
    if (!match) { setDisplay(String(value)); return; }

    const raw = parseFloat(match[1].replace(/[,_]/g, ''));
    const suffix = match[2] || '';
    if (isNaN(raw)) { setDisplay(String(value)); return; }

    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(eased * raw);
      setDisplay(current.toLocaleString() + suffix);
      if (progress < 1) { rafRef.current = requestAnimationFrame(tick); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration, startOnMount]);

  return display;
}
