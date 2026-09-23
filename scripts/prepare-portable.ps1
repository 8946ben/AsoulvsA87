$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$stagingDir = Join-Path $projectRoot '.portable-app'

if ((Split-Path -Parent $stagingDir) -ne $projectRoot -or (Split-Path -Leaf $stagingDir) -ne '.portable-app') {
  throw "Unexpected portable staging path: $stagingDir"
}

if (Test-Path -LiteralPath $stagingDir) {
  Remove-Item -LiteralPath $stagingDir -Recurse -Force
}

New-Item -ItemType Directory -Path $stagingDir | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'dist') -Destination $stagingDir -Recurse
Copy-Item -LiteralPath (Join-Path $projectRoot 'electron') -Destination $stagingDir -Recurse

# -Encoding UTF8: the default ANSI decoding mangles CJK text and breaks JSON parsing.
# Keep this file ASCII-only: PowerShell 5.1 reads BOM-less scripts as ANSI.
$manifest = Get-Content (Join-Path $projectRoot 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$runtimePackage = [ordered]@{
  name = 'asoul-vs-a87'
  productName = 'defenseZJ'
  version = $manifest.version
  main = 'electron/main.cjs'
  description = 'A-SOUL 同人塔防游戏'
}
$runtimePackage | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $stagingDir 'package.json') -Encoding UTF8

Write-Host "Portable staging directory prepared: $stagingDir"
