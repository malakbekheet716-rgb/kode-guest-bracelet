import { request, ApiError } from './client.js';
import {
  jobs as mockJobs,
  claimPendingGuests,
  runJobPipeline,
  getTodayCreatedCount,
  writeEvent,
  nextId,
  persistStore,
} from './mockData.js';
import { BRACELET_STATUS, JOB_STATUS, MAX_GUESTS_PER_JOB, MAX_BRACELETS_PER_BATCH } from '../utils/constants.js';

export function getOperatorLabel(operatorId) {
  if (!operatorId) return 'System';
  return operatorId;
}

export function normalizeJob(job) {
  if (!job) return null;
  const summary = job.guestSummary || {};
  const counts = job.guestCounts || {
    issued: summary.ISSUED || summary.ACTIVE || summary.issued || 0,
    failed: summary.FAILED || summary.failed || 0,
    queued: summary.QUEUED || summary.queued || 0,
    reconciliationRequired: summary.RECONCILIATION_REQUIRED || summary.reconciliationRequired || 0,
    pending: summary.PENDING || summary.pending || 0,
  };

  return {
    ...job,
    guestCounts: counts,
    createdBy: job.createdBy || { employeeId: job.requestedBy, name: job.requestedByName || job.requestedBy },
  };
}

export async function getCreationStats(employeeId) {
  try {
    const [jobsRes, lastIssuedRes] = await Promise.all([
      request('/jobs?pageSize=100').catch(() => null),
      request('/bracelets/last-issued?limit=100').catch(() => null),
    ]);

    if (jobsRes && jobsRes.data) {
      const allJobs = jobsRes.data || [];
      const total = allJobs.reduce((sum, j) => sum + (j.quantity || 0), 0);
      
      // Calculate today's issued count from lastIssued or jobs
      const todayDate = new Date().toISOString().slice(0, 10);
      let todayCount = 0;
      if (lastIssuedRes && lastIssuedRes.data) {
        todayCount = lastIssuedRes.data.filter((b) => b.issuedAt && b.issuedAt.startsWith(todayDate)).length;
      } else {
        todayCount = allJobs
          .filter((j) => j.createdAt && j.createdAt.startsWith(todayDate) && j.status === 'COMPLETED')
          .reduce((sum, j) => sum + (j.quantity || 0), 0);
      }

      return {
        today: todayCount || getTodayCreatedCount(employeeId),
        total: total || 0,
        maxPerBatch: Math.min(MAX_GUESTS_PER_JOB, MAX_BRACELETS_PER_BATCH, 30),
      };
    }
  } catch {
    // Fallback to local store if backend unreachable
  }

  const total = mockJobs.filter((j) => j.requestedBy === employeeId).reduce((sum, j) => sum + j.quantity, 0);
  return {
    today: getTodayCreatedCount(employeeId),
    total,
    maxPerBatch: Math.min(MAX_GUESTS_PER_JOB, MAX_BRACELETS_PER_BATCH, 30),
  };
}

export async function createJob({ quantity, operatorId, operatorName, idempotencyKey }) {
  const batchMax = Math.min(MAX_GUESTS_PER_JOB, MAX_BRACELETS_PER_BATCH, 30);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > batchMax) {
    throw new ApiError('BATCH_LIMIT_EXCEEDED', `Quantity must be between 1 and ${batchMax} per batch.`, 409);
  }

  try {
    const res = await request('/jobs', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      body: JSON.stringify({ quantity }),
    });

    if (res && res.id) {
      return normalizeJob(res);
    }
  } catch (err) {
    if (err.httpStatus === 409 || err.httpStatus === 400 || err.httpStatus === 401) {
      throw err;
    }
    // Fallback to offline store if network fails
  }

  // Offline / fallback mock implementation
  const employeeId = String(operatorId || '').trim() || 'OP-001';
  const employeeName = String(operatorName || '').trim() || 'Operator';
  const claimed = claimPendingGuests(quantity);
  if (claimed.length < quantity) {
    const error = new ApiError('INSUFFICIENT_GUESTS', `Only ${claimed.length} pending guests available, ${quantity} requested.`, 409);
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
  mockJobs.push(job);

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

  persistStore();
  runJobPipeline(job);
  return normalizeJob(job);
}

export async function getJobs({ requestedBy, status, needsAttention, page = 1, pageSize = 20 } = {}) {
  try {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (needsAttention !== undefined) params.set('needsAttention', String(needsAttention));
    if (page) params.set('page', String(page));
    if (pageSize) params.set('pageSize', String(pageSize));

    const res = await request(`/jobs?${params.toString()}`);
    if (res) {
      const rawList = res.data || res.items || [];
      return {
        items: rawList.map(normalizeJob),
        total: res.total ?? rawList.length,
        page: res.page || page,
        pageSize: res.pageSize || pageSize,
      };
    }
  } catch {
    // Fallback to offline store
  }

  let list = [...mockJobs];
  if (requestedBy) list = list.filter((j) => j.requestedBy === requestedBy);
  if (status) list = list.filter((j) => j.status === status);
  if (needsAttention) list = list.filter((j) => j.needsAttention);
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const start = (page - 1) * pageSize;
  return { items: list.slice(start, start + pageSize).map(normalizeJob), total: list.length, page, pageSize };
}

export async function getJob(id) {
  try {
    const res = await request(`/jobs/${id}`);
    if (res && res.id) {
      return normalizeJob(res);
    }
  } catch (err) {
    if (err.httpStatus === 404) throw err;
  }

  const job = mockJobs.find((j) => j.id === id);
  if (!job) throw new ApiError('NOT_FOUND', 'Job not found.', 404);
  return normalizeJob(job);
}

export async function retryJobDispatch(id) {
  try {
    const res = await request(`/jobs/${id}/retry`, { method: 'POST' });
    if (res && res.id) {
      return normalizeJob(res);
    }
  } catch (err) {
    if (err.httpStatus) throw err;
  }

  const job = mockJobs.find((j) => j.id === id);
  if (!job) throw new ApiError('NOT_FOUND', 'Job not found.', 404);
  job.status = JOB_STATUS.QUEUED;
  job.triggerAttempts = 0;
  job.needsAttention = false;
  job.updatedAt = new Date().toISOString();
  runJobPipeline(job);
  return normalizeJob(job);
}
