# KODE Guest Bracelet System — Operator Frontend

A frontend for security employees at KODE Sports Club to issue and track
guest bracelets. Built against `KODE-TECH-0001 v2.0` (Guest Bracelet System
Architecture) as the source of truth for statuses, limits, and API shape.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL. Sign in with one of the demo accounts:

| Role     | Email                | Password      |
|----------|-----------------------|---------------|
| Operator | operator@kodesc.com   | operator123   |
| Admin    | admin@kodesc.com      | admin123      |

Only an admin can revoke a bracelet (`PATCH .../status → REVOKED`), matching
§6.4 of the architecture doc — try it with both accounts to see the
difference.

## What's real vs. mocked

Everything runs against an **in-memory mock API** (`src/api/`) — no network
calls leave the browser. The mock:

- Seeds a realistic pool of guest bracelets in every documented status
  (`PENDING`, `ISSUED`, `ACTIVE`, `REVOKED`, `LOST`, `FAILED`,
  `RECONCILIATION_REQUIRED`).
- Simulates the job pipeline described in §5.3/§6.7/§7.2: creating a job
  claims guests, "dispatches" after ~1.2s, then resolves each guest to
  `ISSUED` / `FAILED` / `RECONCILIATION_REQUIRED` on a staggered timer —
  mirroring the real SUCCESS / CONFIRMED_FAILURE / UNKNOWN outcome
  classification from PayMob callbacks.
- Occasionally simulates a dispatch failure (job → `FAILED`, guests
  untouched) so the retry-dispatch flow is reachable without waiting.
- Applies a small random chance of a transient network error on writes
  (create/retry/reconcile/status-change), so the error banners are real.

## Connecting to the real backend

Every page and component calls into `src/api/authApi.js`,
`src/api/jobsApi.js`, and `src/api/braceletsApi.js` — never into
`mockData.js` directly. Swapping to the real backend means rewriting the
bodies of those three files to call the documented endpoints
(`/api/v1/auth/login`, `/api/v1/jobs`, `/api/v1/bracelets/...`) instead of
the in-memory store; no page or component needs to change. Each mock
function has a comment pointing at the real endpoint it stands in for.

One rule from the product brief has no backend endpoint yet: the
per-operator lifetime allowance of 50 bracelets (`getAllowance` in
`jobsApi.js`). It's tracked against `operator.braceletsCreated` in the mock
and is ready to be pointed at a real `operator.braceletAllowance`-style
field once one exists.

The signup page is not a real KODE-TECH-0001 endpoint either — the doc
assumes a small, pre-provisioned Operator table. It's built as a "request
access" flow (`authApi.requestSignup`) that an admin would approve, since
the product brief asked for the UI regardless.

## Project structure

```
src/
  api/            mock API layer (see above) — the seam for backend integration
  components/
    layout/       Navbar, AppShell
    ui/           Button, Field, Modal, StatusBadge, ProtectedRoute, etc.
    bracelets/    BraceletTable, BraceletFilters
    jobs/         JobTable, JobProgress
  context/        AuthContext (session/JWT), ToastContext
  hooks/          usePolling (§6.6 polling strategy)
  i18n/           en.js / ar.js dictionaries + LocaleContext (RTL switching)
  pages/          one file per route
  styles/         variables.css (design tokens) + index.css (global styles)
  utils/          constants.js (status enums/colors), validators, formatters
```

## Notes on the design

- Colors reuse KODE's brand palette as the bracelet status vocabulary
  (blue = queued, lime = issued, purple = active, pink = failed, amber =
  needs reconciliation) rather than as decoration — see `STATUS_COLOR` in
  `src/utils/constants.js`.
- RTL is implemented with CSS logical properties (`margin-inline-*`,
  `border-inline-start`, `inset-inline-*`, `text-align: start`) rather than
  a mirrored stylesheet, so `<html dir="rtl">` is a true layout mirror, not
  a translated skin.
- No sidebar, no card-shadow kit — a flat, single-column operational flow
  with one obvious primary action, per the brief.
