import { resetCodexProgress } from './CodexProgress';
import { resetTechTree } from './Coins';
import { resetCollection } from './Collection';
import { resetLevelProgress } from './LevelProgress';
import { resetRelicInventory } from './Relics';
import { abandonRogueRun } from './RogueRun';

/**
 * 清空所有游戏进度，回到初始状态：关卡进度、科技树、角色收藏（灵境币/进阶）、
 * 枝江装备（持有/装配/答题券）、图鉴遭遇记录与肉鸽残局。
 * 不触碰意见反馈的待提交队列——那是玩家亲手写下的内容，不属于游戏进度。
 */
export function clearAllProgress(): void {
  resetLevelProgress();
  resetTechTree();
  resetCollection();
  resetRelicInventory();
  resetCodexProgress();
  abandonRogueRun();
}
