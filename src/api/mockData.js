import {
  BRACELET_STATUS,
  JOB_STATUS,
} from '../utils/constants.js';

const STORAGE_KEYS = {
  JOBS: 'kode_gbs_jobs',
  BRACELETS: 'kode_gbs_bracelets',
  EVENTS: 'kode_gbs_events',
  ID_COUNTER: 'kode_gbs_idCounter',
  SEQ_COUNTER: 'kode_gbs_seq',
};

let idCounter = 1000;
let seqCounter = 1;

export function nextId(prefix) {
  idCounter += 1;
  persistStore();
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

export const operators = [];
export const pendingSignupRequests = [];
export const bracelets = [];
export const jobs = [];
export const events = [];

export function persistStore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
      window.localStorage.setItem(STORAGE_KEYS.BRACELETS, JSON.stringify(bracelets));
      window.localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
      window.localStorage.setItem(STORAGE_KEYS.ID_COUNTER, String(idCounter));
      window.localStorage.setItem(STORAGE_KEYS.SEQ_COUNTER, String(seqCounter));
    } catch (e) {
      console.warn('Failed to persist store:', e);
    }
  }
}

function loadStore() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const rawJobs = window.localStorage.getItem(STORAGE_KEYS.JOBS);
    const rawBracelets = window.localStorage.getItem(STORAGE_KEYS.BRACELETS);
    const rawEvents = window.localStorage.getItem(STORAGE_KEYS.EVENTS);
    const rawIdCounter = window.localStorage.getItem(STORAGE_KEYS.ID_COUNTER);
    const rawSeq = window.localStorage.getItem(STORAGE_KEYS.SEQ_COUNTER);

    if (rawJobs && rawBracelets) {
      const parsedJobs = JSON.parse(rawJobs);
      const parsedBracelets = JSON.parse(rawBracelets);
      const parsedEvents = rawEvents ? JSON.parse(rawEvents) : [];

      jobs.length = 0;
      jobs.push(...parsedJobs);

      bracelets.length = 0;
      bracelets.push(...parsedBracelets);

      events.length = 0;
      events.push(...parsedEvents);

      if (rawIdCounter) {
        idCounter = parseInt(rawIdCounter, 10) || 1000;
      }
      if (rawSeq) {
        seqCounter = parseInt(rawSeq, 10) || 1;
      }

      return true;
    }
  } catch (error) {
    console.warn('Failed to load store from localStorage:', error);
  }

  return false;
}

export function getTodayCreatedCount(employeeId) {
  const now = new Date();

  return jobs
    .filter(
      (job) =>
        job.requestedBy === employeeId &&
        isSameCalendarDay(new Date(job.createdAt), now)
    )
    .reduce(
      (sum, job) => sum + Number(job.quantity || 0),
      0
    );
}

function writeEvent({
  braceletId,
  eventType,
  oldStatus,
  newStatus,
  triggeredBy,
  triggeredByName = null,
  employeeId = null,
  httpStatusCode = null,
}) {
  events.push({
    id: nextId('evt'),
    braceletId,
    eventType,
    oldStatus,
    newStatus,
    httpStatusCode,
    triggeredBy,
    triggeredByName,
    employeeId,
    requestId: nextId('req'),
    createdAt: new Date().toISOString(),
  });
  persistStore();
}

export { writeEvent };

function makeBracelet(n, overrides = {}) {
  const bracelet = {
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

    createdAt: new Date().toISOString(),

    ...overrides,
  };

  bracelets.push(bracelet);
  return bracelet;
}

function seed() {
  const isLoaded = loadStore();
  if (isLoaded) {
    return;
  }

  let n = 1;

  const pastJob = {
    id: nextId('job'),
    quantity: 20,
    status: JOB_STATUS.COMPLETED,
    idempotencyKey: nextId('idem'),

    requestedBy: 'DEMO-001',
    requestedByName: 'Demo Operator',

    triggerAttempts: 1,
    lastTriggerAttemptAt: null,
    lastTriggerError: null,

    n8nExecId: nextId('n8n'),

    needsAttention: false,

    createdAt: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 6
    ).toISOString(),
    updatedAt: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 6
    ).toISOString(),
  };

  jobs.push(pastJob);

  for (let i = 0; i < 20; i += 1) {
    makeBracelet(n++, {
      status:
        i < 12
          ? BRACELET_STATUS.ISSUED
          : i < 17
            ? BRACELET_STATUS.ACTIVE
            : BRACELET_STATUS.PENDING,

      jobId: pastJob.id,
      issuedAt: pastJob.createdAt,
    });
  }

  for (let i = 0; i < 90; i += 1) {
    makeBracelet(n++, {
      status: BRACELET_STATUS.PENDING,
    });
  }

  seqCounter = n;
  persistStore();
}

