export default function Spinner({ size = 18, light = true }) {
  return (
    <span
      className="spinner"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid ${light ? 'rgba(255,255,255,.3)' : 'var(--color-border)'}`,
        borderTopColor: light ? '#fff' : 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin .7s linear infinite',
      }}
    />
  );
}
