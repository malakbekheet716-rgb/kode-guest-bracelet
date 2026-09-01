// Thin helper shared by every mock endpoint below.
//
// When the real backend (KODE-TECH-0001 §6) is ready, each mock function in
// authApi.js / jobsApi.js / braceletsApi.js can be replaced with a fetch()
// call to the matching endpoint without touching any page or component —
// they all import from these three files, never from mockData directly.

export function simulateLatency(minMs = 250, maxMs = 700) {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export class ApiError extends Error {
  constructor(code, message, httpStatus) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// A small, rare chance of a transient network error on write operations, so
// the create/retry/reconcile error states are real and not just theoretical.
export function maybeThrowNetworkError(rate = 0.04) {
  if (Math.random() < rate) {
    throw new ApiError('NETWORK_ERROR', 'network', 0);
  }
}
