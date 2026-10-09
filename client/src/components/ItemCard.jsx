export default function ItemCard({ item, children }) {
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'National': return '#F59E0B';
      case 'S': return '#7C5CFF';
      case 'A': return '#4A8CFF';
      case 'B': return '#22C55E';
      default: return '#A0A0A0';
    }
  };

  return (
    <article className="item-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>📦 {item.name}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge" style={{ background: 'rgba(124, 92, 255, 0.15)', color: getGradeColor(item.grade), border: `1px solid ${getGradeColor(item.grade)}` }}>
            Grade {item.grade}
          </span>
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            {item.status}
          </span>
        </div>
      </div>

      <dl>
        <div>
          <dt>Category</dt>
          <dd>{item.category}</dd>
        </div>
        <div>
          <dt>Appraised Value</dt>
          <dd style={{ color: '#7C5CFF', fontWeight: '800' }}>{item.estimatedValue || 0} GT</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{item.owner?.name || 'Unknown'}</dd>
        </div>
      </dl>

      <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.description}</p>
      {children}
    </article>
  );
}
