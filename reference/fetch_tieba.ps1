<#
.SYNOPSIS
    批量抓取百度贴吧帖子中的图片素材。

.DESCRIPTION
    依赖一个已登录的 playwright-cli 浏览器会话（贴吧对未登录/自动化请求返回 403）。
    会话需事先以有头模式打开并登录，cookie 保存在持久化 profile 中：

        playwright-cli -s=asoul open https://tieba.baidu.com/f?kw=asoul --browser=msedge --persistent --headed

    脚本逐个访问帖子，提取楼层图片并下载；缩略图 URL 会自动还原为原图地址。

    !! 素材仅用于个人学习与非商业同人创作，请勿用于商业用途。!!

.EXAMPLE
    .\fetch_tieba.ps1
    .\fetch_tieba.ps1 -Threads 'https://tieba.baidu.com/p/123456'
#>
param(
    [string[]]$Threads = @(
        'https://tieba.baidu.com/p/10519709146',
        'https://tieba.baidu.com/p/10798038925',
        'https://tieba.baidu.com/p/10970558291',
        'https://tieba.baidu.com/p/10969383169',
        'https://tieba.baidu.com/p/10969108911',
        'https://tieba.baidu.com/p/10968918991',
        'https://tieba.baidu.com/p/10967970098',
        'https://tieba.baidu.com/p/10966920695'
    ),
    [string]$OutDir  = 'reference\_tieba',
    [string]$Session = 'asoul',
    # 头像多为 120x120 小图，用体积下限过滤
    [int]$MinBytes   = 20000
)

$ErrorActionPreference = 'Continue'
$ProgressPreference   = 'SilentlyContinue'
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# 楼层图片：优先 data-src（懒加载原图），退回 src；
# 顺带剔除 w=120;h=120 这类头像缩略图
$expr = "Array.from(document.querySelectorAll('img')).map(i=>i.getAttribute('data-src')||i.src).filter(s=>s&&(s.indexOf('tiebapic')>=0||s.indexOf('imgsrc')>=0)&&s.indexOf('w%3D120%3Bh%3D120')<0).join('\n')"

# 贴吧图片有防盗链：缺 cookie 会返回同一张占位图（有效 JPEG 但内容恒定）
# 因此先从已登录的浏览器会话导出 cookie，后续下载全部带上
Write-Host '导出浏览器登录态 ...' -ForegroundColor Cyan
$ckRaw = (& playwright-cli "-s=$Session" cookie-list 2>&1) | Out-String
$cookiePairs = @()
foreach ($line in ($ckRaw -split "`r?`n")) {
    if ($line -match '^(.+?)=(.*?)\s+\(domain:') {
        $cookiePairs += ($Matches[1] + '=' + $Matches[2])
    }
}
$cookieHeader = $cookiePairs -join '; '
Write-Host ('   cookie 项: ' + $cookiePairs.Count) -ForegroundColor DarkGray

$total = 0

foreach ($url in $Threads) {
    $tid = 'unknown'
    if ($url -match '/p/(\d+)') { $tid = $Matches[1] }

    $dir = Join-Path $OutDir $tid
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    Write-Host ">> $url" -ForegroundColor Cyan

    & playwright-cli "-s=$Session" goto $url 2>&1 | Out-Null
    Start-Sleep -Seconds 5

    # 滚到底触发楼层懒加载，否则只能拿到首屏
    & playwright-cli "-s=$Session" eval "window.scrollTo(0, document.body.scrollHeight); 'ok'" 2>&1 | Out-Null
    Start-Sleep -Seconds 2

    $raw = (& playwright-cli "-s=$Session" eval $expr 2>&1) | Out-String

    # 直接从输出文本里抓 URL，规避 JSON 转义
    $urls = [regex]::Matches($raw, 'https?://(?:tiebapic|imgsrc)\.baidu\.com[^"''\\ ]+') |
             ForEach-Object { $_.Value -replace '\\/', '/' } |
             Select-Object -Unique

    if (-not $urls -or $urls.Count -eq 0) {
        Write-Host ('   (no images) rawLen=' + $raw.Length) -ForegroundColor DarkGray
        if ($raw.Length -gt 0) {
            Write-Host ('   [raw] ' + $raw.Substring(0, [Math]::Min(300, $raw.Length))) -ForegroundColor DarkYellow
        }
        continue
    }

    $k = 0
    foreach ($u in $urls) {
        # 必须保留 ?tbpicau= 防盗链 token：剥离后服务器只返回 4262 字节占位图
        $clean = $u
        # 缩略图还原为原图：/forum/<尺寸>/sign=<签名>/  ->  /forum/pic/item/
        $clean = $clean -replace '(tiebapic|imgsrc)\.baidu\.com/forum/[^/]+/sign=[^/]+/', '$1.baidu.com/forum/pic/item/'

        $ext = '.jpg'
        if ($clean -match '\.(png|gif|jpeg|webp)(\?|$)') { $ext = '.' + $Matches[1] }

        $k++
        $file = Join-Path $dir ('tieba_' + $tid + '_' + $k.ToString('D3') + $ext)

        $ok = $false
        try {
            Invoke-WebRequest -Uri $clean -Headers @{ 'User-Agent' = $UA; 'Referer' = $url; 'Cookie' = $cookieHeader } -OutFile $file -UseBasicParsing -TimeoutSec 45
            $ok = $true
        } catch {
            # 原图地址失败则退回原始 URL（同样保留 token）
            try {
                Invoke-WebRequest -Uri $u -Headers @{ 'User-Agent' = $UA; 'Referer' = $url; 'Cookie' = $cookieHeader } -OutFile $file -UseBasicParsing -TimeoutSec 45
                $ok = $true
            } catch { }
        }

        if (-not $ok) { continue }
        if ((Get-Item $file).Length -lt $MinBytes) { Remove-Item $file -Force; continue }

        $total++
        Write-Host "   + $((Get-Item $file).Name)" -ForegroundColor Green
    }
}

Write-Host ''
Write-Host "完成：共 $total 张，目录 $OutDir" -ForegroundColor Yellow
