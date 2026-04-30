# KXApp Reference Baseline

**Purpose:** Freeze the key reference sources, agreed migration boundaries, implementation status, and verification evidence for the `kxapp -> wechatapp` work so future sessions can recover context quickly.

## 1. Primary Reference Sources

### 1.1 Reverse-engineered source reference

- Original reverse-engineered source path: `D:\GIT\kxapp`
- This source is the business-capability reference, not the direct implementation target.
- Migration principle: recover business flow and useful output paths, but do **not** clone Android-only runtime behavior.

### 1.2 Current implementation workspace

- Active implementation repository path: `D:\GIT\wechatapp`
- Remote repository: `https://github.com/zhuguang-ZFG/grblwechatapp.git`
- Current main branch has already been initialized and pushed.

### 1.3 Core planning documents

- Mini program migration scope:
  `docs/superpowers/plans/2026-05-01-kxapp-wechat-mini-program.md`
- API and data model baseline:
  `docs/superpowers/plans/2026-05-01-kxapp-api-and-data-model.md`
- Registration flow:
  `docs/superpowers/plans/2026-05-01-kxapp-registration-flow.md`
- Page map:
  `docs/superpowers/plans/2026-05-01-kxapp-miniprogram-pages.md`
- Field dictionary:
  `docs/superpowers/plans/2026-05-01-kxapp-p0-field-dictionary.md`
- Backend P0 design:
  `docs/superpowers/specs/2026-05-01-kxapp-backend-p0-design.md`
- Failure code contract:
  `docs/superpowers/specs/2026-05-01-kxapp-failure-codes-v0.md`
- Backend implementation plan:
  `docs/superpowers/plans/2026-05-01-kxapp-backend-p0-implementation.md`

## 2. Agreed Migration Direction

### 2.1 Product boundary

The WeChat mini program is intended to replace the usable business loop of the original Android app, not the Android runtime itself.

Mini program owns:

- login/session
- registration/profile completion
- device list and selection
- project editing metadata
- preview request/display
- job submission and history

Backend owns:

- persistence
- auth/session issuance
- preview lifecycle
- generation lifecycle
- job lifecycle/state machine
- placeholder artifact output in P0

Gateway/device side is deferred in P0 and currently simulated by backend fake workers.

### 2.2 P0 simplification rules

- single Fastify backend
- SQLite persistence
- local filesystem artifact storage
- in-process fake async workers
- no real gateway yet
- no real image/vector/GCode fidelity yet
- no attempt to recreate Android Bluetooth/socket control

## 3. Current Implementation Status

### 3.1 Mini program

Already implemented in the current repo:

- auth login page
- register page
- complete-profile page
- workspace page
- projects page
- editor page
- preview page
- tasks list/detail
- devices list/bind
- profile page

Important current frontend facts:

- `miniprogram/config/env.js` is now set to real backend mode:
  - `useMock: false`
  - `apiBaseUrl: "http://127.0.0.1:3100/api/v1"`
- session handling is centralized in `miniprogram/utils/session.js`
- auth request bearer token handling is in `miniprogram/utils/request.js`
- real adapter is in `miniprogram/services/api/real-adapter.js`
- device bind success now refreshes the device list and writes the newly bound device into local selected-device storage
- task detail page now exposes failure reason, retryability, retry suggestions, and guarded cancel/retry confirmation flows
- first-level page modules now use corrected relative imports for `services/api` and shared utils
- device selection from the device list now stores the full device object instead of only a raw device id
- request helper now surfaces backend `code`, `statusCode`, and payload on rejected API errors so page logic can branch on business errors
- workspace recent projects and task cards now prefer resolved project/device names instead of exposing raw ids directly
- task detail page now also resolves project/device names when auxiliary lookups are available
- core device/task/project WXML copy has been normalized into readable Chinese text to reduce terminal-encoding confusion during maintenance
- project list cards now include resolved device status alongside device name for quicker scan reading

### 3.2 Backend

Current backend path:

- `backend/`

Implemented backend modules:

- `auth`
- `devices`
- `projects`
- `previews`
- `generations`
- `jobs`
- `workers`

Current backend runtime shape:

- Fastify app
- SQLite DB bootstrap
- seeded devices
- local artifact store
- fake async workers for preview/generation/job progression
- worker runtime now clears pending timers on app shutdown so tests and app close do not leave async tails behind

### 3.3 Job state and failure baseline

This is now part of the implementation baseline:

- `/api/v1/jobs` is filtered by authenticated user ownership
- `/api/v1/jobs?status=...` supports status filtering for page-level task tabs
- fake worker tasks can emit structured failure payloads with `code`, `message`, and `retryable`
- current simulated failure code map includes:
  - `DEVICE_OFFLINE`
  - `DEVICE_BUSY`
  - `GATEWAY_TIMEOUT`
  - `PARAM_INVALID`
