param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$backendTestScript = Join-Path $backendDir "scripts\test.ps1"
$checklistPath = Join-Path $repoRoot "docs\superpowers\plans\2026-05-01-kxapp-wechat-devtools-checklist.md"
$runlogPath = Join-Path $repoRoot "docs\superpowers\plans\2026-05-01-kxapp-wechat-devtools-runlog.md"
$miniProgramPath = Join-Path $repoRoot "miniprogram"
$commit = (git -C $repoRoot rev-parse --short HEAD).Trim()

Write-Output "WeChat DevTools Preflight"
Write-Output "Current commit: $commit"
Write-Output "Repo root: $repoRoot"
Write-Output "Mini program path: $miniProgramPath"
Write-Output "Backend test script: $backendTestScript"
Write-Output "Backend server command: node src/server.js"
Write-Output "Checklist: $checklistPath"
Write-Output "Run log: $runlogPath"

if ($DryRun) {
  Write-Output "Dry run only. No commands executed."
  exit 0
}

Write-Output ""
Write-Output "Running backend preflight tests..."
& powershell -ExecutionPolicy Bypass -File $backendTestScript

Write-Output ""
Write-Output "Backend preflight passed."
Write-Output "Start backend manually from:"
Write-Output "  $backendDir"
Write-Output "Then run:"
Write-Output "  node src/server.js"
