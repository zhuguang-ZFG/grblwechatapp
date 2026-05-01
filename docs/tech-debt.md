# KXApp Migration Technical Debt

## Summary

This project is in a workable P0 state: the main user flow is available end to end, but the codebase still carries clear productionization and maintainability debt.

The items below are grouped by priority so they can be used as a practical cleanup roadmap.

## P0: Must Address Before Real Production Use

### 1. Session auth has no expiry, refresh, or revocation flow

- The backend uses database-backed session tokens rather than JWT.
- Current auth checks only confirm the token exists in the `sessions` table.
- There is no explicit TTL, refresh flow, device/session management, or logout invalidation strategy beyond record deletion.

Impact:
- Long-lived sessions increase account risk.
- Operational response to leaked tokens is weak.

### 2. SQLite file storage and local artifact storage are single-node oriented

- The backend uses `better-sqlite3` with a local database file.
- Generated assets are stored on local disk.
- This is fine for local development and P0 demos, but it is not a good fit for multi-instance deployment.

Impact:
- Scaling horizontally is difficult.
- Backup, restore, and failover are underdefined.
- Concurrent production writes will become a concern.

### 3. Preview and generation execution still relies on in-process timers

- Worker scheduling and parts of the generation pipeline use `setTimeout`.
- Execution state lives in process-local runtime structures.
- This is adequate for simulation and basic workflow closure, but not for robust job orchestration.

Impact:
- Reliability depends on one running process.
- Restarts can interrupt work in flight.
- Throughput and observability are limited.

### 4. Polling-heavy client flows will put pressure on the backend

- Preview and task-detail pages poll for status updates.
- This is straightforward for P0, but expensive as concurrency grows.

Impact:
- More active users means more repeated read traffic.
- Server load grows even when no meaningful state change happens.

### 5. The database has schema bootstrap, but no real migration system

- Tables are created through startup schema application.
- There is no formal migration history, rollback process, or deployment-safe upgrade path.

Impact:
- Future schema evolution is riskier.
- Repeatable production upgrades are not yet well controlled.

### 6. Basic security middleware is still missing

- No rate limiting is visible in the Fastify app bootstrap.
- No broader hardening layer is present for abuse control and edge protection.

Impact:
- Public-facing deployment would be too exposed.
- Abuse, brute force, and burst traffic handling are underprepared.

## P1: Should Be Cleaned Up Soon

### 1. Mini program state handling is fragmented

- Many pages manage their own loading, toast, and error behavior.
- Session, auth, and request failures do not appear to flow through one central UX policy.

Impact:
- Behavior becomes inconsistent across pages.
- Future changes require repetitive edits.

### 2. The mini program relies heavily on synchronous storage APIs

- `getStorageSync` and `setStorageSync` are used directly in session-related utilities.
- This keeps implementation simple, but it increases coupling between storage and UI behavior.

Impact:
- UI responsiveness may degrade as usage grows.
- State handling stays tightly bound to platform sync APIs.

### 3. Service construction is tightly coupled to the app container

- Most backend services are created with the entire `app` instance.
- This speeds up bootstrapping but weakens dependency boundaries.

Impact:
- Isolated testing is harder.
- Refactoring service internals becomes more expensive over time.

### 4. Repeated page-side data composition logic exists

- Device/project mapping, toast handling, auth checks, and page data loading patterns repeat across pages.

Impact:
- Small bugs get fixed in one place and missed in another.
- Maintenance cost grows faster than feature count.

### 5. Search and template features exist, but are still shallow

- Search is implemented, but it is a basic query path.
- Template CRUD and apply flows exist, but the feature set is still early-stage.

Impact:
- The features are usable, but not yet mature enough to call complete.

### 6. Backend tests rely on real timing delays

- Several workflow tests wait on `setTimeout`-based processing.

Impact:
- Test runs are slower.
- Timing-sensitive tests are usually more brittle.

## P2: Good Next-Layer Improvements

### 1. Add a proper job system and execution isolation

- Move preview/generation execution away from in-process timer orchestration.
- Introduce durable queueing and worker isolation.

### 2. Improve API and platform governance

- Add better environment configuration conventions.
- Add API documentation and clearer service contracts.
- Introduce versioning discipline where future breaking changes are likely.

### 3. Improve UX resilience

- Add debouncing for user-triggered search and submit flows.
- Add stronger form validation and clearer offline/error fallback handling.
- Centralize request-state behavior.

### 4. Improve production operations

- Add monitoring, alerting, structured health signals, and backup/restore procedures.

### 5. Improve large-data behavior

- Revisit pagination, list rendering behavior, and expensive synchronous generation paths if scale grows.

## Notes on Terminology

Some earlier summaries used wording that should be tightened:

- It is more accurate to say "session token without expiry/refresh/revocation" than "JWT without expiry checks".
- Search is implemented in a basic form; it is not absent.
- Templates have a working baseline flow; the issue is limited depth, not total lack of implementation.
- The current performance issue is better described as repeated aggregation and polling overhead than a clearly proven database N+1 pattern everywhere.

## Recommended Sequence

1. Harden auth/session lifecycle.
2. Replace timer-driven generation orchestration with a more durable execution model.
3. Introduce migration discipline and deployment-safe persistence strategy.
4. Add rate limiting and production safety middleware.
5. Unify mini program request/loading/error handling.
6. Reduce repeated page logic and timing-based tests.
