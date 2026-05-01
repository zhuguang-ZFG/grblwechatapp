param(
  [Parameter(Mandatory = $true)]
  [string]$LogPath,
  [string]$TraceId,
  [string]$JobId,
  [string]$DeviceId,
  [string]$Event,
  [string]$Component,
  [string]$Level,
  [int]$Tail = 50
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $LogPath)) {
  Write-Error "Log file not found: $LogPath"
  exit 1
}

$rawLines = Get-Content -LiteralPath $LogPath -Encoding UTF8
$jsonObjects = @()

foreach ($line in $rawLines) {
  $trimmed = ($line | Out-String).Trim()
  if (-not $trimmed) {
    continue
  }

  if ($trimmed.StartsWith("{")) {
    try {
      $obj = $trimmed | ConvertFrom-Json
      $jsonObjects += $obj
    } catch {
      # Ignore non-JSON lines
    }
  }
}

$filtered = $jsonObjects

if ($TraceId) {
  $filtered = $filtered | Where-Object { $_.traceId -eq $TraceId }
}
if ($JobId) {
  $filtered = $filtered | Where-Object { $_.jobId -eq $JobId }
}
if ($DeviceId) {
  $filtered = $filtered | Where-Object { $_.deviceId -eq $DeviceId }
}
if ($Event) {
  $filtered = $filtered | Where-Object { $_.event -eq $Event }
}
if ($Component) {
  $filtered = $filtered | Where-Object { $_.component -eq $Component }
}
if ($Level) {
  $filtered = $filtered | Where-Object { $_.level -eq $Level }
}

if ($Tail -gt 0) {
  $filtered = $filtered | Select-Object -Last $Tail
}

Write-Output ("Matched events: {0}" -f @($filtered).Count)
foreach ($item in $filtered) {
  $item | ConvertTo-Json -Compress -Depth 10 | Write-Output
}
