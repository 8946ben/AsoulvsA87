# A-SOUL vs A87

一款使用 Phaser 3、TypeScript、Vite 和 Electron 制作的 A-SOUL 同人塔防游戏。

游戏玩法参考《植物大战僵尸》：进入关卡前选择角色卡，在舞台格子上部署我方角色，抵挡从右侧进入的 A87。当前包含闯关与肉鸽两种模式，以及选卡、图鉴、融合角色、商店、开发者模式和 Windows 免安装打包流程。

### 游戏模式

- **闯关模式**：原有 12 幕关卡现收录为第一章“枝江初巡”。旧版 `asoul-stage-progress-v1` 通关进度会自动迁移到章节进度，不会丢档。
- **肉鸽模式 · 集成巡演**：选择初始小队后，在三段随机路线中依次完成作战、紧急作战、偶遇、休整和商店节点，最终完成区域终演。公开招募和收藏品作为作战奖励或部分偶遇事件的奖励出现，不单独占用路线节点。

肉鸽局内拥有独立的生命值、应援值、门票、探索等级、角色阶级和收藏品。每次节点选择与结算都会自动保存；从主界面再次进入肉鸽模式即可继续当前巡演。肉鸽失败或胜利不会改写闯关通关进度与金币。

肉鸽角色采用招募进阶：首次招募为 `Rank I`，多段特性角色再次招募后成为 `Rank II`。闯关模式仍直接使用角色完整特性。融合角色需要同时满足永久科技树配方和本局招募许可，进阶后才会开放完整概率特性与场上联动。

作战胜利后的奖励不是三选一：门票、应援值和经验会直接结算，随后统一恢复 3 点生命值，再依次结算一件收藏品和一次公开招募机会。收藏品需要从本次候选中选择一件，但不会因此失去后续公开招募。

## 直接游玩（普通玩家）

从发布者处取得 `AsoulvsA87-Windows-x64.zip` 后：

1. 将 ZIP **完整解压**到一个普通文件夹。
2. 打开解压后的文件夹。
3. 双击 `AsoulvsA87.exe`。

便携版不需要安装 Node.js，也不需要运行安装程序。

> 不要只把 `AsoulvsA87.exe` 单独复制出去。程序还需要同目录下的 DLL、`resources` 等文件，必须保留完整的解压目录。

Windows 首次运行未知来源的程序时，可能显示安全提示。请确认文件来自可信发布者后再选择运行。

### 基本操作

- 鼠标：选择角色卡、部署角色、拾取阳光、操作界面按钮。
- 铲子：点击战斗界面右上方的“铲子”，再点击需要移除的角色。
- `空格`：暂停或继续游戏。
- 暂停菜单：可以继续、重新开始本关或返回主界面。
- `Esc`：取消当前角色卡或铲子选择；在选关、选卡、图鉴等页面返回上一层。
- `Enter`：在选卡页面确认阵容并开始战斗。
- 图鉴中使用 `Tab` 切换我方/敌方，使用左右方向键翻页。

### 开发者模式

在主界面点击“开发者模式”，输入口令 `ftqd` 并按回车。开发者模式只在当前程序会话内生效，可以进入任意关卡，且不会改写正常通关进度。

## 开发环境

以下内容面向需要修改游戏的开发者。

### 环境要求

