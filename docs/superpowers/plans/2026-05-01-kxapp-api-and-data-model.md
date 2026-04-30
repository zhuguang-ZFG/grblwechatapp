# KXApp Mini Program API And Data Model Draft

**Purpose:** Define a stable first-pass contract between the mini program, backend services, and device gateway for the `kxapp` migration.

**Scope:** P0 and P1 first. P2 fields are only included where they do not complicate MVP delivery.

---

## Reference Baseline

Read `docs/superpowers/plans/2026-05-01-kxapp-reference-baseline.md` before changing this document in a new session. It freezes the currently agreed source references, backend/frontend baseline, pushed commits, and known open gaps.

## 1. Core Design Rules

1. The mini program never owns heavy image processing, SVG parsing, path generation, or GCode generation.
2. The backend exposes task-oriented APIs, not Android-style machine control primitives.
3. The gateway owns device session details and reports normalized machine state upward.
4. Every long-running operation returns an async resource id or job id.
5. Preview output and GCode output are derived artifacts linked to a project version.

## 2. Main Domain Objects

### 2.1 User

```json
{
  "id": "usr_123",
  "wechatOpenId": "openid_xxx",
  "nickname": "Alice",
  "avatarUrl": "https://...",
  "mobile": "13800000000",
  "registerSource": "wechat",
  "profileStatus": "completed",
  "status": "active",
  "createdAt": "2026-05-01T10:00:00Z"
}
```

### 2.2 Device

```json
{
  "id": "dev_123",
  "name": "KX Laser A1",
  "model": "esp32_grbl",
  "serialNo": "KX-A1-0001",
  "ownerUserId": "usr_123",
  "bindStatus": "bound",
  "onlineStatus": "online",
  "lastSeenAt": "2026-05-01T10:00:00Z",
  "firmwareVersion": "1.2.0",
  "gatewayId": "gw_001",
  "capabilities": {
    "supportsText": true,
    "supportsImage": true,
    "supportsOfflineJob": true
  }
}
```

### 2.3 Machine Profile

```json
{
  "id": "mp_123",
  "deviceModel": "esp32_grbl",
  "name": "Default ESP32 GRBL",
  "workArea": {
    "widthMm": 400,
    "heightMm": 400
  },
  "originMode": "bottom_left",
  "supportsOfflinePrint": true,
  "defaultParams": {
    "speed": 1200,
    "power": 70,
    "lineSpacing": 1.0
  }
}
```

### 2.4 Material Profile

```json
{
  "id": "mat_123",
  "name": "Wood - Light Burn",
  "category": "wood",
  "recommendedParams": {
    "speed": 1000,
    "power": 65,
    "passes": 1
  },
  "notes": "Good for shallow marking"
}
```

### 2.5 Project

This is the top-level editable entity in the mini program.

```json
{
  "id": "prj_123",
  "ownerUserId": "usr_123",
  "name": "Mother's Day plaque",
  "sourceType": "text",
  "status": "draft",
  "selectedDeviceId": "dev_123",
  "machineProfileId": "mp_123",
  "materialProfileId": "mat_123",
  "content": {
    "text": "Best Mom",
    "imageAssetId": null
  },
  "layout": {
    "widthMm": 80,
    "heightMm": 50,
    "rotationDeg": 0,
    "align": "center"
  },
  "processParams": {
    "speed": 1000,
    "power": 65,
    "passes": 1,
    "lineSpacing": 1.2
  },
  "latestPreviewId": "pre_123",
  "latestGenerationId": "gen_123",
  "createdAt": "2026-05-01T10:00:00Z",
  "updatedAt": "2026-05-01T10:05:00Z"
}
```

### 2.6 Uploaded Asset

```json
{
  "id": "ast_123",
  "ownerUserId": "usr_123",
  "type": "image",
  "filename": "flower.png",
  "mimeType": "image/png",
  "sizeBytes": 248122,
  "storageKey": "uploads/usr_123/flower.png",
  "url": "https://...",
  "createdAt": "2026-05-01T10:00:00Z"
}
```

### 2.7 Preview

This is an async artifact generated from a project snapshot.

