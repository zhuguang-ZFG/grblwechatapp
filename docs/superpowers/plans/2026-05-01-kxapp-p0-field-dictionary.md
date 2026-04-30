# KXApp P0 Page Field Dictionary And API Mapping

**Purpose:** Provide a page-by-page field dictionary for the P0 mini program scope and map every visible field or action to its backend API source.

**Scope:** P0 only.

---

## 1. Usage Rules

1. Every page field should have one clear source of truth.
2. Display fields should map to one API response field whenever possible.
3. Editable fields should map to one request field whenever possible.
4. Derived UI text is allowed, but its source fields must be explicit.

## 2. API Short Names

For easier reading below:

- `AUTH_LOGIN` = `POST /auth/wechat-login`
- `AUTH_REGISTER` = `POST /auth/register`
- `AUTH_COMPLETE_PROFILE` = `POST /auth/complete-profile`
- `AUTH_ME` = `GET /auth/me`
- `DEVICE_LIST` = `GET /devices`
- `DEVICE_BIND` = `POST /devices/bind`
- `PROJECT_CREATE` = `POST /projects`
- `PROJECT_DETAIL` = `GET /projects/:id`
- `PROJECT_UPDATE` = `PUT /projects/:id`
- `PREVIEW_CREATE` = `POST /projects/:id/preview`
- `PREVIEW_DETAIL` = `GET /previews/:id`
- `GEN_CREATE` = `POST /projects/:id/generate`
- `GEN_DETAIL` = `GET /generations/:id`
- `JOB_CREATE` = `POST /jobs`
- `JOB_LIST` = `GET /jobs`
- `JOB_DETAIL` = `GET /jobs/:id`
- `JOB_CANCEL` = `POST /jobs/:id/cancel`
- `JOB_RETRY` = `POST /jobs/:id/retry`
- `ASSET_UPLOAD_POLICY` = `POST /assets/upload-policy`

## 3. Login Entry Page

**Route**

`/pages/auth/login/index`

### Display Fields

| UI Field | Type | Source |
|---|---|---|
| appTitle | static text | local config |
| introText | static text | local config |
| termsLink | static link | local route/url |
| privacyLink | static link | local route/url |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| wechatQuickLogin | `AUTH_LOGIN` | `code`, `profile.nickname`, `profile.avatarUrl` | route by `nextAction` |

### Response Mapping

| Response Field | UI Meaning |
|---|---|
| `isNewUser` | whether to enter registration |
| `token` | save login state |
| `user.profileStatus` | whether to enter app or complete profile |
| `nextAction` | route control |

## 4. Registration Completion Page

**Route**

`/pages/auth/register/index`

### Editable Fields

| UI Field | Type | Required | Request Field |
|---|---|---|---|
| nickname | string | yes | `nickname` |
| mobile | string | yes | `mobile` |
| agreeTerms | boolean | yes | `agreeTerms` |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| submitRegistration | `AUTH_REGISTER` | `nickname`, `mobile`, `agreeTerms` | save `token`, enter app |

### Response Mapping

| Response Field | UI Meaning |
|---|---|
| `token` | save login state |
| `user.id` | current account |
| `user.profileStatus` | should become `completed` |
| `nextAction` | should be `enter_app` |

## 5. Complete Profile Page

**Route**

`/pages/auth/complete-profile/index`

### Editable Fields

| UI Field | Type | Required | Request Field |
|---|---|---|---|
| nickname | string | conditional | `nickname` |
| mobile | string | conditional | `mobile` |
| companyName | string | no | `companyName` |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| submitCompleteProfile | `AUTH_COMPLETE_PROFILE` | visible form fields | enter app |

## 6. Workspace Page

**Route**

`/pages/workspace/index`

### Display Fields

| UI Field | Type | Source |
|---|---|---|
| currentDeviceName | string | selected item from `DEVICE_LIST.items[].name` |
| currentDeviceStatus | enum text | selected item from `DEVICE_LIST.items[].onlineStatus` |
| recentProjects | list | later from project list API; for P0 can be local recent ids + `PROJECT_DETAIL` |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| createTextProject | `PROJECT_CREATE` | `name`, `sourceType=text`, default device/profile/params | open editor |
| createImageProject | `PROJECT_CREATE` | `name`, `sourceType=image`, default device/profile/params | open editor |
| openProject | `PROJECT_DETAIL` | project id in route | open editor |
| chooseDevice | `DEVICE_LIST` | none | open device list |

