import { useRef } from 'react';

export default function OTPInput({ value, onChange }) {
  const inputs = useRef([]);

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleChange = (e, idx) => {
    const digit = e.target.value.replace(/\D/, '').slice(-1);
    const arr = value.split('');
    arr[idx] = digit;
    const next = arr.join('');
    onChange(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="otp-wrap">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKey(e, i)}
          onPaste={handlePaste}
          className={`otp-box${value[i] ? ' otp-box--filled' : ''}`}
        />
      ))}
    </div>
  );
}
