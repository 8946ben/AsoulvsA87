<#
.SYNOPSIS
    按文件名关键词把散落的素材归档到角色目录。

.DESCRIPTION
    抓取到的素材文件名通常自带角色名（如「珈乐_泳装1.png」「Q_Diana.webp」），
    本脚本据此把根目录里的图片分发到对应的分类子目录，便于人工筛选。

    新增角色/分类时，往 $Rules 里加一行即可（顺序敏感，命中即停）。

.EXAMPLE
    .\organize.ps1
    .\organize.ps1 -Root 'reference'
#>
param([string]$Root = '.')

$ErrorActionPreference = 'Continue'

# 匹配规则：正则 -> 目标目录（按顺序匹配，命中即停）
$Rules = @(
    @{ Re = 'Q_|_3d_preview|Q版';        Dest = 'plants\chibi'  }
    @{ Re = '珈乐|Carol';                Dest = 'plants\idols'  }
    @{ Re = '乃琳|Eileen|Queen';         Dest = 'plants\idols'  }
    @{ Re = '嘉然|Diana';                Dest = 'plants\idols'  }
    @{ Re = '向晚|Ava';                  Dest = 'plants\idols'  }
    @{ Re = '贝拉|Bella';                Dest = 'plants\idols'  }
    @{ Re = '心宜|Fiona';                Dest = 'plants\idols'  }
    @{ Re = '思诺|Gladys';               Dest = 'plants\idols'  }
    @{ Re = '来芙|Laffey';               Dest = 'plants\idols'  }
    @{ Re = '阿草';                      Dest = 'plants\fans'   }
    @{ Re = 'Logo|海报|阵营|血色|绽放|共鸣|闪耀|Xllzz|Emoji'; Dest = 'zombies\misc' }
)

$files = Get-ChildItem -Path $Root -File | Where-Object {
    $_.Extension -in '.png', '.jpg', '.jpeg', '.webp', '.gif'
}

$count = 0
foreach ($f in $files) {
    $dest = '_unsorted'
    foreach ($r in $Rules) {
        if ($f.Name -match $r.Re) { $dest = $r.Dest; break }
    }
    if (-not (Test-Path $dest)) {
        New-Item -ItemType Directory -Path $dest -Force | Out-Null
    }
    Move-Item $f.FullName (Join-Path $dest $f.Name) -Force
    $count++
}

Write-Host "已归档 $count 个文件"
