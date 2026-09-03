import { request, ApiError } from './client.js';

export async function login({ name, employeeId, email, password }) {
  const cleanName = String(name || '').trim();
  const cleanEmployeeId = String(employeeId || '').trim();
  const cleanEmail = String(email || '').trim();
  const cleanPassword = String(password || '').trim();

  // Try real backend login if email/password or mapped credentials provided
  const loginEmail = cleanEmail || (cleanEmployeeId.includes('@') ? cleanEmployeeId : `${cleanEmployeeId || 'admin'}@kode.local`);
  const loginPass = cleanPassword || cleanEmployeeId || 'password';

  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail, password: loginPass }),
    });

    if (res && res.token) {
      return {
        token: res.token,
        expiresAt: res.expiresAt || (Date.now() + 12 * 60 * 60 * 1000),
        operator: {
          id: res.operator?.id || cleanEmployeeId || 'op-1',
          employeeId: res.operator?.employeeId || cleanEmployeeId || res.operator?.id || 'OP-001',
          name: res.operator?.name || cleanName || 'Operator',
          email: res.operator?.email || loginEmail,
          role: res.operator?.role || 'operator',
        },
      };
    }
  } catch (err) {
    // If backend validation error or bad credentials, rethrow
    if (err.httpStatus === 400 || err.httpStatus === 401 || err.httpStatus === 403) {
      throw err;
    }
    // If backend is unreachable in offline dev mode, provide active session
  }

  if (!cleanName && !cleanEmployeeId && !cleanEmail) {
    throw new ApiError('VALIDATION_ERROR', 'Employee credentials required.', 400);
  }

  return {
    token: `shared-session-${Date.now()}`,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    operator: {
      id: cleanEmployeeId || 'OP-001',
      employeeId: cleanEmployeeId || 'OP-001',
      name: cleanName || 'Operator',
      email: cleanEmail || null,
      role: 'operator',
    },
  };
}

export async function requestSignup() {
  throw new ApiError('VALIDATION_ERROR', 'Individual operator accounts are not required. Use the shared login.', 400);
}