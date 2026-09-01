import { BRACELET_STATUS, JOB_STATUS } from '../utils/constants';

let idCounter = 1000;
export function nextId(prefix) { idCounter += 1; return `${prefix}_${idCounter.toString(36)}`; }
function pad(n, len = 6) { return String(n).padStart(len, '0'); }
function isSameCalendarDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

export const operators = [];
export const pendingSignupRequests = [];
export const bracelets = [];
export const jobs = [];
export const events = [];

export function getTodayCreatedCount(employeeId) {
  const now = new Date();
  return jobs.filter((j) => j.requestedBy === employeeId && isSameCalendarDay(new Date(j.createdAt), now)).reduce((sum, j) => sum + j.quantity, 0);
}

function writeEvent({ braceletId, eventType, oldStatus, newStatus, triggeredBy, triggeredByName = null, employeeId = null, httpStatusCode = null }) {
  events.push({ id: nextId('evt'), braceletId, eventType, oldStatus, newStatus, httpStatusCode, triggeredBy, triggeredByName, employeeId, requestId: nextId('req'), createdAt: new Date().toISOString() });
}
export { writeEvent };

function makeBracelet(n, overrides = {}) {
  const b = { id: nextId('gb'), braceletNumber: `GB-${pad(n)}`, braceletCode: `LEG-${pad(n, 5)}`, firstNameSubmitted: null, lastNameSubmitted: null, status: BRACELET_STATUS.PENDING, jobId: null, paymobConsumerRef: null, lastIssueError: null, issuedAt: null, activatedAt: null, revokedAt: null, createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 20).toISOString(), ...overrides };
  bracelets.push(b); return b;
}

(function seed() {
  let n = 1;
  const pastJob = { id: nextId('job'), quantity: 20, status: JOB_STATUS.COMPLETED, idempotencyKey: nextId('idem'), requestedBy: 'DEMO-001', requestedByName: 'Demo Operator', triggerAttempts: 1, lastTriggerAttemptAt: null, lastTriggerError: null, n8nExecId: nextId('n8n'), needsAttention: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString() };
  jobs.push(pastJob);
  for (let i = 0; i < 20; i += 1) makeBracelet(n++, { status: i < 12 ? BRACELET_STATUS.ISSUED : i < 17 ? BRACELET_STATUS.ACTIVE : BRACELET_STATUS.PENDING, jobId: pastJob.id, issuedAt: pastJob.createdAt });
  for (let i = 0; i < 90; i += 1) makeBracelet(n++, { status: BRACELET_STATUS.PENDING });
})();

export function findOperator({ id }) {
  return id ? { id, employeeId: id, name: jobs.find((j) => j.requestedBy === id)?.requestedByName || id, role: 'operator' } : null;
}
export function claimPendingGuests(quantity) {
  const claimed = [];
  for (const b of bracelets) { if (claimed.length >= quantity) break; if (b.status === BRACELET_STATUS.PENDING) claimed.push(b); }
  return claimed;
}
function randomOutcome() { const r = Math.random(); if (r < 0.82) return 'SUCCESS'; if (r < 0.92) return 'CONFIRMED_FAILURE'; return 'UNKNOWN'; }
function recomputeJobStatus(job) {
  const guests = bracelets.filter((b) => b.jobId === job.id);
  const terminal = (s) => [BRACELET_STATUS.ISSUED, BRACELET_STATUS.FAILED, BRACELET_STATUS.RECONCILIATION_REQUIRED, BRACELET_STATUS.ACTIVE, BRACELET_STATUS.REVOKED, BRACELET_STATUS.LOST].includes(s);
  if (!guests.every((g) => terminal(g.status))) return;
  job.status = guests.every((g) => [BRACELET_STATUS.ISSUED, BRACELET_STATUS.ACTIVE, BRACELET_STATUS.REVOKED, BRACELET_STATUS.LOST].includes(g.status)) ? JOB_STATUS.COMPLETED : JOB_STATUS.COMPLETED_WITH_ERRORS;
  job.updatedAt = new Date().toISOString();
}
export function runJobPipeline(job) {
  const guests = bracelets.filter((b) => b.jobId === job.id);
  const dispatchFails = Math.random() < 0.06;
  setTimeout(() => {
    if (dispatchFails && job.triggerAttempts < 3) { job.triggerAttempts = 3; job.lastTriggerAttemptAt = new Date().toISOString(); job.lastTriggerError = 'n8n did not respond after 3 attempts'; job.status = JOB_STATUS.FAILED; job.updatedAt = new Date().toISOString(); return; }
    job.status = JOB_STATUS.IN_PROGRESS; job.triggerAttempts = 1; job.updatedAt = new Date().toISOString();
    guests.forEach((guest, index) => setTimeout(() => {
      const outcome = randomOutcome(); const oldStatus = guest.status;
      if (outcome === 'SUCCESS') { guest.status = BRACELET_STATUS.ISSUED; guest.issuedAt = new Date().toISOString(); guest.paymobConsumerRef = nextId('pmb'); guest.lastIssueError = null; }
      else if (outcome === 'CONFIRMED_FAILURE') { guest.status = BRACELET_STATUS.FAILED; guest.lastIssueError = 'PayMob rejected the request (4xx)'; }
      else { guest.status = BRACELET_STATUS.RECONCILIATION_REQUIRED; guest.lastIssueError = 'No confirmed response from PayMob (timeout)'; }
      writeEvent({ braceletId: guest.id, eventType: 'ISSUE_RESULT', oldStatus, newStatus: guest.status, triggeredBy: 'n8n:callback', triggeredByName: job.requestedByName, employeeId: job.requestedBy, httpStatusCode: outcome === 'SUCCESS' ? 200 : outcome === 'CONFIRMED_FAILURE' ? 409 : 0 });
      recomputeJobStatus(job);
    }, 500 + index * 450));
  }, 1200);
}
