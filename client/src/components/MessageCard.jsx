export default function MessageCard({ message }) {
  return (
    <article className="chat-bubble" style={{ padding: '14px 18px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{message.sender?.name || 'Unknown'}</strong>
        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
      </div>
      <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{message.message}</p>
    </article>
  );
}
