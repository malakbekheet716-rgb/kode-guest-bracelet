import { request, ApiError } from './client.js';
import {
  bracelets as mockBracelets,
  events as mockEvents,
  jobs as mockJobs,
  writeEvent,
  runJobPipeline,
  nextId,
  persistStore,
} from './mockData.js';
import { BRACELET_STATUS, JOB_STATUS, ROLES } from '../utils/constants.js';

function normalizeBracelet(b) {
  if (!b) return null;
  return {
    ...b,
    events: (b.events || []).map((e) => ({
      ...e,
      id: String(e.id),
      createdAt: e.createdAt,
    })),
  };
}

// Endpoint: GET /api/v1/bracelets
export async function getBracelets({ status, jobId, braceletNumber, page = 1, pageSize = 20 } = {}) {
  try {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (jobId) params.set('jobId', jobId);
    if (braceletNumber) params.set('braceletNumber', braceletNumber);
    if (page) params.set('page', String(page));
    if (pageSize) params.set('pageSize', String(pageSize));

    const res = await request(`/bracelets?${params.toString()}`);
    if (res) {
      const rawList = res.data || res.items || [];
      return {
        items: rawList.map(normalizeBracelet),
        total: res.total ?? rawList.length,
        page: res.page || page,
        pageSize: res.pageSize || pageSize,
      };
    }
  } catch {
    // Fallback to offline store
  }

  let list = [...mockBracelets];
  if (status) list = list.filter((b) => b.status === status);
  if (jobId) list = list.filter((b) => b.jobId === jobId);
  if (braceletNumber) {
    const needle = braceletNumber.trim().toLowerCase();
    list = list.filter((b) => b.braceletNumber.toLowerCase().includes(needle));
  }
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const start = (page - 1) * pageSize;
  return { items: list.slice(start, start + pageSize).map(normalizeBracelet), total: list.length, page, pageSize };
}

