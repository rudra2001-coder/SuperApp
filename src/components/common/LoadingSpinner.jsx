export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{
        width: 32, height: 32, border: '3px solid var(--border-color)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </div>
  );
}
