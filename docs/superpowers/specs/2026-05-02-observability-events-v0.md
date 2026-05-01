# KXApp Observability Events v0

**Purpose:** Define a stable structured-log event dictionary for backend gateway/job execution so runtime diagnosis can rely on consistent `event`, `component`, `level`, and core identifiers.

## Scope

This v0 covers backend runtime structured logs emitted by:

- `backend/src/modules/jobs/service.js`
- `backend/src/modules/gateway/routes.js`
- `backend/src/modules/gateway/service.js`
- `backend/src/app.js` (`app.logEvent` helper)

This v0 does not yet cover:

- request-level access logs
- frontend telemetry
- external log shipping format adapters

## Canonical Log Entry Shape

```json
{
  "at": "2026-05-02T02:00:00.000Z",
  "level": "info",
  "component": "gateway",
  "event": "gateway_job_enqueued",
  "traceId": "trace_...",
  "...": "event-specific fields"
}
```

Field semantics:

- `at`: ISO timestamp
- `level`: `info` or `warn` in current v0
- `component`: logical backend module (`jobs`, `gateway`, `app`)
- `event`: stable machine-readable event name
- `traceId`: cross-step correlation id (when available)

## Event Dictionary (v0)

| Event | Component | Level | Trigger | Required key fields |
| --- | --- | --- | --- | --- |
| `job_created` | `jobs` | `info` | New job accepted and persisted | `traceId`, `jobId`, `userId`, `projectId`, `generationId`, `deviceId`, `priority` |
| `job_status_updated` | `jobs` | `info` | Service updates status transition | `traceId`, `jobId`, `fromStatus`, `toStatus` |
| `gateway_auth_rejected` | `gateway` | `warn` | Missing/invalid device auth | `reason`, `deviceId` |
| `gateway_heartbeat` | `gateway` | `info` | Device heartbeat accepted | `deviceId`, `hasPendingJob`, `pendingJobId` |
| `gateway_poll_pending` | `gateway` | `info` | Device polls pending job queue | `deviceId`, `hasPendingJob`, `pendingJobId` |
| `gateway_progress_reported` | `gateway` | `info` | Device submits progress payload | `deviceId`, `jobId`, `status`, `percent`, `currentStep` |
| `gateway_job_enqueued` | `gateway` | `info` | Job queued to gateway pending queue | `traceId`, `jobId`, `deviceId`, `queueSize` |
| `gateway_job_leased` | `gateway` | `info` | Pending job leased to polling device | `deviceId`, `jobId`, `leaseMs` |
| `gateway_dispatch_lease_expired` | `gateway` | `warn` | Lease expired before ACK/progress | `deviceId`, `jobId`, `leaseExpiresAt` |
| `gateway_job_acknowledged` | `gateway` | `info` | ACK/progress confirms job consumption | `deviceId`, `jobId` |
| `gateway_job_progress_applied` | `gateway` | `info` | Progress accepted and written to DB | `traceId`, `deviceId`, `jobId`, `status`, `percent`, `currentStep` |
| `gateway_job_dispatched_simulation` | `gateway` | `info` | Fallback simulation dispatch path | `traceId`, `jobId`, `deviceId` |
| `gateway_device_offline` | `gateway` | `warn` | Device marked offline by stale check | `deviceId` |

## Correlation Rules

1. Every newly created job gets a `traceId`.
2. Client can pass `x-trace-id` when creating job; server reuses it.
3. Gateway and job events should include `traceId` whenever related job row is available.
4. `jobId` is required for all job-execution-path events except auth/heartbeat-only events.

## Evolution Rules

When adding new events:

1. use stable snake-case event names
2. assign `component` and `level` explicitly
3. include at least one correlation key (`traceId` or `jobId`)
4. update this document in the same PR
5. avoid removing or renaming existing event names in v0

## Known Gaps

- no standardized request-id middleware yet
- no persistence/export pipeline for logs yet
- no event sampling policy yet
