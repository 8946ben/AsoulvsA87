$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$stagingDir = Join-Path $projectRoot '.portable-app'
$electronDir = Join-Path $projectRoot 'node_modules\electron\dist'
$electronCache = Join-Path $env:LOCALAPPDATA 'electron\Cache'
$outputRoot = Join-Path $projectRoot 'out'
$outputDir = Join-Path $outputRoot 'AsoulvsA87-win32-x64'

if ((Split-Path -Parent $outputDir) -ne $outputRoot -or (Split-Path -Leaf $outputDir) -ne 'AsoulvsA87-win32-x64') {
  throw "Unexpected portable output path: $outputDir"
}
if (-not (Test-Path -LiteralPath (Join-Path $stagingDir 'package.json'))) {
  throw "Portable staging directory is missing: $stagingDir"
}

if (Test-Path -LiteralPath $outputDir) {
  Remove-Item -LiteralPath $outputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

if (Test-Path -LiteralPath (Join-Path $electronDir 'electron.exe')) {
  Copy-Item -Path (Join-Path $electronDir '*') -Destination $outputDir -Recurse -Force
} else {
  $cachedZip = Get-ChildItem -LiteralPath $electronCache -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^electron-v\d+\.\d+\.\d+-win32-x64\.zip$' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (-not $cachedZip) {
    throw "Electron Windows runtime is missing. Run: node node_modules/electron/install.js"
  }
  Write-Host "Using cached Electron runtime: $($cachedZip.FullName)"
  Expand-Archive -LiteralPath $cachedZip.FullName -DestinationPath $outputDir -Force
}

$electronExe = Join-Path $outputDir 'electron.exe'
$gameExe = Join-Path $outputDir 'AsoulvsA87.exe'
Move-Item -LiteralPath $electronExe -Destination $gameExe -Force

$resourcesDir = Join-Path $outputDir 'resources'
$defaultApp = Join-Path $resourcesDir 'default_app.asar'
if (Test-Path -LiteralPath $defaultApp) {
  Remove-Item -LiteralPath $defaultApp -Force
}
$appDir = Join-Path $resourcesDir 'app'
New-Item -ItemType Directory -Path $appDir -Force | Out-Null
Copy-Item -Path (Join-Path $stagingDir '*') -Destination $appDir -Recurse -Force

Write-Host "Portable application directory created: $outputDir"