// Endpoint: GET /api/v1/bracelets/:id
export async function getBracelet(id) {
  try {
    const res = await request(`/bracelets/${id}`);
    if (res && res.id) {
      return normalizeBracelet(res);
    }
  } catch (err) {
    if (err.httpStatus === 404) throw err;
  }

  const bracelet = mockBracelets.find((b) => b.id === id);
  if (!bracelet) throw new ApiError('NOT_FOUND', 'Bracelet not found.', 404);
  const history = mockEvents
    .filter((e) => e.braceletId === id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const job = bracelet.jobId ? mockJobs.find((j) => j.id === bracelet.jobId) : null;
  return normalizeBracelet({
    ...bracelet,
    createdBy: job ? { employeeId: job.requestedBy, name: job.requestedByName } : null,
    events: history,
  });
}

// Endpoint: POST /api/v1/bracelets/:id/retry
export async function retryBracelet(id, operatorId, operatorName) {
  try {
    const res = await request(`/bracelets/${id}/retry`, { method: 'POST' });
    if (res && res.id) {
      return normalizeBracelet(res);
    }
  } catch (err) {
    if (err.httpStatus) throw err;
  }

  const employeeId = String(operatorId || '').trim() || 'OP-001';
  const employeeName = String(operatorName || '').trim() || 'Operator';
  const bracelet = mockBracelets.find((b) => b.id === id);
  if (!bracelet) throw new ApiError('NOT_FOUND', 'Bracelet not found.', 404);
  if (bracelet.status !== BRACELET_STATUS.FAILED) {
    throw new ApiError('INVALID_STATUS_TRANSITION', 'Only a failed bracelet can be retried.', 409);
  }

  const job = {
    id: nextId('job'), quantity: 1, status: JOB_STATUS.QUEUED,
    idempotencyKey: nextId('idem'), requestedBy: employeeId, requestedByName: employeeName,
    triggerAttempts: 0, lastTriggerAttemptAt: null, lastTriggerError: null, n8nExecId: null,
    needsAttention: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  mockJobs.push(job);

  const oldStatus = bracelet.status;
  bracelet.status = BRACELET_STATUS.QUEUED;
  bracelet.jobId = job.id;
  bracelet.lastIssueError = null;
  writeEvent({ braceletId: bracelet.id, eventType: 'MANUAL_RETRY', oldStatus, newStatus: BRACELET_STATUS.QUEUED, triggeredBy: `user:${employeeId}`, triggeredByName: employeeName, employeeId });
  runJobPipeline(job);
  return normalizeBracelet(bracelet);
}

// Endpoint: POST /api/v1/bracelets/:id/reconcile
export async function reconcileBracelet(id, outcome, operatorId, operatorName) {
  try {
    const res = await request(`/bracelets/${id}/reconcile`, {
      method: 'POST',
      body: JSON.stringify({ outcome }),
    });
    if (res && res.id) {
      return normalizeBracelet(res);
    }
  } catch (err) {
    if (err.httpStatus) throw err;
  }

  const employeeId = String(operatorId || '').trim() || 'OP-001';
  const employeeName = String(operatorName || '').trim() || 'Operator';
  const bracelet = mockBracelets.find((b) => b.id === id);
  if (!bracelet) throw new ApiError('NOT_FOUND', 'Bracelet not found.', 404);
  if (bracelet.status !== BRACELET_STATUS.RECONCILIATION_REQUIRED) {
    throw new ApiError('INVALID_STATUS_TRANSITION', 'Bracelet is not awaiting reconciliation.', 409);
  }

  const oldStatus = bracelet.status;
  if (outcome === 'CONFIRMED_EXISTS') {
    bracelet.status = BRACELET_STATUS.ISSUED;
    bracelet.issuedAt = bracelet.issuedAt || new Date().toISOString();
    bracelet.lastIssueError = null;
    writeEvent({ braceletId: bracelet.id, eventType: 'RECONCILIATION_CONFIRMED_EXISTS', oldStatus, newStatus: BRACELET_STATUS.ISSUED, triggeredBy: `user:${employeeId}`, triggeredByName: employeeName, employeeId });
  } else if (outcome === 'CONFIRMED_MISSING') {
    bracelet.status = BRACELET_STATUS.PENDING;
    bracelet.jobId = null;
    bracelet.lastIssueError = null;
    writeEvent({ braceletId: bracelet.id, eventType: 'RECONCILIATION_CONFIRMED_MISSING', oldStatus, newStatus: BRACELET_STATUS.PENDING, triggeredBy: `user:${employeeId}`, triggeredByName: employeeName, employeeId });
  }
  persistStore();
  return normalizeBracelet(bracelet);
}

// Endpoint: PATCH /api/v1/bracelets/:id/status
export async function updateBraceletStatus(id, newStatus, { operatorId, operatorName, role, reason } = {}) {
  try {
    const res = await request(`/bracelets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, reason }),
    });
    if (res && res.id) {
      return normalizeBracelet(res);
    }
  } catch (err) {
    if (err.httpStatus) throw err;
  }

  const employeeId = String(operatorId || '').trim() || 'OP-001';
  const employeeName = String(operatorName || '').trim() || 'Operator';
  if (newStatus === BRACELET_STATUS.REVOKED && role !== ROLES.ADMIN) {
    throw new ApiError('FORBIDDEN', 'Only an admin can revoke a bracelet.', 403);
  }
  const bracelet = mockBracelets.find((b) => b.id === id);
  if (!bracelet) throw new ApiError('NOT_FOUND', 'Bracelet not found.', 404);

  const oldStatus = bracelet.status;
  bracelet.status = newStatus;
  if (newStatus === BRACELET_STATUS.ACTIVE) bracelet.activatedAt = new Date().toISOString();
  if (newStatus === BRACELET_STATUS.REVOKED) bracelet.revokedAt = new Date().toISOString();
  writeEvent({ braceletId: bracelet.id, eventType: 'MANUAL_STATUS_CHANGE', oldStatus, newStatus, triggeredBy: `user:${employeeId}`, triggeredByName: employeeName, employeeId });
  persistStore();
  return normalizeBracelet(bracelet);
}
