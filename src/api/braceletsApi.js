import { simulateLatency, maybeThrowNetworkError, ApiError } from './client';
import { bracelets, events, jobs, writeEvent, runJobPipeline, nextId } from './mockData';
import { BRACELET_STATUS, JOB_STATUS, ROLES } from '../utils/constants';

// Real endpoint: GET /api/v1/bracelets
export async function getBracelets({ status, jobId, braceletNumber, page = 1, pageSize = 20 } = {}) {
  await simulateLatency(150, 400);
  let list = [...bracelets];
  if (status) list = list.filter((b) => b.status === status);
  if (jobId) list = list.filter((b) => b.jobId === jobId);
  if (braceletNumber) {
    const needle = braceletNumber.trim().toLowerCase();
    list = list.filter((b) => b.braceletNumber.toLowerCase().includes(needle));
  }
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const start = (page - 1) * pageSize;
  return { items: list.slice(start, start + pageSize), total: list.length, page, pageSize };
}

// Real endpoint: GET /api/v1/bracelets/:id
export async function getBracelet(id) {
  await simulateLatency(120, 300);
  const bracelet = bracelets.find((b) => b.id === id);
  if (!bracelet) throw new ApiError('NOT_FOUND', 'Bracelet not found.', 404);
  const history = events
    .filter((e) => e.braceletId === id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const job = bracelet.jobId ? jobs.find((j) => j.id === bracelet.jobId) : null;
  return {
    ...bracelet,
    createdBy: job ? { employeeId: job.requestedBy, name: job.requestedByName } : null,
    events: history,
  };
}

function identity(operatorId, operatorName) {
  const employeeId = String(operatorId || '').trim();
  const employeeName = String(operatorName || '').trim();
  if (!employeeId || !employeeName) throw new ApiError('UNAUTHENTICATED', 'Employee identity is required.', 401);
  return { employeeId, employeeName };
}

export async function retryBracelet(id, operatorId, operatorName) {
  await simulateLatency(300, 600);
  maybeThrowNetworkError(0.03);
  const { employeeId, employeeName } = identity(operatorId, operatorName);

  const bracelet = bracelets.find((b) => b.id === id);
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
  jobs.push(job);

  const oldStatus = bracelet.status;
  bracelet.status = BRACELET_STATUS.QUEUED;
  bracelet.jobId = job.id;
  bracelet.lastIssueError = null;
  writeEvent({ braceletId: bracelet.id, eventType: 'MANUAL_RETRY', oldStatus, newStatus: BRACELET_STATUS.QUEUED, triggeredBy: `user:${employeeId}`, triggeredByName: employeeName, employeeId });
  runJobPipeline(job);
  return { ...bracelet };
}

export async function reconcileBracelet(id, outcome, operatorId, operatorName) {
  await simulateLatency(300, 600);
  maybeThrowNetworkError(0.03);
  const { employeeId, employeeName } = identity(operatorId, operatorName);

  const bracelet = bracelets.find((b) => b.id === id);
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
  } else {
    throw new ApiError('VALIDATION_ERROR', 'Unknown reconciliation outcome.', 400);
  }
  return { ...bracelet };
}

const ALLOWED_MANUAL_TRANSITIONS = {
  [BRACELET_STATUS.ACTIVE]: [BRACELET_STATUS.ISSUED],
  [BRACELET_STATUS.LOST]: [BRACELET_STATUS.ACTIVE],
  [BRACELET_STATUS.REVOKED]: [BRACELET_STATUS.ACTIVE],
};

export async function updateBraceletStatus(id, newStatus, { operatorId, operatorName, role }) {
  await simulateLatency(250, 500);
  maybeThrowNetworkError(0.03);
  const { employeeId, employeeName } = identity(operatorId, operatorName);

  if (newStatus === BRACELET_STATUS.REVOKED && role !== ROLES.ADMIN) {
    throw new ApiError('FORBIDDEN', 'Only an admin can revoke a bracelet.', 403);
  }
  const bracelet = bracelets.find((b) => b.id === id);
  if (!bracelet) throw new ApiError('NOT_FOUND', 'Bracelet not found.', 404);
  const allowedFrom = ALLOWED_MANUAL_TRANSITIONS[newStatus] || [];
  if (!allowedFrom.includes(bracelet.status)) {
    throw new ApiError('INVALID_STATUS_TRANSITION', `Cannot move from ${bracelet.status} to ${newStatus}.`, 409);
  }

  const oldStatus = bracelet.status;
  bracelet.status = newStatus;
  if (newStatus === BRACELET_STATUS.ACTIVE) bracelet.activatedAt = new Date().toISOString();
  if (newStatus === BRACELET_STATUS.REVOKED) bracelet.revokedAt = new Date().toISOString();
  writeEvent({ braceletId: bracelet.id, eventType: 'MANUAL_STATUS_CHANGE', oldStatus, newStatus, triggeredBy: `user:${employeeId}`, triggeredByName: employeeName, employeeId });
  return { ...bracelet };
}
