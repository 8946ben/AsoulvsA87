<#
.SYNOPSIS
    A-SOUL 同人游戏素材抓取工具（萌娘百科源）

.DESCRIPTION
    按 $Targets 清单抓取页面、提取图片链接、过滤无效资源后下载，
    并生成 manifest.csv 记录每张图的来源，便于后续溯源与筛选。

    !! 素材仅用于个人学习与非商业同人创作，请勿用于商业用途。!!

.EXAMPLE
    .\fetch_moegirl.ps1
    .\fetch_moegirl.ps1 -MinBytes 20000    # 只要更大的图
#>
param(
    [string]$Root = "reference",
    [int]$MinBytes = 8000
)

$ErrorActionPreference = 'Continue'
$ProgressPreference   = 'SilentlyContinue'

$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# 目标页面 -> 输出子目录。新增角色只需往这里追加一行。
$Targets = @(
    @{ Dir = 'plants/idols'; Url = 'https://zh.moegirl.org.cn/A-SOUL' }
    @{ Dir = 'plants/idols'; Url = 'https://zh.moegirl.org.cn/' + [uri]::EscapeDataString('向晚') }
    @{ Dir = 'plants/idols'; Url = 'https://zh.moegirl.org.cn/' + [uri]::EscapeDataString('贝拉') }
    @{ Dir = 'plants/idols'; Url = 'https://zh.moegirl.org.cn/' + [uri]::EscapeDataString('珈乐') }
    @{ Dir = 'plants/idols'; Url = 'https://zh.moegirl.org.cn/' + [uri]::EscapeDataString('嘉然') }
    @{ Dir = 'plants/idols'; Url = 'https://zh.moegirl.org.cn/' + [uri]::EscapeDataString('乃琳') }
    @{ Dir = 'plants/idols'; Url = 'https://zh.moegirl.org.cn/' + [uri]::EscapeDataString('心宜') }
    @{ Dir = 'plants/idols'; Url = 'https://zh.moegirl.org.cn/' + [uri]::EscapeDataString('思诺') }
    @{ Dir = 'plants/fans';  Url = 'https://zh.moegirl.org.cn/' + [uri]::EscapeDataString('阿草') }
    @{ Dir = 'zombies/misc'; Url = 'https://zh.moegirl.org.cn/' + [uri]::EscapeDataString('枝江娱乐') }
    @{ Dir = 'zombies/misc'; Url = 'https://zh.moegirl.org.cn/A-SOUL/' + [uri]::EscapeDataString('同人作品') }
)

$manifest = New-Object System.Collections.ArrayList

function Get-ImgUrls {
    param([string]$PageUrl)
    $headers = @{ 'User-Agent' = $UA; 'Referer' = 'https://zh.moegirl.org.cn/' }
    try {
        $r = Invoke-WebRequest -Uri $PageUrl -Headers $headers -TimeoutSec 30 -UseBasicParsing
    } catch {
        Write-Host "  [FAIL] $PageUrl => $($_.Exception.Message)" -ForegroundColor DarkRed
        return @()
    }
    $m = [regex]::Matches($r.Content, 'https?://[^\s"''<>]+\.(?:png|jpg|jpeg|gif|webp|bmp)')
    return @($m | ForEach-Object { $_.Value } | Select-Object -Unique)
}

function Test-Useless {
    param([string]$Url)
    return (
        $Url -match '/(logo|favicon)/' -or
        $Url -match 'avatars/' -or
        $Url -match 'zhMoegirl\d' -or
        $Url -match 'latest\.png'
    )
}

function New-SafeName {
    param([string]$Url)
    $name = [System.Uri]::UnescapeDataString(([System.Uri]$Url).AbsolutePath.Split('/')[-1])
    return ($name -replace '[\\/:*?"<>|]', '_')
}

foreach ($t in $Targets) {
    $dir = Join-Path $Root $t.Dir
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    Write-Host ">> $($t.Url)" -ForegroundColor Cyan
    $urls = Get-ImgUrls $t.Url
    $urls = $urls | Where-Object {
        $_ -like '*storage.moegirl.org.cn*' -and -not (Test-Useless $_)
    }
    Write-Host "   候选 $($urls.Count) 张"

    foreach ($u in $urls) {
        $name = New-SafeName $u
        $out  = Join-Path $dir $name
        if (Test-Path $out) { continue }

        try {
            Invoke-WebRequest -Uri $u `
                -Headers @{ 'User-Agent' = $UA; 'Referer' = $t.Url } `
                -OutFile $out -UseBasicParsing -TimeoutSec 40
        } catch {
            continue
        }

        if ((Get-Item $out).Length -lt $MinBytes) {
            Remove-Item $out -Force
            continue
        }

        [void]$manifest.Add([pscustomobject]@{
            File   = $name
            Dir    = $t.Dir
            Source = $t.Url
            Url    = $u
        })
        Write-Host "   + $name" -ForegroundColor Green
    }
}

$csvPath = Join-Path $Root 'manifest.csv'
$manifest | Export-Csv $csvPath -NoTypeInformation -Encoding UTF8
Write-Host ''
Write-Host "完成：共 $($manifest.Count) 张，清单见 $csvPath" -ForegroundColor Yellow
