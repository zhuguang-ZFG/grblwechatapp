param(
  [string]$RunLogPath,
  [string]$Operator = "Manual smoke runner"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$defaultRunlogPath = Join-Path $repoRoot "docs\superpowers\plans\2026-05-01-kxapp-wechat-devtools-runlog.md"
$resolvedRunLogPath = if ($RunLogPath) { $RunLogPath } else { $defaultRunlogPath }
$commit = (git -C $repoRoot rev-parse --short HEAD).Trim()
$dateStamp = Get-Date -Format "yyyy-MM-dd"
$timeStamp = Get-Date -Format "HHmmss"

$entry = @"

## Run $dateStamp-$timeStamp

**Date**

- $dateStamp

**Commit**

- `$commit`

**Operator**

- $Operator

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
"@

Add-Content -Path $resolvedRunLogPath -Value $entry -Encoding UTF8

Write-Output "WeChat DevTools Run Log Entry"
Write-Output "Operator: $Operator"
Write-Output "Commit: $commit"
Write-Output "Entry appended to: $resolvedRunLogPath"