```json
{
  "id": "pre_123",
  "projectId": "prj_123",
  "status": "ready",
  "snapshotVersion": 3,
  "previewImageUrl": "https://...",
  "previewSvgUrl": "https://...",
  "metrics": {
    "widthMm": 80,
    "heightMm": 50,
    "pathCount": 126,
    "estimatedDurationSec": 420
  },
  "warnings": [],
  "createdAt": "2026-05-01T10:06:00Z"
}
```

### 2.8 Generation Result

This stores the server-side path/GCode generation output.

```json
{
  "id": "gen_123",
  "projectId": "prj_123",
  "previewId": "pre_123",
  "status": "ready",
  "snapshotVersion": 3,
  "gcodeAssetId": "ast_456",
  "pathAssetId": "ast_457",
  "summary": {
    "lineCount": 5204,
    "estimatedDurationSec": 420,
    "boundsMm": {
      "width": 80,
      "height": 50
    }
  },
  "createdAt": "2026-05-01T10:06:30Z"
}
```

### 2.9 Job

Job means a dispatchable execution request against a device.

```json
{
  "id": "job_123",
  "projectId": "prj_123",
  "generationId": "gen_123",
  "deviceId": "dev_123",
  "gatewayId": "gw_001",
  "status": "queued",
  "submitterUserId": "usr_123",
  "executionMode": "offline_file",
  "progress": {
    "percent": 0,
    "currentStep": "queued"
  },
  "failure": null,
  "createdAt": "2026-05-01T10:07:00Z",
  "updatedAt": "2026-05-01T10:07:00Z"
}
```

### 2.10 Job Failure

```json
{
  "code": "gateway_dispatch_failed",
  "message": "Gateway could not reach target device",
  "retryable": true
}
```

### 2.11 Gateway

```json
{
  "id": "gw_001",
  "name": "Factory North Gateway",
  "status": "online",
  "lastHeartbeatAt": "2026-05-01T10:06:59Z",
  "version": "0.9.0"
}
```

## 3. Status Enumerations

### 3.1 Project Status

```text
draft
preview_pending
preview_ready
generation_pending
generation_ready
archived
```

### 3.2 Preview Status

```text
pending
processing
ready
failed
```

### 3.3 Generation Status

```text
pending
processing
ready
failed
```

### 3.4 Job Status

```text
queued
dispatching
running
paused
failed
completed
canceled
```

### 3.5 Device Online Status

```text
online
offline
busy
error
```

## 4. API Contract Draft

Base path:

```text
/api/v1
```

Authentication:

```text
Authorization: Bearer <token>
```

### 4.1 Auth APIs

#### `POST /auth/wechat-login`

Request:

```json
{
  "code": "wx_login_code",
  "profile": {
    "nickname": "Alice",
    "avatarUrl": "https://..."
  }
}
```

Response:

```json
{
  "isNewUser": false,
  "token": "jwt_or_session_token",
  "user": {
    "id": "usr_123",
    "nickname": "Alice",
    "profileStatus": "completed"
  },
  "nextAction": "enter_app"
}
```

#### `POST /auth/register`

Used when first-time WeChat login needs an explicit registration step.

Request:

```json
{
  "wechatOpenId": "openid_xxx",
  "nickname": "Alice",
  "avatarUrl": "https://...",
  "mobile": "13800000000",
  "agreeTerms": true
}
```

Response:

```json
{
  "token": "jwt_or_session_token",
  "user": {
    "id": "usr_123",
    "nickname": "Alice",
    "profileStatus": "completed"
  },
  "nextAction": "enter_app"
}
```

#### `POST /auth/complete-profile`

Used when login succeeds but the account is not fully registered.

Request:

```json
{
  "mobile": "13800000000",
  "nickname": "Alice",
  "companyName": "Demo Studio"
}
```

Response:

```json
{
  "user": {
    "id": "usr_123",
    "nickname": "Alice",
    "profileStatus": "completed"
  }
}
```

#### `GET /auth/me`

Response:

```json
{
  "id": "usr_123",
  "nickname": "Alice",
  "avatarUrl": "https://...",
  "mobile": "13800000000",
  "profileStatus": "completed"
}
```

### 4.2 Device APIs

#### `GET /devices`

Response:

```json
{
  "items": [
    {
      "id": "dev_123",
      "name": "KX Laser A1",
      "onlineStatus": "online",
      "model": "esp32_grbl"
    }
  ]
}
```

