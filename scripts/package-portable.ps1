$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$packageDir = Join-Path $projectRoot 'out\defenseZJ-win32-x64'
$releaseDir = Join-Path $projectRoot 'release'
# Zip name carries the version; single source of truth is "version" in the root package.json.
# Read it as UTF8 explicitly: the default ANSI decoding mangles CJK text and breaks JSON parsing.
$version = (Get-Content (Join-Path $projectRoot 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
$zipPath = Join-Path $releaseDir "defenseZJ-Windows-x64-v$version.zip"
$exePath = Join-Path $packageDir 'defenseZJ.exe'

if (-not (Test-Path -LiteralPath $exePath)) {
  throw "Portable executable was not generated: $exePath"
}

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $packageDir '*') -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "Portable package created: $zipPath"