- job action APIs now return operation-level `409` business errors for invalid retry/cancel targets:
  - `invalid_retry_target`
  - `invalid_cancel_target`

### 3.4 Registration flow alignment

This was an important compatibility point and is now part of the baseline:

- frontend stores `pendingRegistration.tempAuthToken`
- frontend register request includes `tempAuthToken`
- backend stores temp auth session from `/auth/wechat-login`
- backend converts `tempAuthToken -> wechat_open_id` during `/auth/register`
- repeat login with the same WeChat code path should then resolve to existing user flow instead of new user flow

## 4. Current Verified Behavior

### 4.1 Backend automated tests

Verified command:

```bash
cd backend
npm test
```

Stable fallback command when Node ABI changed and `better-sqlite3` needs a rebuild:

```bash
cd backend
powershell -ExecutionPolicy Bypass -File ./scripts/test.ps1
```

Expected current result:

- 13 backend tests passing

Covered behaviors:

- health endpoint
- new-user login branch
- direct register branch
- auth guard
- temp auth token registration branch
- devices list
- device bind updates device ownership/bind state
- project create/detail
- preview/generation/job async flow
- jobs list status filtering
- structured job failure payload with retryable flag
- invalid retry target returns `409`
- invalid cancel target returns `409`

### 4.2 Frontend node-side tests

Verified commands:

```bash
node tests/request.test.js
node tests/real-adapter.test.js
node tests/session.test.js
node tests/auth-page-guard.test.js
node tests/mock-project-list.test.js
node tests/project-formatters.test.js
node tests/status-formatters.test.js
node tests/task-detail-page.test.js
node tests/device-page-selection.test.js
node tests/page-module-imports.test.js
node tests/failure-code-contract.test.js
node tests/failure-code-doc-sync.test.js
node tests/failure-contract-doc.test.js
node tests/workspace-page.test.js
node tests/tasks-page.test.js
node tests/task-detail-page.test.js
node tests/projects-page.test.js
```

Expected current result:

- all commands pass

### 4.3 Manual API closed loop

This loop has already been verified against the local backend:

1. register user
2. create project
3. create preview
4. query preview until ready
5. create generation
6. create job
7. query job until completed

Observed latest successful end-state:

- `previewStatus = ready`
- `generationStatus = ready`
- `jobStatus = completed`

## 5. Latest Known Repository State

Remote repository:

- `https://github.com/zhuguang-ZFG/grblwechatapp.git`

Important pushed commits:

- `384d33a`
  - backend async workflow APIs
- `0b3d784`
  - register flow aligned with temp auth token
- `9811bb3`
  - docs freeze kxapp migration reference baseline
- `6125cd5`
  - task failure handling, device bind sync, failure code spec, and verification refresh

If a future session needs a quick orientation point, treat `6125cd5` as the latest known integrated baseline.

## 6. Known Gaps Still Open

These are **not** yet solved and should remain explicit:

- page-by-page real-device UI walkthrough inside actual WeChat devtools has not been fully captured in docs
- image upload pipeline is still stubbed
- preview output is placeholder text/file output, not final visual rendering fidelity
- generation output is placeholder GCode/path output
- device gateway is not implemented as a separate runtime
- job retry/cancel behavior exists at API level, but full page-level interactive polish still needs more real-environment verification

## 7. How To Rehydrate Context In A New Session

Read in this order:

1. `docs/superpowers/plans/2026-05-01-kxapp-reference-baseline.md`
2. `docs/superpowers/plans/2026-05-01-kxapp-wechat-mini-program.md`
3. `docs/superpowers/plans/2026-05-01-kxapp-api-and-data-model.md`
4. `docs/superpowers/specs/2026-05-01-kxapp-backend-p0-design.md`
5. `docs/superpowers/plans/2026-05-01-kxapp-backend-p0-implementation.md`

Then inspect these code anchors:

- `miniprogram/services/api/real-adapter.js`
- `miniprogram/utils/request.js`
- `miniprogram/utils/session.js`
- `backend/src/app.js`
- `backend/src/modules/auth/service.js`
- `backend/src/modules/projects/service.js`
- `backend/src/modules/previews/service.js`
- `backend/src/modules/generations/service.js`
- `backend/src/modules/jobs/service.js`

## 8. Single-Sentence Memory Anchor

The current project is a WeChat mini program plus local Fastify/SQLite backend that already runs the P0 loop for register/login, project creation, preview, generation, and job completion using fake async workers, with the reference source anchored in `D:\GIT\kxapp` and the implementation anchored in `D:\GIT\wechatapp`.
