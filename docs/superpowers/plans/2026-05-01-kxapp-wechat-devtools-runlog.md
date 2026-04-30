# KXApp WeChat DevTools Run Log

**Purpose:** Record each real WeChat DevTools verification pass against the current `wechatapp` implementation so future sessions can tell what was actually exercised, what failed, and what still needs a real-device walkthrough.

## 1. How To Use

Use this file together with:

- `docs/superpowers/plans/2026-05-01-kxapp-wechat-devtools-checklist.md`
- `docs/superpowers/plans/2026-05-01-kxapp-reference-baseline.md`

Recommended workflow:

1. run backend checks
2. start backend locally
3. open WeChat DevTools
4. walk through the checklist
5. append one run entry below

## 2. Status Legend

- `PASS`: verified in DevTools and behaved as expected
- `PARTIAL`: opened and exercised, but not fully closed-loop
- `FAIL`: reproduced a real issue
- `SKIP`: intentionally not verified in this run

## 3. Run Entry Template

Copy this section for each new verification pass.

```md
## Run YYYY-MM-DD-XX

**Date**

- YYYY-MM-DD

**Commit**

- `git rev-parse --short HEAD`

**Operator**

- name or session id

**Backend**

- startup command:
  - `powershell -ExecutionPolicy Bypass -File ./scripts/test.ps1`
  - `node src/server.js`
- backend tests:
  - PASS / FAIL
- backend URL:
  - `http://127.0.0.1:3100`

**WeChat DevTools**

- project path:
  - `D:\GIT\wechatapp\miniprogram`
- compile:
  - PASS / FAIL
- storage cleared before run:
  - YES / NO

**Flow Results**

- login existing user:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- register new user:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- complete profile:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- device list and selection:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- device bind:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- project create text:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- project create image:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- project duplicate/archive/restore/delete:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- preview generation:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- job submit and completion:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- task failure classification:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- task retry/cancel guard:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:
- profile page:
  - PASS / PARTIAL / FAIL / SKIP
  - notes:

**Issues Found**

- issue 1:
  - page:
  - steps:
  - expected:
  - actual:
  - severity:

**Screenshots / Evidence**

- screenshot paths:
- request traces:
- console errors:

**Next Actions**

- fix candidates:
- flows to re-run:
```

## 4. Current Run History

## Run 2026-05-01-01

**Date**

- 2026-05-01

**Commit**

- `165a249`

**Operator**

- Codex session preflight

**Backend**

- startup command:
  - `powershell -ExecutionPolicy Bypass -File ./scripts/test.ps1`
  - `node src/server.js`
- backend tests:
  - PASS
- backend URL:
  - `http://127.0.0.1:3100`

**WeChat DevTools**

- project path:
  - `D:\GIT\wechatapp\miniprogram`
- compile:
  - SKIP
- storage cleared before run:
  - SKIP

**Flow Results**

- login existing user:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- register new user:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- complete profile:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- device list and selection:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- device bind:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- project create text:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- project create image:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- project duplicate/archive/restore/delete:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- preview generation:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- job submit and completion:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- task failure classification:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- task retry/cancel guard:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session
- profile page:
  - SKIP
  - notes: not exercised in WeChat DevTools during this session

**Issues Found**

- none recorded in this preflight-only entry

**Screenshots / Evidence**

- backend test evidence:
  - `backend/scripts/test.ps1`
  - 15 backend tests passing in this session
- DevTools screenshots:
  - none captured in this preflight-only entry

**Next Actions**

- start backend locally and open WeChat DevTools
- convert the next entry into a real smoke pass
- prioritize:
  - existing-user login
  - device selection
  - text project create
  - preview ready
  - job submit to completed
  - archived project restore flow

## 5. First Recommended Entry

For the first recorded pass, prefer this narrow smoke order:

1. existing-user login
2. device selection
3. text project create
4. preview ready
5. job submit to completed
6. archived project filter plus restore

This gives a fast signal before spending time on lower-value branches.
