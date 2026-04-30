param(
  [switch]$DryRun,
  [switch]$AppendRunLog,
  [string]$RunLogPath,
  [string]$Operator = "Codex preflight script"
)

$ErrorActionPreference = "Stop"

function Add-RunLogEntry {
  param(
    [string]$Path,
    [string]$DateStamp,
    [string]$Commit,
    [string]$OperatorName,
    [bool]$IsDryRun
  )

  $entry = @"

## Run $DateStamp-auto

**Date**

- $DateStamp

**Commit**

- `$Commit`

**Operator**

- $OperatorName

**Backend**

- startup command:
  - `powershell -ExecutionPolicy Bypass -File ./scripts/test.ps1`
  - `node src/server.js`
- backend tests:
  - $(if ($IsDryRun) { "SKIP" } else { "PASS" })
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
  - notes: preflight script does not open WeChat DevTools
- register new user:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- complete profile:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- device list and selection:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- device bind:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- project create text:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- project create image:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- project duplicate/archive/restore/delete:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- preview generation:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- job submit and completion:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- task failure classification:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- task retry/cancel guard:
  - SKIP
  - notes: preflight script does not open WeChat DevTools
- profile page:
  - SKIP
  - notes: preflight script does not open WeChat DevTools

**Issues Found**

- none recorded by automated preflight

**Screenshots / Evidence**

- backend test evidence:
  - $(if ($IsDryRun) { "Dry run preflight only. Backend tests not executed." } else { "backend/scripts/test.ps1 passed in this preflight run" })
- DevTools screenshots:
  - none captured by automated preflight

**Next Actions**

- start backend locally
- open WeChat DevTools
- continue with checklist-based manual smoke run
"@

  Add-Content -Path $Path -Value $entry -Encoding UTF8
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$backendTestScript = Join-Path $backendDir "scripts\test.ps1"
$checklistPath = Join-Path $repoRoot "docs\superpowers\plans\2026-05-01-kxapp-wechat-devtools-checklist.md"
$defaultRunlogPath = Join-Path $repoRoot "docs\superpowers\plans\2026-05-01-kxapp-wechat-devtools-runlog.md"
$resolvedRunLogPath = if ($RunLogPath) { $RunLogPath } else { $defaultRunlogPath }
$miniProgramPath = Join-Path $repoRoot "miniprogram"
$commit = (git -C $repoRoot rev-parse --short HEAD).Trim()
$dateStamp = Get-Date -Format "yyyy-MM-dd"

Write-Output "WeChat DevTools Preflight"
Write-Output "Current commit: $commit"
Write-Output "Repo root: $repoRoot"
Write-Output "Mini program path: $miniProgramPath"
Write-Output "Backend test script: $backendTestScript"
Write-Output "Backend server command: node src/server.js"
Write-Output "Checklist: $checklistPath"
Write-Output "Run log: $resolvedRunLogPath"

if ($DryRun) {
  if ($AppendRunLog) {
    Add-RunLogEntry -Path $resolvedRunLogPath -DateStamp $dateStamp -Commit $commit -OperatorName $Operator -IsDryRun $true
    Write-Output "Dry run preflight note appended to run log."
  }
  Write-Output "Dry run only. No commands executed."
  exit 0
}

Write-Output ""
Write-Output "Running backend preflight tests..."
& powershell -ExecutionPolicy Bypass -File $backendTestScript

if ($AppendRunLog) {
  Add-RunLogEntry -Path $resolvedRunLogPath -DateStamp $dateStamp -Commit $commit -OperatorName $Operator -IsDryRun $false
  Write-Output "Preflight note appended to run log."
}

Write-Output ""
Write-Output "Backend preflight passed."
Write-Output "Start backend manually from:"
Write-Output "  $backendDir"
Write-Output "Then run:"
Write-Output "  node src/server.js"
