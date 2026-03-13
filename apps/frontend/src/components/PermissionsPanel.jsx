export function PermissionsPanel({ permissions }) {
  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Permission alloy</p>
          <h3>Access control overview</h3>
        </div>
      </div>
      <div className="permission-list">
        {permissions.map((permission) => (
          <div className="permission-row" key={permission.id}>
            <span>{permission.name}</span>
            <strong>{permission.state}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
