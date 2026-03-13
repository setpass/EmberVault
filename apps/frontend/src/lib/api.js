const trimTrailingSlash = (v = '') => v.replace(/\/$/, '');
const API_BASE = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? '') || '/api';
const API_KEY = import.meta.env.VITE_API_KEY ?? '';

function writeHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
  };
}

async function handleResponse(resOrPromise) {
  const res = await resOrPromise;
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const b = await res.json(); msg = b.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchDashboard() {
  return handleResponse(fetch(`${API_BASE}/dashboard`));
}

export async function fetchProfile() {
  return handleResponse(fetch(`${API_BASE}/profile`));
}

export async function updateProfile(patch) {
  return handleResponse(fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: writeHeaders(),
    body: JSON.stringify(patch),
  }));
}

function collectionApi(path) {
  return {
    list: () => handleResponse(fetch(`${API_BASE}/${path}`)),
    create: (payload) => handleResponse(fetch(`${API_BASE}/${path}`, {
      method: 'POST', headers: writeHeaders(), body: JSON.stringify(payload),
    })),
    update: (payload) => handleResponse(fetch(`${API_BASE}/${path}`, {
      method: 'PUT', headers: writeHeaders(), body: JSON.stringify(payload),
    })),
  };
}

export const credentialsApi  = collectionApi('credentials');
export const permissionsApi  = collectionApi('permissions');
export const activityApi     = collectionApi('activity');
export const vaultRecordsApi = collectionApi('vault-records');

export const forgeApi = {
  state:   () => handleResponse(fetch(`${API_BASE}/forge`)),
  catalog: () => handleResponse(fetch(`${API_BASE}/forge/catalog`)),
  actions: () => handleResponse(fetch(`${API_BASE}/forge/actions`)),
  trigger: (actionType, meta = {}) => handleResponse(fetch(`${API_BASE}/forge/action`, {
    method: 'POST', headers: writeHeaders(), body: JSON.stringify({ actionType, ...meta }),
  })),
};

export const forgeTick = () => handleResponse(fetch(`${API_BASE}/forge/tick`));

export const achievementsApi = {
  state: () => handleResponse(fetch(`${API_BASE}/achievements`)),
  check: (forge) => handleResponse(fetch(`${API_BASE}/achievements/check`, {
    method: 'POST', headers: writeHeaders(), body: JSON.stringify({ forge }),
  })),
};

export const leaderboardApi = {
  state: () => handleResponse(fetch(`${API_BASE}/leaderboard`)),
};
