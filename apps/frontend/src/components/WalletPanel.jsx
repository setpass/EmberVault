export function WalletPanel({ walletState, signInState, onConnect, onScaffoldSignIn }) {
  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Ignition bay</p>
          <h3>Wallet heat sources</h3>
        </div>
        <span className="badge blue">Build-safe</span>
      </div>
      <div className="wallet-grid">
        {Object.entries(walletState).map(([key, wallet]) => (
          <div className="wallet-card" key={key}>
            <div>
              <p className="eyebrow">{key === 'metaMask' ? 'EVM socket' : 'Aptos socket'}</p>
              <h4>{key === 'metaMask' ? 'MetaMask' : 'Petra'}</h4>
            </div>
            <div className="wallet-state">
              <span className={`badge ${wallet.status === 'Linked' ? 'green' : wallet.status === 'Missing' ? 'purple' : 'blue'}`}>
                {wallet.status}
              </span>
              <strong>{wallet.address || 'No address yet'}</strong>
              <p>{wallet.detail}</p>
            </div>
            <div className="wallet-actions">
              <button className="ghost-button small" onClick={() => onConnect(key)}>Link wallet</button>
              <button className="primary-button small" onClick={() => onScaffoldSignIn(key)}>Ignition sign</button>
            </div>
          </div>
        ))}
      </div>
      <div className="wallet-note">
        <span className="sidebar-label">Ignition state</span>
        <p>{signInState}</p>
      </div>
    </article>
  );
}
