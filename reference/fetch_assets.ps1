<#
.SYNOPSIS
    Fetch character art and emoji/sticker packs for the A-SOUL fan game.

.NOTES
    ASCII-only on purpose: PowerShell 5.1 reads .ps1 as ANSI/GBK unless the
    file has a UTF-8 BOM, so non-ASCII literals get mangled. Keeping this file
    pure ASCII avoids that entirely.

    Sources are public fan/doujin material. Personal, non-commercial use only.
#>
param(
    [int]$MinBytes = 3000
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

# Moegirl requires TLS 1.2 explicitly; without this the handshake fails with
# "the underlying connection was closed".
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# url -> output dir (relative to this script's folder)
$Targets = @(
    # --- character reference sheets -------------------------------------
    # URLs are pre-encoded (UTF-8 percent-encoding) so this file stays ASCII.
    #   xinyi  = %E5%BF%83%E5%AE%9C
    #   sinuo  = %E6%80%9D%E8%AF%BA
    #   acao   = %E9%98%BF%E8%8D%89
    @{ Dir = 'characters\xinyi'; Url = 'https://zh.moegirl.org.cn/%E5%BF%83%E5%AE%9C' }
    @{ Dir = 'characters\sinuo'; Url = 'https://zh.moegirl.org.cn/%E6%80%9D%E8%AF%BA' }
    # --- emoji / sticker packs ------------------------------------------
    # cv14946811: official A-SOUL sticker pack, 648x648 PNG, all five gen-1 members
    @{ Dir = 'emoji\asoul';     Url = 'https://www.bilibili.com/read/cv14946811/' }
    # cv42111460: Xinyi + Sinuo collectible-card sticker set
    @{ Dir = 'emoji\xinyi';     Url = 'https://www.bilibili.com/read/cv42111460/' }
    # 1072383914312466439: Xinyi + Sinuo "Shuang Sheng Xun Meng" collectible art
    @{ Dir = 'emoji\sinuo';     Url = 'https://www.bilibili.com/opus/1072383914312466439' }
    # 657497722800046112: idol x fan-mascot pairing set (Beijixing / Jiaxintang etc.)
    @{ Dir = 'emoji\fans';      Url = 'https://www.bilibili.com/opus/657497722800046112' }
    # 1006376344301338649: "let's make stickers together" stream archive
    @{ Dir = 'emoji\asoul';     Url = 'https://www.bilibili.com/opus/1006376344301338649' }
    @{ Dir = 'emoji\fans';      Url = 'https://zh.moegirl.org.cn/%E9%98%BF%E8%8D%89' }

    # --- fan-group mascots (one page per fandom, if it exists) -----------
    #   dingwanren  = %E9%A1%B6%E7%A2%97%E4%BA%BA   (Ava  -> top-bowl person)
    #   huangjiaqishi = %E7%9A%87%E7%8F%88%E9%AA%91%E5%A3%AB (Carol -> royal knight)
    #   beijixing   = %E8%B4%9D%E6%9E%81%E6%98%9F   (Bella -> polaris)
    #   jiaxintang  = %E5%98%89%E5%BF%83%E7%B3%96   (Diana -> candy)
    #   naiqilin    = %E5%A5%B6%E6%B7%87%E7%90%B3   (Eileen -> ice cream)
    @{ Dir = 'emoji\fans';      Url = 'https://zh.moegirl.org.cn/%E9%A1%B6%E7%A2%97%E4%BA%BA' }
    @{ Dir = 'emoji\fans';      Url = 'https://zh.moegirl.org.cn/%E7%9A%87%E7%8F%88%E9%AA%91%E5%A3%AB' }
    @{ Dir = 'emoji\fans';      Url = 'https://zh.moegirl.org.cn/%E8%B4%9D%E6%9E%81%E6%98%9F' }
    @{ Dir = 'emoji\fans';      Url = 'https://zh.moegirl.org.cn/%E5%98%89%E5%BF%83%E7%B3%96' }
    @{ Dir = 'emoji\fans';      Url = 'https://zh.moegirl.org.cn/%E5%A5%B6%E6%B7%87%E7%90%B3' }
    # --- group + fan-site pages ------------------------------------------
    @{ Dir = 'emoji\fans';      Url = 'https://zh.moegirl.org.cn/A-SOUL' }
    @{ Dir = 'characters\xinyi'; Url = 'https://fionagladys.com/start' }
    @{ Dir = 'emoji\asoul';     Url = 'https://www.bilibili.com/read/cv14661885/' }
)

$manifest = New-Object System.Collections.ArrayList

function Get-ImgUrls {
    param([string] $PageUrl)

    $headers = @{ 'User-Agent' = $UA; 'Referer' = $PageUrl }
    try {
        $r = Invoke-WebRequest -Uri $PageUrl -Headers $headers -TimeoutSec 30 -UseBasicParsing
    } catch {
        Write-Host "  [FAIL] $PageUrl => $($_.Exception.Message)" -ForegroundColor DarkRed
        return @()
    }

    # protocol-relative urls need a scheme before [System.Uri] can parse them
    $html = $r.Content -replace '(src|href|data-src)="//', '$1="https://'

    $m = [regex]::Matches($html, 'https?://[^\s"''<>()]+\.(?:png|jpg|jpeg|gif|webp)')
    return @($m | ForEach-Object { $_.Value } | Select-Object -Unique)
}

function Test-Useless {
    param([string] $Url)
    return (
        $Url -match '/(logo|favicon|icon)/' -or
        $Url -match 'avatars?/' -or
        $Url -match 'zhMoegirl\d' -or
        $Url -match 'latest\.png' -or
        $Url -match 's\d+\.hdslb\.com/bfs/static' -or
        $Url -match '/bfs/(face|member|live)/'
    )
}

function New-SafeName {
    param([string] $Url)
    $uri  = [System.Uri] $Url
    $name = [System.Uri]::UnescapeDataString($uri.AbsolutePath.Split('/')[-1])
    if ([string]::IsNullOrWhiteSpace($name)) { $name = [System.Guid]::NewGuid().ToString('N').Substring(0, 12) }
    return ($name -replace '[^A-Za-z0-9._-]', '_')
}

foreach ($t in $Targets) {
    $dir = Join-Path $PSScriptRoot $t.Dir
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    Write-Host ">> $($t.Url)" -ForegroundColor Cyan
    $urls = Get-ImgUrls $t.Url
    $urls = $urls | Where-Object { -not (Test-Useless $_) }
    Write-Host "   candidates: $($urls.Count)"

    foreach ($u in $urls) {
        $name = New-SafeName $u
        $out  = Join-Path $dir $name
        if (Test-Path $out) { continue }

        try {
            Invoke-WebRequest -Uri $u `
                -Headers @{ 'User-Agent' = $UA; 'Referer' = $t.Url } `
                -OutFile $out -UseBasicParsing -TimeoutSec 45
        } catch {
            continue
        }

        if (-not (Test-Path $out) -or (Get-Item $out).Length -lt $MinBytes) {
            Remove-Item $out -Force -ErrorAction SilentlyContinue
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

$csvPath = Join-Path $PSScriptRoot 'manifest_assets.csv'
$manifest | Export-Csv $csvPath -NoTypeInformation -Encoding UTF8
Write-Host ''
Write-Host "Done: $($manifest.Count) files -> $csvPath" -ForegroundColor Yellow