## 7. Project Editor Page

**Route**

`/pages/workspace/editor/index`

### Display Fields

| UI Field | Type | Source |
|---|---|---|
| projectId | string | route param / `PROJECT_DETAIL.id` |
| projectName | string | `PROJECT_DETAIL.name` |
| sourceType | enum | `PROJECT_DETAIL.sourceType` |
| selectedDeviceId | string | `PROJECT_DETAIL.selectedDeviceId` |
| machineProfileId | string | `PROJECT_DETAIL.machineProfileId` |
| materialProfileId | string | `PROJECT_DETAIL.materialProfileId` |
| textValue | string | `PROJECT_DETAIL.content.text` |
| imageAssetId | string/null | `PROJECT_DETAIL.content.imageAssetId` |
| widthMm | number | `PROJECT_DETAIL.layout.widthMm` |
| heightMm | number | `PROJECT_DETAIL.layout.heightMm` |
| rotationDeg | number | `PROJECT_DETAIL.layout.rotationDeg` |
| align | enum | `PROJECT_DETAIL.layout.align` |
| speed | number | `PROJECT_DETAIL.processParams.speed` |
| power | number | `PROJECT_DETAIL.processParams.power` |
| passes | number | `PROJECT_DETAIL.processParams.passes` |
| lineSpacing | number | `PROJECT_DETAIL.processParams.lineSpacing` |

### Editable Fields

| UI Field | Request Field |
|---|---|
| projectName | `name` |
| selectedDeviceId | `selectedDeviceId` |
| machineProfileId | `machineProfileId` |
| materialProfileId | `materialProfileId` |
| textValue | `content.text` |
| imageAssetId | `content.imageAssetId` |
| widthMm | `layout.widthMm` |
| heightMm | `layout.heightMm` |
| rotationDeg | `layout.rotationDeg` |
| align | `layout.align` |
| speed | `processParams.speed` |
| power | `processParams.power` |
| passes | `processParams.passes` |
| lineSpacing | `processParams.lineSpacing` |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| loadProject | `PROJECT_DETAIL` | route project id | populate form |
| saveProject | `PROJECT_UPDATE` | all editor fields | show saved state |
| uploadImageStart | `ASSET_UPLOAD_POLICY` | `type`, `filename`, `mimeType` | get upload target |
| generatePreview | `PROJECT_UPDATE` then `PREVIEW_CREATE` | current editor fields | open preview page |

## 8. Preview Page

**Route**

`/pages/preview/index`

### Display Fields

| UI Field | Type | Source |
|---|---|---|
| previewId | string | route param / `PREVIEW_CREATE.previewId` |
| previewStatus | enum | `PREVIEW_DETAIL.status` |
| previewImageUrl | string | `PREVIEW_DETAIL.previewImageUrl` |
| previewSvgUrl | string | `PREVIEW_DETAIL.previewSvgUrl` |
| pathCount | number | `PREVIEW_DETAIL.metrics.pathCount` |
| estimatedDurationSec | number | `PREVIEW_DETAIL.metrics.estimatedDurationSec` |
| previewWidthMm | number | `PREVIEW_DETAIL.metrics.widthMm` |
| previewHeightMm | number | `PREVIEW_DETAIL.metrics.heightMm` |
| warnings | list | `PREVIEW_DETAIL.warnings` |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| refreshPreview | `PREVIEW_DETAIL` | preview id | update preview |
| regeneratePreview | `PREVIEW_CREATE` | `forceRegenerate=true` | new or updated preview |
| generateGcode | `GEN_CREATE` | `previewId` | generation task starts |
| submitJob | `GEN_DETAIL` then `JOB_CREATE` | `projectId`, `generationId`, `deviceId`, `executionMode` | open task detail |

### Derived UI Rules

| UI State | Condition |
|---|---|
| submit disabled | `previewStatus != ready` |
| show loading | `previewStatus = pending or processing` |
| show warnings block | `warnings.length > 0` |

## 9. Task List Page

**Route**

`/pages/tasks/index`

### Display Fields

