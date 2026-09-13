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

## 文档漂移（待修）

- `background.md` 第 175 行仍写「藏品（规划中，暂未实现）」，实际藏品系统已实装且在题库中有题。
