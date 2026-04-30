# KXApp WeChat Mini Program Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the recoverable business capabilities of `kxapp` as a WeChat mini program plus backend services, while avoiding Android-only implementation paths.

**Architecture:** The mini program handles account flows, lightweight editing, parameter input, preview entry points, device/task views, and result display. Backend services own image processing, SVG/path conversion, GCode generation, preview rendering, and task orchestration. Device connectivity remains in a gateway/device-side service rather than the mini program.

**Tech Stack:** WeChat Mini Program, HTTP API, object storage, task queue, device gateway service, relational database, server-side image/vector/GCode processing

---

## Reference Baseline

For future sessions, treat `docs/superpowers/plans/2026-05-01-kxapp-reference-baseline.md` as the frozen context anchor for:

- source repo reference (`D:\GIT\kxapp`)
- target repo reference (`D:\GIT\wechatapp`)
- remote repo
- current implementation status
- latest verified test and API loop evidence

## File Structure

- Create: `docs/superpowers/plans/2026-05-01-kxapp-wechat-mini-program.md`
- Create later in implementation repo:
  - `miniprogram/pages/login/*`
  - `miniprogram/pages/workspace/*`
  - `miniprogram/pages/preview/*`
  - `miniprogram/pages/tasks/*`
  - `miniprogram/pages/devices/*`
  - `miniprogram/services/api/*`
  - `backend/modules/auth/*`
  - `backend/modules/projects/*`
  - `backend/modules/render/*`
  - `backend/modules/gcode/*`
  - `backend/modules/tasks/*`
  - `gateway/modules/device-session/*`

## Phase Summary

- **P0:** Validate product path with the smallest closed loop
- **P1:** Make the mini program useful for repeat production work
- **P2:** Add stronger editing, preview, and device management depth

## P0: MVP Closed Loop

**Target outcome**

User can register or log in, bind or select a device, input text or upload an image, configure parameters, request a server-side preview, submit a job, and watch job progress.

**Scope**

- Mini program registration/login
- Device list and binding status
- Project create/edit basics
- Text input and image upload entry
- Parameter form
- Preview request/result page
- Job submission
- Task status list/detail

**What stays out**

- Font editor
- Bluetooth direct connect
- Local socket control
- Full canvas editor
- Full native-grade simulation

**Delivery steps**

- [ ] Define API contract for `auth`, `devices`, `projects`, `preview`, `jobs`
- [ ] Define one canonical intermediate job model:
  - project id
  - source type (`text` / `image`)
  - content payload
  - machine profile
  - material/process params
  - generated preview asset refs
  - generated GCode asset ref
- [ ] Implement mini program pages:
  - register/login
  - home/workspace
  - parameter form
  - preview
  - task list
  - task detail
- [ ] Implement backend endpoints:
  - `POST /auth/wechat-login`
  - `POST /auth/register`
  - `POST /auth/complete-profile`
  - `GET /devices`
  - `POST /projects`
  - `POST /preview`
  - `POST /jobs`
  - `GET /jobs/:id`
  - `GET /jobs`
- [ ] Implement server-side preview pipeline:
  - text -> path -> preview image
  - image -> preprocess -> path -> preview image
- [ ] Implement server-side GCode generation pipeline
- [ ] Implement task state machine:
  - `draft`
  - `preview_ready`
  - `queued`
  - `running`
  - `failed`
  - `completed`
- [ ] Implement gateway/device-side polling or push channel for machine state sync
- [ ] Verify one end-to-end job from mini program submission to machine execution result

**Acceptance criteria**

- A new user can complete the full flow without installing Android APK
- A first-time user can complete registration before entering the main workflow
- Preview is generated on the server, not in mini program local heavy logic
- Jobs can be queried after app restarts or device reconnects
- No direct mini program dependency on Bluetooth socket or JNI code

## P1: Practical Production Version

**Target outcome**

The product becomes good enough for repeated operational use, with reusable templates, better project management, and clearer machine coordination.

**Scope**

