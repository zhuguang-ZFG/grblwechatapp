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
  - template CRUD and apply
  - machine/material profile management
  - admin dashboard stats
  - canvas editor live preview (text + image + crop)
  - P2 editing fields (char spacing, stroke, block width)
  - preview comparison (version diff)
  - search across projects and templates
  - project export/import
  - image upload pipeline
  - image processor presets
  - device gateway dispatch (simulation mode)

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

## 4.10 Template management flow

Goal:

- prove template CRUD and apply-from-template work end to end

Steps:

1. open editor for a project
2. tap "保存为模板"
3. enter name, description, category
4. confirm save
5. navigate to templates page
6. verify new template appears in list with correct category
7. tap edit on a user-created template, change name, confirm
8. delete the template
9. tap apply on a system template

Expected:

- save template creates a new entry in the template list
- edit updates the template name and description
- delete removes it with confirmation
- apply creates a new project from the template and routes to editor

## 4.11 Profile management (machine/material)

Goal:

- verify machine and material profile management pages

Steps:

1. open profiles page
2. toggle between machine profiles and material profiles tabs
3. view system profiles
4. create a new machine profile with name and parameters
5. create a new material profile
6. delete a user-created profile

Expected:

- system profiles render read-only (no delete)
- user-created profiles appear in the list
- delete with confirmation removes user profiles

## 4.12 Admin dashboard view

Goal:

- verify admin stats page renders aggregated data

Steps:

1. open workspace
2. tap "管理面板" or navigate to admin page
3. inspect stats cards
4. inspect job status breakdown

Expected:

- project/device/job counts render as numeric cards
- job status grid shows counts per status
- device list with online status renders
- recent jobs with status filter buttons work

## 4.13 Canvas live preview in editor

Goal:

- verify the editor canvas preview renders and updates live

Steps:

1. open a text project in editor
2. verify canvas shows work area with grid and dimension labels
3. type text in the content field
4. verify canvas updates with rendered text (debounced)
5. change font size, line gap, alignment
6. verify canvas reflects changes
7. toggle preview collapse/expand

Expected:

- canvas renders work area outline with mm dimension labels
- text content appears on canvas
- font size / alignment changes update the preview
- preview toggle hides/shows canvas

## 4.14 P2 editing fields

Goal:

- verify extended editing fields render and persist

Steps:

1. open text project in editor
2. locate 字距(px) / 描边(px) / 文本块宽(mm) fields
3. adjust each field
4. verify canvas updates accordingly

Expected:

- char spacing spreads characters on canvas
- stroke width adds outline to text
- block width wraps text at the specified width

## 4.15 Image upload and crop

Goal:

- verify image upload and crop bounds editing

Steps:

1. create or open an image project
2. tap "选择图片" or "使用示例图片"
3. verify canvas switches to image mode
4. enter crop bounds (X, Y, width, height)
5. verify crop overlay renders on canvas with dim area and green dashed border
6. tap "清除裁剪"

Expected:

- image mode shows image placeholder on canvas
- crop overlay renders outside-crop dimming
- clear crop removes overlay

## 4.16 Preview comparison

Goal:

- verify preview page shows version diff when multiple previews exist

Steps:

1. generate a preview for a project
2. modify project and generate another preview
3. open the second preview

Expected:

- preview page shows "版本对比" section
- metric deltas display with red (increase) / green (decrease) indicators

## 4.17 Search flow

Goal:

- verify search across projects and templates

Steps:

1. open workspace
2. tap search button
3. enter a project name keyword
4. inspect results
5. tap a project result

Expected:

- search returns matching projects and templates
- tapping a project result navigates to editor
- empty query returns empty results

## 4.18 Project export/import flow

Goal:

- verify project export from editor and import from project list

Steps:

1. open a project in editor
2. tap "导出项目"
3. verify toast confirmation (data saved to clipboard or file)
4. go to project list page
5. tap "导入" button

Expected:

- export produces project JSON and shows success toast
- data is copied to clipboard for external use

## 4.19 Task dispatch flow

Goal:

- verify job dispatch from task detail page

Steps:

1. open a task detail for a job in "queued" state
2. if dispatch button is visible, tap it
3. verify status transitions through dispatching/running

Expected:

- dispatch calls backend and transitions job state
- UI reflects current dispatch mode (simulation/real)

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

### Templates

- template list loads system + user templates
- create template overlay saves correctly
- edit and delete user templates work
- apply template creates a new project

### Profiles (machine/material)

- tab toggle between machine and material profiles
- system profiles display with read-only appearance
- create and delete user profiles work

### Admin

- stats cards render aggregated counts
- job status breakdown grid renders
- device list with online status renders
- recent jobs filter buttons work

### Search

- search input and trigger work
- project results navigate to editor
- template results display correctly

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
4. create project (text)
5. editor canvas preview + P2 fields
6. preview
7. submit task
8. task detail completion
9. task failure path
10. project archive/restore/delete
11. template save and apply
12. profile management
13. admin dashboard
14. search
15. project export/import
16. image project with crop

## 8. Evidence Capture Suggestion

When re-running this checklist in a future session, record:

- date
- git commit
- backend test result
- pages manually verified
- pages skipped
- any failing route or UI state

This keeps manual verification usable as a living baseline instead of a one-off memory.
