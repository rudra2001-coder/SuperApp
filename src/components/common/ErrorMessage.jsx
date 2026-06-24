export default function ErrorMessage({ message, onRetry }) {
  return (
    <div style={{
      background: 'var(--danger)', color: '#fff', padding: '12px 16px',
      borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 14,
    }}>
      <span>⚠️ {message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{
          marginLeft: 12, background: 'rgba(255,255,255,0.2)',
          border: 'none', borderRadius: 4, padding: '4px 12px',
          color: '#fff', cursor: 'pointer', fontSize: 13,
        }}>Retry</button>
      )}
    </div>
  );
}
