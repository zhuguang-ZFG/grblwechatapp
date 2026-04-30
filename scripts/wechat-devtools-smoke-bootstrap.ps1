param(
  [switch]$DryRun,
  [switch]$StartBackend,
  [string]$PidFilePath,
  [string]$RunLogPath,
  [string]$Operator = "Manual smoke runner"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$backendTestScript = Join-Path $backendDir "scripts\test.ps1"
$runLogEntryScript = Join-Path $repoRoot "scripts\wechat-devtools-new-runlog-entry.ps1"
$resolvedPidFilePath = if ($PidFilePath) {
  $PidFilePath
} else {
  Join-Path $repoRoot ".tmp\wechat-devtools-backend.pid"
}
$resolvedRunLogPath = if ($RunLogPath) {
  $RunLogPath
} else {
  Join-Path $repoRoot "docs\superpowers\plans\2026-05-01-kxapp-wechat-devtools-runlog.md"
}
$commit = (git -C $repoRoot rev-parse --short HEAD).Trim()

Write-Output "WeChat DevTools Smoke Bootstrap"
Write-Output "Operator: $Operator"
Write-Output "Commit: $commit"
Write-Output "Backend test script: $backendTestScript"
Write-Output "Run log helper: $runLogEntryScript"
Write-Output "Backend PID file: $resolvedPidFilePath"
Write-Output "Run log path: $resolvedRunLogPath"

& powershell -ExecutionPolicy Bypass -File $runLogEntryScript -RunLogPath $resolvedRunLogPath -Operator $Operator | Out-Null
Write-Output "Run log template entry appended."

if ($DryRun) {
  Write-Output "Dry run only. Backend tests and backend startup were skipped."
  exit 0
}

Write-Output "Running backend tests..."
& powershell -ExecutionPolicy Bypass -File $backendTestScript

if ($StartBackend) {
  $pidDir = Split-Path -Parent $resolvedPidFilePath
  if (-not (Test-Path -LiteralPath $pidDir)) {
    New-Item -ItemType Directory -Path $pidDir | Out-Null
  }
  $process = Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru
  Set-Content -LiteralPath $resolvedPidFilePath -Value $process.Id -Encoding ASCII
  Write-Output "Backend started with PID: $($process.Id)"
  Write-Output "Backend PID file written to: $resolvedPidFilePath"
} else {
  Write-Output "Backend not started automatically."
  Write-Output "Start it manually from:"
  Write-Output "  $backendDir"
  Write-Output "Then run:"
  Write-Output "  node src/server.js"
}
