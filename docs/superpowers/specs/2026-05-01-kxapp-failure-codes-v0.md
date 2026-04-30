# KXApp Failure Codes v0

**Purpose:** Define a single, shared failure code contract between backend job execution and mini program task-detail UX, so error handling stays consistent as new failure paths are added.

## Scope

This v0 contract applies to:

- backend job failure payload (`jobs.failure_json`)
- mini program task detail retry behavior (`canRetry`)
- mini program failure suggestion display (`failureSuggestion`, `retryHint`)

This v0 does **not** yet include:

- full device protocol raw code mapping (for example GRBL native code expansion)
- i18n strategy
- admin/operator console specific error rendering

## Canonical Failure Payload Shape

When a job fails, backend should persist and return:

```json
{
  "code": "DEVICE_OFFLINE",
  "message": "Device is offline and cannot receive job dispatch",
  "retryable": true
}
```

Field semantics:

- `code`: stable machine-readable identifier (primary contract key)
- `message`: backend-side human-readable English summary (diagnostic baseline)
- `retryable`: whether frontend should allow direct retry entry

## Failure Code Dictionary (v0)

| Code | Backend meaning | retryable | Mini program suggestion |
| --- | --- | --- | --- |
| `DEVICE_OFFLINE` | Device is offline and cannot receive dispatch | `true` | 设备当前离线，请检查设备通电与网络连接后再重试。 |
| `DEVICE_BUSY` | Device is occupied by another operation | `true` | 设备当前忙碌，请等待当前任务完成后再重试。 |
| `GATEWAY_TIMEOUT` | Gateway dispatch timed out before ack | `true` | 网关下发超时，请确认设备连接稳定后重试。 |
| `PARAM_INVALID` | Project/process parameters are invalid | `false` | 参数配置无效，请调整加工参数后重新提交任务。 |

## Frontend Behavior Contract

Task detail page should follow:

1. `job.status === "failed"` and `failure.retryable === true`
   - show retry button
   - allow `retryJob()` action
   - show `failureSuggestion` if mapped
2. `job.status === "failed"` and `failure.retryable !== true`
   - hide retry button
   - block retry action in logic layer
   - show `retryHint`: 当前错误不支持直接重试，请先调整项目参数后重新提交任务。
3. unknown `failure.code`
   - still display `failure.message` and code
   - fallback suggestion: 可先刷新状态并检查设备与项目参数，再尝试重试任务。

## Backend Evolution Rules

When adding a new failure code:

1. add code in backend dictionary (`backend/src/modules/jobs/failure-codes.js`)
2. ensure worker/service can emit this code with explicit `retryable`
3. add/adjust backend tests to verify failed job payload
4. add frontend suggestion map entry if user-facing guidance is needed
5. update this contract doc in same PR

## Versioning

- Current: `v0`
- Compatibility rule:
  - do not repurpose existing code names with different semantics
  - for behavior changes, prefer introducing a new code
