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

$runtimePackage = [ordered]@{
  name = 'asoul-vs-a87'
  productName = 'AsoulvsA87'
  version = '0.1.0'
  main = 'electron/main.cjs'
  description = 'A-SOUL 同人塔防游戏'
}
$runtimePackage | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $stagingDir 'package.json') -Encoding UTF8

Write-Host "Portable staging directory prepared: $stagingDir"