| UI Field | Type | Source |
|---|---|---|
| taskItems | list | `JOB_LIST.items[]` |
| taskId | string | `JOB_LIST.items[].id` |
| taskProjectId | string | `JOB_LIST.items[].projectId` |
| taskDeviceId | string | `JOB_LIST.items[].deviceId` |
| taskStatus | enum | `JOB_LIST.items[].status` |
| taskProgressPercent | number | `JOB_LIST.items[].progress.percent` |
| taskCurrentStep | string | `JOB_LIST.items[].progress.currentStep` |
| taskUpdatedAt | datetime | `JOB_LIST.items[].updatedAt` |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| loadTasks | `JOB_LIST` | `page`, `pageSize`, `status` | render list |
| openTaskDetail | `JOB_DETAIL` | route task id | open detail |
| retryTask | `JOB_RETRY` | task id | create new queued task |

## 10. Task Detail Page

**Route**

`/pages/tasks/detail/index`

### Display Fields

| UI Field | Type | Source |
|---|---|---|
| taskId | string | `JOB_DETAIL.id` |
| projectId | string | `JOB_DETAIL.projectId` |
| generationId | string | `JOB_DETAIL.generationId` |
| deviceId | string | `JOB_DETAIL.deviceId` |
| status | enum | `JOB_DETAIL.status` |
| progressPercent | number | `JOB_DETAIL.progress.percent` |
| currentStep | string | `JOB_DETAIL.progress.currentStep` |
| failureCode | string/null | `JOB_DETAIL.failure.code` |
| failureMessage | string/null | `JOB_DETAIL.failure.message` |
| timeline | list | `JOB_DETAIL.timeline[]` |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| refreshTask | `JOB_DETAIL` | task id | update page |
| cancelTask | `JOB_CANCEL` | task id | status becomes canceled |
| retryTask | `JOB_RETRY` | task id | new task returned |
| viewOriginalProject | `PROJECT_DETAIL` | `JOB_DETAIL.projectId` | open editor/detail |

### Derived UI Rules

| UI State | Condition |
|---|---|
| show cancel button | `status in [queued, dispatching, running]` |
| show retry button | `status = failed and failure.retryable = true` |
| show failure block | `failure != null` |

## 11. Device List Page

**Route**

`/pages/devices/index`

### Display Fields

| UI Field | Type | Source |
|---|---|---|
| deviceItems | list | `DEVICE_LIST.items[]` |
| deviceId | string | `DEVICE_LIST.items[].id` |
| deviceName | string | `DEVICE_LIST.items[].name` |
| deviceModel | string | `DEVICE_LIST.items[].model` |
| deviceOnlineStatus | enum | `DEVICE_LIST.items[].onlineStatus` |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| loadDevices | `DEVICE_LIST` | none | render list |
| selectDevice | none or local state update | selected device object | return to editor/workspace |
| goBindDevice | none | none | open bind page |

## 12. Device Bind Page

**Route**

`/pages/devices/bind/index`

### Editable Fields

| UI Field | Type | Required | Request Field |
|---|---|---|---|
| bindingCode | string | yes | `bindingCode` |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| submitBindDevice | `DEVICE_BIND` | `bindingCode` | return to device list and refresh |

## 13. My Page

**Route**

`/pages/profile/index`

### Display Fields

| UI Field | Type | Source |
|---|---|---|
| nickname | string | `AUTH_ME.nickname` |
| avatarUrl | string | `AUTH_ME.avatarUrl` |
| mobile | string | `AUTH_ME.mobile` |
| profileStatus | enum | `AUTH_ME.profileStatus` |

### Actions

| Action | API | Request Fields | Success Result |
|---|---|---|---|
| loadProfile | `AUTH_ME` | none | render profile |
| logout | none or local session clear | none | back to login |

## 14. Shared Local State Suggestions

These fields are useful as mini program client state:

| Local State | Source |
|---|---|
| authToken | auth responses |
| currentUser | `AUTH_ME` or auth responses |
| selectedDevice | device list selection |
| currentProjectId | project create/detail route state |
| currentPreviewId | preview create/detail route state |
| currentGenerationId | generation responses |

## 15. P0 Simplification Rules

To keep page binding simple:

1. One selected device per project
2. One image asset per image project
3. One latest preview per project snapshot
4. One latest generation per preview path
5. Job list uses polling, not push, in the first version

## 16. Final Implementation Order

If building pages against mock data first, use this order:

1. Login Entry
2. Registration Completion
3. Device List
4. Workspace
5. Project Editor
6. Preview
7. Task List
8. Task Detail
9. My Page
