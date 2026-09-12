# 项目长期记忆 · asoulVsA87（枝江舞台保卫战）

## 内容红线

- **珈乐相关元素一律排除**（2026-09-12 ben 明确要求）：新设计、新文案、新道具都不得采用珈乐的名场面、口头禅、歌曲、组合名、专属物件。
- 既有内容中的珈乐项（`background.md` 的「黑化的骑士」「珈乐(黑化)」彩蛋 Boss、`docs/quiz-bank.md` 的「皇珈骑士」题）保留未动，等待 ben 决策。
- 不做粉丝伤痛事件（成员休眠风波、728、血色新春、BW 握手会），不进擦边荤梗，不指涉真实社区 A8/A87。

## 系统现状

- 「枝江装备」= 藏品系统，代码在 `src/data/relics.ts`（配置）+ `src/core/Relics.ts`（持有/装配/抽卡）+ `src/scenes/BackpackScene.ts`、`RelicDrawScene.ts`。
- 关键约束：`RelicEffects` 只有 6 个数值字段（hpRegenPerSec / hpMultiplier / damageMultiplier / attackSpeedMultiplier / produceBonus / costMultiplier）；概率、弹射、光环等新机制必须走 `specialEffect`，并在 `src/entities/Plant.ts` 消费。
- 装备槽位：`getCollectionRank` ≥ 2 时 2 件，否则 1 件。
- 抽卡：`RARITY_DRAW_WEIGHT`（S2/A8/B20/C40/D30）、`RARITY_DUPLICATE_REFUND`（S15/A8/B4/C2/D1）、`RELIC_DRAW_STARDUST_COST = 3`。

## 文档漂移（待修）

- `background.md` 第 175 行仍写「藏品（规划中，暂未实现）」，实际藏品系统已实装且在题库中有题。
