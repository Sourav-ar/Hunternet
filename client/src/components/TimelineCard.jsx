export default function TimelineCard({ event }) {
  return (
    <article className="timeline-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>📢 {event.title}</h3>
        <span className="badge" style={{ background: 'rgba(74, 140, 255, 0.15)', color: '#4A8CFF', border: '1px solid rgba(74, 140, 255, 0.3)' }}>
          {event.eventType}
        </span>
      </div>
      <p style={{ marginBottom: '12px' }}>{event.description || 'No description.'}</p>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        By: <strong>{event.actor?.name || 'Unknown'}</strong> &bull; {new Date(event.createdAt).toLocaleString()}
      </div>
    </article>
  );
}