- Windows 10/11 64 位。
- [Node.js](https://nodejs.org/) 20 或更高版本，推荐使用当前 LTS 版本。
- npm（安装 Node.js 时会一并安装）。
- PowerShell 5.1 或更高版本。

在 PowerShell 中检查环境：

```powershell
node --version
npm --version
```

### 首次安装依赖

进入项目主目录后执行：

```powershell
npm ci
```

`npm ci` 会严格按照 `package-lock.json` 安装依赖，适合刚克隆项目或重新配置环境。如果主动修改了依赖版本，请使用 `npm install` 更新依赖及锁文件。

### 启动开发版

浏览器开发模式（支持热更新，适合日常修改）：

```powershell
npm run dev
```

终端会显示本地访问地址，通常为 `http://localhost:5173`。保持终端运行，在浏览器中打开该地址即可。修改代码或资源后，页面通常会自动刷新。

以 Electron 桌面窗口测试：

```powershell
npm run electron:start
```

该命令会先进行正式构建，再启动桌面版。它更接近最终交付给玩家的运行环境。

## 项目结构与修改位置

```text
asoulVsA87/
├─ src/                    游戏 TypeScript 源码
│  ├─ data/               我方、敌方、关卡和科技树数据
│  ├─ entities/           角色、敌人、弹道、阳光等战斗逻辑
│  ├─ scenes/             主界面、选关、选卡、图鉴、战斗等页面
│  ├─ core/               网格、进度、金币、开发者模式等通用逻辑
│  └─ ui/                 卡槽和主题 UI
├─ public/images/          游戏正式图片资源
├─ electron/main.cjs       Windows 桌面程序入口
├─ scripts/                便携版打包脚本
├─ background.md           玩法、角色和关卡设计设定
├─ package.json            npm 命令和依赖配置
└─ vite.config.ts          Web 构建配置
```

常见修改入口：

- 修改我方角色数值或卡牌配置：`src/data/plants.ts`
- 修改敌人数据：`src/data/zombies.ts`
- 修改关卡波次、选卡数量和初始阳光：`src/data/levels.ts`
- 修改闯关章节：`src/data/campaign.ts`
- 修改肉鸽区域、节点、收藏品与动态战斗：`src/data/rogue.ts`
- 修改肉鸽存档、资源、招募和结算状态机：`src/core/RogueRun.ts`
- 修改角色战斗机制：`src/entities/Plant.ts`
- 修改敌人行动、攻击和特殊能力：`src/entities/Zombie.ts`
- 修改战斗流程和接触判定：`src/scenes/GameScene.ts`
- 修改图鉴布局和展示顺序：`src/scenes/CodexScene.ts`
- 修改正式立绘或敌人图片：`public/images/`

正式图片请放在 `public/images` 中，并在加载资源的代码中使用对应文件名。不要把正式资源只放在项目根目录：根目录 PNG 默认被 `.gitignore` 视为过程截图，不会进入版本控制和发布包。

修改 `background.md` 本身不会自动改变游戏；设定最终仍需同步到 `src/data`、`src/entities` 或相关场景代码中。

## 修改后的检查流程

建议每次完成一组修改后依次执行：

```powershell
npm run typecheck
npm run build
```

- `npm run typecheck`：只检查 TypeScript 类型，不生成文件。
- `npm run build`：执行类型检查并生成正式 Web 资源到 `dist/`。

随后可运行：

```powershell
npm run electron:start
```

重点试玩受修改影响的内容，例如部署、形态切换、伤害结算、暂停、重新开始、选关、图鉴翻页，以及肉鸽模式的“新建一局 → 选择路线 → 战前选卡 → 战后奖励 → 退出后继续”。构建成功只能说明代码和资源可以被打包，不能代替实际玩法测试。

## 打包 Windows 免安装版

### 一键生成可分享的 ZIP

在项目主目录运行：

```powershell
npm run portable:win
```

脚本会依次：

1. 检查 TypeScript 并构建前端到 `dist/`。
2. 准备只包含运行所需文件的临时目录 `.portable-app/`。
3. 生成可运行目录 `out/AsoulvsA87-win32-x64/`。
4. 将整个运行目录压缩为：

```text
release/AsoulvsA87-Windows-x64.zip
```

将这个 ZIP 发给其他 Windows 用户即可。对方完整解压后双击 `AsoulvsA87.exe`，不需要安装 Node.js。

每次重新运行 `npm run portable:win`，旧的同名输出目录和 ZIP 会被脚本安全覆盖，因此修改游戏后直接再次执行该命令即可。

### 只生成未压缩的运行目录

如需先检查目录版而不生成 ZIP：

```powershell
npm run package:win
```

输出位置：

```text
out/AsoulvsA87-win32-x64/AsoulvsA87.exe
```

建议先运行这里的 EXE 完成一次冒烟测试，再执行 `npm run portable:win` 生成分享包。

### 打包后建议检查

1. 完全退出仍在运行的旧版本游戏。
2. 删除或移走以前解压的测试目录，避免误开旧版。
3. 解压新生成的 `release/AsoulvsA87-Windows-x64.zip`。
4. 双击其中的 `AsoulvsA87.exe`。
5. 确认主界面、图鉴、选关、选卡和战斗均能进入。
6. 实测本次修改涉及的角色或敌人机制。

## 更新日志

### 肉鸽模式开发版（2026-08-31）

- 新增“闯关模式 / 肉鸽模式”入口；原 12 幕整理为闯关第一章，并兼容旧通关存档
- 新增三段种子化路线、分支节点、自动续局、局内生命值/应援值/门票/等级资源
- 新增初始小队、公开招募、Rank I/II 进阶、融合许可、收藏品、事件、休整、商店、战后全量奖励和本局结算；招募与收藏品不作为独立路线节点
- 乃琳 Rank I 保留穿透攻击与番茄牛肉汤地刺，Rank II 解锁奶淇琳奶油概率光环；嘉然 Rank I 保留三连发与近距五倍攻速，Rank II 解锁嘉心糖支援加成
- 闯关模式保持完整角色特性；肉鸽战斗结果独立结算，不写入闯关金币与通关进度

### asoulvsa87_1.0_preview（2026-08-30）

首个预览版。

- 12 幕冒险关卡：旗帜大波按 PVZ 节奏均匀分布，第 12 幕为 Boss 关，神区化龙压轴（其余关卡不再出场）
- 角色机制：贝拉锤雷变阵、乃琳穿透/番茄牛肉汤地刺形态（免啃食、仅车碾可毁）、嘉然距离攻速三连发，以及贝拉/乃琳/嘉然的在场联动增益
- 融合系统：星空糖、喜拉乃、嘉心奶糖三张二重融合卡与三重融合「一个魂」，配方需在枝江商店用金币解锁
- 金币经济：每关通关固定掉落 60 金币，每保留一辆完整小车（最终防线）额外 +15
- Boss 机制：神区化龙换道穿透射线与召唤刷手机 A87；黑化珈乐游走召唤（彩蛋单位，不在冒险关卡出场）
- 枝江图鉴：双方单位数值与语录展示；角色立绘按 2 倍精度渲染
- Windows 免安装打包流程（`npm run portable:win`）

## npm 命令速查

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动浏览器开发服务器和热更新 |
| `npm run typecheck` | 检查 TypeScript 类型 |
| `npm run build` | 生成正式 Web 构建到 `dist/` |
| `npm run preview` | 在本地预览 `dist/` 构建 |
| `npm run electron:start` | 构建并启动 Electron 桌面版 |
| `npm run package:win` | 生成未压缩的 Windows 便携目录 |
| `npm run portable:win` | 生成最终可分享的 Windows ZIP |

## 常见问题

### `npm ci` 或 Electron 下载失败

首次安装依赖需要访问 npm 软件源。请检查网络、代理和 npm 源设置，然后重新运行：

```powershell
npm ci
```

若依赖目录存在，但提示缺少 Electron Windows 运行时，可执行：

```powershell
node node_modules/electron/install.js
```

完成后重新运行 `npm run portable:win`。打包脚本也会尝试使用本机 Electron 缓存中已有的 64 位 Windows 运行时。

### 提示 PowerShell 禁止运行脚本

项目的 npm 命令已经通过 `-ExecutionPolicy Bypass` 启动内部打包脚本。请优先执行 `npm run portable:win`，不要直接双击 `.ps1` 文件。

### 打包时提示文件被占用

请退出所有正在运行的 `AsoulvsA87.exe`，关闭打开在 `out` 或 `release` 目录中的压缩软件窗口，然后重新打包。

### 玩家双击 EXE 后无法运行

确认玩家已经完整解压 ZIP，而不是直接在压缩软件中运行，也没有只复制 EXE。建议把完整目录解压到不受权限限制的位置，例如桌面或文档目录。

### 如何清理构建产物

`dist/`、`.portable-app/`、`out/` 和 `release/` 都是可重新生成的构建产物。通常不需要手动删除；重新打包会更新相应输出。若确实要清理，请先确认游戏和相关终端已经退出，并只删除这些明确的目录，不要删除 `src/`、`public/`、`electron/` 或 `scripts/`。

## 提交修改前建议

提交 Git 版本前至少执行：

```powershell
npm run typecheck
npm run build
git status
```

确认正式图片位于 `public/images`，并检查 `git status` 中没有误加入过程截图、临时日志、`out` 或 `release`。大型资源会显著增加仓库和发布包体积，添加前应确认游戏确实会使用它们。
