import { simulateLatency, maybeThrowNetworkError, ApiError } from './client';
import {
  jobs,
  bracelets,
  findOperator,
  claimPendingGuests,
  runJobPipeline,
  writeEvent,
  nextId,
} from './mockData';
import { BRACELET_STATUS, JOB_STATUS, MAX_BRACELETS_PER_OPERATOR } from '../utils/constants';

// Product-brief business rule (not in KODE-TECH-0001): each operator has a
// running allowance of MAX_BRACELETS_PER_OPERATOR total bracelets created.
// Tracked here against operator.braceletsCreated, ready to be swapped for a
// real operator.braceletAllowance field from the backend later.
export function getOperatorLabel(operatorId) {
  const operator = findOperator({ id: operatorId });
  return operator ? operator.name : operatorId;
}

export async function getAllowance(operatorId) {
  await simulateLatency(80, 180);
  const operator = findOperator({ id: operatorId });
  const created = operator ? operator.braceletsCreated : 0;
  return {
    created,
    max: MAX_BRACELETS_PER_OPERATOR,
    remaining: Math.max(0, MAX_BRACELETS_PER_OPERATOR - created),
  };
}

function summarizeJob(job) {
  const guests = bracelets.filter((b) => b.jobId === job.id);
  const counts = {
    pending: 0,
    queued: 0,
    issued: 0,
    failed: 0,
    reconciliationRequired: 0,
  };
  guests.forEach((g) => {
    if (g.status === BRACELET_STATUS.QUEUED) counts.queued += 1;
    else if ([BRACELET_STATUS.ISSUED, BRACELET_STATUS.ACTIVE, BRACELET_STATUS.REVOKED, BRACELET_STATUS.LOST].includes(g.status))
      counts.issued += 1;
    else if (g.status === BRACELET_STATUS.FAILED) counts.failed += 1;
    else if (g.status === BRACELET_STATUS.RECONCILIATION_REQUIRED) counts.reconciliationRequired += 1;
    else counts.pending += 1;
  });
  return { ...job, guestCounts: counts, guestIds: guests.map((g) => g.id) };
}

// Real endpoint: POST /api/v1/jobs (Idempotency-Key header required)
export async function createJob({ quantity, operatorId, idempotencyKey }) {
  await simulateLatency(400, 900);
  maybeThrowNetworkError(0.04);

  const operator = findOperator({ id: operatorId });
  if (!operator) throw new ApiError('UNAUTHENTICATED', 'Session not found.', 401);

  const existing = jobs.find((j) => j.idempotencyKey === idempotencyKey);
  if (existing) return summarizeJob(existing);

  const remaining = MAX_BRACELETS_PER_OPERATOR - operator.braceletsCreated;
  if (quantity > remaining) {
    throw new ApiError('ALLOWANCE_EXCEEDED', `Exceeds remaining allowance of ${remaining}.`, 409);
  }

  const claimed = claimPendingGuests(quantity);
  if (claimed.length < quantity) {
    throw new ApiError(
      'INSUFFICIENT_GUESTS',
      `Only ${claimed.length} pending guests available.`,
      409
    );
  }

  const job = {
    id: nextId('job'),
    quantity,
    status: JOB_STATUS.QUEUED,
    idempotencyKey: idempotencyKey || nextId('idem'),
    requestedBy: operator.id,
    triggerAttempts: 0,
    lastTriggerAttemptAt: null,
    lastTriggerError: null,
    n8nExecId: null,
    needsAttention: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.push(job);

  claimed.forEach((guest) => {
    const oldStatus = guest.status;
    guest.status = BRACELET_STATUS.QUEUED;
    guest.jobId = job.id;
    writeEvent({
      braceletId: guest.id,
      eventType: 'CLAIMED_INTO_JOB',
      oldStatus,
      newStatus: BRACELET_STATUS.QUEUED,
      triggeredBy: `user:${operator.id}`,
    });
  });

  operator.braceletsCreated += quantity;

  runJobPipeline(job);

  return summarizeJob(job);
}

// Real endpoint: GET /api/v1/jobs
export async function getJobs({ requestedBy, status, needsAttention, page = 1, pageSize = 10 } = {}) {
  await simulateLatency(150, 400);
  let list = [...jobs];
  if (requestedBy) list = list.filter((j) => j.requestedBy === requestedBy);
  if (status) list = list.filter((j) => j.status === status);
  if (needsAttention) list = list.filter((j) => j.needsAttention);
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const start = (page - 1) * pageSize;
  const pageItems = list.slice(start, start + pageSize).map(summarizeJob);
  return { items: pageItems, total: list.length, page, pageSize };
}

// Real endpoint: GET /api/v1/jobs/:id
export async function getJob(id) {
  await simulateLatency(120, 300);
  const job = jobs.find((j) => j.id === id);
  if (!job) throw new ApiError('NOT_FOUND', 'Job not found.', 404);
  return summarizeJob(job);
}

// Manual re-dispatch after a FAILED (dispatch-exhausted) job — §7.3/§7.4.
export async function retryJobDispatch(id) {
  await simulateLatency(300, 600);
  maybeThrowNetworkError(0.03);

  const job = jobs.find((j) => j.id === id);
  if (!job) throw new ApiError('NOT_FOUND', 'Job not found.', 404);
  if (job.status !== JOB_STATUS.FAILED) {
    throw new ApiError('INVALID_STATUS_TRANSITION', 'Only a failed dispatch can be retried.', 409);
  }

  job.status = JOB_STATUS.QUEUED;
  job.triggerAttempts = 0;
  job.needsAttention = false;
  job.updatedAt = new Date().toISOString();
  runJobPipeline(job);

  return summarizeJob(job);
}
