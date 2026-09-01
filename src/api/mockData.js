import { BRACELET_STATUS, JOB_STATUS } from '../utils/constants';

// ---------------------------------------------------------------------------
// In-memory store standing in for PostgreSQL (KODE-TECH-0001 §5).
// Three live tables — GuestBracelet, CreationJob, GuestBraceletEvent — plus
// an Operator table for auth. Shapes intentionally mirror the doc's columns.
// ---------------------------------------------------------------------------

let idCounter = 1000;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}`;
}

function pad(n, len = 6) {
  return String(n).padStart(len, '0');
}

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// "Today" is derived from job.createdAt so it survives a refresh instead of
// living only in React state — ready to become a real
// `WHERE requested_by = ? AND created_at::date = CURRENT_DATE` query once
// the backend is connected.
export function getTodayCreatedCount(operatorId) {
  const now = new Date();
  return jobs
    .filter((j) => j.requestedBy === operatorId && isSameCalendarDay(new Date(j.createdAt), now))
    .reduce((sum, j) => sum + j.quantity, 0);
}

export const operators = [
  {
    id: 'op_demo_operator',
    name: 'Sara Ahmed',
    email: 'operator@kodesc.com',
    password: 'operator123',
    role: 'operator',
    braceletsCreated: 12,
  },
  {
    id: 'op_demo_admin',
    name: 'Youssef Kamal',
    email: 'admin@kodesc.com',
    password: 'admin123',
    role: 'admin',
    braceletsCreated: 4,
  },
];

export const pendingSignupRequests = [];

export const bracelets = [];
export const jobs = [];
export const events = [];

function writeEvent({ braceletId, eventType, oldStatus, newStatus, triggeredBy, httpStatusCode = null }) {
  events.push({
    id: nextId('evt'),
    braceletId,
    eventType,
    oldStatus,
    newStatus,
    httpStatusCode,
    triggeredBy,
    requestId: nextId('req'),
    createdAt: new Date().toISOString(),
  });
}

function makeBracelet(n, overrides = {}) {
  const b = {
    id: nextId('gb'),
    braceletNumber: `GB-${pad(n)}`,
    braceletCode: `LEG-${pad(n, 5)}`,
    firstNameSubmitted: null,
    lastNameSubmitted: null,
    status: BRACELET_STATUS.PENDING,
    jobId: null,
    paymobConsumerRef: null,
    lastIssueError: null,
    issuedAt: null,
    activatedAt: null,
    revokedAt: null,
    createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 20).toISOString(),
    ...overrides,
  };
  bracelets.push(b);
  return b;
}

// --- Seed data -------------------------------------------------------------
// Simulates the post-migration state (§10): a fixed pool of guests already
// loaded, in a realistic mix of lifecycle states, so the History and
// Reconciliation views aren't empty on first load.

(function seed() {
  let n = 1;

  // A handful of already-issued & activated bracelets, attributed to a past job.
  const pastJob = {
    id: nextId('job'),
    quantity: 20,
    status: JOB_STATUS.COMPLETED,
    idempotencyKey: nextId('idem'),
    requestedBy: 'op_demo_operator',
    triggerAttempts: 1,
    lastTriggerAttemptAt: null,
    lastTriggerError: null,
    n8nExecId: nextId('n8n'),
    needsAttention: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  };
  jobs.push(pastJob);

  for (let i = 0; i < 12; i += 1) {
    const b = makeBracelet(n++, {
      status: BRACELET_STATUS.ISSUED,
      jobId: pastJob.id,
      paymobConsumerRef: nextId('pmb'),
      issuedAt: pastJob.createdAt,
    });
    writeEvent({
      braceletId: b.id,
      eventType: 'ISSUE_RESULT',
      oldStatus: BRACELET_STATUS.QUEUED,
      newStatus: BRACELET_STATUS.ISSUED,
      triggeredBy: 'n8n:callback',
      httpStatusCode: 200,
    });
  }

  for (let i = 0; i < 5; i += 1) {
    const b = makeBracelet(n++, {
      status: BRACELET_STATUS.ACTIVE,
      jobId: pastJob.id,
      paymobConsumerRef: nextId('pmb'),
      issuedAt: pastJob.createdAt,
      activatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    });
    writeEvent({
      braceletId: b.id,
      eventType: 'ISSUE_RESULT',
      oldStatus: BRACELET_STATUS.QUEUED,
      newStatus: BRACELET_STATUS.ISSUED,
      triggeredBy: 'n8n:callback',
      httpStatusCode: 200,
    });
    writeEvent({
      braceletId: b.id,
      eventType: 'MANUAL_STATUS_CHANGE',
      oldStatus: BRACELET_STATUS.ISSUED,
      newStatus: BRACELET_STATUS.ACTIVE,
      triggeredBy: 'user:op_demo_operator',
    });
  }

  {
    const b = makeBracelet(n++, {
      status: BRACELET_STATUS.REVOKED,
      jobId: pastJob.id,
      paymobConsumerRef: nextId('pmb'),
      issuedAt: pastJob.createdAt,
      activatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      revokedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    });
    writeEvent({
      braceletId: b.id,
      eventType: 'MANUAL_STATUS_CHANGE',
      oldStatus: BRACELET_STATUS.ACTIVE,
      newStatus: BRACELET_STATUS.REVOKED,
      triggeredBy: 'user:op_demo_admin',
    });
  }

  {
    const b = makeBracelet(n++, {
      status: BRACELET_STATUS.LOST,
      jobId: pastJob.id,
      paymobConsumerRef: nextId('pmb'),
      issuedAt: pastJob.createdAt,
      activatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    });
    writeEvent({
      braceletId: b.id,
      eventType: 'MANUAL_STATUS_CHANGE',
      oldStatus: BRACELET_STATUS.ACTIVE,
      newStatus: BRACELET_STATUS.LOST,
      triggeredBy: 'user:op_demo_operator',
    });
  }

  for (let i = 0; i < 2; i += 1) {
    const b = makeBracelet(n++, {
      status: BRACELET_STATUS.FAILED,
      jobId: pastJob.id,
      lastIssueError: 'PayMob rejected: duplicate consumer reference',
    });
    writeEvent({
      braceletId: b.id,
      eventType: 'ISSUE_RESULT',
      oldStatus: BRACELET_STATUS.QUEUED,
      newStatus: BRACELET_STATUS.FAILED,
      triggeredBy: 'n8n:callback',
      httpStatusCode: 409,
    });
  }

  for (let i = 0; i < 2; i += 1) {
    const b = makeBracelet(n++, {
      status: BRACELET_STATUS.RECONCILIATION_REQUIRED,
      jobId: pastJob.id,
      lastIssueError: 'PayMob request timed out after 8000ms',
    });
    writeEvent({
      braceletId: b.id,
      eventType: 'ISSUE_RESULT',
      oldStatus: BRACELET_STATUS.QUEUED,
      newStatus: BRACELET_STATUS.RECONCILIATION_REQUIRED,
      triggeredBy: 'n8n:callback',
      httpStatusCode: 0,
    });
  }

  // Remaining pool: untouched guests from the migration, ready to be claimed.
  for (let i = 0; i < 90; i += 1) {
    makeBracelet(n++, { status: BRACELET_STATUS.PENDING });
    writeEvent({
      braceletId: bracelets[bracelets.length - 1].id,
      eventType: 'MIGRATED_FROM_LEGACY',
      oldStatus: null,
      newStatus: BRACELET_STATUS.PENDING,
      triggeredBy: 'system:migration',
    });
  }
})();

// --- Helpers used by jobsApi / braceletsApi --------------------------------

export function findOperator({ email, id }) {
  if (id) return operators.find((o) => o.id === id) || null;
  return operators.find((o) => o.email.toLowerCase() === String(email).toLowerCase()) || null;
}

export function claimPendingGuests(quantity) {
  const claimed = [];
  for (const b of bracelets) {
    if (claimed.length >= quantity) break;
    if (b.status === BRACELET_STATUS.PENDING) claimed.push(b);
  }
  return claimed;
}

function randomOutcome() {
  const r = Math.random();
  if (r < 0.82) return 'SUCCESS';
  if (r < 0.92) return 'CONFIRMED_FAILURE';
  return 'UNKNOWN';
}

function recomputeJobStatus(job) {
  const guests = bracelets.filter((b) => b.jobId === job.id);
  const terminal = (s) =>
    [
      BRACELET_STATUS.ISSUED,
      BRACELET_STATUS.FAILED,
      BRACELET_STATUS.RECONCILIATION_REQUIRED,
      BRACELET_STATUS.ACTIVE,
      BRACELET_STATUS.REVOKED,
      BRACELET_STATUS.LOST,
    ].includes(s);

  const allTerminal = guests.every((g) => terminal(g.status));
  if (!allTerminal) return;

  const allIssued = guests.every((g) =>
    [BRACELET_STATUS.ISSUED, BRACELET_STATUS.ACTIVE, BRACELET_STATUS.REVOKED, BRACELET_STATUS.LOST].includes(
      g.status
    )
  );
  job.status = allIssued ? JOB_STATUS.COMPLETED : JOB_STATUS.COMPLETED_WITH_ERRORS;
  job.updatedAt = new Date().toISOString();
}

// Simulates n8n dispatch + per-guest PayMob callbacks (§5.3, §6.7, §7.2) for
// a job that has already claimed its guests. Runs entirely client-side on a
// timer so the UI can poll it exactly like it would poll the real API.
export function runJobPipeline(job) {
  const guests = bracelets.filter((b) => b.jobId === job.id);

  // Rare simulated dispatch failure — exhausts retries, guests stay QUEUED.
  const dispatchFails = Math.random() < 0.06;

  setTimeout(() => {
    if (dispatchFails && job.triggerAttempts < 3) {
      job.triggerAttempts = 3;
      job.lastTriggerAttemptAt = new Date().toISOString();
      job.lastTriggerError = 'n8n did not respond after 3 attempts (5s/30s/2min backoff)';
      job.status = JOB_STATUS.FAILED;
      job.updatedAt = new Date().toISOString();
      return;
    }

    job.status = JOB_STATUS.IN_PROGRESS;
    job.triggerAttempts = 1;
    job.updatedAt = new Date().toISOString();

    guests.forEach((guest, index) => {
      setTimeout(() => {
        const outcome = randomOutcome();
        const oldStatus = guest.status;
        if (outcome === 'SUCCESS') {
          guest.status = BRACELET_STATUS.ISSUED;
          guest.issuedAt = new Date().toISOString();
          guest.paymobConsumerRef = nextId('pmb');
          guest.lastIssueError = null;
        } else if (outcome === 'CONFIRMED_FAILURE') {
          guest.status = BRACELET_STATUS.FAILED;
          guest.lastIssueError = 'PayMob rejected the request (4xx)';
        } else {
          guest.status = BRACELET_STATUS.RECONCILIATION_REQUIRED;
          guest.lastIssueError = 'No confirmed response from PayMob (timeout)';
        }
        writeEvent({
          braceletId: guest.id,
          eventType: 'ISSUE_RESULT',
          oldStatus,
          newStatus: guest.status,
          triggeredBy: 'n8n:callback',
          httpStatusCode: outcome === 'SUCCESS' ? 200 : outcome === 'CONFIRMED_FAILURE' ? 409 : 0,
        });
        recomputeJobStatus(job);
      }, 500 + index * 450);
    });
  }, 1200);
}

export { writeEvent, nextId, getTodayCreatedCount };