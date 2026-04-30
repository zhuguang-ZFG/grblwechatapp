# KXApp WeChat DevTools Checklist

**Purpose:** Freeze a repeatable WeChat DevTools manual verification checklist for the current `kxapp -> wechatapp` mini program so future sessions can quickly re-run the real UI flow without rediscovering setup details.

## 1. Scope

This checklist is for the current local P0 implementation in:

- source reference: `D:\GIT\kxapp`
- implementation repo: `D:\GIT\wechatapp`

It is meant to verify the mini program against the local Fastify backend, not against a production gateway or a real machine runtime.

## 2. Current Local Assumptions

Before using this checklist, assume the following baseline:

- mini program env is in real-backend mode
  - `miniprogram/config/env.js`
  - `useMock: false`
  - `apiBaseUrl: "http://127.0.0.1:3100/api/v1"`
- backend runs locally from:
  - `backend/`
- current backend is Fastify + SQLite + local storage + fake async workers
- current project/device/task/project pages already include:
  - registration flow
  - device selection and bind refresh
  - preview/generation/job closed loop
  - task failure classification
  - project duplicate/archive/restore/delete
  - archived project read-only gate in project list

## 3. Pre-Flight Setup

### 3.1 Quick preflight script

From `D:\GIT\wechatapp`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\wechat-devtools-preflight.ps1 -DryRun
```

What it gives you:

- current git commit
- backend test script path
- backend startup command
- checklist path
- run log path

If you want a fresh manual smoke entry appended to the run log before opening DevTools:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\wechat-devtools-new-runlog-entry.ps1 -Operator "your name"
```

For a real preflight run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\wechat-devtools-preflight.ps1
```

For a one-command smoke preparation pass that appends a fresh run log template and then runs backend checks:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\wechat-devtools-smoke-bootstrap.ps1 -Operator "your name"
```

Add `-StartBackend` if you also want it to launch `node src/server.js` in the background after tests pass.

If you started backend through the smoke bootstrap helper and want to stop that background process cleanly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\wechat-devtools-stop-backend.ps1
```

### 3.2 Backend startup

From `D:\GIT\wechatapp\backend`:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/test.ps1
node src/server.js
```

Expected:

- backend tests pass
- server listens on `http://127.0.0.1:3100`

### 3.3 WeChat DevTools target

Open the mini program project from:

```text
D:\GIT\wechatapp\miniprogram
```

Recommended checks in DevTools:

- local compile succeeds
- no broken page import errors
- network panel shows requests going to `127.0.0.1:3100`

### 3.4 Clean account state

For the clearest manual loop, start from one of these:

1. new mock WeChat identity for register flow validation
2. existing identity already registered for returning-user flow

If local state looks stale, clear mini program storage in DevTools before retrying.

## 4. Core Manual Flows

## 4.1 First-time registration flow

Goal:

- prove register entry still works from the mini program UI

Steps:

1. open login page
2. trigger WeChat login
3. confirm app routes to registration page when backend returns `nextAction = register`
4. fill:
   - nickname
   - mobile
   - agree terms
5. submit registration

Expected:

- token is stored
- app enters main workflow
- no blank page or redirect loop

## 4.2 Returning user login flow

Goal:

- prove already-registered users enter the app without re-registering

Steps:

1. open login page
2. trigger WeChat login for an already-registered identity

Expected:

- backend returns `enter_app`
- app routes directly into workspace

## 4.3 Device list and selection flow

Goal:

- prove device list, selection state, and timestamp formatting are visible

Steps:

1. open device list tab
2. inspect device cards
3. select a device
4. leave and return to device list

Expected:

- selected device is visually highlighted
- selected state persists
- `lastSeenAt` is readable
- online/offline labels remain stable

## 4.4 Device bind flow

Goal:

- prove bind updates the device list and selected-device storage

Steps:

1. open device bind page
2. enter a binding code
3. confirm bind
4. return to device list

Expected:

- new or updated device appears in list
- bound device is selected when returned `deviceId` matches an item
- no stale list until manual refresh

## 4.5 Project creation and editor entry

Goal:

- prove both text and image project entry points still route correctly

Steps:

1. open workspace or project list
2. create a text project
3. confirm editor opens
4. return and create an image project
5. confirm editor opens

Expected:

- project records are created
- editor route receives project id
- selected device label resolves when available

## 4.6 Project list lifecycle flow

Goal:

- verify duplicate/archive/restore/delete actions from the project list UI

Steps:

1. open project list
2. duplicate an active project
3. archive an active project
4. switch filter to `已归档`
5. verify archived project appears there
6. tap archived card body
7. restore archived project from `更多操作`
8. optionally delete a project with confirm

Expected:

- duplicate creates a new editable project
- archived project disappears from active filters
- archived project appears only under `已归档`
- tapping archived card does not enter editor directly
- archived card shows read-only hint
- restore moves project back to active filters
- delete requires confirmation

## 4.7 Preview and generation flow

Goal:

- prove editor to preview to generation still works with local backend

Steps:

1. open a text project in editor
2. adjust basic fields if needed
3. generate preview
4. wait or refresh until preview is ready
5. submit task, allowing generation to run if needed

Expected:

- preview page loads
- preview status transitions to ready
- metrics and warnings render when returned
- submit task creates a job and routes to task detail

## 4.8 Task detail and status flow

Goal:

- prove task detail refreshes status from queued to running to completed

Steps:

1. land on task detail after submission
2. refresh if needed
3. inspect timeline and progress

Expected:

- project name and device name resolve when lookups succeed
- progress and current step render
- timeline includes state transitions
- final state reaches `completed` in the fake-worker happy path

## 4.9 Task failure and retry flow

Goal:

- verify failure classification and retry/cancel guards in UI

Recommended setup:

- use a backend-supported simulated failure code such as:
  - `DEVICE_OFFLINE`
  - `PARAM_INVALID`

Checks:

1. failed task appears in task list
2. task list shows failure category label
3. failed summary counts update by category
4. open task detail
5. inspect:
   - `failure.code`
   - failure message
   - failure category label
   - retry suggestion
6. test retry/cancel behavior

Expected:

- retryable failures show retry CTA
- non-retryable failures show retry hint instead
- invalid retry/cancel targets surface user-facing toast copy

## 5. Page-by-Page Quick Acceptance Grid

### Auth

- login page can start WeChat login
- registration page validates required fields
- complete-profile page only shows missing fields

### Workspace

- recent projects show resolved names where possible
- selected device summary is readable
- project creation buttons route correctly

### Projects

- active and archived filters separate correctly
- lifecycle actions work
- archived cards are read-only until restored

### Preview

- preview status is truthful
- submit task only follows a valid ready path

### Tasks

- filters work
- failure categories work
- retry/cancel confirmations work

### Devices

- list reflects bind + selection state
- selected device remains visible

### Profile

- user summary loads from backend

## 6. Common Failure Clues

If DevTools verification breaks, inspect these first:

- request base URL mismatch in `miniprogram/config/env.js`
- backend not running on port `3100`
- stale mini program storage causing wrong auth/session state
- broken relative imports in page modules
- backend sqlite file or worker state left from an earlier run

## 7. Recommended Manual Order

For the fastest real-world smoke test, use this order:

1. backend startup
2. login/register
3. device selection/bind
4. create project
5. preview
6. submit task
7. task detail completion
8. task failure path
9. project archive/restore/delete

## 8. Evidence Capture Suggestion

When re-running this checklist in a future session, record:

- date
- git commit
- backend test result
- pages manually verified
- pages skipped
- any failing route or UI state

This keeps manual verification usable as a living baseline instead of a one-off memory.
