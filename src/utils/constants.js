// Mirrors KODE-TECH-0001 v2.0 (§4 Key Design Limits, §5.2 State Machines).
// Keeping these as the single source of truth means the UI never invents a
// status the backend doesn't have, and vice versa.

export const BRACELET_STATUS = {
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  ISSUED: 'ISSUED',
  FAILED: 'FAILED',
  RECONCILIATION_REQUIRED: 'RECONCILIATION_REQUIRED',
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  LOST: 'LOST',
  QUARANTINED: 'QUARANTINED',
};

export const JOB_STATUS = {
  QUEUED: 'QUEUED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  COMPLETED_WITH_ERRORS: 'COMPLETED_WITH_ERRORS',
  FAILED: 'FAILED',
};

// Maximum number of bracelets a security employee can create in ONE batch is 30.
export const MAX_GUESTS_PER_JOB = 30;
export const MAX_BRACELETS_PER_BATCH = 30;

// §7.4 — stuck-job thresholds, used to decide when to show "taking longer
// than expected" in the UI even before the backend sweep flags needsAttention.
export const QUEUED_STUCK_MINUTES = 10;
export const IN_PROGRESS_STUCK_MINUTES = 30;

// §6.6 — dashboard/job polling cadence and give-up window.
export const POLL_INTERVAL_MS = 3000;
export const POLL_TIMEOUT_MS = 5 * 60 * 1000;

// §6.3 — JWT expiry.
export const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

// One color per status, drawn from the KODE brand palette (Kode_Colors.pdf).
// Reusing the brand's spectrum as the operational status language, rather
// than as decoration.
export const STATUS_COLOR = {
  PENDING: '#6B7280', // neutral — not yet claimed
  QUEUED: '#0072BC', // KODE blue — in the pipe
  ISSUED: '#7A9926', // deepened KODE lime — success, handed to guest
  ACTIVE: '#7F3F98', // KODE purple — in use at the venue
  FAILED: '#ED0C6E', // KODE pink — confirmed rejection
  RECONCILIATION_REQUIRED: '#B8860B', // deepened KODE yellow — needs a human
  REVOKED: '#3F3F46', // charcoal — terminal, deliberate
  LOST: '#C24A0F', // deepened KODE orange — terminal, unplanned
  QUARANTINED: '#7C2D12', // migration-only, rare in live UI
};

export const JOB_STATUS_COLOR = {
  QUEUED: '#0072BC',
  IN_PROGRESS: '#7F3F98',
  COMPLETED: '#7A9926',
  COMPLETED_WITH_ERRORS: '#B8860B',
  FAILED: '#ED0C6E',
};

export const ROLES = {
  OPERATOR: 'operator',
  ADMIN: 'admin',
};