#### `GET /devices/:id`

Response:

```json
{
  "id": "dev_123",
  "name": "KX Laser A1",
  "onlineStatus": "online",
  "machineProfileId": "mp_123",
  "capabilities": {
    "supportsOfflinePrint": true
  }
}
```

#### `POST /devices/bind`

Request:

```json
{
  "bindingCode": "ABCD1234"
}
```

Response:

```json
{
  "deviceId": "dev_123",
  "bindStatus": "bound"
}
```

### 4.3 Asset APIs

#### `POST /assets/upload-policy`

Request:

```json
{
  "type": "image",
  "filename": "flower.png",
  "mimeType": "image/png"
}
```

Response:

```json
{
  "uploadUrl": "https://...",
  "storageKey": "uploads/usr_123/flower.png",
  "assetId": "ast_123"
}
```

### 4.4 Project APIs

#### `POST /projects`

Request:

```json
{
  "name": "Mother's Day plaque",
  "sourceType": "text",
  "selectedDeviceId": "dev_123",
  "machineProfileId": "mp_123",
  "materialProfileId": "mat_123",
  "content": {
    "text": "Best Mom",
    "imageAssetId": null
  },
  "layout": {
    "widthMm": 80,
    "heightMm": 50,
    "rotationDeg": 0,
    "align": "center"
  },
  "processParams": {
    "speed": 1000,
    "power": 65,
    "passes": 1,
    "lineSpacing": 1.2
  }
}
```

Response:

```json
{
  "id": "prj_123",
  "status": "draft"
}
```

#### `GET /projects`

Query:

```text
?page=1&pageSize=20&status=draft
```

Response:

