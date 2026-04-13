import { useEffect, useState } from 'react';

export default function PlaceholderImage({
  src,
  alt = 'Placeholder',
  label = 'Image Placeholder',
  hint = 'Replace with a real image',
  icon = '🖼️',
  height = 160,
  width = '100%',
  borderRadius = 14,
  objectFit = 'cover',
  showMeta = true,
  style = {},
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;

  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        position: 'relative',
        ...style,
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit, display: 'block' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: showMeta ? 8 : 0,
            padding: showMeta ? '12px 14px' : 0,
            background: 'linear-gradient(135deg,rgba(124,92,252,.08),rgba(56,189,248,.06))',
            border: '1px dashed rgba(124,92,252,.35)',
          }}
        >
          <div style={{ fontSize: showMeta ? '1.45rem' : '1.1rem', lineHeight: 1 }}>{icon}</div>
          {showMeta && (
            <>
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
              <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{hint}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
