function formatStamp(value) {
  return new Date(value).toLocaleString('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ActivityFeed({ cadence }) {
  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Combo cadence</p>
          <h3>Recent strike sequence</h3>
        </div>
      </div>
      <div className="activity-list">
        {cadence.map((item) => (
          <div className="activity-item" key={item.id}>
            <span className="activity-dot"></span>
            <div>
              <span className="sidebar-label">{item.chain}</span>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
            <strong>{formatStamp(item.timestamp)}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
