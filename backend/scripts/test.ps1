$ErrorActionPreference = "Stop"

Write-Host "Rebuilding better-sqlite3 for current Node ABI..."
npm rebuild better-sqlite3
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "Running backend tests..."
npm test
exit $LASTEXITCODE