seed();

export function findOperator({ id }) {
  if (!id) {
    return null;
  }

  return {
    id,
    employeeId: id,
    name:
      jobs.find(
        (job) => job.requestedBy === id
      )?.requestedByName || id,
    role: 'operator',
  };
}

export function claimPendingGuests(quantity) {
  const claimed = [];

  for (const bracelet of bracelets) {
    if (claimed.length >= quantity) {
      break;
    }

    if (
      bracelet.status ===
      BRACELET_STATUS.PENDING
    ) {
      claimed.push(bracelet);
    }
  }

  while (claimed.length < quantity) {
    const newBracelet = makeBracelet(seqCounter++);
    claimed.push(newBracelet);
  }

  persistStore();
  return claimed;
}

function randomOutcome() {
  const r = Math.random();

  if (r < 0.82) {
    return 'SUCCESS';
  }

  if (r < 0.92) {
    return 'CONFIRMED_FAILURE';
  }

  return 'UNKNOWN';
}

function recomputeJobStatus(job) {
  const guests = bracelets.filter(
    (bracelet) =>
      bracelet.jobId === job.id
  );

  const terminal = (status) =>
    [
      BRACELET_STATUS.ISSUED,
      BRACELET_STATUS.FAILED,
      BRACELET_STATUS.RECONCILIATION_REQUIRED,
      BRACELET_STATUS.ACTIVE,
      BRACELET_STATUS.REVOKED,
      BRACELET_STATUS.LOST,
    ].includes(status);

  if (!guests.every((guest) => terminal(guest.status))) {
    persistStore();
    return;
  }

  job.status = guests.every((guest) =>
    [
      BRACELET_STATUS.ISSUED,
      BRACELET_STATUS.ACTIVE,
      BRACELET_STATUS.REVOKED,
      BRACELET_STATUS.LOST,
    ].includes(guest.status)
  )
    ? JOB_STATUS.COMPLETED
    : JOB_STATUS.COMPLETED_WITH_ERRORS;

  job.updatedAt = new Date().toISOString();
  persistStore();
}

export function runJobPipeline(job) {
  const guests = bracelets.filter(
    (bracelet) =>
      bracelet.jobId === job.id
  );

  const dispatchFails =
    Math.random() < 0.06;

  setTimeout(() => {
    if (
      dispatchFails &&
      job.triggerAttempts < 3
    ) {
      job.triggerAttempts = 3;

      job.lastTriggerAttemptAt =
        new Date().toISOString();

      job.lastTriggerError =
        'n8n did not respond after 3 attempts';

      job.status = JOB_STATUS.FAILED;

      job.updatedAt =
        new Date().toISOString();

      persistStore();
      return;
    }

    job.status = JOB_STATUS.IN_PROGRESS;
    job.triggerAttempts = 1;
    job.updatedAt =
      new Date().toISOString();
    persistStore();

    guests.forEach((guest, index) => {
      setTimeout(() => {
        const outcome = randomOutcome();
        const oldStatus = guest.status;

        if (outcome === 'SUCCESS') {
          guest.status =
            BRACELET_STATUS.ISSUED;

          guest.issuedAt =
            new Date().toISOString();

          guest.paymobConsumerRef =
            nextId('pmb');

          guest.lastIssueError = null;
        } else if (
          outcome === 'CONFIRMED_FAILURE'
        ) {
          guest.status =
            BRACELET_STATUS.FAILED;

          guest.lastIssueError =
            'PayMob rejected the request (4xx)';
        } else {
          guest.status =
            BRACELET_STATUS.RECONCILIATION_REQUIRED;

          guest.lastIssueError =
            'No confirmed response from PayMob (timeout)';
        }

        writeEvent({
          braceletId: guest.id,
          eventType: 'ISSUE_RESULT',
          oldStatus,
          newStatus: guest.status,
          triggeredBy: 'n8n:callback',
          triggeredByName:
            job.requestedByName,
          employeeId: job.requestedBy,
          httpStatusCode:
            outcome === 'SUCCESS'
              ? 200
              : outcome === 'CONFIRMED_FAILURE'
                ? 409
                : 0,
        });

        recomputeJobStatus(job);
      }, 500 + index * 450);
    });
  }, 1200);
}