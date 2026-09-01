import { simulateLatency, maybeThrowNetworkError, ApiError } from './client';
import {
  jobs,
  bracelets,
  claimPendingGuests,
  runJobPipeline,
  getTodayCreatedCount,
  writeEvent,
  nextId,
} from './mockData';
import { BRACELET_STATUS, JOB_STATUS, MAX_GUESTS_PER_JOB, MAX_BRACELETS_PER_BATCH } from '../utils/constants';

export function getOperatorLabel(operatorId) {
  const job = jobs.find((j) => j.requestedBy === operatorId);
  return job?.requestedByName ? `${job.requestedByName} (${operatorId})` : operatorId;
}

export async function getCreationStats(employeeId) {
  await simulateLatency(80, 180);
  const total = jobs.filter((j) => j.requestedBy === employeeId).reduce((sum, j) => sum + j.quantity, 0);
  return {
    today: getTodayCreatedCount(employeeId),
    total,
    maxPerBatch: Math.min(MAX_GUESTS_PER_JOB, MAX_BRACELETS_PER_BATCH, 30),
  };
}

function summarizeJob(job) {
  const guests = bracelets.filter((b) => b.jobId === job.id);
  const counts = { pending: 0, queued: 0, issued: 0, failed: 0, reconciliationRequired: 0 };
  guests.forEach((g) => {
    if (g.status === BRACELET_STATUS.QUEUED) counts.queued += 1;
    else if ([BRACELET_STATUS.ISSUED, BRACELET_STATUS.ACTIVE, BRACELET_STATUS.REVOKED, BRACELET_STATUS.LOST].includes(g.status)) counts.issued += 1;
    else if (g.status === BRACELET_STATUS.FAILED) counts.failed += 1;
    else if (g.status === BRACELET_STATUS.RECONCILIATION_REQUIRED) counts.reconciliationRequired += 1;
    else counts.pending += 1;
  });
  return {
    ...job,
    createdBy: { employeeId: job.requestedBy, name: job.requestedByName },
    guestCounts: counts,
    guestIds: guests.map((g) => g.id),
    braceletNumbers: guests.map((g) => g.braceletNumber),
  };
}

export async function createJob({ quantity, operatorId, operatorName, idempotencyKey }) {
  await simulateLatency(400, 900);
  maybeThrowNetworkError(0.04);

  const employeeId = String(operatorId || '').trim();
  const employeeName = String(operatorName || '').trim();
  if (!employeeId || !employeeName) {
    throw new ApiError('UNAUTHENTICATED', 'Employee identity is required.', 401);
  }

  const existing = idempotencyKey && jobs.find((j) => j.idempotencyKey === idempotencyKey);
  if (existing) return summarizeJob(existing);

  const batchMax = Math.min(MAX_GUESTS_PER_JOB, MAX_BRACELETS_PER_BATCH, 30);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > batchMax) {
    throw new ApiError('BATCH_LIMIT_EXCEEDED', `Quantity must be between 1 and ${batchMax} per batch.`, 409);
  }

  const claimed = claimPendingGuests(quantity);
  if (claimed.length < quantity) {
    const error = new ApiError('INSUFFICIENT_GUESTS', 'Not enough pending bracelets are available.', 409);
    error.available = claimed.length;
    throw error;
  }

  const job = {
    id: nextId('job'),
    quantity,
    status: JOB_STATUS.QUEUED,
    idempotencyKey: idempotencyKey || nextId('idem'),
    requestedBy: employeeId,
    requestedByName: employeeName,
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
      triggeredBy: `user:${employeeId}`,
      triggeredByName: employeeName,
      employeeId,
    });
  });

  runJobPipeline(job);
  return summarizeJob(job);
}

export async function getJobs({ requestedBy, status, needsAttention, page = 1, pageSize = 10 } = {}) {
  await simulateLatency(150, 400);
  let list = [...jobs];
  if (requestedBy) list = list.filter((j) => j.requestedBy === requestedBy);
  if (status) list = list.filter((j) => j.status === status);
  if (needsAttention) list = list.filter((j) => j.needsAttention);
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const start = (page - 1) * pageSize;
  return { items: list.slice(start, start + pageSize).map(summarizeJob), total: list.length, page, pageSize };
}

export async function getJob(id) {
  await simulateLatency(120, 300);
  const job = jobs.find((j) => j.id === id);
  if (!job) throw new ApiError('NOT_FOUND', 'Job not found.', 404);
  return summarizeJob(job);
}

export async function retryJobDispatch(id) {
  await simulateLatency(300, 600);
  maybeThrowNetworkError(0.03);
  const job = jobs.find((j) => j.id === id);
  if (!job) throw new ApiError('NOT_FOUND', 'Job not found.', 404);
  if (job.status !== JOB_STATUS.FAILED) throw new ApiError('INVALID_STATUS_TRANSITION', 'Only a failed dispatch can be retried.', 409);
  job.status = JOB_STATUS.QUEUED;
  job.triggerAttempts = 0;
  job.needsAttention = false;
  job.updatedAt = new Date().toISOString();
  runJobPipeline(job);
  return summarizeJob(job);
}