- Template library
- Preset machine/material profiles
- Historical projects and duplication
- Better job retry/failure messaging
- Operator-facing device status
- Admin/basic support tooling

**Delivery steps**

- [ ] Add template entities for text/image starter configurations
- [ ] Add machine profile and material profile management
- [ ] Add project history, duplicate, archive, delete
- [ ] Add preview comparison metadata:
  - estimated time
  - path length
  - machine bounds
  - warnings
- [ ] Add job retry path using existing generated assets where valid
- [ ] Add failure taxonomy:
  - preview generation failure
  - GCode generation failure
  - gateway dispatch failure
  - machine execution failure
- [ ] Add support/admin views for job inspection and device heartbeat
- [ ] Add storage lifecycle rules for previews, uploads, and generated GCode
- [ ] Verify the top 5 operational flows:
  - create from template
  - create from text
  - create from image
  - resubmit failed job
  - check job/device status on another phone

**Acceptance criteria**

- Repeat users can create jobs from templates faster than from scratch
- Failed jobs expose actionable reasons
- Operators can distinguish app issues from machine/offline issues

## P2: Enhanced Editing and Preview

**Target outcome**

The mini program offers noticeably better editing and preview fidelity without becoming a full Android clone.

**Scope**

- Lightweight canvas editing
- Richer text layout
- Better 2D preview interaction
- Optional advanced render service
- Safer device orchestration

**Delivery steps**

- [ ] Add lightweight canvas-based position/scale/rotation editing for generated elements
- [ ] Add richer text layout controls:
  - line spacing
  - alignment
  - letter spacing
  - block sizing
- [ ] Add simple region crop/mask tools for uploaded images
- [ ] Add server-side advanced render endpoint for higher fidelity path preview
- [ ] Add machine boundary checks and preflight validation before enqueue
- [ ] Add queue priority or scheduling windows if multi-device production requires it
- [ ] Evaluate whether a separate web console should take over advanced editing instead of extending mini program complexity

**Acceptance criteria**

- Editing improvements reduce dependence on the Android app for common jobs
- Preview fidelity is visibly improved for complex content
- Complexity remains bounded; no attempt to re-create full native editor behavior in mini program

## Capability Placement Matrix

**Mini program owns**

- login/session
- project metadata
- lightweight input and forms
- preview request/display
- job submission and history
- device list and state display

**Backend owns**

- image preprocessing
- vector/path generation
- SVG parsing
- GCode generation
- preview rasterization
- task orchestration
- asset persistence

**Gateway/device side owns**

- machine connection
- protocol translation
- real-time send/receive
- machine heartbeat
- error recovery and resume policy

## Risks and Controls

### Risk 1: Trying to clone the Android app too early

Control:

- Keep P0 limited to the job submission loop
- Treat native editor and local control as non-goals for MVP

### Risk 2: Output mismatch between server and original app

Control:

- Build a comparison set from representative `kxapp` jobs
- Compare preview image, path count, dimensions, and machine output tolerance

### Risk 3: Device connectivity becomes the hidden blocker

Control:

- Split device connectivity from mini program from day one
- Put gateway/device protocol verification ahead of fancy UI work

### Risk 4: Mini program performance degrades under heavy editing

Control:

- Keep heavy processing server-side
- Only add client-side canvas editing after P0 and P1 are stable

## Recommended Build Order

1. Backend auth, user model, and job APIs
2. Gateway/device connectivity abstraction
3. Mini program registration/login/workspace/task pages
4. Server preview generation
5. Server GCode generation
6. End-to-end submission and status loop
7. Templates/presets/history
8. Lightweight editing improvements

## Exit Criteria For Each Phase

### P0 exit

- One user can create, preview, submit, and observe a job successfully
- Core loop works without depending on Android-only runtime features

### P1 exit

- Repeated operational use is practical for real users
- Failure and retry flows are understandable

### P2 exit

- Common editing tasks no longer force users back to the Android app
- Advanced features still respect mini program limits
