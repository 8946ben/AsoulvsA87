# 建目录：角色设定 + 表情包
$ErrorActionPreference = 'Stop'

$dirs = @(
    '角色设定\心宜',
    '角色设定\思诺',
    '表情包\A-SOUL通用',
    '表情包\心宜',
    '表情包\思诺',
    '表情包\粉丝形象'
)

foreach ($d in $dirs) {
    New-Item -ItemType Directory -Path $d -Force | Out-Null
    Write-Output "OK  $d"
}

Write-Output ''
Write-Output '--- 当前结构 ---'
Get-ChildItem -Directory | Where-Object { $_.Name -in @('角色设定', '表情包') } | ForEach-Object {
    $parent = $_.Name
    Get-ChildItem $_.FullName -Directory | ForEach-Object {
        Write-Output "  $parent / $($_.Name)"
    }
}
