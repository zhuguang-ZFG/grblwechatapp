param(
  [switch]$DryRun,
  [string]$PidFilePath
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedPidFilePath = if ($PidFilePath) {
  $PidFilePath
} else {
  Join-Path $repoRoot ".tmp\wechat-devtools-backend.pid"
}

if (-not (Test-Path -LiteralPath $resolvedPidFilePath)) {
  throw "PID file not found: $resolvedPidFilePath"
}

$pidValue = (Get-Content -LiteralPath $resolvedPidFilePath -Raw).Trim()

if (-not $pidValue) {
  throw "PID file is empty: $resolvedPidFilePath"
}

Write-Output "WeChat DevTools Stop Backend"
Write-Output "PID file: $resolvedPidFilePath"
Write-Output "Target PID: $pidValue"

if ($DryRun) {
  Write-Output "Dry run only. Backend process was not stopped."
  exit 0
}

Stop-Process -Id ([int]$pidValue) -ErrorAction Stop
Remove-Item -LiteralPath $resolvedPidFilePath -Force
Write-Output "Backend process stopped and PID file removed."
