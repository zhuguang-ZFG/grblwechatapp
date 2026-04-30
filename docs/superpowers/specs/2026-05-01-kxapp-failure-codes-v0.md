# KXApp Failure Codes v0

**Purpose:** Define a single shared failure contract between backend job execution, task list filtering, and mini program task-detail UX so error handling stays consistent as new failure paths are added.

## Scope

This v0 contract applies to:

- backend job failure payload (`jobs.failure_json`)
- mini program task detail retry behavior (`canRetry`)
- mini program failure suggestion display (`failureSuggestion`, `retryHint`)
- mini program task list failure-category filters and summary counters

This v0 does not yet include:

- full device protocol raw code mapping
- i18n strategy
- admin/operator console specific error rendering

## Canonical Failure Payload Shape

When a job fails, backend should persist and return:

```json
{
  "code": "DEVICE_OFFLINE",
  "category": "DEVICE",
  "message": "Device is offline and cannot receive job dispatch",
  "retryable": true
}
```

Field semantics:

- `code`: stable machine-readable identifier
- `category`: stable grouping key for list filters and high-level diagnostics
- `message`: backend-side human-readable English summary
- `retryable`: whether frontend should allow direct retry entry

## Failure Code Dictionary (v0)

| Code | Category | Backend meaning | Retryable | Mini program suggestion |
| --- | --- | --- | --- | --- |
| `DEVICE_OFFLINE` | `DEVICE` | Device is offline and cannot receive dispatch | `true` | 设备当前离线，请检查设备通电与网络连接后再重试。 |
| `DEVICE_BUSY` | `DEVICE` | Device is occupied by another operation | `true` | 设备当前忙碌，请等待当前任务完成后再重试。 |
| `GATEWAY_TIMEOUT` | `GATEWAY` | Gateway dispatch timed out before ack | `true` | 网关下发超时，请确认设备连接稳定后再重试。 |
| `PARAM_INVALID` | `PARAMETER` | Project/process parameters are invalid | `false` | 参数配置无效，请调整加工参数后重新提交任务。 |

Unknown codes should fall back to:

```json
{
  "code": "SOME_NEW_CODE",
  "category": "UNKNOWN",
  "message": "Job failed with an unknown error",
  "retryable": false
}
```

## Frontend Behavior Contract

Task detail page should follow:

1. `job.status === "failed"` and `failure.retryable === true`
   - show retry button
   - allow `retryJob()` action
   - show `failureSuggestion` if mapped
   - show readable category label when `failure.category` exists
2. `job.status === "failed"` and `failure.retryable !== true`
   - hide retry button
   - block retry action in logic layer
   - show `retryHint`: 当前错误不支持直接重试，请先调整项目参数后重新提交任务。
3. unknown `failure.code`
   - still display `failure.message` and code
   - show category label `未知问题` if backend returned `UNKNOWN`
   - fallback suggestion: 可先刷新状态并检查设备与项目参数，再尝试重试任务。

## Task List Filtering Contract

Task list page may call:

- `GET /api/v1/jobs?status=failed&failureCategory=DEVICE`

Expected response extensions:

- each failed item may include `failure.category`
- response `summary.failedByCategory` returns failed counts grouped by category
- response `summary.totalFailed` returns failed-job total after current user scoping

## Operation Error Codes (v0)

These are operation-level business errors (not `failure_json` codes) returned by job action APIs:

| Code | HTTP status | Trigger | Frontend behavior |
| --- | --- | --- | --- |
| `invalid_retry_target` | `409` | Retry called for a job that is not `failed` with `retryable=true` | Toast: 当前任务不可重试, then refresh job detail |
| `invalid_cancel_target` | `409` | Cancel called for a terminal or non-active job | Toast: 当前任务不可取消, then refresh job detail |

Response shape keeps the standard error envelope:

```json
{
  "code": "invalid_retry_target",
  "message": "Only retryable failed jobs can be retried"
}
```

## Backend Evolution Rules

When adding a new failure code:

1. add code in backend dictionary (`backend/src/modules/jobs/failure-codes.js`)
2. include an explicit `category`
3. ensure worker/service can emit this code with explicit `retryable`
4. add or adjust backend tests to verify failed job payload
5. add frontend suggestion map entry if user-facing guidance is needed
6. update this contract doc in the same PR

## Versioning

- Current: `v0`
- Compatibility rule:
  - do not repurpose existing code names with different semantics
  - for behavior changes, prefer introducing a new code
