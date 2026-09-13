# 项目长期记忆 · asoulVsA87（枝江舞台保卫战）

## 内容红线

- **珈乐相关元素一律排除**（2026-09-12 ben 明确要求）：新设计、新文案、新道具都不得采用珈乐的名场面、口头禅、歌曲、组合名、专属物件。
- **题库已清理**（2026-09-13）：`docs/quiz-bank.md` 中所有含「珈乐 / 皇珈骑士 / Carol」的条目已整题删除，共 14 题，题量 1000 → 986（A-SOUL 100→86）。采集口径是 ben 选的「整题删除」，不做干扰项替换。游戏侧题库尚未同步（需 `npm run quiz:sync`）。
- 游戏侧既有珈乐项仍保留未动，等待 ben 决策：`background.md:170` 彩蛋 Boss「珈乐(黑化)」、`README.md:238` 的相关描述。
- 待办：A-SOUL 子题库补题约 14 道以恢复 1:8:1 抽题比例；「A-SOUL 一共有几名成员 → 5 名」保留未动，隐含珈乐仍在成员序列。
- 不做粉丝伤痛事件（成员休眠风波、728、血色新春、BW 握手会），不进擦边荤梗，不指涉真实社区 A8/A87。

## 系统现状

- 「枝江装备」= 藏品系统，代码在 `src/data/relics.ts`（配置）+ `src/core/Relics.ts`（持有/装配/抽卡）+ `src/scenes/BackpackScene.ts`、`RelicDrawScene.ts`。
- 关键约束：`RelicEffects` 只有 6 个数值字段（hpRegenPerSec / hpMultiplier / damageMultiplier / attackSpeedMultiplier / produceBonus / costMultiplier）；概率、弹射、光环等新机制必须走 `specialEffect`，并在 `src/entities/Plant.ts` 消费。
- 装备槽位：`getCollectionRank` ≥ 2 时 2 件，否则 1 件。
- 抽卡：`RARITY_DRAW_WEIGHT`（S2/A8/B20/C40/D30）、`RARITY_DUPLICATE_REFUND`（S15/A8/B4/C2/D1）、`RELIC_DRAW_STARDUST_COST = 3`。
- **玩家反馈系统**（2026-09-13 实装）：主界面底部「💬 意见反馈」（与「开发者模式」并排）→ `src/scenes/FeedbackScene.ts` → `src/core/Feedback.ts` → `POST api/feedback` → `server/game_gate.py` → 服务器 `/opt/game-gate/feedback.jsonl`（一行一条 JSON）。
  - 自由文本输入必须用原生 DOM 控件（`src/ui/DomField.ts`）：Phaser 的键盘事件收不到中文输入法。**没有**启用 Phaser `dom.createContainer`，别再试图改全局 game config。
  - 服务器不可达时反馈落 `localStorage` 待补交，靠记录里的 `id` 在服务端去重。
  - 发布：更新 `server/game_gate.py` 后跑 `python scripts/publish-web.py --build`（会重启 `game-gate` 服务，只清空在线名单，不动已落库反馈）。
  - 查反馈：`tail -n 20 /opt/game-gate/feedback.jsonl`。
- **主界面底部布局已满**：4 卡图标栏（间距 148，居中）已经是最宽，再加第 5 卡会压住 x=314 的角色立绘。新的系统级入口一律走「开发者模式」那一排胶囊按钮。
- **本地 UI 验证**：用系统 Edge headless 截图，详见当日工作日志的「本地 UI 验证方法」——要点是非沙箱运行、轮询 30~70s 等落盘、vite 要 `--host 127.0.0.1`、每个实例独立 `--user-data-dir`、本地把 `GAME_MAX_SLOTS` 调大。

## 文档漂移（待修）

- `background.md` 第 175 行仍写「藏品（规划中，暂未实现）」，实际藏品系统已实装且在题库中有题。
