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
- WeChat DevTools checklist:
  `docs/superpowers/plans/2026-05-01-kxapp-wechat-devtools-checklist.md`
- WeChat DevTools run log:
  `docs/superpowers/plans/2026-05-01-kxapp-wechat-devtools-runlog.md`

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
- editor page (with canvas live preview)
- preview page (with version comparison)
- tasks list/detail
- devices list/bind
- profile page
- templates page (CRUD + apply)
- profiles page (machine/material tabs, create, delete)
- admin page (dashboard stats)
- search page

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
- device list now highlights the currently selected device and formats `lastSeenAt` into a readable timestamp label
- task list now supports failure-category filtering and exposes failure-category summary counts for failed jobs
- real adapter now includes project lifecycle actions for duplicate, archive, delete, export, and import
- template management UI supports create, edit, delete, and apply
- profile management UI supports machine/material tabs, create, and delete
- admin page fetches dashboard stats and renders job status breakdown
- search page queries projects and templates via `/api/v1/search`
- editor canvas preview renders live text/image with debounced updates
- editor supports P2 fields: char spacing, stroke width, block width
- editor supports image crop bounds with overlay rendering
- preview comparison shows delta between consecutive previews
- image upload pipeline reads file as base64 and sends to backend
- export creates project JSON and copies to clipboard
- import reads .json file via wx.chooseMessageFile

### 3.2 Backend

Current backend path:

- `backend/`

Implemented backend modules:

- `auth`
- `devices`
- `projects` (includes export/import)
- `previews` (includes comparison/delta)
- `generations`
- `jobs` (includes dispatch, retry/cancel guards)
- `profiles` (machine + material CRUD)
- `templates` (CRUD + apply)
- `gateway` (in-memory sessions, job dispatch, heartbeat, progress)
- `workers`

Current backend runtime shape:

- Fastify app
- SQLite DB bootstrap
- seeded devices, fonts, image processors, machine/material profiles, templates
- local artifact store with lifecycle cleanup (mtime-based eviction)
- fake async workers for preview/generation/job progression
- gateway service with in-memory session map, stale detection (30s interval), simulation fallback
- worker runtime clears pending timers on app shutdown
- gateway service clears interval on app close

### 3.3 Job state and failure baseline

This is now part of the implementation baseline:

- `/api/v1/jobs` is filtered by authenticated user ownership
- `/api/v1/jobs?status=...` supports status filtering for page-level task tabs
- fake worker tasks can emit structured failure payloads with `code`, `message`, `retryable`, and `category`
- current simulated failure code map includes:
  - `DEVICE_OFFLINE`
  - `DEVICE_BUSY`
  - `GATEWAY_TIMEOUT`
  - `PARAM_INVALID`
- task list supports failure-category filtering by:
  - `DEVICE`
  - `GATEWAY`
  - `PARAMETER`
  - `UNKNOWN`
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

### 3.5 Project lifecycle operations

This is now part of the implementation baseline:

- `POST /api/v1/projects/:id/duplicate`
- `POST /api/v1/projects/:id/archive`
- `DELETE /api/v1/projects/:id`
- mini program real adapter has matching methods:
  - `duplicateProject(projectId)`
  - `archiveProject(projectId)`
  - `deleteProject(projectId)`

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

- 15 backend tests passing

Covered behaviors:

- health endpoint
- new-user login branch
- direct register branch
- auth guard
- temp auth token registration branch
- devices list
- device bind updates device ownership/bind state
- project create/detail
- duplicate/archive/delete project lifecycle
- preview/generation/job async flow
- jobs list status filtering
- jobs list failure-category filtering and failure summary counts
- structured job failure payload with retryable flag
- invalid retry target returns `409`
- invalid cancel target returns `409`
- job endpoints reject cross-user access

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
node tests/tasks-page.test.js
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
- `d304be9`
  - failure categories, project lifecycle actions, and task filtering on `split/harden-errors-and-ci`

If a future session needs a quick orientation point, treat `d304be9` as the latest known integrated baseline from the feature branch before merge.

## 6. Known Gaps Still Open

These are **not** yet solved and should remain explicit:

- page-by-page real-device UI walkthrough inside actual WeChat devtools has not been fully captured in docs
- image upload pipeline is still stubbed in mock mode (real adapter uses wx.getFileSystemManager base64 read)
- preview output is placeholder text/file output, not final visual rendering fidelity
- generation output is placeholder GCode/path output  
- device gateway is in-memory only with simulation fallback — no real device runtime
- import/export uses clipboard and local file picker — no cloud sync yet

## 7. How To Rehydrate Context In A New Session

Read in this order:

1. `docs/superpowers/plans/2026-05-01-kxapp-reference-baseline.md`
2. `docs/superpowers/plans/2026-05-01-kxapp-wechat-mini-program.md`
3. `docs/superpowers/plans/2026-05-01-kxapp-api-and-data-model.md`
4. `docs/superpowers/specs/2026-05-01-kxapp-backend-p0-design.md`
5. `docs/superpowers/plans/2026-05-01-kxapp-backend-p0-implementation.md`
6. `docs/superpowers/plans/2026-05-01-kxapp-wechat-devtools-checklist.md`
7. `docs/superpowers/plans/2026-05-01-kxapp-wechat-devtools-runlog.md`

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
- `backend/src/modules/profiles/service.js`
- `backend/src/modules/templates/service.js`
- `backend/src/modules/gateway/service.js`

## 8. Single-Sentence Memory Anchor

The current project is a WeChat mini program plus local Fastify/SQLite backend that already runs the P0 loop for register/login, project creation, preview, generation, and job completion using fake async workers, with the reference source anchored in `D:\GIT\kxapp` and the implementation anchored in `D:\GIT\wechatapp`.
