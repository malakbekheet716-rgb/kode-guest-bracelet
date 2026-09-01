import { simulateLatency, ApiError } from './client.js';

export async function login({ name, employeeId }) {
  await simulateLatency(250, 500);

  const cleanName = String(name || '').trim();
  const cleanEmployeeId = String(employeeId || '').trim();

  if (!cleanName) {
    throw new ApiError(
      'VALIDATION_ERROR',
      'Employee name is required.',
      400
    );
  }

  if (!cleanEmployeeId) {
    throw new ApiError(
      'VALIDATION_ERROR',
      'Employee ID is required.',
      400
    );
  }

  return {
    token: `shared-session-${Date.now()}`,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,

    operator: {
      id: cleanEmployeeId,
      employeeId: cleanEmployeeId,
      name: cleanName,
      email: null,
      role: 'operator',
    },
  };
}

// Kept for compatibility with the existing route.
// The system uses one shared operator login.
export async function requestSignup() {
  throw new ApiError(
    'VALIDATION_ERROR',
    'Individual operator accounts are not required. Use the shared login.',
    400
  );
}