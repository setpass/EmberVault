// ─── MetaMask ────────────────────────────────────────────────────────────────

export async function connectMetaMask() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install the MetaMask extension.');
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts returned from MetaMask.');
  }
  return {
    provider: 'metaMask',
    address: accounts[0],
  };
}

// ─── Petra (Aptos) ───────────────────────────────────────────────────────────

export async function connectPetra() {
  if (!window.aptos) {
    throw new Error('Petra wallet not installed. Please install the Petra extension.');
  }
  const response = await window.aptos.connect();
  if (!response || !response.address) {
    throw new Error('No address returned from Petra.');
  }
  return {
    provider: 'petra',
    address: response.address,
  };
}

// ─── Scaffold signature (dev/demo) ───────────────────────────────────────────

export async function scaffoldSignature(providerName, address) {
  const message = `EmberVault sign-in: ${address} @ ${Date.now()}`;
  let signature = 'scaffold-' + Math.random().toString(36).slice(2);

  try {
    if (providerName === 'metaMask' && window.ethereum) {
      signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });
    } else if (providerName === 'petra' && window.aptos) {
      const result = await window.aptos.signMessage({ message, nonce: Date.now().toString() });
      signature = result.signature || signature;
    }
  } catch {
    // fall through to scaffold signature
  }

  return { message, signature, address, provider: providerName };
}
