import { useRef } from 'react';

/**
 * Drop-in replacement for <button> that adds a Material-style ripple.
 * Pass any className / style / onClick / children.
 */
export default function RippleButton({ children, className = '', style = {}, onClick, ...props }) {
  const btnRef = useRef(null);

  const handleClick = (e) => {
    const btn = btnRef.current;
    if (!btn) return;

    const existing = btn.querySelector('.ripple');
    if (existing) existing.remove();

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());

    onClick?.(e);
  };

  return (
    <button ref={btnRef} className={className} style={style} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
