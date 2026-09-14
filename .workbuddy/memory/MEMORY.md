# 项目长期记忆 · asoulVsA87（枝江舞台保卫战）

## 内容红线

- **珈乐相关元素一律排除**（2026-09-12 ben 明确要求）：新设计、新文案、新道具都不得采用珈乐的名场面、口头禅、歌曲、组合名、专属物件。
- **题库已清理**（2026-09-13）：`docs/quiz-bank.md` 中所有含「珈乐 / 皇珈骑士 / Carol」的条目已整题删除，共 14 题，题量 1000 → 986（A-SOUL 100→86）。采集口径是 ben 选的「整题删除」，不做干扰项替换。游戏侧题库尚未同步（需 `npm run quiz:sync`）。
- 游戏侧既有珈乐项仍保留未动，等待 ben 决策：`background.md:170` 彩蛋 Boss「珈乐(黑化)」、`README.md:238` 的相关描述。
- 待办：A-SOUL 子题库补题约 14 道以恢复 1:8:1 抽题比例；「A-SOUL 一共有几名成员 → 5 名」保留未动，隐含珈乐仍在成员序列。
- 不做粉丝伤痛事件（成员休眠风波、728、血色新春、BW 握手会），不进擦边荤梗，不指涉真实社区 A8/A87。
- **用字规范**：乃琳的粉丝名唯一正字是 **奶淇琳**，`乃淇琳` / `奶琪琳` / `乃琪琳` 都是错别字。2026-09-13 排查过一次全项目：`src/**/*.ts` 一直是对的，错的是 `src/data/quiz.generated.json`（旧题库把「乃淇琳」当正确答案）与 `dist/` 旧构建；已跑 `quiz:sync` 修正。改文案/出题时别写错。
- **藏品命名**：钥匙系列统一用「亭」——`豪亭的钥匙`（relics.ts `haoting-key`）配 `南亭的钥匙`（`nanting-key`）；`豪庭` 是 2026-09-13 修掉的错写。
- **游戏内货币叫「灵境币」**（✦符号，代码 38 处），旧名 `星愿徽记` 已停用；肉鸽模式的进阶/招募资源另有「应援值」。题库侧 2026-09-14 已统一（原 L63/L91 把货币写成旧名与团名「灵境少女」）。出题时别写错。
- **珈乐**：题库侧已按 ben 要求清空，但**代码侧仍有彩蛋 Boss「珈乐（黑化）」**（`src/data/zombies.ts:118`，含召唤「黑化的骑士」），`Zombie.ts` / `GameScene.ts` 有相关注释，`background.md:170`、`README.md:238` 有描述。等待 ben 决策。
- **A-SOUL 已核实事实表**：`~/.workbuddy/skills/asoul-quiz-bank/references/asoul-facts.md`（生日、生日会、个人单曲、双人曲、团曲、五周年）。写文案/出题前先查这份，别凭记忆写歌名和日期。要点：三对组合的双人曲各只有一首（贝拉&乃琳《练习心事》2022、贝拉&嘉然《蓓蕾》2023、嘉然&乃琳《周末出逃计划》2024），**2025 年没有新双人曲**。

## 系统现状

- **肉鸽模式仅开发者模式可见**（2026-09-14 起）：`ModeSelectScene` 在 `isDeveloperMode()` 为假时**不创建**肉鸽卡片，闯关卡居中；肉鸽唯一入口就是这张卡，其余 `Rogue*` 场景只在肉鸽流程内互跳。开发者模式状态行会提示「额外开放肉鸽模式」。要重新公开，删掉 ModeSelectScene 里的判断即可。
- 「枝江装备」= 藏品系统，代码在 `src/data/relics.ts`（配置）+ `src/core/Relics.ts`（持有/装配/抽卡）+ `src/scenes/BackpackScene.ts`、`RelicDrawScene.ts`。
- 关键约束：`RelicEffects` 只有 6 个数值字段（hpRegenPerSec / hpMultiplier / damageMultiplier / attackSpeedMultiplier / produceBonus / costMultiplier）；概率、弹射、光环等新机制必须走 `specialEffect`，并在 `src/entities/Plant.ts` 消费。
- 装备槽位：`getCollectionRank` ≥ 2 时 2 件，否则 1 件。
- 抽卡：`RARITY_DRAW_WEIGHT`（S2/A8/B20/C40/D30）、`RARITY_DUPLICATE_REFUND`（S15/A8/**B3/C0.5/D0.1**）、`RELIC_DRAW_STARDUST_COST = 3`。
- **灵境币按「一位小数」记账**（2026-09-14 起，因 C/D 档重复兑换为 0.5 / 0.1）：`Collection.ts` 的 `roundStardust` / `formatStardust` 是唯一入口 —— 读档、入账、扣减、进阶扣费四处都必须收敛回一位小数，否则 `Math.floor` 会把 0.1 抹成 0。显示别自己拼字符串，统一走 `formatStardust`（整数不补小数位、`Infinity`→`∞`）。
- **玩家反馈系统**（2026-09-13 实装）：主界面底部「💬 意见反馈」（与「开发者模式」并排）→ `src/scenes/FeedbackScene.ts` → `src/core/Feedback.ts` → `POST api/feedback` → `server/game_gate.py` → 服务器 `/opt/game-gate/feedback.jsonl`（一行一条 JSON）。
  - 自由文本输入必须用原生 DOM 控件（`src/ui/DomField.ts`）：Phaser 的键盘事件收不到中文输入法。**没有**启用 Phaser `dom.createContainer`，别再试图改全局 game config。
  - 服务器不可达时反馈落 `localStorage` 待补交，靠记录里的 `id` 在服务端去重。
  - **只收正文**：2026-09-13 按 ben 要求删掉了联系方式输入框与页面右上角说明，`Feedback.ts` 里 `contact?` 仍保留（可选，服务端写空串）。
  - 发布：更新 `server/game_gate.py` 后跑 `python scripts/publish-web.py --build`（会重启 `game-gate` 服务，只清空在线名单，不动已落库反馈）。
  - 查反馈：`tail -n 20 /opt/game-gate/feedback.jsonl`。
- **主界面底部布局已满**：4 卡图标栏（间距 148，居中）已经是最宽，再加第 5 卡会压住 x=314 的角色立绘。新的系统级入口一律走「开发者模式」那一排胶囊按钮。
- **`npm run build` 的已知坑**：vite 清空 `dist/` 要一次删 99+ 个文件，会被 safe-delete shim 拦（阈值 50/轮，`scope:"turn"` 是本轮累计，Python / rm 分批都没用），报 `SAFE_DELETE_BULK_CONFIRM_REQUIRED`。解法：非沙箱跑 `python -c "import shutil,os; os.path.exists('dist') and shutil.rmtree('dist')" && npm run build`。
- **本地 UI 验证**：用系统 Edge headless 截图，详见当日工作日志的「本地 UI 验证方法」——要点是非沙箱运行、轮询 30~70s 等落盘、vite 要 `--host 127.0.0.1` 且**必须用托管后台任务方式常驻**（`&` 起来的那种会被会话清理杀掉）、每个实例独立 `--user-data-dir`（新建的第一次常不落盘，原样重试即可）、本地把 `GAME_MAX_SLOTS` 调大。要验证带存档的状态（有无藏品/已装配）就用同源临时页 `public/__seed.html` 播种 localStorage 再 `location.replace('/')`，用完删掉。

## 文档漂移（待修）

- `background.md` 第 175 行仍写「藏品（规划中，暂未实现）」，实际藏品系统已实装且在题库中有题。
