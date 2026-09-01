import { simulateLatency, ApiError } from './client';
import { findOperator, pendingSignupRequests, nextId } from './mockData';
import { TOKEN_TTL_MS } from '../utils/constants';

// Real endpoint: POST /api/v1/auth/login
// Body: { email, password } -> { token, expiresIn: 43200, role }
export async function login({ email, password }) {
  await simulateLatency(300, 700);

  const operator = findOperator({ email });
  if (!operator || operator.password !== password) {
    throw new ApiError('UNAUTHENTICATED', 'Incorrect email or password.', 401);
  }

  return {
    token: `mock.${nextId('jwt')}.token`,
    expiresAt: Date.now() + TOKEN_TTL_MS,
    operator: {
      id: operator.id,
      name: operator.name,
      email: operator.email,
      role: operator.role,
    },
  };
}

// Not a documented endpoint in KODE-TECH-0001 — the architecture assumes a
// small, pre-provisioned Operator table. This simulates a "request access"
// flow that an admin would approve, so the UI has somewhere real to send
// this request once that workflow exists on the backend.
export async function requestSignup({ name, email, password }) {
  await simulateLatency(300, 700);

  if (findOperator({ email })) {
    throw new ApiError('CONFLICT', 'An account with this email already exists.', 409);
  }

  pendingSignupRequests.push({
    id: nextId('req'),
    name,
    email,
    password,
    requestedAt: new Date().toISOString(),
  });

  return { received: true };
}