```json
{
  "items": [
    {
      "id": "prj_123",
      "name": "Mother's Day plaque",
      "sourceType": "text",
      "status": "draft",
      "updatedAt": "2026-05-01T10:05:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

#### `GET /projects/:id`

Response:

```json
{
  "id": "prj_123",
  "name": "Mother's Day plaque",
  "sourceType": "text",
  "content": {
    "text": "Best Mom",
    "imageAssetId": null
  },
  "layout": {
    "widthMm": 80,
    "heightMm": 50,
    "rotationDeg": 0,
    "align": "center"
  },
  "processParams": {
    "speed": 1000,
    "power": 65,
    "passes": 1,
    "lineSpacing": 1.2
  },
  "latestPreviewId": "pre_123",
  "latestGenerationId": "gen_123"
}
```

#### `PUT /projects/:id`

Request body matches `POST /projects`, partial update allowed.

#### `POST /projects/:id/duplicate`

Response:

```json
{
  "id": "prj_124"
}
```

### 4.5 Preview APIs

#### `POST /projects/:id/preview`

Request:

```json
{
  "forceRegenerate": true
}
```

Response:

```json
{
  "previewId": "pre_123",
  "status": "processing"
}
```

#### `GET /previews/:id`

Response:

```json
{
  "id": "pre_123",
  "status": "ready",
  "previewImageUrl": "https://...",
  "previewSvgUrl": "https://...",
  "metrics": {
    "pathCount": 126,
    "estimatedDurationSec": 420
  },
  "warnings": []
}
```

### 4.6 Generation APIs

#### `POST /projects/:id/generate`

Request:

```json
{
  "previewId": "pre_123"
}
```

Response:

```json
{
  "generationId": "gen_123",
  "status": "processing"
}
```

#### `GET /generations/:id`

Response:

```json
{
  "id": "gen_123",
  "status": "ready",
  "summary": {
    "lineCount": 5204,
    "estimatedDurationSec": 420
  }
}
```

### 4.7 Job APIs

#### `POST /jobs`

Request:

```json
{
  "projectId": "prj_123",
  "generationId": "gen_123",
  "deviceId": "dev_123",
  "executionMode": "offline_file"
}
```

Response:

```json
{
  "jobId": "job_123",
  "status": "queued"
}
```

#### `GET /jobs`

Query:

```text
?page=1&pageSize=20&status=running
```

Response:

```json
{
  "items": [
    {
      "id": "job_123",
      "projectId": "prj_123",
      "deviceId": "dev_123",
      "status": "running",
      "progress": {
        "percent": 64,
        "currentStep": "streaming"
      },
      "updatedAt": "2026-05-01T10:09:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

#### `GET /jobs/:id`

Response:

```json
{
  "id": "job_123",
  "projectId": "prj_123",
  "generationId": "gen_123",
  "deviceId": "dev_123",
  "status": "running",
  "progress": {
    "percent": 64,
    "currentStep": "streaming"
  },
  "failure": null,
  "timeline": [
    {
      "status": "queued",
      "at": "2026-05-01T10:07:00Z"
    },
    {
      "status": "running",
      "at": "2026-05-01T10:08:00Z"
    }
  ]
}
```

#### `POST /jobs/:id/cancel`

Response:

```json
{
  "id": "job_123",
  "status": "canceled"
}
```

#### `POST /jobs/:id/retry`

Response:

```json
{
  "jobId": "job_124",
  "status": "queued"
}
```

### 4.8 Template APIs

P1 scope.

#### `GET /templates`

#### `POST /templates`

#### `POST /templates/:id/apply`

## 5. Gateway -> Backend Event Model

The gateway should not expose raw Android-style events. It should emit normalized events.

### Event: Device Heartbeat

```json
{
  "type": "device.heartbeat",
  "gatewayId": "gw_001",
  "deviceId": "dev_123",
  "onlineStatus": "online",
  "machineState": "idle",
  "at": "2026-05-01T10:08:00Z"
}
```

### Event: Job Progress

```json
{
  "type": "job.progress",
  "jobId": "job_123",
  "deviceId": "dev_123",
  "percent": 64,
  "currentStep": "streaming",
  "at": "2026-05-01T10:09:00Z"
}
```

### Event: Job Completed

```json
{
  "type": "job.completed",
  "jobId": "job_123",
  "deviceId": "dev_123",
  "at": "2026-05-01T10:12:00Z"
}
```

### Event: Job Failed

```json
{
  "type": "job.failed",
  "jobId": "job_123",
  "deviceId": "dev_123",
  "failure": {
    "code": "machine_execution_failed",
    "message": "Device stopped unexpectedly",
    "retryable": true
  },
  "at": "2026-05-01T10:12:00Z"
}
```

## 6. Mini Program Page To API Mapping

### Login Page

- `POST /auth/wechat-login`
- `POST /auth/register`
- `POST /auth/complete-profile`
- `GET /auth/me`

### Device Page

- `GET /devices`
- `GET /devices/:id`
- `POST /devices/bind`

### Workspace Page

- `POST /projects`
- `PUT /projects/:id`
- `GET /projects/:id`
- `POST /assets/upload-policy`

### Preview Page

- `POST /projects/:id/preview`
- `GET /previews/:id`
- `POST /projects/:id/generate`
- `GET /generations/:id`

### Task Page

- `POST /jobs`
- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs/:id/cancel`
- `POST /jobs/:id/retry`

## 7. First-Pass Database Tables

Suggested logical tables:

- `users`
- `devices`
- `machine_profiles`
- `material_profiles`
- `assets`
- `projects`
- `project_versions`
- `previews`
- `generations`
- `jobs`
- `job_events`
- `gateways`
- `device_heartbeats`
- `templates`

## 8. Open Questions

These need product or hardware confirmation before implementation hardens:

1. Is one user allowed to bind multiple devices across locations?
2. Does one project need multiple device-specific generations?
3. Should preview and generation be separate async resources, or merged for P0?
4. Is `offline_file` the only execution mode needed in P0?
5. Do we need role separation now, or can P0 assume one operator role?

## 9. Recommended P0 Simplifications

To keep the first version lean:

- Support only `text` and single `image` sources
- Support one active device per project
- Support one machine profile per device model
- Support one preview image plus one optional SVG output
- Support one generation result per submitted project version
- Support polling for preview/job status before introducing push

## 10. Suggested Next Implementation Order

1. Freeze `Project`, `Preview`, `Generation`, `Job` schemas
2. Freeze `POST /projects`, `POST /projects/:id/preview`, `POST /jobs`
3. Build mini program pages against mock responses
4. Build backend async workers for preview and generation
5. Integrate gateway event ingestion
