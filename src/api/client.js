const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  constructor(code, message, httpStatus, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code || 'ERROR';
    this.httpStatus = httpStatus || 500;
    Object.assign(this, data);
  }
}

function getAuthToken() {
  try {
    const raw = window.localStorage.getItem('kode_gbs_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.token || null;
  } catch {
    return null;
  }
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errObj = isJson && data.error ? data.error : {};
      const code = errObj.code || data.code || `HTTP_${res.status}`;
      const message = errObj.message || data.message || res.statusText || 'Request failed';
      throw new ApiError(code, message, res.status, errObj);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Network / connection error
    throw new ApiError('NETWORK_ERROR', err.message || 'Network error', 0);
  }
}

export function simulateLatency(minMs = 250, maxMs = 700) {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export function maybeThrowNetworkError(rate = 0.04) {
  if (Math.random() < rate) {
    throw new ApiError('NETWORK_ERROR', 'network', 0);
  }
}
