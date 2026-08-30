$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$packageDir = Join-Path $projectRoot 'out\AsoulvsA87-win32-x64'
$releaseDir = Join-Path $projectRoot 'release'
$zipPath = Join-Path $releaseDir 'AsoulvsA87-Windows-x64.zip'
$exePath = Join-Path $packageDir 'AsoulvsA87.exe'

if (-not (Test-Path -LiteralPath $exePath)) {
  throw "Portable executable was not generated: $exePath"
}

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $packageDir '*') -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "Portable package created: $zipPath"
