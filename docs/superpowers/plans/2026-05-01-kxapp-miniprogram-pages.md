# KXApp Mini Program Page Inventory

**Purpose:** Define the first-pass mini program page structure, visible fields, and main button behaviors for the `kxapp` migration.

**Scope:** Prioritize P0 pages, with a few P1 extensions where they do not create ambiguity.

---

## 1. Navigation Overview

Recommended first-pass structure:

```text
Launch
  ->
Login Entry
  ->
Register / Complete Profile (if needed)
  ->
Main Tabs
  - Workspace
  - Tasks
  - Devices
  - My
```

Recommended route groups:

- auth
- workspace
- preview
- tasks
- devices
- profile

## 2. Page List

### P0 Required Pages

1. Login Entry Page
2. Registration Completion Page
3. Complete Profile Page
4. Workspace Page
5. Project Editor Page
6. Preview Page
7. Task List Page
8. Task Detail Page
9. Device List Page
10. Device Bind Page
11. My Page

### P1 Optional Pages

1. Template List Page
2. Project History Page
3. Material Preset Page
4. Machine Profile Detail Page

## 3. Auth Pages

## 3.1 Login Entry Page

**Route**

```text
/pages/auth/login/index
```

**Purpose**

- provide app entry
- initiate WeChat login
- show consent links

**Fields / Elements**

- app title
- one short supporting sentence
- primary button: `微信快捷登录`
- terms agreement hint
- links:
  - `用户协议`
  - `隐私政策`

**Buttons**

- `微信快捷登录`
  - action:
    1. call WeChat login
    2. call `POST /auth/wechat-login`
    3. route by `nextAction`

**Possible outcomes**

- `enter_app`
- `register`
- `complete_profile`

## 3.2 Registration Completion Page

**Route**

```text
/pages/auth/register/index
```

**Purpose**

- complete first-time user registration

**Fields**

- nickname
- mobile
- agree terms checkbox

**Validation**

- nickname required
- mobile required
- agree terms required

**Buttons**

- `完成并进入`
  - action:
    1. validate fields
    2. call `POST /auth/register`
    3. save token
    4. go to workspace

## 3.3 Complete Profile Page

**Route**

```text
/pages/auth/complete-profile/index
```

**Purpose**

- collect missing required fields for partially registered users

**Fields**

- nickname if missing
- mobile if missing
- companyName if product later requires it

**Buttons**

- `保存并进入`
  - action:
    1. validate visible fields
    2. call `POST /auth/complete-profile`
    3. route to workspace

## 4. Workspace Pages

## 4.1 Workspace Page

**Route**

```text
/pages/workspace/index
```

**Purpose**

- main production entry
- quick start for text or image job creation

**Sections**

- recent projects
- quick actions
- current selected device summary
- template shortcuts (P1)

**Buttons**

- `新建文字项目`
  - create draft project with `sourceType = text`
  - enter project editor

- `新建图片项目`
  - create draft project with `sourceType = image`
  - enter project editor

- `继续最近项目`
  - open selected project

- `选择设备`
  - go to device list

## 4.2 Project Editor Page

**Route**

```text
/pages/workspace/editor/index
```

**Purpose**

- edit project content and process parameters

**Common Fields**

- project name
- selected device
- machine profile
- material profile
- widthMm
- heightMm
- rotationDeg
- speed
- power
- passes

**Text Mode Fields**

- text content
- font selector
- align
- lineSpacing

**Image Mode Fields**

- upload image
- replace image
- threshold preset or processor preset selector

**Buttons**

- `保存`
  - call `PUT /projects/:id`

- `生成预览`
  - save draft if needed
  - call `POST /projects/:id/preview`
  - go to preview page

- `选择设备`
  - go to device list

**P0 Notes**

- no freeform heavy canvas editing
- no local path generation

## 5. Preview Page

## 5.1 Preview Page

**Route**

```text
/pages/preview/index
```

**Purpose**

- show generated preview result
- show warnings and estimated duration
- submit job

**Sections**

