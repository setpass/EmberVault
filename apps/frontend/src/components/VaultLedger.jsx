export function VaultLedger({ vaultRecords }) {
  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Vault ledger</p>
          <h3>Protected records</h3>
        </div>
      </div>
      <div className="vault-items">
        {vaultRecords.map((record) => (
          <div className="vault-item" key={record.id}>
            <div>
              <h4>{record.title}</h4>
              <p>{record.description}</p>
            </div>
            <span className="badge blue">{record.classification}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
