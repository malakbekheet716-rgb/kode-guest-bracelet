import { simulateLatency, ApiError } from './client';
import { nextId } from './mockData';
import { TOKEN_TTL_MS } from '../utils/constants';

// Shared operator account: the login identifies the person performing the work
// by Employee ID + name. There is intentionally no separate account per employee.
export async function login({ name, employeeId }) {
  await simulateLatency(250, 500);

  const cleanName = String(name || '').trim();
  const cleanEmployeeId = String(employeeId || '').trim();

  if (!cleanName || !cleanEmployeeId) {
    throw new ApiError('VALIDATION_ERROR', 'Employee name and Employee ID are required.', 400);
  }

  return {
    token: `mock.${nextId('jwt')}.token`,
    expiresAt: Date.now() + TOKEN_TTL_MS,
    operator: {
      id: cleanEmployeeId,
      employeeId: cleanEmployeeId,
      name: cleanName,
      email: null,
      role: 'operator',
    },
  };
}

// Kept for compatibility with the existing route. The system now uses one
// shared account, so employee-specific accounts are no longer provisioned here.
export async function requestSignup() {
  throw new ApiError('VALIDATION_ERROR', 'Individual operator accounts are not required. Use the shared login.', 400);
}