- preview image
- preview status
- metrics:
  - pathCount
  - estimatedDurationSec
  - widthMm
  - heightMm
- warnings

**Buttons**

- `刷新预览`
  - call `GET /previews/:id`

- `重新生成`
  - call `POST /projects/:id/preview`

- `提交任务`
  - if generation missing:
    1. call `POST /projects/:id/generate`
    2. wait for generation ready
  - then call `POST /jobs`
  - route to task detail

- `返回编辑`
  - back to project editor

## 6. Task Pages

## 6.1 Task List Page

**Route**

```text
/pages/tasks/index
```

**Purpose**

- list user jobs by status

**Sections**

- status filter tabs:
  - all
  - queued
  - running
  - failed
  - completed
- job cards

**Job Card Fields**

- project name
- device name
- status
- progress percent
- updatedAt

**Buttons**

- tap card
  - go to task detail

- `重试` on failed jobs
  - call `POST /jobs/:id/retry`

## 6.2 Task Detail Page

**Route**

```text
/pages/tasks/detail/index
```

**Purpose**

- inspect one job
- view progress and failure reason

**Fields**

- project name
- device name
- status
- progress bar
- current step
- createdAt
- updatedAt
- failure message if any
- timeline list

**Buttons**

- `刷新状态`
  - call `GET /jobs/:id`

- `取消任务`
  - call `POST /jobs/:id/cancel`

- `重试任务`
  - only visible when retryable and failed
  - call `POST /jobs/:id/retry`

- `查看原项目`
  - open project detail/editor

**Implemented P0 behavior notes**

- failed jobs should show backend `failure.code` and `failure.message`
- when backend returns a retryable failure, page should show a retry CTA and a short retry suggestion
- cancel and retry actions should use confirmation modal to avoid accidental taps

## 7. Device Pages

## 7.1 Device List Page

**Route**

```text
/pages/devices/index
```

**Purpose**

- show bound devices
- select active device for project creation

**Fields**

- device name
- model
- onlineStatus
- lastSeenAt
- capability tags

**Buttons**

- tap device
  - select device and return
  - or open device detail later

- `绑定新设备`
  - go to bind page

## 7.2 Device Bind Page

**Route**

```text
/pages/devices/bind/index
```

**Purpose**

- bind device via code or pairing token

**Fields**

- bindingCode

**Buttons**

- `确认绑定`
  - call `POST /devices/bind`
  - on success:
    - go back to device list

**Implemented P0 behavior notes**

- after bind success, refresh device list and write the newly bound device into selected-device storage when the returned `deviceId` is found

## 8. Profile Pages

## 8.1 My Page

**Route**

```text
/pages/profile/index
```

**Purpose**

- show account summary
- expose profile and project/history entry points

**Fields**

- avatar
- nickname
- mobile
- account status

**Buttons**

- `编辑资料`
- `我的项目`
- `帮助中心`
- `退出登录`

## 9. Tab Bar Recommendation

Recommended tabs:

1. `工作台`
2. `任务`
3. `设备`
4. `我的`

Why:

- keeps the main operational surfaces visible
- avoids burying device and task state too deep

## 10. P0 Field Checklist By Page

### Login Entry

- no user input except login trigger

### Registration Completion

- nickname
- mobile
- agreeTerms

### Project Editor

- projectName
- sourceType
- deviceId
- machineProfileId
- materialProfileId
- text or image input
- widthMm
- heightMm
- speed
- power
- passes

### Preview

- preview image
- estimatedDurationSec
- warnings

### Task Detail

- status
- progress
- failure

### Device Bind

- bindingCode

## 11. Page Behavior Rules

1. Project editor must auto-save draft on major transitions where practical.
2. Preview page must never pretend preview is final while status is still processing.
3. Task pages must always show last refresh time or updated time.
4. Device selection should be explicit; do not silently switch devices without user action.
5. Registration and complete-profile pages should only show the minimum required fields.

## 12. Recommended Next Step

Use this page inventory to create:

1. mini program route map
2. wireframe draft
3. backend mock API response files
